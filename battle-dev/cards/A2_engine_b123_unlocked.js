/* System v30 B1/B2/B3 で解禁された 3 枚。
   engine 側の新規 primitive は 1M_provenance_v30.js のみで、
   ここでは既存 API と v30 helper を組み合わせるだけにする。
   カード登録の第1引数は必ず文字列リテラル。 */

/* ===== B1. コザッキーの自爆装置
   「セットされたこのカードを破壊したプレイヤーに1000ポイントダメージを与える。」
   ・「セットされた」＝ 魔法罠ゾーンに裏側で置かれていた状態で破壊されたこと。
     graveInfo.from==='sz' かつ graveInfo.face==='down' で判定する。
   ・「破壊したプレイヤー」＝ v30 B1 の graveInfo.byPlayer。
     破壊者が特定できない破壊（ルール処理など）では発動しない。
     自分で破壊した場合は自分がダメージを受ける。
   ・「与える」なので任意ではなく強制。 ===== */
function b1KozakyGraveInfo(ctx){
  const c = ctx && ctx.card;
  const g = c && c.graveInfo;
  if(!g) return null;
  if(g.from !== 'sz') return null;
  if(g.face !== 'down') return null;
  if(!g.byDestroy) return null;
  if(g.byPlayer !== 0 && g.byPlayer !== 1) return null;
  if(g.turn !== gameState.turn) return null;
  return g;
}
defineScript('コザッキーの自爆装置',{
  type:'trap', priority:2, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason='破壊されて墓地へ送られた場合に発動します'; return false; }
    if(!b1KozakyGraveInfo(ctx)){ ctx.reason='セットされたこのカードを破壊したプレイヤーが特定できません'; return false; }
    return true;
  },
  resolve(ctx){
    const g = b1KozakyGraveInfo(ctx);
    if(!g) return;
    API.damageLP(g.byPlayer, 1000);
  },
  afterResolve(){},
  passive:{ onDestroy(ctx){ return ctx.zone==='grave' && !!b1KozakyGraveInfo(ctx); } }
});

/* ===== B2. 王墓の罠
   「相手の墓地から自分フィールドにアンデット族モンスターが特殊召喚された時、
     フィールドのカード2枚を対象として発動できる。そのカードを破壊する。」
   ・「相手の墓地から」は owner ではなく v30 B2 の
     specialSummonedFromPlayer（実際に取り出した領域の持ち主）で判定する。
   ・同時特殊召喚は RESOLUTION_SUMMON_BATCH_V2 が evt.cards にまとめるので
     evt.card / evt.cards の両方を見る。 ===== */
function b2SummonedCards(evt){
  if(!evt) return [];
  const out=[];
  /* queueDeferredEventV2 は card を uid へ落として純 JSON で保持し、
     flushDeferredEventsV2 が配信時に cards/card へ戻す。両方の形を受ける。 */
  if(Array.isArray(evt.cards)) evt.cards.forEach(c=>{ if(c) out.push(c); });
  if(!out.length && Array.isArray(evt.uids)) evt.uids.forEach(u=>{
    const hh=findCardByUid(u); if(hh) out.push(hh.card); });
  if(!out.length && evt.card) out.push(evt.card);
  if(!out.length && evt.uid!=null){ const hh=findCardByUid(evt.uid); if(hh) out.push(hh.card); }
  return out;
}
function b2IsZombieFromFoeGrave(card, me){
  if(!card) return false;
  const h = locateCardAnyV4(card);
  if(!h || h.p !== me || h.zone !== 'mz') return false;
  const db = dbOf(card);
  if(!db || db.ra !== 'アンデット') return false;
  return summonedFromOpponentV30(card, me, 'grave');
}
function b2FieldAll(){
  return API.fieldCards({filter:x => x.zone==='mz' || x.zone==='sz' || x.zone==='field'});
}
defineScript('王墓の罠',{
  type:'trap', priority:2, targets:true,
  condition(ctx){
    const hit = b2SummonedCards(ctx.event).some(c => b2IsZombieFromFoeGrave(c, ctx.player));
    if(!hit){ ctx.reason='相手の墓地から自分フィールドにアンデット族モンスターが特殊召喚された時に発動します'; return false; }
    if(b2FieldAll().length < 2){ ctx.reason='フィールドのカードが2枚必要です'; return false; }
    return true;
  },
  selectTargets(ctx,done){
    API.selectCard('王墓の罠：破壊するフィールドのカード（1枚目）', b2FieldAll(), a =>
      API.selectCard('王墓の罠：破壊するフィールドのカード（2枚目）',
        b2FieldAll().filter(x => x.card !== a.card), b => done([a,b])));
  },
  resolve(ctx){
    (ctx.selectedTargets||[]).slice().reverse().forEach(t => {
      const r = resolveTarget(t);
      if(r) API.destroy(t,'王墓の罠');
    });
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){
    return b2SummonedCards(ctx.event).some(c => b2IsZombieFromFoeGrave(c, ctx.player));
  } }
});

/* ===== B3. 破壊神の系譜
   「相手フィールド上に守備表示で存在するモンスターを破壊したターン、
     自分フィールド上に表側表示で存在するレベル8のモンスター1体を選択して発動する。
     このターン、選択したモンスターは1度のバトルフェイズ中に2回攻撃する事ができる。」
   ・「破壊したターン」はバトルフェイズ単位ではなくターン単位。
     戦闘破壊・効果破壊の双方を含むので v30 B3 のターン記録で判定する。
   ・裏側守備表示も「守備表示」に含む（記録側で pos==='def' として残している）。
   ・2回攻撃は attackLimit を上げる grantAdditionalAttack で表す。
     grantMultiAttack は canDeclareAttackV48 が読まないため使わない。 ===== */
function b3OwnLevel8(p){
  return API.fieldCards({player:p, zone:'mz',
    filter:x => x.card.face==='up' && curLV(x.card)===8});
}
defineScript('破壊神の系譜',{
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(typeof destroyedDefenseMonsterThisTurnV30 !== 'function'){ ctx.reason='破壊履歴を参照できません'; return false; }
    if(!destroyedDefenseMonsterThisTurnV30(gameState, ctx.player, ctx.opponent)){
      ctx.reason='このターン相手フィールドの守備表示モンスターを破壊していません'; return false; }
    if(!b3OwnLevel8(ctx.player).length){ ctx.reason='自分フィールドに表側表示のレベル8モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx,done){
    API.selectCard('破壊神の系譜：2回攻撃させるレベル8モンスター',
      b3OwnLevel8(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const h = t && resolveTarget(t);
    if(!h || h.p!==ctx.player || h.zone!=='mz' || h.card.face!=='up') return;
    if(curLV(h.card) !== 8) return;
    API.grantAdditionalAttack(h, 1, '破壊神の系譜', false);
  },
  afterResolve(){}
});
