/* S03-U201: PARTIAL cards whose AUTO_DECK_TABLE entries (cards/40) were coarse — now their 2011 texts (shared pool / choice helpers:
   engine/1ZT deckTriggerPoolS03, cards/HZZF poolSpecS03 / poolS03 / askPoolS03).
   スクラップ・ハンター, スクラップ・リサイクラー, ジェネクス・ニュートロン, ラヴァル炎火山の侍女, ヴォルカニック・バレット, 宝玉の導き, 賢者の宝石,
   氷結界の決起隊, スモール・ピース・ゴーレム / ミッド・ピース・ゴーレム. */

/* choose one card of a registered pool and send it from the Deck to the GY (registered choice p11cards.deck-mill) */
function askMillS03(ctx, name, title){
  const pool = poolS03(name, ctx.player);
  if(!pool.length){ API.shuffle(ctx.player); API.log(`${name}：条件を満たすカードがデッキに無い`); return; }
  API.requestChoice({player:ctx.player, kind:'card', title, candidates:pool, min:1, max:1, cancelable:false,
    resume:{handler:'p11cards.deck-mill', args:{player:ctx.player, reason:name}}, meta:{scriptName:name}});
}

/* ---- スクラップ・ハンター: 1ターンに1度、このカード以外の自分フィールド上に表側表示で存在する「スクラップ」と名のついたモンスター1体を選択して破壊し、
   自分のデッキからチューナー1体を墓地へ送る事ができる。 ---- */
function scrapHunterPoolS03(p){ return API.pileCards(p,'deck',x=>x.db.k==='m' && (x.db.st||[]).indexOf('チューナー')>=0); }
function scrapHunterTargetsS03(ctx){ return API.fieldCards({zone:'mz', player:ctx.player, filter:x=>x.card!==ctx.card && x.card.face==='up' && v380IsScrap(x.card)}); }
defineScript('スクラップ・ハンター', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1, targets:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!scrapHunterTargetsS03(ctx).length){ ctx.reason = '他の自分の表側表示の「スクラップ」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('スクラップ・ハンター：破壊する「スクラップ」', scrapHunterTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(!h || h.zone!=='mz'){ API.log('スクラップ・ハンター：対象が存在しないため不発'); return; }
    API.destroy(h, 'スクラップ・ハンター');
    const pool = scrapHunterPoolS03(ctx.player);
    if(!pool.length){ API.shuffle(ctx.player); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'スクラップ・ハンター：墓地へ送るチューナー', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'p11cards.deck-mill', args:{player:ctx.player, reason:'スクラップ・ハンター'}}, meta:{scriptName:'スクラップ・ハンター'}});
  },
  afterResolve(){}
});

/* ---- スクラップ・リサイクラー ---- */
poolSpecS03('スクラップ・リサイクラー', {action:'mill', filter:{ra:'機械'}});
function recyclerGraveS03(p){ return API.pileCards(p,'grave',x=>x.db.k==='m' && x.db.ra==='機械' && x.db.at==='地' && Number(x.db.lv)===4); }
defineScript('スクラップ・リサイクラー', {
  type:'monster', priority:1, timing:['summon','mainPhase'],
  /* ① optional trigger on its own Normal / Special Summon; ② ignition, once per turn, cost: 2 Machine / EARTH / Level 4 from the GY to the Deck */
  /* ②'s once per turn: the zone-local recyclerTurnS03 (① is not limited) */
  condition(ctx){
    if(ctx.eventName==='onNormalSummon' || ctx.eventName==='onSpecialSummon'){
      if(ctx.zone!=='mz' || !eventIsSelfS03(ctx)){ ctx.reason = '召喚・特殊召喚に成功した時に発動します'; return false; }
      return true;
    }
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || gameState.activePlayer!==ctx.player || ['main1','main2'].indexOf(gameState.phase)<0){ ctx.reason = '自分メインフェイズに発動します'; return false; }
    if(Number(ctx.card.recyclerTurnS03)===Number(gameState.turn)){ ctx.reason = '1ターンに1度です'; return false; }
    if(recyclerGraveS03(ctx.player).length<2){ ctx.reason = '墓地に機械族・地属性・レベル4モンスターが2体必要です'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    if(ctx.eventName==='onNormalSummon' || ctx.eventName==='onSpecialSummon'){ done(true); return; }
    v380SelectExactly('スクラップ・リサイクラー：デッキに戻す機械族・地属性・レベル4', recyclerGraveS03(ctx.player), 2, sel=>{
      const uids = sel.map(x=>ensureCardUid(gameState, x.card));
      const me = findCardByUid(ctx.card.uid);
      if(me && me.zone==='mz') API.setCardFlag(me, 'recyclerTurnS03', gameState.turn, 'スクラップ・リサイクラー', {silent:true});
      uids.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='grave') API.returnToDeck(h, false, 'スクラップ・リサイクラー（コスト）'); });
      API.shuffle(ctx.player);
      done(true);
    });
  },
  resolve(ctx){
    if(ctx.eventName==='onNormalSummon' || ctx.eventName==='onSpecialSummon'){ askMillS03(ctx, 'スクラップ・リサイクラー', 'スクラップ・リサイクラー：墓地へ送る機械族'); return; }
    API.draw(ctx.player, 1, 'スクラップ・リサイクラー');
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); }, onSpecialSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); } }
});

/* ---- ジェネクス・ニュートロン: このカードを召喚したターンのエンドフェイズに発動できる。デッキから機械族チューナー1体を手札に加える。 ---- */
poolSpecS03('ジェネクス・ニュートロン', {action:'search', filter:{ra:'機械'}});
function neutronReadyS03(ctx){
  const c = ctx.card, sp = c && c.summonProvenance;
  return ctx.zone==='mz' && c.face==='up' && gameState.phase==='end' && Number(c.summonedTurn)===Number(gameState.turn)
    && !!sp && (sp.summonType==='normal' || sp.summonType==='tribute');
}
defineScript('ジェネクス・ニュートロン', {
  type:'monster', priority:1, blocksIfNoDeckToHand:true,
  condition(ctx){ if(!neutronReadyS03(ctx)){ ctx.reason = '召喚したターンのエンドフェイズに発動します'; return false; } return true; },
  resolve(ctx){
    const pool = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && !x.db.ex && x.db.ra==='機械' && (x.db.st||[]).indexOf('チューナー')>=0);
    if(!pool.length){ API.shuffle(ctx.player); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'ジェネクス・ニュートロン：手札に加える機械族チューナー', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name:'ジェネクス・ニュートロン', action:'search'}}, meta:{scriptName:'ジェネクス・ニュートロン'}});
  },
  afterResolve(){},
  passive:{ onEndPhase(ctx){ return neutronReadyS03(ctx); } }
});

/* ---- ラヴァル炎火山の侍女: 自分の墓地に「ラヴァル炎火山の侍女」以外の「ラヴァル」と名のついたモンスターが存在し、このカードが墓地へ送られた時、デッキから
   「ラヴァル」と名のついたモンスター1体を墓地へ送る事ができる。 ---- */
poolSpecS03('ラヴァル炎火山の侍女', {action:'mill', filter:{set:SETCODE.LAVAL}});
function lavalOtherInGraveS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card && x.db.k==='m' && isSetCardV4(x.db, SETCODE.LAVAL) && x.db.n!=='ラヴァル炎火山の侍女').length>0; }
defineScript('ラヴァル炎火山の侍女', {
  type:'monster', priority:1, activateFrom:['grave'],
  condition(ctx){
    if(ctx.zone!=='grave' || ctx.eventName!=='onSendToGrave' || !eventIsSelfS03(ctx)){ ctx.reason = '墓地へ送られた時に発動します'; return false; }
    if(!lavalOtherInGraveS03(ctx)){ ctx.reason = '墓地に他の「ラヴァル」がいません'; return false; }
    return true;
  },
  resolve(ctx){ askMillS03(ctx, 'ラヴァル炎火山の侍女', 'ラヴァル炎火山の侍女：墓地へ送る「ラヴァル」'); },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx) && lavalOtherInGraveS03(ctx); } }
});

/* ---- ヴォルカニック・バレット: このカードが墓地に存在する場合、1ターンに1度、500ライフポイントを払う事で自分のデッキから「ヴォルカニック・バレット」1枚を
   手札に加える。 (ignition from the GY, own Main Phase) ---- */
poolSpecS03('ヴォルカニック・バレット', {action:'search', filter:{name:'ヴォルカニック・バレット'}});
defineScript('ヴォルカニック・バレット', {
  type:'monster', priority:1, activateFrom:['grave'], timing:['mainPhase'], countLimit:1, blocksIfNoDeckToHand:true,
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = '墓地に存在する場合に発動します'; return false; }
    if(API.me(ctx).lp < 500){ ctx.reason = '500ライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 500); done(true); },
  resolve(ctx){
    const me = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null;
    if(!me || me.zone!=='grave'){ API.log('ヴォルカニック・バレット：墓地に存在しないため処理できない'); return; }
    askPoolS03(ctx, 'ヴォルカニック・バレット', 'ヴォルカニック・バレット：手札に加える「ヴォルカニック・バレット」');
  },
  afterResolve(){}
});

/* ---- 宝玉の導き: 自分の魔法&罠カードゾーンに「宝玉獣」と名のついたカードが2枚以上存在する場合、デッキから「宝玉獣」と名のついたモンスター1体を特殊召喚する。 ---- */
poolSpecS03('宝玉の導き', {action:'summon', pos:'faceUp', filter:{set:SETCODE.CRYSTAL_BEAST}});
function crystalInSzS03(p){ return (gameState.players[p].sz||[]).filter(c=>c && c.face==='up' && isSetCardV4(dbOf(c), SETCODE.CRYSTAL_BEAST)).length; }
defineScript('宝玉の導き', {
  type:'spell', priority:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(crystalInSzS03(ctx.player) < 2){ ctx.reason = '魔法＆罠ゾーンに「宝玉獣」が2枚以上必要です'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){ askPoolS03(ctx, '宝玉の導き', '宝玉の導き：特殊召喚する「宝玉獣」'); }
});

/* ---- 賢者の宝石: 自分フィールドに「ブラック・マジシャン・ガール」が存在する場合に発動できる。手札・デッキから「ブラック・マジシャン」1体を特殊召喚する。 ---- */
poolSpecS03('賢者の宝石', {from:['hand','deck'], action:'summon', pos:'faceUp', filter:{name:'ブラック・マジシャン'}});
defineScript('賢者の宝石', {
  type:'spell', priority:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(!API.fieldCards({zone:'mz', player:ctx.player, filter:x=>x.card.face==='up' && x.db.n==='ブラック・マジシャン・ガール'}).length){ ctx.reason = '「ブラック・マジシャン・ガール」が必要です'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){ askPoolS03(ctx, '賢者の宝石', '賢者の宝石：特殊召喚する「ブラック・マジシャン」（手札・デッキ）'); }
});

/* ---- 氷結界の決起隊: このカードをリリースして発動できる。フィールド上の水属性モンスター1体を選択して破壊し、デッキから「氷結界」と名のついたモンスター1体を
   手札に加える。 ---- */
poolSpecS03('氷結界の決起隊', {action:'search', optional:false, filter:{set:SETCODE.ICE_BARRIER}});
function iceUprisingTargetsS03(ctx){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.card!==ctx.card && ((typeof currentAttributeV17==='function')?currentAttributeV17(x.card):x.db.at)==='水'}); }
defineScript('氷結界の決起隊', {
  type:'monster', priority:1, timing:['mainPhase'], targets:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!iceUprisingTargetsS03(ctx).length){ ctx.reason = '他の表側表示の水属性モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = findCardByUid(ctx.card.uid); if(!me || me.zone!=='mz'){ done(false); return; } API.sendToGrave(me, '氷結界の決起隊（リリース）'); done(true); },
  selectTargets(ctx, done){ API.selectCard('氷結界の決起隊：破壊する水属性モンスター', iceUprisingTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(!h || h.zone!=='mz'){ API.log('氷結界の決起隊：対象が存在しないため不発'); return; }
    API.destroy(h, '氷結界の決起隊');
    askPoolS03(ctx, '氷結界の決起隊', '氷結界の決起隊：手札に加える「氷結界」モンスター');
  },
  afterResolve(){}
});

/* ---- スモール・ピース・ゴーレム / ミッド・ピース・ゴーレム ---- */
registerChoiceHandlerV49('s03u201.peace-golem', (answer, args)=>{
  if(!answer || answer.cancelled || !args) return;
  const pick = (answer.cards||[]).filter(y=>y && !y.stale && y.uid!=null)[0];
  const h = pick ? findCardByUid(pick.uid) : null;
  if(!h || h.p!==args.player || h.zone!=='deck' || !hasMonsterZoneSpace(args.player)) return;
  /* 「この効果で特殊召喚したモンスターの効果は無効化される」 — negated as part of the summon (FX_SPECIAL_SUMMON negateOnSummonS03, S03-U184) */
  API.specialSummon(args.player, 'deck', h.index, 'atk', args.name, null, {negateOnSummonS03:true, negateSourceUidS03:(args.src!=null?args.src:null)});
});
function definePeaceGolemS03(name, other){
  poolSpecS03(name, {action:'summon', filter:{name:other}});
  const ready = ctx=>ctx.zone==='mz' && eventIsSelfS03(ctx) && (ctx.eventName!=='onFlip' || !!(ctx.event||{}).flipSummon)
    && API.fieldCards({zone:'mz', player:ctx.player, filter:x=>x.card.face==='up' && x.db.n==='ビッグ・ピース・ゴーレム'}).length>0 && hasMonsterZoneSpace(ctx.player);
  defineScript(name, {
    type:'monster', priority:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
    condition(ctx){ if(!ready(ctx)){ ctx.reason = '「ビッグ・ピース・ゴーレム」が表側表示で存在し、召喚・反転召喚・特殊召喚に成功した時に発動します'; return false; } return true; },
    resolve(ctx){
      const pool = poolS03(name, ctx.player);
      if(!pool.length || !hasMonsterZoneSpace(ctx.player)){ API.shuffle(ctx.player); return; }
      API.requestChoice({player:ctx.player, kind:'card', title:`${name}：特殊召喚する「${other}」（効果は無効）`, candidates:pool, min:1, max:1, cancelable:false,
        resume:{handler:'s03u201.peace-golem', args:{player:ctx.player, name, src:ensureCardUid(gameState, ctx.card)}}, meta:{scriptName:name}});
    },
    afterResolve(){},
    passive:{ onNormalSummon:ready, onSpecialSummon:ready, onFlip:ready }
  });
}
definePeaceGolemS03('スモール・ピース・ゴーレム', 'ミッド・ピース・ゴーレム');
definePeaceGolemS03('ミッド・ピース・ゴーレム', 'スモール・ピース・ゴーレム');
