/* S03-U434: インセクト・プリンセス, ツインヘッド・ケルベロス, 代打バッター, 穿孔虫, 白兵戦型お手伝いロボ (stale ENGINE_GAP cards, carddata texts).

   インセクト・プリンセス    このカードがフィールド上に表側表示で存在する限り、相手フィールド上に表側表示で存在する昆虫族モンスターは全て攻撃表示になる。このカードが戦闘によって昆虫族モンスターを破壊する度に、このカードの攻撃力は500ポイントアップする。
   ツインヘッド・ケルベロス  自分フィールド上にこのカード以外の悪魔族モンスターが表側表示で存在する場合、このカードが戦闘で破壊したリバース効果モンスターの効果は無効化される。
   代打バッター              ①：このカードが自分フィールドから墓地へ送られた時に発動できる。手札から昆虫族モンスター1体を特殊召喚する。
   穿孔虫                    このカードが相手ライフに戦闘ダメージを与えた時、自分のデッキに存在する自分の「寄生虫パラサイド」1枚をデッキの一番上に置く事ができる。
   白兵戦型お手伝いロボ      このカードが戦闘によって相手モンスターを破壊する度に、自分はカードを1枚ドローした後手札からカードを1枚選択してデッキの一番下に戻す。

   Notes
   - プリンセス: continuous scope 'oppMonsters' + forcedPosition (engine/19) for face-up Insects; the +500 is a forced onDamageStep (dsTiming 'after') when the destroyed foe is an Insect (u321Killed: it also covers being the defender), added with API.addBaseStats (permanent).
   - ケルベロス: declareBattleDestroyedNegatorS03 (engine/1S, Flip chains included since U432): condition = another face-up Fiend on the destroyer's field and a Flip victim (u432Flip).
   - 代打バッター: optional Graveyard trigger (onSendToGrave, graveInfo.from 'mz'); the Insect is chosen from the hand.
   - 穿孔虫: optional onBattleDamage trigger (v6SelfDealt, damage to the opponent) - FX_RETURN_DECK puts the chosen 「寄生虫パラサイド」 on top of the Deck.
   - お手伝いロボ: forced onDamageStep after destroying a monster (u321Killed) - draw 1, then a chosen hand card goes to the bottom of the Deck (FX_RETURN_DECK zone 'hand', toBottom). */

/* ---- インセクト・プリンセス ---- */
function u434Princess(ctx){
  const v = u321Killed(ctx);
  return ctx.zone==='mz' && ctx.card.face==='up' && !!v && dbOf(v).ra==='昆虫';
}
defineUnifiedCardV4('インセクト・プリンセス', [{
  key:'grow', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u434Princess(ctx); },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz') API.addBaseStats(h, 500, 0, 'permanent', 'インセクト・プリンセス'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], forced:true, dsTiming:'after', passive:{ onDamageStep(ctx){ return u434Princess(ctx); } },
  continuous:{ scope:'oppMonsters', from:['mz'], apply(){ return null; },
    forcedPosition(target, self){ return (self.face==='up' && target.face==='up' && dbOf(target).ra==='昆虫') ? 'atk' : null; } } });

/* ---- ツインヘッド・ケルベロス ---- */
defineScript('ツインヘッド・ケルベロス', {
  type:'monster', priority:1, timing:['free'],
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){} });
declareBattleDestroyedNegatorS03('ツインヘッド・ケルベロス', {effectOnly:false, condition(destroyer, victim){
  const h = locateCardAnyV4(destroyer); if(!h) return false;
  return API.fieldCards({player:h.p, zone:'mz', filter:x=>x.card!==destroyer && x.card.face==='up' && x.db.ra==='悪魔'}).length>0 && u432Flip(dbOf(victim));
}});

/* ---- 代打バッター ---- */
function u434Insects(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m' && x.db.ra==='昆虫' && canEffectSpecialSummonS03(x.card, 'hand', '代打バッター')); }
function u434Pinch(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && Number(g.turn)===Number(gameState.turn);
}
defineUnifiedCardV4('代打バッター', [{
  key:'pinch', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
  condition(ctx){ return u434Pinch(ctx) && u434Insects(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); },
  operation(ctx){
    const pool = u434Insects(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('代打バッター：特殊召喚する昆虫族モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      API.specialSummon(ctx.player, 'hand', r.index, 'atk', '代打バッター');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], activateFrom:['grave'], passive:{ onSendToGrave(ctx){ return u434Pinch(ctx) && u434Insects(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); } } });

/* ---- 穿孔虫 ---- */
function u434Parasites(p){ return API.pileCards(p, 'deck', x=>x.db.n==='寄生虫パラサイド'); }
function u434Bore(ctx){ return typeof v6SelfDealt==='function' && v6SelfDealt(ctx) && !!ctx.event && ctx.event.player===ctx.opponent && u434Parasites(ctx.player).length>0; }
defineUnifiedCardV4('穿孔虫', [{
  key:'bore', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'],
  condition(ctx){ return u434Bore(ctx); },
  operation(ctx){
    const pool = u434Parasites(ctx.player); if(!pool.length) return;
    API.selectCard('穿孔虫：デッキの一番上に置く「寄生虫パラサイド」', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='deck' && r.p===ctx.player) act({type:'FX_RETURN_DECK', player:r.p, zone:'deck', index:r.index, toBottom:false, reason:'穿孔虫'});
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], passive:{ onBattleDamage(ctx){ return u434Bore(ctx); } } });

/* ---- 白兵戦型お手伝いロボ ---- */
function u434Robo(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && !!u321Killed(ctx); }
defineUnifiedCardV4('白兵戦型お手伝いロボ', [{
  key:'draw-return', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u434Robo(ctx); },
  operation(ctx){
    API.draw(ctx.player, 1);
    const pool = API.pileCards(ctx.player, 'hand', x=>true); if(!pool.length) return;
    API.selectCard('白兵戦型お手伝いロボ：デッキの一番下に戻す手札', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='hand' && r.p===ctx.player) act({type:'FX_RETURN_DECK', player:r.p, zone:'hand', index:r.index, toBottom:true, reason:'白兵戦型お手伝いロボ'});
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], forced:true, dsTiming:'after', passive:{ onDamageStep(ctx){ return u434Robo(ctx); } } });
