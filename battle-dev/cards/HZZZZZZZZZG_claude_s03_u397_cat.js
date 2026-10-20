/* S03-U397: 不幸を告げる黒猫, ボーンクラッシャー, エレクトロ軍曹 (NOT_STARTED cards, carddata texts).

   不幸を告げる黒猫      ①:このカードがリバースした場合に発動する。デッキから罠カード1枚を選んでデッキの一番上に置く。「王家の眠る谷－ネクロバレー」がフィールドに存在する場合、その罠カードをデッキの一番上に置く代わりに、手札に加える事ができる。
   ボーンクラッシャー    このカードがアンデット族モンスターの効果によって自分の墓地から特殊召喚された時、相手フィールド上に存在する魔法・罠カード1枚を破壊する事ができる。このカードは特殊召喚されたターンのエンドフェイズ時に破壊される。
   エレクトロ軍曹        ①:1ターンに1度、相手の魔法&罠ゾーンにセットされたカード1枚を対象として発動できる。このカードは以下の効果を得る。●このカードがモンスターゾーンに存在する限り、対象のセットされたカードは発動できない。

   Notes
   - 黒猫: forced onFlip trigger; the chosen Trap is placed on top through the existing registry handler p20rev.opponent-topdeck (S03-U212: shuffle, then top); with 王家の眠る谷－ネクロバレー face-up on the field the Trap may be added to the hand instead (confirm).
   - ボーンクラッシャー: optional onSpecialSummon trigger on itself (specialSummonedFrom 'grave' and card.summonSrcS03 naming an Undead monster, S03-U238); a forced End Phase trigger destroys it in the turn it was Special Summoned.
   - エレクトロ軍曹: a once-per-turn ignition targeting a Set Spell / Trap of the opponent; the uid joins a zone-local card flag; activationLockS03 forbids the activation of that Set card while this monster stands face-up in a Monster Zone. */

/* ---- 不幸を告げる黒猫 ---- */
function u397Traps(p){ return API.pileCards(p, 'deck', x=>x.db.k==='t'); }
function u397Necro(){ return [0,1].some(q=>{ const P = gameState.players[q]; return (P.field && P.field.face==='up' && dbOf(P.field).n==='王家の眠る谷－ネクロバレー'); }); }
API.registerChoiceHandler('u397.cat-hand', (answer, x)=>{
  const pick = answer && answer.cards && answer.cards[0]; const h = pick && pick.uid!=null ? findCardByUid(pick.uid) : null;
  if(h && h.zone==='deck' && h.p===x.player) API.searchDeck(x.player, h.index, '不幸を告げる黒猫');
});
defineUnifiedCardV4('不幸を告げる黒猫', [{
  key:'flip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFlip'], forced:true,
  condition(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && (e.uid===ctx.card.uid || e.card===ctx.card) && u397Traps(ctx.player).length>0; },
  operation(ctx){
    const pool = u397Traps(ctx.player); if(!pool.length) return;
    const toTop = ()=> v49P1Open(ctx, {kind:'card', title:'不幸を告げる黒猫：デッキの一番上に置く罠カード', candidates:pool, min:1, max:1},
      'p20rev.opponent-topdeck', {deckOwner:ctx.player, reason:'不幸を告げる黒猫'}, false);
    if(u397Necro()){
      API.confirm('不幸を告げる黒猫', '「王家の眠る谷－ネクロバレー」が存在します。選んだ罠カードを手札に加えますか？（いいえ：デッキの一番上に置く）', ()=>{
        API.requestChoice({player:ctx.player, kind:'card', title:'不幸を告げる黒猫：手札に加える罠カード', candidates:pool.map(x=>({key:'u'+x.card.uid, uid:x.card.uid, label:x.db.n})), min:1, max:1, cancelable:false,
          resume:{handler:'u397.cat-hand', args:{player:ctx.player}}, meta:{scriptName:'不幸を告げる黒猫'}});
      }, toTop);
    } else toTop();
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'],
  passive:{ onFlip(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && (e.uid===ctx.card.uid || e.card===ctx.card) && u397Traps(ctx.player).length>0; } } });

/* ---- ボーンクラッシャー ---- */
function u397FoeST(p){ return API.fieldCards({player:p, zone:'sz', filter:()=>true}).concat(API.fieldCards({player:p, zone:'field', filter:()=>true})); }
function u397BoneHit(ctx){
  const e = ctx.event || {}, c = ctx.card;
  if(ctx.zone!=='mz' || c.face!=='up' || !(e.uid===c.uid || e.card===c) || c.specialSummonedFrom!=='grave') return false;
  const s = c.summonSrcS03; if(!s || Number(s.turn)!==Number(gameState.turn)) return false;
  const db = CARD_DB[findCardIndex(s.name)];
  return !!db && db.k==='m' && db.ra==='アンデット';
}
function u397BoneEnd(ctx){ const c = ctx.card; return ctx.zone==='mz' && c.face==='up' && c.specialSummoned===true && Number(c.summonedTurn)===Number(gameState.turn); }
defineUnifiedCardV4('ボーンクラッシャー', [{
  key:'smash', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], targetRange:LOCATION.SZONE, targetSide:'opponent',
  condition(ctx){ return u397BoneHit(ctx) && u397FoeST(ctx.opponent).length>0; },
  target(ctx, done){ API.selectCard('ボーンクラッシャー：破壊する相手の魔法・罠カード', u397FoeST(ctx.opponent), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && (r.zone==='sz' || r.zone==='field') && r.p===ctx.opponent) API.destroy(r, 'ボーンクラッシャー');
  },
  afterResolve(){}
}, {
  key:'end', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u397BoneEnd(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.destroy(me, 'ボーンクラッシャー'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, timing:['free'],
  passive:{ onSpecialSummon(ctx){ return u397BoneHit(ctx) && u397FoeST(ctx.opponent).length>0; }, onEndPhase(ctx){ return u397BoneEnd(ctx); } } });

/* ---- エレクトロ軍曹 ---- */
function u397SetFoe(p){ return API.fieldCards({player:p, zone:'sz', filter:x=>x.card.face==='down'}); }
defineUnifiedCardV4('エレクトロ軍曹', [{
  key:'jam', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.SZONE, targetSide:'opponent',
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u397SetFoe(ctx.opponent).length){ ctx.reason = '相手の魔法&罠ゾーンにセットされたカードがありません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('エレクトロ軍曹：発動できなくするセットされたカード', u397SetFoe(ctx.opponent), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(!r || r.zone!=='sz' || r.card.face!=='down' || !me || me.zone!=='mz') return;
    const uid = ensureCardUid(gameState, r.card);
    const cur = Array.isArray(me.card.u397Jammed) ? me.card.u397Jammed.slice() : [];
    if(cur.indexOf(uid)<0) cur.push(uid);
    API.setCardFlag(me, 'u397Jammed', cur, 'エレクトロ軍曹', {silent:true});
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:1, targets:true, timing:['mainPhase'],
  activationLockS03:(i)=> i.zone==='sz' && i.card && i.card.face==='down' && i.src.face==='up' && Array.isArray(i.src.u397Jammed) && i.src.u397Jammed.indexOf(i.card.uid)>=0 });
