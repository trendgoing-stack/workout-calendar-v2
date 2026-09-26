# 筋トレ記録カレンダー β

筋トレの記録をカレンダーで管理できるWebアプリの **β版** です。
鍛えた部位が色分けで表示されるので、「最近どこを鍛えたか」がひと目でわかります。

**▶ β版を開く: https://trendgoing-stack.github.io/workout-calendar-v2/**

（これまでの版は https://trendgoing-stack.github.io/workout-calendar/ でそのまま使えます）

登録やログインは不要です。無料で使えます。

## このβ版について

既存の「筋トレ記録カレンダー」に、次の機能を加えた版です。既存版とは別のリポジトリ・別のURLで公開していて、既存版には影響しません。

- **種目を一覧から選ぶ** — 自宅トレーニング向けの34種目をイラスト付きで収録。名前・読み（ひらがな／カタカナ）・別名で検索できます
- **記録タイプ** — 種目に合わせて「重量×回数」「回数のみ（加重も記録できる）」「秒数」の入力欄に切り替わります
- **カスタム種目** — 一覧に無い種目は自分で追加できます（イラストの代わりに部位のアイコンが表示されます）

β版の記録は既存版とは別に保存されます。既存版の記録を使うときは、次の「旧アプリからのデータ移行」を行ってください。

## 旧アプリからのデータ移行

1. 旧アプリ（既存版）の設定画面で「エクスポート（JSON）」を押し、ファイルを保存する
2. β版の設定画面で「インポート（JSON）」を押し、そのファイルを選ぶ
3. 「n種目をマスタに紐付け、m種目をカスタム種目として登録しました」と表示されれば完了

- 種目名が収録種目の名前・別名と一致したものは、その種目に紐付きます（例：「腕立て伏せ」→「プッシュアップ（腕立て伏せ）」）
- 一致しなかった種目は、カスタム種目として自動で登録されます。名前・部位・記録タイプは設定画面の「カスタム種目の管理」で直せます
- 旧アプリのデータは読み取るだけで、変更・削除はしません。移行前のデータはβ版側にも1世代だけ保存されます

> [!IMPORTANT]
> iPhoneでは、Safariで開いた場合とホーム画面から開いた場合でデータが**別々に保存**されます。
> 同じブラウザ（同じ保存場所）に旧アプリのデータがあるときだけ、設定画面に「旧アプリのデータを取り込む」ボタンが表示されます。
> 旧アプリをホーム画面から使っていた場合はボタンが出ないので、上のエクスポート→インポートで移してください。

## できること

- **カレンダー** — トレーニングした日に、鍛えた部位の色のドットが付きます。日付をタップすると、その日の記録を追加・編集できます
- **記録** — 種目を一覧から選び、記録タイプに合った欄（重量・回数・秒数）に入力します。1セット目には前回の値が入り、「セットを追加」で直前のセットがコピーされます
- **統計** — 部位ごとのトレーニング頻度（週別・月別）や、種目ごとの推移（最大重量・最大回数・最長秒数）をグラフで確認できます
- **ルーティン** — よく行うメニューを保存しておけば、ワンタップでその日の記録として登録できます
- **設定** — 部位の色や名前の変更、重量の単位（kg / lb）の切り替え、カスタム種目の管理、データのバックアップができます

## iPhoneで使う

ホーム画面に追加すると、アプリのように全画面で使えます。一度開けば、電波のない場所でも（イラストを含めて）起動します。

1. **Safari** で上のリンクを開く
2. 画面下の共有ボタン（□に↑のアイコン）をタップ
3. 「ホーム画面に追加」をタップ

ホーム画面では「筋トレβ」という名前で、アイコンに「β」の印が付きます（既存版と区別できます）。

新しいバージョンが公開されると、画面上部に「更新があります」と表示されます。タップすると最新版に切り替わります（記録はそのまま残ります）。

AndroidやPCでも、ChromeやEdgeなどのブラウザで同じように使えます。

## データについて

- 記録は**お使いの端末の中だけ**に保存されます。サーバーには送信されないので、ほかの人に見られることはありません
- そのため、**機種変更やブラウザのデータ削除をすると記録は消えます**。設定画面の「エクスポート」で定期的にバックアップを取っておくと安心です
- 別の端末にデータを移すときは、元の端末でエクスポートしたファイルを、新しい端末の設定画面で「インポート」してください
- アクセス数の計測に [GoatCounter](https://www.goatcounter.com/) を使っています。記録されるのは「どのページが何回開かれたか」だけで、クッキーは使わず、トレーニングの記録が送られることはありません

## はじめて使うときは

設定画面の「サンプルデータを入れて試す」を押すと、見本の記録が入ります。
操作感を確かめたあとは、「全データを削除」で消せます。

---

## 開発者向け

```bash
npm ci
npm run dev     # http://localhost:5173/workout-calendar-v2/
npm run build   # tsc + vite build（dist/ に出力。sw.js も生成）
npm run lint
```

`main` に push すると GitHub Actions でビルドされ、GitHub Pages に公開されます（`.github/workflows/deploy.yml`）。
iPhone実機では HTTPS でないと Service Worker が動かないため、実機確認は GitHub Pages に push して行います。

### リポジトリ固有の値

公開パス、アプリ名、manifest の `id`、localStorage とキャッシュのプレフィックスは
[`src/config/app.ts`](src/config/app.ts) に集約しています。ほかのファイルには直書きしないでください。
`manifest.webmanifest` と `index.html` のアプリ名はビルド時にここから生成されます。

localStorage の読み書きは [`src/lib/storage.ts`](src/lib/storage.ts) だけで行います（lint で強制）。
β版が書き込むのは `workout-calendar-beta:` で始まるキーだけで、旧アプリのキー `workout-calendar:data` は読み取り専用です。

### 種目の追加

1. [`src/data/exercises.ts`](src/data/exercises.ts) の該当する部位に種目を追記する
   - `id` は英小文字とハイフン（例：`incline-push-up`）。記録データはこの `id` で種目を参照するので、**一度公開したら変更しない**
   - `aliases` には旧データや検索で使われそうな別名を入れる。別の種目と取り違えそうな表記は入れない
   - `hint` は60文字以内
2. イラストを `public/exercises/<id>.svg` に置く（次の「イラストの描き方」を参照）
3. `package.json` の `version` を上げる（`npm version prerelease --preid=beta --no-git-tag-version` など）。
   Service Worker のキャッシュ名が変わり、イラストを含めて端末側が更新されます

### イラストの描き方・差し替え

収録種目のイラストは [`scripts/generate-exercise-svgs.mjs`](scripts/generate-exercise-svgs.mjs) で生成しています（`node scripts/generate-exercise-svgs.mjs`）。
ポーズは関節の座標で定義しているので、形を直すときはスクリプトを編集して再生成します。

- `viewBox="0 0 200 200"`、背景は透明、線は `stroke="currentColor"`（アプリ側で文字色に合わせて表示）
- 人物は棒人間（頭は円、胴・腕・脚は太さ6の線）、床は y=172、器具は最小限の図形
- 動作の特徴が出る1ポーズと、動く方向を示す矢印1本
- 1ファイル20KB以内

差し替えるには、次のどちらかを行います。

- **同じ名前のファイルを上書きする**：`public/exercises/<id>.svg` を置き換える（手で描いたSVGにする場合は、再生成で上書きされないよう、スクリプトの `POSES` からその種目を外す）
- **PNG / WebP にする**：`public/exercises/<id>.png` などを置き、`exercises.ts` のその種目に `image: 'exercises/<id>.png'` を書く。長辺512px以内、1枚100KB以内が目安

どちらの場合も `version` を上げてください。画像が無い・読み込めない種目では部位アイコンが表示されます。

### アイコン

`node scripts/generate-icons.mjs` で `public/icons/` のPNG（180／192／512、maskable）を生成します。β版の印（オレンジの丸に「β」）もここで描いています。

### 将来の統合

β版を正式版にするときは、次のどちらかで進めます（今回は実装していません）。

**案A：既存リポジトリに統合する**

1. このリポジトリは既存リポジトリの全履歴を引き継いでいるので、既存リポジトリ側で取り込める
   ```bash
   cd workout-calendar
   git remote add v2 https://github.com/trendgoing-stack/workout-calendar-v2.git
   git fetch v2
   git merge v2/main
   ```
2. `src/config/app.ts` の値を既存のものに戻す（`basePath: '/workout-calendar/'`、アプリ名、`manifestId`、`storagePrefix`、`cachePrefix` など）
   - `storagePrefix` を既存と同じにする場合は、旧キー（v1）と新キー（v2）が同じ名前になるため、次の手順の自動移行が前提になる
3. 起動時に旧キー（v1）を1回だけ自動で移行するよう切り替える（`src/lib/dataImport.ts` の `bootLoad` で、新キーが空なら `readLegacyRaw()` を移行する）
4. アイコンのβ表記を外して再生成し、`version` を上げて公開する

**案B：β版を正式版にする**

1. このリポジトリを正式版とし、アプリ名とアイコンからβ表記を外す
2. 既存版のREADMEと画面に新URLへの案内を出し、既存リポジトリをアーカイブする
3. 利用者には、既存版でエクスポート→新版でインポートしてもらう

### このリポジトリの作り方（記録）

既存リポジトリを全履歴ごと複製し、remote を付け替えて作成しました。
`upstream` は既存リポジトリを指していますが、push URL は無効（`NO_PUSH`）にしてあるので、誤って既存リポジトリへ push されません。

```bash
git clone https://github.com/trendgoing-stack/workout-calendar.git workout-calendar-v2
cd workout-calendar-v2
git remote rename origin upstream
git remote set-url --push upstream NO_PUSH
gh repo create trendgoing-stack/workout-calendar-v2 --public --source . --remote origin --push
gh api -X POST repos/trendgoing-stack/workout-calendar-v2/pages -f build_type=workflow
```
