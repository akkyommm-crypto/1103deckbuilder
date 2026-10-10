/* S03-U120: Extra Deck tier — 氷結界の龍 ブリューナク (discard cost at activation), A・O・J カタストル, インヴェルズ・ローチ,
   No.39 希望皇ホープ. Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
/* answer the pending choice with the candidates whose uid is in uids (multi-select) */
function answerUids(uids){const q=pc();const keys=q.candidates.filter(x=>uids.includes(x.uid)).map(x=>x.key);return answerChoiceV49(keys);}
function drive(){for(let i=0;i<400;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function setc(n,p){const c=mk(n,p,'down');c.setTurn=gameState.turn-1;return c;}
function uid(c){return ensureCardUid(gameState,c);}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';}
`;

/* ===== A. ブリューナク: choose 2 discards as the cost at activation → exactly 2 targets → both returned ===== */
harness(COMMON+String.raw`
fresh();
const b=mk('氷結界の龍 ブリューナク',0,'up');gameState.players[0].mz=[b];
const h1=mk('ワイト',0),h2=mk('ワイトキング',0),h3=mk('ワイト夫人',0);gameState.players[0].hand=[h1,h2,h3];
const m1=mk('ジェネティック・ワーウルフ',1,'up'),s1=setc('聖なるバリア －ミラーフォース－',1),m2=mk('ワイト',1,'up');
gameState.players[1].mz=[m1,m2];gameState.players[1].sz=[s1];
baselineA();
duelActivateFromZone(0,'mz',0);
const q1=pc();
ok('A: the cost choice lists the hand, 1..3 (min of hand 3 / opponent cards 3)',q1&&q1.min===1&&q1.max===3&&q1.candidates.length===3,JSON.stringify(q1&&{min:q1.min,max:q1.max,n:q1.candidates.length}));
answerUids([uid(h1),uid(h3)]);
ok('A: the 2 chosen cards are discarded at activation (cost), the 3rd stays',names(0,'grave').length===2&&names(0,'hand').join()==='ワイトキング',JSON.stringify({g:names(0,'grave'),h:names(0,'hand')}));
const q2=pc();
ok('A: exactly 2 targets are required',q2&&q2.min===2&&q2.max===2,JSON.stringify(q2&&{min:q2.min,max:q2.max}));
answerUids([uid(m1),uid(s1)]);
ok('A: the activation is on the chain with both targets',gameState.chain.length===1&&gameState.chain[0].name==='氷結界の龍 ブリューナク',JSON.stringify(gameState.chain.map(l=>l.name)));
drive();
ok('A: both targets returned to the owner\'s hand; the non-target stays',z(m1)==='hand'&&z(s1)==='hand'&&z(m2)==='mz',JSON.stringify({m1:z(m1),s1:z(s1),m2:z(m2)}));
ok('A: once per turn',strictScriptLegalityV2('氷結界の龍 ブリューナク',0,'mz',0,{}).ok===false);
audit('A');
`);

/* ===== B. negated by 天罰: the discard cost stays paid; the targets stay ===== */
harness(COMMON+String.raw`
fresh();
const b=mk('氷結界の龍 ブリューナク',0,'up');gameState.players[0].mz=[b];
const h1=mk('ワイト',0),h2=mk('ワイトキング',0);gameState.players[0].hand=[h1,h2];
const m1=mk('ジェネティック・ワーウルフ',1,'up');gameState.players[1].mz=[m1];
const tb=setc('天罰',1);gameState.players[1].sz=[tb];gameState.players[1].hand=[mk('ワイト',1)];
baselineA();
duelActivateFromZone(0,'mz',0);answerUids([uid(h1)]);answerUids([uid(m1)]);
ok('B: P2 may respond with 天罰',getChainResponsesV2(1).some(x=>x.db.n==='天罰'),JSON.stringify(getChainResponsesV2(1).map(x=>x.db.n)));
duelActivateResponseV2(1,'sz',0);drive();
ok('B: ブリューナク negated and destroyed; its discarded card stays in the GY; the target stays on the field',z(b)==='grave'&&z(h1)==='grave'&&z(h2)==='hand'&&z(m1)==='mz',JSON.stringify({b:z(b),h1:z(h1),h2:z(h2),m1:z(m1)}));
audit('B');
`);

/* ===== C. A・O・J カタストル: non-DARK face-up monster → destroyed without damage calculation; DARK / face-down → normal battle ===== */
harness(COMMON+String.raw`
function attackWith(target){doPhase('battle');drive();requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target});drive();}
fresh();
let k=mk('A・O・J カタストル',0,'up');gameState.players[0].mz=[k];
let t=mk('ホルスの黒炎竜 LV8',1,'up');gameState.players[1].mz=[t];
baselineA();attackWith(0);
ok('C カタストル: attacks a 3000-ATK LIGHT... (炎) monster → it is destroyed, カタストル survives, no damage',z(t)==='grave'&&z(k)==='mz'&&gameState.players[0].lp===8000&&gameState.players[1].lp===8000,JSON.stringify({t:z(t),k:z(k),lp:[gameState.players[0].lp,gameState.players[1].lp]}));
audit('C');
fresh();
k=mk('A・O・J カタストル',0,'up');gameState.players[0].mz=[k];
t=mk('ダーク・アームド・ドラゴン',1,'up');gameState.players[1].mz=[t];
baselineA();attackWith(0);
ok('C カタストル: a DARK monster is not affected (normal battle: カタストル 2200 destroyed, 600 damage)',z(t)==='mz'&&z(k)==='grave'&&gameState.players[0].lp===7400,JSON.stringify({t:z(t),k:z(k),lp:gameState.players[0].lp}));
fresh();
k=mk('A・O・J カタストル',0,'up');gameState.players[0].mz=[k];
t=mk('ワイト',1,'down');t.pos='def';gameState.players[1].mz=[t];
baselineA();attackWith(0);
ok('C カタストル: a face-down monster → no effect (flipped, then normal battle)',z(t)==='grave'&&t.face==='up'&&!gameState.chain.length,JSON.stringify({t:z(t)}));
/* attacked by a non-DARK monster */
fresh();gameState.activePlayer=1;
k=mk('A・O・J カタストル',0,'up');gameState.players[0].mz=[k];
t=mk('ジェネティック・ワーウルフ',1,'up');gameState.players[1].mz=[t];
baselineA();
doPhase('battle');drive();requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('C カタストル: attacked by a non-DARK monster → the attacker is destroyed',z(t)==='grave'&&z(k)==='mz'&&gameState.players[0].lp===8000,JSON.stringify({t:z(t),k:z(k)}));
audit('C defend');
/* the CURRENT attribute counts: a LIGHT monster turned DARK (A・ジェネクス・チェンジャー's API.setAttribute) is not affected */
fresh();
k=mk('A・O・J カタストル',0,'up');gameState.players[0].mz=[k];
t=mk('ホルスの黒炎竜 LV8',1,'up');gameState.players[1].mz=[t];
baselineA();
API.setAttribute(findCardByUid(t.uid),'闇','endPhase','test');
attackWith(0);
ok('C カタストル: a monster whose current attribute is DARK is not affected (normal battle: カタストル destroyed)',currentAttributeV17(t)==='闇'&&z(t)==='mz'&&z(k)==='grave',JSON.stringify({attr:currentAttributeV17(t),t:z(t),k:z(k)}));
audit('C attr');
`);

/* ===== D. インヴェルズ・ローチ: negates a Level 5+ Special Summon by procedure (サイバー・ドラゴン); not a Level 4- one ===== */
harness(COMMON+String.raw`
fresh();gameState.activePlayer=1;
const r=mk('インヴェルズ・ローチ',0,'up');r.xyz=[mk('ワイト',0),mk('ワイト',0)];gameState.players[0].mz=[r];
const cd=mk('サイバー・ドラゴン',1);gameState.players[1].hand=[cd];gameState.players[1].mz=[];gameState.players[0].mz.push(mk('ワイト',0,'up'));
baselineA();
finishSummonProcedure('サイバー・ドラゴン',1,'hand',0,'atk');   /* the position sheet's 表側攻撃表示 button */
const ps=gameState.pendingSummon;
ok('D ローチ: the summon window for サイバー・ドラゴン (Lv5) lists インヴェルズ・ローチ',!!ps&&summonNegatorsV2(ps).some(x=>x.db.n==='インヴェルズ・ローチ'),JSON.stringify({ps:!!ps,t:TOASTS}));
if(ps){ activateSummonNegatorV2(0,'mz',0); drive(); }
ok('D ローチ: the Special Summon is negated and サイバー・ドラゴン destroyed; 1 material detached',z(cd)==='grave'&&(r.xyz||[]).length===1,JSON.stringify({cd:z(cd),xyz:(r.xyz||[]).length}));
audit('D');
/* negative: a Level 3 procedure (BF－疾風のゲイル from the hand with another face-up BF) is not listed */
fresh();gameState.activePlayer=1;
const r2=mk('インヴェルズ・ローチ',0,'up');r2.xyz=[mk('ワイト',0)];gameState.players[0].mz=[r2];
const bh=mk('BF－疾風のゲイル',1);gameState.players[1].hand=[bh];gameState.players[1].mz=[mk('BF－黒槍のブラスト',1,'up')];
baselineA();
const L2=strictSummonProcedureLegality('BF－疾風のゲイル',1,'hand',0);
finishSummonProcedure('BF－疾風のゲイル',1,'hand',0,'atk');
const ps2=gameState.pendingSummon;
ok('D ローチ negative: the summon window for the Level 3 BF－疾風のゲイル does not list it',L2.ok&&(!ps2||!summonNegatorsV2(ps2).some(x=>x.db.n==='インヴェルズ・ローチ')),JSON.stringify({L2,ps:!!ps2}));
`);

/* ===== E. No.39 希望皇ホープ: negate an attack (material), and destroyed when targeted with no material ===== */
harness(COMMON+String.raw`
fresh();gameState.activePlayer=1;
const hp=mk('No.39 希望皇ホープ',0,'up');hp.xyz=[mk('ワイト',0)];gameState.players[0].mz=[hp];
const a=mk('ダーク・アームド・ドラゴン',1,'up');gameState.players[1].mz=[a];
baselineA();
doPhase('battle');drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
for(let i=0;i<30;i++){const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused)break; if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;} break;}
ok('E ホープ: at the attack declaration its controller is offered ①',getChainResponsesV2(0).some(x=>x.db.n==='No.39 希望皇ホープ'),JSON.stringify(getChainResponsesV2(0).map(x=>x.db.n)));
pointActivateV27(0,'mz',0);
drive();
ok('E ホープ: the attack is negated, its material detached, no damage',z(hp)==='mz'&&(hp.xyz||[]).length===0&&gameState.players[0].lp===8000,JSON.stringify({hp:z(hp),xyz:(hp.xyz||[]).length,lp:gameState.players[0].lp}));
audit('E negate');
/* no material → targeted → destroyed */
fresh();gameState.activePlayer=1;
const hp2=mk('No.39 希望皇ホープ',0,'up');hp2.xyz=[];gameState.players[0].mz=[hp2];
const w=mk('ワイト',1,'up');gameState.players[1].mz=[w];
baselineA();
doPhase('battle');drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('E ホープ: with no material, being targeted destroys it (mandatory ②, a chain link)',z(hp2)==='grave'&&v41ReplayPackage(gameState).actions.some(x=>x&&x.action&&x.action.type==='CHAIN_ADD'&&x.action.name==='No.39 希望皇ホープ'),JSON.stringify({hp:z(hp2)}));
ok('E ホープ: the attack then has no target (replay; ワイト did not deal damage)',gameState.players[0].lp===8000,String(gameState.players[0].lp));
audit('E self-destroy');
/* ① with the LAST material on an attack targeting Hope itself → the attack is negated, Hope is NOT destroyed by ② */
fresh();gameState.activePlayer=1;
const hp3=mk('No.39 希望皇ホープ',0,'up');hp3.xyz=[mk('ワイト',0)];gameState.players[0].mz=[hp3];
gameState.players[1].mz=[mk('ワイト',1,'up')];
baselineA();doPhase('battle');drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
for(let i=0;i<30;i++){const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused)break; if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;} break;}
pointActivateV27(0,'mz',0);drive();
ok('E ホープ: ① with its last material on an attack on itself → negated, it stays (② does not apply: it had material when targeted)',z(hp3)==='mz'&&!(hp3.xyz||[]).length,JSON.stringify({hp:z(hp3)}));
audit('E last material');
`);
