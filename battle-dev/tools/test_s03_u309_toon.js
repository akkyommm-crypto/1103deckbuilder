/* S03-U309: トゥーン monsters, part 1 — トゥーン・キャノン・ソルジャー, トゥーン・ゴブリン突撃部隊, トゥーン・ヂェミナイ・エルフ, トゥーン・仮面魔道士.
   Real DUEL path (Normal Summon, Battle Phase, real attacks, the destruction of トゥーン・ワールド through its own destroy action), Replay-audited.
   Common clauses: ① no attack on the turn of Summon / Flip Summon / Special Summon  ② direct attack with the own トゥーン・ワールド and no opposing Toon monster
   ③ destroyed when a トゥーン・ワールド is destroyed.  Card effects: キャノン (release → 500), ゴブリン (defense + position lock after attacking), ヂェミナイ (discard at random), 仮面魔道士 (draw). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3090001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function attackers(){return battleAttackersV29(0).map(x=>x.card.uid);}
function direct(c){return battleTargetsV29(c.uid).direct;}
function atkDirect(c){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:'direct'});drive();}
function atkTarget(c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:idx(t)});drive();}
function world(p){const w=mk('トゥーン・ワールド',p,'up');gameState.players[p].sz.push(w);return w;}
function toon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
const CANNON='トゥーン・キャノン・ソルジャー',GOB='トゥーン・ゴブリン突撃部隊',GEM='トゥーン・ヂェミナイ・エルフ',MASK='トゥーン・仮面魔道士';

/* ===== ① the summon turn: Normal Summon, then no attack; a Toon that was on the field since an earlier turn attacks ===== */
for(const n of [CANNON,GOB,GEM,MASK]){
  fresh();const t=mk(n,0);gameState.players[0].hand=[t];world(0);const foe=mk('ワイト',1);foe.summonedTurn=3;gameState.players[1].mz=[foe];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('①('+n+'): Normal Summoned',z(t)==='mz',z(t));
  phase('battle');
  ok('①('+n+'): it cannot attack on the turn it was Summoned',attackers().indexOf(t.uid)<0,JSON.stringify(attackers()));
  audit('①('+n+')');
}
{ fresh();const t=toon(GEM,0);gameState.players[0].mz=[t];world(0);baselineA();phase('battle');
  ok('①: a Toon on the field since an earlier turn can attack',attackers().indexOf(t.uid)>=0,JSON.stringify(attackers())); }
{ fresh();const t=mk(GEM,0,'down','def');t.setTurn=3;t.summonedTurn=3;gameState.players[0].mz=[t];world(0);baselineA();
  doFlipUp(0,'mz',idx(t),'atk');drive();
  ok('①: Flip Summoned',z(t)==='mz'&&C(t).face==='up'&&C(t).pos==='atk',JSON.stringify([z(t),C(t).face,C(t).pos]));
  phase('battle');
  ok('①: it cannot attack on the turn it was Flip Summoned',attackers().indexOf(t.uid)<0,JSON.stringify(attackers())); }

/* ===== ② direct attack ===== */
{ fresh();const t=toon(MASK,0),other=mk('ライオウ',0);other.summonedTurn=3;const foe=mk('ワイト',1);foe.summonedTurn=3;
  gameState.players[0].mz=[t,other];gameState.players[1].mz=[foe];world(0);baselineA();phase('battle');
  ok('②: own トゥーン・ワールド and no opposing Toon → direct attack although the opponent has a monster; a non-Toon cannot',direct(t)===true&&direct(other)===false,JSON.stringify([direct(t),direct(other)])); }
{ fresh();const t=toon(MASK,0),foe=mk('ワイト',1),ft=toon(GOB,1);foe.summonedTurn=3;
  gameState.players[0].mz=[t];gameState.players[1].mz=[foe,ft];world(0);baselineA();phase('battle');
  ok('②: an opposing Toon monster → no direct attack',direct(t)===false,String(direct(t))); }
{ fresh();const t=toon(MASK,0),foe=mk('ワイト',1);foe.summonedTurn=3;
  gameState.players[0].mz=[t];gameState.players[1].mz=[foe];baselineA();phase('battle');
  ok('②: no トゥーン・ワールド → no direct attack',direct(t)===false,String(direct(t))); }
{ fresh();const t=toon(MASK,0),foe=mk('ワイト',1);foe.summonedTurn=3;
  gameState.players[0].mz=[t];gameState.players[1].mz=[foe];world(1);baselineA();phase('battle');
  ok('②: only the opponent has トゥーン・ワールド → no direct attack (「自分フィールド上に」)',direct(t)===false,String(direct(t))); }
{ fresh();const t=toon(MASK,0);gameState.players[0].mz=[t];gameState.players[1].mz=[];baselineA();phase('battle');
  ok('②: an empty opposing field is an ordinary direct attack (even without トゥーン・ワールド)',direct(t)===true,String(direct(t))); }

/* ===== ③ トゥーン・ワールド destroyed ===== */
{ fresh();const a=toon(CANNON,0),b=toon(GOB,1),other=mk('ライオウ',0);other.summonedTurn=3;const w=world(0);
  const cy=mk('サイクロン',0,'up');gameState.players[0].hand=[cy];gameState.players[0].mz=[a,other];gameState.players[1].mz=[b];baselineA();
  PREFER=[uid(w)];duelActivateFromHand(0);drive();PREFER=[];
  ok('③: トゥーン・ワールド destroyed → every Toon monster (both players) is destroyed; the non-Toon stays',z(w)==='grave'&&z(a)==='grave'&&z(b)==='grave'&&z(other)==='mz',JSON.stringify([z(w),z(a),z(b),z(other)]));
  audit('③'); }
{ fresh();const a=toon(CANNON,0),w=world(0);gameState.players[0].mz=[a];baselineA();
  act({type:'FX_BOUNCE',player:0,zone:'sz',index:gameState.players[0].sz.indexOf(w),reason:'test'});drive();
  ok('③: control — トゥーン・ワールド returned to the hand (not destroyed) → the Toon stays',z(w)==='hand'&&z(a)==='mz',JSON.stringify([z(w),z(a)])); }

/* ===== トゥーン・キャノン・ソルジャー: release a monster → 500 damage ===== */
{ fresh();const c=toon(CANNON,0),x=mk('ライオウ',0);x.summonedTurn=3;gameState.players[0].mz=[c,x];world(0);baselineA();
  const lp1=lp(1);PREFER=[uid(x)];duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];
  ok('キャノン: releasing ライオウ → 500 damage to the opponent',z(x)==='grave'&&lp(1)===lp1-500,JSON.stringify([z(x),lp1,lp(1)]));
  PREFER=[uid(c)];duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];
  ok('キャノン: no once-per-turn clause — it may release itself for another 500',z(c)==='grave'&&lp(1)===lp1-1000,JSON.stringify([z(c),lp(1)]));
  audit('キャノン'); }
{ fresh();const c=toon(CANNON,0);gameState.players[0].mz=[c];world(0);baselineA();gameState.activePlayer=1;
  ok('キャノン: not on the opponent turn (ignition effect)',strictScriptLegalityV2(CANNON,0,'mz',0,{}).ok===false,JSON.stringify(strictScriptLegalityV2(CANNON,0,'mz',0,{}))); }

/* ===== トゥーン・ゴブリン突撃部隊: after attacking → Defense Position at the end of the Battle Phase, position locked ===== */
{ fresh();const g=toon(GOB,0);gameState.players[0].mz=[g];world(0);baselineA();phase('battle');
  const lp1=lp(1);atkDirect(g);
  ok('ゴブリン: direct attack 2300',lp(1)===lp1-2300,JSON.stringify([lp1,lp(1)]));
  phase('main2');
  ok('ゴブリン: Defense Position at the end of the Battle Phase, locked until the end of the next own turn',C(g).pos==='def'&&Number(C(g).b0DefLockUntil)===gameState.turn+2,JSON.stringify([C(g).pos,C(g).b0DefLockUntil]));
  audit('ゴブリン'); }

/* ===== トゥーン・ヂェミナイ・エルフ: battle damage → the opponent discards 1 card at random ===== */
{ fresh();const e=toon(GEM,0);gameState.players[0].mz=[e];gameState.players[1].hand=[mk('ワイト',1),mk('サイクロン',1),mk('ライオウ',1)];world(0);baselineA();phase('battle');
  const lp1=lp(1);atkDirect(e);
  ok('ヂェミナイ: 1900 direct damage and the opponent discarded 1 card at random',lp(1)===lp1-1900&&gameState.players[1].hand.length===2&&gameState.players[1].grave.length===1,JSON.stringify({lp:lp(1),hand:gameState.players[1].hand.length,grave:gameState.players[1].grave.length}));
  audit('ヂェミナイ'); }

/* ===== トゥーン・仮面魔道士: battle damage → draw 1 ===== */
{ fresh();const m=toon(MASK,0);gameState.players[0].mz=[m];world(0);baselineA();phase('battle');
  const h0=gameState.players[0].hand.length,d0=gameState.players[0].deck.length,lp1=lp(1);atkDirect(m);
  ok('仮面魔道士: 900 direct damage and 1 card drawn',lp(1)===lp1-900&&gameState.players[0].hand.length===h0+1&&gameState.players[0].deck.length===d0-1,JSON.stringify({lp:lp(1),hand:gameState.players[0].hand.length,deck:gameState.players[0].deck.length}));
  audit('仮面魔道士'); }
`);
