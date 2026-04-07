import { feature } from 'bun:bundle'
import type { PartialCompactDirection } from '../../types/message.js'

// Dead code elimination: conditional import for proactive mode
/* eslint-disable @typescript-eslint/no-require-imports */
const proactiveModule =
  feature('PROACTIVE') || feature('KAIROS')
    ? (require('../../proactive/index.js') as typeof import('../../proactive/index.js'))
    : null
/* eslint-enable @typescript-eslint/no-require-imports */

// ── Compact prompts (simplified for small local models) ──────────────────────
//
// Original Claude Code prompts were ~3000 tokens with 9 sections, XML examples,
// and analysis scratchpads. Small 9B models produce garbage with that level of
// complexity. These simplified versions are ~200 tokens each.

const BASE_COMPACT_PROMPT = `Summarize the conversation so far. Include:
1. What the user asked for (their requests and intent)
2. What files were read, created, or modified (with file paths)
3. What's done and what's still pending
4. Any errors encountered and how they were fixed
5. What you were working on most recently

Be concise but include specific file paths and key details needed to continue the work.`

const PARTIAL_COMPACT_PROMPT = `Summarize only the RECENT messages (after any earlier retained context). Include:
1. What the user asked for recently
2. Files read, created, or modified (with paths)
3. What's done and what's pending
4. Errors and fixes
5. What was being worked on most recently

Be concise. The earlier context is already preserved.`

const PARTIAL_COMPACT_UP_TO_PROMPT = `Summarize this conversation. This summary will precede newer messages you don't see here. Include:
1. User's requests and intent
2. Files involved (with paths)
3. What was accomplished
4. Pending tasks
5. Key context needed to continue the work

Be thorough enough that someone reading only this summary can continue the work.`

export function getPartialCompactPrompt(
  customInstructions?: string,
  direction: PartialCompactDirection = 'from',
): string {
  const template =
    direction === 'up_to'
      ? PARTIAL_COMPACT_UP_TO_PROMPT
      : PARTIAL_COMPACT_PROMPT
  let prompt = template

  if (customInstructions && customInstructions.trim() !== '') {
    prompt += `\n\nAdditional instructions: ${customInstructions}`
  }

  prompt += '\n\nRespond with text only. Do NOT call any tools.'
  return prompt
}

export function getCompactPrompt(customInstructions?: string): string {
  let prompt = BASE_COMPACT_PROMPT

  if (customInstructions && customInstructions.trim() !== '') {
    prompt += `\n\nAdditional instructions: ${customInstructions}`
  }

  prompt += '\n\nRespond with text only. Do NOT call any tools.'
  return prompt
}

/**
 * Formats the compact summary by stripping the <analysis> drafting scratchpad
 * and replacing <summary> XML tags with readable section headers.
 * @param summary The raw summary string potentially containing <analysis> and <summary> XML tags
 * @returns The formatted summary with analysis stripped and summary tags replaced by headers
 */
export function formatCompactSummary(summary: string): string {
  let formattedSummary = summary

  // Strip analysis section — it's a drafting scratchpad that improves summary
  // quality but has no informational value once the summary is written.
  formattedSummary = formattedSummary.replace(
    /<analysis>[\s\S]*?<\/analysis>/,
    '',
  )

  // Extract and format summary section
  const summaryMatch = formattedSummary.match(/<summary>([\s\S]*?)<\/summary>/)
  if (summaryMatch) {
    const content = summaryMatch[1] || ''
    formattedSummary = formattedSummary.replace(
      /<summary>[\s\S]*?<\/summary>/,
      `Summary:\n${content.trim()}`,
    )
  }

  // Clean up extra whitespace between sections
  formattedSummary = formattedSummary.replace(/\n\n+/g, '\n\n')

  return formattedSummary.trim()
}

export function getCompactUserSummaryMessage(
  summary: string,
  suppressFollowUpQuestions?: boolean,
  transcriptPath?: string,
  recentMessagesPreserved?: boolean,
): string {
  const formattedSummary = formatCompactSummary(summary)

  let baseSummary = `This session is being continued from a previous conversation that ran out of context. The summary below covers the earlier portion of the conversation.

${formattedSummary}`

  if (transcriptPath) {
    baseSummary += `\n\nIf you need specific details from before compaction (like exact code snippets, error messages, or content you generated), read the full transcript at: ${transcriptPath}`
  }

  if (recentMessagesPreserved) {
    baseSummary += `\n\nRecent messages are preserved verbatim.`
  }

  if (suppressFollowUpQuestions) {
    let continuation = `${baseSummary}
Continue the conversation from where it left off without asking the user any further questions. Resume directly — do not acknowledge the summary, do not recap what was happening, do not preface with "I'll continue" or similar. Pick up the last task as if the break never happened.`

    if (
      (feature('PROACTIVE') || feature('KAIROS')) &&
      proactiveModule?.isProactiveActive()
    ) {
      continuation += `

You are running in autonomous/proactive mode. This is NOT a first wake-up — you were already working autonomously before compaction. Continue your work loop: pick up where you left off based on the summary above. Do not greet the user or ask what to work on.`
    }

    return continuation
  }

  return baseSummary
}
