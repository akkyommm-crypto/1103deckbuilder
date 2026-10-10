/* S03-U224: NOT_STARTED cards (2011 texts) — オーロラ・アンギラス, サボウ・クローザー, ゴーレム・ドラゴン, デコイロイド, 女王親衛隊, 共同戦線, 借カラクリ整備蔵,
   地縛波, フェザー・ウィンド, バスター・カウンター. Hooks: specialSummonLockS03 (engine/40), cannotBeAttackTarget (engine/1ZU), activation responses (engine/1P). */

/* ---- オーロラ・アンギラス: ①:このカードがモンスターゾーンに存在する限り、お互いにモンスターを特殊召喚できない。
   ②:このカード以外のモンスターが召喚された場合に発動する。このカードを破壊する。 ---- */
function anguillaOtherSummonedS03(ctx){ const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : null; return ctx.zone==='mz' && ctx.card.face==='up' && !!h && h.zone==='mz' && h.card!==ctx.card; }
defineScript('オーロラ・アンギラス', {
  type:'monster', priority:1, forced:true, onOtherSummon:true,
  condition(ctx){ if(ctx.eventName!=='onNormalSummon' || !anguillaOtherSummonedS03(ctx)){ ctx.reason = '他のモンスターが召喚された時に発動します'; return false; } return true; },
  resolve(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.destroy(me, 'オーロラ・アンギラス'); },
  afterResolve(){},
  specialSummonLockS03:()=> true,
  passive:{ onNormalSummon(ctx){ return anguillaOtherSummonedS03(ctx); } }
});

/* ---- サボウ・クローザー: このカードは特殊召喚できない。このカード以外の植物族モンスターがフィールド上に表側表示で存在する限り、お互いにモンスターを特殊召喚する事はできない。 ---- */
defineScript('サボウ・クローザー', {
  type:'monster', priority:1, cannotSpecialSummon:true,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  specialSummonLockS03:(db, p, src)=> [0,1].some(q=>(gameState.players[q].mz||[]).some(c=>c && c!==src && c.face==='up' && currentRaceV17(c)==='植物'))
});

/* ---- ゴーレム・ドラゴン: このカードがフィールド上に表側表示で存在する限り、相手は表側表示で存在する他のドラゴン族モンスターを攻撃対象に選択する事はできない。 ---- */
defineScript('ゴーレム・ドラゴン', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> target!==self && self.face==='up' && target.face==='up' && currentRaceV17(target)==='ドラゴン' }
});

/* ---- デコイロイド: このカードが自分フィールド上に表側表示で存在する限り、相手は「デコイロイド」以外の表側表示のモンスターを攻撃対象に選択できない。 ---- */
defineScript('デコイロイド', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> self.face==='up' && target.face==='up' && cardName(target)!=='デコイロイド' }
});

/* ---- 女王親衛隊: このカードが自分フィールド上に表側表示で存在する限り、自分フィールド上に存在する「魅惑の女王」と名のついたモンスターを攻撃対象に選択できない。 ---- */
defineScript('女王親衛隊', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> self.face==='up' && String(cardName(target)).indexOf('魅惑の女王')===0 }
});

/* ---- Counter Traps with a field condition ---- */
function ownFaceUpMonstersS03(p){ return (gameState.players[p].mz||[]).filter(c=>c && c.face==='up'); }
/* 共同戦線: 自分フィールド上に同じレベルのモンスターが表側表示で2体以上存在する場合に発動する事ができる。罠カードの発動を無効にし破壊する。 */
function jointFrontReadyS03(ctx){ const lv = ownFaceUpMonstersS03(ctx.player).map(c=>curLV(c)).filter(x=>x>0); return lv.some((x,i)=>lv.indexOf(x)!==i); }
defineScript('共同戦線', {
  type:'trap', priority:3,
  condition(ctx){
    if(!counterTopCardLinkS03(ctx, e=>e.kind==='trap')){ ctx.reason = '罠カードが発動した時に発動します'; return false; }
    if(!jointFrontReadyS03(ctx)){ ctx.reason = '同じレベルの表側表示モンスターが2体以上いません'; return false; }
    return true;
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', '共同戦線', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!counterTopCardLinkS03(ctx, e=>e.kind==='trap') && jointFrontReadyS03(ctx); } }
});
/* 借カラクリ整備蔵: 自分フィールド上に「カラクリ」と名のついたモンスターが表側守備表示で存在する場合に発動する事ができる。相手が発動した魔法・罠カードの発動を無効にし破壊する。 */
function karakuriDefS03(ctx){ return ownFaceUpMonstersS03(ctx.player).some(c=>c.pos==='def' && isSetCardV4(dbOf(c), SETCODE.KARAKURI)); }
defineScript('借カラクリ整備蔵', {
  type:'trap', priority:3,
  condition(ctx){
    if(!counterTopCardLinkS03(ctx, e=>(e.kind==='spell' || e.kind==='trap') && e.player===ctx.opponent)){ ctx.reason = '相手が魔法・罠カードを発動した時に発動します'; return false; }
    if(!karakuriDefS03(ctx)){ ctx.reason = '表側守備表示の「カラクリ」がいません'; return false; }
    return true;
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', '借カラクリ整備蔵', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!counterTopCardLinkS03(ctx, e=>(e.kind==='spell' || e.kind==='trap') && e.player===ctx.opponent) && karakuriDefS03(ctx); } }
});
/* 地縛波: 自分フィールド上に「地縛神」と名のついたモンスターが存在する場合に発動できる。相手が発動した魔法・罠カードの発動を無効にし破壊する。 */
function earthboundS03(ctx){ return (gameState.players[ctx.player].mz||[]).some(c=>c && c.face==='up' && String(cardName(c)).indexOf('地縛神')===0); }
defineScript('地縛波', {
  type:'trap', priority:3,
  condition(ctx){
    if(!counterTopCardLinkS03(ctx, e=>(e.kind==='spell' || e.kind==='trap') && e.player===ctx.opponent)){ ctx.reason = '相手が魔法・罠カードを発動した時に発動します'; return false; }
    if(!earthboundS03(ctx)){ ctx.reason = '「地縛神」がいません'; return false; }
    return true;
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', '地縛波', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!counterTopCardLinkS03(ctx, e=>(e.kind==='spell' || e.kind==='trap') && e.player===ctx.opponent) && earthboundS03(ctx); } }
});
/* フェザー・ウィンド: 自分フィールド上に「E・HERO フェザーマン」が表側表示で存在する場合に発動する事ができる。魔法・罠の発動を無効にし、そのカードを破壊する。 */
function featherManS03(ctx){ return ownFaceUpMonstersS03(ctx.player).some(c=>cardName(c)==='E・HERO フェザーマン'); }
defineScript('フェザー・ウィンド', {
  type:'trap', priority:3,
  condition(ctx){
    if(!counterTopCardLinkS03(ctx, e=>e.kind==='spell' || e.kind==='trap')){ ctx.reason = '魔法・罠カードが発動した時に発動します'; return false; }
    if(!featherManS03(ctx)){ ctx.reason = '表側表示の「E・HERO フェザーマン」がいません'; return false; }
    return true;
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'フェザー・ウィンド', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!counterTopCardLinkS03(ctx, e=>e.kind==='spell' || e.kind==='trap') && featherManS03(ctx); } }
});
/* バスター・カウンター: 自分フィールド上に「／バスター」と名のついたモンスターが存在する場合に発動できる。効果モンスターの効果・魔法・罠カードの発動を無効にし破壊する。 */
function busterS03(ctx){ return (gameState.players[ctx.player].mz||[]).some(c=>c && c.face==='up' && String(cardName(c)).indexOf('／バスター')>=0); }
function busterLinkS03(ctx){
  const e = ctx.event || {};
  const l = (gameState.chain||[])[Number(e.chainLink)-1];
  if(!l) return null;
  if(e.kind==='monster') return l;
  return ((e.kind==='spell' || e.kind==='trap') && l.cardActivationS03===true) ? l : null;
}
defineScript('バスター・カウンター', {
  type:'trap', priority:3,
  condition(ctx){
    if(!busterLinkS03(ctx)){ ctx.reason = '効果モンスターの効果・魔法・罠カードが発動した時に発動します'; return false; }
    if(!busterS03(ctx)){ ctx.reason = '「／バスター」モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'バスター・カウンター', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!busterLinkS03(ctx) && busterS03(ctx); } }
});
declareActivationResponseS03(['共同戦線','借カラクリ整備蔵','地縛波','フェザー・ウィンド','バスター・カウンター']);
