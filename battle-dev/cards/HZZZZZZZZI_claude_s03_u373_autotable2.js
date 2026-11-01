/* S03-U373: five more PARTIAL auto-table entries replaced by exact scripts (carddata texts).

   ヴァイロン・マテリアル  「ヴァイロン」と名のついたモンスターにのみ装備可能。装備モンスターの攻撃力は600ポイントアップする。フィールド上に表側表示で存在するこのカードが墓地へ送られた場合、デッキから「ヴァイロン」と名のついた魔法カード1枚を手札に加える事ができる。
   極星宝ドラウプニル      「極神」または「極星」と名のついたモンスターにのみ装備可能。装備モンスターの攻撃力は800ポイントアップする。フィールド上に表側表示で存在するこのカードがカードの効果によって破壊された場合、自分のデッキから「極星宝」と名のついたカード1枚を手札に加える事ができる。
   スクラップ・シャーク    効果モンスターの効果・魔法・罠カードが発動した時、フィールド上に表側表示で存在するこのカードを破壊する。このカードが「スクラップ」と名のついたカードの効果によって破壊され墓地へ送られた場合、自分のデッキから「スクラップ」と名のついたモンスター1体を墓地へ送る事ができる。
   見習い魔術師            ①:召喚・反転召喚・特殊召喚に成功した場合、フィールドの魔力カウンターを置く事ができるカード1枚を対象として発動する。そのカードに魔力カウンターを1つ置く。②:戦闘で破壊された時に発動できる。デッキからレベル2以下の魔法使い族モンスター1体を裏側守備表示で特殊召喚する。
   機皇城                  ①:自分フィールドの「機皇帝」モンスターはSモンスターの効果の対象にならない。②:フィールドのこのカードが破壊され墓地へ送られた時に発動できる。デッキから「機皇帝」モンスター1体を手札に加える。

   Notes
   - ヴァイロン・マテリアル: the same equip pattern as ヴァイロン・コンポーネント (S03-U312, u312Define + u312VylonSearchEffect).
   - 極星宝ドラウプニル / 機皇城: the search (極星宝 cards are Traps except ドラウプニル itself: nameHas, any card kind) is the shared Deck trigger (engine/1ZT: deckTriggerHappenedS03 'fieldToGrave', faceUp) plus a destruction filter on graveInfo:
     ドラウプニル only a destruction BY A CARD EFFECT (graveInfo.byDestroy, not battle, not the equip rule that sends an Equip Spell to the GY with its host);
     機皇城 any destruction of the face-up Field Spell.
   - 機皇城 ①: continuous.immuneToTarget on my 「機皇帝」 monsters, only while the targeting effect belongs to a Synchro Monster (the source comes from effectInfo, S03-U457; before it was the prep-only ACTIVATION_PREP_S03 lookup and a Synchro Monster on the field).
   - スクラップ・シャーク: a forced trigger on onActivateSuccess (any activation of a Spell, Trap or monster effect); it destroys itself, and that destruction by its own Scrap-named effect is the same
     graveInfo.srcUidS03 test as スクラップ・コング (S03-U208): the optional Deck-to-Graveyard mill of one 「スクラップ」 monster follows.
   - 見習い魔術師: ① the Spell Counter capable cards on the field are read with counterCapableCardsV22 (engine/1L); ② the shared Deck trigger (pos faceDownDef). */

/* ---- 共通: a search of the Deck by a Graveyard trigger with an extra condition on how the card left ---- */
function u373SearchEffect(name, spec, extra){
  DECK_TRIGGER_S03[name] = spec;
  return { key:'deck-search', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onLeaveField'],
    condition(ctx){ return deckTriggerHappenedS03(ctx, spec) && extra(ctx); },
    operation(ctx){
      const pool = deckTriggerPoolS03(name, spec, ctx.player);
      if(!pool.length){ API.shuffle(ctx.player); API.log(`${name}：条件を満たすカードがデッキに無い（デッキをシャッフル）`); return; }
      API.requestChoice({player:ctx.player, kind:'card', title:`${name}：手札に加えるカード`, candidates:pool, min:1, max:1, cancelable:false,
        resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name, action:'search', pos:'atk'}}, meta:{scriptName:name}});
    },
    afterResolve(){} };
}
function u373SearchMeta(spec, extra, more){
  return Object.assign({activateFrom:['hand','sz','grave'], passive:{ onLeaveField(ctx){ return deckTriggerHappenedS03(ctx, spec) && extra(ctx); } }}, more||{});
}

/* ---- ヴァイロン・マテリアル ---- */
u312Define('ヴァイロン・マテリアル', {pred:u312IsVylon, stat:{atk:600}, effects:[u312VylonSearchEffect('ヴァイロン・マテリアル')], meta:u312VylonMeta()});

/* ---- 極星宝ドラウプニル ---- */
const U373_DRAUPNIR = {when:'fieldToGrave', faceUp:true, action:'search', from:['deck'], optional:true, max:1, filter:{anyCard:true, nameHas:'極星宝'}};
function u373ByEffect(ctx){
  const g = ctx.card && ctx.card.graveInfo;
  return !!g && !!g.byDestroy && !g.battle && !g.rule && !g.selfRuleS03 && !g.equipSubstituteS03 && Number(g.turn)===Number(gameState.turn);
}
u312Define('極星宝ドラウプニル', {pred:x=>{ const d = dbOf(x.card) || {}; return d.k==='m' && (String(d.n||'').indexOf('極神')>=0 || String(d.n||'').indexOf('極星')>=0); }, stat:{atk:800},
  effects:[u373SearchEffect('極星宝ドラウプニル', U373_DRAUPNIR, u373ByEffect)], meta:u373SearchMeta(U373_DRAUPNIR, u373ByEffect)});

/* ---- スクラップ・シャーク ---- */
function u373SharkTrigger(ctx){
  const e = ctx.event;
  if(ctx.zone!=='mz' || ctx.card.face!=='up' || !e || !e.kind) return false;
  if(e.uid!=null && e.uid===ctx.card.uid) return false;
  return e.kind==='spell' || e.kind==='trap' || e.kind==='monster';
}
function u373SharkMill(ctx){
  const g = ctx.card && ctx.card.graveInfo;
  if(!(ctx.zone==='grave' && g && g.byDestroy && !g.battle && g.from==='mz' && Number(g.turn)===Number(gameState.turn) && g.srcUidS03!=null)) return false;
  const s = findCardByUid(g.srcUidS03);
  return !!(s && String(dbOf(s.card).n||'').indexOf('スクラップ')>=0);
}
function u373SharkPool(p){ return API.pileCards(p, 'deck', x=>x.db.k==='m' && String(x.db.n||'').indexOf('スクラップ')>=0); }
defineUnifiedCardV4('スクラップ・シャーク', [{
  key:'self-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onActivateSuccess'], forced:true,
  condition(ctx){ return u373SharkTrigger(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up') API.destroy(me, 'スクラップ・シャーク'); },
  afterResolve(){}
}, {
  key:'mill', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'],
  condition(ctx){ return eventIsSelfS03(ctx) && u373SharkMill(ctx) && u373SharkPool(ctx.player).length>0 && !u342Bad(); },
  operation(ctx){
    const pool = u373SharkPool(ctx.player); if(!pool.length) return;
    API.selectCard('スクラップ・シャーク：墓地へ送る「スクラップ」モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(r && r.zone==='deck' && r.p===ctx.player) API.sendToGrave(r, 'スクラップ・シャーク');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['mz','grave'],
  passive:{ onActivateSuccess(ctx){ return u373SharkTrigger(ctx); },
            onSendToGrave(ctx){ return eventIsSelfS03(ctx) && u373SharkMill(ctx) && u373SharkPool(ctx.player).length>0; },
            onDestroy(ctx){ return eventIsSelfS03(ctx) && u373SharkMill(ctx) && u373SharkPool(ctx.player).length>0; } } });

/* ---- 見習い魔術師 ---- */
function u373ApprenticeCounterable(){ return counterCapableCardsV22(gameState, null, '魔力', true).filter(x=>x.zone==='mz' || x.zone==='sz' || x.zone==='field'); }
function u373ApprenticeSummoned(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && eventIsSelfS03(ctx) && u373ApprenticeCounterable().length>0; }
const U373_APPRENTICE = {when:'battleToGrave', action:'summon', optional:true, pos:'faceDownDef', filter:{lvmax:2, ra:'魔法使い'}};
(function(){
  const dt = deckTriggerEffectV4S03('見習い魔術師', U373_APPRENTICE);
  const place = (key, ev)=>({
    key, type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.ONFIELD, targetSide:'both', speed:1, events:[ev], forced:true,
    condition(ctx){ return u373ApprenticeSummoned(ctx); },
    target(ctx, done){ API.selectCard('見習い魔術師：魔力カウンターを置くカード', u373ApprenticeCounterable(), t=>done([t])); },
    operation(ctx){ const r = ctx.selectedTargets && ctx.selectedTargets[0] && resolveTarget(ctx.selectedTargets[0]); if(r && ['mz','sz','field'].indexOf(r.zone)>=0 && r.card.face==='up') API.addCounter(r, '魔力', 1); },
    afterResolve(){}
  });
  defineUnifiedCardV4('見習い魔術師', [place('counter-normal','onNormalSummon'), place('counter-flip','onFlip'), place('counter-special','onSpecialSummon'), dt.effect],
    {type:'monster', priority:1, targets:true, activateFrom:['mz','grave'],
      passive:{ onNormalSummon(ctx){ return u373ApprenticeSummoned(ctx); }, onFlip(ctx){ return u373ApprenticeSummoned(ctx); }, onSpecialSummon(ctx){ return u373ApprenticeSummoned(ctx); },
               onBattleDestroy(ctx){ return dt.passive(ctx); } } });
})();

/* ---- 機皇城 ---- */
const U373_CASTLE = {when:'fieldToGrave', faceUp:true, action:'search', from:['deck'], optional:true, max:1, filter:{nameHas:'機皇帝'}};
function u373CastleDestroyed(ctx){ const g = ctx.card && ctx.card.graveInfo; return !!g && !!g.byDestroy && Number(g.turn)===Number(gameState.turn); }
/* S03-U457: 対象を選んでいる効果の出所は filterTargetable が渡す effectInfo を最優先で使う（解決時の選択でも出所が残る）。
   「Sモンスターの効果」は出所がシンクロモンスターかどうかだけで決まる（効果の発動場所は問わない）。 */
function u373SynchroSource(effectInfo){
  const src = u378SrcOf(effectInfo);
  return !!src && targetEffectMatchesS03(src, {synchro:true});
}
defineUnifiedCardV4('機皇城', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.FIELD, speed:1, events:['activate'], operation(){}, afterResolve(){}
}, u373SearchEffect('機皇城', U373_CASTLE, u373CastleDestroyed)], u373SearchMeta(U373_CASTLE, u373CastleDestroyed, {type:'spell', priority:1,
  continuous:{ scope:'ownMonsters', from:['field'], apply(){ return null; },
    immuneToTarget(card, self, effectInfo){
      if(!self || self.face!=='up' || !card || card.face!=='up' || String(dbOf(card).n||'').indexOf('機皇帝')!==0 || dbOf(card).k!=='m') return false;
      return u373SynchroSource(effectInfo);
    } } }));
