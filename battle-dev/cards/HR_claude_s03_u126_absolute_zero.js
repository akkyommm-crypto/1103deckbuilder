/* S03-U126: E・HERO アブソルートZero (hero extra x2; NOT_STARTED before).
   「HERO」と名のついたモンスター＋水属性モンスター
   このカードは融合召喚でしか特殊召喚できない。（→ engine/1ZK_summon_only_s03.js, parsed from the text）
   このカードの攻撃力は、フィールド上に表側表示で存在する「E・HERO アブソルートZero」以外の水属性モンスターの数×500ポイントアップする。
   このカードがフィールド上から離れた時、相手フィールド上に存在するモンスターを全て破壊する。（強制。表側表示で離れた時） */
function absoluteZeroLeftFaceUpS03(ctx){
  const e = ctx.event || {};
  return !!(ctx.card && e.uid!=null && e.uid===ctx.card.uid && e.fromZone==='mz' && e.fromFace==='up');
}
defineScript('E・HERO アブソルートZero', {
  type:'monster', priority:1, forced:true,
  activateFrom:['grave','banish','hand','ex'],
  condition(ctx){
    if(ctx.eventName!=='onLeaveField' || !absoluteZeroLeftFaceUpS03(ctx)){ ctx.reason = 'フィールド上から離れた時に発動します'; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>!!x.card}).slice().reverse()
      .forEach(t=>API.destroy(t, 'E・HERO アブソルートZero'));
  },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self){
      if(card!==self) return null;
      let n = 0;
      [0,1].forEach(p=>(gameState.players[p].mz||[]).forEach(c=>{
        if(!c || c.face!=='up' || cardName(c)==='E・HERO アブソルートZero') return;
        const at = (typeof currentAttributeV17==='function') ? currentAttributeV17(c) : dbOf(c).at;
        if(at==='水') n++;
      }));
      return n ? {atk:n*500} : null;
    }
  },
  passive:{ onLeaveField(ctx){ return absoluteZeroLeftFaceUpS03(ctx); } }
});
