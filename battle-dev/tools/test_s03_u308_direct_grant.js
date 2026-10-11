/* S03-U308: バトル・テレポーテーション, マジック・ホール・ゴーレム, クロス・アタック, 中央突破 — the cards that let a chosen monster attack directly this turn.
   Real DUEL path (activation from the zone / hand, targets, chain, resolution, Battle Phase, real attacks, the end of the Battle Phase), Replay-audited.
   A. バトル・テレポーテーション   B. マジック・ホール・ゴーレム   C. クロス・アタック   D. 中央突破 (needs gameState.battleKillsS03, engine/00 BATTLE_CLEANUP). */
const harness=require('./astra_harness');
const COMMON=String.raw`
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
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3080001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function attackers(){return battleAttackersV29(0).map(x=>x.card.uid);}
function direct(c){return battleTargetsV29(c.uid).direct;}
function legalS(name,p,zone,i){return strictScriptLegalityV2(name,p,zone,i,{});}
function setTrap(name,p){const t=mk(name,p||0,'down');t.setTurn=3;return t;}
function atkDirect(c){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:'direct'});drive();}
function atkTarget(c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:idx(t)});drive();}
`;

/* ===== A. バトル・テレポーテーション ===== */
harness(COMMON+String.raw`
const PSY='ウォールクリエイター';
/* A1: exactly one Psychic (and a Warrior) of mine: direct attack with opposing monsters present, control moves at the end of the Battle Phase */
{
  fresh();
  const ps=mk(PSY,0),wr=mk('ライオウ',0),foe=mk('ワイト',1),tr=setTrap('バトル・テレポーテーション',0);
  ps.summonedTurn=3;wr.summonedTurn=3;foe.summonedTurn=3;
  gameState.players[0].mz=[ps,wr];gameState.players[1].mz=[foe];gameState.players[0].sz=[tr];baselineA();
  ok('A1: one face-up Psychic → activatable',legalS('バトル・テレポーテーション',0,'sz',0).ok===true,JSON.stringify(legalS('バトル・テレポーテーション',0,'sz',0)));
  duelActivateFromZone(0,'sz',0);drive();
  phase('battle');
  ok('A1: the Psychic can attack directly although the opponent has a monster; the Warrior cannot',direct(ps)===true&&direct(wr)===false,JSON.stringify([direct(ps),direct(wr)]));
  const lp1=lp(1);atkDirect(ps);
  ok('A1: the opponent took the Psychic ATK as battle damage',lp(1)===lp1-Number(dbOf(C(ps)).atk),JSON.stringify([lp1,lp(1)]));
  ok('A1: still mine during the Battle Phase',ctrl(ps)===0&&z(ps)==='mz');
  phase('main2');
  ok('A1: at the end of the Battle Phase the Psychic is controlled by the opponent',ctrl(ps)===1&&z(ps)==='mz',JSON.stringify([ctrl(ps),z(ps)]));
  ok('A1: the Warrior stays with me',ctrl(wr)===0);
  audit('A1');
}
/* A2: refused */
for(const c of [
  {label:'two Psychic monsters (「1体のみ」)',mine:[PSY,PSY]},
  {label:'no Psychic monster',mine:['ライオウ']},
  {label:'the only Psychic is face-down',mine:[[PSY,'down']]}]){
  fresh();gameState.players[0].mz=c.mine.map(m=>Array.isArray(m)?mk(m[0],0,m[1]):mk(m,0));gameState.players[0].sz=[setTrap('バトル・テレポーテーション',0)];baselineA();
  ok('A2: refused — '+c.label,legalS('バトル・テレポーテーション',0,'sz',0).ok===false,JSON.stringify(legalS('バトル・テレポーテーション',0,'sz',0)));
}
/* A3: the opponent has no free Monster Zone at the end of the Battle Phase → control does not change */
{
  fresh();
  const ps=mk(PSY,0),tr=setTrap('バトル・テレポーテーション',0);ps.summonedTurn=3;
  gameState.players[0].mz=[ps];gameState.players[1].mz=Array.from({length:5},()=>{const w=mk('ワイト',1);w.summonedTurn=3;return w;});gameState.players[0].sz=[tr];baselineA();
  duelActivateFromZone(0,'sz',0);drive();phase('battle');phase('main2');
  ok('A3: no free Monster Zone on the opponent side → the Psychic stays with me',ctrl(ps)===0&&z(ps)==='mz',JSON.stringify([ctrl(ps),z(ps)]));
  audit('A3');
}
`);

/* ===== B. マジック・ホール・ゴーレム ===== */
harness(COMMON+String.raw`
/* B1: halve the ATK of the chosen monster, it attacks directly, the other monsters (the Golem included) cannot attack */
{
  fresh();
  const g=mk('マジック・ホール・ゴーレム',0),x=mk('ライオウ',0),y=mk('ワイト',0),foe=mk('ワイト',1);
  [g,x,y,foe].forEach(c=>c.summonedTurn=3);
  gameState.players[0].mz=[g,x,y];gameState.players[1].mz=[foe];baselineA();
  ok('B1: activatable in Main Phase 1',legalS('マジック・ホール・ゴーレム',0,'mz',0).ok===true);
  PREFER=[uid(x)];duelActivateFromZone(0,'mz',idx(g));drive();PREFER=[];
  ok('B1: the chosen ライオウ has half its ATK (1900 → 950)',curATK(C(x))===950,String(curATK(C(x))));
  phase('battle');
  ok('B1: only the chosen monster can attack (the Golem and the other monster cannot)',JSON.stringify(attackers())===JSON.stringify([x.uid]),JSON.stringify(attackers()));
  ok('B1: the chosen monster attacks directly although the opponent has a monster',direct(x)===true);
  const lp1=lp(1);atkDirect(x);
  ok('B1: 950 direct damage',lp(1)===lp1-950,JSON.stringify([lp1,lp(1)]));
  phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();
  ok('B1: the ATK is back to 1900 once the turn is over (until the End Phase)',curATK(C(x))===1900,String(curATK(C(x))));
  audit('B1');
}
/* B2: once per turn; a monster that arrives later in the turn cannot attack either; the lock holds after the Golem leaves the field */
{
  fresh();
  const g=mk('マジック・ホール・ゴーレム',0),x=mk('ライオウ',0),late=mk('ライオウ',0),foe=mk('ワイト',1);
  [g,x,foe].forEach(c=>c.summonedTurn=3);
  gameState.players[0].mz=[g,x];gameState.players[0].hand=[late];gameState.players[1].mz=[foe];baselineA();
  PREFER=[uid(x)];duelActivateFromZone(0,'mz',idx(g));drive();PREFER=[];
  ok('B2: once per turn — a second activation is refused',legalS('マジック・ホール・ゴーレム',0,'mz',idx(g)).ok===false);
  doNormalSummon(0,'atk');drive();
  ok('B2: ライオウ was Normal Summoned after the activation',z(late)==='mz',z(late));
  act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:idx(g),reason:'test'});
  ok('B2: the Golem has left the field',z(g)==='grave',z(g));
  phase('battle');
  ok('B2: still only the chosen monster can attack (the lock outlives the Golem; the later monster cannot attack)',JSON.stringify(attackers())===JSON.stringify([x.uid]),JSON.stringify(attackers()));
  audit('B2');
}
/* B3: the lock is only for the turn of the activation */
{
  fresh();
  const g=mk('マジック・ホール・ゴーレム',0),x=mk('ライオウ',0),y=mk('ワイト',0),foe=mk('ワイト',1);
  [g,x,y,foe].forEach(c=>c.summonedTurn=3);
  gameState.players[0].mz=[g,x,y];gameState.players[1].mz=[foe];baselineA();
  PREFER=[uid(x)];duelActivateFromZone(0,'mz',idx(g));drive();PREFER=[];
  gameState.turn=7;gameState.phase='battle';
  ok('B3: another turn — the other monsters can attack again',attackers().indexOf(y.uid)>=0&&attackers().indexOf(g.uid)>=0,JSON.stringify(attackers()));
}
`);

/* ===== C. クロス・アタック ===== */
harness(COMMON+String.raw`
function board(){fresh();
  const a=mk('ライオウ',0),b=mk('ライオウ',0),c=mk('ワイト',0),foe=mk('ワイト',1),sp=mk('クロス・アタック',0,'up');
  [a,b,c,foe].forEach(m=>m.summonedTurn=3);
  gameState.players[0].mz=[a,b,c];gameState.players[1].mz=[foe];gameState.players[0].hand=[sp];baselineA();return {a,b,c,foe,sp};}
for(const order of ['ab','ba']){
  const S=board();const first=order==='ab'?S.a:S.b, second=order==='ab'?S.b:S.a;
  ok('C'+order+': two face-up Attack Position monsters with the same ATK → activatable',legalS('クロス・アタック',0,'hand',0).ok===true,JSON.stringify(legalS('クロス・アタック',0,'hand',0)));
  PREFER=[uid(first),uid(second)];duelActivateFromHand(0);drive();PREFER=[];
  ok('C'+order+': the Spell was used',z(S.sp)==='grave',z(S.sp));
  phase('battle');
  ok('C'+order+': the first chosen monster attacks directly, the second cannot attack, the third attacks normally',
    direct(first)===true&&attackers().indexOf(second.uid)<0&&attackers().indexOf(first.uid)>=0&&attackers().indexOf(S.c.uid)>=0&&direct(S.c)===false,
    JSON.stringify({att:attackers(),df:direct(first),dc:direct(S.c)}));
  const lp1=lp(1);atkDirect(first);
  ok('C'+order+': direct damage 1900',lp(1)===lp1-1900,JSON.stringify([lp1,lp(1)]));
  audit('C'+order);
}
/* refused */
for(const c of [
  {label:'different ATK',mine:[['ライオウ','up','atk'],['ワイト','up','atk']]},
  {label:'one of the equal pair is in Defense Position',mine:[['ライオウ','up','atk'],['ライオウ','up','def']]},
  {label:'one of the equal pair is face-down',mine:[['ライオウ','up','atk'],['ライオウ','down','def']]},
  {label:'only one monster',mine:[['ライオウ','up','atk']]}]){
  fresh();gameState.players[0].mz=c.mine.map(m=>mk(m[0],0,m[1],m[2]));gameState.players[0].hand=[mk('クロス・アタック',0,'up')];baselineA();
  ok('C: refused — '+c.label,legalS('クロス・アタック',0,'hand',0).ok===false,JSON.stringify(legalS('クロス・アタック',0,'hand',0)));
}
`);

/* ===== D. 中央突破 ===== */
harness(COMMON+String.raw`
function board(){fresh();
  const s=mk('六武衆－ザンジ',0),r=mk('六武衆－イロウ',0),sh=mk('大将軍 紫炎',0),o=mk('ワイト',0),w=mk('ワイト',1),v=mk('ワイト',1),tr=setTrap('中央突破',0);
  [s,r,sh,o,w,v].forEach(m=>m.summonedTurn=3);
  gameState.players[0].mz=[s,r,sh,o];gameState.players[1].mz=[w,v];gameState.players[0].sz=[tr];baselineA();return {s,r,sh,o,w,v,tr};}
/* D1: the selected 六武衆 destroys a monster by battle → the 六武衆 and 大将軍 紫炎 may attack directly; other monsters may not */
{
  const S=board();
  ok('D1: a face-up 六武衆 → activatable',legalS('中央突破',0,'sz',0).ok===true,JSON.stringify(legalS('中央突破',0,'sz',0)));
  PREFER=[uid(S.s)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('D1: the trap resolved and is in the Graveyard',z(S.tr)==='grave',z(S.tr));
  phase('battle');
  ok('D1: before any destruction nobody attacks directly',[S.s,S.r,S.sh,S.o].every(c=>direct(c)===false),JSON.stringify([S.s,S.r,S.sh,S.o].map(direct)));
  atkTarget(S.s,S.w);
  ok('D1: ザンジ destroyed ワイト by battle',z(S.w)==='grave',z(S.w));
  ok('D1: now 六武衆－イロウ and 大将軍 紫炎 can attack directly (the opponent still has ワイト); the plain ワイト cannot',
    direct(S.r)===true&&direct(S.sh)===true&&direct(S.o)===false,JSON.stringify([S.r,S.sh,S.o].map(direct)));
  const lp1=lp(1);atkDirect(S.sh);
  ok('D1: 大将軍 紫炎 hits directly for 2500',lp(1)===lp1-2500,JSON.stringify([lp1,lp(1)]));
  audit('D1');
}
/* D2: the destroyer leaves the field afterwards — the permission stays (「破壊した場合」 was fulfilled) */
{
  const S=board();
  PREFER=[uid(S.s)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  phase('battle');atkTarget(S.s,S.w);
  act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:idx(S.s),reason:'test'});
  ok('D2: ザンジ has left the field',z(S.s)==='grave',z(S.s));
  ok('D2: 六武衆－イロウ can still attack directly',direct(S.r)===true,String(direct(S.r)));
  audit('D2');
}
/* D3: another monster destroys one — not the selected one → no permission */
{
  const S=board();
  PREFER=[uid(S.s)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  phase('battle');atkTarget(S.r,S.w);
  ok('D3: 六武衆－イロウ (not the selected monster) destroyed ワイト',z(S.w)==='grave',z(S.w));
  ok('D3: no direct attack permission is given',direct(S.s)===false&&direct(S.sh)===false);
}
/* D4: no activation → no permission after a battle destruction (control) and refused without a 六武衆 */
{
  const S=board();phase('battle');atkTarget(S.s,S.w);
  ok('D4: control — without 中央突破 nobody attacks directly after a battle destruction',direct(S.r)===false&&direct(S.sh)===false);
  fresh();gameState.players[0].mz=[mk('ライオウ',0)];gameState.players[0].sz=[setTrap('中央突破',0)];baselineA();
  ok('D4: refused — no face-up 六武衆',legalS('中央突破',0,'sz',0).ok===false,JSON.stringify(legalS('中央突破',0,'sz',0)));
}
`);
