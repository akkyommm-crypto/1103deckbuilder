/* S03-U398: 聖なるあかり, 召喚僧サモンプリースト, デコイドラゴン (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3980001;
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
























const AKA='聖なるあかり',PRI='召喚僧サモンプリースト',DEC='デコイドラゴン';
function nsReason(p,name,kind){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),kind);}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}

/* ===== 聖なるあかり ===== */
{ fresh();const a=mon(AKA,0),dk=mon('ブラック・マジシャン',1);gameState.players[0].mz=[a];gameState.players[1].mz=[dk];baselineA();
  toOppBattle();const l0=lp(0);
  foeAttack(dk,a);
  ok('あかり: a DARK monster cannot declare an attack (ブラック・マジシャン; no damage, the Light survives)',z(a)==='mz'&&lp(0)===l0,JSON.stringify([z(a),lp(0)]));
  ok('あかり: the DARK monster is flagged unable to attack',cannotAttackNow(C(dk))===true,String(cannotAttackNow(C(dk))));
  audit('あかり 1'); }
{ fresh();const a=mon(AKA,0),lt=mon('青眼の白龍',1);gameState.players[0].mz=[a];gameState.players[1].mz=[lt];baselineA();
  toOppBattle();
  foeAttack(lt,a);
  ok('あかり control: a LIGHT monster can attack and destroys it (ATK 0)',z(a)==='grave',z(a)); }
{ fresh();const a=mon(AKA,0),dk=mon('ブラック・マジシャン',1);gameState.players[0].mz=[a];gameState.players[1].mz=[dk];baselineA();
  phase('battle');const l0=lp(0);
  atkTarget(0,a,dk);
  ok('あかり: my Light attacking a DARK monster (ATK 2500) is not destroyed and I take 0 battle damage',z(a)==='mz'&&lp(0)===l0&&z(dk)==='mz',JSON.stringify([z(a),lp(0),z(dk)]));
  audit('あかり 2'); }
{ fresh();const a=mon(AKA,0);gameState.players[0].mz=[a];baselineA();
  ok('あかり: neither player can Normal / Special Summon DARK monsters (ワイト)',!!nsReason(0,'ワイト','normal')&&!!nsReason(1,'ワイト','normal')&&!!nsReason(0,'ワイト','special')&&!!nsReason(1,'ワイト','special'),JSON.stringify([nsReason(0,'ワイト','normal'),nsReason(1,'ワイト','special')]));
  ok('あかり: but non-DARK monsters can be summoned (青眼の白龍 LIGHT)',nsReason(0,'青眼の白龍','normal')===''&&nsReason(1,'青眼の白龍','special')==='',JSON.stringify([nsReason(0,'青眼の白龍','normal')])); }

/* ===== 召喚僧サモンプリースト ===== */
{ fresh();const p=mk(PRI,0);gameState.players[0].hand=[p];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('プリースト: Normal Summoned → turned to Defense Position',z(p)==='mz'&&C(p).pos==='def',JSON.stringify([z(p),C(p)&&C(p).pos]));
  ok('プリースト: it cannot be Tributed (Advance Summon candidates exclude it)',tributeCandidates(0,dbOf({id:findCardIndex('ブラック・マジシャン')})).every(x=>x.card!==C(p)),'');
  audit('プリースト 1'); }
{ fresh();const p=mon(PRI,0,'def'),sp=mk('ブラック・ホール',0),t=mk('ライオウ',0);gameState.players[0].mz=[p];gameState.players[0].hand=[sp];gameState.players[0].deck=[t].concat(gameState.players[0].deck);baselineA();
  ok('プリースト: the ignition effect is available (a Spell in hand, a Level 4 in the Deck)',canZ(p)===true,'');
  actC(p,[uid(sp),uid(t)]);
  ok('プリースト: the Spell was discarded (cost) and the Level 4 monster Special Summoned from the Deck',z(sp)==='grave'&&z(t)==='mz',JSON.stringify([z(sp),z(t)]));
  ok('プリースト: that monster cannot attack this turn',cannotAttackNow(C(t))===true,String(cannotAttackNow(C(t))));
  ok('プリースト: once per turn',canZ(p)===false,'');
  audit('プリースト 2'); }
{ fresh();const p=mon(PRI,0,'def'),t=mk('ライオウ',0);gameState.players[0].mz=[p];gameState.players[0].deck=[t].concat(gameState.players[0].deck);baselineA();
  ok('プリースト negative: no Spell in the hand → not offered',canZ(p)===false,''); }

/* ===== デコイドラゴン ===== */
{ fresh();const d=mon(DEC,0),bw=mk('青眼の白龍',0),f=mon('ブラック・マジシャン',1);gameState.players[0].mz=[d];gameState.players[0].grave=[bw];gameState.players[1].mz=[f];baselineA();
  toOppBattle();
  PREFER=['yes',uid(bw)];foeAttack(f,d);PREFER=[];drive();
  ok('デコイ: attacked → 青眼の白龍 (Level 8 Dragon) Special Summoned from the Graveyard and the attack moved to it: ブラック・マジシャン destroyed, the Decoy survives',z(bw)==='mz'&&z(d)==='mz'&&z(f)==='grave',JSON.stringify({bw:z(bw),d:z(d),f:z(f)}));
  audit('デコイ 1'); }
{ fresh();const d=mon(DEC,0),f=mon('ブラック・マジシャン',1);gameState.players[0].mz=[d];gameState.players[1].mz=[f];baselineA();
  toOppBattle();
  foeAttack(f,d);
  ok('デコイ negative: no Level 7+ Dragon in the Graveyard → the attack proceeds and the Decoy is destroyed',z(d)==='grave',z(d)); }
`);
