/* S03-U418: 神禽王アレクトール, 渋い忍者, ガガガマジシャン, ジェスター・コンフィ (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4120001;
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
const ALK='神禽王アレクトール',SHB='渋い忍者',GAG='ガガガマジシャン',JES='ジェスター・コンフィ';
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function unique(p,name){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),'special');}

/* ===== 神禽王アレクトール ===== */
{ fresh();const a=mk(ALK,0),w1=mon('ワイト',1),w2=mon('ワイト',1);gameState.players[0].hand=[a];gameState.players[1].mz=[w1,w2];baselineA();
  ok('アレクトール: Special Summonable from the hand (two face-up opponent monsters share an attribute)',procOk(ALK,0)===true,'');
  procRun(ALK,0);
  ok('アレクトール: it stands on the field',z(a)==='mz',z(a));
  audit('アレクトール 1'); }
{ fresh();const a=mk(ALK,0),w1=mon('ワイト',1),w2=mon('青眼の白龍',1);gameState.players[0].hand=[a];gameState.players[1].mz=[w1,w2];baselineA();
  ok('アレクトール negative: different attributes → not Special Summonable',procOk(ALK,0)===false,''); }
{ fresh();const a=mk(ALK,0),o=mon(ALK,1),w1=mon('ワイト',1),w2=mon('ワイト',1);gameState.players[0].hand=[a];gameState.players[1].mz=[o,w1,w2];baselineA();
  ok('アレクトール negative: another face-up アレクトール on either field → not Special Summonable',procOk(ALK,0)===false,JSON.stringify([unique(0,ALK)])); }
{ fresh();const a=mon(ALK,0),f=mon('クリボー',1);gameState.players[0].mz=[a];gameState.players[1].mz=[f];baselineA();
  ok('アレクトール: the effect is available',canZ(a)===true,'');
  actC(a,[uid(f)]);
  ok('アレクトール: the effect of the chosen face-up card is negated this turn',API.isEffectNegated(findCardByUid(f.uid))===true&&canZ(a)===false,JSON.stringify([API.isEffectNegated(findCardByUid(f.uid)),canZ(a)]));
  endTurn();
  ok('アレクトール: the negation ended with the turn',API.isEffectNegated(findCardByUid(f.uid))===false,'');
  audit('アレクトール 2'); }

/* ===== 渋い忍者 ===== */
{ fresh();const s=mk(SHB,0,'down','def'),n1=mk('白い忍者',0),n2=mk('赤い忍者',0),f=mon('ブラック・マジシャン',1);
  s.setTurn=3;gameState.players[0].mz=[s];gameState.players[0].hand=[n1];gameState.players[0].grave=[n2];gameState.players[1].mz=[f];baselineA();
  toOppBattle();PREFER=[uid(n1),'yes',uid(n2)];foeAttack(f,s);PREFER=[];
  ok('渋い忍者: flipped by an attack → the 「忍者」 of the hand and of the Graveyard were Special Summoned face-down in Defense Position',z(n1)==='mz'&&z(n2)==='mz'&&C(n1).face==='down'&&C(n2).face==='down'&&C(n1).pos==='def',JSON.stringify([z(n1),z(n2),C(n1)&&C(n1).face,C(n1)&&C(n1).pos]));
  audit('渋い忍者 1'); }
{ fresh();const s=mk(SHB,0,'down','def'),w=mk('ワイト',0),f=mon('ブラック・マジシャン',1);
  s.setTurn=3;gameState.players[0].mz=[s];gameState.players[0].hand=[w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,s);
  ok('渋い忍者 negative: no 「忍者」 in the hand or Graveyard → nothing happened (ワイト stays)',z(w)==='hand',z(w)); }
{ fresh();const a=mon(SHB,1),b=mk(SHB,0);gameState.players[1].mz=[a];gameState.players[0].hand=[b];baselineA();
  ok('渋い忍者: only one face-up copy on the field (either side) → a second face-up Special Summon is refused',!!unique(0,SHB),JSON.stringify([unique(0,SHB)])); }

/* ===== ガガガマジシャン ===== */
{ fresh();const g=mon(GAG,0);gameState.players[0].mz=[g];baselineA();
  ok('ガガガ: the effect is available',canZ(g)===true,'');
  actC(g,['L6']);
  ok('ガガガ: the Level became the declared 6 until the end of the turn; once per turn',curLV(C(g))===6&&canZ(g)===false,JSON.stringify([curLV(C(g)),canZ(g)]));
  endTurn();
  ok('ガガガ: back to Level 4 after the turn',curLV(C(g))===4,String(curLV(C(g))));
  audit('ガガガ 1'); }
{ fresh();const g=mon(GAG,0),t=mon('ジェネクス・コントローラー',0);gameState.players[0].mz=[g,t];baselineA();
  ok('ガガガ: cannot be a Synchro Material',materialCandidates(0,'synchro').every(x=>x.card!==C(g)),''); }
{ fresh();const g=mon(GAG,0);gameState.players[0].mz=[g];baselineA();
  ok('ガガガ: a second face-up copy on my field is refused',!!unique(0,GAG),JSON.stringify([unique(0,GAG)])); }
{ fresh();const g=mon(GAG,1);gameState.players[1].mz=[g];baselineA();
  ok('ガガガ: a copy on the opponent field does not matter ("自分フィールドに1体")',unique(0,GAG)==='',JSON.stringify([unique(0,GAG)])); }

/* ===== ジェスター・コンフィ ===== */
{ fresh();const j=mk(JES,0),f=mon('ブラック・マジシャン',1);gameState.players[0].hand=[j];gameState.players[1].mz=[f];baselineA();
  ok('ジェスター: the hand effect is offered',getLegalHandActions(0,0).some(a=>a.id==='handEffect'),JSON.stringify(getLegalHandActions(0,0).map(a=>a.id)));
  duelActivateFromHand(0);drive();
  ok('ジェスター: Special Summoned from the hand in Attack Position',z(j)==='mz'&&C(j).pos==='atk',JSON.stringify([z(j),C(j)&&C(j).pos]));
  endTurn();PREFER=[uid(f)];phase('end');drive();PREFER=[];
  ok('ジェスター: in the opponent\'s next End Phase it and the chosen opponent monster returned to the hands',z(j)==='hand'&&z(f)==='hand',JSON.stringify([z(j),z(f)]));
  audit('ジェスター 1'); }
{ fresh();const j=mk(JES,0);gameState.players[0].hand=[j];baselineA();
  duelActivateFromHand(0);drive();
  endTurn();phase('end');drive();
  ok('ジェスター negative: no face-up opponent monster → it stays on the field',z(j)==='mz',z(j)); }
{ fresh();const j=mk(JES,0),o=mon(JES,0);gameState.players[0].hand=[j];gameState.players[0].mz=[o];baselineA();
  ok('ジェスター negative: a face-up copy on my field → the hand effect is not offered',!getLegalHandActions(0,0).some(a=>a.id==='handEffect'),JSON.stringify(getLegalHandActions(0,0).map(a=>a.id))); }
`);
