/* S03-U329: the 「紫炎」 monsters of the Six Samurai deck (参謀 / 寄子 / 老中 エニシ) and ヴォルカニック・ハンマー (carddata texts; 「六武衆」 = a monster whose name contains 六武衆, v350Six).

   紫炎の参謀      自分フィールド上に「六武衆」と名のついたモンスターが表側表示で存在する場合にこのカードが召喚に成功した時、種族を1つ宣言して発動する。このカードがフィールド上に表側表示で存在する限り、宣言した種族の
                   モンスターは攻撃宣言をする事ができず、お互いのプレイヤーは宣言した種族のモンスターを特殊召喚する事ができない。
   紫炎の寄子      自分フィールド上に存在する「六武衆」と名のついたモンスターが戦闘を行う場合、そのダメージ計算時にこのカードを手札から墓地へ送って発動する。そのモンスターはこのターン戦闘では破壊されない。
   紫炎の老中 エニシ このカードは通常召喚できない。自分の墓地の「六武衆」と名のついたモンスター2体をゲームから除外した場合のみ特殊召喚できる。1ターンに1度、フィールド上に表側表示で存在するモンスター1体を選択して破壊できる。
                   この効果を発動するターン、このカードは攻撃宣言できない。
   ヴォルカニック・ハンマー 1ターンに1度、自分のメインフェイズ時に発動できる。自分の墓地の「ヴォルカニック」と名のついたモンスターの数×200ポイントダメージを相手ライフに与える。この効果を発動するターン、このカードは攻撃できない。

   Notes
   - 参謀: a forced Normal Summon trigger (the Race is declared at resolution, stored as the card flag u329Race); the attack ban is continuous.cannotAttack on every monster of that current Race, the Special Summon ban is the card's specialSummonLockS03 (both players, face-up and not negated).
   - 寄子: the lingering pattern of 蒼天のジェット (S03-U257): the used card in the Graveyard protects, from battle destruction, the 六武衆 monsters of the marked battle only (this turn), read from the battle's uids.
   - エニシ: a hand Special Summon procedure whose cost banishes two 六武衆 monsters of the Graveyard; the ignition destroys a chosen face-up monster of either side and marks it unable to attack this turn (cannotAttackTurn set at activation).
   - ハンマー: the damage is counted at resolution (monsters whose name contains ヴォルカニック in my Graveyard, ×200); the attack ban is cannotAttackTurn set at activation. */

function u329Six(c){ return !!c && v350Six(c); }
function u329Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function u329Main(ctx){ return ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }

/* ---- 参謀 ---- */
API.registerChoiceHandler('u329.race-declare', (answer, args)=>{
  const picked = (answer && answer.cards || [])[0], race = picked ? String(picked.value) : '';
  const me = args.uid!=null ? findCardByUid(args.uid) : null;
  if(!race || !me || me.zone!=='mz' || me.card.face!=='up') return;
  API.setCardFlag(me, 'u329Race', race, '紫炎の参謀');
});
function u329SanboReady(ctx){
  return u329Up(ctx) && !!ctx.event && ctx.event.card===ctx.card && API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && u329Six(x.card)}).length>0;
}
defineUnifiedCardV4('紫炎の参謀', [{
  key:'declare-race', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'], forced:true,
  condition(ctx){ return u329SanboReady(ctx); },
  operation(ctx){
    v49P1Open(ctx, {kind:'declare', title:'紫炎の参謀：種族を宣言', candidates:declarationCandidatesV11('race'), min:1, max:1}, 'u329.race-declare', {uid:ctx.card.uid}, false);
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'],
  passive:{ onNormalSummon(ctx){ return u329SanboReady(ctx); } },
  specialSummonLockS03:(db, p, src)=> !!src && src.face==='up' && !!src.u329Race && !!db && db.ra===src.u329Race,
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    cannotAttack(card, self){ return !!self && self.face==='up' && !!self.u329Race && currentRaceV17(card)===self.u329Race; } }});

/* ---- 寄子 ---- */
function u329Battlers(ctx){
  const b = gameState.battle;
  if(!b || b.step!=='calc') return [];
  const atk = (gameState.players[b.player].mz||[])[b.atkIdx];
  const def = b.target==='direct' ? null : (gameState.players[b.player===0?1:0].mz||[])[b.target];
  return [atk, def].filter(c=>c && c.face==='up' && u329Six(c) && (locateCard(c)||{}).p===ctx.player);
}
defineScript('紫炎の寄子', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['hand'], dsTiming:'calc', damageStepOnly:true,
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = '手札から発動します'; return false; }
    if(!u329Battlers(ctx).length){ ctx.reason = '自分の「六武衆」が戦闘を行うダメージ計算時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){ a6HandCost(ctx, done, '紫炎の寄子'); },
  resolve(ctx){
    const b = gameState.battle, me = locateCardAnyV4(ctx.card);
    if(!b || !me || me.zone!=='grave') return;
    API.setCardFlag(me, 'u329YoriTurn', gameState.turn, '紫炎の寄子');
    API.setCardFlag(me, 'u329YoriAtk', b.atkUid!=null ? b.atkUid : null, '紫炎の寄子', {silent:true});
    API.setCardFlag(me, 'u329YoriDef', b.targetUid!=null ? b.targetUid : null, '紫炎の寄子', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, '紫炎の寄子');
  },
  afterResolve(){},
  continuous:{ scope:'self', from:['linger'], apply(){ return null; },
    protectV21:{ key:'紫炎の寄子', label:'紫炎の寄子', scope:'allMonsters', effect:false,
      battle:(target, self)=>{
        if(!self || !target || Number(self.u329YoriTurn)!==gameState.turn) return false;
        if(target.face!=='up' || !u329Six(target)) return false;
        if(target.uid==null || (target.uid!==self.u329YoriAtk && target.uid!==self.u329YoriDef)) return false;
        const t = locateCard(target), s = locateCardAnyV4(self);
        if(!t || !s || t.p!==s.p) return false;
        const b = gameState.battle;
        if(b && b.atkUid!=null && b.atkUid!==self.u329YoriAtk) return false;
        return true;
      } } }
});

/* ---- エニシ ---- */
function u329GraveSix(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && u329Six(x.card)); }
function u329Visible(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}); }
defineUnifiedCardV4('紫炎の老中 エニシ', [{
  key:'destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'both',
  condition(ctx){
    if(!u329Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u329Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u329Visible().length){ ctx.reason = '表側表示のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'cannotAttackTurn', gameState.turn, '紫炎の老中 エニシ', {silent:true}); done(true); },
  target(ctx, done){ API.selectCard('紫炎の老中 エニシ：破壊する表側表示モンスター', u329Visible(), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.zone==='mz' && r.card.face==='up') API.destroy(r, '紫炎の老中 エニシ'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:{n:1, effects:['destroy']},
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(u329GraveSix(ctx.player).length<2){ ctx.reason = '墓地に「六武衆」モンスターが2体必要です'; return false; } return true; },
    cost(ctx, done){
      const picked = [];
      const step = n=>{
        if(n>=2){ picked.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='grave') API.banish(h, '紫炎の老中 エニシ（特殊召喚の手順）'); }); done(true); return; }
        const pool = u329GraveSix(ctx.player).filter(x=>picked.indexOf(x.card.uid)<0);
        if(!pool.length){ done(false); return; }
        API.selectCard('紫炎の老中 エニシ：除外する墓地の「六武衆」（'+(n+1)+'/2）', pool, t=>{
          const r = t && resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; }
          picked.push(r.card.uid!=null ? r.card.uid : ensureCardUid(gameState, r.card)); step(n+1);
        });
      };
      step(0);
    }
  }});

/* ---- ヴォルカニック・ハンマー ---- */
function u329VolcanicGrave(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('ヴォルカニック')>=0); }
defineUnifiedCardV4('ヴォルカニック・ハンマー', [{
  key:'burn', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u329Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u329Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'cannotAttackTurn', gameState.turn, 'ヴォルカニック・ハンマー', {silent:true}); done(true); },
  operation(ctx){ const n = u329VolcanicGrave(ctx.player).length; if(n>0) API.damageLP(ctx.opponent, n*200, 'ヴォルカニック・ハンマー'); },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['burn']}});
