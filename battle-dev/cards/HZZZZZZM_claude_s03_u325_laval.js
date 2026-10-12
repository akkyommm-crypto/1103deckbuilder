/* S03-U325: six 「ラヴァル」 monsters of the carddata (「ラヴァル」 = a monster whose name contains ラヴァル).

   ラヴァルロード・ジャッジメント  1ターンに1度、自分の墓地の「ラヴァル」モンスター1体をゲームから除外して発動できる。相手に1000ダメージ。この効果を発動するターン、このカードは攻撃宣言できない。
   ラヴァル・グレイター            (S) シンクロ召喚に成功した時、自分は手札を1枚墓地へ送る。カードの効果によって破壊される場合、代わりに自分の墓地の「ラヴァル」モンスター1体をゲームから除外できる。
   ラヴァル・ステライド            (S) シンクロ召喚に成功した時、自分は手札を1枚墓地へ送る。カードの効果の対象になった時、自分の墓地の「ラヴァル」モンスター1体をゲームから除外する事で、その発動を無効にし破壊する。
   ラヴァル・ツインスレイヤー      (S) 墓地の「ラヴァル」の数: 2体以上=守備表示モンスターを攻撃した場合もう1度だけ続けて攻撃できる／3体以上=守備表示モンスターに対する貫通ダメージ。
   ラヴァル炎湖畔の淑女            墓地の「ラヴァル」モンスターが3種類以上の場合、墓地のこのカードと「ラヴァル」モンスター1体をゲームから除外して発動できる。相手のセットされたカード1枚を選択して破壊する。
   ラヴァルバル・ドラゴン          (S) 自分の墓地の「ラヴァル」モンスター2体をデッキに戻し、相手フィールドのカード1枚を選択して発動できる。選択したカードを持ち主の手札に戻す。

   Notes
   - ジャッジメント: the banish is the cost; the attack ban is the turn-stamped flag cannotAttackTurn set in the cost (it may have attacked earlier in the turn). グレイター / ステライド: the hand discard is the player's choice and forced when the hand is not empty.
   - グレイター: engine/1ZV substitute kind 'banishGrave' (S03-U325; optional, effect destruction only, asked at the destruction like the other substitutes).
   - ステライド: a declared activation response (engine/1P) when the activated effect's chain link targets this card (chainLinkTargetsV11); the cost banishes a 「ラヴァル」 of the Graveyard; the activation is negated and the card destroyed.
   - ツインスレイヤー: the extra attack is a forced Damage Step trigger when the attacked monster was in Defense Position at the calculation and ≥ 2 monsters named ラヴァル are in the Graveyard; piercingDamage while ≥ 3.
   - 炎湖畔の淑女: 「3種類以上」 = three different card names (itself counts); the cost banishes itself and one other 「ラヴァル」; Main Phase ignition from the Graveyard; the target is a face-down card of the opponent's field.
   - Not in this unit: ラヴァルバル・イグニス (Xyz). */

function u325Laval(db){ return !!db && db.k==='m' && String(db.n||'').indexOf('ラヴァル')>=0; }
function u325Grave(p, except){ return API.pileCards(p, 'grave', x=>x.card!==except && u325Laval(x.db)); }
function u325Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function u325Main(ctx){ return ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
function u325BanishCost(ctx, done, label){
  const pool = u325Grave(ctx.player, ctx.card);
  if(!pool.length){ done(false); return; }
  API.selectCard(label+'：除外する墓地の「ラヴァル」', pool, t=>{
    const r = t && resolveTarget(t);
    if(!r || r.zone!=='grave'){ done(false); return; }
    API.banish(r, label+'（コスト）'); done(true);
  });
}
function u325SynchroDiscard(label){
  return { key:'synchro-discard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
    condition(ctx){ return u325Up(ctx) && s03SelfSynchroSummonedU121(ctx) && (API.me(ctx).hand||[]).length>0; },
    operation(ctx){
      const pool = API.pileCards(ctx.player, 'hand'); if(!pool.length) return;
      API.selectCard(label+'：墓地へ送る手札', pool, t=>{
        const r = t && resolveTarget(t);
        if(r && r.zone==='hand' && r.p===ctx.player) API.sendHandToGrave(ctx.player, r.index, label);
      });
    },
    afterResolve(){} };
}
const U325_SYNCHRO_PASSIVE = { onSpecialSummon(ctx){ return u325Up(ctx) && s03SelfSynchroSummonedU121(ctx) && (API.me(ctx).hand||[]).length>0; } };

/* ---- ロード・ジャッジメント ---- */
defineUnifiedCardV4('ラヴァルロード・ジャッジメント', [{
  key:'burn', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u325Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u325Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u325Grave(ctx.player).length){ ctx.reason = '墓地に「ラヴァル」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    u325BanishCost(ctx, ok=>{
      if(!ok){ done(false); return; }
      const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'cannotAttackTurn', gameState.turn, 'ラヴァルロード・ジャッジメント', {silent:true});
      done(true);
    }, 'ラヴァルロード・ジャッジメント');
  },
  operation(ctx){ API.damageLP(ctx.opponent, 1000, 'ラヴァルロード・ジャッジメント'); },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['burn']}});

/* ---- グレイター ---- */
defineUnifiedCardV4('ラヴァル・グレイター', [u325SynchroDiscard('ラヴァル・グレイター')],
  {type:'monster', priority:1, timing:['free'], passive:U325_SYNCHRO_PASSIVE,
   destroySubstituteS03:{kind:'banishGrave', causes:['effect'], filter:c=>u325Laval(dbOf(c))}});

/* ---- ステライド ---- */
function u325Targeted(ctx){
  const e = ctx.event;
  if(!e || e.chainId==null || typeof chainLinkTargetsV11!=='function') return false;
  const uids = [];
  chainLinkTargetsV11(e.chainId).forEach(x=>[x, x && x.t].forEach(y=>{ if(!y) return; const u = y.uid!=null ? y.uid : (y.card ? y.card.uid : null); if(u!=null) uids.push(u); }));
  return ctx.card.uid!=null && uids.indexOf(ctx.card.uid)>=0;
}
defineUnifiedCardV4('ラヴァル・ステライド', [u325SynchroDiscard('ラヴァル・ステライド'), {
  key:'target-negate', type:EFFECT_TYPE.QUICK, range:LOCATION.MZONE, speed:2, events:['onActivateSuccess'],
  condition(ctx){
    if(!u325Up(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する場合に発動します'; return false; }
    if(!u325Targeted(ctx)){ ctx.reason = 'このカードを対象とするカードの効果が発動した時に発動します'; return false; }
    if(!u325Grave(ctx.player).length){ ctx.reason = '墓地に「ラヴァル」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ u325BanishCost(ctx, done, 'ラヴァル・ステライド'); },
  operation(ctx){ const e = ctx.event; if(e && e.chainId!=null) API.negateChainLink(e.chainId, 'activation', 'ラヴァル・ステライド', true); },
  afterResolve(){}
}], {type:'monster', priority:2, timing:['free','chain'], activateFrom:['mz'],
  passive:{ onSpecialSummon:U325_SYNCHRO_PASSIVE.onSpecialSummon, onActivateSuccess(ctx){ return u325Up(ctx) && u325Targeted(ctx) && u325Grave(ctx.player).length>0; } }});
declareActivationResponseS03(['ラヴァル・ステライド']);

/* ---- ツインスレイヤー ---- */
function u325GraveCount(p){ return API.pileCards(p, 'grave', x=>u325Laval(x.db)).length; }
function u325DefAttack(ctx){
  const b = gameState.battle;
  return !!b && u325Up(ctx) && a5IsAttackerCard(ctx.card) && b.defPosAtCalc==='def' && u325GraveCount(ctx.player)>=2 && Number(ctx.card.u325TwinTurn)!==gameState.turn;   /* 「もう1度だけ」: once per turn */
}
defineUnifiedCardV4('ラヴァル・ツインスレイヤー', [{
  key:'again', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u325DefAttack(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz'){ API.setCardFlag(me, 'u325TwinTurn', gameState.turn, 'ラヴァル・ツインスレイヤー', {silent:true}); API.grantAdditionalAttack(me, 1, 'ラヴァル・ツインスレイヤー', true); } },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], dsTiming:'after',
  passive:{ onDamageStep(ctx){ return u325DefAttack(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    piercingDamage(info){
      const self = info.self;
      if(!self || self.face!=='up' || info.atkCard!==self || !info.defCard || info.defCard.pos!=='def') return 0;
      const h = locateCard(self); if(!h || u325GraveCount(h.p)<3) return 0;
      return Math.max(0, curATK(self) - curDEF(info.defCard));
    } }});

/* ---- 炎湖畔の淑女 ---- */
function u325Kinds(p){ const s = {}; u325Grave(p).forEach(x=>{ s[x.db.n] = true; }); return Object.keys(s).length; }
function u325FoeSet(ctx){ return API.fieldCards({player:ctx.opponent}).filter(x=>x.card.face==='down'); }
defineUnifiedCardV4('ラヴァル炎湖畔の淑女', [{
  key:'grave-destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.GRAVE, speed:1, events:['activate'], targetRange:LOCATION.ONFIELD, targetSide:'opponent',
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = '墓地で発動します'; return false; }
    if(!u325Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(u325Kinds(ctx.player)<3){ ctx.reason = '墓地に「ラヴァル」モンスターが3種類以上必要です'; return false; }
    if(!u325Grave(ctx.player, ctx.card).length){ ctx.reason = '除外する他の「ラヴァル」がいません'; return false; }
    if(!u325FoeSet(ctx).length){ ctx.reason = '相手フィールド上にセットされたカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone!=='grave'){ done(false); return; }
    API.selectCard('ラヴァル炎湖畔の淑女：一緒に除外する「ラヴァル」', u325Grave(ctx.player, ctx.card), t=>{
      const r = t && resolveTarget(t), me2 = locateCardAnyV4(ctx.card);
      if(!r || r.zone!=='grave' || !me2 || me2.zone!=='grave'){ done(false); return; }
      API.banish(r, 'ラヴァル炎湖畔の淑女（コスト）');
      const me3 = locateCardAnyV4(ctx.card); if(me3 && me3.zone==='grave') API.banish(me3, 'ラヴァル炎湖畔の淑女（コスト）');
      done(true);
    });
  },
  target(ctx, done){ API.selectCard('ラヴァル炎湖畔の淑女：破壊する相手のセットされたカード', u325FoeSet(ctx), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.p===ctx.opponent && r.card.face==='down' && ['mz','sz','field'].indexOf(r.zone)>=0) API.destroy(r, 'ラヴァル炎湖畔の淑女'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, activateFrom:['grave']});

/* ---- ラヴァルバル・ドラゴン ---- */
defineUnifiedCardV4('ラヴァルバル・ドラゴン', [{
  key:'return-bounce', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.ONFIELD, targetSide:'opponent',
  condition(ctx){
    if(!u325Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u325Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(u325Grave(ctx.player).length<2){ ctx.reason = '墓地に「ラヴァル」モンスターが2体必要です'; return false; }
    if(!API.fieldCards({player:ctx.opponent}).length){ ctx.reason = '相手フィールド上にカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('ラヴァルバル・ドラゴン：デッキに戻す墓地の「ラヴァル」（1/2）', u325Grave(ctx.player), t1=>{
      const a = t1 && resolveTarget(t1); if(!a || a.zone!=='grave'){ done(false); return; }
      API.selectCard('ラヴァルバル・ドラゴン：デッキに戻す墓地の「ラヴァル」（2/2）', u325Grave(ctx.player).filter(x=>x.card!==a.card), t2=>{
        const b = t2 && resolveTarget(t2); if(!b || b.zone!=='grave'){ done(false); return; }
        const cb = b.card;
        API.returnToDeck(a, false, 'ラヴァルバル・ドラゴン（コスト）');
        const hb = locateCardAnyV4(cb); if(hb && hb.zone==='grave') API.returnToDeck(hb, false, 'ラヴァルバル・ドラゴン（コスト）');
        API.shuffle(ctx.player); done(true);
      });
    });
  },
  target(ctx, done){ API.selectCard('ラヴァルバル・ドラゴン：手札に戻す相手フィールド上のカード', API.fieldCards({player:ctx.opponent}), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.p===ctx.opponent && ['mz','sz','field'].indexOf(r.zone)>=0) API.returnToHand(r, 'ラヴァルバル・ドラゴン'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true});
