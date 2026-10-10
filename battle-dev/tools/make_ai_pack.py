from pathlib import Path
import argparse, re, shutil, zipfile, json

ROOT=Path(__file__).resolve().parents[1]
PACKS={
 'chain':['engine/30_processor_chain_battle.js','engine/40_legal_script_engine.js','engine/20_effect_primitives_ex.js'],
 'summon':['engine/70_summon_procedures.js','engine/40_legal_script_engine.js','engine/00_state_actions.js'],
 'battle':['engine/30_processor_chain_battle.js','engine/60_damage_segoc_ui_helpers.js','engine/00_state_actions.js'],
 'card':['engine/40_legal_script_engine.js','engine/20_effect_primitives_ex.js'],
 'data':['data/80_test_decks.js','engine/00_state_actions.js'],
 'ui':['ui/10_render_input.js','engine/60_damage_segoc_ui_helpers.js','styles/app.css'],
 'save':['runtime/50_actions_save.js','runtime/90_boot.js','engine/00_state_actions.js'],
 'core':['engine/00_state_actions.js','engine/20_effect_primitives_ex.js','engine/30_processor_chain_battle.js','engine/40_legal_script_engine.js','engine/60_damage_segoc_ui_helpers.js','engine/70_summon_procedures.js'],
}
DOCS=['docs/AI_HANDOFF.md','docs/ARCHITECTURE.md','docs/SCRIPT_GUIDE.md']
CARD_FILES=sorted((ROOT/'cards').glob('*.js'))

def find_card_file(name):
    needle=f'defineScript("{name}"'
    for p in CARD_FILES:
        if needle in p.read_text(encoding='utf-8'):
            return p
    # loose fallback for quotes/aliases
    for p in CARD_FILES:
        if name in p.read_text(encoding='utf-8'):
            return p
    return None

def main():
    ap=argparse.ArgumentParser(description='Claude/ChatGPT向け軽量コンテキストZIPを生成')
    ap.add_argument('--area', choices=sorted(PACKS), default='core')
    ap.add_argument('--card', help='問題のカード名。該当cards/*.jsだけ追加')
    ap.add_argument('--note', default='', help='不具合の短い説明')
    ap.add_argument('-o','--output')
    args=ap.parse_args()
    rels=list(DOCS)+list(PACKS[args.area])
    card_rel=None
    if args.card:
        cp=find_card_file(args.card)
        if cp:
            card_rel=str(cp.relative_to(ROOT)); rels.append(card_rel)
    rels=list(dict.fromkeys(rels))
    out=Path(args.output) if args.output else ROOT/'ai_packs'/f'{args.area}'
    if args.card:
        safe=re.sub(r'[^0-9A-Za-z_\-ぁ-んァ-ヶ一-龠々ー]+','_',args.card)
        out=ROOT/'ai_packs'/f'{args.area}_{safe}'
    if out.exists(): shutil.rmtree(out)
    out.mkdir(parents=True)
    for rel in rels:
        src=ROOT/rel
        if src.exists():
            dst=out/rel; dst.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,dst)
    context=f'''# AI Mini Pack\n\n- Version: 3.2\n- Area: {args.area}\n- Card: {args.card or '(none)'}\n- Card source: {card_rel or '(not found / not requested)'}\n- Reported issue: {args.note or '(write the reproduction steps here)'}\n\n## Rules for AI\n1. Do not edit dist/battle.html directly.\n2. Fix the smallest relevant source file.\n3. Rule-engine bugs belong in engine/, card-only bugs belong in cards/.\n4. Preserve 1103 historical rules.\n5. Add or update a regression test/check for the bug.\n6. Do not copy ADS/EDOPro source code or Lua.\n\n## Included files\n''' + ''.join(f'- {r}\n' for r in rels)
    (out/'TASK_CONTEXT.md').write_text(context,encoding='utf-8')
    z=out.with_suffix('.zip')
    if z.exists(): z.unlink()
    with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as zf:
        for p in out.rglob('*'):
            if p.is_file(): zf.write(p,p.relative_to(out))
    print(out)
    print(z)

if __name__=='__main__': main()
