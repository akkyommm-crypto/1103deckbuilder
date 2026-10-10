/* Auto cycle 03 — 15枚。engine 変更なし。
     P ダメージステップ限定の攻撃力上昇 : continuous.apply → curStat の update 層
     Q 数に応じた継続攻撃力            : continuous.apply（+ piercingDamage）
     R コントロール移動                : P26 changeControl
     S 攻守操作・LP・トークン          : v14 StatModifier / v18 LP / v11 Token
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

/* ダメージステップ中か（攻撃宣言〜ダメージ計算の間だけ攻撃力を変える効果用）。
   gameState.battle は攻撃宣言で作られ、step がダメージステップの進行を持つ。 */
function a5InDamageStep(){
  const b = gameState.battle;
  return !!(b && b.step);
}
/* いま戦闘している相手側モンスター（自分が攻撃側でも守備側でも取れる）。 */
function a5BattleOtherOf(card){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  if(atk === card) return def || null;
  if(def === card) return atk || null;
  return null;
}
/* この card が今まさに攻撃を宣言している側か */
function a5IsAttackerCard(card){
  const b = gameState.battle;
  if(!b) return false;
  return (gameState.players[b.player].mz || [])[b.atkIdx] === card;
}
/* ダメージステップ限定の自己攻撃力上昇を1枚で宣言するヘルパ。
   gain(self) が上昇値（0なら適用しない）を返す。 */
function a5DamageStepAtkUp(name, gain){
  defineScript(name, {
    type:'monster', priority:1,
    continuous:{
      scope:'self', from:['mz'],
      apply(target, self){
        if(target !== self) return null;
        if(!a5InDamageStep()) return null;
        const n = gain(self) || 0;
        return n > 0 ? { atk:n } : null;
      }
    }
  });
}

/* ===================== P. ダメージステップ限定の攻撃力上昇 ===================== */

/* 1. ダッシュ・ウォリアー — 攻撃する場合、ダメージステップの間 +1200 */
a5DamageStepAtkUp('ダッシュ・ウォリアー', self => a5IsAttackerCard(self) ? 1200 : 0);

/* 2. 太陽の戦士 — 闇属性と戦闘を行う場合、ダメージステップの間 +500 */
a5DamageStepAtkUp('太陽の戦士', self => {
  const o = a5BattleOtherOf(self);
  return (o && dbOf(o).at === '闇') ? 500 : 0;
});

/* 3. 月の女戦士 — 光属性と戦闘をする場合、ダメージステップの間 +1000 */
a5DamageStepAtkUp('月の女戦士', self => {
  const o = a5BattleOtherOf(self);
  return (o && dbOf(o).at === '光') ? 1000 : 0;
});

/* 4. 空の昆虫兵 — 風属性のモンスターを「攻撃する場合」、ダメージステップの間 +1000。
   攻撃される側では上がらない。 */
a5DamageStepAtkUp('空の昆虫兵', self => {
  if(!a5IsAttackerCard(self)) return 0;
  const o = a5BattleOtherOf(self);
  return (o && dbOf(o).at === '風') ? 1000 : 0;
});

/* 5. エトワール・サイバー — 直接攻撃する場合、ダメージステップの間 +500 */
a5DamageStepAtkUp('エトワール・サイバー', self => {
  const b = gameState.battle;
  if(!b || b.target !== 'direct') return 0;
  return a5IsAttackerCard(self) ? 500 : 0;
});

/* ===================== Q. 数に応じた継続攻撃力 ===================== */

/* 6. 逆ギレパンダ — 相手フィールドのモンスター1体につき +500。
   さらに守備表示モンスターを攻撃した時に貫通する。 */
defineScript('逆ギレパンダ', {
  type:'monster', priority:1,
  continuous:{
    scope:'self', from:['mz'],
    apply(target, self, info){
      if(target !== self) return null;
      const foe = (info && info.p === 0) ? 1 : 0;
      const n = (gameState.players[foe].mz || []).filter(Boolean).length;
      return n > 0 ? { atk:500 * n } : null;
    },
    piercingDamage(info){
      if(info.atkCard !== info.self || !info.defCard || info.defCard.pos !== 'def') return 0;
      return Math.max(0, curATK(info.atkCard) - curDEF(info.defCard));
    }
  }
});

/* 7. ミレニアム・スコーピオン — 相手モンスターを戦闘破壊し墓地へ送る度に +500（永続）。
   MOD_ADD はダメージ計算以降を禁じているため、回数だけをカードに残して
   継続効果で攻撃力へ反映する（純 JSON・Replay 安全）。 */
function a5ScorpionStacks(card){ return Math.max(0, Number(card && card.a5ScorpionN) || 0); }
defineScript('ミレニアム・スコーピオン', {
  type:'monster', priority:1, forced:true, dsTiming:'leave',
  condition(ctx){
    const b = ctx.battle || {};
    const killed = (b.atkCard === ctx.card && b.destroyedDef && b.defCard)
                || (b.defCard === ctx.card && b.destroyedAtk && b.atkCard);
    if(!killed){ ctx.reason = '相手モンスターを戦闘によって破壊した場合に発動します'; return false; }
    if(ctx.zone !== 'mz'){ ctx.reason = 'フィールドに残っている必要があります'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.setCardFlag(me, 'a5ScorpionN', a5ScorpionStacks(ctx.card) + 1, 'ミレニアム・スコーピオン');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const b = ctx.battle || {};
    if(ctx.zone !== 'mz') return false;
    return !!((b.atkCard === ctx.card && b.destroyedDef && b.defCard)
           || (b.defCard === ctx.card && b.destroyedAtk && b.atkCard)); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(target, self){
      if(target !== self) return null;
      const n = a5ScorpionStacks(self);
      return n > 0 ? { atk:500 * n } : null;
    }
  }
});

/* ===================== R. コントロール移動 ===================== */

/* 8. A・O・J エネミー・キャッチャー — 召喚に成功した時、相手の裏側守備1体の
   コントロールをエンドフェイズ時まで得る（任意） */
function a5FaceDownFoe(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'mz',
    filter:x => x.card.face === 'down' });
}
defineScript('A・O・J エネミー・キャッチャー', {
  type:'monster', priority:1, targets:true,
  condition(ctx){
    const e = ctx.event || {};
    if(!(e.card === ctx.card || e.uid === ctx.card.uid)){ ctx.reason = 'このカードの召喚時に発動します'; return false; }
    if(!a5FaceDownFoe(ctx).length){ ctx.reason = '相手フィールドに裏側守備表示のモンスターがいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('A・O・J エネミー・キャッチャー：コントロールを得るモンスター',
      a5FaceDownFoe(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.changeControl(r, ctx.player, 'A・O・J エネミー・キャッチャー', 'endPhase', { card:ctx.card });
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    const e = ctx.event || {};
    return (e.card === ctx.card || e.uid === ctx.card.uid)
      && a5FaceDownFoe(ctx).length > 0 && API.me(ctx).mz.length < ZONE_LIMITS.mz; } }
});

/* 9. X・E・N・O — リバース:相手モンスター1体のコントロールをエンドフェイズ時まで得る。
   得たモンスターはこのターン相手プレイヤーに直接攻撃できる。 */
defineScript('X・E・N・O', {
  type:'monster', priority:1, forced:true, targets:true,
  condition(ctx){
    if(!a4Flipped(ctx)){ ctx.reason = 'リバースした場合に発動します'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('X・E・N・O：コントロールを得るモンスター',
      API.fieldCards({ player:ctx.opponent, zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    const card = r.card;
    API.changeControl(r, ctx.player, 'X・E・N・O', 'endPhase', { card:ctx.card });
    const now = locateCardAnyV4(card);
    if(now && now.zone === 'mz') API.grantDirectAttack(now);
  },
  afterResolve(){},
  passive:{ onFlip(ctx){
    return a4Flipped(ctx)
      && API.fieldCards({ player:ctx.opponent, zone:'mz' }).length > 0
      && API.me(ctx).mz.length < ZONE_LIMITS.mz; } }
});

/* 10. シエンの間者 — 自分の表側モンスター1体のコントロールを
   このターンのエンドフェイズ時まで相手に移す */
function a5OwnFaceUp(ctx){
  return API.fieldCards({ player:ctx.player, zone:'mz', filter:x => x.card.face === 'up' });
}
defineScript('シエンの間者', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!a5OwnFaceUp(ctx).length){ ctx.reason = '自分フィールドに表側表示のモンスターがいません'; return false; }
    if(API.foe(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = '相手のモンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('シエンの間者：相手に渡すモンスター', a5OwnFaceUp(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.changeControl(r, ctx.opponent, 'シエンの間者', 'endPhase', { card:ctx.card });
  },
  afterResolve(){}
});

/* ===================== S. 攻守操作・LP・トークン ===================== */

/* 11. コアラッコ — 他の獣族が自分の場にいる場合、相手モンスター1体の攻撃力を
   エンドフェイズ時まで0にできる。1ターンに1度。 */
defineScript('コアラッコ', {
  type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    const beasts = API.fieldCards({ player:ctx.player, zone:'mz',
      filter:x => x.card !== ctx.card && x.db.ra === '獣' });
    if(!beasts.length){ ctx.reason = 'このカード以外の獣族モンスターが必要です'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('コアラッコ：攻撃力を0にするモンスター',
      API.fieldCards({ player:ctx.opponent, zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.setAtk(r, 0, 'endPhase', 'コアラッコ');
  },
  afterResolve(){}
});

/* 12. 強化人類サイコ — 墓地のサイキック族1体を除外して攻撃力+500。1ターンに2度まで。 */
function a5PsychicGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === 'サイキック');
}
defineScript('強化人類サイコ', {
  type:'monster', priority:1, countLimit:2, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!a5PsychicGrave(ctx.player).length){ ctx.reason = '墓地にサイキック族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('強化人類サイコ（コスト）：除外するサイキック族', a5PsychicGrave(ctx.player), t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'grave'){ API.banish(r, '強化人類サイコ（コスト）'); done(true); }
      else done(false);
    });
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.modAtk(me, 500, 0, 'permanent', '強化人類サイコ');
  },
  afterResolve(){}
});

/* 13. パワー・インジェクター — 600ライフを払い、そのターン中の全サイキック族の攻撃力+500。
   1ターンに1度。 */
defineScript('パワー・インジェクター', {
  type:'monster', priority:1, countLimit:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(API.me(ctx).lp <= 600){ ctx.reason = '600ライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 600); done(true); },
  resolve(ctx){
    API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' && x.db.ra === 'サイキック' })
      .forEach(x => { const r = resolveTarget(x); if(r) API.modAtk(r, 500, 0, 'endTurn', 'パワー・インジェクター'); });
  },
  afterResolve(){}
});

/* 14. オプションハンター — 自分のモンスターが戦闘破壊され墓地へ送られた時、
   そのモンスターの「元々の攻撃力」分だけライフを回復する（任意） */
function a5HunterVictim(ctx){
  const b = ctx.battle || {};
  if(b.destroyedDef && b.defCard) {
    const h = locateCardAnyV4(b.defCard);
    if(b.defCard.owner === ctx.player || (h && h.p === ctx.player)) return b.defCard;
  }
  if(b.destroyedAtk && b.atkCard){
    const h = locateCardAnyV4(b.atkCard);
    if(b.atkCard.owner === ctx.player || (h && h.p === ctx.player)) return b.atkCard;
  }
  return null;
}
defineScript('オプションハンター', {
  type:'trap', priority:2,
  condition(ctx){
    const v = a5HunterVictim(ctx);
    if(!v){ ctx.reason = '自分のモンスターが戦闘によって破壊された場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const v = a5HunterVictim(ctx);
    if(!v) return;
    /* 「元々の攻撃力」なので現在値ではなくカードテキストの数値を使う。 */
    const base = Math.max(0, Number(dbOf(v).atk) || 0);
    if(base > 0) API.recoverLP(ctx.player, base);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!a5HunterVictim(ctx); } }
});

/* 15. オイスターマイスター — 戦闘で破壊される以外の方法でフィールドから墓地へ送られた時、
   「オイスタートークン」1体を特殊召喚する */
function a5OysterOk(ctx){
  if(ctx.zone !== 'grave') return false;
  const e = ctx.event || {};
  if(!(e.card === ctx.card || (e.uid != null && e.uid === ctx.card.uid))) return false;
  if(e.reason === 'battle') return false;          /* 戦闘破壊は対象外 */
  const g = ctx.card.graveInfo;
  return !!(g && g.from === 'mz' && g.turn === gameState.turn);
}
defineScript('オイスターマイスター', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'], includesSpecialSummon:true,
  condition(ctx){
    if(!a5OysterOk(ctx)){ ctx.reason = '戦闘以外でフィールドから墓地へ送られた場合に発動します'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){
    API.createToken(ctx.player,
      { key:'オイスタートークン', name:'オイスタートークン', atk:0, def:0, lv:1, ra:'魚', at:'水', pos:'atk' }, 1);
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    return a5OysterOk(ctx) && API.me(ctx).mz.length < ZONE_LIMITS.mz; } }
});
