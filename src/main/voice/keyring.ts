export type KeyPoolName = 'fish' | 'groq'

export type KeyringStatus = {
  configured: boolean
  slots: number
  currentIndex: number
  sinceRotation: number
}

export type SecureStore = {
  load: (key: string) => string | null
  save: (key: string, value: string) => void
  clear: (key: string) => void
}

export class KeyringError extends Error {
  readonly pool: KeyPoolName
  constructor(pool: KeyPoolName, message: string) {
    super(message)
    this.name = 'KeyringError'
    this.pool = pool
  }
}

const ROTATION_EVERY = 10

type PoolState = {
  keys: string[]
  index: number
  sinceRotation: number
}

export class Keyring {
  private readonly pools = new Map<KeyPoolName, PoolState>()

  constructor(
    private readonly store: SecureStore,
    seeds: Record<KeyPoolName, string[]> = { fish: [], groq: [] }
  ) {
    for (const name of ['fish', 'groq'] as const) {
      const stored = this.store.load(`vantrilex:keyring:${name}`)
      const keys = stored === null ? seeds[name] : (JSON.parse(stored) as string[])
      this.pools.set(name, { keys, index: 0, sinceRotation: 0 })
    }
  }

  checkout(pool: KeyPoolName): string {
    const state = this.state(pool)
    if (state.keys.length === 0) {
      throw new KeyringError(pool, `Keyring pool '${pool}' has no keys`)
    }
    if (state.sinceRotation >= ROTATION_EVERY) {
      state.index = (state.index + 1) % state.keys.length
      state.sinceRotation = 0
    }
    const key = state.keys[state.index]
    state.sinceRotation += 1
    return key as string
  }

  rotate(pool: KeyPoolName): number {
    const state = this.state(pool)
    if (state.keys.length === 0) {
      throw new KeyringError(pool, `Keyring pool '${pool}' has no keys`)
    }
    state.index = (state.index + 1) % state.keys.length
    state.sinceRotation = 0
    return state.index
  }

  addKey(pool: KeyPoolName, key: string): void {
    if (key.trim() === '') {
      throw new KeyringError(pool, 'Refusing blank key material')
    }
    const state = this.state(pool)
    state.keys.push(key)
    this.store.save(`vantrilex:keyring:${pool}`, JSON.stringify(state.keys))
  }

  status(pool: KeyPoolName): KeyringStatus {
    const state = this.state(pool)
    return {
      configured: state.keys.length > 0,
      slots: state.keys.length,
      currentIndex: state.index,
      sinceRotation: state.sinceRotation
    }
  }

  private state(pool: KeyPoolName): PoolState {
    const state = this.pools.get(pool)
    if (!state) {
      throw new KeyringError(pool, `Unknown keyring pool '${pool}'`)
    }
    return state
  }
}
