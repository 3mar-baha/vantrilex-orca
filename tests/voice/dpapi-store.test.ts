import { beforeEach, describe, expect, it, vi } from 'vitest'

const safeStorageMock = vi.hoisted(() => ({
  isEncryptionAvailable: vi.fn(() => true),
  encryptString: vi.fn((value: string) => Buffer.from(`enc:${value}`)),
  decryptString: vi.fn((value: Buffer) => value.toString('utf8').replace(/^enc:/, ''))
}))

vi.mock('electron', () => ({ safeStorage: safeStorageMock }))

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DpapiStore } from '../../src/main/voice/dpapi-store'

describe('dpapi keyring store', () => {
  let dir = ''

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'vantrilex-keyring-'))
  })

  it('round-trips values through os encryption', () => {
    const store = new DpapiStore(join(dir, 'keyring.json'))
    store.save('fish', JSON.stringify(['k1']))
    expect(store.load('fish')).toBe(JSON.stringify(['k1']))
    expect(safeStorageMock.encryptString).toHaveBeenCalled()
  })

  it('returns null for missing keys and clears on demand', () => {
    const store = new DpapiStore(join(dir, 'keyring.json'))
    expect(store.load('nope')).toBeNull()
    store.save('fish', 'x')
    store.clear('fish')
    expect(store.load('fish')).toBeNull()
  })

  it('refuses to operate when os encryption is unavailable', () => {
    safeStorageMock.isEncryptionAvailable.mockReturnValueOnce(false)
    const store = new DpapiStore(join(dir, 'keyring.json'))
    expect(() => store.save('fish', 'x')).toThrow()
  })
})
