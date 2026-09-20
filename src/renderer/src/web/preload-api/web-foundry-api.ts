import type { PreloadApi } from '../../../../preload/api-types'

function unsupported(method: string): Error {
  return new Error(`foundry.${method} is unsupported in the web client`)
}

export function createWebFoundryApi(): Partial<PreloadApi> {
  return {
    foundry: {
      detect: () => Promise.reject(unsupported('detect')),
      provision: () => Promise.reject(unsupported('provision'))
    }
  }
}
