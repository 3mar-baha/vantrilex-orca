import type { VoiceChoice } from '../voice/tts'
import type { TaskConclusion } from './terminal-watcher'

export type BrainLike = {
  think: (prompt: string) => Promise<{ reply: string; ms: number }>
}

export type TtsLike = {
  speak: (
    text: string,
    voice: VoiceChoice
  ) => Promise<{ audio: Uint8Array; voice: VoiceChoice; ms: number }>
}

export type BriefingDeps = {
  brain: BrainLike
  tts: TtsLike
}

export type BriefingResult = {
  spoken: boolean
  summary: string
}

export async function briefConclusion(
  deps: BriefingDeps,
  conclusion: TaskConclusion,
  options: { armed: boolean; voice: VoiceChoice }
): Promise<BriefingResult> {
  if (!options.armed) {
    return { spoken: false, summary: '' }
  }
  try {
    const outcome =
      conclusion.exitCode === null
        ? 'the session went quiet'
        : conclusion.exitCode === 0
          ? 'the session exited cleanly'
          : `the session exited with code ${conclusion.exitCode}`
    const { reply } = await deps.brain.think(
      [
        'Summarize this runner session for a spoken status briefing.',
        `Outcome: ${outcome}.`,
        'Keep it to two short spoken sentences.',
        'Transcript tail:',
        conclusion.transcript.slice(-4000)
      ].join('\n')
    )
    await deps.tts.speak(reply, options.voice)
    return { spoken: true, summary: reply }
  } catch {
    return { spoken: false, summary: '' }
  }
}
