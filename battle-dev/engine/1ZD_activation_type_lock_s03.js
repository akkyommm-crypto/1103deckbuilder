/* S03-U51 (C-S03-39) ACTIVATION_TYPE_LOCK — 「宣言した種類のカードをお互いに発動できない」（《Ｎｏ.１６ 色の支配者ショック・ルーラー》）
   Found by R1 (【Jurrac】 vs 1103兎ラギア, seed 0x52310705 first 1, turn 20): the declaration choice crashed in resolution, and the lock it
   recorded (effectFlags.shockRuler) was never read by any legality check, so it would have locked nothing. The card is in 5 fixed lists
   (hero, jurrac, rabbit, tg_gadget, worm).
   2011 source: yugioh-wiki 《Ｎｏ.１６ 色の支配者ショック・ルーラー》 age 8 (2011-08-31):
   - until the end of the opponent's next turn, neither player can activate cards of the declared type;
   - monster declared: monster effects cannot be activated anywhere (field, hand, GY, banished, Deck, Extra Deck); summons stay legal (11/08/19);
   - spell / trap declared: new card activations are blocked; effect activations of face-up Continuous Spells / Traps stay legal (11/08/19);
   - the lock keeps applying after the monster leaves the field (11/08/19).
   Contract: effectFlags.shockRuler = {kind:'m'|'s'|'t', turn, untilTurn}; the lock applies while gameState.turn <= untilTurn.
   A flag without untilTurn (written before this unit) is ignored. Consumers: strictScriptLegalityV2 and the legacy strictScriptLegality,
   so response lists, trigger candidates, hand / zone actions and the activation itself all refuse the same activations. */
function activationTypeLockReasonS03(p, card, zone, db, opts){
  if(typeof gameState==='undefined' || !gameState || !gameState.players) return '';
  const P = gameState.players[p]; if(!P || !card || !db) return '';
  /* S03-U221: 「このターン相手プレイヤーは魔法・罠カードを発動できない」 (真空イタチ) — a turn-stamped flag on the locked player (card activations only) */
  { const tfS03 = P.temporaryFlags || {};
    if((db.k==='s' || db.k==='t') && Number(tfS03.noSpellTrapActivationS03)===Number(gameState.turn)
       && (zone==='hand' || ((zone==='sz' || zone==='field') && card.face==='down') || !!(opts && opts.cardActivation)))
      return 'このターンは魔法・罠カードを発動できません'; }
  /* S03-U227: 「次のターンのエンドフェイズ終了時まで、相手は魔法カードを発動できない」 (ソニックジャマー) — effectFlags.noSpellActivationUntilS03 = the last turn */
  { const efS03 = P.effectFlags || {};
    if(db.k==='s' && efS03.noSpellActivationUntilS03!=null && Number(gameState.turn)<=Number(efS03.noSpellActivationUntilS03)
       && (zone==='hand' || ((zone==='sz' || zone==='field') && card.face==='down') || !!(opts && opts.cardActivation)))
      return '魔法カードを発動できません（ソニックジャマー）'; }
  /* S03-U229: turn-ranged activation bans — effectFlags.activationBanS03 = [{from, to, kinds:['s'|'t'], label}] on the banned player
     (平穏の賢者 / 静寂の聖者 「次のターン」, 言語道断侍 / 強引な安全協定 「このターン」). Card activations only. */
  { const bansS03 = (P.effectFlags||{}).activationBanS03;
    if(Array.isArray(bansS03) && (zone==='hand' || ((zone==='sz' || zone==='field') && card.face==='down') || !!(opts && opts.cardActivation))){
      const t = Number(gameState.turn);
      const hitS03 = bansS03.find(b=>b && t>=Number(b.from) && t<=Number(b.to) && Array.isArray(b.kinds) && b.kinds.indexOf(db.k)>=0);
      if(hitS03) return `${hitS03.label||'効果'}により${db.k==='s'?'魔法':'罠'}カードを発動できません`;
    } }
  /* S03-U217: a face-up monster's 「（相手は）…カードを発動できない」 lock (ミラージュ・ドラゴン, メカニカル・ハウンド, フォトン・ケルベロス) */
  { const mlS03 = monsterActivationLockReasonS03(p, card, zone, db, opts); if(mlS03) return mlS03; }
  /* S03-U213: 「このカードが召喚に成功した時、罠カードを発動する事はできない」 */
  { const slS03 = summonTrapLockReasonS03(card, zone, db, opts); if(slS03) return slS03; }
  /* S03-U144: 「このカードが攻撃する場合、相手はダメージステップ終了時まで魔法・罠カードを発動できない」（engine/1ZO） */
  { const alS03 = (typeof attackLockReasonS03==='function') ? attackLockReasonS03(p, card, zone, db, opts) : ''; if(alS03) return alS03; }
  const f = (P.effectFlags||{}).shockRuler;
  if(!f || !f.kind || f.untilTurn==null) return '';
  if(Number(gameState.turn) > Number(f.untilTurn)) return '';
  if(db.k !== f.kind) return '';
  if(db.k === 'm') return 'ショック・ルーラーの効果により、モンスター効果は発動できません';
  const cardActivation = zone==='hand' || ((zone==='sz' || zone==='field') && card.face==='down') || !!(opts && opts.cardActivation);
  if(!cardActivation) return '';   // 表側表示の永続魔法・永続罠などの効果の発動は封じられない（11/08/19）
  return `ショック・ルーラーの効果により、${db.k==='s'?'魔法':'罠'}カードは発動できません`;
}

/* S03-U213 SUMMON_TRAP_LOCK — 「このカードが召喚に成功した時、罠カードを発動する事はできない」 (イーグル・アイ, 侵略の炎, 忍び寄るデビルマンタ).
   A script declares summonNoTrapS03:true. When its onNormalSummon event is dispatched (processEventV27 / processEventBatchV28, engine/30),
   gameState.summonTrapLockS03 = {uid, turn, phase, chainSeen} is recorded. While it holds, neither player can activate a Trap card
   (card activations; the effects of face-up Traps are not card activations):
   - in the chain built at that summon-success timing (its triggers and everything chained to them);
   - in the post-summon response point (summonFast) when no chain was built there.
   Once a chain has been built and has resolved, the timing has passed (chainSeen). The post-summon point's end clears the record
   (queuePointContinuationV27); a different turn or phase makes it stale. A face-down or negated summoned card applies nothing. */
function noteSummonTrapLockS03(eventName, evt){
  if(eventName!=='onNormalSummon' || !evt) return;
  const u = evt.uid!=null ? evt.uid : (evt.card && evt.card.uid!=null ? evt.card.uid : null);
  const h = u!=null && typeof findCardByUid==='function' ? findCardByUid(u) : null;
  if(!h || h.zone!=='mz' || h.card.face!=='up') return;
  const sc = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(h.card)] : null;
  if(!sc || sc.summonNoTrapS03!==true) return;
  if(typeof effectNegated==='function' && effectNegated(h.card)) return;
  gameState.summonTrapLockS03 = {uid:h.card.uid, name:cardName(h.card), turn:gameState.turn, phase:gameState.phase, chainSeen:false};
}
function summonTrapLockReasonS03(card, zone, db, opts){
  const L = gameState.summonTrapLockS03;
  if(!L || !db || db.k!=='t') return '';
  if(Number(L.turn)!==Number(gameState.turn) || L.phase!==gameState.phase){ delete gameState.summonTrapLockS03; return ''; }
  if((gameState.chain||[]).length) L.chainSeen = true;
  else if(L.chainSeen){ delete gameState.summonTrapLockS03; return ''; }
  const cardActivation = zone==='hand' || ((zone==='sz' || zone==='field') && card && card.face==='down') || !!(opts && opts.cardActivation);
  if(!cardActivation) return '';
  return `${L.name}が召喚に成功した時は罠カードを発動できません`;
}

/* S03-U217 MONSTER_ACTIVATION_LOCK — a face-up, non-negated monster whose script declares activationLockS03(info) → true forbids the card
   activation described by info = {p (activating player), card, zone, db, src, srcPlayer}. Only card activations are locked
   (from the hand, a set card, or opts.cardActivation); the effects of face-up Spells / Traps are not card activations.
   ミラージュ・ドラゴン: the opponent, Traps, in the Battle Phase. メカニカル・ハウンド: the opponent, Spells, while its controller's hand is empty.
   フォトン・ケルベロス: both players, Traps, in the turn it was Normal Summoned. */
/* S03-U259: also monster effect activations (db.k==='m', any zone: 「効果モンスターは効果を発動できない」 — 超古代生物の墓場, インヴェルズの歩哨,
   エンジェルO7, 苦痛の回廊 …); the existing activationLockS03 functions all test info.db.k themselves. Lingering sources registered this
   turn (LINGER_ADD_S03, S03-U257: ランドオルスのヒカリゴケ, 古代の機械砲台) lock too, wherever the used card is. */
function monsterActivationLockReasonS03(p, card, zone, db, opts){
  if(!db || (db.k!=='s' && db.k!=='t' && db.k!=='m') || typeof CARD_SCRIPTS==='undefined') return '';
  /* S03-U393: 封魔の呪印 — a Spell name banned for this player for the rest of the duel (effectFlags.activationBanNamesS03) */
  { const banL = gameState.players[p] && gameState.players[p].effectFlags && gameState.players[p].effectFlags.activationBanNamesS03;
    if(db.k==='s' && Array.isArray(banL) && banL.indexOf(db.n)>=0) return `封魔の呪印の効果により${db.n}を発動できません`; }
  /* S03-U260: the effect of a face-up Spell / Trap (not a card activation) is locked only by sources that opt in with
     locksStEffectsS03:true (エレキリン 「魔法・罠・効果モンスターの効果を発動する事ができない」); the others lock card activations only. */
  let stEffectOnly = false;
  if(db.k!=='m'){
    const cardActivation = zone==='hand' || ((zone==='sz' || zone==='field') && card && card.face==='down') || !!(opts && opts.cardActivation);
    if(!cardActivation) stEffectOnly = true;
  }
  const kindJp = db.k==='s' ? (stEffectOnly ? '魔法カードの効果' : '魔法カード') : db.k==='t' ? (stEffectOnly ? '罠カードの効果' : '罠カード') : 'モンスター効果';
  for(let q=0;q<2;q++){
    /* S03-U228: face-up Spells / Traps and Field Spells too (魔法族の里); a card still being activated applies nothing */
    const Pq = gameState.players[q];
    const lingerS03 = ((Pq.temporaryFlags && Pq.temporaryFlags.lingerUidsS03) || [])
      .concat((gameState.lingerLongS03 || []).filter(e=>e && e.player===q && Number(e.untilTurn) >= Number(gameState.turn)).map(e=>e.uid))   /* S03-U264 */
      .map(u=>{ const h = findCardByUid(u); return h ? h.card : null; });
    for(const c of [].concat(Pq.mz||[], Pq.sz||[], Pq.field?[Pq.field]:[], lingerS03)){
      if(!c || c.face!=='up' || c.activationPending || c.activationNegated || c===card) continue;
      const sc = CARD_SCRIPTS[cardName(c)], f = sc && sc.activationLockS03;
      if(typeof f!=='function') continue;
      if(stEffectOnly && sc.locksStEffectsS03!==true) continue;
      if(typeof effectNegated==='function' && effectNegated(c)) continue;
      let hit = false; try{ hit = !!f({p, card, zone, db, src:c, srcPlayer:q, effectOnly:stEffectOnly}); }catch(e){ hit = false; }
      if(hit) return `${cardName(c)}の効果により${kindJp}を発動できません`;
    }
  }
  return '';
}
