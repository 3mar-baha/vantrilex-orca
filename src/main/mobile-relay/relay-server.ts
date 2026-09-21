import { randomBytes } from 'node:crypto'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { pickLanIPv4 } from './lan-ip'

export const RELAY_PORT = 8787
export const NONCE_TTL_MS = 120_000

export type ApprovalVerdict = {
  approved: boolean
  note?: string
}

export type RelayInfo = {
  lan: string | null
  port: number
}

export type PairedNonce = {
  qr: string
  expiresAt: number
}

export class RelayError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'RelayError'
    this.status = status
  }
}

export type RelayOptions = {
  port?: number
  now?: () => number
  lanIp?: () => string | null
}

export class MobileRelay {
  private server: Server | null = null
  private nonces = new Map<string, number>()
  private readonly queue: ApprovalVerdict[] = []
  private readonly approvalListeners = new Set<(verdict: ApprovalVerdict) => void>()
  private readonly port: number
  private readonly now: () => number
  private readonly lanIp: () => string | null
  private boundPort = 0

  constructor(options: RelayOptions = {}) {
    this.port = options.port ?? RELAY_PORT
    this.now = options.now ?? Date.now
    this.lanIp = options.lanIp ?? (() => pickLanIPv4())
  }

  async ensure(): Promise<RelayInfo> {
    if (!this.server) {
      const lan = this.lanIp()
      this.server = createServer((req, res) => {
        void this.route(req, res).catch(() => {
          this.json(res, 500, { error: 'relay failure' })
        })
      })
      await new Promise<void>((resolve, reject) => {
        this.server?.once('error', reject)
        // Bind all interfaces: phones join over Wi-Fi via the LAN QR
        // payload. Exposure is bounded — every mutating route requires a
        // 128-bit single-use nonce with a 120s TTL; status is read-only.
        this.server?.listen(this.port, '0.0.0.0', () => {
          const address = this.server?.address()
          this.boundPort = typeof address === 'object' && address ? address.port : this.port
          resolve()
        })
      })
      void lan
    }
    return { lan: this.lanIp(), port: this.boundPort }
  }

  async stop(): Promise<void> {
    const server = this.server
    this.server = null
    this.nonces.clear()
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  }

  async pair(): Promise<PairedNonce & { nonce: string }> {
    const info = await this.ensure()
    const nonce = randomBytes(16).toString('hex')
    const expiresAt = this.now() + NONCE_TTL_MS
    this.nonces.set(nonce, expiresAt)
    const host = info.lan ?? '127.0.0.1'
    return {
      qr: `vantrilex://pair?host=${host}&port=${info.port}&nonce=${nonce}`,
      nonce,
      expiresAt
    }
  }

  async approve(input: {
    nonce: string
    approved: boolean
    note?: string
  }): Promise<{ accepted: boolean }> {
    const expiresAt = this.nonces.get(input.nonce)
    if (expiresAt === undefined) {
      throw new RelayError(410, 'Unknown or consumed pairing nonce')
    }
    this.nonces.delete(input.nonce)
    if (this.now() >= expiresAt) {
      throw new RelayError(410, 'Pairing nonce expired')
    }
    const verdict: ApprovalVerdict = {
      approved: input.approved,
      ...(input.note ? { note: input.note } : {})
    }
    this.queue.push(verdict)
    for (const listener of this.approvalListeners) {
      listener(verdict)
    }
    return { accepted: true }
  }

  drainApprovals(): ApprovalVerdict[] {
    return this.queue.splice(0)
  }

  onApproval(listener: (verdict: ApprovalVerdict) => void): () => void {
    this.approvalListeners.add(listener)
    return () => {
      this.approvalListeners.delete(listener)
    }
  }

  private async route(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    if (req.method === 'GET' && url.pathname === '/status') {
      this.json(res, 200, {
        running: this.server !== null,
        lan: this.lanIp(),
        port: this.boundPort
      })
      return
    }
    if (req.method === 'POST' && url.pathname === '/approve') {
      const body = await this.readJson(req)
      try {
        const result = await this.approve({
          nonce: typeof body['nonce'] === 'string' ? body['nonce'] : '',
          approved: body['approved'] === true,
          note: typeof body['note'] === 'string' ? body['note'] : undefined
        })
        this.json(res, 200, result)
      } catch (error) {
        const status = error instanceof RelayError ? error.status : 400
        this.json(res, status, { error: (error as Error).message })
      }
      return
    }
    this.json(res, 404, { error: 'unknown relay route' })
  }

  private readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
        if (Buffer.concat(chunks).length > 64 * 1024) {
          reject(new RelayError(413, 'Relay payload too large'))
          req.destroy()
        }
      })
      req.on('end', () => {
        try {
          const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          resolve(
            typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
          )
        } catch {
          reject(new RelayError(400, 'Relay payload is not JSON'))
        }
      })
      req.on('error', reject)
    })
  }

  private json(res: ServerResponse, status: number, payload: unknown): void {
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(payload))
  }
}
