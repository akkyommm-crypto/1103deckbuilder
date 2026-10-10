from pathlib import Path
import argparse, json, re, sys, hashlib

ROOT = Path(__file__).resolve().parents[1]


def read_card_db(path: Path):
    text = path.read_text(encoding='utf-8')
    if path.suffix.lower() == '.json':
        data = json.loads(text)
    else:
        m = re.search(r'<script[^>]+id=["\']carddata["\'][^>]*>(.*?)</script>', text, re.I|re.S)
        if not m:
            raise ValueError('index.html に <script id="carddata"> が見つかりません')
        data = json.loads(m.group(1).strip())
    if not isinstance(data, list) or not data:
        raise ValueError('カードDBが空です')
    return data


def main():
    ap = argparse.ArgumentParser(description='Acode向け単一HTMLを生成（カードDB内蔵）')
    ap.add_argument('carddata', nargs='?', help='carddata.json または carddata埋め込みindex.html')
    ap.add_argument('-o','--output', default=str(ROOT/'dist/battle_acode.html'))
    args=ap.parse_args()

    candidates=[]
    if args.carddata:
        candidates.append(Path(args.carddata))
    candidates += [ROOT/'data/carddata.json', ROOT/'data/index.html', ROOT/'carddata.json', ROOT/'index.html']
    source=next((p for p in candidates if p.exists()), None)
    if not source:
        print('ERROR: カードDBが見つかりません。', file=sys.stderr)
        print('data/carddata.json か data/index.html を置くか、引数で指定してください。', file=sys.stderr)
        raise SystemExit(2)

    data=read_card_db(source)
    # 通常ビルドを先に作る
    import subprocess
    subprocess.run([sys.executable, str(ROOT/'tools/build.py')], check=True)
    html=(ROOT/'dist/battle.html').read_text(encoding='utf-8')
    payload=json.dumps(data, ensure_ascii=False, separators=(',',':')).replace('</','<\\/')
    marker='<script>'
    inject=("<script>\n"
            "/* Acode standalone build: card database embedded at build time. */\n"
            f"window.__EMBEDDED_CARD_DB__={payload};\n")
    if marker not in html:
        raise RuntimeError('<script> marker not found')
    html=html.replace(marker, inject, 1)
    out=Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print(out)
    print(f'cards={len(data)} source={source}')
    print(hashlib.sha256(html.encode('utf-8')).hexdigest())

if __name__=='__main__':
    main()
