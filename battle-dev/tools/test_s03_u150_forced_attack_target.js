/* S03-U150: 立ちはだかる強敵 — for the rest of the turn the opponent may attack only the selected monster, and every face-up Attack
   Position monster must attack it (engine/1ZR). Before: only the current attack was redirected; the lock was read nowhere.
   Real DUEL path (attacks, the response at the attack declaration and the redirect through the processor), Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
const CHOOSERS=[];function pick(){const q=pc();CHOOSERS.push({p:q.player,title:q.title});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function step(){
  if(pc()){pick();return true;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return true;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return true;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return true;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return true;}
  return false;}
function drive(){for(let i=0;i<600;i++){if(!step())return 'idle';}return 'loop';}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function attack(c,t){TOASTS.length=0;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(c),target:t});}
/* player II's turn, Battle Phase; player I has a set 立ちはだかる強敵 */
function fresh(){resetA();gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
  const gob=mk('ゴブリン突撃部隊',1,'up'),dem=mk('デーモンの召喚',1,'up');gameState.players[1].mz=[gob,dem];
  const bsg=mk('ビッグ・シールド・ガードナー',0,'up');bsg.pos='def';const wt=mk('ワイト',0,'up');gameState.players[0].mz=[bsg,wt];
  const tr=mk('立ちはだかる強敵',0,'down');tr.setTurn=4;gameState.players[0].sz=[tr];
  return {gob,dem,bsg,wt,tr};}
`;

harness(COMMON+String.raw`
const s=fresh();
baselineA();
attack(s.gob,idx(s.wt));
let responded=false;
for(let i=0;i<200;i++){
  const w=gameState.processorWaiting;
  if(gameState.pendingAttack&&w&&w.type==='POINT'&&gameState.processorPaused&&!responded){PREFER=[uid(s.bsg)];pointActivateV27(0,'sz',0,0);responded=true;continue;}
  if(!step())break;}
drive();PREFER=[];
ok('A: 立ちはだかる強敵 is activated at the attack declaration and the attack is redirected to ビッグ・シールド・ガードナー',
  responded&&z(s.tr)==='grave'&&z(s.wt)==='mz'&&z(s.bsg)==='mz'&&gameState.players[1].lp===7700,
  JSON.stringify({responded,tr:z(s.tr),wt:z(s.wt),lp1:gameState.players[1].lp}));
const pack=battleTargetsV29(uid(s.dem));
ok('A: the target of 立ちはだかる強敵 is chosen by its controller (player I)',CHOOSERS.some(c=>/立ちはだかる強敵/.test(c.title||'')&&c.p===0),JSON.stringify(CHOOSERS));
ok('A: for the rest of the turn only the selected monster is offered as a target, and no direct attack',
  pack.targets.length===1&&pack.targets[0].card===findCardByUid(s.bsg.uid).card&&pack.direct===false,JSON.stringify({t:pack.targets.map(x=>nm(x.card)),d:pack.direct}));
ok('A: デーモンの召喚 must attack (pending must-attack)',pendingMustAttack().some(c=>c===findCardByUid(s.dem.uid).card),JSON.stringify(pendingMustAttack().map(nm)));
attack(s.dem,idx(s.wt));drive();
ok('A: an attack on ワイト is refused (the selected monster only)',z(s.wt)==='mz'&&TOASTS.some(t=>/しか攻撃対象にできません/.test(t))&&canDeclareAttackV48(findCardByUid(s.dem.uid).card),JSON.stringify(TOASTS));
attack(s.dem,idx(s.bsg));drive();
ok('A: デーモンの召喚 attacks ビッグ・シールド・ガードナー (2500 vs DEF 2600 → 100 damage to its controller)',gameState.players[1].lp===7600&&z(s.bsg)==='mz',
  JSON.stringify({lp1:gameState.players[1].lp}));
ok('A: no monster left that must attack',pendingMustAttack().length===0);
audit('A');
`);

/* control: without 立ちはだかる強敵 every monster is a target and nothing must attack */
harness(COMMON+String.raw`
const s=fresh();gameState.players[0].sz=[];
baselineA();
const pack=battleTargetsV29(uid(s.dem));
ok('B: control — without the trap both monsters are targets and nothing must attack',pack.targets.length===2&&pendingMustAttack().length===0,JSON.stringify(pack.targets.map(x=>nm(x.card))));
attack(s.dem,idx(s.wt));drive();
ok('B: control — デーモンの召喚 attacks ワイト',z(s.wt)==='grave');
`);
