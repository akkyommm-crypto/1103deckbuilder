/* S03-U337: 墓守の大神官, 墓守の大筒持ち, マシンナーズ・カノン, 古代の機械合成獣, 古代の採掘機 (carddata texts).

   墓守の大神官     このカードは「墓守の」と名のついたモンスター1体をリリースして召喚できる。ATKは自分の墓地の「墓守の」モンスターの数×200アップ。フィールドで表側表示のこのカードが破壊される場合、代わりに手札から「墓守の」モンスター1体を捨てる事ができる。
   墓守の大筒持ち   自分フィールド上の「墓守の」モンスター1体を生け贄に捧げる度に、相手に700ポイントダメージを与える。この場合「墓守の大筒持ち」を生け贄に捧げる事はできない。
   マシンナーズ・カノン  通常召喚できない。このカード以外の手札の機械族モンスターを任意の枚数墓地へ送った場合に特殊召喚できる。ATKは、そのために墓地へ送ったモンスターの数×800アップ。
   古代の機械合成獣  召喚のためにリリースしたモンスターによる効果（グリーン：ATK+300／レッド：直接攻撃で戦闘ダメージを与えた場合500ダメージ／イエロー：戦闘で相手モンスターを破壊した場合700ダメージ）。
   古代の採掘機     自分フィールドに「アンティーク・ギア」モンスターが存在する場合、手札を1枚捨てて発動できる。デッキから魔法カード1枚を選んで自分フィールドにセットする。この効果でセットしたカードはこのターン発動できない。

   Notes
   - 大神官: normalSummonProcedure with a materialFilter (1 Tribute); the hand-discard replacement is the new destroySubstituteS03 kind 'discardHand' (engine/1ZV, the controller chooses at the destruction); ATK is a continuous modifier.
   - 大筒持ち: forced onFieldToGraveBatchS03 trigger — each own 「墓守の」 monster released (graveInfo.releasedS03, any release: Tribute Summon or a cost) other than 大筒持ち itself deals 700.
   - カノン: the hand procedure's cost lets the controller pick any number (including 0) of Machine monsters of the hand; the number is parked in a turn-temporary player flag and copied to the card by its forced self onSpecialSummon trigger (the card flag the continuous ATK reads).
   - 合成獣: the Gadget effects read summonProvenance.materialSnapshots as 古代の機械巨竜 does; the direct hit uses onDirectBattleDamage.
   - 採掘機: the set card is moved Deck → Spell & Trap Zone (a Field Spell replaces the old one) face-down with setTurn; its activation that turn is refused by the lingering card's activationLockS03 (as 泉の精霊).
   - Left: 墓守の使い魔 (needs an attack-declaration cost), 墓守の長 (player-specific Necrovalley immunity, only one on the field), マシンナーズ・フォース (特殊召喚 only by 督戦官コヴィントン, 1000 LP to attack), 古代の機械城 / 古代の機械工場. */

function u337Keeper(db){ return !!db && db.k==='m' && String(db.n||'').indexOf('墓守の')>=0; }

/* ---- 墓守の大神官 ---- */
function u337GraveKeepers(p){ return (gameState.players[p].grave||[]).filter(c=>c && u337Keeper(dbOf(c))).length; }
defineScript('墓守の大神官', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  normalSummonProcedure:{ includeStandard:true, methods:[{ id:'daishinkan1', tributes:1, modes:['summon'], summonLabel:'「墓守の」1体をリリースしてアドバンス召喚',
    materialFilter:(h)=> u337Keeper(h.db) }] },
  destroySubstituteS03:{ kind:'discardHand', causes:['battle','effect'], filter:c=>u337Keeper(dbOf(c)) },
  continuous:{ scope:'self', from:['mz'], apply(card, self, info){
    if(card!==self || self.face!=='up') return null;
    const n = u337GraveKeepers(info.p); return n ? {atk:n*200} : null; } }
});

/* ---- 墓守の大筒持ち ---- */
function u337CannonItems(ctx){
  const e = ctx.event || {};
  if(ctx.eventName!=='onFieldToGraveBatchS03' || !Array.isArray(e.items) || ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return [];
  return e.items.filter(x=>{
    if(!x || x.ctrl!==ctx.player || x.uid===ctx.card.uid) return false;
    const h = findCardByUid(x.uid); if(!h || h.zone!=='grave' || !h.card.graveInfo || !h.card.graveInfo.releasedS03) return false;
    const db = dbOf(h.card);
    return u337Keeper(db) && db.n!=='墓守の大筒持ち';
  });
}
defineUnifiedCardV4('墓守の大筒持ち', [{
  key:'release-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFieldToGraveBatchS03'], forced:true,
  condition(ctx){ return u337CannonItems(ctx).length>0; },
  operation(ctx){ const n = u337CannonItems(ctx).length; if(n) API.damageLP(ctx.opponent, 700*n, '墓守の大筒持ち'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], passive:{ onFieldToGraveBatchS03(ctx){ return u337CannonItems(ctx).length>0; } }});

/* ---- マシンナーズ・カノン ---- */
function u337CannonHand(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.card!==ctx.card && x.db.k==='m' && x.db.ra==='機械'); }
function u337CannonReady(ctx){
  return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && ctx.eventName==='onSpecialSummon' && eventIsSelfS03(ctx) && ctx.card.specialSummonKind==='procedure';
}
defineUnifiedCardV4('マシンナーズ・カノン', [{
  key:'count-discarded', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u337CannonReady(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    const tf = gameState.players[ctx.player].temporaryFlags || {};
    const n = Number(tf.u337CannonN)>0 ? Number(tf.u337CannonN) : 0;
    API.setCardFlag(me, 'u337CannonN', n, 'マシンナーズ・カノン', {silent:true});
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotNormalSummon:true, includesSpecialSummon:true, timing:['free'],
  passive:{ onSpecialSummon(ctx){ return u337CannonReady(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(card, self){ if(card!==self || self.face!=='up') return null; const n = Number(self.u337CannonN)||0; return n ? {atk:n*800} : null; } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ return true; },
    cost(ctx, done){
      const picked = [];
      const step = ()=>{
        const pool = u337CannonHand(ctx).filter(x=>picked.indexOf(x.card.uid)<0);
        const finish = ()=>{
          picked.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='hand') API.discard(ctx.player, h.index, 'マシンナーズ・カノン（特殊召喚の手順）'); });
          API.setFlag(ctx.player, 'u337CannonN', picked.length, true);
          done(true);
        };
        if(!pool.length){ finish(); return; }
        API.selectCard('マシンナーズ・カノン：墓地へ送る手札の機械族モンスター（'+picked.length+'体選択済み）', pool.concat([{key:'done', label:'これ以上送らない（決定）'}]), t=>{
          if(!t || t.key==='done' || t.label==='これ以上送らない（決定）'){ finish(); return; }
          const r = resolveTarget(t);
          if(!r || r.zone!=='hand'){ finish(); return; }
          picked.push(r.card.uid!=null ? r.card.uid : ensureCardUid(gameState, r.card)); step();
        });
      };
      step();
    }
  }});

/* ---- 古代の機械合成獣 (the Gadget effects of 古代の機械巨竜, S03-U144, with its own numbers) ---- */
function u337ChimeraDirect(ctx){
  const e = ctx.event;
  return ctx.zone==='mz' && !!e && e.attackerUid!=null && e.defenderUid==null && a3DealtBattleDamage(ctx) && gearHasS03(ctx.card, 'レッド・ガジェット');
}
defineUnifiedCardV4('古代の機械合成獣', [{
  key:'red', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'], forced:true,
  condition(ctx){ return u337ChimeraDirect(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 500, '古代の機械合成獣'); },
  afterResolve(){}
},{
  key:'yellow', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return gearHasS03(ctx.card,'イエロー・ガジェット') && gearKilledFoeS03(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 700, '古代の機械合成獣'); },
  afterResolve(){}
}], {type:'monster', priority:1, dsTiming:'leave',
  continuous:{ scope:'self', from:['mz'], apply(card, self){ return (card===self && self.face==='up' && gearHasS03(self,'グリーン・ガジェット')) ? {atk:300} : null; } },
  passive:{
    onBattleDamage(ctx){ return u337ChimeraDirect(ctx); },
    onDamageStep(ctx){ return gearHasS03(ctx.card,'イエロー・ガジェット') && gearKilledFoeS03(ctx); }
  }});

/* ---- 古代の採掘機 ---- */
function u337DigPool(p){ return API.pileCards(p, 'deck', x=>x.db.k==='s'); }
function u337DigGear(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && isCardInGroupV4(x.db, GROUP.ANCIENT_GEAR)}); }
defineScript('古代の採掘機', {
  type:'spell', priority:1,
  condition(ctx){
    if(!u337DigGear(ctx).length){ ctx.reason = '自分フィールドに「アンティーク・ギア」モンスターがいません'; return false; }
    if(!API.pileCards(ctx.player, 'hand', x=>x.card!==ctx.card).length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!u337DigPool(ctx.player).length){ ctx.reason = 'デッキに魔法カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = API.pileCards(ctx.player, 'hand', x=>x.card!==ctx.card); if(!pool.length){ done(false); return; }
    API.selectCard('古代の採掘機：捨てる手札', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, '古代の採掘機（コスト）'); done(true);
    });
  },
  resolve(ctx){
    const P = gameState.players[ctx.player];
    const pool = u337DigPool(ctx.player).filter(x=>x.db.sub==='フィールド' ? true : P.sz.length < ZONE_LIMITS.sz);
    if(!pool.length) return;
    API.selectCard('古代の採掘機：セットする魔法カード', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='deck' || r.p!==ctx.player) return;
      const uid = ensureCardUid(gameState, r.card), isField = dbOf(r.card).sub==='フィールド';
      if(isField && P.field) act({type:'MOVE', player:ctx.player, from:'field', fromIndex:0, to:'grave', face:'up'});
      act({type:'MOVE', player:ctx.player, from:'deck', fromIndex:r.index, to:isField?'field':'sz', face:'down', pos:'atk'});
      API.shuffle(ctx.player);
      const s = findCardByUid(uid);
      if(s && (s.zone==='sz' || s.zone==='field')){
        API.setCardFlag(s, 'setTurn', gameState.turn, '古代の採掘機', {silent:true});
        const me = locateCardAnyV4(ctx.card);
        if(me){
          API.setCardFlag(me, 'u337DigUid', uid, '古代の採掘機', {silent:true});
          const me2 = locateCardAnyV4(ctx.card); if(me2) API.setCardFlag(me2, 'u337DigTurn', gameState.turn, '古代の採掘機', {silent:true});
          const me3 = locateCardAnyV4(ctx.card); if(me3) API.lingerS03(ctx.player, me3, '古代の採掘機');
        }
      }
    });
  },
  afterResolve(){},
  activationLockS03:(i)=> !!i.card && i.card.uid!=null && i.card.uid===i.src.u337DigUid && Number(i.src.u337DigTurn)===Number(gameState.turn)
});
