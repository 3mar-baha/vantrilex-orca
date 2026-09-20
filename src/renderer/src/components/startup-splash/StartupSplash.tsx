import { useEffect, useRef, useState } from 'react'
import crestUrl from '../../../../shared/vantrilex-assets/vantrilex-crest.png?url'
import { paintStarfield, StarfieldEngine } from './splash-starfield'

export const SPLASH_DURATION_MS = 6000
export const SPLASH_EMBLEM_AT_MS = 3500

type StartupSplashProps = {
  durationMs?: number
  emblemAtMs?: number
  onDone: () => void
}

export function StartupSplash({
  durationMs = SPLASH_DURATION_MS,
  emblemAtMs = SPLASH_EMBLEM_AT_MS,
  onDone
}: StartupSplashProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const doneRef = useRef(false)
  const finishRef = useRef((): void => undefined)
  const [emblem, setEmblem] = useState(false)

  useEffect(() => {
    finishRef.current = () => {
      if (!doneRef.current) {
        doneRef.current = true
        onDone()
      }
    }
    const timer = window.setTimeout(() => finishRef.current(), durationMs)
    const emblemTimer = window.setTimeout(() => setEmblem(true), emblemAtMs)
    const onKey = (): void => finishRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(emblemTimer)
      window.removeEventListener('keydown', onKey)
    }
  }, [durationMs, emblemAtMs, onDone])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fit = (): void => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio
      canvas.height = canvas.clientHeight * window.devicePixelRatio
    }
    fit()
    const engine = new StarfieldEngine({ width: canvas.width, height: canvas.height })
    const palette = {
      background: '#030712',
      streak: (hue: number, alpha: number): string =>
        `hsla(${Math.round(hue)}, 90%, 65%, ${alpha.toFixed(3)})`,
      flash: '#e0f2ff'
    }
    paintStarfield(ctx, engine, palette)
    if (reduced) {
      return
    }
    let raf = 0
    let last = performance.now()
    engine.burst(110)
    const frame = (now: number): void => {
      engine.step((now - last) / 1000)
      last = now
      paintStarfield(ctx, engine, palette)
      raf = window.requestAnimationFrame(frame)
    }
    raf = window.requestAnimationFrame(frame)
    const observer = new ResizeObserver(() => fit())
    observer.observe(canvas)
    return () => {
      window.cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      data-testid="startup-splash"
      role="presentation"
      onClick={() => finishRef.current()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
    >
      <canvas
        ref={canvasRef}
        data-testid="startup-splash-canvas"
        className="absolute inset-0 h-full w-full"
      />
      <div
        data-testid="startup-splash-emblem"
        data-visible={emblem}
        className={`relative flex flex-col items-center transition-opacity duration-1000 ${emblem ? 'opacity-100' : 'opacity-0'}`}
      >
        <img src={crestUrl} alt="Vantrilex crest" className="h-40 w-40 object-contain" />
        <div className="mt-6 text-2xl font-semibold tracking-wide text-white">Vantrilex</div>
        <div className="mt-2 text-sm text-white/60">Agentic Workbench</div>
      </div>
    </div>
  )
}
