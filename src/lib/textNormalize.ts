/**
 * 種目名の検索・照合用に文字列を正規化する。
 * - NFKC（全角英数・半角カナ・全角括弧などを揃える）
 * - 英字を小文字に
 * - カタカナをひらがなに
 * - 空白を取り除く
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/\s+/g, '')
}
