# P4 SetcodeAuthority: overlay の生成と検証（authority 第5版が唯一の根拠）
#
#   data/setcode_overlay_v4.json   … authority 本体（passcode単位・人／ツールが読む）
#   data/03_setcode_overlay_v4.js  … 上記を埋め込んだ JS（build_manifest で連結される）
#
# carddata.json は読むだけで変更しない。
# membership は passcode でのみ表現し、実行時に名前一致を使わせない。
#
#   python tools/gen_setcode_overlay.py           … 生成
#   python tools/gen_setcode_overlay.py --check   … 生成物が最新か検証（差分があれば非0終了）

from pathlib import Path
import json, sys

ROOT = Path(__file__).resolve().parents[1]
DB   = ROOT / "data" / "carddata.json"
JSON_OUT = ROOT / "data" / "setcode_overlay_v4.json"
JS_OUT   = ROOT / "data" / "03_setcode_overlay_v4.js"

db = json.loads(DB.read_text(encoding="utf-8"))
by_name = {}
for c in db:
    by_name.setdefault(c["n"], c)

def setcodes(c):
    sc = c.get("setcode")
    if sc is None: return []
    return [int(v) for v in (sc if isinstance(sc, list) else [sc])]

# --- authority 第5版の確定内容 -------------------------------------------
# rule は「生成時の導出規則」であり、実行時には使わない。生成結果の passcode だけが authority。
IRON_CHAIN = [53152590, 26157485, 80769747, 19974580, 53274132]
CHRYSALIS  = [17363041, 42682609, 43751755, 29246354, 42239546, 16241441]
D_EXCLUDE  = {63730624, 14613029}   # ダブルツールD&C(ルビ=ディーアンドシー) / ブレンD(ルビ=ディー)
# 「極神」は3枚のみ。NORDIC setcode(0x1025) は極星17枚を含む上位集合なので代用できない。
# 極神聖帝オーディンには setcode が無く、setcode 由来の述語では取りこぼす。
AESIR      = [30604579, 67098114, 93483212]   # 極神皇トール / 極神皇ロキ / 極神聖帝オーディン

SPEC = [
 dict(key="D_MORPHTRONIC", jp="D（ディフォーマー）", ruby="ディフォーマー", rule="setcode_and_name",
      arg=[0x102c, "D"], exclude=sorted(D_EXCLUDE),
      basis="公式ルビ=ディフォーマー（公式DB cid=7927『ディフォーマー・ゲイザー』）。"
            "ダブルツールＤ＆Ｃ(ディーアンドシー)/ブレンＤ(ディー)/Ｄ－ＨＥＲＯ(デステニー)は非member",
      ads="EDOPro Morphtronic(36枚)はテーマ集合であり named predicate とは別物であることを確認",
      note="DBが全角Ｄを半角Dへ正規化しているため、実行時に名前では判別できない"),
 dict(key="C_CHAIN", jp="C（チェーン／Iron Chain）", ruby="チェーン", rule="idlist", arg=IRON_CHAIN,
      basis="「C」と名のついた を参照するのはこの5枚のみ",
      ads="EDOPro archetype=Iron Chain と一致",
      note="C_CHRYSALIS と絶対に統合しないこと"),
 dict(key="C_CHRYSALIS", jp="C（クリサリス／Chrysalis）", ruby="クリサリス", rule="idlist", arg=CHRYSALIS,
      basis="ネオスペース依存で N・カードを呼ぶ別系統。「C」と名のついた を参照しない",
      ads="EDOPro archetype=Chrysalis と一致",
      note="C_CHAIN と絶対に統合しないこと"),
 dict(key="N_NEOSPACIAN", jp="N（ネオスペーシアン）", ruby="ネオスペーシアン", rule="prefix", arg="N・",
      basis="ルビ=ネオスペーシアン", ads="EDOProはElemental HERO配下。JP名称指定は独立"),
 dict(key="NEOS", jp="ネオス", ruby=None, rule="name", arg="ネオス",
      basis="「ネオス」名称指定", ads="EDOProはElemental HERO配下。JP名称指定は独立"),
 dict(key="ROID", jp="ロイド", ruby=None, rule="name", arg="ロイド",
      basis="公式裁定でマジカル・アンドロイド(サイキック族)がmember。種族非依存の literal 包含",
      ads="EDOPro Roid(65枚)にダークジェロイド/アーマロイドガイデンゴー/極戦機王ヴァルバロイドを確認"),
 dict(key="ARCHFIEND_DEMON", jp="デーモン", ruby=None, rule="name", arg="デーモン",
      basis="デーモンの召喚が \"always treated as an 'Archfiend' card\"",
      ads="EDOPro Archfiend で確認"),
 dict(key="PHANTOM_BEAST", jp="幻獣", ruby=None, rule="name", arg="幻獣",
      basis="幻獣王ガゼル/有翼幻獣キマイラともに \"always treated as a「Phantom Beast」card\"",
      ads="EDOPro で明示テキストを確認"),
 dict(key="SIN", jp="Sin", ruby="シン", rule="prefix", arg="Sin",
      basis="接頭辞Sin", ads="EDOPro Malefic と一致"),
 dict(key="ASSAULT_MODE", jp="/バスター", ruby="バスター", rule="name", arg="／バスター",
      basis="カード名は全角／(U+FF0F)、テキストは半角/", ads="EDOPro Assault Mode と一致",
      note="全角/半角の不一致により実行時の名前一致は不可"),
 dict(key="MEKLORD", jp="機皇", ruby=None, rule="name", arg="機皇",
      basis="漢字。ルビ揺れなし", ads="EDOPro Meklord と一致"),
 dict(key="MEKLORD_ARMY", jp="機皇兵", ruby=None, rule="name", arg="機皇兵",
      basis="機皇の部分集合", ads="EDOPro Meklord Army と一致"),
 dict(key="EARTHBOUND", jp="地縛神", ruby=None, rule="name", arg="地縛神",
      basis="漢字", ads="EDOPro Earthbound Immortal と一致"),
 dict(key="VENOM", jp="ヴェノム", ruby=None, rule="name", arg="ヴェノム",
      basis="毒蛇の供物は名前に含まず非member", ads="EDOPro Venom と一致"),
 dict(key="REPTILIANNE", jp="レプティレス", ruby=None, rule="name", arg="レプティレス",
      basis="カタカナ", ads="EDOPro Reptilianne と一致"),
 dict(key="ANCIENT_GEAR", jp="アンティーク・ギア", ruby="アンティーク・ギア", rule="name", arg="古代の機械",
      basis="★ルビが群名、表示名は「古代の機械」", ads="EDOPro Ancient Gear と一致",
      note="ルビ由来の述語。表示名から導出しており実行時判定には使わない"),
 dict(key="BLACK_SCORPION", jp="黒蠍", ruby=None, rule="name", arg="黒蠍",
      basis="首領・ザルーグ/首領亀は名前に含まず非member", ads="EDOPro と一致"),
 dict(key="BAMBOO_SWORD", jp="竹光", ruby=None, rule="name", arg="竹光",
      basis="装備魔法条件は別レイヤ", ads="EDOPro Bamboo Sword と一致"),
 dict(key="VOLCANIC", jp="ヴォルカニック", ruby=None, rule="name", arg="ヴォルカニック",
      basis="ブレイズ・キャノンは別群", ads="EDOPro Volcanic と一致"),
 dict(key="BLAZE_CANNON", jp="ブレイズ・キャノン", ruby=None, rule="name", arg="ブレイズ・キャノン",
      basis="ヴォルカニックとは別群", ads="EDOPro Blaze Cannon と一致"),
 dict(key="EVOLTILE", jp="エヴォルド", ruby=None, rule="name", arg="エヴォルド",
      basis="エヴォルダーと別述語", ads="EDOPro Evoltile と一致"),
 dict(key="EVOLSAUR", jp="エヴォルダー", ruby=None, rule="name", arg="エヴォルダー",
      basis="エヴォルドと別述語", ads="EDOPro Evolsaur と一致"),
 dict(key="WATT", jp="エレキ", ruby=None, rule="name", arg="エレキ",
      basis="カタカナ", ads="EDOPro Watt と一致"),
 dict(key="TOMABO", jp="トマボー", ruby=None, rule="name", arg="トマボー",
      basis="S03-U169: 「トマボー」と名のついたモンスター（プチトマボー）。トマボー／プチトマボーの2枚",
      ads="EDOPro Tomabo と一致"),
 dict(key="GAERU", jp="ガエル", ruby=None, rule="name", arg="ガエル",
      basis="S03-U161: 「ガエル」と名のついたモンスター（イレカエル）。イレカエル・サシカエル・粋カエル・フロッグ・バリアは名前に「ガエル」を含まず非member",
      ads="EDOPro Frog(setcode 0x1029) は カエル 系と魔法を含む上位集合なので代用できない"),
 dict(key="GEM", jp="ジェム", ruby=None, rule="name", arg="ジェム",
      basis="S03-U307: 「ジェム」と名のついたカード。名前にジェムを含む24枚（ジェムナイト各種・ジェムエレファント・ジェムタートル・ジェムレシス・ジェム・マーチャント・ジェム・エンハンス・ジェムフラッシュエナジー・カウンター・ジェム）。ジェムナイトは名前にジェムを含むので member",
      ads="EDOPro Gem- は同系統。setcode 0x100f はジェムナイト用で、ジェム・エンハンス／輝石融合／パーティカル・フュージョンを含むため代用できない"),
 dict(key="GEMKNIGHT", jp="ジェムナイト", ruby=None, rule="name", arg="ジェムナイト",
      basis="S03-U307: 「ジェムナイト」と名のついたカード（モンスター16枚＋ジェムナイト・フュージョン）。setcode 0x100f(20枚)から名前にジェムナイトを含まないジェム・エンハンス・輝石融合・パーティカル・フュージョンを除外",
      ads="EDOPro Gem-Knight と同系統だが setcode は上位集合のため名前で定義"),
 dict(key="RESONATOR", jp="リゾネーター", ruby=None, rule="name", arg="リゾネーター",
      basis="カタカナ", ads="EDOPro Resonator と一致"),
 dict(key="PENGUIN", jp="ペンギン", ruby=None, rule="name", arg="ペンギン",
      basis="大皇帝ペンギンのテキストで述語の実在を確認", ads="EDOPro Penguin と一致"),
 dict(key="SIX_SAMURAI_NAMED", jp="六武衆", ruby=None, rule="name", arg="六武衆",
      basis="setcode 0x1000(39枚)から紫炎系17枚を除外。真六武衆を含む", ads="EDOPro Six Samurai と一致",
      note="setcode 0x1000 はテーマ集合であり述語ではない"),
 dict(key="CLOUDIAN", jp="雲魔物", ruby=None, rule="name", arg="雲魔物",
      basis="setcode 0x1022(18枚)から支援6枚を除外", ads="EDOPro Cloudian と一致"),
 dict(key="AMAZONESS", jp="アマゾネス", ruby=None, rule="name", arg="アマゾネス",
      basis="setcode 0x1028(16枚)から女王の選択を除外", ads="EDOPro Amazoness と一致"),
 dict(key="AESIR", jp="極神", ruby=None, rule="idlist", arg=AESIR,
      basis="「極神」と名のついたモンスターは3枚のみ。極星(NORDIC setcode 0x1025)とは別述語",
      ads="EDOPro Aesir と一致",
      note="NORDIC(0x1025)は極星17枚を含む上位集合。極神聖帝オーディンはsetcodeを持たないためsetcode由来の述語では表現できない"),
 # --- 既存setcodeが述語と完全一致すると検証済みの5群 ---
 dict(key="WORM", jp="ワーム", ruby=None, rule="setcode", arg=0x100e, setcode_exact=True,
      basis="setcode==述語 完全一致（支援混入0・欠落0）", ads="EDOPro Worm と一致"),
 dict(key="ICE_BARRIER", jp="氷結界", ruby=None, rule="setcode", arg=0x100d, setcode_exact=True,
      basis="完全一致", ads="EDOPro Ice Barrier と一致"),
 dict(key="FABLED", jp="魔轟神", ruby=None, rule="setcode", arg=0x101c, setcode_exact=True,
      basis="完全一致", ads="EDOPro Fabled と一致"),
 dict(key="GUSTO", jp="ガスタ", ruby=None, rule="setcode", arg=0x1011, setcode_exact=True,
      basis="完全一致", ads="EDOPro Gusto と一致"),
 dict(key="GENEX", jp="ジェネクス", ruby=None, rule="setcode", arg=0x102d, setcode_exact=True,
      basis="完全一致", ads="EDOPro Genex と一致"),
]

def resolve(spec):
    r, a = spec["rule"], spec["arg"]
    if r == "prefix":  mem = [c for c in db if c["n"].startswith(a)]
    elif r == "name":  mem = [c for c in db if a in c["n"]]
    elif r == "setcode": mem = [c for c in db if a in setcodes(c)]
    elif r == "idlist":
        idx = {c["c"]: c for c in db}
        mem = [idx[i] for i in a if i in idx]
    elif r == "setcode_and_name":
        code, key = a
        mem = [c for c in db if code in setcodes(c) and key in c["n"]]
    else:
        raise SystemExit("unknown rule " + r)
    ex = set(spec.get("exclude") or [])
    return [c for c in mem if c["c"] not in ex]

def build():
    groups = {}
    for spec in SPEC:
        mem = resolve(spec)
        groups[spec["key"]] = {
            "jp": spec["jp"],
            "ruby": spec.get("ruby"),
            "setcode_exact": bool(spec.get("setcode_exact")),
            # setcode_exact の群だけ、実行時に既存 setcode で解決してよい（検証済み5群）
            "setcode": (spec["arg"] if spec.get("setcode_exact") else None),
            "basis": spec["basis"],
            "ads": spec["ads"],
            "note": spec.get("note"),
            "members": sorted(c["c"] for c in mem),
            "member_names": [c["n"] for c in sorted(mem, key=lambda x: x["n"])],
        }
    # 件数は3種類あり混同しやすいので、名前で意味を固定する。
    #   authority_unique_passcode_count … 全34predicateのユニークpasscode（= 474）
    #   overlay_unique_passcode_count   … setcode_exact 5群を除いたユニーク（= 328）
    #   total_membership_count          … 全predicateのmember総数・重複込み（= 479）
    authority_uniq = sorted({p for g in groups.values() for p in g["members"]})
    overlay_uniq = sorted({p for g in groups.values() if not g["setcode_exact"] for p in g["members"]})
    payload = {
        "schema_version": 1,
        "authority_version": "P4-v8",   # S03-U161: +GAERU (10 passcodes); S03-U169: +TOMABO (2); S03-U307: +GEM (24), +GEMKNIGHT (17)
        "generated_from": "data/carddata.json (read-only)",
        "rule": "membership は passcode でのみ表現する。実行時に名前一致・ruby推測を行わない。",
        "predicate_count": len(groups),
        "authority_unique_passcode_count": len(authority_uniq),
        "overlay_unique_passcode_count": len(overlay_uniq),
        "total_membership_count": sum(len(g["members"]) for g in groups.values()),
        "count_glossary": {
            "authority_unique_passcode_count": "全predicateのユニークpasscode数",
            "overlay_unique_passcode_count": "setcode_exact群を除いたユニークpasscode数（overlay固有）",
            "total_membership_count": "全predicateのmember総数（複数群に属するpasscodeは重複計上）",
        },
        "setcode_exact_groups": sorted(k for k, g in groups.items() if g["setcode_exact"]),
        "groups": groups,
    }
    return payload

def emit_js(payload):
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    return ("/* GENERATED by tools/gen_setcode_overlay.py — DO NOT EDIT BY HAND.\n"
            "   Source of truth: data/setcode_overlay_v4.json\n"
            "   P4 SetcodeAuthority overlay (passcode-only membership). */\n"
            "const SETCODE_OVERLAY_V4 = " + body + ";\n")

def main():
    payload = build()
    js = emit_js(payload)
    pretty = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    # 行末はプロジェクト標準の LF に固定する（Windows の CRLF 変換を無効化）。
    def read_lf(p):
        return p.read_bytes().decode("utf-8") if p.exists() else None
    def write_lf(p, text):
        with open(p, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
    if "--check" in sys.argv:
        ok = True
        if read_lf(JSON_OUT) != pretty:
            print("STALE: data/setcode_overlay_v4.json"); ok = False
        if read_lf(JS_OUT) != js:
            print("STALE: data/03_setcode_overlay_v4.js"); ok = False
        print("overlay check:", "OK" if ok else "STALE")
        raise SystemExit(0 if ok else 1)
    write_lf(JSON_OUT, pretty)
    write_lf(JS_OUT, js)
    print(f"predicates={payload['predicate_count']} "
          f"authority_unique={payload['authority_unique_passcode_count']} "
          f"overlay_unique={payload['overlay_unique_passcode_count']} "
          f"total_membership={payload['total_membership_count']}")

if __name__ == "__main__":
    main()
