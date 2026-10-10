/* S03-U138: fixed-list singles (second batch).

   ---- アーカナイト・マジシャン (debris x1) ----
   ①:このカードがS召喚に成功した場合に発動する。このカードに魔力カウンターを2つ置く。
   ②:このカードの攻撃力は、このカードの魔力カウンターの数×1000アップする。
   ③:自分フィールドの魔力カウンターを1つ取り除き、相手フィールドのカード1枚を対象として発動できる。その相手のカードを破壊する。
   Before (cards/00_generic_core.js, one legacy script): ① and ② did not exist — its passive onSpecialSummon only offered ③,
   whose condition needs a counter, so the card never got its counters; ③ removed the counter at resolution instead of as the
   activation cost. Now a v4 card: ① forced trigger on its own Synchro Summon, ② continuous ATK, ③ ignition with the counter
   removal as the cost (chosen at activation) and 1 opponent card targeted. */
function arcaniteCountersS03(card){ return (card && card.counters && card.counters['魔力']) || 0; }
function arcaniteCounterSourcesS03(p){ return API.fieldCards({player:p, filter:x=>arcaniteCountersS03(x.card)>0}); }
defineUnifiedCardV4('アーカナイト・マジシャン',[{
  key:'counters', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){
    if(!s03SelfSynchroSummonedU121(ctx)){ ctx.reason = 'このカードがS召喚に成功した場合に発動します'; return false; }
    return true;
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone==='mz') API.addCounter(me, '魔力', 2);
  },
  afterResolve(){}
},{
  key:'destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason = 'フィールドで発動します'; return false; }
    if(!arcaniteCounterSourcesS03(ctx.player).length){ ctx.reason = '自分フィールドに魔力カウンターがありません'; return false; }
    if(!API.fieldCards({player:ctx.opponent}).length){ ctx.reason = '破壊する相手のカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const src = arcaniteCounterSourcesS03(ctx.player);
    const pay = s=>{ API.removeCounter(s, '魔力', 1); done(true); };
    if(src.length===1){ pay(src[0]); return; }
    API.selectCard('アーカナイト：魔力カウンターを取り除くカード', src, pay);
  },
  target(ctx, done){ API.selectCard('アーカナイト：破壊する相手のカード', API.fieldCards({player:ctx.opponent}), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r) API.destroy(r, 'アーカナイト・マジシャン');
  },
  afterResolve(){}
}],{type:'synchro', priority:1, targets:true, timing:['summon','mainPhase'],
  continuous:{ scope:'self', from:['mz'], apply(target, self){ return { atk: arcaniteCountersS03(self||target)*1000 }; } },
  passive:{ onSpecialSummon(ctx){ return s03SelfSynchroSummonedU121(ctx); } }});
