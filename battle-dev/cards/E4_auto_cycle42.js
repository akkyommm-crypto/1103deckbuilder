/* Auto cycle 42 — low-risk existing-engine pickups.
   Engine changes: none. New primitive: none.
   Uses existing Battle v6 piercing, System v21 destruction protection,
   continuous stat hooks, endPhaseMill, and summon restriction flags only. */

function e4SelfPierce(info){
  if(!info || info.atkCard !== info.self || !info.defCard || info.defCard.pos !== 'def') return 0;
  return Math.max(0, curATK(info.atkCard) - curDEF(info.defCard));
}
function e4SetCountInOwnGrave(p,setcode){
  const seen = new Set();
  (gameState.players[p].grave || []).forEach(c=>{
    const d = dbOf(c);
    if(d && d.k === 'm' && isSetCardV4(d,setcode)){
      seen.add(canonicalCardCodeV4(d) || Number(d.c) || d.n);
    }
  });
  return seen.size;
}

/* このカードは通常召喚できない。 */
defineScript('レアメタル・ドラゴン',{
  type:'monster',priority:1,cannotNormalSummon:true
});

/* 攻撃力2000以上のモンスターとの戦闘では破壊されない。
   自分墓地の「ナチュル」モンスター数×200 ATKアップ。 */
defineUnifiedCardV4('ナチュル・ドラゴンフライ',[],{
  type:'monster',priority:1,battleProof:false,
  protectV21:{key:'e4.naturia-dragonfly',battle:(target,src,ctx)=>ctx&&ctx.opponentCard&&curATK(ctx.opponentCard)>=2000,label:'ナチュル・ドラゴンフライ'},
  continuous:{scope:'self',from:['mz'],apply(card,self,info){
    if(card!==self || card.face!=='up') return null;
    const h=locateCardAnyV4(self), p=h?h.p:(info&&info.p);
    if(p==null) return null;
    const n=(gameState.players[p].grave||[]).filter(c=>{
      const d=dbOf(c); return d&&d.k==='m'&&isSetCardV4(d,SETCODE.NATURIA);
    }).length;
    return n ? {atk:n*200} : null;
  }}
});

/* 自分墓地の「ライトロード」モンスターの種類×300 ATK/DEFアップ。
   守備表示への貫通。自分エンドフェイズ毎に3枚墓地へ送る。 */
defineUnifiedCardV4('ライトロード・ドラゴン グラゴニス',[],{
  type:'monster',priority:1,endPhaseMill:3,
  continuous:{scope:'self',from:['mz'],apply(card,self,info){
    if(card!==self || card.face!=='up') return null;
    const h=locateCardAnyV4(self), p=h?h.p:(info&&info.p);
    if(p==null) return null;
    const n=e4SetCountInOwnGrave(p,SETCODE.LIGHTSWORN);
    return n ? {atk:n*300,def:n*300} : null;
  },piercingDamage:e4SelfPierce}
});
