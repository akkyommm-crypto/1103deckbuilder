/* S03-U400: 第一の棺, 第二の棺, 第三の棺, スピリッツ・オブ・ファラオ (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4000001;
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


























const C1='第一の棺',C2='第二の棺',C3='第三の棺',SPH='スピリッツ・オブ・ファラオ';
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function szOf(name){return gameState.players[0].sz.filter(c=>cardName(c)===name&&c.face==='up');}

function coffinField(){fresh();const c1=faceSet(C1,0),c2=mk(C2,0),c3=mk(C3,0),sph=mk(SPH,0),u1=mk('さまよえる亡者',0),u2=mk('ゴースト',0),u3=mk('ゾンビランプ',0),u4=mk('ファラオのしもべ',0),u5=mk('ヘルバウンド',0);
  gameState.players[0].sz=[c1];gameState.players[0].hand=[c2];gameState.players[0].deck=[c3,sph].concat(gameState.players[0].deck);gameState.players[0].grave=[u1,u2,u3,u4,u5];
  baselineA();return {c1,c2,c3,sph,us:[u1,u2,u3,u4,u5]};}
{ const x=coffinField();
  actSzC(x.c1);
  ok('棺: 第一の棺 activated (face-up Continuous Trap)',z(x.c1)==='sz'&&C(x.c1).face==='up',JSON.stringify([z(x.c1),C(x.c1)&&C(x.c1).face]));
  endTurn();phase('end');
  ok('棺: at the opponent End Phase 第二の棺 came out of the hand face-up',z(x.c2)==='sz'&&C(x.c2).face==='up',JSON.stringify([z(x.c2),C(x.c2)&&C(x.c2).face]));
  ok('棺: and 第三の棺 is still in the Deck',z(x.c3)==='deck',z(x.c3));
  endTurn();endTurn();phase('end');
  ok('棺: the next opponent End Phase 第三の棺 comes out of the Deck; all three are complete → sent to the Graveyard, スピリッツ・オブ・ファラオ Special Summoned from the Deck',z(x.c1)==='grave'&&z(x.c2)==='grave'&&z(x.c3)==='grave'&&z(x.sph)==='mz',JSON.stringify({c1:z(x.c1),c2:z(x.c2),c3:z(x.c3),sph:z(x.sph)}));
  audit('棺 1'); }
{ const x=coffinField();
  actSzC(x.c1);
  endTurn();phase('end');
  const c2h=findCardByUid(x.c2.uid);
  API.destroy(c2h,'test');drive();
  ok('棺: when a coffin leaves the field the others go to the Graveyard too (第一の棺 follows)',z(x.c2)==='grave'&&z(x.c1)==='grave',JSON.stringify({c1:z(x.c1),c2:z(x.c2)}));
  audit('棺 2'); }
{ const x=coffinField();
  ok('棺: 第二の棺 cannot be activated or Set by the player (the card refuses every activation)',getLegalHandActions(0,0).every(a=>a.id!=='activate'),JSON.stringify(getLegalHandActions(0,0).map(a=>a.id))); }

/* ===== スピリッツ・オブ・ファラオ ===== */
{ const x=coffinField();
  ok('ファラオ: only by 第一の棺 (not by 死者蘇生)',canEffectSpecialSummonS03(C(x.sph),'deck','第一の棺')===true&&canEffectSpecialSummonS03(C(x.sph),'deck','死者蘇生')===false,JSON.stringify([canEffectSpecialSummonS03(C(x.sph),'deck','第一の棺'),canEffectSpecialSummonS03(C(x.sph),'deck','死者蘇生')])); }
{ const x=coffinField();
  actSzC(x.c1);
  endTurn();phase('end');
  endTurn();endTurn();
  PREFER=[uid(x.us[0]),uid(x.us[1]),uid(x.us[2]),uid(x.us[3])];
  phase('end');drive();PREFER=[];
  const live=x.us.filter(u=>z(u)==='mz').length;
  ok('ファラオ: on its Special Summon up to 4 Level 2 or lower Undead Normal Monsters of the Graveyard were Special Summoned (4 chosen of 5)',z(x.sph)==='mz'&&live===4,JSON.stringify({sph:z(x.sph),live})); }
`);
