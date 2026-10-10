/* Auto cycle 43 — existing-engine continuous/battle pickups.
   Engine changes: none. New primitive: none. */

function e5Pierce(info){
  if(!info || !info.atkCard || !info.defCard || info.defCard.pos !== 'def') return 0;
  return Math.max(0, curATK(info.atkCard) - curDEF(info.defCard));
}
function e5OwnGraveSetCount(p,setcode){
  return (gameState.players[p].grave||[]).filter(c=>{
    const d=dbOf(c); return d&&d.k==='m'&&isSetCardV4(d,setcode);
  }).length;
}
function e5OwnGraveSetKinds(p,setcode){
  const seen=new Set();
  (gameState.players[p].grave||[]).forEach(c=>{
    const d=dbOf(c);
    if(d&&d.k==='m'&&isSetCardV4(d,setcode)) seen.add(canonicalCardCodeV4(d)||Number(d.c)||d.n);
  });
  return seen.size;
}

/* 特殊召喚できない。
   自分フィールド上のA・O・Jが守備表示モンスターを攻撃する時に貫通。 */
defineUnifiedCardV4('A・O・J サンダー・アーマー',[],{
  type:'monster',priority:1,cannotSpecialSummon:true,
  continuous:{scope:'allMonsters',from:['mz'],apply(){return null;},piercingDamage(info){
    const sh=locateCardAnyV4(info&&info.self), ah=locateCardAnyV4(info&&info.atkCard);
    if(!sh||!ah||sh.p!==ah.p||info.self.face!=='up') return 0;
    if(!info.atkCard||info.atkCard.face!=='up'||!isSetCardV4(dbOf(info.atkCard),SETCODE.AOJ)) return 0;
    return e5Pierce(info);
  }}
});

/* 自分墓地のライトロード種類×300 ATKアップ。自分エンドフェイズに2枚墓地へ送る。 */
defineUnifiedCardV4('ライトロード・スピリット シャイア',[],{
  type:'monster',priority:1,endPhaseMill:2,
  continuous:{scope:'self',from:['mz'],apply(card,self,info){
    if(card!==self||card.face!=='up') return null;
    const h=locateCardAnyV4(self), p=h?h.p:(info&&info.p);
    if(p==null) return null;
    const n=e5OwnGraveSetKinds(p,SETCODE.LIGHTSWORN);
    return n?{atk:n*300}:null;
  }}
});

/* 自分フィールドのジュラック全体を、自分墓地のジュラック数×200強化。 */
defineUnifiedCardV4('ジュラック・ギガノト',[],{
  type:'synchro',priority:1,
  continuous:{scope:'allMonsters',from:['mz'],apply(card,self,info){
    const sh=locateCardAnyV4(self), th=locateCardAnyV4(card);
    if(!sh||!th||sh.p!==th.p||self.face!=='up'||card.face!=='up') return null;
    if(!isSetCardV4(dbOf(card),SETCODE.JURRAC)) return null;
    const n=e5OwnGraveSetCount(sh.p,SETCODE.JURRAC);
    return n?{atk:n*200}:null;
  }}
});

/* 自分墓地の炎属性×200 ATKアップ。
   戦闘で相手モンスターを破壊した場合、自分墓地のジェネクス数×200ダメージ。 */
defineScript('サーマル・ジェネクス',{
  type:'synchro',priority:1,
  condition(ctx){
    const ev=ctx.event||{}, h=locateCardAnyV4(ctx.card);
    return !!(h&&h.zone==='mz'&&ctx.card.face==='up'&&ev.attackerUid===ctx.card.uid&&ev.destroyed&&ev.destroyed.controller===ctx.opponent);
  },
  resolve(ctx){
    const n=e5OwnGraveSetCount(ctx.player,SETCODE.GENEX);
    if(n) API.damageLP(ctx.opponent,n*200,'サーマル・ジェネクス');
  },afterResolve(){},passive:{onBattleDestroy:ctx=>ctx.zone==='mz'&&ctx.card.face==='up'},
  continuous:{scope:'self',from:['mz'],apply(card,self,info){
    if(card!==self||card.face!=='up') return null;
    const h=locateCardAnyV4(self), p=h?h.p:(info&&info.p);
    if(p==null) return null;
    const n=(gameState.players[p].grave||[]).filter(c=>dbOf(c).k==='m'&&dbOf(c).at==='炎').length;
    return n?{atk:n*200}:null;
  }}
});
