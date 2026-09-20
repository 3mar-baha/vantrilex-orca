import { readFileSync } from 'node:fs'

export function readFileTrimmedSize(path: string): number {
  try {
    return readFileSync(path, 'utf8').trim().length
  } catch {
    return 0
  }
}
