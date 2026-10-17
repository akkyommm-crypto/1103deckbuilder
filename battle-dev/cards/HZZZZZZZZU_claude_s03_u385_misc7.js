/* S03-U385: five NOT_STARTED cards (carddata texts).

   紅蓮魔竜の壺        （通常魔法）自分フィールド上に「レッド・デーモンズ・ドラゴン」が表側表示で存在する場合のみ発動する事ができる。自分のデッキからカードを2枚ドローする。このカードを発動する場合、次の相手ターン終了時まで自分はモンスターを召喚・特殊召喚する事はできない。
   究極・背水の陣      （通常罠）ライフポイントを100ポイントになるように払って発動できる。自分の墓地の「六武衆」と名のついたモンスターを可能な限り特殊召喚する。（同名カードは1枚まで。ただし、フィールド上に存在する同名カードは特殊召喚できない。）
   ゼンマイマニュファクチャ （永続魔法）「ゼンマイ」と名のついたモンスターの効果が発動した場合、自分のデッキからレベル4以下の「ゼンマイ」と名のついたモンスター1体を手札に加える事ができる。この効果は1ターンに1度しか使用できない。
   邪狂神の使い        相手のスタンバイフェイズ時に1度だけ、自分の墓地に存在する闇属性モンスターを任意の枚数ゲームから除外する事ができる。エンドフェイズ時まで、このカードの守備力はこの効果で除外したモンスターの数×500ポイントアップする。
   不吉な占い          （永続罠）自分のスタンバイフェイズ時、相手の手札からカードを1枚ランダムに選択する。そのカードの種類(モンスター・魔法・罠)を当てた場合、相手プレイヤーに700ポイントダメージを与える。この効果は1ターンに1度しか使用できない。

   Notes
   - 紅蓮魔竜の壺: the ban on my own Normal / Special Summons is banSummonS03 (engine/1ZZS, S03-U384) for this turn and the opponent's next turn (Flip Summon is not 「召喚」).
   - 究極・背水の陣: the cost pays LP-100 (needs more than 100 LP); one 「六武衆」 monster per name from the Graveyard, none whose name is on the field (either side), as many as the free zones (`GROUP.SIX_SAMURAI_NAMED`).
   - ゼンマイマニュファクチャ: onActivateSuccess of a 「ゼンマイ」 monster effect (any controller's, as the text does not name one) -> optional search of a Level 4 or lower 「ゼンマイ」; once per turn (u331Zen, S03-U331).
   - 邪狂神の使い: an optional trigger of the opponent's Standby Phase; the cost banishes any number of DARK monsters of my Graveyard (free multi-pick); DEF +500 each as a stat modifier until the End Phase.
   - 不吉な占い: at my Standby Phase a random card of the opponent's hand is picked (duelRandomInt) and parked in a card flag, I declare 魔法 / 罠 / モンスター (a declare choice), 700 damage when right. */

/* ---- 紅蓮魔竜の壺 ---- */
defineScript('紅蓮魔竜の壺', {
  type:'spell', priority:1, targets:false,
  condition(ctx){
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='レッド・デーモンズ・ドラゴン'}).length){ ctx.reason = '自分フィールドに表側表示の「レッド・デーモンズ・ドラゴン」が存在しません'; return false; }
    if(API.me(ctx).deck.length<2){ ctx.reason = 'デッキのカードが足りません'; return false; }
    return true;
  },
  resolve(ctx){
    API.draw(ctx.player, 2);
    banSummonS03(ctx.player, gameState.turn, gameState.turn+1, ['normal','special'], {}, '紅蓮魔竜の壺');
  },
  afterResolve(){}
});

/* ---- 究極・背水の陣 ---- */
function u385Samurai(ctx){
  const field = []; [0,1].forEach(q=>(gameState.players[q].mz||[]).forEach(c=>{ if(c) field.push(dbOf(c).n); }));
  const seen = {}, out = [];
  API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && isCardInGroupV4(x.card, GROUP.SIX_SAMURAI_NAMED)).forEach(x=>{
    if(seen[x.db.n] || field.indexOf(x.db.n)>=0 || !canEffectSpecialSummonS03(x.card, 'grave', '究極・背水の陣')) return;
    seen[x.db.n] = true; out.push(x);
  });
  return out;
}
defineScript('究極・背水の陣', {
  type:'trap', priority:2, targets:false, includesSpecialSummon:true,
  condition(ctx){
    if(API.me(ctx).lp<=100){ ctx.reason = 'ライフポイントが100より多い必要があります'; return false; }
    if(!u385Samurai(ctx).length){ ctx.reason = '墓地に特殊召喚できる「六武衆」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const lpNow = API.me(ctx).lp; if(lpNow<=100){ done(false); return; } API.payCost(ctx.player, lpNow-100); done(true); },
  resolve(ctx){
    u385Samurai(ctx).forEach(x=>{
      if(!hasMonsterZoneSpace(ctx.player)) return;
      const h = findCardByUid(ensureCardUid(gameState, x.card));
      if(h && h.zone==='grave') API.specialSummon(ctx.player, 'grave', h.index, 'atk', '究極・背水の陣');
    });
  },
  afterResolve(){}
});

/* ---- ゼンマイマニュファクチャ ---- */
function u385ZenEffect(ctx){
  const e = ctx.event;
  if(ctx.zone!=='sz' || ctx.card.face!=='up' || ctx.card.activationPending || !e || e.kind!=='monster' || e.cardId==null) return false;
  return u331Zen(CARD_DB[e.cardId]);
}
function u385ZenPool(p){ return API.pileCards(p, 'deck', x=>x.db.k==='m' && u331Zen(x.db) && Number(x.db.lv)<=4); }
defineUnifiedCardV4('ゼンマイマニュファクチャ', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){ return !(ctx.zone==='sz' && ctx.card.face==='up'); }, operation(){}, afterResolve(){}
}, {
  key:'search', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onActivateSuccess'],
  condition(ctx){ return u385ZenEffect(ctx) && u385ZenPool(ctx.player).length>0; },
  operation(ctx){
    const pool = u385ZenPool(ctx.player); if(!pool.length) return;
    API.selectCard('ゼンマイマニュファクチャ：手札に加えるレベル4以下の「ゼンマイ」', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='deck' && r.p===ctx.player) API.searchDeck(ctx.player, r.index, 'ゼンマイマニュファクチャ'); });
  },
  afterResolve(){}
}], {type:'spell', priority:1, countLimit:{n:1, effects:['search']}, passive:{ onActivateSuccess(ctx){ return u385ZenEffect(ctx) && u385ZenPool(ctx.player).length>0; } } });

/* ---- 邪狂神の使い ---- */
function u385DarkGrave(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.at==='闇'); }
function u385Envoy(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player!==gameState.activePlayer && gameState.phase==='standby' && u385DarkGrave(ctx).length>0 && !u342Bad(); }
defineUnifiedCardV4('邪狂神の使い', [{
  key:'devour', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'],
  condition(ctx){ return u385Envoy(ctx); },
  cost(ctx, done){
    const pool = u385DarkGrave(ctx);
    v46PickAnyAtLeastOne('邪狂神の使い：ゲームから除外する闇属性モンスター', pool, pool.length, picked=>{
      if(!picked.length){ done(false); return; }
      API.setFlag(ctx.player, 'u385EnvoyN', picked.length, true);
      picked.slice().sort((a,b)=>b.index-a.index).forEach(t=>{ const h = findCardByUid(ensureCardUid(gameState, t.card)); if(h && h.zone==='grave') API.banish(h, '邪狂神の使い（コスト）'); });
      done(true);
    });
  },
  operation(ctx){
    const n = Number(API.getFlag(ctx.player, 'u385EnvoyN'))||0; if(n<=0) return;
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz' || me.card.face!=='up') return;
    v4RegisterStatModifier(me, {def:500*n}, {code:'邪狂神の使い', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], passive:{ onStandbyPhase(ctx){ return u385Envoy(ctx); } } });

/* ---- 不吉な占い ---- */
const U385_TYPES = [{key:'m', label:'モンスター'}, {key:'s', label:'魔法'}, {key:'t', label:'罠'}];
API.registerChoiceHandler('u385.omen', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const pick = (a.cards || [])[0];
  const guess = pick && (pick.value || pick.key);
  const h = findCardByUid(x.uid);
  if(!h || h.zone!=='hand' || h.p!==x.opponent) return;
  const actual = dbOf(h.card).k;
  const g = ({m:'m', s:'s', t:'t', 'モンスター':'m', '魔法':'s', '罠':'t'})[guess] || guess;
  API.log(`不吉な占い：宣言「${g}」／実際「${actual}」`);
  if(g===actual) API.damageLP(x.opponent, 700, '不吉な占い');
});
function u385Omen(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && ctx.player===gameState.activePlayer && gameState.phase==='standby' && gameState.players[ctx.opponent].hand.length>0; }
defineUnifiedCardV4('不吉な占い', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ return !(ctx.zone==='sz' && ctx.card.face==='up'); }, operation(){}, afterResolve(){}
}, {
  key:'omen', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u385Omen(ctx); },
  operation(ctx){
    const H = gameState.players[ctx.opponent].hand; if(!H.length) return;
    const i = (typeof duelRandomInt==='function') ? duelRandomInt(H.length) : 0;
    const uid = ensureCardUid(gameState, H[i]);
    API.requestChoice({player:ctx.player, kind:'declare', title:'不吉な占い：相手の手札のランダムな1枚の種類を宣言',
      candidates:U385_TYPES.map(t=>({key:t.key, label:t.label, value:t.key})), min:1, max:1, cancelable:false,
      resume:{handler:'u385.omen', args:{player:ctx.player, opponent:ctx.opponent, uid}}, meta:{scriptName:'不吉な占い'}});
  },
  afterResolve(){}
}], {type:'trap', priority:2, forced:true, countLimit:{n:1, effects:['omen']}, passive:{ onStandbyPhase(ctx){ return u385Omen(ctx); } } });
