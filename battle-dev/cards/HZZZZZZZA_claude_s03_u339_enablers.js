/* S03-U339: six cards whose enabling cards are already TESTED (carddata texts).

   ブラック・マジシャンズ・ナイト  通常召喚できない。「騎士の称号」の効果でのみ特殊召喚できる。①:特殊召喚に成功した場合、フィールドのカード1枚を対象として発動する。そのカードを破壊する。
   サイバー・バリア・ドラゴン      通常召喚できない。「アタック・リフレクター・ユニット」の効果でのみ特殊召喚できる。攻撃表示の場合、1ターンに1度だけ相手モンスター1体の攻撃を無効にする。
   サイバー・レーザー・ドラゴン    通常召喚できない。「フォトン・ジェネレーター・ユニット」の効果でのみ特殊召喚できる。このカードの攻撃力以上の攻撃力か守備力を持つモンスター1体を破壊する事ができる。この効果は1ターンに1度しか使用できない。
   ブラック・バック                （魔法）自分のターンのみ発動できる。自分の墓地の攻撃力2000以下の「BF」モンスター1体を選択して特殊召喚する。このカードを発動するターン、自分はモンスターを通常召喚できない。
   氷結界のロイヤル・ナイト        アドバンス召喚に成功した時、相手フィールドに「アイスコフュントークン」(水族・水・星1・攻1000/守0)1体を攻撃表示で特殊召喚する。このトークンはアドバンス召喚のためにはリリースできない。
   ヴァイロン・マター              （魔法）自分の墓地の装備魔法カード3枚を選択して発動する。デッキに加えてシャッフルし、以下から1つを選択して適用する。●デッキからカードを1枚ドローする。●相手フィールドのカード1枚を破壊する。

   Notes
   - The summon-only restrictions ("〜の効果でのみ特殊召喚できる", 通常召喚できない) are read from the card text by the engine (engine/1ZK); the cards only carry their effects.
   - バリア: an optional speed-2 trigger on onAttackDeclare (the pattern of 魔轟神獣ルビィラーダ) limited to once per turn and to Attack Position (checked when it is activated); the attack is negated with API.negateAttack (journaled).
   - ブラック・バック: the Normal Summon right is used up after the Special Summon with the journaled MANUAL_TOGGLE_NORMAL_RIGHT_V43 (as 宣告者の神託-class cards of S03-U265) when it is still available.
   - ロイヤル・ナイト: the token is created with noAdvanceTributeS03 on the opponent's side; the position (Attack) is the text's. ヴァイロン・マター: the three Graveyard cards are chosen at activation (three selections), the mode is chosen on resolution among the usable ones. */

/* ---- ブラック・マジシャンズ・ナイト ---- */
function u339KnightReady(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && ctx.eventName==='onSpecialSummon' && eventIsSelfS03(ctx); }
defineUnifiedCardV4('ブラック・マジシャンズ・ナイト', [{
  key:'summon-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true, targetRange:LOCATION.MZONE,
  condition(ctx){ return u339KnightReady(ctx) && API.fieldCards({}).length>0; },
  target(ctx, done){ API.selectCard('ブラック・マジシャンズ・ナイト：破壊するフィールドのカード', API.fieldCards({}), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && ['mz','sz','field'].indexOf(r.zone)>=0) API.destroy(r, 'ブラック・マジシャンズ・ナイト'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, targets:true, includesSpecialSummon:true, timing:['free'], passive:{ onSpecialSummon(ctx){ return u339KnightReady(ctx) && API.fieldCards({}).length>0; } }});

/* ---- サイバー・バリア・ドラゴン ---- */
function u339BarrierReady(ctx){
  const a = gameState.pendingAttack;
  return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && ctx.card.pos==='atk' && !!a && a.player===ctx.opponent;
}
defineUnifiedCardV4('サイバー・バリア・ドラゴン', [{
  key:'negate-attack', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:2, events:['onAttackDeclare'],
  condition(ctx){ return u339BarrierReady(ctx); },
  operation(){ API.negateAttack('サイバー・バリア・ドラゴン'); },
  afterResolve(){}
}], {type:'monster', priority:2, timing:['attackDeclare'], countLimit:{n:1, effects:['negate-attack']}, passive:{ onAttackDeclare(ctx){ return u339BarrierReady(ctx); } }});

/* ---- サイバー・レーザー・ドラゴン ---- */
function u339LaserPool(ctx){
  const a = curATK(ctx.card);
  return API.fieldCards({zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && (curATK(x.card)>=a || curDEF(x.card)>=a)});
}
defineUnifiedCardV4('サイバー・レーザー・ドラゴン', [{
  key:'destroy-stronger', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u339LaserPool(ctx).length){ ctx.reason = '攻撃力以上の攻撃力か守備力を持つモンスターがいません'; return false; }
    return true;
  },
  operation(ctx){
    const pool = u339LaserPool(ctx); if(!pool.length) return;
    API.selectCard('サイバー・レーザー・ドラゴン：破壊するモンスター', pool, t=>{
      const r = t && resolveTarget(t); if(r && r.zone==='mz' && r.card.face==='up') API.destroy(r, 'サイバー・レーザー・ドラゴン');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['destroy-stronger']}});

/* ---- ブラック・バック ---- */
function u339BackPool(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.BLACKWING) && Number(x.db.atk)<=2000); }
defineScript('ブラック・バック', {
  type:'spell', priority:1, targets:true,
  condition(ctx){
    if(ctx.player!==gameState.activePlayer){ ctx.reason = '自分のターンのみ発動できます'; return false; }
    if(!u339BackPool(ctx).length){ ctx.reason = '墓地に攻撃力2000以下の「BF」モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('ブラック・バック：特殊召喚する墓地の「BF」', u339BackPool(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='grave' && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'ブラック・バック');
    if(!API.me(ctx).normalSummonUsed) act({type:'MANUAL_TOGGLE_NORMAL_RIGHT_V43', player:ctx.player});
  },
  afterResolve(){}
});

/* ---- 氷結界のロイヤル・ナイト ---- */
function u339RoyalReady(ctx){
  const sp = ctx.card && ctx.card.summonProvenance;
  return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && ctx.eventName==='onNormalSummon' && eventIsSelfS03(ctx) && !!sp && sp.summonType==='tribute' && hasMonsterZoneSpace(ctx.opponent);
}
defineUnifiedCardV4('氷結界のロイヤル・ナイト', [{
  key:'advance-token', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'], forced:true,
  condition(ctx){ return u339RoyalReady(ctx); },
  operation(ctx){
    if(!hasMonsterZoneSpace(ctx.opponent)) return;
    API.createToken(ctx.opponent, {name:'アイスコフュントークン', atk:1000, def:0, lv:1, ra:'水', at:'水', pos:'atk', noAdvanceTributeS03:true}, 1);
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, includesSpecialSummon:true, timing:['free'], passive:{ onNormalSummon(ctx){ return u339RoyalReady(ctx); } }});

/* ---- ヴァイロン・マター ---- */
function u339MatterPool(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='s' && x.db.sub==='装備'); }
defineScript('ヴァイロン・マター', {
  type:'spell', priority:1, targets:true,
  condition(ctx){ if(u339MatterPool(ctx).length<3){ ctx.reason = '墓地に装備魔法カードが3枚ありません'; return false; } return true; },
  selectTargets(ctx, done){ v380SelectExactly('ヴァイロン・マター：デッキに加える装備魔法カード', u339MatterPool(ctx), 3, sel=>done(sel)); },
  resolve(ctx){
    (ctx.selectedTargets||[]).forEach(t=>{ const r = resolveTarget(t); if(r && r.zone==='grave' && r.p===ctx.player) API.returnToDeck(r, false, 'ヴァイロン・マター'); });
    API.shuffle(ctx.player);
    const opts = [];
    if(API.me(ctx).deck.length) opts.push({key:'draw', label:'デッキからカードを1枚ドローする'});
    if(API.fieldCards({player:ctx.opponent}).length) opts.push({key:'destroy', label:'相手フィールドのカード1枚を破壊する'});
    if(!opts.length) return;
    API.selectCard('ヴァイロン・マター：適用する効果', opts, t=>{
      if(t && t.key==='draw'){ API.draw(ctx.player, 1, 'ヴァイロン・マター'); return; }
      if(t && t.key==='destroy'){
        const pool = API.fieldCards({player:ctx.opponent}); if(!pool.length) return;
        API.selectCard('ヴァイロン・マター：破壊する相手のカード', pool, t2=>{ const r = t2 && resolveTarget(t2); if(r && r.p===ctx.opponent && ['mz','sz','field'].indexOf(r.zone)>=0) API.destroy(r, 'ヴァイロン・マター'); });
      }
    });
  },
  afterResolve(){}
});
