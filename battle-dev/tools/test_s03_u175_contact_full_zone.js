/* S03-U175 (user priority 2026-09-27): contact fusion with a full Monster Zone — the materials leave before the summon, so a material
   set that takes at least one of the player's own monsters frees a zone; a set made only of the opponent's monsters does not.
   Cards: E・HERO グラン・ネオス, キメラテック・フォートレス・ドラゴン (TESTED, U174). Real DUEL path; Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:8},()=>mk('ワイト',p));}
let SEEN=[];
function drive(){for(let i=0;i<600;i++){
  const q=pc(); if(q){SEEN.push(q.candidates.map(x=>x.label));__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function exi(name,p){return gameState.players[p].ex.findIndex(c=>cardName(c)===name);}
function row(name,p){const i=exi(name,p);return contactProcRowS03(p,i,dbOf(gameState.players[p].ex[i]));}

/* ===== A: 5 own monsters incl. ネオス + グラン・モール → the contact summon is legal and leaves 4 monsters ===== */
fresh();
let neos=mk('E・HERO ネオス',0,'up'),mole=mk('N・グラン・モール',0,'up');
gameState.players[0].mz=[neos,mole,mk('ワイト',0,'up'),mk('ワイト',0,'up'),mk('ワイト',0,'up')];
let gran=mk('E・HERO グラン・ネオス',0,'up');gameState.players[0].ex=[gran];baselineA();
const rA=row('E・HERO グラン・ネオス',0);
ok('A: full Monster Zone — the procedure is legal (the materials free two zones)',rA&&rA.ok===true,JSON.stringify(rA));
finishSummonProcedure('E・HERO グラン・ネオス',0,'ex',exi('E・HERO グラン・ネオス',0),'atk');drive();
ok('A: グラン・ネオス summoned; materials in the Deck; 4 monsters on the field',z(gran)==='mz'&&z(neos)==='deck'&&z(mole)==='deck'&&gameState.players[0].mz.length===4,JSON.stringify({g:z(gran),n:gameState.players[0].mz.length}));
audit('A');

/* ===== B: キメラテック with a full own zone of non-Machines — only the opponent's monsters could be materials → not legal ===== */
fresh();
gameState.players[0].mz=Array.from({length:5},()=>mk('ワイト',0,'up'));
let cd=mk('サイバー・ドラゴン',1,'up'),mh=mk('メカ・ハンター',1,'up');gameState.players[1].mz=[cd,mh];
gameState.players[0].ex=[mk('キメラテック・フォートレス・ドラゴン',0,'up')];baselineA();
const rB=row('キメラテック・フォートレス・ドラゴン',0);
ok('B: a set made only of the opponent’s monsters frees no zone — not legal (モンスターゾーンが一杯です)',rB&&rB.ok===false&&/一杯/.test(rB.reason),JSON.stringify(rB));

/* ===== C: one own Machine among the 5 → legal; only the sets taking it are offered; the zone count stays 5 ===== */
fresh();
let own=mk('メカ・ハンター',0,'up');gameState.players[0].mz=[own,mk('ワイト',0,'up'),mk('ワイト',0,'up'),mk('ワイト',0,'up'),mk('ワイト',0,'up')];
cd=mk('サイバー・ドラゴン',1,'up');mh=mk('メカ・ハンター',1,'up');gameState.players[1].mz=[cd,mh];
let ct=mk('キメラテック・フォートレス・ドラゴン',0,'up');gameState.players[0].ex=[ct];baselineA();
const rC=row('キメラテック・フォートレス・ドラゴン',0);
ok('C: with an own Machine the procedure is legal',rC&&rC.ok===true,JSON.stringify(rC));
SEEN=[];finishSummonProcedure('キメラテック・フォートレス・ドラゴン',0,'ex',exi('キメラテック・フォートレス・ドラゴン',0),'atk');drive();
const offered=SEEN[0]||[];
ok('C: every offered material set includes the own メカ・ハンター (the opponent-only set is not offered)',offered.length>=1&&offered.every(l=>l.split(' ＋ ').some(x=>x==='メカ・ハンター')),JSON.stringify(SEEN));
const ctH=findCardByUid(ct.uid);
ok('C: キメラテック summoned; own monsters 5 again; サイバー・ドラゴン and own メカ・ハンター in their GYs',ctH&&ctH.zone==='mz'&&gameState.players[0].mz.length===5&&z(cd)==='grave'&&z(own)==='grave',JSON.stringify({ct:ctH&&ctH.zone,n:gameState.players[0].mz.length}));
audit('C');
`);
