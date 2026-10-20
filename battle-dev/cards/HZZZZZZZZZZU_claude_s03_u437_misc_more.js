/* S03-U437: エレメント・マジシャン, 海竜神－ネオダイダロス, RAI－JIN (NOT_STARTED / stale ENGINE_GAP cards, carddata texts).

   エレメント・マジシャン    このモンスターはフィールド上に特定の属性を持つモンスターが存在する場合、以下の効果を得る。●水属性：このカードのコントロールを変更する事ができない。●風属性：このカードが戦闘によって相手モンスターを破壊した場合、もう一度だけ続けて攻撃を行う事ができる。
   海竜神－ネオダイダロス    このカードは通常召喚できない。自分フィールド上に存在する「海竜－ダイダロス」1体をリリースした場合のみ特殊召喚する事ができる。自分フィールド上に存在する「海」を墓地へ送る事で、このカード以外のお互いの手札・フィールド上のカードを全て墓地へ送る。
   RAI－JIN                 このカードがフィールド上に表側表示で存在する限り、自分フィールド上の光属性モンスターの攻撃力は、自分の墓地の光属性モンスターの数×100ポイントアップする。また、自分のエンドフェイズ毎に発動する。自分フィールド上の光属性モンスター1体を選択して破壊する。「RAI－JIN」はフィールド上に1体しか表側表示で存在できない。

   Notes
   - エレメント・マジシャン: the WIND extra attack is U432's u432AgainEffect (forced onDamageStep after a battle destruction, once per turn); the WATER control lock is the script key controlLockS03 (engine/00, U251) while a face-up WATER monster is on either field (u264AnyFaceUpAttr).
   - ネオダイダロス: cannotNormalSummon + summonProcedure from the hand releasing (sending to the Graveyard) a face-up 「海竜－ダイダロス」 of mine; the ignition costs my face-up Field Spell 「海」 and sends every other card of both hands, Monster and Spell & Trap Zones and Field Zones to the Graveyard.
   - RAI－JIN: continuous scope 'ownMonsters' gives every face-up LIGHT monster of mine +100 x (LIGHT monsters in my Graveyard); a forced onEndPhase of my own turn destroys a LIGHT monster of mine of my choice (itself included); uniqueNameS03:'any' (U418). */

/* ---- エレメント・マジシャン ---- */
defineUnifiedCardV4('エレメント・マジシャン', [u432AgainEffect('エレメント・マジシャン', ()=>true)], {type:'monster', priority:1, timing:['free'], forced:true, dsTiming:'after',
  passive:{ onDamageStep(ctx){ return u264AnyFaceUpAttr('風') && u432Again(ctx, ()=>true); } },
  controlLockS03(card){ const h = card && findCardByUid(card.uid); return !!h && h.zone==='mz' && card.face==='up' && u264AnyFaceUpAttr('水'); } });

/* ---- 海竜神－ネオダイダロス ---- */
const U437_DAIDALOS = '海竜－ダイダロス';
function u437Daidalos(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.n===U437_DAIDALOS}); }
function u437Sea(p){ return API.fieldCards({player:p, zone:'field', filter:x=>x.card.face==='up' && x.db.n==='海'}); }
defineUnifiedCardV4('海竜神－ネオダイダロス', [{
  key:'wipe', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1,
  condition(ctx){ if(ctx.zone!=='mz' || ctx.card.face!=='up') return false; if(!u437Sea(ctx.player).length){ ctx.reason = '自分フィールドに「海」がありません'; return false; } return true; },
  cost(ctx, done){
    const sea = u437Sea(ctx.player); if(!sea.length){ done(false); return; }
    API.sendToGrave(sea[0], '海竜神－ネオダイダロス（コスト）'); done(true);
  },
  operation(ctx){
    const keep = ctx.card.uid != null ? ctx.card.uid : ensureCardUid(gameState, ctx.card);
    for(let p=0; p<2; p++){
      while(gameState.players[p].hand.length) API.sendHandToGrave(p, 0, '海竜神－ネオダイダロス');
      ['mz','sz','field'].forEach(zn=>{
        API.fieldCards({player:p, zone:zn}).map(x=>x.card.uid!=null?x.card.uid:ensureCardUid(gameState,x.card)).filter(u=>u!==keep).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone===zn) API.sendToGrave(h, '海竜神－ネオダイダロス'); });
      });
    }
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], cannotNormalSummon:true, includesSpecialSummon:true, activateFrom:['mz'],
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!u437Daidalos(ctx.player).length){ ctx.reason = '自分フィールドに「海竜－ダイダロス」がいません'; return false; } return true; },
    cost(ctx, done){
      const l = u437Daidalos(ctx.player); if(!l.length){ done(false); return; }
      API.selectCard('海竜神－ネオダイダロス：リリースする「海竜－ダイダロス」', l, t=>{
        const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
        API.sendToGrave(r, '海竜神－ネオダイダロス（リリース）'); done(true);
      });
    } } });

/* ---- RAI－JIN ---- */
/* raw zone scan on purpose: continuous.apply runs inside continuousSources(), and API.pileCards would re-enter it through the current-attribute layer */
function u437LightGrave(p){ return (gameState.players[p].grave||[]).filter(c=>c && dbOf(c).k==='m' && dbOf(c).at==='光').length; }
function u437LightField(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && x.db.at==='光'}); }
function u437RaiEnd(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && gameState.phase==='end' && u437LightField(ctx.player).length>0; }
defineUnifiedCardV4('RAI－JIN', [{
  key:'smite', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u437RaiEnd(ctx); },
  operation(ctx){
    const pool = u437LightField(ctx.player); if(!pool.length) return;
    API.selectCard('RAI－JIN：破壊する光属性モンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='mz' && r.p===ctx.player) API.destroy(r, 'RAI－JIN'); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], forced:true, uniqueNameS03:'any', passive:{ onEndPhase(ctx){ return u437RaiEnd(ctx); } },
  continuous:{ scope:'ownMonsters', from:['mz'],
    apply(card, self){
      if(self.face!=='up' || card.face!=='up' || dbOf(card).k!=='m' || dbOf(card).at!=='光') return null;
      const h = locateCardAnyV4(self); if(!h) return null;
      const n = u437LightGrave(h.p); return n ? {atk:100*n} : null;
    } } });
