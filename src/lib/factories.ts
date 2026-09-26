import type {
  Exercise,
  ISODate,
  Routine,
  SessionExercise,
  SetEntry,
  WorkoutSession,
} from '../types'
import { createId, nowIso } from './id'
import type { LastRecord } from './selectors'

/** 空の入力値を作るファクトリ群 */

/** 直前のセットの値をコピーしたセットを作る（無ければ空欄） */
export function createSet(prev?: SetEntry): SetEntry {
  const { id: _id, ...values } = prev ?? { id: '' }
  return { id: createId(), ...values }
}

/**
 * 種目を追加したときの記録を作る。
 * 1セット目には前回記録の最終セットの値（と加重トグルの状態）を入れる。前回が無ければ空欄。
 */
export function createSessionExercise(
  exercise: Exercise,
  last?: LastRecord,
): SessionExercise {
  const entry: SessionExercise = {
    id: createId(),
    exerciseId: exercise.id,
    nameSnapshot: exercise.name,
    recordTypeSnapshot: exercise.recordType,
    muscleGroupIds: exercise.bodyPart ? [exercise.bodyPart] : [],
    sets: [createSet(last?.lastSet)],
  }
  if (last?.weighted && exercise.recordType === 'reps' && exercise.allowOptionalWeight) {
    entry.weighted = true
  }
  return entry
}

export function createSession(date: ISODate): WorkoutSession {
  const timestamp = nowIso()
  return {
    id: createId(),
    date,
    exercises: [],
    memo: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createRoutine(): Routine {
  const timestamp = nowIso()
  return {
    id: createId(),
    name: '',
    description: '',
    exercises: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

const hasAnyValue = (set: SetEntry) =>
  set.reps !== undefined || set.weight !== undefined || set.seconds !== undefined

/**
 * ルーティンから、その日の記録用セッションを作る。
 * セットの値はテンプレートに保存した値。保存値が無い種目は、前回記録の最終セットの値で埋める。
 */
export function sessionFromRoutine(
  routine: Routine,
  date: ISODate,
  lastRecordOf: (exerciseId: string) => LastRecord | undefined,
): WorkoutSession {
  const timestamp = nowIso()
  return {
    id: createId(),
    date,
    exercises: routine.exercises.map((exercise) => {
      const hasTemplateValues = exercise.sets.some(hasAnyValue)
      const last = hasTemplateValues ? undefined : lastRecordOf(exercise.exerciseId)
      const sets =
        exercise.sets.length > 0
          ? exercise.sets.map((set) => (last ? createSet(last.lastSet) : createSet(set)))
          : [createSet(last?.lastSet)]
      return {
        ...exercise,
        id: createId(),
        muscleGroupIds: [...exercise.muscleGroupIds],
        ...(last?.weighted ? { weighted: true } : {}),
        sets,
      }
    }),
    memo: routine.name,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

/** 既存のセッションからルーティンを作る */
export function routineFromSession(session: WorkoutSession, name: string): Routine {
  const timestamp = nowIso()
  return {
    id: createId(),
    name,
    description: '',
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      id: createId(),
      muscleGroupIds: [...exercise.muscleGroupIds],
      sets: exercise.sets.map((set) => createSet(set)),
    })),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
