// Starfield warp engine for the startup splash: radial warp streaks with
// velocity ramp, ambient drift, supernova bursts, and a flash decay.
// Ported from the terminal particle engine; math only, canvas-agnostic.

export type StarfieldParticle = {
  x: number
  y: number
  px: number
  py: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  burst: boolean
  hue: number
}

export type StarfieldOptions = {
  width: number
  height: number
  seed?: number
  starCount?: number
}

export const STARFIELD_DEFAULT_COUNT = 160
export const STARFIELD_WARP_ACCEL = 1.6
export const STARFIELD_DRAG = 0.985
export const STARFIELD_FLASH_DECAY = 1.8

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class StarfieldEngine {
  readonly width: number
  readonly height: number
  flash = 0
  private parts: StarfieldParticle[] = []
  private readonly rng: () => number

  constructor(options: StarfieldOptions, rng?: () => number) {
    this.width = Math.max(8, Math.floor(options.width))
    this.height = Math.max(4, Math.floor(options.height))
    this.rng = rng ?? mulberry32((options.seed ?? Date.now()) >>> 0)
    const count = Math.max(0, Math.floor(options.starCount ?? STARFIELD_DEFAULT_COUNT))
    for (let i = 0; i < count; i += 1) {
      this.parts.push(this.spawnAmbient(true))
    }
  }

  count(): number {
    return this.parts.length
  }

  snapshot(): readonly StarfieldParticle[] {
    return this.parts
  }

  burst(n = 90): void {
    const cx = this.width / 2
    const cy = this.height / 2
    for (let i = 0; i < n; i += 1) {
      const ang = this.rng() * Math.PI * 2
      const speed = 60 + this.rng() * 220
      const life = 0.7 + this.rng() * 0.9
      this.parts.push({
        x: cx,
        y: cy,
        px: cx,
        py: cy,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        life,
        maxLife: life,
        size: 0.6 + this.rng() * 1.8,
        burst: true,
        hue: 190 + this.rng() * 80
      })
    }
    if (this.flash < 0.9) {
      this.flash = 1
    }
  }

  private spawnAmbient(anywhere: boolean): StarfieldParticle {
    const life = 3 + this.rng() * 4
    return {
      x: this.rng() * this.width,
      y: anywhere ? this.rng() * this.height : this.edgeY(),
      px: 0,
      py: 0,
      vx: 0,
      vy: 0,
      life,
      maxLife: life,
      size: 0.4 + this.rng() * 1.2,
      burst: false,
      hue: 200 + this.rng() * 60
    }
  }

  private edgeY(): number {
    return this.rng() < 0.5 ? this.rng() * 2 : this.height - this.rng() * 2
  }

  step(dt: number): void {
    const step = dt <= 0 || dt > 0.1 ? 1 / 60 : dt
    const cx = this.width / 2
    const cy = this.height / 2
    this.flash = Math.max(0, this.flash - step * STARFIELD_FLASH_DECAY)
    const kept: StarfieldParticle[] = []
    for (const p of this.parts) {
      p.px = p.x
      p.py = p.y
      if (p.burst) {
        p.vx *= STARFIELD_DRAG
        p.vy *= STARFIELD_DRAG
        p.x += p.vx * step
        p.y += p.vy * step
        p.life -= step * 0.85
      } else {
        const dx = p.x - cx
        const dy = p.y - cy
        const dist = Math.hypot(dx, dy) || 1
        const pull = (1 + dist / 120) * STARFIELD_WARP_ACCEL
        p.vx = (p.vx + (dx / dist) * pull * 60 * step) * 0.99
        p.vy = (p.vy + (dy / dist) * pull * 60 * step) * 0.99
        p.x += p.vx * step
        p.y += p.vy * step
        p.life -= step * 0.12
        if (p.x < -4 || p.x > this.width + 4 || p.y < -4 || p.y > this.height + 4 || p.life <= 0) {
          const fresh = this.spawnAmbient(false)
          fresh.px = fresh.x
          fresh.py = fresh.y
          kept.push(fresh)
          continue
        }
      }
      if (p.life > 0) {
        kept.push(p)
      }
    }
    this.parts = kept.slice(0, 420)
  }
}

export type StarfieldPalette = {
  background: string
  streak: (hue: number, alpha: number) => string
  flash: string
}

export function paintStarfield(
  ctx: CanvasRenderingContext2D,
  engine: StarfieldEngine,
  palette: StarfieldPalette
): void {
  const { width, height } = engine
  ctx.fillStyle = palette.background
  ctx.fillRect(0, 0, width, height)
  for (const p of engine.snapshot()) {
    const age = p.maxLife <= 0 ? 1 : 1 - p.life / p.maxLife
    const alpha = Math.max(0, Math.min(1, 1 - age * 0.9))
    ctx.strokeStyle = palette.streak(p.hue, alpha)
    ctx.lineWidth = p.size
    ctx.beginPath()
    ctx.moveTo(p.px, p.py)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }
  if (engine.flash > 0) {
    ctx.fillStyle = palette.flash
    ctx.globalAlpha = Math.min(1, engine.flash * 0.6)
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1
  }
}
