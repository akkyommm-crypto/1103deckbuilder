/* S03-U198: PARTIAL cards whose AUTO_DECK_TABLE entries (cards/40) were coarse — now their 2011 texts. The Deck / hand pools use the shared
   deck-trigger engine (engine/1ZT deckTriggerPoolS03; specs registered in DECK_TRIGGER_S03) and its journaled resolution choice
   (s03u156.deck-trigger: 「特殊召喚する」 without a position → face-up, the player's choice).
   - 深海のディーヴァ / ヒーロー・キッズ / 充電池メン: summon triggers.
   - バスター・ビースト / ビーストライカー / ネフティスの導き手: ignition effects with a cost.
   - 闇・道化師のペーテン: 「墓地へ送られた時、墓地のこのカードを除外して発動できる」. */

function poolSpecS03(name, spec){ const S = Object.assign({from:['deck'], max:1, optional:true}, spec||{}); DECK_TRIGGER_S03[name] = S; return S; }
function poolS03(name, p){ return deckTriggerPoolS03(name, DECK_TRIGGER_S03[name], p); }
function askPoolS03(ctx, name, title){
  const S = DECK_TRIGGER_S03[name], summon = S.action==='summon';
  const pool = poolS03(name, ctx.player);
  if(!pool.length){ if((S.from||['deck']).indexOf('deck')>=0) API.shuffle(ctx.player); API.log(`${name}：条件を満たすカードが無い`); return; }
  const room = summon ? Math.max(0, ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length) : 99;
  if(summon && !room){ API.log(`${name}：モンスターゾーンが空いていない`); return; }
  const max = Math.max(1, Math.min(S.max||1, pool.length, room));
  API.requestChoice({player:ctx.player, kind:'card', title:title + (max>1?`（${max}体まで）`:''), candidates:pool,
    min:(S.minPick===0?0:1), max, cancelable:false,
    resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name, action:S.action, pos:S.pos||'faceUp'}}, meta:{scriptName:name}});
}

/* ---- summon triggers ---- */
function defineSummonRecruitS03(name, spec){
  const S = poolSpecS03(name, Object.assign({action:'summon', pos:'faceUp'}, spec));
  const evs = S.events || ['onNormalSummon'];
  const def = {
    type:'monster', priority:1, forced:!S.optional, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
    condition(ctx){
      if(ctx.zone!=='mz' || evs.indexOf(ctx.eventName)<0 || !eventIsSelfS03(ctx)){ ctx.reason = S.reason || '召喚に成功した時に発動します'; return false; }
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      return true;
    },
    resolve(ctx){ askPoolS03(ctx, name, S.title || `${name}：特殊召喚するモンスター`); },
    afterResolve(){},
    passive:{}
  };
  evs.forEach(ev=>{ def.passive[ev] = (ctx)=>ctx.zone==='mz' && eventIsSelfS03(ctx) && hasMonsterZoneSpace(ctx.player); });
  if(S.continuous) def.continuous = S.continuous;
  defineScript(name, def);
}
/* 深海のディーヴァ: このカードが召喚に成功した時、デッキからレベル3以下の海竜族モンスター1体を特殊召喚する事ができる。 */
defineSummonRecruitS03('深海のディーヴァ', {filter:{ra:'海竜', lvmax:3}, title:'深海のディーヴァ：特殊召喚するレベル3以下の海竜族'});
/* ヒーロー・キッズ: このカードが特殊召喚に成功した時、デッキから「ヒーロー・キッズ」を任意の枚数特殊召喚する事ができる。 */
defineSummonRecruitS03('ヒーロー・キッズ', {events:['onSpecialSummon'], max:99, filter:{name:'ヒーロー・キッズ'},
  reason:'特殊召喚に成功した時に発動します', title:'ヒーロー・キッズ：特殊召喚する「ヒーロー・キッズ」'});
/* 充電池メン: このカードが召喚に成功した時、手札・デッキから「充電池メン」以外の「電池メン」と名のついたモンスター1体を特殊召喚できる。
   このカードの攻撃力・守備力は、自分フィールド上の雷族モンスターの数×300ポイントアップする。 */
defineSummonRecruitS03('充電池メン', {from:['hand','deck'], filter:{set:SETCODE.BATTERYMAN, notName:'充電池メン'},
  title:'充電池メン：特殊召喚する「電池メン」（手札・デッキ）',
  continuous:{scope:'self', from:['mz'], apply(target, self){
    const loc = locateCard(self); if(!loc) return null;
    const n = (gameState.players[loc.p].mz||[]).filter(c=>c && c.face==='up' && (typeof currentRaceV17==='function' ? currentRaceV17(c) : dbOf(c).ra)==='雷').length;
    return n ? {atk:n*300, def:n*300} : null; }}});

/* ---- ignition effects with a cost ---- */
/* バスター・ビースト: このカードを手札から墓地へ捨てる事で、デッキから「バスター・モード」1枚を手札に加える。 */
poolSpecS03('バスター・ビースト', {action:'search', filter:{name:'バスター・モード', anyCard:true}});
defineScript('バスター・ビースト', {
  type:'monster', priority:1, timing:['mainPhase'], activateFrom:['hand'], blocksIfNoDeckToHand:true,
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = '手札から捨てて発動します'; return false; }
    if(!poolS03('バスター・ビースト', ctx.player).length){ ctx.reason = 'デッキに「バスター・モード」がありません'; return false; }
    return true;
  },
  cost(ctx, done){ const h = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null; if(!h || h.zone!=='hand'){ done(false); return; }
    API.discard(ctx.player, h.index, 'バスター・ビースト（コスト）', {byEffect:false}); done(true); },
  resolve(ctx){ askPoolS03(ctx, 'バスター・ビースト', 'バスター・ビースト：手札に加える「バスター・モード」'); },
  afterResolve(){}
});
/* ビーストライカー: 手札を1枚捨てて発動する。自分のデッキから「モジャ」1体を特殊召喚する。この効果は1ターンに1度しか使用できない。 */
poolSpecS03('ビーストライカー', {action:'summon', pos:'faceUp', filter:{name:'モジャ'}});
defineScript('ビーストライカー', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){ API.selectCard('ビーストライカー：捨てる手札', API.pileCards(ctx.player,'hand'), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
    API.discard(ctx.player, r.index, 'ビーストライカー（コスト）', {byEffect:false}); done(true); }); },
  resolve(ctx){ askPoolS03(ctx, 'ビーストライカー', 'ビーストライカー：特殊召喚する「モジャ」'); },
  afterResolve(){}
});
/* ネフティスの導き手: 自分フィールド上に存在するモンスター1体とこのカードを生け贄に捧げる事で、手札またはデッキから「ネフティスの鳳凰神」1体を特殊召喚する。 */
poolSpecS03('ネフティスの導き手', {from:['hand','deck'], action:'summon', pos:'faceUp', filter:{name:'ネフティスの鳳凰神'}});
function nephthysOtherS03(ctx){ return API.fieldCards({zone:'mz', player:ctx.player, filter:x=>x.card && x.card!==ctx.card}); }
defineScript('ネフティスの導き手', {
  type:'monster', priority:1, timing:['mainPhase'], blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!nephthysOtherS03(ctx).length){ ctx.reason = '生け贄にする他の自分のモンスターがいません'; return false; }
    if(!poolS03('ネフティスの導き手', ctx.player).length){ ctx.reason = '手札・デッキに「ネフティスの鳳凰神」がいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('ネフティスの導き手：一緒に生け贄にする自分のモンスター', nephthysOtherS03(ctx), t=>{
      const o = resolveTarget(t), me = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null;
      if(!o || o.zone!=='mz' || !me || me.zone!=='mz'){ done(false); return; }
      const ou = ensureCardUid(gameState, o.card), mu = me.card.uid;
      API.sendToGrave(findCardByUid(ou), 'ネフティスの導き手（生け贄）');
      const m2 = findCardByUid(mu); if(m2 && m2.zone==='mz') API.sendToGrave(m2, 'ネフティスの導き手（生け贄）');
      done(true);
    });
  },
  resolve(ctx){ askPoolS03(ctx, 'ネフティスの導き手', 'ネフティスの導き手：特殊召喚する「ネフティスの鳳凰神」（手札・デッキ）'); },
  afterResolve(){}
});

/* ---- 闇・道化師のペーテン: このカードが墓地へ送られた時、墓地のこのカードをゲームから除外する事で、手札またはデッキから「闇・道化師のペーテン」1体を
   特殊召喚する。 (optional trigger; the banish is its cost) ---- */
poolSpecS03('闇・道化師のペーテン', {from:['hand','deck'], action:'summon', pos:'faceUp', filter:{name:'闇・道化師のペーテン'}});
defineScript('闇・道化師のペーテン', {
  type:'monster', priority:1, activateFrom:['grave'], blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='grave' || ctx.eventName!=='onSendToGrave' || !eventIsSelfS03(ctx)){ ctx.reason = 'このカードが墓地へ送られた時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){ const h = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null; if(!h || h.zone!=='grave'){ done(false); return; }
    API.banish(h, '闇・道化師のペーテン（コスト）'); done(true); },
  resolve(ctx){ askPoolS03(ctx, '闇・道化師のペーテン', '闇・道化師のペーテン：特殊召喚する「闇・道化師のペーテン」（手札・デッキ）'); },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx) && hasMonsterZoneSpace(ctx.player); } }
});
