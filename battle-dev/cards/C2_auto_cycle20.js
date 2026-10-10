/* Auto cycle 20 — 14枚。engine 変更なし。
     IXA 除外をコスト・トリガーにするカード
     IXB アドバンス召喚の provenance を使うカード

   【実測】アドバンス召喚の provenance も engine に既に存在する。
     applySummonProvenanceP3（00_state_actions.js:117）が
       card.summonProvenance = {summonType:'normal'|'tribute'|'special'|'flip'|'ritual',
                                summonInstance, materialRefs:[uid...], materialSnapshots}
     を書き、**リリースされた側**にも
       card.usedAsMaterial = {summonType, summonInstance, summonedUid, actingPlayer}
     を残す。NORMAL_SUMMON は加えて card.tributeCount / tributeValue を持つ。
     cycle 19 のシンクロ素材と同様、「無さそう」で切らずに実測して確認した。

   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function c9MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function c9FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
/* このカードがアドバンス召喚されたか */
function c9AdvanceSummoned(card){
  const p = card && card.summonProvenance;
  if(p && p.summonType === 'tribute') return true;
  return Number(card && card.tributeCount || 0) > 0;
}
/* そのアドバンス召喚でリリースされたモンスター（墓地にいるもの） */
function c9TributedFor(card){
  const p = card && card.summonProvenance;
  if(!p || p.summonType !== 'tribute') return [];
  const inst = p.summonInstance;
  const out = [];
  (p.materialRefs || []).forEach(uid => {
    const h = findCardByUid(uid);
    if(!h || h.zone !== 'grave') return;
    const u = h.card.usedAsMaterial;
    if(u && u.summonInstance === inst) out.push(h.card);
  });
  return out;
}
/* このカードがアドバンス召喚のリリースとして墓地へ送られたか */
function c9UsedAsTribute(ctx){
  if(ctx.zone !== 'grave') return false;
  const u = ctx.card.usedAsMaterial;
  if(!u || u.summonType !== 'tribute') return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.turn === gameState.turn);
}
/* 相手が発動したモンスター効果か */
function c9FoeMonsterEffect(ctx){
  const e = ctx.event;
  return !!(e && e.player === ctx.opponent && e.kind === 'monster');
}
/* 相手が発動した魔法・罠か */
function c9FoeSpellTrap(ctx){
  const e = ctx.event;
  if(!e || e.player !== ctx.opponent) return false;
  return e.kind === 'spell' || e.kind === 'trap';
}
/* 除外されている自分のカード */
function c9Banished(p, f){ return API.pileCards(p, 'banish', f || (() => true)); }

/* ===================== A. 除外をコストにするカード ===================== */

/* 1. ギョッ! — 除外されている自分の魚族・海竜族・水族1体をデッキに戻して発動。
      効果モンスターの効果の発動を無効にし破壊する */
function c9FishBanished(p){
  return c9Banished(p, x => x.db.k === 'm'
    && (x.db.ra === '魚' || x.db.ra === '海竜' || x.db.ra === '水'));
}
defineScript('ギョッ!', {
  type:'trap', priority:3, targets:true,
  condition(ctx){
    if(!c9FoeMonsterEffect(ctx)){ ctx.reason = '効果モンスターの効果が発動した時に発動します'; return false; }
    if(!c9FishBanished(ctx.player).length){
      ctx.reason = '除外されている魚族・海竜族・水族がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ギョッ!：デッキに戻すモンスター', c9FishBanished(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'banish'){ API.returnToDeck(r, false, 'ギョッ!'); done(true); }
    else done(false);
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'ギョッ!', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return ctx.zone === 'sz' && c9FoeMonsterEffect(ctx) && c9FishBanished(ctx.player).length > 0; } }
});

/* 2. フレムベルカウンター — 墓地の守備力200の炎属性1体を除外して発動。
      魔法・罠カードの発動を無効にし破壊する */
function c9Flamvell200(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.at === '炎'
    && Number(x.db.def) === 200);
}
defineScript('フレムベルカウンター', {
  type:'trap', priority:3, targets:true,
  condition(ctx){
    if(!c9FoeSpellTrap(ctx)){ ctx.reason = '魔法・罠カードが発動した時に発動します'; return false; }
    if(!c9Flamvell200(ctx.player).length){
      ctx.reason = '墓地に守備力200の炎属性モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('フレムベルカウンター：除外する炎属性', c9Flamvell200(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave'){ API.banish(r, 'フレムベルカウンター'); done(true); }
    else done(false);
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'フレムベルカウンター', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return ctx.zone === 'sz' && c9FoeSpellTrap(ctx) && c9Flamvell200(ctx.player).length > 0; } }
});

/* 3. D・D・R — 手札を1枚捨て、除外されている自分のモンスター1体を対象に発動。
      攻撃表示で特殊召喚し、このカードを装備する。
      このカードがフィールドから離れた時、そのモンスターは破壊される */
defineScript('D・D・R', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  equipSpec:{ canEquip(){ return true; } },
  condition(ctx){
    if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!c9Banished(ctx.player, x => x.db.k === 'm').length){
      ctx.reason = '除外されている自分のモンスターがいません'; return false; }
    if(!c9MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('D・D・R：特殊召喚する除外モンスター',
      c9Banished(ctx.player, x => x.db.k === 'm'), t => done([t]));
  },
  cost(ctx, done){
    const hand = API.pileCards(ctx.player, 'hand', () => true);
    if(!hand.length){ done(false); return; }
    API.selectCard('D・D・R：捨てる手札', hand, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){
        API.discard(ctx.player, r.index, 'D・D・R', { byEffect:true, byPlayer:ctx.player });
        done(true);
      }else done(false);
    });
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'banish' || !c9MzOpen(ctx.player)) return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.specialSummon(ctx.player, 'banish', r.index, 'atk', 'D・D・R', r.p);
    const now = findCardByUid(uid);
    const me = locateCardAnyV4(ctx.card);
    if(now && now.zone === 'mz' && me){
      API.equipSpell(me, now, 'D・D・R');
      const eq = locateCardAnyV4(ctx.card);
      /* このカードが離れたら、その特殊召喚したモンスターを破壊する */
      if(eq) API.linkOnLeave(now, eq, 'destroy', 'D・D・R');
    }
  },
  afterResolve(){}
});

/* 4. バーサーカークラッシュ — 墓地のモンスター1体を除外して発動。
      このターンのエンドフェイズ時まで、自分の表側「ハネクリボー」1体の
      攻撃力・守備力は除外したモンスターと同じ数値になる */
function c9Hanewata(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.n === 'ハネクリボー' });
}
defineScript('バーサーカークラッシュ', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!API.pileCards(ctx.player, 'grave', x => x.db.k === 'm').length){
      ctx.reason = '墓地にモンスターがいません'; return false; }
    if(!c9Hanewata(ctx.player).length){
      ctx.reason = '自分フィールドに表側表示の「ハネクリボー」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('バーサーカークラッシュ：除外するモンスター',
      API.pileCards(ctx.player, 'grave', x => x.db.k === 'm'), a =>
      API.selectCard('バーサーカークラッシュ：数値を変える「ハネクリボー」',
        c9Hanewata(ctx.player), b => done([a, b])));
  },
  resolve(ctx){
    const ts = ctx.selectedTargets || [];
    const a = ts[0] && resolveTarget(ts[0]);
    if(!a || a.zone !== 'grave') return;
    const atk = Math.max(0, dbOf(a.card).atk || 0), def = Math.max(0, dbOf(a.card).def || 0);
    const hostCard = ts[1] && resolveTarget(ts[1]) && resolveTarget(ts[1]).card;
    API.banish(a, 'バーサーカークラッシュ');
    const b = hostCard && locateCardAnyV4(hostCard);
    if(b && b.zone === 'mz'){
      API.setAtk(b, atk, 'endTurn', 'バーサーカークラッシュ');
      API.setDef(b, def, 'endTurn', 'バーサーカークラッシュ');
    }
  },
  afterResolve(){}
});

/* 5. ファイヤー・ソウル — 相手は1枚ドローする。自分のデッキから炎族1体を除外し、
      その攻撃力の半分のダメージを与える。発動するターン、自分は攻撃宣言できない */
function c9FireRaceDeck(p){
  return API.pileCards(p, 'deck', x => x.db.k === 'm' && x.db.ra === '炎');
}
defineScript('ファイヤー・ソウル', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!c9FireRaceDeck(ctx.player).length){ ctx.reason = 'デッキに炎族モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ファイヤー・ソウル：除外する炎族', c9FireRaceDeck(ctx.player), t => done([t]));
  },
  resolve(ctx){
    /* テキスト順どおり、まず相手がドローする */
    if((gameState.players[ctx.opponent].deck || []).length) API.draw(ctx.opponent, 1);
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'deck') return;
    const atk = Math.max(0, dbOf(r.card).atk || 0);
    API.banish(r, 'ファイヤー・ソウル');
    if(atk > 0) API.damageLP(ctx.opponent, Math.floor(atk / 2));
    API.setFlag(ctx.player, 'c9FireSoulTurn', gameState.turn, true);
  },
  afterResolve(){},
  continuous:{
    scope:'ownMonsters', from:['sz','grave'],
    apply(){ return null; },
    cannotAttack(card, self){
      const me = locateCard(self) || locateCardAnyV4(self);
      const loc = locateCard(card);
      if(!me || !loc || loc.p !== me.p) return false;
      const f = gameState.players[loc.p] && gameState.players[loc.p].temporaryFlags;
      return !!(f && Number(f.c9FireSoulTurn) === gameState.turn);
    }
  }
});

/* 6. レクンガ — 自分の墓地の水属性2体が除外される度に、
      「レクンガトークン」1体を攻撃表示で特殊召喚する */
function c9WaterBanishedNow(ctx){
  const e = ctx.event || {};
  return b2SummonedCards(e).filter(c => {
    const h = locateCardAnyV4(c);
    if(!h || h.zone !== 'banish' || h.p !== ctx.player) return false;
    const b = c.banishInfo;
    if(!(b && b.from === 'grave')) return false;
    return dbOf(c).at === '水' && dbOf(c).k === 'm';
  }).length;
}
defineScript('レクンガ', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    if(!c9FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(c9WaterBanishedNow(ctx) < 2){
      ctx.reason = '自分の墓地の水属性モンスター2体が除外された時に発動します'; return false; }
    if(!c9MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    API.createToken(ctx.player,
      { key:'レクンガトークン', name:'レクンガトークン',
        atk:700, def:700, lv:2, ra:'植物', at:'水', pos:'atk' }, 1);
  },
  afterResolve(){},
  passive:{ onRemove(ctx){
    return c9FaceUpMz(ctx) && c9WaterBanishedNow(ctx) >= 2 && c9MzOpen(ctx.player); } }
});

/* 7. スカイオニヒトクイエイ — 直接攻撃できる。直接攻撃を行ったバトルフェイズ終了時、
      次の自分のスタンバイフェイズ時までゲームから除外される */
API.registerScheduleHandler('c9.skyRay', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'banish' && c9MzOpen(p))
    API.specialSummon(p, 'banish', h.index, 'atk', 'スカイオニヒトクイエイ', h.p);
});
function c9DirectAttacked(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  const bp = gameState.battlePhaseV6;
  const list = (bp && Array.isArray(bp.attacks)) ? bp.attacks : [];
  return list.some(a => a && a.attackerUid === me.card.uid && a.defenderUid == null);
}
defineScript('スカイオニヒトクイエイ', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  canDirectAttack:true,
  condition(ctx){
    if(!c9DirectAttacked(ctx)){ ctx.reason = '直接攻撃を行ったバトルフェイズ終了時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    const uid = me.card.uid;
    API.banish(me, 'スカイオニヒトクイエイ');
    API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player, handler:'c9.skyRay',
                   args:{ uid:uid, player:ctx.player }, source:{ card:ctx.card },
                   note:'スカイオニヒトクイエイ' });
  },
  afterResolve(){},
  passive:{ onBattlePhaseEnd(ctx){ return c9DirectAttacked(ctx); } }
});

/* 8. フォーチュン・スリップ — 相手モンスターの攻撃宣言時に発動。
      その攻撃を無効にし、攻撃対象モンスター1体を次のスタンバイフェイズ時まで除外する */
API.registerScheduleHandler('c9.fortuneSlip', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'banish' && c9MzOpen(p))
    API.specialSummon(p, 'banish', h.index, 'atk', 'フォーチュン・スリップ', h.p);
});
function c9AttackTargetCard(){
  const a = gameState.pendingAttack;
  if(!a || a.target == null || a.target === 'direct') return null;
  const foe = a.player === 0 ? 1 : 0;
  return (gameState.players[foe].mz || [])[a.target] || null;
}
defineScript('フォーチュン・スリップ', {
  type:'trap', priority:2,
  condition(ctx){
    const a = gameState.pendingAttack;
    if(!a || a.player !== ctx.opponent){
      ctx.reason = '相手モンスターの攻撃宣言時に発動します'; return false; }
    if(!c9AttackTargetCard()){ ctx.reason = '攻撃対象モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const victim = c9AttackTargetCard();
    API.negateAttack('フォーチュン・スリップ');
    const h = victim && locateCardAnyV4(victim);
    if(!h || h.zone !== 'mz') return;
    ensureCardUid(gameState, h.card);
    const uid = h.card.uid, owner = h.p;
    API.banish(h, 'フォーチュン・スリップ');
    API.schedule({ at:'standbyPhase', turns:(gameState.activePlayer === owner ? 2 : 1),
                   player:owner, handler:'c9.fortuneSlip',
                   args:{ uid:uid, player:owner }, source:{ card:ctx.card },
                   note:'フォーチュン・スリップ' });
  },
  afterResolve(){}
});

/* 9. エレメンタル・アブソーバー — 手札のモンスター1枚を除外する。
      除外したモンスターと同じ属性を持つ相手モンスターは、
      このカードがフィールドに存在する限り攻撃宣言できない */
defineScript('エレメンタル・アブソーバー', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!API.pileCards(ctx.player, 'hand', x => x.db.k === 'm').length){
      ctx.reason = '手札にモンスターカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('エレメンタル・アブソーバー：除外する手札のモンスター',
      API.pileCards(ctx.player, 'hand', x => x.db.k === 'm'), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'hand') return;
    const at = dbOf(r.card).at;
    API.banish(r, 'エレメンタル・アブソーバー');
    const me = locateCardAnyV4(ctx.card);
    if(me && at) API.setCardFlag(me, 'c9AbsorbedAttr', String(at), 'エレメンタル・アブソーバー');
  },
  afterResolve(){},
  continuous:{
    scope:'oppMonsters', from:['sz'],
    apply(){ return null; },
    cannotAttack(card, self){
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'sz' || h.card.face !== 'up') return false;
      const at = h.card.c9AbsorbedAttr;
      return !!at && dbOf(card).at === at;
    }
  }
});

/* ===================== B. アドバンス召喚の provenance ===================== */

/* 11. 三連星のトリオン — アドバンス召喚のリリースとして墓地へ送られたターンの
       エンドフェイズ時、このカードを墓地から特殊召喚できる */
API.registerScheduleHandler('c9.trion', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'grave' && c9MzOpen(p))
    API.specialSummon(p, 'grave', h.index, 'atk', '三連星のトリオン', h.p);
});
defineScript('三連星のトリオン', {
  type:'monster', priority:1, activateFrom:['grave'],
  condition(ctx){
    if(!c9UsedAsTribute(ctx)){
      ctx.reason = 'アドバンス召喚のリリースとして墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave') return;
    ensureCardUid(gameState, me.card);
    API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'c9.trion',
                   args:{ uid:me.card.uid, player:ctx.player }, source:{ card:ctx.card },
                   note:'三連星のトリオン' });
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return c9UsedAsTribute(ctx); } }
});

/* 12. スパウン・アリゲーター — 爬虫類族をリリースしてアドバンス召喚に成功した場合、
       そのリリースしたモンスター1体をそのターンのエンドフェイズ時に
       墓地から自分フィールドに特殊召喚する */
API.registerScheduleHandler('c9.spawnAlligator', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'grave' && c9MzOpen(p))
    API.specialSummon(p, 'grave', h.index, 'atk', 'スパウン・アリゲーター', h.p);
});
function c9SpawnReptileTributes(ctx){
  return c9TributedFor(ctx.card).filter(c => dbOf(c).ra === '爬虫類');
}
defineScript('スパウン・アリゲーター', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['mz'],
  condition(ctx){
    if(!c9FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(Number(ctx.card.summonedTurn) !== gameState.turn){
      ctx.reason = 'アドバンス召喚に成功したターンに発動します'; return false; }
    if(!c9SpawnReptileTributes(ctx).length){
      ctx.reason = '爬虫類族をリリースしてアドバンス召喚していません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = c9SpawnReptileTributes(ctx).map(c => locateCardAnyV4(c)).filter(Boolean);
    if(!q.length){ done([]); return; }
    API.selectCard('スパウン・アリゲーター：特殊召喚するリリースしたモンスター', q, t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave') return;
    ensureCardUid(gameState, r.card);
    API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'c9.spawnAlligator',
                   args:{ uid:r.card.uid, player:ctx.player }, source:{ card:ctx.card },
                   note:'スパウン・アリゲーター' });
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    return c9FaceUpMz(ctx) && Number(ctx.card.summonedTurn) === gameState.turn
      && c9SpawnReptileTributes(ctx).length > 0; } }
});

/* 13. ヘルフレイムエンペラー — 特殊召喚できない。
       アドバンス召喚に成功した時、墓地の炎属性を5体まで除外し、
       除外した数だけフィールドの魔法・罠を破壊できる */
API.registerChoiceHandler('c9.hellflame', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const picked = (answer && answer.cards ? answer.cards : []);
  const rs = picked.map(x => resolveTarget(x)).filter(r => r && r.zone === 'grave');
  if(!rs.length) return;
  rs.sort((a, b) => b.index - a.index).forEach(r => API.banish(r, 'ヘルフレイムエンペラー'));
  API.setFlag(p, 'c9HellflameCount', rs.length, true);
});
function c9FireGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.at === '炎');
}
defineScript('ヘルフレイムエンペラー', {
  type:'monster', priority:1, activateFrom:['mz'],
  cannotSpecialSummon:true,
  condition(ctx){
    if(!c9FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(Number(ctx.card.summonedTurn) !== gameState.turn || !c9AdvanceSummoned(ctx.card)){
      ctx.reason = 'アドバンス召喚に成功した時に発動します'; return false; }
    if(!c9FireGrave(ctx.player).length){ ctx.reason = '墓地に炎属性モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const max = Math.min(5, c9FireGrave(ctx.player).length);
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:max,
      title:'ヘルフレイムエンペラー：除外する墓地の炎属性（最大' + max + '体）',
      candidates: c9FireGrave(ctx.player),
      resume:{ handler:'c9.hellflame', args:{ player:ctx.player } }
    });
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    return c9FaceUpMz(ctx) && Number(ctx.card.summonedTurn) === gameState.turn
      && c9AdvanceSummoned(ctx.card) && c9FireGrave(ctx.player).length > 0; } }
});

/* 14. 死霊操りしパペットマスター — アドバンス召喚に成功した時、2000払い、
       自分の墓地の悪魔族2体を対象に発動。特殊召喚する。
       この効果で特殊召喚したモンスターはこのターン攻撃できない */
function c9FiendGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === '悪魔');
}
defineScript('死霊操りしパペットマスター', {
  type:'monster', priority:1, targets:true, activateFrom:['mz'],
  condition(ctx){
    if(!c9FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(Number(ctx.card.summonedTurn) !== gameState.turn || !c9AdvanceSummoned(ctx.card)){
      ctx.reason = 'アドバンス召喚に成功した時に発動します'; return false; }
    if(API.me(ctx).lp <= 2000){ ctx.reason = '2000ライフポイントを払えません'; return false; }
    if(c9FiendGrave(ctx.player).length < 2){ ctx.reason = '墓地に悪魔族モンスターが2体必要です'; return false; }
    if((gameState.players[ctx.player].mz || []).length > ZONE_LIMITS.mz - 2){
      ctx.reason = 'モンスターゾーンに空きが足りません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 2000); done(true); },
  selectTargets(ctx, done){
    const q = c9FiendGrave(ctx.player);
    API.selectCard('死霊操りしパペットマスター：特殊召喚する悪魔族（1体目）', q, a => {
      const rest = c9FiendGrave(ctx.player)
        .filter(x => !(x.p === a.p && x.zone === a.zone && x.index === a.index));
      API.selectCard('死霊操りしパペットマスター：特殊召喚する悪魔族（2体目）', rest, b => done([a, b]));
    });
  },
  resolve(ctx){
    const cards = (ctx.selectedTargets || []).map(t => resolveTarget(t))
      .filter(r => r && r.zone === 'grave').map(r => r.card);
    cards.forEach(c => {
      const h = locateCardAnyV4(c);
      if(!h || h.zone !== 'grave' || !c9MzOpen(ctx.player)) return;
      ensureCardUid(gameState, h.card);
      const uid = h.card.uid;
      API.specialSummon(ctx.player, 'grave', h.index, 'atk', '死霊操りしパペットマスター', h.p);
      const now = findCardByUid(uid);
      if(now && now.zone === 'mz')
        API.setCardFlag(now, 'c9PuppetNoAttackTurn', gameState.turn, '死霊操りしパペットマスター');
    });
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    return c9FaceUpMz(ctx) && Number(ctx.card.summonedTurn) === gameState.turn
      && c9AdvanceSummoned(ctx.card) && API.me(ctx).lp > 2000
      && c9FiendGrave(ctx.player).length >= 2; } },
  continuous:{
    scope:'ownMonsters', from:['mz'],
    apply(){ return null; },
    cannotAttack(card){
      return Number(card && card.c9PuppetNoAttackTurn || -1) === gameState.turn;
    }
  }
});

/* 15. 混沌球体 — 表側表示で存在する限り光属性としても扱う。
       1ターンに1度だけ戦闘では破壊されない。
       アドバンス召喚に成功した時、デッキからレベル3モンスター1体を手札に加えられる */
function c9Lv3Deck(p){
  return API.pileCards(p, 'deck', x => x.db.k === 'm' && Number(x.db.lv) === 3);
}
defineScript('混沌球体', {
  type:'monster', priority:1, targets:true, activateFrom:['mz'],
  condition(ctx){
    if(!c9FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(Number(ctx.card.summonedTurn) !== gameState.turn || !c9AdvanceSummoned(ctx.card)){
      ctx.reason = 'アドバンス召喚に成功した時に発動します'; return false; }
    if(!c9Lv3Deck(ctx.player).length){ ctx.reason = 'デッキにレベル3モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('混沌球体：手札に加えるレベル3モンスター', c9Lv3Deck(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'deck') API.returnToHand(r, '混沌球体');
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    return c9FaceUpMz(ctx) && Number(ctx.card.summonedTurn) === gameState.turn
      && c9AdvanceSummoned(ctx.card) && c9Lv3Deck(ctx.player).length > 0; } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    /* 表側表示の間は光属性としても扱う（v17 の attrOverride） */
    attrOverride(card, self){
      if(card !== self || card.face !== 'up') return null;
      return '光';
    },
    protectV21:{
      key:'混沌球体', label:'混沌球体', perTurn:1,
      battle: (target, self) => target === self
    }
  }
});
