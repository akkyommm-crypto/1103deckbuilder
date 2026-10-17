/* S03-U400: 第一の棺, 第二の棺, 第三の棺, スピリッツ・オブ・ファラオ (NOT_STARTED cards, carddata texts).

   第一の棺      （永続罠）相手ターンのエンドフェイズ毎に「第二の棺」「第三の棺」の順にカードを1枚手札またはデッキから自分フィールド上に表側表示で出す。1枚でもフィールド上から離れると、これらのカードは全て墓地に送られる。全てのカードが自分フィールド上に揃った時、これらのカードを全て墓地へ送り、手札またはデッキから「スピリッツ・オブ・ファラオ」1体を特殊召喚する。
   第二の棺 / 第三の棺  （永続魔法）このカードは「第一の棺」の効果でしかフィールドに出す事ができない。
   スピリッツ・オブ・ファラオ  このカードは通常召喚できない。「第一の棺」の効果でのみ特殊召喚する事ができる。このカードが特殊召喚に成功した時、自分の墓地からレベル2以下のアンデット族通常モンスターを4体まで特殊召喚する事ができる。

   Notes
   - 第一の棺: a forced onEndPhase trigger in the OPPONENT's turn places the next coffin from the hand / Deck face-up in the Spell & Trap Zone (act MOVE, as S03-U337) and records the stage in effectFlags.u400Stage (1 = only 第一, 2 = with 第二, 3 = all three); when all three stand there they go to the Graveyard and スピリッツ・オブ・ファラオ is Special Summoned from the hand / Deck (reason 第一の棺, conditions ignored).
   - 「1枚でもフィールド上から離れると全て墓地に送られる」: selfDestroyWhenS03 on every coffin (engine/1ZZF, Spell & Trap Zones too): when a coffin required by the stage is missing the present ones go to the Graveyard (engine records it as a destruction, a small deviation from 「墓地に送られる」).
   - 第二/第三の棺: not activatable (a script that refuses every activation); the Set / activation from the hand is not offered because the condition is false. スピリッツ: cannotNormalSummon + the text rule 「の効果でのみ特殊召喚」 (engine/1ZK, reason 第一の棺). */

function u400Names(){ return ['第一の棺','第二の棺','第三の棺']; }
function u400Stage(p){ return Number(API.getFlag(p, 'u400Stage'))||0; }
function u400OnField(p, name){ return API.fieldCards({player:p, zone:'sz', filter:x=>x.card.face==='up' && x.db.n===name}); }
function u400Broken(p){
  const S = u400Stage(p); if(S<=0) return false;
  for(let i=0;i<S;i++) if(!u400OnField(p, u400Names()[i]).length) return true;
  return false;
}
function u400SelfDestroy(card, p){
  if(!u400Broken(p)) return false;
  return '第一の棺：1枚でもフィールドから離れたため全て墓地へ送られる';
}
const U400_COFFIN_BODY = {
  type:'spell', priority:1,
  condition(ctx){ ctx.reason = '「第一の棺」の効果でしかフィールドに出す事ができません'; return false; },
  resolve(){}, afterResolve(){},
  selfDestroyWhenS03:u400SelfDestroy
};
defineScript('第二の棺', Object.assign({}, U400_COFFIN_BODY));
defineScript('第三の棺', Object.assign({}, U400_COFFIN_BODY));
function u400Mine(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending; }
function u400EndTurnOpp(ctx){ return u400Mine(ctx) && ctx.player!==gameState.activePlayer; }
function u400Find(p, name){
  return API.pileCards(p, 'hand', x=>x.db.n===name).map(x=>({zone:'hand', x})).concat(API.pileCards(p, 'deck', x=>x.db.n===name).map(x=>({zone:'deck', x})));
}
function u400Place(p, name){
  const f = u400Find(p, name)[0]; if(!f) return false;
  if(gameState.players[p].sz.length>=ZONE_LIMITS.sz) return false;
  act({type:'MOVE', player:p, from:f.zone, fromIndex:f.x.index, to:'sz', face:'up', pos:'atk'});
  return true;
}
defineUnifiedCardV4('第一の棺', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ const h = locateCardAnyV4(ctx.card); return !(h && h.zone==='sz' && ctx.card.face==='up'); },
  operation(ctx){ API.setFlag(ctx.player, 'u400Stage', 1, false); }, afterResolve(){}
}, {
  key:'coffin', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u400EndTurnOpp(ctx) && u400Stage(ctx.player)>=1; },
  operation(ctx){
    const p = ctx.player, S = u400Stage(p);
    if(S===1){ if(u400Place(p, '第二の棺')) API.setFlag(p, 'u400Stage', 2, false); return; }
    if(S===2){ if(!u400Place(p, '第三の棺')) return; API.setFlag(p, 'u400Stage', 3, false); }
    if(u400Stage(p)>=3 && u400Names().every(n=>u400OnField(p, n).length)){
      u400Names().slice().reverse().forEach(n=>{ u400OnField(p, n).forEach(h=>{ const hh = locateCardAnyV4(h.card); if(hh && hh.zone==='sz') API.sendToGrave(hh, '第一の棺'); }); });
      API.setFlag(p, 'u400Stage', 0, false);
      const f = u400Find(p, 'スピリッツ・オブ・ファラオ')[0];
      if(f && hasMonsterZoneSpace(p)) API.specialSummon(p, f.zone, f.x.index, 'atk', '第一の棺', null, {ignoreSummonConditionS03:true});
    }
  },
  afterResolve(){}
}], {type:'trap', priority:2, forced:true, selfDestroyWhenS03:u400SelfDestroy,
  passive:{ onEndPhase(ctx){ return u400EndTurnOpp(ctx) && u400Stage(ctx.player)>=1; } } });
CARD_SCRIPTS['第一の棺'].selfDestroyWhenS03 = u400SelfDestroy;

/* ---- スピリッツ・オブ・ファラオ ---- */
function u400Undead(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra==='アンデット' && (x.db.st||[]).indexOf('通常')>=0 && Number(x.db.lv)<=2 && canEffectSpecialSummonS03(x.card, 'grave', 'スピリッツ・オブ・ファラオ')); }
function u400Self(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && (e.uid===ctx.card.uid || e.card===ctx.card); }
defineUnifiedCardV4('スピリッツ・オブ・ファラオ', [{
  key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'],
  condition(ctx){ return u400Self(ctx) && u400Undead(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); },
  operation(ctx){
    const pool = u400Undead(ctx.player); if(!pool.length) return;
    const room = ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length;
    v46PickAnyAtLeastOne('スピリッツ・オブ・ファラオ：特殊召喚するレベル2以下のアンデット族通常モンスター（4体まで）', pool, Math.min(4, room), picked=>{
      picked.map(t=>ensureCardUid(gameState, t.card)).forEach(uid=>{
        const h = findCardByUid(uid); if(h && h.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'スピリッツ・オブ・ファラオ');
      });
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, cannotNormalSummon:true, includesSpecialSummon:true, timing:['free'],
  passive:{ onSpecialSummon(ctx){ return u400Self(ctx) && u400Undead(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); } } });
