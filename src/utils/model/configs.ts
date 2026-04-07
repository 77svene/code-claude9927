import type { ModelName } from './model.js'
import type { APIProvider } from './providers.js'

export type ModelConfig = Record<APIProvider, ModelName>

function localModel(): ModelName {
  return process.env.CODEPILOT_MODEL || 'qwen3.5:9b'
}

const LOCAL_MODEL_CONFIG: ModelConfig = {
  firstParty: localModel(),
  bedrock: localModel(),
  vertex: localModel(),
  foundry: localModel(),
}

export const codepilot_3_7_SONNET_CONFIG = LOCAL_MODEL_CONFIG
export const codepilot_3_5_V2_SONNET_CONFIG = LOCAL_MODEL_CONFIG
export const codepilot_3_5_HAIKU_CONFIG = LOCAL_MODEL_CONFIG
export const codepilot_HAIKU_4_5_CONFIG = LOCAL_MODEL_CONFIG
export const codepilot_SONNET_4_CONFIG = LOCAL_MODEL_CONFIG
export const codepilot_SONNET_4_5_CONFIG = LOCAL_MODEL_CONFIG
export const codepilot_OPUS_4_CONFIG = LOCAL_MODEL_CONFIG
export const codepilot_OPUS_4_1_CONFIG = LOCAL_MODEL_CONFIG
export const codepilot_OPUS_4_5_CONFIG = LOCAL_MODEL_CONFIG
export const codepilot_OPUS_4_6_CONFIG = LOCAL_MODEL_CONFIG
export const codepilot_SONNET_4_6_CONFIG = LOCAL_MODEL_CONFIG

export const ALL_MODEL_CONFIGS = {
  haiku35: codepilot_3_5_HAIKU_CONFIG,
  haiku45: codepilot_HAIKU_4_5_CONFIG,
  sonnet35: codepilot_3_5_V2_SONNET_CONFIG,
  sonnet37: codepilot_3_7_SONNET_CONFIG,
  sonnet40: codepilot_SONNET_4_CONFIG,
  sonnet45: codepilot_SONNET_4_5_CONFIG,
  sonnet46: codepilot_SONNET_4_6_CONFIG,
  opus40: codepilot_OPUS_4_CONFIG,
  opus41: codepilot_OPUS_4_1_CONFIG,
  opus45: codepilot_OPUS_4_5_CONFIG,
  opus46: codepilot_OPUS_4_6_CONFIG,
} as const satisfies Record<string, ModelConfig>

export type ModelKey = keyof typeof ALL_MODEL_CONFIGS

/** Union of all canonical first-party model IDs. */
export type CanonicalModelId =
  (typeof ALL_MODEL_CONFIGS)[ModelKey]['firstParty']

/** Runtime list of canonical model IDs — used by comprehensiveness tests. */
export const CANONICAL_MODEL_IDS = Object.values(ALL_MODEL_CONFIGS).map(
  c => c.firstParty,
) as [CanonicalModelId, ...CanonicalModelId[]]

/** Map canonical ID → internal short key. */
export const CANONICAL_ID_TO_KEY: Record<CanonicalModelId, ModelKey> =
  Object.fromEntries(
    (Object.entries(ALL_MODEL_CONFIGS) as [ModelKey, ModelConfig][]).map(
      ([key, cfg]) => [cfg.firstParty, key],
    ),
  ) as Record<CanonicalModelId, ModelKey>
