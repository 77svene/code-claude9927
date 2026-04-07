import { z } from 'zod/v4'
import { lazySchema } from '../lazySchema.js'

const ModelCapabilitySchema = lazySchema(() =>
  z
    .object({
      id: z.string(),
      max_input_tokens: z.number().optional(),
      max_tokens: z.number().optional(),
    })
    .strip(),
)

export type ModelCapability = z.infer<ReturnType<typeof ModelCapabilitySchema>>

/**
 * Returns model capability info. Always returns undefined for local models.
 */
export function getModelCapability(_model: string): ModelCapability | undefined {
  return undefined
}

/**
 * No-op for local models — there is no remote capabilities endpoint to refresh from.
 */
export async function refreshModelCapabilities(): Promise<void> {
  // No-op for local model support
}
