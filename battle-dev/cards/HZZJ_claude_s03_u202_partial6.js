/* S03-U202: PARTIAL cards whose AUTO_DECK_TABLE entries (cards/40) were coarse — now their 2011 texts (shared pool / choice helpers:
   engine/1ZT deckTriggerPoolS03, cards/HZZF poolSpecS03 / poolS03 / askPoolS03, cards/HZZH defineSummonSearchS03 / defineDeckSpellS03,
   cards/HZZI askMillS03).
   - hand-discard searchers: アトランティスの戦士, キラーザウルス;
   - Flip searches (forced): ウェポンサモナー, マシンナーズ・ディフェンダー;
   - summon search: バフォメット; summon mill: ドラグニティ－トリブル;
   - GY / Synchro Material triggers: 伝説の白石, シンクロ・フュージョニスト, アーケイン・ファイロ;
   - search Spells: コール・リゾネーター, トゥーンのもくじ, 融合賢者, 儀式の準備. */

/* ---- 「このカードを手札から墓地へ捨てて発動できる。デッキから「X」1枚を手札に加える。」 (ignition from the hand, own Main Phase) ---- */
function defineDiscardSearchS03(name, spec){
  poolSpecS03(name, Object.assign({action:'search'}, spec));
  defineScript(name, {
    type:'monster', priority:1, timing:['mainPhase'], activateFrom:['hand'], blocksIfNoDeckToHand:true,
    condition(ctx){
      if(ctx.zone!=='hand'){ ctx.reason = '手札から捨てて発動します'; return false; }
      if(!poolS03(name, ctx.player).length){ ctx.reason = 'デッキに該当するカードがありません'; return false; }
      return true;
    },
    cost(ctx, done){ const h = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null; if(!h || h.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, h.index, `${name}（コスト）`, {byEffect:false}); done(true); },
    resolve(ctx){ askPoolS03(ctx, name, `${name}：手札に加えるカード`); },
    afterResolve(){}
  });
}
/* アトランティスの戦士: このカードを手札から墓地へ捨てる事で、デッキから「伝説の都 アトランティス」1枚を手札に加える。 */
defineDiscardSearchS03('アトランティスの戦士', {filter:{name:'伝説の都 アトランティス', anyCard:true}});
/* キラーザウルス: このカードを手札から墓地へ捨てる事で、デッキから「ジュラシックワールド」1枚を手札に加える。 */
defineDiscardSearchS03('キラーザウルス', {filter:{name:'ジュラシックワールド', anyCard:true}});

/* ---- Flip searches (「リバース：…手札に加える」 — forced) ---- */
function defineForcedFlipSearchS03(name, spec){
  poolSpecS03(name, Object.assign({action:'search', optional:false}, spec));
  defineScript(name, {
    type:'monster', priority:1, forced:true,
    condition(ctx){ if(ctx.eventName!=='onFlip' || !eventIsSelfS03(ctx)){ ctx.reason = 'リバースした時に発動します'; return false; } return true; },
    resolve(ctx){ askPoolS03(ctx, name, `${name}：手札に加えるカード`); },
    afterResolve(){},
    passive:{ onFlip(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); } }
  });
}
/* ウェポンサモナー: リバース：自分のデッキから「ガーディアン」と名のついたカード1枚を手札に加える。 */
defineForcedFlipSearchS03('ウェポンサモナー', {filter:{nameHas:'ガーディアン', anyCard:true}});
/* マシンナーズ・ディフェンダー: リバース：自分のデッキから「督戦官コヴィントン」1体を手札に加える。 */
defineForcedFlipSearchS03('マシンナーズ・ディフェンダー', {filter:{name:'督戦官コヴィントン'}});

/* ---- バフォメット: このカードが召喚・反転召喚に成功した時、自分のデッキから「幻獣王ガゼル」1体を手札に加える事ができる。 ---- */
defineSummonSearchS03('バフォメット', {events:['onNormalSummon','onFlip'], reason:'召喚・反転召喚に成功した時に発動します', filter:{name:'幻獣王ガゼル'}});

/* ---- ドラグニティ－トリブル: このカードが召喚・特殊召喚に成功した時、デッキからレベル3以下のドラゴン族モンスター1体を墓地へ送る事ができる。 ---- */
poolSpecS03('ドラグニティ－トリブル', {action:'mill', filter:{ra:'ドラゴン', lvmax:3}});
defineScript('ドラグニティ－トリブル', {
  type:'monster', priority:1,
  condition(ctx){ if(ctx.zone!=='mz' || ['onNormalSummon','onSpecialSummon'].indexOf(ctx.eventName)<0 || !eventIsSelfS03(ctx)){ ctx.reason = '召喚・特殊召喚に成功した時に発動します'; return false; } return true; },
  resolve(ctx){ askMillS03(ctx, 'ドラグニティ－トリブル', 'ドラグニティ－トリブル：墓地へ送るレベル3以下のドラゴン族'); },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); }, onSpecialSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); } }
});

/* ---- 伝説の白石: このカードが墓地へ送られた時、自分のデッキから「青眼の白龍」1体を手札に加える。 (forced, from anywhere) ---- */
poolSpecS03('伝説の白石', {action:'search', optional:false, filter:{name:'青眼の白龍'}});
defineScript('伝説の白石', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){ if(ctx.zone!=='grave' || ctx.eventName!=='onSendToGrave' || !eventIsSelfS03(ctx)){ ctx.reason = '墓地へ送られた時に発動します'; return false; } return true; },
  resolve(ctx){ askPoolS03(ctx, '伝説の白石', '伝説の白石：手札に加える「青眼の白龍」'); },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx); } }
});

/* ---- Synchro Material searches (optional; this card itself sent to the GY as Synchro Material) ---- */
function defineSynchroMaterialSearchS03(name, spec){
  poolSpecS03(name, Object.assign({action:'search'}, spec));
  const ok = ctx=>ctx.zone==='grave' && (ctx.event||{}).reason==='synchroMaterial' && eventIsSelfS03(ctx);
  defineScript(name, {
    type:'monster', priority:1, activateFrom:['grave'], blocksIfNoDeckToHand:true,
    condition(ctx){ if(ctx.eventName!=='onSendToGrave' || !ok(ctx)){ ctx.reason = 'シンクロ素材として墓地へ送られた場合に発動します'; return false; } return true; },
    resolve(ctx){ askPoolS03(ctx, name, `${name}：手札に加えるカード`); },
    afterResolve(){},
    passive:{ onSendToGrave(ctx){ return ok(ctx); } }
  });
}
/* シンクロ・フュージョニスト: このカードがシンクロモンスターのシンクロ召喚に使用され墓地へ送られた場合、自分のデッキから「融合」または「フュージョン」と名のついた
   魔法カード1枚を手札に加える事ができる。 */
defineSynchroMaterialSearchS03('シンクロ・フュージョニスト', {filter:{anyCard:true, spellNameAny:['融合','フュージョン']}});
/* アーケイン・ファイロ: このカードがシンクロモンスターのシンクロ召喚に使用され墓地へ送られた場合、自分のデッキから「バスター・モード」1枚を手札に加える事ができる。 */
defineSynchroMaterialSearchS03('アーケイン・ファイロ', {filter:{name:'バスター・モード', anyCard:true}});

/* ---- search Spells ---- */
/* コール・リゾネーター: 自分のデッキから「リゾネーター」と名のついたモンスター1体を手札に加える。 */
defineDeckSpellS03('コール・リゾネーター', {filter:{nameHas:'リゾネーター'}, title:'コール・リゾネーター：手札に加える「リゾネーター」モンスター'});
/* トゥーンのもくじ: 自分のデッキから「トゥーン」と名のついたカード1枚を手札に加える。 */
defineDeckSpellS03('トゥーンのもくじ', {filter:{nameHas:'トゥーン', anyCard:true}, title:'トゥーンのもくじ：手札に加える「トゥーン」カード'});
/* 融合賢者: 自分のデッキから「融合」魔法カード1枚を手札に加える。 */
defineDeckSpellS03('融合賢者', {filter:{name:'融合', anyCard:true}, title:'融合賢者：手札に加える「融合」'});
/* 儀式の準備: 自分のデッキからレベル7以下の儀式モンスター1体を手札に加える。その後、自分の墓地の儀式魔法カード1枚を選択して手札に加える事ができる。 */
poolSpecS03('儀式の準備', {action:'search', optional:false, filter:{lvmax:7, ritualOnly:true}});
registerChoiceHandlerV49('s03u202.ritual-prep', (answer, args)=>{
  if(!answer || answer.cancelled || !args) return;
  const pick = (answer.cards||[]).filter(y=>y && !y.stale && y.uid!=null)[0], h = pick ? findCardByUid(pick.uid) : null;
  if(h && h.p===args.player && h.zone==='deck') API.searchDeck(args.player, h.index, '儀式の準備');
  const gs = API.pileCards(args.player,'grave',x=>x.db.k==='s' && x.db.sub==='儀式');
  if(!gs.length) return;
  API.requestChoice({player:args.player, kind:'card', title:'儀式の準備：墓地から手札に加える儀式魔法（任意）', candidates:gs, min:1, max:1, cancelable:true,   /* 「できる」: declining = cancel */
    resume:{handler:'s03u202.ritual-prep-grave', args:{player:args.player}}, meta:{scriptName:'儀式の準備'}});
});
registerChoiceHandlerV49('s03u202.ritual-prep-grave', (answer, args)=>{
  if(!answer || answer.cancelled || !args) return;
  const pick = (answer.cards||[]).filter(y=>y && !y.stale && y.uid!=null)[0], h = pick ? findCardByUid(pick.uid) : null;
  if(h && h.p===args.player && h.zone==='grave') API.returnToHand(h, '儀式の準備');
});
defineScript('儀式の準備', {
  type:'spell', priority:1, blocksIfNoDeckToHand:true,
  condition(ctx){ if(!poolS03('儀式の準備', ctx.player).length){ ctx.reason = 'デッキにレベル7以下の儀式モンスターがいません'; return false; } return true; },
  resolve(ctx){
    const pool = poolS03('儀式の準備', ctx.player);
    if(!pool.length){ API.shuffle(ctx.player); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'儀式の準備：手札に加えるレベル7以下の儀式モンスター', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u202.ritual-prep', args:{player:ctx.player}}, meta:{scriptName:'儀式の準備'}});
  }
});
