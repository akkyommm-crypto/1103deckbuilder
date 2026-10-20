/* S03-U395: 堕天使アスモディウス, 不死王リッチー (PARTIAL entries replaced by exact scripts).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3950001;
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





















const ASM='堕天使アスモディウス',LIC='不死王リッチー';
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function tok(p,n){return gameState.players[p].mz.find(c=>cardName(c)===n)||null;}

/* ===== 堕天使アスモディウス ===== */
{ fresh();const a=mon(ASM,0),an=mk('もけもけ',0);gameState.players[0].mz=[a];gameState.players[0].deck=[an].concat(gameState.players[0].deck);baselineA();
  ok('アスモ: the ignition effect is available (an Angel in the Deck)',canZ(a)===true,'');
  actC(a,[uid(an)]);
  ok('アスモ: the Angel monster was sent from the Deck to the Graveyard',z(an)==='grave',z(an));
  ok('アスモ: once per turn',canZ(a)===false,'');
  audit('アスモ 1'); }
{ fresh();const a=mon(ASM,0);gameState.players[0].mz=[a];baselineA();
  ok('アスモ negative: no Angel in the Deck → the effect is not offered',canZ(a)===false,''); }
{ fresh();const a=mk(ASM,0);gameState.players[0].grave=[a];gameState.players[0].deck=[mk(ASM,0)].concat(gameState.players[0].deck);baselineA();
  ok('アスモ: cannot be Special Summoned from the Graveyard or from the Deck by an effect',canEffectSpecialSummonS03(C(a),'grave','x')===false&&canEffectSpecialSummonS03(gameState.players[0].deck[0],'deck','x')===false,'');
  const h=mk('ワイト',0);gameState.players[0].grave.push(h);
  ok('アスモ control: another Graveyard monster can be (ワイト)',canEffectSpecialSummonS03(C(h),'grave','x')===true,''); }
{ fresh();const a=mon(ASM,0),bh=mk('ブラック・ホール',0,'up'),bh2=mk('ブラック・ホール',0,'up');gameState.players[0].hand=[bh,bh2];gameState.players[0].mz=[a];baselineA();
  cast(0,'ブラック・ホール');
  const asmo=tok(0,'アスモトークン'),dius=tok(0,'ディウストークン');
  ok('アスモ: destroyed by ブラック・ホール → アスモトークン (ATK 1800 / DEF 1300) and ディウストークン (1200 / 1200) Special Summoned',z(a)==='grave'&&!!asmo&&!!dius&&curATK(asmo)===1800&&curDEF(asmo)===1300&&curATK(dius)===1200&&curDEF(dius)===1200,JSON.stringify({a:z(a),asmo:!!asmo,dius:!!dius}));
  cast(0,'ブラック・ホール');
  ok('アスモ: a second ブラック・ホール destroys ディウストークン but not アスモトークン (not destroyed by effects)',!!tok(0,'アスモトークン')&&!tok(0,'ディウストークン'),JSON.stringify(gameState.players[0].mz.map(c=>cardName(c))));
  audit('アスモ 2'); }
{ fresh();const a=mon(ASM,0),f1=mon('青眼の究極竜',1),f2=mon('青眼の白龍',1),f3=mon('青眼の白龍',1);gameState.players[0].mz=[a];gameState.players[1].mz=[f1,f2,f3];baselineA();
  toOppBattle();
  foeAttack(f1,a);
  const dius=tok(0,'ディウストークン'),asmo=tok(0,'アスモトークン');
  ok('アスモ: destroyed in battle → both Tokens appear',z(a)==='grave'&&!!dius&&!!asmo,JSON.stringify(gameState.players[0].mz.map(c=>cardName(c))));
  foeAttack(f2,dius);
  ok('アスモ: ディウストークン is not destroyed by battle',!!tok(0,'ディウストークン'),JSON.stringify(gameState.players[0].mz.map(c=>cardName(c))));
  foeAttack(f3,asmo);
  ok('アスモ: アスモトークン is destroyed by battle (it is protected from effects only)',!tok(0,'アスモトークン'),JSON.stringify(gameState.players[0].mz.map(c=>cardName(c))));
  audit('アスモ 3'); }

/* ===== 不死王リッチー ===== */
{ fresh();const r=mon(LIC,0);gameState.players[0].mz=[r];baselineA();
  ok('リッチー: the Set effect is available face-up in my Main Phase',canZ(r)===true,'');
  actC(r);
  ok('リッチー: it was turned face-down Defense Position',C(r).face==='down'&&C(r).pos==='def',JSON.stringify([C(r).face,C(r).pos]));
  audit('リッチー 1'); }
{ fresh();const r=mk(LIC,0,'down','def');r.setTurn=4;r.summonedTurn=3;const u=mk('さまよえる亡者',0),f=mon('ワイト',1);
  gameState.players[0].mz=[r];gameState.players[0].grave=[u];gameState.players[1].mz=[f];baselineA();
  toOppBattle();
  PREFER=[uid(u),'yes'];foeAttack(f,r);PREFER=[];drive();
  ok('リッチー: flipped by the attack → the Undead monster of my Graveyard was Special Summoned',z(u)==='mz'&&C(r).face==='up',JSON.stringify({u:z(u),face:C(r)&&C(r).face}));
  audit('リッチー 2'); }
{ fresh();const r=mk(LIC,0,'down','def');r.setTurn=4;r.summonedTurn=3;const f=mon('ワイト',1);
  gameState.players[0].mz=[r];gameState.players[1].mz=[f];baselineA();
  toOppBattle();
  foeAttack(f,r);drive();
  ok('リッチー negative: flipped with no Undead in the Graveyard → nothing happens',C(r).face==='up'&&gameState.players[0].mz.length===1,JSON.stringify([C(r).face,gameState.players[0].mz.length])); }
`);
