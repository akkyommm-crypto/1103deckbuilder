from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Ordered primary classification. A card may need several primitives; the report records
# one primary blocker and lists the usual secondary dependencies for that family.
CATEGORIES = [
    ("ritual_pipeline", "儀式召喚パイプライン", ["ritual summon", "ritual material", "ritual monster"], "手札・場の素材選択、レベル計算、召喚条件無視、召喚由来、特殊召喚制約", "高：多数の儀式魔法・儀式モンスターへ横断適用可能"),
    ("hidden_information", "非公開情報・宣言・乱数選択", ["private", "hidden", "reveal", "declare", "declaration", "random", "coin", "die result", "deck inspection", "deck-top inspection", "opponent hand"], "決定的RNG、閲覧権限、Action Journal、Replayマスキング、選択UI", "高：手札確認・デッキトップ確認・宣言・ランダム処理を共通化可能"),
    ("battle_provenance", "戦闘イベント・戦闘ダメージ由来", ["battle", "attack", "attacker", "damage step", "piercing"], "攻撃側/守備側、戦闘破壊確定、ダメージ種別、直接攻撃、Damage Step時点", "高：戦闘誘発・貫通・耐性・ダメージ置換の共通基盤になる"),
    ("effect_damage_lp", "効果ダメージ・LP置換", ["effect damage", "lp recovery", "lp-recovery", "recovery event", "lp swap", "damage prevention", "all-damage"], "効果源メタデータ、置換順序、チェーン、戦闘ダメージとの区別", "高：ダメージ無効・反射・回復変換・LP交換へ再利用可能"),
    ("summon_pipeline", "召喚手順・素材・召喚由来", ["summon", "tribute", "material", "gemini", "normal monster identity"], "ゾーン容量、召喚制約、素材履歴、同時召喚イベント、成功/無効タイミング", "高：特殊召喚・アドバンス召喚・素材参照を横断的に共通化可能"),
    ("chain_effect_metadata", "チェーン・効果カテゴリ・無効化", ["chain", "negat", "effect-category", "effect source", "effect-source", "activation", "spell effect", "trap effect", "monster effect"], "対象/非対象、効果源ID、カード種別、コスト/対象/解決、発動無効と効果無効", "高：無効化・コピー・置換・耐性の判定をカード名依存から分離可能"),
    ("destruction_replacement", "破壊耐性・置換・破壊由来", ["destruction", "destroyed", "destroy ", "replacement", "immunity"], "破壊原因、責任プレイヤー、回数制限、身代わり選択、離脱イベント", "高：戦闘/効果破壊耐性と身代わり処理を一本化可能"),
    ("resolution_selection", "解決時選択・複数同時処理", ["selection", "choice", "choose", "selected", "up to", "exact-two", "exact three", "simultaneous", "mode"], "非対象選択、候補再評価、複数枚の原子性、相手選択、Replay入力", "高：対象を取らない効果と複数枚処理の共通UI/APIにできる"),
    ("identity_metadata", "setcode・alias・canonical identity・対応表", ["metadata", "setcode", "canonical", "identity", "mapping", "name-fragment", "archetype"], "carddata移行、alias正規化、カテゴリ境界、1103時点の同名/系列定義", "高：正しいメタデータ追加後は多数の場当たり的文字列判定を除去可能"),
    ("level_stat", "レベル・ランク・攻守の永続/一時レイヤー", ["level", "rank", "atk", "def", "stat modifier", "original attack", "original def"], "素材/召喚合法性、表示、リセット、元々の数値、効果無効、Replay digest", "高：レベル変更・攻守固定/倍化/半減を統一レイヤー化可能"),
    ("equip_attachment", "装備・モンスター装備・付着関係", ["equip", "attachment", "equipped"], "装備対象合法性、関係UID、ゾーン移動、破壊時処理、装備回数", "高：装備魔法とモンスター装備の共通ライフサイクルにできる"),
    ("zone_movement", "ゾーン移動イベント・移動由来", ["grave", "banish", "return to hand", "return-to-hand", "send-to-grave", "sent-to-grave", "deck top", "deck bottom", "zone", "discard provenance", "add-to-hand"], "owner/controller、移動前状態、効果/コスト区別、同時移動、イベント束ね", "高：全ゾーン遷移の共通イベントとprovenanceへ統合可能"),
    ("phase_scheduler", "ターン・フェイズ・遅延スケジューラ", ["phase", "scheduled", "schedule", "next turn", "turn termination", "turn counter", "skip", "end phase", "standby"], "ターン所有者、発動元UID、リセット、フェイズ遷移、Undo/Redo/Replay", "高：遅延破壊・帰還・フェイズスキップ・勝利条件へ共通利用可能"),
    ("position_attack_rules", "表示形式・攻撃コマンド制約", ["position", "direct attack", "attack permission", "attack target", "battle command", "must attack"], "Battle Command表示、攻撃対象選択、強制変更、効果による変更可否、リセット", "中〜高：攻撃権限と表示形式強制を中央ルール化可能"),
    ("control_ownership", "コントロール・所有者・交換", ["control", "owner", "ownership", "swap"], "owner/controller分離、ゾーン容量、終了時復帰、同時交換、移動先補正", "高：奪取・交換・返却の原子的処理に共通化可能"),
    ("counter_resource", "カウンター・回数資源", ["counter", "once-per", "usage state", "three-use", "count limit"], "設置可能性、分散支払い、リセット、効果無効、UI、Replay", "高：カードカウンターと使用回数を共通の直列化資源として扱える"),
    ("player_rule_modifiers", "プレイヤー単位ルール変更", ["hand-size", "additional normal", "cannot", "prohibition", "restriction", "allowance", "battle phase count", "draw phase", "activate exactly one trap directly from hand"], "召喚/発動/攻撃の中央合法性、期間、消費、複数効果の合成", "高：手札上限・追加召喚・行動禁止をplayer modifierへ集約可能"),
    ("deck_order", "デッキ順序・トップ/ボトム操作", ["order", "topdeck", "top-or-bottom", "top or bottom", "deck orientation", "shuffle timing"], "非公開情報、順序配列、シャッフル、公開範囲、Replay", "高：デッキ閲覧・並べ替え・トップ固定を共通操作にできる"),
    ("other_engine_gap", "その他の共通ルール不足", [], "上記プリミティブの複合、特殊勝利、トークン/罠モンスター等の個別共通基盤", "中：個別精査後に小さな再利用プリミティブへ分解"),
]


def classify(reason: str) -> str:
    text = reason.lower()
    for key, _label, needles, _deps, _reuse in CATEGORIES[:-1]:
        if any(needle in text for needle in needles):
            return key
    return "other_engine_gap"


def main() -> None:
    overrides = json.loads((ROOT / "data/script_status_overrides.json").read_text(encoding="utf-8"))["cards"]
    coverage = json.loads((ROOT / "data/script_coverage.json").read_text(encoding="utf-8"))
    gaps = [(name, item["reason"]) for name, item in overrides.items() if item.get("status") == "ENGINE_GAP"]
    expected = int(coverage["counts"]["ENGINE_GAP"])
    if len(gaps) != expected:
        raise SystemExit(f"ENGINE_GAP mismatch: overrides={len(gaps)} coverage={expected}")

    grouped: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for name, reason in gaps:
        grouped[classify(reason)].append((name, reason))

    meta = {row[0]: row for row in CATEGORIES}
    summary = {
        "schema_version": 1,
        "checkpoint": "v4.8.0 / batch030",
        "classification": "one primary missing-primitive family per ENGINE_GAP; dependencies capture common secondary needs",
        "total_engine_gap": len(gaps),
        "categories": [],
    }
    for key, label, _needles, deps, reuse in CATEGORIES:
        rows = grouped.get(key, [])
        if not rows:
            continue
        summary["categories"].append({
            "key": key,
            "label": label,
            "count": len(rows),
            "representative_cards": [name for name, _ in rows[:5]],
            "dependencies": deps,
            "commonization_potential": reuse,
            "cards": [{"name": name, "reason": reason} for name, reason in rows],
        })

    out_json = ROOT / "data/engine_gap_primitive_summary_batch030.json"
    out_json.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# ENGINE_GAP不足プリミティブ集計 — v4.8.0 / batch030",
        "",
        f"最新の `script_status_overrides.json` と `script_coverage.json` を突合し、ENGINE_GAP **{len(gaps)}枚**を集計した。",
        "各カードは主たる不足プリミティブ1分類に割り当てているため、表の該当カード数の合計はENGINE_GAP総数と一致する。複合要件は依存プリミティブ欄に記載した。",
        "",
        "| 不足プリミティブ | 該当カード数 | 代表カード | 依存する他プリミティブ | 共通化可能性 |",
        "|---|---:|---|---|---|",
    ]
    for item in summary["categories"]:
        reps = "、".join(item["representative_cards"]) or "—"
        lines.append(f"| {item['label']} | {item['count']} | {reps} | {item['dependencies']} | {item['commonization_potential']} |")
    lines += [
        "",
        "## 優先順位の見方",
        "",
        "- 高共通化のうち、件数が多く依存関係の根に近いものから着手する。特に召喚由来、解決時選択、戦闘由来、チェーン効果メタデータ、ゾーン移動由来が他分類の前提になりやすい。",
        "- `identity_metadata` はエンジンAPIより先に、1103基準のsetcode / alias / canonical mappingをデータ移行手順付きで整える必要がある。",
        "- `hidden_information` はReplayだけでなく対戦相手へ情報を漏らさないUI境界が必須で、単純な選択APIの流用はできない。",
        "- 詳細な全カード名・個別reasonは `data/engine_gap_primitive_summary_batch030.json` に保持した。",
        "",
    ]
    (ROOT / "docs/ENGINE_GAP_PRIMITIVE_REPORT_BATCH030.md").write_text("\n".join(lines), encoding="utf-8")

    counts = Counter({item["label"]: item["count"] for item in summary["categories"]})
    print(json.dumps({"total": len(gaps), "counts": dict(counts)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
