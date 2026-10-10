/* S03-U270: ENGINE_GAP re-check 2 (2011 texts) — ショット・ガン・シャッフル, デス・ウォンバット, ホーリーライフバリアー, 雷電娘々, 氷結界の武士.
   No engine change. Reuses: defineScript fieldIgnition + cost + API.requestChoice (kind 'option', answered at resolution) (コア転送ユニット / S03-U207),
   continuous.lpChange (System v18; engine/1H, cards/9D), API.addLpRule + p11cards.cost-commit (discard cost chosen at activation), selfDestroyWhenS03 (engine/1ZZF),
   onPositionChange + v10SelfTurnedToDefense (System v10; cards/95).
   Not done: ワタポン (API.searchDeck / FX_SEARCH emits no onAddToHand — only FX_DECK_TO_HAND does; see the unit report). */

/* ---- ショット・ガン・シャッフル (Continuous Spell): 300ライフポイントを払う。自分、または相手のデッキをシャッフルする。この効果は1ターンに1度しか使えない。 ----
   Ignition while face-up; the 300 LP are the activation cost; whose Deck is shuffled is a non-targeting choice made at resolution. */
defineScript('ショット・ガン・シャッフル', {
  type:'spell', priority:1, fieldIgnition:true, countLimit:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = '表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(API.me(ctx).lp < 300){ ctx.reason = '300ライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){ if(API.me(ctx).lp < 300){ done(false); return; } API.payCost(ctx.player, 300, 'ショット・ガン・シャッフル'); done(true); },
  resolve(ctx){
    API.requestChoice({player:ctx.player, kind:'option', title:'ショット・ガン・シャッフル：シャッフルするデッキ',
      candidates:[{key:'self', value:'self', label:'自分のデッキ'}, {key:'foe', value:'foe', label:'相手のデッキ'}], min:1, max:1, cancelable:false,
      resume:{handler:'s03u270.shotgun-shuffle', args:{player:ctx.player}}, meta:{scriptName:'ショット・ガン・シャッフル'}});
  },
  afterResolve(){}
});
API.registerChoiceHandler('s03u270.shotgun-shuffle', (a, x)=>{
  if(!x || a.cancelled) return;
  const c = (a.cards || [])[0], v = c && c.value;
  if(v==='self') API.shuffle(x.player);
  else if(v==='foe') API.shuffle(x.player===0 ? 1 : 0);
});

/* ---- デス・ウォンバット: このカードがフィールド上に表側表示で存在する限り、コントローラーへのカードの効果によるダメージを0にする。 ----
   System v18 lpChange: effect damage (cause 'effect') to the CURRENT controller becomes 0; battle damage is not touched. */
defineScript('デス・ウォンバット', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    lpChange(info, self){
      const h = locateCardAnyV4(self);
      if(!h || h.zone!=='mz' || self.face!=='up') return null;
      if(info.cause!=='effect' || info.player!==h.p || !(info.delta<0)) return null;
      return 0;
    }}
});

/* ---- ホーリーライフバリアー (Trap): 手札を1枚捨てる。このカードを発動したターン、相手から受ける全てのダメージを0にする。 ----
   Cost: discard 1 (chosen at activation). Resolution: an LP rule on its activator, cause 'all' (battle + effect), valid through this turn. */
defineScript('ホーリーライフバリアー', {
  type:'trap', priority:2,
  condition(ctx){ if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; } return true; },
  activationV11(ctx, d){
    p11cOpen(d, {title:'ホーリーライフバリアー：捨てる手札', candidates:API.pileCards(ctx.player, 'hand')}, 'p11cards.cost-commit', {costKind:'discard', move:'discard'});
  },
  resolve(ctx){
    /* S03-U271: 「相手から受ける」 — only damage whose origin is the opponent (LP rule originPlayer); its own cards' damage is not prevented */
    API.addLpRule({player:ctx.player, cause:'all', mode:'prevent', turns:0, originPlayer:ctx.opponent, label:'ホーリーライフバリアー'});
    API.log('ホーリーライフバリアー：このターン、相手から受ける全てのダメージは0になる');
  },
  afterResolve(){}
});

/* ---- 雷電娘々: 自分フィールド上に光属性以外の表側表示モンスターが存在する場合、表側表示のこのカードを破壊する。 ----
   selfDestroyWhenS03 (engine/1ZZF): true while its controller controls a face-up monster whose current Attribute is not LIGHT. */
defineScript('雷電娘々', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  selfDestroyWhenS03:(card, p)=> (gameState.players[p].mz||[]).some(c=>c && c.face==='up' && currentAttributeV17(c)!=='光') ? '雷電娘々：自分フィールド上に光属性以外の表側表示モンスターが存在するため破壊' : false
});

/* ---- 氷結界の武士: フィールド上に表側攻撃表示で存在するこのカードが表側守備表示になった時、このカードを破壊し、デッキからカードを1枚ドローする。 ----
   Forced trigger of onPositionChange (face-up Attack → face-up Defense only; a flip-down / flip summon does not match). */
defineUnifiedCardV4('氷結界の武士', [{
  key:'turned-defense-destroy-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onPositionChange'], forced:true,
  condition(ctx){ return v10SelfTurnedToDefense(ctx); },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='mz') return;
    const uid = h.card.uid;
    API.destroy(h, '氷結界の武士');
    /* S03-U271: 「このカードを破壊し、…ドローする」 — draw only when it was destroyed (still on the field = not destroyed) */
    const after = uid!=null ? findCardByUid(uid) : null;
    if(after && after.zone==='mz') return;
    API.draw(ctx.player, 1);
  },
  afterResolve(){}
}], {type:'monster', priority:1});
