// Content for the codepilot-api bundled skill.
// Each .md file is inlined as a string at build time via Bun's text loader.

import csharpCodePilotApi from './codepilot-api/csharp/codepilot-api.md'
import curlExamples from './codepilot-api/curl/examples.md'
import goCodePilotApi from './codepilot-api/go/codepilot-api.md'
import javaCodePilotApi from './codepilot-api/java/codepilot-api.md'
import phpCodePilotApi from './codepilot-api/php/codepilot-api.md'
import pythonAgentSdkPatterns from './codepilot-api/python/agent-sdk/patterns.md'
import pythonAgentSdkReadme from './codepilot-api/python/agent-sdk/README.md'
import pythonCodePilotApiBatches from './codepilot-api/python/codepilot-api/batches.md'
import pythonCodePilotApiFilesApi from './codepilot-api/python/codepilot-api/files-api.md'
import pythonCodePilotApiReadme from './codepilot-api/python/codepilot-api/README.md'
import pythonCodePilotApiStreaming from './codepilot-api/python/codepilot-api/streaming.md'
import pythonCodePilotApiToolUse from './codepilot-api/python/codepilot-api/tool-use.md'
import rubyCodePilotApi from './codepilot-api/ruby/codepilot-api.md'
import skillPrompt from './codepilot-api/SKILL.md'
import sharedErrorCodes from './codepilot-api/shared/error-codes.md'
import sharedLiveSources from './codepilot-api/shared/live-sources.md'
import sharedModels from './codepilot-api/shared/models.md'
import sharedPromptCaching from './codepilot-api/shared/prompt-caching.md'
import sharedToolUseConcepts from './codepilot-api/shared/tool-use-concepts.md'
import typescriptAgentSdkPatterns from './codepilot-api/typescript/agent-sdk/patterns.md'
import typescriptAgentSdkReadme from './codepilot-api/typescript/agent-sdk/README.md'
import typescriptCodePilotApiBatches from './codepilot-api/typescript/codepilot-api/batches.md'
import typescriptCodePilotApiFilesApi from './codepilot-api/typescript/codepilot-api/files-api.md'
import typescriptCodePilotApiReadme from './codepilot-api/typescript/codepilot-api/README.md'
import typescriptCodePilotApiStreaming from './codepilot-api/typescript/codepilot-api/streaming.md'
import typescriptCodePilotApiToolUse from './codepilot-api/typescript/codepilot-api/tool-use.md'

// @[MODEL LAUNCH]: Update the model IDs/names below. These are substituted into {{VAR}}
// placeholders in the .md files at runtime before the skill prompt is sent.
// After updating these constants, manually update the two files that still hardcode models:
//   - codepilot-api/SKILL.md (Current Models pricing table)
//   - codepilot-api/shared/models.md (full model catalog with legacy versions and alias mappings)
export const SKILL_MODEL_VARS = {
  OPUS_ID: 'codepilot-opus-4-6',
  OPUS_NAME: 'CodePilot Opus 4.6',
  SONNET_ID: 'codepilot-sonnet-4-6',
  SONNET_NAME: 'CodePilot Sonnet 4.6',
  HAIKU_ID: 'codepilot-haiku-4-5',
  HAIKU_NAME: 'CodePilot Haiku 4.5',
  // Previous Sonnet ID — used in "do not append date suffixes" example in SKILL.md.
  PREV_SONNET_ID: 'codepilot-sonnet-4-5',
} satisfies Record<string, string>

export const SKILL_PROMPT: string = skillPrompt

export const SKILL_FILES: Record<string, string> = {
  'csharp/codepilot-api.md': csharpCodePilotApi,
  'curl/examples.md': curlExamples,
  'go/codepilot-api.md': goCodePilotApi,
  'java/codepilot-api.md': javaCodePilotApi,
  'php/codepilot-api.md': phpCodePilotApi,
  'python/agent-sdk/README.md': pythonAgentSdkReadme,
  'python/agent-sdk/patterns.md': pythonAgentSdkPatterns,
  'python/codepilot-api/README.md': pythonCodePilotApiReadme,
  'python/codepilot-api/batches.md': pythonCodePilotApiBatches,
  'python/codepilot-api/files-api.md': pythonCodePilotApiFilesApi,
  'python/codepilot-api/streaming.md': pythonCodePilotApiStreaming,
  'python/codepilot-api/tool-use.md': pythonCodePilotApiToolUse,
  'ruby/codepilot-api.md': rubyCodePilotApi,
  'shared/error-codes.md': sharedErrorCodes,
  'shared/live-sources.md': sharedLiveSources,
  'shared/models.md': sharedModels,
  'shared/prompt-caching.md': sharedPromptCaching,
  'shared/tool-use-concepts.md': sharedToolUseConcepts,
  'typescript/agent-sdk/README.md': typescriptAgentSdkReadme,
  'typescript/agent-sdk/patterns.md': typescriptAgentSdkPatterns,
  'typescript/codepilot-api/README.md': typescriptCodePilotApiReadme,
  'typescript/codepilot-api/batches.md': typescriptCodePilotApiBatches,
  'typescript/codepilot-api/files-api.md': typescriptCodePilotApiFilesApi,
  'typescript/codepilot-api/streaming.md': typescriptCodePilotApiStreaming,
  'typescript/codepilot-api/tool-use.md': typescriptCodePilotApiToolUse,
}
