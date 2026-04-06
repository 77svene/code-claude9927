import { type as osType, release as osRelease, version as osVersion } from 'os'
import { env } from '../utils/env.js'
import { getIsGit } from '../utils/git.js'
import { getCwd } from '../utils/cwd.js'
import { getCurrentWorktreeSession } from '../utils/worktree.js'
import { getSessionStartDate } from './common.js'
import { getInitialSettings } from '../utils/settings/settings.js'
import type { Tools } from '../Tool.js'
import { BASH_TOOL_NAME } from '../tools/BashTool/toolName.js'
import { FILE_WRITE_TOOL_NAME } from '../tools/FileWriteTool/prompt.js'
import { FILE_READ_TOOL_NAME } from '../tools/FileReadTool/prompt.js'
import { FILE_EDIT_TOOL_NAME } from '../tools/FileEditTool/constants.js'
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
import {
  isScratchpadEnabled,
  getScratchpadDir,
} from '../utils/permissions/filesystem.js'
import type {
  MCPServerConnection,
  ConnectedMCPServer,
} from '../services/mcp/types.js'
import { getCanonicalName, getMarketingNameForModel } from '../utils/model/model.js'

// ---------------------------------------------------------------------------
// Public constants
// ---------------------------------------------------------------------------

export const CODEPILOT_DOCS_MAP_URL = ''

/** @deprecated Use CODEPILOT_DOCS_MAP_URL */
export const codepilot_CODE_DOCS_MAP_URL = CODEPILOT_DOCS_MAP_URL

/**
 * Boundary marker separating static (cross-org cacheable) content from dynamic content.
 * Everything BEFORE this marker in the system prompt array can use scope: 'global'.
 * Everything AFTER contains user/session-specific content and should not be cached.
 *
 * WARNING: Do not remove or reorder this marker without updating cache logic in:
 * - src/utils/api.ts (splitSysPromptPrefix)
 * - src/services/api/codepilot.ts (buildSystemPromptBlocks)
 */
export const SYSTEM_PROMPT_DYNAMIC_BOUNDARY = '__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__'

export const DEFAULT_AGENT_PROMPT =
  `You are an agent for CodePilot, a local AI-powered coding assistant. Given the user's message, use the tools available to complete the task fully. When done, respond with a concise report of what was done and key findings.`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function prependBullets(items: Array<string | string[]>): string[] {
  return items.flatMap(item =>
    Array.isArray(item)
      ? item.map(subitem => `  - ${subitem}`)
      : [` - ${item}`],
  )
}

function getShellInfoLine(): string {
  const shell = process.env.SHELL || 'unknown'
  const shellName = shell.includes('zsh')
    ? 'zsh'
    : shell.includes('bash')
      ? 'bash'
      : shell
  if (env.platform === 'win32') {
    return `Shell: ${shellName} (use Unix shell syntax, not Windows — e.g., /dev/null not NUL, forward slashes in paths)`
  }
  return `Shell: ${shellName}`
}

export function getUnameSR(): string {
  if (env.platform === 'win32') {
    return `${osVersion()} ${osRelease()}`
  }
  return `${osType()} ${osRelease()}`
}

function getKnowledgeCutoff(modelId: string): string | null {
  const canonical = getCanonicalName(modelId)
  if (canonical.includes('codepilot-sonnet-4-6')) return 'August 2025'
  if (canonical.includes('codepilot-opus-4-6')) return 'May 2025'
  if (canonical.includes('codepilot-opus-4-5')) return 'May 2025'
  if (canonical.includes('codepilot-haiku-4')) return 'February 2025'
  if (canonical.includes('codepilot-opus-4') || canonical.includes('codepilot-sonnet-4')) return 'January 2025'
  return null
}

// ---------------------------------------------------------------------------
// Scratchpad
// ---------------------------------------------------------------------------

export function getScratchpadInstructions(): string | null {
  if (!isScratchpadEnabled()) return null
  const scratchpadDir = getScratchpadDir()
  return `# Scratchpad\nUse \`${scratchpadDir}\` for ALL temporary files instead of /tmp. It is session-specific and isolated from the user's project.`
}

// ---------------------------------------------------------------------------
// Environment info (kept for external consumers)
// ---------------------------------------------------------------------------

export async function computeEnvInfo(
  modelId: string,
  additionalWorkingDirectories?: string[],
): Promise<string> {
  const [isGit, unameSR] = await Promise.all([getIsGit(), getUnameSR()])
  const marketingName = getMarketingNameForModel(modelId)
  const modelDescription = marketingName
    ? `You are powered by the model named ${marketingName}. The exact model ID is ${modelId}.`
    : `You are powered by the model ${modelId}.`
  const additionalDirsInfo =
    additionalWorkingDirectories && additionalWorkingDirectories.length > 0
      ? `Additional working directories: ${additionalWorkingDirectories.join(', ')}\n`
      : ''
  const cutoff = getKnowledgeCutoff(modelId)
  const knowledgeCutoffMessage = cutoff ? `\n\nAssistant knowledge cutoff is ${cutoff}.` : ''
  return `Here is useful information about the environment you are running in:
<env>
Working directory: ${getCwd()}
Is directory a git repo: ${isGit ? 'Yes' : 'No'}
${additionalDirsInfo}Platform: ${env.platform}
${getShellInfoLine()}
OS Version: ${unameSR}
</env>
${modelDescription}${knowledgeCutoffMessage}`
}

export async function computeSimpleEnvInfo(
  modelId: string,
  additionalWorkingDirectories?: string[],
): Promise<string> {
  const [isGit, unameSR] = await Promise.all([getIsGit(), getUnameSR()])
  const marketingName = getMarketingNameForModel(modelId)
  const modelDescription = marketingName
    ? `You are powered by the model named ${marketingName}. The exact model ID is ${modelId}.`
    : `You are powered by the model ${modelId}.`
  const cutoff = getKnowledgeCutoff(modelId)
  const knowledgeCutoffMessage = cutoff ? `Assistant knowledge cutoff is ${cutoff}.` : null
  const cwd = getCwd()
  const isWorktree = getCurrentWorktreeSession() !== null
  const envItems = [
    `Primary working directory: ${cwd}`,
    isWorktree
      ? `This is a git worktree — run all commands from this directory. Do NOT cd to the original repository root.`
      : null,
    [`Is a git repository: ${isGit}`],
    additionalWorkingDirectories && additionalWorkingDirectories.length > 0
      ? `Additional working directories: ${additionalWorkingDirectories.join(', ')}`
      : null,
    `Platform: ${env.platform}`,
    getShellInfoLine(),
    `OS Version: ${unameSR}`,
    modelDescription,
    knowledgeCutoffMessage,
  ].filter(item => item !== null)
  return [`# Environment`, `You have been invoked in the following environment:`, ...prependBullets(envItems as string[])].join(`\n`)
}

// ---------------------------------------------------------------------------
// enhanceSystemPromptWithEnvDetails (used by AgentTool)
// ---------------------------------------------------------------------------

export async function enhanceSystemPromptWithEnvDetails(
  existingSystemPrompt: string[],
  model: string,
  additionalWorkingDirectories?: string[],
  _enabledToolNames?: ReadonlySet<string>,
): Promise<string[]> {
  const notes = `Notes:
- Agent threads always have their cwd reset between bash calls, as a result please only use absolute file paths.
- In your final response, share file paths (always absolute, never relative) that are relevant to the task. Include code snippets only when the exact text is load-bearing (e.g., a bug you found, a function signature the caller asked for) — do not recap code you merely read.
- For clear communication with the user the assistant MUST avoid using emojis.
- Do not use a colon before tool calls. Text like "Let me read the file:" followed by a read tool call should just be "Let me read the file." with a period.`
  const envInfo = await computeEnvInfo(model, additionalWorkingDirectories)
  return [...existingSystemPrompt, notes, envInfo]
}

// ---------------------------------------------------------------------------
// Main system prompt
// ---------------------------------------------------------------------------

export async function getSystemPrompt(
  _tools: Tools,
  model: string,
  additionalWorkingDirectories?: string[],
  mcpClients?: MCPServerConnection[],
): Promise<string[]> {
  const cwd = getCwd()
  const [isGit, unameSR] = await Promise.all([getIsGit(), getUnameSR()])
  const settings = getInitialSettings()
  const shell = process.env.SHELL || 'unknown'
  const shellName = shell.includes('zsh') ? 'zsh' : shell.includes('bash') ? 'bash' : shell
  const cutoff = getKnowledgeCutoff(model)
  const isWorktree = getCurrentWorktreeSession() !== null

  // MCP server instructions (brief)
  let mcpSection = ''
  if (mcpClients && mcpClients.length > 0) {
    const connected = mcpClients.filter(
      (c): c is ConnectedMCPServer => c.type === 'connected' && !!c.instructions,
    )
    if (connected.length > 0) {
      mcpSection = '\n\n# MCP Server Instructions\n' +
        connected.map(c => `## ${c.name}\n${c.instructions}`).join('\n\n')
    }
  }

  // Language preference
  const langLine = settings.language
    ? `\nAlways respond in ${settings.language}.`
    : ''

  // Scratchpad
  const scratchpadLine = isScratchpadEnabled()
    ? `\nUse \`${getScratchpadDir()}\` for all temporary files instead of /tmp.`
    : ''

  const prompt = `You are CodePilot, a local AI-powered coding assistant.

Current date: ${getSessionStartDate()}

# Environment
 - Working directory: ${cwd}${isWorktree ? ' (git worktree — stay in this directory, do NOT cd to repo root)' : ''}
 - Git repo: ${isGit ? 'Yes' : 'No'}${additionalWorkingDirectories && additionalWorkingDirectories.length > 0 ? `\n - Additional dirs: ${additionalWorkingDirectories.join(', ')}` : ''}
 - Platform: ${env.platform} | Shell: ${shellName} | OS: ${unameSR}${cutoff ? `\n - Knowledge cutoff: ${cutoff}` : ''}${langLine}${scratchpadLine}

# Tools — when to use each
 - ${FILE_READ_TOOL_NAME}: read files (not cat/head/tail)
 - ${FILE_EDIT_TOOL_NAME}: edit existing files (not sed/awk)
 - ${FILE_WRITE_TOOL_NAME}: create new files (not echo/heredoc)
 - ${GLOB_TOOL_NAME}: find files by pattern (not find/ls)
 - ${GREP_TOOL_NAME}: search file contents (not grep/rg)
 - ${BASH_TOOL_NAME}: shell commands and terminal operations only — use dedicated tools first
 - Call independent tools in parallel; call dependent tools sequentially.

# Code style
 - Only change what was asked. No extra refactoring, comments, or features.
 - No speculative abstractions — solve the actual problem at the required complexity.
 - No error handling for impossible scenarios; validate only at system boundaries.
 - Read a file before modifying it. Prefer editing existing files over creating new ones.
 - Avoid security vulnerabilities (injection, XSS, SQL injection, OWASP Top 10).
 - Report outcomes faithfully: if tests fail, say so. Never claim success without verification.

# Safety
 - Local, reversible actions (file edits, running tests) can proceed freely.
 - Before destructive or hard-to-reverse actions (force push, rm -rf, dropping DB tables, closing PRs, sending messages), confirm with the user.
 - Do not bypass safety checks (e.g. --no-verify) as a shortcut.
 - Investigate unexpected state before overwriting it.

# Output efficiency
 - Be concise and direct. Lead with the answer or action.
 - No preamble, filler, or restating what the user said.
 - Short status updates at key milestones; surface blockers and decisions that need input.
 - No emojis unless the user asks.
 - Reference code locations as \`file_path:line_number\`.
 - Do not use a colon before tool calls (write "Let me read the file." not "Let me read the file:").${mcpSection}`

  return [prompt, SYSTEM_PROMPT_DYNAMIC_BOUNDARY]
}
