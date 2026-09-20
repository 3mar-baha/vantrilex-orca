import { useEffect, useRef } from 'react'
import { pushFoundryToast } from './foundry-toast-bus'

const SCAN_TOAST = 'Scanning workspace in background...'
const DONE_TOAST = '✓ Workspace configured'

// Why a ref set: React 18 StrictMode double-invokes effects in dev, and the
// workspace path object identity can churn; the set guarantees one detached
// run per path per mount without blocking any wizard or view.
export function useFoundryBackgroundProvision(workspacePath: string | null): void {
  const started = useRef(new Set<string>())
  useEffect(() => {
    if (!workspacePath || started.current.has(workspacePath)) {
      return
    }
    started.current.add(workspacePath)
    const api = window.api?.foundry
    if (!api) {
      return
    }
    let cancelled = false
    pushFoundryToast(SCAN_TOAST, 'info')
    void (async () => {
      try {
        const details = await api.detect(workspacePath)
        if (cancelled) {
          return
        }
        const name =
          workspacePath.split(/[/\\]/).findLast((segment) => segment !== '') ?? workspacePath
        const res = await api.provision(workspacePath, name)
        if (cancelled) {
          return
        }
        if (res.errors.length > 0) {
          pushFoundryToast(
            `Workspace setup needs attention: ${res.errors.join('; ')}`,
            'error',
            10000
          )
        } else {
          pushFoundryToast(
            `${DONE_TOAST} (Case ${details.projectCase}, ${res.created.length} files)`,
            'success'
          )
        }
      } catch (error) {
        if (!cancelled) {
          pushFoundryToast(`Workspace setup failed: ${(error as Error).message}`, 'error', 10000)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspacePath])
}
