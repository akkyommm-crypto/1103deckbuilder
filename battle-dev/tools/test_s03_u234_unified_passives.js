/* S03-U234: derived trigger passives for v4 unified cards (engine/45) and the manual position-change trigger drain (engine/70) — real DUEL checks
   of 王立魔法図書館, 魔法吸収, ブレードラビット, サボウ・ファイター, 士気高揚 (TESTED before only by direct script calls). Replay-audited.
   The position scenarios set gameState.posSnapV10 (the key engine/19 reads; the shared harness baseline sets positionSnapV10). */
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

/* ===== A: 王立魔法図書館 (onActivateSuccess) — real Spell activations put counters (max 3); remove 3 → draw 1 ===== */
fresh();
let lib=mk('王立魔法図書館',0,'up'),p1=mk('強欲な壺',0),p2=mk('強欲な壺',0),p3=mk('強欲な壺',0),p4=mk('強欲な壺',0);
gameState.players[0].mz=[lib];gameState.players[0].hand=[p1,p2,p3,p4];for(let i=0;i<6;i++)gameState.players[0].deck.push(mk('ワイト',0));baselineA();
duelActivateFromHand(0);drive();
ok('A: one real 強欲な壺 → 1 counter',API.countCounter(findCardByUid(lib.uid),'魔力')===1,JSON.stringify({n:API.countCounter(findCardByUid(lib.uid),'魔力'),TRIG}));
duelActivateFromHand(0);drive();duelActivateFromHand(0);drive();
const fullA=API.countCounter(findCardByUid(lib.uid),'魔力');
duelActivateFromHand(0);drive();
ok('A: 3 counters; a 4th Spell adds none',fullA===3&&API.countCounter(findCardByUid(lib.uid),'魔力')===3,JSON.stringify({fullA}));
const handA=gameState.players[0].hand.length;
duelActivateFromZone(0,'mz',0);drive();
ok('A: 3 removed → drew 1',API.countCounter(findCardByUid(lib.uid),'魔力')===0&&gameState.players[0].hand.length===handA+1,JSON.stringify({h:gameState.players[0].hand.length,handA}));
audit('A');

/* ===== B: 魔法吸収 (onActivateSuccess, Spell / Trap zone) — each Spell activation, either player's → its controller gains 500 ===== */
fresh();
let ab=mk('魔法吸収',0,'up'),gp=mk('強欲な壺',1);gameState.players[0].sz=[ab];gameState.players[1].hand=[gp];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('B: the opponent\'s 強欲な壺 → its controller gains 500',lp(0)===8500&&lp(1)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
audit('B');

/* ===== C: ブレードラビット (onPositionChange) — changed from Attack to face-up Defense Position by its controller → destroys an opponent monster ===== */
fresh();
let br=mk('ブレードラビット',0,'up','atk'),fw=mk('ワイト',1,'up');gameState.players[0].mz=[br];gameState.players[1].mz=[fw];gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();
zAct('TOGGLE_POS',0,'mz',0);drive();
ok('C: changed to Defense Position → the opponent ワイト destroyed',C(br).pos==='def'&&z(fw)==='grave',JSON.stringify({pos:C(br).pos,fw:z(fw),TRIG}));
audit('C');
fresh();
br=mk('ブレードラビット',0,'up','def');fw=mk('ワイト',1,'up');gameState.players[0].mz=[br];gameState.players[1].mz=[fw];gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();
zAct('TOGGLE_POS',0,'mz',0);drive();
ok('C2: Defense → Attack — nothing destroyed',C(br).pos==='atk'&&z(fw)==='mz',JSON.stringify({pos:C(br).pos,fw:z(fw)}));
audit('C2');

/* ===== D: サボウ・ファイター (onBattleDestroy) — destroys a monster by battle → a ニードルトークン on the opponent's field in Defense Position ===== */
fresh();
let sf=mk('サボウ・ファイター',0,'up'),vw=mk('ワイト',1,'up');gameState.players[0].mz=[sf];gameState.players[1].mz=[vw];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
const tokD=(gameState.players[1].mz||[]).filter(c=>c&&c.token);
ok('D: ワイト destroyed; a token on the opponent\'s field in Defense Position',z(vw)==='grave'&&tokD.length===1&&tokD[0].pos==='def'&&curATK(tokD[0])===500,JSON.stringify({vw:z(vw),tok:tokD.map(c=>[c.token.n,c.pos])}));
audit('D');

/* ===== E: 士気高揚 (onEquipAttached / onLeaveField) — an Equip Spell attached → its controller +1000; it leaves the field → its controller −1000 ===== */
fresh();
let mo=mk('士気高揚',0,'up'),bp=mk('黒いペンダント',0),cy=mk('サイクロン',0),mw=mk('ワイト',0,'up');
gameState.players[0].sz=[mo];gameState.players[0].hand=[bp,cy];gameState.players[0].mz=[mw];baselineA();
PREFER=[mw.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('E: 黒いペンダント equipped → +1000',z(bp)==='sz'&&lp(0)===9000,JSON.stringify({bp:z(bp),lp0:lp(0),TRIG}));
PREFER=[bp.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('E: the Equip Spell destroyed by サイクロン → −1000 (and the pendant deals 500 to the opponent)',z(bp)==='grave'&&z(mo)==='sz'&&lp(0)===8000&&lp(1)===7500,JSON.stringify({bp:z(bp),mo:z(mo),lp0:lp(0),lp1:lp(1)}));
audit('E');
`);
