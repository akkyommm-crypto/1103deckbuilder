/* S03-U46 (C-S03-37) 《王宮の弾圧》 and SPECIAL_SUMMON_EFFECT declarations for the major-deck cards.
   Text: 800ライフポイントを払う事で、モンスターの特殊召喚及び、モンスターの特殊召喚を含む効果を無効にし破壊する。
         この効果は相手プレイヤーも使用する事ができる。
   2011 source: yugioh-wiki 《王宮の弾圧》 age 42 (2011-08-28 07:53).
   - The card activation is free chain and pays no LP. A set copy can be activated and use the effect in the same chain link,
     both at the summon-negation timing of a chain-less Special Summon and chaining to an activation that includes a Special Summon.
   - The effect is used only chaining directly to the Special Summon or to that activation (08/08/09): a second copy cannot answer
     after something chained to the first, and it cannot be used at the summon timing once a chain has started (08/07/27).
   - A face-up copy may use the effect several times in one chain; a copy flipped by a card activation in this chain cannot use it
     at a higher chain link.
   - Neither the card activation nor the effect can be used in the Damage Step.
   - It negates the effect (not the activation) and destroys the card where it is: on the field for 《死者蘇生》 (11/08/27);
     a summon-rule Special Summon is negated and the monster is destroyed "neither on the field nor in the hand" (11/08/07).
   - Either player may use it; the user pays 800 (09/03/15: a player may use their own copy against their own summon — the engine
     keeps offering summon negators to the non-summoning player only, as for every negator).
   Design choices with no 2011 ruling found (recorded in the unit report): a set copy activated while an answerable Special Summon is
   on the chain uses the effect when its user can pay 800; in the summon window the negator list stays one per player priority. */
declareSpecialSummonEffectS03({
  '真六武衆－カゲキ': true,            // ① its only activated effect Special Summons from the hand
  '六武衆の荒行': true,                 // ① Special Summons from the Deck
  '諸刃の活人剣術': true,               // ① Special Summons two from the GY
  'レスキューラビット': true,           // ① Special Summons two from the Deck
  'スクラップ・ドラゴン': link=>link.eventName==='onDestroy',   // ② only; ① destroys
  '六武の門': link=>link.v4EffectKey==='m6',                    // ● 6 counters only; ● 2 / ● 4 do not Special Summon
});

/* chain-less Special Summons that wait in the summon-negation window: summon-rule procedures (サイバー・ドラゴン) and Synchro / Xyz Summons
   (the age 42 text lists シンクロ召喚・エクシーズ召喚 as Special Summons; chain-less ones are answered at the 昇天の角笛 timing). */
const ROYAL_OPPRESSION_KINDS_S03 = ['procedure','synchro','xyz'];
function royalOppressionTargetS03(){
  const ps = gameState.pendingSummon;
  if(ps && !gameState.chain.length) return ROYAL_OPPRESSION_KINDS_S03.includes(ps.kind) ? {mode:'summon',uid:ps.uid} : null;
  if(ps) return null;
  const top = gameState.chain[gameState.chain.length-1];
  if(top && !top.negated && specialSummonEffectLinkS03(top)) return {mode:'chain',chainId:top.chainId};
  return null;
}
function royalOppressionFlippedThisChainS03(card){
  return !!(card && card.uid!=null && gameState.chain.some(l=>l && l.uid===card.uid && l.cardActivationS03===true));
}

defineScript('王宮の弾圧', {
  type:'continuous-trap', priority:2,
  sharedUseS03:true,          // この効果は相手プレイヤーも使用する事ができる
  onFieldEffectS03:true,      // 表側で場に残ったまま効果を使用する（裏側からはカードの発動）
  summonNegate:{kinds:ROYAL_OPPRESSION_KINDS_S03},
  condition(ctx){
    if(inDamageStepS03()){ ctx.reason='ダメージステップでは発動できません'; return false; }
    const faceDown = !!(ctx.card && ctx.card.face==='down');
    const t = royalOppressionTargetS03();
    const summonWindow = !!(gameState.pendingSummon && !gameState.chain.length);
    if(faceDown && !summonWindow) return true;   // カードの発動（フリーチェーン）。直接チェーンできる対象があれば効果も使う
    if(!t){ ctx.reason='特殊召喚、または特殊召喚を含む効果の発動に直接チェーンする時だけ使用できます'; return false; }
    if(API.me(ctx).lp < 800){ ctx.reason='800ライフポイントを払えません'; return false; }
    if(!faceDown && royalOppressionFlippedThisChainS03(ctx.card)){ ctx.reason='このチェーンで表にした王宮の弾圧は、それより上のチェーンで効果を使用できません'; return false; }
    return true;
  },
  cost(ctx, done){
    const t = royalOppressionTargetS03();
    if(t && API.me(ctx).lp >= 800){
      API.payCost(ctx.player, 800);
      ctx.costCtxS03 = Object.assign({}, ctx.costCtxS03||{}, {oppressionS03:t});
    }
    done(true);
  },
  resolve(ctx){
    const t = ctx.oppressionS03;
    if(!t){ API.log('王宮の弾圧：カードの発動'); return; }
    const h = ctx.card && findCardByUid(ctx.card.uid);
    if(!h || h.zone!=='sz' || h.card.face!=='up'){ API.log('王宮の弾圧：フィールドに表側表示で存在しないため、効果は適用されない'); return; }
    if(typeof trapNegated==='function' && trapNegated(h.card)){ API.log('王宮の弾圧：効果は無効になっている'); return; }
    if(t.mode==='summon'){
      if(gameState.pendingSummon && gameState.pendingSummon.uid===t.uid){ API.log('王宮の弾圧：特殊召喚を無効にし破壊する'); summonNegatePendingV2('王宮の弾圧'); }
      return;
    }
    const li = gameState.chain.findIndex(l=>l && l.chainId===t.chainId);
    if(li<0) return;
    const link = gameState.chain[li];
    API.log(`王宮の弾圧：${link.name} の効果を無効にし破壊する`);
    act({type:'CHAIN_NEGATE_LINK', chainId:t.chainId, index:li, reason:'王宮の弾圧', mode:'effect'});
    const src = link.uid!=null ? findCardByUid(link.uid) : null;
    if(src && (src.zone==='sz' || src.zone==='field' || src.zone==='mz'))
      act({type:'FX_TO_GRAVE', player:src.p, zone:src.zone, index:src.index, reason:'王宮の弾圧', byDestroy:true});
  },
  afterResolve(){}   // 永続罠：場に残る
});
