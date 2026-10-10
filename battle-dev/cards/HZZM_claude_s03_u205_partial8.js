/* S03-U205: PARTIAL cards whose AUTO_DECK_TABLE entries (cards/40) were coarse — now their 2011 texts (shared pool / choice helpers:
   engine/1ZT deckTriggerPoolS03, cards/HZZF poolSpecS03 / poolS03 / askPoolS03).
   XX－セイバー ガルセム, 死の花－ネクロ・フルール, アームド・ドラゴン LV3, おジャマジック, インヴェルズを呼ぶ者, スカル・ナイト. */

/* destroyed by a card effect from the field this turn (graveInfo; not by battle) */
function destroyedByEffectFromFieldS03(ctx){
  const g = ctx.card && ctx.card.graveInfo;
  return !!(g && g.byDestroy && !g.battle && ['mz','sz','field'].indexOf(g.from)>=0 && Number(g.turn)===Number(gameState.turn));
}

/* ---- XX－セイバー ガルセム: フィールド上に存在するこのカードがカードの効果によって破壊され墓地へ送られた時、自分のデッキから「X－セイバー」と名のついた
   モンスター1体を手札に加える。このカードの攻撃力は、自分フィールド上に表側表示で存在する「X－セイバー」と名のついたモンスターの数×200ポイントアップする。 ---- */
declareDeckTriggerS03('XX－セイバー ガルセム', {when:'fieldToGrave', action:'search', optional:false, filter:{nameHas:'X－セイバー'},
  extra(ctx){ return destroyedByEffectFromFieldS03(ctx) ? '' : 'カードの効果によって破壊され墓地へ送られた時に発動します'; },
  continuous:{scope:'self', from:['mz'], apply(target, self){
    const loc = locateCard(self); if(!loc) return null;
    const n = (gameState.players[loc.p].mz||[]).filter(c=>c && c.face==='up' && String(dbOf(c).n||'').indexOf('X－セイバー')>=0).length;
    return n ? {atk:n*200} : null; }}});

/* ---- 死の花－ネクロ・フルール: このカードがカードの効果によって破壊され墓地へ送られた場合、自分のデッキから「時花の魔女－フルール・ド・ソルシエール」1体を
   特殊召喚する事ができる。 ---- */
declareDeckTriggerS03('死の花－ネクロ・フルール', {when:'fieldToGrave', action:'summon', optional:true, pos:'faceUp', filter:{name:'時花の魔女－フルール・ド・ソルシエール'},
  extra(ctx){ return destroyedByEffectFromFieldS03(ctx) ? '' : 'カードの効果によって破壊され墓地へ送られた時に発動します'; }});

/* ---- アームド・ドラゴン LV3: 自分のスタンバイフェイズ時、表側表示のこのカードを墓地へ送る事で、「アームド・ドラゴン LV5」1体を手札またはデッキから特殊召喚する。
   (optional; offered at the controller's Standby Phase; cost: this face-up card to the GY) ---- */
poolSpecS03('アームド・ドラゴン LV3', {from:['hand','deck'], action:'summon', pos:'faceUp', filter:{name:'アームド・ドラゴン LV5'}});
function armedLv3ReadyS03(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.phase==='standby' && gameState.activePlayer===ctx.player; }
defineScript('アームド・ドラゴン LV3', {
  type:'monster', priority:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(!armedLv3ReadyS03(ctx)){ ctx.reason = '自分スタンバイフェイズに発動します'; return false; }
    if(!poolS03('アームド・ドラゴン LV3', ctx.player).length){ ctx.reason = '手札・デッキに「アームド・ドラゴン LV5」がいません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = findCardByUid(ctx.card.uid); if(!me || me.zone!=='mz'){ done(false); return; } API.sendToGrave(me, 'アームド・ドラゴン LV3（コスト）'); done(true); },
  resolve(ctx){ askPoolS03(ctx, 'アームド・ドラゴン LV3', 'アームド・ドラゴン LV3：特殊召喚する「アームド・ドラゴン LV5」（手札・デッキ）'); },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){ return armedLv3ReadyS03(ctx) && poolS03('アームド・ドラゴン LV3', ctx.player).length>0; } }
});

/* ---- おジャマジック: このカードが手札またはフィールド上から墓地へ送られた時、自分のデッキから「おジャマ・グリーン」「おジャマ・イエロー」「おジャマ・ブラック」を
   1体ずつ手札に加える。 (forced; each one that is in the Deck) ---- */
/* its pool spec (the three named おジャマ), registered for the auto-table identity check (tools/test_s03_u135) */
poolSpecS03('おジャマジック', {action:'search', optional:false, filter:{names:['おジャマ・グリーン','おジャマ・イエロー','おジャマ・ブラック']}});
function ojamagicFromS03(ctx){ const g = ctx.card && ctx.card.graveInfo; return !!(g && ['hand','sz','field'].indexOf(g.from)>=0 && Number(g.turn)===Number(gameState.turn)); }
defineScript('おジャマジック', {
  type:'spell', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){ if(ctx.zone!=='grave' || ctx.eventName!=='onSendToGrave' || !eventIsSelfS03(ctx) || !ojamagicFromS03(ctx)){ ctx.reason = '手札・フィールドから墓地へ送られた時に発動します'; return false; } return true; },
  resolve(ctx){
    ['おジャマ・グリーン','おジャマ・イエロー','おジャマ・ブラック'].forEach(n=>{
      const h = API.pileCards(ctx.player,'deck',x=>x.db.n===n)[0];
      if(h) API.searchDeck(ctx.player, h.index, 'おジャマジック');
    });
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx) && ojamagicFromS03(ctx); } }
});

/* ---- 「このカードを生け贄にして（リリースして）…をアドバンス召喚した場合」 (the summoned monster records this card as its Tribute: usedAsMaterial) ---- */
function tributedForS03(ctx, test){
  const u = ctx.card && ctx.card.usedAsMaterial, e = ctx.event || {};
  if(ctx.zone!=='grave' || !u || u.summonType!=='tribute') return false;
  const su = e.uid!=null ? e.uid : (e.card && e.card.uid);
  if(su==null || su!==u.summonedUid) return false;
  const h = findCardByUid(su); return !!(h && h.zone==='mz' && test(h.card));
}
function defineTributedRecruitS03(name, spec, test, reason){
  poolSpecS03(name, Object.assign({action:'summon', pos:'faceUp'}, spec));
  defineScript(name, {
    type:'monster', priority:1, forced:spec.optional===false, onOtherSummon:true, activateFrom:['grave'], blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
    condition(ctx){ if(ctx.eventName!=='onNormalSummon' || !tributedForS03(ctx, test)){ ctx.reason = reason; return false; } return true; },
    resolve(ctx){ askPoolS03(ctx, name, `${name}：特殊召喚するモンスター`); },
    afterResolve(){},
    passive:{ onNormalSummon(ctx){ return tributedForS03(ctx, test) && hasMonsterZoneSpace(ctx.player); } }
  });
}
/* インヴェルズを呼ぶ者: このカードをリリースして「インヴェルズ」と名のついたモンスターのアドバンス召喚に成功した時、デッキからレベル4以下の「インヴェルズ」と名のついた
   モンスター1体を特殊召喚できる。 */
defineTributedRecruitS03('インヴェルズを呼ぶ者', {optional:true, filter:{nameHas:'インヴェルズ', lvmax:4}}, c=>String(dbOf(c).n||'').indexOf('インヴェルズ')>=0,
  'このカードをリリースして「インヴェルズ」のアドバンス召喚に成功した時に発動します');
/* スカル・ナイト: このカードを生け贄にして悪魔族モンスターを生け贄召喚した場合、デッキから「スカル・ナイト」1体を特殊召喚する。その後デッキをシャッフルする。 */
defineTributedRecruitS03('スカル・ナイト', {optional:false, filter:{name:'スカル・ナイト'}}, c=>((typeof currentRaceV17==='function')?currentRaceV17(c):dbOf(c).ra)==='悪魔',
  'このカードを生け贄にして悪魔族モンスターを生け贄召喚した場合に発動します');
