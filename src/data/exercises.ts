import type { Exercise, RecordType } from '../types'

/**
 * 種目マスタ（初期収録の種目）。
 *
 * 種目を追加するときの注意（README の「種目の追加」も参照）：
 * - id は英小文字とハイフン。記録データはこの id で種目を参照するので、一度公開したら変更しない
 * - イラストは public/exercises/<id>.svg に置く
 * - 追加・変更したら package.json の version を上げる（Service Worker のキャッシュが更新される）
 * - bodyPart は部位タグの id（src/lib/constants.ts の DEFAULT_MUSCLE_GROUPS）
 * - aliases は旧データの名前照合と検索に使う。別の種目と取り違えそうな表記は入れない
 */

type Def = {
  id: string
  name: string
  kana: string
  aliases?: string[]
  recordType: RecordType
  allowOptionalWeight?: boolean
  unilateral?: boolean
  hint: string
}

function group(bodyPart: string, defs: Def[]): Exercise[] {
  return defs.map((def, order) => ({
    aliases: [],
    allowOptionalWeight: false,
    unilateral: false,
    ...def,
    bodyPart,
    order,
    builtIn: true,
  }))
}

export const MASTER_EXERCISES: Exercise[] = [
  ...group('chest', [
    {
      id: 'push-up',
      name: 'プッシュアップ（腕立て伏せ）',
      kana: 'ぷっしゅあっぷ うでたてふせ',
      aliases: ['腕立て伏せ', '腕立て', '腕立てふせ', 'プッシュアップ', 'ノーマルプッシュアップ', 'push up', 'pushup'],
      recordType: 'reps',
      allowOptionalWeight: true,
      hint: '基本。プッシュアップバーを使うと深く下ろせて負荷アップ',
    },
    {
      id: 'wide-push-up',
      name: 'ワイドプッシュアップ',
      kana: 'わいどぷっしゅあっぷ',
      aliases: ['ワイド腕立て', 'ワイド腕立て伏せ', '手幅広め腕立て'],
      recordType: 'reps',
      hint: '手幅を広げて胸の外側を狙う',
    },
    {
      id: 'decline-push-up',
      name: 'デクラインプッシュアップ',
      kana: 'でくらいんぷっしゅあっぷ',
      aliases: ['足上げ腕立て', 'デクライン腕立て', '足上げプッシュアップ'],
      recordType: 'reps',
      hint: '足を椅子に乗せて胸上部を狙う',
    },
    {
      id: 'dumbbell-floor-press',
      name: 'ダンベルフロアプレス',
      kana: 'だんべるふろあぷれす',
      aliases: ['フロアプレス', 'DBフロアプレス'],
      recordType: 'weightReps',
      hint: '床に寝てダンベルを押し上げる',
    },
    {
      id: 'dumbbell-fly-floor',
      name: 'ダンベルフライ（床）',
      kana: 'だんべるふらい ゆか',
      aliases: ['ダンベルフライ', 'フライ', 'DBフライ'],
      recordType: 'weightReps',
      hint: '腕を開閉して胸をストレッチ',
    },
  ]),
  ...group('back', [
    {
      id: 'one-arm-dumbbell-row',
      name: 'ワンハンドダンベルロウ',
      kana: 'わんはんどだんべるろう',
      aliases: ['ワンハンドロウ', 'ワンアームロウ', 'ワンアームダンベルロウ', '片手ロウ', 'ダンベルロウ', 'ワンハンドローイング'],
      recordType: 'weightReps',
      unilateral: true,
      hint: '椅子に片手をついて引く。背中の定番',
    },
    {
      id: 'dumbbell-bent-over-row',
      name: 'ベントオーバーロウ（ダンベル）',
      kana: 'べんとおーばーろう だんべる',
      aliases: ['ベントオーバーロウ', 'ダンベルベントオーバーロウ', 'ベントロウ', 'ベントオーバーローイング'],
      recordType: 'weightReps',
      hint: '前傾して両手で引く',
    },
    {
      id: 'dumbbell-pullover',
      name: 'ダンベルプルオーバー',
      kana: 'だんべるぷるおーばー',
      aliases: ['プルオーバー'],
      recordType: 'weightReps',
      hint: '床や椅子に寝て頭上から弧を描く',
    },
    {
      id: 'back-extension',
      name: 'バックエクステンション',
      kana: 'ばっくえくすてんしょん',
      aliases: ['背筋', '背筋運動', 'ハイパーエクステンション'],
      recordType: 'reps',
      allowOptionalWeight: true,
      hint: 'うつ伏せで上体を反らす（脊柱起立筋）',
    },
    {
      id: 'superman',
      name: 'スーパーマン',
      kana: 'すーぱーまん',
      aliases: ['スーパーマン体操'],
      recordType: 'reps',
      hint: 'うつ伏せで手足を同時に上げる',
    },
  ]),
  ...group('shoulder', [
    {
      id: 'dumbbell-shoulder-press',
      name: 'ダンベルショルダープレス',
      kana: 'だんべるしょるだーぷれす',
      aliases: ['ショルダープレス', 'DBショルダープレス'],
      recordType: 'weightReps',
      hint: '座るか立って頭上に押す',
    },
    {
      id: 'side-raise',
      name: 'サイドレイズ',
      kana: 'さいどれいず',
      aliases: ['ラテラルレイズ', 'サイドラテラルレイズ'],
      recordType: 'weightReps',
      hint: '横に上げて肩の丸みを作る',
    },
    {
      id: 'front-raise',
      name: 'フロントレイズ',
      kana: 'ふろんとれいず',
      recordType: 'weightReps',
      hint: '前に上げて前部を狙う',
    },
    {
      id: 'rear-raise',
      name: 'リアレイズ',
      kana: 'りあれいず',
      aliases: ['リアラテラルレイズ', 'リアデルトレイズ'],
      recordType: 'weightReps',
      hint: '前傾して横に開き、後部を狙う',
    },
    {
      id: 'pike-push-up',
      name: 'パイクプッシュアップ',
      kana: 'ぱいくぷっしゅあっぷ',
      aliases: ['パイク腕立て'],
      recordType: 'reps',
      hint: 'お尻を高くした腕立て。自重で肩を鍛える',
    },
  ]),
  ...group('arm', [
    {
      id: 'dumbbell-curl',
      name: 'ダンベルカール',
      kana: 'だんべるかーる',
      aliases: ['アームカール', 'ダンベルアームカール', 'バイセップスカール', 'カール'],
      recordType: 'weightReps',
      hint: '二頭筋の基本',
    },
    {
      id: 'hammer-curl',
      name: 'ハンマーカール',
      kana: 'はんまーかーる',
      aliases: ['ダンベルハンマーカール'],
      recordType: 'weightReps',
      hint: '縦持ちで前腕・腕の厚みも',
    },
    {
      id: 'narrow-push-up',
      name: 'ナロープッシュアップ',
      kana: 'なろーぷっしゅあっぷ',
      aliases: ['ナロー腕立て', '手幅狭め腕立て'],
      recordType: 'reps',
      hint: '手幅を狭くして三頭筋',
    },
    {
      id: 'bench-dips',
      name: 'ベンチディップス',
      kana: 'べんちでぃっぷす',
      aliases: ['リバースディップス', '椅子ディップス', 'チェアディップス'],
      recordType: 'reps',
      allowOptionalWeight: true,
      hint: '椅子に手をついて体を上下',
    },
    {
      id: 'dumbbell-kickback',
      name: 'ダンベルキックバック',
      kana: 'だんべるきっくばっく',
      aliases: ['キックバック', 'トライセプスキックバック'],
      recordType: 'weightReps',
      unilateral: true,
      hint: '前傾して肘から後ろに伸ばす。三頭筋の仕上げ',
    },
    {
      id: 'french-press',
      name: 'フレンチプレス',
      kana: 'ふれんちぷれす',
      aliases: ['ダンベルフレンチプレス'],
      recordType: 'weightReps',
      hint: '頭の後ろから押し上げる。三頭筋の仕上げ',
    },
  ]),
  ...group('abs', [
    {
      id: 'ab-roller-knee',
      name: 'アブローラー（膝コロ）',
      kana: 'あぶろーらー ひざころ',
      aliases: ['膝コロ', 'アブローラー', '腹筋ローラー'],
      recordType: 'reps',
      hint: '膝をついて転がす。まずはここから',
    },
    {
      id: 'ab-roller-standing',
      name: 'アブローラー（立ちコロ）',
      kana: 'あぶろーらー たちころ',
      aliases: ['立ちコロ'],
      recordType: 'reps',
      hint: '立った姿勢から転がす上級版',
    },
    {
      id: 'crunch',
      name: 'クランチ',
      kana: 'くらんち',
      recordType: 'reps',
      allowOptionalWeight: true,
      hint: '腹筋上部',
    },
    {
      id: 'leg-raise',
      name: 'レッグレイズ',
      kana: 'れっぐれいず',
      aliases: ['足上げ腹筋'],
      recordType: 'reps',
      hint: '腹筋下部',
    },
    {
      id: 'plank',
      name: 'プランク',
      kana: 'ぷらんく',
      aliases: ['フロントプランク'],
      recordType: 'time',
      hint: '体幹全体',
    },
    {
      id: 'russian-twist',
      name: 'ロシアンツイスト',
      kana: 'ろしあんついすと',
      aliases: ['ツイスト'],
      recordType: 'reps',
      allowOptionalWeight: true,
      hint: 'ダンベルを持つと負荷アップ。腹斜筋。左右合計で数える',
    },
  ]),
  ...group('leg', [
    {
      id: 'squat',
      name: 'スクワット',
      kana: 'すくわっと',
      aliases: ['自重スクワット', 'エアスクワット'],
      recordType: 'reps',
      hint: '脚全体の基本',
    },
    {
      id: 'dumbbell-squat',
      name: 'ダンベルスクワット',
      kana: 'だんべるすくわっと',
      aliases: ['DBスクワット'],
      recordType: 'weightReps',
      hint: 'ダンベルを持って行うスクワット',
    },
    {
      id: 'bulgarian-split-squat',
      name: 'ブルガリアンスクワット',
      kana: 'ぶるがりあんすくわっと',
      aliases: ['ブルガリアン', 'ブルスク', 'ブルガリアンスプリットスクワット'],
      recordType: 'reps',
      allowOptionalWeight: true,
      unilateral: true,
      hint: '後ろ足を椅子に乗せる。自宅では最強クラス',
    },
    {
      id: 'lunge',
      name: 'ランジ',
      kana: 'らんじ',
      aliases: ['フロントランジ', 'ダンベルランジ'],
      recordType: 'reps',
      allowOptionalWeight: true,
      unilateral: true,
      hint: '前後に踏み出す',
    },
    {
      id: 'dumbbell-romanian-deadlift',
      name: 'ダンベルルーマニアンデッドリフト',
      kana: 'だんべるるーまにあんでっどりふと',
      aliases: ['ルーマニアンデッドリフト', 'RDL', 'ダンベルRDL'],
      recordType: 'weightReps',
      hint: 'もも裏とお尻',
    },
    {
      id: 'hip-lift',
      name: 'ヒップリフト',
      kana: 'ひっぷりふと',
      aliases: ['ヒップブリッジ', 'グルートブリッジ'],
      recordType: 'reps',
      allowOptionalWeight: true,
      hint: '仰向けでお尻を上げる',
    },
    {
      id: 'calf-raise',
      name: 'カーフレイズ',
      kana: 'かーふれいず',
      aliases: ['かかと上げ'],
      recordType: 'reps',
      allowOptionalWeight: true,
      hint: '段差やダンベルでふくらはぎ',
    },
  ]),
]
