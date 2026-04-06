import { getProxyFetchOptions } from 'src/utils/proxy.js'
import { getUserAgent } from 'src/utils/http.js'

export const CLIENT_REQUEST_ID_HEADER = 'x-devforge-request-id'

export type DevForgeClientConfig = {
  baseURL: string
  apiKey: string
  model: string
  timeout: number
}

export function getDevForgeClient(): DevForgeClientConfig {
  return {
    baseURL: process.env.DEVFORGE_API_BASE ?? 'http://localhost:11434/v1',
    apiKey: process.env.DEVFORGE_API_KEY ?? '',
    model: process.env.DEVFORGE_MODEL ?? 'qwen3.5:9b',
    timeout: Number(process.env.API_TIMEOUT_MS ?? 120000),
  }
}

export function getCustomHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'user-agent': getUserAgent(),
  }
  const proxyOptions = getProxyFetchOptions()
  if (proxyOptions?.headers) {
    Object.assign(headers, proxyOptions.headers)
  }
  return headers
}

export async function fetchCompletion(
  config: DevForgeClientConfig,
  body: unknown,
  signal?: AbortSignal,
): Promise<Response> {
  const url = `${config.baseURL}/chat/completions`
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...getCustomHeaders(),
  }
  if (config.apiKey) {
    headers['authorization'] = `Bearer ${config.apiKey}`
  }
  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })
}
