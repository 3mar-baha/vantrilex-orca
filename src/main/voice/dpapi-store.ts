import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { safeStorage } from 'electron'
import type { SecureStore } from './keyring'

export class DpapiUnavailableError extends Error {
  constructor() {
    super('OS encryption is unavailable for the keyring')
    this.name = 'DpapiUnavailableError'
  }
}

export class DpapiStore implements SecureStore {
  constructor(private readonly file: string) {}

  load(key: string): string | null {
    const all = this.readAll()
    const sealed = all[key]
    if (typeof sealed !== 'string') {
      return null
    }
    return safeStorage.decryptString(Buffer.from(sealed, 'base64'))
  }

  save(key: string, value: string): void {
    this.assertAvailable()
    const all = this.readAll()
    all[key] = safeStorage.encryptString(value).toString('base64')
    mkdirSync(dirname(this.file), { recursive: true })
    writeFileSync(this.file, JSON.stringify(all), 'utf8')
  }

  clear(key: string): void {
    const all = this.readAll()
    delete all[key]
    mkdirSync(dirname(this.file), { recursive: true })
    writeFileSync(this.file, JSON.stringify(all), 'utf8')
  }

  private assertAvailable(): void {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new DpapiUnavailableError()
    }
  }

  private readAll(): Record<string, string> {
    try {
      return JSON.parse(readFileSync(this.file, 'utf8')) as Record<string, string>
    } catch {
      return {}
    }
  }
}
