/* S03-U357: three Ritual Spells that were missing from the registry, and 大邪神 レシェフ (carddata texts).

   踊りによる誘発       「ダンシング・ソルジャー」の降臨に必要。フィールドか手札から、レベルが6以上になるようカードを生け贄に捧げなければならない。
   亀の誓い             「クラブ・タートル」の降臨に必要。フィールドか手札から、レベルが8以上になるようカードを生け贄に捧げなければならない。
   ハンバーガーのレシピ  「ハングリーバーガー」の降臨に必要。フィールドか手札から、レベルが6以上になるようカードを生け贄に捧げなければならない。
   大邪神 レシェフ       「大邪神の儀式」により降臨。手札の魔法カードを1枚捨てる。相手フィールドのモンスター1体のコントロールをエンドフェイズ時まで得る。1ターンに1度。

   Notes
   - The three Spells are registered with the S03 ritual registry (registerRitualSpecV24) and defined with the shared factory v5DefineRitualSpell (cards/90): material choice, Level counting and provenance stay in the engine's ritual path.
   - レシェフ: an ignition effect with a hand-discard cost (a Spell), API.changeControl(…, 'endPhase'); once per turn is the meta countLimit. */

registerRitualSpecV24('踊りによる誘発',     {monsters:['ダンシング・ソルジャー'], level:6, levelMode:'atLeast'});
registerRitualSpecV24('亀の誓い',           {monsters:['クラブ・タートル'],       level:8, levelMode:'atLeast'});
registerRitualSpecV24('ハンバーガーのレシピ', {monsters:['ハングリーバーガー'],     level:6, levelMode:'atLeast'});
v5DefineRitualSpell('踊りによる誘発');
v5DefineRitualSpell('亀の誓い');
v5DefineRitualSpell('ハンバーガーのレシピ');

/* ---- 大邪神 レシェフ ---- */
function u357Spells(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.k==='s'); }
function u357Foes(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}); }
defineUnifiedCardV4('大邪神 レシェフ', [{
  key:'steal', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'opponent', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up') return false;
    if(!u357Spells(ctx).length){ ctx.reason = '手札に魔法カードがありません'; return false; }
    if(!u357Foes(ctx).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('大邪神 レシェフ：捨てる手札の魔法カード', u357Spells(ctx), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, '大邪神 レシェフ（コスト）', {byEffect:false}); done(true);
    });
  },
  target(ctx, done){ API.selectCard('大邪神 レシェフ：コントロールを得る相手モンスター', u357Foes(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.p===ctx.opponent && r.card.face==='up' && hasMonsterZoneSpace(ctx.player)) API.changeControl(r, ctx.player, '大邪神 レシェフ', 'endPhase');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase']});
