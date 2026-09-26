import { useState } from 'react'
import type { Exercise, RecordType } from '../types'
import { useApp } from '../store/useApp'
import { useScrollLock } from '../hooks/useScrollLock'
import { createCustomExerciseId, isNameTaken } from '../lib/exerciseCatalog'
import { RECORD_TYPE_LABELS } from '../lib/format'

const NAME_MAX = 30
const HINT_MAX = 60

/** カスタム種目の作成・編集（全画面） */
export function CustomExerciseForm({
  initial,
  defaultName = '',
  inUse = false,
  onSaved,
  onClose,
}: {
  /** 編集対象。無ければ新規作成 */
  initial?: Exercise
  /** 新規作成時の名前の初期値（検索欄の文字など） */
  defaultName?: string
  /** 記録・ルーティンで使用中か（使用中なら記録タイプを変更できない） */
  inUse?: boolean
  onSaved: (exercise: Exercise) => void
  onClose: () => void
}) {
  const { catalog, muscleGroups, saveCustomExercise } = useApp()
  useScrollLock(true)

  const [name, setName] = useState(initial?.name ?? defaultName.trim().slice(0, NAME_MAX))
  const [kana, setKana] = useState(initial?.kana ?? '')
  const [bodyPart, setBodyPart] = useState(
    initial && muscleGroups.some((g) => g.id === initial.bodyPart) ? initial.bodyPart : '',
  )
  const [recordType, setRecordType] = useState<RecordType | ''>(initial?.recordType ?? '')
  const [allowOptionalWeight, setAllowOptionalWeight] = useState(
    initial?.allowOptionalWeight ?? false,
  )
  const [unilateral, setUnilateral] = useState(initial?.unilateral ?? false)
  const [hint, setHint] = useState(initial?.hint ?? '')
  const [showErrors, setShowErrors] = useState(false)

  const trimmed = name.trim()
  const errors = {
    name: !trimmed
      ? '名前を入力してください'
      : trimmed.length > NAME_MAX
        ? `${NAME_MAX}文字以内で入力してください`
        : isNameTaken(catalog, trimmed, initial?.id)
          ? '同じ名前の種目がすでにあります'
          : null,
    bodyPart: bodyPart ? null : '部位を選んでください',
    recordType: recordType ? null : '記録タイプを選んでください',
    hint: hint.length > HINT_MAX ? `${HINT_MAX}文字以内で入力してください` : null,
  }
  const hasError = Object.values(errors).some(Boolean)

  const handleSave = async () => {
    if (hasError || !recordType) {
      setShowErrors(true)
      return
    }
    const exercise: Exercise = {
      id: initial?.id ?? createCustomExerciseId(),
      name: trimmed,
      kana: kana.trim(),
      aliases: initial?.aliases ?? [],
      bodyPart,
      recordType,
      allowOptionalWeight: recordType === 'reps' && allowOptionalWeight,
      unilateral,
      hint: hint.trim(),
      order: initial?.order ?? 0,
      builtIn: false,
      ...(initial?.image ? { image: initial.image } : {}),
    }
    await saveCustomExercise(exercise)
    onSaved(exercise)
  }

  const fieldError = (message: string | null) =>
    showErrors && message ? <p className="mt-1 text-xs text-red-500">{message}</p> : null

  return (
    <div className="fixed inset-0 z-[65] flex flex-col bg-white">
      <header className="safe-top border-b border-slate-100">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button type="button" onClick={onClose} className="text-sm text-slate-500">
            キャンセル
          </button>
          <h2 className="text-base font-semibold text-slate-800">
            {initial ? 'カスタム種目を編集' : '新しい種目を作成'}
          </h2>
          <span className="w-16" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-lg space-y-5 px-4 py-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
              名前（必須・{NAME_MAX}文字以内）
            </span>
            <input
              type="text"
              value={name}
              maxLength={NAME_MAX}
              placeholder="例: 懸垂"
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-400 ${
                showErrors && errors.name ? 'border-red-400' : 'border-slate-200'
              }`}
              onChange={(e) => setName(e.target.value)}
            />
            {fieldError(errors.name)}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
              読み（任意・ひらがな。検索に使います）
            </span>
            <input
              type="text"
              value={kana}
              placeholder="例: けんすい"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
              onChange={(e) => setKana(e.target.value)}
            />
          </label>

          <fieldset>
            <legend className="mb-1.5 text-xs font-medium text-slate-500">部位（必須）</legend>
            <div className="flex flex-wrap gap-1.5">
              {muscleGroups.map((group) => {
                const isOn = bodyPart === group.id
                return (
                  <button
                    key={group.id}
                    type="button"
                    aria-pressed={isOn}
                    onClick={() => setBodyPart(group.id)}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium"
                    style={
                      isOn
                        ? { backgroundColor: group.color, borderColor: group.color, color: '#fff' }
                        : { backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#64748b' }
                    }
                  >
                    {group.name}
                  </button>
                )
              })}
            </div>
            {fieldError(errors.bodyPart)}
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-xs font-medium text-slate-500">記録タイプ（必須）</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(RECORD_TYPE_LABELS) as RecordType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={recordType === type}
                  disabled={inUse}
                  onClick={() => setRecordType(type)}
                  className={`rounded-lg border py-2 text-xs font-medium disabled:opacity-50 ${
                    recordType === type
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {RECORD_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            {inUse && (
              <p className="mt-1 text-xs text-slate-400">
                この種目はすでに記録で使われているため、記録タイプは変更できません。
              </p>
            )}
            {fieldError(errors.recordType)}
          </fieldset>

          <div className="space-y-2">
            {recordType === 'reps' && (
              <label className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-700">
                  加重を記録できる
                  <span className="block text-[11px] text-slate-400">
                    ダンベルなどを持って負荷を足すことがある自重種目
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={allowOptionalWeight}
                  onChange={(e) => setAllowOptionalWeight(e.target.checked)}
                  className="h-5 w-5 accent-indigo-600"
                />
              </label>
            )}
            <label className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
              <span className="text-sm text-slate-700">
                片側ずつ行う
                <span className="block text-[11px] text-slate-400">回数は片側の回数を記録します</span>
              </span>
              <input
                type="checkbox"
                checked={unilateral}
                onChange={(e) => setUnilateral(e.target.checked)}
                className="h-5 w-5 accent-indigo-600"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
              ヒント（任意・{HINT_MAX}文字以内）
            </span>
            <input
              type="text"
              value={hint}
              maxLength={HINT_MAX}
              placeholder="例: 肩幅より少し広く握る"
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-400 ${
                showErrors && errors.hint ? 'border-red-400' : 'border-slate-200'
              }`}
              onChange={(e) => setHint(e.target.value)}
            />
            {fieldError(errors.hint)}
          </label>
        </div>
      </div>

      <footer className="safe-bottom border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-lg px-4 py-3">
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white"
          >
            保存
          </button>
        </div>
      </footer>
    </div>
  )
}
