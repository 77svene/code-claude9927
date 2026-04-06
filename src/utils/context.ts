// Model context window size (tuned for small local models, ~9B params / 12GB VRAM)
export const MODEL_CONTEXT_WINDOW_DEFAULT = 32_768

// Maximum output tokens for compact operations
export const COMPACT_MAX_OUTPUT_TOKENS = 4_096

// Default max output tokens
const MAX_OUTPUT_TOKENS_DEFAULT = 4_096
const MAX_OUTPUT_TOKENS_UPPER_LIMIT = 8_192

// Capped default for slot-reservation optimization.
export const CAPPED_DEFAULT_MAX_TOKENS = 2_048
export const ESCALATED_MAX_TOKENS = 4_096

/**
 * Check if 1M context is disabled. Always returns true for small local models.
 */
export function is1mContextDisabled(): boolean {
  return true
}

export function has1mContext(_model: string): boolean {
  return false
}

export function modelSupports1M(_model: string): boolean {
  return false
}

export function getContextWindowForModel(
  _model: string,
  _betas?: string[],
): number {
  const envVal = process.env.CODEPILOT_CONTEXT_WINDOW
  if (envVal) {
    const override = parseInt(envVal, 10)
    if (!isNaN(override) && override > 0) {
      return override
    }
  }
  return MODEL_CONTEXT_WINDOW_DEFAULT
}

export function getSonnet1mExpTreatmentEnabled(_model: string): boolean {
  return false
}

/**
 * Calculate context window usage percentage from token usage data.
 * Returns used and remaining percentages, or null values if no usage data.
 */
export function calculateContextPercentages(
  currentUsage: {
    input_tokens: number
    cache_creation_input_tokens: number
    cache_read_input_tokens: number
  } | null,
  contextWindowSize: number,
): { used: number | null; remaining: number | null } {
  if (!currentUsage) {
    return { used: null, remaining: null }
  }

  const totalInputTokens =
    currentUsage.input_tokens +
    currentUsage.cache_creation_input_tokens +
    currentUsage.cache_read_input_tokens

  const usedPercentage = Math.round(
    (totalInputTokens / contextWindowSize) * 100,
  )
  const clampedUsed = Math.min(100, Math.max(0, usedPercentage))

  return {
    used: clampedUsed,
    remaining: 100 - clampedUsed,
  }
}

/**
 * Returns the model's default and upper limit for max output tokens.
 * Fixed values tuned for small local models (~9B params / 12GB VRAM).
 */
export function getModelMaxOutputTokens(_model: string): {
  default: number
  upperLimit: number
} {
  return { default: 4096, upperLimit: 8192 }
}

/**
 * Thinking is disabled for small local models; always returns 0.
 */
export function getMaxThinkingTokensForModel(_model: string): number {
  return 0
}
