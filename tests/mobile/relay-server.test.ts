import { describe, expect, it } from 'vitest'
import { MobileRelay, RelayError } from '../../src/main/mobile-relay/relay-server'

describe('mobile relay server', () => {
  it('starts on demand and reports lan plus port', async () => {
    const relay = new MobileRelay({ port: 0, lanIp: () => '192.168.1.20' })
    const info = await relay.ensure()
    expect(info.port).toBeGreaterThan(0)
    expect(info.lan).toBe('192.168.1.20')
    await relay.stop()
  })

  it('mints single-use nonces embedded in the lan qr payload', async () => {
    const relay = new MobileRelay({ port: 0, lanIp: () => '192.168.1.20' })
    const paired = await relay.pair()
    expect(paired.qr).toMatch(/^vantrilex:\/\/pair\?host=192\.168\.1\.20&port=\d+&nonce=[0-9a-f]+$/)
    const first = await relay.approve({ nonce: paired.nonce, approved: true })
    expect(first.accepted).toBe(true)
    await expect(relay.approve({ nonce: paired.nonce, approved: false })).rejects.toThrow(
      RelayError
    )
    await relay.stop()
  })

  it('rejects expired and unknown nonces', async () => {
    let now = 1_000_000
    const relay = new MobileRelay({ port: 0, lanIp: () => null, now: () => now })
    const paired = await relay.pair()
    now = 1_000_000 + 121_000
    await expect(relay.approve({ nonce: paired.nonce, approved: true })).rejects.toThrow(RelayError)
    await expect(relay.approve({ nonce: 'nope', approved: true })).rejects.toThrow(RelayError)
    await relay.stop()
  })

  it('serves status and approval over http', async () => {
    const approvals: unknown[] = []
    const relay = new MobileRelay({ port: 0, lanIp: () => '10.0.0.5' })
    relay.onApproval((verdict) => approvals.push(verdict))
    const info = await relay.ensure()
    const status = await (await fetch(`http://127.0.0.1:${info.port}/status`)).json()
    expect(status).toMatchObject({ running: true, lan: '10.0.0.5' })
    const paired = await relay.pair()
    const res = await fetch(`http://127.0.0.1:${info.port}/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nonce: paired.nonce, approved: false, note: 'later' })
    })
    expect(res.status).toBe(200)
    expect(approvals).toEqual([{ approved: false, note: 'later' }])
    const bad = await fetch(`http://127.0.0.1:${info.port}/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nonce: paired.nonce, approved: true })
    })
    expect(bad.status).toBe(410)
    await relay.stop()
  })
})
