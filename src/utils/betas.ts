export function filterAllowedSdkBetas(
  _sdkBetas: string[] | undefined,
): string[] | undefined {
  return undefined
}

export function modelSupportsISP(_model: string): boolean {
  return false
}

export function modelSupportsContextManagement(_model: string): boolean {
  return false
}

export function modelSupportsStructuredOutputs(_model: string): boolean {
  return false
}

export function modelSupportsAutoMode(_model: string): boolean {
  return false
}

export function getToolSearchBetaHeader(): string {
  return ''
}

export function shouldIncludeFirstPartyOnlyBetas(): boolean {
  return false
}

export function shouldUseGlobalCacheScope(): boolean {
  return false
}

export function getAllModelBetas(_model: string): string[] {
  return []
}
// Attach a no-op cache.clear so callers of clearBetasCaches() don't throw
getAllModelBetas.cache = { clear: () => {} }

export function getModelBetas(_model: string): string[] {
  return []
}
getModelBetas.cache = { clear: () => {} }

export function getBedrockExtraBodyParamsBetas(_model: string): string[] {
  return []
}
getBedrockExtraBodyParamsBetas.cache = { clear: () => {} }

export function getMergedBetas(
  _model: string,
  _options?: { isAgenticQuery?: boolean },
): string[] {
  return []
}

export function clearBetasCaches(): void {}
