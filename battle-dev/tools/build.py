from pathlib import Path
import json, hashlib, sys
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'build_manifest.json').read_text(encoding='utf-8'))
out=(ROOT/'ui/prefix.html').read_text(encoding='utf-8')
out+=(ROOT/'styles/app.css').read_text(encoding='utf-8')
out+=(ROOT/'ui/between.html').read_text(encoding='utf-8')
for item in manifest:
    out+=(ROOT/item['path']).read_text(encoding='utf-8')
out+=(ROOT/'ui/suffix.html').read_text(encoding='utf-8')
dest=ROOT/'dist/battle.html'
dest.write_text(out,encoding='utf-8')
print(dest)
print(hashlib.sha256(out.encode('utf-8')).hexdigest())
