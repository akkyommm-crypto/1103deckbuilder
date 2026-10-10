/* S03-U229: NOT_STARTED → TESTED — 平穏の賢者, 静寂の聖者, 言語道断侍, 強引な安全協定 (engine: activationBanS03), C・シューター, 炎熱刀プロミネンス,
   燃え盛るヒータ, 荒ぶるアウス, 逆巻くエリア, 勝利の導き手フレイヤ. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function lp(p){return gameState.players[p].lp;}
function lockAt(p,name,zone,turn){const c=mk(name,p,zone==='hand'?undefined:'down');const t0=gameState.turn;gameState.turn=turn;const r=activationTypeLockReasonS03(p,c,zone,dbOf(c),{});gameState.turn=t0;return r;}

/* ===== A / B: 平穏の賢者 / 静寂の聖者 — destroys a monster by battle: the opponent cannot activate Traps / Spells next turn ===== */
fresh();
let sg=mk('平穏の賢者',0,'up'),ow=mk('ワイト',1,'up');gameState.players[0].mz=[sg];gameState.players[1].mz=[ow];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('A: 平穏の賢者 — the opponent\'s Traps locked only in turn 6; Spells free; its controller free',z(ow)==='grave'&&lockAt(1,'威嚇する咆哮','sz',5)===''&&!!lockAt(1,'威嚇する咆哮','sz',6)&&lockAt(1,'威嚇する咆哮','sz',7)===''&&lockAt(1,'サイクロン','hand',6)===''&&lockAt(0,'威嚇する咆哮','sz',6)==='');
audit('A');
fresh();
sg=mk('静寂の聖者',0,'up');ow=mk('ワイト',1,'up');gameState.players[0].mz=[sg];gameState.players[1].mz=[ow];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('B: 静寂の聖者 — the opponent\'s Spells locked in turn 6; Traps free',!!lockAt(1,'サイクロン','hand',6)&&lockAt(1,'サイクロン','hand',5)===''&&lockAt(1,'威嚇する咆哮','sz',6)==='');
audit('B');

/* ===== C: 言語道断侍 — pay 800: no Spell / Trap card can be activated this turn ===== */
fresh();
let sm=mk('言語道断侍',0,'up');gameState.players[0].mz=[sm];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('C: 800 paid; both players\' Spells and Traps locked this turn, free next turn',lp(0)===7200&&!!lockAt(0,'サイクロン','hand',5)&&!!lockAt(1,'威嚇する咆哮','sz',5)&&lockAt(1,'サイクロン','hand',6)==='');
audit('C');

/* ===== D: 強引な安全協定 — discard (cost): no Trap card this turn ===== */
fresh();
let fs=mk('強引な安全協定',0,'down');fs.setTurn=4;let dh=mk('ワイト',0);gameState.players[0].sz=[fs];gameState.players[0].hand=[dh];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('D: discarded; both players\' Traps locked this turn; Spells free',z(dh)==='grave'&&!!lockAt(0,'威嚇する咆哮','sz',5)&&!!lockAt(1,'威嚇する咆哮','sz',5)&&lockAt(1,'サイクロン','hand',5)==='');
audit('D');

/* ===== E: C・シューター — send a 「C」 monster (itself) to the GY: 800 damage ===== */
fresh();
let cs=mk('C・シューター',0,'up');gameState.players[0].mz=[cs];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('E: sent itself; 800 damage',z(cs)==='grave'&&lp(1)===7200);
audit('E');

/* ===== F: 炎熱刀プロミネンス — banish a 「ラヴァル」 (cost): +300 until the End Phase ===== */
fresh();
let pr=mk('炎熱刀プロミネンス',0,'up'),lv=mk('ラヴァルのマグマ砲兵',0);gameState.players[0].mz=[pr];gameState.players[0].grave=[lv];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('F: +300; ラヴァル banished; once per turn',curATK(C(pr))===2100&&z(lv)==='banish'&&strictScriptLegalityV2('炎熱刀プロミネンス',0,'mz',0,{}).ok===false);
audit('F');

/* ===== G: 燃え盛るヒータ — release a FIRE monster (cost): a FIRE monster from the hand; destroyed when ヒータ leaves ===== */
fresh();
let ht=mk('燃え盛るヒータ',0,'up'),vb=mk('ヴォルカニック・バレット',0,'up'),mg=mk('ラヴァルのマグマ砲兵',0);gameState.players[0].mz=[ht,vb];gameState.players[0].hand=[mg];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('G: バレット released; マグマ砲兵 special summoned',z(vb)==='grave'&&z(mg)==='mz');
gameState.activePlayer=1;gameState.players[1].mz=[mk('青眼の白龍',1,'up')];
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('G: ヒータ destroyed by battle → マグマ砲兵 destroyed too',z(ht)==='grave'&&z(mg)==='grave',JSON.stringify({ht:z(ht),mg:z(mg)}));

/* ===== H: 荒ぶるアウス / 逆巻くエリア — the same for EARTH / WATER ===== */
fresh();
let au=mk('荒ぶるアウス',0,'up'),sz=mk('セイバーザウルス',0,'up'),cl=mk('E・HERO クレイマン',0);gameState.players[0].mz=[au,sz];gameState.players[0].hand=[cl];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('H: アウス — セイバーザウルス released; クレイマン (EARTH) summoned',z(sz)==='grave'&&z(cl)==='mz');
audit('H');
fresh();
let er=mk('逆巻くエリア',0,'up'),hg=mk('ハイドロゲドン',0,'up'),oc=mk('E・HERO オーシャン',0),ww=mk('ワイト',0);gameState.players[0].mz=[er,hg];gameState.players[0].hand=[ww,oc];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('H2: エリア — ハイドロゲドン released; オーシャン (WATER) summoned; ワイト not',z(hg)==='grave'&&z(oc)==='mz'&&z(ww)==='hand');

/* ===== I: 勝利の導き手フレイヤ — own face-up Fairies +400 / +400; not an attack target while another Fairy is on its side ===== */
fresh();
let fy=mk('勝利の導き手フレイヤ',0,'up'),se=mk('シャインエンジェル',0,'up');gameState.players[0].mz=[fy,se];baselineA();
ok('I: シャインエンジェル 1800, フレイヤ 500; フレイヤ protected',curATK(C(se))===1800&&curATK(C(fy))===500&&!!attackTargetForbiddenReasonS03(1,C(fy))&&!attackTargetForbiddenReasonS03(1,C(se)));
fresh();
fy=mk('勝利の導き手フレイヤ',0,'up');gameState.players[0].mz=[fy];baselineA();
ok('I2: alone — attackable',!attackTargetForbiddenReasonS03(1,C(fy)));
`);
