/* S03-U257: lingering effects of used cards (engine: LINGER_ADD_S03 / API.lingerS03 + continuous.from:['linger'], engine/00 + engine/40) —
   シャブティのお守り, BF－蒼天のジェット (2011 texts). Written in S03-U254 with GY-source continuous effects (クリボー pattern), which exceeded the
   System v29 GY-source budget (tools/test_grave_continuous_v29.js E3, ≤ 20 declared names); here the used card registers itself for the rest of the
   turn instead, so nothing scans the Graveyard. 「墓守の」 = SETCODE.GRAVEKEEPER, 「BF」 = SETCODE.BLACKWING (exact for monsters). */

/* ---- シャブティのお守り: 手札からこのカードを捨てる。エンドフェイズまで、自分フィールド上の「墓守の」という名のついたモンスターカードが受ける戦闘ダメージを0にする。
   (quick effect from the hand; read as: until the End Phase its controller takes no battle damage from a battle involving one of its own 「墓守の」 monsters;
    the used card is registered as a lingering source for this turn (API.lingerS03, S03-U257) — no Graveyard scan; the mark is a turn stamp on that card) ---- */
function graveKeeperDbS03(db){ return !!db && db.k === 'm' && isSetCardV4(db, SETCODE.GRAVEKEEPER); }
defineScript('シャブティのお守り', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['hand'], damageStepLegal:true,
  condition(ctx){
    if(ctx.zone !== 'hand'){ ctx.reason = '手札から発動します'; return false; }
    return true;
  },
  cost(ctx, done){
    const i = (API.me(ctx).hand || []).indexOf(ctx.card);
    if(i < 0){ done(false); return; }
    API.discard(ctx.player, i, 'シャブティのお守り（コスト）'); done(true);
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'grave') API.setCardFlag(me, 'u254ShabtiTurn', gameState.turn, 'シャブティのお守り');
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, 'シャブティのお守り');
  },
  afterResolve(){},
  continuous:{ scope:'self', from:['linger'], apply(){ return null; },
    battleDamage(info){
      const self = info && info.self;
      if(!self || Number(self.u254ShabtiTurn) !== gameState.turn) return info.amount;
      const loc = locateCardAnyV4(self);
      if(!loc || info.to !== loc.p) return info.amount;
      const mine = c => { if(!c || c.face !== 'up') return false; const h = locateCard(c); return !!h && h.p === loc.p && graveKeeperDbS03(dbOf(c)); };
      return (mine(info.atkCard) || mine(info.defCard)) ? 0 : info.amount;
    } }
});

/* ---- BF－蒼天のジェット: 戦闘ダメージ計算時、このカードを手札から墓地へ送って発動する。自分フィールド上に存在する「BF」と名のついたモンスターはその戦闘では破壊されない。
   (quick effect at the damage calculation, クリボー pattern; the used card in the GY grants battle-destruction protection to its controller's face-up 「BF」 monsters,
    only the two monsters of the marked battle, only that turn) ---- */
function bfDbS03(db){ return !!db && db.k === 'm' && isSetCardV4(db, SETCODE.BLACKWING); }
function ownBattlingBfS03(ctx){
  const b = gameState.battle;
  if(!b || b.step !== 'calc') return [];
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  const def = b.target === 'direct' ? null : (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  return [atk, def].filter(c => c && c.face === 'up' && bfDbS03(dbOf(c)) && (locateCard(c) || {}).p === ctx.player);
}
defineScript('BF－蒼天のジェット', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['hand'], dsTiming:'calc', damageStepOnly:true,
  condition(ctx){
    if(ctx.zone !== 'hand'){ ctx.reason = '手札から発動します'; return false; }
    if(!ownBattlingBfS03(ctx).length){ ctx.reason = '自分の「BF」モンスターが戦闘を行うダメージ計算時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){ a6HandCost(ctx, done, 'BF－蒼天のジェット'); },
  resolve(ctx){
    const b = gameState.battle;
    const me = locateCardAnyV4(ctx.card);
    if(!b || !me || me.zone !== 'grave') return;
    API.setCardFlag(me, 'u254JetAtkUid', b.atkUid != null ? b.atkUid : null, 'BF－蒼天のジェット', {silent:true});
    API.setCardFlag(me, 'u254JetDefUid', b.targetUid != null ? b.targetUid : null, 'BF－蒼天のジェット', {silent:true});
    API.setCardFlag(me, 'u254JetTurn', gameState.turn, 'BF－蒼天のジェット');
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, 'BF－蒼天のジェット');
  },
  afterResolve(){},
  continuous:{ scope:'self', from:['linger'], apply(){ return null; },
    protectV21:{ key:'BF－蒼天のジェット', label:'BF－蒼天のジェット', scope:'allMonsters', effect:false,
      battle:(target, self) => {
        if(!self || !target || Number(self.u254JetTurn) !== gameState.turn) return false;
        if(target.face !== 'up' || !bfDbS03(dbOf(target))) return false;
        if(target.uid == null || (target.uid !== self.u254JetAtkUid && target.uid !== self.u254JetDefUid)) return false;
        const t = locateCard(target), s = locateCardAnyV4(self);
        if(!t || !s || t.p !== s.p) return false;
        const b = gameState.battle;
        if(b && b.atkUid != null && b.atkUid !== self.u254JetAtkUid) return false;
        return true;
      } } }
});

