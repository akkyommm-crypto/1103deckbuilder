/* Battle recovery batch — System v6 Battle primitive で解消したカード。
   使う共通APIは onBattleDamage / onDirectBattleDamage / onBattlePhaseEnd /
   grantDirectAttack / grantMultiAttack / lockAttackTarget / redirectAttack /
   endBattlePhase / repeatBattlePhase / battleContext / attackersAgainst /
   battledThisPhase / battleDestroyedThisPhase と、
   既存の continuous.cannotAttack / battleDamage / grantsDirectAttack のみ。
   カード名で分岐する処理は書かない。 */

/* このカード自身が与えた戦闘ダメージか */
function v6SelfDealt(ctx){
  const e=ctx.event; return !!(e&&ctx.card&&e.attackerUid===ctx.card.uid);
}
/* 自分のモンスターが相手に与えた戦闘ダメージか */
function v6DealtByMe(ctx){
  const e=ctx.event; return !!(e&&e.dealtBy===ctx.player&&e.player===ctx.opponent);
}
/* 攻撃したモンスターの実体 */
function v6Attacker(ctx){
  const e=ctx.event; const h=(e&&e.attackerUid!=null)?findCardByUid(e.attackerUid):null;
  return h?h:null;
}

/* ---- 直接攻撃で戦闘ダメージを与えた時に誘発する自分のモンスター ---------- */
function v6DefineDirectDamageMonster(name,opts){
  defineUnifiedCardV4(name,[{
    key:'direct-damage',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDirectBattleDamage'],
    condition(ctx){return v6SelfDealt(ctx)&&(!opts.extra||opts.extra(ctx));},
    operation(ctx){opts.run(ctx);},afterResolve(){}
  }],Object.assign({type:'monster',priority:1,forced:!!opts.forced,
    passive:{onDirectBattleDamage:ctx=>v6SelfDealt(ctx)&&(!opts.extra||opts.extra(ctx))}},opts.meta||{}));
}

/* 自分に直接攻撃を許可する（自分自身の宣言。既存 canDirectAttack を使う） */
const V6_SELF_DIRECT={canDirectAttack:true};

defineUnifiedCardV4('BF－鉄鎖のフェーン',[{
  key:'direct-damage-to-defense',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDirectBattleDamage'],
  condition(ctx){return v6SelfDealt(ctx)&&API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'&&x.card.pos==='atk'}).length>0;},
  target(ctx,done){API.selectCard('BF－鉄鎖のフェーン：守備表示にするモンスター',
    API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'&&x.card.pos==='atk'}),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(t)act({type:'FX_SET_STATE',player:t.p,zone:'mz',index:t.index,pos:'def',reason:'BF－鉄鎖のフェーン'});},
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,targets:true,canDirectAttack:true,
    passive:{onDirectBattleDamage:ctx=>v6SelfDealt(ctx)}});

v6DefineDirectDamageMonster('エレキンギョ',{forced:true,run(ctx){
  const H=API.foe(ctx).hand; if(!H.length) return;
  API.selectCard('エレキンギョ：相手が捨てる手札',API.pileCards(ctx.opponent,'hand'),t=>{
    const h=resolveTarget(t); if(h)API.discard(ctx.opponent,h.index,'エレキンギョ',{byEffect:true,byPlayer:ctx.player});
  });
}});
v6DefineDirectDamageMonster('エレキングコブラ',{meta:{canDirectAttack:true},run(ctx){
  const pool=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.WATT));
  if(!pool.length) return;
  API.selectCard('エレキングコブラ：手札に加える「エレキ」',pool,t=>{
    const h=resolveTarget(t); if(h&&h.zone==='deck')API.deckToHand(ctx.player,h.index,'エレキングコブラ');API.shuffle(ctx.player);});
}});
v6DefineDirectDamageMonster('ドリル・バーニカル',{forced:true,meta:{canDirectAttack:true},run(ctx){
  const h=locateCardAnyV4(ctx.card); if(h)API.modAtk(h,1000,0,'permanent','ドリル・バーニカル');
}});
v6DefineDirectDamageMonster('逆巻く炎の精霊',{forced:true,meta:{canDirectAttack:true},run(ctx){
  const h=locateCardAnyV4(ctx.card); if(h)API.modAtk(h,1000,0,'permanent','逆巻く炎の精霊');
}});
v6DefineDirectDamageMonster('プラズマ・ボール',{forced:true,meta:{canDirectAttack:true},run(ctx){
  const h=locateCardAnyV4(ctx.card); if(h)API.destroy(h,'プラズマ・ボール');
}});
v6DefineDirectDamageMonster('記憶破壊者',{forced:true,run(ctx){
  API.damageLP(ctx.opponent,(API.foe(ctx).ex||[]).length*100);
}});

/* ---- 戦闘ダメージ全般で誘発するカード ---------------------------------- */
defineUnifiedCardV4('仮面魔道士',[{
  key:'battle-damage-draw',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onBattleDamage'],
  condition(ctx){return v6SelfDealt(ctx)&&ctx.event.player===ctx.opponent&&API.me(ctx).deck.length>0;},
  operation(ctx){API.draw(ctx.player,1);},afterResolve(){}
}],{type:'monster',priority:1,forced:true,
    passive:{onBattleDamage:ctx=>v6SelfDealt(ctx)&&ctx.event.player===ctx.opponent}});

defineUnifiedCardV4('吸血コアラ',[{
  key:'battle-damage-heal',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onBattleDamage'],
  /* テキストは「モンスターとの戦闘によって」なので直接攻撃は含まない。 */
  condition(ctx){return v6SelfDealt(ctx)&&ctx.event.direct===false&&ctx.event.player===ctx.opponent;},
  operation(ctx){API.recoverLP(ctx.player,ctx.event.amount||0);},afterResolve(){}
}],{type:'monster',priority:1,forced:true,
    passive:{onBattleDamage:ctx=>v6SelfDealt(ctx)&&ctx.event.direct===false&&ctx.event.player===ctx.opponent}});

defineUnifiedCardV4('大盤振舞侍',[{
  key:'battle-damage-refill',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onBattleDamage'],
  condition(ctx){return v6SelfDealt(ctx)&&ctx.event.player===ctx.opponent;},
  operation(ctx){const n=7-API.foe(ctx).hand.length; for(let i=0;i<n&&API.foe(ctx).deck.length;i++)API.draw(ctx.opponent,1);},
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,
    passive:{onBattleDamage:ctx=>v6SelfDealt(ctx)&&ctx.event.player===ctx.opponent}});

/* 穿孔虫 は「デッキの一番上に置く」atomic deck operation が必要で、
   Battle primitive だけでは足りない。ENGINE_GAP のまま残す。 */

defineUnifiedCardV4('エレキュア',[{
  key:'thunder-battle-damage-heal',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,events:['onBattleDamage'],
  condition(ctx){const a=v6Attacker(ctx);
    return v6DealtByMe(ctx)&&!!a&&a.p===ctx.player&&dbOf(a.card).ra==='雷';},
  operation(ctx){API.recoverLP(ctx.player,ctx.event.amount||0);},afterResolve(){}
}],{type:'spell',priority:1,forced:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onBattleDamage:ctx=>{const a=v6Attacker(ctx);
      return v6DealtByMe(ctx)&&!!a&&a.p===ctx.player&&dbOf(a.card).ra==='雷';}}});

defineUnifiedCardV4('ポイズン・ファング',[{
  key:'beast-direct-damage-burn',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,events:['onDirectBattleDamage'],
  condition(ctx){const a=v6Attacker(ctx);
    return !!a&&a.p===ctx.player&&dbOf(a.card).ra==='獣'&&ctx.event.player===ctx.opponent;},
  operation(ctx){API.damageLP(ctx.opponent,500);},afterResolve(){}
}],{type:'spell',priority:1,forced:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onDirectBattleDamage:ctx=>{const a=v6Attacker(ctx);
      return !!a&&a.p===ctx.player&&dbOf(a.card).ra==='獣'&&ctx.event.player===ctx.opponent;}}});

defineUnifiedCardV4('セベクの祝福',[{
  key:'direct-damage-heal',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onDirectBattleDamage'],
  condition(ctx){return ctx.event&&ctx.event.dealtBy===ctx.player&&ctx.event.player===ctx.opponent;},
  operation(ctx){API.recoverLP(ctx.player,ctx.event.amount||0);},afterResolve(){}
}],{type:'spell',priority:2,
    passive:{onDirectBattleDamage:ctx=>ctx.event&&ctx.event.dealtBy===ctx.player&&ctx.event.player===ctx.opponent}});

defineUnifiedCardV4('デスカウンター',[{
  key:'destroy-direct-attacker',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,events:['onDirectBattleDamage'],
  condition(ctx){return !!v6Attacker(ctx);},
  operation(ctx){const a=v6Attacker(ctx); if(a)API.destroy(a,'デスカウンター');},afterResolve(){}
}],{type:'trap',priority:1,forced:true,destroysFieldV46:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onDirectBattleDamage:ctx=>!!v6Attacker(ctx)}});

defineUnifiedCardV4('ダメージ・コンデンサー',[{
  key:'damage-condenser',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onBattleDamage'],
  condition(ctx){return ctx.event&&ctx.event.player===ctx.player&&API.me(ctx).hand.length>0
    &&API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&(x.db.atk||0)<=(ctx.event.amount||0)).length>0
    &&hasMonsterZoneSpace(ctx.player);},
  cost(ctx,done){API.selectCard('ダメージ・コンデンサー：捨てる手札',API.pileCards(ctx.player,'hand'),t=>{
    const h=resolveTarget(t); if(h)API.discard(ctx.player,h.index,'ダメージ・コンデンサー（コスト）',{byEffect:false});
    done(!!h);});},
  operation(ctx){
    const cap=ctx.event.amount||0;
    const pool=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&(x.db.atk||0)<=cap);
    if(!pool.length) return;
    API.requestChoice({player:ctx.player,kind:'card',title:'ダメージ・コンデンサー：特殊召喚するモンスター',
      candidates:pool,min:1,max:1,cancelable:true,
      resume:{handler:'s03u62.damage-condenser-summon',args:{player:ctx.player}},
      meta:{scriptName:'ダメージ・コンデンサー'}});
  },afterResolve(){}
}],{type:'trap',priority:2,includesSpecialSummon:true,
    passive:{onBattleDamage:ctx=>ctx.event&&ctx.event.player===ctx.player}});
/* S03-U62: operation() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.damage-condenser-summon',(answer,args)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  if(!h)return;
  if(h.zone==='deck')API.specialSummon(args.player,'deck',h.index,'atk','ダメージ・コンデンサー');
  API.shuffle(args.player);
});

/* ---- 直接攻撃の許可を他のモンスターへ与えるカード ------------------------ */
function v6DefineDirectGrantSpell(name,opts){
  defineUnifiedCardV4(name,[{
    key:'grant-direct-attack',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:opts.speed||1,events:['activate'],
    condition(ctx){return opts.pool(ctx).length>0&&(!opts.extraCond||opts.extraCond(ctx));},
    cost:opts.cost,
    target(ctx,done){
      if(opts.all){done([]);return;}
      API.selectCard(name+'：直接攻撃できるようにするモンスター',opts.pool(ctx),t=>done([t]));},
    operation(ctx){
      if(opts.all){ opts.pool(ctx).forEach(t=>API.grantDirectAttack(t)); return; }
      const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
      if(t){API.grantDirectAttack(t); if(opts.after)opts.after(ctx,t);}
    },afterResolve(){}
  }],{type:'spell',priority:opts.speed===2?2:1,targets:!opts.all});
}
const v6OwnFaceUp=(ctx,f)=>API.fieldCards({player:ctx.player,zone:'mz',
  filter:x=>x.card.face==='up'&&x.db.k==='m'&&(!f||f(x))});

v6DefineDirectGrantSpell('エレキー',{all:true,
  pool:ctx=>v6OwnFaceUp(ctx,x=>isCardInGroupV4(x.db,GROUP.WATT))});
v6DefineDirectGrantSpell('威圧する魔眼',{
  pool:ctx=>v6OwnFaceUp(ctx,x=>x.db.ra==='アンデット'&&(x.db.atk||0)<=2000)});
v6DefineDirectGrantSpell('財宝への隠し通路',{
  pool:ctx=>v6OwnFaceUp(ctx,x=>(x.db.atk||0)<=1000)});
v6DefineDirectGrantSpell('ディスカバード・アタック',{
  pool:ctx=>v6OwnFaceUp(ctx,x=>sameCanonicalCardV4(x.db,dbOf({id:findCardIndex('ジェノサイドキングデーモン')}))),
  extraCond:ctx=>v6OwnFaceUp(ctx,x=>String(x.db.n||'').indexOf('デーモン')>=0).length>0,
  cost(ctx,done){
    const pool=v6OwnFaceUp(ctx,x=>String(x.db.n||'').indexOf('デーモン')>=0);
    if(!pool.length){done(false);return;}
    API.selectCard('ディスカバード・アタック：リリースする「デーモン」',pool,t=>{
      const h=resolveTarget(t); if(h)API.sendToGrave(h,'ディスカバード・アタック（リリース）'); done(!!h);});}});

defineUnifiedCardV4('ウィルスメール',[{
  key:'grant-direct-attack-then-grave',type:EFFECT_TYPE.IGNITION,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return v6OwnFaceUp(ctx,x=>(x.db.lv||99)<=4).length>0;},
  target(ctx,done){API.selectCard('ウィルスメール：直接攻撃できるようにするモンスター',
    v6OwnFaceUp(ctx,x=>(x.db.lv||99)<=4),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(!t) return;
    API.grantDirectAttack(t);
    /* バトルフェイズ終了時に墓地へ送るため、対象をこのカード上に記録する。 */
    const self=locateCardAnyV4(ctx.card);
    if(self&&t.card)API.setCardFlag(self,'v6VirusMailUid',ensureCardUid(gameState,t.card),'ウィルスメール');
  },afterResolve(){}
},{
  key:'send-to-grave-at-bp-end',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,events:['onBattlePhaseEnd'],
  condition(ctx){const u=ctx.card&&ctx.card.v6VirusMailUid;
    return u!=null&&!!findCardByUid(u);},
  operation(ctx){
    const self=locateCardAnyV4(ctx.card);
    const u=ctx.card&&ctx.card.v6VirusMailUid;
    const h=(u!=null)?findCardByUid(u):null;
    if(h&&h.zone==='mz')API.sendToGrave(h,'ウィルスメール');
    if(self)API.setCardFlag(self,'v6VirusMailUid',null,'ウィルスメール');
  },afterResolve(){}
}],{type:'spell',priority:1,targets:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onBattlePhaseEnd:ctx=>!!(ctx.card&&ctx.card.v6VirusMailUid!=null)}});

/* 装備カードは「装備されている間ずっと」なので継続効果で許可する */
function v6DefineDirectGrantEquip(name,filter,atk,def){
  defineUnifiedCardV4(name,[{
    key:'equip',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetRange:LOCATION.MZONE,targetSide:'both',
    speed:1,events:['activate'],
    condition(){return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&filter(x)}).length>0;},
    target(ctx,done){API.selectCard(name+'：装備するモンスター',
      API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&filter(x)}),t=>done([t]));},
    operation(ctx){const s=locateCardAnyV4(ctx.card),t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
      if(s&&t)API.equipSpell(s,t,name);},afterResolve(){}
  }],{type:'spell',priority:1,targets:true,
    continuous:{scope:'allMonsters',from:['sz'],
      apply(card,self){return (self.equipTo&&self.equipTo.uid===card.uid)?{atk:atk||0,def:def||0}:null;},
      grantsDirectAttack(card,self){return !!(self.equipTo&&self.equipTo.uid===card.uid);}}});
}
v6DefineDirectGrantEquip('光学迷彩アーマー',x=>(x.db.lv||99)===1,0,0);
v6DefineDirectGrantEquip('流星の弓－シール',()=>true,-1000,0);

/* ---- 攻撃対象の変更・固定 ---------------------------------------------- */
function v6DefineRedirectToDirect(name,meta){
  defineUnifiedCardV4(name,[{
    key:'redirect-to-direct',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onAttackDeclare'],
    condition(ctx){const b=API.battleContext();
      return !!b&&b.attackerOwner===ctx.opponent&&b.direct===false&&(!meta||!meta.extra||meta.extra(ctx,b));},
    operation(){API.redirectAttack({toDirect:true});},afterResolve(){}
  }],Object.assign({type:'trap',priority:2,
    passive:{onAttackDeclare:ctx=>{const b=API.battleContext();
      return !!b&&b.attackerOwner===ctx.opponent&&b.direct===false&&(!meta||!meta.extra||meta.extra(ctx,b));}}},
    (meta&&meta.meta)||{}));
}
v6DefineRedirectToDirect('アストラルバリア',{meta:{continuous:{scope:'self',from:['sz'],apply(){return null;}}}});
v6DefineRedirectToDirect('トゥーン・ディフェンス',{
  extra:(ctx,b)=>{const h=(b.defenderUid!=null)?findCardByUid(b.defenderUid):null;
    return !!h&&h.p===ctx.player&&(dbOf(h.card).lv||99)<=4&&String(dbOf(h.card).n||'').indexOf('トゥーン')>=0;},
  meta:{continuous:{scope:'self',from:['sz'],apply(){return null;}}}});

defineUnifiedCardV4('絶体絶命',[{
  key:'all-attacks-direct',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onAttackDeclare'],
  condition(ctx){const b=API.battleContext();
    return gameState.activePlayer===ctx.opponent&&!!b&&b.attackerOwner===ctx.opponent&&b.direct===false;},
  operation(){API.redirectAttack({toDirect:true});},afterResolve(){}
}],{type:'trap',priority:2,
    passive:{onAttackDeclare:ctx=>{const b=API.battleContext();
      return gameState.activePlayer===ctx.opponent&&!!b&&b.attackerOwner===ctx.opponent&&b.direct===false;}}});

defineUnifiedCardV4('地縛霊の誘い',[{
  key:'reselect-attack-target',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onAttackDeclare'],
  condition(ctx){const b=API.battleContext();
    return !!b&&b.attackerOwner===ctx.opponent
      &&API.fieldCards({player:ctx.player,zone:'mz'}).length>0;},
  operation(ctx){
    const pool=API.fieldCards({player:ctx.player,zone:'mz'});
    if(!pool.length) return;
    API.requestChoice({player:ctx.player,kind:'card',title:'地縛霊の誘い：攻撃対象を選び直す',
      candidates:pool,min:1,max:1,cancelable:true,
      resume:{handler:'s03u62.jibakurei-redirect',args:{}},
      meta:{scriptName:'地縛霊の誘い'}});
  },afterResolve(){}
}],{type:'trap',priority:2});
/* S03-U62: operation() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.jibakurei-redirect',(answer)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  if(h&&h.card)API.redirectAttack({targetUid:ensureCardUid(gameState,h.card)});
});

defineUnifiedCardV4('ディフェンド・スライム',[{
  key:'redirect-to-revival-slime',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onAttackDeclare'],
  condition(ctx){const b=API.battleContext();
    return !!b&&b.attackerOwner===ctx.opponent&&b.direct===false
      &&v6OwnFaceUp(ctx,x=>sameCanonicalCardV4(x.db,dbOf({id:findCardIndex('リバイバルスライム')}))).length>0;},
  operation(ctx){
    const pool=v6OwnFaceUp(ctx,x=>sameCanonicalCardV4(x.db,dbOf({id:findCardIndex('リバイバルスライム')})));
    if(!pool.length) return;
    const h=resolveTarget(pool[0]);
    if(h&&h.card)API.redirectAttack({targetUid:ensureCardUid(gameState,h.card)});
  },afterResolve(){}
}],{type:'trap',priority:2,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});

defineUnifiedCardV4('立ちはだかる強敵',[{
  key:'lock-attack-target',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onAttackDeclare'],
  condition(ctx){const b=API.battleContext();
    return !!b&&b.attackerOwner===ctx.opponent&&v6OwnFaceUp(ctx).length>0;},
  target(ctx,done){API.selectCard('立ちはだかる強敵：攻撃対象に固定するモンスター',v6OwnFaceUp(ctx),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(t){API.lockAttackTarget(t);
      if(t.card)API.redirectAttack({targetUid:ensureCardUid(gameState,t.card)});}},
  afterResolve(){}
}],{type:'trap',priority:2,targets:true});

/* ---- 戦闘ダメージの受け手の差し替え ------------------------------------ */
defineUnifiedCardV4('ディメンション・ウォール',[{
  key:'redirect-battle-damage',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onAttackDeclare'],
  condition(ctx){const b=API.battleContext();return !!b&&b.attackerOwner===ctx.opponent;},
  operation(ctx){const self=locateCardAnyV4(ctx.card);
    if(self)API.setCardFlag(self,'v6WallTurn',gameState.turn,'ディメンション・ウォール');},
  afterResolve(){}
}],{type:'trap',priority:2,keep:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;},
      /* この戦闘で自分が受ける戦闘ダメージは、かわりに相手が受ける。
         info.srcPlayer がこのカードのコントローラー。 */
      battleDamageRedirect(info){
        const self=info.self;
        if(!self||self.v6WallTurn!==gameState.turn) return null;
        if(info.to!==info.srcPlayer) return null;
        return info.srcPlayer===0?1:0;
      }}});

/* ---- バトルフェイズ終了時に働くカード ---------------------------------- */
defineUnifiedCardV4('ビッグ・ジョーズ',[{
  key:'banish-at-bp-end',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onBattlePhaseEnd'],
  condition(ctx){return API.battledThisPhase(ctx.card);},
  operation(ctx){const h=locateCardAnyV4(ctx.card); if(h)API.banish(h,'ビッグ・ジョーズ');},afterResolve(){}
}],{type:'monster',priority:1,forced:true,
    passive:{onBattlePhaseEnd:ctx=>API.battledThisPhase(ctx.card)}});

defineUnifiedCardV4('ステルスロイド',[{
  key:'destroy-st-at-bp-end',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onBattlePhaseEnd'],
  condition(ctx){return gameState.activePlayer===ctx.player&&API.battledThisPhase(ctx.card)
    &&API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card!==ctx.card&&isCardInGroupV4(x.db,GROUP.ROID)}).length>0
    &&API.fieldCards({filter:x=>(x.zone==='sz'||x.zone==='field')&&(x.db.k==='s'||x.db.k==='t')}).length>0;},
  target(ctx,done){API.selectCard('ステルスロイド：破壊する魔法・罠',
    API.fieldCards({filter:x=>(x.zone==='sz'||x.zone==='field')&&(x.db.k==='s'||x.db.k==='t')}),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(t)API.destroy(t,'ステルスロイド');},afterResolve(){}
}],{type:'monster',priority:1,targets:true,destroysFieldV46:true,
    passive:{onBattlePhaseEnd:ctx=>gameState.activePlayer===ctx.player&&API.battledThisPhase(ctx.card)}});

defineUnifiedCardV4('惑星からの物体A',[{
  key:'take-attacker-at-bp-end',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onBattlePhaseEnd'],
  condition(ctx){return API.attackersAgainst(ctx.card).some(u=>{const h=findCardByUid(u);return h&&h.zone==='mz';})
    &&hasMonsterZoneSpace(ctx.player);},
  operation(ctx){
    const uids=API.attackersAgainst(ctx.card);
    for(const u of uids){
      const h=findCardByUid(u);
      if(h&&h.zone==='mz'&&h.p===ctx.opponent){
        act({type:'FX_CONTROL',player:h.p,zone:'mz',index:h.index,toPlayer:ctx.player,reason:'惑星からの物体A'});
        break;
      }
    }
  },afterResolve(){}
}],{type:'monster',priority:1,forced:true,
    passive:{onBattlePhaseEnd:ctx=>API.attackersAgainst(ctx.card).length>0}});

defineUnifiedCardV4('剣闘獣セクトル',[{
  key:'summon-two-gladiators-at-bp-end',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onBattlePhaseEnd'],
  condition(ctx){return API.battledThisPhase(ctx.card)
    &&API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.GLADIATOR_BEAST)
      &&!sameCanonicalCardV4(x.db,dbOf(ctx.card))).length>=2
    &&hasMonsterZoneSpace(ctx.player);},
  operation(ctx){
    for(let i=0;i<2;i++){
      const pool=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.GLADIATOR_BEAST)
        &&!sameCanonicalCardV4(x.db,dbOf(ctx.card)));
      if(!pool.length||!hasMonsterZoneSpace(ctx.player)) break;
      const h=resolveTarget(pool[0]);
      if(h&&h.zone==='deck')API.specialSummon(ctx.player,'deck',h.index,'atk','剣闘獣セクトル');
    }
    API.shuffle(ctx.player);
  },afterResolve(){}
}],{type:'monster',priority:1,includesSpecialSummon:true,
    passive:{onBattlePhaseEnd:ctx=>API.battledThisPhase(ctx.card)}});

/* ---- バトルフェイズ制御 ------------------------------------------------- */
defineUnifiedCardV4('ハーフorストップ',[{
  key:'half-or-stop',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(ctx){return gameState.phase==='battle'&&gameState.activePlayer===ctx.opponent;},
  operation(ctx){
    /* 選ぶのは相手。P1 の player 指定選択をそのまま使う。 */
    API.requestChoice({kind:'mode',title:'ハーフorストップ：効果を選ぶ',player:ctx.opponent,min:1,max:1,
      candidates:[{key:'half',label:'自分のモンスターの攻撃力を半分にする',value:'half'},
                  {key:'stop',label:'バトルフェイズを終了する',value:'stop'}],
      resume:{handler:'battlev6.halfOrStop',args:{player:ctx.opponent}}});
  },afterResolve(){}
}],{type:'trap',priority:2});
API.registerChoiceHandler('battlev6.halfOrStop',(answer,args)=>{
  if(answer&&answer.cancelled) return;
  const pick=(answer&&answer.keys&&answer.keys[0])||null;
  if(pick==='stop'){ API.endBattlePhase(); return; }
  API.fieldCards({player:args.player,zone:'mz',filter:x=>x.card.face==='up'}).forEach(t=>{
    const cur=API.curAtk(t);
    API.modAtk(t,-Math.floor(cur/2),0,'endBattlePhase','ハーフorストップ');
  });
});

defineUnifiedCardV4('スピード・ウォリアー',[{
  key:'battle-step-double-atk',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){return gameState.phase==='battle'&&ctx.card.summonedTurn===gameState.turn;},
  operation(ctx){const h=locateCardAnyV4(ctx.card);
    if(h)API.modAtk(h,dbOf(ctx.card).atk||0,0,'endBattlePhase','スピード・ウォリアー');},
  afterResolve(){}
}],{type:'monster',priority:1});

defineUnifiedCardV4('虚栄巨影',[{
  key:'attack-declare-boost',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetRange:LOCATION.MZONE,targetSide:'both',
  speed:2,events:['onAttackDeclare'],
  condition(){return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}).length>0;},
  target(ctx,done){API.selectCard('虚栄巨影：攻撃力を上げるモンスター',
    API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(t)API.modAtk(t,1000,0,'endBattlePhase','虚栄巨影');},afterResolve(){}
}],{type:'spell',priority:2,targets:true});

/* ---- 全体攻撃・攻撃回数 ------------------------------------------------- */
/* S03-U149: 「相手フィールド上の全てのモンスターに1回ずつ攻撃できる」 is a continuous rule (engine/1ZQ attackAllMonstersS03).
   It used to be a forced trigger at the start of the Battle Phase writing a 'multi' grant that nothing read — the monster could
   not attack a second time — and the grant went through the chain although the ability is not activated. */
function v6DefineMultiAttacker(name,meta){
  defineScript(name,Object.assign({type:'monster',priority:1,attackAllMonstersS03:true},meta||{}));
}
v6DefineMultiAttacker('ジュラック・モノロフ');
v6DefineMultiAttacker('神機王ウル',{
  continuous:{scope:'self',from:['mz'],apply(){return null;},
    battleDamage(info){
      /* 「このカードが戦闘を行う場合、相手が受ける戦闘ダメージは0になる」
         relevant なのはこのカードが関わる戦闘だけ。相手＝このカードの
         コントローラーから見た相手プレイヤー。 */
      const self=info.self;
      if(!self) return null;
      if(info.atkCard!==self && info.defCard!==self) return null;
      const foe=(info.srcPlayer===0)?1:0;
      return (info.to===foe)?0:info.amount;
    }}});

defineUnifiedCardV4('ライノタウルス',[{
  key:'second-attack-after-two-kills',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onBattleDestroy'],
  condition(ctx){return gameState.activePlayer===ctx.player&&API.battleDestroyedThisPhase()>=2;},
  operation(ctx){const h=locateCardAnyV4(ctx.card);
    if(h)act({type:'GRANT_EXTRA_ATTACK_V48',player:h.p,zone:'mz',index:h.index,n:1,afterCurrent:true});},
  afterResolve(){}
}],{type:'monster',priority:1,
    passive:{onBattleDestroy:ctx=>gameState.activePlayer===ctx.player&&API.battleDestroyedThisPhase()>=2}});

/* ---- 直接攻撃宣言に反応するカード -------------------------------------- */
defineUnifiedCardV4('闘争本能',[{
  key:'summon-beast-on-direct-attack',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onAttackDeclare'],
  condition(ctx){const b=API.battleContext();
    return !!b&&b.direct===true&&b.attackerOwner===ctx.opponent
      &&API.fieldCards({player:ctx.player,zone:'mz'}).length===0
      &&API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&x.db.ra==='獣'&&(x.db.lv||99)<=4).length>0;},
  operation(ctx){
    const pool=API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&x.db.ra==='獣'&&(x.db.lv||99)<=4);
    if(!pool.length) return;
    API.requestChoice({player:ctx.player,kind:'card',title:'闘争本能：特殊召喚する獣族',
      candidates:pool,min:1,max:1,cancelable:true,
      resume:{handler:'s03u62.fighting-spirit-summon',args:{player:ctx.player}},
      meta:{scriptName:'闘争本能'}});
  },afterResolve(){}
}],{type:'trap',priority:2,includesSpecialSummon:true});
/* S03-U62: operation() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.fighting-spirit-summon',(answer,args)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  if(h&&h.zone==='hand')API.specialSummon(args.player,'hand',h.index,'atk','闘争本能');
});

