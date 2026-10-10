/* =========================================================================
   System v4.6 WIP — ADS-style constraints + practical card batch C
   -------------------------------------------------------------------------
   This file implements card behavior against the project's common Effect/API
   surface.  It does not import or copy an external duel engine.
   ========================================================================= */
function v46SelfMz(ctx){
  const h=locateCardAnyV4(ctx.card); return h&&h.p===ctx.player&&h.zone==='mz'?h:null;
}
function v46OpponentField(ctx,filter){
  return API.fieldCards({player:ctx.opponent,filter:filter||null});
}
function v46PickOneThenOptionalSecond(title,pool,done){
  const src=(pool||[]).slice(); if(!src.length){done([]);return;}
  API.selectCard(title,src,a=>{
    const left=src.filter(x=>x.card!==a.card); if(!left.length){done([a]);return;}
    API.confirm(title,'もう1枚選びますか？',()=>API.selectCard(title,left,b=>done([a,b])),()=>done([a]));
  });
}
function v46PickAnyAtLeastOne(title,pool,max,done){
  const src=(pool||[]).slice(),picked=[],limit=Math.max(1,Math.min(Number(max)||src.length,src.length));
  const step=()=>{
    const left=src.filter(x=>!picked.some(y=>y.card===x.card));
    if(!left.length||picked.length>=limit){done(picked);return;}
    API.selectCard(`${title}（${picked.length+1}/${limit}）`,left,t=>{
      picked.push(t);
      const more=src.some(x=>!picked.some(y=>y.card===x.card))&&picked.length<limit;
      if(!more){done(picked);return;}
      API.confirm(title,'さらに選びますか？',step,()=>done(picked));
    });
  };
  step();
}
function v46SelectionCardTargets(v,out){
  out=out||[]; if(v==null||typeof v!=='object')return out;
  if(Array.isArray(v)){v.forEach(x=>v46SelectionCardTargets(x,out));return out;}
  if(v.card&&typeof v.zone==='string'&&v.p!=null){out.push(v);return out;}
  Object.keys(v).forEach(k=>v46SelectionCardTargets(v[k],out)); return out;
}
function v46TopChain(){ return gameState.chain&&gameState.chain.length?gameState.chain[gameState.chain.length-1]:null; }
function v46LinkDestroysField(link){
  if(!link)return false;
  const sc=CARD_SCRIPTS[link.name], db=dbOfByChainV350(link)||{};
  if(sc&&sc.destroysFieldV46===true)return true;
  const txt=String(db.e||'');
  let sel=[]; try{sel=deserializeChainSelectionV2(link.selection||link.targets||[]);}catch(e){}
  const fieldTargets=v46SelectionCardTargets(sel).filter(t=>{
    const r=resolveTarget(t); return r&&['mz','sz','field'].includes(r.zone);
  });
  if(fieldTargets.length&&/破壊/.test(txt))return true;
  /* カード名の直書きではなく System v19 の効果カテゴリで判定する。 */
  return (typeof linkHasCategoryV19==='function')
    ? linkHasCategoryV19(gameState,link,'destroy') : false;
}
function v46StardustReturnEffect(card){
  if(!card||card.uid==null)return null;
  return (v4EnsureRuntimeEffects(gameState)||[]).find(e=>e&&e.kind==='stardustReturnV46'&&e.sourceUid===card.uid)||null;
}
function v46EquippedMonsterCards(card,p){
  if(!card)return [];
  const uid=ensureCardUid(gameState,card);
  return (gameState.players[p].sz||[]).filter(c=>c&&c.v46MonsterEquip===true&&c.equipTo&&c.equipTo.uid===uid);
}
function v46BattleOpponent(ctx){ return (ctx&&ctx.battleOpponent)||battleOpponentV28(ctx&&ctx.card,ctx&&ctx.battle); }

/* 旧い効果の破壊判定はカード名の一覧を持たず、
   System v19 の効果カテゴリ（宣言→テキスト推定）に任せる。
   個別の destroysFieldV46:true 宣言はカード側の明示指定として残す。 */

/* スターダスト・ドラゴン — 破壊効果の発動無効 + そのターンEnd Phase自己蘇生。 */
defineUnifiedCardV4('スターダスト・ドラゴン',[
  {
    key:'negate-destruction',type:EFFECT_TYPE.QUICK,range:LOCATION.MZONE,speed:2,events:['activate'],
    condition(ctx){
      if(ctx.zone!=='mz'||ctx.card.face!=='up'){ctx.reason='表側表示でモンスターゾーンに存在する必要があります';return false;}
      const top=v46TopChain(); if(!top||top.uid===ctx.card.uid||!v46LinkDestroysField(top)){ctx.reason='フィールドのカードを破壊する効果の発動に直接チェーンします';return false;}
      return true;
    },
    cost(ctx,done){
      const h=v46SelfMz(ctx); if(!h){done(false);return;}
      API.sendToGrave(h,'スターダスト・ドラゴン（リリース）'); done(true);
    },
    operation(ctx){
      if(!negatePreviousChainLinkV2('スターダスト・ドラゴン',true,'activation'))return;
      const h=locateCardAnyV4(ctx.card); if(!h||h.zone!=='grave')return;
      API.setCardFlag(h,'v46StardustReturnTurn',gameState.turn,'スターダスト・ドラゴン');
      v4RegisterRuntimeEffect({owner:ctx.player,controller:ctx.player,code:'stardust-return-v46',kind:'stardustReturnV46',sourceCard:ctx.card,resetMask:RESET.END});
    },afterResolve(){}
  },
  {
    key:'end-return',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onEndPhase'],
    condition(ctx){
      if(ctx.zone!=='grave'||ctx.card.v46StardustReturnTurn!==gameState.turn||!v46StardustReturnEffect(ctx.card)){ctx.reason='このターン自身の効果のためにリリースされたこのカードが墓地に存在する必要があります';return false;}
      if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}
      const ss=v46SpecialSummonRestrictionReason(ctx.player,dbOf(ctx.card)); if(ss){ctx.reason=ss;return false;}
      return true;
    },
    operation(ctx){
      const h=locateCardAnyV4(ctx.card); if(!h||h.zone!=='grave')return;
      API.specialSummon(ctx.player,'grave',h.index,'atk','スターダスト・ドラゴン');
    },afterResolve(){}
  }
],{type:'synchro',priority:2,quickEffect:true,activateFrom:['grave'],blocksIfNoSpecialSummon(ctx){return ctx&&ctx.zone==='grave';},passive:{onEndPhase(ctx){return ctx.zone==='grave'&&ctx.card.v46StardustReturnTurn===gameState.turn&&!!v46StardustReturnEffect(ctx.card);}}});

/* イビリチュア・メロウガイスト — 戦闘破壊モンスターをGYへ送る代わりにDeckへ。 */
defineUnifiedCardV4('イビリチュア・メロウガイスト',[{
  key:'battle-replace-deck',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDamageStep'],
  condition(ctx){
    const b=ctx.battle||{};
    if(ctx.zone!=='mz'||ctx.card.face!=='up'||ctx.step!=='after'||b.atkCard!==ctx.card||!b.destroyedDef){ctx.reason='このカードが戦闘で相手モンスターを破壊したダメージ計算後に発動します';return false;}
    if(!(ctx.card.xyz||[]).length){ctx.reason='取り除けるX素材がありません';return false;}
    return !!(b.defCard&&!b.defCard.token);
  },
  /* S03-U114 */detachCostS03:{count:1,reason:'イビリチュア・メロウガイスト（コスト）'},
    operation(ctx){const c=(ctx.battle||{}).defCard,h=c&&locateCardAnyV4(c);if(h&&h.zone==='mz'&&h.p===ctx.opponent&&c.battleDestroyed)API.returnToDeck(h,false,'イビリチュア・メロウガイスト');},afterResolve(){}
}],{type:'xyz',priority:1,dsTiming:'after',passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='after'&&b.atkCard===ctx.card&&!!b.destroyedDef&&!!(ctx.card.xyz||[]).length;}}});

/* ヴァイロン・ディシグマ — X素材1つで相手攻撃表示効果モンスターを装備。 */
defineUnifiedCardV4('ヴァイロン・ディシグマ',[
  {
    key:'absorb',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'opponent',speed:1,events:['activate'],
    condition(ctx){
      if(ctx.zone!=='mz'||ctx.card.face!=='up'||!(ctx.card.xyz||[]).length){ctx.reason='表側表示のこのカードとX素材が必要です';return false;}
      if(ctx.card.v46DisigmaAbsorbTurn===gameState.turn){ctx.reason='このターンは既にこの効果を使用しています';return false;}
      if(API.me(ctx).sz.length>=ZONE_LIMITS.sz){ctx.reason='魔法・罠ゾーンが一杯です';return false;}
      const p=API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'&&x.card.pos==='atk'&&x.db.k==='m'&&(x.db.st||[]).includes('効果')});
      if(!p.length){ctx.reason='相手に表側攻撃表示の効果モンスターがいません';return false;} return true;
    },
    /* S03-U114 */detachCostS03:{count:1,reason:'ヴァイロン・ディシグマ（コスト）',after(ctx){const h=v46SelfMz(ctx);if(h)API.setCardFlag(h,'v46DisigmaAbsorbTurn',gameState.turn,'ヴァイロン・ディシグマ');},targets(ctx){return {title:'ヴァイロン・ディシグマ：装備する相手モンスター',candidates:API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'&&x.card.pos==='atk'&&x.db.k==='m'&&(x.db.st||[]).includes('効果')})};}},
        target(ctx,done){API.selectCard('ヴァイロン・ディシグマ：装備する相手モンスター',API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'&&x.card.pos==='atk'&&x.db.k==='m'&&(x.db.st||[]).includes('効果')}),t=>done([t]));},
    operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0],self=v46SelfMz(ctx);if(t&&self)API.equipMonster(ctx.player,t,self,'ヴァイロン・ディシグマ');},afterResolve(){}
  },
  {
    key:'attribute-destroy',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDamageStep'],
    condition(ctx){
      if(ctx.zone!=='mz'||ctx.card.face!=='up'||ctx.step!=='start')return false;
      const foe=v46BattleOpponent(ctx); if(!foe)return false;
      const at=dbOf(foe).at; return !!at&&v46EquippedMonsterCards(ctx.card,ctx.player).some(c=>dbOf(c).at===at);
    },
    operation(ctx){const foe=v46BattleOpponent(ctx),h=foe&&locateCardAnyV4(foe);if(h&&h.zone==='mz')API.destroy(h,'ヴァイロン・ディシグマ');},afterResolve(){}
  }
],{type:'xyz',priority:1,targets:true,timing:['mainPhase'],dsTiming:'start',forced:true,passive:{onDamageStep(ctx){if(ctx.zone!=='mz'||ctx.card.face!=='up'||ctx.step!=='start')return false;const foe=v46BattleOpponent(ctx);return !!foe&&v46EquippedMonsterCards(ctx.card,ctx.player).some(c=>dbOf(c).at===dbOf(foe).at);}}});

/* ゴヨウ・ガーディアン — 戦闘破壊してGYへ送った相手を自分場へ守備表示で蘇生。 */
defineUnifiedCardV4('ゴヨウ・ガーディアン',[{
  key:'capture',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDamageStep'],
  condition(ctx){
    const b=ctx.battle||{},foe=b.defCard;
    if(ctx.zone!=='mz'||ctx.card.face!=='up'||ctx.step!=='leave'||b.atkCard!==ctx.card||!b.destroyedDef||!foe){ctx.reason='このカードが戦闘で相手モンスターを破壊し墓地へ送った時に発動します';return false;}
    const h=locateCardAnyV4(foe); if(!h||h.zone!=='grave'){ctx.reason='破壊したモンスターが墓地に存在しません';return false;}
    if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}
    const ss=v46SpecialSummonRestrictionReason(ctx.player,dbOf(foe));if(ss){ctx.reason=ss;return false;} return true;
  },
  operation(ctx){const foe=(ctx.battle||{}).defCard,h=foe&&locateCardAnyV4(foe);if(h&&h.zone==='grave')API.specialSummon(ctx.player,'grave',h.index,'def','ゴヨウ・ガーディアン',h.p);},afterResolve(){}
}],{type:'synchro',priority:1,dsTiming:'leave',blocksIfNoSpecialSummon:true,includesSpecialSummon:true,passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='leave'&&b.atkCard===ctx.card&&!!b.destroyedDef;}}});

/* ダークエンド・ドラゴン — 解決時に自身-500/-500、その後対象を墓地へ送る。 */
defineUnifiedCardV4('ダークエンド・ドラゴン',[{
  key:'dark-end-send',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'opponent',speed:1,events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.card.face!=='up'||curATK(ctx.card)<500||curDEF(ctx.card)<500){ctx.reason='表側表示で攻撃力・守備力が500以上必要です';return false;}
    if(!API.fieldCards({player:ctx.opponent,zone:'mz'}).length){ctx.reason='相手フィールドにモンスターがいません';return false;}return true;
  },
  target(ctx,done){API.selectCard('ダークエンド・ドラゴン：墓地へ送る相手モンスター',API.fieldCards({player:ctx.opponent,zone:'mz'}),t=>done([t]));},
  operation(ctx){
    const self=v46SelfMz(ctx);if(!self||ctx.card.face!=='up'||curATK(ctx.card)<500||curDEF(ctx.card)<500)return;
    v4RegisterStatModifier(self,{atk:-500,def:-500},{controller:ctx.player,code:'Dark End -500',targetCard:ctx.card,resetMask:RESET.LEAVE|RESET.FACE_DOWN|RESET.DISABLE});
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];if(t)API.sendToGrave(t,'ダークエンド・ドラゴン');
  },afterResolve(){}
}],{type:'synchro',priority:1,countLimit:1,targets:true,timing:['mainPhase']});

/* レッド・デーモンズ・ドラゴン — 守備モンスター攻撃後の全守備破壊 + 自End未攻撃破壊。 */
defineUnifiedCardV4('レッド・デーモンズ・ドラゴン',[
  {
    key:'defense-wipe',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDamageStep'],
    condition(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='after'&&b.atkCard===ctx.card&&b.defCard&&b.defCard.pos==='def';},
    operation(ctx){API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.pos==='def'&&!x.card.battleDestroyed}).slice().forEach(t=>API.destroy(t,'レッド・デーモンズ・ドラゴン'));},afterResolve(){}
  },
  {
    key:'end-wipe-own',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onEndPhase'],
    condition(ctx){return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.player===gameState.activePlayer;},
    operation(ctx){API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card!==ctx.card&&!x.card.attacked}).slice().forEach(t=>API.destroy(t,'レッド・デーモンズ・ドラゴン'));},afterResolve(){}
  }
],{type:'synchro',priority:1,forced:true,dsTiming:'after',destroysFieldV46:true,passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='after'&&b.atkCard===ctx.card&&b.defCard&&b.defCard.pos==='def';},onEndPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.player===gameState.activePlayer;}}});

/* インフェルニティ・デス・ドラゴン — 手札0、未攻撃なら破壊+元ATK半分。 */
defineUnifiedCardV4('インフェルニティ・デス・ドラゴン',[{
  key:'doom-destroy-burn',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'opponent',speed:1,events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.card.face!=='up'||API.me(ctx).hand.length){ctx.reason='表側表示で、自分の手札が0枚の場合に発動できます';return false;}
    if(ctx.card.attacked){ctx.reason='このターン攻撃宣言したため発動できません';return false;}
    if(!API.fieldCards({player:ctx.opponent,zone:'mz'}).length){ctx.reason='相手フィールドにモンスターがいません';return false;}return true;
  },
  cost(ctx,done){const h=v46SelfMz(ctx);if(!h){done(false);return;}API.setCardFlag(h,'attacked',true,'インフェルニティ・デス・ドラゴン（このターン攻撃不可）');done(true);},
  target(ctx,done){API.selectCard('インフェルニティ・デス・ドラゴン：破壊する相手モンスター',API.fieldCards({player:ctx.opponent,zone:'mz'}),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0],r=t&&resolveTarget(t);if(!r)return;
    /* S03-U294: the destroyed monster's ATK on the field (last known; was the printed ATK); damage only if it was destroyed, after any substitute decision */
    const atk=r.card.face==='up'?Math.max(0,curATK(r.card)):0, mark=API.destroyMarkS03(), uid=ensureCardUid(gameState,r.card);
    API.destroy(r,'インフェルニティ・デス・ドラゴン');
    API.afterDestroyS03('s03u294.if-destroyed-lp',{mark,uids:[uid],to:ctx.opponent,n:Math.floor(atk/2),op:'damage'});
  },afterResolve(){}
}],{type:'synchro',priority:1,countLimit:1,targets:true,timing:['mainPhase'],destroysFieldV46:true});

/* 氷結界の龍 グングニール — 手札1～2枚を捨て、同数の相手フィールドを破壊。 */
defineUnifiedCardV4('氷結界の龍 グングニール',[{
  key:'gungnir-destroy',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.ONFIELD,targetSide:'opponent',speed:1,events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.card.face!=='up'){ctx.reason='表側表示でフィールドに存在する必要があります';return false;}
    if(!API.me(ctx).hand.length){ctx.reason='捨てられる手札がありません';return false;}
    if(!v46OpponentField(ctx).length){ctx.reason='相手フィールドにカードがありません';return false;}return true;
  },
  cost(ctx,done){
    const max=Math.min(2,API.me(ctx).hand.length,v46OpponentField(ctx).length),pool=API.pileCards(ctx.player,'hand');
    v46PickAnyAtLeastOne('氷結界の龍 グングニール：墓地へ捨てる手札',pool,max,picked=>{
      if(!picked.length){done(false);return;} ctx.v46GungnirCount=picked.length;
      picked.slice().sort((a,b)=>b.index-a.index).forEach(t=>API.discard(ctx.player,t.index,'氷結界の龍 グングニール（コスト）',{byEffect:false})); done(true);
    });
  },
  target(ctx,done){v4nSelectExactly('氷結界の龍 グングニール：破壊する相手カード',v46OpponentField(ctx),Math.max(1,ctx.v46GungnirCount||1),done);},
  operation(ctx){(ctx.selectedTargets||[]).forEach(t=>{const r=resolveTarget(t);if(r&&r.p===ctx.opponent)API.destroy(r,'氷結界の龍 グングニール');});},afterResolve(){}
}],{type:'synchro',priority:1,countLimit:1,targets:true,timing:['mainPhase'],destroysFieldV46:true});

/* 神海竜ギシルノドン — 表側Lv3以下が場からGYへ送られた時、EndまでATK3000。 */
defineUnifiedCardV4('神海竜ギシルノドン',[{
  key:'set-3000',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onSendToGrave'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.card.face!=='up')return false;
    const c=ctx.event&&ctx.event.card,g=c&&c.graveInfo;
    return !!(c&&g&&g.from==='mz'&&g.face==='up'&&Number(g.lv||0)>0&&Number(g.lv||0)<=3);
  },
  operation(ctx){const h=v46SelfMz(ctx);if(h)v4RegisterStatModifier(h,{setAtk:3000},{controller:ctx.player,code:'Gishilnodon 3000',targetCard:ctx.card,resetMask:RESET.LEAVE|RESET.END|RESET.FACE_DOWN|RESET.DISABLE});},afterResolve(){}
}],{type:'synchro',priority:1,forced:true,passive:{onSendToGrave(ctx){const c=ctx.event&&ctx.event.card,g=c&&c.graveInfo;return ctx.zone==='mz'&&ctx.card.face==='up'&&!!(g&&g.from==='mz'&&g.face==='up'&&Number(g.lv||0)>0&&Number(g.lv||0)<=3);}}});

/* マジックテンペスター — S召喚カウンター / 手札→カウンター / 全カウンターバーン。 */
defineUnifiedCardV4('マジックテンペスター',[
  {
    key:'synchro-counter',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onSpecialSummon'],
    condition(ctx){return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.event&&ctx.event.kind==='synchro';},
    operation(ctx){const h=v46SelfMz(ctx);if(h)API.addCounter(h,'魔力',1);},afterResolve(){}
  },
  {
    key:'tempester-main',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
    condition(ctx){
      if(ctx.zone!=='mz'||ctx.card.face!=='up')return false;
      const add=ctx.card.v46TempesterAddTurn!==gameState.turn&&API.me(ctx).hand.length>0&&API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'}).length>0;
      const burn=API.fieldCards({filter:x=>x.card.face==='up'}).some(x=>API.countCounter(x,'魔力')>0);
      if(!add&&!burn){ctx.reason='置ける手札または取り除ける魔力カウンターがありません';return false;}return true;
    },
    cost(ctx,done){
      const add=ctx.card.v46TempesterAddTurn!==gameState.turn&&API.me(ctx).hand.length>0, burn=API.fieldCards({filter:x=>x.card.face==='up'}).some(x=>API.countCounter(x,'魔力')>0);
      const pickMode=mode=>{
        ctx.v46TempesterMode=mode;
        if(mode==='burn'){done(true);return;}
        v46PickAnyAtLeastOne('マジックテンペスター：墓地へ送る手札',API.pileCards(ctx.player,'hand'),API.me(ctx).hand.length,picked=>{
          if(!picked.length){done(false);return;} ctx.v46TempesterCount=picked.length;
          picked.slice().sort((a,b)=>b.index-a.index).forEach(t=>API.sendHandToGrave(ctx.player,t.index,'マジックテンペスター（コスト）'));
          const h=v46SelfMz(ctx);if(h)API.setCardFlag(h,'v46TempesterAddTurn',gameState.turn,'マジックテンペスター'); done(true);
        });
      };
      if(add&&burn)API.confirm('マジックテンペスター','手札を墓地へ送り魔力カウンターを置きますか？\n「いいえ」で全魔力カウンターを取り除きダメージを与えます。',()=>pickMode('add'),()=>pickMode('burn'));
      else pickMode(add?'add':'burn');
    },
    target(ctx,done){
      if(ctx.v46TempesterMode==='burn'){done([{mode:'burn'}]);return;}
      const n=Math.max(1,ctx.v46TempesterCount||1),placements=[];
      const step=()=>{
        if(placements.length>=n){done([{mode:'add',placements}]);return;}
        const pool=API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'});
        if(!pool.length){done([{mode:'add',placements}]);return;}
        API.selectCard(`マジックテンペスター：魔力カウンターを置くモンスター（${placements.length+1}/${n}）`,pool,t=>{placements.push(t);step();});
      };step();
    },
    operation(ctx){
      const s=ctx.selectedTargets&&ctx.selectedTargets[0]||{};
      if(s.mode==='add'){
        (s.placements||[]).forEach(t=>{const r=resolveTarget(t);if(r&&r.card.face==='up')API.addCounter(r,'魔力',1);}); return;
      }
      let total=0; API.fieldCards({filter:x=>x.card.face==='up'}).forEach(t=>{const n=API.countCounter(t,'魔力');if(n){total+=n;API.removeCounter(t,'魔力',n);}});
      if(total)API.damageLP(ctx.opponent,total*500);
    },afterResolve(){}
  }
],{type:'synchro',priority:1,targets:true,timing:['mainPhase'],forced:true,passive:{onSpecialSummon(ctx){return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.event&&ctx.event.kind==='synchro';}}});

/* フォッシル・ダイナ パキケファロ — Flipで特殊召喚モンスター全破壊 + SS封印。 */
defineUnifiedCardV4('フォッシル・ダイナ パキケファロ',[{
  key:'flip-wipe-special',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onFlip'],
  condition(ctx){return ctx.zone==='mz';},
  operation(){API.fieldCards({zone:'mz',filter:x=>x.card.specialSummoned===true}).slice().forEach(t=>API.destroy(t,'フォッシル・ダイナ パキケファロ'));},afterResolve(){}
}],{type:'monster',priority:1,forced:true,destroysFieldV46:true,passive:{onFlip(ctx){return ctx.zone==='mz';}},continuous:{scope:'self',from:['mz'],apply(){return null;}}});

/* 虚無魔人 — 自身は特殊召喚不可。表側MZにいる限り双方SS不可。 */
defineUnifiedCardV4('虚無魔人',[],{type:'monster',priority:1,cannotSpecialSummon:true,continuous:{scope:'self',from:['mz'],apply(){return null;}}});

/* 虚無空間 — 双方SS不可。Deck/field→自分GYで自身を強制破壊。 */
defineUnifiedCardV4('虚無空間',[
  {key:'activate',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],condition(){return true;},operation(){},afterResolve(){}},
  {
    key:'self-destroy',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,events:['onSendToGrave'],
    condition(ctx){
      if(ctx.zone!=='sz'||ctx.card.face!=='up')return false;
      const c=ctx.event&&ctx.event.card,g=c&&c.graveInfo,h=c&&locateCardAnyV4(c);
      return !!(g&&h&&h.zone==='grave'&&h.p===ctx.player&&['deck','mz','sz','field'].includes(g.from));
    },
    operation(ctx){const h=locateCardAnyV4(ctx.card);if(h&&h.zone==='sz')API.destroy(h,'虚無空間');},afterResolve(){}
  }
],{type:'trap',priority:2,forced:true,passive:{onSendToGrave(ctx){const c=ctx.event&&ctx.event.card,g=c&&c.graveInfo,h=c&&locateCardAnyV4(c);return ctx.zone==='sz'&&ctx.card.face==='up'&&!!(g&&h&&h.zone==='grave'&&h.p===ctx.player&&['deck','mz','sz','field'].includes(g.from));}},continuous:{scope:'self',from:['sz'],apply(){return null;}}});

/* スクラップ・ツイン・ドラゴン — 自分1枚破壊 + 相手2枚バウンス / 相手破壊時Scrap蘇生。 */
defineUnifiedCardV4('スクラップ・ツイン・ドラゴン',[
  {
    key:'twin-bounce',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.ONFIELD,targetSide:'both',speed:1,events:['activate'],
    condition(ctx){
      if(ctx.zone!=='mz'||ctx.card.face!=='up')return false;
      if(ctx.card.v46ScrapTwinTurn===gameState.turn){ctx.reason='このターンは既にこの効果を使用しています';return false;}
      if(!API.fieldCards({player:ctx.player}).length||API.fieldCards({player:ctx.opponent}).length<2){ctx.reason='自分フィールド1枚と相手フィールド2枚が必要です';return false;}return true;
    },
    cost(ctx,done){const h=v46SelfMz(ctx);if(!h){done(false);return;}API.setCardFlag(h,'v46ScrapTwinTurn',gameState.turn,'スクラップ・ツイン・ドラゴン');done(true);},
    target(ctx,done){
      API.selectCard('スクラップ・ツイン・ドラゴン：破壊する自分カード',API.fieldCards({player:ctx.player}),own=>{
        v4nSelectExactly('スクラップ・ツイン・ドラゴン：手札に戻す相手カード',API.fieldCards({player:ctx.opponent}),2,foes=>done([{own,foes}]));
      });
    },
    operation(ctx){
      const s=ctx.selectedTargets&&ctx.selectedTargets[0]||{},own=s.own&&resolveTarget(s.own); if(!own)return;
      const ownCard=own.card; API.destroy(own,'スクラップ・ツイン・ドラゴン');
      const left=locateCardAnyV4(ownCard); if(left&&['mz','sz','field'].includes(left.zone))return;
      (s.foes||[]).forEach(t=>{const r=resolveTarget(t);if(r&&r.p===ctx.opponent)API.returnToHand(r,'スクラップ・ツイン・ドラゴン');});
    },afterResolve(){}
  },
  {
    key:'scrap-revive',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,targetRange:LOCATION.GRAVE,targetSide:'self',speed:1,events:['onDestroy'],
    condition(ctx){
      const g=ctx.card&&ctx.card.graveInfo;
      if(ctx.zone!=='grave'||!g||!g.byDestroy){ctx.reason='このカードが破壊され墓地へ送られた時に発動します';return false;}
      if(!(g.byPlayer===ctx.opponent||(ctx.event&&ctx.event.reason==='battle'))){ctx.reason='相手によって破壊された場合に発動します';return false;}
      if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}
      const p=API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&x.db.k==='m'&&isSetCardV4(x.db,SETCODE.SCRAP)&&!(x.db.st||[]).includes('シンクロ'));
      if(!p.length){ctx.reason='蘇生できるシンクロ以外のスクラップがいません';return false;}return true;
    },
    target(ctx,done){API.selectCard('スクラップ・ツイン・ドラゴン：特殊召喚するスクラップ',API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&x.db.k==='m'&&isSetCardV4(x.db,SETCODE.SCRAP)&&!(x.db.st||[]).includes('シンクロ')),t=>done([t]));},
    operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0],r=t&&resolveTarget(t);if(r&&r.zone==='grave')API.specialSummon(ctx.player,'grave',r.index,'atk','スクラップ・ツイン・ドラゴン');},afterResolve(){}
  }
],{type:'synchro',priority:1,targets:true,timing:['mainPhase'],activateFrom:['grave'],forced:true,blocksIfNoSpecialSummon(ctx){return ctx&&ctx.zone==='grave';},includesSpecialSummon:true,destroysFieldV46:true,passive:{onDestroy(ctx){const g=ctx.card&&ctx.card.graveInfo;return ctx.zone==='grave'&&!!(g&&g.byDestroy&&(g.byPlayer===ctx.opponent||(ctx.event&&ctx.event.reason==='battle')));}}});

/* メンタルスフィア・デーモン — 戦闘破壊回復 + Psychic1体対象の魔法罠を1000LPで無効。 */
defineUnifiedCardV4('メンタルスフィア・デーモン',[
  {
    key:'battle-heal',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDamageStep'],
    condition(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='leave'&&b.atkCard===ctx.card&&!!b.destroyedDef&&!!b.defCard&&!!locateCardAnyV4(b.defCard)&&locateCardAnyV4(b.defCard).zone==='grave';},
    operation(ctx){const c=(ctx.battle||{}).defCard,n=c?Math.max(0,Number(dbOf(c).atk)||0):0;if(n)API.recoverLP(ctx.player,n);},afterResolve(){}
  },
  {
    key:'target-negate',type:EFFECT_TYPE.QUICK,range:LOCATION.MZONE,speed:2,events:['activate'],
    condition(ctx){
      if(ctx.zone!=='mz'||ctx.card.face!=='up'||API.me(ctx).lp<1000){ctx.reason='表側表示で1000LPを払える必要があります';return false;}
      const top=v46TopChain(); if(!top||top.uid===ctx.card.uid)return false;
      const d=dbOfByChainV350(top)||{}; if(d.k!=='s'&&d.k!=='t'){ctx.reason='魔法・罠カードの発動に直接チェーンします';return false;}
      let s=[];try{s=deserializeChainSelectionV2(top.selection||top.targets||[]);}catch(e){}
      const ts=v46SelectionCardTargets(s).map(t=>resolveTarget(t)).filter(Boolean);
      if(ts.length!==1||dbOf(ts[0].card).ra!=='サイキック'){ctx.reason='サイキック族モンスター1体のみを対象とする魔法・罠ではありません';return false;}return true;
    },
    cost(ctx,done){API.payCost(ctx.player,1000);done(true);},
    operation(){negatePreviousChainLinkV2('メンタルスフィア・デーモン',true,'activation');},afterResolve(){}
  }
],{type:'synchro',priority:2,quickEffect:true,dsTiming:'leave',forced:true,passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='leave'&&b.atkCard===ctx.card&&!!b.destroyedDef;}}});
