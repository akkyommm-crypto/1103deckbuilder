/* S03-U460: 草薙剣
   スピリット専用装備、貫通、装備先が自分フィールドから手札へ戻った時の強制自己回収。
   既存の u412Define / equippedS03 / D5 e2HostUid marker を再利用し、エンジン変更なし。 */
function u460Spirit(x){ return !!x && x.db.k==='m' && Array.isArray(x.db.st) && x.db.st.indexOf('スピリット')>=0; }
function u460MarkHost(ctx){
  const me=locateCardAnyV4(ctx.card), host=me&&me.card.equipTo&&me.card.equipTo.uid;
  if(me && me.zone==='sz' && host!=null) API.setCardFlag(me,'e2HostUid',host,'草薙剣',{silent:true});
}
u412Define('草薙剣', {
  pred:u460Spirit,
  own:true,
  after:u460MarkHost,
  effects:[{
    key:'host-bounce-return', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1,
    events:['onSendToGrave'], forced:true,
    condition(ctx){ return e2BackByHostBounce(ctx); },
    operation(ctx){ const me=locateCardAnyV4(ctx.card); if(me&&me.zone==='grave') API.returnToHand(me,'草薙剣'); },
    afterResolve(){}
  }],
  meta:{ passive:{ onSendToGrave(ctx){ return e2BackByHostBounce(ctx); } } },
  continuous:{ piercingDamage(info){
    const self=info.self;
    if(!equippedS03(info.atkCard,self)||!info.defCard||info.defCard.pos!=='def') return 0;
    return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));
  } }
});
