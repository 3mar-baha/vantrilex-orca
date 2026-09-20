import { ipcRenderer } from 'electron'
import type { FoundryApi } from './foundry-api'

export const foundryApi: FoundryApi = {
  detect: (workspace: string) => ipcRenderer.invoke('foundry:detect', workspace),
  provision: (workspace: string, projectName: string) =>
    ipcRenderer.invoke('foundry:provision', workspace, projectName)
}
