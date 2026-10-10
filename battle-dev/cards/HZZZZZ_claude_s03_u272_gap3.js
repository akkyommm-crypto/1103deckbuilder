/* S03-U272: ENGINE_GAP re-check 3 (2011 texts) — 防御輪, ダメージ・ワクチンΩMAX, 悪夢の拷問部屋, 同族感染ウィルス.
   Not done: ドッペル・ゲイナー (open ruling: a Continuous Trap whose text has no 「発動できる」 — one activation, or an effect applied every time), キックバック — see the unit report: a negated Normal / Flip Summon is cancelled by runSummonWindowResumeS03 (engine/40), which sends the monster to the GY; there is no way to leave it in the hand without an engine change.
   No engine change. Reuses: onLPChange (System v28; sourceUid / byPlayer / cause), API.addLpRule scoped to a chain link (S03-U267), declareActivationResponseS03,
   requestDeclarationV11 kind 'race' + p11cards.declare-commit (一族の掟), p11cards cost recording (ホーリーライフバリアー). */

/* ---- 防御輪 (Quick-Play Spell): 罠カードの効果によるダメージを0にする。
   (chain response to the activation of a Trap CARD whose effect inflicts damage — either player's; the damage that chain link inflicts, to either player, becomes 0:
   an LP rule (cause effect, prevent, no player) scoped to that chain link) ---- */
function guardLinkS272(ctx){
  const e = ctx.event || (typeof topActivationEventS03==='function' ? topActivationEventS03(gameState) : null);
  if(!e || !ctx.card || e.kind!=='trap' || e.uid===ctx.card.uid) return null;
  const l = (gameState.chain||[])[Number(e.chainLink)-1];
  if(!l || l.cardActivationS03!==true || l.chainId!==e.chainId) return null;
  return API.effectHasCategory(e, 'damage') ? e : null;
}
defineScript('防御輪', {
  type:'quick-play', priority:3, activateFrom:['hand','sz'],
  condition(ctx){ if(!guardLinkS272(ctx)){ ctx.reason = 'ダメージを与える罠カードの発動に対して発動します'; return false; } return true; },
  resolve(ctx){
    if(!ctx.event) return;
    API.addLpRule({player:null, cause:'effect', mode:'prevent', turns:0, chainId:ctx.event.chainId, label:'防御輪'});
    API.log('防御輪：その罠カードの効果によるダメージは0になる');
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return (ctx.zone==='sz' || ctx.zone==='hand') && !!guardLinkS272(ctx); } }
});
declareActivationResponseS03(['防御輪']);

/* ---- ダメージ・ワクチンΩMAX (Trap): 自分が戦闘またはカードの効果によってダメージを受けた時に発動する事ができる。自分が受けたそのダメージの数値分だけ自分のライフポイントを回復する。
   (onLPChange: battle or effect damage to its controller; it recovers exactly the damage taken) ---- */
function vaccineDmgS272(ctx){
  const e = ctx.event || {};
  return ctx.eventName==='onLPChange' && e.player===ctx.player && Number(e.delta)<0 && (e.cause==='battle' || e.cause==='effect');
}
defineScript('ダメージ・ワクチンΩMAX', {
  type:'trap', priority:2,
  condition(ctx){ if(!vaccineDmgS272(ctx)){ ctx.reason = '自分が戦闘またはカードの効果によってダメージを受けた時に発動します'; return false; } return true; },
  resolve(ctx){ const n = Math.abs(Number((ctx.event||{}).delta)||0); if(n>0) API.recoverLP(ctx.player, n); },
  afterResolve(){},
  passive:{ onLPChange(ctx){ return ctx.zone==='sz' && vaccineDmgS272(ctx); } }
});

/* ---- 悪夢の拷問部屋 (Continuous Spell): 相手ライフに戦闘ダメージ以外のダメージを与える度に、相手ライフに300ポイントダメージを与える。
   「悪夢の拷問部屋」の効果では、このカードの効果は適用されない。
   (forced trigger on onLPChange: the opponent took non-battle damage inflicted by this card's controller (byPlayer); not when the damage came from any 「悪夢の拷問部屋」 (the source card's name)) ---- */
function nightmareDueS272(ctx){
  const e = ctx.event || {};
  if(ctx.eventName!=='onLPChange' || ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up' || ctx.card.activationPending) return false;
  if(e.player!==ctx.opponent || !(Number(e.delta)<0) || e.byPlayer!==ctx.player) return false;
  if(e.cause==='battle' || e.cause==='cost' || e.cause==='recover') return false;
  if(e.sourceUid!=null){ const s = findCardByUid(e.sourceUid); if(s && cardName(s.card)==='悪夢の拷問部屋') return false; }
  return true;
}
defineScript('悪夢の拷問部屋', {
  type:'spell', priority:1, forced:true,
  condition(ctx){
    if(ctx.eventName==='onLPChange' && !nightmareDueS272(ctx)){ ctx.reason = '相手ライフに戦闘ダメージ以外のダメージを与えた時に処理します'; return false; }
    return true;
  },
  resolve(ctx){
    if(ctx.eventName!=='onLPChange' || !nightmareDueS272(ctx)) return;   /* the activation of the Continuous Spell itself does nothing */
    API.damageLP(ctx.opponent, 300);
  },
  afterResolve(){},
  passive:{ onLPChange(ctx){ return nightmareDueS272(ctx); } }
});

/* ---- 同族感染ウィルス (monster): ①:手札を1枚捨て、種族を1つ宣言して発動できる。フィールドの宣言した種族のモンスターを全て破壊する。
   (ignition, its controller's Main Phase; the discard is the cost and the Type is declared at activation (requestDeclarationV11 kind race, p11cards.declare-commit);
   resolution destroys every face-up monster of the declared Type on both fields — face-down monsters have no Type) ---- */
API.registerChoiceHandler('s03u272.virus-discard', (a, x)=>{
  const d = x && x.activation;
  if(!d) return;
  if(a.cancelled) return p11cAbort(d);
  p11cRecordMove(d, a, 'discard', 'discard');
  const me = d.uid!=null ? findCardByUid(d.uid) : null;
  requestDeclarationV11({player:d.player, opponent:d.player===0?1:0, card:me?me.card:null}, 'race',
    {title:'同族感染ウィルス：種族を宣言', activation:d, cancelable:false}, {handler:'p11cards.declare-commit', args:{}}, null);
});
defineScript('同族感染ウィルス', {
  type:'monster', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    return true;
  },
  activationV11(ctx, d){
    p11cOpen(d, {title:'同族感染ウィルス：捨てる手札', candidates:API.pileCards(ctx.player, 'hand')}, 's03u272.virus-discard', {});
  },
  resolve(ctx){
    const race = API.declared(ctx, 'race');
    if(!race) return;
    const victims = API.fieldCards({zone:'mz', filter:x=>!!x.card && x.card.face==='up' && currentRaceV17(x.card)===String(race)});
    victims.slice().reverse().forEach(x=>{
      const h = locateCardAnyV4(x.card);
      if(h && h.zone==='mz') API.destroy(h, '同族感染ウィルス', ctx.player);
    });
  },
  afterResolve(){}
});
