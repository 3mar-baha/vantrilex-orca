import type { PreloadApi } from '../../../../preload/api-types'

function unsupported(method: string): Error {
  return new Error(`agent.${method} is unsupported in the web client`)
}

export function createWebAgentApi(): Partial<PreloadApi> {
  return {
    agent: {
      directive: () => Promise.reject(unsupported('directive')),
      arm: () => Promise.reject(unsupported('arm')),
      status: () => Promise.reject(unsupported('status'))
    }
  }
}
