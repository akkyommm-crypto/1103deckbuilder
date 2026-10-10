/* S03-U144: the attack-time Spell/Trap lock (engine/1ZO) and the cards on it. Real DUEL path (attacks through the processor),
   Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
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
/* run the processor until the attack-declaration window is open (the opponent may respond there) */
function toDeclareWindow(){for(let i=0;i<60;i++){const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused)return true;if(pc()){pick();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}return false;}return false;}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='battle';}
function responses(p){return getChainResponsesV2(p).map(x=>x.db.n);}
/* record what the engine offers while a battle is going on (a locked window may never pause the processor) */
let SNAP=[],WATCH=null,PROBE=null;
const __gcrS03=getChainResponsesV2;
getChainResponsesV2=function(p){const r=__gcrS03.apply(this,arguments);
  if(gameState.pendingAttack||gameState.battle){const e={p,names:r.map(x=>x.db.n)};
    if(WATCH&&WATCH.p===p) e.L=strictScriptLegalityV2(WATCH.name,WATCH.p,WATCH.zone,WATCH.idx,{});
    if(PROBE) e.probe=PROBE();
    SNAP.push(e);}
  return r;};
function seenDuring(p){return SNAP.filter(e=>e.p===p);}
function offeredDuring(p,name){return seenDuring(p).some(e=>e.names.indexOf(name)>=0);}
function lockedBy(card){return seenDuring(1).some(e=>e.L&&e.L.ok===false&&new RegExp(card).test(e.L.reason||''));}
const MFW={p:1,name:'聖なるバリア －ミラーフォース－',zone:'sz',idx:0};
function mirror(){const t=mk('聖なるバリア －ミラーフォース－',1,'down');t.setTurn=3;gameState.players[1].sz=[t];return t;}
`;

/* ===== A. 古代の機械兵士: from the attack declaration to the end of the Damage Step the opponent cannot activate Spell/Trap cards ===== */
harness(COMMON+String.raw`
fresh();
const sol=mk('古代の機械兵士',0,'up');gameState.players[0].mz=[sol];
const foe=mk('ワイト',1,'up');gameState.players[1].mz=[foe];const mf=mirror();
baselineA();
SNAP=[];WATCH={p:1,name:'聖なるバリア －ミラーフォース－',zone:'sz',idx:0};
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('A: the engine asked for the opponent responses during the battle',seenDuring(1).length>0,JSON.stringify(SNAP).slice(0,200));
ok('A: the set ミラーフォース is never offered while it attacks',!offeredDuring(1,'聖なるバリア －ミラーフォース－'),JSON.stringify(SNAP).slice(0,300));
const Lw=seenDuring(1).map(e=>e.L).filter(Boolean)[0];
ok('A: … refused with the lock message',!!Lw&&Lw.ok===false&&/古代の機械兵士/.test(Lw.reason||''),JSON.stringify(Lw));
ok('A: battle resolves; ミラーフォース still set',z(foe)==='grave'&&z(mf)==='sz');
ok('A: after the Damage Step the lock is gone',!attackLockReasonS03(1,mf,'sz',dbOf(mf),{}));
audit('A');
/* control: a plain attacker → ミラーフォース is offered */
fresh();
gameState.players[0].mz=[mk('ワイト',0,'up')];gameState.players[1].mz=[mk('ワイト',1,'up')];mirror();
baselineA();
SNAP=[];WATCH=MFW;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});toDeclareWindow();responses(1);
ok('A: control — ワイト attacking: ミラーフォース is offered',offeredDuring(1,'聖なるバリア －ミラーフォース－'),JSON.stringify(SNAP).slice(0,300));
`);

/* ===== B. 古代の機械巨人: the lock, piercing damage, cannot be Special Summoned ===== */
harness(COMMON+String.raw`
fresh();
const g=mk('古代の機械巨人',0,'up');gameState.players[0].mz=[g];
const d=mk('ワイト',1,'down');d.pos='def';gameState.players[1].mz=[d];mirror();
baselineA();
SNAP=[];WATCH=MFW;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('B: locked while it attacks (ミラーフォース refused naming 古代の機械巨人)',lockedBy('古代の機械巨人'),JSON.stringify(SNAP).slice(0,200));
ok('B: piercing — 3000 − ワイト DEF 200 = 2800 damage',gameState.players[1].lp===5200,JSON.stringify({lp:gameState.players[1].lp}));
audit('B');
fresh();gameState.phase='main1';
const g2=mk('古代の機械巨人',0);gameState.players[0].grave=[g2];gameState.players[0].hand=[mk('死者蘇生',0)];
ok('B: cannot be Special Summoned — 死者蘇生 has no target',strictScriptLegalityV2('死者蘇生',0,'hand',0,{}).ok===false);
`);

/* ===== C. インフェルニティ・ビースト: only with an empty hand ===== */
harness(COMMON+String.raw`
fresh();
gameState.players[0].mz=[mk('インフェルニティ・ビースト',0,'up')];gameState.players[1].mz=[mk('ワイト',1,'up')];mirror();
gameState.players[0].hand=[mk('ワイト',0)];
baselineA();
SNAP=[];WATCH=MFW;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});toDeclareWindow();responses(1);
ok('C: with 1 card in hand → no lock',offeredDuring(1,'聖なるバリア －ミラーフォース－'));
fresh();
gameState.players[0].mz=[mk('インフェルニティ・ビースト',0,'up')];gameState.players[1].mz=[mk('ワイト',1,'up')];mirror();
gameState.players[0].hand=[];
baselineA();
SNAP=[];WATCH=MFW;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('C: with an empty hand → locked',lockedBy('インフェルニティ・ビースト'),JSON.stringify(SNAP).slice(0,200));
`);

/* ===== D. ジェムナイト・マディラ: also when it is attacked, and monster effects too ===== */
harness(COMMON+String.raw`
fresh();gameState.activePlayer=1;
const md=mk('ジェムナイト・マディラ',0,'up');md.properlySummonedS03=true;gameState.players[0].mz=[md];
const atk=mk('ワイト',1,'up');gameState.players[1].mz=[atk];
gameState.players[1].hand=[mk('オネスト',1),mk('サイクロン',1)];
const setT=mk('サイクロン',0,'down');setT.setTurn=3;gameState.players[0].sz=[setT];
baselineA();
SNAP=[];WATCH={p:1,name:'サイクロン',zone:'hand',idx:1};
PROBE=()=>({mon:attackLockReasonS03(1,gameState.players[1].hand[0],'hand',dbOf(gameState.players[1].hand[0]),{}),own:attackLockReasonS03(0,setT,'sz',dbOf(setT),{})});
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});toDeclareWindow();responses(1);responses(0);
const Lq=seenDuring(1).map(e=>e.L).filter(Boolean)[0];
ok('D: the attacker controller cannot activate a Quick-Play Spell from the hand',!!Lq&&Lq.ok===false&&/マディラ/.test(Lq.reason||''),JSON.stringify(Lq));
ok('D: monster effects are locked too (checked during the battle)',SNAP.some(e=>e.probe&&/マディラ/.test(e.probe.mon||'')),JSON.stringify(SNAP.map(e=>e.probe)).slice(0,300));
ok('D: the controller of マディラ is not locked (its set サイクロン)',SNAP.some(e=>e.probe&&e.probe.own===''),JSON.stringify(SNAP.map(e=>e.probe)).slice(0,300));
PROBE=null;
`);

/* ===== E. 古代の機械騎士 (Gemini): only once Gemini Summoned ===== */
harness(COMMON+String.raw`
fresh();
const k=mk('古代の機械騎士',0,'up');gameState.players[0].mz=[k];gameState.players[1].mz=[mk('ワイト',1,'up')];mirror();
baselineA();
SNAP=[];WATCH=MFW;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});toDeclareWindow();responses(1);
ok('E: as a Normal Monster → no lock',offeredDuring(1,'聖なるバリア －ミラーフォース－'));
fresh();
const k2=mk('古代の機械騎士',0,'up');k2.dualUp=true;gameState.players[0].mz=[k2];gameState.players[1].mz=[mk('ワイト',1,'up')];mirror();
baselineA();
SNAP=[];WATCH=MFW;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('E: Gemini Summoned → locked',lockedBy('古代の機械騎士'),JSON.stringify(SNAP).slice(0,200));
`);

/* ===== F. 古代の機械巨竜: the lock, and the Gadget effects from its Tribute Summon ===== */
harness(COMMON+String.raw`
fresh();gameState.phase='main1';
const gr=mk('グリーン・ガジェット',0,'up'),rd=mk('レッド・ガジェット',0,'up'),gd=mk('古代の機械巨竜',0);
gameState.players[0].mz=[gr,rd];gameState.players[0].hand=[gd];
const d=mk('ワイト',1,'down');d.pos='def';gameState.players[1].mz=[d];mirror();
baselineA();
PREFER=[uid(gr),uid(rd)];doNormalSummon(0,'atk');drive();PREFER=[];
ok('F: Tribute Summoned by releasing Green + Red Gadget',z(gd)==='mz'&&z(gr)==='grave'&&z(rd)==='grave',JSON.stringify({gd:z(gd),gr:z(gr),rd:z(rd)}));
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();   /* journaled phase change (a direct write after the baseline breaks Replay) */
SNAP=[];WATCH=MFW;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:gameState.players[0].mz.indexOf(gd),target:0});drive();
ok('F ②: locked while it attacks',lockedBy('古代の機械巨竜'),JSON.stringify(SNAP).slice(0,200));
ok('F ①: Green → piercing 2800, Red → +400 when it inflicts battle damage (LP 8000 → 4800)',gameState.players[1].lp===4800,JSON.stringify({lp:gameState.players[1].lp}));
audit('F');
fresh();gameState.phase='main1';
const ye=mk('イエロー・ガジェット',0,'up'),gr2=mk('グリーン・ガジェット',0,'up'),gd2=mk('古代の機械巨竜',0);
gameState.players[0].mz=[ye,gr2];gameState.players[0].hand=[gd2];
const foe=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[foe];
baselineA();
PREFER=[uid(ye),uid(gr2)];doNormalSummon(0,'atk');drive();PREFER=[];
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();   /* journaled phase change (a direct write after the baseline breaks Replay) */
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:gameState.players[0].mz.indexOf(gd2),target:0});drive();
ok('F ①: Yellow → destroys ゴブリン突撃部隊 by battle, 700 battle damage + 600 (LP 8000 → 6700)',z(foe)==='grave'&&gameState.players[1].lp===6700,JSON.stringify({foe:z(foe),lp:gameState.players[1].lp}));
audit('F2');
`);
