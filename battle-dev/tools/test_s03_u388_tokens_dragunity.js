/* S03-U388: 雲魔物－羊雲, ジュラック・スタウリコ, ドラグニティ－ピルム, ドラグニティアームズ－ミスティル (NOT_STARTED cards).
   Real DUEL paths, Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];const SEEN=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3880001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function equipped(host,eq){const h=C(host),e=C(eq);return !!h&&!!e&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0;}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function cc(c){const x=C(c);return x&&x.counters?Number(x.counters['魔力'])||0:0;}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

function offeredTo(p,c){return !!(gameState.chainWindow&&gameState.chain.length&&getChainResponsesV2(p).some(x=>x.card===c));}
function respond(p,c,prefer){const hh=findCardByUid(c.uid); if(!hh) return false;
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,hh.zone,hh.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];return true;}
function foeCast(name,prefer){const i=gameState.players[1].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let i2=0;i2<10&&pc();i2++)pick();PREFER=[];}
function actZ(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}

function sz(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function actSz(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function legalSz(c){return strictScriptLegalityV2(cardName(c),0,'sz',idx(c)).ok;}
function gv(c){return curATK(C(c));}














const SHE='雲魔物－羊雲',STA='ジュラック・スタウリコ',PIL='ドラグニティ－ピルム',MIS='ドラグニティアームズ－ミスティル';
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
function tribDb(name){return dbOf({id:findCardIndex(name)});}

/* ===== tokens ===== */
function tokenCase(name,tokName,only,okOther,okOnly){
  fresh();const s=mon(name,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[s];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,s);
  const toks=gameState.players[0].mz.filter(c=>cardName(c)===tokName);
  ok(name+': destroyed by battle -> two '+tokName+' in Defense Position (0/0)',z(s)==='grave'&&toks.length===2&&toks.every(c=>c.pos==='def'&&curATK(c)===0&&curDEF(c)===0),JSON.stringify([z(s),toks.length]));
  const other=tributeCandidates(0,tribDb(okOther)).filter(x=>cardName(x.card)===tokName).length;
  const mine=tributeCandidates(0,tribDb(okOnly)).filter(x=>cardName(x.card)===tokName).length;
  ok(name+': the tokens cannot be Tributed for a monster without 「'+only+'」 in its name (offered for one with it)',other===0&&mine===2,JSON.stringify([other,mine]));
  audit(name+' tokens'); }
tokenCase(SHE,'雲魔物トークン','雲魔物','青眼の白龍','雲魔物－ニンバスマン');
tokenCase(STA,'ジュラックトークン','ジュラック','青眼の白龍','ジュラック・ティラヌス');
{ fresh();const s=mon(SHE,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[s,mon('ワイト',0),mon('ワイト',0),mon('ワイト',0),mon('ワイト',0)];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,s);
  ok('羊雲 negative: only one free Monster Zone after the destruction (two Tokens need two) -> no token',gameState.players[0].mz.filter(c=>cardName(c)==='雲魔物トークン').length===0,''); }

/* ===== ドラグニティ－ピルム ===== */
{ fresh();const p=mk(PIL,0),dx=mk('ドラグニティ－ドゥクス',0),bl=mon('ライオウ',1);
  gameState.players[0].hand=[p,dx];gameState.players[1].mz=[bl];baselineA();
  PREFER=[uid(dx)];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('ピルム: Normal Summoned -> ドラグニティ－ドゥクス (Winged Beast) Special Summoned from the hand and the Pilum itself equipped to it',z(dx)==='mz'&&z(p)==='sz'&&!!C(p).v46MonsterEquip&&C(p).equipTo&&C(p).equipTo.uid===dx.uid,JSON.stringify([z(dx),z(p),!!(C(p)&&C(p).v46MonsterEquip)]));
  phase('battle');const l1=lp(1),a0=curATK(C(dx));
  atkTarget(0,dx,'direct');
  ok('ピルム: the equipped monster attacks directly although the opponent controls a monster; the battle damage is halved ('+a0+' -> '+Math.floor(a0/2)+')',lp(1)===l1-Math.floor(a0/2)&&a0>=1500,JSON.stringify([l1,lp(1),a0]));
  audit('ピルム 1'); }
{ fresh();const p=mk(PIL,0),w=mk('ワイト',0);gameState.players[0].hand=[p,w];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('ピルム negative: no 「ドラグニティ」 Winged Beast in the hand -> only the Normal Summon',z(p)==='mz',z(p)); }

/* ===== ドラグニティアームズ－ミスティル ===== */
{ fresh();const m=mk(MIS,0),dx=mon('ドラグニティ－ドゥクス',0),sp=mk('ドラグニティ－ブラックスピア',0),od=mk('ワイト',0);
  gameState.players[0].hand=[m];gameState.players[0].mz=[dx];gameState.players[0].grave=[sp,od];baselineA();
  ok('ミスティル: Special Summonable from the hand with a face-up 「ドラグニティ」 on my field',procOk(MIS,0)===true,'');
  PREFER=[uid(dx),uid(sp)];procRun(MIS,0);PREFER=[];
  ok('ミスティル: the 「ドラグニティ」 was sent to the Graveyard (cost) and ミスティル is on the field',z(dx)==='grave'&&z(m)==='mz',JSON.stringify([z(dx),z(m)]));
  ok('ミスティル: a Dragon 「ドラグニティ」 of the Graveyard (ブラックスピア) was equipped to it',z(sp)==='sz'&&C(sp).equipTo&&C(sp).equipTo.uid===m.uid,JSON.stringify([z(sp),C(sp)&&C(sp).equipTo&&C(sp).equipTo.uid]));
  audit('ミスティル 1'); }
{ fresh();const m=mk(MIS,0);gameState.players[0].hand=[m];gameState.players[0].mz=[mon('ワイト',0)];baselineA();
  ok('ミスティル negative: no face-up 「ドラグニティ」 on my field -> not Special Summonable',procOk(MIS,0)===false,''); }
`);
