export type RelayApproval = {
  approved: boolean
  note?: string
}

export type RelayApi = {
  ensure: () => Promise<{ lan: string | null; port: number }>
  pair: () => Promise<{ qr: string; expiresAt: number }>
  approvals: () => Promise<RelayApproval[]>
  onApproval: (cb: (verdict: RelayApproval) => void) => () => void
}
