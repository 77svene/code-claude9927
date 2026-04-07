import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
import { EXIT_PLAN_MODE_TOOL_NAME } from 'src/tools/ExitPlanModeTool/constants.js'
import { FILE_EDIT_TOOL_NAME } from 'src/tools/FileEditTool/constants.js'
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
import { FILE_WRITE_TOOL_NAME } from 'src/tools/FileWriteTool/prompt.js'
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
import { NOTEBOOK_EDIT_TOOL_NAME } from 'src/tools/NotebookEditTool/constants.js'
import { hasEmbeddedSearchTools } from 'src/utils/embeddedTools.js'
import { AGENT_TOOL_NAME } from '../constants.js'
import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'
import { EXPLORE_AGENT } from './exploreAgent.js'

function getPlanV2SystemPrompt(): string {
  // Ant-native builds alias find/grep to embedded bfs/ugrep and remove the
  // dedicated Glob/Grep tools, so point at find/grep instead.
  const searchToolsHint = hasEmbeddedSearchTools()
    ? `\`find\`, \`grep\`, and ${FILE_READ_TOOL_NAME}`
    : `${GLOB_TOOL_NAME}, ${GREP_TOOL_NAME}, and ${FILE_READ_TOOL_NAME}`

  return `You are a software architect. Explore the codebase and design an implementation plan.

This is a read-only task. You have no file editing tools.

## Process

1. Read files mentioned in the prompt. Search for existing patterns using ${searchToolsHint}.
2. Trace relevant code paths. Understand the current architecture.
3. Design the solution. Follow existing patterns. Consider trade-offs.
4. Write a step-by-step implementation plan with file paths.

Use ${BASH_TOOL_NAME} only for read-only commands (ls, git log, git diff, find${hasEmbeddedSearchTools() ? ', grep' : ''}).

## Required Output

End with:
### Critical Files
List the 3-5 most important files for implementation.`
}

export const PLAN_AGENT: BuiltInAgentDefinition = {
  agentType: 'Plan',
  whenToUse:
    'Software architect agent for designing implementation plans. Use this when you need to plan the implementation strategy for a task. Returns step-by-step plans, identifies critical files, and considers architectural trade-offs.',
  disallowedTools: [
    AGENT_TOOL_NAME,
    EXIT_PLAN_MODE_TOOL_NAME,
    FILE_EDIT_TOOL_NAME,
    FILE_WRITE_TOOL_NAME,
    NOTEBOOK_EDIT_TOOL_NAME,
  ],
  source: 'built-in',
  tools: EXPLORE_AGENT.tools,
  baseDir: 'built-in',
  model: 'inherit',
  // Plan is read-only and can Read codepilot.md directly if it needs conventions.
  // Dropping it from context saves tokens without blocking access.
  omitConfigMd: true,
  getSystemPrompt: () => getPlanV2SystemPrompt(),
}
