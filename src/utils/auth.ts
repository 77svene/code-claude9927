/**
 * auth.ts - stubbed for local model usage
 * All OAuth, AWS, and GCP credential logic removed.
 * CODEPILOT_API_KEY env var used instead of CODEPILOT_API_KEY.
 */

import { getAPIProvider } from 'src/utils/model/providers.js'
import { getModelStrings } from 'src/utils/model/modelStrings.js'
import { getSettings_DEPRECATED, getSettingsForSource } from './settings/settings.js'
import { isEnvTruthy } from './envUtils.js'
import type { OAuthTokens, SubscriptionType } from '../services/oauth/types.js'
import type { AccountInfo } from './config.js'

export type ApiKeySource =
  | 'CODEPILOT_API_KEY'
  | 'apiKeyHelper'
  | '/login managed key'
  | 'none'

export type UserAccountInfo = {
  subscription?: string
  tokenSource?: string
  apiKeySource?: ApiKeySource
  organization?: string
  email?: string
}

export type OrgValidationResult =
  | { valid: true }
  | { valid: false; message: string }

// ── API key ──────────────────────────────────────────────────────────────────

export function getcodepilotApiKey(): null | string {
  return process.env.CODEPILOT_API_KEY || ''
}

export function getcodepilotApiKeyWithSource(
  _opts: { skipRetrievingKeyFromApiKeyHelper?: boolean } = {},
): { key: null | string; source: ApiKeySource } {
  const key = process.env.CODEPILOT_API_KEY || null
  return { key, source: key ? 'CODEPILOT_API_KEY' : 'none' }
}

export function hascodepilotApiKeyAuth(): boolean {
  return !!(process.env.CODEPILOT_API_KEY)
}

// ── Subscription checks (all false / free) ───────────────────────────────────

export function isSubscriber(): boolean {
  return false
}

export function isMaxSubscriber(): boolean {
  return false
}

export function isProSubscriber(): boolean {
  return false
}

export function isTeamSubscriber(): boolean {
  return false
}

export function isTeamPremiumSubscriber(): boolean {
  return false
}

export function isEnterpriseSubscriber(): boolean {
  return false
}

export function isConsumerSubscriber(): boolean {
  return false
}

export function is1PApiCustomer(): boolean {
  return true
}

export function getSubscriptionType(): SubscriptionType | null {
  return null
}

export function getSubscriptionName(): string {
  return 'CodePilot API'
}

export function getRateLimitTier(): string | null {
  return null
}

export function hasOpusAccess(): boolean {
  return true
}

export function isOverageProvisioningAllowed(): boolean {
  return false
}

export function hasProfileScope(): boolean {
  return false
}

// ── Auth token source ─────────────────────────────────────────────────────────

export function getAuthTokenSource(): {
  source:
    | 'CODEPILOT_API_KEY'
    | 'apiKeyHelper'
    | '/login managed key'
    | 'codepilot.local'
    | 'CODEPILOT_AUTH_TOKEN'
    | 'codepilot_CODE_OAUTH_TOKEN'
    | 'codepilot_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR'
    | 'CCR_OAUTH_TOKEN_FILE'
    | 'none'
  hasToken: boolean
} {
  const key = process.env.CODEPILOT_API_KEY
  return key
    ? { source: 'CODEPILOT_API_KEY', hasToken: true }
    : { source: 'none', hasToken: false }
}

export function iscodepilotAuthEnabled(): boolean {
  return false
}

// ── OAuth tokens (stubbed to null) ────────────────────────────────────────────

export const getOAuthTokens = Object.assign(
  (): OAuthTokens | null => null,
  { cache: { clear: () => {} } },
)

export async function getOAuthTokensAsync(): Promise<OAuthTokens | null> {
  return null
}

export function saveOAuthTokensIfNeeded(
  _tokens: OAuthTokens,
): { success: boolean; warning?: string } {
  return { success: true }
}

export function clearOAuthTokenCache(): void {}

export function checkAndRefreshOAuthTokenIfNeeded(
  _retryCount = 0,
  _force = false,
): Promise<boolean> {
  return Promise.resolve(false)
}

export function handleOAuth401Error(_failedAccessToken: string): Promise<boolean> {
  return Promise.resolve(false)
}

// ── OAuth account info ────────────────────────────────────────────────────────

export function getOauthAccountInfo(): AccountInfo | undefined {
  return undefined
}

// ── apiKeyHelper ──────────────────────────────────────────────────────────────

export function getConfiguredApiKeyHelper(): string | undefined {
  const settings = getSettings_DEPRECATED() || {}
  return settings.apiKeyHelper
}

export function getApiKeyFromApiKeyHelperCached(): string | null {
  return null
}

export async function getApiKeyFromApiKeyHelper(
  _isNonInteractiveSession: boolean,
): Promise<string | null> {
  return null
}

export function getApiKeyHelperElapsedMs(): number {
  return 0
}

export function clearApiKeyHelperCache(): void {}

export function calculateApiKeyHelperTTL(): number {
  return 5 * 60 * 1000
}

export function prefetchApiKeyFromApiKeyHelperIfSafe(
  _isNonInteractiveSession: boolean,
): void {}

// ── AWS credential stubs ──────────────────────────────────────────────────────

export const refreshAndGetAwsCredentials = Object.assign(
  async (): Promise<{
    accessKeyId: string
    secretAccessKey: string
    sessionToken: string
  } | null> => null,
  { cache: { clear: () => {} } },
)

export function clearAwsCredentialsCache(): void {}

export function isAwsAuthRefreshFromProjectSettings(): boolean {
  return false
}

export function isAwsCredentialExportFromProjectSettings(): boolean {
  return false
}

export function refreshAwsAuth(_awsAuthRefresh: string): Promise<boolean> {
  return Promise.resolve(false)
}

export function prefetchAwsCredentialsAndBedRockInfoIfSafe(): void {
  // Still prefetch model strings as a side-effect (was called in original)
  void getModelStrings()
}

// ── GCP credential stubs ──────────────────────────────────────────────────────

export const refreshGcpCredentialsIfNeeded = Object.assign(
  async (): Promise<boolean> => false,
  { cache: { clear: () => {} } },
)

export function clearGcpCredentialsCache(): void {}

export function isGcpAuthRefreshFromProjectSettings(): boolean {
  return false
}

export async function checkGcpCredentialsValid(): Promise<boolean> {
  return false
}

export function refreshGcpAuth(_gcpAuthRefresh: string): Promise<boolean> {
  return Promise.resolve(false)
}

export function prefetchGcpCredentialsIfSafe(): void {}

// ── API key config/keychain stubs ─────────────────────────────────────────────

export const getApiKeyFromConfigOrMacOSKeychain = Object.assign(
  (): { key: string; source: ApiKeySource } | null => null,
  { cache: { clear: () => {} } },
)

export async function saveApiKey(_apiKey: string): Promise<void> {}

export async function removeApiKey(): Promise<void> {}

export function isCustomApiKeyApproved(_apiKey: string): boolean {
  return false
}

// ── Org validation ────────────────────────────────────────────────────────────

export async function validateForceLoginOrg(): Promise<OrgValidationResult> {
  return { valid: true }
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

export function isUsing3PServices(): boolean {
  return !!(
    isEnvTruthy(process.env.codepilot_CODE_USE_BEDROCK) ||
    isEnvTruthy(process.env.codepilot_CODE_USE_VERTEX) ||
    isEnvTruthy(process.env.codepilot_CODE_USE_FOUNDRY)
  )
}

export function isOtelHeadersHelperFromProjectOrLocalSettings(): boolean {
  return false
}

export function getOtelHeadersFromHelper(): Record<string, string> {
  return {}
}

export function getAccountInformation(): UserAccountInfo | undefined {
  const apiProvider = getAPIProvider()
  if (apiProvider !== 'firstParty') return undefined
  const { source: authTokenSource } = getAuthTokenSource()
  const accountInfo: UserAccountInfo = {}
  if (authTokenSource !== 'none') {
    accountInfo.tokenSource = authTokenSource
  }
  const { key: apiKey, source: apiKeySource } = getcodepilotApiKeyWithSource()
  if (apiKey) accountInfo.apiKeySource = apiKeySource
  return accountInfo
}

export function isAwsAuthRefreshFromProjectOrLocalSettings(): boolean {
  return false
}

export function isAwsCredentialExportFromProjectOrLocalSettings(): boolean {
  return false
}
