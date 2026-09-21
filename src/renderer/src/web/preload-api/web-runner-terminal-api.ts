import type { PreloadApi } from '../../../../preload/api-types'

function unsupported(method: string): Error {
  return new Error(`runnerTerminal.${method} is unsupported in the web client`)
}

export function createWebRunnerTerminalApi(): Partial<PreloadApi> {
  return {
    runnerTerminal: {
      launch: () => Promise.reject(unsupported('launch')),
      inject: () => Promise.reject(unsupported('inject')),
      send: () => Promise.reject(unsupported('send')),
      resize: () => Promise.reject(unsupported('resize')),
      terminate: () => Promise.reject(unsupported('terminate')),
      onData: () => () => {},
      onExit: () => () => {}
    }
  }
}
