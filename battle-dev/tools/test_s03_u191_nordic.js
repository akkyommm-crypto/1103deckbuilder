/* S03-U191: 極星 — 極星天ヴァルキュリア, 極星霊デックアールヴ, 極星霊リョースアールヴ, 極星霊ドヴェルグ, 極星獣グルファクシ, 極星獣ガルム, 極星天ミーミル.
   Fixed: 「極星」モンスター filters also matched the 極星宝 Spells; ドヴェルグ ① is a non-activated grant (NORMAL_SUMMON reducer), ② a forced
   targeting trigger only when it left the field face-up. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function hi(c){return gameState.players[0].hand.indexOf(C(c));}
function summon(c,extra){PREFER=(extra||[]).slice();doNormalSummon(hi(c),'atk');drive();PREFER=[];}

/* ===== A: ヴァルキュリア — banish 2 「極星」 monsters from the hand (not the 極星宝 Spell): 2 エインヘリアル・トークン ===== */
fresh();
let va=mk('極星天ヴァルキュリア',0),n1=mk('極星獣ガルム',0),n2=mk('極星獣グルファクシ',0),rl=mk('極星宝グングニル',0);
gameState.players[0].hand=[va,rl,n1,n2];gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();
summon(va,[n1.uid,'yes',n2.uid]);
const tk=gameState.players[0].mz.filter(c=>c.token);
ok('A: ガルム and グルファクシ banished; 極星宝グングニル stays in the hand; 2 tokens in Defense Position',z(n1)==='banish'&&z(n2)==='banish'&&z(rl)==='hand'&&tk.length===2&&tk.every(c=>c.pos==='def'));
audit('A');
fresh();
va=mk('極星天ヴァルキュリア',0);n1=mk('極星獣ガルム',0);rl=mk('極星宝グングニル',0);
gameState.players[0].hand=[va,rl,n1];gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();TRIG.length=0;
summon(va);
ok('A2: one 「極星」 monster + a 極星宝 Spell in the hand — ヴァルキュリア cannot activate',!TRIG.some(t=>/ヴァルキュリア/.test(t))&&gameState.players[0].mz.length===1&&z(n1)==='hand',JSON.stringify(TRIG));
audit('A2');

/* ===== B: デックアールヴ — Tribute Summon; a 「極星」 monster from the GY to the hand (the 極星宝 Spell is not a candidate) ===== */
fresh();
let da=mk('極星霊デックアールヴ',0),w1=mk('ワイト',0,'up'),gg=mk('極星獣ガルム',0),gr=mk('極星宝グングニル',0);
gameState.players[0].hand=[da];gameState.players[0].mz=[w1];gameState.players[0].grave=[gr,gg];baselineA();
let SEEN=[];const oldStep=step;
summon(da,[w1.uid,gg.uid]);
ok('B: ガルム added to the hand; グングニル stays',z(da)==='mz'&&z(gg)==='hand'&&z(gr)==='grave');
audit('B');

/* ===== C: リョースアールヴ — a 「極星」 monster whose Level is at most the chosen monster's, from the hand ===== */
fresh();
let ly=mk('極星霊リョースアールヴ',0),base=mk('ギガンテス',0,'up'),gm=mk('極星獣ガルム',0);rl=mk('極星宝グングニル',0);
gameState.players[0].hand=[ly,rl,gm];gameState.players[0].mz=[base];baselineA();
summon(ly,[base.uid,gm.uid]);
ok('C: ガルム (Lv4 ≤ ギガンテス Lv4) special summoned; the Spell stays',z(gm)==='mz'&&z(rl)==='hand');
audit('C');

/* ===== D: ドヴェルグ — ① the extra 「極星」 summon is granted with the summon (no chain); ② destroyed → a 極星宝 from the GY (forced) ===== */
fresh();
let dv=mk('極星霊ドヴェルグ',0);gm=mk('極星獣ガルム',0);let br=mk('極星宝グングニル',0),bh=mk('ブラック・ホール',0);
gameState.players[0].hand=[dv,gm,bh];gameState.players[0].grave=[br];baselineA();TRIG.length=0;
summon(dv);
const LD=getLegalHandActions(0,hi(gm)).map(a=>a.id);
ok('D: ① no trigger, no chain; an extra summon of ガルム is offered',!TRIG.some(t=>/ドヴェルグ/.test(t))&&LD.some(x=>/extra|Extra/.test(x)),JSON.stringify({TRIG,LD}));
const ex=getLegalHandActions(0,hi(gm)).find(a=>/extra|Extra/.test(a.id));
if(ex) (new Function(ex.run))();drive();
ok('D: ガルム summoned in addition',z(gm)==='mz'&&z(dv)==='mz');
duelActivateFromHand(hi(bh));drive();
ok('D: ② ブラック・ホール destroys ドヴェルグ (and ガルム) → グングニル added to the hand (forced)',z(dv)==='grave'&&z(br)==='hand',JSON.stringify({dv:z(dv),br:z(br),TRIG,gi:C(dv).graveInfo,ev:(gameState.deferredEvents||[]).map(e=>e.eventName)}));
audit('D');

/* ===== D2: ドヴェルグ discarded from the hand — ② does not activate ===== */
fresh();
dv=mk('極星霊ドヴェルグ',0);br=mk('極星宝グングニル',0);let lvx=mk('ライトニング・ボルテックス',0);
gameState.players[0].hand=[lvx,dv];gameState.players[0].grave=[br];gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();TRIG.length=0;
PREFER=[dv.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D2: discarded from the hand (ライトニング・ボルテックス cost) — no activation, グングニル stays',z(dv)==='grave'&&z(br)==='grave'&&!TRIG.some(t=>/ドヴェルグ/.test(t)),JSON.stringify(TRIG));
audit('D2');

/* ===== E: グルファクシ — special summoned from the hand while the opponent controls a face-up Synchro and the controller no monster ===== */
fresh();
let gf=mk('極星獣グルファクシ',0);gameState.players[0].hand=[gf];gameState.players[1].mz=[mk('スターダスト・ドラゴン',1,'up')];baselineA();
ok('E: procedure legal',strictSummonProcedureLegality('極星獣グルファクシ',0,'hand',0).ok===true);
finishSummonProcedure('極星獣グルファクシ',0,'hand',0,'atk');drive();
ok('E: special summoned',z(gf)==='mz');
fresh();
gf=mk('極星獣グルファクシ',0);gameState.players[0].hand=[gf];gameState.players[0].mz=[mk('ワイト',0,'up')];gameState.players[1].mz=[mk('スターダスト・ドラゴン',1,'up')];baselineA();
ok('E2: not while the controller has a monster',strictSummonProcedureLegality('極星獣グルファクシ',0,'hand',0).ok===false);

/* ===== F: ガルム — after damage calculation with a Level 4 or lower monster: that monster returned to the hand ===== */
fresh();
gm=mk('極星獣ガルム',0,'up');let ow=mk('ワイト',1,'up');
gameState.players[0].mz=[gm];gameState.players[1].mz=[ow];baselineA();
phase('battle');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('F: the attacked ワイト returned to the hand (not to the GY)',z(ow)==='hand'&&z(gm)==='mz',JSON.stringify({ow:z(ow),TRIG}));
audit('F');
/* ===== G: ミーミル — at the controller's Standby Phase, with a face-up 「極星」 monster: send a Spell from the hand, special summon it from the GY ===== */
fresh();
let mi=mk('極星天ミーミル',0),sp=mk('死者蘇生',0);gm=mk('極星獣ガルム',0,'up');
gameState.players[0].grave=[mi];gameState.players[0].mz=[gm];gameState.players[0].hand=[sp];baselineA();TRIG.length=0;
phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});drive();
phase('standby');
ok('G: not in the opponent’s Standby Phase',!TRIG.some(t=>/ミーミル/.test(t))&&z(mi)==='grave');
phase('main1');phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();
PREFER=[sp.uid];phase('standby');PREFER=[];
ok('G: own Standby Phase — 死者蘇生 sent to the GY, ミーミル special summoned',gameState.activePlayer===0&&z(sp)==='grave'&&z(mi)==='mz',JSON.stringify({ap:gameState.activePlayer,sp:z(sp),mi:z(mi),TRIG}));
audit('G');
`);
