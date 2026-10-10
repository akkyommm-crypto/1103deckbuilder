/* S03-U264: attacker-aware attack restriction + multi-turn lingering effects — ヒーロー・ヘイロー, エレメント・ソルジャー, ネクロ・ディフェンダー, メテオ・レイン, 泉の精霊, 味方殺しの女騎士, 能力調整, D－HERO デビルガイ. Real DUEL paths (turns advanced by the processor); Replay-audited. */
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
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function ctl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function legalHand(name,p,i){const P=gameState.players[p],c=P.hand[i];return strictScriptLegalityV2(name,p,'hand',i,{cardOverride:c,logicalZone:'sz',prospectiveIndex:(P.sz||[]).length});}
function hitT(p,a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:findCardByUid(a.uid).index,target:findCardByUid(t.uid).index});drive();}
function drawIfNeeded(){if(gameState.phase==='draw'){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();}}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function nextTurn(){toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();}

/* ===== A: ヒーロー・ヘイロー — equips to a Warrior with ATK ≤ 1500; the opponent's monsters with ATK ≥ 1900 cannot attack it ===== */
fresh();
let hh=setT('ヒーロー・ヘイロー',0),bl=up('E・HERO バーストレディ',0),be=up('青眼の白龍',1),wt=up('ワイト',1);
gameState.players[0].sz=[hh];gameState.players[0].mz=[bl];gameState.players[1].mz=[be,wt];baselineA();
PREFER=[bl.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('A: activated and equipped to E・HERO バーストレディ (1200)',z(hh)==='sz'&&C(hh).equipTo?.uid===bl.uid,JSON.stringify({eq:C(hh).equipTo}));
nextTurn();toPhase('battle');
hitT(1,be,bl);
ok('A: the opponent\'s 青眼の白龍 (3000) cannot attack it',z(bl)==='mz'&&!C(be).attacked,JSON.stringify({bl:z(bl),att:C(be).attacked}));
hitT(1,wt,bl);
ok('A: ワイト (300) can attack it (and is destroyed)',z(wt)==='grave'&&z(bl)==='mz',JSON.stringify({wt:z(wt)}));
audit('A');

/* ===== B: エレメント・ソルジャー — WATER on the field: control cannot change; EARTH: effect monsters it destroys are negated ===== */
fresh();
let es=up('エレメント・ソルジャー',0);gameState.players[0].mz=[es,up('ひょうすべ',0)];gameState.players[1].hand=[mk('心変わり',1)];gameState.activePlayer=1;baselineA();
cast(1,'心変わり',[es.uid]);
ok('B: a WATER monster on the field — 心変わり does not take it',ctl(es)===0);
audit('B');
fresh();
es=up('エレメント・ソルジャー',0);let kt=up('キラー・トマト',1);gameState.players[0].mz=[es,up('E・HERO クレイマン',0,'def')];gameState.players[1].mz=[kt];gameState.phase='battle';baselineA();
hitT(0,es,kt);
ok('B2: an EARTH monster on the field — キラー・トマト destroyed by it, its effect negated (nothing summoned)',z(kt)==='grave'&&gameState.players[1].mz.length===0,JSON.stringify({mz1:gameState.players[1].mz.map(cardName)}));
audit('B2');
fresh();
es=up('エレメント・ソルジャー',0);kt=up('キラー・トマト',1);gameState.players[0].mz=[es];gameState.players[1].mz=[kt];gameState.phase='battle';baselineA();
hitT(0,es,kt);
ok('B3 control: no EARTH monster — キラー・トマト summons ワイト',gameState.players[1].mz.some(c=>cardName(c)==='ワイト'));

/* ===== C: ネクロ・ディフェンダー — banished from the GY: until the next opponent End Phase the chosen monster is not destroyed by battle and its controller takes no battle damage from it ===== */
fresh();
let nd=mk('ネクロ・ディフェンダー',0),w0=up('ワイト',0);be=up('青眼の白龍',1);
gameState.players[0].grave=[nd];gameState.players[0].mz=[w0];gameState.players[1].mz=[be];baselineA();
PREFER=[w0.uid];duelActivateFromZone(0,'grave',0);drive();PREFER=[];
ok('C: banished; registered as a lingering source until turn 6',z(nd)==='banish'&&(gameState.lingerLongS03||[]).some(e=>e.uid===nd.uid&&e.untilTurn===6),JSON.stringify({nd:z(nd),ll:gameState.lingerLongS03}));
nextTurn();toPhase('battle');
hitT(1,be,w0);
ok('C: the opponent\'s turn — ワイト survives 青眼 and its controller takes no damage',z(w0)==='mz'&&gameState.players[0].lp===8000,JSON.stringify({w0:z(w0),lp0:gameState.players[0].lp}));
audit('C');
nextTurn();nextTurn();toPhase('battle');
hitT(1,be,w0);
ok('C: two turns later the protection is over — destroyed, 2700 damage',gameState.turn===8&&z(w0)==='grave'&&gameState.players[0].lp===8000-2700&&!(gameState.lingerLongS03||[]).length,JSON.stringify({t:gameState.turn,w0:z(w0),lp0:gameState.players[0].lp}));

/* ===== D: メテオ・レイン — this turn its controller's monsters inflict piercing damage ===== */
fresh();
let mr=setT('メテオ・レイン',0);be=up('青眼の白龍',0);let wd=up('ワイト',1,'def');
gameState.players[0].sz=[mr];gameState.players[0].mz=[be];gameState.players[1].mz=[wd];baselineA();
duelActivateFromZone(0,'sz',0);drive();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
hitT(0,be,wd);
ok('D: 青眼 attacks Defense ワイト (DEF 200): 2800 piercing damage',z(wd)==='grave'&&gameState.players[1].lp===8000-2800,JSON.stringify({lp1:gameState.players[1].lp}));
audit('D');
fresh();
be=up('青眼の白龍',0);wd=up('ワイト',1,'def');gameState.players[0].mz=[be];gameState.players[1].mz=[wd];gameState.phase='battle';baselineA();
hitT(0,be,wd);
ok('D2 control: no piercing without it',gameState.players[1].lp===8000);

/* ===== E: 泉の精霊 — an Equip Spell from the GY to the hand; it cannot be activated this turn ===== */
fresh();
let ds=mk('団結の力',0);gameState.players[0].grave=[ds];gameState.players[0].hand=[mk('泉の精霊',0)];gameState.players[0].mz=[up('ワイト',0)];baselineA();
cast(0,'泉の精霊',[ds.uid]);
const iE=gameState.players[0].hand.findIndex(c=>c.uid===ds.uid);
const lgE=iE>=0?legalHand('団結の力',0,iE):{ok:true};
ok('E: 団結の力 added to the hand and not activatable this turn',z(ds)==='hand'&&!lgE.ok&&/泉の精霊/.test(lgE.reason),JSON.stringify({z:z(ds),lgE}));
audit('E');
nextTurn();nextTurn();toPhase('main1');
const iE2=gameState.players[0].hand.findIndex(c=>c.uid===ds.uid);
ok('E: its controller\'s next turn — activatable',iE2>=0&&legalHand('団結の力',0,iE2).ok,JSON.stringify({t:gameState.turn,ph:gameState.phase}));

/* ===== F: 味方殺しの女騎士 — each own Standby Phase: release another own monster, or it is destroyed ===== */
fresh();
let kn=up('味方殺しの女騎士',0);w0=up('ワイト',0);gameState.players[0].mz=[kn,w0];gameState.phase='draw';baselineA();
PREFER=['rel'+w0.uid];requestProcessorV27(PROCESSOR_V27.PHASE,{to:'standby'});drive();PREFER=[];
ok('F: ワイト released, the knight stays',z(w0)==='grave'&&z(kn)==='mz',JSON.stringify({w0:z(w0),kn:z(kn)}));
audit('F');
fresh();
kn=up('味方殺しの女騎士',0);gameState.players[0].mz=[kn];gameState.phase='draw';baselineA();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'standby'});drive();
ok('F2: no other monster — the knight is destroyed',z(kn)==='grave');

/* ===== G: 能力調整 — its controller's face-up monsters lose 1 Level until the End Phase ===== */
fresh();
let g1=up('E・HERO クレイマン',0),g2=up('ワイト',0);gameState.players[0].mz=[g1,g2];gameState.players[0].hand=[mk('能力調整',0)];gameState.players[1].mz=[up('ワイト',1)];baselineA();
cast(0,'能力調整');
ok('G: Levels 4 → 3 and 1 → 0 this turn; the opponent\'s unchanged',curLV(C(g1))===3&&curLV(C(g2))===0&&curLV(gameState.players[1].mz[0])===1,JSON.stringify({l1:curLV(C(g1)),l2:curLV(C(g2))}));
audit('G');
nextTurn();
ok('G: next turn — back to 4',curLV(C(g1))===4);

/* ===== H: D－HERO デビルガイ — banish an opponent monster; its player cannot battle this turn; the monster returns at the 2nd own Standby Phase ===== */
fresh();
let dg=up('D－HERO デビルガイ',0),w2=up('ワイト',0);be=up('青眼の白龍',1,'def');
gameState.players[0].mz=[dg,w2];gameState.players[1].mz=[be];baselineA();
PREFER=[be.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('H: 青眼 banished; a return is scheduled',z(be)==='banish'&&(gameState.scheduledV7||[]).some(e=>e.handler==='s03u264.devilguy-return'),JSON.stringify({be:z(be)}));
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:findCardByUid(w2.uid).index,target:'direct'});drive();
ok('H: its player cannot battle this turn',gameState.players[1].lp===8000&&!canDeclareAttackV48(C(w2)));
audit('H');
nextTurn();nextTurn();toPhase('standby');
ok('H: the first own Standby Phase (turn 7) — still banished',gameState.turn===7&&z(be)==='banish',JSON.stringify({t:gameState.turn,be:z(be)}));
nextTurn();nextTurn();toPhase('standby');
ok('H: the second own Standby Phase (turn 9) — 青眼 back on the opponent\'s field in Defense Position',gameState.turn===9&&z(be)==='mz'&&findCardByUid(be.uid).p===1&&C(be).pos==='def',JSON.stringify({t:gameState.turn,be:z(be),pos:C(be)&&C(be).pos}));
`);
