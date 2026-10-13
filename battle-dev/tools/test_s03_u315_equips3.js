/* S03-U315: 伝説の黒帯, 剣の煌き, ロケット・パイルダー (u312Define, X－セイバー = P4 XSABER in P4-v10). Real DUEL path (activation, Battle Phase attacks, サイクロン, the Graveyard effect, really passed turns), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function ctrl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
const SEEN=[];
/* record what the engine offers player 1 while a battle is going on (a locked window may never pause the processor), as test_s03_u144 does */
let SNAP=[];const __gcr=getChainResponsesV2;
getChainResponsesV2=function(p){const r=__gcr.apply(this,arguments);if(gameState.pendingAttack||gameState.battle) SNAP.push({p,names:r.map(x=>x.db.n)});return r;};
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){
    pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3120001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
/* the unified Equip Spells are offered through getLegalHandActions (an 'activate' action), not strictScriptLegalityV2 */
function legalH(name,i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function activate(prefer){PREFER=(prefer||[]).map(uid);duelActivateFromHand(0);drive();PREFER=[];}
let CY=null;
function withCy(){CY=mk('サイクロン',0,'up');gameState.players[0].hand.push(CY);}
function cyclone(target){const i=gameState.players[0].hand.indexOf(CY);PREFER=[uid(target)];duelActivateFromHand(i);drive();PREFER=[];}
function equipped(host,eq){const h=C(host),e=C(eq);return !!h&&!!e&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function setup(eqName,mine,theirs,extraHand){const eq=mk(eqName,0);gameState.players[0].hand=[eq].concat(extraHand||[]);gameState.players[0].mz=mine;gameState.players[1].mz=theirs||[];withCy();baselineA();return eq;}
function dmg(c){return curATK(C(c));}
function atkDirect(c){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:'direct'});drive();}
function atkTarget(c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:idx(t)});drive();}
function oppTargets(att){return battleTargetsV29(att.uid).targets.map(x=>x.card.uid);}

/* turns for real: DRAW → standby → main1 of each new turn */
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}

/* ===== 伝説の黒帯 ===== */
{ fresh();const mf=mon('モンク・ファイター',0),ly=mon('ライオウ',0),eq=mk('伝説の黒帯',0),f=mon('ワイト',1);
  gameState.players[0].hand=[eq];gameState.players[0].mz=[mf,ly];gameState.players[1].mz=[f];withCy();baselineA();
  ok('伝説の黒帯: activatable with a listed host',legalH('伝説の黒帯').ok===true,JSON.stringify(legalH('伝説の黒帯')));
  activate([ly,mf]);
  ok('伝説の黒帯: equipped to モンク・ファイター only (ライオウ is not listed)',equipped(mf,eq)&&!(C(ly).equippedBy&&C(ly).equippedBy.length),String(z(eq)));
  phase('battle');const l1=lp(1);atkTarget(mf,f);
  ok('伝説の黒帯: モンク・ファイター (1300) destroys ワイト (DEF 200) by battle → 1000 battle damage + 200 (its DEF) = 1200',z(f)==='grave'&&lp(1)===l1-1000-200,JSON.stringify([l1,lp(1),z(f)]));
  audit('伝説の黒帯'); }
{ fresh();const eq=mk('伝説の黒帯',0);gameState.players[0].hand=[eq];gameState.players[0].mz=[mon('ライオウ',0)];withCy();baselineA();
  ok('伝説の黒帯: refused — no listed monster on my field',legalH('伝説の黒帯').ok===false); }

/* ===== 剣の煌き ===== */
{ fresh();const xs=mon('X－セイバー アナペレラ',0),eq=mk('剣の煌き',0),f=mon('ワイト',1),g=mon('ライオウ',1),ly=mon('ライオウ',0);
  gameState.players[0].hand=[eq];gameState.players[0].mz=[xs,ly];gameState.players[1].mz=[f,g];withCy();baselineA();
  activate([ly,xs]);
  ok('剣の煌き: equipped to the 「X－セイバー」 monster only',equipped(xs,eq)&&!(C(ly).equippedBy&&C(ly).equippedBy.length),String(z(eq)));
  phase('battle');PREFER=[uid(g)];atkTarget(xs,f);PREFER=[];
  ok('剣の煌き: アナペレラ destroys ワイト by battle → the optional destruction of 1 opponent card (ライオウ) was used',z(f)==='grave'&&z(g)==='grave',JSON.stringify([z(f),z(g)]));
  audit('剣の煌き kill'); }
{ fresh();const xs=mon('X－セイバー アナペレラ',0),eq=mk('剣の煌き',0),other=mon('ワイト',0);
  gameState.players[0].hand=[eq];gameState.players[0].mz=[xs,other];withCy();baselineA();
  activate([xs]);cyclone(eq);
  ok('剣の煌き: the Equip Spell is in the Graveyard (destroyed with サイクロン)',z(eq)==='grave',z(eq));
  ok('剣の煌き: its effect is offered in the Graveyard on my Main Phase (release a monster)',getLegalZoneActions(0,'grave',gameState.players[0].grave.indexOf(C(eq))).some(a=>a.id==='effect'),JSON.stringify(getLegalZoneActions(0,'grave',gameState.players[0].grave.indexOf(C(eq))).map(a=>a.id)));
  const deck0=gameState.players[0].deck.length;PREFER=[uid(other)];duelActivateFromZone(0,'grave',gameState.players[0].grave.indexOf(C(eq)));drive();PREFER=[];
  ok('剣の煌き: released ワイト (cost) → the card is on top of the Deck',z(other)==='grave'&&z(eq)==='deck'&&gameState.players[0].deck.length===deck0+1&&gameState.players[0].deck[0].uid===eq.uid,JSON.stringify([z(other),z(eq),gameState.players[0].deck.length,deck0]));
  audit('剣の煌き GY'); }
{ fresh();const eq=mk('剣の煌き',0);gameState.players[0].hand=[eq];gameState.players[0].mz=[mon('ライオウ',0)];withCy();baselineA();
  ok('剣の煌き: refused — no 「X－セイバー」 monster',legalH('剣の煌き').ok===false); }

/* ===== ロケット・パイルダー ===== */
{ fresh();const ly=mon('ライオウ',0),eq=mk('ロケット・パイルダー',0),bw=mon('青眼の白龍',1);
  gameState.players[0].hand=[eq];gameState.players[0].mz=[ly];gameState.players[1].mz=[bw];withCy();baselineA();
  activate([ly]);
  ok('ロケット・パイルダー: equipped',equipped(ly,eq),String(z(eq)));
  phase('battle');const l0=lp(0);atkTarget(ly,bw);
  ok('ロケット・パイルダー: ライオウ (1900) attacks 青眼 (3000) → it is NOT destroyed in battle (it was the attacker), I take 1100 damage',z(ly)==='mz'&&lp(0)===l0-1100,JSON.stringify([z(ly),l0,lp(0)]));
  ok('ロケット・パイルダー: at the end of the Damage Step the attacked 青眼 loses ATK equal to ライオウ ATK until the End Phase (3000 − 1900 = 1100)',curATK(C(bw))===1100,String(curATK(C(bw))));
  endTurn();
  ok('ロケット・パイルダー: the reduction is gone on the next turn (3000)',curATK(C(bw))===3000,String(curATK(C(bw))));
  audit('パイルダー attack'); }
{ fresh();const ly=mon('ライオウ',0),eq=mk('ロケット・パイルダー',0),bw=mon('青眼の白龍',1);
  gameState.players[0].hand=[eq];gameState.players[0].mz=[ly];gameState.players[1].mz=[bw];withCy();baselineA();
  activate([ly]);endTurn();phase('battle');
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:idx(ly)});drive();
  ok('ロケット・パイルダー: as the ATTACKED monster the protection does not apply — 青眼 (3000) destroys ライオウ',z(ly)==='grave',z(ly));
  audit('パイルダー defend'); }
`);
