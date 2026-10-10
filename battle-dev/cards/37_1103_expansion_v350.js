/* =========================================================================
   System v3.5.0: 1103 script expansion batch 3
   六武衆 / 帝・カエル / Battle Fader・Tragoedia / Synchro / X-Saber / Machina / BF
   1103-era card text only. Partial implementations are explicitly marked with auditNote.
   ========================================================================= */

function v350Name(card){ return String(dbOf(card).n||''); }
function v350FaceUpOwn(p,filter){ return API.fieldCards({zone:'mz',player:p,filter:x=>x.card.face==='up'&&(!filter||filter(x))}); }
function v350Six(card){ return !!card && v350Name(card).indexOf('六武衆')>=0; }
function v350SixOwn(p,self){ return v350FaceUpOwn(p,x=>x.card!==self&&v350Six(x.card)); }
function v350XSaber(card){ return !!card && /X－セイバー/.test(v350Name(card)); }
function v350BF(card){ return !!card && v350Name(card).indexOf('BF－')===0; }
function v350Frog(db){ return !!db && String(db.n||'').indexOf('ガエル')>=0; }
function v350Machine(db){ return !!db && db.k==='m' && db.ra==='機械'; }
function v350TopLink(){ return gameState.chain.length?gameState.chain[gameState.chain.length-1]:null; }
function v350FieldST(){ return API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'}); }
function v350EndBattlePhase(reason){
  /* S03-U152: the shared 「バトルフェイズを終了する」 (engine/1ZS). It wrote SET_PHASE main2 directly, skipping the end of the
     Battle Phase (its schedules and onBattlePhaseEnd triggers). */
  endBattlePhaseByEffectS03(reason||'効果');
}

/* ============================== 六武衆 ============================== */

defineScript("真六武衆－シエン", {
  auditNote:"①魔法・罠の発動無効＋破壊を自動化。②戦闘・効果で破壊される場合の「六武衆」による身代わりは、破壊の時点でコントローラーが選ぶ（S03-U173）",
  destroySubstituteS03:{kind:'destroyOwn', causes:['battle','effect'], filter:c=>v350Six(c)},   /* S03-U173 (engine/1ZV): chosen by its controller at the destruction */
  type:'synchro', priority:2, quickEffect:true, countLimit:1,
  condition(ctx){
    if(ctx.zone!=='mz'){ctx.reason='フィールドで発動します';return false;}
    const top=v350TopLink(); if(!top||top.player!==ctx.opponent){ctx.reason='相手の魔法・罠カードの発動にチェーンします';return false;}
    const d=CARD_DB[top.cardId]||{}; if(d.k!=='s'&&d.k!=='t'){ctx.reason='相手の魔法・罠カードの発動ではありません';return false;}
    return true;
  },
  resolve(){ negatePreviousChainLinkV2('真六武衆－シエン',true,'activation'); }, afterResolve(){}
});

defineScript("六武衆の師範", {
  auditNote:"②自己特殊召喚・③効果破壊時の六武衆回収を自動化。①同名1体制限は特殊召喚手順で強制",
  type:'monster', priority:1, forced:true, targets:true,
  summonProcedure:{from:'hand',positions:['atk','def'],condition(ctx){
    if(!v350FaceUpOwn(ctx.player,x=>v350Six(x.card)).length){ctx.reason='自分フィールドに「六武衆」が必要です';return false;}
    if(v350FaceUpOwn(ctx.player,x=>x.db.n==='六武衆の師範').length){ctx.reason='「六武衆の師範」は自分フィールドに1体しか存在できません';return false;}
    return true;
  }},
  condition(ctx){
    if(ctx.eventName!=='onDestroy'||ctx.zone!=='grave'||!v350MasterDestroyedByFoeS03(ctx)){ctx.reason='相手の効果で破壊された場合に発動します';return false;}
    const pool=API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&String(x.db.n||'').indexOf('六武衆')>=0);
    if(!pool.length){ctx.reason='墓地に「六武衆」がいません';return false;} return true;
  },
  selectTargets(ctx,done){API.selectCard('六武衆の師範：手札に戻す「六武衆」',API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&String(x.db.n||'').indexOf('六武衆')>=0),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.returnToHand(t,'六武衆の師範');}, afterResolve(){},
  passive:{onDestroy(ctx){return ctx.zone==='grave'&&v350MasterDestroyedByFoeS03(ctx);}}
});
/* S03-U146: ③ 「このカードが相手の効果で破壊された場合」 — its own onDestroy event (it fired for any card destroyed by an effect), by an
   effect (not battle), and destroyed by the opponent (graveInfo.byPlayer / the event's byPlayer, recorded since U146 in DUEL). */
function v350MasterDestroyedByFoeS03(ctx){
  const e=ctx.event||{};
  if(!eventIsSelfS03(ctx)||e.reason!=='effect') return false;
  const g=ctx.card&&ctx.card.graveInfo;
  const by=(e.byPlayer===0||e.byPlayer===1)?e.byPlayer:(g?g.byPlayer:null);
  return by===ctx.opponent;
}

defineScript("六武衆－ヤイチ", {
  auditNote:"セット魔法・罠破壊と攻撃禁止を自動化。表側表示のこのカードが破壊される場合の「六武衆」による身代わりは、破壊の時点でコントローラーが選ぶ（S03-U173）",
  destroySubstituteS03:{kind:'destroyOwn', causes:['battle','effect'], filter:c=>v350Six(c)},   /* S03-U173 (engine/1ZV): chosen by its controller at the destruction */
  type:'monster',priority:1,countLimit:1,targets:true,timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.player!==gameState.activePlayer){ctx.reason='自分メインフェイズに発動します';return false;}
    if(!v350SixOwn(ctx.player,ctx.card).length){ctx.reason='他の「六武衆」が必要です';return false;}
    const pool=API.fieldCards({filter:x=>(x.zone==='sz'||x.zone==='field')&&x.card.face==='down'});
    if(!pool.length){ctx.reason='セットされた魔法・罠カードがありません';return false;}return true;
  },
  selectTargets(ctx,done){API.selectCard('六武衆－ヤイチ：破壊するセット魔法・罠',API.fieldCards({filter:x=>(x.zone==='sz'||x.zone==='field')&&x.card.face==='down'}),t=>done([t]));},
  resolve(ctx){API.setCardFlag({card:ctx.card},'cannotAttack',true,'六武衆－ヤイチ',{silent:true});const t=ctx.selectedTargets[0];if(t)API.destroy(t,'六武衆－ヤイチ');},afterResolve(){}
});

defineScript("六武衆－ザンジ", {
  auditNote:"他の六武衆がいる時の攻撃対象破壊を自動化。表側表示のこのカードが破壊される場合の「六武衆」による身代わりは、破壊の時点でコントローラーが選ぶ（S03-U173）",
  destroySubstituteS03:{kind:'destroyOwn', causes:['battle','effect'], filter:c=>v350Six(c)},   /* S03-U173 (engine/1ZV): chosen by its controller at the destruction */
  type:'monster',priority:1,forced:true,dsTiming:'end',
  condition(ctx){const b=ctx.battle||{};if(!v350SixOwn(ctx.player,ctx.card).length)return false;return b.atkCard===ctx.card&&b.target!=='direct'&&!!b.defCard;},
  resolve(ctx){const b=ctx.battle||{};if(b.defCard)API.destroy({card:b.defCard},'六武衆－ザンジ');},afterResolve(){},
  passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&b.atkCard===ctx.card&&b.target!=='direct'&&!!b.defCard&&v350SixOwn(ctx.player,ctx.card).length>0;}}
});

/* ============================== 帝・カエル ============================== */

defineScript("邪帝ガイウス", {
  type:'monster',priority:1,forced:true,targets:true,
  condition(ctx){if(ctx.eventName!=='onNormalSummon'||ctx.zone!=='mz'||(ctx.card.tributeCount||0)<1){ctx.reason='アドバンス召喚成功時に発動します';return false;}if(!API.fieldCards().length){ctx.reason='フィールドに対象がありません';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('邪帝ガイウス：除外するカード',API.fieldCards(),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(!t)return;const dark=t.db&&t.db.k==='m'&&t.db.at==='闇';API.banish(t,'邪帝ガイウス');if(dark)API.damageLP(ctx.opponent,1000);},afterResolve(){},
  passive:{onNormalSummon(ctx){return ctx.zone==='mz'&&(ctx.card.tributeCount||0)>=1;}}
});

defineScript("風帝ライザー", {
  type:'monster',priority:1,forced:true,targets:true,
  condition(ctx){if(ctx.eventName!=='onNormalSummon'||ctx.zone!=='mz'||(ctx.card.tributeCount||0)<1){ctx.reason='アドバンス召喚成功時に発動します';return false;}if(!API.fieldCards().length){ctx.reason='フィールドに対象がありません';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('風帝ライザー：デッキトップへ戻すカード',API.fieldCards(),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.returnToDeck(t,false,'風帝ライザー');},afterResolve(){},
  passive:{onNormalSummon(ctx){return ctx.zone==='mz'&&(ctx.card.tributeCount||0)>=1;}}
});

defineScript("黄泉ガエル", {
  type:'monster',priority:1,activateFrom:['grave'],timing:['standby'],
  condition(ctx){
    if(ctx.zone!=='grave'||gameState.phase!=='standby'||ctx.player!==gameState.activePlayer){ctx.reason='自分スタンバイフェイズに墓地で発動します';return false;}
    if(v350FaceUpOwn(ctx.player,x=>x.db.n==='黄泉ガエル').length){ctx.reason='自分フィールドに「黄泉ガエル」が存在します';return false;}
    const P=API.me(ctx);if(P.sz.length||P.field){ctx.reason='自分フィールドに魔法・罠カードが存在します';return false;}
    if(P.mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}return true;
  },
  resolve(ctx){const i=API.me(ctx).grave.indexOf(ctx.card);if(i>=0)API.specialSummon(ctx.player,'grave',i,'atk','黄泉ガエル');},afterResolve(){},
  passive:{onStandbyPhase(ctx){const P=API.me(ctx);return ctx.zone==='grave'&&ctx.player===gameState.activePlayer&&!P.sz.length&&!P.field&&!v350FaceUpOwn(ctx.player,x=>x.db.n==='黄泉ガエル').length;}}
});

defineScript("鬼ガエル", {
  auditNote:"①手札からの特殊召喚・②召喚時の墓地送り・③追加通常召喚まで自動化",
  includesSpecialSummon:true,type:'monster',priority:1,activateFrom:['hand','mz'],
  condition(ctx){
    if(['onNormalSummon','onSpecialSummon','onFlip'].includes(ctx.eventName)){
      const d=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&(x.db.lv||99)<=2&&x.db.ra==='水'&&x.db.at==='水');
      const f=API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&x.card!==ctx.card&&x.db.k==='m'&&(x.db.lv||99)<=2&&x.db.ra==='水'&&x.db.at==='水'});
      if(!d.length&&!f.length){ctx.reason='墓地へ送れるレベル2以下の水族・水属性がありません';return false;}return true;
    }
    if(ctx.zone==='mz'){
      if(ctx.player!==gameState.activePlayer||!['main1','main2'].includes(gameState.phase)){ctx.reason='自分メインフェイズに発動します';return false;}
      if(ctx.card.v370FrogExtraTurn===gameState.turn){ctx.reason='③の効果はこのカードでこのターン使用済みです';return false;}
      if(!API.fieldCards({zone:'mz',player:ctx.player}).length){ctx.reason='手札に戻す自分のモンスターがいません';return false;}
      return true;
    }
    if(ctx.zone!=='hand'){ctx.reason='手札で発動します';return false;}
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}
    if(!handCandidates(ctx,x=>x.db.k==='m'&&x.db.at==='水').length){ctx.reason='捨てる他の水属性モンスターがありません';return false;}return true;
  },
  cost(ctx,done){
    /* S03-U64: ①（召喚・反転時の誘発）は ctx.zone も 'mz' になるため、eventName を先に見て
       ③（自発動のコスト）と混同しないようにする（元コードは zone だけで判定しており、
       ①発動時に誤って③のコスト（自分モンスターを手札へ戻す）を要求してしまうバグがあった）。 */
    if(['onNormalSummon','onSpecialSummon','onFlip'].includes(ctx.eventName)){ done(true); return; }
    if(ctx.zone==='mz'){
      API.selectCard('鬼ガエル：手札に戻す自分のモンスター',API.fieldCards({zone:'mz',player:ctx.player}),t=>{
        API.setCardFlag({card:ctx.card},'v370FrogExtraTurn',gameState.turn,'鬼ガエル',{silent:true});
        API.returnToHand(t,'鬼ガエル（③の発動コスト）'); done(true);
      });
      return;
    }
    if(ctx.zone!=='hand'||ctx.eventName!=='activate'){done(true);return;}
    API.selectCard('鬼ガエル：捨てる水属性モンスター',handCandidates(ctx,x=>x.db.k==='m'&&x.db.at==='水'),t=>{const r=resolveTarget(t);if(r)API.discard(ctx.player,r.index,'鬼ガエル（コスト）');done(true);});
  },
  selectTargets(ctx,done){ done([]); },
  resolve(ctx){
    if(['onNormalSummon','onSpecialSummon','onFlip'].includes(ctx.eventName)){
      /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ・フィールド）から選ぶ（S03-U58パターン）。
         候補がデッキ・フィールドの両方にまたがるため専用の登録ハンドラを使う。 */
      const pool=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&(x.db.lv||99)<=2&&x.db.ra==='水'&&x.db.at==='水')
        .concat(API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&x.card!==ctx.card&&x.db.k==='m'&&(x.db.lv||99)<=2&&x.db.ra==='水'&&x.db.at==='水'}));
      if(!pool.length)return;
      API.requestChoice({player:ctx.player,kind:'card',title:'鬼ガエル：墓地へ送るレベル2以下の水族・水属性',
        candidates:pool,min:1,max:1,cancelable:false,
        resume:{handler:'s03u63.oni-gaeru-to-grave',args:{player:ctx.player}},
        meta:{scriptName:'鬼ガエル'}});
      return;
    }
    if(ctx.zone==='mz'){
      const P=API.me(ctx);API.setFlag(ctx.player,'v370FrogExtraNormal',Number(P.temporaryFlags.v370FrogExtraNormal||0)+1,true);
      API.log('鬼ガエル：このターン「鬼ガエル」以外の「ガエル」を1度追加召喚できる');
      return;
    }
    const i=API.me(ctx).hand.indexOf(ctx.card);if(i>=0)API.specialSummon(ctx.player,'hand',i,'atk','鬼ガエル');
  },afterResolve(){},
  passive:{onNormalSummon(ctx){return ctx.zone==='mz';},onSpecialSummon(ctx){return ctx.zone==='mz';},onFlip(ctx){return ctx.zone==='mz';}}
});
API.registerChoiceHandler('s03u63.oni-gaeru-to-grave', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(!h || (h.zone!=='deck' && h.zone!=='mz')) return;
  if(h.zone==='deck') API.mill(args.player, h.index, '鬼ガエル');
  else API.sendToGrave(h, '鬼ガエル');
});

defineScript("粋カエル", {
  auditNote:"墓地からの自己特殊召喚と『S素材にできない』を自動化",
  cannotSynchroMaterial:true,
  type:'monster',priority:1,activateFrom:['grave'],timing:['mainPhase'],
  condition(ctx){if(ctx.zone!=='grave'||ctx.player!==gameState.activePlayer){ctx.reason='自分メインフェイズに墓地で発動します';return false;}if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}if(!API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&v350Frog(x.db)).length){ctx.reason='除外する「ガエル」が墓地にいません';return false;}return true;},
  cost(ctx,done){API.selectCard('粋カエル：除外する「ガエル」',API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&v350Frog(x.db)),t=>{API.banish(t,'粋カエル（コスト）');done(true);});},
  resolve(ctx){const i=API.me(ctx).grave.indexOf(ctx.card);if(i>=0)API.specialSummon(ctx.player,'grave',i,'def','粋カエル');},afterResolve(){},cannotSynchroMaterial:true
});

/* ============================== 防御札 ============================== */

defineScript("バトルフェーダー", {
  auditNote:"直接攻撃宣言→手札SS→Battle Phase終了→場を離れたら除外を自動化",
  includesSpecialSummon:true,
  blocksIfNoSpecialSummon:true,type:'monster',priority:2,quickEffect:true,activateFrom:['hand'],timing:['attackDeclare'],
  condition(ctx){const a=gameState.pendingAttack;if(ctx.zone!=='hand'||gameState.phase!=='battle'||!a||a.player!==ctx.opponent||a.targetUid!=null){ctx.reason='相手モンスターの直接攻撃宣言時に手札から発動します';return false;}if((gameState.chain||[]).some(l=>l&&l.name==='バトルフェーダー')){ctx.reason='同一チェーン上で複数回発動する事はできません';return false;}   /* S03-U49: 2011 FAQ 09/12/09 */if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}return true;},
  resolve(ctx){const i=API.me(ctx).hand.indexOf(ctx.card);if(i<0)return;API.specialSummon(ctx.player,'hand',i,'def','バトルフェーダー');const h=locateCard(ctx.card);if(h&&h.zone==='mz')API.setCardFlag({card:ctx.card},'banishWhenLeavesField',true,'バトルフェーダー',{silent:true});v350EndBattlePhase();},afterResolve(){}
});

defineScript("トラゴエディア", {
  auditNote:"①戦闘ダメージ時SS・②手札×600・③コントロール奪取・④レベルコピーを自動化",
  includesSpecialSummon:true,
  blocksIfNoSpecialSummon(ctx){return ctx.zone==='hand';},type:'monster',priority:1,activateFrom:['hand','mz'],dsTiming:'after',targets:true,
  condition(ctx){
    const b=ctx.battle||{};
    if(ctx.zone==='hand'){
      if(!b.damage||b.damage<=0||b.toPlayer!==ctx.player){ctx.reason='自分が戦闘ダメージを受けた時に手札から発動します';return false;}
      if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}return true;
    }
    if(ctx.zone!=='mz'||ctx.player!==gameState.activePlayer||!['main1','main2'].includes(gameState.phase)){ctx.reason='自分メインフェイズにフィールドで発動します';return false;}
    const foe=API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.face==='up'&&curLV(x.card)>0});
    const canControl=ctx.card.v370TragoControlTurn!==gameState.turn && API.me(ctx).hand.some(c=>{const lv=curLV(c);return lv>0&&foe.some(x=>curLV(x.card)===lv);});
    const canLevel=ctx.card.v370TragoLevelTurn!==gameState.turn && API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&curLV(x.card)>0).length>0;
    if(!canControl&&!canLevel){ctx.reason='③・④のどちらも現在は発動できません';return false;}
    return true;
  },
  cost(ctx,done){
    if(ctx.zone!=='mz'){done(true);return;}
    const foe=API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.face==='up'&&curLV(x.card)>0});
    const hand=API.me(ctx).hand.map((c,i)=>({p:ctx.player,zone:'hand',index:i,card:c,db:dbOf(c)}))
      .filter(x=>x.db.k==='m'&&curLV(x.card)>0&&foe.some(y=>curLV(y.card)===curLV(x.card)));
    const canControl=ctx.card.v370TragoControlTurn!==gameState.turn&&hand.length>0;
    const canLevel=ctx.card.v370TragoLevelTurn!==gameState.turn&&API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&curLV(x.card)>0).length>0;
    const chooseControl=()=>{
      API.selectCard('トラゴエディア③：墓地へ送る手札のモンスター',hand,t=>{
        const r=resolveTarget(t); if(!r){done(false);return;}
        ctx.v370Mode='control';ctx.v370DiscardLevel=curLV(r.card);API.setCardFlag({card:ctx.card},'v370TragoControlTurn',gameState.turn,'トラゴエディア',{silent:true});
        API.discard(ctx.player,r.index,'トラゴエディア③（コスト）');done(true);
      });
    };
    const chooseLevel=()=>{ctx.v370Mode='level';API.setCardFlag({card:ctx.card},'v370TragoLevelTurn',gameState.turn,'トラゴエディア',{silent:true});done(true);};
    if(canControl&&canLevel){API.confirm('トラゴエディア','効果を選んでください。<br>はい：③ 手札を墓地へ送りコントロール奪取<br>いいえ：④ 墓地モンスターのレベルをコピー',chooseControl,chooseLevel);return;}
    if(canControl){chooseControl();return;} chooseLevel();
  },
  selectTargets(ctx,done){
    if(ctx.zone==='hand'){done([]);return;}
    if(ctx.v370Mode==='control'){
      const lv=ctx.v370DiscardLevel;
      API.selectCard(`トラゴエディア③：レベル${lv}の相手モンスター`,API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.face==='up'&&curLV(x.card)===lv}),t=>done([{mode:'control',t}]));return;
    }
    API.selectCard('トラゴエディア④：レベルをコピーする墓地モンスター',API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&curLV(x.card)>0),t=>done([{mode:'level',t}]));
  },
  resolve(ctx){
    if(ctx.zone==='hand'){const i=API.me(ctx).hand.indexOf(ctx.card);if(i>=0)API.specialSummon(ctx.player,'hand',i,'atk','トラゴエディア');return;}
    const sel=ctx.selectedTargets[0];if(!sel)return;
    if(sel.mode==='control'){const t=resolveTarget(sel.t);if(t&&t.zone==='mz'&&t.card.face==='up')API.changeControl(t,ctx.player,'トラゴエディア③');return;}
    const t=resolveTarget(sel.t);if(!t)return;const lv=curLV(t.card),self=locateCard(ctx.card);if(!self||self.zone!=='mz')return;
    const delta=lv-curLV(ctx.card);if(delta)act({type:'FX_SET_STATE',player:self.p,zone:'mz',index:self.index,lvDelta:delta,reason:'トラゴエディア④'});
    ensureCardUid(gameState,ctx.card);API.setCardFlag({card:ctx.card},'v370TragoLevelResetTurn',gameState.turn,'トラゴエディア',{silent:true});
    API.registerReserveEffect(ctx.player,'トラゴエディア④：レベルを元に戻す','endPhase','',{kind:'levelResetUids',uids:[ctx.card.uid],flagKey:'v370TragoLevelResetTurn'});
  },afterResolve(){},
  passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='hand'&&ctx.step==='after'&&b.damage>0&&b.toPlayer===ctx.player;}},
  continuous:{scope:'self',from:['mz'],apply(card,self,info){if(card!==self)return null;const n=gameState.players[info.p].hand.length;return {atk:n*600,def:n*600};}}
});

defineScript("ブラック・ローズ・ドラゴン", {
  auditNote:"①S召喚成功時の全体破壊、②植物族除外→守備モンスターを攻撃表示・ATK0を自動化",
  type:'synchro',priority:1,targets:true,timing:['mainPhase'],
  condition(ctx){
    const e=ctx.event||{};
    if(ctx.eventName==='onSpecialSummon'){
      if(e.card!==ctx.card||e.kind!=='synchro'){ctx.reason='このカードのS召喚成功時に発動します';return false;}
      return true;
    }
    if(ctx.zone!=='mz'||ctx.player!==gameState.activePlayer||!['main1','main2'].includes(gameState.phase)){ctx.reason='自分メインフェイズに発動します';return false;}
    if(ctx.card.v360Rose2Turn===gameState.turn){ctx.reason='②の効果はこのターン使用済みです';return false;}
    if(!API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&x.db.ra==='植物').length){ctx.reason='墓地に除外できる植物族モンスターがいません';return false;}
    if(!API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.pos==='def'}).length){ctx.reason='相手フィールドに守備表示モンスターがいません';return false;}
    return true;
  },
  cost(ctx,done){
    if(ctx.eventName==='onSpecialSummon'){done(true);return;}
    API.selectCard('ブラック・ローズ・ドラゴン：除外する植物族',API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&x.db.ra==='植物'),t=>{API.banish(t,'ブラック・ローズ・ドラゴン（コスト）');done(true);});
  },
  selectTargets(ctx,done){
    if(ctx.eventName==='onSpecialSummon'){done([]);return;}
    API.selectCard('ブラック・ローズ・ドラゴン：攻撃表示にする守備モンスター',API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.pos==='def'}),t=>done([t]));
  },
  resolve(ctx){
    if(ctx.eventName==='onSpecialSummon'){
      API.destroyAll('mz',null,'ブラック・ローズ・ドラゴン');API.destroyAll('sz',null,'ブラック・ローズ・ドラゴン');API.destroyAll('field',null,'ブラック・ローズ・ドラゴン');return;
    }
    const t=ctx.selectedTargets[0];if(!t)return;
    API.setCardFlag({card:ctx.card},'v360Rose2Turn',gameState.turn,'ブラック・ローズ・ドラゴン',{silent:true});
    if(t.card.face==='down')API.flip(t,'up','ブラック・ローズ・ドラゴン');
    API.changePosition(t,'atk','ブラック・ローズ・ドラゴン');
    const a=curATK(t.card);if(a)API.modAtk(t,-a,0,'endTurn','ブラック・ローズ・ドラゴン');
  },afterResolve(){},
  passive:{onSpecialSummon(ctx){const e=ctx.event||{};return ctx.zone==='mz'&&e.card===ctx.card&&e.kind==='synchro';}}
});

/* ============================== X-Saber ============================== */

defineScript("XX－セイバー フォルトロール", {
  type:'monster',priority:1,countLimit:1,targets:true,timing:['mainPhase'],
  summonProcedure:{from:'hand',positions:['atk','def'],condition(ctx){if(v350FaceUpOwn(ctx.player,x=>v350XSaber(x.card)).length<2){ctx.reason='自分フィールドに「X－セイバー」が2体以上必要です';return false;}return true;}},
  condition(ctx){if(ctx.zone!=='mz'||ctx.player!==gameState.activePlayer){ctx.reason='自分メインフェイズに発動します';return false;}const p=API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&v350XSaber(x.card)&&(x.db.lv||99)<=4);if(!p.length){ctx.reason='墓地にレベル4以下の「X－セイバー」がいません';return false;}if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('フォルトロール：特殊召喚するレベル4以下のX－セイバー',API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&v350XSaber(x.card)&&(x.db.lv||99)<=4),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.specialSummon(ctx.player,'grave',t.index,'atk','XX－セイバー フォルトロール');},afterResolve(){}
});

defineScript("XX－セイバー エマーズブレイド", {
  type:'monster',priority:1,dsTiming:'leave',
  condition(ctx){if(ctx.eventName!=='onBattleDestroy'||ctx.zone!=='grave'){ctx.reason='戦闘で破壊され墓地へ送られた時に発動します';return false;}const p=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&v350XSaber(x.card)&&(x.db.lv||99)<=4);if(!p.length){ctx.reason='デッキにレベル4以下の「X－セイバー」がいません';return false;}if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}return true;},
  selectTargets(ctx,done){ done([]); },
  resolve(ctx){
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const pool=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&v350XSaber(x.card)&&(x.db.lv||99)<=4);
    if(!pool.length)return;
    API.requestChoice({player:ctx.player,kind:'card',title:'エマーズブレイド：特殊召喚するX－セイバー',
      candidates:pool,min:1,max:1,cancelable:false,
      resume:{handler:'s03u58.deck-special',args:{player:ctx.player,pos:'atk',reason:'XX－セイバー エマーズブレイド'}},
      meta:{scriptName:'XX－セイバー エマーズブレイド'}});
  },afterResolve(){},
  passive:{onBattleDestroy(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card;}}
});

defineScript("X－セイバー エアベルン", {
  type:'monster',priority:1,forced:true,dsTiming:'after',
  condition(ctx){const b=ctx.battle||{};return b.atkCard===ctx.card&&b.target==='direct'&&b.damage>0&&API.foe(ctx).hand.length>0;},
  resolve(ctx){const H=API.foe(ctx).hand;if(!H.length)return;const i=(typeof duelRandomInt==='function'?duelRandomInt(H.length):Math.floor(Math.random()*H.length));API.discard(ctx.opponent,i,'X－セイバー エアベルン',{byEffect:true,byPlayer:ctx.player});},afterResolve(){},
  passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.step==='after'&&b.atkCard===ctx.card&&b.target==='direct'&&b.damage>0&&API.foe(ctx).hand.length>0;}}
});

defineScript("XX－セイバー ヒュンレイ", {
  auditNote:"S召喚成功時、魔法・罠カードを3枚まで選んで破壊を自動化",
  type:'synchro',priority:1,targets:true,
  condition(ctx){const e=ctx.event||{};if(ctx.eventName!=='onSpecialSummon'||e.card!==ctx.card||e.kind!=='synchro'){ctx.reason='このカードのS召喚成功時に発動します';return false;}if(!v350FieldST().length){ctx.reason='魔法・罠カードがありません';return false;}return true;},
  selectTargets(ctx,done){
    const chosen=[];
    const pick=()=>{
      const used=new Set(chosen.map(x=>x.card));
      const pool=v350FieldST().filter(x=>!used.has(x.card));
      if(!pool.length||chosen.length>=3){done(chosen);return;}
      API.selectCard(`XX－セイバー ヒュンレイ：破壊する魔法・罠（${chosen.length+1}/3）`,pool,t=>{
        chosen.push(t);
        if(chosen.length>=3){done(chosen);return;}
        const remain=v350FieldST().filter(x=>!chosen.some(y=>y.card===x.card));
        if(!remain.length){done(chosen);return;}
        API.confirm('XX－セイバー ヒュンレイ',`${chosen.length}枚選択しました。さらに選びますか？`,pick,()=>done(chosen));
      });
    };
    pick();
  },
  resolve(ctx){ctx.selectedTargets.slice().reverse().forEach(t=>API.destroy(t,'XX－セイバー ヒュンレイ'));},afterResolve(){},
  passive:{onSpecialSummon(ctx){const e=ctx.event||{};return ctx.zone==='mz'&&e.card===ctx.card&&e.kind==='synchro'&&v350FieldST().length>0;}}
});

/* ============================== Machina ============================== */

defineScript("マシンナーズ・ギアフレーム", {
  auditNote:"①召喚時のマシンナーズサーチを自動化。②ユニオン装備/解除は未自動化",
  type:'monster',priority:1,
  condition(ctx){if(ctx.eventName!=='onNormalSummon'||ctx.zone!=='mz'){ctx.reason='召喚成功時に発動します';return false;}const p=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&x.db.n!=='マシンナーズ・ギアフレーム'&&String(x.db.n||'').indexOf('マシンナーズ')>=0);if(!p.length){ctx.reason='デッキに他の「マシンナーズ」がいません';return false;}return true;},
  selectTargets(ctx,done){ done([]); },
  resolve(ctx){
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const pool=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&x.db.n!=='マシンナーズ・ギアフレーム'&&String(x.db.n||'').indexOf('マシンナーズ')>=0);
    if(!pool.length)return;
    API.requestChoice({player:ctx.player,kind:'card',title:'ギアフレーム：手札に加えるマシンナーズ',
      candidates:pool,min:1,max:1,cancelable:false,
      resume:{handler:'s03u58.deck-search',args:{player:ctx.player,reason:'マシンナーズ・ギアフレーム'}},
      meta:{scriptName:'マシンナーズ・ギアフレーム'}});
  },afterResolve(){},passive:{onNormalSummon(ctx){return ctx.zone==='mz';}}
});

defineScript("マシンナーズ・フォートレス", {
  auditNote:"①手札機械族Lv合計8以上を捨てて手札/墓地から特殊召喚、③戦闘破壊時の相手カード破壊を自動化。②対象を取る相手モンスター効果へのハンデスは次段階",
  type:'monster',priority:1,forced:true,targets:true,dsTiming:'leave',
  summonProcedure:{
    from:['hand','grave'],positions:['atk','def'],
    condition(ctx){
      const total=API.me(ctx).hand.reduce((sum,c)=>{const d=dbOf(c);return sum+(d.k==='m'&&d.ra==='機械'?Math.max(0,curLV(c)):0);},0);
      if(total<8){ctx.reason='手札の機械族モンスターのレベル合計が8以上必要です';return false;}return true;
    },
    cost(ctx,done){
      const chosen=[];
      const pick=()=>{
        const total=chosen.reduce((sum,t)=>sum+curLV(t.card),0);
        if(total>=8){
          chosen.forEach(t=>{const r=resolveTarget(t);if(r&&r.zone==='hand')API.discard(ctx.player,r.index,'マシンナーズ・フォートレス（特殊召喚手順）');});
          done(true);return;
        }
        const used=new Set(chosen.map(x=>x.card));
        const pool=API.me(ctx).hand.map((c,i)=>({p:ctx.player,zone:'hand',index:i,card:c,db:dbOf(c)})).filter(x=>x.db.k==='m'&&x.db.ra==='機械'&&!used.has(x.card));
        if(!pool.length){done(false);return;}
        API.selectCard(`フォートレス：捨てる機械族（合計${total}/8以上）`,pool,t=>{chosen.push(t);pick();},'自身を捨てた場合は墓地からそのまま特殊召喚できます');
      };
      pick();
    }
  },
  condition(ctx){if(ctx.eventName!=='onBattleDestroy'||ctx.zone!=='grave'){ctx.reason='戦闘で破壊され墓地へ送られた時に発動します';return false;}if(!API.fieldCards({player:ctx.opponent}).length){ctx.reason='相手フィールドにカードがありません';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('マシンナーズ・フォートレス：破壊する相手カード',API.fieldCards({player:ctx.opponent}),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.destroy(t,'マシンナーズ・フォートレス');},afterResolve(){},passive:{onBattleDestroy(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card&&API.fieldCards({player:ctx.opponent}).length>0;}}
});

defineScript("BF－暁のシロッコ", {
  type:'monster',priority:1,countLimit:1,targets:true,timing:['mainPhase'],
  normalSummonProcedure:{includeStandard:true,methods:[{id:'sirocco0',tributes:0,modes:['summon'],summonLabel:'相手だけにモンスターがいるためリリースなしで召喚',condition({player}){return gameState.players[player].mz.length===0&&gameState.players[player===0?1:0].mz.length>0;}}]},
  condition(ctx){if(ctx.zone!=='mz'||ctx.player!==gameState.activePlayer||gameState.phase!=='main1'){ctx.reason='自分メインフェイズ1に発動します';return false;}if(!v350FaceUpOwn(ctx.player,x=>v350BF(x.card)).length){ctx.reason='自分フィールドに表側表示の「BF」が必要です';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('BF－暁のシロッコ：攻撃力を集めるBF',v350FaceUpOwn(ctx.player,x=>v350BF(x.card)),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(!t)return;const others=v350FaceUpOwn(ctx.player,x=>v350BF(x.card)&&x.card!==t.card);const gain=others.reduce((n,x)=>n+curATK(x.card),0);if(gain)API.modAtk(t,gain,0,'endTurn','BF－暁のシロッコ');ensureCardUid(gameState,t.card);API.setFlag(ctx.player,'v350OnlyAttackerUid',t.card.uid,true);},afterResolve(){}
});

defineScript("BF－アーマード・ウィング", {
  auditNote:"①戦闘破壊耐性/自分への戦闘ダメージ0、②楔カウンター、③楔モンスター攻守0を自動化",
  type:'synchro',priority:1,battleProof:true,dsTiming:'end',timing:['damageStep','mainPhase'],
  condition(ctx){
    if(ctx.eventName==='onDamageStep'){const b=ctx.battle||{};return b.atkCard===ctx.card&&b.target!=='direct'&&!!b.defCard&&(!(b.defCard.counters)||!(b.defCard.counters['楔']||0));}
    const opp=API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.counters&&(x.card.counters['楔']||0)>0});if(!opp.length){ctx.reason='相手フィールドに楔カウンターがありません';return false;}return true;
  },
  resolve(ctx){
    if(ctx.eventName==='onDamageStep'){const b=ctx.battle||{};const r=b.defCard?locateCard(b.defCard):null;if(r)API.addCounter({p:r.p,zone:r.zone,index:r.index},'楔',1);return;}
    const opp=API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.counters&&(x.card.counters['楔']||0)>0});opp.forEach(t=>{const a=curATK(t.card),d=curDEF(t.card),n=(t.card.counters&&t.card.counters['楔'])||0;if(n)API.removeCounter(t,'楔',n);API.modAtk(t,-a,-d,'endTurn','BF－アーマード・ウィング');});
  },afterResolve(){},
  passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.step==='end'&&b.atkCard===ctx.card&&b.target!=='direct'&&!!b.defCard&&(!(b.defCard.counters)||!(b.defCard.counters['楔']||0));}},
  continuous:{scope:'self',from:['mz'],apply(){return null;},battleDamage(info){if((info.atkCard===info.self||info.defCard===info.self)&&info.to===info.srcPlayer)return 0;return info.amount;}}
});
