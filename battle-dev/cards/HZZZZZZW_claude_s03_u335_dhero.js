/* S03-U335: five 「D－HERO」 monsters (carddata texts; 「D－HERO」 = a monster whose name starts with D－HERO).

   D－HERO ダイハードガイ  このカードが自分フィールド上に表側表示で存在する時、このカードを除く自分フィールド上の「D－HERO」と名のついたモンスターが戦闘によって破壊され墓地へ送られた場合、そのモンスター1体を次の自分のスタンバイフェイズ時に
                         自分フィールド上に特殊召喚する事ができる。この効果は1ターンに1度しか使用できない。
   D－HERO ダガーガイ      相手のバトルフェイズ時、手札からこのカードを捨てて発動できる。自分フィールド上の全ての「D－HERO」と名のついたモンスターの攻撃力は、エンドフェイズ時まで800ポイントアップする。
   D－HERO ダッシュガイ    1ターンに1度、自分フィールド上のモンスター1体をリリースして発動できる。このカードの攻撃力はエンドフェイズ時まで1000ポイントアップする。このカードは攻撃した場合、バトルフェイズ終了時に守備表示になる。また、このカードが墓地に
                         存在する限り1度だけ、自分のドローフェイズ時にカードをドローした時、そのカードがモンスターだった場合、その1体をお互いに確認して自分フィールド上に特殊召喚できる。
   D－HERO ドゥームガイ    このカードが戦闘によって破壊され墓地へ送られた場合、次の自分のスタンバイフェイズ時に発動する。自分の墓地から「D－HERO ドゥームガイ」以外の「D－HERO」と名のついたモンスター1体を選択して特殊召喚する。
   D－HERO ドグマガイ      このカードは通常召喚できない。「D－HERO」モンスターを含む自分フィールドのモンスター3体をリリースした場合のみ特殊召喚できる。①:この方法でこのカードが特殊召喚に成功した場合、次の相手スタンバイフェイズに発動する。相手のLPを半分にする。

   Notes
   - Schedules (engine/16): the revive of ダイハードガイ / ドゥームガイ happens at the next Standby Phase of the controller (a schedule keyed by uid); ドグマガイ' halving at the next Standby Phase of the opponent. ダイハードガイ reads the monsters of onFieldToGraveBatchS03 (battle, this controller).
   - ダッシュガイ: the release is the cost; the Draw Phase effect is an optional trigger from the Graveyard on the normal draw (onDrawCard, S03-U321 drain) and is used once per stay in the Graveyard (zone-local flag).
   - ダガーガイ: a Quick Effect from the hand during the opponent's Battle Phase; ドグマガイ: hand procedure whose cost releases three monsters of mine including a 「D－HERO」, the trigger only for that method (specialSummonKind 'procedure').
   - Left: Bloo－D, ドレッドガイ (needs 幽獄の時計塔), ディパーテッドガイ / ディスクガイ (recorded gaps), ダイヤモンドガイ (activating the Spell from the Graveyard in a later Main Phase). */

function u335Dh(db){ return !!db && db.k==='m' && String(db.n||'').indexOf('D－HERO')===0; }
function u335Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function u335Main(ctx){ return ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
function u335TurnsToOwn(p){ return gameState.activePlayer===p ? 2 : 1; }   /* the next Standby Phase of p (the schedule counts turns: 0 this turn, 1 the next turn, 2 the turn after) */
function u335GraveDh(p, exceptName){ return API.pileCards(p, 'grave', x=>u335Dh(x.db) && x.db.n!==exceptName); }

/* ---- ダイハードガイ ---- */
API.registerScheduleHandler('u335.diehard-revive', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(h && h.zone==='grave' && h.p===args.player && hasMonsterZoneSpace(args.player) && Number(h.card.graveInfo && h.card.graveInfo.turn)===Number(args.turn))
    API.specialSummon(args.player, 'grave', h.index, 'atk', 'D－HERO ダイハードガイ');
});
function u335DiehardItems(ctx){
  const e = ctx.event || {};
  if(ctx.eventName!=='onFieldToGraveBatchS03' || !Array.isArray(e.items) || !u335Up(ctx) || Number(ctx.card.u335DiehardTurn)===Number(gameState.turn)) return [];
  return e.items.filter(x=>{
    if(!x || !x.battle || x.ctrl!==ctx.player || x.uid===ctx.card.uid) return false;
    const h = findCardByUid(x.uid); return !!h && h.zone==='grave' && u335Dh(dbOf(h.card));
  });
}
defineUnifiedCardV4('D－HERO ダイハードガイ', [{
  key:'revive-next-standby', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFieldToGraveBatchS03'],
  condition(ctx){ return u335DiehardItems(ctx).length>0; },
  operation(ctx){
    const items = u335DiehardItems(ctx); if(!items.length) return;
    const go = it=>{
      const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
      API.setCardFlag(me, 'u335DiehardTurn', gameState.turn, 'D－HERO ダイハードガイ', {silent:true});
      API.schedule({at:'standbyPhase', turns:u335TurnsToOwn(ctx.player), player:ctx.player, handler:'u335.diehard-revive', args:{uid:it.uid, player:ctx.player, turn:gameState.turn}, note:'D－HERO ダイハードガイ'});
    };
    if(items.length===1){ go(items[0]); return; }
    API.selectCard('D－HERO ダイハードガイ：次のスタンバイフェイズに特殊召喚する「D－HERO」', items.map(it=>{ const h = findCardByUid(it.uid); return {card:h.card, db:dbOf(h.card), p:h.p, zone:h.zone, index:h.index}; }), t=>{ const r = t && resolveTarget(t); const it = r && items.find(x=>x.uid===r.card.uid); if(it) go(it); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], passive:{ onFieldToGraveBatchS03(ctx){ return u335DiehardItems(ctx).length>0; } }});

/* ---- ダガーガイ ---- */
defineUnifiedCardV4('D－HERO ダガーガイ', [{
  key:'boost-all', type:EFFECT_TYPE.QUICK, range:LOCATION.HAND, speed:2, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = '手札から発動します'; return false; }
    if(gameState.phase!=='battle' || ctx.player===gameState.activePlayer){ ctx.reason = '相手のバトルフェイズ時に発動できます'; return false; }
    return true;
  },
  cost(ctx, done){ const i = (API.me(ctx).hand||[]).indexOf(ctx.card); if(i<0){ done(false); return; } API.discard(ctx.player, i, 'D－HERO ダガーガイ（コスト）'); done(true); },
  operation(ctx){
    API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && u335Dh(x.db)}).forEach(h=>API.modAtk(h, 800, 0, 'endTurn', 'D－HERO ダガーガイ'));
  },
  afterResolve(){}
}], {type:'monster', priority:2, quickEffect:true, activateFrom:['hand'], timing:['free','chain']});

/* ---- ダッシュガイ ---- */
function u335Attacked(ctx){ return u335Up(ctx) && typeof attackCountV48==='function' && attackCountV48(ctx.card)>0; }
function u335DrawnMonster(ctx){
  const e = ctx.event || {};
  if(ctx.zone!=='grave' || !e.normalDraw || e.player!==ctx.player || e.uid==null || ctx.card.u335DashUsed===true) return null;
  const h = findCardByUid(e.uid);
  return (h && h.zone==='hand' && h.p===ctx.player && dbOf(h.card).k==='m') ? h : null;
}
defineUnifiedCardV4('D－HERO ダッシュガイ', [{
  key:'release-boost', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u335Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!API.fieldCards({player:ctx.player, zone:'mz'}).length){ ctx.reason = 'リリースするモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('D－HERO ダッシュガイ：リリースする自分のモンスター', API.fieldCards({player:ctx.player, zone:'mz'}), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, 'D－HERO ダッシュガイ（リリース）'); done(true);
    });
  },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up') API.modAtk(me, 1000, 0, 'endTurn', 'D－HERO ダッシュガイ'); },
  afterResolve(){}
}, {
  key:'bp-end-defense', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattlePhaseEnd'], forced:true,
  condition(ctx){ return u335Attacked(ctx) && ctx.card.pos==='atk'; },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up' && me.card.pos==='atk') API.changePosition(me, 'def', 'D－HERO ダッシュガイ'); },
  afterResolve(){}
}, {
  key:'grave-draw-summon', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onDrawCard'],
  condition(ctx){ return !!u335DrawnMonster(ctx) && hasMonsterZoneSpace(ctx.player); },
  operation(ctx){
    const h = u335DrawnMonster(ctx); if(!h || !hasMonsterZoneSpace(ctx.player)) return;
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='grave') API.setCardFlag(me, 'u335DashUsed', true, 'D－HERO ダッシュガイ', {silent:true});
    API.reveal({cards:[{card:h.card, db:dbOf(h.card), p:h.p, zone:h.zone, index:h.index}], audience:'both', label:'D－HERO ダッシュガイ', until:'resolution'});
    const h2 = findCardByUid(h.card.uid);
    if(h2 && h2.zone==='hand') API.specialSummon(ctx.player, 'hand', h2.index, 'atk', 'D－HERO ダッシュガイ');
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], activateFrom:['mz','grave'], includesSpecialSummon:true, countLimit:{n:1, effects:['release-boost']},
  passive:{ onBattlePhaseEnd(ctx){ return u335Attacked(ctx) && ctx.card.pos==='atk'; }, onDrawCard(ctx){ return !!u335DrawnMonster(ctx) && hasMonsterZoneSpace(ctx.player); } }});

/* ---- ドゥームガイ ---- */
API.registerScheduleHandler('u335.doom-revive', (args)=>{
  const pool = u335GraveDh(args.player, 'D－HERO ドゥームガイ');
  if(!pool.length || !hasMonsterZoneSpace(args.player)) return;
  API.requestChoice({player:args.player, kind:'card', title:'D－HERO ドゥームガイ：特殊召喚する墓地の「D－HERO」', candidates:pool, min:1, max:1, cancelable:false,
    resume:{handler:'u335.doom-pick', args:{player:args.player}}});
});
API.registerChoiceHandler('u335.doom-pick', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0], h = picked && locateCardAnyV4(picked.card);
  if(h && h.zone==='grave' && h.p===args.player && u335Dh(dbOf(h.card)) && hasMonsterZoneSpace(args.player)) API.specialSummon(args.player, 'grave', h.index, 'atk', 'D－HERO ドゥームガイ');
});
function u335DoomBattle(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && eventIsSelfS03(ctx) && !!g && g.from==='mz' && !!g.battle && Number(g.turn)===Number(gameState.turn);
}
defineUnifiedCardV4('D－HERO ドゥームガイ', [{
  key:'battle-destroyed-revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onBattleDestroy'], forced:true,
  condition(ctx){ return u335DoomBattle(ctx); },
  operation(ctx){ API.schedule({at:'standbyPhase', turns:u335TurnsToOwn(ctx.player), player:ctx.player, handler:'u335.doom-revive', args:{player:ctx.player}, note:'D－HERO ドゥームガイ'}); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, activateFrom:['grave'], timing:['free'], passive:{ onBattleDestroy(ctx){ return u335DoomBattle(ctx); } }});

/* ---- ドグマガイ ---- */
API.registerScheduleHandler('u335.dogma-halve', (args)=>{
  const lp = gameState.players[args.target].lp;
  if(lp>1) API.damageLP(args.target, Math.floor(lp/2), 'D－HERO ドグマガイ');
});
function u335DogmaSummoned(ctx){ return u335Up(ctx) && ctx.eventName==='onSpecialSummon' && eventIsSelfS03(ctx) && ctx.card.specialSummonKind==='procedure'; }
defineUnifiedCardV4('D－HERO ドグマガイ', [{
  key:'halve-next-standby', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u335DogmaSummoned(ctx); },
  operation(ctx){ API.schedule({at:'standbyPhase', turns:u335TurnsToOwn(ctx.opponent), player:ctx.opponent, handler:'u335.dogma-halve', args:{target:ctx.opponent}, note:'D－HERO ドグマガイ'}); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotNormalSummon:true, includesSpecialSummon:true, timing:['free'], passive:{ onSpecialSummon(ctx){ return u335DogmaSummoned(ctx); } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      const mine = API.fieldCards({player:ctx.player, zone:'mz'});
      if(mine.length<3 || !mine.some(x=>x.card.face==='up' && u335Dh(x.db))){ ctx.reason = '「D－HERO」を含む自分フィールドのモンスター3体が必要です'; return false; }
      return true;
    },
    cost(ctx, done){
      const picked = [];
      const step = n=>{
        if(n>=3){
          const hasDh = picked.some(u=>{ const h = findCardByUid(u); return h && u335Dh(dbOf(h.card)); });
          if(!hasDh){ done(false); return; }
          picked.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.sendToGrave(h, 'D－HERO ドグマガイ（リリース）'); });
          done(true); return;
        }
        const pool = API.fieldCards({player:ctx.player, zone:'mz'}).filter(x=>picked.indexOf(x.card.uid)<0);
        if(!pool.length){ done(false); return; }
        API.selectCard('D－HERO ドグマガイ：リリースするモンスター（'+(n+1)+'/3、「D－HERO」を含む）', pool, t=>{
          const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
          picked.push(r.card.uid!=null ? r.card.uid : ensureCardUid(gameState, r.card)); step(n+1);
        });
      };
      step(0);
    }
  }});
