import { useEffect, useState } from 'react'
import { dismissFoundryToast, subscribeFoundryToasts, type FoundryToast } from './foundry-toast-bus'

const TONE_CLASSES: Record<FoundryToast['tone'], string> = {
  info: 'bg-card text-card-foreground',
  success: 'bg-card text-card-foreground',
  error: 'bg-destructive text-destructive-foreground'
}

export function FoundryToasts(): React.JSX.Element | null {
  const [toasts, setToasts] = useState<readonly FoundryToast[]>([])

  useEffect(() => subscribeFoundryToasts(setToasts), [])

  if (toasts.length === 0) {
    return null
  }
  return (
    <div
      data-testid="foundry-toasts"
      className="pointer-events-none fixed bottom-10 left-4 z-40 flex max-h-[calc(100vh-80px)] w-[360px] max-w-[calc(100vw-32px)] flex-col gap-2 overflow-y-auto scrollbar-sleek"
      role="status"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          data-testid={`foundry-toast-${toast.id}`}
          type="button"
          onClick={() => dismissFoundryToast(toast.id)}
          className={`pointer-events-auto rounded-lg border px-4 py-3 text-left text-sm shadow-lg ${TONE_CLASSES[toast.tone]}`}
        >
          {toast.message}
        </button>
      ))}{' '}
    </div>
  )
}
