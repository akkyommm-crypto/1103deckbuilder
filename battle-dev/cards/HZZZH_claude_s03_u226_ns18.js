/* S03-U226: NOT_STARTED cards (2011 texts) — 超伝導恐獣, 邪神機－獄炎, キングゴブリン, 究極恐獣, グランド・ドラゴン. */

/* ---- 超伝導恐獣: ①:1ターンに1度、自分フィールドのモンスター1体をリリースして発動できる。相手に1000ダメージを与える。
   この効果を発動するターン、このカードは攻撃宣言できない。 (cost: the release; not after it attacked this turn) ---- */
function sdTributesS03(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>!x.card.cannotTribute}); }
defineScript('超伝導恐獣', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if((typeof attackCountV48==='function' ? attackCountV48(ctx.card) : 0) > 0){ ctx.reason = 'このターン既に攻撃しています'; return false; }
    if(!sdTributesS03(ctx).length){ ctx.reason = 'リリースするモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('超伝導恐獣：リリースするモンスター', sdTributesS03(ctx), t=>{
      const r = resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'cannotAttackTurn', gameState.turn, '超伝導恐獣', {silent:true});
      API.sendToGrave(r, '超伝導恐獣（リリース）'); done(true);
    });
  },
  resolve(ctx){ API.damageLP(ctx.opponent, 1000); },
  afterResolve(){}
});

/* ---- 邪神機－獄炎: ①:このカードはリリースなしで召喚できる。②:このカードの①の方法で召喚されている場合、エンドフェイズに発動する。このカードを墓地へ送る。
   その後、自分はこのカードの元々の攻撃力分のダメージを受ける。この効果はフィールドにこのカード以外のアンデット族モンスターが存在しない場合に発動と処理を行う。 ---- */
function gokuenOtherZombieS03(self){ return [0,1].some(q=>(gameState.players[q].mz||[]).some(c=>c && c!==self && c.face==='up' && currentRaceV17(c)==='アンデット')); }
function gokuenReadyS03(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.card.normalSummonMethod==='gokuen0' && gameState.phase==='end' && !gokuenOtherZombieS03(ctx.card); }
defineScript('邪神機－獄炎', {
  type:'monster', priority:1, forced:true,
  normalSummonProcedure:{ includeStandard:true, methods:[{ id:'gokuen0', tributes:0, modes:['summon'], summonLabel:'リリースなしで召喚' }] },
  condition(ctx){ if(!gokuenReadyS03(ctx)){ ctx.reason = 'リリースなしで召喚されている場合、エンドフェイズに発動します'; return false; } return true; },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz' || gokuenOtherZombieS03(me.card)) return;
    const atk = Number(dbOf(me.card).atk)||0;
    API.sendToGrave(me, '邪神機－獄炎');
    if(atk>0) API.damageLP(ctx.player, atk);
  },
  afterResolve(){},
  passive:{ onEndPhase(ctx){ return gokuenReadyS03(ctx); } }
});

/* ---- キングゴブリン: 自分フィールド上にこのカード以外の悪魔族モンスターが存在する場合、このカードを攻撃する事はできない。
   このカードの攻撃力・守備力は、フィールド上のこのカード以外の悪魔族モンスターの数×1000ポイントになる。 (face-up Fiends; its printed values are 0) ---- */
function kingGoblinFiendsS03(self, ownOnly){
  const loc = self ? locateCard(self) : null; if(!loc) return 0;
  return [0,1].filter(q=>!ownOnly || q===loc.p).reduce((n,q)=>n+(gameState.players[q].mz||[]).filter(c=>c && c!==self && c.face==='up' && currentRaceV17(c)==='悪魔').length, 0);
}
defineScript('キングゴブリン', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'],
    apply(target, self){ const n = kingGoblinFiendsS03(self||target, false); return n ? {atk:n*1000, def:n*1000} : null; },
    cannotBeAttackTarget:(target, self)=> target===self && self.face==='up' && kingGoblinFiendsS03(self, true)>0 }
});

/* ---- 究極恐獣: ①:自分バトルフェイズに攻撃可能な「究極恐獣」が存在する場合、「究極恐獣」以外のモンスターは攻撃できない。②:このカードは相手モンスター全てに1回ずつ攻撃できる。 ---- */
defineScript('究極恐獣', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  attackAllMonstersS03:true,
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotAttack:(card, self)=> card!==self && cardName(card)!=='究極恐獣' && self.face==='up' && gameState.phase==='battle'
      && (function(){ const loc = locateCard(self); return !!loc && gameState.activePlayer===loc.p && self.pos==='atk' && canDeclareAttackV48(self); })() }
});

/* ---- グランド・ドラゴン: 自分フィールド上にモンスターが存在する場合、このカードを召喚する事はできない。
   このカードは自分フィールド上にこのカード以外のドラゴン族モンスターが表側表示で存在する場合のみ攻撃宣言する事ができる。 ---- */
defineScript('グランド・ドラゴン', {
  type:'monster', priority:1,
  normalSummonProcedure:{ methods:[
    { id:'grandDragon', tributes:0, modes:['summon'], summonLabel:'召喚', condition({player}){ return !(gameState.players[player].mz||[]).length; } },
    { id:'grandDragonSet', tributes:0, modes:['set'], setLabel:'セット' } ] },
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    cannotAttack:(card, self)=> card===self && !(function(){ const loc = locateCard(self); return !!loc && (gameState.players[loc.p].mz||[]).some(c=>c && c!==self && c.face==='up' && currentRaceV17(c)==='ドラゴン'); })() }
});
