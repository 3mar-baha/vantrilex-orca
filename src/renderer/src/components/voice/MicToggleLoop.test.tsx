// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MicToggle, type VoiceLoop } from './MicToggle'

class FakeRecorder {
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  started = false
  stopped = false
  constructor(_stream: unknown) {}
  start() {
    this.started = true
  }
  stop() {
    this.stopped = true
    this.ondataavailable?.({ data: new Blob(['audio-bytes']) })
    this.onstop?.()
  }
}

function fakeLoop(sent: string[]): VoiceLoop {
  return {
    transcribe: async (audio: number[]) => {
      sent.push(`transcribe:${audio.length}`)
      return { text: 'status update !run git status' }
    },
    think: async (prompt: string) => {
      sent.push(`think:${prompt}`)
      return { reply: 'all green\n!run git status' }
    },
    speak: async (text: string, voice: string) => {
      sent.push(`speak:${voice}:${text}`)
      return { audio: [7, 7] }
    }
  }
}

const bridge = { getArmed: () => false, setArmed: async () => {} }

function stubMedia(stream: unknown = {}) {
  Object.defineProperty(window.navigator, 'mediaDevices', {
    value: { getUserMedia: vi.fn(async () => stream) },
    configurable: true
  })
}

afterEach(() => {
  cleanup()
})

describe('mic voice loop', () => {
  it('runs capture to playback in order on toggle off', async () => {
    stubMedia()
    const sent: string[] = []
    const played: string[] = []
    let recorder: FakeRecorder | null = null
    render(
      <TooltipProvider>
        <MicToggle
          bridge={bridge}
          loop={fakeLoop(sent)}
          voice="female"
          createRecorder={(stream) => {
            recorder = new FakeRecorder(stream)
            return recorder as unknown as MediaRecorder
          }}
          createAudio={(url) => {
            played.push(url)
            return { play: async () => {} }
          }}
        />
      </TooltipProvider>
    )
    screen.getByTestId('mic-toggle').click()
    await vi.waitFor(() => {
      expect(recorder?.started).toBe(true)
    })
    screen.getByTestId('mic-toggle').click()
    await vi.waitFor(() => {
      expect(played.length).toBe(1)
    })
    expect(sent[0]).toMatch(/^transcribe:/)
    expect(sent[1]).toMatch(/^think:/)
    expect(sent[2]).toMatch(/^speak:female:/)
    expect(played[0]).toMatch(/^blob:/)
  })

  it('forwards bang-run commands to the terminal target', async () => {
    stubMedia()
    const delivered: string[] = []
    const sent: string[] = []
    render(
      <TooltipProvider>
        <MicToggle
          bridge={bridge}
          loop={fakeLoop(sent)}
          terminal={{ send: async (input: string) => void delivered.push(input) }}
          createRecorder={(stream) => new FakeRecorder(stream) as unknown as MediaRecorder}
          createAudio={() => ({ play: async () => {} })}
        />
      </TooltipProvider>
    )
    screen.getByTestId('mic-toggle').click()
    await new Promise((resolve) => setTimeout(resolve, 10))
    screen.getByTestId('mic-toggle').click()
    await vi.waitFor(() => {
      expect(delivered).toEqual(['git status\n'])
    })
  })

  it('opens key intake on missing-keys failures instead of raw errors', async () => {
    stubMedia()
    const onMissingKeys = vi.fn()
    const onError = vi.fn()
    const keylessLoop = {
      transcribe: async () => {
        throw new Error("Keyring pool 'groq' has no keys")
      },
      think: async () => ({ reply: '' }),
      speak: async () => ({ audio: [] as number[] })
    }
    render(
      <TooltipProvider>
        <MicToggle
          bridge={bridge}
          loop={keylessLoop}
          createRecorder={(stream) => new FakeRecorder(stream) as unknown as MediaRecorder}
          createAudio={() => ({ play: async () => {} })}
          onMissingKeys={onMissingKeys}
          onError={onError}
        />
      </TooltipProvider>
    )
    screen.getByTestId('mic-toggle').click()
    await new Promise((resolve) => setTimeout(resolve, 10))
    screen.getByTestId('mic-toggle').click()
    await vi.waitFor(() => {
      expect(onMissingKeys).toHaveBeenCalledTimes(1)
    })
    expect(onError).not.toHaveBeenCalled()
    expect(screen.getByTestId('voice-status').textContent).toMatch(/keys missing/i)
  })

  it('routes non-key failures to the error toast channel', async () => {
    stubMedia()
    const onError = vi.fn()
    const failingLoop = {
      transcribe: async () => {
        throw new Error('provider timeout')
      },
      think: async () => ({ reply: '' }),
      speak: async () => ({ audio: [] as number[] })
    }
    render(
      <TooltipProvider>
        <MicToggle
          bridge={bridge}
          loop={failingLoop}
          createRecorder={(stream) => new FakeRecorder(stream) as unknown as MediaRecorder}
          createAudio={() => ({ play: async () => {} })}
          onError={onError}
        />
      </TooltipProvider>
    )
    screen.getByTestId('mic-toggle').click()
    await new Promise((resolve) => setTimeout(resolve, 10))
    screen.getByTestId('mic-toggle').click()
    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith('provider timeout')
    })
    expect(screen.queryByTestId('voice-status')).toBeNull()
  })

  it('reports microphone denial without crashing', async () => {
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn(async () => {
          throw new Error('denied')
        })
      },
      configurable: true
    })
    render(
      <TooltipProvider>
        <MicToggle
          bridge={bridge}
          loop={fakeLoop([])}
          createAudio={() => ({ play: async () => {} })}
        />
      </TooltipProvider>
    )
    screen.getByTestId('mic-toggle').click()
    await vi.waitFor(() => {
      expect(screen.getByTestId('voice-status').textContent).toMatch(/microphone/i)
    })
  })
})
