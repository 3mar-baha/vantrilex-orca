export type AgentApi = {
  directive: (
    directive: string,
    workspace: string
  ) => Promise<{ prompt: string; sessionId: string }>
  arm: (armed: boolean) => Promise<void>
  status: () => Promise<{ armed: boolean; pending: number }>
}
