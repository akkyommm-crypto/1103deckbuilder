/* READY 25 — batch 3 / 宣言・継続罠・追加攻撃 5枚。
   engine は触らない。既存の v11 宣言 / v20 deckTop / v14 StatModifier /
   onStandbyPhase・onAttackDeclare・onDestroy・onPhaseChange と
   grantAdditionalAttack（attackLimit を canDeclareAttackV48 が読む）だけで書く。
   grantMultiAttack は使わない（読み手がいないため）。
   カード登録の第1引数は必ず文字列リテラル。 */

function raAt(card){ return locateCardAnyV4(card); }
function raFaceUpMz(ctx){
  const hh=raAt(ctx.card);
  return !!hh && hh.zone==='mz' && hh.card.face==='up';
}

/* ===== 21. リチュア・ディバイナー
   「1ターンに1度、カード名を1つ宣言して発動する事ができる。
     自分のデッキの一番上のカードをめくり、それが宣言したカードだった場合手札に加える。
     違った場合、自分のデッキの一番上に戻す。」
   宣言は v11、めくりは v20 reveal（自分だけが見る）。 ===== */
defineScript('リチュア・ディバイナー',{type:'monster',priority:1,timing:['mainPhase'],
  condition(ctx){
    if(!raFaceUpMz(ctx)){ ctx.reason='表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(ctx.card.raDivinerTurn===gameState.turn){ ctx.reason='このターンは既に使用しています'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason='デッキがありません'; return false; }
    return true;},
  activationV11(ctx,d){
    const me=raAt(ctx.card);
    if(me) API.setCardFlag(me,'raDivinerTurn',gameState.turn,'リチュア・ディバイナー');
    API.declare(ctx,'cardName',
      {title:'リチュア・ディバイナー：カード名を宣言',values:p11cNames(false),
       activation:d,cancelable:false},
      {handler:'p11cards.declare-commit',args:{}});},
  resolve(ctx){
    const top=API.deckTop(ctx.player,1);
    if(!top.length) return;
    const hh=top[0];
    ensureCardUid(gameState,hh.card);
    /* 宣言者だけが確認する。相手へは公開しない。 */
    API.reveal({player:ctx.player,audience:'self',cards:[hh],
      label:'リチュア・ディバイナー',until:'resolution'});
    const ref=p11cDeclaredDb(ctx);
    if(ref && sameCanonicalCardV4(hh.db||dbOf(hh.card), ref))
      API.searchDeck(ctx.player,hh.index,'リチュア・ディバイナー');
    else
      API.log('リチュア・ディバイナー：宣言と違ったのでデッキの一番上に戻す');},
  afterResolve(){}});

/* ===== 22. 罅割れゆく斧（永続罠）
   「フィールドの表側表示モンスター1体を対象としてこのカードを発動できる。
     ①:このカードが魔法&罠ゾーンに存在する限り、対象のモンスターの攻撃力は
       自分スタンバイフェイズ毎に500ダウンする。
       そのモンスターが破壊された時にこのカードは破壊される。」
   減衰量は自分側に保持したカウンタで、修整は継続効果として出す。
   このカードが場を離れれば継続ソースごと消えるので stale modifier は残らない。 ===== */
function raAxeTargets(){
  return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'});
}
defineUnifiedCardV4('罅割れゆく斧',[{
  key:'attach-decay', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE, targetSide:'both', speed:2, events:['activate'],
  condition(ctx){
    if(!raAxeTargets().length){ ctx.reason='表側表示モンスターがいません'; return false; }
    return true;},
  target(ctx,done){
    API.selectCard('罅割れゆく斧：対象にするモンスター',raAxeTargets(),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const hh=t&&resolveTarget(t);
    if(!hh||hh.zone!=='mz') return;
    const me=raAt(ctx.card);
    if(!me) return;
    API.setCardFlag(me,'raAxeUid',ensureCardUid(gameState,hh.card),'罅割れゆく斧');
    API.setCardFlag(me,'raAxeSteps',0,'罅割れゆく斧');},
  afterResolve(){}
},{
  key:'own-standby-decay', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE,
  speed:1, events:['onStandbyPhase'],
  condition(ctx){
    const hh=raAt(ctx.card);
    if(!hh||hh.zone!=='sz'||hh.card.face!=='up') return false;
    if(gameState.activePlayer!==ctx.player) return false;
    if(ctx.card.raAxeUid==null) return false;
    return !!findCardByUid(ctx.card.raAxeUid);},
  operation(ctx){
    const me=raAt(ctx.card);
    if(me) API.setCardFlag(me,'raAxeSteps',(Number(ctx.card.raAxeSteps)||0)+1,'罅割れゆく斧');},
  afterResolve(){}
},{
  key:'target-destroyed-self-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE,
  speed:1, events:['onDestroy'],
  condition(ctx){
    const hh=raAt(ctx.card);
    if(!hh||hh.zone!=='sz') return false;
    if(ctx.card.raAxeUid==null) return false;
    const e=ctx.event||{};
    const goneUid=(e.uid!=null)?e.uid:(e.card&&e.card.uid);
    return goneUid===ctx.card.raAxeUid;},
  operation(ctx){
    const me=raAt(ctx.card);
    if(me) API.destroy(me,'罅割れゆく斧');},
  afterResolve(){}
}],{type:'trap', priority:2, keep:true, targets:true, forced:true,
    continuous:{scope:'allMonsters', from:['sz'],
      apply(card,self){
        if(!self||self.face!=='up') return null;
        if(self.raAxeUid==null||card.uid==null) return null;
        if(card.uid!==self.raAxeUid) return null;
        const n=Number(self.raAxeSteps)||0;
        return n>0 ? {atk:-500*n} : null;}},
    passive:{
      onStandbyPhase(ctx){ return ctx.zone==='sz'&&ctx.card.face==='up'
        &&gameState.activePlayer===ctx.player&&ctx.card.raAxeUid!=null; },
      onDestroy(ctx){
        const e=ctx.event||{};
        const goneUid=(e.uid!=null)?e.uid:(e.card&&e.card.uid);
        return ctx.zone==='sz'&&ctx.card.raAxeUid!=null&&goneUid===ctx.card.raAxeUid; }}});

/* ===== 23. 鬼神の連撃
   「自分フィールド上に表側表示で存在するエクシーズモンスター1体を選択し、
     そのエクシーズ素材を全て取り除いて発動する。
     このターン、選択したモンスターは1度のバトルフェイズ中に2回攻撃する事ができる。」 ===== */
function raOwnXyzWithMaterial(p){
  return API.fieldCards({player:p,zone:'mz',
    filter:x=>x.card.face==='up'&&Array.isArray(x.card.xyz)&&x.card.xyz.length>0});
}
defineUnifiedCardV4('鬼神の連撃',[{
  key:'detach-all-then-double-attack', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(!raOwnXyzWithMaterial(ctx.player).length){
      ctx.reason='エクシーズ素材を持つ自分のエクシーズモンスターがいません'; return false; }
    return true;},
  cost(ctx,done){
    const pool=raOwnXyzWithMaterial(ctx.player);
    if(!pool.length){ done(false); return; }
    API.selectCard('鬼神の連撃：素材を全て取り除くエクシーズ',pool,t=>{
      const hh=resolveTarget(t);
      if(!hh){ done(false); return; }
      const me=raAt(ctx.card);
      if(me) API.setCardFlag(me,'raOniUid',ensureCardUid(gameState,hh.card),'鬼神の連撃');
      /* 「全て取り除く」。1つずつ取り除く既存Actionを枚数分回す。 */
      let guard=0;
      while(Array.isArray(hh.card.xyz)&&hh.card.xyz.length&&guard++<16){
        const now=findCardByUid(hh.card.uid);
        if(!now||now.zone!=='mz') break;
        API.detachMaterial(now.p,now.index,'鬼神の連撃（コスト）');
      }
      done(true);});},
  operation(ctx){
    const uid=ctx.card&&ctx.card.raOniUid;
    const hh=(uid!=null)?findCardByUid(uid):null;
    if(!hh||hh.p!==ctx.player||hh.zone!=='mz'||hh.card.face!=='up') return;
    API.grantAdditionalAttack(hh,1,'鬼神の連撃',false);},
  afterResolve(){}
}],{type:'spell', priority:1, targets:true, timing:['mainPhase']});

/* ===== 24. インフェルニティ・フォース
   「自分の手札が0枚の場合、「インフェルニティ」と名のついたモンスターが
     攻撃対象に選択された時に発動する事ができる。
     攻撃モンスター1体を破壊し、自分の墓地に存在する
     「インフェルニティ」と名のついたモンスター1体を選択して特殊召喚する。」 ===== */
function raInfernityTargeted(ctx){
  if(gameState.players[ctx.player].hand.length!==0) return false;
  const a=gameState.pendingAttack;
  if(!a||a.targetUid==null) return false;
  const t=findCardByUid(a.targetUid);
  if(!t||t.zone!=='mz') return false;
  return isSetCardV4(t.db||dbOf(t.card), SETCODE.INFERNITY);
}
function raGraveInfernity(p){
  return API.pileCards(p,'grave',x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.INFERNITY));
}
API.registerChoiceHandler('ra.infernity-revive',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  if(!picked||!hasMonsterZoneSpace(args.player)) return;
  const hh=locateCardAnyV4(picked.card);
  if(hh&&hh.p===args.player&&hh.zone==='grave')
    API.specialSummon(args.player,'grave',hh.index,'atk',args.reason);
});
defineUnifiedCardV4('インフェルニティ・フォース',[{
  key:'destroy-attacker-revive-infernity', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  speed:2, events:['onAttackDeclare'],
  condition(ctx){ return raInfernityTargeted(ctx); },
  operation(ctx){
    const a=gameState.pendingAttack;
    if(a&&a.attackerUid!=null){
      const atk=findCardByUid(a.attackerUid);
      if(atk&&atk.zone==='mz') API.destroy(atk,'インフェルニティ・フォース');
    }
    const pool=raGraveInfernity(ctx.player);
    if(!pool.length||!hasMonsterZoneSpace(ctx.player)) return;
    v49P1Open(ctx,{kind:'card',title:'インフェルニティ・フォース：特殊召喚する「インフェルニティ」',
      candidates:pool,min:1,max:1},'ra.infernity-revive',
      {reason:'インフェルニティ・フォース'},false);},
  afterResolve(){}
}],{type:'trap', priority:2, includesSpecialSummon:true,
    passive:{onAttackDeclare:raInfernityTargeted}});

/* ===== 25. D・ラジカッセン
   「このカードはこのカードの表示形式によって以下の効果を得る。
     ●攻撃表示:このカードは1度のバトルフェイズ中に2回攻撃する事ができる。
     ●守備表示:1ターンに1度、自分フィールド上の「D」と名のついたモンスターが
       攻撃対象に選択された時、その攻撃を無効にできる。」
   2回攻撃は attackLimit を上げる grantAdditionalAttack で表す。 ===== */
function raRadioAtk(ctx){
  const hh=raAt(ctx.card);
  return !!hh && hh.zone==='mz' && hh.card.face==='up' && hh.card.pos==='atk';
}
function raRadioDefGuard(ctx){
  const hh=raAt(ctx.card);
  if(!hh||hh.zone!=='mz'||hh.card.face!=='up'||hh.card.pos!=='def') return false;
  if(ctx.card.raRadioTurn===gameState.turn) return false;
  const a=gameState.pendingAttack;
  if(!a||a.targetUid==null) return false;
  const t=findCardByUid(a.targetUid);
  if(!t||t.p!==ctx.player||t.zone!=='mz') return false;
  return isCardInGroupV4(t.db||dbOf(t.card), GROUP.D_MORPHTRONIC);
}
defineUnifiedCardV4('D・ラジカッセン',[{
  key:'atk-position-double-attack', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onPhaseChange'],
  condition(ctx){
    if(gameState.phase!=='battle'||gameState.activePlayer!==ctx.player) return false;
    if(!raRadioAtk(ctx)) return false;
    return !(ctx.card.attackLimitTurn===gameState.turn&&Number(ctx.card.attackLimit)>=2);},
  operation(ctx){
    const hh=raAt(ctx.card);
    if(hh) API.grantAdditionalAttack(hh,1,'D・ラジカッセン',false);},
  afterResolve(){}
},{
  key:'def-position-negate-attack', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:2, events:['onAttackDeclare'],
  condition(ctx){ return raRadioDefGuard(ctx); },
  operation(ctx){
    const me=raAt(ctx.card);
    if(me) API.setCardFlag(me,'raRadioTurn',gameState.turn,'D・ラジカッセン');
    API.negateAttack('D・ラジカッセン');},
  afterResolve(){}
}],{type:'monster', priority:1,
    passive:{
      onPhaseChange(ctx){
        return gameState.phase==='battle'&&gameState.activePlayer===ctx.player&&raRadioAtk(ctx);},
      onAttackDeclare:raRadioDefGuard}});
