/* S03-U267: NOT_STARTED / ENGINE_GAP cards (2011 texts) — 心鎮壷, A・O・J サウザンド・アームズ, エネルギー吸収板, 痛魂の呪術, ヴェノム・スワンプ, カーム・マジック,
   白銀のバリア－シルバーフォース－.
   Reuses: activationLockS03 (engine/1ZD, S03-U259) with the zone-local marks stLinkTargetS03 / stLinkByS03 (S03-U188), attackAllMonstersS03 (engine/1ZQ) +
   continuous.cannotBeAttackedByS03 / cannotBeAttackTargetBothS03 (engine/1ZU), a3LiveBattleOther / a3DestroyBeforeDamage (cards/A3), the effect category 'damage'
   (System v19) with declareActivationResponseS03 (engine/1P) and API.addLpRule modes damageToRecover / redirect with a chainId (System v18), API.addCounter +
   continuous.apply atk, the Venom group (GROUP.VENOM), the summon-ban flags noSummonS03 / noSpecialSummon + the System v7 scheduler (an endPhase handler lifts them).
   All helper names carry the S267 suffix. */

/* ---- 心鎮壷 (Continuous Trap): フィールド上にセットされた魔法・罠カードを2枚選択して発動する。このカードがフィールド上に存在する限り、選択された魔法・罠カードは発動できない。
   (the two targets are chosen at activation; both uids are kept on this card (stLinkTargetS03, zone-local) and the trap's uid on each target (stLinkByS03, zone-local, so a
   target that left the field and came back is not locked); engine/1ZD reads it only while this card is face-up on the field and not negated) ---- */
function shinchinSetsS267(ctx){
  return API.fieldCards({filter:x=>(x.zone==='sz' || x.zone==='field') && !!x.card && x.card.face==='down' && x.card!==ctx.card && (x.db.k==='s' || x.db.k==='t')});
}
function shinchinLockedS267(src, card){
  return !!src && !!card && card.uid!=null && src.uid!=null
    && Array.isArray(src.stLinkTargetS03) && src.stLinkTargetS03.indexOf(card.uid)>=0
    && Array.isArray(card.stLinkByS03) && card.stLinkByS03.indexOf(src.uid)>=0;
}
defineScript('心鎮壷', {
  type:'trap', priority:1, targets:true,
  condition(ctx){
    if(ctx.zone==='sz' && ctx.card && ctx.card.face==='up' && !ctx.card.activationPending){ ctx.reason = '発動済みです'; return false; }
    if(shinchinSetsS267(ctx).length < 2){ ctx.reason = 'フィールド上にセットされた魔法・罠カードが2枚必要です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('心鎮壷：発動できなくする1枚目（セットされた魔法・罠カード）', shinchinSetsS267(ctx), a=>{
      const ua = a && a.card ? a.card.uid : null;
      API.selectCard('心鎮壷：発動できなくする2枚目（セットされた魔法・罠カード）', shinchinSetsS267(ctx).filter(x=>x.card.uid!==ua), b=>done([a, b]));
    });
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return;
    const hs = (ctx.selectedTargets || []).map(t=>resolveTarget(t)).filter(h=>h && (h.zone==='sz' || h.zone==='field') && h.card!==ctx.card);
    if(hs.length < 2 || hs[0].card===hs[1].card) return;   /* a target that left the field — nothing is applied */
    const uids = hs.map(h=>ensureCardUid(gameState, h.card));
    API.setCardFlag(me, 'stLinkTargetS03', uids, '心鎮壷', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(!me2) return;
    hs.forEach(h=>{
      const t = locateCardAnyV4(h.card); if(!t) return;
      const prev = Array.isArray(t.card.stLinkByS03) ? t.card.stLinkByS03.slice() : [];
      prev.push(me2.card.uid);
      API.setCardFlag(t, 'stLinkByS03', prev, '心鎮壷', {silent:true});
    });
  },
  afterResolve(){},
  activationLockS03:(i)=> (i.db.k==='s' || i.db.k==='t') && shinchinLockedS267(i.src, i.card)
});

/* ---- A・O・J サウザンド・アームズ: このカードは相手フィールド上の全ての光属性モンスターに1回ずつ攻撃できる。このカードが光属性以外のモンスターと戦闘を行う場合、そのダメージ計算前に
   このカードを破壊する。
   (attackAllMonstersS03 gives the once-each attacks; engine/1ZQ is per card, not per target, so the LIGHT restriction is a continuous cannotBeAttackedByS03 on the opponent's monsters:
   once it has attacked this turn it may only attack LIGHT monsters. Ruling chosen: after ANY attack — even one at a non-LIGHT monster whose battle never happened — only LIGHT monsters
   can still be attacked; a face-down monster is not LIGHT. The second text is forced and judged before damage calculation (dsTiming 'before', after a face-down monster was flipped),
   whether this card attacks or is attacked: 'start' would see a face-down monster's attribute too early.) ---- */
function aojLightS267(c){ return !!c && c.face==='up' && currentAttributeV17(c)==='光'; }
function aojDueS267(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return false;
  const o = a3LiveBattleOther(ctx);
  return !!o && o.face==='up' && !aojLightS267(o);
}
defineScript('A・O・J サウザンド・アームズ', {
  type:'monster', priority:1, forced:true, dsTiming:'before', targets:false,
  attackAllMonstersS03:true,
  condition(ctx){ if(!aojDueS267(ctx)){ ctx.reason = '光属性以外のモンスターと戦闘を行う場合に破壊されます'; return false; } return true; },
  resolve(ctx){ a3DestroyBeforeDamage(ctx.card, 'A・O・J サウザンド・アームズ'); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return aojDueS267(ctx); } },
  continuous:{ scope:'oppMonsters', from:['mz'], apply(){ return null; }, cannotBeAttackTargetBothS03:true,
    cannotBeAttackedByS03(target, attacker, self){
      if(!target || !self || attacker!==self || self.face!=='up') return false;
      if(!attackAllRecordS03(self).length) return false;
      return !aojLightS267(target);
    } }
});

/* ---- 共通: 相手が「自分にダメージを与える」魔法・罠・効果モンスターの効果を発動した時 (the effect category 'damage', System v19; it is judged from the card's text, so a card that
   also damages its own controller counts — the category has no recipient) ---- */
function damageLinkS267(ctx){
  /* engine/30 duelActivateResponseV2 pre-checks a Quick-Play Spell activated from the hand without the response event — fall back to the top link's */
  const e = ctx.event || (typeof topActivationEventS03==='function' ? topActivationEventS03(gameState) : null);
  if(!e || !ctx.card || e.player!==ctx.opponent || e.uid===ctx.card.uid) return null;
  if(e.kind!=='spell' && e.kind!=='trap' && e.kind!=='monster') return null;
  if((gameState.chain||[]).findIndex(l=>l && l.chainId===e.chainId) < 0) return null;
  return API.effectHasCategory(e, 'damage') ? e : null;
}

/* ---- エネルギー吸収板 (Trap): 自分にダメージを与える魔法・罠・効果モンスターの効果を相手が発動した時に発動できる。自分はダメージを受ける代わりに、その数値分だけライフポイントを回復する。
   (damageToRecover for the chain link only: the effect damage that link deals to its controller's opponent (this card's controller) is gained instead; the damage to others is untouched) ---- */
defineScript('エネルギー吸収板', {
  type:'trap', priority:3,
  condition(ctx){ if(!damageLinkS267(ctx)){ ctx.reason = '相手がダメージを与える効果を発動した時に発動します'; return false; } return true; },
  resolve(ctx){
    if(!ctx.event) return;
    API.addLpRule({player:ctx.player, cause:'effect', mode:'damageToRecover', turns:0, chainId:ctx.event.chainId, label:'エネルギー吸収板'});
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!damageLinkS267(ctx); } }
});

/* ---- 痛魂の呪術 (Quick-Play Spell): ①:自分にダメージを与える効果を相手が発動した時に発動できる。その効果で発生する自分への効果ダメージは代わりに相手が受ける。
   (redirect for the chain link only; the activator of that effect takes the damage instead) ---- */
defineScript('痛魂の呪術', {
  type:'quick-play', priority:3, activateFrom:['hand','sz'],
  condition(ctx){ if(!damageLinkS267(ctx)){ ctx.reason = '相手がダメージを与える効果を発動した時に発動します'; return false; } return true; },
  resolve(ctx){
    if(!ctx.event) return;
    API.addLpRule({player:ctx.player, cause:'effect', mode:'redirect', toPlayer:ctx.opponent, turns:0, chainId:ctx.event.chainId, label:'痛魂の呪術'});
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return (ctx.zone==='sz' || ctx.zone==='hand') && !!damageLinkS267(ctx); } }
});
declareActivationResponseS03(['エネルギー吸収板', '痛魂の呪術']);

/* ---- ヴェノム・スワンプ (Field Spell): お互いのターンのエンドフェイズ毎に、フィールド上に表側表示で存在する「ヴェノム」と名のついたモンスター以外の表側表示で存在する全てのモンスターに
   ヴェノムカウンターを1つ置く。ヴェノムカウンター1つにつき、攻撃力は500ポイントダウンする。この効果で攻撃力が0になったモンスターは破壊される。
   (forced trigger at every End Phase; the -500 per Venom Counter is a continuous effect of the face-up Field Spell over every monster; a monster whose ATK was above 0 before the
   counter and is 0 after it is destroyed right after the counters are placed — a monster that already had 0 ATK is not destroyed by it. 「ヴェノム」 = GROUP.VENOM monsters) ---- */
function swampVenomS267(db){ return !!db && db.k==='m' && isCardInGroupV4(db, GROUP.VENOM); }
function swampTargetsS267(){
  return API.fieldCards({zone:'mz', filter:x=>!!x.card && x.card.face==='up' && !swampVenomS267(x.db)});
}
function swampReadyS267(ctx){ return ctx.zone==='field' && !!ctx.card && ctx.card.face==='up' && !ctx.card.activationPending && gameState.phase==='end'; }
defineScript('ヴェノム・スワンプ', {
  type:'spell', priority:1, forced:true,
  condition(ctx){
    /* a card in the hand is 'face-up' too, so the End Phase separates the trigger from the activation (a Field Spell is never activated in the End Phase) */
    if(gameState.phase==='end'){
      if(!swampReadyS267(ctx)){ ctx.reason = 'エンドフェイズに処理します（フィールド魔法の発動はメインフェイズです）'; return false; }
      if(!swampTargetsS267().length){ ctx.reason = '対象となる表側表示のモンスターがいません'; return false; }
    }
    return true;
  },
  resolve(ctx){
    if(gameState.phase!=='end') return;   /* the activation of the Field Spell itself (Main Phase) puts no counter */
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone!=='field' || me.card.face!=='up') return;
    const doomed = [];
    swampTargetsS267().forEach(x=>{
      const before = curATK(x.card);
      API.addCounter(x, 'ヴェノム', 1);
      const now = locateCardAnyV4(x.card);
      if(now && now.zone==='mz' && before > 0 && curATK(now.card) <= 0) doomed.push(now.card);
    });
    doomed.forEach(c=>{ const h = locateCardAnyV4(c); if(h && h.zone==='mz') API.destroy(h, 'ヴェノム・スワンプ', ctx.player); });
  },
  afterResolve(){},
  passive:{ onEndPhase(ctx){ return swampReadyS267(ctx) && swampTargetsS267().length > 0; } },
  continuous:{ scope:'allMonsters', from:['field'],
    apply(card){
      const n = card && card.counters ? Number(card.counters['ヴェノム']) : 0;
      return n > 0 ? {atk:-500*n} : null;
    } }
});

/* ---- カーム・マジック (Spell): メインフェイズ1の開始時に発動できる。お互いのプレイヤーは、このターンのメインフェイズ時及びバトルフェイズ時にモンスターを通常召喚・反転召喚・特殊召喚できない。
   (modelled as: Main Phase 1, and its controller has not Normal / Flip / Special Summoned nor activated anything this turn (activatedKindsS03). The ban is the noSummonS03 / noSpecialSummon
   flags of both players — set only where no other card already set them — and a System v7 endPhase handler lifts them, so the End Phase is free again) ---- */
function calmFreshS267(p){
  const P = gameState.players[p], tf = P.temporaryFlags || {};
  const acted = tf.activatedKindsS03 || {};
  return !tf.summonedThisTurnS03 && !tf.normalSummonSuccessS03 && !(P.ssHistory || []).length && !Object.keys(acted).some(k=>acted[k]);
}
API.registerScheduleHandler('s03u267.calm-end', (args)=>{
  [0,1].forEach(p=>{
    const tf = gameState.players[p].temporaryFlags || {};
    if((args.ns || []).indexOf(p)>=0 && tf.noSummonS03==='カーム・マジック') act({type:'PLAYER_FLAG_SET_V42', player:p, key:'noSummonS03', deleteFlag:true, temporary:true});
    if((args.ss || []).indexOf(p)>=0 && tf.noSpecialSummon) act({type:'PLAYER_FLAG_SET_V42', player:p, key:'noSpecialSummon', deleteFlag:true, temporary:true});
  });
});
defineScript('カーム・マジック', {
  type:'spell', priority:1,
  condition(ctx){
    if(gameState.phase!=='main1'){ ctx.reason = 'メインフェイズ1の開始時にのみ発動できます'; return false; }
    if(!calmFreshS267(ctx.player)){ ctx.reason = 'メインフェイズ1の開始時ではありません（このターン既に召喚か発動を行っています）'; return false; }
    return true;
  },
  resolve(ctx){
    const ns = [], ss = [];
    [0,1].forEach(p=>{
      const tf = gameState.players[p].temporaryFlags || {};
      if(!tf.noSummonS03){ API.setFlag(p, 'noSummonS03', 'カーム・マジック', true); ns.push(p); }
      if(!tf.noSpecialSummon){ API.setFlag(p, 'noSpecialSummon', true, true); ss.push(p); }
    });
    API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'s03u267.calm-end', args:{ns, ss}, note:'カーム・マジック'});
  },
  afterResolve(){}
});

/* ---- 白銀のバリア－シルバーフォース－ (Counter Trap): 相手がダメージを与える罠カードを発動した時に発動する事ができる。その発動を無効にし、そのカードと相手フィールド上に表側表示で存在する魔法・罠カードを全て破壊する。
   (the opponent's Trap CARD activation whose text inflicts damage (category 'damage'); a Trap's effect (a face-up Continuous Trap) is not a card activation) ---- */
function silverForceLinkS267(ctx){
  const e = ctx.event;
  if(!e || e.kind!=='trap' || e.player!==ctx.opponent) return null;
  const l = (gameState.chain||[])[Number(e.chainLink)-1];
  if(!l || l.cardActivationS03!==true || l.chainId!==e.chainId) return null;
  return API.effectHasCategory(e, 'damage') ? l : null;
}
defineScript('白銀のバリア－シルバーフォース－', {
  type:'trap', priority:3,
  condition(ctx){ if(!silverForceLinkS267(ctx)){ ctx.reason = '相手がダメージを与える罠カードを発動した時に発動します'; return false; } return true; },
  resolve(ctx){
    if(!ctx.event) return;
    API.negateChainLink(ctx.event, 'activation', '白銀のバリア－シルバーフォース－', true);
    const hs = API.fieldCards({player:ctx.opponent, filter:x=>(x.zone==='sz' || x.zone==='field') && !!x.card && x.card.face==='up'});
    hs.slice().reverse().forEach(x=>{
      const h = locateCardAnyV4(x.card);
      if(h && (h.zone==='sz' || h.zone==='field')) API.destroy(h, '白銀のバリア－シルバーフォース－', ctx.player);
    });
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!silverForceLinkS267(ctx); } }
});
declareActivationResponseS03(['白銀のバリア－シルバーフォース－']);
