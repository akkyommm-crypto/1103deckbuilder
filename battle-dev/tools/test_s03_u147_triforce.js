/* S03-U147: A・ジェネクス・トライフォース — effects by the attribute of its non-Tuner Synchro materials (recorded at the real Synchro
   Summon since U147). Real DUEL path (Synchro Summon, phase change, attacks and activation through the processor), Replay-audited. */
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
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';}
let SNAP=[],WATCH=null;
const __gcr=getChainResponsesV2;
getChainResponsesV2=function(p){const r=__gcr.apply(this,arguments);
  if(gameState.pendingAttack||gameState.battle){const e={p,names:r.map(x=>x.db.n)};
    if(WATCH&&WATCH.p===p) e.L=strictScriptLegalityV2(WATCH.name,WATCH.p,WATCH.zone,WATCH.idx,{});
    SNAP.push(e);}
  return r;};
function lockedBy(card){return SNAP.filter(e=>e.p===1).some(e=>e.L&&e.L.ok===false&&new RegExp(card).test(e.L.reason||''));}
function offered(name){return SNAP.filter(e=>e.p===1).some(e=>e.names.indexOf(name)>=0);}
const MF='聖なるバリア －ミラーフォース－';
function mirror(){const t=mk(MF,1,'down');t.setTurn=3;gameState.players[1].sz=[t];return t;}
/* real Synchro Summon of the only combo on the field */
function synchro(nonTuner){
  const P=gameState.players[0];
  const tu=mk('ジェネクス・コントローラー',0,'up'),nt=mk(nonTuner,0,'up');P.mz=[tu,nt];
  const tf=mk('A・ジェネクス・トライフォース',0);P.ex=[tf];
  return {tf,tu,nt};
}
function doSynchro(tf){const cb=exCombos(0,dbOf(tf)).combos;if(cb.length)beginExSummonV2(0,0,cb[0].materials,'synchro','atk');drive();return cb.length;}
function toBattle(){requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();}
function attack(t){SNAP=[];WATCH={p:1,name:MF,zone:'sz',idx:0};requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:gameState.players[0].mz.findIndex(c=>nm(c)==='A・ジェネクス・トライフォース'),target:t});return drive();}
`;

/* ===== A. EARTH material → the attack-time lock ===== */
harness(COMMON+String.raw`
fresh();
const s=synchro('ジェネクス・サーチャー');gameState.players[1].mz=[mk('ワイト',1,'up')];mirror();
baselineA();
const n=doSynchro(s.tf);
ok('A: Synchro Summoned with ジェネクス・コントローラー + ジェネクス・サーチャー (EARTH)',n>0&&z(s.tf)==='mz'&&z(s.nt)==='grave',JSON.stringify({n,tf:z(s.tf)}));
const tfc=findCardByUid(s.tf.uid).card;
ok('A: the materials attributes are recorded (闇 Tuner, 地 non-Tuner)',JSON.stringify((tfc.v380SummonMaterials||[]).map(m=>[m.tuner,m.at]))===JSON.stringify([[false,'地'],[true,'闇']])
  ||JSON.stringify((tfc.v380SummonMaterials||[]).map(m=>[m.tuner,m.at]).sort())===JSON.stringify([[false,'地'],[true,'闇']]),JSON.stringify(tfc.v380SummonMaterials));
toBattle();attack(0);
ok('A ●地: the opponent set ミラーフォース is refused while it attacks',lockedBy('A・ジェネクス・トライフォース'),JSON.stringify(SNAP).slice(0,200));
ok('A: no LIGHT material → the revival is not available',(()=>{const i=gameState.players[0].mz.findIndex(c=>nm(c)==='A・ジェネクス・トライフォース');return strictScriptLegalityV2('A・ジェネクス・トライフォース',0,'mz',i,{}).ok===false;})());
audit('A');
`);

/* ===== B. FIRE material → burn for the destroyed monster's original ATK; no lock ===== */
harness(COMMON+String.raw`
fresh();
const s0=synchro('炎の剣豪');gameState.players[1].mz=[mk('ブラッド・ヴォルス',1,'up')];const mf0=mirror();
baselineA();
doSynchro(s0.tf);
toBattle();attack(0);
ok('B: no EARTH material → no lock: the opponent activates ミラーフォース during the attack and destroys it',
  z(mf0)==='grave'&&z(s0.tf)==='grave',JSON.stringify({mf:z(mf0),tf:z(s0.tf)}));
audit('B no lock');
fresh();
const s=synchro('炎の剣豪');const foe=mk('ブラッド・ヴォルス',1,'up');gameState.players[1].mz=[foe];
baselineA();
doSynchro(s.tf);
toBattle();attack(0);
ok('B ●炎: destroys ブラッド・ヴォルス → 600 battle + 1900 (its original ATK) = LP 5500',z(foe)==='grave'&&gameState.players[1].lp===5500,
  JSON.stringify({foe:z(foe),lp:gameState.players[1].lp}));
audit('B');
/* control: EARTH-only Triforce destroying the same monster → battle damage only */
fresh();
const s2=synchro('ジェネクス・サーチャー');const foe2=mk('ブラッド・ヴォルス',1,'up');gameState.players[1].mz=[foe2];
baselineA();
doSynchro(s2.tf);toBattle();attack(0);
ok('B: control — no FIRE material → only 600 battle damage (LP 7400)',z(foe2)==='grave'&&gameState.players[1].lp===7400,JSON.stringify({lp:gameState.players[1].lp}));
`);

/* ===== C. LIGHT material → once per turn, revive a LIGHT monster face-down in Defense Position ===== */
harness(COMMON+String.raw`
fresh();
const s=synchro('ジェネクス・ニュートロン');
const qk=mk('クィーンズ・ナイト',0),qk2=mk('クィーンズ・ナイト',0),dk=mk('ワイト',0);gameState.players[0].grave=[dk,qk,qk2];
baselineA();
doSynchro(s.tf);
const i=gameState.players[0].mz.findIndex(c=>nm(c)==='A・ジェネクス・トライフォース');
duelActivateFromZone(0,'mz',i);PREFER=[uid(qk)];drive();PREFER=[];
const q=findCardByUid(qk.uid);
ok('C ●光: クィーンズ・ナイト is Special Summoned face-down in Defense Position',!!q&&q.zone==='mz'&&q.card.face==='down'&&q.card.pos==='def',JSON.stringify(q&&{zone:q.zone,face:q.card.face,pos:q.card.pos}));
ok('C: the DARK ワイト was not a candidate (stays in the GY)',z(dk)==='grave');
const i2=gameState.players[0].mz.findIndex(c=>nm(c)==='A・ジェネクス・トライフォース');
ok('C: once per turn — a second activation this turn is refused',strictScriptLegalityV2('A・ジェネクス・トライフォース',0,'mz',i2,{}).ok===false&&z(qk2)==='grave');
audit('C');
`);
