/* S03-U415: デッキロック, 不協和音, 王宮の鉄壁, 縮退回路 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x40F0001;
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
const DLK='デッキロック',DIS='不協和音',IRN='王宮の鉄壁',DEG='縮退回路';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function zoneAct(c){return getLegalZoneActions(0,'sz',idx(c)).some(x=>x.id==='activate'||x.id==='activateSet');}
function ssReason(p,name){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),'special');}

/* ===== デッキロック ===== */
{ fresh();const d=mk(DLK,0,'up'),sm=mk('ワイト',0);gameState.players[0].hand=[d];gameState.players[0].deck.push(sm);baselineA();
  const t0=gameState.turn;
  cast(0,DLK);
  ok('デッキロック: placed face-up on my Spell & Trap Zone',z(d)==='sz'&&C(d).face==='up',JSON.stringify([z(d),C(d)&&C(d).face]));
  const n0=gameState.players[0].hand.length,k0=gameState.players[0].deck.length;
  ok('デッキロック: I cannot add a card from the Deck to the hand by an effect (search refused)',API.searchDeck(0,0,'test')===false&&gameState.players[0].hand.length===n0,String(gameState.players[0].hand.length));
  ok('デッキロック: neither can the opponent',API.deckToHand(1,0,'test')===false,'');
  ok('デッキロック: no Special Summon from the Deck (API.specialSummon refused, the card stays in the Deck)',API.specialSummon(0,'deck',gameState.players[0].deck.length-1,'atk','test')===false&&z(sm)==='deck',z(sm));
  const h0=gameState.players[0].hand.length;API.draw(0,1);
  ok('デッキロック: drawing is unaffected',gameState.players[0].hand.length===h0+1,String(gameState.players[0].hand.length-h0));
  endTurn();endTurn();
  ok('デッキロック: still there after my 1st Standby Phase after the activation (counted once)',z(d)==='sz'&&C(d).u415N===1,JSON.stringify([z(d),C(d)&&C(d).u415N]));
  endTurn();endTurn();
  ok('デッキロック: destroyed at my 2nd Standby Phase after the activation',z(d)==='grave',z(d));
  ok('デッキロック: afterwards searching works again',API.searchDeck(0,0,'test')===true,'');
  audit('デッキロック 1'); }
{ fresh();const sm=mk('ワイト',0);gameState.players[0].deck.push(sm);baselineA();
  ok('デッキロック control: without it a Special Summon from the Deck works',API.specialSummon(0,'deck',gameState.players[0].deck.length-1,'atk','test')===true&&z(sm)==='mz',z(sm));
  ok('デッキロック control: and a search works',API.searchDeck(0,0,'test')===true,''); }

/* ===== 不協和音 ===== */
{ fresh();const t=setCard(DIS,0);gameState.players[0].sz=[t];baselineA();
  const t0=gameState.turn;
  ok('不協和音: activatable (Set Continuous Trap)',zoneAct(t)===true,JSON.stringify(getLegalZoneActions(0,'sz',idx(t)).map(a=>a.id)));
  actSzC(t);
  ok('不協和音: face-up on the field; expiry stamped (my turn: activation turn + 4)',z(t)==='sz'&&C(t).face==='up'&&C(t).u415End===t0+4,JSON.stringify([z(t),C(t)&&C(t).face,C(t)&&C(t).u415End]));
  ok('不協和音: a Synchro Monster cannot be Special Summoned by either player',!!ssReason(0,'ジャンク・ウォリアー')&&!!ssReason(1,'ジャンク・ウォリアー'),JSON.stringify([ssReason(0,'ジャンク・ウォリアー'),ssReason(1,'ジャンク・ウォリアー')]));
  ok('不協和音: a non-Synchro Special Summon is unaffected',ssReason(0,'ライオウ')==='',ssReason(0,'ライオウ'));
  endTurn();endTurn();endTurn();endTurn();
  ok('不協和音: still on the field before my 3rd End Phase (4 turn changes)',z(t)==='sz',z(t));
  endTurn();
  ok('不協和音: sent to the Graveyard at my 3rd End Phase after the activation',z(t)==='grave',z(t));
  ok('不協和音: afterwards a Synchro Monster can be Special Summoned again',ssReason(0,'ジャンク・ウォリアー')==='',ssReason(0,'ジャンク・ウォリアー'));
  audit('不協和音 1'); }
{ fresh();const t=setCard(DIS,0);gameState.players[0].sz=[t];baselineA();
  endTurn();const t1=gameState.turn;
  PREFER=[];duelActivateFromZone(0,'sz',idx(t));drive();
  ok('不協和音 (opponent turn): activated in the opponent turn the expiry is stamped 5 turns later (my 3rd End Phase)',z(t)==='sz'&&C(t).u415End===t1+5,JSON.stringify([z(t),C(t)&&C(t).u415End,t1])); }
{ fresh();baselineA();
  ok('不協和音 control: without it a Synchro Monster can be Special Summoned',ssReason(0,'ジャンク・ウォリアー')==='',ssReason(0,'ジャンク・ウォリアー')); }

/* ===== 王宮の鉄壁 ===== */
{ fresh();const t=setCard(IRN,0),g1=mk('ワイト',0),g2=mk('ワイト',1),v=mon('ワイト',1);gameState.players[1].mz=[v];gameState.players[0].sz=[t];gameState.players[0].grave=[g1];gameState.players[1].grave=[g2];baselineA();
  actSzC(t);
  ok('王宮の鉄壁: face-up on the field',z(t)==='sz'&&C(t).face==='up',JSON.stringify([z(t),C(t)&&C(t).face]));
  API.banish(findCardByUid(g1.uid),'test');
  ok('王宮の鉄壁: I cannot banish a card (it stays in the Graveyard)',z(g1)==='grave',z(g1));
  API.banish(findCardByUid(g2.uid),'test');
  ok('王宮の鉄壁: nor can the opponent (the other Graveyard card stays)',z(g2)==='grave',z(g2));
  API.destroyAndBanish(findCardByUid(v.uid),'test');
  ok('王宮の鉄壁: destroy-and-banish is refused too (the monster stays on the field)',z(v)==='mz',z(v));
  audit('王宮の鉄壁 1'); }
{ fresh();const g1=mk('ワイト',0);gameState.players[0].grave=[g1];baselineA();
  API.banish(findCardByUid(g1.uid),'test');
  ok('王宮の鉄壁 control: without it a card can be banished',z(g1)==='banish',z(g1)); }

/* ===== 縮退回路 ===== */
{ fresh();const s=mk(DEG,0,'up'),m=mon('ワイト',0),f=mon('青眼の究極竜',0),o=mon('ワイト',1);gameState.players[0].hand=[s];gameState.players[0].mz=[m,f];gameState.players[1].mz=[o];baselineA();
  cast(0,DEG);
  ok('縮退回路: placed face-up',z(s)==='sz'&&C(s).face==='up',JSON.stringify([z(s),C(s)&&C(s).face]));
  API.returnToHand(findCardByUid(m.uid),'test');
  ok('縮退回路: my monster returning from the field to the hand is banished instead',z(m)==='banish',z(m));
  API.returnToHand(findCardByUid(o.uid),'test');
  ok('縮退回路: the opponent monster too',z(o)==='banish',z(o));
  API.returnToHand(findCardByUid(f.uid),'test');
  ok('縮退回路: an Extra Deck monster still returns to the Extra Deck',z(f)==='ex',z(f));
  const l0=lp(0);endTurn();endTurn();
  ok('縮退回路: I pay 500 Life Points at my Standby Phase',lp(0)===l0-500&&z(s)==='sz',JSON.stringify([l0,lp(0),z(s)]));
  API.payCost(0,lp(0)-500);endTurn();endTurn();
  ok('縮退回路: destroyed when I cannot pay 500 Life Points (500 or less)',z(s)==='grave'&&lp(0)===500,JSON.stringify([z(s),lp(0)]));
  audit('縮退回路 1'); }
{ fresh();const m=mon('ワイト',0);gameState.players[0].mz=[m];baselineA();
  API.returnToHand(findCardByUid(m.uid),'test');
  ok('縮退回路 control: without it the monster returns to the hand',z(m)==='hand',z(m)); }
`);
