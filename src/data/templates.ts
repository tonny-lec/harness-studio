import type { Step, StepKind, Workflow, WorkflowBlock } from "../types/workflow";
import { createId } from "../utils/id";

export type WorkflowTemplate = {
  id: string;
  name: string;
  tagline: string;
  /** What you get and when to use it, in plain language. */
  description: string;
  build: () => Workflow;
};

const step = (kind: StepKind, name: string, instruction: string, expectedOutput = ""): Step => ({
  id: createId(),
  kind,
  name,
  instruction,
  expectedOutput,
  checklist: [],
});

const stepBlock = (s: Step): WorkflowBlock => ({ id: createId(), type: "step", step: s });

const loopBlock = (
  name: string,
  steps: Step[],
  maxIterations: number,
  exitCondition: string,
): WorkflowBlock => ({
  id: createId(),
  type: "loop",
  name,
  steps,
  maxIterations,
  exitCondition,
});

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "coding",
    name: "コード変更ワークフロー",
    tagline: "調査 → 計画 → 実装と検証のループ → レビュー",
    description:
      "コードベースの変更を安全に進める定番の流れ。実装とチェックをループさせ、合格するまで自動で修正を繰り返します。",
    build: () => ({
      id: createId(),
      name: "コード変更ワークフロー",
      description: "コードベースの変更を、調査から実装・検証・レビューまで一貫して行う。",
      context:
        "対象リポジトリの規約に従うこと。変更はタスクに必要な範囲に留め、無関係なリファクタリングをしない。",
      blocks: [
        stepBlock(
          step(
            "research",
            "関連コードを調査する",
            "タスクに関係するファイル・既存の実装パターン・テスト・制約を調べて、確認できた事実と不明点を整理してください。コードはまだ変更しないでください。",
            "関連ファイル一覧、確認できた事実、不明点、変更方針の候補",
          ),
        ),
        stepBlock(
          step(
            "plan",
            "実装計画を立てる",
            "調査結果に基づいて、変更するファイル・変更内容・検証方法・完了条件をまとめてください。",
            "変更計画(対象ファイル、変更内容、検証コマンド、完了条件)",
          ),
        ),
        loopBlock(
          "実装と検証",
          [
            step(
              "generate",
              "実装する",
              "計画に従って変更を実装してください。前回のチェックで不合格だった場合は、修正指示に最優先で対応してください。",
              "実装した変更の内容と、動作確認の結果",
            ),
            step(
              "gate",
              "検証する",
              "実装が計画の完了条件をすべて満たしているか、ビルド・テスト等の検証が通っているかを判定してください。",
            ),
          ],
          3,
          "完了条件をすべて満たし、検証(ビルド・テスト)が通っている",
        ),
        stepBlock(
          step(
            "review",
            "最終レビュー",
            "変更全体をレビューして、バグ・リグレッションのリスク・規約違反を重要度順に指摘してください。",
            "重要度順のレビュー指摘と、残存リスクの一覧",
          ),
        ),
      ],
    }),
  },
  {
    id: "report",
    name: "調査レポート作成",
    tagline: "調査 → 構成 → 執筆と品質チェックのループ",
    description:
      "テーマについて調査し、構成を固めてからレポートを執筆。品質基準を満たすまで書き直しをループします。",
    build: () => ({
      id: createId(),
      name: "調査レポート作成",
      description: "テーマを調査し、構成立てされたレポートを品質チェック付きで作成する。",
      context: "読み手は前提知識のない関係者。事実と推測を明確に区別し、出典・根拠を示すこと。",
      blocks: [
        stepBlock(
          step(
            "research",
            "テーマを調査する",
            "テーマについて重要な事実・データ・論点を収集し、出典とあわせて整理してください。",
            "論点ごとに整理された調査メモ(出典付き)",
          ),
        ),
        stepBlock(
          step(
            "plan",
            "レポート構成を作る",
            "調査結果をもとに、レポートの章立てと各章で伝える要点を決めてください。",
            "章立てと各章の要点",
          ),
        ),
        loopBlock(
          "執筆と品質チェック",
          [
            step(
              "generate",
              "レポートを書く",
              "構成に従ってレポート本文を執筆してください。前回のチェックで不合格だった場合は、修正指示に対応してください。",
              "レポート本文(Markdown)",
            ),
            step(
              "gate",
              "品質をチェックする",
              "レポートが「構成どおりか」「事実と推測が区別されているか」「根拠が示されているか」を判定してください。",
            ),
          ],
          3,
          "構成どおりで、事実と推測が区別され、主要な主張に根拠が示されている",
        ),
      ],
    }),
  },
  {
    id: "review-only",
    name: "コードレビューワークフロー",
    tagline: "コンテキスト収集 → レビュー → まとめ",
    description:
      "変更内容を理解してからレビューし、対応優先度付きのまとめを出力するシンプルな流れ。ループなしの最小構成です。",
    build: () => ({
      id: createId(),
      name: "コードレビューワークフロー",
      description: "コード変更をレビューし、対応優先度付きの指摘リストを作成する。",
      context:
        "正確さとリグレッションのリスクをスタイルより優先する。指摘には具体的な根拠を付ける。",
      blocks: [
        stepBlock(
          step(
            "research",
            "変更内容を把握する",
            "レビュー対象の変更(差分)と、その周辺コードを読み、変更の意図と影響範囲を整理してください。",
            "変更の概要、影響範囲、注意して見るべきポイント",
          ),
        ),
        stepBlock(
          step(
            "review",
            "レビューする",
            "変更をレビューして、バグ・リグレッションリスク・設計上の問題を重要度順に指摘してください。確認済みの問題と懸念は区別してください。",
            "重要度順の指摘リスト(根拠付き)",
          ),
        ),
        stepBlock(
          step(
            "generate",
            "レビュー結果をまとめる",
            "指摘を「必ず直す」「直したほうがよい」「任意」に分類し、レビューサマリーを作成してください。",
            "対応優先度付きのレビューサマリー",
          ),
        ),
      ],
    }),
  },
];
