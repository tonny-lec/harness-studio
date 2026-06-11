# テスト戦略

Harness Studio のテストは **Vitest** で書かれています。狙いは網羅率ではなく、
「壊れたら製品として困る純粋ロジック」を最小の本数で固定することです。

## 実行方法

```bash
npm test            # 全テストを 1 回実行(CI 向け)
npm run test:watch  # 変更を監視しながら実行(開発向け)
```

`npm run build` は `tsc -b` を含むため、テストコード自体も型チェックされます。

## 何をテストするか(優先順位)

| 優先度 | 対象                                                            | テストファイル                                              | 理由                                                                                                                                                                    |
| ------ | --------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | エクスポーター(Codex Runner / Claude Code Pack / workflow.json) | `src/export/*.test.ts`                                      | 書き出した ZIP・JSON は**ユーザーの手元で動く成果物 = プロダクトの契約**。ファイル構成、manifest の形、プレースホルダーの置換、再インポートのラウンドトリップを固定する |
| 2      | データモデルの検証                                              | `src/utils/validateWorkflow.test.ts`                        | エラー(実行不能)と警告(品質ヒント)の区別、ループの出口条件、`maxIterations` の整数チェックなどの不変条件                                                                |
| 3      | Zustand ストアのアクション                                      | `src/store/workflowStore.test.ts`                           | 追加・複製・移動・削除・更新がワークフロー配列を正しく(かつイミュータブルに)書き換えること                                                                              |
| 4      | プロンプト生成・実行計画                                        | `src/export/stepPrompt.test.ts` / `src/export/plan.test.ts` | 全エクスポート先が共有する土台。`{{TASK}}` / `{{UPSTREAM}}` が各プロンプトに 1 回ずつ存在することは improve.mjs(自己改善ループ)の前提条件でもある                       |

**テストしないもの**: React コンポーネントの描画・操作。UI は薄く保ち、ロジックは
`src/utils` / `src/export` / `src/store` に寄せる方針のため、現時点では費用対効果が
低いと判断しています(導入する場合は Testing Library + jsdom を追加)。

## 契約テストの考え方

エクスポーターのテストは「実装の写し」ではなく**外から見える約束**を検証します。

- バンドルに含まれるファイルパスの完全な一覧(増減したら気づく)
- `manifest.json` / `package.json` が valid JSON で、実行計画を正しく写像していること
- ゲートステップだけに verdict(PASS/FAIL)指示が付くこと
- Codex Runner のプロンプトはプレースホルダーを**保持**し(実行時置換)、
  Claude Code Pack は `$ARGUMENTS` と成果物ファイル参照に**置換済み**であること
- 同梱される `workflow.json` が `parseWorkflowJson` で無損失に再インポートできること
- 生成される `run.mjs` / `improve.mjs` が `node --check` で構文エラーなく解析できること

## テスト基盤の構成

| ファイル               | 役割                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `vitest.config.ts`     | Vitest 設定。純粋ロジックのみ対象のため `environment: "node"`(DOM 不要で高速)                                                             |
| `src/test/setup.ts`    | zustand/persist が参照する `localStorage` のインメモリスタブ                                                                              |
| `src/test/fixtures.ts` | 決定的な ID を使うテスト用ビルダー(`makeStep` / `makeLoopBlock` / `buildSampleWorkflow` など)と、バンドルからファイルを取り出す `getFile` |

## テストを書くときの指針

1. **ランダム性を持ち込まない** — アプリ本体は `createId()`(UUID)を使うが、テストは
   `src/test/fixtures.ts` の明示的な ID を使う。アサーションが ID をそのまま参照できる。
2. **ストアのテストは `beforeEach` でリセット** — ストアはモジュールレベルの
   シングルトンなので、`useWorkflowStore.setState({ workflows: [], selectedWorkflowId: null })`
   で毎回まっさらにする。
3. **生成物は文字列の断片ではなく構造で検証** — JSON は `JSON.parse` してから
   `toEqual` / `toMatchObject` で比較する。プロンプトは「読み手(LLM)への指示として
   意味のある行」を `toContain` で確認する。
4. **バグ修正にはテストを添える** — 例: `maxIterations` に NaN が入ると
   `Math.max(1, NaN)` が NaN になりループが一度も回らない、という修正は
   `exportCodexRunnerPack.test.ts` の clamp テストで再発を防いでいる。
