import { useRef, useState } from 'react'
import { translate } from '@/i18n/i18n'
import type { VoiceChoice } from './VoiceSelector'

export type MicBridge = {
  getArmed: () => boolean
  setArmed: (armed: boolean) => Promise<void>
}

export type VoiceLoop = {
  transcribe: (audio: number[]) => Promise<{ text: string }>
  think: (prompt: string) => Promise<{ reply: string }>
  speak: (text: string, voice: VoiceChoice) => Promise<{ audio: number[] }>
}

export type CommandTarget = {
  send: (input: string) => Promise<unknown>
}

export type RecorderFactory = (
  stream: MediaStream
) => Pick<MediaRecorder, 'start' | 'stop' | 'ondataavailable' | 'onstop'>

export type AudioFactory = (url: string) => { play: () => Promise<void> }

const MAX_CAPTURE_MS = 30_000

export function extractCommands(reply: string): string[] {
  return reply
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('!run '))
    .map((line) => line.slice('!run '.length).trim())
    .filter((command) => command !== '')
}

export function MicToggle({
  bridge,
  iconOnly,
  loop,
  voice = 'male',
  terminal = null,
  createRecorder,
  createAudio
}: {
  bridge: MicBridge
  iconOnly?: boolean
  loop?: VoiceLoop
  voice?: VoiceChoice
  terminal?: CommandTarget | null
  createRecorder?: RecorderFactory
  createAudio?: AudioFactory
}) {
  const [armed, setArmed] = useState(bridge.getArmed())
  const [status, setStatus] = useState<string | null>(null)
  const recorder = useRef<Pick<
    MediaRecorder,
    'start' | 'stop' | 'ondataavailable' | 'onstop'
  > | null>(null)
  const stopTimer = useRef<number | null>(null)

  async function finish(chunks: Blob[]): Promise<void> {
    if (!loop) {
      return
    }
    try {
      const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer())
      setStatus('Transcribing…')
      const { text } = await loop.transcribe([...bytes])
      setStatus('Thinking…')
      const { reply } = await loop.think(text)
      for (const command of extractCommands(reply)) {
        await terminal?.send(`${command}\n`)
      }
      setStatus('Speaking…')
      const clip = await loop.speak(reply, voice)
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(clip.audio)], { type: 'audio/mpeg' })
      )
      await (createAudio ?? ((link) => new Audio(link)))(url).play()
      setStatus(null)
    } catch (error) {
      setStatus((error as Error).message)
    }
  }

  async function disarm(): Promise<void> {
    if (stopTimer.current !== null) {
      window.clearTimeout(stopTimer.current)
      stopTimer.current = null
    }
    const active = recorder.current
    recorder.current = null
    if (active) {
      active.stop()
    }
    await bridge.setArmed(false)
    setArmed(false)
  }

  async function startCapture(): Promise<void> {
    if (!loop) {
      return
    }
    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true })
      const active = (createRecorder ?? ((input) => new MediaRecorder(input)))(stream)
      const chunks: Blob[] = []
      active.ondataavailable = (event: BlobEvent) => {
        chunks.push(event.data)
      }
      active.onstop = () => {
        void finish(chunks)
      }
      recorder.current = active
      active.start()
      stopTimer.current = window.setTimeout(() => {
        void disarm()
      }, MAX_CAPTURE_MS)
    } catch {
      setStatus('Microphone unavailable — check audio permissions')
      await bridge.setArmed(false)
      setArmed(false)
    }
  }

  async function toggle(): Promise<void> {
    const next = !armed
    await bridge.setArmed(next)
    setArmed(next)
    await (next ? startCapture() : disarm())
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        data-testid="mic-toggle"
        type="button"
        aria-pressed={armed}
        aria-label={translate(
          'auto.components.status.bar.VantrilexTriggers.micToggleLabel',
          armed ? 'Disarm voice input' : 'Arm voice input'
        )}
        className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => {
          void toggle()
        }}
      >
        <span aria-hidden>{armed ? '🎙' : '🎙̶'}</span>
        {iconOnly ? null : (
          <span data-testid="mic-toggle-label">{armed ? 'Mic on' : 'Mic off'}</span>
        )}
      </button>
      {status ? <span data-testid="voice-status">{status}</span> : null}
    </span>
  )
}
