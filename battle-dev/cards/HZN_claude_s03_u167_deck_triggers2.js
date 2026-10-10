/* S03-U167: AUTO-table recruiters / searchers whose texts also have a continuous effect (left out of S03-U156), on the shared
   deck-trigger engine (engine/1ZT; spec.continuous), and バイオファルコン (a trigger on another monster's battle destruction). */

/* オシャレオン (2011): 「このカードが自分フィールド上に表側攻撃表示で存在する限り、相手は「オシャレオン」以外のモンスターを攻撃対象に選択する
   事はできない。このカードが戦闘によって破壊され墓地へ送られた時、自分のデッキから攻撃力500以下の爬虫類族モンスター1体を手札に加える事が
   できる。」 */
declareDeckTriggerS03('オシャレオン', {when:'battleToGrave', action:'search', optional:true, filter:{ra:'爬虫類', atkmax:500},
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> self.face==='up' && self.pos==='atk' && !deckTriggerNamedS03(dbOf(target), target, 'オシャレオン') }});

/* ジェイドナイト (2011): 「このカードがフィールド上に表側攻撃表示で存在する限り、自分フィールド上の攻撃力1200以下の機械族モンスターは罠カードの
   効果では破壊されない。フィールド上に表側表示で存在するこのカードが戦闘によって破壊され墓地へ送られた時、デッキから機械族・光属性・レベル4の
   モンスター1体を手札に加える事ができる。」
   The protection is System v21 (cause effect, sourceKind 't'); ATK and Type are the current ones. */
declareDeckTriggerS03('ジェイドナイト', {when:'battleToGrave', faceUp:true, action:'search', optional:true, filter:{ra:'機械', at:'光', lv:4},
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    protectV21:{ key:'ジェイドナイト', label:'ジェイドナイト', sourceKind:'t',
      effect:(target, self)=> self.face==='up' && self.pos==='atk' && target.face==='up' && currentRaceV17(target)==='機械' && curATK(target)<=1200 } }});

/* 機皇兵スキエル・アイン (2011): 「このカードの攻撃力は、このカード以外のフィールド上に表側表示で存在する「機皇」と名のついたモンスターの数×200
   ポイントアップする。このカードが戦闘によって破壊され墓地へ送られた時、自分のデッキから「機皇兵」と名のついたモンスター1体を特殊召喚する事が
   できる。」 (「機皇」 = GROUP.MEKLORD, 「機皇兵」 = GROUP.MEKLORD_ARMY; the Deck pool is monsters only) */
declareDeckTriggerS03('機皇兵スキエル・アイン', {when:'battleToGrave', action:'summon', optional:true, pos:'faceUp', filter:{group:'MEKLORD_ARMY'},
  continuous:{ scope:'self', from:['mz'],
    apply(card, self){
      if(card!==self) return null;
      let n = 0;
      [0,1].forEach(p=>(gameState.players[p].mz||[]).forEach(c=>{ if(c && c!==self && c.face==='up' && isCardInGroupV4(c, GROUP.MEKLORD)) n++; }));
      return n ? {atk:n*200} : null;
    } }});

/* バイオファルコン (2011): 「このカードがフィールド上に表側表示で存在する場合に自分フィールド上の機械族モンスターが戦闘によって破壊され墓地へ送ら
   れた時、デッキから攻撃力1000以下の機械族モンスター1体を手札に加える事ができる。」
   An optional trigger of this face-up card on the battle destruction of another Machine monster its controller controlled (the
   battle record graveInfo.byPlayer is the opponent of the destroyed card's controller). The Deck is examined at resolution. */
const BIO_FALCON_SPEC_S03 = {action:'search', from:['deck'], filter:{ra:'機械', atkmax:1000}};
function bioFalconEventS03(ctx){
  if(!ctx || ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return false;
  const e = ctx.event || {};
  const h = e.uid!=null ? findCardByUid(e.uid) : null;
  if(!h || h.card===ctx.card || h.zone!=='grave') return false;
  const g = h.card.graveInfo;
  return !!g && g.byPlayer===ctx.opponent && dbOf(h.card).ra==='機械';
}
defineScript('バイオファルコン', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy' || !bioFalconEventS03(ctx)){ ctx.reason = '自分の機械族モンスターが戦闘で破壊され墓地へ送られた時に発動できます'; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    const pool = deckTriggerPoolS03('バイオファルコン', BIO_FALCON_SPEC_S03, ctx.player);
    if(!pool.length){ API.shuffle(ctx.player); API.log('バイオファルコン：条件を満たすカードがデッキに無い（デッキをシャッフル）'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'バイオファルコン：手札に加える機械族モンスター', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name:'バイオファルコン', action:'search'}}, meta:{scriptName:'バイオファルコン'}});
  },
  afterResolve(){},
  blocksIfNoDeckToHand:true,
  dsTiming:'leave',
  passive:{ onBattleDestroy(ctx){ return bioFalconEventS03(ctx); } }
});
