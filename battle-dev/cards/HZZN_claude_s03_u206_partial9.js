/* S03-U206: PARTIAL cards whose AUTO_DECK_TABLE entries (cards/40) were coarse — now their 2011 texts (shared pool / choice helpers:
   engine/1ZT deckTriggerPoolS03, cards/HZZF poolSpecS03 / poolS03 / askPoolS03, cards/HZZI askMillS03).
   インフェルニティ・インフェルノ, コンバート・コンタクト, フェザー・ウィンド・アタック, 督戦官コヴィントン, ロード・ウォリアー, 黒魔術のカーテン,
   デーモンとの駆け引き (engine: players[p].lv8ToGraveTurnS03), 魔轟神獣ペガラサス. */

function pickOneS03(uidOrPick){ return uidOrPick && uidOrPick.uid!=null ? findCardByUid(uidOrPick.uid) : null; }

/* ---- インフェルニティ・インフェルノ: 自分の手札を2枚まで捨てる。その後、この効果で捨てた枚数分だけデッキから「インフェルニティ」と名のついたカードを
   墓地へ送る。 ---- */
registerChoiceHandlerV49('s03u206.inferno-discard', (answer, args)=>{
  if(!answer || !args) return;
  const picks = (answer.cards||[]).filter(y=>y && !y.stale && y.uid!=null).map(y=>y.uid);
  let n = 0;
  picks.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='hand' && h.p===args.player){ API.discard(args.player, h.index, 'インフェルニティ・インフェルノ', {byPlayer:args.player}); n++; } });
  const pool = API.pileCards(args.player,'deck',x=>String(x.db.n||'').indexOf('インフェルニティ')>=0);
  const k = Math.min(n, pool.length);
  if(!k){ if(n) API.shuffle(args.player); return; }
  API.requestChoice({player:args.player, kind:'card', title:`インフェルニティ・インフェルノ：墓地へ送る「インフェルニティ」（${k}枚）`, candidates:pool, min:k, max:k, cancelable:false,
    resume:{handler:'s03u206.inferno-mill', args:{player:args.player}}, meta:{scriptName:'インフェルニティ・インフェルノ'}});
});
registerChoiceHandlerV49('s03u206.inferno-mill', (answer, args)=>{
  if(!answer || !args) return;
  (answer.cards||[]).filter(y=>y && !y.stale && y.uid!=null).map(y=>y.uid).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='deck') API.mill(args.player, h.index, 'インフェルニティ・インフェルノ'); });
});
defineScript('インフェルニティ・インフェルノ', {
  type:'trap', priority:2,
  condition(ctx){ if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; } return true; },
  resolve(ctx){
    const hand = API.pileCards(ctx.player,'hand');
    if(!hand.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'インフェルニティ・インフェルノ：捨てる手札（2枚まで）', candidates:hand, min:1, max:Math.min(2, hand.length), cancelable:false,
      resume:{handler:'s03u206.inferno-discard', args:{player:ctx.player}}, meta:{scriptName:'インフェルニティ・インフェルノ'}});
  }
});

/* ---- コンバート・コンタクト: 自分フィールド上にモンスターが存在しない場合に発動できる。手札及びデッキから「N」と名のついたカードを1枚ずつ墓地へ送る。
   その後、自分のデッキからカードを2枚ドローする。 ---- */
function nCardS03(x){ return /^N・/.test(String(x.db.n||'')); }
/* its Deck pool spec (「N」 cards), registered for the auto-table identity check (tools/test_s03_u135) */
poolSpecS03('コンバート・コンタクト', {action:'mill', optional:false, filter:{nameHas:'N・'}});
registerChoiceHandlerV49('s03u206.convert-hand', (answer, args)=>{
  if(!answer || !args) return;
  const h = pickOneS03((answer.cards||[])[0]);
  if(h && h.zone==='hand' && h.p===args.player) API.sendHandToGrave(args.player, h.index, 'コンバート・コンタクト');
  const pool = API.pileCards(args.player,'deck',nCardS03);
  if(!pool.length){ API.draw(args.player, 2, 'コンバート・コンタクト'); return; }
  API.requestChoice({player:args.player, kind:'card', title:'コンバート・コンタクト：デッキから墓地へ送る「N」', candidates:pool, min:1, max:1, cancelable:false,
    resume:{handler:'s03u206.convert-deck', args:{player:args.player}}, meta:{scriptName:'コンバート・コンタクト'}});
});
registerChoiceHandlerV49('s03u206.convert-deck', (answer, args)=>{
  if(!answer || !args) return;
  const h = pickOneS03((answer.cards||[])[0]);
  if(h && h.zone==='deck' && h.p===args.player) API.mill(args.player, h.index, 'コンバート・コンタクト');
  API.draw(args.player, 2, 'コンバート・コンタクト');
});
defineScript('コンバート・コンタクト', {
  type:'spell', priority:1,
  condition(ctx){
    if(API.me(ctx).mz.length){ ctx.reason = '自分フィールドにモンスターが存在します'; return false; }
    if(!API.pileCards(ctx.player,'hand',x=>x.card!==ctx.card && nCardS03(x)).length || !API.pileCards(ctx.player,'deck',nCardS03).length){ ctx.reason = '手札とデッキにそれぞれ「N」が必要です'; return false; }
    if(API.me(ctx).deck.length < 3){ ctx.reason = 'デッキが足りません'; return false; }
    return true;
  },
  resolve(ctx){
    const hand = API.pileCards(ctx.player,'hand',nCardS03);
    if(!hand.length || !API.pileCards(ctx.player,'deck',nCardS03).length){ API.log('コンバート・コンタクト：「N」が揃っていないため処理できない'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'コンバート・コンタクト：手札から墓地へ送る「N」', candidates:hand, min:1, max:1, cancelable:false,
      resume:{handler:'s03u206.convert-hand', args:{player:ctx.player}}, meta:{scriptName:'コンバート・コンタクト'}});
  }
});

/* ---- フェザー・ウィンド・アタック: 自分フィールド上に表側表示で存在する「BF」と名のついたモンスター1体をデッキに戻して発動する。自分のデッキから「BF」と
   名のついたモンスター1体を手札に加える。 ---- */
poolSpecS03('フェザー・ウィンド・アタック', {action:'search', optional:false, filter:{nameHas:'BF－'}});
defineScript('フェザー・ウィンド・アタック', {
  type:'spell', priority:1, blocksIfNoDeckToHand:true,
  condition(ctx){
    if(!API.fieldCards({zone:'mz', player:ctx.player, filter:x=>x.card.face==='up' && v380IsBF(x.card)}).length){ ctx.reason = '自分フィールドに表側表示の「BF」がいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('フェザー・ウィンド・アタック：デッキに戻す「BF」', API.fieldCards({zone:'mz', player:ctx.player, filter:x=>x.card.face==='up' && v380IsBF(x.card)}), t=>{
      const r = resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.returnToDeck(r, false, 'フェザー・ウィンド・アタック（コスト）'); API.shuffle(ctx.player); done(true);
    });
  },
  resolve(ctx){ askPoolS03(ctx, 'フェザー・ウィンド・アタック', 'フェザー・ウィンド・アタック：手札に加える「BF」'); }
});

/* ---- 督戦官コヴィントン: 自分フィールド上に表側表示で存在する「マシンナーズ・ソルジャー」「マシンナーズ・スナイパー」「マシンナーズ・ディフェンダー」を1体ずつ
   墓地へ送る事で、手札またはデッキから「マシンナーズ・フォース」1体を特殊召喚する。 ---- */
poolSpecS03('督戦官コヴィントン', {from:['hand','deck'], action:'summon', pos:'faceUp', filter:{name:'マシンナーズ・フォース'}});
const COVINGTON_S03 = ['マシンナーズ・ソルジャー','マシンナーズ・スナイパー','マシンナーズ・ディフェンダー'];
function covingtonPartsS03(ctx){ return COVINGTON_S03.map(n=>API.fieldCards({zone:'mz', player:ctx.player, filter:x=>x.card.face==='up' && x.db.n===n})[0]||null); }
defineScript('督戦官コヴィントン', {
  type:'monster', priority:1, timing:['mainPhase'], blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(covingtonPartsS03(ctx).some(x=>!x)){ ctx.reason = '表側表示の「マシンナーズ・ソルジャー」「スナイパー」「ディフェンダー」が必要です'; return false; }
    if(!poolS03('督戦官コヴィントン', ctx.player).length){ ctx.reason = '手札・デッキに「マシンナーズ・フォース」がいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const uids = covingtonPartsS03(ctx).map(x=>x && ensureCardUid(gameState, x.card));
    if(uids.some(u=>u==null)){ done(false); return; }
    uids.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.sendToGrave(h, '督戦官コヴィントン（コスト）'); });
    done(true);
  },
  resolve(ctx){ askPoolS03(ctx, '督戦官コヴィントン', '督戦官コヴィントン：特殊召喚する「マシンナーズ・フォース」（手札・デッキ）'); },
  afterResolve(){}
});

/* ---- ロード・ウォリアー: 1ターンに1度、自分のデッキからレベル2以下の戦士族または機械族モンスター1体を特殊召喚する事ができる。 ---- */
poolSpecS03('ロード・ウォリアー', {action:'summon', pos:'faceUp', filter:{lvmax:2}});
function roadWarriorPoolS03(p){ return poolS03('ロード・ウォリアー', p).filter(x=>x.db.ra==='戦士' || x.db.ra==='機械'); }
defineScript('ロード・ウォリアー', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = roadWarriorPoolS03(ctx.player);
    if(!pool.length || !hasMonsterZoneSpace(ctx.player)){ API.shuffle(ctx.player); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'ロード・ウォリアー：特殊召喚するレベル2以下の戦士族・機械族', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name:'ロード・ウォリアー', action:'summon', pos:'faceUp'}}, meta:{scriptName:'ロード・ウォリアー'}});
  },
  afterResolve(){}
});

/* ---- 黒魔術のカーテン: このカードを発動するターン、自分はこのカードの効果以外ではモンスターを召喚・反転召喚・特殊召喚できない。ライフポイントを半分払って
   発動できる。自分のデッキから「ブラック・マジシャン」1体を特殊召喚する。 (like スケープ・ゴート: no summon before; locked after) ---- */
poolSpecS03('黒魔術のカーテン', {action:'summon', pos:'faceUp', filter:{name:'ブラック・マジシャン'}});
defineScript('黒魔術のカーテン', {
  type:'spell', priority:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    const P = API.me(ctx);
    if((P.ssHistory||[]).length || (P.temporaryFlags && P.temporaryFlags.summonedThisTurnS03)){ ctx.reason = 'このターン既にモンスターを召喚・反転召喚・特殊召喚しています'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){ const lp = API.me(ctx).lp; API.payCost(ctx.player, Math.floor(lp/2), '黒魔術のカーテン'); done(true); },
  resolve(ctx){
    const pool = poolS03('黒魔術のカーテン', ctx.player);
    if(!pool.length || !hasMonsterZoneSpace(ctx.player)){ API.shuffle(ctx.player); curtainLockS03(ctx.player); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'黒魔術のカーテン：特殊召喚する「ブラック・マジシャン」', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u206.curtain', args:{player:ctx.player}}, meta:{scriptName:'黒魔術のカーテン'}});
  }
});
/* the turn's summon lock is applied after this card's own summon (the same flags as スケープ・ゴート) */
function curtainLockS03(p){ API.setFlag(p, 'noSummonS03', '黒魔術のカーテン', true); API.setFlag(p, 'noSpecialSummon', true, true); }
registerChoiceHandlerV49('s03u206.curtain', (answer, args)=>{
  if(!answer || !args) return;
  const h = pickOneS03((answer.cards||[])[0]);
  if(h && h.zone==='deck' && h.p===args.player && hasMonsterZoneSpace(args.player)) API.specialSummon(args.player, 'deck', h.index, 'atk', '黒魔術のカーテン');
  curtainLockS03(args.player);
});
declareActivationNegatedReleaseS03('黒魔術のカーテン', {noSpecialSummonWhileChained:true});

/* ---- デーモンとの駆け引き: レベル8以上の自分フィールド上のモンスターが墓地へ送られたターンに発動する事ができる。自分の手札またはデッキから
   「バーサーク・デッド・ドラゴン」1体を特殊召喚する。 (engine: players[p].lv8ToGraveTurnS03, set by FX_TO_GRAVE / FX_WIPE_ZONE / BATTLE_CLEANUP) ---- */
poolSpecS03('デーモンとの駆け引き', {from:['hand','deck'], action:'summon', pos:'faceUp', filter:{name:'バーサーク・デッド・ドラゴン'}});
defineScript('デーモンとの駆け引き', {
  type:'quick-play', priority:2, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(Number(API.me(ctx).lv8ToGraveTurnS03)!==Number(gameState.turn)){ ctx.reason = 'このターン、自分フィールドのレベル8以上のモンスターが墓地へ送られていません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){ askPoolS03(ctx, 'デーモンとの駆け引き', 'デーモンとの駆け引き：特殊召喚する「バーサーク・デッド・ドラゴン」（手札・デッキ）'); }
});

/* ---- 魔轟神獣ペガラサス: このカードが手札から墓地へ捨てられた時、このカードを墓地から裏側守備表示で特殊召喚できる。また、このカードがリバースした時、
   手札の「魔轟神」と名のついたモンスター1体を見せて発動できる。自分のデッキから「魔轟神」と名のついたモンスター1体を墓地へ送る。 ---- */
poolSpecS03('魔轟神獣ペガラサス', {action:'mill', filter:{nameHas:'魔轟神'}});
function pegasusFabledInHandS03(ctx){ return API.pileCards(ctx.player,'hand',x=>x.db.k==='m' && v380bIsFabled(x.card)).length>0; }
defineScript('魔轟神獣ペガラサス', {
  type:'monster', priority:1, activateFrom:['grave'], blocksIfNoSpecialSummon:false,
  condition(ctx){
    if(ctx.eventName==='onDiscardAnyS03'){
      if(ctx.zone!=='grave' || !eventIsSelfS03(ctx)){ ctx.reason = '手札から捨てられた時に発動します'; return false; }
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      return true;
    }
    if(ctx.eventName==='onFlip'){
      if(ctx.zone!=='mz' || !eventIsSelfS03(ctx)){ ctx.reason = 'リバースした時に発動します'; return false; }
      if(!pegasusFabledInHandS03(ctx)){ ctx.reason = '手札に見せる「魔轟神」がいません'; return false; }
      return true;
    }
    ctx.reason = '手札から捨てられた時、またはリバースした時に発動します'; return false;
  },
  resolve(ctx){
    if(ctx.eventName==='onDiscardAnyS03'){
      const me = findCardByUid(ctx.card.uid);
      if(me && me.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', me.index, 'def', '魔轟神獣ペガラサス', null, {faceDown:true});
      return;
    }
    API.log('魔轟神獣ペガラサス：手札の「魔轟神」を見せた');
    askMillS03(ctx, '魔轟神獣ペガラサス', '魔轟神獣ペガラサス：墓地へ送る「魔轟神」');
  },
  afterResolve(){},
  passive:{ onDiscardAnyS03(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx) && hasMonsterZoneSpace(ctx.player); },
            onFlip(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx) && pegasusFabledInHandS03(ctx); } }
});
