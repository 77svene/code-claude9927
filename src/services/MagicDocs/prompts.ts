import { join } from 'path'
import { getCodePilotConfigHomeDir } from '../../utils/envUtils.js'
import { getFsImplementation } from '../../utils/fsOperations.js'

/**
 * Get the Magic Docs update prompt template
 */
function getUpdatePromptTemplate(): string {
  return `Update the Magic Doc based on the conversation above.

Current doc at {{docPath}}:
<current_doc_content>
{{docContents}}
</current_doc_content>

Title: {{docTitle}}
{{customInstructions}}

Use Edit tool to update if there's substantial new info. Make edits in parallel, then stop. If nothing to add, say so without calling tools.

Rules:
- Preserve the header: # MAGIC DOC: {{docTitle}}
- Update in-place — no changelogs or "Previously..." notes. Remove outdated info.
- BE TERSE. Focus on: architecture, non-obvious patterns, entry points, design decisions.
- Skip: anything obvious from the code, exhaustive lists, step-by-step details.

Use the Edit tool with file_path: {{docPath}}`
}

/**
 * Load custom Magic Docs prompt from file if it exists
 * Custom prompts can be placed at ~/.codepilot/magic-docs/prompt.md
 * Use {{variableName}} syntax for variable substitution (e.g., {{docContents}}, {{docPath}}, {{docTitle}})
 */
async function loadMagicDocsPrompt(): Promise<string> {
  const fs = getFsImplementation()
  const promptPath = join(getCodePilotConfigHomeDir(), 'magic-docs', 'prompt.md')

  try {
    return await fs.readFile(promptPath, { encoding: 'utf-8' })
  } catch {
    // Silently fall back to default if custom prompt doesn't exist or fails to load
    return getUpdatePromptTemplate()
  }
}

/**
 * Substitute variables in the prompt template using {{variable}} syntax
 */
function substituteVariables(
  template: string,
  variables: Record<string, string>,
): string {
  // Single-pass replacement avoids two bugs: (1) $ backreference corruption
  // (replacer fn treats $ literally), and (2) double-substitution when user
  // content happens to contain {{varName}} matching a later variable.
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(variables, key)
      ? variables[key]!
      : match,
  )
}

/**
 * Build the Magic Docs update prompt with variable substitution
 */
export async function buildMagicDocsUpdatePrompt(
  docContents: string,
  docPath: string,
  docTitle: string,
  instructions?: string,
): Promise<string> {
  const promptTemplate = await loadMagicDocsPrompt()

  // Build custom instructions section if provided
  const customInstructions = instructions
    ? `

DOCUMENT-SPECIFIC UPDATE INSTRUCTIONS:
The document author has provided specific instructions for how this file should be updated. Pay extra attention to these instructions and follow them carefully:

"${instructions}"

These instructions take priority over the general rules below. Make sure your updates align with these specific guidelines.`
    : ''

  // Substitute variables in the prompt
  const variables = {
    docContents,
    docPath,
    docTitle,
    customInstructions,
  }

  return substituteVariables(promptTemplate, variables)
}
