/* S03-U183: 剣闘獣の闘器 (グラディウス / マニカ / デーモンズシールド / ハルバード; engine/1ZZB: mandatory equip substitute, return to hand after
   the equipped monster went back to the Deck), 剣闘獣の戦車, 剣闘獣の底力. Real DUEL paths; Replay-audited.
   Other cards named here are TESTED / GENERIC_OK. */
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
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:4},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[];
function step(){const q=pc();if(q){let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toWindow(p){for(let i=0;i<200;i++){
  if(step())continue;
  if(gameState.chainWindow&&gameState.chain.length){if(gameState.chainWindow.priority===p)return true;chainPassV2();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function attack(p,a,t){const ai=gameState.players[p].mz.indexOf(C(a)),ti=gameState.players[p===0?1:0].mz.indexOf(C(t));requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:ai,target:ti});drive();}
function equip(name,target){const c=mk(name,0);gameState.players[0].hand.push(c);return c;}
function setup(armsName){
  fresh();
  const rq=mk('剣闘獣ラクエル',0,'up');gameState.players[0].mz=[rq];const arms=mk(armsName,0);gameState.players[0].hand=[arms];
  return {rq,arms};
}
function activate(card,target){PREFER=[target.uid];duelActivateFromHand(gameState.players[0].hand.indexOf(C(card)));drive();PREFER=[];}

/* ===== A: グラディウス +300; the equipped ラクエル tags out (returns to the Deck) → グラディウス back to the hand ===== */
let s=setup('剣闘獣の闘器グラディウス');let hop=mk('剣闘獣ホプロムス',0);gameState.players[0].deck.push(hop);let w1=mk('ワイト',1,'up');gameState.players[1].mz=[w1];baselineA();
activate(s.arms,s.rq);
ok('A: グラディウス equipped to ラクエル: ATK 1800 + 300',z(s.arms)==='sz'&&curATK(C(s.rq))===2100);
phase('battle');
attack(0,s.rq,w1);TRIG=[];PREFER=[hop.uid,'atk'];phase('main2');PREFER=[];
ok('A: ラクエル tagged out to the Deck → グラディウス went to the GY and its forced trigger returned it to the hand',z(s.rq)==='deck'&&z(s.arms)==='hand'&&TRIG.some(g=>g.indexOf('剣闘獣の闘器グラディウス')>=0),JSON.stringify({rq:z(s.rq),arms:z(s.arms),TRIG}));
audit('A');

/* ===== B: マニカ — the equipped monster is not destroyed by battle ===== */
s=setup('剣闘獣の闘器マニカ');let gi=mk('ギガンテス',1,'up');gameState.players[1].mz=[gi];baselineA();
activate(s.arms,s.rq);phase('battle');
attack(0,s.rq,gi);
ok('B: ラクエル (1800) attacks ギガンテス (1900) with マニカ — not destroyed',z(s.rq)==='mz'&&z(s.arms)==='sz');
audit('B');

/* ===== C: デーモンズシールド — battle and effect destruction: the shield is destroyed instead ===== */
s=setup('剣闘獣の闘器デーモンズシールド');gi=mk('ギガンテス',1,'up');gameState.players[1].mz=[gi];baselineA();
activate(s.arms,s.rq);phase('battle');
TRIG=[];attack(0,s.rq,gi);
ok('C: destroyed by battle → デーモンズシールド destroyed instead, ラクエル stays (no battle-destruction trigger for it)',z(s.rq)==='mz'&&z(s.arms)==='grave'&&findCardByUid(s.arms.uid).card.graveInfo.byDestroy===true);
audit('C');
s=setup('剣闘獣の闘器デーモンズシールド');let eqk=mk('地割れ',1);gameState.players[1].hand=[eqk];gameState.players[1].mz=[mk('ギガンテス',1,'up')];baselineA();
activate(s.arms,s.rq);
phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');
duelActivateFromHand(gameState.players[1].hand.indexOf(C(eqk)));drive();
ok('C: the opponent’s 地割れ → the shield is destroyed instead of ラクエル',z(s.rq)==='mz'&&z(s.arms)==='grave'&&z(eqk)==='grave');
audit('C2');

/* ===== D: ハルバード — after the equipped monster attacks, destroy a Spell / Trap at the end of the Damage Step ===== */
s=setup('剣闘獣の闘器ハルバード');let st=mk('強欲な壺',1,'down');gameState.players[1].sz=[st];w1=mk('ワイト',1,'up');gameState.players[1].mz=[w1];baselineA();
activate(s.arms,s.rq);phase('battle');
TRIG=[];PREFER=[st.uid];attack(0,s.rq,w1);PREFER=[];
ok('D: ハルバード’s trigger destroyed the set 強欲な壺 after the attack',z(st)==='grave'&&TRIG.some(g=>g.indexOf('剣闘獣の闘器ハルバード')>=0),JSON.stringify({st:z(st),TRIG}));
audit('D');

/* ===== E: 剣闘獣の戦車 — negates the opponent’s monster effect activation while a 「剣闘獣」 is on the field ===== */
fresh();
let rq=mk('剣闘獣ラクエル',0,'up');gameState.players[0].mz=[rq];let ch=mk('剣闘獣の戦車',0,'down');ch.setTurn=4;gameState.players[0].sz=[ch];
let gn=mk('E・HERO グラン・ネオス',1,'up');gn.properlySummonedS03=true;gameState.players[1].mz=[gn];gameState.activePlayer=1;baselineA();
PREFER=[rq.uid];duelActivateFromZone(1,'mz',0);
const win=toWindow(0);const offered=win&&getChainResponsesV2(0).some(r=>r.card===ch);
if(offered)duelActivateResponseV2(0,'sz',0);
drive();PREFER=[];
ok('E: 剣闘獣の戦車 offered; グラン・ネオス’s activation negated and destroyed; ラクエル stays',offered&&z(gn)==='grave'&&z(rq)==='mz'&&z(ch)==='grave',JSON.stringify({offered,gn:z(gn),rq:z(rq)}));
audit('E');

/* ===== F: 剣闘獣の底力 — +500 until the End Phase; from the GY: return 2 other 「剣闘獣」 cards → back to the hand ===== */
fresh();
rq=mk('剣闘獣ラクエル',0,'up');gameState.players[0].mz=[rq];let so=mk('剣闘獣の底力',0);gameState.players[0].hand=[so];baselineA();
PREFER=[rq.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('F: +500 to ラクエル (2300); the spell went to the GY',curATK(C(rq))===2300&&z(so)==='grave');
audit('F');
fresh();
so=mk('剣闘獣の底力',0);let g1=mk('剣闘獣アンダル',0),g2;g2=mk('剣闘獣エクイテ',0);gameState.players[0].grave=[so,g1,g2];baselineA();
const Lg=strictScriptLegalityV2('剣闘獣の底力',0,'grave',0,{});
if(Lg.ok){duelActivateFromZone(0,'grave',0);drive();}
ok('F: from the GY — 2 other 「剣闘獣」 cards back to the Deck (cost), 剣闘獣の底力 to the hand',Lg.ok&&z(so)==='hand'&&z(g1)==='deck'&&z(g2)==='deck',JSON.stringify({Lg,so:z(so)}));
audit('F2');
`);
