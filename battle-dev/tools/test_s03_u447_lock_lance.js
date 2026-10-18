/* S03-U447: 挑発, 波動障壁, 城壁壊しの大槍, ツーマンセルバトル, 封神鏡 (stale ENGINE_GAP Traps / Spells).
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
let PREFER=[];function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x42F0001;
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

















































































const SEEN=[];
const PRO='挑発',BAR='波動障壁',LNC='城壁壊しの大槍',TWO='ツーマンセルバトル',MIR='封神鏡';
function H(c){return findCardByUid(c.uid);}
function setTrap(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':target});}
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(c){return (getChainResponsesV2(0)||[]).some(r=>r.card===c);}
function legalT(i){return strictScriptLegalityV2(cardName(gameState.players[0].sz[i]),0,'sz',i).ok;}
let ACCEPT=false;const __p=pick;pick=function(){const q=pc();if(ACCEPT&&q&&q.min===0&&q.title.indexOf('ツーマンセル')>=0){answerChoiceV49([q.candidates[0].key]);return;}return __p();};

/* ===== 挑発 ===== */
{ fresh();gameState.activePlayer=1;gameState.phase='main1';const tr=setTrap(PRO,0),a=mon('ワイト',0),b=mon('ブラック・マジシャン',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[a,b];gameState.players[1].mz=[f];baselineA();
  ok('挑発: activatable in the opponent Main Phase 1 with a monster of mine',legalT(0)===true,JSON.stringify(strictScriptLegalityV2(PRO,0,'sz',0)));
  PREFER=[uid(a)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('挑発: the opponent may attack only the selected monster (ワイト) — the other monster is refused',forcedAttackTargetReasonS03(1,C(a),C(f))===''&&forcedAttackTargetReasonS03(1,C(b),C(f))!=='',JSON.stringify([forcedAttackTargetReasonS03(1,C(a),C(f)),forcedAttackTargetReasonS03(1,C(b),C(f))]));
  audit('挑発 1'); }
{ fresh();const tr=setTrap(PRO,0),a=mon('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].mz=[a];baselineA();
  ok('挑発 negative: not in the opponent Main Phase 1 (my own turn) → not activatable',legalT(0)===false,''); }

/* ===== 波動障壁 ===== */
{ fresh();const tr=setTrap(BAR,0),sy=mon('C・ドラゴン',0),w=mon('ワイト',0),f=mon('青眼の白龍',1),g=mon('ブラック・マジシャン',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[sy,w];gameState.players[1].mz=[f,g];
  gameState.activePlayer=1;gameState.phase='battle';baselineA();const l1=lp(1);
  foeAttack(f,1);const ok1=toPoint('attackDeclare');const off=ok1&&offered(tr);if(off){PREFER=[uid(sy)];pointActivateV27(0,'sz',0);}drive();PREFER=[];
  ok('波動障壁: at the opponent attack declaration — my Synchro Monster was released, every Attack Position monster of the opponent turned Defense Position',off&&z(sy)==='grave'&&C(f).pos==='def'&&C(g).pos==='def',JSON.stringify([off,z(sy),C(f)&&C(f).pos,C(g)&&C(g).pos]));
  ok('波動障壁: the DEF of the attacker (青眼 2500) was dealt to the opponent',l1-lp(1)===2500,JSON.stringify([l1,lp(1)]));
  audit('波動障壁 1'); }
{ fresh();const tr=setTrap(BAR,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[w];gameState.players[1].mz=[f];
  gameState.activePlayer=1;gameState.phase='battle';baselineA();foeAttack(f,0);const ok1=toPoint('attackDeclare');
  ok('波動障壁 negative: no Synchro Monster of mine → not offered',!(ok1&&offered(tr)),String(ok1&&offered(tr))); }

/* ===== 城壁壊しの大槍 ===== */
{ fresh();const sp=mk(LNC,0,'up'),a=mon('ウィルミー',0),d=mk('ブラック・マジシャン',1,'down','def');d.setTurn=3;gameState.players[0].sz=[sp];gameState.players[0].mz=[a];gameState.players[1].mz=[d];baselineA();
  API.equipSpell(H(sp),H(a),'test');
  phase('battle');myAttack(a,d);
  ok('城壁壊しの大槍: the equipped monster (ATK 1000) attacking a face-down Defense monster gets +1500 (2500 > DEF 2100) → it was destroyed',z(d)==='grave'&&z(a)==='mz',JSON.stringify([z(d),z(a)]));
  audit('大槍 1'); }
{ fresh();const a=mon('ウィルミー',0),d=mk('ブラック・マジシャン',1,'down','def');d.setTurn=3;gameState.players[0].mz=[a];gameState.players[1].mz=[d];baselineA();
  const l0=lp(0);phase('battle');myAttack(a,d);
  ok('城壁壊しの大槍 control: unequipped ATK 1000 < DEF 2100 → it is not destroyed and I take the difference',z(d)==='mz'&&lp(0)<l0,JSON.stringify([z(d),l0,lp(0)])); }
{ fresh();const sp=mk(LNC,0,'up'),a=mon('ウィルミー',0),d=mon('ブラック・マジシャン',1,'def');gameState.players[0].sz=[sp];gameState.players[0].mz=[a];gameState.players[1].mz=[d];baselineA();
  API.equipSpell(H(sp),H(a),'test');const l0=lp(0);
  phase('battle');myAttack(a,d);
  ok('城壁壊しの大槍 negative: a face-up Defense target gets no bonus (1000 < 2100)',z(d)==='mz'&&curATK(C(a))===1000&&lp(0)<l0,JSON.stringify([z(d),curATK(C(a)),l0,lp(0)])); }

/* ===== ツーマンセルバトル ===== */
{ fresh();const s=mk(TWO,0,'up'),w=mk('ウィルミー',0);gameState.players[0].hand=[s,w];baselineA();
  cast(0,TWO);
  ok('ツーマンセルバトル: placed face-up',z(s)==='sz'&&C(s).face==='up',JSON.stringify([z(s),C(s)&&C(s).face]));
  ACCEPT=true;phase('end');drive();ACCEPT=false;
  ok('ツーマンセルバトル: at my End Phase the Level 4 Normal Monster of my hand was Special Summoned',z(w)==='mz',z(w));
  audit('ツーマン 1'); }
{ fresh();const s=mk(TWO,0,'up'),w=mk('ウィルミー',0);gameState.players[0].hand=[s,w];baselineA();
  cast(0,TWO);ACCEPT=false;phase('end');drive();
  ok('ツーマンセルバトル: declined → it stays in the hand',z(w)==='hand',z(w)); }

/* ===== 封神鏡 ===== */
{ fresh();const sp=mk(MIR,0),sr=mk('リチュア・エミリア',1),o=mk('ワイト',1);gameState.players[0].hand=[sp];gameState.players[1].hand=[sr,o];baselineA();
  cast(0,MIR,[uid(sr)]);
  ok('封神鏡: the Spirit monster of the opponent hand was discarded, the other card stays',z(sr)==='grave'&&z(o)==='hand',JSON.stringify([z(sr),z(o)]));
  audit('封神鏡 1'); }
{ fresh();const sp=mk(MIR,0),o=mk('ワイト',1);gameState.players[0].hand=[sp];gameState.players[1].hand=[o];baselineA();
  cast(0,MIR);
  ok('封神鏡: no Spirit monster in the opponent hand → nothing is discarded',z(o)==='hand'&&z(sp)==='grave',JSON.stringify([z(o),z(sp)])); }
`);
