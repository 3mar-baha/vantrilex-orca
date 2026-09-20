export type FoundryDetectResult = {
  projectCase: number
  language: string
  stack: string
  action: string
}

export type FoundryProvisionResult = {
  created: string[]
  errors: string[]
}

export type FoundryApi = {
  detect: (workspace: string) => Promise<FoundryDetectResult>
  provision: (workspace: string, projectName: string) => Promise<FoundryProvisionResult>
}
