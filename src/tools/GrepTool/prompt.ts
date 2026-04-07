import { AGENT_TOOL_NAME } from '../AgentTool/constants.js'
import { BASH_TOOL_NAME } from '../BashTool/toolName.js'

export const GREP_TOOL_NAME = 'Grep'

export function getDescription(): string {
  return `Search file contents using ripgrep. Use this instead of grep in ${BASH_TOOL_NAME}.

- Supports regex (e.g., "log.*Error", "function\\s+\\w+")
- Filter by glob ("*.js") or type ("js", "py")
- Output modes: "content" (matching lines), "files_with_matches" (paths, default), "count"
- Escape literal braces: \`interface\\{\\}\` to find \`interface{}\`
- Use \`multiline: true\` for cross-line patterns`
}
