export const codepilot_CODE_20250219_BETA_HEADER = ''
export const INTERLEAVED_THINKING_BETA_HEADER = ''
export const CONTEXT_1M_BETA_HEADER = ''
export const CONTEXT_MANAGEMENT_BETA_HEADER = ''
export const STRUCTURED_OUTPUTS_BETA_HEADER = ''
export const WEB_SEARCH_BETA_HEADER = ''
export const TOOL_SEARCH_BETA_HEADER_1P = ''
export const TOOL_SEARCH_BETA_HEADER_3P = ''
export const EFFORT_BETA_HEADER = ''
export const TASK_BUDGETS_BETA_HEADER = ''
export const PROMPT_CACHING_SCOPE_BETA_HEADER = ''
export const FAST_MODE_BETA_HEADER = ''
export const REDACT_THINKING_BETA_HEADER = ''
export const TOKEN_EFFICIENT_TOOLS_BETA_HEADER = ''
export const SUMMARIZE_CONNECTOR_TEXT_BETA_HEADER = ''
export const AFK_MODE_BETA_HEADER = ''
export const CLI_INTERNAL_BETA_HEADER = ''
export const ADVISOR_BETA_HEADER = ''

/**
 * Bedrock only supports a limited number of beta headers and only through
 * extraBodyParams. This set maintains the beta strings that should be in
 * Bedrock extraBodyParams *and not* in Bedrock headers.
 */
export const BEDROCK_EXTRA_PARAMS_HEADERS = new Set<string>([])

/**
 * Betas allowed on Vertex countTokens API.
 * Other betas will cause 400 errors.
 */
export const VERTEX_COUNT_TOKENS_ALLOWED_BETAS = new Set<string>([])
