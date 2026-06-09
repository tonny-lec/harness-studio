# 自己改善ループ ガイド — AI にワークフロー自身を改善させる

このガイドは、Codex SDK を使って「AI が自分の仕事ぶりを振り返り、自分(の指示書)を
改善するループ」を作る方法を説明します。Harness Studio の Codex Runner には
このループが `improve.mjs` として同梱されています。

前提知識: [AGENTIC_WORKFLOW_BASICS.md](AGENTIC_WORKFLOW_BASICS.md) /
[HARNESS_DESIGN_GUIDE.md](HARNESS_DESIGN_GUIDE.md)

## 1. 自己改善の 3 つのレベル

| レベル                        | 何を改善するか         | 仕組み                                                |
| ----------------------------- | ---------------------- | ----------------------------------------------------- |
| **1. 成果物の自己修正**       | その場の成果物         | 実行 ↔ チェックのループ。不合格理由を引き継いで再試行 |
| **2. ワークフローの自己改善** | プロンプト(指示書)自体 | 実行後に成果物を振り返り、prompts/ を改善             |
| **3. 継続的な改善サイクル**   | ワークフロー全体の品質 | 「実行 → 振り返り → 改善 → 再実行」を回し続ける       |

ポイント: レベル 1 は**今回のタスク**を良くするループ、レベル 2〜3 は**次回以降の
すべてのタスク**を良くするループです。

## 2. レベル 1 — 成果物の自己修正ループ(同梱済み)

Harness Studio の「繰り返しブロック + チェック」がこれです。`run.mjs` の中身は
次の構造をしています:

```js
// チェックステップ: outputSchema で構造化された合否判定を得る
const turn = await thread.run(gatePrompt, { outputSchema: VERDICT_SCHEMA });
const verdict = JSON.parse(turn.finalResponse); // { pass, reasons, fixInstructions }

// ループ: 不合格なら修正指示を次の試行のタスクに前置して再実行
for (let attempt = 1; attempt <= maxIterations; attempt++) {
  // ... ループ内の各ステップを実行(feedback があればタスクに前置)...
  if (verdict.pass) break;
  feedback = verdict.reasons.concat([verdict.fixInstructions]).join("\n");
}
```

ここで品質を決めるのは**チェックの判定基準**です。「テストが通る」「チェックリストの
各項目に対応する記述がある」のように機械的に判定できる文にしてください。

## 3. レベル 2 — ワークフローの自己改善(`improve.mjs`)

実行が終わると `runs/<タイムスタンプ>/` に各ステップの出力・ゲート判定・サマリーが
残ります。`improve.mjs` はこれを Codex に読ませ、**prompts/(各ステップの指示書)を
改善させます**。

```bash
node improve.mjs            # 最新の実行を分析 → 改善案レポートのみ
node improve.mjs --apply    # prompts/*.md を直接編集させる
```

仕組みの要点(そのまま自作にも応用できます):

```js
const thread = codex.startThread({
  workingDirectory: packDir, // 見せるのはパックの中だけ
  sandboxMode: apply ? "workspace-write" : "read-only", // 既定は読み取り専用
  skipGitRepoCheck: true,
});
await thread.runStreamed(
  [
    "You are the self-improvement reviewer for an agentic workflow pack.",
    "1. Read runs/<stamp>/run-summary.md and the step artifacts.",
    "2. Diagnose where the workflow underperformed.",
    "3. Edit the prompt files under prompts/ — only inside prompts/,",
    "   keep the {{TASK}} / {{UPSTREAM}} placeholders, don't touch run.mjs.",
  ].join("\n"),
);
```

設計上の判断(自作する場合も同じ判断が必要です):

- **改善対象を prompts/ に限定する**。エンジン(run.mjs)や実行計画(manifest)まで
  自己改変させると、壊れたときに原因を追えなくなります
- **既定は read-only(レポートのみ)**。適用は `--apply` の明示オプション
- **1 回の呼び出しで 1 回の改善パス**。無限の自己改変ループにはしない
- **git を人間レビューのゲートにする**。`git diff prompts/` を見てから次を実行

## 4. レベル 3 — 継続的な改善サイクル

推奨は人間がレビューを挟む半自動サイクルです:

```bash
node run.mjs --dir ~/repo "タスクA"   # 1. 実行
node improve.mjs --apply              # 2. AI が振り返り、プロンプトを改善
git diff prompts/                     # 3. 人間が差分をレビュー
git commit -am "improve prompts"      # 4. 採用(却下なら git checkout)
node run.mjs --dir ~/repo "タスクB"   # 5. 改善されたワークフローで次のタスク
```

完全自動で回したい場合はシェルループで書けますが、**必ず上限と記録を付けます**:

```bash
for i in 1 2 3; do
  node run.mjs --dir ~/repo "同じ評価用タスク" || break
  node improve.mjs --apply
  git commit -am "self-improvement pass $i"   # 各パスを記録、いつでも巻き戻せる
done
```

### 改善が「本当に改善」かを測る

振り返りによる変更が改悪のこともあります。確かめ方:

1. **評価用タスクを固定する**(同じタスクを改善前後で実行)
2. ゲートの判定結果(PASS までの試行回数、FAIL 理由の数)を before/after で比較する
3. 悪化したら `git revert` で戻す

ゲートが構造化出力(`{pass, reasons, fixInstructions}`)を返すので、試行回数や
理由の数は `runs/*/run-summary.md` から機械的に集計できます。

## 5. 安全上の原則(まとめ)

- 自己改変の**範囲を限定**する(プロンプトのみ。エンジン・計画・認証情報は対象外)
- **回数の上限**を必ず設ける(ループの maxIterations、改善パスの回数)
- **git を必須にする**。各改善パスをコミットし、人間がレビュー・巻き戻しできる状態を保つ
- 改善の判断材料は**実際の実行結果**(runs/ の成果物)に限る。推測で書き換えさせない
- サンドボックスは必要最小限(振り返りは read-only、適用時のみ workspace-write)
