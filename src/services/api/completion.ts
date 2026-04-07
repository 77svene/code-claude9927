/**
 * codepilot.ts — Rewritten for CodePilot (OpenAI-compatible local models)
 *
 * Replaces the CodePilot SDK streaming with plain fetch() to
 * OpenAI-compatible /v1/chat/completions endpoints (Ollama, llama.cpp, vLLM, etc.)
 */

import { randomUUID } from 'crypto'
import { getEmptyToolPermissionContext } from '../../Tool.js'
import type { ToolPermissionContext, Tools, QueryChainTracking } from '../../Tool.js'
import type {
  AssistantMessage,
  Message,
  StreamEvent,
  SystemAPIErrorMessage,
  UserMessage,
} from '../../types/message.js'
import { toolToAPISchema, type OpenAITool } from '../../utils/api.js'
import { asSystemPrompt, type SystemPrompt } from '../../utils/systemPromptType.js'
import type { ThinkingConfig } from '../../utils/thinking.js'
import type { QuerySource } from '../../constants/querySource.js'
import type { AgentDefinition } from '../../tools/AgentTool/loadAgentsDir.js'
import type { Notification } from '../../context/notifications.js'
import type { AgentId } from '../../types/ids.js'
import { getCodePilotClient, fetchCompletion } from './client.js'
import { EMPTY_USAGE } from './emptyUsage.js'
import type { NonNullableUsage } from '../../entrypoints/sdk/sdkUtilityTypes.js'
import { createAssistantAPIErrorMessage, createUserMessage } from '../../utils/messages.js'
import { normalizeModelStringForAPI, getSmallFastModel } from '../../utils/model/model.js'
import { logForDebugging } from '../../utils/debug.js'
import { getModelMaxOutputTokens } from '../../utils/context.js'
import { withVCR } from '../vcr.js'
import { APIError, APIUserAbortError, APIConnectionTimeoutError } from '../../types/contentBlocks.js'
import { parseJSONWithRepair } from '../../utils/jsonRepair.js'

// Re-export for consumers
export { EMPTY_USAGE, APIError, APIUserAbortError, APIConnectionTimeoutError }
export type { NonNullableUsage }

// ── Types ─────────────────────────────────────────────────────────────────────

// Define a type that represents valid JSON values
type JsonValue = string | number | boolean | null | JsonObject | JsonArray
type JsonObject = { [key: string]: JsonValue }
type JsonArray = JsonValue[]

type EffortValue = string

export type Options = {
  getToolPermissionContext: () => Promise<ToolPermissionContext>
  model: string
  toolChoice?: unknown
  isNonInteractiveSession: boolean
  extraToolSchemas?: OpenAITool[]
  maxOutputTokensOverride?: number
  fallbackModel?: string
  onStreamingFallback?: () => void
  querySource: QuerySource
  agents: AgentDefinition[]
  allowedAgentTypes?: string[]
  hasAppendSystemPrompt: boolean
  fetchOverride?: unknown
  enablePromptCaching?: boolean
  skipCacheWrite?: boolean
  temperatureOverride?: number
  effortValue?: EffortValue
  mcpTools: Tools
  hasPendingMcpServers?: boolean
  queryTracking?: QueryChainTracking
  agentId?: AgentId
  outputFormat?: unknown
  fastMode?: boolean
  advisorModel?: string
  addNotification?: (notif: Notification) => void
  taskBudget?: { total: number; remaining?: number }
}

// OpenAI message format
type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string | null
  tool_calls?: OpenAIToolCall[]
  tool_call_id?: string
  name?: string
}

type OpenAIToolCall = {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

type OpenAIStreamDelta = {
  role?: string
  content?: string | null
  tool_calls?: Array<{
    index: number
    id?: string
    type?: string
    function?: { name?: string; arguments?: string }
  }>
}

type OpenAIStreamChoice = {
  index: number
  delta: OpenAIStreamDelta
  finish_reason: string | null
}

type OpenAIStreamChunk = {
  id: string
  object: string
  created: number
  model: string
  choices: OpenAIStreamChoice[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getExtraBodyParams(_betaHeaders?: string[]): JsonObject {
  return {}
}

export function getPromptCachingEnabled(_model: string): boolean {
  return false
}

export function getCacheControl(_opts?: unknown): undefined {
  return undefined
}

export function configureTaskBudgetParams(
  _params: unknown,
  _budget?: { total: number; remaining?: number },
): void {
  // No-op for local models
}

export function getAPIMetadata(): Record<string, string> {
  return {}
}

export const MAX_NON_STREAMING_TOKENS = 8_192

export function adjustParamsForNonStreaming<T extends { max_tokens?: number }>(
  params: T,
): T {
  return {
    ...params,
    max_tokens: Math.min(params.max_tokens ?? MAX_NON_STREAMING_TOKENS, MAX_NON_STREAMING_TOKENS),
  }
}

export function getMaxOutputTokensForModel(_model: string): number {
  return getModelMaxOutputTokens(_model).default
}

export function stripExcessMediaItems(
  messages: Message[],
  _maxItems?: number,
): Message[] {
  return messages // Local models typically don't support images anyway
}

export function cleanupStream(_stream: unknown): void {
  // No-op — we use fetch, not SDK streams
}

export function updateUsage(
  usage: Readonly<NonNullableUsage>,
  partUsage: Partial<NonNullableUsage> | undefined,
): NonNullableUsage {
  if (!partUsage) return { ...usage }
  return {
    ...usage,
    input_tokens: partUsage.input_tokens ?? usage.input_tokens,
    output_tokens: partUsage.output_tokens ?? usage.output_tokens,
  }
}

export function accumulateUsage(
  totalUsage: Readonly<NonNullableUsage>,
  messageUsage: Readonly<NonNullableUsage>,
): NonNullableUsage {
  return {
    ...totalUsage,
    input_tokens: totalUsage.input_tokens + messageUsage.input_tokens,
    output_tokens: totalUsage.output_tokens + messageUsage.output_tokens,
    cache_creation_input_tokens:
      totalUsage.cache_creation_input_tokens + messageUsage.cache_creation_input_tokens,
    cache_read_input_tokens:
      totalUsage.cache_read_input_tokens + messageUsage.cache_read_input_tokens,
    server_tool_use: {
      web_search_requests:
        totalUsage.server_tool_use.web_search_requests +
        messageUsage.server_tool_use.web_search_requests,
      web_fetch_requests:
        totalUsage.server_tool_use.web_fetch_requests +
        messageUsage.server_tool_use.web_fetch_requests,
    },
    service_tier: messageUsage.service_tier,
    cache_creation: {
      ephemeral_1h_input_tokens:
        totalUsage.cache_creation.ephemeral_1h_input_tokens +
        messageUsage.cache_creation.ephemeral_1h_input_tokens,
      ephemeral_5m_input_tokens:
        totalUsage.cache_creation.ephemeral_5m_input_tokens +
        messageUsage.cache_creation.ephemeral_5m_input_tokens,
    },
    inference_geo: messageUsage.inference_geo,
    iterations: messageUsage.iterations,
    speed: messageUsage.speed,
  }
}

// ── Message conversion helpers ────────────────────────────────────────────────

function convertSystemPrompt(systemPrompt: SystemPrompt): string {
  return systemPrompt.filter(Boolean).join('\n\n')
}

function convertToOpenAIMessages(
  systemPrompt: SystemPrompt,
  messages: Message[],
): OpenAIMessage[] {
  const result: OpenAIMessage[] = []

  // System message
  const sysText = convertSystemPrompt(systemPrompt)
  if (sysText) {
    result.push({ role: 'system', content: sysText })
  }

  // Conversation messages
  for (const msg of messages) {
    if (msg.type === 'user') {
      const userMsg = msg as UserMessage
      const content = userMsg.message?.content
      if (typeof content === 'string') {
        result.push({ role: 'user', content })
      } else if (Array.isArray(content)) {
        // Emit tool results first (role: 'tool'), then any text as user message
        const toolResults = content.filter((b: any) => b.type === 'tool_result')
        for (const tr of toolResults) {
          const resultContent =
            typeof (tr as any).content === 'string'
              ? (tr as any).content
              : Array.isArray((tr as any).content)
                ? (tr as any).content
                    .filter((b: any) => b.type === 'text')
                    .map((b: any) => b.text)
                    .join('\n')
                : ''
          result.push({
            role: 'tool',
            tool_call_id: (tr as any).tool_use_id || 'unknown',
            content: resultContent || 'done',
          })
        }

        const textParts = content
          .filter((b: any) => b.type === 'text')
          .map((b: any) => b.text)
          .join('\n')
        if (textParts) {
          result.push({ role: 'user', content: textParts })
        }
      }
    } else if (msg.type === 'assistant') {
      const assistantMsg = msg as AssistantMessage
      const content = assistantMsg.message?.content
      if (Array.isArray(content)) {
        const textParts = content
          .filter((b: any) => b.type === 'text')
          .map((b: any) => b.text)
          .join('')

        const toolUses = content.filter((b: any) => b.type === 'tool_use')

        if (toolUses.length > 0) {
          result.push({
            role: 'assistant',
            content: textParts || null,
            tool_calls: toolUses.map((tu: any) => ({
              id: tu.id || randomUUID(),
              type: 'function' as const,
              function: {
                name: tu.name,
                arguments: typeof tu.input === 'string' ? tu.input : JSON.stringify(tu.input || {}),
              },
            })),
          })
        } else {
          result.push({ role: 'assistant', content: textParts })
        }
      }
    }
  }

  return result
}

function convertTools(tools: OpenAITool[]): OpenAITool[] {
  return tools
}

// ── Message param converters (kept for external compatibility) ─────────────

export function userMessageToMessageParam(
  message: UserMessage,
  _addCache = false,
  _enablePromptCaching = false,
  _querySource?: QuerySource,
): { role: string; content: unknown } {
  return {
    role: 'user',
    content: Array.isArray(message.message.content)
      ? [...message.message.content]
      : message.message.content,
  }
}

export function assistantMessageToMessageParam(
  message: AssistantMessage,
  _addCache = false,
  _enablePromptCaching = false,
  _querySource?: QuerySource,
): { role: string; content: unknown } {
  return {
    role: 'assistant',
    content: message.message.content,
  }
}

// ── Cache breakpoints (no-op) ─────────────────────────────────────────────────

export function addCacheBreakpoints(
  messages: (UserMessage | AssistantMessage)[],
  _enablePromptCaching: boolean,
  _querySource?: QuerySource,
  _useCachedMC?: boolean,
  _newCacheEdits?: unknown,
  _pinnedEdits?: unknown,
  _skipCacheWrite?: boolean,
): Array<{ role: string; content: unknown }> {
  return messages.map(m => {
    if (m.type === 'user') {
      return userMessageToMessageParam(m as UserMessage)
    }
    return assistantMessageToMessageParam(m as AssistantMessage)
  })
}

// ── System prompt blocks (simplified) ─────────────────────────────────────────

export function buildSystemPromptBlocks(
  systemPrompt: SystemPrompt,
  _enablePromptCaching?: boolean,
  _options?: unknown,
): Array<{ type: string; text: string }> {
  const text = systemPrompt.filter(Boolean).join('\n\n')
  if (!text) return []
  return [{ type: 'text', text }]
}

// ── API key verification ──────────────────────────────────────────────────────

export async function verifyApiKey(
  _apiKey: string,
  isNonInteractiveSession: boolean,
): Promise<boolean> {
  if (isNonInteractiveSession) return true
  try {
    const config = getCodePilotClient()
    const response = await fetchCompletion(config, {
      model: config.model,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 1,
    })
    return response.ok
  } catch {
    return false
  }
}

// ── SSE Stream parsing ────────────────────────────────────────────────────────

async function* parseSSEStream(
  response: Response,
): AsyncGenerator<OpenAIStreamChunk> {
  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(':')) continue
        if (trimmed === 'data: [DONE]') return

        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6))
            yield json as OpenAIStreamChunk
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ── Core query function ───────────────────────────────────────────────────────

async function* queryModel(
  messages: Message[],
  systemPrompt: SystemPrompt,
  _thinkingConfig: ThinkingConfig,
  tools: Tools,
  signal: AbortSignal,
  options: Options,
): AsyncGenerator<StreamEvent | AssistantMessage | SystemAPIErrorMessage, void> {
  const config = getCodePilotClient()
  const model = normalizeModelStringForAPI(options.model || config.model)
  const maxTokens = options.maxOutputTokensOverride || getMaxOutputTokensForModel(model)

  // Build OpenAI tool schemas
  const toolSchemas: OpenAITool[] = []
  for (const tool of tools) {
    const schema = await toolToAPISchema(tool, {
      getToolPermissionContext: options.getToolPermissionContext,
      tools,
      agents: options.agents,
      allowedAgentTypes: options.allowedAgentTypes,
      model,
    })
    toolSchemas.push(schema)
  }
  if (options.extraToolSchemas) {
    toolSchemas.push(...options.extraToolSchemas)
  }

  // Convert messages to OpenAI format
  const openaiMessages = convertToOpenAIMessages(systemPrompt, messages)

  // Build request body
  const body: Record<string, unknown> = {
    model,
    messages: openaiMessages,
    max_tokens: maxTokens,
    stream: true,
    temperature: options.temperatureOverride ?? 0.7,
  }
  if (toolSchemas.length > 0) {
    body.tools = convertTools(toolSchemas)
  }

  logForDebugging(`[API] Sending request to ${config.baseURL} model=${model} tools=${toolSchemas.length}`)

  const start = Date.now()
  let response: Response

  try {
    response = await fetchCompletion(config, body, signal)
  } catch (err: unknown) {
    if (signal.aborted) {
      throw new APIUserAbortError()
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new APIUserAbortError()
    }
    const errMsg = err instanceof Error ? err.message : String(err)
    logForDebugging(`[API] Connection error: ${errMsg}`)
    const errorAssistant = createAssistantAPIErrorMessage({
      content: `Connection error: ${errMsg}. Is your local model server running at ${config.baseURL}?`,
    })
    yield errorAssistant
    return
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    logForDebugging(`[API] HTTP ${response.status}: ${errText}`)
    const errorAssistant = createAssistantAPIErrorMessage({
      content: `API error (HTTP ${response.status}): ${errText}`,
    })
    yield errorAssistant
    return
  }

  // Parse streaming response
  let fullText = ''
  const toolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map()
  let ttftMs = 0

  for await (const chunk of parseSSEStream(response)) {
    if (signal.aborted) throw new APIUserAbortError()

    for (const choice of chunk.choices) {
      const delta = choice.delta

      // Text content
      if (delta.content) {
        if (!ttftMs) ttftMs = Date.now() - start
        fullText += delta.content

        // Yield streaming text event
        yield {
          type: 'text' as const,
          text: delta.content,
        } as unknown as StreamEvent
      }

      // Tool calls
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCalls.has(tc.index)) {
            toolCalls.set(tc.index, {
              id: tc.id || randomUUID(),
              name: tc.function?.name || '',
              arguments: '',
            })
          }
          const existing = toolCalls.get(tc.index)!
          if (tc.function?.name) existing.name = tc.function.name
          if (tc.function?.arguments) existing.arguments += tc.function.arguments
        }
      }
    }
  }

  const duration = Date.now() - start

  // Build content blocks in CodePilot format (internal format the app expects)
  const contentBlocks: unknown[] = []

  if (fullText) {
    contentBlocks.push({ type: 'text', text: fullText })
  }

  for (const [, tc] of toolCalls) {
    let parsedInput: unknown = {}
    const repaired = parseJSONWithRepair(tc.arguments)
    if (repaired !== null) {
      parsedInput = repaired
    } else {
      // JSON repair failed — give the model a clear error message
      logForDebugging(`Tool call JSON parse failed for ${tc.name}: ${tc.arguments.slice(0, 200)}`)
      parsedInput = { raw: tc.arguments }
    }
    contentBlocks.push({
      type: 'tool_use',
      id: tc.id,
      name: tc.name,
      input: parsedInput,
    })
  }

  // If no content at all, add empty text
  if (contentBlocks.length === 0) {
    contentBlocks.push({ type: 'text', text: '' })
  }

  // Build usage
  const usage: NonNullableUsage = {
    ...EMPTY_USAGE,
    output_tokens: Math.ceil(fullText.length / 4), // rough estimate
  }

  // Yield final assistant message
  const assistantMessage: AssistantMessage = {
    type: 'assistant',
    uuid: randomUUID(),
    timestamp: new Date().toISOString(),
    message: {
      id: randomUUID(),
      type: 'message',
      role: 'assistant',
      model,
      content: contentBlocks as any,
      stop_reason: toolCalls.size > 0 ? 'tool_use' : 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 0,
        output_tokens: usage.output_tokens,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
    },
    costUSD: 0,
    durationMs: duration,
    ttftMs,
    usage,
  } as AssistantMessage

  yield assistantMessage
}

// ── Public query functions ────────────────────────────────────────────────────

export async function queryModelWithoutStreaming({
  messages,
  systemPrompt,
  thinkingConfig,
  tools,
  signal,
  options,
}: {
  messages: Message[]
  systemPrompt: SystemPrompt
  thinkingConfig: ThinkingConfig
  tools: Tools
  signal: AbortSignal
  options: Options
}): Promise<AssistantMessage> {
  let assistantMessage: AssistantMessage | undefined
  for await (const message of queryModel(messages, systemPrompt, thinkingConfig, tools, signal, options)) {
    if (message.type === 'assistant') {
      assistantMessage = message as AssistantMessage
    }
  }
  if (!assistantMessage) {
    if (signal.aborted) throw new APIUserAbortError()
    throw new Error('No assistant message found')
  }
  return assistantMessage
}

export async function* queryModelWithStreaming({
  messages,
  systemPrompt,
  thinkingConfig,
  tools,
  signal,
  options,
}: {
  messages: Message[]
  systemPrompt: SystemPrompt
  thinkingConfig: ThinkingConfig
  tools: Tools
  signal: AbortSignal
  options: Options
}): AsyncGenerator<StreamEvent | AssistantMessage | SystemAPIErrorMessage, void> {
  yield* queryModel(messages, systemPrompt, thinkingConfig, tools, signal, options)
}

// eslint-disable-next-line require-yield
export async function* executeNonStreamingRequest(
  _clientOptions: {
    model: string
    fetchOverride?: unknown
    source?: string
  },
  _params?: unknown,
  _signal?: AbortSignal,
  _retryOptions?: unknown,
): AsyncGenerator<SystemAPIErrorMessage, undefined> {
  // Stub — local models always use streaming; non-streaming fallback not implemented
  return undefined
}

// ── Convenience query functions ───────────────────────────────────────────────

type HaikuOptions = Omit<Options, 'model' | 'getToolPermissionContext'>

export async function queryHaiku({
  systemPrompt = asSystemPrompt([]),
  userPrompt,
  outputFormat,
  signal,
  options,
}: {
  systemPrompt?: SystemPrompt
  userPrompt: string
  outputFormat?: unknown
  signal: AbortSignal
  options: HaikuOptions
}): Promise<AssistantMessage> {
  const config = getCodePilotClient()
  const messages: Message[] = [
    createUserMessage({ content: userPrompt }),
  ]
  const result = await withVCR(
    [
      createUserMessage({ content: systemPrompt.map(t => ({ type: 'text', text: t })) }),
      createUserMessage({ content: userPrompt }),
    ],
    async () => {
      const r = await queryModelWithoutStreaming({
        messages,
        systemPrompt,
        thinkingConfig: { type: 'disabled' },
        tools: [],
        signal,
        options: {
          ...options,
          model: config.model || getSmallFastModel(),
          enablePromptCaching: options.enablePromptCaching ?? false,
          outputFormat,
          isNonInteractiveSession: options.isNonInteractiveSession ?? false,
          hasAppendSystemPrompt: options.hasAppendSystemPrompt ?? false,
          mcpTools: options.mcpTools ?? [],
          agents: options.agents ?? [],
          querySource: options.querySource,
          async getToolPermissionContext() {
            return getEmptyToolPermissionContext()
          },
        } as Options,
      })
      return [r]
    },
  )
  return result[0]! as AssistantMessage
}

type QueryWithModelOptions = Omit<Options, 'getToolPermissionContext'>

export async function queryWithModel({
  systemPrompt = asSystemPrompt([]),
  userPrompt,
  outputFormat,
  signal,
  options,
}: {
  systemPrompt?: SystemPrompt
  userPrompt: string
  outputFormat?: unknown
  signal: AbortSignal
  options: QueryWithModelOptions
}): Promise<AssistantMessage> {
  const messages: Message[] = [
    createUserMessage({ content: userPrompt }),
  ]
  const result = await withVCR(
    [
      createUserMessage({ content: systemPrompt.map(t => ({ type: 'text', text: t })) }),
      createUserMessage({ content: userPrompt }),
    ],
    async () => {
      const r = await queryModelWithoutStreaming({
        messages,
        systemPrompt,
        thinkingConfig: { type: 'disabled' },
        tools: [],
        signal,
        options: {
          ...options,
          enablePromptCaching: options.enablePromptCaching ?? false,
          outputFormat,
          isNonInteractiveSession: options.isNonInteractiveSession ?? false,
          hasAppendSystemPrompt: options.hasAppendSystemPrompt ?? false,
          mcpTools: options.mcpTools ?? [],
          agents: options.agents ?? [],
          async getToolPermissionContext() {
            return getEmptyToolPermissionContext()
          },
        } as Options,
      })
      return [r]
    },
  )
  return result[0]! as AssistantMessage
}
