import { describe, expect, it } from 'vitest'
import {
  mulberry32,
  paintStarfield,
  STARFIELD_DEFAULT_COUNT,
  StarfieldEngine
} from './splash-starfield'

function engine(width = 200, height = 100, seed = 7): StarfieldEngine {
  return new StarfieldEngine({ width, height, seed }, mulberry32(seed))
}

describe('splash-starfield engine', () => {
  it('seeds deterministically and sizes the field', () => {
    const a = engine()
    const b = engine()
    expect(a.count()).toBe(STARFIELD_DEFAULT_COUNT)
    expect(a.snapshot().map((p) => [p.x, p.y, p.vx])).toEqual(
      b.snapshot().map((p) => [p.x, p.y, p.vx])
    )
    expect(new StarfieldEngine({ width: 0, height: 0 }).count()).toBe(STARFIELD_DEFAULT_COUNT)
  })

  it('advances warp streaks outward from center', () => {
    const e = engine()
    const before = e.snapshot().map((p) => Math.hypot(p.x - 100, p.y - 50))
    e.step(1 / 60)
    const after = e.snapshot().map((p, i) => Math.hypot(p.x - 100, p.y - 50) - before[i])
    expect(after.filter((d) => d > 0).length).toBeGreaterThan(after.length / 2)
  })

  it('detonates bursts and decays flash', () => {
    const e = engine()
    const base = e.count()
    e.burst(40)
    expect(e.count()).toBe(base + 40)
    expect(e.flash).toBe(1)
    expect(
      e
        .snapshot()
        .slice(-40)
        .every((p) => p.burst)
    ).toBe(true)
    e.step(1)
    expect(e.flash).toBeLessThan(1)
  })

  it('paints streaks and flash through the palette', () => {
    const e = engine()
    e.burst(5)
    const strokes: [number, number, number, number][] = []
    let fills = 0
    const ctx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      globalAlpha: 1,
      fillRect: (): void => {
        fills += 1
      },
      beginPath: (): void => undefined,
      moveTo: (x: number, y: number): void => {
        strokes.push([x, y, 0, 0])
      },
      lineTo: (x: number, y: number): void => {
        const last = strokes.at(-1)
        if (last) {
          last[2] = x
          last[3] = y
        }
      },
      stroke: (): void => undefined
    }
    const seen: string[] = []
    paintStarfield(ctx as unknown as CanvasRenderingContext2D, e, {
      background: '#000',
      streak: (hue, alpha) => {
        seen.push(`${hue}:${alpha}`)
        return '#fff'
      },
      flash: '#fff'
    })
    expect(fills).toBeGreaterThanOrEqual(2)
    expect(strokes.length).toBe(e.count())
    expect(seen.length).toBe(e.count())
  })
})
