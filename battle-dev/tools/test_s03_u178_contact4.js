/* S03-U178: contact fusion with the whole texts — VWXYZ－ドラゴン・カタパルトキャノン (1/turn banish; on attacking a monster, change the
   attack target's position without its flip effect) and 混沌幻魔アーミタイル (+10000 ATK during its controller's turn; not destroyed by
   battle). Real DUEL paths; Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
let PREFER=[],TRIG=[];
function drive(){for(let i=0;i<600;i++){
  const q=pc();
  if(q){let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function contact(name,p){const i=gameState.players[p].ex.findIndex(c=>cardName(c)===name);finishSummonProcedure(name,p,'ex',i,'atk');drive();}
function fire(c){const h=findCardByUid(c.uid);const L=strictScriptLegalityV2(cardName(c),h.p,'mz',h.index,{});if(!L.ok)return L.reason;duelActivateFromZone(h.p,'mz',h.index);drive();return true;}
function attack(p,a,t){const ai=gameState.players[p].mz.indexOf(findCardByUid(a.uid).card),ti=gameState.players[p===0?1:0].mz.indexOf(findCardByUid(t.uid).card);requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:ai,target:ti});drive();}

/* ===== A: VWXYZ — contact (VW + XYZ banished), ① banish 1 opponent card once per turn ===== */
fresh();
let vw=mk('VW－タイガー・カタパルト',0,'up'),xyz=mk('XYZ－ドラゴン・キャノン',0,'up');gameState.players[0].mz=[vw,xyz];
let cat=mk('VWXYZ－ドラゴン・カタパルトキャノン',0,'up');gameState.players[0].ex=[cat];
let s1=mk('聖なるバリア －ミラーフォース－',1,'down'),s2=mk('サイクロン',1,'down');gameState.players[1].sz=[s1,s2];baselineA();
contact('VWXYZ－ドラゴン・カタパルトキャノン',0);
ok('A: contact-summoned; VW and XYZ banished',z(cat)==='mz'&&z(vw)==='banish'&&z(xyz)==='banish');
PREFER=[s2.uid];const r1=fire(cat);PREFER=[];
ok('A: ① banishes the chosen opponent card',r1===true&&z(s2)==='banish'&&z(s1)==='sz');
ok('A: ① once per turn',fire(cat)!==true&&z(s1)==='sz');
audit('A');

/* ===== B: ② on attacking a face-down Defense Position monster: it becomes face-up Attack Position, no flip effect ===== */
fresh();
cat=mk('VWXYZ－ドラゴン・カタパルトキャノン',0,'up');gameState.players[0].mz=[cat];
let pot=mk('メタモルポット',1,'down','def');gameState.players[1].mz=[pot];gameState.players[1].hand=[mk('サイクロン',1)];
gameState.phase='battle';baselineA();
TRIG=[];attack(0,cat,pot);
ok('B: ② was offered at the attack declaration',TRIG.some(g=>g.indexOf('VWXYZ－ドラゴン・カタパルトキャノン')>=0),JSON.stringify(TRIG));
ok('B: メタモルポット turned face-up Attack Position, its flip effect did not activate, and it was destroyed by battle (3000 vs 700)',
  z(pot)==='grave'&&!TRIG.some(g=>g.indexOf('メタモルポット')>=0)&&gameState.players[1].hand.length===1&&gameState.players[1].lp===8000-2300,
  JSON.stringify({pot:z(pot),TRIG,lp:gameState.players[1].lp,h:gameState.players[1].hand.length}));
audit('B');

/* ===== C: アーミタイル — contact from the three Sacred Beasts; 10000 on its controller's turn, 0 on the opponent's; not destroyed by battle ===== */
fresh();
let sbU=mk('神炎皇ウリア',0,'up'),sbH=mk('降雷皇ハモン',0,'up'),sbR=mk('幻魔皇ラビエル',0,'up');gameState.players[0].mz=[sbU,sbH,sbR];
let arm=mk('混沌幻魔アーミタイル',0,'up');gameState.players[0].ex=[arm];baselineA();
contact('混沌幻魔アーミタイル',0);
ok('C: contact-summoned; the three banished; 10000 ATK during its controller’s turn',z(arm)==='mz'&&[sbU,sbH,sbR].every(c=>z(c)==='banish')&&curATK(findCardByUid(arm.uid).card)===10000);
audit('C');
fresh();
arm=mk('混沌幻魔アーミタイル',0,'up');gameState.players[0].mz=[arm];let big=mk('青眼の白龍',1,'up');gameState.players[1].mz=[big];
gameState.activePlayer=1;gameState.phase='battle';baselineA();
const atkOpp=curATK(arm);
attack(1,big,arm);
ok('C: on the opponent’s turn it has 0 ATK; attacked by 青眼の白龍 it is not destroyed (its controller takes 3000)',atkOpp===0&&z(arm)==='mz'&&gameState.players[0].lp===5000,JSON.stringify({atkOpp,z:z(arm),lp:gameState.players[0].lp}));
audit('C2');
`);
