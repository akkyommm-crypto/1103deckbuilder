/* S03-U231: NOT_STARTED → TESTED — プロミネンス・ドラゴン, エクストリオの牙, 呪術抹消, 神聖なる森, ネクロ・リンカー, サシカエル, ウィクトーリア.
   Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function lp(p){return gameState.players[p].lp;}

/* ===== A: プロミネンス・ドラゴン — not an attack target while another Pyro is on its side; its controller's End Phase: 500 damage ===== */
fresh();
let pd=mk('プロミネンス・ドラゴン',0,'up'),vb=mk('ヴォルカニック・バレット',0,'up');gameState.players[0].mz=[pd,vb];gameState.phase='main2';baselineA();
ok('A: protected while バレット (Pyro) is there',!!attackTargetForbiddenReasonS03(1,C(pd)));
phase('end');
ok('A: End Phase → 500 damage',lp(1)===7500);
audit('A');

/* ===== B: エクストリオの牙 — with a face-up 「ナチュル」: the opponent's Spell activation negated; then a card from the hand to the GY ===== */
fresh();
let ef=mk('エクストリオの牙',0,'down');ef.setTurn=4;let nc=mk('ナチュル・クリフ',0,'up'),hd=mk('ワイト',0),mr=mk('死者蘇生',1),wg=mk('ワイト',1);
gameState.players[0].sz=[ef];gameState.players[0].mz=[nc];gameState.players[0].hand=[hd];gameState.players[1].hand=[mr];gameState.players[1].grave=[wg];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);
let w1=toWindow();const offB=w1&&offered(0,ef);if(offB)duelActivateResponseV2(0,'sz',0);drive();
ok('B: 死者蘇生 negated; its own hand card sent to the GY',offB&&z(mr)==='grave'&&z(wg)==='grave'&&z(hd)==='grave');
audit('B');

/* ===== C: 呪術抹消 — discard 2 (cost): a Spell activation negated; same-name cards in the opponent's hand and Deck to the GY ===== */
fresh();
let cj=mk('呪術抹消',0,'down');cj.setTurn=4;let h1=mk('ワイト',0),h2=mk('ワイト',0);mr=mk('死者蘇生',1);let mh=mk('死者蘇生',1),md=mk('死者蘇生',1);wg=mk('ワイト',1);
gameState.players[0].sz=[cj];gameState.players[0].hand=[h1,h2];gameState.players[1].hand=[mr,mh];gameState.players[1].deck.push(md);gameState.players[1].grave=[wg];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);
w1=toWindow();const offC=w1&&offered(0,cj);if(offC)duelActivateResponseV2(0,'sz',0);drive();
ok('C: both discarded; 死者蘇生 negated; the other 死者蘇生 in the hand and the Deck sent to the GY',offC&&z(h1)==='grave'&&z(h2)==='grave'&&z(mr)==='grave'&&z(mh)==='grave'&&z(md)==='grave'&&z(wg)==='grave',JSON.stringify({offC,mh:z(mh),md:z(md)}));
audit('C');

/* ===== D: 神聖なる森 — own Plant / Beast / Beast-Warrior monsters: one battle destruction prevented per turn ===== */
fresh();
let sf=mk('神聖なる森',0,'up'),kn=mk('E・HERO クノスペ',0,'up'),wf=mk('オオカミ',0,'up'),b1=mk('青眼の白龍',1,'up'),b2=mk('青眼の白龍',1,'up');
gameState.players[0].sz=[sf];gameState.players[0].mz=[kn,wf];gameState.players[1].mz=[b1,b2];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('D: クノスペ survives the first battle (damage still taken)',z(kn)==='mz'&&lp(0)===8000-2400);
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:1,target:1});drive();
ok('D: the second battle — オオカミ destroyed (once per turn)',z(wf)==='grave',JSON.stringify({wf:z(wf)}));
audit('D');

/* ===== E: ネクロ・リンカー — release it (cost): a 「シンクロン」 Tuner from the GY, not a Synchro Material this turn ===== */
fresh();
let nl=mk('ネクロ・リンカー',0,'up'),js=mk('ジャンク・シンクロン',0);gameState.players[0].mz=[nl];gameState.players[0].grave=[js];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('E: ネクロ・リンカー released; ジャンク・シンクロン summoned, marked for this turn',z(nl)==='grave'&&z(js)==='mz'&&C(js).noSynchroMaterialTurnS03===5);
audit('E');

/* ===== F: サシカエル — release an Aqua monster (cost): a 「ガエル」 from the GY; once per turn ===== */
fresh();
let sk=mk('サシカエル',0,'up'),aq=mk('大くしゃみのカバザウルス',0,'up'),gs=mk('悪魔ガエル',0);gameState.players[0].mz=[sk,aq];gameState.players[0].grave=[gs];baselineA();
PREFER=[sk.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('F: サシカエル released itself; 悪魔ガエル summoned',z(sk)==='grave'&&z(gs)==='mz',JSON.stringify({sk:z(sk),gs:z(gs)}));
audit('F');

/* ===== G: ウィクトーリア — a Dragon from the opponent's GY to its own field; other face-up Fairies are not attack targets ===== */
fresh();
let vi=mk('ウィクトーリア',0,'up'),be=mk('青眼の白龍',1),se=mk('シャインエンジェル',0,'up');gameState.players[0].mz=[vi,se];gameState.players[1].grave=[be];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('G: 青眼 special summoned to its field; once per turn',z(be)==='mz'&&findCardByUid(be.uid).p===0&&strictScriptLegalityV2('ウィクトーリア',0,'mz',0,{}).ok===false);
ok('G: シャインエンジェル protected; ウィクトーリア not',!!attackTargetForbiddenReasonS03(1,C(se))&&!attackTargetForbiddenReasonS03(1,C(vi)));
audit('G');
`);
