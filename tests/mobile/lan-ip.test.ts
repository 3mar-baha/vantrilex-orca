import { describe, expect, it } from 'vitest'
import type { NetworkInterfaceInfo } from 'node:os'
import { pickLanIPv4 } from '../../src/main/mobile-relay/lan-ip'

function iface(address: string, family: string, internal: boolean): NetworkInterfaceInfo {
  return { address, family, internal } as NetworkInterfaceInfo
}

describe('lan ip resolution', () => {
  it('picks the first external ipv4 address', () => {
    const interfaces = {
      lo: [iface('127.0.0.1', 'IPv4', true)],
      eth0: [iface('192.168.1.20', 'IPv4', false), iface('fe80::1', 'IPv6', false)],
      wifi: [iface('10.0.0.5', 'IPv4', false)]
    }
    expect(pickLanIPv4(interfaces)).toBe('192.168.1.20')
  })

  it('returns null without an external ipv4', () => {
    expect(pickLanIPv4({ lo: [iface('127.0.0.1', 'IPv4', true)] })).toBeNull()
    expect(pickLanIPv4({})).toBeNull()
  })
})
