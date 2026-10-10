/* =========================================================================
   System v3.8.0: 1103 script expansion batch 5
   Staples / Monarch / Frog-Genex / Lightsworn / Zombie / Dark World / Fabled
   ========================================================================= */
function v380bName(c){return String(dbOf(c).n||'');}
function v380bIsFabled(c){return v380bName(c).indexOf('魔轟神')>=0;}
function v380bIsLightsworn(c){return v380bName(c).indexOf('ライトロード')>=0;}
function v380bIsNordic(c){return v380bName(c).indexOf('極星')>=0;}
function v380bIsNordicRelic(c){return v380bName(c).indexOf('極星宝')>=0;}
function v380bAtkMonster(p){return API.fieldCards({zone:'mz',player:p,filter:x=>x.card.face==='up'&&x.card.pos==='atk'});}
function v380bAttackCard(){const a=gameState.pendingAttack;return a&&findCardByUid(a.attackerUid);}
function v380bMoveCrossGraveToOwn(p,t,reason){
  const r=resolveTarget(t);if(!r||r.zone!=='grave')return false;
  if(r.p!==p) act({type:'FX_CONTROL',player:r.p,zone:'grave',index:r.index,toPlayer:p,reason:reason||'墓地移動'});
  const h=resolveTarget({card:t.card});if(!h||h.p!==p||h.zone!=='grave')return false;
  API.specialSummon(p,'grave',h.index,'atk',reason);return true;
}

/* -------------------- staple traps / spells -------------------- */
defineScript('鳳翼の爆風',{
  type:'trap',priority:2,quickEffect:true,targets:true,
  condition(ctx){if(!API.me(ctx).hand.length){ctx.reason='捨てる手札がありません';return false;}if(!API.fieldCards({player:ctx.opponent}).length){ctx.reason='相手フィールドにカードがありません';return false;}return true;},
  cost(ctx,done){API.selectCard('鳳翼の爆風：捨てる手札',API.pileCards(ctx.player,'hand'),t=>{const r=resolveTarget(t);if(!r){done(false);return;}API.discard(ctx.player,r.index,'鳳翼の爆風（コスト）',{byEffect:false});done(true);});},
  selectTargets(ctx,done){API.selectCard('鳳翼の爆風：デッキトップへ戻す相手カード',API.fieldCards({player:ctx.opponent}),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.returnToDeck(t,false,'鳳翼の爆風');}
});

defineScript('炸裂装甲',{
  type:'trap',priority:2,targets:true,
  condition(ctx){const a=gameState.pendingAttack;if(!a||a.player!==ctx.opponent){ctx.reason='相手モンスターの攻撃宣言時に発動します';return false;}return !!v380bAttackCard();},
  selectTargets(ctx,done){const h=v380bAttackCard();done(h?[h]:[]);},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.destroy(t,'炸裂装甲');},
  passive:{onAttackDeclare(ctx){const a=gameState.pendingAttack;return ctx.zone==='sz'&&ctx.card.face==='down'&&!!a&&a.player===ctx.opponent;}}
});

defineScript('万能地雷グレイモヤ',{
  type:'trap',priority:2,
  condition(ctx){const a=gameState.pendingAttack;if(!a||a.player!==ctx.opponent){ctx.reason='相手の攻撃宣言時に発動します';return false;}return v380bAtkMonster(ctx.opponent).length>0;},
  resolve(ctx){const all=v380bAtkMonster(ctx.opponent);if(!all.length)return;const mx=Math.max(...all.map(x=>curATK(x.card))),top=all.filter(x=>curATK(x.card)===mx);if(top.length===1){API.destroy(top[0],'万能地雷グレイモヤ');return;}API.requestChoice({player:ctx.player,kind:'card',title:'万能地雷グレイモヤ：最高攻撃力から1体',candidates:top,min:1,max:1,cancelable:false,/* S03-U194: the destruction is mandatory */resume:{handler:'s03u62.dest-lowest-stat-tiebreak',args:{reason:'万能地雷グレイモヤ'}},meta:{scriptName:'万能地雷グレイモヤ'}});},
  passive:{onAttackDeclare(ctx){const a=gameState.pendingAttack;return ctx.zone==='sz'&&ctx.card.face==='down'&&!!a&&a.player===ctx.opponent&&v380bAtkMonster(ctx.opponent).length>0;}}
});

defineScript('因果切断',{
  type:'trap',priority:2,quickEffect:true,targets:true,
  condition(ctx){if(!API.me(ctx).hand.length){ctx.reason='捨てる手札がありません';return false;}if(!API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.face==='up'}).length){ctx.reason='相手の表側表示モンスターがいません';return false;}return true;},
  cost(ctx,done){API.selectCard('因果切断：捨てる手札',API.pileCards(ctx.player,'hand'),t=>{const r=resolveTarget(t);if(!r){done(false);return;}API.discard(ctx.player,r.index,'因果切断（コスト）',{byEffect:false});done(true);});},
  selectTargets(ctx,done){API.selectCard('因果切断：除外する相手モンスター',API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.face==='up'}),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(!t)return;const nm=v380bName(t.card);API.banish(t,'因果切断');for(let i=API.foe(ctx).grave.length-1;i>=0;i--){if(v380bName(API.foe(ctx).grave[i])===nm)API.banish({p:ctx.opponent,zone:'grave',index:i,card:API.foe(ctx).grave[i]},'因果切断（同名）');}}
});

/* 1103時点の旧テキスト：通常召喚可能かどうかを問わず相手表側1体を対象。 */
defineScript('洗脳－ブレインコントロール',{
  auditNote:'1103当時の旧テキストで実装（800LP・相手表側1体をEnd Phaseまでコントロール）',
  type:'spell',priority:1,targets:true,
  condition(ctx){if(API.me(ctx).lp<800){ctx.reason='800LPを払えません';return false;}if(!API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.face==='up'}).length){ctx.reason='相手の表側表示モンスターがいません';return false;}return true;},
  cost(ctx,done){API.payCost(ctx.player,800);done(true);},
  selectTargets(ctx,done){API.selectCard('洗脳：コントロールを得る相手モンスター',API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.face==='up'}),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.changeControl(t,ctx.player,'洗脳－ブレインコントロール','endPhase');}
});

/* -------------------- Monarch -------------------- */
defineScript('氷帝メビウス',{
  type:'monster',priority:1,targets:true,
  condition(ctx){if(ctx.eventName!=='onNormalSummon'||ctx.zone!=='mz'||(ctx.card.tributeCount||0)<1){ctx.reason='アドバンス召喚成功時に発動します';return false;}if(!API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'}).length){ctx.reason='魔法・罠カードがありません';return false;}return true;},
  selectTargets(ctx,done){v380SelectUpTo('氷帝メビウス：破壊する魔法・罠',API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'}),2,done);},
  resolve(ctx){ctx.selectedTargets.slice().reverse().forEach(t=>API.destroy(t,'氷帝メビウス'));},afterResolve(){},
  passive:{onNormalSummon(ctx){return ctx.zone==='mz'&&(ctx.card.tributeCount||0)>=1;}}
});

defineScript('炎帝テスタロス',{
  type:'monster',priority:1,forced:true,
  condition(ctx){if(ctx.eventName!=='onNormalSummon'||ctx.zone!=='mz'||(ctx.card.tributeCount||0)<1){ctx.reason='アドバンス召喚成功時に発動します';return false;}return API.foe(ctx).hand.length>0;},
  resolve(ctx){const H=API.foe(ctx).hand;if(!H.length)return;const i=(typeof duelRandomInt==='function'?duelRandomInt(H.length):Math.floor(Math.random()*H.length)),c=H[i],d=dbOf(c);API.discard(ctx.opponent,i,'炎帝テスタロス',{byEffect:true,byPlayer:ctx.player});if(d.k==='m')API.damageLP(ctx.opponent,Math.max(0,d.lv||0)*100);},afterResolve(){},
  passive:{onNormalSummon(ctx){return ctx.zone==='mz'&&(ctx.card.tributeCount||0)>=1&&API.foe(ctx).hand.length>0;}}
});

defineScript('雷帝ザボルグ',{
  type:'monster',priority:1,forced:true,targets:true,
  condition(ctx){if(ctx.eventName!=='onNormalSummon'||ctx.zone!=='mz'||(ctx.card.tributeCount||0)<1){ctx.reason='アドバンス召喚成功時に発動します';return false;}return API.fieldCards({zone:'mz'}).length>0;},
  selectTargets(ctx,done){API.selectCard('雷帝ザボルグ：破壊するモンスター',API.fieldCards({zone:'mz'}),t=>done([t]));},resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.destroy(t,'雷帝ザボルグ');},afterResolve(){},passive:{onNormalSummon(ctx){return ctx.zone==='mz'&&(ctx.card.tributeCount||0)>=1;}}
});

/* 光帝クライス: 「破壊されたカードのコントローラーは破壊された数だけデッキからドローできる」 — ask each controller in turn. */
function u189KraisDrawAsk(order){
  const q=(order||[]).filter(x=>x&&x.n>0&&gameState.players[x.p]);if(!q.length)return;
  const x=q[0];
  API.requestChoice({player:x.p,kind:'yesno',title:`光帝クライス：デッキから${x.n}枚ドローしますか？`,
    candidates:[{key:'yes',label:'ドローする',value:true},{key:'no',label:'ドローしない',value:false}],min:1,max:1,cancelable:false,
    resume:{handler:'s03u189.krais-draw',args:{order:q}},meta:{scriptName:'光帝クライス'}});
}
registerChoiceHandlerV49('s03u189.krais-draw',(answer,args)=>{
  if(!args||!Array.isArray(args.order)||!args.order.length)return;
  const q=args.order.slice(),x=q.shift(),pick=answer&&answer.cards&&answer.cards[0];
  if(pick&&pick.value===true)API.draw(x.p,x.n);
  u189KraisDrawAsk(q);
});
defineScript('光帝クライス',{
  type:'monster',priority:1,targets:true,
  condition(ctx){if(!['onNormalSummon','onSpecialSummon'].includes(ctx.eventName)||ctx.zone!=='mz'){ctx.reason='召喚・特殊召喚成功時に発動します';return false;}return API.fieldCards().length>0;},
  selectTargets(ctx,done){v380SelectUpTo('光帝クライス：破壊するカード',API.fieldCards(),2,done);},
  /* S03-U188/U189: only cards still on the field are destroyed, and only cards that actually left it by that destruction count (a target
     removed before resolution or saved by a substitute does not). 「ドローできる」: each controller chooses (registered choice, SaveLoad-safe). */
  /* S03-U294: counted from the destruction log once the destructions are done (after any substitute decision, engine/1ZZO) */
  resolve(ctx){const mark=API.destroyMarkS03(),items=[];ctx.selectedTargets.forEach(t=>{const uid=t.card&&t.card.uid,h=uid!=null?findCardByUid(uid):null;
    if(!h||!['mz','sz','field'].includes(h.zone))return;items.push({uid,p:h.p});API.destroy(h,'光帝クライス');});
    API.afterDestroyS03('s03u294.krais',{mark,items});},afterResolve(){},
  passive:{onNormalSummon(ctx){return ctx.zone==='mz';},onSpecialSummon(ctx){return ctx.zone==='mz';}},
  continuous:{scope:'self',from:['mz'],apply(){return null;},cannotAttack(card,self){return card===self&&self.summonedTurn===gameState.turn;}}
});

/* -------------------- WATER / Synchro foundation -------------------- */
defineScript('フィッシュボーグ－ガンナー',{
  type:'monster',priority:1,activateFrom:['grave'],timing:['mainPhase'],blocksIfNoSpecialSummon:true,
  condition(ctx){if(ctx.zone!=='grave'||ctx.player!==gameState.activePlayer||!['main1','main2'].includes(gameState.phase)){ctx.reason='自分メインフェイズに墓地で発動します';return false;}if(!API.me(ctx).hand.length){ctx.reason='捨てる手札がありません';return false;}if(!API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&x.db.at==='水'&&(x.db.lv||99)<=3}).length){ctx.reason='レベル3以下の水属性モンスターが必要です';return false;}return API.me(ctx).mz.length<ZONE_LIMITS.mz;},
  cost(ctx,done){API.selectCard('フィッシュボーグ－ガンナー：捨てる手札',API.pileCards(ctx.player,'hand'),t=>{const r=resolveTarget(t);if(!r){done(false);return;}API.discard(ctx.player,r.index,'フィッシュボーグ－ガンナー（コスト）',{byEffect:false});done(true);});},
  resolve(ctx){const i=API.me(ctx).grave.indexOf(ctx.card);if(i>=0)API.specialSummon(ctx.player,'grave',i,'atk','フィッシュボーグ－ガンナー');},afterResolve(){},
  synchroMaterialRestriction(info){return (info.set||[]).filter(x=>(x.card||x.c)!==info.source).every(x=>dbOf(x.card||x.c).at==='水');}
});

/* S03-U196: 「発動できる」 — optional (before: forced), only for its own summon */
defineScript('ジェネクス・ウンディーネ',{
  type:'monster',priority:1,
  condition(ctx){if(ctx.eventName!=='onNormalSummon'||ctx.zone!=='mz'||!eventIsSelfS03(ctx)){ctx.reason='召喚成功時に発動します';return false;}if(!API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&x.db.at==='水').length){ctx.reason='デッキに水属性モンスターがいません';return false;}if(!API.pileCards(ctx.player,'deck',x=>x.db.n==='ジェネクス・コントローラー').length){ctx.reason='デッキにジェネクス・コントローラーがいません';return false;}return true;},
  cost(ctx,done){API.selectCard('ジェネクス・ウンディーネ：墓地へ送る水属性',API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&x.db.at==='水'),t=>{const r=resolveTarget(t);if(!r){done(false);return;}API.mill(ctx.player,r.index,'ジェネクス・ウンディーネ（コスト）');done(true);});},
  resolve(ctx){const p=API.pileCards(ctx.player,'deck',x=>x.db.n==='ジェネクス・コントローラー');if(p.length)API.searchDeck(ctx.player,p[0].index,'ジェネクス・ウンディーネ');},afterResolve(){},passive:{onNormalSummon(ctx){return ctx.zone==='mz'&&eventIsSelfS03(ctx);}}
});

defineScript('チューニング・サポーター',{
  type:'monster',priority:1,forced:true,
  synchroMaterialLevelOptions(){return [1,2];},
  /* S03-U193: only when this card itself was the Synchro Material (before: any material sent while it was in the GY) */
  condition(ctx){return ctx.eventName==='onSendToGrave'&&ctx.zone==='grave'&&ctx.event&&ctx.event.reason==='synchroMaterial'&&eventIsSelfS03(ctx);},
  resolve(ctx){API.draw(ctx.player,1);},afterResolve(){},passive:{onSendToGrave(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.reason==='synchroMaterial'&&eventIsSelfS03(ctx);}}
});

/* -------------------- Lightsworn / Zombie -------------------- */
defineScript('ライトロード・マジシャン ライラ',{
  type:'monster',priority:1,endPhaseMill:3,timing:['mainPhase'],targets:true,
  condition(ctx){if(ctx.zone!=='mz'||ctx.player!==gameState.activePlayer||!['main1','main2'].includes(gameState.phase)||ctx.card.face!=='up'||ctx.card.pos!=='atk'){ctx.reason='自分メインフェイズに表側攻撃表示で発動します';return false;}if(!API.fieldCards({player:ctx.opponent,filter:x=>x.zone==='sz'||x.zone==='field'}).length){ctx.reason='相手の魔法・罠がありません';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('ライラ：破壊する相手の魔法・罠',API.fieldCards({player:ctx.opponent,filter:x=>x.zone==='sz'||x.zone==='field'}),t=>done([t]));},
  resolve(ctx){const self=locateCard(ctx.card);if(self)API.changePosition(self,'def','ライトロード・マジシャン ライラ');API.setCardFlag({card:ctx.card},'v380LylaLockThroughTurn',gameState.turn+2,'ライトロード・マジシャン ライラ',{silent:true});const t=ctx.selectedTargets[0];if(t)API.destroy(t,'ライトロード・マジシャン ライラ');},afterResolve(){}
});

/* S03-U196: 「1ターンに1度」 (countLimit) and 「この効果はこのカードがモンスターゾーンに表側表示で存在する場合に発動と処理ができる」 (resolution
   check) were missing */
defineScript('ゾンビ・マスター',{
  type:'monster',priority:1,timing:['mainPhase'],targets:true,blocksIfNoSpecialSummon:true,countLimit:1,
  condition(ctx){if(ctx.zone!=='mz'||ctx.card.face!=='up'||ctx.player!==gameState.activePlayer||!['main1','main2'].includes(gameState.phase)){ctx.reason='自分メインフェイズに表側表示で発動します';return false;}if(!handCandidates(ctx,x=>x.db.k==='m').length){ctx.reason='墓地へ送る手札モンスターがありません';return false;}const g=[...API.pileCards(0,'grave'),...API.pileCards(1,'grave')].filter(x=>x.db.k==='m'&&x.db.ra==='アンデット'&&(x.db.lv||99)<=4);if(!g.length){ctx.reason='墓地にレベル4以下のアンデット族がいません';return false;}return API.me(ctx).mz.length<ZONE_LIMITS.mz;},
  cost(ctx,done){API.selectCard('ゾンビ・マスター：墓地へ送る手札モンスター',handCandidates(ctx,x=>x.db.k==='m'),t=>{const r=resolveTarget(t);if(!r){done(false);return;}API.sendHandToGrave(ctx.player,r.index,'ゾンビ・マスター（コスト）');done(true);});},
  selectTargets(ctx,done){const g=[...API.pileCards(0,'grave'),...API.pileCards(1,'grave')].filter(x=>x.db.k==='m'&&x.db.ra==='アンデット'&&(x.db.lv||99)<=4);API.selectCard('ゾンビ・マスター：特殊召喚するアンデット族',g,t=>done([t]));},
  resolve(ctx){const me=ctx.card&&ctx.card.uid!=null?findCardByUid(ctx.card.uid):null;if(!me||me.zone!=='mz'||me.card.face!=='up'){API.log('ゾンビ・マスター：表側表示で存在しないため処理できない');return;}const t=ctx.selectedTargets[0];if(t)v380bMoveCrossGraveToOwn(ctx.player,t,'ゾンビ・マスター');},afterResolve(){}
});

defineScript('ピラミッド・タートル',{
  type:'monster',priority:1,blocksIfNoSpecialSummon:true,
  condition(ctx){if(ctx.eventName!=='onBattleDestroy'||ctx.zone!=='grave'){ctx.reason='戦闘で破壊され墓地へ送られた時に発動します';return false;}return API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&x.db.ra==='アンデット'&&(x.db.def||99999)<=2000).length>0&&API.me(ctx).mz.length<ZONE_LIMITS.mz;},
  selectTargets(ctx,done){ done([]); },
  resolve(ctx){
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const pool=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&x.db.ra==='アンデット'&&(x.db.def||99999)<=2000);
    if(!pool.length)return;
    API.requestChoice({player:ctx.player,kind:'card',title:'ピラミッド・タートル：特殊召喚するアンデット族',
      candidates:pool,min:1,max:1,cancelable:false,
      resume:{handler:'s03u58.deck-special',args:{player:ctx.player,pos:'atk',reason:'ピラミッド・タートル'}},
      meta:{scriptName:'ピラミッド・タートル'}});
  },afterResolve(){},passive:{onBattleDestroy(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card;}}
});

defineScript('生者の書－禁断の呪術－',{
  type:'spell',priority:1,targets:true,blocksIfNoSpecialSummon:true,
  condition(ctx){if(!API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&x.db.ra==='アンデット').length){ctx.reason='自分の墓地にアンデット族がいません';return false;}if(!API.pileCards(ctx.opponent,'grave',x=>x.db.k==='m').length){ctx.reason='相手の墓地にモンスターがいません';return false;}return API.me(ctx).mz.length<ZONE_LIMITS.mz;},
  selectTargets(ctx,done){API.selectCard('生者の書：特殊召喚する自分のアンデット',API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&x.db.ra==='アンデット'),a=>API.selectCard('生者の書：除外する相手墓地モンスター',API.pileCards(ctx.opponent,'grave',x=>x.db.k==='m'),b=>done([a,b])));},
  resolve(ctx){const a=resolveTarget(ctx.selectedTargets[0]),b=resolveTarget(ctx.selectedTargets[1]);if(a&&a.zone==='grave')API.specialSummon(ctx.player,'grave',a.index,'atk','生者の書－禁断の呪術－');if(b&&b.zone==='grave')API.banish(b,'生者の書－禁断の呪術－');}
});

defineScript('異次元からの埋葬',{
  type:'spell',priority:2,quickEffect:true,targets:true,
  condition(ctx){return API.pileCards(0,'banish',x=>x.db.k==='m').length+API.pileCards(1,'banish',x=>x.db.k==='m').length>0;},
  selectTargets(ctx,done){v380SelectUpTo('異次元からの埋葬：墓地へ戻す除外モンスター',[...API.pileCards(0,'banish',x=>x.db.k==='m'),...API.pileCards(1,'banish',x=>x.db.k==='m')],3,done);},
  resolve(ctx){ctx.selectedTargets.slice().reverse().forEach(t=>{const r=resolveTarget(t);if(r&&r.zone==='banish')API.sendToGrave(r,'異次元からの埋葬');});}
});

defineScript('ソーラー・エクスチェンジ',{
  type:'spell',priority:1,
  condition(ctx){if(API.me(ctx).deck.length<2){ctx.reason='デッキが2枚未満です';return false;}return handCandidates(ctx,x=>v380bIsLightsworn(x.card)).length>0;},
  cost(ctx,done){API.selectCard('ソーラー・エクスチェンジ：捨てるライトロード',handCandidates(ctx,x=>v380bIsLightsworn(x.card)),t=>{const r=resolveTarget(t);if(!r){done(false);return;}API.discard(ctx.player,r.index,'ソーラー・エクスチェンジ（コスト）',{byEffect:false});done(true);});},
  resolve(ctx){API.draw(ctx.player,2);API.millTop(ctx.player,2,'ソーラー・エクスチェンジ');}
});

/* -------------------- Fabled / Dark World -------------------- */
/* S03-U138: 「1ターンに1度」 was missing (countLimit), and the Level boost was a permanent lvMod flag instead of 「エンドフェイズ時まで」 (API.modLevel endTurn). */
defineScript('魔轟神レイヴン',{
  type:'monster',priority:1,timing:['mainPhase'],countLimit:1,
  condition(ctx){if(ctx.zone!=='mz'||ctx.player!==gameState.activePlayer||!['main1','main2'].includes(gameState.phase)){ctx.reason='自分メインフェイズに発動します';return false;}if(!API.me(ctx).hand.length){ctx.reason='捨てる手札がありません';return false;}return true;},
  resolve(ctx){v380SelectUpTo('魔轟神レイヴン：効果で捨てる手札',API.pileCards(ctx.player,'hand'),API.me(ctx).hand.length,sel=>{const cards=sel.map(x=>x.card),n=cards.length;cards.forEach(c=>{const r=resolveTarget({card:c});if(r&&r.zone==='hand')API.discard(ctx.player,r.index,'魔轟神レイヴン',{byEffect:true,byPlayer:ctx.player});});if(n){const self=locateCard(ctx.card);if(self){API.modLevel(self,n,'endTurn','魔轟神レイヴン');API.modAtk(self,n*400,0,'endTurn','魔轟神レイヴン');}}render();});}
});

defineScript('暗黒界の軍神 シルバ',{
  type:'monster',priority:1,forced:true,activateFrom:['grave'],/* S03-U112: 強制 */blocksIfNoSpecialSummon:true,
  condition(ctx){if(ctx.zone!=='grave'||!darkWorldDiscard(ctx)){ctx.reason='カードの効果で手札から捨てられた時に発動します';return false;}return API.me(ctx).mz.length<ZONE_LIMITS.mz;},
  resolve(ctx){const mode=darkWorldDiscard(ctx),i=API.me(ctx).grave.indexOf(ctx.card);if(i>=0)API.specialSummon(ctx.player,'grave',i,'atk','暗黒界の軍神 シルバ');if(mode==='opponent'&&API.foe(ctx).hand.length>=2){v380SelectExactly('シルバ：デッキ下へ戻す相手手札',API.pileCards(ctx.opponent,'hand'),2,sel=>{sel.slice().reverse().forEach(t=>{const r=resolveTarget({card:t.card});if(r&&r.zone==='hand')API.returnToDeck(r,true,'暗黒界の軍神 シルバ');});render();});}},afterResolve(){},passive:{onDiscard(ctx){return ctx.zone==='grave'&&!!darkWorldDiscard(ctx);}}
});

defineScript('暗黒界の雷',{
  type:'spell',priority:1,targets:true,
  condition(ctx){/* S03-U111/U112: 発動したこのカード自身（セット中は裏側）は対象にできない */if(!API.fieldCards({filter:x=>x.card.face==='down'&&x.card!==ctx.card}).length){ctx.reason='このカード以外に裏側表示カードがありません';return false;}if(!API.me(ctx).hand.length){ctx.reason='効果で捨てる手札がありません';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('暗黒界の雷：破壊する裏側表示カード',API.fieldCards({filter:x=>x.card.face==='down'&&x.card!==ctx.card}),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.destroy(t,'暗黒界の雷');if(API.me(ctx).hand.length)API.requestChoice({player:ctx.player,kind:'card',title:'暗黒界の雷：効果で捨てる手札',candidates:API.pileCards(ctx.player,'hand'),min:1,max:1,cancelable:false/* S03-U112: 「その後…捨てる」は強制 */,resume:{handler:'s03u62.dark-world-thunder-discard',args:{player:ctx.player}},meta:{scriptName:'暗黒界の雷'}});}
});
/* S03-U62: resolve() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.dark-world-thunder-discard',(answer,args)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  if(h&&h.zone==='hand')API.discard(args.player,h.index,'暗黒界の雷',{byEffect:true,byPlayer:args.player});
});

defineScript('墓穴の道連れ',{
  type:'spell',priority:1,
  condition(ctx){if(!API.me(ctx).hand.length||!API.foe(ctx).hand.length){ctx.reason='お互いに手札が必要です';return false;}if(!API.me(ctx).deck.length||!API.foe(ctx).deck.length){ctx.reason='お互いのデッキにカードが必要です';return false;}return true;},
  resolve(ctx){
    API.requestChoice({player:ctx.player,kind:'card',title:'墓穴の道連れ：相手の手札から捨てさせるカード',
      candidates:API.pileCards(ctx.opponent,'hand'),min:1,max:1,cancelable:true,
      resume:{handler:'s03u62.bribe-of-the-living-dead-step1',args:{player:ctx.player,opponent:ctx.opponent}},
      meta:{scriptName:'墓穴の道連れ'}});
  }
});
/* S03-U62: resolve() 内の2段階 legacy API.selectCard（相手が捨てる→自分が捨てる、両方の discard/draw は
   2段階目の pick 確定後にまとめて実行 — legacy 実装の「どちらかを cancel したら何も起きない」を保つ）を
   SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.bribe-of-the-living-dead-step1',(answer,args)=>{
  const picks=v49P1ChoiceCards(answer);
  const opp=picks[0]&&locateCardAnyV4(picks[0].card);
  if(!opp||opp.zone!=='hand')return;
  /* S03-U92: real text has BOTH players independently choose 1 card from the OTHER player's hand to
     discard ("each player looks at the opponent's hand and chooses 1 card from it") -- the old
     implementation had the activator choose BOTH discards (including their own), letting them freely
     dump their own worst card instead of the real opponent-chooses-your-discard risk. This second choice
     must be made by args.opponent, selecting from args.player's hand (matching this very prompt's own
     already-correct title text, which the code contradicted). */
  API.requestChoice({player:args.opponent,kind:'card',title:'墓穴の道連れ：相手が自分の手札から捨てさせるカード',
    candidates:API.pileCards(args.player,'hand'),min:1,max:1,cancelable:true,
    resume:{handler:'s03u62.bribe-of-the-living-dead-step2',args:{player:args.player,opponent:args.opponent,oppUid:opp.card.uid}},
    meta:{scriptName:'墓穴の道連れ'}});
});
API.registerChoiceHandler('s03u62.bribe-of-the-living-dead-step2',(answer,args)=>{
  const picks=v49P1ChoiceCards(answer);
  const mine=picks[0]&&locateCardAnyV4(picks[0].card);
  if(!mine||mine.zone!=='hand')return;
  const oppLoc=args.oppUid!=null?findCardByUid(args.oppUid):null;
  if(oppLoc&&oppLoc.zone==='hand')API.discard(args.opponent,oppLoc.index,'墓穴の道連れ',{byEffect:true,byPlayer:args.player});
  API.discard(args.player,mine.index,'墓穴の道連れ',{byEffect:true,byPlayer:args.opponent});
  API.draw(args.player,1);
  API.draw(args.opponent,1);
});

defineScript('魔轟神グリムロ',{
  type:'monster',priority:1,activateFrom:['hand'],blocksIfNoDeckToHand:true, // S03-U05: ライオウ適用中は発動できない
  condition(ctx){if(ctx.zone!=='hand'){ctx.reason='手札から発動します';return false;}if(!API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&v380bIsFabled(x.card)}).length){ctx.reason='自分フィールドに魔轟神が必要です';return false;}if(!API.pileCards(ctx.player,'deck',x=>v380bIsFabled(x.card)&&x.card!==ctx.card&&x.db.n!=='魔轟神グリムロ').length){ctx.reason='デッキに他の魔轟神がいません';return false;}return true;},
  cost(ctx,done){const i=API.me(ctx).hand.indexOf(ctx.card);if(i<0){done(false);return;}API.sendHandToGrave(ctx.player,i,'魔轟神グリムロ（コスト）');done(true);},
  selectTargets(ctx,done){ done([]); },
  resolve(ctx){
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const pool=API.pileCards(ctx.player,'deck',x=>v380bIsFabled(x.card)&&x.db.n!=='魔轟神グリムロ');
    if(!pool.length)return;
    API.requestChoice({player:ctx.player,kind:'card',title:'魔轟神グリムロ：手札に加える魔轟神',
      candidates:pool,min:1,max:1,cancelable:false,
      resume:{handler:'s03u58.deck-search',args:{player:ctx.player,reason:'魔轟神グリムロ'}},
      meta:{scriptName:'魔轟神グリムロ'}});
  }
});

/* S03-U196: 「このカードが手札から墓地へ捨てられた時」 — any discard (a cost or the hand-size rule too: onDiscardAnyS03), only its own discard
   (before: discards by an effect only, read from a possibly stale discardInfo), forced (before: optional). */
function fabledSelfDiscardS03(ctx){ return ctx.zone==='grave' && ctx.eventName==='onDiscardAnyS03' && eventIsSelfS03(ctx); }
defineScript('魔轟神クルス',{
  type:'monster',priority:1,forced:true,activateFrom:['grave'],targets:true,blocksIfNoSpecialSummon:true,
  condition(ctx){if(!fabledSelfDiscardS03(ctx)){ctx.reason='手札から捨てられた時に発動します';return false;}if(!API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&x.db.k==='m'&&v380bIsFabled(x.card)&&(x.db.lv||99)<=4).length){ctx.reason='墓地にレベル4以下の「魔轟神」がいません';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('魔轟神クルス：特殊召喚するLv4以下の魔轟神',API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&x.db.k==='m'&&v380bIsFabled(x.card)&&(x.db.lv||99)<=4),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0],h=t&&t.card&&t.card.uid!=null?findCardByUid(t.card.uid):null;if(h&&h.zone==='grave'&&hasMonsterZoneSpace(ctx.player))API.specialSummon(ctx.player,'grave',h.index,'atk','魔轟神クルス');},afterResolve(){},
  passive:{onDiscardAnyS03(ctx){return fabledSelfDiscardS03(ctx);}}
});

defineScript('魔轟神獣ケルベラル',{
  type:'monster',priority:1,forced:true,activateFrom:['grave'],blocksIfNoSpecialSummon:true,
  condition(ctx){if(!fabledSelfDiscardS03(ctx)){ctx.reason='手札から捨てられた場合に発動します';return false;}return true;},
  resolve(ctx){const me=ctx.card&&ctx.card.uid!=null?findCardByUid(ctx.card.uid):null;if(me&&me.zone==='grave'&&hasMonsterZoneSpace(ctx.player))API.specialSummon(ctx.player,'grave',me.index,'atk','魔轟神獣ケルベラル');},afterResolve(){},
  passive:{onDiscardAnyS03(ctx){return fabledSelfDiscardS03(ctx);}}
});

defineScript('魔轟神レヴュアタン',{
  type:'synchro',priority:1,targets:true,
  condition(ctx){if(!['onDestroy','onBattleDestroy'].includes(ctx.eventName)||ctx.zone!=='grave'){ctx.reason='フィールドで破壊され墓地へ送られた時に発動します';return false;}return API.pileCards(ctx.player,'grave',x=>v380bIsFabled(x.card)).length>0;},
  selectTargets(ctx,done){v380SelectUpTo('魔轟神レヴュアタン：手札に加える魔轟神',API.pileCards(ctx.player,'grave',x=>v380bIsFabled(x.card)),3,done);},resolve(ctx){ctx.selectedTargets.forEach(t=>{const r=resolveTarget({card:t.card});if(r&&r.zone==='grave')API.returnToHand(r,'魔轟神レヴュアタン');});},afterResolve(){},/* S03-U146: a battle destruction raises onBattleDestroy AND onDestroy — listening to both offered it twice; onDestroy covers both */passive:{onDestroy(ctx){return ctx.zone==='grave'&&eventIsSelfS03(ctx);}}
});

defineScript('魔轟神レイジオン',{
  type:'synchro',priority:1,
  condition(ctx){const e=ctx.event||{};return ctx.eventName==='onSpecialSummon'&&ctx.zone==='mz'&&e.card===ctx.card&&e.kind==='synchro'&&API.me(ctx).hand.length<=1;},
  resolve(ctx){const n=Math.max(0,2-API.me(ctx).hand.length);if(n)API.draw(ctx.player,n);},afterResolve(){},passive:{onSpecialSummon(ctx){const e=ctx.event||{};return ctx.zone==='mz'&&e.card===ctx.card&&e.kind==='synchro'&&API.me(ctx).hand.length<=1;}}
});

/* Existing Dark World: switch their automatic trigger from generic GY-send to true effect-discard. */
['暗黒界の狩人 ブラウ','暗黒界の武神 ゴルド','暗黒界の尖兵 ベージ','暗黒界の術師 スノウ','暗黒界の龍神 グラファ'].forEach(n=>{
  const sc=CARD_SCRIPTS[n];if(!sc)return;sc.passive=sc.passive||{};delete sc.passive.onSendToGrave;sc.passive.onDiscard=(ctx)=>ctx.zone==='grave'&&!!darkWorldDiscard(ctx);
  if(n==='暗黒界の狩人 ブラウ'||n==='暗黒界の武神 ゴルド') sc.condition=(ctx)=>{if(ctx.zone!=='grave'||!darkWorldDiscard(ctx)){ctx.reason='カードの効果で手札から捨てられた時に発動します';return false;}if(n==='暗黒界の武神 ゴルド'&&API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}return true;};
});

/* -------------------- Nordic / Scrap / Gravekeeper utility -------------------- */
defineScript('極星獣ガルム',{
  type:'monster',priority:1,dsTiming:'after',targets:true,
  condition(ctx){const b=ctx.battle||{};if(ctx.eventName!=='onDamageStep'||ctx.step!=='after'){ctx.reason='ダメージ計算後に発動します';return false;}const foe=b.atkCard===ctx.card?b.defCard:(b.defCard===ctx.card?b.atkCard:null);return !!foe&&curLV(foe)<=4;},
  resolve(ctx){const b=ctx.battle||{},foe=b.atkCard===ctx.card?b.defCard:(b.defCard===ctx.card?b.atkCard:null),h=foe&&locateCard(foe);if(h)API.returnToHand(h,'極星獣ガルム');},afterResolve(){},passive:{onDamageStep(ctx){const b=ctx.battle||{},foe=b.atkCard===ctx.card?b.defCard:(b.defCard===ctx.card?b.atkCard:null);return ctx.zone==='mz'&&ctx.step==='after'&&!!foe&&curLV(foe)<=4;}}
});

defineScript('極星天ミーミル',{
  type:'monster',priority:1,activateFrom:['grave'],timing:['standby'],blocksIfNoSpecialSummon:true,
  condition(ctx){if(ctx.zone!=='grave'||gameState.phase!=='standby'||ctx.player!==gameState.activePlayer){ctx.reason='自分スタンバイフェイズに墓地で発動します';return false;}if(!API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&v380bIsNordic(x.card)}).length){ctx.reason='自分フィールドに極星が必要です';return false;}if(!API.pileCards(ctx.player,'hand',x=>x.db.k==='s').length){ctx.reason='墓地へ送る魔法カードがありません';return false;}return API.me(ctx).mz.length<ZONE_LIMITS.mz;},
  cost(ctx,done){API.selectCard('極星天ミーミル：墓地へ送る手札の魔法',API.pileCards(ctx.player,'hand',x=>x.db.k==='s'),t=>{const r=resolveTarget(t);if(!r){done(false);return;}API.sendHandToGrave(ctx.player,r.index,'極星天ミーミル（コスト）');done(true);});},resolve(ctx){const i=API.me(ctx).grave.indexOf(ctx.card);if(i>=0)API.specialSummon(ctx.player,'grave',i,'atk','極星天ミーミル');},afterResolve(){},passive:{onStandbyPhase(ctx){return ctx.zone==='grave'&&ctx.player===gameState.activePlayer;}}
});

/* S03-U191 (2011 text): 「このカードが召喚に成功したターン、自分は通常召喚に加えて1度だけ「極星」と名のついたモンスター1体を召喚する事ができる。
   フィールド上に表側表示で存在するこのカードが墓地へ送られた時、自分の墓地から「極星宝」と名のついたカード1枚を選択して手札に加える。」
   ① is not an activated effect: the NORMAL_SUMMON reducer grants it (grantExtraNormalOnSummonS03; before, an optional trigger that could be
   skipped or negated). ② is a forced trigger that targets, only when this card left the field face-up (before: optional, cancelable, and it
   also fired when discarded from the hand). */
defineScript('極星霊ドヴェルグ',{
  type:'monster',priority:1,forced:true,targets:true,activateFrom:['grave'],
  grantExtraNormalOnSummonS03:'v380NordicExtraNormal',
  condition(ctx){
    if(ctx.eventName!=='onSendToGrave'||ctx.zone!=='grave'||!dvergrLeftFaceUpS03(ctx)){ctx.reason='フィールドの表側表示から墓地へ送られた時に発動します';return false;}
    if(!dvergrRelicsS03(ctx).length){ctx.reason='墓地に「極星宝」がありません';return false;}
    return true;
  },
  selectTargets(ctx,done){API.selectCard('極星霊ドヴェルグ：手札に加える「極星宝」',dvergrRelicsS03(ctx),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0],h=t&&t.card&&t.card.uid!=null?findCardByUid(t.card.uid):null;if(h&&h.zone==='grave')API.returnToHand(h,'極星霊ドヴェルグ');else API.log('極星霊ドヴェルグ：対象が墓地にないため不発');},
  afterResolve(){},
  passive:{onSendToGrave(ctx){return ctx.zone==='grave'&&eventIsSelfS03(ctx)&&dvergrLeftFaceUpS03(ctx);}}
});
function dvergrLeftFaceUpS03(ctx){const g=ctx.card&&ctx.card.graveInfo;return !!(g&&['mz','sz','field'].indexOf(g.from)>=0&&g.face==='up'&&Number(g.turn)===Number(gameState.turn));}
function dvergrRelicsS03(ctx){return API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&v380bIsNordicRelic(x.card));}
/* S03-U62: resolve() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.dvergr-bounce',(answer,args)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  if(h&&h.zone==='grave')API.returnToHand(h,'極星霊ドヴェルグ');
});

/* S03-U196: ② 「特殊召喚に成功した時、…全て破壊する」 is forced (forcedForEventS03); ① stays optional */
defineScript('スクラップ・サーチャー',{
  type:'monster',priority:1,activateFrom:['grave'],blocksIfNoSpecialSummon:true,
  forcedForEventS03(eventName){ return eventName==='onSpecialSummon'; },
  condition(ctx){if(ctx.eventName==='onDestroy'){const e=ctx.event||{};return ctx.zone==='grave'&&e.card&&e.card!==ctx.card&&v380IsScrap(e.card)&&e.player===ctx.player&&API.me(ctx).mz.length<ZONE_LIMITS.mz;}if(ctx.eventName==='onSpecialSummon'){return ctx.zone==='mz'&&(ctx.event||{}).card===ctx.card;}ctx.reason='他のスクラップ破壊時または自身の特殊召喚成功時に発動します';return false;},
  resolve(ctx){if(ctx.eventName==='onDestroy'){const i=API.me(ctx).grave.indexOf(ctx.card);if(i>=0)API.specialSummon(ctx.player,'grave',i,'atk','スクラップ・サーチャー');return;}API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&!v380IsScrap(x.card)}).slice().reverse().forEach(t=>API.destroy(t,'スクラップ・サーチャー'));},afterResolve(){},passive:{onDestroy(ctx){const e=ctx.event||{};return ctx.zone==='grave'&&e.card&&e.card!==ctx.card&&v380IsScrap(e.card)&&e.player===ctx.player;},onSpecialSummon(ctx){return ctx.zone==='mz'&&(ctx.event||{}).card===ctx.card;}}
});

/* S03-U194: 「「墓守の」という名のついたモンスターカード」 — monsters named 墓守の… (before: any card containing 墓守) */
defineScript('降霊の儀式',{
  auditNote:'ネクロバレーの影響を受けないためAPIの墓地ロックを迂回して正規に蘇生',type:'trap',priority:2,targets:true,blocksIfNoSpecialSummon:true,
  condition(ctx){if(!API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&String(x.db.n||'').indexOf('墓守の')===0).length){ctx.reason='墓地に墓守がいません';return false;}return API.me(ctx).mz.length<ZONE_LIMITS.mz;},
  selectTargets(ctx,done){API.selectCard('降霊の儀式：特殊召喚する墓守',API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&String(x.db.n||'').indexOf('墓守の')===0),t=>done([t]));},
  resolve(ctx){const t=resolveTarget(ctx.selectedTargets[0]);if(t&&t.zone==='grave')act({type:'FX_SPECIAL_SUMMON',player:ctx.player,from:'grave',fromIndex:t.index,pos:'atk',reason:'降霊の儀式'});}
});

defineScript('トラップ・イーター',{
  type:'monster',priority:1,cannotNormalSummon:true,
  summonProcedure:{from:'hand',positions:['atk','def'],condition(ctx){if(!API.fieldCards({zone:'sz',player:ctx.opponent,filter:x=>x.card.face==='up'&&x.db.k==='t'}).length){ctx.reason='相手フィールドに表側表示の罠カードが必要です';return false;}return API.me(ctx).mz.length<ZONE_LIMITS.mz;},cost(ctx,done){API.selectCard('トラップ・イーター：墓地へ送る相手の表側罠',API.fieldCards({zone:'sz',player:ctx.opponent,filter:x=>x.card.face==='up'&&x.db.k==='t'}),t=>{const r=resolveTarget(t);if(!r){done(false);return;}API.sendToGrave(r,'トラップ・イーター（特殊召喚手順）');done(true);});}}
});
registerDestroyAfterS03('s03u294.krais',a=>{const draw=[0,0],got=API.destroyedSinceS03(a.mark,(a.items||[]).map(x=>x.uid));(a.items||[]).forEach(x=>{if(got.indexOf(Number(x.uid))>=0)draw[x.p]++;});
  const order=[gameState.activePlayer,1-gameState.activePlayer].filter(p=>draw[p]>0).map(p=>({p,n:draw[p]}));u189KraisDrawAsk(order);});
