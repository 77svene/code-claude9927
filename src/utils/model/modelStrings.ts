import { ALL_MODEL_CONFIGS, type ModelKey } from './configs.js'

/**
 * Maps each model version to its provider-specific model ID string.
 * Derived from ALL_MODEL_CONFIGS — adding a model there extends this type.
 */
export type ModelStrings = Record<ModelKey, string>

export function getModelStrings(): ModelStrings {
  const model = process.env.CODEPILOT_MODEL || 'qwen3.5:9b'
  const out = {} as ModelStrings
  for (const key of Object.keys(ALL_MODEL_CONFIGS) as ModelKey[]) {
    out[key] = model
  }
  return out
}

/**
 * Resolve an overridden model ID back to its canonical form.
 * Returns the model unchanged (identity function).
 */
export function resolveOverriddenModel(modelId: string): string {
  return modelId
}

/**
 * Ensure model strings are fully initialized (no-op for local models).
 */
export async function ensureModelStringsInitialized(): Promise<void> {
  // No async initialization needed for local models
}
