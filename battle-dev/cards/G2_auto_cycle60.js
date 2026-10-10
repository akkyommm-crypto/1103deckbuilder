/* Codex Auto Cycle 60
   exact canonical identity: 黄泉ガエル参照の自己ATK継続修整。 */
(function(){
function g2SameName(handle,name){
  const ref=dbOf({id:findCardIndex(name)});
  return !!(handle&&handle.db&&ref&&sameCanonicalCardV4(handle.db,ref));
}
defineUnifiedCardV4('ガエル・サンデス',[],{
  type:'fusion',
  priority:1,
  continuous:{
    scope:'self',
    from:['mz'],
    apply(card,self){
      const h=locateCardAnyV4(self);
      if(!h||h.zone!=='mz'||self.face!=='up') return null;
      const n=API.pileCards(h.p,'grave',x=>g2SameName(x,'黄泉ガエル')).length;
      return n?{atk:n*500}:null;
    }
  }
});
})();
