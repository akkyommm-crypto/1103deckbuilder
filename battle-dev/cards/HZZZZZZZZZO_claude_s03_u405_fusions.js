/* S03-U405: カタパルト・ウォリアー, ジャンク・バーサーカー, 重爆撃禽 ボム・フェネクス, 異星の最終戦士, スーパービークロイド－ジャンボドリル (NOT_STARTED cards, carddata texts).

   カタパルト・ウォリアー  自分フィールド上に存在する「ジャンク」と名のついたモンスター1体をリリースして発動する。リリースしたモンスターの元々の攻撃力分のダメージを相手ライフに与える。この効果は1ターンに1度しか使用できない。
   ジャンク・バーサーカー  自分の墓地に存在する「ジャンク」と名のついたモンスター1体をゲームから除外し、相手フィールド上に表側表示で存在するモンスター1体を選択して発動する。選択した相手モンスターの攻撃力は、除外したモンスターの攻撃力分ダウンする。また、このカードが守備表示のモンスターを攻撃した場合、ダメージ計算を行わずそのモンスターを破壊する。
   重爆撃禽 ボム・フェネクス  自分のメインフェイズ時、フィールド上に存在するカード1枚につき300ポイントダメージを相手ライフに与える事ができる。この効果を発動するターンこのカードは攻撃する事ができない。この効果は1ターンに1度しか使用できない。
   異星の最終戦士  このカードが特殊召喚に成功した時、このカード以外の自分フィールド上に存在するモンスターを全て破壊する。このカードがフィールド上に表側表示で存在する限り、お互いにモンスターを召喚・反転召喚・特殊召喚する事はできない。
   スーパービークロイド－ジャンボドリル  このカードが守備表示モンスターを攻撃した時、その守備力を攻撃力が超えていれば、その数値だけ相手ライフに戦闘ダメージを与える。

   Notes
   - The Fusion / Synchro materials are summon procedures handled elsewhere (the tests place the monsters on the field).
   - カタパルト・ウォリアー / バーサーカー / ボム・フェネクス: once-per-turn ignitions (countLimit); the cost of the first releases (sendToGrave) a Junk monster and stores its printed ATK in a turn player flag; the Berserker banishes a Junk monster of the Graveyard and applies a permanent ATK modifier (v4RegisterStatModifier, until it leaves the field / is turned face-down) to the chosen face-up opponent monster; its destruction of a Defense Position monster before the damage calculation is the S03-A3 helpers a3IsAttacker / a3AttackTarget / a3DestroyBeforeDamage with dsTiming 'start'; the Phoenix burn counts every card on the field (monster, Spell & Trap and Field Zones of both players) and stamps cannotAttackTurn.
   - 異星の最終戦士: forced onSpecialSummon trigger destroying the other monsters of its controller; summonLockS03 for all three kinds of both players while it is face-up.
   - ジャンボドリル: continuous piercingDamage (as ダークネス・デストロイヤー, S03-A6). */

/* ---- カタパルト・ウォリアー ---- */
function u405Junk(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && String(x.db.n||'').indexOf('ジャンク')>=0}); }
function u405Main(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
defineUnifiedCardV4('カタパルト・ウォリアー', [{
  key:'catapult', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u405Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u405Junk(ctx).length){ ctx.reason = '自分フィールドに「ジャンク」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u405Junk(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('カタパルト・ウォリアー：リリースする「ジャンク」モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.setFlag(ctx.player, 'u405Atk', Number(dbOf(r.card).atk)||0, true);
      API.sendToGrave(r, 'カタパルト・ウォリアー（リリース）'); done(true);
    });
  },
  operation(ctx){ API.damageLP(ctx.opponent, Number(API.getFlag(ctx.player, 'u405Atk'))||0, 'カタパルト・ウォリアー'); },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['catapult']}, timing:['free'] });

/* ---- ジャンク・バーサーカー ---- */
function u405GraveJunk(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('ジャンク')>=0); }
function u405FoeUp(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}); }
function u405Crush(ctx){
  if(ctx.zone!=='mz' || ctx.card.face!=='up' || !a3IsAttacker(ctx)) return null;
  const d = a3AttackTarget();
  return (d && d.pos==='def') ? d : null;
}
defineUnifiedCardV4('ジャンク・バーサーカー', [{
  key:'berserk', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u405Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u405GraveJunk(ctx).length){ ctx.reason = '墓地に「ジャンク」モンスターがいません'; return false; }
    if(!u405FoeUp(ctx).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u405GraveJunk(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('ジャンク・バーサーカー：除外する「ジャンク」モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; }
      API.setFlag(ctx.player, 'u405Atk', Number(dbOf(r.card).atk)||0, true);
      API.banish(r, 'ジャンク・バーサーカー（コスト）'); done(true);
    });
  },
  target(ctx, done){ API.selectCard('ジャンク・バーサーカー：攻撃力を下げる相手モンスター', u405FoeUp(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const n = Number(API.getFlag(ctx.player, 'u405Atk'))||0;
    if(r && r.zone==='mz' && r.p===ctx.opponent && r.card.face==='up' && n>0) v4RegisterStatModifier(r, {atk:-n}, {code:'ジャンク・バーサーカー', resetMask:RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){}
}, {
  key:'crush', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u405Crush(ctx); },
  operation(ctx){ const d = u405Crush(ctx); if(d) a3DestroyBeforeDamage(d, 'ジャンク・バーサーカー'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, timing:['free'], dsTiming:'start',
  passive:{ onDamageStep(ctx){ return !!u405Crush(ctx); } } });

/* ---- 重爆撃禽 ボム・フェネクス ---- */
function u405FieldCards(){ return API.fieldCards({zone:'mz'}).length + API.fieldCards({zone:'sz'}).length + API.fieldCards({zone:'field'}).length; }
defineUnifiedCardV4('重爆撃禽 ボム・フェネクス', [{
  key:'bomb', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u405Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.card.attacked || Number(ctx.card.attackCount)>0){ ctx.reason = 'このターン攻撃したため発動できません'; return false; }
    return true;
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'cannotAttackTurn', gameState.turn, '重爆撃禽 ボム・フェネクス', {silent:true});
    API.damageLP(ctx.opponent, u405FieldCards()*300, '重爆撃禽 ボム・フェネクス');
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['bomb']}, timing:['free'] });

/* ---- 異星の最終戦士 ---- */
function u405AlienSelf(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && (e.uid===ctx.card.uid || e.card===ctx.card); }
defineUnifiedCardV4('異星の最終戦士', [{
  key:'purge', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u405AlienSelf(ctx) && API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card}).length>0; },
  operation(ctx){ API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card}).slice().reverse().forEach(t=>API.destroy(t, '異星の最終戦士')); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'],
  summonLockS03:(i)=> i.kind==='normal' || i.kind==='flip' || i.kind==='special',
  passive:{ onSpecialSummon(ctx){ return u405AlienSelf(ctx) && API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card}).length>0; } } });

/* ---- スーパービークロイド－ジャンボドリル ---- */
defineScript('スーパービークロイド－ジャンボドリル', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    piercingDamage(info){
      if(info.atkCard !== info.self || !info.defCard || info.defCard.pos !== 'def') return 0;
      return Math.max(0, curATK(info.atkCard) - curDEF(info.defCard));
    } }
});
