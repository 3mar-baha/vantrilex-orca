import { ipcRenderer } from 'electron'
import type { AgentApi } from './agent-api'

export const agentApi: AgentApi = {
  directive: (directive: string, workspace: string) =>
    ipcRenderer.invoke('agent:directive', { directive, workspace }),
  arm: (armed: boolean) => ipcRenderer.invoke('agent:arm', { armed }),
  status: () => ipcRenderer.invoke('agent:status', {})
}
