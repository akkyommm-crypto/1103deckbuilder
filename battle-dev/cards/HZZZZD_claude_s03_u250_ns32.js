/* S03-U250: NOT_STARTED cards (2011 texts) — 凶暴化の仮面, マシュマロンのメガネ, ライトロード・レイピア, ジュラック・デイノ.
   Reuses: equipActivateS03 / equippedS03 (S03-U233, cards/HZZZO), the maintenance-cost choice of 召喚の呪詛 (option choice + registered handler),
   continuous.cannotBeAttackTarget (engine/1ZU), API.equipFromGrave (System v31) with equipSpec, the engine battle-kill record
   (card.battleKillTurnS03, S03-U251), eventIsSelfS03 (engine/1ZP), API.setCardFlag (journaled).
   「ライトロード」 / 「ジュラック」: the overlay has no named-predicate group for either; SETCODE.LIGHTSWORN / SETCODE.JURRAC were checked against carddata:
   among monsters they cover exactly the 「ライトロード」 / 「ジュラック」-named cards (the 4 extra LIGHTSWORN setcode cards are Spells / Traps and never a
   monster here), so isSetCardV4 is exact for the monster predicates used below.
   Not in this unit: ナチュル・スパイダーファング (no per-turn record of the opponent's Spell / Trap / monster-effect activations — only the single
   gameState.lastActivationV12) and ハーピィ・レディ三姉妹 (its 2011 text says 「…の効果で特殊召喚できる」 without 「のみ」, which engine/1ZK summonOnlyByS03 /
   properSummonSourcesS03 do not parse). */

/* ---- 凶暴化の仮面 (Equip Spell): 装備モンスターの攻撃力は1000ポイントアップし、守備力は1000ポイントダウンする。このカードのコントローラーは自分のスタンバイフェイズ毎に
   1000ライフポイントを払う。または、1000ライフポイント払わずにこのカードを破壊する。
   (forced at the controller's Standby Phase; the controller chooses pay / destroy at resolution; paying needs more than 1000 LP — paying all of one's LP
   is never chosen — same as the other maintenance costs) ---- */
registerChoiceHandlerV49('s03u250.mask-upkeep', (answer, args)=>{
  if(!answer || answer.cancelled || !args) return;
  const key = (answer.keys && answer.keys[0]) || 'destroy';
  const h = args.uid != null ? findCardByUid(args.uid) : null;
  if(key==='pay'){ if(gameState.players[args.player].lp > 1000) API.payCost(args.player, 1000); return; }
  if(h && h.zone==='sz') API.destroy(h, '凶暴化の仮面', args.player);
});
function maskUpkeepReadyS03(ctx){
  return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && gameState.phase==='standby' && gameState.activePlayer===ctx.player;
}
defineUnifiedCardV4('凶暴化の仮面', [equipActivateS03('凶暴化の仮面'), {
  key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return maskUpkeepReadyS03(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return;
    if(gameState.players[ctx.player].lp <= 1000){ API.destroy(me, '凶暴化の仮面', ctx.player); return; }
    API.requestChoice({player:ctx.player, kind:'option', cancelable:false, min:1, max:1, title:'凶暴化の仮面：維持コスト',
      candidates:[{key:'pay', value:'pay', label:'1000ライフポイントを払う'}, {key:'destroy', value:'destroy', label:'払わずにこのカードを破壊する'}],
      resume:{handler:'s03u250.mask-upkeep', args:{player:ctx.player, uid:ensureCardUid(gameState, me.card)}}, meta:{scriptName:'凶暴化の仮面'}});
  },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true,
    passive:{onStandbyPhase(ctx){ return maskUpkeepReadyS03(ctx); }},
    continuous:{scope:'allMonsters', from:['sz'], apply(card, self){ return equippedS03(card, self) ? {atk:1000, def:-1000} : null; }}});

/* ---- マシュマロンのメガネ (Continuous Spell): 自分のモンスターカードゾーン上に「マシュマロン」が存在する限り、相手は「マシュマロン」以外を攻撃対象に選択できない。
   (a face-down monster has no name: only a face-up 「マシュマロン」 counts as existing, and it is the only monster that may be chosen; direct attacks are not affected) ---- */
const MARSHMALLON_CODE_S03 = 31305911;
function marshmallonS03(c){ return !!c && c.face==='up' && canonicalCardCodeV4(c)===MARSHMALLON_CODE_S03; }
defineScript('マシュマロンのメガネ', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(){ return true; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['sz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=>{
      if(!self || self.face!=='up') return false;
      const loc = locateCard(target); if(!loc || loc.zone!=='mz') return false;
      if(!(gameState.players[loc.p].mz||[]).some(c=>marshmallonS03(c))) return false;
      return !marshmallonS03(target);
    } }
});

/* ---- ライトロード・レイピア (Equip Spell): 「ライトロード」と名のついたモンスターにのみ装備可能。装備モンスターの攻撃力は700ポイントアップする。
   このカードがデッキから墓地に送られた時、このカードを自分フィールド上に存在する「ライトロード」と名のついたモンスター1体に装備する事ができる。
   (optional trigger from the GY; the host is chosen at resolution, not targeted; graveInfo.from==='deck' marks the Deck → GY move) ---- */
function lightswornDbS03(db){ return !!db && db.k==='m' && isSetCardV4(db, SETCODE.LIGHTSWORN); }
function rapierHostsS03(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && lightswornDbS03(x.db)}); }
function rapierOwnHostsS03(p, eq){ return API.fieldCards({zone:'mz', player:p, filter:x=>x.card.face==='up' && lightswornDbS03(x.db) && graveEquipLegalV31(gameState, p, eq, x)}); }
registerChoiceHandlerV49('s03u250.rapier-equip', (answer, args)=>{
  if(!answer || answer.cancelled || !args) return;
  const pick = (answer.cards||[]).filter(y=>y && !y.stale && y.uid!=null)[0];
  const host = pick ? findCardByUid(pick.uid) : null, eq = args.uid!=null ? findCardByUid(args.uid) : null;
  if(!host || !eq || eq.zone!=='grave' || host.zone!=='mz' || host.p!==args.player || !lightswornDbS03(dbOf(host.card))) return;
  API.equipFromGrave(args.player, eq, host, 'ライトロード・レイピア', args.uid, null);
});
function rapierSentFromDeckS03(ctx){
  const g = ctx.card && ctx.card.graveInfo;
  if(ctx.zone!=='grave' || !ctx.eventName || ctx.eventName!=='onSendToGrave' || !g || g.from!=='deck' || Number(g.turn)!==Number(gameState.turn)) return false;
  if(!eventIsSelfS03(ctx) || (ctx.event && ctx.event.uid==null && !ctx.event.card)) return false;
  const me = locateCardAnyV4(ctx.card);
  return !!me && me.zone==='grave' && rapierOwnHostsS03(ctx.player, me).length>0;
}
defineUnifiedCardV4('ライトロード・レイピア', [{
  key:'equip', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['activate'],
  condition(){ return rapierHostsS03().length>0; },
  target(ctx, done){ API.selectCard('ライトロード・レイピア：装備する「ライトロード」', rapierHostsS03(), t=>done([t])); },
  operation(ctx){
    const s = locateCardAnyV4(ctx.card), t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
    if(s && t && t.zone==='mz' && t.card.face==='up' && lightswornDbS03(dbOf(t.card))) API.equipSpell(s, t, 'ライトロード・レイピア');
  },
  afterResolve(){}
}, {
  key:'equip-from-deck', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
  condition(ctx){ if(!rapierSentFromDeckS03(ctx)){ ctx.reason = 'デッキから墓地へ送られた時、自分の「ライトロード」がいる場合に発動できます'; return false; } return true; },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='grave') return;
    const pool = rapierOwnHostsS03(ctx.player, me); if(!pool.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'ライトロード・レイピア：装備する「ライトロード」', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u250.rapier-equip', args:{player:ctx.player, uid:ensureCardUid(gameState, me.card)}}, meta:{scriptName:'ライトロード・レイピア'}});
  },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, activateFrom:['hand','sz','grave'],
    equipSpec:{canEquip(h){ return lightswornDbS03(h.db || dbOf(h.card)); }, label:'「ライトロード」のみ'},
    passive:{onSendToGrave(ctx){ return rapierSentFromDeckS03(ctx); }},
    continuous:{scope:'allMonsters', from:['sz'], apply(card, self){ return equippedS03(card, self) ? {atk:700} : null; }}});

/* ---- ジュラック・デイノ: このカードが戦闘によって相手モンスターを破壊したターンのエンドフェイズ時に1度だけ、自分フィールド上の「ジュラック」と名のついたモンスター1体を
   リリースして発動できる。デッキからカードを2枚ドローする。
   (S03-U251: the battle kill is the engine record card.battleKillTurnS03 — set by BATTLE_CLEANUP, zone-local — instead of the earlier forced Damage Step
   mark (an extra chain link). That turn's End Phase — either player's turn — release 1 face-up 「ジュラック」 (may be itself) as the cost, once; draw 2) ---- */
function deinoJurracsS03(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && isSetCardV4(x.db, SETCODE.JURRAC)}); }
function deinoEndReadyS03(ctx){
  return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && gameState.phase==='end' && Number(ctx.card.battleKillTurnS03)===Number(gameState.turn);
}
defineUnifiedCardV4('ジュラック・デイノ', [{
  key:'end-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'],
  condition(ctx){
    if(!deinoEndReadyS03(ctx)){ ctx.reason = 'このカードが戦闘で相手モンスターを破壊したターンのエンドフェイズに発動できます'; return false; }
    if(!deinoJurracsS03(ctx.player).length){ ctx.reason = '自分フィールドに表側表示の「ジュラック」がいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('ジュラック・デイノ：リリースする「ジュラック」', deinoJurracsS03(ctx.player), t=>{
      const uid = ensureCardUid(gameState, t.card), h = findCardByUid(uid);
      if(!h || h.zone!=='mz'){ done(false); return; }
      API.sendToGrave(h, 'ジュラック・デイノ（リリース）'); done(true);
    });
  },
  operation(ctx){ API.draw(ctx.player, 2, 'ジュラック・デイノ'); },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['end-draw']},
    passive:{ onEndPhase(ctx){ return deinoEndReadyS03(ctx) && deinoJurracsS03(ctx.player).length>0; } }});
