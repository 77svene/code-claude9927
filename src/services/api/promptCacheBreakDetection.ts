import type { AgentId } from 'src/types/ids.js'
import type { Message } from 'src/types/message.js'
import type { QuerySource } from '../../constants/querySource.js'

export const CACHE_TTL_1HOUR_MS = 60 * 60 * 1000

export type PromptStateSnapshot = {
  system: unknown[]
  toolSchemas: unknown[]
  querySource: QuerySource
  model: string
  agentId?: AgentId
  fastMode?: boolean
  globalCacheStrategy?: string
  betas?: readonly string[]
  autoModeActive?: boolean
  isUsingOverage?: boolean
  cachedMCEnabled?: boolean
  effortValue?: string | number
  extraBodyParams?: unknown
}

export function recordPromptState(_snapshot: PromptStateSnapshot): void {}

export async function checkResponseForCacheBreak(
  _querySource: QuerySource,
  _cacheReadTokens: number,
  _cacheCreationTokens: number,
  _messages: Message[],
  _agentId?: AgentId,
  _requestId?: string | null,
): Promise<void> {}

export function notifyCacheDeletion(
  _querySource: QuerySource,
  _agentId?: AgentId,
): void {}

export function notifyCompaction(
  _querySource: QuerySource,
  _agentId?: AgentId,
): void {}

export function cleanupAgentTracking(_agentId: AgentId): void {}

export function resetPromptCacheBreakDetection(): void {}
