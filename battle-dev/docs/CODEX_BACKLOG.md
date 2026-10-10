# Codex backlog after v4.7.0

Work in small checkpoints. Complete tests/build/docs for one checkpoint before starting the next.

> **順序変更（2026-08-29）: 下記 v5.3.0「resolution-time choices」を v4.9.0 / P1 へ前倒し。**
> 項目そのものは削除せず、実施済みとして v5.3.0 の節に結果を追記している。
> 理由: ENGINE_GAP 624件を全件分析した結果、解決時選択を要求するものが 250件（40.1%）と最大で、
> かつ P1 は依存プリミティブを持たない依存グラフの根であるため。
> 加えて、旧来の8系統のクロージャ選択機構は `gameState` の外に解決途中を置いており、
> 選択待ち中の Undo・オートセーブ・盤面差分ゼロの選択の Replay が壊れていた。
> これは新機能ではなく既存不具合の修正でもある。詳細は `SYSTEM_V4_9_0_CHANGELOG.txt`。

## v4.8.0 — multi-attack core (first task)
Goal: replace the boolean-only attack accounting with a replay-safe per-turn/per-Battle-Phase attack allowance model while preserving all existing attack restrictions.

Cards unlocked immediately:
- ダイガスタ・フェニクス
- カチコチドラゴン

Acceptance:
- ordinary monster still attacks once;
- existing `attacked` behavior remains compatible or is migrated safely;
- an effect can grant exactly one additional attack without granting unlimited attacks;
- attack reset works at turn/Battle Phase boundaries and survives Undo/Replay;
- direct-attack restrictions and attack-target replay still work;
- dedicated tests + all existing tests PASS.

## v4.9.0 — effect-destruction immunity
Add a generic action-layer query/replacement for "cannot be destroyed by card effects". Implement 始祖の守護者ティラス including End Phase material detach and Battle Phase End destruction timing.

## v5.0.0 — grave replacement layer
Add common destination replacement for cards that would be sent to the GY. Use it for Macro Cosmos / Dimensional Fissure class behavior. Cover costs versus effects and "send to GY" activation legality.

## v5.1.0 — effect-category metadata
Replace name heuristics with declarative effect categories for actions/effects that destroy cards, negate summons, etc. Revisit Stardust Dragon and add Starlight Road-style interactions.

## v5.2.0 — first-class Fusion Summon pipeline
Make Fusion material selection, material routing, summon provenance, summon-negation timing, and on-Fusion-Summon triggers replay-safe and structurally equivalent to the current EX summon processor quality.

## v5.3.0 — resolution-time choices  →  **v4.9.0 / P1 へ前倒し済み（プリミティブ実装完了）**
Add a processor/API mechanism for non-targeting choices made during resolution. Then implement No.10 白輝士イルミネーター and other deferred cards without treating resolution choices as activation targets.

**実施結果（v4.9.0 P1 ChoiceRequest）**
- 共通プリミティブは完成。`API.requestChoice` / `registerChoiceHandlerV49` / `CHOICE_OPEN_V49`・`CHOICE_ANSWER_V49`・`CHOICE_CANCEL_V49` / `gameState.pendingChoice`。
- 解決の続きは `resumeToken`（ハンドラ名 + JSON引数）で表現し、Save/Replay/Undo/Redo を跨げる。
- **カード個別実装は未着手。** No.10 白輝士イルミネーター等の実装は Codex 側の作業として残る。
- 既存 `API.selectCard`（cards/ 内 484箇所）と `API.confirm`（16箇所）はシグネチャ不変のまま
  プリミティブ経由に変更したが、継続がクロージャのままなので **legacy 扱い**であり、
  「P1移行済み（replay-safe）」には数えていない。カード側を `API.requestChoice` へ移すのは今後の作業。

## Later card/rule candidates
Prioritize cards actually seen in 1103-era decklists/test decks. Examples include:
- Shooting Star Dragon (after multi-attack + excavate support)
- Daigusto Phoenix / Kachi Kochi Dragon (v4.8)
- Tiras (v4.9)
- Macro Cosmos / Dimensional Fissure (v5.0)
- Royal Oppression / Starlight Road after activation/effect-category primitives
- remaining high-frequency Synchro/Xyz/HERO/plant/T.G./Agent/Samurai cards with incomplete scripts
