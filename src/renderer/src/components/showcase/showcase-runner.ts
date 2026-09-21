import type { ShowcaseRunner } from './ShowcaseButton'

export function createShowcaseRunner(
  workspace: string | null,
  shell: { openPath: (path: string) => Promise<void> }
): ShowcaseRunner {
  return {
    generate: async () => {
      if (!workspace) {
        throw new Error('No workspace open — open a repo before previewing its showcase')
      }
      const full = `${workspace}/docs/showcase.html`
      try {
        await shell.openPath(full)
      } catch (error) {
        throw new Error(
          `Cannot open ${full} (${(error as Error).message}); generate it with the project-showcase-builder skill`
        )
      }
      return { path: full }
    }
  }
}
