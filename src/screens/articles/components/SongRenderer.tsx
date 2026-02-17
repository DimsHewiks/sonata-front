'use client'

import { useMemo } from 'react'

import type { ChordsNotation } from '@/shared/types/article'
import { cn } from '@/lib/utils'

interface SongRendererProps {
  body: string
  notation: ChordsNotation
  transpose: number
  showChords: boolean
}

interface SongBlock {
  type: string
  title: string | null
  lines: string[]
}

const STANDARD_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const GERMAN_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'B', 'H']

const NOTE_INDEX: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  H: 11,
}

const parseBlocks = (input: string): SongBlock[] => {
  const lines = input.split(/\r?\n/)
  const blocks: SongBlock[] = []
  let current: SongBlock | null = null

  const pushBlock = () => {
    if (current) {
      blocks.push(current)
    }
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd()
    if (line.startsWith('@block')) {
      pushBlock()
      const [, type = 'default', ...titleParts] = line.split(/\s+/)
      const title = titleParts.length ? titleParts.join(' ') : null
      current = { type, title, lines: [] }
      return
    }

    if (!current) {
      current = { type: 'default', title: null, lines: [] }
    }

    current.lines.push(rawLine)
  })

  pushBlock()
  return blocks
}

const parseChordLine = (line: string) => {
  const chords: Array<{ pos: number; value: string }> = []
  let text = ''
  let i = 0

  while (i < line.length) {
    const char = line[i]
    if (char === '[') {
      const closing = line.indexOf(']', i)
      if (closing !== -1) {
        const chord = line.slice(i + 1, closing).trim()
        if (chord) {
          chords.push({ pos: text.length, value: chord })
        }
        i = closing + 1
        continue
      }
    }

    text += char
    i += 1
  }

  return { text, chords }
}

const normalizeInputNote = (note: string, notation: ChordsNotation): string => {
  if (notation === 'german') {
    if (note === 'B') {
      return 'Bb'
    }
    if (note === 'H') {
      return 'B'
    }
  }

  return note
}

const formatOutputNote = (index: number, notation: ChordsNotation): string => {
  return notation === 'german' ? GERMAN_NOTES[index] : STANDARD_NOTES[index]
}

const transposeChord = (
  chord: string,
  steps: number,
  notation: ChordsNotation,
): string => {
  if (!chord) {
    return chord
  }

  const [rootPart, bassPart] = chord.split('/')
  const match = rootPart.match(/^([A-GH])([#b]?)(.*)$/)
  if (!match) {
    return chord
  }

  const rawRoot = `${match[1]}${match[2]}`
  const suffix = match[3] ?? ''
  const normalizedRoot = normalizeInputNote(rawRoot, notation)
  const rootIndex = NOTE_INDEX[normalizedRoot]
  if (rootIndex === undefined) {
    return chord
  }

  const nextRoot = formatOutputNote((rootIndex + steps + 12 * 10) % 12, notation)

  let nextBass = ''
  if (bassPart) {
    const bassMatch = bassPart.match(/^([A-GH])([#b]?)(.*)$/)
    if (bassMatch) {
      const rawBass = `${bassMatch[1]}${bassMatch[2]}`
      const normalizedBass = normalizeInputNote(rawBass, notation)
      const bassIndex = NOTE_INDEX[normalizedBass]
      if (bassIndex !== undefined) {
        const outputBass = formatOutputNote((bassIndex + steps + 12 * 10) % 12, notation)
        nextBass = `/${outputBass}${bassMatch[3] ?? ''}`
      } else {
        nextBass = `/${bassPart}`
      }
    } else {
      nextBass = `/${bassPart}`
    }
  }

  return `${nextRoot}${suffix}${nextBass}`
}

export const SongRenderer = ({ body, notation, transpose, showChords }: SongRendererProps) => {
  const blocks = useMemo(() => parseBlocks(body), [body])

  return (
    <div className="space-y-6 rounded-md border border-primary/15 bg-primary/5 p-4 font-mono text-[15px] leading-7">
      {blocks.map((block, index) => (
        <div key={`${block.type}-${index}`} className="space-y-2">
          {block.title ? (
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {block.title}
            </div>
          ) : null}
          <div className="space-y-3 font-mono">
            {block.lines.map((line, lineIndex) => {
              const parsed = parseChordLine(line)
              return (
                <div
                  key={`${block.type}-${lineIndex}`}
                  className="whitespace-pre-wrap"
                >
                  <div className="relative h-5 text-sm leading-5 text-primary">
                    {showChords
                      ? parsed.chords.map((chord, chordIndex) => (
                          <span
                            key={`${block.type}-${lineIndex}-c-${chordIndex}`}
                            className="absolute left-0 top-0 font-medium"
                            style={{ transform: `translateX(${chord.pos}ch)` }}
                          >
                            {transposeChord(chord.value, transpose, notation)}
                          </span>
                        ))
                      : null}
                  </div>
                  <div className="whitespace-pre-wrap leading-6">{parsed.text}</div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
