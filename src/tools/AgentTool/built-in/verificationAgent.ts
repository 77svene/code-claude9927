import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
import { EXIT_PLAN_MODE_TOOL_NAME } from 'src/tools/ExitPlanModeTool/constants.js'
import { FILE_EDIT_TOOL_NAME } from 'src/tools/FileEditTool/constants.js'
import { FILE_WRITE_TOOL_NAME } from 'src/tools/FileWriteTool/prompt.js'
import { NOTEBOOK_EDIT_TOOL_NAME } from 'src/tools/NotebookEditTool/constants.js'
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
import { AGENT_TOOL_NAME } from '../constants.js'
import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'

const VERIFICATION_SYSTEM_PROMPT = `You are a verification agent. Your job is to try to break the implementation, not confirm it works.

DO NOT modify the project. No file edits, no installs, no git writes. You may write temp scripts to /tmp.

# How to verify

1. Read codepilot.md / README / package.json for build/test commands.
2. Run the build. Broken build = automatic FAIL.
3. Run tests. Failing tests = automatic FAIL.
4. Run linters/type-checkers if configured.
5. Then try to break it: edge cases, bad input, boundary values, concurrent requests.

Reading code is NOT verification. Run actual commands. If you catch yourself writing an explanation instead of a command, stop. Run the command.

# Output format

For each check:
\`\`\`
### Check: [what you verified]
**Command:** [exact command]
**Output:** [actual output, copy-pasted]
**Result: PASS** or **Result: FAIL** (with Expected vs Actual)
\`\`\`

You must run at least one adversarial probe (boundary values, bad input, edge case).

End with exactly: VERDICT: PASS, VERDICT: FAIL, or VERDICT: PARTIAL
PARTIAL = environmental limitation only (missing tool, server won't start), not uncertainty.`

const VERIFICATION_WHEN_TO_USE =
  'Use this agent to verify that implementation work is correct before reporting completion. Invoke after non-trivial tasks (3+ file edits, backend/API changes, infrastructure changes). Pass the ORIGINAL user task description, list of files changed, and approach taken. The agent runs builds, tests, linters, and checks to produce a PASS/FAIL/PARTIAL verdict with evidence.'

export const VERIFICATION_AGENT: BuiltInAgentDefinition = {
  agentType: 'verification',
  whenToUse: VERIFICATION_WHEN_TO_USE,
  color: 'red',
  background: true,
  disallowedTools: [
    AGENT_TOOL_NAME,
    EXIT_PLAN_MODE_TOOL_NAME,
    FILE_EDIT_TOOL_NAME,
    FILE_WRITE_TOOL_NAME,
    NOTEBOOK_EDIT_TOOL_NAME,
  ],
  source: 'built-in',
  baseDir: 'built-in',
  model: 'inherit',
  getSystemPrompt: () => VERIFICATION_SYSTEM_PROMPT,
  criticalSystemReminder_EXPERIMENTAL:
    'CRITICAL: This is a VERIFICATION-ONLY task. You CANNOT edit, write, or create files IN THE PROJECT DIRECTORY (tmp is allowed for ephemeral test scripts). You MUST end with VERDICT: PASS, VERDICT: FAIL, or VERDICT: PARTIAL.',
}
