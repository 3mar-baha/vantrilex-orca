export type FoundryToastTone = 'info' | 'success' | 'error'

export type FoundryToast = {
  id: number
  message: string
  tone: FoundryToastTone
}

type Listener = (toasts: readonly FoundryToast[]) => void

let nextId = 1
let toasts: FoundryToast[] = []
const listeners = new Set<Listener>()
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function emit(): void {
  const snapshot = [...toasts]
  for (const listener of listeners) {
    listener(snapshot)
  }
}

export function pushFoundryToast(
  message: string,
  tone: FoundryToastTone = 'info',
  ttlMs = 6000
): number {
  const id = nextId
  nextId += 1
  toasts = [...toasts.slice(-4), { id, message, tone }]
  emit()
  const timer = setTimeout(() => {
    timers.delete(id)
    dismissFoundryToast(id)
  }, ttlMs)
  timers.set(id, timer)
  return id
}

export function dismissFoundryToast(id: number): void {
  const timer = timers.get(id)
  if (timer !== undefined) {
    clearTimeout(timer)
    timers.delete(id)
  }
  if (toasts.some((t) => t.id === id)) {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }
}

export function subscribeFoundryToasts(listener: Listener): () => void {
  listeners.add(listener)
  listener([...toasts])
  return () => {
    listeners.delete(listener)
  }
}

export function resetFoundryToastBusForTest(): void {
  for (const timer of timers.values()) {
    clearTimeout(timer)
  }
  timers.clear()
  toasts = []
  listeners.clear()
  nextId = 1
}
