/* Claude S03-U03: Dragunity Synchro line recovery. Historical 1103 effects, independently written.
   Reuses System01 grave-equip (as01*), S03-U01 deck-to-hand lock and S03-U02 per-effect count limit.
   Every choice is a registry handler, so a save taken while it is pending can be resumed. */

function s03SynchroSelf(ctx){return !!(ctx.event&&ctx.event.kind==='synchro')&&as01SelfEvent(ctx);}
function s03EquipsOnSelf(ctx){
 const self=locateCardAnyV4(ctx.card);
 return self?API.fieldCards({zone:'sz',filter:x=>x.card.face==='up'&&!!x.card.equipTo&&x.card.equipTo.uid===self.card.uid}):[];
}

/* ---- ドラグニティナイト－ヴァジュランダ ----
   ① S召喚成功時：自分墓地のレベル3以下のドラゴン族「ドラグニティ」1体を対象に装備する（誘発・対象を取る）。
   ② 1ターンに1度：このカードに装備された装備カード1枚を墓地へ送って発動（コスト）。攻撃力はターン終了時まで倍。
   2009-09-07 wiki: 装備は誘発効果、倍化は起動効果。倍にするのは元々ではなく現在の攻撃力。
   2010-06-17 wiki: このカードに装備された相手の装備カードもコストにできる。
   倍化は解決時の攻撃力分を加える固定値として扱う（リミッター解除の「エンドフェイズまで数値は固定」と同じ）。 */
API.registerChoiceHandler('claudeS03.vajrayana-cost',(answer,args)=>{
 const d=args.activation,picked=p11cCards(answer)[0],eq=picked&&p11cHit(picked.uid),self=p11cHit(d.uid);
 if(answer.cancelled||!eq||!self||eq.zone!=='sz'||!eq.card.equipTo||eq.card.equipTo.uid!==self.card.uid)return p11cAbort(d);
 API.recordActivationCost(p11cCtx(d.player),'send',[eq],[],1);
 API.sendToGrave(eq,d.name+'（コスト）');
 p11cCommit(d,[],'double');
});
defineUnifiedCardV4('ドラグニティナイト－ヴァジュランダ',[
 as01EquipEffect(['onSpecialSummon'],as01Dragon,{condition(ctx){return s03SynchroSelf(ctx)&&as01EquipCondition(ctx,as01Dragon);}}),
 {key:'double',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,events:['activate'],categories:{destroy:false},
  condition(ctx){return as01Face(ctx)&&s03EquipsOnSelf(ctx).length>0;},
  operation(ctx){
   const self=locateCardAnyV4(ctx.card);
   if(self&&self.zone==='mz'&&self.card.face==='up')API.modAtk(self,curATK(self.card),0,'endTurn','ドラグニティナイト－ヴァジュランダ');
  },afterResolve(){}}
],{type:'synchro',priority:1,targets:true,timing:['mainPhase'],countLimit:{n:1,effects:['double']},
 activationV11(ctx,d){
  if(ctx.eventName==='onSpecialSummon')as01EquipChoice(ctx,d,as01Dragon);
  else p11cOpen(d,{title:d.name+'：墓地へ送る装備カード',candidates:s03EquipsOnSelf(ctx),targeting:false},'claudeS03.vajrayana-cost',{});
 },
 passive:{onSpecialSummon(ctx){return s03SynchroSelf(ctx)&&as01EquipCondition(ctx,as01Dragon);}}
});

/* ---- ドラグニティナイト－バルーチャ ----
   ① S召喚成功時：自分墓地のドラゴン族「ドラグニティ」を任意の数だけ対象に装備する（誘発・対象を取る）。
   ② このカードの攻撃力は、装備された「ドラグニティ」カードの数×300アップ。
   2010-01-22 wiki: 対象を取り、発動時に任意の枚数を選択。2010-01-23: 空いている魔法＆罠ゾーンの数まで。
   2010-06-17: 一部の対象がチェーンで除外されても残りは装備する。
   2010-07-01: 解決時に魔法＆罠ゾーンが足りなくなった場合は不発。 */
function s03BaluchaEquip(x){return x.db.k==='m'&&x.db.ra==='ドラゴン'&&isSetCardV4(x.db,SETCODE.DRAGUNITY);}
function s03FreeSz(p){return Math.max(0,ZONE_LIMITS.sz-gameState.players[p].sz.length);}
defineUnifiedCardV4('ドラグニティナイト－バルーチャ',[
 {key:'equip',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,events:['onSpecialSummon'],categories:{destroy:false},
  condition(ctx){return s03SynchroSelf(ctx)&&as01EquipCondition(ctx,s03BaluchaEquip);},
  operation(ctx){
   const self=locateCardAnyV4(ctx.card);
   if(!self||self.zone!=='mz'||self.card.face!=='up')return;
   const live=(ctx.selectedTargets||[]).map(t=>resolveTarget(t))
     .filter(t=>t&&t.zone==='grave'&&t.p===ctx.player&&s03BaluchaEquip({card:t.card,db:dbOf(t.card)}));
   if(!live.length||live.length>s03FreeSz(ctx.player))return;
   live.map(t=>t.card.uid).forEach(uid=>{
    const eq=findCardByUid(uid),host=locateCardAnyV4(ctx.card);
    if(eq&&host)API.equipFromGrave(ctx.player,eq,host,cardName(ctx.card),ctx.card.uid,ctx.chainId);
   });
  },afterResolve(){}}
],{type:'synchro',priority:1,targets:true,timing:['mainPhase'],
 activationV11(ctx,d){
  const pool=as01Pool(ctx,s03BaluchaEquip);
  p11cOpen(d,{title:d.name+'：墓地から装備する「ドラグニティ」（任意の数）',candidates:pool,targeting:true,
   min:1,max:Math.max(1,Math.min(pool.length,s03FreeSz(ctx.player)))},'p11cards.commit-targets',{mode:'equip'});
 },
 passive:{onSpecialSummon(ctx){return s03SynchroSelf(ctx)&&as01EquipCondition(ctx,s03BaluchaEquip);}},
 continuous:{from:['mz'],scope:'self',apply(card){
  const n=equipsOnV15(card,gameState).filter(x=>isSetCardV4(dbOf(x.card),SETCODE.DRAGUNITY)).length;
  return n?{atk:300*n}:null;
 }}
});

/* ---- 1ターンに1度：デッキから手札に加え、その後、手札から1体を墓地へ（捨てる／送る） ----
   ドラグニティナイト－ガジャルグ：レベル4以下のドラゴン族か鳥獣族を加え、ドラゴン族か鳥獣族を捨てる。
     2009-07-05 wiki: 加える処理と捨てる処理は順番。《ライオウ》が存在する場合は発動できない。
     2009-08-29 wiki: チェーンして《ライオウ》が特殊召喚された場合、加える処理も捨てる処理も行わない。
     wiki: 手札にドラゴン族・鳥獣族が無くても発動できる。
   ラヴァルバル・ドラグーン：「ラヴァル」モンスターを加え、手札の「ラヴァル」モンスターを墓地へ送る（捨てるではない）。
     2011-05-10 wiki: 処理時に《ライオウ》の効果が適用されていれば、サーチせず手札から墓地へ送る事もない。
   registry handler の args はカード名とプレイヤーだけ（JSON）。条件はこの表から引く。 */
const S03_SEARCH_THEN_HAND={
 'ドラグニティナイト－ガジャルグ':{
  search:x=>x.db.k==='m'&&(Number(x.db.lv)||0)<=4&&(x.db.ra==='ドラゴン'||x.db.ra==='鳥獣'),
  hand:x=>x.db.k==='m'&&(x.db.ra==='ドラゴン'||x.db.ra==='鳥獣'),
  move:'discard',handTitle:'捨てるドラゴン族・鳥獣族'},
 'ラヴァルバル・ドラグーン':{
  search:x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.LAVAL),
  hand:x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.LAVAL),
  move:'send',handTitle:'墓地へ送る「ラヴァル」モンスター'}
};
API.registerChoiceHandler('claudeS03.search-then-hand',(answer,args)=>{
 const spec=S03_SEARCH_THEN_HAND[args.name],picked=p11cCards(answer)[0],h=picked&&p11cHit(picked.uid);
 if(!spec||!h||h.zone!=='deck'||h.p!==args.player)return;
 if(!API.searchDeck(args.player,h.index,args.name))return;   // 封印中は加えず、その後の処理も行わない
 const hand=API.pileCards(args.player,'hand',spec.hand);
 if(!hand.length)return;
 API.requestChoice({player:args.player,kind:'card',title:args.name+'：'+spec.handTitle,candidates:hand,min:1,max:1,cancelable:false,
  resume:{handler:'claudeS03.search-then-hand-move',args:{player:args.player,name:args.name}}});
});
API.registerChoiceHandler('claudeS03.search-then-hand-move',(answer,args)=>{
 const spec=S03_SEARCH_THEN_HAND[args.name],picked=p11cCards(answer)[0],h=picked&&p11cHit(picked.uid);
 if(!spec||!h||h.zone!=='hand'||h.p!==args.player)return;
 if(spec.move==='discard')API.discard(args.player,h.index,args.name);
 else API.sendHandToGrave(args.player,h.index,args.name);
});
function s03SearchThenHandEffect(name){
 const spec=S03_SEARCH_THEN_HAND[name];
 return {key:'search-then-hand',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,events:['activate'],categories:{destroy:false},
  condition(ctx){return as01Face(ctx)&&API.pileCards(ctx.player,'deck',spec.search).length>0;},
  operation(ctx){
   const lock=deckToHandLockReasonV32(ctx.player);
   if(lock){API.log(name+'：'+lock);return;}
   const deck=API.pileCards(ctx.player,'deck',spec.search);
   if(!deck.length)return;
   API.requestChoice({player:ctx.player,kind:'card',title:name+'：手札に加えるモンスター',candidates:deck,min:1,max:1,cancelable:false,
    resume:{handler:'claudeS03.search-then-hand',args:{player:ctx.player,name}}});
  },afterResolve(){}};
}
defineUnifiedCardV4('ドラグニティナイト－ガジャルグ',[s03SearchThenHandEffect('ドラグニティナイト－ガジャルグ')],
 {type:'synchro',priority:1,timing:['mainPhase'],countLimit:1,blocksIfNoDeckToHand:true});
defineUnifiedCardV4('ラヴァルバル・ドラグーン',[s03SearchThenHandEffect('ラヴァルバル・ドラグーン')],
 {type:'synchro',priority:1,timing:['mainPhase'],countLimit:1,blocksIfNoDeckToHand:true});
