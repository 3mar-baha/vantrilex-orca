import type { PreloadApi } from '../../../../preload/api-types'

function unsupported(method: string): Error {
  return new Error(`relay.${method} is unsupported in the web client`)
}

export function createWebRelayApi(): Partial<PreloadApi> {
  return {
    relay: {
      ensure: () => Promise.reject(unsupported('ensure')),
      pair: () => Promise.reject(unsupported('pair')),
      approvals: () => Promise.reject(unsupported('approvals')),
      onApproval: () => () => {}
    }
  }
}
