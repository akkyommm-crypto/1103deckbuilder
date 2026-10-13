/* S03-U341: two Equip Spells, two Traps, a Continuous Trap and a Quick-Play Spell (carddata texts).

   憎悪の棘       装備（「ブラック・ローズ・ドラゴン」または植物族のみ）。ATK+600。守備表示モンスターを攻撃した時、守備力を攻撃力が超えていればその数値だけ戦闘ダメージ。モンスターを攻撃した場合ダメージ計算後に攻撃対象の攻撃力・守備力は600ダウン。装備モンスターと戦闘を行った相手モンスターは、その戦闘では破壊されない。
   竜殺しの剣     装備（戦士族のみ）。ATK+700。装備モンスターがドラゴン族モンスターと戦闘を行ったダメージ計算後、そのモンスターはそのバトルフェイズ終了時に破壊される。
   閃光のイリュージョン（永続罠）自分の墓地の「ライトロード」1体を表側攻撃表示で特殊召喚。このカードが離れた時そのモンスターを破壊、そのモンスターが離れた時このカードを破壊。自分のエンドフェイズ毎にデッキの上から2枚を墓地へ送る。
   早すぎた復活     （罠）自分の墓地の「地縛神」1体を特殊召喚。そのターン攻撃宣言できず、このモンスターが戦闘を行う場合、相手が受ける戦闘ダメージは0。
   能力吸収コア     （カウンター罠）自分フィールドに「コアキメイル」が表側表示で存在し自分の墓地に「コアキメイルの鋼核」が存在する場合、効果モンスターの効果の発動を無効にし破壊する。
   魔導書整理       （速攻魔法）自分のデッキの上から3枚をめくり好きな順番でデッキの上に戻す。相手は確認できない。

   Notes
   - The Equip Spells use the equip pattern of S03-U312 (u312Define / equippedS03 / equipHostS03). 憎悪の棘: continuous.piercingDamage + protectV21 (battle) for the battle opponent of the host + a forced Damage Step trigger (dsTiming 'end') for the −600/−600 on the attacked monster. 竜殺しの剣: the Damage Step trigger schedules the destruction at the end of the Battle Phase (engine/16 'battlePhaseEnd').
   - 閃光のイリュージョン: the revival-and-link pattern of リビングデッドの呼び声 (API.linkOnLeave both ways, 'destroy'). 早すぎた復活: the used card lingers (long) as the source of cannotAttack (that turn) and battleDamage (the revived monster's opponent takes none, for as long as it stays on the field).
   - 能力吸収コア reads the chain top link (a monster's effect of the opponent); 魔導書整理 reorders the top three cards with API.orderToDeck (first chosen = top). */

function u341Other(self){
  const host = equipHostS03(self), b = gameState.battle;
  if(!host || !b || b.target==='direct') return null;
  const o = b.atkUid===host.card.uid ? b.targetUid : (b.targetUid===host.card.uid ? b.atkUid : null);
  const f = o!=null ? findCardByUid(o) : null;
  return (f && f.zone==='mz') ? f : null;
}
function u341HostAttacked(ctx){
  const host = ctx.zone==='sz' ? equipHostS03(ctx.card) : null, b = gameState.battle;
  if(!host || !b || b.target==='direct' || b.battled!==true || b.atkUid!==host.card.uid) return null;
  const f = b.targetUid!=null ? findCardByUid(b.targetUid) : null;
  return (f && f.zone==='mz') ? f : null;
}

/* ---- 憎悪の棘 ---- */
u312Define('憎悪の棘', {pred:x=>x.db.n==='ブラック・ローズ・ドラゴン' || x.db.ra==='植物', stat:{atk:600},
  effects:[{ key:'shrink', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return !!u341HostAttacked(ctx); },
    operation(ctx){ const f = u341HostAttacked(ctx); if(f) API.modAtk(f, -600, -600, 'permanent', '憎悪の棘'); },
    afterResolve(){} }],
  meta:{dsTiming:'end', timing:['free'], passive:{ onDamageStep(ctx){ return !!u341HostAttacked(ctx); } }},
  continuous:{
    piercingDamage(info){
      const self = info.self;
      if(!equippedS03(info.atkCard, self) || !info.defCard || info.defCard.pos!=='def') return 0;
      return Math.max(0, curATK(info.atkCard) - curDEF(info.defCard));
    },
    protectV21:{ key:'憎悪の棘', label:'憎悪の棘', scope:'allMonsters', effect:false,
      battle:(target, self)=>{ const f = u341Other(self); return !!f && !!target && f.card.uid===target.uid; } } }});

/* ---- 竜殺しの剣 ---- */
API.registerScheduleHandler('u341.dragonslayer', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(h && h.zone==='mz') API.destroy(h, '竜殺しの剣');
});
function u341Dragon(ctx){
  const host = ctx.zone==='sz' ? equipHostS03(ctx.card) : null, b = gameState.battle;
  if(!host || !b || b.target==='direct' || b.battled!==true) return null;
  const o = b.atkUid===host.card.uid ? b.targetUid : (b.targetUid===host.card.uid ? b.atkUid : null);
  const f = o!=null ? findCardByUid(o) : null;
  return (f && f.zone==='mz' && f.card.face==='up' && dbOf(f.card).ra==='ドラゴン') ? f : null;
}
u312Define('竜殺しの剣', {pred:x=>x.db.ra==='戦士', stat:{atk:700},
  effects:[{ key:'destroy-dragon', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return !!u341Dragon(ctx); },
    operation(ctx){ const f = u341Dragon(ctx); if(f) API.schedule({at:'battlePhaseEnd', turns:0, player:ctx.player, handler:'u341.dragonslayer', args:{uid:f.card.uid}, note:'竜殺しの剣'}); },
    afterResolve(){} }],
  meta:{dsTiming:'end', timing:['free'], passive:{ onDamageStep(ctx){ return !!u341Dragon(ctx); } }}});

/* ---- 閃光のイリュージョン ---- */
function u341LordGrave(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('ライトロード')>=0); }
function u341IllusionLinked(ctx){
  const e = ctx.event||{};
  return ctx.zone==='sz' && ctx.card && ctx.card.face==='up' && e.uid!=null && s03CothWatchesU89(ctx.card, e.uid);
}
defineUnifiedCardV4('閃光のイリュージョン', [{
  key:'revive', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:2, events:['activate'],
  condition(ctx){
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!u341LordGrave(ctx.player).length){ ctx.reason = '自分の墓地に「ライトロード」モンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('閃光のイリュージョン：蘇生する「ライトロード」', u341LordGrave(ctx.player), t=>done([t])); },
  operation(ctx){
    const picked = ctx.selectedTargets && ctx.selectedTargets[0], r = picked && resolveTarget(picked);
    if(!r || r.zone!=='grave' || !hasMonsterZoneSpace(ctx.player)) return;
    const targetCard = r.card; ensureCardUid(gameState, targetCard);
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', '閃光のイリュージョン');
    const self = locateCardAnyV4(ctx.card), revived = locateCardAnyV4(targetCard);
    if(!self || self.zone!=='sz' || !revived || revived.zone!=='mz') return;
    API.linkOnLeave(revived, self, 'destroy', '閃光のイリュージョン');
    API.linkOnLeave(self, revived, 'destroy', '閃光のイリュージョン');
  },
  afterResolve(){}
}, {
  key:'end-mill', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && API.me(ctx).deck.length>0; },
  operation(ctx){ API.millTop(ctx.player, 2, '閃光のイリュージョン'); },
  afterResolve(){}
}], {type:'trap', priority:2, targets:true, includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  passive:{ onEndPhase(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && API.me(ctx).deck.length>0; } },
  continuous:{scope:'self', from:['sz'], apply(){ return null; }}});

/* ---- 早すぎた復活 ---- */
function u341Keeper(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('地縛神')>=0); }
defineScript('早すぎた復活', {
  type:'trap', priority:2, targets:true, includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  condition(ctx){
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!u341Keeper(ctx.player).length){ ctx.reason = '自分の墓地に「地縛神」モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('早すぎた復活：特殊召喚する「地縛神」', u341Keeper(ctx.player), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    const card = r.card; ensureCardUid(gameState, card);
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', '早すぎた復活');
    const h = locateCardAnyV4(card); if(!h || h.zone!=='mz') return;
    API.setCardFlag(h, 'u341ReviveTurn', gameState.turn, '早すぎた復活', {silent:true});
    const h2 = locateCardAnyV4(card); if(h2) API.setCardFlag(h2, 'u341Revived', true, '早すぎた復活', {silent:true});
    const me = locateCardAnyV4(ctx.card); if(me) API.lingerS03(ctx.player, me, '早すぎた復活', gameState.turn + 500);
  },
  afterResolve(){},
  continuous:{ scope:'allMonsters', from:['linger'], apply(){ return null; },
    cannotAttack(card){ return !!card && card.u341Revived===true && Number(card.u341ReviveTurn)===Number(gameState.turn); },
    battleDamage(info){
      const a = info && info.atkCard, d = info && info.defCard;
      const f = (a && a.u341Revived===true) ? a : ((d && d.u341Revived===true) ? d : null);
      if(!f) return info.amount;
      const h = findCardByUid(f.uid); if(!h || h.zone!=='mz') return info.amount;
      return info.to!==h.p ? 0 : info.amount;
    } }
});

/* ---- 能力吸収コア ---- */
function u341Core(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && String(x.db.n||'').indexOf('コアキメイル')===0}); }
function u341FoeMonsterEffect(ctx){
  const top = gameState.chain && gameState.chain[gameState.chain.length-1];
  if(!top || top.player!==ctx.opponent) return false;
  const db = CARD_DB[findCardIndex(top.name)];
  return !!db && db.k==='m' && (db.st||[]).indexOf('効果')>=0;
}
defineScript('能力吸収コア', {
  type:'counter', priority:3,
  condition(ctx){
    if(!u341Core(ctx).length){ ctx.reason = '自分フィールドに「コアキメイル」モンスターがいません'; return false; }
    if(!API.pileCards(ctx.player, 'grave', x=>x.db.n==='コアキメイルの鋼核').length){ ctx.reason = '自分の墓地に「コアキメイルの鋼核」がありません'; return false; }
    if(!u341FoeMonsterEffect(ctx)){ ctx.reason = '相手が効果モンスターの効果を発動した時に発動します'; return false; }
    return true;
  },
  resolve(){ negatePreviousChainLinkV2('能力吸収コア', true); },
  afterResolve(){}
});

/* ---- 魔導書整理 ---- */
defineScript('魔導書整理', {
  type:'spell', priority:2, quickEffect:true,
  condition(ctx){ if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; } return true; },
  resolve(ctx){
    const tops = API.deckTop(ctx.player, 3); if(!tops.length) return;
    const order = [];
    const step = ()=>{
      const rest = tops.filter(h=>order.indexOf(h.card.uid)<0);
      if(rest.length<=1){ if(rest.length) order.push(rest[0].card.uid); finish(); return; }
      API.selectCard('魔導書整理：デッキの上に戻す順番（'+(order.length+1)+'枚目）', rest, t=>{
        const r = t && resolveTarget(t); const u = r ? r.card.uid : rest[0].card.uid;
        order.push(u); step();
      });
    };
    const finish = ()=>{ API.orderToDeck(ctx.player, order, false, '魔導書整理'); };
    tops.forEach(h=>ensureCardUid(gameState, h.card));
    step();
  },
  afterResolve(){}
});
