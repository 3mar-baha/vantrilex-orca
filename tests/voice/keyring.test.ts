import { describe, expect, it } from 'vitest'
import { Keyring, KeyringError, type SecureStore } from '../../src/main/voice/keyring'

function memoryStore(): SecureStore {
  const data = new Map<string, string>()
  return {
    load: (key) => data.get(key) ?? null,
    save: (key, value) => {
      data.set(key, value)
    },
    clear: (key) => {
      data.delete(key)
    }
  }
}

const FISH_KEYS = ['fish-key-a', 'fish-key-b']
const GROQ_KEYS = ['groq-key-a']

describe('keyring checkout and rotation', () => {
  it('serves the first key for the first 10 requests', () => {
    const ring = new Keyring(memoryStore(), { fish: FISH_KEYS, groq: GROQ_KEYS })
    for (let i = 0; i < 10; i++) {
      expect(ring.checkout('fish')).toBe('fish-key-a')
    }
    expect(ring.status('fish')).toMatchObject({ currentIndex: 0, sinceRotation: 10 })
  })

  it('rolls over to the next key on the 11th request', () => {
    const ring = new Keyring(memoryStore(), { fish: FISH_KEYS, groq: GROQ_KEYS })
    for (let i = 0; i < 10; i++) {
      ring.checkout('fish')
    }
    expect(ring.checkout('fish')).toBe('fish-key-b')
    expect(ring.status('fish')).toMatchObject({ currentIndex: 1, sinceRotation: 1 })
  })

  it('keeps independent counters per pool', () => {
    const ring = new Keyring(memoryStore(), { fish: FISH_KEYS, groq: GROQ_KEYS })
    for (let i = 0; i < 10; i++) {
      ring.checkout('fish')
    }
    expect(ring.checkout('groq')).toBe('groq-key-a')
    expect(ring.status('groq')).toMatchObject({ currentIndex: 0, sinceRotation: 1 })
    expect(ring.status('fish')).toMatchObject({ currentIndex: 0, sinceRotation: 10 })
  })

  it('throws a typed error for unconfigured pools', () => {
    const ring = new Keyring(memoryStore(), { fish: [], groq: GROQ_KEYS })
    expect(() => ring.checkout('fish')).toThrow(KeyringError)
    expect(ring.status('fish').configured).toBe(false)
  })

  it('supports manual rotation and key intake', () => {
    const ring = new Keyring(memoryStore(), { fish: ['only'], groq: GROQ_KEYS })
    ring.addKey('fish', 'spare')
    expect(ring.rotate('fish')).toBe(1)
    expect(ring.checkout('fish')).toBe('spare')
  })

  it('never leaks key material through status', () => {
    const ring = new Keyring(memoryStore(), { fish: FISH_KEYS, groq: GROQ_KEYS })
    ring.checkout('fish')
    const leaked = JSON.stringify(ring.status('fish'))
    expect(leaked).not.toContain('fish-key-a')
    expect(leaked).not.toContain('fish-key-b')
  })
})
