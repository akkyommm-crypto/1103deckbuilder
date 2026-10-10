/* S03-U68: C-S03-27 ACTIVATION_NEGATED_RELEASE secondary — the "other 1ターンに1枚しか発動できない" cards
   left undeclared by S03-U34 (see docs/S03_U34_REPORT.md / logs/CAPABILITY_NOTES.md C-S03-27's own
   "② Remaining"): オーバー・レンチ, 無欲な壺, 限定解除 (all NOT_STARTED — new scripts), 魔力掌握 (was
   AUTO_DECK_TABLE coarse — replaced with a real script, same precedent as S03-U33/U67 for other
   AUTO_DECK_TABLE entries: a literal defineScript is never overwritten by the table loader,
   `if(CARD_SCRIPTS[nm]) return;` in cards/40_auto_interpreter.js). Each is declared through
   `declareActivationNegatedReleaseS03(name, {count:true})` so a negated activation refunds the
   once-per-turn-by-name count (2011 wiki 10/05/19 ruling for 強欲で謙虚な壺, the same general OCG principle
   this session applies to every other "1ターンに1枚" card here — none of the five have any published
   card-specific exception to that general rule).

   黒羽の宝札 (already scripted, cards/38_1103_expansion_v380.js) had a real bug fixed here too: it set
   `noSpecialSummon` in `cost()` (unconditionally, before the chain even forms), rather than in `resolve()`
   like every other C-S03-27 card (強欲で謙虚な壺 itself, cards/00_generic_core.js, sets its own
   `noSpecialSummon` inside `resolve()`) — meaning a negated activation still permanently locked Special
   Summons for the rest of the turn, which the *general* declarative-restriction-applies-from-activation
   reading ("...このカードを発動するターン、自分はモンスターを特殊召喚できない" is phrased exactly like
   Instant Fusion's well-established "the turn you activate this card" ruling shape) does not actually
   require: the C-S03-27 engine (`noSpecialSummonWhileChained`) already blocks Special Summons for the whole
   window the card is on the chain and not yet activation-negated — the card only needs to make the lock
   *persist after resolution*, which correctly should not happen when the activation itself never resolved.
   Moved the flag-set into `resolve()` and declared `noSpecialSummonWhileChained:true` alongside `count:true`. */

/* ---- オーバー・レンチ ---- */
/* S03-U68: registerScheduleHandler の callback は (args, entry) — args が既に entry.args を展開したもの
   （runDueSchedulesV7: fn(Object.assign({}, e.args||{}), e)）。args.uid で読む（entry.args.uid ではない）。 */
API.registerScheduleHandler('s03u68.over-wrench-return', (args) => {
  const uid = args && args.uid;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz') API.returnToHand(h, 'オーバー・レンチ');
});
defineScript('オーバー・レンチ', {
  type:'trap', priority:2, targets:true, timing:['chain','free'],
  condition(ctx){
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && isSetCardV4(x.db, SETCODE.WIND_UP)}).length){
      ctx.reason = '自分フィールドに表側表示の「ゼンマイ」がいません'; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('オーバー・レンチ：対象とする「ゼンマイ」',
      API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && isSetCardV4(x.db, SETCODE.WIND_UP)}), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    const h = t && resolveTarget(t);
    if(!h || h.zone !== 'mz') return;
    API.modAtk(h, dbOf(h.card).atk || 0, dbOf(h.card).def || 0, 'leave', 'オーバー・レンチ');
    API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'s03u68.over-wrench-return',
      args:{uid:h.card.uid}, source:{card:ctx.card}, note:'オーバー・レンチ'});
  },
  afterResolve(){}
});
declareActivationNegatedReleaseS03('オーバー・レンチ', {count:true});

/* ---- 無欲な壺 ---- */
defineScript('無欲な壺', {
  type:'spell', priority:1,
  condition(ctx){
    if(API.pileCards(0,'grave').length + API.pileCards(1,'grave').length < 2){
      ctx.reason = '自分・相手の墓地に存在するカードが合計2枚未満です'; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    const pool = ()=>API.pileCards(0,'grave').concat(API.pileCards(1,'grave'));
    API.selectCard('無欲な壺：デッキに戻すカード 1/2', pool(), a=>{
      const ra = resolveTarget(a);
      const remain = pool().filter(x=>x.card !== (ra && ra.card));
      API.selectCard('無欲な壺：デッキに戻すカード 2/2', remain, b=>done([a,b]));
    });
  },
  resolve(ctx){
    ctx.selectedTargets.forEach(t=>{
      const h = resolveTarget(t);
      if(h && h.zone === 'grave') API.returnToDeck(h, false, '無欲な壺');
    });
  },
  afterResolve(ctx){
    /* 発動後、破壊されずに除外される（afterResolve を持たせて既定の墓地送りを止め、明示的に除外する）。 */
    const h = locateCardAnyV4(ctx.card);
    if(h) API.banish(h, '無欲な壺');
  }
});
declareActivationNegatedReleaseS03('無欲な壺', {count:true});

/* ---- 限定解除 ---- */
API.registerScheduleHandler('s03u68.restriction-removal-destroy', (args) => {
  const uid = args && args.uid;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz') API.destroy(h, '限定解除');
});
API.registerChoiceHandler('s03u68.restriction-removal-summon', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(!h || h.zone !== 'hand') return;
  API.specialSummon(args.player, 'hand', h.index, 'atk', '限定解除');
  const now = locateCardAnyV4(h.card);
  if(now && now.zone === 'mz'){
    API.setCardFlag(now, 'cannotAttack', true, '限定解除');
    API.schedule({at:'endPhase', turns:0, player:args.player, handler:'s03u68.restriction-removal-destroy',
      args:{uid:now.card.uid}, source:{card:null}, note:'限定解除'});
  }
});
defineScript('限定解除', {
  type:'spell', priority:1,
  condition(ctx){
    if(API.me(ctx).lp < 1000){ ctx.reason = 'LPが1000未満です'; return false; }
    if(!handCandidates(ctx, x=>(x.db.st||[]).includes('儀式')).length){ ctx.reason = '手札に儀式モンスターがいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 1000); done(true); },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    /* S03-U68: 対象を取らない効果なので、解決時（現在の手札）から選ぶ（S03-U58パターン）。 */
    const pool = handCandidates(ctx, x=>(x.db.st||[]).includes('儀式'));
    if(!pool.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'限定解除：特殊召喚する儀式モンスター',
      candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u68.restriction-removal-summon', args:{player:ctx.player}},
      meta:{scriptName:'限定解除'}});
  },
  afterResolve(){}
});
declareActivationNegatedReleaseS03('限定解除', {count:true});

/* ---- 魔力掌握 ---- */
API.registerChoiceHandler('s03u68.spell-power-grasp-search', (answer, args) => {
  if(answer.cancelled || !(answer.cards[0] && answer.cards[0].value === true)) return;
  const pool = API.pileCards(args.player, 'deck', x=>x.db.n === '魔力掌握');
  if(!pool.length) return;
  API.searchDeck(args.player, pool[0].index, '魔力掌握');
});
defineScript('魔力掌握', {
  type:'spell', priority:1, targets:true,
  condition(ctx){
    if(!API.counterCapableCards(ctx.player, '魔力').length){ ctx.reason = '魔力カウンターを置けるカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('魔力掌握：魔力カウンターを置くカード', API.counterCapableCards(ctx.player, '魔力'), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    const h = t && resolveTarget(t);
    if(h) API.addCounter(h, '魔力', 1);
    if(!API.pileCards(ctx.player, 'deck', x=>x.db.n === '魔力掌握').length) return;
    API.requestChoice({player:ctx.player, kind:'yesno', title:'魔力掌握',
      note:'デッキから「魔力掌握」を手札に加えますか？',
      candidates:[{key:'yes', label:'はい', value:true}, {key:'no', label:'いいえ', value:false}],
      min:1, max:1, cancelable:false,
      resume:{handler:'s03u68.spell-power-grasp-search', args:{player:ctx.player}},
      meta:{scriptName:'魔力掌握'}});
  },
  afterResolve(){}
});
declareActivationNegatedReleaseS03('魔力掌握', {count:true});

/* ---- 黒羽の宝札：既存スクリプトのバグ修正（cost() ではなく resolve() で noSpecialSummon を立てる） ---- */
defineScript('黒羽の宝札', {
  type:'spell', priority:1, countLimit:1, nameLimit:true,
  condition(ctx){
    if((API.me(ctx).ssHistory||[]).some(x=>x.turn===gameState.turn)){ ctx.reason='このターン既に特殊召喚しています'; return false; }
    if(API.me(ctx).deck.length < 2){ ctx.reason = 'デッキが2枚未満です'; return false; }
    if(!API.pileCards(ctx.player, 'hand', x=>x.card !== ctx.card && v380IsBF(x.card)).length){ ctx.reason = '手札に除外するBFがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('黒羽の宝札：除外する手札のBF', API.pileCards(ctx.player, 'hand', x=>x.card !== ctx.card && v380IsBF(x.card)), t=>{
      API.banish(t, '黒羽の宝札（コスト）'); done(true);
    });
  },
  resolve(ctx){
    /* S03-U68: 発動が無効になった場合はここへ到達しない。強欲で謙虚な壺と同じ位置（resolve）で立てる。 */
    API.setFlag(ctx.player, 'noSpecialSummon', true, true);
    API.draw(ctx.player, 2);
  }
});
declareActivationNegatedReleaseS03('黒羽の宝札', {count:true, noSpecialSummonWhileChained:true});
