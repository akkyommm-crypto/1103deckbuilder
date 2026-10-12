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
