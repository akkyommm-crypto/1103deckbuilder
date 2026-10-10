/* Auto cycle 38 — 8枚。engine 変更なし。
     XXVIIA トークン生成（defineTokenSpecV11 / createTokens）
     XXVIIB コイントス（duelRandomInt で Replay 安全に）
     XXVIIC 通常モンスターをリリースして装備を強化する
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function e7MzOpen(p, n){
  return (gameState.players[p].mz || []).length + (Number(n) || 1) <= ZONE_LIMITS.mz;
}
function e7MyTurn(p){ return gameState.activePlayer === p; }
function e7MainPhase(p){
  return (gameState.phase === 'main1' || gameState.phase === 'main2') && e7MyTurn(p);
}
function e7FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
/* コイントス。Replay 安全な RNG を使う。0=表 / 1=裏 */
function e7Coin(){ return duelRandomInt(2, gameState) === 0 ? '表' : '裏'; }
/* 表／裏を当てさせる選択肢 */
function e7CoinCandidates(){
  return [{ key:'omote', label:'表', value:'表' },
          { key:'ura',   label:'裏', value:'裏' }];
}

/* ---- トークン定義 ---- */
defineTokenSpecV11('クローントークン',
  { name:'クローントークン', atk:0, def:0, lv:1, ra:'', at:'', pos:'atk' });
defineTokenSpecV11('ツクシトークン',
  { name:'ツクシトークン', atk:0, def:0, lv:1, ra:'植物', at:'風', pos:'def' });
defineTokenSpecV11('トリッキートークン',
  { name:'トリッキートークン', atk:2000, def:1200, lv:5, ra:'魔法使い', at:'風', pos:'def' });
defineTokenSpecV11('マルチプルトークン',
  { name:'マルチプルトークン', atk:1200, def:1200, lv:4, ra:'機械', at:'光', pos:'atk' });
defineTokenSpecV11('ムーントークン',
  { name:'ムーントークン', atk:0, def:0, lv:1, ra:'天使', at:'光', pos:'atk' });

/* ===================== A. トークン生成 ===================== */

/* 1. クローン複製 — 相手がモンスターの召喚・反転召喚に成功した時、そのモンスターを対象に発動。
      その元々の種族・属性・レベル・攻撃力・守備力を持つ「クローントークン」1体を
      自分フィールドに特殊召喚する。
      対象のモンスターが破壊され墓地へ送られた時、このトークンは破壊される */
function e7FoeJustSummoned(ctx){
  const e = ctx.event || {};
  const cards = b2SummonedCards(e);
  for(const c of cards){
    const h = locateCardAnyV4(c);
    if(!h || h.zone !== 'mz' || h.p !== ctx.opponent) continue;
    if(h.card.face !== 'up') continue;
    return h;
  }
  return null;
}
defineScript('クローン複製', {
  type:'trap', priority:2, activateFrom:['sz'], timing:['free'],
  condition(ctx){
    if(!e7FoeJustSummoned(ctx)){
      ctx.reason = '相手がモンスターの召喚・反転召喚に成功した時に発動します'; return false; }
    if(!e7MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const h = e7FoeJustSummoned(ctx);
    if(!h || !e7MzOpen(ctx.player)) return;
    const db = dbOf(h.card);
    /* 「元々の」数値なので DB の値をそのまま写す（現在値ではない）。 */
    const uids = API.createTokens(ctx.player,
      { key:'クローントークン', name:'クローントークン',
        atk:Number(db.atk) || 0, def:Number(db.def) || 0, lv:Number(db.lv) || 1,
        ra:db.ra || '', at:db.at || '', pos:'atk' }, 1, null);
    const tokenUid = (uids && uids.length) ? uids[0] : null;
    const token = (tokenUid != null) ? findCardByUid(tokenUid) : null;
    const src = locateCardAnyV4(h.card);
    /* 元のモンスターが場を離れたらトークンは破壊される。 */
    if(token && src) API.linkOnLeave(token, src, 'destroy', 'クローン複製');
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return !!e7FoeJustSummoned(ctx) && e7MzOpen(ctx.player); },
    onFlip(ctx){ return !!e7FoeJustSummoned(ctx) && e7MzOpen(ctx.player); }
  }
});

/* 2. ツクシー — 戦闘によって破壊され墓地へ送られた時、
      相手フィールドに「ツクシトークン」1体を守備表示で特殊召喚する。
      このトークンが植物族モンスターとの戦闘によって破壊された場合、
      このトークンのコントローラーは手札を1枚墓地へ送る */
function e7SelfBattleDead(ctx){
  if(ctx.zone !== 'grave') return false;
  const b = ctx.battle || {};
  if(!((b.defCard === ctx.card && b.destroyedDef) || (b.atkCard === ctx.card && b.destroyedAtk)))
    return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn);
}
/* ツクシトークンが植物族との戦闘で破壊されたか。破壊された側／破壊した側を見る。 */
function e7TsukushiTokenKilled(ctx){
  const b = ctx.battle || {};
  const pairs = [];
  if(b.destroyedDef && b.atkCard && b.defCard) pairs.push([b.atkCard, b.defCard]);
  if(b.destroyedAtk && b.defCard && b.atkCard) pairs.push([b.defCard, b.atkCard]);
  for(const [killer, victim] of pairs){
    /* API.isToken / API.tokenKey は target を resolveTarget に通すので、
       カード実体には engine 側の素の判定（isTokenV11 / tokenKeyV11）を使う。 */
    if(!isTokenV11(victim)) continue;
    if(tokenKeyV11(victim) !== 'ツクシトークン') continue;
    if(dbOf(killer).ra !== '植物') continue;
    return victim;
  }
  return null;
}
defineScript('ツクシー', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  timing:['damageStep','free'],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = '墓地で処理します'; return false; }
    if(e7SelfBattleDead(ctx)){
      if(!e7MzOpen(ctx.opponent)){
        ctx.reason = '相手のモンスターゾーンに空きがありません'; return false; }
      return true;
    }
    if(e7TsukushiTokenKilled(ctx)) return true;
    ctx.reason = '戦闘破壊された時、またはトークンが植物族に破壊された時に処理します';
    return false;
  },
  resolve(ctx){
    if(e7SelfBattleDead(ctx)){
      if(e7MzOpen(ctx.opponent))
        API.createTokens(ctx.opponent, 'ツクシトークン', 1, null);
      return;
    }
    const token = e7TsukushiTokenKilled(ctx);
    if(!token) return;
    /* トークンのコントローラーが手札を1枚墓地へ送る。 */
    const owner = API.tokenControllerOf(token.uid);
    const p = (owner === 0 || owner === 1) ? owner : ctx.opponent;
    const hand = API.pileCards(p, 'hand');
    if(!hand.length){ API.log('ツクシー：手札がありません'); return; }
    API.sendHandToGrave(p, hand[0].index, 'ツクシー');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    if(ctx.zone !== 'grave') return false;
    return (e7SelfBattleDead(ctx) && e7MzOpen(ctx.opponent))
        || !!e7TsukushiTokenKilled(ctx); } }
});

/* 3. トリッキーズ・マジック4 — 自分フィールドの表側「THE トリッキー」1体を墓地へ送って発動。
      相手フィールドのモンスターの数だけ「トリッキートークン」を守備表示で特殊召喚する。
      このトークンは攻撃宣言できない */
function e7TrickyOnField(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.n === 'THE トリッキー' });
}
defineScript('トリッキーズ・マジック4', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(!e7TrickyOnField(ctx.player).length){
      ctx.reason = '表側表示の「THE トリッキー」がいません'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){
      ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const q = e7TrickyOnField(ctx.player);
    if(!q.length){ done(false); return; }
    API.sendToGrave(q[0], 'トリッキーズ・マジック4（コスト）');
    done(true);
  },
  resolve(ctx){
    const want = API.fieldCards({ player:ctx.opponent, zone:'mz' }).length;
    const room = Math.max(0, ZONE_LIMITS.mz - (gameState.players[ctx.player].mz || []).length);
    const n = Math.min(want, room);
    if(n <= 0) return;
    const uids = API.createTokens(ctx.player, 'トリッキートークン', n, null);
    /* 「このトークンは攻撃宣言できない」は cannotAttack をトークン自身に刻む。
       継続効果のソース（墓地）を1枠使わずに済む。 */
    (uids || []).forEach(u => {
      const h = findCardByUid(u);
      if(h && h.zone === 'mz')
        API.setCardFlag(h, 'cannotAttack', true, 'トリッキーズ・マジック4');
    });
  },
  afterResolve(){}
});

/* 4. ロードブリティッシュ — 戦闘で相手モンスターを破壊した場合、以下から1つを選択して発動する。
      ●もう1度だけ続けて攻撃できる
      ●フィールドにセットされたカード1枚を選択して破壊する
      ●「マルチプルトークン」1体を自分フィールドに特殊召喚する */
function e7SelfKilled(ctx){
  const b = ctx.battle || {};
  if(b.atkCard === ctx.card && b.destroyedDef && b.defCard) return b.defCard;
  if(b.defCard === ctx.card && b.destroyedAtk && b.atkCard) return b.atkCard;
  return null;
}
function e7SetCards(){
  return API.fieldCards({ zone:'sz', filter:x => x.card.face === 'down' });
}
API.registerChoiceHandler('e7.british', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  if(r && r.zone === 'sz') API.destroy(r, 'ロードブリティッシュ', p);
});
defineScript('ロードブリティッシュ', {
  type:'monster', priority:1, dsTiming:'after', activateFrom:['mz'], timing:['damageStep'],
  condition(ctx){
    if(!e7FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!e7SelfKilled(ctx)){
      ctx.reason = '戦闘で相手モンスターを破壊した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    const uid = me.card.uid;
    const canSet = e7SetCards().length > 0;
    const canToken = e7MzOpen(ctx.player);
    if(canSet){
      API.requestChoice({player:ctx.player, kind:'yesno', title:'ロードブリティッシュ',
        note:'セットされたカードを破壊しますか？（いいえ＝もう1度攻撃する）',
        candidates:[{key:'yes',label:'はい',value:true},{key:'no',label:'いいえ',value:false}],
        min:1, max:1, cancelable:false,
        resume:{handler:'s03u62.british-set-confirm', args:{player:ctx.player, uid}},
        meta:{scriptName:'ロードブリティッシュ'}});
      return;
    }
    if(canToken){
      API.requestChoice({player:ctx.player, kind:'yesno', title:'ロードブリティッシュ',
        note:'「マルチプルトークン」を特殊召喚しますか？（いいえ＝もう1度攻撃する）',
        candidates:[{key:'yes',label:'はい',value:true},{key:'no',label:'いいえ',value:false}],
        min:1, max:1, cancelable:false,
        resume:{handler:'s03u62.british-token-confirm', args:{player:ctx.player, uid}},
        meta:{scriptName:'ロードブリティッシュ'}});
      return;
    }
    e7BritishDoAttack(uid, 'ロードブリティッシュ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return e7FaceUpMz(ctx) && !!e7SelfKilled(ctx); } }
});
/* S03-U62: resolve() 内の legacy API.confirm（2箇所）を SaveLoad安全な登録済みハンドラへ移行。
   doAttack はカードの実体ではなく UID を経由して参照する（保存・再開を跨いでも解決できるように）。 */
function e7BritishDoAttack(uid, reason){
  const me = uid != null ? findCardByUid(uid) : null;
  if(me && me.zone === 'mz') API.grantAdditionalAttack(me, 1, reason, true);
}
API.registerChoiceHandler('s03u62.british-set-confirm', (answer, args) => {
  const yes = !answer.cancelled && answer.cards[0] && answer.cards[0].value === true;
  if(!yes){ e7BritishDoAttack(args.uid, 'ロードブリティッシュ'); return; }
  const pool = e7SetCards();
  if(!pool.length) return;
  API.requestChoice({player:args.player, kind:'card', cancelable:false, min:1, max:1,
    title:'ロードブリティッシュ：破壊するセットされたカード',
    candidates: pool,
    resume:{ handler:'e7.british', args:{ player:args.player } }});
});
API.registerChoiceHandler('s03u62.british-token-confirm', (answer, args) => {
  const yes = !answer.cancelled && answer.cards[0] && answer.cards[0].value === true;
  if(yes) API.createTokens(args.player, 'マルチプルトークン', 1, null);
  else e7BritishDoAttack(args.uid, 'ロードブリティッシュ');
});

/* 5. 魂喰らいの魔刀 — 自分フィールドのレベル3以下の通常モンスターに装備できる。
      発動時、装備モンスター以外の自分フィールドの通常モンスター（トークンを除く）を
      全てリリースする。リリースした数×1000ポイント、装備モンスターの攻撃力がアップする */
function e7LowNormal(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.k === 'm'
             && treatedAsNormal(x.card) && Number(x.db.lv) <= 3 });
}
function e7OtherNormals(p, hostCard){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card !== hostCard && x.card.face === 'up'
             && x.db.k === 'm' && treatedAsNormal(x.card) && !isTokenV11(x.card) });
}
defineScript('魂喰らいの魔刀', {
  type:'spell', priority:1, targets:true, activateFrom:['sz'], timing:['mainPhase'],
  equipSpec:{ canEquip(h){
      return !!(h && h.db && h.db.k === 'm' && Number(h.db.lv) <= 3
                && treatedAsNormal(h.card)); },
    label:'レベル3以下の通常モンスターのみ' },
  condition(ctx){
    if(!e7LowNormal(ctx.player).length){
      ctx.reason = 'レベル3以下の通常モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('魂喰らいの魔刀：装備するモンスター',
      e7LowNormal(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(!r || r.zone !== 'mz' || !me || me.zone !== 'sz') return;
    const hostCard = r.card;
    API.equipSpell(me, r, '魂喰らいの魔刀');
    let n = 0;
    let guard = 0;
    while(guard++ < 20){
      const q = e7OtherNormals(ctx.player, hostCard);
      if(!q.length) break;
      API.sendToGrave(q[0], '魂喰らいの魔刀');
      n++;
    }
    const host = locateCardAnyV4(hostCard);
    if(host && host.zone === 'mz' && n > 0)
      API.modAtk(host, n * 1000, 0, 'permanent', '魂喰らいの魔刀');
  },
  afterResolve(){}
});

/* ===================== B. コイントス ===================== */

/* 6. 一撃必殺侍 — 戦闘を行う場合、ダメージ計算の前にコイントスで裏表を当てる。
      当たった場合、相手モンスターを効果によって破壊する */
API.registerChoiceHandler('e7.samurai', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const guess = picked ? String(picked.value) : null;
  const coin = e7Coin();
  API.log('一撃必殺侍：コイントスは' + coin + '（宣言：' + String(guess) + '）');
  if(!guess || guess !== coin) return;
  const uid = args && args.foeUid;
  const h = (uid != null) ? findCardByUid(uid) : null;
  if(h && h.zone === 'mz') API.destroy(h, '一撃必殺侍', p);
});
function e7BattleOther(self){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  if(atk === self) return def || null;
  if(def === self) return atk || null;
  return null;
}
defineScript('一撃必殺侍', {
  type:'monster', priority:1, forced:true, dsTiming:'start', damageStepOnly:true,
  activateFrom:['mz'], timing:['damageStep'],
  condition(ctx){
    if(!e7FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!e7BattleOther(ctx.card)){
      ctx.reason = '戦闘を行うダメージ計算前に処理します'; return false; }
    return true;
  },
  resolve(ctx){
    const other = e7BattleOther(ctx.card);
    if(!other) return;
    ensureCardUid(gameState, other);
    API.requestChoice({
      player: ctx.player, kind:'declare', cancelable:false, min:1, max:1,
      title:'一撃必殺侍：コイントスの裏表を宣言',
      candidates: e7CoinCandidates(),
      resume:{ handler:'e7.samurai', args:{ player:ctx.player, foeUid:other.uid } }
    });
  },
  afterResolve(){}
});

/* 7. モンスターBOX — 相手モンスターの攻撃宣言時、コイントスを1回行い裏表を当てる。
      当たった場合、その攻撃モンスターの攻撃力はバトルフェイズ終了時まで0になる。
      コントローラーは自分のスタンバイフェイズ毎に500ライフポイントを払う。
      払わなければこのカードを破壊する */
API.registerChoiceHandler('e7.monsterBox', (answer, args) => {
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const guess = picked ? String(picked.value) : null;
  const coin = e7Coin();
  API.log('モンスターBOX：コイントスは' + coin + '（宣言：' + String(guess) + '）');
  if(!guess || guess !== coin) return;
  const uid = args && args.atkUid;
  const h = (uid != null) ? findCardByUid(uid) : null;
  if(h && h.zone === 'mz')
    API.setAtk(h, 0, 'endBattlePhase', 'モンスターBOX');
});
function e7FoeAttacker(ctx){
  const b = gameState.battle || gameState.pendingAttack;
  if(!b) return null;
  if(b.player !== ctx.opponent) return null;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  return atk || null;
}
defineScript('モンスターBOX', {
  type:'trap', priority:2, forced:false, activateFrom:['sz'],
  timing:['attackDeclare','standby','free'],
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){
      ctx.reason = '表側表示で魔法・罠ゾーンに存在する必要があります'; return false; }
    if(gameState.phase === 'standby' && e7MyTurn(ctx.player)) return true;
    if(!e7FoeAttacker(ctx)){
      ctx.reason = '相手モンスターの攻撃宣言時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    if(gameState.phase === 'standby' && e7MyTurn(ctx.player)){
      const me = locateCardAnyV4(ctx.card);
      if(API.me(ctx).lp > 500){ API.payCost(ctx.player, 500); return; }
      if(me && me.zone === 'sz') API.destroy(me, 'モンスターBOX', ctx.player);
      return;
    }
    const atk = e7FoeAttacker(ctx);
    if(!atk) return;
    ensureCardUid(gameState, atk);
    API.requestChoice({
      player: ctx.player, kind:'declare', cancelable:false, min:1, max:1,
      title:'モンスターBOX：コイントスの裏表を宣言',
      candidates: e7CoinCandidates(),
      resume:{ handler:'e7.monsterBox', args:{ player:ctx.player, atkUid:atk.uid } }
    });
  },
  afterResolve(){},
  passive:{
    onAttackDeclare(ctx){
      return ctx.zone === 'sz' && ctx.card.face === 'up' && !!e7FoeAttacker(ctx); },
    onStandbyPhase(ctx){
      return ctx.zone === 'sz' && ctx.card.face === 'up' && e7MyTurn(ctx.player); }
  }
});

/* 8. アルカナフォースXVIII－THE MOON — 召喚・反転召喚・特殊召喚に成功した時、
      コイントスを1回行い以下の効果を得る。
      ●表:自分のスタンバイフェイズに「ムーントークン」1体を特殊召喚できる
      ●裏:自分のエンドフェイズに1度だけ、自分フィールドのモンスター1体を選択し、
          そのコントロールを相手に移す */
API.registerChoiceHandler('e7.moonControl', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const foe = p === 0 ? 1 : 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  if(r && r.zone === 'mz') API.changeControl(r, foe, 'アルカナフォースXVIII－THE MOON');
});
function e7MoonJustSummoned(ctx){
  const e = ctx.event || {};
  if(ctx.zone !== 'mz') return false;
  if(e.card && e.card !== ctx.card) return false;
  if(e.uid != null && ctx.card.uid != null && e.uid !== ctx.card.uid) return false;
  return Number(ctx.card.e7MoonCoin || 0) === 0;
}
defineScript('アルカナフォースXVIII－THE MOON', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  timing:['free','standby','endPhase'],
  condition(ctx){
    if(!e7FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(e7MoonJustSummoned(ctx)) return true;
    const coin = Number(ctx.card.e7MoonCoin || 0);
    if(coin === 1){
      if(!(gameState.phase === 'standby' && e7MyTurn(ctx.player))){
        ctx.reason = '自分のスタンバイフェイズに発動します'; return false; }
      if(!e7MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
      return true;
    }
    if(coin === 2){
      if(!(gameState.phase === 'end' && e7MyTurn(ctx.player))){
        ctx.reason = '自分のエンドフェイズに処理します'; return false; }
      if(!API.fieldCards({ player:ctx.player, zone:'mz' }).length){
        ctx.reason = '自分フィールドにモンスターがいません'; return false; }
      return true;
    }
    ctx.reason = 'コイントスの結果が決まっていません';
    return false;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(e7MoonJustSummoned(ctx)){
      const coin = e7Coin();
      API.log('アルカナフォースXVIII－THE MOON：コイントスは' + coin);
      API.setCardFlag(me, 'e7MoonCoin', coin === '表' ? 1 : 2,
        'アルカナフォースXVIII－THE MOON');
      return;
    }
    const coin = Number(ctx.card.e7MoonCoin || 0);
    if(coin === 1){
      if(e7MzOpen(ctx.player))
        API.createTokens(ctx.player, 'ムーントークン', 1, null);
      return;
    }
    const q = API.fieldCards({ player:ctx.player, zone:'mz' });
    if(!q.length) return;
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'アルカナフォースXVIII－THE MOON：相手にコントロールを移すモンスター',
      candidates: q,
      resume:{ handler:'e7.moonControl', args:{ player:ctx.player } }
    });
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return e7FaceUpMz(ctx) && e7MoonJustSummoned(ctx); },
    onSpecialSummon(ctx){ return e7FaceUpMz(ctx) && e7MoonJustSummoned(ctx); },
    onFlip(ctx){ return e7FaceUpMz(ctx) && e7MoonJustSummoned(ctx); },
    onStandbyPhase(ctx){
      return e7FaceUpMz(ctx) && Number(ctx.card.e7MoonCoin || 0) === 1
          && e7MyTurn(ctx.player) && e7MzOpen(ctx.player); },
    onEndPhase(ctx){
      return e7FaceUpMz(ctx) && Number(ctx.card.e7MoonCoin || 0) === 2
          && e7MyTurn(ctx.player)
          && API.fieldCards({ player:ctx.player, zone:'mz' }).length > 0; }
  }
});
