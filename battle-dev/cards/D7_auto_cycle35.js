/* Auto cycle 35 — 8枚。engine 変更なし。
     XXIVA ダメージ計算時だけの攻撃力アップ（continuous.apply + gameState.battle）
     XXIVB 除外した／破壊したモンスターの元々の攻撃力を足す
     XXIVC 場の状況で変動する攻撃力
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function e4MyTurn(p){ return gameState.activePlayer === p; }
function e4MainPhase(p){
  return (gameState.phase === 'main1' || gameState.phase === 'main2') && e4MyTurn(p);
}
function e4FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
/* いま戦闘している2体（攻撃側・守備側）を返す。戦闘中でなければ null。 */
function e4BattlePair(){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  if(!atk || !def) return null;
  return { atk, def };
}
/* self が戦闘しているときの相手側モンスター */
function e4BattleOther(self){
  const p = e4BattlePair();
  if(!p) return null;
  if(p.atk === self) return p.def;
  if(p.def === self) return p.atk;
  return null;
}
/* 装備カードが今ついているモンスター */
function e4Host(card){
  const t = card && card.equipTo;
  if(!t || t.uid == null) return null;
  const h = findCardByUid(t.uid);
  return (h && h.zone === 'mz') ? h : null;
}

/* ===================== A. ダメージ計算時だけの攻撃力アップ ===================== */

/* 1. バスターランチャー — 攻撃力1000以下のモンスターのみ装備可能。
      ダメージ計算時、相手モンスターが攻撃表示なら攻撃力、守備表示なら守備力が
      2500以上の場合、装備モンスターの攻撃力は2500ポイントアップする */
defineScript('バスターランチャー', {
  type:'spell', priority:1, targets:true, activateFrom:['sz'], timing:['mainPhase'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && Number(h.db.atk) <= 1000); },
              label:'攻撃力1000以下のみ' },
  condition(ctx){
    if(!API.fieldCards({ player:ctx.player, zone:'mz',
          filter:x => x.card.face === 'up' && Number(x.db.atk) <= 1000 }).length){
      ctx.reason = '装備できる攻撃力1000以下のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('バスターランチャー：装備するモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz',
        filter:x => x.card.face === 'up' && Number(x.db.atk) <= 1000 }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'sz')
      API.equipSpell(me, r, 'バスターランチャー');
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      const other = e4BattleOther(card);
      if(!other) return null;
      /* apply の中で curATK を呼ぶと再入するので、元々の数値（v14 base）で見る。 */
      const v = (other.pos === 'def') ? baseDefV14(other) : baseAtkV14(other);
      return v >= 2500 ? { atk:2500 } : null;
    }
  }
});

/* 2. ダーク・シティ — 「D－HERO」モンスターが、その攻撃力より高い攻撃力を持つ
      モンスターを攻撃した場合、攻撃モンスターの攻撃力はダメージ計算時のみ1000アップする */
defineScript('ダーク・シティ', {
  type:'spell', priority:1, activateFrom:['field'],
  condition(ctx){ ctx.reason = '継続効果のみのカードです'; return false; },
  resolve(){},
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['field'],
    apply(card, self){
      const me = locateCardAnyV4(self);
      if(!me || me.zone !== 'field' || me.card.face !== 'up') return null;
      const p = e4BattlePair();
      if(!p || p.atk !== card) return null;
      if(!isSetCardV4(dbOf(card), SETCODE.DESTINY_HERO)) return null;
      /* 攻撃側より守備側の攻撃力が高い場合だけ。base 層で比べて再入を避ける。 */
      return baseAtkV14(p.def) > baseAtkV14(card) ? { atk:1000 } : null;
    }
  }
});

/* ===================== B. 除外・破壊したモンスターの攻撃力を足す ===================== */

/* 3. ビーストライザー — 1ターンに1度、自分フィールドの表側の獣族・獣戦士族1体を除外し、
      自分フィールドの獣族・獣戦士族1体を対象として発動できる。
      その対象の攻撃力は、除外したモンスターの元々の攻撃力分アップする */
function e4BeastLike(x){ return x.db.ra === '獣' || x.db.ra === '獣戦士'; }
function e4MyBeasts(p, faceUpOnly){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => (!faceUpOnly || x.card.face === 'up') && e4BeastLike(x) });
}
API.registerChoiceHandler('e4.beastRiser', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  const add = Number(args && args.atk) || 0;
  if(r && r.zone === 'mz' && add > 0)
    API.modAtk(r, add, 0, 'permanent', 'ビーストライザー');
});
defineScript('ビーストライザー', {
  type:'trap', priority:2, countLimit:1, targets:true, activateFrom:['sz'],
  condition(ctx){
    if(!e4MyBeasts(ctx.player, true).length){
      ctx.reason = '除外できる表側表示の獣族・獣戦士族がいません'; return false; }
    if(e4MyBeasts(ctx.player, false).length < 2){
      ctx.reason = '対象にできる獣族・獣戦士族がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ビーストライザー（コスト）：除外する獣族・獣戦士族',
      e4MyBeasts(ctx.player, true), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz'){ done(false); return; }
    /* 「元々の攻撃力」は除外する前に確定させる。 */
    ctx.e4BanishedAtk = Number(dbOf(r.card).atk) || 0;
    API.banish(r, 'ビーストライザー（コスト）');
    done(true);
  },
  resolve(ctx){
    const q = e4MyBeasts(ctx.player, false);
    if(!q.length) return;
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'ビーストライザー：攻撃力を上げる獣族・獣戦士族',
      candidates: q,
      resume:{ handler:'e4.beastRiser',
               args:{ player:ctx.player, atk:Number(ctx.e4BanishedAtk) || 0 } }
    });
  },
  afterResolve(){}
});

/* 4. ドラグニティナイト－ゲイボルグ — 戦闘を行うダメージステップ開始時から
      ダメージ計算前までに1度、自分の墓地の鳥獣族1体を除外して発動できる。
      このカードの攻撃力はターン終了時まで、除外したモンスターの元々の攻撃力分アップする */
function e4WingedGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === '鳥獣');
}
defineScript('ドラグニティナイト－ゲイボルグ', {
  type:'monster', priority:1, countLimit:1, targets:true,
  dsTiming:'start', damageStepOnly:true, activateFrom:['mz'], timing:['damageStep'],
  condition(ctx){
    if(!e4FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!e4BattleOther(ctx.card)){
      ctx.reason = '戦闘を行うダメージステップに発動します'; return false; }
    if(!e4WingedGrave(ctx.player).length){
      ctx.reason = '墓地に鳥獣族モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ドラグニティナイト－ゲイボルグ（コスト）：除外する鳥獣族',
      e4WingedGrave(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave'){ done(false); return; }
    ctx.e4WingedAtk = Number(dbOf(r.card).atk) || 0;
    API.banish(r, 'ドラグニティナイト－ゲイボルグ（コスト）');
    done(true);
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    const add = Number(ctx.e4WingedAtk) || 0;
    if(me && me.zone === 'mz' && add > 0)
      API.modAtk(me, add, 0, 'endTurn', 'ドラグニティナイト－ゲイボルグ');
  },
  afterResolve(){}
});

/* ===================== C. 場の状況で変動する攻撃力 ===================== */

/* 5. ウィンドファーム・ジェネクス — 攻撃力はフィールドにセットされた魔法・罠の数×300アップ。
      手札を1枚墓地へ送って発動でき、フィールドのセットされた魔法・罠1枚を破壊する */
function e4SetSpellTraps(){
  return API.fieldCards({ zone:'sz', filter:x => x.card.face === 'down' });
}
defineScript('ウィンドファーム・ジェネクス', {
  type:'monster', priority:1, targets:true, activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    if(!e4FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!e4MainPhase(ctx.player)){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '墓地へ送る手札がありません'; return false; }
    if(!e4SetSpellTraps().length){
      ctx.reason = 'セットされた魔法・罠カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const q = API.pileCards(ctx.player, 'hand');
    if(!q.length){ done(false); return; }
    API.selectCard('ウィンドファーム・ジェネクス（コスト）：墓地へ送る手札', q, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){
        API.sendHandToGrave(ctx.player, r.index, 'ウィンドファーム・ジェネクス（コスト）');
        done(true);
      } else done(false);
    });
  },
  selectTargets(ctx, done){
    API.selectCard('ウィンドファーム・ジェネクス：破壊するセットされた魔法・罠',
      e4SetSpellTraps(), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'sz') API.destroy(r, 'ウィンドファーム・ジェネクス', ctx.player);
  },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self){
      if(card !== self) return null;
      const n = e4SetSpellTraps().length;
      return n ? { atk:n * 300 } : null;
    }
  }
});

/* 6. デス・ヴォルストガルフ — ①戦闘で相手モンスターを破壊し墓地へ送った場合、
      相手に500ダメージを与える。
      ②モンスターゾーンに存在する限り、お互いが通常魔法・速攻魔法を発動する度に、
        ターン終了時までこのカードの攻撃力は200ずつアップする */
function e4SelfKilled(ctx){
  const b = ctx.battle || {};
  if(b.atkCard === ctx.card && b.destroyedDef && b.defCard) return b.defCard;
  if(b.defCard === ctx.card && b.destroyedAtk && b.atkCard) return b.atkCard;
  return null;
}
function e4NormalOrQuickSpell(ctx){
  const e = ctx.event || {};
  if(e.kind !== 'spell') return false;
  return e.sub === 'normal' || e.sub === 'quick';
}
defineScript('デス・ヴォルストガルフ', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  activateFrom:['mz'], timing:['damageStep','chain'],
  condition(ctx){
    if(!e4FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(e4SelfKilled(ctx)) return true;
    if(!e4NormalOrQuickSpell(ctx)){
      ctx.reason = '戦闘破壊時、または通常・速攻魔法の発動時に処理します'; return false; }
    return true;
  },
  resolve(ctx){
    if(e4SelfKilled(ctx)){ API.damageLP(ctx.opponent, 500); return; }
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz')
      API.modAtk(me, 200, 0, 'endTurn', 'デス・ヴォルストガルフ');
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){ return e4FaceUpMz(ctx) && !!e4SelfKilled(ctx); },
    onActivateSuccess(ctx){ return e4FaceUpMz(ctx) && e4NormalOrQuickSpell(ctx); }
  }
});

/* 7. ビッグバン・シュート — 装備モンスターの攻撃力は400ポイントアップする。
      装備モンスターが守備表示モンスターを攻撃した時、
      その守備力を攻撃力が超えていればその数値だけ相手ライフに戦闘ダメージを与える。
      このカードがフィールドから離れた時、装備モンスターをゲームから除外する */
defineScript('ビッグバン・シュート', {
  type:'spell', priority:1, targets:true, activateFrom:['sz'], timing:['mainPhase'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.k === 'm'); } },
  condition(ctx){
    if(!API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }).length){
      ctx.reason = '装備できるモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ビッグバン・シュート：装備するモンスター',
      API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(!r || r.zone !== 'mz' || !me || me.zone !== 'sz') return;
    API.equipSpell(me, r, 'ビッグバン・シュート');
    const eq = locateCardAnyV4(ctx.card);
    const host = locateCardAnyV4(r.card);
    /* このカードが場を離れたら、装備モンスターを除外する。 */
    if(eq && host) API.linkOnLeave(host, eq, 'banish', 'ビッグバン・シュート');
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:400 };
    },
    piercingDamage(info){
      const self = info && info.self;
      if(!self || !self.equipTo) return 0;
      const atk = info.atkCard;
      if(!atk || atk.uid !== self.equipTo.uid) return 0;
      return Math.max(0, Number(info.amount) || 0);
    }
  }
});

/* 8. ネクロフェイス — 召喚に成功した時、除外されているカードを全てデッキに戻して
      シャッフルする。このカードの攻撃力は、戻した枚数×100ポイントアップする。
      このカードがゲームから除外された時、お互いはデッキの上から5枚を除外する */
function e4NecrofaceBanished(ctx){
  if(ctx.zone !== 'banish') return false;
  const e = ctx.event || {};
  return e.toZone === 'banish' && e.uid === ctx.card.uid;
}
function e4AllBanished(){
  return API.pileCards(0, 'banish').concat(API.pileCards(1, 'banish'));
}
defineScript('ネクロフェイス', {
  type:'monster', priority:1, forced:true, activateFrom:['mz','banish'],
  condition(ctx){
    if(ctx.zone === 'banish'){
      if(!e4NecrofaceBanished(ctx)){
        ctx.reason = 'ゲームから除外された時に発動します'; return false; }
      return true;
    }
    if(!(ctx.event && ctx.event.card === ctx.card)){
      ctx.reason = '召喚に成功した時に発動します'; return false; }
    if(!e4AllBanished().length){
      ctx.reason = '除外されているカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    if(ctx.zone === 'banish'){
      [0, 1].forEach(p => {
        const n = Math.min(5, (gameState.players[p].deck || []).length);
        for(let i = 0; i < n; i++){
          const top = API.pileCards(p, 'deck')[0];
          if(top) API.banish(top, 'ネクロフェイス');
        }
      });
      return;
    }
    /* 自分自身は除外されていないので、戻す対象に含まれない。 */
    let n = 0;
    let guard = 0;
    while(guard++ < 200){
      const q = e4AllBanished();
      if(!q.length) break;
      API.returnToDeck(q[0], false, 'ネクロフェイス');
      n++;
    }
    [0, 1].forEach(p => API.shuffle(p));
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz' && n > 0)
      API.modAtk(me, n * 100, 0, 'permanent', 'ネクロフェイス');
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){
      return ctx.zone === 'mz' && !!(ctx.event && ctx.event.card === ctx.card)
          && e4AllBanished().length > 0; },
    onLeaveField(ctx){ return e4NecrofaceBanished(ctx); }
  }
});
