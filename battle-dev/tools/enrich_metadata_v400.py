from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/'data/carddata.json'

# Internal 16-bit set codes. 0x1000-0x1034 mirror the existing curated tg groups
# 0..52. Generic utility groups 53..56 are intentionally not treated as archetypes.
BASE=0x1000
EXTRA={
    'ELEMENTAL_HERO':0x2001,
    'DESTINY_HERO':0x2002,
    'EVIL_HERO':0x2003,
    'LEGENDARY_SIX_SAMURAI':0x2004,
    'AGENT':0x2005,
    'XX_SABER':0x2006,
}

HARPIE_LADY_CODE=76812113
HARPIE_ALIASES={'ハーピィ・レディ1','ハーピィ・レディ2','ハーピィ・レディ3','ハーピィ・レディ・SB'}

def extra_codes(name:str):
    out=[]
    if name.startswith('E・HERO '): out.append(EXTRA['ELEMENTAL_HERO'])
    if name.startswith('D－HERO '): out.append(EXTRA['DESTINY_HERO'])
    if name.startswith('E-HERO ') or name.startswith('E－HERO '): out.append(EXTRA['EVIL_HERO'])
    if name.startswith('真六武衆－'): out.append(EXTRA['LEGENDARY_SIX_SAMURAI'])
    if '代行者' in name: out.append(EXTRA['AGENT'])
    if name.startswith('XX－セイバー '): out.append(EXTRA['XX_SABER'])
    return out

def main():
    data=json.loads(PATH.read_text(encoding='utf-8'))
    changed=0
    for row in data:
        codes=[]
        for t in row.get('tg',[]):
            if isinstance(t,int) and 0 <= t <= 52:
                codes.append(BASE+t)
        codes.extend(extra_codes(row.get('n','')))
        codes=sorted(set(codes))
        old=row.get('setcode')
        if codes:
            row['setcode']=codes
        elif 'setcode' in row:
            del row['setcode']
        if row.get('n') in HARPIE_ALIASES:
            row['alias']=HARPIE_LADY_CODE
        elif row.get('alias') is None and 'alias' in row:
            del row['alias']
        if old != row.get('setcode'): changed+=1
    PATH.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(f'cards={len(data)} metadata_changed={changed}')
    print('harpie_aliases=',sum(1 for x in data if x.get('alias')==HARPIE_LADY_CODE))

if __name__=='__main__': main()
