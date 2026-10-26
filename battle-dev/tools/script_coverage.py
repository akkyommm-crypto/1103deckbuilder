#!/usr/bin/env python3
"""Build machine-readable script coverage for the 1103 card pool.

This is intentionally a static scanner. It does not claim a card is correct merely
because a registration exists. Status semantics live in docs/CODEX_AUTOBUILD.md.
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "carddata.json"
OVERRIDES_PATH = ROOT / "data" / "script_status_overrides.json"
OUT_JSON = ROOT / "data" / "script_coverage.json"
OUT_MD = ROOT / "docs" / "SCRIPT_COVERAGE.md"
CUTOFF = "2011-08-31"

DIRECT_PATTERNS = {
    "legacy": re.compile(r"\bdefineScript\s*\(\s*(['\"])(.*?)\1", re.S),
    "unified": re.compile(r"\bdefineUnifiedCardV4\s*\(\s*(['\"])(.*?)\1", re.S),
    # S03-U156: the shared deck-trigger engine (engine/1ZT) registers a script from a card-side declaration
    "deckTrigger": re.compile(r"\bdeclareDeckTriggerS03\s*\(\s*(['\"])(.*?)\1", re.S),
    # S03-U180: the 剣闘獣 common mechanism (engine/1ZZ) — defineGladiatorS03 wraps defineUnifiedCardV4
    "gladiator": re.compile(r"\bdefineGladiatorS03\s*\(\s*(['\"])(.*?)\1", re.S),
    # S03-U187: the 「Sin」 common mechanism (engine/1ZZD) — declareSinS03 wraps defineScript
    "sin": re.compile(r"\bdeclareSinS03\s*\(\s*(['\"])(.*?)\1", re.S),
}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def brace_block(text: str, open_index: int) -> str:
    """Return a best-effort JS {...} block beginning at open_index."""
    if open_index < 0 or open_index >= len(text) or text[open_index] != "{":
        return ""
    depth = 0
    quote = None
    esc = False
    for i in range(open_index, len(text)):
        ch = text[i]
        if quote:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == quote:
                quote = None
            continue
        if ch in ("'", '"', '`'):
            quote = ch
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[open_index : i + 1]
    return text[open_index:]


def discover_registration_helpers(text: str) -> set[str]:
    helpers = set()
    bodies = {}
    for m in re.finditer(r"\bfunction\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{", text):
        body = brace_block(text, text.find("{", m.start()))
        bodies[m.group(1)] = body
        # S03-U157: declareDeckTriggerS03 (engine/1ZT) registers a script too, so a local wrapper around it is a registration helper
        if "defineScript(" in body or "defineUnifiedCardV4(" in body or "declareDeckTriggerS03(" in body:
            helpers.add(m.group(1))
    # Registration helpers may delegate to another local registration helper
    # (for example v49Heal -> v49Spell -> defineUnifiedCardV4).
    changed = True
    while changed:
        changed = False
        for name, body in bodies.items():
            if name in helpers:
                continue
            if any(re.search(rf"\b{re.escape(helper)}\s*\(", body) for helper in helpers):
                helpers.add(name)
                changed = True
    return helpers


def scan_card_sources():
    records: dict[str, list[dict]] = defaultdict(list)
    helper_names: set[str] = set()
    texts: dict[Path, str] = {}
    for path in sorted((ROOT / "cards").glob("*.js")):
        text = read_text(path)
        texts[path] = text
        helper_names |= discover_registration_helpers(text)
        for kind, pat in DIRECT_PATTERNS.items():
            for m in pat.finditer(text):
                name = m.group(2)
                line = text.count("\n", 0, m.start()) + 1
                records[name].append({"kind": kind, "source": str(path.relative_to(ROOT)), "line": line})

    # Literal calls to local helpers that themselves register a script.
    excluded_helpers = {"defineScript", "defineUnifiedCardV4", "defineAutoDeckScript", "declareDeckTriggerS03", "defineGladiatorS03", "declareSinS03"}
    for path, text in texts.items():
        for helper in sorted(helper_names - excluded_helpers):
            pat = re.compile(rf"\b{re.escape(helper)}\s*\(\s*(['\"])(.*?)\1", re.S)
            for m in pat.finditer(text):
                # Ignore the helper's own declaration area if a string happens to appear there.
                name = m.group(2)
                line = text.count("\n", 0, m.start()) + 1
                records[name].append({"kind": f"helper:{helper}", "source": str(path.relative_to(ROOT)), "line": line})

    # AUTO_DECK_TABLE is deliberately PARTIAL: it is a coarse historical helper,
    # not proof of accurate card-specific timing/rulings.
    auto_path = ROOT / "cards" / "40_auto_interpreter.js"
    auto_names = set()
    if auto_path.exists():
        text = read_text(auto_path)
        marker = text.find("const AUTO_DECK_TABLE")
        if marker >= 0:
            open_idx = text.find("{", marker)
            block = brace_block(text, open_idx)
            for m in re.finditer(r"(?m)^\s*(['\"])(.*?)\1\s*:\s*\{\s*op\s*:", block):
                auto_names.add(m.group(2))
    return records, auto_names

 
# 共通エンジンの基盤テストは「カード個別 TESTED 判定の証拠」にしない。
# これらはカード効果の動作ではなく共通プリミティブ／metadata を検証するもので、
# 説明のためにカード名が登場するだけで TESTED へ誤昇格させてはいけない。
# （tools/check.py での実行対象からは除外しない。判定の証拠から外すだけ。）
NON_CARD_TEST_FILES = {
    "test_s03_u172_deck_select_start.js",   # S03-U172: deck selection / start flow (card names are deck contents only)
    "test_p4_setcode_authority.js",   # P4 SetcodeAuthority / named predicate metadata
    "test_p3_provenance.js",
    "test_ritual_v5.js",
    "test_battle_v6.js",
    "test_s03_u57_attack_declaration_info.js",
    "test_scheduler_v7.js",
    "test_draw_event_v8.js",
    "test_effect_category_v19.js", "test_reveal_v20.js", "test_destruction_protection_v21.js", "test_counter_v22.js", "test_material_filter_v23.js", "test_ritual_registry_v24.js", "test_control_v26.js", "test_lp_change_event_v28.js", "test_grave_continuous_v29.js", # EffectCategory 共通primitive（カード実装テストではない）
    "test_lp_change_v18.js",        # LPChange 共通primitive（カード実装テストではない）
    "test_characteristic_v17.js",   # CharacteristicOverride 共通primitive（カード実装テストではない）
    "test_level_modifier_v16.js",   # LevelModifier 共通primitive（カード実装テストではない）
    "test_equip_v15.js",            # Equip 共通primitive（カード実装テストではない）
    "test_stat_modifier_v14.js",    # StatModifier 共通primitive（カード実装テストではない）
    "test_negation_v13.js",         # Negation 共通primitive（カード実装テストではない）
    "test_activation_event_v12.js", # Activation 共通primitive（カード実装テストではない）
    "test_token_v11.js",            # Token 共通primitive（カード実装テストではない）
    "test_position_v10.js",          # Position 共通primitive（カード実装テストではない）
    "test_leave_field_v9.js",        # LeaveField 共通primitive（カード実装テストではない）         # DrawEvent 共通primitive（カード実装テストではない）          # Delayed/Scheduler 共通primitive（カード実装テストではない）             # Battle 共通primitive（カード実装テストではない）             # Ritual 共通primitive（カード実装テストではない）          # P3 Provenance / 由来metadata（カード実装テストではない）
}

CARD_TEST_FOCUS = {
    # U56 uses real low-ATK monsters as fixtures to validate Limit Reverse
    # target filtering and link cleanup; only the trap is under card-specific test.
    "test_s03_u56_limit_reverse.js": {"リミット・リバース"},
    # U70 tests the getChainResponsesV2 dispatch-level mz-zone kind guard, not any
    # card's own resolve() logic; 砂塵の大竜巻 is named only in an explanatory
    # comment (it was the real card in the R1 reproduction) and must not be
    # counted as tested by this file. クレボンス and くず鉄のかかし are already
    # TESTED via their own dedicated coverage; exercising them here as fixtures
    # changes nothing, so they need no focus entry.
    "test_s03_u70_chain_response_mz_kind_guard.js": set(),
    # U71 uses the already-TESTED カラクリ小町 弐弐四 only as a static second face-up Karakuri
    # monster to observe カラクリ守衛 参壱参's own buff landing on it; her own effects are never
    # exercised, so she must not be counted as tested by this file.
    "test_s03_u71_karakuri_watchdog_saizan.js": {"カラクリ守衛 参壱参"},
    # U73 uses the already-registered TG ストライカー only as the real-DUEL-path Special Summon target
    # (a Level 2 Warrior monster); its own effects are never exercised, so it must not be counted as
    # tested by this file.
    "test_s03_u73_reinforce_truth.js": {"トゥルース・リインフォース"},
    # U76 exercises サンダー・ブレイク's real activation (cost, target, destroy) only as a real-DUEL-path
    # fixture to demonstrate 始祖の守護者ティラス's own protectV21 effect-destruction immunity; promoting
    # サンダー・ブレイク itself is out of this unit's scope (left for a future unit if desired).
    "test_s03_u76_saigo_no_guardian_tyrannus.js": {"始祖の守護者ティラス"},
    # U77 names 大樹海／血の代償／酒呑童子／始祖の守護者ティラス only in explanatory precedent comments
    # (fieldIgnition / multi-select requestChoice / duelRandomInt prior art); none of their own effects are
    # exercised by this file, so only Sin World itself may be counted as tested by it.
    "test_s03_u77_sin_world.js": {"Sin World"},
    # U79 exercises サンダー・ブレイク's real activation (cost, target, destroy) only as a real-DUEL-path
    # fixture demonstrating ドラグニティアームズ－レヴァテイン's own clause 3 (revive-on-opponent-destroy);
    # promoting サンダー・ブレイク itself is out of this unit's scope, same precedent as S03-U76.
    "test_s03_u79_dragunity_arms_levateinn.js": {"ドラグニティアームズ－レヴァテイン"},
    # U80 exercises ジュラック・アウロ／ジュラック・グアイバ's real Synchro-material role only as real-DUEL-path
    # fixtures to demonstrate ジュラック・ヴェルヒプト's own extended v380SummonMaterials snapshot; promoting
    # them is out of this unit's scope.
    "test_s03_u80_jurrac_velophnyx.js": {"ジュラック・ヴェルヒプト"},
    # U81 exercises BF－空風のジン／BF－蒼炎のシュラ／BF－月影のカルート's real Synchro-material role and
    # 青眼の究極竜's real attack only as real-DUEL-path fixtures to demonstrate BF－孤高のシルバー・ウィンド's
    # own two clauses; promoting them is out of this unit's scope.
    "test_s03_u81_bf_silverwind.js": {"BF－孤高のシルバー・ウィンド"},
    # U82 exercises ジュラック・アウロ／青眼の白龍／ワイト (Synchro-material fixtures) and 聖なる魔術師／
    # カオス・ソルジャー －開闢の使者－／ダーク・アームド・ドラゴン／強欲な壺／聖なるバリア －ミラーフォース－
    # (opponent board/hand fixtures) only as real-DUEL-path fixtures to demonstrate A・O・J ディサイシブ・
    # アームズ's own 3 modes; promoting them is out of this unit's scope.
    "test_s03_u82_aoj_decisive_armor.js": {"A・O・J ディサイシブ・アームズ"},
    # U83 uses 青眼の究極竜／サイクロン only as real-DUEL-path board fixtures to demonstrate ブラック・ホール's
    # own mass-destroy effect; promoting them is out of this unit's scope.
    "test_s03_u83_dark_hole.js": {"ブラック・ホール"},
    "test_s03_u84_torrential_tribute.js": {"激流葬"},
    "test_s03_u85_book_of_moon.js": {"月の書"},
    # U86 uses トラップ・スタン/ワイト/もけもけ only as real-DUEL-path board fixtures to demonstrate the
    # activation-response fix; promoting them is out of this unit's scope.
    "test_s03_u86_seven_tools_activation_response.js": {"盗賊の七つ道具", "ナチュル・パルキオン"},
    # U87 uses バット/もけもけ/アックス・レイダー/アンモ・ナイト/No.39 希望皇ホープ/ワン・フォー・ワン only
    # as real-DUEL-path board fixtures; promoting them is out of this unit's scope.
    "test_s03_u87_tg_warwolf_striker.js": {"TG ワーウルフ", "TG ストライカー"},
    # U88 uses リビングデッドの呼び声/サイクロン/速攻のかかし only as real-DUEL-path board fixtures to
    # demonstrate 砂塵の大竜巻's own destroy+optional-Set effect; promoting them is out of this unit's scope.
    "test_s03_u88_dust_tornado.js": {"砂塵の大竜巻"},
    # U89 uses ワイト/もけもけ/バット/青眼の究極竜/砂塵の大竜巻 only as real-DUEL-path board fixtures;
    # 砂塵の大竜巻 was already promoted in U88 (unchanged here). Promoting the others is out of scope.
    "test_s03_u89_call_of_the_haunted.js": {"リビングデッドの呼び声"},
    # U90 uses ワイト/もけもけ/サイクロン/死者蘇生/バット/強欲な壺 only as real-DUEL-path board fixtures;
    # promoting them is out of this unit's scope.
    "test_s03_u90_trap_dustshoot.js": {"ダスト・シュート"},
    # U91 uses ワイト/もけもけ/クレボンス/青眼の白龍/サイクロン/強欲な壺 only as real-DUEL-path board
    # fixtures; promoting them is out of this unit's scope.
    "test_s03_u91_herald_of_orange_light.js": {"朱光の宣告者"},
    # U92 uses サイクロン/強欲な壺/もけもけ/死者蘇生/王宮のお触れ/バット only as real-DUEL-path board
    # fixtures; promoting them is out of this unit's scope.
    "test_s03_u92_bribe_of_the_living_dead.js": {"墓穴の道連れ"},
    # U93 uses ワイト/青眼の白龍/もけもけ/バット only as real-DUEL-path board fixtures; promoting them is
    # out of this unit's scope.
    "test_s03_u93_chaos_sorcerer.js": {"カオス・ソーサラー"},
    # U94 uses もけもけ/バット/ワイト/青眼の白龍/青眼の究極竜 only as real-DUEL-path board fixtures;
    # promoting them is out of this unit's scope.
    "test_s03_u94_ryko_lightsworn_hunter.js": {"ライトロード・ハンター ライコウ"},
    # U96 uses E・HERO エアーマン/アンモ・ナイト/E・HERO アブソルートZero only as real-DUEL-path board
    # fixtures; promoting them is out of this unit's scope.
    "test_s03_u96_miracle_fusion.js": {"ミラクル・フュージョン"},
    # U97 uses 青眼の白龍/E・HERO エアーマン/アンモ・ナイト/E・HERO アブソルートZero/マジック・ジャマー/
    # 死者蘇生/強欲な壺/サイクロン only as real-DUEL-path board fixtures; promoting them is out of scope.
    "test_s03_u97_super_polymerization.js": {"超融合"},
    # U98 uses 青眼の白龍/E・HERO アナザー・ネオス/もけもけ/M・HERO ヴェイパー only as real-DUEL-path board
    # fixtures; promoting them is out of this unit's scope.
    "test_s03_u98_dual_spark.js": {"デュアルスパーク"},
    # U99 uses E・HERO アナザー・ネオス/もけもけ/青眼の白龍 only as real-DUEL-path board fixtures;
    # promoting them is out of this unit's scope.
    "test_s03_u99_hero_blast.js": {"ヒーロー・ブラスト"},
    # U100 uses もけもけ/バット/ジュラック・イグアノン/ジュラック・スピノス only as real-DUEL-path board
    # fixtures; promoting them is out of this unit's scope.
    "test_s03_u100_jurrac_guaiba.js": {"ジュラック・グアイバ"},
    # U101 uses もけもけ/カラクリ商人 壱七七/カラクリ兵 弐参六/青眼の白龍 only as real-DUEL-path board
    # fixtures; promoting them is out of this unit's scope.
    "test_s03_u101_karakuri_komachi_224.js": {"カラクリ小町 弐弐四"},
    # U102 uses カラクリ守衛 参壱参/カラクリ小町 弐弐四/もけもけ/バット/ワイト/青眼の白龍 only as
    # real-DUEL-path board fixtures; promoting them is out of this unit's scope.
    "test_s03_u102_karakuri_anatomy.js": {"カラクリ解体新書"},
    # U103 uses ローンファイア・ブロッサム/きのこマン/青眼の白龍 only as real-DUEL-path board fixtures;
    # promoting them is out of this unit's scope.
    "test_s03_u103_spore.js": {"スポーア"},
    # U104 uses カラクリ兵 弐参六/カラクリ商人 壱七七/青眼の白龍/もけもけ only as real-DUEL-path board
    # fixtures; promoting them is out of this unit's scope.
    "test_s03_u104_cost_of_the_blood.js": {"血の代償"},
    # U105: 血の代償 already promoted in U104; this unit is a pure Tribute-payment correctness follow-up
    # fix to the same card, no new status change. もけもけ/ワイト/青眼の白龍/ジュラック・ヘレラ/カラクリ兵
    # 弐参六 used only as real-DUEL-path board fixtures. Empty set (matches the S03-U70 precedent).
    "test_s03_u105_cost_of_the_blood_tributes.js": set(),
    # U106 uses アックス・レイダー/TG ワーウルフ/TG ストライカー/もけもけ only as real-DUEL-path board
    # fixtures; promoting them is out of this unit's scope.
    "test_s03_u106_tg_rush_rhino.js": {"TG ラッシュ・ライノ","TG サイバー・マジシャン"},
    # U107 uses TG ワーウルフ/TG ストライカー/もけもけ only as real-DUEL-path board fixtures;
    # promoting them is out of this unit's scope.
    "test_s03_u107_tg1em1.js": {"TG1－EM1"},
    # U108 is a DUEL UI / storage-boundary / generic Xyz-material selection regression.
    # Named cards are fixtures only; no card-specific behavior is promoted by this file.
    "test_s03_u108_deck_select_xyz_material.js": set(),
    "test_s03_u109_future_fusion_r1_slice.js": {"未来融合－フューチャー・フュージョン"},
    "test_s03_u110_archlord_kristya.js": {"大天使クリスティア"},
    "test_s03_u111_god_bird_attack.js": {"ゴッドバードアタック", "サンダー・ブレイク"},
    "test_s03_u112_gateway_dark_world.js": {"暗黒界の門", "暗黒界の雷", "手札抹殺"},
    "test_s03_u113_debris_pair.js": {"カードガンナー", "デブリ・ドラゴン"},
    "test_s03_u114_saved_decks_v2.js": set(),
    "test_s03_u114_xyz_detach_choice.js": set(),
    "test_s03_u115_forbidden_lance_immunity.js": {"E・HERO ワイルドマン", "力の代行者 マーズ", "禁じられた聖槍"},
    "test_s03_u116_karakuri_common.js": {"カラクリ兵 弐参六", "カラクリ商人 壱七七", "カラクリ参謀 弐四八", "カラクリ忍者 九壱九"},
    # 洗脳－ブレインコントロール is exercised as a fixture only (its target restriction is not verified here).
    "test_s03_u117_control_restrictions.js": {"精神操作", "心変わり", "X・E・N・O", "ラージマウス"},
    "test_s03_u118_trap_negation.js": {"トラップ・スタン", "王宮のお触れ", "人造人間－サイコ・ショッカー", "グラヴィティ・バインド－超重力の網－"},
    "test_s03_u119_gemini.js": {"E・HERO アナザー・ネオス", "チューンド・マジシャン", "灼熱王パイロン", "ヘルカイザー・ドラゴン", "デュアル・ランサー", "幸運の笛吹き"},
    "test_s03_u120_extra_tier.js": {"氷結界の龍 ブリューナク", "A・O・J カタストル", "インヴェルズ・ローチ", "No.39 希望皇ホープ"},
    "test_s03_u121_tg_synchro.js": {"フォーミュラ・シンクロン", "TG ワンダー・マジシャン", "TG ハイパー・ライブラリアン", "TG パワー・グラディエイター"},
    "test_s03_u122_gemini2.js": {"巨人ゴーグル", "サンライズ・ガードナー", "未来サムライ", "シャドウ・ダイバー", "インフィニティ・ダーク", "ギガプラント"},
    "test_s03_u123_karakuri_shogun.js": {"カラクリ将軍 無零"},
    "test_s03_u124_super_polymerization_choice.js": {"超融合"},
    "test_s03_u125_dark_world_targets.js": {"暗黒界の武神 ゴルド", "暗黒界の龍神 グラファ"},
    "test_s03_u126_fusion_only_absolute_zero.js": {"E・HERO アブソルートZero", "ミラクル・フュージョン"},
    "test_s03_u127_properly_summoned.js": {"ダーク・アームド・ドラゴン"},
    "test_s03_u128_doppel_warrior.js": {"ドッペル・ウォリアー", "死者蘇生"},
    "test_s03_u129_scapegoat_foolish_lure.js": {"スケープ・ゴート", "闇の誘惑"},
    "test_s03_u130_polymerization.js": {"融合", "ダーク・フュージョン"},
    "test_s03_u131_necrovalley_duel.js": {"王家の眠る谷－ネクロバレー"},
    "test_s03_u132_dragon_mirror_overload.js": {"龍の鏡", "オーバーロード・フュージョン"},
    "test_s03_u133_power_bond_gem_fusion.js": {"パワー・ボンド", "ジェムナイト・フュージョン", "超融合", "ミラクル・フュージョン"},
    "test_s03_u134_fusion_substitute.js": {"沼地の魔神王"},
    "test_s03_u171_peace_messenger.js": {"和睦の使者"},
    "test_s03_u170_start_step.js": {"威嚇する咆哮"},
    "test_s03_u169_deck_triggers3.js": {"ナチュル・チェリー", "プチトマボー", "素早いムササビ"},
    "test_s03_u168_non_targeting.js": {"深海王デビルシャーク", "異次元竜 トワイライトゾーンドラゴン"},
    "test_s03_u167_deck_triggers2.js": {"オシャレオン", "ジェイドナイト", "機皇兵スキエル・アイン", "バイオファルコン", "氷結界の大僧正"},
    "test_s03_u166_d_stapler.js": {"D・ステープラン"},
    "test_s03_u165_protections3.js": {"デュアル・ソルジャー", "幻獣サンダーペガス", "E・HERO テンペスター"},
    "test_s03_u164_dual_summoner.js": {"デュアル・サモナー"},
    "test_s03_u163_ex_material_check.js": {"ゴヨウ・ガーディアン", "エヴォルカイザー・ラギア"},
    "test_s03_u162_mine_mole.js": {"マイン・モール"},
    "test_s03_u161_protections.js": {"イレカエル", "エレキーウィ", "万力魔神バイサー・デス"},
    "test_s03_u160_battle_conditions.js": {"薄幸の乙女", "スカー・ウォリアー"},
    "test_s03_u159_tribute_summon_batch.js": {"風帝ライザー", "邪帝ガイウス", "クリッター", "黒き森のウィッチ", "奈落の落とし穴"},
    "test_s03_u158_battle_proof_text.js": {"ジャイロイド", "混沌球体", "スターダスト・シャオロン", "ホワイトポータン", "サテライト・キャノン",
        "D・ボードン", "シールド・ウォリアー", "アマゾネス女王", "X－セイバー パシウル"},
    "test_s03_u157_attribute_recruiters.js": {"キラー・トマト", "シャインエンジェル", "巨大ネズミ", "グリズリーマザー", "ドラゴンフライ", "UFOタートル"},
    "test_s03_u135_auto_table_filters.js": {"コアキメイル・ロック", "バード・フェイス"},  # S03-U156: バード・フェイス real battle trigger
    "test_s03_u136_worm_yagan_nebula.js": {"ワーム・ヤガン", "W星雲隕石"},
    "test_s03_u137_fixed_list_singles.js": {"魂を削る死霊", "メタモルポット", "N・グラン・モール", "ライトロード・マジシャン ライラ"},
    "test_s03_u138_fixed_list_singles2.js": {"E・HERO エスクリダオ", "アーカナイト・マジシャン", "グローアップ・バルブ", "魔轟神レイジオン", "魔轟神レイヴン", "魔轟神レヴュアタン"},
    "test_s03_u139_black_highlander.js": {"天刑王 ブラック・ハイランダー"},
    "test_s03_u140_shooting_quasar.js": {"シューティング・クェーサー・ドラゴン"},
    "test_s03_u141_kagemusha.js": {"六武衆の影武者"},
    "test_s03_u142_future_fusion_position.js": {"未来融合－フューチャー・フュージョン"},
    "test_s03_u143_audit_note_status.js": set(),   # status audit only: promotes nothing
    "test_s03_u144_attack_lock.js": {"古代の機械兵士", "古代の機械巨人", "インフェルニティ・ビースト", "ジェムナイト・マディラ", "古代の機械騎士", "古代の機械巨竜", "死者蘇生"},
    "test_s03_u145_mass_destroy_attack_lock.js": {"古代の機械獣", "古代の機械工兵", "古代の機械究極巨人", "E－HERO ワイルド・サイクロン", "ブラック・ホール", "ダンディライオン", "ネフティスの鳳凰神", "機械犬マロン"},
    "test_s03_u146_self_event_destroyer.js": {"D－HERO ダブルガイ", "ハネクリボー", "魔轟神レヴュアタン", "六武衆の師範", "サイクロン", "ブラック・ホール"},
    "test_s03_u147_triforce.js": {"A・ジェネクス・トライフォース"},
    "test_s03_u148_gemini3.js": {"水面のアレサ", "竜影魚レイ・ブロント", "炎妖蝶ウィルプス", "地獄の門番イル・ブラッド", "魔族召喚師"},
    "test_s03_u149_attack_all.js": {"ジュラック・モノロフ", "神機王ウル", "ヴァリュアブル・アーマー", "E・HERO ワイルドジャギーマン"},
    "test_s03_u150_forced_attack_target.js": {"立ちはだかる強敵"},
    "test_s03_u151_weapon_change.js": {"ウェポンチェンジ", "サイクロン"},
    "test_s03_u152_end_battle_phase.js": {"攻撃の無力化", "速攻のかかし", "バトルフェーダー", "ハーフorストップ"},
    "test_s03_u153_manual_notes.js": {"クリボー", "ネクロ・ガードナー", "打ち出の小槌"},
    "test_s03_u154_reminders_prompts.js": {"光の護封剣", "リミッター解除", "名推理", "マインドクラッシュ"},
    "test_s03_u155_reminders2.js": {"エネミーコントローラー", "異次元からの帰還", "封印の黄金櫃"},
    "test_s03_u156_deck_triggers.js": {"クリッター", "黒き森のウィッチ", "ゴブリンゾンビ", "仮面竜", "荒野の女戦士", "素早いモモンガ",
        "暗黒界の斥候 スカー", "ユーフォロイド", "ジェネクス・サーチャー", "軍隊竜", "ヘル・セキュリティ", "スレイブ・エイプ", "トライクラー",
        "ヴィークラー", "幻影の魔術士", "ガスタ・イグル", "パンダボーグ", "RAI－MEI", "カバリスト", "キーマウス", "ゴキポン", "ダニポン",
        "ドレッド・ドラゴン", "バイオレット・ウィッチ", "悪魂邪苦止", "ガスタ・ガルド", "ナチュル・クリフ", "ボタニティ・ガール"},
    # CODEX-C02 uses the other named cards only as board, hand, battle, and draw fixtures.
    "test_codex_c02_cards.js": {"またたびキャット", "H－ヒートハート", "HERO’S ボンド", "ロスト", "いたずら好きな双子悪魔", "風林火山"},
    # S03-U306 uses ライオウ / ワイト only as battle fixtures.
    "test_s03_u306_honest_cost.js": {"オネスト"},
    # S03-U307 names ワイト / ジェム monsters only as fixtures (the two cards under test are the Gemini duals).
    "test_s03_u307_gem_duals.js": {"ジェムナイト・アイオーラ", "ジェムナイト・アンバー"},
    # S03-U308 names ライオウ / ワイト / ウォールクリエイター / 六武衆 monsters only as fixtures.
    "test_s03_u308_direct_grant.js": {"バトル・テレポーテーション", "マジック・ホール・ゴーレム", "クロス・アタック", "中央突破"},
    # S03-U309 names トゥーン・ワールド / ライオウ / ワイト / サイクロン only as fixtures.
    "test_s03_u309_toon.js": {"トゥーン・キャノン・ソルジャー", "トゥーン・ゴブリン突撃部隊", "トゥーン・ヂェミナイ・エルフ", "トゥーン・仮面魔道士"},
    # S03-U310 names トゥーン・ワールド / ライオウ / ワイト / サイクロン / ブラック・マジシャン only as fixtures.
    "test_s03_u310_toon2.js": {"トゥーン・デーモン", "トゥーン・マーメイド", "トゥーン・ドラゴン・エッガー", "トゥーン・ブラック・マジシャン・ガール", "ブルーアイズ・トゥーン・ドラゴン"},
    # S03-U311 names ワイト / ライオウ / サイクロン / カオス・ソルジャー / E・HERO アクア・ネオス / D monsters only as fixtures.
    "test_s03_u311_revive_equips.js": {"継承の印", "戦線復活の代償", "自律行動ユニット", "契約の履行", "再融合", "D・リペアユニット"},
    # S03-U312 names ライオウ / ワイト / サイクロン / ブラック・ホール / 六武衆－ザンジ / 白い忍者 / ヴァイロン monsters and Spells only as fixtures.
    "test_s03_u312_limited_equips.js": {"漆黒の名馬", "古代の機械戦車", "風魔手裏剣", "磁力の指輪", "レアゴールド・アーマー", "ヴァイロン・コンポーネント", "ヴァイロン・フィラメント"},
    # S03-U313 names ワイト / ライオウ / 青眼の白龍 / サイクロン / D・ビデオン / ヴァイロン and host monsters only as fixtures.
    "test_s03_u313_union.js": {"ドイツ", "コイツ", "騎竜", "漆黒の闘龍", "ゾンビタイガー", "アーマー・ブレイカー", "トライゴン", "オイルメン", "六武衆の御霊代"},
    # S03-U314 names ワイト / ライオウ / ゴブリンゾンビ / サイクロン / 魔法都市エンディミオン / ヴァイロン and Union monsters only as fixtures.
    "test_s03_u314_union2.js": {"ヴァイロン・テセラクト", "ヴァイロン・ペンタクロ", "バスター・ショットマン", "デス・デンドル", "氷岩魔獣", "灼岩魔獣"},
    # S03-U315 names ライオウ / ワイト / 青眼の白龍 / サイクロン / host monsters only as fixtures.
    "test_s03_u315_equips3.js": {"伝説の黒帯", "剣の煌き", "ロケット・パイルダー"},
    # S03-U316 names ライオウ / ワイト / 青眼の白龍 / エーリアン・ソルジャー / 死者蘇生 / サイクロン only as fixtures.
    "test_s03_u316_alien.js": {"エーリアン・ウォリアー", "エーリアン・グレイ", "エーリアン・テレパス", "エーリアン・キッズ"},
    # S03-U317 names 六武衆－ザンジ / ワイト / 青眼の白龍 / 魔法都市エンディミオン / サイクロン only as fixtures.
    "test_s03_u317_six2.js": {"六武衆－イロウ", "六武衆－カモン", "六武衆－ニサシ", "六武衆－ヤリザ"},
    # S03-U318 names ガスタ・ファルコ / ガスタの巫女 ウィンダ / ガスタの静寂 カーム / ガスタ・コドル / ガスタの賢者 ウィンダール / ガスタ・イグル / ワイト / サイクロン only as fixtures.
    "test_s03_u318_gusto.js": {"ダイガスタ・ファルコス", "ダイガスタ・スフィアード", "ダイガスタ・ガルドス", "ダイガスタ・イグルス", "ガスタの神官 ムスト"},
    # S03-U319 names クリッター / 青眼の白龍 / ガスタ・コドル / ガスタ・ガルド / BF－二の太刀のエテジア as a Synchro Material fixture, BF－銀盾のミストラル / BF－アーマード・ウィング / BF－アームズ・ウィング / ブラック・ホール / サイクロン / ワイト / ガスタ・スクイレル / ガスタ・サンボルト only as fixtures.
    "test_s03_u319_bf.js": {"BF－そよ風のブリーズ", "BF－逆風のガスト", "BF－追い風のアリゼ", "BF－二の太刀のエテジア", "BF－天狗風のヒレン"},
    # S03-U320 names ナチュル・ガーディアン / ナチュル・ビーンズ / ナチュル・クリフ / ナチュル・ビースト / ダイガスタ・ファルコス / エネミーコントローラー / おろかな埋葬 / くず鉄のかかし / 青眼の白龍 / ワイト only as fixtures.
    "test_s03_u320_naturia.js": {"ナチュル・モスキート", "ナチュル・ローズウィップ", "ナチュル・レディバグ", "ナチュル・フライトフライ", "ナチュル・スタッグ", "ナチュル・ホワイトオーク"},
    # S03-U321 names コアキメイルの鋼核 / コアキメイル・ロック / 青眼の白龍 / サイクロン / 奈落の落とし穴 / ワイト only as fixtures.
    "test_s03_u321_koaki.js": {"コアキメイル・クルセイダー", "コアキメイル・ウルナイト", "コアキメイル・スピード", "コアキメイル・マキシマム", "コアキメイル・ルークロード", "コアキメイル・ヴァラファール"},
    # S03-U322 names アルカナフォースI－THE MAGICIAN / エネミーコントローラー / 青眼の白龍 / 死者蘇生 / 強欲な壺 / サイクロン / ワイト only as fixtures.
    "test_s03_u322_arcana.js": {"アルカナフォースIII－THE EMPRESS", "アルカナフォースXIV－TEMPERANCE", "アルカナフォースEX－THE LIGHT RULER"},
    # S03-U323 names ブラック・ホール / 青眼の白龍 / ワイト and a generic Lv3 / Lv4 Dragon only as fixtures.
    "test_s03_u323_cyberdark.js": {"サイバー・ダーク・エッジ", "サイバー・ダーク・キール", "サイバー・ダーク・ホーン"},
    # S03-U324 names ワイト only as a fixture (the three cards are each other's fixtures).
    "test_s03_u324_symphonic.js": {"音響戦士ドラムス", "音響戦士ピアーノ", "音響戦士ベーシス"},
    # S03-U325 names ラヴァル・ウォリアー / ガンナー / キャノン / スティング / 死神ブーメラン / ギガテック・ウルフ / エネミーコントローラー / ブラック・ホール / サイクロン / 強欲な壺 / 青眼の白龍 / ワイト only as fixtures.
    "test_s03_u325_laval.js": {"ラヴァルロード・ジャッジメント", "ラヴァル・グレイター", "ラヴァル・ステライド", "ラヴァル・ツインスレイヤー", "ラヴァル炎湖畔の淑女", "ラヴァルバル・ドラゴン"},
    # S03-U326 names ワーム・ホープ / ワーム・オペラ / サイクロン / 青眼の白龍 / ワイト only as fixtures.
    "test_s03_u326_worm.js": {"ワーム・ソリッド", "ワーム・プリンス", "ワーム・ミリディス"},
    # S03-U327 names 氷結界の番人ブリズド / 氷結界の守護陣 / おろかな埋葬 / ブラック・ホール / サイクロン / 手札抹殺 / 青眼の白龍 / ワイト only as fixtures.
    "test_s03_u327_icebarrier.js": {"氷結界の封魔団", "氷結界の風水師", "墓守の監視者"},
    # S03-U328 names サイクロン / 青眼の白龍 / 死者蘇生 / ワイト only as fixtures.
    "test_s03_u328_battleship.js": {"巨大戦艦 ビッグ・コア", "巨大戦艦 カバード・コア", "巨大戦艦 クリスタル・コア", "巨大戦艦 テトラン", "巨大戦艦 ビッグ・コアMk－II"},
    # S03-U329 names 六武衆－ザンジ / 六武衆－ヤリザ / ヴォルカニック・ラット / 死者蘇生 / 青眼の白龍 / ワイト only as fixtures.
    "test_s03_u329_shien.js": {"紫炎の参謀", "紫炎の寄子", "紫炎の老中 エニシ", "ヴォルカニック・ハンマー"},
    # S03-U330 names ガスタ・スクイレル / 青眼の白龍 / サイクロン / ワイト only as fixtures.
    "test_s03_u330_vylon.js": {"ヴァイロン・ステラ", "ヴァイロン・プリズム", "ヴァイロン・ハプト"},
    # S03-U331 names ガスタ・ガルド / エネミーコントローラー / 青眼の白龍 / サイクロン / ワイト only as fixtures.
    "test_s03_u331_zenmai.js": {"ゼンマイウォリアー", "ゼンマイナイト", "ゼンマイハンター", "ゼンマイバット", "ゼンマイマジシャン"},
    # S03-U332 names スクラップ・サーチャー / キマイラ / ハンター / ドラゴン / ガスタ・コドル / ガスタ・ガルド / 大地の騎士ガイアナイト / ブラック・ホール / 青眼の白龍 / ワイト only as fixtures.
    "test_s03_u332_scrap.js": {"スクラップ・ゴブリン", "スクラップ・ソルジャー", "スクラップ・ゴーレム", "スクラップ・オルトロス", "スクラップ・カウンター"},
    # S03-U333 names ジェネクス・コントローラー / ウンディーネ / ワーカー / ドクター / ガイア / ヒート / サーチャー / ガスタの巫女 ウィンダ / ライトロード・ハンター ライコウ / サイクロン / 強欲な壺 / 青眼の白龍 / ワイト only as fixtures.
    "test_s03_u333_genex.js": {"A・ジェネクス・アクセル", "A・ジェネクス・ケミストリ", "A・ジェネクス・トライアーム", "レアル・ジェネクス・クロキシアン", "レアル・ジェネクス・ヴィンディカイト", "ジオ・ジェネクス"},
    # S03-U334 names the E・HERO Normal materials / ライオウ / 融合 / ひょうすべ / サイクロン / 青眼の白龍 / ワイト only as fixtures.
    "test_s03_u334_ehero_fusion.js": {"E・HERO サンダー・ジャイアント", "E・HERO ジ・アース", "E・HERO セイラーマン", "E・HERO ダーク・ブライトマン", "E・HERO ネクロイド・シャーマン", "E・HERO プラズマヴァイスマン", "E・HERO マッドボールマン", "E・HERO ワイルド・ウィングマン", "E・HERO フレイム・ブラスト"},
    # S03-U335 names ワイト / 青眼の白龍 / ブラック・マジシャン / ブラック・ホール / サイクロン only as fixtures.
    "test_s03_u335_dhero.js": {"D－HERO ダイハードガイ", "D－HERO ダガーガイ", "D－HERO ダッシュガイ", "D－HERO ドゥームガイ", "D－HERO ドグマガイ"},
    # S03-U336 names エレキタリス / ワイト / 青眼の白龍 / ブラック・ホール / ライオウ / 死者蘇生 / サンダー・ドラゴン / スケルエンジェル / エネミーコントローラー / BF－銀盾のミストラル only as fixtures.
    "test_s03_u336_elec.js": {"エレキツネ", "エレキャンセル", "エレキリギリス", "エレキリム", "エレキンモグラ"},
    # S03-U337 names 墓守の呪術師 / 墓守の末裔 / 墓守の番兵 / 墓守の長 / ワイト / 青眼の白龍 / ブラック・ホール / グリーン・ガジェット / レッド・ガジェット / イエロー・ガジェット / サイバー・ドラゴン / 古代の機械兵士 / 歯車街 / ネクロバレー only as fixtures.
    "test_s03_u337_graveworld.js": {"墓守の大神官", "墓守の大筒持ち", "マシンナーズ・カノン", "古代の機械合成獣", "古代の採掘機"},
    # S03-U338 names the Gem-Knight materials (サフィア / エメラル / ルマリン / ガネット / アイオーラ / オブシディア) / 融合 / ワイト / 青眼の白龍 / エレキタリス / ブラック・ホール / サイクロン / 王宮の勅命 only as fixtures.
    "test_s03_u338_gemknight.js": {"ジェムナイト・アクアマリナ", "ジェムナイト・アメジス", "ジェムナイト・パーズ", "ジェムナイト・プリズムオーラ", "ジェムナイト・ルビーズ"},
    # S03-U339 names 騎士の称号 / ブラック・マジシャン / スーパーバグマン / BF－疾風のゲイル / BF－漆黒のエルフェン / the Equip Spells / ブラック・ホール / サイクロン / ワイト / 青眼の白龍 only as fixtures.
    "test_s03_u339_enablers.js": {"ブラック・マジシャンズ・ナイト", "サイバー・バリア・ドラゴン", "サイバー・レーザー・ドラゴン", "ブラック・バック", "氷結界のロイヤル・ナイト", "ヴァイロン・マター"},
    # S03-U340 names ジェムナイト・エメラル / ジェムナイト・アイオーラ / ライトロード・ウォリアー ガロス / ワイト / 青眼の白龍 / 死者蘇生 / ブラック・ホール / キラー・トマト only as fixtures.
    "test_s03_u340_traps.js": {"ストライク・ショット", "チェンジ・デステニー", "ライト・バニッシュ", "ヴィクティム・カウンター", "ワンダー・クローバー"},
    # S03-U341 names キラー・トマト / ライトロード・ウォリアー ガロス / ガード・オブ・フレムベル / ジェムナイト・エメラル / 地縛神 Ccarayhua / コアキメイル・クルセイダー / コアキメイルの鋼核 / D－HERO ダッシュガイ / 歯車街 / ブラック・ホール / サイクロン / ワイト / 青眼の白龍 only as fixtures.
    "test_s03_u341_equips_traps.js": {"憎悪の棘", "竜殺しの剣", "閃光のイリュージョン", "早すぎた復活", "能力吸収コア", "魔導書整理"},
    # S03-U342 names the three 魔神 / サイクロン / ジェムナイト・エメラル / C・リペアラー / アーモド・ビー / ブラック・ホール / ネクロバレー / エレキツネ / サンダー・ドラゴン / エレキリム / ワイト / 青眼の白龍 only as fixtures.
    "test_s03_u342_procs.js": {"ゲート・ガーディアン", "カード・ブレイカー", "ギガストーン・オメガ", "ジャイアントワーム", "カゲトカゲ", "シンクロ・マグネーター"},
    # S03-U343 names the WIND / EARTH / WATER / Insect / Rock / Monk fixtures, ワイト / 青眼の白龍 / サイクロン / ブラック・ホール / 王家の眠る谷－ネクロバレー only as fixtures.
    "test_s03_u343_banish_procs.js": {"デザート・ツイスター", "フェンリル", "デビルドーザー", "メガロック・ドラゴン", "モンタージュ・ドラゴン", "マスターモンク", "原始太陽ヘリオス", "ヘリオス・デュオ・メギストス", "ヘリオス・トリス・メギストス"},
    # S03-U344 names the LIGHT / WIND / WATER / FIRE / Thunder / Reptile / Dragon / Beast fixtures, 磁石の戦士α β γ, the Continuous Spells, ワイト / 青眼の白龍 / サイクロン / ネクロバレー only as fixtures.
    "test_s03_u344_spirits.js": {"霊魂の護送船", "神聖なる魂", "風の精霊 ガルーダ", "水の精霊 アクエリア", "氷炎の双竜", "電池メン－業務用", "真紅眼の闇竜", "邪龍アナンタ", "降雷皇ハモン", "磁石の戦士マグネット・バルキリオン", "虚栄の大猿"},
    # S03-U345 names ワイト / 青眼の白龍 / ブラック・ホール / ライトロード・ウォリアー ガロス / ブラック・マジシャン only as fixtures.
    "test_s03_u345_defenders.js": {"デッド・ガードナー", "カードブロッカー", "シャトルロイド", "ロックストーン・ウォリアー", "魔力吸収球体", "傀儡虫", "クリボン"},
    # S03-U346 names ワイト / 青眼の白龍 / クリボン / E・HERO フェザーマン / C・チッキー / ブラック・マジシャン / デーモンの召喚 / サイクロン / リビングデッドの呼び声 only as fixtures.
    "test_s03_u346_gods.js": {"邪神ドレッド・ルート", "邪神イレイザー", "邪神アバター", "堕天使ディザイア", "神鳥シムルグ", "黒の魔法神官", "幻魔皇ラビエル"},
    # S03-U347 names the フレムベル / インヴェルズ / Plant fixtures, ジャイアント・ボマー・エアレイド / トラップ・リアクター・RR / マジック・リアクター・AID, ワイト / 青眼の白龍 / ブラック・マジシャン / ジェムナイト・エメラル / サイクロン only as fixtures.
    "test_s03_u347_misc.js": {"フレムベル・デスガンナー", "ネオフレムベル・シャーマン", "速攻の黒い忍者", "インヴェルズ・グレズ", "マジオシャレオン", "ボタニカル・ライオ", "幻影の妖精", "サモン・リアクター・AI"},
    # S03-U348 names アマゾネスの剣士 / エレキリム / コアキメイル・クルセイダー / ウォールクリエイター / コアキメイルの鋼核 / ワイト / 青眼の白龍 / サイクロン only as fixtures.
    "test_s03_u348_revive_traps.js": {"アマゾネスの意地", "ウィキッド・リボーン", "コアの再練成", "サイコ・チューン"},
    # S03-U349 names 融合 / the E・HERO materials and Fusion Monster / ブラック・マジシャン / 青眼の白龍 / ワイト only as fixtures.
    "test_s03_u349_event_traps.js": {"ヘル・ポリマー", "痛恨の訴え", "破壊輪", "融合回収"},
    "test_s03_u350_guards.js": {"雷魔神－サンガ", "風魔神－ヒューガ", "水魔神－スーガ", "盲信するゴブリン", "牙城のガーディアン", "精気を吸う骨の塔", "火車"},
    "test_s03_u351_smallmon.js": {"X－セイバー ガラハド", "オアシスの使者", "イービル・ソーン", "C・リペアラー", "C・コイル"},
    "test_s03_u352_battle_upkeep.js": {"フュージョニストキラー", "マックス・ウォリアー", "メンタルプロテクター", "マジシャンズ・エイプ"},
    "test_s03_u353_holds.js": {"平和の使者", "闇の呪縛", "拷問車輪"},
    "test_s03_u354_chain.js": {"連鎖爆撃", "一陣の風", "積み上げる幸福", "奇跡の蘇生"},
    "test_s03_u355_counters.js": {"透破抜き", "王家の呪い", "六尺瓊勾玉", "エンペラー・オーダー"},
    "test_s03_u356_counters2.js": {"魔鏡導士リフレクト・バウンダー", "魔導アーマー エグゼ", "海底に潜む深海竜", "静寂のサイコウィッチ"},
    "test_s03_u357_rituals.js": {"踊りによる誘発", "亀の誓い", "ハンバーガーのレシピ", "大邪神 レシェフ"},
    "test_s03_u358_infernity.js": {"ZERO－MAX", "インフェルニティ・ミラージュ", "インフェルニティ・リフレクター"},
    "test_s03_u359_dmonsters.js": {"D・スコープン", "D・マグネンU", "D・マグネンI", "D・キャメラン"},
    "test_s03_u360_misc.js": {"サイバー・オーガ・2", "E・HERO ブルーメ", "E・HERO フラッシュ", "サイバー・ヴァリー"},
    "test_s03_u361_alien2.js": {"エーリアン・マザー", "異界空間－Aゾーン", "エーリアン・ブレイン", "昇霊術師 ジョウゲン"},
    "test_s03_u362_lightdark.js": {"ライトロード・ドルイド オルクス", "ライトエンド・ドラゴン", "ライトニング・トライコーン", "ダーク・クリエイター", "ダーク・カタパルター"},
    "test_s03_u363_fusion_subs.js": {"イリュージョン・シープ", "心眼の女神", "沼地の魔獣王", "破壊神 ヴァサーゴ"},
    "test_s03_u364_counters3.js": {"デス・モスキート", "メタル・シューター", "コンボファイター", "コンボマスター"},
    "test_s03_u365_tenma.js": {"天魔神 ノーレラス", "天魔神 エンライズ", "怨念の魂 業火"},
    "test_s03_u366_battletraps.js": {"ファイヤー・ウォール", "吠え猛る大地", "援護射撃", "奇跡の軌跡"},
    "test_s03_u367_contraps.js": {"忍法 空蝉の術", "コア・ブラスト", "スターゲート", "クローザー・フォレスト"},
    "test_s03_u368_linktraps.js": {"大火葬", "アヌビスの裁き", "ギブ&テイク"},
    "test_s03_u369_misc4.js": {"地獄詩人ヘルポエマー", "闇晦ましの城", "レベル調整", "リチュアルバスター"},
    "test_s03_u370_ritual_react.js": {"昇華する魂", "宣告者の預言", "神光の宣告者"},
    "test_s03_u371_misc5.js": {"魔知ガエル", "赤蟻アスカトル", "神竜アクアバザル", "英知の代行者 マーキュリー"},
    "test_s03_u372_autotable.js": {"ハイエナ", "スーパイ", "クロス・ポーター", "メンタルマスター", "リバース・オブ・ネオス", "トライアングル・エリア"},
    "test_s03_u373_autotable2.js": {"ヴァイロン・マテリアル", "極星宝ドラウプニル", "スクラップ・シャーク", "見習い魔術師", "機皇城"},
    "test_s03_u374_autotable3.js": {"D・バリア", "D・リモコン", "超古深海王シーラカンス"},
    "test_s03_u375_traps2.js": {"ハーピィ・レディ・SB", "異次元への隙間", "バーサーキング", "能力吸収石"},
    "test_s03_u376_chainers.js": {"獣人アレス", "連爆魔人", "紅蓮の炎壁", "地獄の暴走召喚"},
    "test_s03_u377_negators.js": {"我が身を盾に", "デストラクション・ジャマー", "ボム・ガード", "ライフ・コーディネイター", "椿姫ティタニアル"},
    "test_s03_u378_targetlocks.js": {"ヴァイロン・セグメント", "闇の侯爵ベリアル", "滅びの爆裂疾風弾"},
    "test_s03_u379_spells.js": {"増殖", "百機夜工", "スターライト・ロード", "マジシャンズ・クロス"},
    "test_s03_u380_counters4.js": {"創世神", "魂を喰らう者 バズー", "マシン・デベロッパー", "世界樹"},
    "test_s03_u381_fusions.js": {"聖獣セルケト", "地天の騎士ガイアドレイク", "ナイトメアを駆る死霊"},
    "test_s03_u382_misc6.js": {"摩天楼 －スカイスクレイパー－", "極星宝グングニル", "紅蓮魔闘士", "樹海の射手"},
    "test_s03_u383_dice_demons.js": {"迅雷の魔王－スカル・デーモン", "シャドウナイトデーモン", "ダークビショップデーモン", "デスルークデーモン", "インフェルノクインデーモン", "ヘルポーンデーモン"},
    "test_s03_u384_summon_locks.js": {"ジェノサイドキングデーモン", "レプティレス・サーヴァント", "大熱波", "完全防音壁"},
    "test_s03_u385_misc7.js": {"紅蓮魔竜の壺", "究極・背水の陣", "ゼンマイマニュファクチャ", "邪狂神の使い", "不吉な占い"},
    "test_s03_u386_blaze.js": {"ブレイズ・キャノン", "クレイジー・ファイヤー", "ヴォルカニック・バックショット"},
    "test_s03_u387_control.js": {"洗脳光線", "集団催眠", "破邪の刻印"},
    "test_s03_u388_tokens_dragunity.js": {"雲魔物－羊雲", "ジュラック・スタウリコ", "ドラグニティ－ピルム", "ドラグニティアームズ－ミスティル"},
    "test_s03_u389_traps3.js": {"死神の巡遊", "神の威光", "ミラクル・フリッパー"},
    "test_s03_u390_partials.js": {"白竜の聖騎士", "魔法の歯車", "人海戦術", "ボスラッシュ"},
    "test_s03_u391_gravity.js": {"重力崩壊", "賢者の聖杯", "スクリーン・オブ・レッド"},
    "test_s03_u392_freeze.js": {"悪夢の鉄檻", "大寒波", "閃光弾"},
    "test_s03_u393_seal.js": {"封魔の呪印", "暴君の暴言", "暗黒界の書物"},
    "test_s03_u394_cannon.js": {"リニアキャノン", "絶対不可侵領域", "極限への衝動"},
    "test_s03_u395_asmo.js": {"堕天使アスモディウス", "不死王リッチー"},
    "test_s03_u396_scent.js": {"魔封じの芳香", "氷結界の破術師", "八つ手サソリ", "A・O・J リバース・ブレイク"},
    "test_s03_u397_cat.js": {"不幸を告げる黒猫", "ボーンクラッシャー", "エレクトロ軍曹"},
    "test_s03_u398_light.js": {"聖なるあかり", "召喚僧サモンプリースト", "デコイドラゴン"},
    "test_s03_u399_princess.js": {"王女の試練", "魔法の国の王女－ピケル", "魔法の国の王女－クラン"},
    "test_s03_u400_coffin.js": {"第一の棺", "第二の棺", "第三の棺", "スピリッツ・オブ・ファラオ"},
    "test_s03_u401_ouija.js": {"ウィジャ盤", "死のメッセージ「E」", "死のメッセージ「A」", "死のメッセージ「T」", "死のメッセージ「H」"},
    "test_s03_u402_chosen.js": {"選ばれし者", "荒野の大竜巻", "竜操術"},
    "test_s03_u403_isolate.js": {"異次元隔離マシーン", "コーリング・マジック"},
    "test_s03_u404_decklock.js": {"次元要塞兵器", "G・B・ハンター", "転生断絶"},
    "test_s03_u405_fusions.js": {"カタパルト・ウォリアー", "ジャンク・バーサーカー", "重爆撃禽 ボム・フェネクス", "異星の最終戦士", "スーパービークロイド－ジャンボドリル"},
    "test_s03_u406_puppet.js": {"地獄の傀儡魔人", "魔人 ダーク・バルター", "不退の荒武者"},
    "test_s03_u407_titan.js": {"ジュラック・タイタン", "サンダー・ユニコーン", "破壊竜ガンドラ"},
    "test_s03_u408_buster.js": {"バスター・モード", "レッド・デーモンズ・ドラゴン／バスター", "ハイパーサイコガンナー／バスター", "アーカナイト・マジシャン／バスター", "ギガンテック・ファイター／バスター", "スターダスト・ドラゴン／バスター", "デスカイザー・ドラゴン／バスター"},
    "test_s03_u409_blackflare.js": {"エクスプロード・ウィング・ドラゴン", "カオス・ゴッデス－混沌の女神－", "黒炎の騎士－ブラック・フレア・ナイト－", "幻影の騎士－ミラージュ・ナイト－"},
    "test_s03_u410_inti.js": {"太陽龍インティ", "月影龍クイラ", "スピード・キング☆スカル・フレイム"},
    "test_s03_u411_equipself.js": {"瞬着ボマー", "精神寄生体", "手錠龍"},
    "test_s03_u412_equips.js": {"災いの装備品", "D・パワーユニット", "コアバスター"},
    "test_s03_u413_fusion.js": {"輝石融合", "パーティカル・フュージョン", "融合禁止エリア"},
    "test_s03_u414_inverz.js": {"インヴェルズの魔細胞", "インヴェルズの斥候", "深緑の魔弓使い", "蒼血鬼"},
    "test_s03_u415_locks.js": {"デッキロック", "不協和音", "王宮の鉄壁", "縮退回路"},
    "test_s03_u416_revivers.js": {"救世竜 セイヴァー・ドラゴン", "レアル・ジェネクス・オラクル", "ミンゲイドラゴン", "不死武士"},
    "test_s03_u417_trap_equips.js": {"植物連鎖", "燃える闘志", "身剣一体", "イービル・ブラスト"},
    "test_s03_u418_unique_name.js": {"神禽王アレクトール", "渋い忍者", "ガガガマジシャン", "ジェスター・コンフィ"},
    "test_s03_u419_unique_more.js": {"エーリアン・リベンジャー", "アマゾネスペット虎", "レプティレス・ヴァースキ", "氷結界の伝道師"},
    "test_s03_u420_foe_field.js": {"エーリアン・スカル", "ヴォルカニック・クイーン", "トーチ・ゴーレム", "溶岩魔神ラヴァ・ゴーレム"},
    "test_s03_u421_procedures.js": {"ヴァンパイアジェネシス", "異次元の一角戦士", "ネオス・ワイズマン", "サイバー・エルタニン"},
    "test_s03_u422_revival_st.js": {"巻きすぎた発条", "スクラップ・オイルゾーン", "増草剤", "血の沼地"},
    "test_s03_u423_st_shields.js": {"フィールドバリア", "宮廷のしきたり", "安全地帯"},
    "test_s03_u424_lp_replace.js": {"D・ライトン", "エクストラ・ヴェーラー", "ライフ・ストリーム・ドラゴン", "ブラックフェザー・ドラゴン"},
    "test_s03_u425_synchro_mats.js": {"モノケロース", "紅蓮地帯を飛ぶ鷹", "共鳴破", "トラパート"},
    "test_s03_u426_material_gifts.js": {"フレア・リゾネーター", "ニードル・ガンナー", "トラスト・ガーディアン", "チェーンドッグ"},
    "test_s03_u427_gap_cards.js": {"コロボックリ", "タイム・イーター", "ビッグ・ワン・ウォリアー", "マスクド・チョッパー", "マツボックル", "原子ホタル", "魔轟神獣チャワ"},
    "test_s03_u428_provenance.js": {"インフェルニティ・ナイト", "グリード・グラード", "コカローチ・ナイト", "ジュラック・イグアノン", "バルーン・リザード", "ブリザード・ウォリアー"},
    "test_s03_u429_summon_rules.js": {"D－HERO ディスクガイ", "コアキメイル・ドラゴ", "スライム増殖炉", "ワーム・ベイト", "暴君の自暴自棄", "氷の女王", "迷える仔羊"},
    "test_s03_u430_guardians.js": {"ガーディアン・エルマ", "ガーディアン・グラール", "ガーディアン・ケースト", "ガーディアン・シール", "ガーディアン・バオウ"},
    "test_s03_u431_gap_misc.js": {"ダーク・ヴァージャー", "ホープ・オブ・フィフス", "マザー・スパイダー", "ローズ・バード", "戦士ラーズ", "薔薇の妖精"},
    "test_s03_u432_continuous_rules.js": {"エレメント・ザウルス", "エレメント・ドラゴン", "ゴーレム", "ブレイドナイト", "マンモス・ゾンビ"},
    "test_s03_u433_koaki_misc.js": {"G・コザッキー", "コアキメイル・デビル", "コアキメイル・パワーハンド", "ターレット・ウォリアー", "デス・カンガルー", "バイス・ドラゴン"},
    "test_s03_u434_battle_misc.js": {"インセクト・プリンセス", "ツインヘッド・ケルベロス", "代打バッター", "白兵戦型お手伝いロボ", "穿孔虫"},
    "test_s03_u435_misc_gap.js": {"ゼロ・ガードナー", "ニュート", "レッサー・デーモン", "創世竜", "同族感電ウィルス"},
    "test_s03_u436_coin_pierce.js": {"アルカナフォースIV－THE EMPEROR", "ドリル・シンクロン", "伝説の賭博師", "混沌の黒魔術師"},
    "test_s03_u437_misc_more.js": {"RAI－JIN", "エレメント・マジシャン", "海竜神－ネオダイダロス"},
    "test_s03_u438_water_equip.js": {"アームズ・シーハンター", "バブル・ショット"},
    "test_s03_u439_garden_rock.js": {"ローズ・テンタクルス", "幻獣ロックリザード", "氷結界の御庭番"},
    "test_s03_u440_traps_flipless.js": {"A・O・J リサーチャー", "モンスターレリーフ", "六武派二刀流", "生命力吸収魔術"},
    "test_s03_u441_hand_choices.js": {"フェイク・ヒーロー", "リグラス・リーパー", "悪魔への貢物", "手札断殺"},
    "test_s03_u442_dice_discard.js": {"グラディアル・チェンジ", "デンジャラスマシン TYPE－6", "バッド・エンド・クイーン・ドラゴン", "暗黒の謀略"},
    "test_s03_u443_traps_revive.js": {"オーバーリミット", "ガスタへの祈り", "スカーレッド・カーペット", "儀水鏡の幻影術"},
    "test_s03_u444_event_traps.js": {"スパイダー・エッグ", "スリップ・サモン", "パイナップル爆弾", "ブロークン・ブロッカー", "ヘル・ブラスト"},
    "test_s03_u445_more_st.js": {"サイバネティック・ヒドゥン・テクノロジー", "デステニー・ミラージュ", "ヘイト・クレバス", "強欲なカケラ", "皆既日蝕の書"},
    "test_s03_u446_traps_more.js": {"念導力", "発条の巻き戻し", "硫酸のたまった落とし穴", "闇霊術－「欲」", "魔の取引"},
    "test_s03_u447_lock_lance.js": {"ツーマンセルバトル", "城壁壊しの大槍", "封神鏡", "挑発", "波動障壁"},
    "test_s03_u448_search_spells.js": {"サイコパス", "バブル・シャッフル", "リゾネーター・エンジン", "レベルアップ!", "六武式三段衝"},
    "test_s03_u449_audit_fixes.js": {"サイバネティック・ヒドゥン・テクノロジー", "破壊輪", "皆既日蝕の書", "連鎖爆撃"},
    "test_s03_u450_pile_spells.js": {"バブル・クラッシュ", "ブレンD", "ヴォルカニック・チャージ", "次元融合", "魔の試着部屋"},
    "test_s03_u451_mixed_gap.js": {"エア・サーキュレーター", "ダーク・リペアラー", "浅すぎた墓穴", "暗黒界の魔神 レイン", "赤鬼"},
    "test_s03_u452_grave_banish.js": {"システム・ダウン", "トロイボム", "墓掘りグール", "奇跡の発掘"},
    "test_s03_u453_gorgon_light.js": {"ゴーゴンの眼", "裁きの光", "連鎖除外"},
    "test_s03_u454_scope_unity.js": {"同姓同名同盟条約", "古代の遠眼鏡", "コザッキーの研究成果", "成功確率0%", "電磁シールド", "友情 YU－JYO"},
    "test_s03_u456_target_source.js": {"氷結界の御庭番", "ヴァイロン・セグメント", "闇の侯爵ベリアル"},
    "test_s03_u457_target_consumers.js": {"ヴァイロン・エプシロン", "ターボ・ウォリアー", "救世の儀式", "ジュラック・タイタン", "機皇城", "地天の騎士ガイアドレイク", "安全地帯", "エレキリギリス"},
    "test_s03_u459_opponent_targeting.js": {"ホルスのしもべ", "メタルシルバー・アーマー"},
    "test_s03_u460_kusanagi.js": {"草薙剣"},
    "test_s03_u461_baou.js": {"破邪の大剣－バオウ"},
    "test_s03_u465_supervise.js": {"スーペルヴィス"},
    "test_s03_u466_special_dual_summon.js": {"スペシャル・デュアル・サモン"},
    "test_s03_u467_double_trap_hole.js": {"二重の落とし穴"},
    "test_s03_u468_target_scope.js": {"ホルスのしもべ", "メタルシルバー・アーマー"},
    "test_s03_u469_heavy_weapon.js": {"強化支援メカ・ヘビーウェポン"},
    "test_s03_u470_condition_targetable.js": {"リビングデッドの呼び声", "リミット・リバース", "幻獣の角", "強制脱出装置", "月の書", "禁じられた聖槍", "精神操作", "ヒーロー・ブラスト", "六武衆の荒行", "デュアルスパーク"},
    # S03-U471: only the two cards whose full flow is asserted end to end count as exercised. The multi-target cards (貪欲な壺 etc., RULING_UNRESOLVED) and the 15 survey cards appear as fixtures and must NOT gain TESTED.
    "test_s03_u471_prep_tx.js": {"リビングデッドの呼び声", "月の書"},
    # S03-U472: the five multi-target cards, each driven through activation -> target selection -> chain -> resolution -> Replay audit (+ a chain-link Save/Load) under the Metal Silver Armor ruling.
    "test_s03_u472_multi_target_armor.js": {"貪欲な壺", "諸刃の活人剣術", "毒蛇の供物", "TGX3－DX2", "ゴッドバードアタック"},
    # S03-U473: 次元幽閉 (targets:true), driven through attack declaration -> activation -> target selection -> chain -> resolution -> Replay audit, with target immunity (ホルスのしもべ / オベリスクの巨神兵) and a 2-VM Save/Load.
    "test_s03_u473_dimensional_prison_targeting.js": {"次元幽閉"},
    # S03-U474: cost selection is not a target selection. Each card below is driven end to end (activation -> cost choice -> effect target choice / commit -> resolution -> Replay audit) with a target-immune cost candidate.
    # D・クリーナン / アサルト・スピリッツ appear only as classification fixtures (cancelled at the target choice) and must NOT gain TESTED.
    "test_s03_u474_cost_selection_phase.js": {"デュアルスパーク", "ゴッドバードアタック", "サシカエル", "泣き神の石像", "ジェム・エンハンス", "ダーク・アームド・ドラゴン", "ワーム・キング"},
    # S03-U475: v70SelectExactly (18 target-hook cards: the selection rides the chain; 4 cost-hook cards: resolved in place). Each card is driven activation -> selection -> chain -> resolution -> the chosen cards (by uid) move -> Replay audit; the target-hook cards also a 2-VM Save/Load.
    "test_s03_u475_v70_select_exactly.js": {"グラディアル・リターン", "サルベージ", "スネーク・レイン", "バッテリーリサイクル", "急速充電器", "悪夢再び", "闇の量産工場", "希望の光", "暗黒よりの軍勢", "狡猾な落とし穴", "転生の予言", "隠された魔導書", "メタボ・シャーク", "原初の種", "ガトムズの緊急指令", "サイコ・チャージ", "儀水鏡の瞑想術", "ガスタの交信", "魔法再生", "魔法石の採掘", "ブラック・ブースト", "ガスタの静寂 カーム"},
    # S03-U476: the 8 single-target cards that selected a card without declaring targets:true (the audit pin lists the 39 classified, unfixed candidates). Each is driven trigger/activation -> target choice -> chain -> resolution -> the chosen card (uid) -> Replay audit (+ chain-link Save/Load), with a target-immune candidate (オベリスクの巨神兵 / メタルシルバー・アーマー). The fixture cards (ハネワタ, サイクロン, ライオウ ...) must NOT gain TESTED.
    "test_s03_u476_selection_targets.js": {"スノーマンイーター", "マスター・ヒュペリオン", "万力魔神バイサー・デス", "D・ステープラン", "カラクリ参謀 弐四八", "カラクリ忍者 九壱九", "暗黒界の龍神 グラファ", "暗黒界の武神 ゴルド"},
    # S03-U477: the Dark World discard triggers (darkWorldDiscard) recognise the discarded card by uid after a Save/Load. Each of the 5 cards is driven by the controller's own effect (暗黒界の門) and by the opponent's effect (手札抹殺), with and without a save (saveDuel -> new VM -> offerResumeDuel), plus a same-name copy, a cost discard (鳳翼の爆風) and uid-less cards. The fixtures (ワイト, ゴブリン突撃部隊, ギガンテス, 手札抹殺, 鳳翼の爆風 ...) must NOT gain TESTED.
    "test_s03_u477_dark_world_resume.js": {"暗黒界の龍神 グラファ", "暗黒界の武神 ゴルド", "暗黒界の狩人 ブラウ", "暗黒界の軍神 シルバ", "暗黒界の術師 スノウ"},
}


def scan_tests(card_names: set[str]):
    joined_by_file = {}
    for path in sorted((ROOT / "tools").glob("test*.js")):
        if path.name in NON_CARD_TEST_FILES:
            continue
        joined_by_file[path] = read_text(path)
    hits = defaultdict(list)
    # This is deliberately conservative enough for 5k cards and small test corpus.
    for name in card_names:
        if not name:
            continue
        for path, text in joined_by_file.items():
            focus = CARD_TEST_FOCUS.get(path.name)
            if focus is not None and name not in focus:
                continue
            if name in text:
                hits[name].append(str(path.relative_to(ROOT)))
    return hits


def load_overrides():
    if not OVERRIDES_PATH.exists():
        return {}
    raw = json.loads(read_text(OVERRIDES_PATH))
    if isinstance(raw, dict) and "cards" in raw:
        return raw["cards"] or {}
    return raw if isinstance(raw, dict) else {}


def kind_label(card: dict) -> str:
    return {"m": "monster", "s": "spell", "t": "trap"}.get(card.get("k"), str(card.get("k") or "unknown"))


def is_generic_no_effect(card: dict) -> bool:
    if card.get("k") != "m":
        return False
    st = card.get("st") or []
    if "通常" in st and not card.get("ex", False):
        return True
    # Effectless Synchro/Xyz monsters still require summon-procedure support, but
    # they do not need a card-specific effect script. Keep Fusion out of this
    # shortcut until the first-class Fusion pipeline is complete.
    e = str(card.get("e") or "").strip()
    recipe_only = bool(e) and "\n" not in e and not any(k in e for k in ["①", "②", "このカード", "発動", "場合", "できる", "効果"])
    if card.get("ex") and recipe_only and ("シンクロ" in st or "エクシーズ" in st):
        return True
    return False


def complexity_score(card: dict) -> int:
    e = str(card.get("e") or "")
    score = min(45, len(e) // 32)
    hard = [
        "ダメージステップ", "ダメージ計算", "チェーン", "代わりに", "無効にして", "発動を無効",
        "特殊召喚を無効", "エクストラデッキ", "融合召喚", "シンクロ召喚", "エクシーズ召喚",
        "このカード名", "ルール上", "墓地へ送る代わり", "除外する代わり", "同時に", "できない",
    ]
    medium = ["墓地", "除外", "装備", "コントロール", "エンドフェイズ", "スタンバイフェイズ", "戦闘"]
    score += sum(8 for k in hard if k in e)
    score += sum(3 for k in medium if k in e)
    if card.get("ex"):
        score += 5
    return score


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", default=str(OUT_JSON))
    ap.add_argument("--markdown", default=str(OUT_MD))
    args = ap.parse_args()

    cards = json.loads(read_text(DB_PATH))
    registrations, auto_names = scan_card_sources()
    db_names = {c.get("n", "") for c in cards}
    test_hits = scan_tests(db_names)
    overrides = load_overrides()

    out_cards = []
    counts = Counter()
    impl_kind_counts = Counter()
    missing_registration_names = sorted(set(registrations) - db_names)
    duplicate_db_names = sorted(n for n, cnt in Counter(c.get("n", "") for c in cards).items() if n and cnt > 1)

    for idx, card in enumerate(cards):
        name = card.get("n", "")
        regs = registrations.get(name, [])
        tests = test_hits.get(name, [])
        auto = name in auto_names
        override = overrides.get(name, {}) if isinstance(overrides.get(name, {}), dict) else {"status": overrides.get(name)}
        forced = override.get("status")
        reason = override.get("reason", "")

        if str(card.get("d") or "9999-99-99") > CUTOFF:
            status = "OUT_OF_SCOPE"
            reason = reason or f"release date after {CUTOFF}"
        elif forced:
            status = forced
        elif regs:
            status = "TESTED" if tests else "IMPLEMENTED"
        elif auto:
            status = "PARTIAL"
            reason = reason or "AUTO_DECK_TABLE coarse implementation; requires card-specific historical review"
        elif is_generic_no_effect(card):
            status = "GENERIC_OK"
            reason = reason or "normal non-Extra-Deck monster; no card-specific effect script required"
        else:
            status = "NOT_STARTED"

        counts[status] += 1
        for r in regs:
            impl_kind_counts[r["kind"]] += 1
        out_cards.append({
            "index": idx,
            "code": card.get("c"),
            "name": name,
            "kind": kind_label(card),
            "subtype": card.get("sub"),
            "date": card.get("d"),
            "extra": bool(card.get("ex")),
            "status": status,
            "reason": reason,
            "complexity_score": complexity_score(card),
            "registrations": regs,
            "auto_table": auto,
            "tests": tests,
        })

    payload = {
        "schema_version": 1,
        "cutoff": CUTOFF,
        "total_db_cards": len(cards),
        "counts": dict(sorted(counts.items())),
        "registration_kind_counts": dict(sorted(impl_kind_counts.items())),
        "static_registration_name_count": len(registrations),
        "auto_table_name_count": len(auto_names),
        "duplicate_db_names": duplicate_db_names,
        "registration_names_missing_from_db": missing_registration_names,
        "cards": out_cards,
    }
    Path(args.json).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    active = len(cards) - counts.get("OUT_OF_SCOPE", 0)
    done = counts.get("TESTED", 0) + counts.get("IMPLEMENTED", 0) + counts.get("GENERIC_OK", 0)
    md = [
        "# Script Coverage",
        "",
        "Generated by `python tools/script_coverage.py`.",
        "",
        f"- Card DB: **{len(cards)}**",
        f"- In-scope (<= {CUTOFF}): **{active}**",
        f"- Fully covered by explicit script or generic no-effect handling: **{done}**",
        f"- Static registration names found: **{len(registrations)}**",
        f"- AUTO_DECK_TABLE names (PARTIAL unless explicitly scripted): **{len(auto_names)}**",
        "",
        "## Status counts",
        "",
        "| Status | Count |",
        "|---|---:|",
    ]
    for status in ["TESTED", "IMPLEMENTED", "GENERIC_OK", "PARTIAL", "ENGINE_GAP", "NOT_STARTED", "OUT_OF_SCOPE"]:
        md.append(f"| {status} | {counts.get(status, 0)} |")
    md += [
        "",
        "`TESTED` means a static registration exists and the card name appears in a dedicated regression file. It does **not** prove every ruling edge case. `PARTIAL` must never be counted as complete.",
        "",
        "Machine-readable detail: `data/script_coverage.json`.",
    ]
    Path(args.markdown).write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps(payload["counts"], ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
