/* Codex Auto Cycle 63 — 融合モンスターの既存保護・継続修整。
   Battle v6 / DestructionProtection v21 / SetcodeAuthority v4 のみ。 */
(function(){
function g5GraveSetCount(card,setcode){
  const h=locateCardAnyV4(card); if(!h) return 0;
  return (gameState.players[h.p].grave||[]).filter(c=>{
    const d=dbOf(c); return d&&d.k==='m'&&isSetCardV4(d,setcode);
  }).length;
}

defineUnifiedCardV4('E・HERO フェニックスガイ',[],{
  type:'monster',priority:1,battleProof:true
});

defineUnifiedCardV4('M・HERO ヴェイパー',[],{
  type:'monster',priority:1,
  protectV21:{key:'g5.effect-proof',effect:true,label:'M・HERO ヴェイパー'}
});

defineUnifiedCardV4('E・HERO シャイニング・フェニックスガイ',[],{
  type:'monster',priority:1,battleProof:true,
  continuous:{scope:'self',from:['mz'],apply(card,self){
    if(card!==self||self.face!=='up') return null;
    const n=g5GraveSetCount(self,SETCODE.ELEMENTAL_HERO);
    return n?{atk:n*300}:null;
  }}
});

defineUnifiedCardV4('M・HERO 剛火',[],{
  type:'monster',priority:1,
  continuous:{scope:'self',from:['mz'],apply(card,self){
    if(card!==self||self.face!=='up') return null;
    const n=g5GraveSetCount(self,SETCODE.HERO);
    return n?{atk:n*100}:null;
  }}
});

defineUnifiedCardV4('F・G・D',[],{
  type:'monster',priority:1,battleProof:false,
  protectV21:{key:'g5.non-light-battle',battle:(target,src,ctx)=>{
    const foe=ctx&&ctx.opponentCard;
    return !!foe&&currentAttributeV17(foe)!=='光';
  },label:'F・G・D'}
});
})();
