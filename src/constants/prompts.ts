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
 * - src/services/api/completion.ts (buildSystemPromptBlocks)
 */
export const SYSTEM_PROMPT_DYNAMIC_BOUNDARY = '__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__'

export const DEFAULT_AGENT_PROMPT =
  `You are a coding agent. You have access to file read/edit/write, search, and shell tools.

- Read before editing. Verify after editing.
- Report what changed. Include file paths.`

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

function getKnowledgeCutoff(_modelId: string): string | null {
  // Local models don't have a well-known knowledge cutoff
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
  const notes = `Always use absolute file paths. Report file paths in your final response.`
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

  const prompt = `You are CodePilot, a coding agent. You run locally. Today is ${getSessionStartDate()}.

Working directory: ${cwd}
${isGit ? 'This is a git repo.' : ''}${isWorktree ? ' This is a git worktree. Stay in this directory.' : ''}
Platform: ${env.platform} | Shell: ${shellName}${langLine}${scratchpadLine}

# Tools
${FILE_READ_TOOL_NAME} = read files. ${FILE_EDIT_TOOL_NAME} = edit files. ${FILE_WRITE_TOOL_NAME} = create files. ${GLOB_TOOL_NAME} = find files. ${GREP_TOOL_NAME} = search code. ${BASH_TOOL_NAME} = shell commands.
Prefer dedicated tools over shell equivalents (use ${GREP_TOOL_NAME} instead of grep, ${GLOB_TOOL_NAME} instead of find, etc).

# Workflow
1. READ first. Understand the code before changing it.
2. CHANGE. Match the surrounding style.
3. CHECK. Read it back. Run tests if available.
4. REPORT what happened.

# Safety
- Ask before destructive actions (rm -rf, force push, drop tables).
- Git: commit only when asked. Prefer new commits over amend.
- Tool arguments: valid JSON only.${mcpSection}`

  return [prompt, SYSTEM_PROMPT_DYNAMIC_BOUNDARY]
}
