/* S03-U199: PARTIAL → TESTED — デスハムスター / 素早いビッグハムスター (Flip), 素早いマンタ (sent by a card effect), ナーガ (returned to the Deck),
   冥界の使者 (both players search). Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
let PREFER=[],MULTI=null,TRIG=[],SEEN=[];
function step(){const q=pc();if(!q)return false;SEEN.push({title:q.title,player:q.player});
  if(MULTI&&q.max>1){const keys=q.candidates.filter(x=>MULTI.includes(x.uid)).map(x=>x.key);MULTI=null;answerChoiceV49(keys);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}

/* ===== A: デスハムスター — Flip Summoned: another デスハムスター from the Deck, face-down Defense ===== */
fresh();
let dh=mk('デスハムスター',0,'down','def');dh.setTurn=4;let d2=mk('デスハムスター',0);gameState.players[0].mz=[dh];gameState.players[0].deck.push(d2);baselineA();
doFlipUp(0,'mz',0,'atk');drive();
ok('A: the Deck デスハムスター special summoned face-down in Defense Position',z(d2)==='mz'&&C(d2).face==='down'&&C(d2).pos==='def');
audit('A');

/* ===== B: 素早いビッグハムスター — flipped by an attack: a Level 3 or lower Beast from the Deck, face-down Defense ===== */
fresh();
let bh=mk('素早いビッグハムスター',0,'down','def');bh.setTurn=4;let bst=mk('N・ブラック・パンサー',0),at=mk('ワイト',1,'up');
gameState.players[0].mz=[bh];gameState.players[0].deck.push(bst);gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('B: N・ブラック・パンサー (Beast, Lv3) special summoned face-down',z(bst)==='mz'&&C(bst).face==='down',JSON.stringify({bst:z(bst),TRIG}));
audit('B');

/* ===== C: 素早いマンタ — sent to the GY by a card effect: any number of 素早いマンタ from the Deck; as a Tribute: nothing ===== */
fresh();
let mt=mk('素早いマンタ',0,'up'),m2=mk('素早いマンタ',0),m3=mk('素早いマンタ',0),bhl=mk('ブラック・ホール',0);
gameState.players[0].mz=[mt];gameState.players[0].hand=[bhl];gameState.players[0].deck.push(m2,m3);baselineA();
MULTI=[m2.uid,m3.uid];duelActivateFromHand(0);drive();MULTI=null;
ok('C: destroyed by ブラック・ホール → both Deck copies special summoned',z(mt)==='grave'&&z(m2)==='mz'&&z(m3)==='mz');
audit('C');
fresh();
mt=mk('素早いマンタ',0,'up');m2=mk('素早いマンタ',0);let big=mk('ブラッド・ヴォルス',0),ms=mk('サイバー・ドラゴン',0);
gameState.players[0].mz=[mt];gameState.players[0].hand=[ms];gameState.players[0].deck.push(m2);baselineA();TRIG.length=0;
const tS=getLegalHandActions(0,0).find(a=>a.id==='normalSummon');
PREFER=[mt.uid];if(tS)(new Function(tS.run))();drive();PREFER=[];
ok('C2: tributed for a Tribute Summon (not a card effect) — no activation',z(mt)==='grave'&&z(m2)==='deck'&&!TRIG.some(t=>/マンタ/.test(t)),JSON.stringify({mt:z(mt),TRIG}));
audit('C2');

/* ===== D: ナーガ — returned face-up from the field to the Deck (ライトロード・モンク エイリン's attack): a Level 3 or lower monster (forced) ===== */
fresh();
let ng=mk('ナーガ',0,'up','def'),lv3=mk('N・グラン・モール',0),ei=mk('ライトロード・モンク エイリン',1,'up');
gameState.players[0].mz=[ng];gameState.players[0].deck=[lv3];gameState.players[1].mz=[ei];gameState.activePlayer=1;gameState.phase='battle';baselineA();TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('D: エイリン returned ナーガ to the Deck → N・グラン・モール (Lv3) special summoned',z(lv3)==='mz'&&z(ng)==='deck'&&TRIG.some(t=>/ナーガ/.test(t)),JSON.stringify({lv3:z(lv3),ng:z(ng),TRIG}));
audit('D');

/* ===== E: 冥界の使者 — sent from the field to the GY: each player adds a Level 3 or lower Normal Monster from their own Deck ===== */
fresh();
let mc=mk('冥界の使者',0,'up'),n0=mk('ワイト',0),n1=mk('ワイト',1),bl=mk('ブラック・ホール',0);
gameState.players[0].mz=[mc];gameState.players[0].hand=[bl];gameState.players[0].deck=[n0,mk('サイバー・ドラゴン',0)];gameState.players[1].deck=[n1,mk('サイバー・ドラゴン',1)];baselineA();SEEN=[];
const h0=gameState.players[0].hand.length,h1=gameState.players[1].hand.length;
duelActivateFromHand(0);drive();
ok('E: both players added their ワイト (Normal, Lv1); each chose from their own Deck',z(n0)==='hand'&&z(n1)==='hand'&&SEEN.filter(s=>/冥界の使者/.test(s.title)).map(s=>s.player).join(',')==='0,1',JSON.stringify(SEEN));
audit('E');
`);
