export type Mode = 'R1' | 'R2' | 'R3'

export type UserWordProgress = {
  wordId: string
  exposures: number
  gate: '24h' | '48h' | '72h' | string
  lastSeen: string | number | Date
}

export type Word = {
  id: string
  text: string
  week: number
  [key: string]: unknown
}

export type ExerciseReason = 'due' | 'new' | 'upcoming'

export type Exercise = {
  word: Word
  mode: Mode
  reason: ExerciseReason
  progress?: UserWordProgress
  dueAt?: Date
  overdueByMs?: number
}

const SCORE_CORRECT = 1.0
const SCORE_UNCHOSEN = 0.5
const SCORE_INCORRECT = -0.5

export const SCORE = {
  CORRECT: SCORE_CORRECT,
  UNCHOSEN: SCORE_UNCHOSEN,
  INCORRECT: SCORE_INCORRECT,
} as const

export const GATES = ['24h', '48h', '72h', '72h'] as const

const GATE_DURATION_MS: Record<typeof GATES[number], number> = {
  '24h': 24 * 60 * 60 * 1000,
  '48h': 48 * 60 * 60 * 1000,
  '72h': 72 * 60 * 60 * 1000,
}

export function getNextDue(gate: string, lastSeen: Date): Date {
  const normalizedGate = gate in GATE_DURATION_MS ? gate : '24h'
  const delay = GATE_DURATION_MS[normalizedGate as keyof typeof GATE_DURATION_MS]
  return new Date(lastSeen.getTime() + delay)
}

function parseLastSeen(value: string | number | Date): Date {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  return new Date(value)
}

export function isWordDue(progress: UserWordProgress, now: Date): boolean {
  if (progress.exposures <= 0) {
    return false
  }

  const lastSeen = parseLastSeen(progress.lastSeen)
  const nextDue = getNextDue(progress.gate, lastSeen)
  return now.getTime() >= nextDue.getTime()
}

export function getModeFromExposures(exposures: number): Mode {
  if (exposures <= 2) return 'R1'
  if (exposures <= 7) return 'R2'
  return 'R3'
}

function buildExercise(
  word: Word,
  mode: Mode,
  reason: ExerciseReason,
  progress?: UserWordProgress,
  dueAt?: Date,
  overdueByMs?: number
): Exercise {
  return { word, mode, reason, progress, dueAt, overdueByMs }
}

function compareOverdueDesc(a: Exercise, b: Exercise): number {
  return (b.overdueByMs ?? 0) - (a.overdueByMs ?? 0)
}

function compareNextDueAsc(a: Exercise, b: Exercise): number {
  const aDue = a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER
  const bDue = b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER
  return aDue - bDue
}

export function buildSessionQueue(
  userProgress: UserWordProgress[],
  allWords: Word[],
  currentWeek: number,
  targetNewWords: number = 10
): Exercise[] {
  const now = new Date()
  const progressByWordId = new Map(userProgress.map((progress) => [progress.wordId, progress]))

  type DueExercise = {
    word: Word
    mode: Mode
    reason: 'due'
    progress: UserWordProgress
    dueAt: Date
    overdueByMs: number
  }

  const dueExercises: Exercise[] = userProgress
    .map((progress) => {
      const word = allWords.find((wordItem) => wordItem.id === progress.wordId)
      if (!word) return null
      const lastSeen = parseLastSeen(progress.lastSeen)
      const nextDue = getNextDue(progress.gate, lastSeen)
      const overdueByMs = Math.max(0, now.getTime() - nextDue.getTime())
      return {
        word,
        mode: getModeFromExposures(progress.exposures),
        reason: 'due' as const,
        progress,
        dueAt: nextDue,
        overdueByMs,
      }
    })
    .filter((exercise): exercise is DueExercise => exercise !== null && isWordDue(exercise.progress, now))
    .sort(compareOverdueDesc)

  const newWordExercises: Exercise[] = allWords
    .filter((word) => word.week === currentWeek && !progressByWordId.has(word.id))
    .slice(0, targetNewWords)
    .map((word) => buildExercise(word, 'R1', 'new'))

  const sessionQueue: Exercise[] = [...dueExercises, ...newWordExercises]

  if (sessionQueue.length >= 25) {
    return sessionQueue.slice(0, 25)
  }

  const upcomingExercises: Exercise[] = userProgress
    .map((progress) => {
      const word = allWords.find((wordItem) => wordItem.id === progress.wordId)
      if (!word) return null
      const lastSeen = parseLastSeen(progress.lastSeen)
      const nextDue = getNextDue(progress.gate, lastSeen)
      return buildExercise(
        word,
        getModeFromExposures(progress.exposures),
        'upcoming',
        progress,
        nextDue,
        Math.max(0, now.getTime() - nextDue.getTime())
      )
    })
    .filter((exercise): exercise is Exercise => Boolean(exercise) && !sessionQueue.some((e) => e.word.id === exercise.word.id))
    .sort(compareNextDueAsc)

  const fallbackExercises = upcomingExercises.slice(0, 25 - sessionQueue.length)
  return [...sessionQueue, ...fallbackExercises]
}
