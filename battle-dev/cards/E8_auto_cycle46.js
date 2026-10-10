/* Auto cycle 46 — direct attack / battle utility pickups.
   Engine changes: none. New primitive: none. */

function e8SelfDirectDamage(ctx){
  const e=ctx.event||{};
  return !!(ctx.card&&e.direct&&Number(e.amount)>0&&e.player===ctx.opponent&&e.attackerUid===ctx.card.uid);
}

/* 攻撃表示: 自分のD（ディフォーマー）へ直接攻撃許可。
   守備表示: 自身以外の自分Dは戦闘破壊されない。 */
defineUnifiedCardV4('D・ボードン',[],{
  type:'monster',priority:1,
  continuous:{scope:'ownMonsters',from:['mz'],apply(){return null;},
    grantsDirectAttack(card,self){
      return !!(self&&self.face==='up'&&self.pos==='atk'&&card&&card.face==='up'
        &&isCardInGroupV4(dbOf(card),GROUP.D_MORPHTRONIC));
    },
    protectV21:{scope:'ownMonsters',battle:(target,src)=>
      !!(src&&src.face==='up'&&src.pos==='def'&&target&&target!==src&&target.face==='up'
        &&isCardInGroupV4(dbOf(target),GROUP.D_MORPHTRONIC)),label:'D・ボードン'}}
});

/* 直接攻撃可能。直接攻撃で戦闘ダメージを与えた時、相手手札1枚をランダムにデッキトップへ戻す。 */
defineScript('エレキマイラ',{
  type:'synchro',priority:1,forced:true,canDirectAttack:true,
  condition(ctx){return e8SelfDirectDamage(ctx)&&API.foe(ctx).hand.length>0;},
  resolve(ctx){
    const H=API.foe(ctx).hand;
    if(!H.length) return;
    const i=typeof duelRandomInt==='function'?duelRandomInt(H.length):Math.floor(Math.random()*H.length);
    API.returnToDeck({p:ctx.opponent,zone:'hand',index:i,card:H[i]},false,'エレキマイラ');
  },afterResolve(){},
  passive:{onDirectBattleDamage(ctx){return e8SelfDirectDamage(ctx)&&API.foe(ctx).hand.length>0;}}
});
