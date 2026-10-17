/* S03-U389: 死神の巡遊, 神の威光, ミラクル・フリッパー (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3890001;
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















const REAP='死神の巡遊',AURA='神の威光',FLP='ミラクル・フリッパー';
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function nsReason(p,name,kind){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),kind);}
function toOppBattle(){endTurn();phase('battle');}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function seedCoin(want){for(let s=1;s<20000;s++){gameState.rngState=s;if(duelRandomInt(2)===want)return s;}return 1;}
function withCoin(want){const s=seedCoin(want);gameState.rngInitialSeed=gameState.rngState=s;}

/* ===== 死神の巡遊 ===== */
{ fresh();const t=faceSet(REAP,0);gameState.players[0].sz=[t];withCoin(0);baselineA();
  actSzC(t);
  endTurn();
  ok('巡遊: heads at the opponent Standby Phase -> the opponent cannot Normal / Flip Summon until the End Phase (Special Summon legal)',!!nsReason(1,'ワイト','normal')&&!!nsReason(1,'ワイト','flip')&&nsReason(1,'ワイト','special')==='',JSON.stringify([nsReason(1,'ワイト','normal'),nsReason(1,'ワイト','flip')]));
  ok('巡遊: heads does not touch me',nsReason(0,'ワイト','normal')==='','');
  endTurn();
  ok('巡遊: the ban is over in my turn',nsReason(1,'ワイト','normal')==='','');
  audit('巡遊 1'); }
{ fresh();const t=faceSet(REAP,0);gameState.players[0].sz=[t];withCoin(1);baselineA();
  actSzC(t);
  endTurn();
  ok('巡遊: tails -> the opponent is unaffected in its turn',nsReason(1,'ワイト','normal')==='','');
  endTurn();
  ok('巡遊: tails -> I cannot Normal / Flip Summon in my NEXT turn',!!nsReason(0,'ワイト','normal')&&!!nsReason(0,'ワイト','flip'),JSON.stringify([nsReason(0,'ワイト','normal')]));
  endTurn();endTurn();
  ok('巡遊: tails -> the ban of my next turn is over one turn later',nsReason(0,'ワイト','normal')==='',''); }

/* ===== 神の威光 ===== */
{ fresh();const t=faceSet(AURA,0),od=mon('極神聖帝オーディン',0),w=mon('ワイト',0),mn=mk('月の書',0,'up');
  gameState.players[0].sz=[t];gameState.players[0].mz=[od,w];gameState.players[0].hand=[mn];baselineA();
  actSzC(t,[uid(od)]);
  SEEN.length=0;PREFER=[uid(w)];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  const l=SEEN.filter(s=>s.title.indexOf('月の書')>=0);const c=l.length?l[l.length-1].cands:null;
  ok('威光: neither player can target the chosen 極神 monster (my own 月の書 offers ワイト only)',(c===null||c.indexOf(od.uid)<0)&&C(w).face==='down',JSON.stringify([c,C(w).face]));
  endTurn();endTurn();
  ok('威光: at my 2nd Standby Phase after the activation the Trap is sent to the Graveyard',z(t)==='grave',z(t));
  audit('威光 1'); }
{ fresh();const t=faceSet(AURA,0),w=mon('ワイト',0);gameState.players[0].sz=[t];gameState.players[0].mz=[w];baselineA();
  ok('威光 negative: no 極神 monster -> not activatable',strictScriptLegalityV2(AURA,0,'sz',idx(t)).ok===false,''); }

/* ===== ミラクル・フリッパー ===== */
{ fresh();const f=mk(FLP,0),f2=mk(FLP,0);gameState.players[0].hand=[f,f2];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('フリッパー: Normal Summoned',z(f)==='mz',z(f));
  ok('フリッパー: a second copy cannot be summoned while one is on my field (Normal / Flip / Special)',!!nsReason(0,FLP,'normal')&&!!nsReason(0,FLP,'special')&&!!nsReason(0,FLP,'flip'),JSON.stringify([nsReason(0,FLP,'normal')])); }
{ fresh();const f=mon(FLP,0),w=mon('ワイト',0),a=mon('ライオウ',1);gameState.players[0].mz=[f,w];gameState.players[1].mz=[a];baselineA();
  toOppBattle();
  const t=battleTargetsV29(a.uid).targets.map(x=>x.card.uid);
  ok('フリッパー: the opponent can attack only ミラクル・フリッパー, not the other monster',t.indexOf(f.uid)>=0&&t.indexOf(w.uid)<0,JSON.stringify(t)+' f='+f.uid);
  audit('フリッパー 1'); }
{ fresh();const f=mon(FLP,0),a=mon('青眼の白龍',1);gameState.players[0].mz=[f];gameState.players[1].mz=[a];baselineA();
  toOppBattle();foeAttack(a,f);
  ok('フリッパー: destroyed by battle -> Special Summoned on the opponent\'s field',z(f)==='mz'&&pl(f)===1,JSON.stringify([z(f),pl(f)])); }
{ fresh();gameState.activePlayer=1;const f=mon(FLP,0),a=mon('ライオウ',1),a2=mon('青眼の白龍',1),fi=mk('地割れ',1,'up');
  gameState.players[0].mz=[f];gameState.players[1].mz=[a,a2];gameState.players[1].hand=[fi];baselineA();
  PREFER=[uid(a2)];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();drive();PREFER=[];
  ok('フリッパー: destroyed by a Spell (地割れ) -> an opposing monster is destroyed (the chosen 青眼の白龍)',z(f)==='grave'&&z(a2)==='grave',JSON.stringify([z(f),z(a2)])); }
`);
