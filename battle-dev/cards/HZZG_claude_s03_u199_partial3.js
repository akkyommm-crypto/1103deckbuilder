/* S03-U199: PARTIAL cards whose AUTO_DECK_TABLE entries (cards/40) were coarse trig:"ignition" actions — now their 2011 texts. Pools and the
   journaled resolution choice come from the shared helpers of U198 (poolSpecS03 / poolS03 / askPoolS03, cards/HZZF).
   - デスハムスター / 素早いビッグハムスター: 「リバース：…裏側守備表示で特殊召喚する事ができる」 (optional Flip effects).
   - 素早いマンタ: 「フィールド上のこのカードがカードの効果によって墓地へ送られた時」 (moveProvenance.reason 'effect': not a cost, a Tribute or battle).
   - ナーガ: 「フィールド上に表側表示で存在するこのカードがデッキに戻った場合」 (forced).
   - 冥界の使者: 「フィールド上から墓地に送られた時、お互いに自分のデッキからレベル3以下の通常モンスター1体を選択し…手札に加える」 (forced; each
     player chooses from their own Deck, turn player's controller first). */

/* ---- Flip recruits ---- */
function defineFlipRecruitS03(name, spec){
  poolSpecS03(name, Object.assign({action:'summon', pos:'faceDownDef', optional:true}, spec));
  defineScript(name, {
    type:'monster', priority:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
    condition(ctx){
      if(ctx.eventName!=='onFlip' || !eventIsSelfS03(ctx)){ ctx.reason = 'リバースした時に発動します'; return false; }
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      return true;
    },
    resolve(ctx){ askPoolS03(ctx, name, `${name}：裏側守備表示で特殊召喚するモンスター`); },
    afterResolve(){},
    passive:{ onFlip(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx) && hasMonsterZoneSpace(ctx.player); } }
  });
}
/* デスハムスター: リバース：自分のデッキから「デスハムスター」1体を裏側守備表示で特殊召喚する事ができる。 */
defineFlipRecruitS03('デスハムスター', {filter:{name:'デスハムスター'}});
/* 素早いビッグハムスター: リバース：自分のデッキからレベル3以下の獣族モンスター1体を裏側守備表示で特殊召喚する事ができる。 */
defineFlipRecruitS03('素早いビッグハムスター', {filter:{ra:'獣', lvmax:3}});

/* ---- 素早いマンタ: フィールド上のこのカードがカードの効果によって墓地へ送られた時、デッキから「素早いマンタ」を任意の数だけ特殊召喚できる。 ---- */
function sentByCardEffectS03(ctx){
  const g = ctx.card && ctx.card.graveInfo, mp = ctx.card && ctx.card.moveProvenance;
  return !!(g && ['mz','sz','field'].indexOf(g.from)>=0 && !g.battle && Number(g.turn)===Number(gameState.turn) && mp && mp.reason==='effect');
}
declareDeckTriggerS03('素早いマンタ', {when:'fieldToGrave', action:'summon', optional:true, pos:'faceUp', max:99, filter:{name:'素早いマンタ'},
  extra(ctx){ return sentByCardEffectS03(ctx) ? '' : 'カードの効果によって墓地へ送られた時に発動します'; }});

/* ---- ナーガ ---- */
poolSpecS03('ナーガ', {action:'summon', pos:'faceUp', optional:false, filter:{lvmax:3}});
function nagaReturnedS03(ctx){ const e = ctx.event || {}; return eventIsSelfS03(ctx) && e.toZone==='deck' && e.fromZone==='mz' && e.fromFace==='up'; }
defineScript('ナーガ', {
  type:'monster', priority:1, forced:true, activateFrom:['deck'], blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onLeaveField' || !nagaReturnedS03(ctx)){ ctx.reason = 'フィールドの表側表示からデッキに戻った場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ askPoolS03(ctx, 'ナーガ', 'ナーガ：特殊召喚するレベル3以下のモンスター'); },
  afterResolve(){},
  passive:{ onLeaveField(ctx){ return ctx.zone==='deck' && nagaReturnedS03(ctx); } }
});

/* ---- 冥界の使者 ---- */
poolSpecS03('冥界の使者', {action:'search', optional:false, filter:{lvmax:3}});
function underworldPoolS03(p){ return API.pileCards(p,'deck',x=>x.db.k==='m' && !x.db.ex && (x.db.lv||99)<=3 && (x.db.st||[]).indexOf('効果')<0 && (x.db.st||[]).indexOf('儀式')<0 && (x.db.st||[]).indexOf('トークン')<0); }
function underworldAskS03(order, name){
  const q = (order||[]).slice();
  while(q.length){
    const p = q[0];
    const pool = underworldPoolS03(p);
    if(pool.length){
      API.requestChoice({player:p, kind:'card', title:`${name}：手札に加えるレベル3以下の通常モンスター（${p===0?'Player1':'Player2'}のデッキ）`,
        candidates:pool, min:1, max:1, cancelable:false,
        resume:{handler:'s03u199.underworld-search', args:{order:q, name}}, meta:{scriptName:name}});
      return;
    }
    API.shuffle(p); q.shift();
  }
}
registerChoiceHandlerV49('s03u199.underworld-search', (answer, args)=>{
  if(!args || !Array.isArray(args.order) || !args.order.length) return;
  const q = args.order.slice(), p = q.shift();
  const pick = (answer && answer.cards || []).filter(y=>y && !y.stale && y.uid!=null)[0];
  const h = pick ? findCardByUid(pick.uid) : null;
  if(h && h.p===p && h.zone==='deck') API.searchDeck(p, h.index, args.name);
  underworldAskS03(q, args.name);
});
defineScript('冥界の使者', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    const e = ctx.event || {};
    if(ctx.eventName!=='onLeaveField' || !eventIsSelfS03(ctx) || e.toZone!=='grave' || ['mz','sz','field'].indexOf(e.fromZone)<0){
      ctx.reason = 'フィールドから墓地へ送られた時に発動します'; return false; }
    return true;
  },
  resolve(ctx){ underworldAskS03([ctx.player, ctx.opponent], '冥界の使者'); },
  afterResolve(){},
  passive:{ onLeaveField(ctx){ const e = ctx.event || {}; return ctx.zone==='grave' && eventIsSelfS03(ctx) && e.toZone==='grave' && ['mz','sz','field'].indexOf(e.fromZone)>=0; } }
});
