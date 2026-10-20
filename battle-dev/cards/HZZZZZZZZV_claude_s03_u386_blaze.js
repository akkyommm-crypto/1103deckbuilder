/* S03-U386: the 「ブレイズ・キャノン」 cluster (carddata texts).

   ブレイズ・キャノン      （永続魔法）自分のメインフェイズ時に相手フィールド上のモンスター1体を選択して発動できる。手札から攻撃力500以下の炎族モンスター1体を墓地へ送り、選択した相手モンスターを破壊する。この効果を発動するターン、自分のモンスターは攻撃できない。
   クレイジー・ファイヤー    （速攻魔法）500ライフポイントを払う。自分フィールド上に表側表示で存在する「ブレイズ・キャノン」と名のついたカードを破壊し、フィールド上のモンスターを全て破壊する。その後、自分フィールド上に「クレイジー・ファイヤー・トークン」(炎族・炎・星3・攻/守1000)を1体攻撃表示で特殊召喚する。このターン自分のモンスターは攻撃する事ができない。
   ヴォルカニック・バックショット  このカードが墓地へ送られた時、相手ライフに500ポイントダメージを与える。このカードが「ブレイズ・キャノン」と名のついたカードの効果によって墓地へ送られた場合、手札・デッキから「ヴォルカニック・バックショット」2体を墓地へ送る事で、相手フィールド上のモンスターを全て破壊する。

   Notes
   - 「このターン自分のモンスターは攻撃できない」: the player flag noAttackDeclareS03 = the turn (S03-U170, read by cannotAttackNow), set when the effect is activated / resolved.
   - ブレイズ・キャノン: the Pyro monster is sent from the hand to the Graveyard on resolution (the text's 「手札から…墓地へ送り」 is part of the effect); the card sent gets a turn-stamped card flag u386Cannon, which ヴォルカニック・バックショット reads for 「ブレイズ・キャノンと名のついたカードの効果によって墓地へ送られた場合」 (the engine records the effect source of a hand-to-Graveyard send nowhere else).
   - ヴォルカニック・バックショット: ONE forced Graveyard trigger carries the 500 damage and the optional rescue (a card's forced triggers of one event are offered once per window): after the damage a yes / no asks whether to send two more of them from the hand / Deck; they are sent, then the opponent's monsters are all destroyed (the two sent ones burn 500 each by their own trigger). */

function u386Cannon(c){ return !!c && String(dbOf(c).n||'').indexOf('ブレイズ・キャノン')>=0; }
function u386Ready(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending; }
function u386Pyro(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && x.db.ra==='炎' && (Number(x.db.atk)||0)<=500); }

/* ---- ブレイズ・キャノン ---- */
defineUnifiedCardV4('ブレイズ・キャノン', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){ return !u386Ready(ctx); }, operation(){}, afterResolve(){}
}, {
  key:'fire', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'opponent', speed:1, events:['activate'],
  condition(ctx){
    if(!u386Ready(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!API.fieldCards({player:ctx.opponent, zone:'mz', filter:()=>true}).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    if(!u386Pyro(ctx).length){ ctx.reason = '手札に攻撃力500以下の炎族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.setFlag(ctx.player, 'noAttackDeclareS03', gameState.turn, true); done(true); },
  target(ctx, done){ API.selectCard('ブレイズ・キャノン：破壊する相手モンスター', API.fieldCards({player:ctx.opponent, zone:'mz', filter:()=>true}), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const pool = u386Pyro(ctx); if(!pool.length || !r || r.zone!=='mz') return;
    API.selectCard('ブレイズ・キャノン：墓地へ送る炎族モンスター', pool, t2=>{
      const h = t2 && resolveTarget(t2); if(!h || h.zone!=='hand') return;
      const uid = ensureCardUid(gameState, h.card);
      API.sendHandToGrave(ctx.player, h.index, 'ブレイズ・キャノン');
      const g = findCardByUid(uid); if(g && g.zone==='grave') API.setCardFlag(g, 'u386Cannon', gameState.turn, 'ブレイズ・キャノン', {silent:true});
      const tgt = t && resolveTarget(t); if(tgt && tgt.zone==='mz') API.destroy(tgt, 'ブレイズ・キャノン');
    });
  },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, fieldIgnition:true, activateFrom:['sz'] });

/* ---- クレイジー・ファイヤー ---- */
defineTokenSpecV11('クレイジー・ファイヤー・トークン', {atk:1000, def:1000, lv:3, ra:'炎', at:'炎', pos:'atk'});
function u386MyCannons(p){ return API.fieldCards({player:p, zone:'sz', filter:x=>x.card.face==='up' && u386Cannon(x.card)}).concat(API.fieldCards({player:p, zone:'field', filter:x=>x.card.face==='up' && u386Cannon(x.card)})); }
defineScript('クレイジー・ファイヤー', {
  type:'spell', priority:2, targets:false, includesSpecialSummon:true,
  condition(ctx){
    if(API.me(ctx).lp<500){ ctx.reason = 'ライフポイントが足りません'; return false; }
    if(!u386MyCannons(ctx.player).length){ ctx.reason = '自分フィールドに表側表示の「ブレイズ・キャノン」と名のついたカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){ if(API.me(ctx).lp<500){ done(false); return; } API.payCost(ctx.player, 500); done(true); },
  resolve(ctx){
    u386MyCannons(ctx.player).slice().reverse().forEach(x=>{ const h = findCardByUid(ensureCardUid(gameState, x.card)); if(h && (h.zone==='sz' || h.zone==='field')) API.destroy(h, 'クレイジー・ファイヤー'); });
    [0,1].forEach(p=>API.fieldCards({player:p, zone:'mz', filter:()=>true}).slice().reverse().forEach(x=>{ const h = findCardByUid(ensureCardUid(gameState, x.card)); if(h && h.zone==='mz') API.destroy(h, 'クレイジー・ファイヤー'); }));
    if(hasMonsterZoneSpace(ctx.player)) API.createToken(ctx.player, {name:'クレイジー・ファイヤー・トークン', atk:1000, def:1000, lv:3, ra:'炎', at:'炎', pos:'atk'}, 1);
    API.setFlag(ctx.player, 'noAttackDeclareS03', gameState.turn, true);
  },
  afterResolve(){}
});

/* ---- ヴォルカニック・バックショット ---- */
function u386Pals(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.n==='ヴォルカニック・バックショット').concat(API.pileCards(ctx.player, 'deck', x=>x.db.n==='ヴォルカニック・バックショット')).filter(x=>x.card!==ctx.card); }
function u386Sent(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx); }
defineUnifiedCardV4('ヴォルカニック・バックショット', [{
  key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'], forced:true,
  condition(ctx){ return u386Sent(ctx); },
  operation(ctx){
    API.damageLP(ctx.opponent, 500, 'ヴォルカニック・バックショット');
    if(Number(ctx.card.u386Cannon)!==Number(gameState.turn) || u386Pals(ctx).length<2) return;
    API.confirm('ヴォルカニック・バックショット', '手札・デッキから「ヴォルカニック・バックショット」2体を墓地へ送り、相手フィールドのモンスターを全て破壊しますか？', ()=>{
      const pals = u386Pals(ctx); if(pals.length<2) return;
      pals.slice(0,2).forEach(x=>{
        const h = findCardByUid(ensureCardUid(gameState, x.card)); if(!h) return;
        if(h.zone==='hand') API.sendHandToGrave(ctx.player, h.index, 'ヴォルカニック・バックショット（コスト）');
        else if(h.zone==='deck') API.sendToGrave(h, 'ヴォルカニック・バックショット（コスト）');
      });
      API.fieldCards({player:ctx.opponent, zone:'mz', filter:()=>true}).slice().reverse().forEach(x=>{ const h = findCardByUid(ensureCardUid(gameState, x.card)); if(h && h.zone==='mz') API.destroy(h, 'ヴォルカニック・バックショット'); });
    }, ()=>{});
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['grave'],
  passive:{ onSendToGrave(ctx){ return u386Sent(ctx); }, onDestroy(ctx){ return u386Sent(ctx); } } });
