/* =========================================================================
   System P1.1 — Activation-time Choice / Declaration / Cost identity
   -------------------------------------------------------------------------
   発動時に確定した宣言・モード・コストidentityを、P1 ChoiceRequest と
   JSONだけで保持する。対象は既存 link.targets、モードは v4EffectKey、
   数値snapshotは P3 snapshotCardV3 をそのまま使う。
   ========================================================================= */

const P11_DECLARATION_KINDS = Object.freeze(['cardName','attribute','race','level','cardType','mode']);

function ensureActivationChoiceStateV11(gs){
  gs=gs||gameState; if(!gs) return;
  if(gs.pendingDeclarationV11===undefined) gs.pendingDeclarationV11=null;
  if(!Array.isArray(gs.pendingActivationCostV11)) gs.pendingActivationCostV11=[];
}

function normalizeDeclarationV11(kind,value,turn){
  kind=String(kind||'');
  if(P11_DECLARATION_KINDS.indexOf(kind)<0) return null;
  if(value===undefined || value===null) return null;
  if(kind==='level'){
    value=Number(value);
    if(!Number.isFinite(value)) return null;
  }else value=String(value);
  const out={kind,value};
  if(turn!=null) out.turn=Number(turn)||0;
  return out;
}

function activationLinkForContextV11(ctx,gs){
  gs=gs||gameState; if(!gs) return null;
  if(ctx&&ctx.chainId!=null){
    const hit=(gs.chain||[]).find(x=>x&&x.chainId===ctx.chainId);
    if(hit) return hit;
    /* S03-U14: 解決中のリンクは gs.chain から外れているので、解決コンテキストが持つリンクそのものを使う。 */
    return (ctx.chainLink&&ctx.chainLink.chainId===ctx.chainId)?ctx.chainLink:null;
  }
  if(ctx&&ctx.chainLink) return ctx.chainLink;
  return (gs.chain||[])[(gs.chain||[]).length-1]||null;
}

function declaredValueV11(ctx,kind,gs){
  gs=gs||gameState; ensureActivationChoiceStateV11(gs);
  const link=activationLinkForContextV11(ctx,gs);
  const d=(link&&link.declaration)||gs.pendingDeclarationV11;
  return d&&(!kind||d.kind===kind)?d.value:null;
}

function persistentDeclarationValueV11(card,kind){
  const d=card&&card.declaration;
  return d&&(!kind||d.kind===kind)?d.value:null;
}

function activationCostsV11(ctx,kind,gs){
  gs=gs||gameState; ensureActivationChoiceStateV11(gs);
  const link=activationLinkForContextV11(ctx,gs);
  const list=(link&&Array.isArray(link.activationCost))?link.activationCost:gs.pendingActivationCostV11;
  return (list||[]).filter(x=>x&&(!kind||x.kind===kind)).map(x=>JSON.parse(JSON.stringify(x)));
}

function resolveCostCardV11(target,gs){
  gs=gs||gameState;
  if(!target) return null;
  const c=target.card||target;
  if(c&&c.uid!=null){
    const h=findCardByUidInState(gs,c.uid);
    return h&&h.card||c;
  }
  return c&&typeof c==='object'?c:null;
}

function makeActivationCostRecordV11(kind,targets,fields,amount,gs){
  gs=gs||gameState; ensureActivationChoiceStateV11(gs);
  const cards=(Array.isArray(targets)?targets:(targets?[targets]:[])).map(t=>resolveCostCardV11(t,gs)).filter(Boolean);
  const refs=[],snapshots=[];
  cards.forEach(c=>{
    ensureCardUid(gs,c); refs.push(c.uid);
    if(typeof snapshotCardV3==='function'){
      const s=snapshotCardV3(c,Array.isArray(fields)?fields:[]);
      if(s) snapshots.push(s);
    }
  });
  return {kind:String(kind||'cost'),refs,snapshots,amount:amount!=null?Number(amount):(refs.length||0)};
}

function recordActivationCostV11(ctx,kind,targets,fields,amount){
  const rec=makeActivationCostRecordV11(kind,targets,fields,amount,gameState);
  act({type:'DECLARE_V11',player:ctx&&ctx.player!=null?ctx.player:gameState.activePlayer,
    activationCost:rec,p3Snapshots:JSON.parse(JSON.stringify(rec.snapshots||[]))});
  return rec;
}

function clearActivationChoiceV11(player){
  act({type:'DECLARE_V11',player:player!=null?player:gameState.activePlayer,clear:true});
}

function p11StampChainAddV11(a,gs){
  if(!a||a.type!=='CHAIN_ADD') return a;
  gs=gs||gameState; ensureActivationChoiceStateV11(gs);
  if(a.declaration===undefined && gs.pendingDeclarationV11){
    a.declaration=JSON.parse(JSON.stringify(gs.pendingDeclarationV11));
  }
  if(a.activationCost===undefined && gs.pendingActivationCostV11.length){
    a.activationCost=JSON.parse(JSON.stringify(gs.pendingActivationCostV11));
  }
  return a;
}

function chainLinkTargetsV11(chainId,gs){
  gs=gs||gameState;
  const link=(gs.chain||[]).find(x=>x&&x.chainId===chainId);
  if(!link) return [];
  const restored=deserializeChainSelectionV2(link.targets||link.selection||[]);
  return Array.isArray(restored)?restored:[];
}

function declarationCandidatesV11(kind,options){
  let values=Array.isArray(options)?options.slice():[];
  if(!values.length){
    if(kind==='attribute') values=['闇','光','地','水','炎','風','神'];
    else if(kind==='level') values=Array.from({length:12},(_,i)=>i+1);
    else if(kind==='cardType') values=['モンスター','魔法','罠'];
    else if(kind==='race') values=Array.from(new Set((typeof CARD_DB!=='undefined'?CARD_DB:[]).map(x=>x&&x.ra).filter(Boolean))).sort();
    else if(kind==='cardName') values=(typeof CARD_DB!=='undefined'?CARD_DB:[]).map(x=>x&&x.n).filter(Boolean);
  }
  return values.map((v,i)=>{
    if(v&&typeof v==='object'&&!Array.isArray(v)) return Object.assign({key:`d${i}`},v);
    return {key:`d${i}`,label:String(v),value:v};
  });
}

function dispatchP11ResumeV11(resume,answer,args){
  if(!resume||!resume.handler) return;
  const fn=CHOICE_HANDLERS_V49[resume.handler];
  if(!fn) throw new Error(`P1.1 resume handler not found: ${resume.handler}`);
  fn(answer,Object.assign({},resume.args||{},args||{}),gameState);
}

function abortPreparedActivationV11(desc){
  if(desc&&desc.persistDeclarationUid!=null){
    act({type:'DECLARE_V11',player:desc.player,clearPersistUid:desc.persistDeclarationUid});
  }
  clearActivationChoiceV11(desc&&desc.player);
  if(desc&&desc.abortReturnToHand&&desc.uid!=null){
    const h=findCardByUid(desc.uid);
    if(h&&(h.zone==='sz'||h.zone==='field')) act({type:'MOVE',player:h.p,from:h.zone,fromIndex:h.index,to:'hand',face:'up'});
  }
  if(typeof completeEventSelectionV11==='function')completeEventSelectionV11(desc,false);
}

registerChoiceHandlerV49('p11.declare',(answer,args)=>{
  if(answer.cancelled){ abortPreparedActivationV11(args&&args.activation); return; }
  const picked=answer.cards&&answer.cards[0];
  const d=normalizeDeclarationV11(args.kind,picked&&picked.value,gameState.turn);
  if(!d){ abortPreparedActivationV11(args&&args.activation); return; }
  act({type:'DECLARE_V11',player:args.player,kind:d.kind,value:d.value,persistUid:args.persistUid||null});
  dispatchP11ResumeV11(args.nextResume,answer,{activation:args.activation,declaration:d});
});

function requestDeclarationV11(ctx,kind,options,resume,persistCard){
  const persistUid=persistCard?(persistCard.uid!=null?persistCard.uid:ensureCardUid(gameState,persistCard)):null;
  if(persistUid!=null && options&&options.activation) options.activation.persistDeclarationUid=persistUid;
  return requestChoiceV49({
    player:ctx&&ctx.player!=null?ctx.player:gameState.activePlayer,
    kind:'declare',title:(options&&options.title)||'宣言',note:(options&&options.note)||'',
    candidates:declarationCandidatesV11(kind,options&&options.values),min:1,max:1,cancelable:!(options&&options.cancelable===false),
    resume:{handler:'p11.declare',args:{player:ctx&&ctx.player!=null?ctx.player:gameState.activePlayer,kind,persistUid,
      activation:options&&options.activation||null,nextResume:resume||null}},
    meta:{v4EffectKey:ctx&&ctx.v4EffectKey||null,chainId:ctx&&ctx.chainId!=null?ctx.chainId:null,scriptName:ctx&&ctx.card?cardName(ctx.card):null}
  });
}

function assertActivationContextSerializableV11(gs){
  gs=gs||gameState; ensureActivationChoiceStateV11(gs);
  return choiceJsonSafetyV49({declaration:gs.pendingDeclarationV11,costs:gs.pendingActivationCostV11},'activationContextV11');
}
