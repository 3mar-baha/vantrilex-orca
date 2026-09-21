import { ipcRenderer } from 'electron'
import type { RelayApi, RelayApproval } from './relay-api'

export const relayApi: RelayApi = {
  ensure: () => ipcRenderer.invoke('relay:ensure', {}),
  pair: () => ipcRenderer.invoke('relay:pair', {}),
  approvals: () => ipcRenderer.invoke('relay:approvals', {}),
  onApproval: (cb: (verdict: RelayApproval) => void) => {
    const listener = (_event: unknown, payload: RelayApproval) => cb(payload)
    ipcRenderer.on('relay:approval', listener as (...args: unknown[]) => void)
    return () => {
      ipcRenderer.removeListener('relay:approval', listener as (...args: unknown[]) => void)
    }
  }
}
