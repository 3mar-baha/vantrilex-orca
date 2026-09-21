export class AgentValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AgentValidationError'
  }
}

export type IpcHandleSeed = {
  handle: (channel: string, listener: (event: unknown, ...args: unknown[]) => unknown) => void
}

export type AgentService = {
  orchestrate: (
    directive: string,
    workspace: string
  ) => Promise<{ prompt: string; sessionId: string }>
  setArmed: (armed: boolean) => Promise<void>
  status: () => { armed: boolean; pending: number }
}

function isRecord(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null
}

export function registerAgentIpc(ipc: IpcHandleSeed, service: AgentService): void {
  ipc.handle('agent:directive', async (_event, payload: unknown) => {
    if (
      !isRecord(payload) ||
      typeof payload['directive'] !== 'string' ||
      payload['directive'].trim() === ''
    ) {
      throw new AgentValidationError("agent:directive requires a non-empty 'directive'")
    }
    if (
      !isRecord(payload) ||
      typeof payload['workspace'] !== 'string' ||
      payload['workspace'].trim() === ''
    ) {
      throw new AgentValidationError("agent:directive requires a non-empty 'workspace'")
    }
    return service.orchestrate(payload['directive'] as string, payload['workspace'] as string)
  })
  ipc.handle('agent:arm', async (_event, payload: unknown) => {
    if (!isRecord(payload) || typeof payload['armed'] !== 'boolean') {
      throw new AgentValidationError("agent:arm requires a boolean 'armed'")
    }
    await service.setArmed(payload['armed'] as boolean)
  })
  ipc.handle('agent:status', async () => service.status())
}
