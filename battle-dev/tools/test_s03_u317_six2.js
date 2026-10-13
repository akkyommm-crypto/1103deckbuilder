/* S03-U317: the four remaining 「六武衆」 — イロウ, カモン, ニサシ, ヤリザ (their effects while another 六武衆 is on my field, and the optional substitute of S03-U173). Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3130001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function zacts(zone,c){return getLegalZoneActions(0,zone,idx(c)).map(a=>a.id);}
function canEffect(zone,c){return zacts(zone,c).indexOf('effect')>=0;}
function equipU(u,host){PREFER=host?[uid(host)]:[];duelActivateFromZone(0,'mz',idx(u));drive();PREFER=[];}
function releaseU(u){duelActivateFromZone(0,'sz',idx(u));drive();}
function equippedTo(u,host){const e=C(u),h=C(host);return !!e&&!!h&&e.v46MonsterEquip===true&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0&&z(u)==='sz';}
function atkTarget(c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:idx(t)});drive();}
function atkDirect(c){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:'direct'});drive();}
function dir(c){return battleTargetsV29(c.uid).direct;}
/* pass the turns for real (the draw, standby and Main Phase of each new turn are stepped through) */
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
/* my End Phase → the opponent turn (to its End Phase) → my next turn, Main Phase 1 */
function nextOwnTurn(){endTurn();endTurn();}
/* the opponent's turn: pass my turn, go to its Battle Phase */
function toOppBattle(){endTurn();phase('battle');}

function setDown(c){c.face='down';c.pos='def';c.setTurn=3;}
function oppAttack(a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(a),target:idx(t)});drive();}
function attackers(){return battleAttackersV29(0).map(x=>x.card.uid);}
const ZN='六武衆－ザンジ';

/* ===== ヤリザ: direct attack while another 「六武衆」 is on my field ===== */
{ fresh();const ya=mon('六武衆－ヤリザ',0),zn=mon(ZN,0),f=mon('ワイト',1);gameState.players[0].mz=[ya,zn];gameState.players[1].mz=[f];baselineA();phase('battle');
  ok('ヤリザ: with ザンジ on my field it attacks directly although the opponent has a monster; ザンジ cannot',dir(ya)===true&&dir(zn)===false,JSON.stringify([dir(ya),dir(zn)])); }
{ fresh();const ya=mon('六武衆－ヤリザ',0),f=mon('ワイト',1);gameState.players[0].mz=[ya];gameState.players[1].mz=[f];baselineA();phase('battle');
  ok('ヤリザ: alone it cannot attack directly',dir(ya)===false,String(dir(ya))); }

/* ===== ニサシ: two attacks per Battle Phase while another 「六武衆」 is on my field ===== */
{ fresh();const ni=mon('六武衆－ニサシ',0),zn=mon(ZN,0),f1=mon('ワイト',1),f2=mon('ワイト',1);gameState.players[0].mz=[ni,zn];gameState.players[1].mz=[f1,f2];baselineA();phase('battle');
  atkTarget(ni,f1);
  ok('ニサシ: after the first attack it may attack again (another 六武衆 is present)',attackers().indexOf(ni.uid)>=0,JSON.stringify(attackers()));
  atkTarget(ni,f2);
  ok('ニサシ: both ワイト destroyed by its two attacks, and then it cannot attack a third time',z(f1)==='grave'&&z(f2)==='grave'&&attackers().indexOf(ni.uid)<0,JSON.stringify([z(f1),z(f2),attackers()]));
  audit('ニサシ'); }
{ fresh();const ni=mon('六武衆－ニサシ',0),f1=mon('ワイト',1),f2=mon('ワイト',1);gameState.players[0].mz=[ni];gameState.players[1].mz=[f1,f2];baselineA();phase('battle');
  atkTarget(ni,f1);
  ok('ニサシ: alone it attacks once only',attackers().indexOf(ni.uid)<0,JSON.stringify(attackers())); }

/* ===== カモン ===== */
{ fresh();const ka=mon('六武衆－カモン',0),zn=mon(ZN,0),sp=mk('魔法都市エンディミオン',1,'up');gameState.players[0].mz=[ka,zn];gameState.players[1].field=sp;baselineA();
  ok('カモン: offered its effect (another 六武衆, a face-up Spell on the field)',canEffect('mz',ka),JSON.stringify(zacts('mz',ka)));
  duelActivateFromZone(0,'mz',idx(ka));drive();
  ok('カモン: the face-up Spell is destroyed',z(sp)==='grave',z(sp));
  ok('カモン: once per turn',!canEffect('mz',ka),JSON.stringify(zacts('mz',ka)));
  phase('battle');
  ok('カモン: it cannot declare an attack this turn (ザンジ can)',attackers().indexOf(ka.uid)<0&&attackers().indexOf(zn.uid)>=0,JSON.stringify(attackers()));
  audit('カモン'); }
{ fresh();const ka=mon('六武衆－カモン',0),sp=mk('魔法都市エンディミオン',1,'up');gameState.players[0].mz=[ka];gameState.players[1].field=sp;baselineA();
  ok('カモン: refused without another 六武衆',!canEffect('mz',ka),JSON.stringify(zacts('mz',ka))); }
{ fresh();const ka=mon('六武衆－カモン',0),zn=mon(ZN,0),sp=mk('サイクロン',1,'down');sp.setTurn=3;gameState.players[0].mz=[ka,zn];gameState.players[1].sz=[sp];baselineA();
  ok('カモン: refused when the only Spell / Trap is Set (it must be face-up)',!canEffect('mz',ka),JSON.stringify(zacts('mz',ka))); }

/* ===== イロウ ===== */
{ fresh();const ir=mon('六武衆－イロウ',0),zn=mon(ZN,0),f=mon('青眼の白龍',1);setDown(f);gameState.players[0].mz=[ir,zn];gameState.players[1].mz=[f];baselineA();phase('battle');
  const l0=lp(0);atkTarget(ir,f);
  ok('イロウ: attacks a Set 青眼 (DEF 2500) with ザンジ present → it is destroyed without damage calculation (no damage to me)',z(f)==='grave'&&lp(0)===l0,JSON.stringify([z(f),l0,lp(0)]));
  audit('イロウ'); }
{ fresh();const ir=mon('六武衆－イロウ',0),f=mon('青眼の白龍',1);setDown(f);gameState.players[0].mz=[ir];gameState.players[1].mz=[f];baselineA();phase('battle');
  const l0=lp(0);atkTarget(ir,f);
  ok('イロウ: control — alone it takes the normal battle against 青眼 (DEF 2500 > ATK 1700): 青眼 survives, I take 800',z(f)==='mz'&&lp(0)===l0-800,JSON.stringify([z(f),l0,lp(0)])); }

/* ===== the substitute (all four): destroyed → another 六武衆 may be destroyed instead ===== */
for(const n of ['六武衆－イロウ','六武衆－カモン','六武衆－ニサシ','六武衆－ヤリザ']){
  fresh();const u=mon(n,0),zn=mon(ZN,0),bw=mon('青眼の白龍',1);gameState.players[0].mz=[u,zn];gameState.players[1].mz=[bw];baselineA();
  endTurn();phase('battle');PREFER=[uid(zn)];oppAttack(bw,u);PREFER=[];
  ok(n+': attacked by 青眼 → destroying ザンジ instead was chosen: ザンジ is destroyed, '+n+' stays',z(u)==='mz'&&z(zn)==='grave',JSON.stringify([z(u),z(zn)]));
  audit(n+' substitute'); }
`);
