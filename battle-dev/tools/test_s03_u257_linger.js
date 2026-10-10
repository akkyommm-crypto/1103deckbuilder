/* S03-U257: lingering effects of used cards — シャブティのお守り, BF－蒼天のジェット (engine LINGER_ADD_S03 / continuous.from:['linger']).
   Real DUEL paths (POINT responses through the processor), Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function lp(p){return gameState.players[p].lp;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function atk(p,a,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});drive();}
/* player ap attacks; player rp responds at the first POINT matching want(payload) with the card at (zone,i) */
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,0);done=true;continue;}
    if(!step())break;}
  drive();return done;}
function turnOf(p){gameState.activePlayer=p;gameState.turn=p===0?5:6;gameState.phase='battle';}
function lingers(p){const t=gameState.players[p].temporaryFlags;return (t&&t.lingerUidsS03)||[];}

/* ===== A: シャブティのお守り — discarded at the opponent's attack declaration: no battle damage this turn from battles involving its 「墓守の」 monsters ===== */
fresh();turnOf(1);
let gk=up('墓守の偵察者',0),wt=up('ワイト',0),sh=mk('シャブティのお守り',0),be=up('青眼の白龍',1),gw=up('ジェネティック・ワーウルフ',1);
gameState.players[0].mz=[gk,wt];gameState.players[0].hand=[sh];gameState.players[1].mz=[be,gw];baselineA();
const usedA=attackRespond(1,be,gk,0,pl=>pl.kind==='attackDeclare','hand',0);
ok('A: discarded at the attack declaration; 墓守の偵察者 destroyed, its controller takes 0 (not 1800)',usedA&&z(sh)==='grave'&&z(gk)==='grave'&&lp(0)===8000,JSON.stringify({usedA,sh:z(sh),gk:z(gk),lp0:lp(0)}));
ok('A: registered as a lingering source of its controller for this turn (not a Graveyard source)',lingers(0).indexOf(sh.uid)>=0&&!graveContinuousNamesV29().has('シャブティのお守り'),JSON.stringify({l:lingers(0)}));
atk(1,gw,wt);
ok('A: a later battle with a non-「墓守の」 monster still deals damage (2000 − 300)',z(wt)==='grave'&&lp(0)===8000-1700,JSON.stringify({lp0:lp(0)}));
audit('A');
fresh();turnOf(1);
gk=up('墓守の偵察者',0);be=up('青眼の白龍',1);gameState.players[0].mz=[gk];gameState.players[1].mz=[be];baselineA();
atk(1,be,gk);
ok('A2 control: without it, 1800 battle damage',lp(0)===8000-1800);
fresh();
gameState.players[0].temporaryFlags={lingerUidsS03:[]};gk=up('墓守の偵察者',0);let sh2=mk('シャブティのお守り',0);gameState.players[0].grave=[sh2];sh2.u254ShabtiTurn=5;
be=up('青眼の白龍',1);gameState.players[0].mz=[gk];gameState.players[1].mz=[be];turnOf(1);gameState.turn=5;baselineA();
atk(1,be,gk);
ok('A3: a copy merely lying in the GY (not used this turn, not registered) does nothing',lp(0)===8000-1800,JSON.stringify({lp0:lp(0)}));

/* ===== B: BF－蒼天のジェット — at damage calculation, from the hand to the GY: its controller's 「BF」 monster is not destroyed by that battle ===== */
fresh();turnOf(0);
let bl=up('BF－尖鋭のボーラ',0),je=mk('BF－蒼天のジェット',0);be=up('青眼の白龍',1);
gameState.players[0].mz=[bl];gameState.players[0].hand=[je];gameState.players[1].mz=[be];baselineA();
const usedB=attackRespond(0,bl,be,0,pl=>pl.kind==='damageStep'&&pl.step==='calc','hand',0);
ok('B: used at the damage calculation; BF－尖鋭のボーラ survives the battle, battle damage still dealt (3000 − 1300)',usedB&&z(je)==='grave'&&z(bl)==='mz'&&lp(0)===8000-1700,JSON.stringify({usedB,je:z(je),bl:z(bl),lp0:lp(0)}));
ok('B: registered as a lingering source',lingers(0).indexOf(je.uid)>=0&&!graveContinuousNamesV29().has('BF－蒼天のジェット'));
audit('B');
fresh();turnOf(0);
bl=up('BF－尖鋭のボーラ',0);be=up('青眼の白龍',1);gameState.players[0].mz=[bl];gameState.players[1].mz=[be];baselineA();
atk(0,bl,be);
ok('B2 control: without it, the BF monster is destroyed',z(bl)==='grave');

/* ===== C: the System v29 Graveyard-source budget is unchanged ===== */
ok('C: graveContinuousNamesV29() stays within 20 declared names',graveContinuousNamesV29().size<=20,String(graveContinuousNamesV29().size));
`);
