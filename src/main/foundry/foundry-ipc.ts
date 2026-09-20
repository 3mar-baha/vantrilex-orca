import { ipcMain } from 'electron'
import { statSync } from 'node:fs'
import { detectProjectCase } from './foundry-detect'
import { scaffoldDocs } from './foundry-docs'
import { immunologySummary, loadLedger } from './foundry-immune-ledger'
import { provisionCoreSkills } from './foundry-skills'
import { applyFoundryGuard } from './foundry-guard-hook'

function isWorkspaceDir(path: unknown): path is string {
  if (typeof path !== 'string' || path.trim() === '') {
    return false
  }
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

export function registerFoundryIpcHandlers(): void {
  ipcMain.handle('foundry:detect', (_event, workspace: unknown) => {
    if (!isWorkspaceDir(workspace)) {
      throw new Error('foundry:detect requires an existing workspace directory')
    }
    const details = detectProjectCase(workspace)
    return {
      projectCase: details.projectCase,
      language: details.language,
      stack: details.stack,
      action: details.action
    }
  })

  ipcMain.handle('foundry:provision', async (_event, workspace: unknown, projectName: unknown) => {
    if (!isWorkspaceDir(workspace)) {
      throw new Error('foundry:provision requires an existing workspace directory')
    }
    const name =
      typeof projectName === 'string' && projectName.trim() !== '' ? projectName.trim() : workspace
    const errors: string[] = []
    const created: string[] = []
    try {
      const docs = scaffoldDocs(workspace, name, { immuneSummary: immunologySummary(loadLedger()) })
      created.push(...docs.created)
    } catch (error) {
      errors.push((error as Error).message)
    }
    try {
      const skills = provisionCoreSkills(workspace)
      created.push(...skills.created)
    } catch (error) {
      errors.push((error as Error).message)
    }
    try {
      created.push(...applyFoundryGuard(workspace))
    } catch (error) {
      errors.push((error as Error).message)
    }
    return { created, errors }
  })
}
