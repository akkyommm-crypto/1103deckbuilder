/* Codex U542-U544: fixed-seed real DUEL and Replay helpers, based on U541. */
module.exports=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function pu(uid){const h=findCardByUid(uid);return h?h.p:null;}
function cu(uid){const h=findCardByUid(uid);return h?h.card:null;}
function nmOf(c){return c?cardName(c):null;}
let PREFER=[], TITLES=[];
function pick(){
  const q=pc(); TITLES.push(String(q.title||''));
  if(q.max>1||q.min!==q.max){
    let selected=(q.candidates||[]).filter(x=>PREFER.some(w=>x.uid===w||x.key===w||x.label===w)); if(selected.length<q.min)selected=(q.candidates||[]).slice(0,q.min); answerChoiceV49(selected.slice(0,q.max).map(x=>x.key));
    return;
  }
  let j=-1;
  for(const want of PREFER){
    j=(q.candidates||[]).findIndex(x=>x && (x.uid===want || x.key===want || x.value===want || x.label===want));
    if(j>=0) break;
  }
  __choicePickV49(j>=0?j:0);
}
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}
  try{DESTROY_SUB_BATCH_S03=null;}catch(e){}}
function fresh(){resetA();resetVolatile();TOASTS.length=0;PREFER=[];TITLES=[];SNAP=[];WATCH=null;
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setc(n,p){const c=mk(n,p,'down');c.setTurn=0;return c;}
function condOf(name,key,p,zone,index){
  const card=zoneCard(gameState.players[p],zone,index);
  const e=nativeEffectsV4(name).find(x=>x.key===key);
  if(!card||!e) return 'MISSING';
  const ctx=makeContext(p,card,zone,index,'legalCheck',{v4EffectKey:key});
  try{ return !!e.condition(ctx); }catch(err){ return 'ERR'; }
}
/* 戦闘中に engine が何を出したか／何が合法だったかを記録する（S03-U144 のテストと同じ作り） */
let SNAP=[],WATCH=null;
const __gcrS541=getChainResponsesV2;
getChainResponsesV2=function(p){const r=__gcrS541.apply(this,arguments);
  if(gameState.pendingAttack||gameState.battle){const e={p,names:r.map(x=>x.db.n)};
    if(WATCH&&WATCH.p===p) e.L=strictScriptLegalityV2(WATCH.name,WATCH.p,WATCH.zone,WATCH.idx,{});
    SNAP.push(e);}
  return r;};
function lockedBy(name){return SNAP.some(e=>e.L&&e.L.ok===false&&new RegExp(name).test(e.L.reason||''));}
function offeredDuring(p,name){return SNAP.filter(e=>e.p===p).some(e=>e.names.indexOf(name)>=0);}
function drive(){
  for(let i=0;i<900;i++){
    if(pc()){pick();continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
    if(typeof BATTLE_COMMAND_V29!=='undefined'&&BATTLE_COMMAND_V29&&BATTLE_COMMAND_V29.mode==='replayTarget'){
      battleReplayCancelV28();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();continue;}
    return 'idle';}
  return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);return drive();}
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function useCard(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function useKey(p,c,key){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{v4EffectKey:key});return drive();}
function respondZone(p,c){for(let i=0;i<40&&pc();i++)pick();const h=findCardByUid(c.uid);duelActivateResponseV2(p,h.zone,h.index,p);for(let i=0;i<40&&pc();i++)pick();return true;}
function mzIdx(p,uid){return (gameState.players[p].mz||[]).findIndex(c=>c&&c.uid===uid);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;
