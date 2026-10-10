/* S03-U246: 「憑依装着」 — アウス, ウィン, エリア, ヒータ: the summon procedure from hand / Deck (existing pile entry point) and piercing when summoned by it.
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
function procSummon(name,zone,idx,pos){runSummonProcedure(name,0,zone,idx);if(!gameState.pendingSummon&&!pendingChoiceV49(gameState))finishSummonProcedure(name,0,zone,idx,pos||'atk');drive();}

/* ===== A: 憑依装着－アウス from the Deck — the pile menu offers it; cost: 地霊使いアウス + another EARTH monster to the GY ===== */
fresh();
let au=mk('憑依装着－アウス',0),ch=mk('地霊使いアウス',0,'up'),ea=mk('アックス・レイダー',0,'up');
gameState.players[0].deck.push(au);gameState.players[0].mz=[ch,ea];baselineA();
const di=findCardByUid(au.uid).index;
const menuA=pileDuelActionsV370(0,'deck',di).map(x=>x.id);
ok('A: the Deck card offers 「特殊召喚」 (its procedure)',menuA.indexOf('specialSummonProcedure')>=0,JSON.stringify(menuA));
PREFER=[ch.uid,ea.uid];procSummon('憑依装着－アウス','deck',di,'atk');PREFER=[];
ok('A: special summoned from the Deck; アウス and the EARTH monster in the GY',z(au)==='mz'&&z(ch)==='grave'&&z(ea)==='grave'&&C(au).specialSummonKind==='procedure',JSON.stringify({au:z(au),ch:z(ch),ea:z(ea),k:C(au).specialSummonKind}));
audit('A');

/* ===== B: summoned by ① — attacking a Defense Position monster pierces ===== */
let wd=mk('ワイト',1,'up','def');gameState.players[1].mz=[wd];gameState.phase='battle';ensureAllCardUids(gameState);baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:findCardByUid(au.uid).index,target:0});drive();
ok('B: ワイト (DEF 200) destroyed; 1850 − 200 = 1650 piercing damage',z(wd)==='grave'&&lp(1)===8000-1650,JSON.stringify({wd:z(wd),lp1:lp(1)}));
audit('B');

/* ===== C: Normal Summoned (not ①) — no piercing ===== */
fresh();
let hn=mk('憑依装着－ヒータ',0);wd=mk('ワイト',1,'up','def');gameState.players[0].hand=[hn];gameState.players[1].mz=[wd];baselineA();
doNormalSummon(0,'atk');drive();phase('battle');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('C: Normal Summoned ヒータ attacks ワイト (def) — destroyed, no damage',z(hn)==='mz'&&z(wd)==='grave'&&lp(1)===8000,JSON.stringify({lp1:lp(1),k:C(hn).specialSummonKind}));
audit('C');

/* ===== D: from the hand; refused without another monster of the Attribute ===== */
fresh();
let hh=mk('憑依装着－ヒータ',0),hc=mk('火霊使いヒータ',0,'up');gameState.players[0].hand=[hh];gameState.players[0].mz=[hc];baselineA();
const lgD=strictSummonProcedureLegality('憑依装着－ヒータ',0,'hand',0);
ok('D: only 火霊使いヒータ (itself FIRE) — the procedure is not legal',lgD.ok===false,JSON.stringify(lgD));
fresh();
hh=mk('憑依装着－ヒータ',0);hc=mk('火霊使いヒータ',0,'up');let fw=mk('ギガテック・ウルフ',0,'up');gameState.players[0].hand=[hh];gameState.players[0].mz=[hc,fw];baselineA();
PREFER=[hc.uid,fw.uid];procSummon('憑依装着－ヒータ','hand',0,'def');PREFER=[];
ok('D: from the hand in Defense Position with 火霊使いヒータ + ギガテック・ウルフ',z(hh)==='mz'&&C(hh).pos==='def'&&z(hc)==='grave'&&z(fw)==='grave',JSON.stringify({hh:z(hh),pos:C(hh).pos}));
audit('D');
/* ===== E: 憑依装着－ウィン from the Deck (風霊使いウィン + a WIND monster); F: 憑依装着－エリア from the hand (水霊使いエリア + a WATER monster) ===== */
fresh();
let wi=mk('憑依装着－ウィン',0),wc=mk('風霊使いウィン',0,'up'),wa=mk('キラー・ビー',0,'up');
gameState.players[0].deck.push(wi);gameState.players[0].mz=[wc,wa];baselineA();
const wiIdx=findCardByUid(wi.uid).index;
PREFER=[wc.uid,wa.uid];procSummon('憑依装着－ウィン','deck',wiIdx,'atk');PREFER=[];
ok('E: 憑依装着－ウィン special summoned from the Deck; 風霊使いウィン and キラー・ビー in the GY',z(wi)==='mz'&&z(wc)==='grave'&&z(wa)==='grave'&&C(wi).specialSummonKind==='procedure',JSON.stringify({wi:z(wi),wc:z(wc),wa:z(wa)}));
audit('E');
fresh();
let el=mk('憑依装着－エリア',0),ec=mk('水霊使いエリア',0,'up'),ew=mk('アクア・マドール',0,'up');
gameState.players[0].hand=[el];gameState.players[0].mz=[ec,ew];baselineA();
PREFER=[ec.uid,ew.uid];procSummon('憑依装着－エリア','hand',0,'atk');PREFER=[];
ok('F: 憑依装着－エリア special summoned from the hand; 水霊使いエリア and アクア・マドール in the GY',z(el)==='mz'&&z(ec)==='grave'&&z(ew)==='grave',JSON.stringify({el:z(el),ec:z(ec),ew:z(ew)}));
audit('F');
`);
