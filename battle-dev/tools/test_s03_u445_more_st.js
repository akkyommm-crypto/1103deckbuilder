/* S03-U445: ヘイト・クレバス, デステニー・ミラージュ, サイバネティック・ヒドゥン・テクノロジー, 皆既日蝕の書, 強欲なカケラ (stale ENGINE_GAP Spells / Traps).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x42D0001;
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
const HAT='ヘイト・クレバス',MIR='デステニー・ミラージュ',CYB='サイバネティック・ヒドゥン・テクノロジー',ECL='皆既日蝕の書',SHD='強欲なカケラ';
function H(c){return findCardByUid(c.uid);}
function setTrap(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':target});}
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
function quake(){gameState.activePlayer=1;const e=mk('地割れ',1);gameState.players[1].hand=[e];baselineA();duelActivateFromHand(0);return e;}

/* ===== ヘイト・クレバス ===== */
{ fresh();const tr=setTrap(HAT,0),w=mon('ワイト',0),f=mon('青眼の白龍',1),g=mon('ブラック・マジシャン',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[w];gameState.players[1].mz=[f,g];
  const l1=lp(1);PREFER=[uid(f)];quake();drive();PREFER=[];
  ok('ヘイト・クレバス: my monster was destroyed by an opponent card effect (地割れ) → the chosen opponent monster went to the Graveyard and its printed ATK (3000) was dealt to the opponent',z(w)==='grave'&&z(f)==='grave'&&z(g)==='mz'&&l1-lp(1)===3000,JSON.stringify([z(w),z(f),z(g),l1-lp(1)]));
  audit('ヘイト 1'); }
{ fresh();const tr=setTrap(HAT,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[w];gameState.players[1].mz=[f];baselineA();
  API.destroy(H(w),'test');flushDeferredEventsV2();drive();
  ok('ヘイト・クレバス negative: destroyed by my own effect → not triggered',z(tr)==='sz'&&z(f)==='mz',JSON.stringify([z(tr),z(f)])); }

/* ===== デステニー・ミラージュ ===== */
{ fresh();const tr=setTrap(MIR,0),d=mon('D－HERO ダイヤモンドガイ',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[d];gameState.players[1].mz=[f];
  quake();drive();
  ok('デステニー・ミラージュ: my 「D－HERO」 was destroyed by an opponent card effect → it was Special Summoned back to my field',z(d)==='mz'&&z(tr)==='grave',JSON.stringify([z(d),z(tr)]));
  audit('ミラージュ 1'); }
{ fresh();const tr=setTrap(MIR,0),d=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[d];gameState.players[1].mz=[f];
  quake();drive();
  ok('デステニー・ミラージュ negative: a non-「D－HERO」 destroyed → not triggered',z(d)==='grave'&&z(tr)==='sz',JSON.stringify([z(d),z(tr)])); }

/* ===== サイバネティック・ヒドゥン・テクノロジー ===== */
{ fresh();const tr=setTrap(CYB,0),cd=mon('サイバー・ドラゴン',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[cd];gameState.players[1].mz=[f];
  gameState.activePlayer=1;gameState.phase='battle';baselineA();
  foeAttack(f,0);const ok1=toPoint('attackDeclare');const off=ok1&&offered(tr);if(off){PREFER=[uid(cd),uid(f)];pointActivateV27(0,'sz',0);}drive();PREFER=[];
  /* S03-U449 (ChatGPT audit): changed expectation. The old assertion treated the card as a Normal Trap (cost + destruction on the first activation); it is a Continuous Trap - the activation from the Set position only places it face-up (2011 wiki: the effect is activated at each attack declaration while it is face-up). The full effect flow is tested in test_s03_u449_audit_fixes.js. */
  ok('サイバネティック・ヒドゥン・テクノロジー: at the opponent attack declaration the Set Continuous Trap is activated as a card (stays face-up); nothing is paid and the attacker is not destroyed (the attack goes on and the Cyber Dragon, the attack target, is destroyed by battle instead)',off&&z(tr)==='sz'&&C(tr).face==='up'&&z(cd)==='grave'&&z(f)==='mz',JSON.stringify([off,z(tr),C(tr)&&C(tr).face,z(cd),z(f)]));
  audit('サイバネ 1'); }
{ fresh();const tr=mk(CYB,0,'up'),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[w];gameState.players[1].mz=[f];
  gameState.activePlayer=1;gameState.phase='battle';baselineA();
  foeAttack(f,0);const ok1=toPoint('attackDeclare');
  /* S03-U449: the trap is face-up here - a Set one is always offered for its card activation (no cost) */ ok('サイバネティック・ヒドゥン・テクノロジー negative: face-up, no サイバー・ドラゴン on my field → the effect is not offered',!(ok1&&offered(tr)),String(ok1&&offered(tr))); }

/* ===== 皆既日蝕の書 ===== */
{ fresh();const sp=mk(ECL,0),a=mon('ワイト',0),b=mon('ブラック・マジシャン',1),c=mk('ワイト',1,'down','def');c.setTurn=3;gameState.players[0].hand=[sp];gameState.players[0].mz=[a];gameState.players[1].mz=[b,c];baselineA();
  const h1=gameState.players[1].hand.length;cast(0,ECL);
  ok('皆既日蝕の書: every face-up monster of both fields turned face-down Defense Position',C(a).face==='down'&&C(a).pos==='def'&&C(b).face==='down'&&C(b).pos==='def',JSON.stringify([C(a).face,C(a).pos,C(b).face,C(b).pos]));
  phase('end');
  ok('皆既日蝕の書: at the End Phase the opponent face-down Defense monsters (2) were turned face-up Defense; mine stayed face-down',C(b).face==='up'&&C(b).pos==='def'&&C(c).face==='up'&&C(a).face==='down',JSON.stringify([C(b).face,C(c).face,C(a).face]));
  ok('皆既日蝕の書: the opponent drew 2 cards (the number of monsters turned face-up)',gameState.players[1].hand.length===h1+2,JSON.stringify([h1,gameState.players[1].hand.length]));
  audit('日蝕 1'); }
{ fresh();const sp=mk(ECL,0);gameState.players[0].hand=[sp];baselineA();
  ok('皆既日蝕の書 negative: no face-up monster on the field → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== 強欲なカケラ ===== */
{ fresh();const s=mk(SHD,0,'up');gameState.players[0].hand=[s];baselineA();
  cast(0,SHD);
  ok('強欲なカケラ: placed face-up in my Spell & Trap Zone',z(s)==='sz'&&C(s).face==='up',JSON.stringify([z(s),C(s)&&C(s).face]));
  endTurn();endTurn();
  ok('強欲なカケラ: my normal draw put a 強欲 counter on it',API.countCounter(H(s),'強欲')===1,String(API.countCounter(H(s),'強欲')));
  ok('強欲なカケラ: with 1 counter its ignition is not available',getLegalZoneActions(0,'sz',idx(s)).map(a=>a.id).indexOf('effect')<0,JSON.stringify(getLegalZoneActions(0,'sz',idx(s)).map(a=>a.id)));
  endTurn();endTurn();
  ok('強欲なカケラ: a second normal draw → 2 counters',API.countCounter(H(s),'強欲')===2,String(API.countCounter(H(s),'強欲')));
  const n0=gameState.players[0].hand.length;
  duelActivateFromZone(0,'sz',idx(s));drive();
  ok('強欲なカケラ: with 2 counters it was sent to the Graveyard (cost) and I drew 2',z(s)==='grave'&&gameState.players[0].hand.length===n0+2,JSON.stringify([z(s),n0,gameState.players[0].hand.length]));
  audit('強欲 1'); }
`);
