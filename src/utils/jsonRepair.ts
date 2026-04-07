/**
 * Attempts to repair common JSON malformations produced by small language models.
 * Applied before JSON.parse() on tool call arguments to improve reliability.
 *
 * Common issues with 9B models:
 * - Trailing commas: {"a":1,}
 * - Missing closing braces: {"a":1
 * - Single quotes: {'a': 1}
 * - Unquoted keys: {a: 1}
 * - Extra closing braces: {"a":1}}}
 */
export function tryRepairJSON(raw: string): string {
  let s = raw.trim()

  // Strip markdown code fences that small models sometimes wrap JSON in
  if (s.startsWith('```json')) s = s.slice(7)
  else if (s.startsWith('```')) s = s.slice(3)
  if (s.endsWith('```')) s = s.slice(0, -3)
  s = s.trim()

  // Replace single quotes with double quotes (but not inside strings)
  // Simple heuristic: only if the string doesn't contain any double quotes
  if (!s.includes('"') && s.includes("'")) {
    s = s.replace(/'/g, '"')
  }

  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1')

  // Try to fix unquoted keys: {key: "value"} → {"key": "value"}
  s = s.replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":')

  // Balance braces — add missing closing braces
  let openBraces = 0
  let openBrackets = 0
  for (const ch of s) {
    if (ch === '{') openBraces++
    else if (ch === '}') openBraces--
    else if (ch === '[') openBrackets++
    else if (ch === ']') openBrackets--
  }

  // Remove excess closing braces/brackets
  while (openBraces < 0) {
    const lastBrace = s.lastIndexOf('}')
    if (lastBrace === -1) break
    s = s.slice(0, lastBrace) + s.slice(lastBrace + 1)
    openBraces++
  }
  while (openBrackets < 0) {
    const lastBracket = s.lastIndexOf(']')
    if (lastBracket === -1) break
    s = s.slice(0, lastBracket) + s.slice(lastBracket + 1)
    openBrackets++
  }

  // Add missing closing braces/brackets
  while (openBraces > 0) {
    s += '}'
    openBraces--
  }
  while (openBrackets > 0) {
    s += ']'
    openBrackets--
  }

  return s
}

/**
 * Tries to parse JSON, with repair attempt on failure.
 * Returns the parsed object or null if even repair fails.
 */
export function parseJSONWithRepair(raw: string): unknown | null {
  // First try direct parse
  try {
    return JSON.parse(raw)
  } catch {
    // Try repaired version
    try {
      return JSON.parse(tryRepairJSON(raw))
    } catch {
      return null
    }
  }
}
