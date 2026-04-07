/**
 * Analytics service - stubbed for local model usage
 * All event logging is a no-op. Export names and signatures preserved.
 */

/**
 * Marker type for verifying analytics metadata doesn't contain sensitive data
 */
export type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS = never

/**
 * Marker type for values routed to PII-tagged proto columns via `_PROTO_*`
 * payload keys.
 */
export type AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED = never

/**
 * Strip `_PROTO_*` keys from a payload. No-op stub — returns input unchanged.
 */
export function stripProtoFields<V>(
  metadata: Record<string, V>,
): Record<string, V> {
  return metadata
}

// Internal type for logEvent metadata
type LogEventMetadata = { [key: string]: boolean | number | undefined }

/**
 * Sink interface for the analytics backend
 */
export type AnalyticsSink = {
  logEvent: (eventName: string, metadata: LogEventMetadata) => void
  logEventAsync: (
    eventName: string,
    metadata: LogEventMetadata,
  ) => Promise<void>
}

/**
 * No-op — sink attachment is not needed in local model usage.
 */
export function attachAnalyticsSink(_newSink: AnalyticsSink): void {}

/**
 * No-op analytics event logger (synchronous).
 */
export function logEvent(
  _eventName: string,
  _metadata: LogEventMetadata,
): void {}

/**
 * No-op analytics event logger (asynchronous).
 */
export async function logEventAsync(
  _eventName: string,
  _metadata: LogEventMetadata,
): Promise<void> {}

/**
 * No-op reset (kept for test compatibility).
 * @internal
 */
export function _resetForTesting(): void {}
