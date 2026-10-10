/* S03-U82 — A・O・J ディサイシブ・アームズ (Six Samurai main deck, NOT_STARTED, no flagged engine gap).
   Priority #7 (continuing S03-U79/U80/U81's cross-reference pass). Real text (this project's own card
   database, printed 2009-07-01, within cutoff), DARK Machine Synchro Effect Monster, Level 10 (Tuner + 2 or
   more non-Tuner monsters, no archetype-name restriction):
   ①: if your opponent controls a face-up LIGHT monster, once per turn you can activate 1 of the following:
      ●: select 1 set card your opponent controls and destroy it.
      ●: send 1 card from your hand to the GY; destroy all Spell/Trap Cards your opponent controls.
      ●: send your entire hand to the GY; check your opponent's hand and send all LIGHT monsters among them
         to the GY, then inflict damage to your opponent equal to the total ATK of the monsters sent to the
         GY by this effect.

   Reuses the established P1.1 "choose 1 of N modes, then a mode-specific follow-up" pattern (precedent: 竜の
   渓谷, cards/89_p11_activation_choice_recovery.js's own p11cards.mode/cost-commit/commit-targets registered
   handlers) — mode ① opens a real targeting choice, mode ② opens a real cost-discard choice
   (p11cards.cost-commit), mode ③ pays its own "discard your entire hand" cost directly (matching the
   established "手札を全て墓地へ" precedent, cards/20_control_counter.js's own 闇の誘惑) since there is
   nothing to choose (every card goes). The opponent's-hand inspection in mode ③'s resolution reuses the same
   direct-array-scan already established for マインドクラッシュ (cards/00_generic_core.js) — this engine keeps
   full server-side state, so no separate "reveal" primitive is needed to read foe.hand. */

function u82AojLight(ctx){
  return API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'&&x.db.at==='光'}).length>0;
}
function u82AojSetCards(opp){
  return API.fieldCards({player:opp,filter:x=>(x.zone==='sz'||x.zone==='field')&&x.card.face==='down'});
}

API.registerChoiceHandler('u82.aoj-mode',(answer,args)=>{
  if(answer.cancelled) return p11cAbort(args.activation);
  const m=answer.cards&&answer.cards[0]&&answer.cards[0].value;
  if(!m) return p11cAbort(args.activation);
  args.activation.v4EffectKey=String(m);
  const p=args.activation.player, opp=p===0?1:0;
  if(m==='destroy-set'){
    p11cOpen(args.activation,{title:'A・O・J ディサイシブ・アームズ：破壊するセットカード',
      candidates:u82AojSetCards(opp),targeting:true},'p11cards.commit-targets',{});
    return;
  }
  if(m==='wipe-st'){
    p11cOpen(args.activation,{title:'A・O・J ディサイシブ・アームズ：墓地へ送る手札',
      candidates:API.pileCards(p,'hand')},'p11cards.cost-commit',{costKind:'discard',move:'discard'});
    return;
  }
  /* mode 'mill-light': 手札を全て墓地へ送る（選ぶ余地が無いコストなので、ここで直接払う）。 */
  const P=gameState.players[p], hand=(P.hand||[]).slice();
  if(hand.length){
    API.recordActivationCost(p11cCtx(p),'hand-send',hand.map(c=>({card:c})),[],hand.length);
    for(let i=hand.length-1;i>=0;i--) API.sendHandToGrave(p,i,'A・O・J ディサイシブ・アームズ（コスト）');
  }
  p11cCommit(args.activation,[]);
});

defineScript('A・O・J ディサイシブ・アームズ',{
  type:'synchro',priority:1,countLimit:1,timing:['mainPhase'],targets:true,destroysFieldV46:true,
  condition(ctx){
    if(!as01Face(ctx)){ ctx.reason='表側表示でフィールドに存在する必要があります'; return false; }
    if(!u82AojLight(ctx)){ ctx.reason='相手フィールド上に光属性モンスターが存在する場合に発動できます'; return false; }
    return true;
  },
  activationV11(ctx,d){
    const opp=ctx.opponent;
    const modes=[
      {key:'destroy-set',label:'相手のセットカード1枚を破壊する',value:'destroy-set'},
      {key:'wipe-st',label:'手札を1枚捨てて相手の魔法・罠を全て破壊する',value:'wipe-st'},
      {key:'mill-light',label:'手札を全て捨てて相手の光属性モンスターを墓地へ送りダメージを与える',value:'mill-light'}
    ].filter(m=>m.key!=='destroy-set'||u82AojSetCards(opp).length>0);
    p11cOpen(d,{kind:'mode',title:'A・O・J ディサイシブ・アームズ：効果を選択',candidates:modes,targeting:false},
      'u82.aoj-mode',{});
  },
  resolve(ctx){
    const key=ctx.v4EffectKey;
    if(key==='destroy-set'){
      const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
      if(t) API.destroy(t,'A・O・J ディサイシブ・アームズ');
      return;
    }
    if(key==='wipe-st'){
      API.fieldCards({player:ctx.opponent,filter:x=>x.zone==='sz'||x.zone==='field'}).slice()
        .forEach(t=>API.destroy(t,'A・O・J ディサイシブ・アームズ'));
      return;
    }
    if(key==='mill-light'){
      const foeLight=API.pileCards(ctx.opponent,'hand',x=>x.db.k==='m'&&x.db.at==='光');
      if(!foeLight.length) return;
      const sum=foeLight.reduce((s,x)=>s+(Number(x.db.atk)||0),0);
      foeLight.map(x=>x.index).sort((a,b)=>b-a).forEach(i=>API.discard(ctx.opponent,i,'A・O・J ディサイシブ・アームズ'));
      API.damageLP(ctx.opponent,sum,'A・O・J ディサイシブ・アームズ');
      return;
    }
  },
  afterResolve(){}
});
