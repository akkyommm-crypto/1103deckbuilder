/* S03-U461: 破邪の大剣－バオウ — discard/send one other hand card to Equip, +500 ATK,
   and negate the effect of an opponent monster destroyed in battle by the equipped monster. */
function u461BaouCost(ctx){
  return API.pileCards(ctx.player, 'hand', x=>x.card!==ctx.card);
}
const u461BaouEquip = u412EquipEffect('破邪の大剣－バオウ', x=>x.db.k==='m', null, false);
const u461BaouBaseCondition = u461BaouEquip.condition;
u461BaouEquip.condition = function(ctx){
  if(!u461BaouCost(ctx).length){ ctx.reason='手札から墓地へ送るカードがありません'; return false; }
  return u461BaouBaseCondition(ctx);
};
u461BaouEquip.cost = function(ctx, done){
  const pool=u461BaouCost(ctx);
  if(!pool.length){ done(false); return; }
  API.selectCard('破邪の大剣－バオウ：墓地へ送る手札', pool, t=>{
    const h=t&&resolveTarget(t);
    if(h&&h.zone==='hand'&&h.p===ctx.player) API.sendHandToGrave(ctx.player,h.index,'破邪の大剣－バオウ（コスト）');
    done(!!h);
  });
};
defineUnifiedCardV4('破邪の大剣－バオウ', [u461BaouEquip], {
  type:'spell', priority:1, targets:true,
  continuous:{scope:'allMonsters',from:['sz'],apply(card,self){return equippedS03(card,self)?{atk:500}:null;}}
});
declareBattleDestroyedNegatorS03('破邪の大剣－バオウ', {});
