/* Auto cycle 44 — existing-engine battle/continuous pickups.
   Engine changes: none. New primitive: none. */

function e6OwnGraveNormalMonsterCount(p){
  return (gameState.players[p].grave||[]).filter(c=>{
    const d=dbOf(c);
    return d&&d.k==='m'&&(d.st||[]).includes('通常');
  }).length;
}
function e6OwnGraveSetReptileCount(p,setcode){
  return (gameState.players[p].grave||[]).filter(c=>{
    const d=dbOf(c);
    return d&&d.k==='m'&&d.ra==='爬虫類'&&isSetCardV4(d,setcode);
  }).length;
}
function e6DealtBattleDamage(ctx){
  const e=ctx.event||{};
  if(!(Number(e.amount)>0) || e.player!==ctx.opponent) return false;
  const uid=ctx.card&&ctx.card.uid;
  return uid!=null&&(e.attackerUid===uid||e.defenderUid===uid);
}

/* 相手に戦闘ダメージを与えた時、自分墓地の通常モンスター数×200ダメージ。 */
defineScript('ライカン・スロープ',{
  type:'ritual',priority:1,forced:true,
  condition(ctx){return e6DealtBattleDamage(ctx)&&e6OwnGraveNormalMonsterCount(ctx.player)>0;},
  resolve(ctx){
    const n=e6OwnGraveNormalMonsterCount(ctx.player);
    if(n) API.damageLP(ctx.opponent,n*200,'ライカン・スロープ');
  },afterResolve(){},
  passive:{onBattleDamage(ctx){return e6DealtBattleDamage(ctx)&&e6OwnGraveNormalMonsterCount(ctx.player)>0;}}
});

/* アマゾネスが格上へ攻撃するダメージ計算時だけATK+1000。 */
defineUnifiedCardV4('アマゾネスの闘志',[],{
  type:'spell',priority:1,
  continuous:{scope:'allMonsters',from:['sz'],apply(card,self){
    const sh=locateCardAnyV4(self), ah=locateCardAnyV4(card);
    if(!sh||!ah||self.face!=='up'||sh.p!==ah.p||card.face!=='up') return null;
    if(!isSetCardV4(dbOf(card),SETCODE.AMAZONESS)) return null;
    const b=typeof battleContextV28==='function'?battleContextV28():{};
    if(!(b&&b.step==='calc'&&b.atkCard===card&&b.defCard&&curATK(card)<curATK(b.defCard))) return null;
    return {atk:1000};
  }}
});

/* リバース時に非ワーム爬虫類を全破壊。自分墓地ワーム爬虫類×500 ATKアップ。 */
defineUnifiedCardV4('ワーム・ヴィクトリー',[{
  key:'flip-destroy-non-worm',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onFlip'],
  operation(){
    API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&!(x.db.ra==='爬虫類'&&isSetCardV4(x.db,SETCODE.WORM))})
      .slice().reverse().forEach(t=>API.destroy(t,'ワーム・ヴィクトリー'));
  },afterResolve(){}
}],{
  type:'monster',priority:1,forced:true,passive:{onFlip:ctx=>ctx.zone==='mz'},
  continuous:{scope:'self',from:['mz'],apply(card,self,info){
    if(card!==self||card.face!=='up') return null;
    const h=locateCardAnyV4(self), p=h?h.p:(info&&info.p);
    if(p==null) return null;
    const n=e6OwnGraveSetReptileCount(p,SETCODE.WORM);
    return n?{atk:n*500}:null;
  }}
});

/* 直接攻撃で戦闘ダメージを与えた時、相手墓地のシンクロを全除外し、その数×1000ダメージ。 */
defineScript('記憶破壊王',{
  type:'monster',priority:1,forced:true,
  condition(ctx){
    const e=ctx.event||{};
    return !!(e.direct&&Number(e.amount)>0&&e.player===ctx.opponent&&e.attackerUid===ctx.card.uid
      &&API.pileCards(ctx.opponent,'grave',x=>x.db.k==='m'&&(x.db.st||[]).includes('シンクロ')).length>0);
  },
  resolve(ctx){
    const rs=API.pileCards(ctx.opponent,'grave',x=>x.db.k==='m'&&(x.db.st||[]).includes('シンクロ'));
    rs.slice().sort((a,b)=>b.index-a.index).forEach(r=>API.banish(r,'記憶破壊王'));
    if(rs.length) API.damageLP(ctx.opponent,rs.length*1000,'記憶破壊王');
  },afterResolve(){},
  passive:{onBattleDamage(ctx){return CARD_SCRIPTS['記憶破壊王'].condition(ctx);}}
});
