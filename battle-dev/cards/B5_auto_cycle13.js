/* Auto cycle 13 — 23枚。engine 変更なし。
     IIIA スピリットモンスター（cannotSpecialSummon + 召喚・リバースしたターンの帰還）
     IIIB リバース効果モンスター
     IIIC 召喚成功トリガー（宣言・コイントス）
     IIID 墓地からの特殊召喚
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

/* 「召喚・リバースしたターン」か。
   engine は通常召喚のとき card.summonedTurn を書くが（00_state_actions.js:1652）、
   反転召喚・戦闘によるリバースでは何も記録しない（FX_SET_STATE は face/pos のみ）。
   そのため各スピリットは「召喚・リバースした時」のトリガーの resolve で
   c2SpiritTurn を書き、エンドフェイズ側はそれを読むだけにする。
   読み取り側（condition / passive）は read-only を保つ。 */
function c2SpiritActiveTurn(card){
  if(!card) return false;
  return Number(card.summonedTurn) === gameState.turn
      || Number(card.c2SpiritTurn) === gameState.turn;
}
/* いま自分が召喚された／リバースしたイベントか */
function c2SummonedOrFlipped(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz' || me.card.face !== 'up') return false;
  const e = ctx.event || {};
  if(e.card === ctx.card) return true;                      /* onFlip */
  return b2SummonedCards(e).indexOf(ctx.card) >= 0;         /* onNormalSummon */
}
/* エンドフェイズの帰還タイミングか */
function c2SpiritReturnDue(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  if(gameState.phase !== 'end') return false;
  if(!c2SpiritActiveTurn(me.card)) return false;
  return Number(me.card.c2SpiritReturned || -1) !== gameState.turn;
}
/* 召喚・リバースした事を記録する（resolve からのみ呼ぶ） */
function c2MarkSpirit(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(me && me.zone === 'mz') API.setCardFlag(me, 'c2SpiritTurn', gameState.turn, 'スピリット');
}
/* 持ち主の手札へ戻す（エンドフェイズの共通処理） */
function c2SpiritReturn(ctx, name){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return;
  API.setCardFlag(me, 'c2SpiritReturned', gameState.turn, name);
  const now = locateCardAnyV4(ctx.card);
  if(now && now.zone === 'mz') API.returnToHand(now, name);
}
/* スピリットの登録雛形。
   spec.canSummonEffect(ctx) … 召喚・リバース時の効果に対象等があるか（省略可）
   spec.selectTargets / spec.onSummon(ctx) … 召喚・リバース時の効果本体
   spec.onEndPhase(ctx) … エンドフェイズ側を差し替える場合（省略時は手札へ戻る）
   注: 召喚・リバース側の分岐は forced で必ず成立させる。エンドフェイズの帰還は
   このカード自身の強制効果であり、リバースを engine が記録しない以上、
   ここで印を付けないと帰還を落としてしまうため。 */
function c2Spirit(name, spec){
  spec = spec || {};
  const script = {
    type:'monster', priority:1, forced:true, cannotSpecialSummon:true,
    targets: !!spec.targets, activateFrom:['mz'],
    condition(ctx){
      if(c2SummonedOrFlipped(ctx)) return true;
      if(c2SpiritReturnDue(ctx)) return true;
      ctx.reason = '召喚・リバースした時、またはそのターンのエンドフェイズに発動します';
      return false;
    },
    resolve(ctx){
      if(c2SummonedOrFlipped(ctx)){
        c2MarkSpirit(ctx);
        if(typeof spec.onSummon === 'function') spec.onSummon(ctx);
        return;
      }
      if(!c2SpiritReturnDue(ctx)) return;
      if(typeof spec.onEndPhase === 'function'){ spec.onEndPhase(ctx); return; }
      c2SpiritReturn(ctx, name);
    },
    afterResolve(){},
    passive:{
      onNormalSummon(ctx){ return c2SummonedOrFlipped(ctx); },
      onFlip(ctx){ return c2SummonedOrFlipped(ctx); },
      onEndPhase(ctx){ return c2SpiritReturnDue(ctx); }
    }
  };
  if(typeof spec.selectTargets === 'function') script.selectTargets = spec.selectTargets;
  if(spec.continuous) script.continuous = spec.continuous;
  defineScript(name, script);
}
/* 自分の墓地のスピリットモンスター（st に 'スピリット' を持つ実データで判定） */
function c2SpiritGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && (x.db.st || []).includes('スピリット'));
}
/* 相手フィールドの表側表示モンスター */
function c2FoeFaceUp(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'mz', filter:x => x.card.face === 'up' });
}
/* 空きモンスターゾーン */
function c2MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }

/* ===================== A. スピリットモンスター ===================== */

/* 1. 夜叉 — 召喚・リバース時、相手の魔法・罠1枚を持ち主の手札に戻せる */
c2Spirit('夜叉', {
  targets:true,
  selectTargets(ctx, done){
    const q = API.fieldCards({ player:ctx.opponent, zone:'sz' });
    if(!q.length){ done([]); return; }
    API.selectCard('夜叉：手札に戻す魔法・罠', q, t => done([t]));
  },
  onSummon(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'sz') API.returnToHand(r, '夜叉');
  }
});

/* 2. 月読命 — 召喚・リバース時、フィールドの表側表示モンスター1体を裏側守備表示にする */
c2Spirit('月読命', {
  targets:true,
  selectTargets(ctx, done){
    const q = API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' });
    if(!q.length){ done([]); return; }
    API.selectCard('月読命：裏側守備表示にするモンスター', q, t => done([t]));
  },
  onSummon(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    API.changePosition(r, 'def', '月読命');
    const now = locateCardAnyV4(r.card);
    if(now && now.zone === 'mz') API.flip(now, 'down', '月読命');
  }
});

/* 3. 砂塵の悪霊 — 召喚・リバース時、このカード以外の表側表示モンスターを全て破壊 */
c2Spirit('砂塵の悪霊', {
  onSummon(ctx){
    const q = API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' && x.card !== ctx.card });
    /* index のずれを避けるため handle をカード参照へ落としてから破壊する */
    q.map(x => x.card).forEach(c => {
      const h = locateCardAnyV4(c);
      if(h && h.zone === 'mz') API.destroy(h, '砂塵の悪霊', ctx.player);
    });
  }
});

/* 4. 鳳凰 — 召喚・リバース時、相手フィールドにセットされた魔法・罠を全て破壊 */
c2Spirit('鳳凰', {
  onSummon(ctx){
    const q = API.fieldCards({ player:ctx.opponent, zone:'sz', filter:x => x.card.face === 'down' });
    q.map(x => x.card).forEach(c => {
      const h = locateCardAnyV4(c);
      if(h && h.zone === 'sz') API.destroy(h, '鳳凰', ctx.player);
    });
  }
});

/* 5. 竜宮之姫 — 召喚・リバース時、相手の表側表示モンスター1体の表示形式を変更できる */
c2Spirit('竜宮之姫', {
  targets:true,
  selectTargets(ctx, done){
    const q = c2FoeFaceUp(ctx);
    if(!q.length){ done([]); return; }
    API.selectCard('竜宮之姫：表示形式を変更するモンスター', q, t => done([t]));
  },
  onSummon(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    API.changePosition(r, r.card.pos === 'atk' ? 'def' : 'atk', '竜宮之姫');
  }
});

/* 6. 磨破羅魏 — 召喚・リバース時、次の自分のドローフェイズのドロー前に
      自分のデッキの一番上を確認し、一番上か一番下に戻す */
API.registerChoiceHandler('c2.maharagi', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const mode = a4PickedMode(answer);
  if(mode !== 'bottom') return;               /* 一番上に戻す＝そのまま */
  const P = gameState.players[p];
  if(!P.deck.length) return;
  const h = locateCardAnyV4(P.deck[0]);
  if(h && h.zone === 'deck') API.returnToDeck(h, true, '磨破羅魏');
});
API.registerScheduleHandler('c2.maharagi', (entry) => {
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  const P = gameState.players[p];
  if(!P.deck.length) return;
  /* 確認するのはデッキの持ち主だけ。相手には内容を見せない。 */
  API.requestChoice({
    player:p, kind:'card', cancelable:false, min:1, max:1,
    title:'磨破羅魏：デッキの一番上（' + cardName(P.deck[0]) + '）をどちらに戻しますか',
    candidates:[{ key:'top', label:'デッキの一番上に戻す', value:'top' },
                { key:'bottom', label:'デッキの一番下に戻す', value:'bottom' }],
    resume:{ handler:'c2.maharagi', args:{ player:p } }
  });
});
c2Spirit('磨破羅魏', {
  onSummon(ctx){
    API.schedule({ at:'drawPhase', ownTurn:true, player:ctx.player, handler:'c2.maharagi',
                   args:{ player:ctx.player }, source:{ card:ctx.card }, note:'磨破羅魏' });
  }
});

/* 7. 伊弉波 — 召喚・リバース時、手札を1枚捨てて墓地のスピリット1体を手札に加える */
c2Spirit('伊弉波', {
  targets:true,
  selectTargets(ctx, done){
    const hand = API.pileCards(ctx.player, 'hand', () => true);
    const grave = c2SpiritGrave(ctx.player);
    if(!hand.length || !grave.length){ done([]); return; }
    API.selectCard('伊弉波：捨てる手札', hand, a =>
      API.selectCard('伊弉波：手札に加えるスピリット', grave, b => done([a, b])));
  },
  onSummon(ctx){
    const ts = ctx.selectedTargets || [];
    if(ts.length < 2) return;
    const a = resolveTarget(ts[0]), b = resolveTarget(ts[1]);
    if(!a || a.zone !== 'hand' || !b || b.zone !== 'grave') return;
    API.discard(ctx.player, a.index, '伊弉波', { byEffect:true, byPlayer:ctx.player });
    const now = locateCardAnyV4(b.card);
    if(now && now.zone === 'grave') API.returnToHand(now, '伊弉波');
  }
});

/* 8. 金華猫 — 召喚・リバース時、墓地のレベル1モンスター1体を特殊召喚する。
      このカードがフィールドを離れた時、そのモンスターは除外される */
c2Spirit('金華猫', {
  targets:true,
  selectTargets(ctx, done){
    const q = API.pileCards(ctx.player, 'grave', x => x.db.k === 'm' && Number(x.db.lv) === 1);
    if(!q.length || !c2MzOpen(ctx.player)){ done([]); return; }
    API.selectCard('金華猫：特殊召喚するレベル1モンスター', q, t => done([t]));
  },
  onSummon(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || !c2MzOpen(ctx.player)) return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', '金華猫', r.p);
    const now = findCardByUid(uid);
    const me = locateCardAnyV4(ctx.card);
    /* 「金華猫が離れたら除外」を v9 の生存リンクで宣言する */
    if(now && now.zone === 'mz' && me) API.linkOnLeave(now, me, 'banish', '金華猫');
  }
});

/* 9. 氷結界の神精霊 — 自分フィールドに他の「氷結界」モンスターがいる場合、
      エンドフェイズの効果は「相手のモンスター1体を持ち主の手札に戻す」になる */
function c2OtherIceBarrier(ctx){
  return API.fieldCards({ player:ctx.player, zone:'mz',
    filter:x => x.card !== ctx.card && x.card.face === 'up'
             && x.db.k === 'm' && isSetCardV4(x.db, SETCODE.ICE_BARRIER) }).length > 0;
}
c2Spirit('氷結界の神精霊', {
  onEndPhase(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(c2OtherIceBarrier(ctx)){
      API.setCardFlag(me, 'c2SpiritReturned', gameState.turn, '氷結界の神精霊');
      const q = API.fieldCards({ player:ctx.opponent, zone:'mz' });
      if(!q.length) return;
      const r = resolveTarget(q[0]);
      if(r && r.zone === 'mz') API.returnToHand(r, '氷結界の神精霊');
      return;
    }
    c2SpiritReturn(ctx, '氷結界の神精霊');
  }
});

/* ===================== B. リバース効果モンスター ===================== */

/* 11. 暗黒のミミック LV1 — リバース：1枚ドロー。
       自分のスタンバイフェイズに、表側のこのカードを墓地へ送って LV3 を特殊召喚できる */
function c2MimicTargets(p){
  const out = [];
  API.pileCards(p, 'hand', x => x.db.n === '暗黒のミミック LV3').forEach(x => out.push(x));
  API.pileCards(p, 'deck', x => x.db.n === '暗黒のミミック LV3').forEach(x => out.push(x));
  return out;
}
defineScript('暗黒のミミック LV1', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(c2SummonedOrFlipped(ctx) && ctx.event && ctx.event.card === ctx.card){
      if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
      return true;
    }
    if(gameState.phase === 'standby' && gameState.activePlayer === me.p && me.card.face === 'up'){
      if(!c2MimicTargets(ctx.player).length){ ctx.reason = '「暗黒のミミック LV3」が手札・デッキにいません'; return false; }
      return true;
    }
    ctx.reason = 'リバースした場合、または自分のスタンバイフェイズに発動します';
    return false;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(c2SummonedOrFlipped(ctx) && ctx.event && ctx.event.card === ctx.card){
      API.draw(ctx.player, 1); return;
    }
    const q = c2MimicTargets(ctx.player);
    const pick = q.length ? q[0] : null;
    API.sendToGrave(me, '暗黒のミミック LV1');
    const r = pick && locateCardAnyV4(pick.card);
    if(r && (r.zone === 'hand' || r.zone === 'deck') && c2MzOpen(ctx.player)){
      ensureCardUid(gameState, r.card);
      const uid = r.card.uid;
      API.specialSummon(ctx.player, r.zone, r.index, 'atk', '暗黒のミミック LV1', r.p);
      /* cycle 24: 「LV1 の効果で特殊召喚された」事実を LV3 が読めるように刻む。
         summonProvenance は summonType しか持たず、どのカードの効果かは残らない。 */
      const now = (uid != null) ? findCardByUid(uid) : null;
      if(now && now.zone === 'mz')
        API.setCardFlag(now, 'c2MimicFromLv1', gameState.turn, '暗黒のミミック LV1');
    }
  },
  afterResolve(){},
  passive:{
    onFlip(ctx){
      return c2SummonedOrFlipped(ctx) && !!(ctx.event && ctx.event.card === ctx.card)
        && API.me(ctx).deck.length > 0; },
    onStandbyPhase(ctx){
      const me = locateCardAnyV4(ctx.card);
      return !!me && me.zone === 'mz' && me.card.face === 'up'
        && gameState.activePlayer === me.p && c2MimicTargets(ctx.player).length > 0; }
  }
});

/* 12. 電磁ミノ虫 — リバース：相手の機械族1体のコントロールを次の自分エンドフェイズまで得る。
       モンスターとの戦闘で破壊された場合、そのモンスターの攻守を500ダウンする */
API.registerScheduleHandler('c2.minomushi', (entry) => {
  const uid = entry && entry.uid;
  const back = (entry && (entry.back === 0 || entry.back === 1)) ? entry.back : 1;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz' && h.p !== back) API.changeControl(h, back, '電磁ミノ虫', 'permanent');
});
/* S03-U23: 「戦闘で破壊された場合」は⑤（墓地へ送られた後）。条件が墓地を見るので dsTiming は 'leave'。 */
defineScript('電磁ミノ虫', {
  type:'monster', priority:1, targets:true, activateFrom:['mz','grave'], dsTiming:'leave',
  condition(ctx){
    if(c2SummonedOrFlipped(ctx) && ctx.event && ctx.event.card === ctx.card){
      if(!API.fieldCards({ player:ctx.opponent, zone:'mz', filter:x => x.db.ra === '機械' }).length){
        ctx.reason = '相手フィールドに機械族モンスターがいません'; return false; }
      if(!c2MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
      return true;
    }
    if(a3SelfBattleDestroyed(ctx)) return true;
    ctx.reason = 'リバースした場合、または戦闘で破壊された場合に発動します';
    return false;
  },
  selectTargets(ctx, done){
    const q = API.fieldCards({ player:ctx.opponent, zone:'mz', filter:x => x.db.ra === '機械' });
    if(!q.length){ done([]); return; }
    API.selectCard('電磁ミノ虫：コントロールを得る機械族', q, t => done([t]));
  },
  resolve(ctx){
    if(a3SelfBattleDestroyed(ctx)){
      const o = a3BattleOther(ctx);
      const h = o && locateCardAnyV4(o);
      if(h && h.zone === 'mz') API.modAtk(h, -500, -500, 'permanent', '電磁ミノ虫');
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid, back = r.p;
    API.changeControl(r, ctx.player, '電磁ミノ虫', 'permanent');
    /* 「次の自分エンドフェイズまで」を v7 スケジューラで明示的に戻す */
    API.schedule({ at:'endPhase', turns:(gameState.activePlayer === ctx.player ? 0 : 1),
                   player:ctx.player, handler:'c2.minomushi',
                   args:{ uid:uid, back:back }, source:{ card:ctx.card }, note:'電磁ミノ虫' });
  },
  afterResolve(){},
  passive:{
    onFlip(ctx){
      return c2SummonedOrFlipped(ctx) && !!(ctx.event && ctx.event.card === ctx.card)
        && c2MzOpen(ctx.player)
        && API.fieldCards({ player:ctx.opponent, zone:'mz', filter:x => x.db.ra === '機械' }).length > 0; },
    onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx); }
  }
});

/* 13. ワーム・ルクイエ — リバースしたターンでなければ攻撃宣言できない。
       攻撃した場合、バトルフェイズ終了時に裏側守備表示になる */
function c2LuqiaeFlipped(card){ return Number(card && card.c2LuqiaeTurn) === gameState.turn; }
defineScript('ワーム・ルクイエ', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(c2SummonedOrFlipped(ctx) && ctx.event && ctx.event.card === ctx.card) return true;
    if(gameState.phase === 'battle' && me.card.face === 'up'){
      const bp = gameState.battlePhaseV6;
      const list = (bp && Array.isArray(bp.attacks)) ? bp.attacks : [];
      if(list.some(a => a && a.attackerUid === me.card.uid)) return true;
    }
    ctx.reason = 'リバースした場合、または攻撃したバトルフェイズ終了時に発動します';
    return false;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(c2SummonedOrFlipped(ctx) && ctx.event && ctx.event.card === ctx.card){
      API.setCardFlag(me, 'c2LuqiaeTurn', gameState.turn, 'ワーム・ルクイエ');
      return;
    }
    API.changePosition(me, 'def', 'ワーム・ルクイエ');
    const now = locateCardAnyV4(ctx.card);
    if(now && now.zone === 'mz') API.flip(now, 'down', 'ワーム・ルクイエ');
  },
  afterResolve(){},
  passive:{
    onFlip(ctx){ return c2SummonedOrFlipped(ctx) && !!(ctx.event && ctx.event.card === ctx.card); },
    onBattlePhaseEnd(ctx){
      const me = locateCardAnyV4(ctx.card);
      if(!me || me.zone !== 'mz' || me.card.face !== 'up') return false;
      const bp = gameState.battlePhaseV6;
      const list = (bp && Array.isArray(bp.attacks)) ? bp.attacks : [];
      return list.some(a => a && a.attackerUid === me.card.uid); }
  },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    cannotAttack(card, self){ return card === self && !c2LuqiaeFlipped(card); }
  }
});

/* ===================== C. 召喚成功トリガー ===================== */

/* 14. 7つの武器を持つハンター — 召喚成功時に種族を1つ宣言し、
       宣言した種族と戦闘を行うダメージ計算時のみ攻撃力1000アップ */
const C2_RACES = ['戦士','魔法使い','天使','悪魔','アンデット','機械','水','炎','岩石',
                  '鳥獣','植物','昆虫','雷','ドラゴン','獣','獣戦士','恐竜','魚',
                  '海竜','爬虫類','サイキック','幻神獣'];
API.registerChoiceHandler('c2.hunter', (answer, args) => {
  const uid = args && args.uid;
  const race = a4PickedMode(answer);
  if(uid == null || !race) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz') API.setCardFlag(h, 'c2HunterRace', String(race), '7つの武器を持つハンター');
});
defineScript('7つの武器を持つハンター', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    if(!c2SummonedOrFlipped(ctx)){ ctx.reason = '召喚に成功した時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    API.requestChoice({
      player:ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'7つの武器を持つハンター：種族を1つ宣言',
      candidates:C2_RACES.map(r => ({ key:r, label:r, value:r })),
      resume:{ handler:'c2.hunter', args:{ uid:me.card.uid } }
    });
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return c2SummonedOrFlipped(ctx); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self){
      if(card !== self || card.face !== 'up') return null;
      const race = card.c2HunterRace;
      if(!race) return null;
      const b = gameState.battle;
      if(!b || b.step !== 'calc') return null;
      const foe = a3BattleOther({ card:self, battle:{ atkCard:(gameState.players[b.player].mz || [])[b.atkIdx],
        defCard:(gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target] } });
      if(!foe || dbOf(foe).ra !== race) return null;
      return { atk:1000 };
    }
  }
});

/* 15. ヴァイロン・オーム — 召喚成功時、自分の墓地の装備魔法1枚を除外し、
       次の自分のスタンバイフェイズにそのカードを手札に加える */
API.registerScheduleHandler('c2.vylonOhm', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'banish') API.returnToHand(h, 'ヴァイロン・オーム');
});
function c2EquipGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 's' && x.db.sub === '装備');
}
defineScript('ヴァイロン・オーム', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['mz'],
  condition(ctx){
    if(!c2SummonedOrFlipped(ctx)){ ctx.reason = '召喚に成功した時に発動します'; return false; }
    if(!c2EquipGrave(ctx.player).length){ ctx.reason = '墓地に装備魔法カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ヴァイロン・オーム：除外する装備魔法', c2EquipGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave') return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.banish(r, 'ヴァイロン・オーム');
    API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player, handler:'c2.vylonOhm',
                   args:{ uid:uid, player:ctx.player }, source:{ card:ctx.card }, note:'ヴァイロン・オーム' });
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    return c2SummonedOrFlipped(ctx) && c2EquipGrave(ctx.player).length > 0; } }
});

/* 16. 封魔の伝承者 — 召喚・反転召喚・特殊召喚成功時、自分の墓地の
       「封魔の伝承者」の数だけ属性を宣言する。宣言した属性のモンスターへ
       攻撃を行う場合、ダメージ計算を行わずそのモンスターを破壊する */
const C2_ATTRS = ['光','闇','地','水','炎','風','神'];
API.registerChoiceHandler('c2.densho', (answer, args) => {
  const uid = args && args.uid;
  if(uid == null) return;
  const picked = (answer && answer.cards ? answer.cards : [])
    .map(c => String(c.value != null ? c.value : c.key)).filter(Boolean);
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz' && picked.length)
    API.setCardFlag(h, 'c2DenshoAttrs', picked.join('/'), '封魔の伝承者');
});
function c2DenshoAttrs(card){
  const v = card && card.c2DenshoAttrs;
  return v ? String(v).split('/') : [];
}
defineScript('封魔の伝承者', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'], dsTiming:'start',
  condition(ctx){
    if(c2SummonedOrFlipped(ctx)){
      const n = API.pileCards(ctx.player, 'grave', x => x.db.n === '封魔の伝承者').length;
      if(n <= 0){ ctx.reason = '墓地に「封魔の伝承者」がいません'; return false; }
      return true;
    }
    if(!c2DenshoVictim(ctx)){ ctx.reason = '宣言した属性のモンスターへの攻撃ではありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(c2SummonedOrFlipped(ctx)){
      const n = API.pileCards(ctx.player, 'grave', x => x.db.n === '封魔の伝承者').length;
      ensureCardUid(gameState, me.card);
      API.requestChoice({
        player:ctx.player, kind:'card', cancelable:false, min:Math.min(n, C2_ATTRS.length), max:Math.min(n, C2_ATTRS.length),
        title:'封魔の伝承者：属性を宣言（' + n + 'つ）',
        candidates:C2_ATTRS.map(a => ({ key:a, label:a, value:a })),
        resume:{ handler:'c2.densho', args:{ uid:me.card.uid } }
      });
      return;
    }
    const v = c2DenshoVictim(ctx);
    if(v) a3DestroyBeforeDamage(v, '封魔の伝承者');
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){
      return c2SummonedOrFlipped(ctx)
        && API.pileCards(ctx.player, 'grave', x => x.db.n === '封魔の伝承者').length > 0; },
    onFlip(ctx){
      return c2SummonedOrFlipped(ctx)
        && API.pileCards(ctx.player, 'grave', x => x.db.n === '封魔の伝承者').length > 0; },
    onSpecialSummon(ctx){
      return c2SummonedOrFlipped(ctx)
        && API.pileCards(ctx.player, 'grave', x => x.db.n === '封魔の伝承者').length > 0; },
    onDamageStep(ctx){ return !!c2DenshoVictim(ctx); }
  }
});
function c2DenshoVictim(ctx){
  if(!a3IsAttacker(ctx)) return null;
  const attrs = c2DenshoAttrs(ctx.card);
  if(!attrs.length) return null;
  const t = a3AttackTarget();
  if(!t) return null;
  return attrs.indexOf(dbOf(t).at) >= 0 ? t : null;
}

/* 17. アルカナフォースI－THE MAGICIAN — 召喚・反転召喚・特殊召喚成功時にコイントス。
       表：魔法カードが発動された時、そのターンのエンドフェイズ時まで元々の攻撃力が倍。
       裏：魔法カードが発動する度に相手は500ライフポイント回復する */
function c2ArcanaHeads(card){ return card && card.c2ArcanaCoin === 'heads'; }
function c2ArcanaTails(card){ return card && card.c2ArcanaCoin === 'tails'; }
function c2SpellActivated(ctx){
  const e = ctx.event || {};
  return e.kind === 'spell';
}
defineScript('アルカナフォースI－THE MAGICIAN', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(c2SummonedOrFlipped(ctx)) return true;
    if(!me.card.c2ArcanaCoin){ ctx.reason = 'まだコイントスを行っていません'; return false; }
    if(!c2SpellActivated(ctx)){ ctx.reason = '魔法カードが発動された時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(c2SummonedOrFlipped(ctx)){
      /* replay 安全な乱数（06_replay_rng_v41.js）でコイントスを行う */
      const heads = (typeof duelRandomInt === 'function' ? duelRandomInt(2) : 0) === 0;
      API.setCardFlag(me, 'c2ArcanaCoin', heads ? 'heads' : 'tails', 'アルカナフォースI－THE MAGICIAN');
      return;
    }
    if(c2ArcanaHeads(me.card)){
      API.modAtk(me, Math.max(0, dbOf(me.card).atk || 0), 0, 'endTurn', 'アルカナフォースI－THE MAGICIAN');
      return;
    }
    if(c2ArcanaTails(me.card)) API.recoverLP(ctx.opponent, 500);
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return c2SummonedOrFlipped(ctx); },
    onFlip(ctx){ return c2SummonedOrFlipped(ctx); },
    onSpecialSummon(ctx){ return c2SummonedOrFlipped(ctx); },
    onActivateSuccess(ctx){
      const me = locateCardAnyV4(ctx.card);
      return !!me && me.zone === 'mz' && !!me.card.c2ArcanaCoin && c2SpellActivated(ctx); }
  }
});

/* 18. アルカナフォースVII－THE CHARIOT — 召喚・反転召喚・特殊召喚成功時にコイントス。
       表：戦闘で破壊した相手モンスターを自分フィールドに特殊召喚できる。
       裏：このカードのコントロールを相手に移す */
defineScript('アルカナフォースVII－THE CHARIOT', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'], dsTiming:'after',
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(c2SummonedOrFlipped(ctx)) return true;
    if(!c2ArcanaHeads(me.card)){ ctx.reason = 'コイントスの表を出していません'; return false; }
    if(!a6DestroyedFoeInBattle(ctx)){ ctx.reason = '戦闘で相手モンスターを破壊した場合に発動します'; return false; }
    if(!c2MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(c2SummonedOrFlipped(ctx)){
      const heads = (typeof duelRandomInt === 'function' ? duelRandomInt(2) : 0) === 0;
      API.setCardFlag(me, 'c2ArcanaCoin', heads ? 'heads' : 'tails', 'アルカナフォースVII－THE CHARIOT');
      if(!heads){
        const now = locateCardAnyV4(ctx.card);
        if(now && now.zone === 'mz')
          API.changeControl(now, ctx.opponent, 'アルカナフォースVII－THE CHARIOT', 'permanent');
      }
      return;
    }
    const o = a6DestroyedFoeInBattle(ctx);
    const h = o && locateCardAnyV4(o);
    if(h && h.zone === 'grave' && c2MzOpen(ctx.player))
      API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'アルカナフォースVII－THE CHARIOT', h.p);
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return c2SummonedOrFlipped(ctx); },
    onFlip(ctx){ return c2SummonedOrFlipped(ctx); },
    onSpecialSummon(ctx){ return c2SummonedOrFlipped(ctx); },
    onDamageStep(ctx){
      const me = locateCardAnyV4(ctx.card);
      return !!me && me.zone === 'mz' && c2ArcanaHeads(me.card)
        && !!a6DestroyedFoeInBattle(ctx) && c2MzOpen(ctx.player); }
  }
});

/* ===================== D. 墓地からの特殊召喚 ===================== */

/* 19. ネフティスの鳳凰神 — 効果で破壊され墓地へ送られた場合、次の自分スタンバイに
       墓地から特殊召喚し、その特殊召喚成功時にフィールドの魔法・罠を全て破壊する */
API.registerScheduleHandler('c2.nephthys', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(!h || h.zone !== 'grave' || !c2MzOpen(p)) return;
  API.specialSummon(p, 'grave', h.index, 'atk', 'ネフティスの鳳凰神', h.p);
  const now = findCardByUid(uid);
  if(now && now.zone === 'mz') API.setCardFlag(now, 'c2NephthysTurn', gameState.turn, 'ネフティスの鳳凰神');
});
function c2NephthysReborn(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  if(Number(me.card.c2NephthysTurn || -1) !== gameState.turn) return false;
  return Number(me.card.c2NephthysFired || -1) !== gameState.turn;
}
defineScript('ネフティスの鳳凰神', {
  type:'monster', priority:1, forced:true, activateFrom:['grave','mz'],
  condition(ctx){
    if(c2NephthysReborn(ctx)) return true;
    if(!c1EffectDestroyedGrave(ctx)){ ctx.reason = 'カードの効果で破壊され墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me) return;
    if(me.zone === 'mz'){
      API.setCardFlag(me, 'c2NephthysFired', gameState.turn, 'ネフティスの鳳凰神');
      [0, 1].forEach(p => {
        API.fieldCards({ player:p, zone:'sz' }).map(x => x.card).forEach(c => {
          const h = locateCardAnyV4(c);
          if(h && h.zone === 'sz') API.destroy(h, 'ネフティスの鳳凰神', ctx.player);
        });
      });
      return;
    }
    if(me.zone !== 'grave') return;
    ensureCardUid(gameState, me.card);
    API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player, handler:'c2.nephthys',
                   args:{ uid:me.card.uid, player:ctx.player }, source:{ card:ctx.card },
                   note:'ネフティスの鳳凰神' });
  },
  afterResolve(){},
  passive:{
    onDestroy(ctx){ return c1EffectDestroyedGrave(ctx); },
    onSpecialSummon(ctx){ return c2NephthysReborn(ctx); }
  }
});

/* 20. ダークブレイズドラゴン — 墓地からの特殊召喚に成功した場合、攻守が元々の数値の倍になる。
       戦闘でモンスターを破壊し墓地へ送った場合、そのモンスターの元々の攻撃力分のダメージ */
function c2DarkblazeReborn(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  if(me.card.specialSummonedFrom !== 'grave') return false;
  if(Number(me.card.summonedTurn) !== gameState.turn) return false;
  return Number(me.card.c2DarkblazeTurn || -1) !== gameState.turn;
}
defineScript('ダークブレイズドラゴン', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'], dsTiming:'after',
  condition(ctx){
    if(c2DarkblazeReborn(ctx)) return true;
    if(!a6DestroyedFoeInBattle(ctx)){ ctx.reason = '墓地から特殊召喚された時、または戦闘で破壊した時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(c2DarkblazeReborn(ctx)){
      API.setCardFlag(me, 'c2DarkblazeTurn', gameState.turn, 'ダークブレイズドラゴン');
      const d = dbOf(me.card);
      API.modAtk(me, Math.max(0, d.atk || 0), Math.max(0, d.def || 0), 'permanent', 'ダークブレイズドラゴン');
      return;
    }
    const o = a6DestroyedFoeInBattle(ctx);
    if(o) API.damageLP(ctx.opponent, Math.max(0, dbOf(o).atk || 0));
  },
  afterResolve(){},
  passive:{
    onSpecialSummon(ctx){ return c2DarkblazeReborn(ctx); },
    onDamageStep(ctx){ return !!a6DestroyedFoeInBattle(ctx); }
  }
});

/* 21. スパイダー・スパイダー — 相手の守備表示モンスターを戦闘で破壊した場合、
       墓地のレベル4以下の昆虫族1体を特殊召喚できる */
function c2SpiderInsects(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === '昆虫' && Number(x.db.lv) <= 4);
}
function c2SpiderKilledDef(ctx){
  const o = a6DestroyedFoeInBattle(ctx);
  if(!o) return null;
  const g = o.graveInfo;
  return (g && g.pos === 'def') ? o : null;
}
/* S03-U24 (C-S03-20): 条件が墓地（戦闘で破壊され墓地へ送られたモンスター／墓地の資源）を見るので、⑤（墓地へ送られた後）の dsTiming 'leave'。 */
defineScript('スパイダー・スパイダー', {
  type:'monster', priority:1, targets:true, activateFrom:['mz'], dsTiming:'leave',
  condition(ctx){
    if(!c2SpiderKilledDef(ctx)){ ctx.reason = '守備表示モンスターを戦闘で破壊した場合に発動します'; return false; }
    if(!c2SpiderInsects(ctx.player).length){ ctx.reason = '墓地にレベル4以下の昆虫族がいません'; return false; }
    if(!c2MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('スパイダー・スパイダー：特殊召喚する昆虫族', c2SpiderInsects(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || !c2MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'スパイダー・スパイダー', r.p);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return !!c2SpiderKilledDef(ctx) && c2SpiderInsects(ctx.player).length > 0 && c2MzOpen(ctx.player); } }
});

/* 22. ブレイン・クラッシャー — 戦闘で破壊し墓地へ送った相手モンスターを、
       そのターンのエンドフェイズに墓地から特殊召喚できる（1ターンに1度） */
API.registerScheduleHandler('c2.brainCrusher', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'grave' && c2MzOpen(p))
    API.specialSummon(p, 'grave', h.index, 'atk', 'ブレイン・クラッシャー', h.p);
});
/* S03-U24 (C-S03-20): 条件が墓地（戦闘で破壊され墓地へ送られたモンスター／墓地の資源）を見るので、⑤（墓地へ送られた後）の dsTiming 'leave'。 */
defineScript('ブレイン・クラッシャー', {
  type:'monster', priority:1, countLimit:1, activateFrom:['mz'], dsTiming:'leave',
  condition(ctx){
    const o = a6DestroyedFoeInBattle(ctx);
    if(!o){ ctx.reason = '戦闘で相手モンスターを破壊した場合に発動します'; return false; }
    const h = locateCardAnyV4(o);
    if(!h || h.zone !== 'grave'){ ctx.reason = '破壊したモンスターが墓地にいません'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a6DestroyedFoeInBattle(ctx);
    const h = o && locateCardAnyV4(o);
    if(!h || h.zone !== 'grave') return;
    ensureCardUid(gameState, h.card);
    API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'c2.brainCrusher',
                   args:{ uid:h.card.uid, player:ctx.player }, source:{ card:ctx.card },
                   note:'ブレイン・クラッシャー' });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const o = a6DestroyedFoeInBattle(ctx);
    const h = o && locateCardAnyV4(o);
    return !!(h && h.zone === 'grave'); } }
});

/* 23. アギド — 戦闘で破壊され墓地へ送られた時、サイコロを1回振り、
       出た目と同じレベルの天使族1体を墓地から特殊召喚できる（6なら6以上） */
/* 特殊召喚できない宣言（スピリット等）を持つモンスターは特殊召喚先に選べない。
   engine の FX_SPECIAL_SUMMON も弾くが、候補に出す時点で除く。 */
function c2CanBeSpecialSummoned(db){
  const sc = (typeof CARD_SCRIPTS !== 'undefined') ? CARD_SCRIPTS[db.n] : null;
  return !(sc && sc.cannotSpecialSummon === true);
}
function c2AgidoTargets(p, roll){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === '天使'
    && c2CanBeSpecialSummoned(x.db)
    && !(typeof properlySummonedReasonS03==='function' && properlySummonedReasonS03(x.card, null, 'アギド', 'grave'))   /* S03-U127: 正規の召喚をしていない特殊召喚モンスターは蘇生できない */
    && (roll >= 6 ? Number(x.db.lv) >= 6 : Number(x.db.lv) === roll));
}
defineScript('アギド', {
  type:'monster', priority:1, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!c2MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    /* サイコロは replay 安全な duelRandomInt で振る */
    const roll = (typeof duelRandomInt === 'function' ? duelRandomInt(6) : 0) + 1;
    API.setFlag(ctx.player, 'c2AgidoRoll', roll, true);
    const q = c2AgidoTargets(ctx.player, roll);
    if(!q.length || !c2MzOpen(ctx.player)) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'アギド：出た目 ' + roll + ' — 特殊召喚する天使族',
      candidates: q, min:1, max:1, cancelable:true,
      resume:{handler:'s03u62.agido-summon', args:{player:ctx.player}},
      meta:{scriptName:'アギド'}});
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx) && c2MzOpen(ctx.player); } }
});
/* S03-U62: resolve() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.agido-summon', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(h && h.zone==='grave' && c2MzOpen(args.player))
    API.specialSummon(args.player, 'grave', h.index, 'atk', 'アギド', h.p);
});

/* 24. サイボーグドクター — 自分のチューナー1体をリリースし、
       同じ属性・レベルのモンスター1体を墓地から特殊召喚する（1ターンに1度） */
function c2CyborgTuners(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && (x.db.st || []).includes('チューナー') });
}
function c2CyborgRevive(p, db){
  return API.pileCards(p, 'grave', x => x.db.k === 'm'
    && x.db.at === db.at && Number(x.db.lv) === Number(db.lv));
}
defineScript('サイボーグドクター', {
  type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    const tuners = c2CyborgTuners(ctx.player);
    if(!tuners.length){ ctx.reason = 'リリースできるチューナーがいません'; return false; }
    if(!tuners.some(x => c2CyborgRevive(ctx.player, x.db).length)){
      ctx.reason = '同じ属性・レベルのモンスターが墓地にいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const tuners = c2CyborgTuners(ctx.player).filter(x => c2CyborgRevive(ctx.player, x.db).length);
    API.selectCard('サイボーグドクター：リリースするチューナー', tuners, a => {
      const q = c2CyborgRevive(ctx.player, a.db);
      API.selectCard('サイボーグドクター：特殊召喚するモンスター', q, b => done([a, b]));
    });
  },
  resolve(ctx){
    const ts = ctx.selectedTargets || [];
    if(ts.length < 2) return;
    const a = resolveTarget(ts[0]);
    if(!a || a.zone !== 'mz') return;
    const bCard = ts[1] && resolveTarget(ts[1]) && resolveTarget(ts[1]).card;
    API.sendToGrave(a, 'サイボーグドクター');
    const b = bCard && locateCardAnyV4(bCard);
    if(b && b.zone === 'grave' && c2MzOpen(ctx.player))
      API.specialSummon(ctx.player, 'grave', b.index, 'atk', 'サイボーグドクター', b.p);
  },
  afterResolve(){}
});
