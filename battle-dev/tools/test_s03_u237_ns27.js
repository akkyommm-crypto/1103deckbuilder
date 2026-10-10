/* S03-U237: NOT_STARTED → TESTED — 雲魔物－アシッド・クラウド, 雲魔物－キロスタス, 雲魔物－アルトス, 雲魔物－タービュランス, 雲魔物－ストーム・ドラゴン, 雲魔物－アイ・オブ・ザ・タイフーン.
   Real DUEL paths (Normal Summons, attacks, activations, a real position change), Replay-audited. The position scenarios set gameState.posSnapV10
   (the key engine/19 reads; the shared harness baseline sets positionSnapV10). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
const FOG='フォッグ';
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;TRIG.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5337a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:8},()=>mk('ワイト',p));}
let PREFER=[],ORDER=[],TRIG=[];
function step(){const q=pc();if(!q)return false;
  if(q.min>1&&q.min===q.max){const keys=[];ORDER.forEach(u=>{const c=q.candidates.find(x=>(x.uid===u||x.key===u)&&keys.indexOf(x.key)<0);if(c)keys.push(c.key);});q.candidates.forEach(c=>{if(keys.indexOf(c.key)<0)keys.push(c.key);});answerChoiceV49(keys.slice(0,q.min));return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function lp(p){return gameState.players[p].lp;}
function idx(c){return findCardByUid(c.uid).index;}
function legal(name,p,i){return strictScriptLegalityV2(name,p,'mz',i,{});}
function fog(c){return API.countCounter(findCardByUid(c.uid),FOG);}
function withFog(c,n){c.counters={[FOG]:n};return c;}

/* ===== A: アイ・オブ・ザ・タイフーン — attack declaration: every face-up non-「雲魔物」 monster changes position; 「雲魔物」 and face-down monsters stay ===== */
fresh();
let ey=mk('雲魔物－アイ・オブ・ザ・タイフーン',0,'up','atk'),ow=mk('ワイト',0,'up','atk'),sb=mk('雲魔物－スモークボール',0,'up','atk'),bw=mk('ブラック・マジシャン',1,'up','atk'),fw=mk('ワイト',1,'up','atk'),fd=mk('ワイト',1,'down','def');
gameState.players[0].mz=[ey,ow,sb];gameState.players[1].mz=[bw,fw,fd];gameState.phase='battle';gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('A: the foe ワイト and own ワイト → Defense; スモークボール stays Attack; the Set monster stays face-down Defense',C(fw).pos==='def'&&C(ow).pos==='def'&&C(sb).pos==='atk'&&C(fd).face==='down'&&C(fd).pos==='def',JSON.stringify([C(bw).pos,C(ow).pos,C(sb).pos,C(fd).face,C(fd).pos,TRIG]));
ok('A: the attack target ブラック・マジシャン was turned to Defense (DEF 2100 < 3000): destroyed with no battle damage; the Eye stays in Attack Position',z(bw)==='grave'&&z(ey)==='mz'&&C(ey).pos==='atk'&&lp(1)===8000,JSON.stringify([z(bw),z(ey),C(ey).pos,lp(1)]));
audit('A');

/* ===== B: 戦闘によっては破壊されない — 青眼の究極竜 (4500) attacks the Eye (3000): the Eye survives, the Eye's controller takes the damage ===== */
fresh();
ey=mk('雲魔物－アイ・オブ・ザ・タイフーン',0,'up','atk');let ub=mk('青眼の究極竜',1,'up','atk');
gameState.players[0].mz=[ey];gameState.players[1].mz=[ub];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('B: the Eye is not destroyed by battle (4500 vs 3000); 1500 damage to its controller',z(ey)==='mz'&&lp(0)===8000-1500&&z(ub)==='mz',JSON.stringify([z(ey),lp(0),z(ub)]));
audit('B');

/* ===== C: a real position change to face-up Defense → destroyed; face-down Defense and face-up Attack stay ===== */
fresh();
let ac=mk('雲魔物－アシッド・クラウド',0,'up','atk'),kf=mk('雲魔物－キロスタス',0,'down','def'),tb=mk('雲魔物－タービュランス',0,'up','atk');
gameState.players[0].mz=[ac,kf,tb];gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();
drive();
ok('C: face-up Attack Position and face-down Defense Position are not destroyed',z(ac)==='mz'&&z(kf)==='mz'&&z(tb)==='mz',JSON.stringify([z(ac),z(kf),z(tb)]));
zAct('TOGGLE_POS',0,'mz',0);drive();
ok('C: アシッド・クラウド changed to face-up Defense → destroyed (the others stay)',z(ac)==='grave'&&z(kf)==='mz'&&z(tb)==='mz',JSON.stringify([z(ac),z(kf),z(tb)]));
audit('C');

/* ===== D: Normal Summon — Fog Counters = the face-up 「雲魔物」 on both fields, itself included (face-down ones are not counted) ===== */
fresh();
let ac2=mk('雲魔物－アシッド・クラウド',0);gameState.players[0].hand=[ac2];baselineA();
doNormalSummon(0,'atk');drive();
ok('D1: alone → 1 Fog Counter',z(ac2)==='mz'&&fog(ac2)===1,JSON.stringify([z(ac2),fog(ac2),TRIG]));
audit('D1');
fresh();
let tb2=mk('雲魔物－タービュランス',0),fsb=mk('雲魔物－スモークボール',1,'up','atk');gameState.players[0].hand=[tb2];gameState.players[1].mz=[fsb];baselineA();
doNormalSummon(0,'atk');drive();
ok('D2: with the opponent\'s face-up スモークボール → 2 Fog Counters',z(tb2)==='mz'&&fog(tb2)===2,JSON.stringify([fog(tb2)]));
audit('D2');
fresh();
let al=mk('雲魔物－アルトス',0),ok1=mk('雲魔物－キロスタス',0,'up','atk'),fsb3=mk('雲魔物－スモークボール',1,'up','atk'),fdc=mk('雲魔物－タービュランス',1,'down','def');
gameState.players[0].hand=[al];gameState.players[0].mz=[ok1];gameState.players[1].mz=[fsb3,fdc];baselineA();
doNormalSummon(0,'atk');drive();
ok('D3: itself + own キロスタス + foe スモークボール → 3 (the face-down 雲魔物 is not counted); the others get none',fog(al)===3&&fog(ok1)===0&&fog(fsb3)===0,JSON.stringify([fog(al),fog(ok1),fog(fsb3)]));
audit('D3');

/* ===== E: アシッド・クラウド — remove 2 (cost) → destroy 1 Spell / Trap; refused with 1 counter ===== */
fresh();
ac=withFog(mk('雲魔物－アシッド・クラウド',0,'up','atk'),1);let tr=mk('サイクロン',1,'down'),sp=mk('強欲な壺',1,'down');
gameState.players[0].mz=[ac];gameState.players[1].sz=[tr,sp];baselineA();
const lgE=legal('雲魔物－アシッド・クラウド',0,0);duelActivateFromZone(0,'mz',0);drive();
ok('E: 1 counter → not activatable, nothing changed',lgE.ok===false&&fog(ac)===1&&z(tr)==='sz'&&z(sp)==='sz',JSON.stringify([lgE,fog(ac)]));
C(ac).counters={[FOG]:3};baselineA();
PREFER=[sp.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('E: 3 counters → 2 removed (1 left), the chosen Spell destroyed, the Trap stays',fog(ac)===1&&z(sp)==='grave'&&z(tr)==='sz',JSON.stringify([fog(ac),z(sp),z(tr)]));
audit('E');

/* ===== F: キロスタス — remove 2 (cost) → destroy 1 monster; refused with 1 counter ===== */
fresh();
let ki=withFog(mk('雲魔物－キロスタス',0,'up','atk'),1),bw2=mk('青眼の白龍',1,'up','atk');
gameState.players[0].mz=[ki];gameState.players[1].mz=[bw2];baselineA();
const lgF=legal('雲魔物－キロスタス',0,0);
ok('F: 1 counter → not activatable',lgF.ok===false&&fog(ki)===1&&z(bw2)==='mz',JSON.stringify([lgF,fog(ki)]));
C(ki).counters={[FOG]:2};baselineA();
PREFER=[bw2.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('F: 2 counters → both removed, 青眼 destroyed',fog(ki)===0&&z(bw2)==='grave',JSON.stringify([fog(ki),z(bw2)]));
audit('F');

/* ===== G: アルトス — remove 3 Fog Counters from anywhere on the field (the player chooses) → the opponent discards 1 random card ===== */
fresh();
al=withFog(mk('雲魔物－アルトス',0,'up','atk'),2);let xo=withFog(mk('ワイト',0,'up','atk'),1),fb=withFog(mk('青眼の白龍',1,'up','atk'),1);
gameState.players[0].mz=[al,xo];gameState.players[1].mz=[fb];gameState.players[1].hand=[mk('ワイト',1),mk('ワイト',1),mk('ワイト',1)];baselineA();
ORDER=[fb.uid,xo.uid];duelActivateFromZone(0,'mz',0);drive();ORDER=[];
ok('G: counters taken from the chosen cards (青眼 1, ワイト 1, アルトス 1 of 2) → アルトス keeps 1',fog(fb)===0&&fog(xo)===0&&fog(al)===1,JSON.stringify([fog(fb),fog(xo),fog(al)]));
ok('G: the opponent discarded 1 card at random (hand 3 → 2)',gameState.players[1].hand.length===2&&gameState.players[1].grave.length===1,JSON.stringify([gameState.players[1].hand.length,gameState.players[1].grave.length]));
audit('G');
fresh();
al=withFog(mk('雲魔物－アルトス',0,'up','atk'),1);fb=withFog(mk('青眼の白龍',1,'up','atk'),1);
gameState.players[0].mz=[al];gameState.players[1].mz=[fb];gameState.players[1].hand=[mk('ワイト',1),mk('ワイト',1)];baselineA();
const lgG=legal('雲魔物－アルトス',0,0);duelActivateFromZone(0,'mz',0);drive();
ok('G2: only 2 counters on the field → refused, no counters removed, no discard',lgG.ok===false&&fog(al)===1&&fog(fb)===1&&gameState.players[1].hand.length===2,JSON.stringify([lgG,fog(al),fog(fb),gameState.players[1].hand.length]));

/* ===== H: タービュランス — remove 1 (cost) → special summon スモークボール from the Deck or either GY; refused with 0 counters ===== */
fresh();
let tu=withFog(mk('雲魔物－タービュランス',0,'up','atk'),1),sbG=mk('雲魔物－スモークボール',1),sbD=mk('雲魔物－スモークボール',0);
gameState.players[0].mz=[tu];gameState.players[1].grave=[sbG];gameState.players[0].deck=[sbD].concat(gameState.players[0].deck);baselineA();
PREFER=[sbG.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('H: the opponent\'s GY スモークボール special summoned to my field; 1 counter removed',z(sbG)==='mz'&&findCardByUid(sbG.uid).p===0&&fog(tu)===0&&z(sbD)==='deck',JSON.stringify([z(sbG),findCardByUid(sbG.uid).p,fog(tu),z(sbD)]));
const lgH=legal('雲魔物－タービュランス',0,0);
ok('H: 0 counters → not activatable',lgH.ok===false,JSON.stringify(lgH));
audit('H');
fresh();
tu=withFog(mk('雲魔物－タービュランス',0,'up','atk'),1);sbD=mk('雲魔物－スモークボール',0);
gameState.players[0].mz=[tu];gameState.players[0].deck=[sbD].concat(gameState.players[0].deck);baselineA();
PREFER=[sbD.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('H2: スモークボール special summoned from the Deck',z(sbD)==='mz'&&fog(tu)===0,JSON.stringify([z(sbD),fog(tu)]));
audit('H2');

/* ===== I: ストーム・ドラゴン — cannot be Normal Summoned; Special Summon by banishing a 「雲魔物」 from my GY; once per turn put a Fog Counter on a monster ===== */
fresh();
let sd=mk('雲魔物－ストーム・ドラゴン',0),gsb=mk('雲魔物－スモークボール',0),gwt=mk('ワイト',0);
gameState.players[0].hand=[sd];gameState.players[0].grave=[gwt,gsb];baselineA();
ok('I: no Normal Summon / Set method',allNormalSummonMethods(dbOf(sd),0).length===0);
const lgI=strictSummonProcedureLegality('雲魔物－ストーム・ドラゴン',0,'hand',0);
PREFER=[gsb.uid];runSummonProcedure('雲魔物－ストーム・ドラゴン',0,'hand',0);if(!gameState.pendingSummon&&!pendingChoiceV49(gameState))finishSummonProcedure('雲魔物－ストーム・ドラゴン',0,'hand',0,'atk');drive();PREFER=[];
ok('I: スモークボール banished from the GY (ワイト stays); ストーム・ドラゴン special summoned',lgI.ok===true&&z(sd)==='mz'&&z(gsb)==='banish'&&z(gwt)==='grave',JSON.stringify([lgI,z(sd),z(gsb),z(gwt)]));
audit('I');
fresh();
sd=mk('雲魔物－ストーム・ドラゴン',0);gameState.players[0].hand=[sd];gameState.players[0].grave=[mk('ワイト',0)];baselineA();
const lgI2=strictSummonProcedureLegality('雲魔物－ストーム・ドラゴン',0,'hand',0);
ok('I2: no 「雲魔物」 in my GY → the procedure is refused',lgI2.ok===false,JSON.stringify(lgI2));
fresh();
sd=mk('雲魔物－ストーム・ドラゴン',0,'up','atk');let tg=mk('青眼の白龍',1,'up','atk');
gameState.players[0].mz=[sd];gameState.players[1].mz=[tg];baselineA();
PREFER=[tg.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('I3: a Fog Counter placed on the chosen monster (青眼)',fog(tg)===1&&fog(sd)===0,JSON.stringify([fog(tg),fog(sd)]));
const lgI3=legal('雲魔物－ストーム・ドラゴン',0,0);
ok('I3: once per turn',lgI3.ok===false,JSON.stringify(lgI3));
audit('I3');
`);
