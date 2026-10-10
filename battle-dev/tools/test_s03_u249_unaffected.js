/* S03-U249: 「…の効果を受けない」 — 天下人 紫炎, トラファスフィア, 暴君の威圧 (S03-U115 unaffected; continuous.grantUnaffectedS03).
   Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function lp(p){return gameState.players[p].lp;}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
/* attack, let the defender activate its Set Trap in the attack-declaration window */
function attackIntoTrap(atkIdx){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx,target:'direct'});
  for(let i=0;i<50;i++){ if(toWindow()){ if(offered(1,trapC)){ duelActivateResponseV2(1,'sz',0); } else chainPassV2(); } else break; }
  drive();
}
let trapC=null;

/* ===== A: 天下人 紫炎 — unaffected by Trap effects (聖なるバリア －ミラーフォース－ destroys the other attacker-side monster, not it) ===== */
fresh();
let sh=mk('天下人 紫炎',0,'up'),wt=mk('ワイト',0,'up');trapC=setT('聖なるバリア －ミラーフォース－',1);
gameState.players[0].mz=[sh,wt];gameState.players[1].sz=[trapC];gameState.phase='battle';baselineA();
attackIntoTrap(0);
ok('A: ミラーフォース activated — ワイト destroyed, 天下人 紫炎 stays',z(trapC)==='grave'&&z(wt)==='grave'&&z(sh)==='mz',JSON.stringify({trap:z(trapC),wt:z(wt),sh:z(sh)}));
audit('A');
fresh();
sh=mk('天下人 紫炎',0,'up');let bh=mk('ブラック・ホール',0);gameState.players[0].mz=[sh];gameState.players[0].hand=[bh];baselineA();
duelActivateFromHand(0);drive();
ok('A2: a Spell (ブラック・ホール) still destroys it',z(sh)==='grave');
audit('A2');

/* ===== B: トラファスフィア — Tribute Summon only with a Winged Beast; face-up it is unaffected by Trap effects ===== */
fresh();
let tf=mk('トラファスフィア',0),hl=mk('ハーピィ・レディ',0,'up'),w2=mk('ワイト',0,'up');
gameState.players[0].hand=[tf];gameState.players[0].mz=[w2,hl];baselineA();
const ms=normalSummonMethodsFor(dbOf(C(tf)),0,'summon');
const cands=ms.length?tributeCandidatesForV23(0,dbOf(C(tf)),ms[0],'summon').map(x=>cardName(x.card)):[];
ok('B: only a Winged Beast can be released (ハーピィ・レディ, not ワイト)',ms.length===1&&cands.length===1&&cands[0]==='ハーピィ・レディ',JSON.stringify({ms:ms.map(m=>m.id),cands}));
PREFER=[hl.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('B: Tribute Summoned with ハーピィ・レディ',z(tf)==='mz'&&z(hl)==='grave'&&z(w2)==='mz',JSON.stringify({tf:z(tf),hl:z(hl)}));
trapC=setT('聖なるバリア －ミラーフォース－',1);gameState.players[1].sz=[trapC];gameState.phase='battle';ensureAllCardUids(gameState);baselineA();
attackIntoTrap(findCardByUid(tf.uid).index);
ok('B: ミラーフォース — ワイト destroyed, トラファスフィア stays',z(trapC)==='grave'&&z(w2)==='grave'&&z(tf)==='mz',JSON.stringify({w2:z(w2),tf:z(tf)}));
audit('B');

/* ===== C: 暴君の威圧 — release 1 (cost); monsters its controller owns are unaffected by other Trap effects ===== */
fresh();
let ty=setT('暴君の威圧',0),rl=mk('ワイト',0,'up'),gb=mk('青眼の白龍',0,'up'),gx=mk('ギル・ガース',0,'up');
gameState.players[0].sz=[ty];gameState.players[0].mz=[rl,gb,gx];baselineA();
PREFER=[rl.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('C: activated — ワイト released (cost); 暴君の威圧 stays face-up',z(rl)==='grave'&&z(ty)==='sz'&&C(ty).face==='up',JSON.stringify({rl:z(rl),ty:z(ty)}));
trapC=setT('聖なるバリア －ミラーフォース－',1);gameState.players[1].sz=[trapC];gameState.phase='battle';ensureAllCardUids(gameState);baselineA();
attackIntoTrap(findCardByUid(gb.uid).index);
ok('C: ミラーフォース resolves — both own monsters survive',z(trapC)==='grave'&&z(gb)==='mz'&&z(gx)==='mz',JSON.stringify({gb:z(gb),gx:z(gx)}));
audit('C');
`);
