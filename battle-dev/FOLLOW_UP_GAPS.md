# Follow-up gaps — frozen at Astra System 01

The user stopped expansion and requested a clean System01 checkpoint. These are records of findings already made; no System02 work or new cluster analysis was started after scope freeze.

| Item | Finding retained | This checkpoint |
|---|---|---|
| Dragunity Knight Vajrayana | Grave equip is available, but own ATK doubling must interact correctly with existing additions, effect negation and reset. Setting current ATK × 2 through the earlier layer double-counts additions. | NOT_STARTED unchanged; no partial registration. |
| Aklys / Gilfer | Equipment departure order, cause and optional-when timing need their own historical ruling and producer audit. General orphan destruction notifications beyond detach/send-to-grave are not claimed as newly complete. | Original status unchanged. |
| Brandistock | Existing attack-limit consumer does not consume an equipped source's continuous two-attack grant. | ENGINE_GAP unchanged. |
| Mistletainn / Levatin / Get Ride! / Gilford Legend / Guardian Elma | Additional summon procedure, Union restrictions, multiple equipment assignment or summon-lock requirements remain beyond simple placement. | Original statuses unchanged. |
| Broader trigger/UI persistence | System01 verifies saved registry target choices and committed trigger chains. It does not claim persistence for every legacy callback or for every UI sheet between choices. | No broad rewrite. |
| Other engine gaps | Previously recorded missing effect/activation gates, summon restrictions and provenance limitations remain. | No new investigation or off-target status promotion. |
| Baseline diagnostic output | Baseline Full Gate emits ReferenceError diagnostics for c1ElementOnField / isEffectNegated in caught legacy paths. | Recorded and compared, not expanded into unrelated repairs. |

System01 successfully exercises Dux → Phalanx → Gae Bulg through real summon/chain/processor entry points. This does not make a full Dragunity deck complete: Vajrayana and the above support remain incomplete. No user-specific 40/15 deck list was supplied, so no numerical claim about the user's actual deck is made. REDMD and existing tested cards are not reclassified.

Stop after the clean System01 checkpoint. Continuing requires a new user instruction.

---

# S03 follow-ups (current as of S03-U187)

| Item | Finding | Next |
|---|---|---|
| Attribute recruiters (`v41DefineAttributeRecruiter`, 6 cards) | Done in S03-U157: on engine/1ZT, the Deck examined at resolution, activatable with no candidate, SS locks such as 大天使クリスティア applied. | — |
| AUTO-table recruiters / searchers with extra effects | (S03-U167 did オシャレオン, ジェイドナイト, 機皇兵スキエル・アイン, バイオファルコン.) (S03-U169 did ナチュル・チェリー, プチトマボー, 素早いムササビ.) (S03-U185 did サイバー・ラーバァ, メカウサー, ガスタ・サンボルト, 電池メン－ボタン型.) Left: スーパイ, ジェムナイト: the Deck part fits engine/1ZT, but other parts of their texts are missing (costs, continuous effects, other triggers). | Per-card units using `spec.extra` / `spec.before` / `spec.script`; they stay PARTIAL until then. |
| Simultaneous events | S03-U156: leave-field events of 2+ cards are one batch. S03-U159: a summon's Tributes / materials and the summon success are one batch. Other kinds (e.g. an effect that destroys and then draws / changes LP) are still drained one by one. | Generalise further only with a concrete card case. |
| `battleProof()` text fallback | Fixed in S03-U158: only the unconditional self sentence is read from the text. Not-yet-scripted cards whose protection is conditional / once per turn / for others now have **no** protection until declared: サイバー・ブレイダー (3 opponent monsters: 「相手が発動したカードの効果は無効化される」), トラスト・ガーディアン (a protection granted to the Synchro Monster it was material for), フリントロック (「フリント」 equip) (all NOT_STARTED / ENGINE_GAP / PARTIAL). | Per-card units with `protectV21` (S03-U160 薄幸の乙女 / スカー・ウォリアー; S03-U161 イレカエル / エレキーウィ / 万力魔神バイサー・デス; S03-U165 デュアル・ソルジャー / 幻獣サンダーペガス / E・HERO テンペスター; S03-U166 D・ステープラン). |
| Start Step | Done in S03-U170: a POINT kind 'battleStart' before the battle command. | — |
| Gemini batch 4 | Parked tree `s03_gemini4_wip_after_u155` (not published). | Resume after the engine units. |
| User items | U114 and U121 confirmed on device by the user (2026-09-26). Optional destruction substitutes: done in S03-U173 as decided (pause at the destruction, the controller chooses). U172 (Player2's saved deck) and U173 await the device check. | Device check of `acode/battle_acode_s03_u173.html`. |
| Contact fusion (engine/1ZW) | Done in S03-U174 for E・HERO グラン・ネオス / エアー・ネオス / フレア・ネオス and キメラテック・フォートレス・ドラゴン. S03-U176 did アクア / マリン・ネオス, XY / XZ / YZ / XYZ, VW. S03-U177 did 剣闘獣ヘラクレイノス, E・HERO ブラック・ネオス. S03-U178 did VWXYZ and アーミタイル. S03-U179 did ストーム / マグマ・ネオス, S03-U181 ガイザレス / ゲオルディアス, S03-U182 グロー / カオス・ネオス: all 21 contact-fusion cards are implemented. A full Monster Zone is handled since S03-U175 (a set with an own monster frees a zone). | Per-card units: `declareContactFusionS03(name)` + the rest of the text. |
| 剣闘獣 (engine/1ZZ) | S03-U180 stage 1 (9 cards + セクトル), S03-U181 stage 2 (スパルティクス, アレクサンデル, サムニテ, オクタビウス, ゲオルディアス, ガイザレス). S03-U183 did the 闘器 / 戦車 / 底力, S03-U184 ダリウス / ラニスタ / 剣闘訓練所 / ハンディキャップマッチ! / スレイブタイガー. Left: 剣闘獣の檻－コロッセウム (ENGINE_GAP). | Per-card later. |
| IMPLEMENTED without a dedicated test | S03-U186 found 3 broken scripts among 10 sample-deck cards (裁きの龍, Sin サイバー・エンド・ドラゴン, 強制転移). 73 IMPLEMENTED cards remain untested; the 「Sin」 monsters were fixed in S03-U187 (left: Sin パラドクス・ドラゴン, Sin トゥルース・ドラゴン, Sin パラレルギア). | Continue: test the remaining IMPLEMENTED cards, highest play value first. |
| Optional destruction substitutes (engine/1ZV) | Done in S03-U173 for 真六武衆－シエン / 六武衆－ザンジ / 六武衆－ヤイチ / ガチガチガンテツ (`destroySubstituteS03`). Not intercepted yet: destructions made by a script's raw `act()` instead of `API.destroy` / `destroyAll`, destruction as a cost, destruction outside a chain link resolution (e.g. rule-based self-destruction), 「破壊し除外」 (FX_DESTROY_BANISH). A script step that looks at the destroyed card right after `API.destroy` in the same resolution sees the board before the decision. Other substitute texts (魔法都市エンディミオン ④, マシンナーズ・ギアフレーム union, 「代わりに…を墓地へ送る／除外する」) are not declared. | Per-card auto settings (always use / never use) later, as the user decided; more cards when their scripts are touched. |
| Synchro / Xyz material legality | Done in S03-U163: the summon entry point refuses an illegal set. Two gate tests had illegal materials (U156 ゴヨウ・ガーディアン, U46 エヴォルカイザー・ラギア); both fixed. | — |
| v21 targeting check | Fixed in S03-U168: the resolving targeting link's targeted uids are stamped on the action (a.srcS03.tg) and checked per destroyed card. | — |
