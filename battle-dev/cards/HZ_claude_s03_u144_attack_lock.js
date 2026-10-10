/* S03-U144: cards on the attack-time Spell/Trap lock (engine/1ZO_attack_lock_s03.js).

   古代の機械兵士   ①:このカードが攻撃する場合、相手はダメージステップ終了時まで魔法・罠カードを発動できない。
   古代の機械巨人   このカードは特殊召喚できない。① 同上。②:守備表示モンスターを攻撃した場合、貫通ダメージ。 (was ENGINE_GAP)
   インフェルニティ・ビースト  自分の手札が0枚の場合、このカードは以下の効果を得る。● 同上。
   ジェムナイト・マディラ     ①:このカードが戦闘を行う場合、相手はダメージステップ終了時まで魔法・罠・モンスターの効果を発動できない。
   古代の機械騎士 (デュアル)  ● 同上 (もう1度召喚された状態でのみ)。
   古代の機械巨竜   ②: 同上 (the old lockOpponentSpells / antiqueGearLock() was never consulted), and ① the effects gained from the
                    Gadgets released for its Tribute Summon (was missing):
                    ●グリーン・ガジェット: piercing ●レッド・ガジェット: when it inflicts battle damage to the opponent, 400 damage
                    ●イエロー・ガジェット: when it destroys an opponent monster by battle, 600 damage. */
function s03PiercingS03(info, self){
  if(!info || info.atkCard!==self || !info.defCard || info.defCard.pos!=='def') return 0;
  return Math.max(0, curATK(info.atkCard) - curDEF(info.defCard));
}

declareAttackLockS03('古代の機械兵士');
defineScript('古代の機械兵士', { type:'monster', priority:1,
  continuous:{ scope:'self', from:['mz'], apply(){ return null; } } });

declareAttackLockS03('古代の機械巨人');
defineScript('古代の機械巨人', { type:'monster', priority:1, cannotSpecialSummon:true,
  continuous:{ scope:'self', from:['mz'], apply(){ return null; }, piercingDamage(info){ return s03PiercingS03(info, info && info.self); } } });

declareAttackLockS03('インフェルニティ・ビースト', { active(card, h){ return (gameState.players[h.p].hand||[]).length===0; } });
defineScript('インフェルニティ・ビースト', { type:'monster', priority:1,
  continuous:{ scope:'self', from:['mz'], apply(){ return null; } } });

declareAttackLockS03('ジェムナイト・マディラ', { whenBattling:true, allEffects:true });
defineScript('ジェムナイト・マディラ', { type:'monster', priority:1,
  continuous:{ scope:'self', from:['mz'], apply(){ return null; } } });

declareAttackLockS03('古代の機械騎士', { active(card){ return geminiActiveS03(card); } });
defineGeminiS03('古代の機械騎士', { type:'monster', priority:1 });

/* ---- 古代の機械巨竜 ---- */
declareAttackLockS03('古代の機械巨竜');
function gearGadgetsS03(card){
  const prov = card && card.summonProvenance;
  if(!prov || prov.summonType!=='tribute' || !Array.isArray(prov.materialSnapshots)) return [];
  return prov.materialSnapshots.map(s=>{ const d = s && s.code!=null ? CARD_DB.find(x=>x && Number(x.c)===Number(s.code)) : null; return d ? d.n : null; }).filter(Boolean);
}
function gearHasS03(card, name){ return gearGadgetsS03(card).indexOf(name) >= 0; }
function gearKilledFoeS03(ctx){
  const b = ctx.battle || {};
  if(ctx.zone!=='mz' || ctx.step!=='leave') return false;
  return !!(b.atkCard===ctx.card ? (b.destroyedDef && b.defCard) : b.defCard===ctx.card ? (b.destroyedAtk && b.atkCard) : null);
}
defineUnifiedCardV4('古代の機械巨竜',[{
  key:'red', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && gearHasS03(ctx.card,'レッド・ガジェット') && a3DealtBattleDamage(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 400); },
  afterResolve(){}
},{
  key:'yellow', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return gearHasS03(ctx.card,'イエロー・ガジェット') && gearKilledFoeS03(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 600); },
  afterResolve(){}
}],{type:'monster', priority:1, dsTiming:'leave',
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    piercingDamage(info){ return (info && info.self && gearHasS03(info.self,'グリーン・ガジェット')) ? s03PiercingS03(info, info.self) : 0; } },
  passive:{
    onBattleDamage(ctx){ return ctx.zone==='mz' && gearHasS03(ctx.card,'レッド・ガジェット') && a3DealtBattleDamage(ctx); },
    onDamageStep(ctx){ return gearHasS03(ctx.card,'イエロー・ガジェット') && gearKilledFoeS03(ctx); }
  }});
