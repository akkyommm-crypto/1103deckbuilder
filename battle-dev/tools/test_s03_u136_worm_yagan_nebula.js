/* S03-U136: ワーム・ヤガン (NOT_STARTED) and W星雲隕石 (PARTIAL auto-table "recruit ignition") — both x3 in the fixed Worm list.
   Real DUEL path (End Phase through the processor), Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[],SEEN=[];
function pick(){const q=pc();SEEN.push({title:q.title,cands:q.candidates.map(x=>x.name||x.label||(x.card?nm(x.card):x.value))});
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';}
function legal(n,zone,i){return strictScriptLegalityV2(n,0,zone,i||0,{});}
`;

/* ===== A. ワーム・ヤガン revival: only with a lone face-up ワーム・ゼクス; face-down DEF; banished when it leaves ===== */
harness(COMMON+String.raw`
fresh();
const xex=mk('ワーム・ゼクス',0,'up'),yg=mk('ワーム・ヤガン',0);gameState.players[0].mz=[xex];gameState.players[0].grave=[yg];
baselineA();
ok('A: legal from the GY with a lone face-up ワーム・ゼクス',legal('ワーム・ヤガン','grave',0).ok===true,JSON.stringify(legal('ワーム・ヤガン','grave',0)));
duelActivateFromZone(0,'grave',0);drive();
ok('A: ワーム・ヤガン Special Summoned face-down in Defense Position',z(yg)==='mz'&&yg.face==='down'&&yg.pos==='def'&&yg.banishWhenLeavesField===true,JSON.stringify({z:z(yg),face:yg.face,pos:yg.pos}));
ok('A: it cannot be Flip Summoned the turn it was Special Summoned',canFlipSummonLegal(yg,0)===false);
API.destroy(findCardByUid(yg.uid),'test');drive();
ok('A: destroyed → banished instead of going to the GY',z(yg)==='banish',JSON.stringify({z:z(yg)}));
audit('A');
fresh();
gameState.players[0].mz=[mk('ワーム・ゼクス',0,'up'),mk('ワイト',0,'up')];gameState.players[0].grave=[mk('ワーム・ヤガン',0)];
ok('A: another monster besides ワーム・ゼクス → illegal',legal('ワーム・ヤガン','grave',0).ok===false);
fresh();
const xd=mk('ワーム・ゼクス',0,'down');xd.pos='def';gameState.players[0].mz=[xd];gameState.players[0].grave=[mk('ワーム・ヤガン',0)];
ok('A: a face-down ワーム・ゼクス → illegal',legal('ワーム・ヤガン','grave',0).ok===false);
fresh();
gameState.players[0].grave=[mk('ワーム・ヤガン',0)];
ok('A: an empty field → illegal',legal('ワーム・ヤガン','grave',0).ok===false);
`);

/* ===== B. reversal (Flip Summon): forced, targets a face-up opponent monster → back to its owner's hand ===== */
harness(COMMON+String.raw`
fresh();
const yg=mk('ワーム・ヤガン',0,'down');yg.pos='def';yg.setTurn=3;gameState.players[0].mz=[yg];
const foe=mk('ゴブリン突撃部隊',1,'up'),foe2=mk('ワイト',1,'down');foe2.pos='def';gameState.players[1].mz=[foe,foe2];
baselineA();
doFlipUp(0,'mz',0,'atk');drive();
ok('B: Flip Summon → ワーム・ヤガン\'s trigger returns the face-up ゴブリン突撃部隊 to the hand (not the face-down monster)',yg.face==='up'&&z(foe)==='hand'&&z(foe2)==='mz',JSON.stringify({yg:yg.face,foe:z(foe),foe2:z(foe2),SEEN}));
audit('B');
`);

/* ===== C. W星雲隕石: all face-down monsters face-up DEF (reversal effects trigger); End Phase: own face-up LIGHT Reptiles face-down,
   draw that many, then Special Summon a Lv7+ LIGHT Reptile from the Deck ===== */
harness(COMMON+String.raw`
fresh();
const yg=mk('ワーム・ヤガン',0,'down');yg.pos='def';yg.setTurn=3;
const ug=mk('ワーム・アグリィ',0,'up'),wat=mk('ワイト',0,'up');gameState.players[0].mz=[yg,ug,wat];
const trap=mk('W星雲隕石',0,'down');trap.setTurn=3;gameState.players[0].sz=[trap];
const foe=mk('ゴブリン突撃部隊',1,'up'),foeD=mk('ワイト',1,'down');foeD.pos='def';gameState.players[1].mz=[foe,foeD];
const king=mk('ワーム・キング',0);gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0),king,mk('ワイト',0),mk('ワイト',0)];
gameState.players[0].hand=[];
baselineA();
PREFER=[uid(foe)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('C: all face-down monsters (both sides) are now face-up Defense Position',yg.face==='up'&&yg.pos==='def'&&foeD.face==='up'&&foeD.pos==='def');
ok('C: ワーム・ヤガン\'s reversal effect triggered → ゴブリン突撃部隊 back to the hand',z(foe)==='hand',JSON.stringify({foe:z(foe)}));
ok('C: W星雲隕石 in the GY; one End Phase task scheduled',z(trap)==='grave'&&(gameState.scheduledV7||[]).filter(e=>e.handler==='s03u136.w-nebula-end').length===1);
const hand0=gameState.players[0].hand.length;
PREFER=[uid(king)];requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});drive();PREFER=[];
ok('C: End Phase → ヤガン and アグリィ (LIGHT Reptiles) face-down DEF; ワイト stays face-up',yg.face==='down'&&ug.face==='down'&&ug.pos==='def'&&wat.face==='up',JSON.stringify({yg:yg.face,ug:ug.face,wat:wat.face}));
ok('C: … 2 cards drawn',gameState.players[0].hand.length===hand0+2,JSON.stringify({before:hand0,after:gameState.players[0].hand.length}));
ok('C: … then ワーム・キング (Lv8 LIGHT Reptile) Special Summoned from the Deck',z(king)==='mz',JSON.stringify({king:z(king),SEEN:SEEN.map(s=>s.title)}));
audit('C');
`);

/* ===== D. W星雲隕石 with no LIGHT Reptile face-up at the End Phase: nothing is drawn and no Special Summon is offered ===== */
harness(COMMON+String.raw`
fresh();
const trap=mk('W星雲隕石',0,'down');trap.setTurn=3;gameState.players[0].sz=[trap];
gameState.players[0].mz=[mk('ワイト',0,'up')];
const king=mk('ワーム・キング',0);gameState.players[0].deck=[mk('ワイト',0),king];gameState.players[0].hand=[];
baselineA();
duelActivateFromZone(0,'sz',0);drive();
SEEN=[];requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});drive();
ok('D: no draw, no Special Summon choice',gameState.players[0].hand.length===0&&z(king)==='deck'&&!SEEN.some(s=>/W星雲隕石/.test(s.title)),JSON.stringify({hand:gameState.players[0].hand.length,SEEN}));
audit('D');
`);
