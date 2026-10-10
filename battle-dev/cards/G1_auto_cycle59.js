/* Codex Auto Cycle 59
   融合モンスターの既存素材DB + 自己ATK継続修整のみ。 */
(function(){
defineUnifiedCardV4('究極竜騎士',[],{
  type:'fusion',
  priority:1,
  continuous:{
    scope:'self',
    from:['mz'],
    apply(card,self){
      const h=locateCardAnyV4(self);
      if(!h||h.zone!=='mz'||self.face!=='up') return null;
      const n=API.fieldCards({player:h.p,zone:'mz',filter:x=>x.card!==self&&x.card.face==='up'&&API.raceOf(x)==='ドラゴン'}).length;
      return n?{atk:n*500}:null;
    }
  }
});
})();
