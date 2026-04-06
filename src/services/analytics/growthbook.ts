/**
 * growthbook.ts - stubbed for local model usage
 * All GrowthBook SDK imports, network calls, and initialization removed.
 * Every feature/config lookup returns the caller-supplied defaultValue.
 */

/**
 * User attributes sent to GrowthBook for targeting.
 * Type kept for compatibility with consumers that import it.
 */
export type GrowthBookUserAttributes = {
  id: string
  sessionId: string
  deviceID: string
  platform: 'win32' | 'darwin' | 'linux'
  apiBaseUrlHost?: string
  organizationUUID?: string
  accountUUID?: string
  userType?: string
  subscriptionType?: string
  rateLimitTier?: string
  firstTokenTime?: number
  email?: string
  appVersion?: string
  github?: unknown
}

// ── Feature flags ─────────────────────────────────────────────────────────────

/**
 * Always returns defaultValue — no remote evaluation.
 */
export function getFeatureValue_CACHED_MAY_BE_STALE<T>(
  _feature: string,
  defaultValue: T,
): T {
  return defaultValue
}

/**
 * @deprecated Use getFeatureValue_CACHED_MAY_BE_STALE.
 */
export async function getFeatureValue_DEPRECATED<T>(
  _feature: string,
  defaultValue: T,
): Promise<T> {
  return defaultValue
}

/**
 * @deprecated Use getFeatureValue_CACHED_MAY_BE_STALE.
 */
export function getFeatureValue_CACHED_WITH_REFRESH<T>(
  _feature: string,
  defaultValue: T,
  _refreshIntervalMs: number,
): T {
  return defaultValue
}

// ── Dynamic configs ───────────────────────────────────────────────────────────

/**
 * Always returns defaultValue — no blocking init.
 */
export async function getDynamicConfig_BLOCKS_ON_INIT<T>(
  _configName: string,
  defaultValue: T,
): Promise<T> {
  return defaultValue
}

/**
 * Always returns defaultValue.
 */
export function getDynamicConfig_CACHED_MAY_BE_STALE<T>(
  _configName: string,
  defaultValue: T,
): T {
  return defaultValue
}

// ── Feature gates (Statsig migration helpers) ─────────────────────────────────

export function checkStatsigFeatureGate_CACHED_MAY_BE_STALE(
  _gate: string,
): boolean {
  return false
}

export async function checkSecurityRestrictionGate(
  _gate: string,
): Promise<boolean> {
  return false
}

export async function checkGate_CACHED_OR_BLOCKING(
  _gate: string,
): Promise<boolean> {
  return false
}

// ── Env overrides ─────────────────────────────────────────────────────────────

export function hasGrowthBookEnvOverride(_feature: string): boolean {
  return false
}

// ── Config overrides (ant-only dev tooling) ───────────────────────────────────

export function getAllGrowthBookFeatures(): Record<string, unknown> {
  return {}
}

export function getGrowthBookConfigOverrides(): Record<string, unknown> {
  return {}
}

export function setGrowthBookConfigOverride(
  _feature: string,
  _value: unknown,
): void {}

export function clearGrowthBookConfigOverrides(): void {}

// ── Initialization & refresh (no-ops) ─────────────────────────────────────────

export async function initializeGrowthBook(): Promise<null> {
  return null
}

export function resetGrowthBook(): void {}

export function refreshGrowthBookAfterAuthChange(): void {}

export async function refreshGrowthBookFeatures(): Promise<void> {}

export function setupPeriodicGrowthBookRefresh(): void {}

export function stopPeriodicGrowthBookRefresh(): void {}

// ── Refresh listener ──────────────────────────────────────────────────────────

export function onGrowthBookRefresh(
  _listener: () => void | Promise<void>,
): () => void {
  // Return no-op unsubscribe
  return () => {}
}

// ── Misc ──────────────────────────────────────────────────────────────────────

export function getApiBaseUrlHost(): string | undefined {
  const baseUrl = process.env.ANTHROPIC_BASE_URL
  if (!baseUrl) return undefined
  try {
    const host = new URL(baseUrl).host
    if (host === 'api.anthropic.com') return undefined
    return host
  } catch {
    return undefined
  }
}
