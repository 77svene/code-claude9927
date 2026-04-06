import type { PermissionMode } from '../permissions/PermissionMode.js'
import type { ModelAlias } from './aliases.js'

export type ModelShortName = string
export type ModelName = string
export type ModelSetting = ModelName | ModelAlias | null

export function getMainLoopModel(): ModelName {
  return process.env.DEVFORGE_MODEL || 'qwen3.5:9b'
}

export function getSmallFastModel(): ModelName {
  return process.env.DEVFORGE_SMALL_MODEL || getMainLoopModel()
}

export function getDefaultOpusModel(): ModelName {
  return getMainLoopModel()
}

export function getDefaultSonnetModel(): ModelName {
  return getMainLoopModel()
}

export function getDefaultHaikuModel(): ModelName {
  return getMainLoopModel()
}

export function getBestModel(): ModelName {
  return getMainLoopModel()
}

export function getUserSpecifiedModelSetting(): ModelSetting | undefined {
  return process.env.DEVFORGE_MODEL || undefined
}

export function isNonCustomOpusModel(_model: ModelName): boolean {
  return false
}

export function getRuntimeMainLoopModel(params: {
  permissionMode: PermissionMode
  mainLoopModel: string
  exceeds200kTokens?: boolean
}): ModelName {
  return params.mainLoopModel
}

export function getCanonicalName(model: ModelName): ModelShortName {
  return model
}

export function getMarketingNameForModel(model: string): string | undefined {
  return model
}

export function normalizeModelStringForAPI(model: string): string {
  return model
}

export function parseUserSpecifiedModel(
  modelInput: ModelName | ModelAlias,
): ModelName {
  return modelInput
}

export function getDefaultMainLoopModel(): ModelName {
  return getMainLoopModel()
}

export function getDefaultMainLoopModelSetting(): ModelName | ModelAlias {
  return getMainLoopModel()
}

export function renderModelName(model: ModelName): string {
  return model
}

export function renderModelSetting(setting: ModelName | ModelAlias): string {
  return setting
}

export function renderDefaultModelSetting(
  setting: ModelName | ModelAlias,
): string {
  return setting
}

export function modelDisplayString(model: ModelSetting): string {
  if (model === null) {
    return `Default (${getMainLoopModel()})`
  }
  return model
}

export function getPublicModelDisplayName(model: ModelName): string | null {
  return null
}

export function getPublicModelName(model: ModelName): string {
  return `Local (${model})`
}

export function firstPartyNameToCanonical(name: ModelName): ModelShortName {
  return name
}

export function isOpus1mMergeEnabled(): boolean {
  return false
}

export function isLegacyModelRemapEnabled(): boolean {
  return false
}

export function getClaudeAiUserDefaultModelDescription(
  _fastMode = false,
): string {
  return getMainLoopModel()
}

export function getOpus46PricingSuffix(_fastMode: boolean): string {
  return ''
}

export function resolveSkillModelOverride(
  skillModel: string,
  _currentModel: string,
): string {
  return skillModel
}
