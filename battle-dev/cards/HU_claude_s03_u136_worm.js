/* S03-U136: ワーム・ヤガン (NOT_STARTED) and W星雲隕石 (PARTIAL: an AUTO_DECK_TABLE "recruit ignition" that did not match its text)
   — both x3 in the fixed Worm major-deck list.

   ---- ワーム・ヤガン ----
   自分フィールド上のモンスターが「ワーム・ゼクス」1体のみの場合、このカードを墓地から裏側守備表示で特殊召喚できる。
   この効果で特殊召喚したこのカードは、フィールド上から離れた場合ゲームから除外される。
   このカードがリバースした時、相手フィールド上に表側表示で存在するモンスター1体を選択して持ち主の手札に戻す。
   - the revival is an ignition effect started from the GY (like グローアップ・バルブ); the only monster on the own field must be a
     face-up ワーム・ゼクス (a face-down card is not known as ワーム・ゼクス);
   - face-down Defense Position Special Summon (FX_SPECIAL_SUMMON faceDown, S03-U136), flagged banishWhenLeavesField;
   - the reversal effect is a forced trigger that targets; with no face-up opponent monster it does not activate. */
function wormYaganReviveOkS03(p){
  const mz = (gameState.players[p].mz||[]).filter(Boolean);
  return mz.length===1 && mz[0].face==='up' && cardName(mz[0])==='ワーム・ゼクス';
}
function wormYaganFoeTargetsS03(ctx){
  return API.fieldCards({player:1-ctx.player, zone:'mz', filter:x=>x.card.face==='up'});
}
defineUnifiedCardV4('ワーム・ヤガン',[{
  key:'revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.GRAVE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = '墓地で発動します'; return false; }
    if(!wormYaganReviveOkS03(ctx.player)){ ctx.reason = '自分フィールドのモンスターが表側表示の「ワーム・ゼクス」1体のみの場合に発動できます'; return false; }
    return true;
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone!=='grave') return;
    if(API.specialSummon(ctx.player, 'grave', me.index, 'def', 'ワーム・ヤガン', null, {faceDown:true})){
      const put = locateCardAnyV4(ctx.card);
      if(put && put.zone==='mz') API.setCardFlag(put, 'banishWhenLeavesField', true, 'ワーム・ヤガン', {silent:true});
    }
  },
  afterResolve(){}
},{
  key:'flip-bounce', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFlip'], forced:true,
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason = 'リバースした時に発動します'; return false; }
    if(!wormYaganFoeTargetsS03(ctx).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('ワーム・ヤガン：持ち主の手札に戻す相手の表側表示モンスター', wormYaganFoeTargetsS03(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.card.face==='up') API.returnToHand(r, 'ワーム・ヤガン');
  },
  afterResolve(){}
}],{type:'monster', priority:1, activateFrom:['grave','mz'], targets:true, includesSpecialSummon:true,
  passive:{
    onFlip(ctx){ return ctx.zone==='mz' && (!ctx.event || !ctx.event.card || ctx.event.card===ctx.card) && wormYaganFoeTargetsS03(ctx).length>0; }
  }});

/* ---- W星雲隕石 (通常罠) ----
   フィールド上に裏側表示で存在するモンスターを全て表側守備表示にする。
   このターンのエンドフェイズ時に自分フィールド上に表側表示で存在する爬虫類族・光属性モンスターを全て裏側守備表示にし、その枚数分だけ
   自分はデッキからカードをドローする。その後、自分のデッキからレベル7以上の爬虫類族・光属性モンスター1体を特殊召喚する事ができる。
   - the first part turns the monsters face-up by an effect (API.flipFaceUpByEffect → onFlip, so reversal effects such as
     ワーム・ヤガン's trigger);
   - the End Phase part is scheduled for this turn (System v7) and happens even though the trap has gone to the GY;
   - 「その後」: the optional Special Summon is offered only when at least one monster was turned face-down (and drawn for). */
function wNebulaReptileLightS03(c){
  if(!c) return false;
  const race = (typeof currentRaceV17==='function') ? currentRaceV17(c) : dbOf(c).ra;
  const attr = (typeof currentAttributeV17==='function') ? currentAttributeV17(c) : dbOf(c).at;
  return race==='爬虫類' && attr==='光';
}
defineScript('W星雲隕石', {
  type:'trap', priority:2,
  resolve(ctx){
    API.fieldCards({zone:'mz', filter:x=>x.card.face==='down'}).forEach(x=>API.flipFaceUpByEffect(x, 'def', 'W星雲隕石'));
    API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'s03u136.w-nebula-end', args:{player:ctx.player}, note:'W星雲隕石'});
  }
});
API.registerScheduleHandler('s03u136.w-nebula-end', (args)=>{
  const p = args && args.player;
  if(p!==0 && p!==1) return;
  const P = gameState.players[p];
  const turned = [];
  (P.mz||[]).forEach((c,i)=>{ if(c && c.face==='up' && wNebulaReptileLightS03(c)) turned.push(i); });
  turned.forEach(i=>act({type:'FX_SET_STATE', player:p, zone:'mz', index:i, face:'down', pos:'def', reason:'W星雲隕石'}));
  const n = turned.length;
  if(!n){ API.log('W星雲隕石：裏側守備表示にするモンスターがいない'); return; }
  const draw = Math.min(n, (P.deck||[]).length);
  if(draw) API.draw(p, draw);
  if((P.mz||[]).length >= ZONE_LIMITS.mz) return;
  if(typeof v46GlobalSpecialSummonRestrictionReason==='function' && v46GlobalSpecialSummonRestrictionReason(p)) return;
  const q = API.pileCards(p, 'deck', x=>x.db.k==='m' && !x.db.ex && x.db.ra==='爬虫類' && x.db.at==='光' && (x.db.lv||0) >= 7);
  if(!q.length) return;
  API.requestChoice({player:p, kind:'card', title:'W星雲隕石：特殊召喚するレベル7以上の爬虫類族・光属性モンスター（しない場合はキャンセル）',
    candidates:q, min:1, max:1, cancelable:true, resume:{handler:'s03u136.w-nebula-summon', args:{player:p}}, meta:{scriptName:'W星雲隕石'}});
});
API.registerChoiceHandler('s03u136.w-nebula-summon', (answer, args)=>{
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(h && h.zone==='deck' && h.p===args.player) API.specialSummon(args.player, 'deck', h.index, 'atk', 'W星雲隕石');
});
