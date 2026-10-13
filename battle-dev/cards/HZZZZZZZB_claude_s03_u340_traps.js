/* S03-U340: five Spell / Trap cards (carddata texts).

   ストライク・ショット   自分フィールド上のモンスターの攻撃宣言時に発動できる。そのモンスターの攻撃力はエンドフェイズ時まで700アップ。そのモンスターが守備表示モンスターを攻撃した場合、その守備力を攻撃力が越えていれば（越えた）数値だけ戦闘ダメージを与える。
   チェンジ・デステニー   相手モンスターの攻撃宣言時に発動できる。その攻撃を無効にし、そのモンスターを守備表示にする。表側表示で存在する限り表示形式を変更できない。その後、相手は以下から1つを選択して適用する。●そのモンスターの攻撃力の半分だけ自分のLPを回復する。●その攻撃力の半分のダメージを相手（このカードの使用者）に与える。
   ライト・バニッシュ     （カウンター罠）自分フィールドの「ライトロード」モンスター1体をリリースして発動できる。モンスターの召喚・反転召喚・特殊召喚を無効にし破壊する。
   ヴィクティム・カウンター（カウンター罠）自分フィールドの表側表示のデュアルモンスター1体を裏側守備表示にし、相手の魔法カードの発動を無効にし破壊する。
   ワンダー・クローバー   （魔法）自分フィールドの表側表示のモンスター1体を選択し、手札からレベル4の植物族モンスター1体を墓地へ送って発動する。選択したモンスターは1度のバトルフェイズ中に2回攻撃できる。このカードを発動するターン、自分の他のモンスターは攻撃宣言できない。

   Notes
   - The used card lingers (API.lingerS03, S03-U257 / U264): ストライク・ショット' piercing, チェンジ・デステニー' position lock (a card flag on the monster, long linger) and ワンダー・クローバー' attack limit / attack ban are continuous effects of the lingering source.
   - チェンジ・デステニー: the controller of the attacker answers the final choice (journaled registry choice); LP recovery / damage use the attacker's ATK at the activation (halved, rounded down).
   - ライト・バニッシュ answers the summon-negation window and the Special Summon effect link like エレキャンセル (S03-U336); ヴィクティム・カウンター copies マジック・ジャマー (onActivateSuccess), its cost turns the Gemini monster face-down Defense (FX_SET_STATE). */

/* ---- ストライク・ショット ---- */
defineScript('ストライク・ショット', {
  type:'trap', priority:2,
  condition(ctx){
    const a = gameState.pendingAttack;
    if(ctx.eventName!=='onAttackDeclare' && !a){ ctx.reason = '自分のモンスターの攻撃宣言時に発動します'; return false; }
    if(!a || a.player!==ctx.player || !findCardByUid(a.attackerUid)){ ctx.reason = '自分のモンスターの攻撃宣言時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const a = gameState.pendingAttack, h = a && findCardByUid(a.attackerUid), me = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='mz' || h.p!==ctx.player || !me) return;
    const uid = ensureCardUid(gameState, h.card);
    API.modAtk(h, 700, 0, 'endTurn', 'ストライク・ショット');
    API.setCardFlag(me, 'u340StrikeUid', uid, 'ストライク・ショット', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.setCardFlag(me2, 'u340StrikeTurn', gameState.turn, 'ストライク・ショット', {silent:true});
    const me3 = locateCardAnyV4(ctx.card); if(me3) API.lingerS03(ctx.player, me3, 'ストライク・ショット');
  },
  afterResolve(){},
  continuous:{ scope:'self', from:['linger'], apply(){ return null; },
    piercingDamage(info){
      const s = info && info.self; if(!s || Number(s.u340StrikeTurn)!==Number(gameState.turn)) return 0;
      const a = info.atkCard, d = info.defCard;
      if(!a || !d || a.uid!==s.u340StrikeUid || d.pos!=='def') return 0;
      return Math.max(0, curATK(a) - curDEF(d));
    } },
  passive:{ onAttackDeclare(ctx){ const a = gameState.pendingAttack; return ctx.zone==='sz' && !!a && a.player===ctx.player; } }
});

/* ---- チェンジ・デステニー ---- */
API.registerChoiceHandler('u340.destiny-pick', (answer, args)=>{
  const key = String((answer && answer.keys && answer.keys[0]) || 'heal');
  const n = Number(args && args.half) || 0; if(n<=0) return;
  if(key==='damage') API.damageLP(args.trapPlayer, n, 'チェンジ・デステニー');
  else API.recoverLP(args.attackerPlayer, n, 'チェンジ・デステニー');
});
defineScript('チェンジ・デステニー', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    const a = gameState.pendingAttack;
    if(ctx.eventName!=='onAttackDeclare' && !a){ ctx.reason = '相手モンスターの攻撃宣言時に発動します'; return false; }
    if(!a || a.player!==ctx.opponent || !findCardByUid(a.attackerUid)){ ctx.reason = '相手モンスターの攻撃宣言時に発動します'; return false; }
    return true;
  },
  selectTargets(ctx, done){ const a = gameState.pendingAttack, h = a && findCardByUid(a.attackerUid); done(h ? [h] : []); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    API.negateAttack('チェンジ・デステニー');
    if(!r || r.zone!=='mz' || r.p!==ctx.opponent) return;
    const half = Math.floor(curATK(r.card)/2);
    if(r.card.face==='up' && r.card.pos==='atk') API.changePosition(r, 'def', 'チェンジ・デステニー');
    const h2 = locateCardAnyV4(r.card);
    if(h2 && h2.zone==='mz' && h2.card.face==='up'){
      API.setCardFlag(h2, 'u340DestinyLock', true, 'チェンジ・デステニー', {silent:true});
      const me = locateCardAnyV4(ctx.card); if(me) API.lingerS03(ctx.player, me, 'チェンジ・デステニー', gameState.turn + 500);
    }
    if(half>0) API.requestChoice({player:ctx.opponent, kind:'card', title:'チェンジ・デステニー：適用する効果', cancelable:false, min:1, max:1,
      candidates:[{key:'heal', label:'攻撃を無効にされたモンスターの攻撃力の半分（'+half+'）だけ自分のLPを回復する'},
                  {key:'damage', label:'攻撃を無効にされたモンスターの攻撃力の半分（'+half+'）のダメージを相手に与える'}],
      resume:{handler:'u340.destiny-pick', args:{half, trapPlayer:ctx.player, attackerPlayer:ctx.opponent}}});
  },
  afterResolve(){},
  continuous:{ scope:'allMonsters', from:['linger'], apply(){ return null; },
    cannotChangePosition(target){ return !!target && target.u340DestinyLock===true && target.face==='up'; } },
  passive:{ onAttackDeclare(ctx){ const a = gameState.pendingAttack; return ctx.zone==='sz' && !!a && a.player===ctx.opponent; } }
});

/* ---- ライト・バニッシュ ---- */
function u340Lord(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && String(x.db.n||'').indexOf('ライトロード')>=0}); }
defineScript('ライト・バニッシュ', {
  onOtherSummon:true,
  summonNegate:{kinds:['normal','flip','procedure','synchro','xyz']},
  type:'counter', priority:3,
  condition(ctx){
    if(!u340Lord(ctx).length){ ctx.reason = '自分フィールドに「ライトロード」モンスターがいません'; return false; }
    if(gameState.pendingSummon) return true;
    if(gameState.chain.length){
      const top = gameState.chain[gameState.chain.length-1], tsc = CARD_SCRIPTS[top.name];
      if(typeof specialSummonEffectLinkS03==='function' ? specialSummonEffectLinkS03(top,{excludeSpellTrapEffect:true}) : (tsc && tsc.includesSpecialSummon===true)) return true;
    }
    ctx.reason = 'モンスターの召喚・反転召喚・特殊召喚時にのみ発動できます'; return false;
  },
  cost(ctx, done){
    const pool = u340Lord(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('ライト・バニッシュ：リリースする「ライトロード」モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, 'ライト・バニッシュ（リリース）'); done(true);
    });
  },
  resolve(){
    if(gameState.pendingSummon) summonNegatePendingV2('ライト・バニッシュ');
    else negatePreviousChainLinkV2('ライト・バニッシュ', true);
  },
  passive:{
    onNormalSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onSpecialSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; }
  }
});

/* ---- ヴィクティム・カウンター ---- */
function u340Dual(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && (x.db.st||[]).indexOf('デュアル')>=0}); }
function u340FoeSpellLink(ctx){
  if(d2FoeSpell(ctx)) return true;
  const top = gameState.chain && gameState.chain[gameState.chain.length-1];
  if(!top || top.player!==ctx.opponent) return false;
  const db = CARD_DB[findCardIndex(top.name)];
  return !!db && db.k==='s';
}
defineScript('ヴィクティム・カウンター', {
  type:'trap', priority:3,
  condition(ctx){
    if(!u340FoeSpellLink(ctx)){ ctx.reason = '相手が魔法カードを発動した時に発動します'; return false; }
    if(!u340Dual(ctx).length){ ctx.reason = '自分フィールドに表側表示のデュアルモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u340Dual(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('ヴィクティム・カウンター：裏側守備表示にするデュアルモンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      act({type:'FX_SET_STATE', player:r.p, zone:r.zone, index:r.index, face:'down', pos:'def', reason:'ヴィクティム・カウンター（コスト）'}); done(true);
    });
  },
  resolve(ctx){ if(ctx.event && ctx.event.kind==='spell') API.negateChainLink(ctx.event, 'activation', 'ヴィクティム・カウンター', true); else negatePreviousChainLinkV2('ヴィクティム・カウンター', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && d2FoeSpell(ctx) && u340Dual(ctx).length>0; } }
});

/* ---- ワンダー・クローバー ---- */
function u340CloverHand(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.card!==ctx.card && x.db.k==='m' && x.db.lv===4 && x.db.ra==='植物'); }
function u340CloverHosts(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}); }
defineScript('ワンダー・クローバー', {
  type:'spell', priority:1, targets:true,
  condition(ctx){
    if(!u340CloverHosts(ctx).length){ ctx.reason = '自分フィールドに表側表示のモンスターがいません'; return false; }
    if(!u340CloverHand(ctx).length){ ctx.reason = '手札にレベル4の植物族モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('ワンダー・クローバー：2回攻撃できるモンスター', u340CloverHosts(ctx), t=>done([t])); },
  cost(ctx, done){
    const pool = u340CloverHand(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('ワンダー・クローバー：墓地へ送る手札のレベル4の植物族モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.sendHandToGrave(ctx.player, r.index, 'ワンダー・クローバー（コスト）'); done(true);
    });
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
    if(!r || r.zone!=='mz' || r.p!==ctx.player || !me) return;
    const uid = ensureCardUid(gameState, r.card);
    API.setCardFlag(me, 'u340CloverUid', uid, 'ワンダー・クローバー', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.setCardFlag(me2, 'u340CloverTurn', gameState.turn, 'ワンダー・クローバー', {silent:true});
    const me3 = locateCardAnyV4(ctx.card); if(me3) API.lingerS03(ctx.player, me3, 'ワンダー・クローバー');
  },
  afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['linger'], apply(){ return null; },
    grantsAttackLimit(card, self){ return (self && Number(self.u340CloverTurn)===Number(gameState.turn) && card.uid===self.u340CloverUid) ? 2 : null; },
    cannotAttack(card, self){ return !!self && Number(self.u340CloverTurn)===Number(gameState.turn) && card.uid!==self.u340CloverUid; } }
});
