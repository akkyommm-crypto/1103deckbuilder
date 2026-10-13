/* S03-U316: エーリアン・ウォリアー / グレイ / テレパス / キッズ — the A Counter penalty (「エーリアン」= P4 GROUP.ALIEN), the counters they place, the Flip / destroyed triggers. Real DUEL path, Replay-audited. */
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

function setA(c,n){c.counters=Object.assign({},c.counters||{},{A:n});}
function aCount(c){return (C(c).counters&&Number(C(c).counters['A']))||0;}
function oppAttack(a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(a),target:idx(t)});drive();}

/* ===== the penalty: a monster with A Counters battling an 「エーリアン」 loses 300 ATK / DEF per counter (Damage Step only) ===== */
for(const alien of ['エーリアン・ウォリアー','エーリアン・グレイ','エーリアン・テレパス','エーリアン・キッズ']){
  fresh();const al=mon(alien,0,'def'),mine=mon('エーリアン・ソルジャー',0),foe=mon('ライオウ',1);setA(foe,2);   /* エーリアン・ソルジャー 1900 (a vanilla 「エーリアン」) */
  gameState.players[0].mz=[al,mine];gameState.players[1].mz=[foe];baselineA();
  phase('battle');atkTarget(mine,foe);
  ok(alien+': ライオウ (1900) with 2 A Counters loses 600 ATK in the battle with the 「エーリアン」 ソルジャー (1900) → ライオウ is destroyed, ソルジャー survives',z(foe)==='grave'&&z(mine)==='mz',JSON.stringify([z(foe),z(mine)]));
  audit(alien+' penalty'); }
{ fresh();const al=mon('エーリアン・ウォリアー',0,'def'),mine=mon('エーリアン・ソルジャー',0),foe=mon('ライオウ',1);
  gameState.players[0].mz=[al,mine];gameState.players[1].mz=[foe];baselineA();phase('battle');atkTarget(mine,foe);
  ok('control — without A Counters the same battle destroys both (1900 vs 1900)',z(foe)==='grave'&&z(mine)==='grave',JSON.stringify([z(foe),z(mine)])); }
{ fresh();const al=mon('エーリアン・ウォリアー',0,'def'),mine=mon('ライオウ',0),foe=mon('ライオウ',1);setA(foe,2);
  gameState.players[0].mz=[al,mine];gameState.players[1].mz=[foe];baselineA();phase('battle');atkTarget(mine,foe);
  ok('the penalty is only against an 「エーリアン」: my non-Alien ライオウ vs the ライオウ with counters → both destroyed',z(foe)==='grave'&&z(mine)==='grave',JSON.stringify([z(foe),z(mine)])); }
{ fresh();const al=mon('エーリアン・ウォリアー',0,'def'),mine=mon('エーリアン・ソルジャー',0),foe=mon('ライオウ',1);setA(foe,2);
  gameState.players[0].mz=[al,mine];gameState.players[1].mz=[foe];baselineA();
  ok('the penalty applies only inside a battle: ライオウ keeps 1900 ATK outside it',curATK(C(foe))===1900,String(curATK(C(foe)))); }

/* ===== ウォリアー: destroyed by battle → 2 A Counters on the destroyer ===== */
{ fresh();const wr=mon('エーリアン・ウォリアー',0),bw=mon('青眼の白龍',1);gameState.players[0].mz=[wr];gameState.players[1].mz=[bw];baselineA();
  endTurn();phase('battle');oppAttack(bw,wr);
  ok('ウォリアー: destroyed by 青眼 → 青眼 gets 2 A Counters',z(wr)==='grave'&&aCount(bw)===2,JSON.stringify([z(wr),aCount(bw)]));
  audit('ウォリアー destroyed'); }

/* ===== グレイ: Flip → 1 A Counter; flipped and destroyed in battle → draw 1 ===== */
{ fresh();const gr=mk('エーリアン・グレイ',0,'down','def');gr.setTurn=3;gr.summonedTurn=3;const foe=mon('ライオウ',1),bw=mon('青眼の白龍',1);
  gameState.players[0].mz=[gr];gameState.players[1].mz=[foe,bw];baselineA();
  PREFER=[uid(foe)];doFlipUp(0,'mz',idx(gr),'atk');drive();PREFER=[];
  ok('グレイ: flipped → 1 A Counter on the chosen opponent monster (ライオウ)',aCount(foe)===1&&aCount(bw)===0&&C(gr).face==='up',JSON.stringify([aCount(foe),aCount(bw),C(gr).face]));
  const h0=gameState.players[0].hand.length;endTurn();phase('battle');oppAttack(bw,gr);
  ok('グレイ: the flipped Gray destroyed in battle → I draw 1 card',z(gr)==='grave'&&gameState.players[0].hand.length===h0+1,JSON.stringify([z(gr),h0,gameState.players[0].hand.length]));
  audit('グレイ flip'); }
{ fresh();const gr=mon('エーリアン・グレイ',0),bw=mon('青眼の白龍',1);gameState.players[0].mz=[gr];gameState.players[1].mz=[bw];baselineA();
  const h0=gameState.players[0].hand.length;endTurn();const h1=gameState.players[0].hand.length;phase('battle');oppAttack(bw,gr);
  ok('グレイ: control — a Gray that was never flipped, destroyed in battle, draws nothing',z(gr)==='grave'&&gameState.players[0].hand.length===h1,JSON.stringify([z(gr),h1,gameState.players[0].hand.length])); }

/* ===== テレパス: remove 1 A Counter from an opponent monster → destroy 1 Spell / Trap card ===== */
{ fresh();const te=mon('エーリアン・テレパス',0),foe=mon('ライオウ',1),sp=mk('サイクロン',1,'down');sp.setTurn=3;setA(foe,1);
  gameState.players[0].mz=[te];gameState.players[1].mz=[foe];gameState.players[1].sz=[sp];baselineA();
  ok('テレパス: offered its effect (an opponent monster with an A Counter, a Spell / Trap on the field)',canEffect('mz',te),JSON.stringify(zacts('mz',te)));
  PREFER=[uid(sp)];duelActivateFromZone(0,'mz',idx(te));drive();PREFER=[];
  ok('テレパス: the A Counter was removed (cost) and the chosen Set card destroyed',aCount(foe)===0&&z(sp)==='grave',JSON.stringify([aCount(foe),z(sp)]));
  ok('テレパス: once per turn',!canEffect('mz',te),JSON.stringify(zacts('mz',te)));
  audit('テレパス'); }
{ fresh();const te=mon('エーリアン・テレパス',0),foe=mon('ライオウ',1),sp=mk('サイクロン',1,'down');sp.setTurn=3;
  gameState.players[0].mz=[te];gameState.players[1].mz=[foe];gameState.players[1].sz=[sp];baselineA();
  ok('テレパス: not offered without an A Counter on an opponent monster',!canEffect('mz',te),JSON.stringify(zacts('mz',te))); }

/* ===== キッズ: every monster Special Summoned on the opponent field gets 1 A Counter ===== */
{ fresh();const ki=mon('エーリアン・キッズ',0),dead=mk('ワイト',1),ra=mk('死者蘇生',1,'up');
  gameState.players[0].mz=[ki];gameState.players[1].grave=[dead];gameState.players[1].hand=[ra];baselineA();
  endTurn();PREFER=[uid(dead)];duelActivateFromHand(0);drive();PREFER=[];
  ok('キッズ: the opponent Special Summons ワイト (死者蘇生) → it gets 1 A Counter',z(dead)==='mz'&&aCount(dead)===1,JSON.stringify([z(dead),dead&&aCount(dead)]));
  audit('キッズ'); }
{ fresh();const ki=mon('エーリアン・キッズ',0),dead=mk('ワイト',0),ra=mk('死者蘇生',0,'up');
  gameState.players[0].mz=[ki];gameState.players[0].grave=[dead];gameState.players[0].hand=[ra];baselineA();
  PREFER=[uid(dead)];duelActivateFromHand(0);drive();PREFER=[];
  ok('キッズ: control — a monster I Special Summon myself gets no A Counter',z(dead)==='mz'&&aCount(dead)===0,JSON.stringify([z(dead),aCount(dead)])); }
`);
