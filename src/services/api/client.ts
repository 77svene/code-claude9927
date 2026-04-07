import { getProxyFetchOptions } from 'src/utils/proxy.js'
import { getUserAgent } from 'src/utils/http.js'

export const CLIENT_REQUEST_ID_HEADER = 'x-codepilot-request-id'

export type CodePilotClientConfig = {
  baseURL: string
  apiKey: string
  model: string
  timeout: number
}

export function getCodePilotClient(): CodePilotClientConfig {
  return {
    baseURL: process.env.CODEPILOT_API_BASE ?? 'http://localhost:11434/v1',
    apiKey: process.env.CODEPILOT_API_KEY ?? '',
    model: process.env.CODEPILOT_MODEL ?? 'qwen3.5:9b',
    // 5 min default: a 9B model generating 4K tokens at 30 tok/s takes ~133s
    timeout: Number(process.env.API_TIMEOUT_MS ?? 300000),
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
  config: CodePilotClientConfig,
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
