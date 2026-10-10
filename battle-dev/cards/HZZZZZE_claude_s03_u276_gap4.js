/* S03-U276: ENGINE_GAP re-check 4 (2011 texts) — ドッペル・ゲイナー, クリボーを呼ぶ笛, ダーク・アイズ・イリュージョニスト, エレキトンボ, マジック・キャンセラー, デルタ・アタッカー.
   No engine change. Reuses: onLPChange (System v28; cause / sourceUid / byPlayer), the forced Continuous-card trigger shape of 悪夢の拷問部屋 (S03-U272), the deck-trigger
   engine (engine/1ZT declareDeckTriggerS03, 「エレキ」 = GROUP.WATT), activationLockS03 (S03-U259) + continuous negateSpell (S03-U251), API.lingerS03 + continuous
   from:['linger'] + grantsDirectAttack (S03-U257 / S03-U260), the zone-local marks stLinkTargetS03 (S03-U258) and linkV9 watch entries (System v9), API.searchDeck +
   specialSummonPositionsS03 (engine/1ZZK). All helper names carry the S276 suffix. */

/* ---- ドッペル・ゲイナー (Continuous Trap): 相手フィールド上に存在するモンスターの効果によってダメージを受けた時、受けたダメージと同じダメージを相手ライフに与える。
   (Ruling (Opus): activated as a normal Continuous Trap; the activation itself does nothing. While it is face-up it is a FORCED effect applied each time its controller takes
   effect damage (onLPChange cause 'effect') and the damage's source (sourceUid) is a monster that is in the opponent's Monster Zone when the damage happens.
   The damage it deals has this Trap as its source, so it never triggers a Doppel Gainer again.) ---- */
function doppelDueS276(ctx){
  const e = ctx.event || {};
  if(ctx.eventName !== 'onLPChange' || ctx.zone !== 'sz' || !ctx.card || ctx.card.face !== 'up' || ctx.card.activationPending) return false;
  if(e.player !== ctx.player || !(Number(e.delta) < 0) || e.cause !== 'effect' || e.sourceUid == null) return false;
  const s = findCardByUid(e.sourceUid);
  return !!s && s.zone === 'mz' && s.p === ctx.opponent && dbOf(s.card).k === 'm';
}
defineScript('ドッペル・ゲイナー', {
  type:'trap', priority:2, forced:true,
  condition(ctx){
    if(ctx.eventName === 'onLPChange'){
      if(!doppelDueS276(ctx)){ ctx.reason = '相手フィールド上のモンスターの効果によってダメージを受けた時に処理します'; return false; }
      return true;
    }
    if(ctx.zone === 'sz' && ctx.card && ctx.card.face === 'up' && !ctx.card.activationPending){ ctx.reason = '発動済みです'; return false; }
    return true;
  },
  resolve(ctx){
    if(ctx.eventName !== 'onLPChange' || !doppelDueS276(ctx)) return;   /* the activation of the Continuous Trap itself does nothing */
    const n = Math.abs(Number((ctx.event || {}).delta) || 0);
    if(n > 0) API.damageLP(ctx.opponent, n);
  },
  afterResolve(){},
  passive:{ onLPChange(ctx){ return doppelDueS276(ctx); } }
});

/* ---- クリボーを呼ぶ笛 (Quick-Play Spell): 自分のデッキから「クリボー」または「ハネクリボー」1体を選択し、手札に加えるか自分フィールド上に特殊召喚する事ができる。
   (not a target: the Deck is examined at resolution. Pick the monster, then choose add to hand or Special Summon (face-up Attack or Defense, engine/1ZZK).
   「特殊召喚」 is offered only with a free Monster Zone and when this card may be Special Summoned; 「手札に加える」 only when nothing locks Deck-to-hand (ライオウ).
   Not activatable when there is none in the Deck, or when neither option could be done.) ---- */
function whistlePoolS276(p){
  const ok = deckTriggerFilterS03({filter:{names:['クリボー', 'ハネクリボー']}});
  return API.pileCards(p, 'deck', x=>ok(x.db, x.card));
}
function whistleCanAddS276(p){ return !deckToHandLockReasonV32(p); }
function whistleCanSummonS276(p, card){
  if(!hasMonsterZoneSpace(p)) return false;
  if(typeof v46GlobalSpecialSummonRestrictionReason === 'function' && v46GlobalSpecialSummonRestrictionReason(p)) return false;
  return canEffectSpecialSummonS03(card, 'deck', 'クリボーを呼ぶ笛');
}
function whistleOptionsS276(p){
  const pool = whistlePoolS276(p), add = whistleCanAddS276(p);
  return pool.filter(x=>add || whistleCanSummonS276(p, x.card));
}
defineScript('クリボーを呼ぶ笛', {
  type:'quick-play', priority:3, activateFrom:['hand','sz'],
  /* the Special Summon part does not matter while the add part is possible, and the other way round */
  blocksIfNoSpecialSummon(ctx){ return !!ctx && !!deckToHandLockReasonV32(ctx.player); },
  blocksIfNoDeckToHand(ctx){ return !!ctx && !!(typeof v46GlobalSpecialSummonRestrictionReason === 'function' && v46GlobalSpecialSummonRestrictionReason(ctx.player)); },
  condition(ctx){
    if(!whistleOptionsS276(ctx.player).length){ ctx.reason = 'デッキに「クリボー」「ハネクリボー」が無い、または手札に加える・特殊召喚するどちらもできません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = whistleOptionsS276(ctx.player);
    if(!pool.length){ API.shuffle(ctx.player); API.log('クリボーを呼ぶ笛：選べるカードがデッキに無い（デッキをシャッフル）'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'クリボーを呼ぶ笛：「クリボー」または「ハネクリボー」を選択', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u276.whistle-pick', args:{player:ctx.player}}, meta:{scriptName:'クリボーを呼ぶ笛'}});
  },
  afterResolve(){}
});
function whistleSummonS276(p, uid){
  const h = findCardByUid(uid);
  if(!h || h.p !== p || h.zone !== 'deck' || !whistleCanSummonS276(p, h.card)){ API.log('クリボーを呼ぶ笛：特殊召喚できない'); API.shuffle(p); return; }
  specialSummonPositionsS03(p, [{uid, from:'deck'}], 'クリボーを呼ぶ笛');   /* face-up Attack or Defense; the Deck is shuffled by the summon */
}
function whistleAddS276(p, uid){
  const h = findCardByUid(uid);
  if(!h || h.p !== p || h.zone !== 'deck' || !whistleCanAddS276(p)){ API.log('クリボーを呼ぶ笛：手札に加えられない'); API.shuffle(p); return; }
  API.searchDeck(p, h.index, 'クリボーを呼ぶ笛');
}
API.registerChoiceHandler('s03u276.whistle-pick', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const p = x.player, pick = (a.cards || []).find(y=>y && !y.stale && y.uid != null);
  const h = pick ? findCardByUid(pick.uid) : null;
  if(!h || h.p !== p || h.zone !== 'deck') return;
  const add = whistleCanAddS276(p), summon = whistleCanSummonS276(p, h.card);
  if(add && summon){
    requestChoiceV49({player:p, kind:'option', title:`クリボーを呼ぶ笛：${cardName(h.card)}を…`,
      candidates:[{key:'add', value:'add', label:'手札に加える'}, {key:'summon', value:'summon', label:'自分フィールド上に特殊召喚する'}],
      min:1, max:1, cancelable:false, resume:{handler:'s03u276.whistle-mode', args:{player:p, uid:pick.uid}}, meta:{scriptName:'クリボーを呼ぶ笛'}});
    return;
  }
  if(add) whistleAddS276(p, pick.uid); else if(summon) whistleSummonS276(p, pick.uid);
});
API.registerChoiceHandler('s03u276.whistle-mode', (a, x)=>{
  if(!x) return;
  const c = (a && a.cards || [])[0];
  if(c && c.value === 'summon') whistleSummonS276(x.player, x.uid); else whistleAddS276(x.player, x.uid);
});

/* ---- ダーク・アイズ・イリュージョニスト: リバース:このカードがフィールド上に存在している間、指定した対象モンスター1体は永続的に攻撃できなくなる。
   (forced Flip effect; the target — any monster on the field — is chosen when the effect is activated. The link is two zone-local marks: this card's stLinkTargetS03 (the target uid,
   S03-U258) and a linkV9 watch entry on the target naming this card (onGone 'none': a pure mark; both are dropped when the card holding them leaves the field), so a target that
   leaves and returns is free. The lock applies only while this card is face-up in the Monster Zone and its effect is not negated; turning it face-down ends it.) ---- */
function darkEyesPoolS276(){ return API.fieldCards({zone:'mz'}); }
function darkEyesSelfS276(ctx){ return !!ctx.card && ctx.zone === 'mz' && ctx.eventName === 'onFlip' && eventIsSelfS03(ctx); }
function darkEyesLockedS276(target, self){
  return !!target && !!self && self.face === 'up' && target.uid != null && self.uid != null
    && self.stLinkTargetS03 === target.uid && !!linkWatchesV9(target, self.uid);
}
defineUnifiedCardV4('ダーク・アイズ・イリュージョニスト', [{
  key:'flip-no-attack', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['onFlip'], forced:true,
  condition(ctx){
    if(!darkEyesSelfS276(ctx)){ ctx.reason = 'このカードがリバースした場合に発動します'; return false; }
    if(!darkEyesPoolS276().length){ ctx.reason = 'フィールドにモンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('ダーク・アイズ・イリュージョニスト：攻撃できなくするモンスター', darkEyesPoolS276(), t=>done([t])); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    const t = ctx.selectedTargets && ctx.selectedTargets[0] ? resolveTarget(ctx.selectedTargets[0]) : null;
    if(!me || me.zone !== 'mz' || me.card.face !== 'up' || !t || t.zone !== 'mz' || t.card.uid == null) return;   /* this card or the target is gone — nothing is applied */
    API.setCardFlag(me, 'stLinkTargetS03', t.card.uid, 'ダーク・アイズ・イリュージョニスト', {silent:true});
    const t2 = locateCardAnyV4(t.card); const me2 = locateCardAnyV4(ctx.card);
    if(!t2 || t2.zone !== 'mz' || !me2) return;
    act({type:'LINK_ADD_V9', player:t2.p, zone:'mz', index:t2.index, watchUid:me2.card.uid, onGone:'none', onFaceDown:true, label:'ダーク・アイズ・イリュージョニスト'});
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, targets:true,
  passive:{ onFlip(ctx){ return darkEyesSelfS276(ctx) && darkEyesPoolS276().length > 0; } },
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    cannotAttack(target, self){ return darkEyesLockedS276(target, self); } }});

/* ---- エレキトンボ: このカードが相手によって破壊された場合、自分のデッキから「エレキ」と名のついたモンスター1体を特殊召喚する事ができる。
   (optional trigger, from the Graveyard; 「相手によって」 = graveInfo.byPlayer is the opponent — by battle (the opponent's monster) or by an opponent's card effect; destroyed by its own
   controller, or sent to the GY without being destroyed, does not count. 「エレキ」 = GROUP.WATT (the Main Deck monsters among them); the Special Summon position is chosen by
   the player (face-up Attack or Defense, as in every deck trigger).) ---- */
declareDeckTriggerS03('エレキトンボ', {when:'fieldToGrave', action:'summon', optional:true, pos:'faceUp', filter:{group:GROUP.WATT},
  extra(ctx){
    const g = ctx.card && ctx.card.graveInfo;
    return (g && g.byDestroy && g.from === 'mz' && g.byPlayer === ctx.opponent && Number(g.turn) === Number(gameState.turn)) ? '' : '相手によって破壊された時に発動します';
  }});

/* ---- マジック・キャンセラー: このカードがフィールド上に表側表示で存在する限り魔法カードは発動できず、全てのフィールド上魔法カードの効果は無効になる。
   (activationLockS03: neither player can activate a Spell card — card activations only, the effects of face-up Spells are negated anyway; continuous negateSpell: the effects of all
   Spell cards on the field are negated. While face-up in the Monster Zone; both stop when its own effect is negated.) ---- */
defineScript('マジック・キャンセラー', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=> i.db.k === 's' && !i.effectOnly,
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    negateSpell(card, self){ return !!card && dbOf(card).k === 's' && !!self && self.face === 'up'; } }
});

/* ---- デルタ・アタッカー (Spell): 自分フィールド上に同名通常モンスター(トークンを除く)が3体存在する時に発動する事ができる。発動ターンのみ、3体の同名通常モンスターは相手プレイヤーに直接攻撃をする事ができる。
   (condition: exactly 3 face-up non-Token Normal Monsters with the same name on its controller's field (read literally: 「3体存在する」). At resolution the group is read again and its uids are
   recorded on the used card, which lingers for the turn (API.lingerS03); continuous.grantsDirectAttack (from:['linger']) applies to exactly those cards, each carrying a zone-local linkV9 mark,
   only in the activation turn.) ---- */
function deltaGroupS276(p){
  const by = {};
  API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face === 'up' && !x.card.token && x.db.k === 'm' && (x.db.st || []).indexOf('通常') >= 0})
    .forEach(x=>{ const n = cardName(x.card); (by[n] = by[n] || []).push(x); });
  const g = Object.keys(by).map(n=>by[n]).filter(a=>a.length === 3);
  return g.length ? g[0] : null;
}
defineScript('デルタ・アタッカー', {
  type:'spell', priority:1,
  condition(ctx){ if(!deltaGroupS276(ctx.player)){ ctx.reason = '自分フィールドに同名の通常モンスター（トークンを除く）が3体必要です'; return false; } return true; },
  resolve(ctx){
    const grp = deltaGroupS276(ctx.player);
    if(!grp){ API.log('デルタ・アタッカー：3体の同名通常モンスターがいない'); return; }
    const me = locateCardAnyV4(ctx.card); if(!me) return;
    API.setCardFlag(me, 'u276DeltaUidsS276', grp.map(x=>x.card.uid), 'デルタ・アタッカー', {silent:true});
    const me1 = locateCardAnyV4(ctx.card); if(!me1) return;
    API.setCardFlag(me1, 'u276DeltaTurnS276', gameState.turn, 'デルタ・アタッカー', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(!me2) return;
    grp.forEach(x=>{
      const t = locateCardAnyV4(x.card);
      if(t && t.zone === 'mz') act({type:'LINK_ADD_V9', player:t.p, zone:'mz', index:t.index, watchUid:me2.card.uid, onGone:'none', label:'デルタ・アタッカー'});
    });
    const me3 = locateCardAnyV4(ctx.card); if(me3) API.lingerS03(ctx.player, me3, 'デルタ・アタッカー');
  },
  afterResolve(){},
  continuous:{ scope:'allMonsters', from:['linger'], apply(){ return null; },
    grantsDirectAttack(card, self){
      return !!card && !!self && Number(self.u276DeltaTurnS276) === Number(gameState.turn) && Array.isArray(self.u276DeltaUidsS276)
        && self.u276DeltaUidsS276.indexOf(card.uid) >= 0 && card.face === 'up' && !!linkWatchesV9(card, self.uid);
    } }
});
