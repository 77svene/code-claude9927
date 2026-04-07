/**
 * Local type definitions replacing @codepilot-ai/sdk types.
 *
 * These mirror the shapes used throughout the codebase so we no longer
 * depend on the CodePilot SDK as a build dependency.
 */

// ── Image types ──────────────────────────────────────────────────────────────

export type Base64ImageSource = {
  type: 'base64'
  media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  data: string
}

export type UrlImageSource = {
  type: 'url'
  url: string
}

// ── Content Block Params (input/request side) ────────────────────────────────

export type TextBlockParam = {
  type: 'text'
  text: string
  [key: string]: unknown
}

export type ImageBlockParam = {
  type: 'image'
  source: Base64ImageSource | UrlImageSource
  [key: string]: unknown
}

export type ToolUseBlockParam = {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
  [key: string]: unknown
}

export type ToolResultBlockParam = {
  type: 'tool_result'
  tool_use_id: string
  content?: string | ContentBlockParam[]
  is_error?: boolean
  [key: string]: unknown
}

export type ThinkingBlockParam = {
  type: 'thinking'
  thinking: string
  [key: string]: unknown
}

export type ContentBlockParam =
  | TextBlockParam
  | ImageBlockParam
  | ToolUseBlockParam
  | ToolResultBlockParam
  | ThinkingBlockParam
  | { type: string; [key: string]: unknown }

// ── Content Blocks (output/response side) ────────────────────────────────────

export type TextBlock = {
  type: 'text'
  text: string
}

export type ToolUseBlock = {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export type ThinkingBlock = {
  type: 'thinking'
  thinking: string
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock | { type: string; [key: string]: unknown }

// ── Beta aliases (many files import the "Beta" prefixed versions) ────────────

export type BetaContentBlock = ContentBlock
export type BetaToolUseBlock = ToolUseBlock
export type BetaToolUnion = BetaTool
export type BetaMessageParam = MessageParam

// ── Tool definition ──────────────────────────────────────────────────────────

export type BetaTool = {
  name: string
  description?: string
  input_schema: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

// ── Usage ────────────────────────────────────────────────────────────────────

export type BetaUsage = {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
  [key: string]: unknown
}

/** Alias used in some files: `import { BetaUsage as Usage }` */
export type Usage = BetaUsage

// ── Message types ────────────────────────────────────────────────────────────

export type MessageParam = {
  role: 'user' | 'assistant'
  content: string | ContentBlockParam[]
}

export type BetaMessageStreamParams = {
  model: string
  max_tokens: number
  messages: MessageParam[]
  system?: string | Array<{ type: 'text'; text: string }>
  tools?: BetaTool[]
  stream?: boolean
  thinking?: { type: string; budget_tokens?: number }
  [key: string]: unknown
}

// ── Error classes ────────────────────────────────────────────────────────────

export class APIUserAbortError extends Error {
  constructor() {
    super('Request was aborted by the user')
    this.name = 'APIUserAbortError'
  }
}

export class APIError extends Error {
  status?: number
  error?: { type?: string; message?: string }
  headers?: Record<string, string>
  constructor(
    status: number | undefined,
    error: unknown,
    message?: string,
    headers?: Record<string, string>,
  ) {
    super(message ?? String(error))
    this.name = 'APIError'
    this.status = status
    this.error = error as { type?: string; message?: string }
    this.headers = headers
  }
}

export class APIConnectionError extends Error {
  constructor(message?: string) {
    super(message ?? 'Connection error')
    this.name = 'APIConnectionError'
  }
}

export class APIConnectionTimeoutError extends APIConnectionError {
  constructor(message?: string) {
    super(message ?? 'Connection timed out')
    this.name = 'APIConnectionTimeoutError'
  }
}

// ── Response types ───────────────────────────────────────────────────────────

export type BetaStopReason = 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | string

export type BetaMessage = {
  id: string
  type: 'message'
  role: 'assistant'
  content: ContentBlock[]
  model: string
  stop_reason: BetaStopReason | null
  stop_sequence: string | null
  usage: BetaUsage
  [key: string]: unknown
}

// ── Client types (for files that import `type CodePilot` or `ClientOptions`) ─

export type ClientOptions = {
  apiKey?: string | null
  baseURL?: string
  timeout?: number
  maxRetries?: number
  defaultHeaders?: Record<string, string>
  fetch?: typeof fetch
  [key: string]: unknown
}

/**
 * Namespace placeholder for code that does `import type { CodePilot } from 'src/types/contentBlocks.js'`
 * and then references `CodePilot.Messages.MessageParam` etc.
 */
export namespace CodePilot {
  export namespace Messages {
    export type MessageParam = import('./contentBlocks.js').MessageParam
    export type ContentBlock = import('./contentBlocks.js').ContentBlock
    export type ContentBlockParam = import('./contentBlocks.js').ContentBlockParam
    export type TextBlockParam = import('./contentBlocks.js').TextBlockParam
    export type ImageBlockParam = import('./contentBlocks.js').ImageBlockParam
    export type ToolUseBlockParam = import('./contentBlocks.js').ToolUseBlockParam
    export type ToolResultBlockParam = import('./contentBlocks.js').ToolResultBlockParam
    export type ThinkingBlockParam = import('./contentBlocks.js').ThinkingBlockParam
    export type ToolUseBlock = import('./contentBlocks.js').ToolUseBlock
  }
  export namespace Beta {
    export namespace Messages {
      export type BetaContentBlock = import('./contentBlocks.js').BetaContentBlock
      export type BetaToolUseBlock = import('./contentBlocks.js').BetaToolUseBlock
      export type BetaToolUnion = import('./contentBlocks.js').BetaToolUnion
      export type BetaMessageParam = import('./contentBlocks.js').BetaMessageParam
      export type BetaMessageStreamParams = import('./contentBlocks.js').BetaMessageStreamParams
      export type BetaUsage = import('./contentBlocks.js').BetaUsage
      export type BetaTool = import('./contentBlocks.js').BetaTool
    }
  }
}
