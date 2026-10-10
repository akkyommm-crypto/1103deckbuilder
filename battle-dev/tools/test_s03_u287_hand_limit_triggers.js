/* S03-U287: the hand-size discards trigger 「捨てられた時」 effects (events drained before the turn ends); 魔轟神ルリー, 魔轟神獣キャシー (2011 texts).
   Cards and scenarios written by the Sonnet unit S03-U285 (parked there for this engine fix); harness from tools/test_s03_u285_gap7.js. Real DUEL paths, Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function pl(c){const hh=findCardByUid(c.uid);return hh?hh.p:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function lp(p){return gameState.players[p].lp;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;SEEN=[];TRIG=[];PREFER=[];
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:10},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],SEEN=[];
function step(){const q=pc();if(!q)return false;
  SEEN.push({title:q.title||'',kind:q.kind,min:q.min,max:q.max,n:(q.candidates||[]).length,keys:(q.candidates||[]).map(x=>x.uid!=null?x.uid:x.key)});
  const find=u=>q.candidates.findIndex(x=>x.uid===u||x.key===u||x.value===u||(x.card&&x.card.uid===u));
  if(q.max>1||q.min!==q.max){
    let ks=[];for(const u of PREFER){const j=find(u);if(j>=0&&ks.indexOf(q.candidates[j].key)<0)ks.push(q.candidates[j].key);}
    ks=ks.slice(0,q.max);for(const c of q.candidates){if(ks.length>=q.min)break;if(ks.indexOf(c.key)<0)ks.push(c.key);}
    PREFER=PREFER.filter(u=>find(u)<0);answerChoiceV49(ks);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){j=find(PREFER[k]);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<800;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push({names:g.map(c=>c.name),forced:st.rank<2});eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function up(n,p,pos){return mk(n,p,'up',pos);}
function down(n,p){const c=mk(n,p,'down');c.pos='def';return c;}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function fieldSp(p){const f=up('山',p);gameState.players[p].field=f;return f;}
function base(){gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function ign(c,prefer){const h=findCardByUid(c.uid);PREFER=(prefer||[]).slice();duelActivateFromZone(h.p,'mz',h.index);drive();PREFER=[];}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(!step())break;}
  return done;}
const trigNamed=n=>TRIG.filter(t=>t.names.indexOf(n)>=0);
const ptitle=s=>SEEN.filter(x=>x.title.indexOf(s)>=0);
const IB='イビー',CY='A・O・J サイクロン・クリエイター',ZZ='絶対魔法禁止区域',MC='マーダーサーカス';
const nGrave=cs=>cs.every(c=>z(c)==='grave');

/* a field with the Creator (itself a Tuner), a set Trap of its own, and a face-up opponent monster */
function cyField(hand){
  fresh();
  const cy=up(CY,0),t0=setT('強制脱出装置',0),m1=up('ジェネティック・ワーウルフ',1);
  gameState.players[0].mz=[cy];gameState.players[0].sz=[t0];gameState.players[1].mz=[m1];gameState.players[0].hand=(typeof hand==='function'?hand():hand);base();
  return {cy,t0,m1};}

const RU='魔轟神ルリー',KA='魔轟神獣キャシー';let S,w0,ha;
/* ===== R: 魔轟神ルリー — discarded from the hand (any way): Special Summon itself from the Graveyard ===== */
/* R1: as a cost; the position is asked */
globalThis.__MANUAL_SS_POSITION_S03=true;   /* these scenarios answer the position themselves */
S=cyField(()=>[mk(RU,0)]);let ru=gameState.players[0].hand[0];
ign(S.cy,[ru.uid,'def']);
ok('R1: discarded as the Creator cost — Special Summoned from the Graveyard; the player chose Defense',z(ru)==='mz'&&C(ru).face==='up'&&C(ru).pos==='def'&&ptitle('表示形式').length===1,JSON.stringify({ru:z(ru),pos:C(ru)&&C(ru).pos,q:ptitle('表示形式').length}));
ok('R1: forced trigger',trigNamed(RU).length===1&&trigNamed(RU)[0].forced===true,JSON.stringify(TRIG));
audit('R1');
/* R2: by an effect of the opponent (Attack chosen by default) */
fresh();gameState.activePlayer=1;gameState.turn=6;
ru=mk(RU,0);w0=mk('ワイト',0);ha=mk('手札抹殺',1);gameState.players[0].hand=[ru,w0];gameState.players[1].hand=[ha];base();
cast(1,'手札抹殺');
ok('R2: discarded by the opponent 手札抹殺 — Special Summoned from the Graveyard (Attack Position)',z(ru)==='mz'&&pl(ru)===0&&C(ru).pos==='atk',JSON.stringify({ru:z(ru),pos:C(ru)&&C(ru).pos}));
audit('R2');
/* R3: by the hand-size rule */
fresh();
ru=mk(RU,0);gameState.players[0].hand=[ru,...Array.from({length:6},()=>mk('ワイト',0))];base();
toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});PREFER=[ru.uid,'def'];drive();PREFER=[];
ok('R3: discarded by the hand-size rule — Special Summoned from the Graveyard',z(ru)==='mz'&&pl(ru)===0&&C(ru).face==='up',JSON.stringify({ru:z(ru),TRIG}));
audit('R3');
/* R4: negative — no Monster Zone free */
fresh();
ru=mk(RU,0);let cy4=up(CY,0);const fm=[up('ワイト',0),up('ワイト',0),up('ワイト',0),up('ワイト',0)];
gameState.players[0].mz=[cy4,...fm];gameState.players[0].sz=[setT('強制脱出装置',0)];gameState.players[0].hand=[ru];base();
ign(cy4,[ru.uid]);
ok('R4: negative — all 5 Monster Zones are used: it stays in the Graveyard',z(ru)==='grave'&&trigNamed(RU).length===0,JSON.stringify({ru:z(ru),TRIG}));
/* R5: negative — destroyed on the field */
fresh();gameState.activePlayer=1;gameState.turn=6;
ru=up(RU,0);tb=mk('サンダー・ボルト',1);gameState.players[0].mz=[ru];gameState.players[1].hand=[tb];base();
cast(1,'サンダー・ボルト');
ok('R5: negative — destroyed on the field (not discarded from the hand): stays in the Graveyard',z(ru)==='grave'&&trigNamed(RU).length===0,JSON.stringify({ru:z(ru)}));

/* ===== K: 魔轟神獣キャシー — discarded from the hand: destroy 1 face-up card on the field (target chosen at activation) ===== */
/* K1: as a cost */
S=cyField(()=>[mk(KA,0)]);let ka=gameState.players[0].hand[0];const d1=down('ワイト',1),ft=setT('強制脱出装置',1);gameState.players[1].mz=[S.m1,d1];gameState.players[1].sz=[ft];base();
ign(S.cy,[ka.uid,S.m1.uid]);
const kq=ptitle('魔轟神獣キャシー');
ok('K1: the target is chosen at activation: 1 card among the face-up cards of both fields (the Creator and ジェネティック・ワーウルフ), not the face-down ones',kq.length===1&&kq[0].min===1&&kq[0].max===1&&kq[0].n===2&&kq[0].keys.indexOf(S.cy.uid)>=0&&kq[0].keys.indexOf(S.m1.uid)>=0,JSON.stringify(kq));
ok('K1: the chosen opponent monster is destroyed; the face-down monster and Set Trap stay',z(S.m1)==='grave'&&z(d1)==='mz'&&z(ft)==='sz',JSON.stringify({m1:z(S.m1),d1:z(d1),ft:z(ft)}));
ok('K1: forced trigger',trigNamed(KA).length===1&&trigNamed(KA)[0].forced===true,JSON.stringify(TRIG));
audit('K1');
/* K2: by an effect of the opponent — destroy a card of the controller */
fresh();gameState.activePlayer=1;gameState.turn=6;
ka=mk(KA,0);w0=mk('ワイト',0);ha=mk('手札抹殺',1);let own=up('ジェネティック・ワーウルフ',0),foe=up('ワイト',1);
gameState.players[0].hand=[ka,w0];gameState.players[0].mz=[own];gameState.players[1].mz=[foe];gameState.players[1].hand=[ha];base();
cast(1,'手札抹殺',[own.uid]);
ok('K2: discarded by the opponent 手札抹殺 — the player of キャシー may choose a card of either side (here its own)',z(ka)==='grave'&&z(own)==='grave'&&z(foe)==='mz',JSON.stringify({ka:z(ka),own:z(own),foe:z(foe)}));
audit('K2');
/* K3: negative — only face-down cards on the field */
fresh();gameState.activePlayer=1;gameState.turn=6;
ka=mk(KA,0);w0=mk('ワイト',0);ha=mk('手札抹殺',1);let fd=down('ワイト',0),fd2=setT('強制脱出装置',1);
gameState.players[0].hand=[ka,w0];gameState.players[0].mz=[fd];gameState.players[1].sz=[fd2];gameState.players[1].hand=[ha];base();
cast(1,'手札抹殺');
ok('K3: negative — no face-up card on the field: it does not activate (the face-down cards stay)',z(ka)==='grave'&&z(fd)==='mz'&&z(fd2)==='sz'&&trigNamed(KA).length===0&&ptitle('魔轟神獣キャシー').length===0,JSON.stringify({fd:z(fd),fd2:z(fd2),TRIG}));
/* K4: negative — destroyed on the field */
fresh();gameState.activePlayer=1;gameState.turn=6;
ka=up(KA,0);own=up('ワイト',0);foe=up('ジェネティック・ワーウルフ',1);tb=mk('サンダー・ボルト',1);
gameState.players[0].mz=[ka,own];gameState.players[1].mz=[foe];gameState.players[1].hand=[tb];base();
cast(1,'サンダー・ボルト');
ok('K4: negative — destroyed on the field: no trigger (the opponent monster was also destroyed by 雷, the Graveyard card stays)',z(ka)==='grave'&&trigNamed(KA).length===0&&ptitle('魔轟神獣キャシー').length===0,JSON.stringify({ka:z(ka),TRIG}));
/* K5: by the hand-size rule */
fresh();
ka=mk(KA,0);foe=up('ワイト',1);gameState.players[1].mz=[foe];gameState.players[0].hand=[ka,...Array.from({length:6},()=>mk('ワイト',0))];base();
toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});PREFER=[ka.uid,foe.uid];drive();PREFER=[];
ok('K5: discarded by the hand-size rule — the target is chosen and destroyed',z(ka)==='grave'&&z(foe)==='grave',JSON.stringify({ka:z(ka),foe:z(foe),TRIG}));
audit('K5');

`);
