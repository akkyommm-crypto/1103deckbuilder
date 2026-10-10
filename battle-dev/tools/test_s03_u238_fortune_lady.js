/* S03-U238: 「フォーチュンレディ」 — アーシー, ウインディー, ウォーテリー, ダルキー, ファイリー, ライティー. Engine: onLevelUpS03, leftFieldByEffectS03, summonSrcS03.
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
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);drive();}

/* ===== A: フォーチュンレディ・アーシー — ATK / DEF = Level × 400; its controller's Standby Phase: Level +1 → 400 damage (level up) ===== */
fresh();
let ea=mk('フォーチュンレディ・アーシー',0,'up');gameState.players[0].mz=[ea];baselineA();
ok('A: Level 6 → ATK / DEF 2400',curLV(C(ea))===6&&curATK(C(ea))===2400&&curStat(C(ea),'def')===2400,JSON.stringify({lv:curLV(C(ea)),atk:curATK(C(ea))}));
phase('end');turn();phase('standby');
ok('A: the opponent\'s Standby Phase — no level up',gameState.activePlayer===1&&curLV(C(ea))===6&&lp(1)===8000,JSON.stringify({lv:curLV(C(ea)),lp1:lp(1)}));
phase('main1');phase('end');turn();phase('standby');
ok('A: its own Standby Phase — Level 7, ATK 2800, the level up deals 400',gameState.activePlayer===0&&curLV(C(ea))===7&&curATK(C(ea))===2800&&lp(1)===7600,JSON.stringify({lv:curLV(C(ea)),atk:curATK(C(ea)),lp1:lp(1),TRIG}));
audit('A');
fresh();
ea=mk('フォーチュンレディ・アーシー',0,'up');ea.lvMod=6;gameState.players[0].mz=[ea];gameState.phase='draw';baselineA();
phase('standby');
ok('A2: already Level 12 — no level up, no damage',curLV(C(ea))===12&&curATK(C(ea))===4800&&lp(1)===8000,JSON.stringify({lv:curLV(C(ea)),lp1:lp(1)}));
audit('A2');

/* ===== B: フォーチュンレディ・ウインディー — Normal Summon: destroy up to (own 「フォーチュンレディ」 count) opponent Spell / Trap cards ===== */
fresh();
let wd=mk('フォーチュンレディ・ウインディー',0),s1=mk('サイクロン',1,'down'),s2=mk('サイクロン',1,'down');s1.setTurn=4;s2.setTurn=4;
gameState.players[0].hand=[wd];gameState.players[1].sz=[s1,s2];baselineA();
PREFER=[s2.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('B: Level 3 → ATK 900; 1 「フォーチュンレディ」 → exactly 1 chosen Set card destroyed',curATK(C(wd))===900&&z(s2)==='grave'&&z(s1)==='sz',JSON.stringify({atk:curATK(C(wd)),s1:z(s1),s2:z(s2),TRIG}));
audit('B');

/* ===== C: フォーチュンレディ・ウォーテリー — special summoned while another 「フォーチュンレディ」 is on its field → draw 2 ===== */
fresh();
let wt=mk('フォーチュンレディ・ウォーテリー',0),rv=mk('死者蘇生',0),lt=mk('フォーチュンレディ・ライティー',0,'up');
gameState.players[0].grave=[wt];gameState.players[0].hand=[rv];gameState.players[0].mz=[lt];baselineA();
const hC=gameState.players[0].hand.length;
PREFER=[wt.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('C: revived with ライティー on the field → drew 2',z(wt)==='mz'&&gameState.players[0].hand.length===hC-1+2,JSON.stringify({wt:z(wt),h:gameState.players[0].hand.length}));
audit('C');
fresh();
wt=mk('フォーチュンレディ・ウォーテリー',0);rv=mk('死者蘇生',0);gameState.players[0].grave=[wt];gameState.players[0].hand=[rv];baselineA();
PREFER=[wt.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('C2: no other 「フォーチュンレディ」 — no draw',z(wt)==='mz'&&gameState.players[0].hand.length===0,JSON.stringify({h:gameState.players[0].hand.length}));
audit('C2');

/* ===== D: ライティー destroyed by the opponent's 地割れ (an effect) → ファイリー from the Deck in Attack Position (by a 「フォーチュンレディ」 effect)
   → ファイリー destroys a face-up opponent monster and deals its ATK ===== */
fresh();
let li=mk('フォーチュンレディ・ライティー',0,'up'),fy=mk('フォーチュンレディ・ファイリー',0),ji=mk('地割れ',1),bb=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[li];gameState.players[0].deck.push(fy);gameState.players[1].hand=[ji];gameState.players[1].mz=[bb];gameState.activePlayer=1;baselineA();
PREFER=[fy.uid,bb.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D: ライティー destroyed by 地割れ → ファイリー special summoned from the Deck in Attack Position',z(li)==='grave'&&z(fy)==='mz'&&C(fy).pos==='atk',JSON.stringify({li:z(li),fy:z(fy),TRIG}));
ok('D: ファイリー destroyed 青眼 and dealt 3000',z(bb)==='grave'&&lp(1)===5000,JSON.stringify({bb:z(bb),lp1:lp(1)}));
audit('D');
fresh();
li=mk('フォーチュンレディ・ライティー',0,'up');fy=mk('フォーチュンレディ・ファイリー',0);bb=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[li];gameState.players[0].deck.push(fy);gameState.players[1].mz=[bb];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('D2: ライティー destroyed by battle (not an effect) — no summon',z(li)==='grave'&&z(fy)==='deck',JSON.stringify({li:z(li),fy:z(fy)}));
audit('D2');

/* ===== E: フォーチュンレディ・ダルキー — its 「フォーチュンレディ」 destroys an opponent monster by battle → revive a 「フォーチュンレディ」 from its GY ===== */
fresh();
let dk=mk('フォーチュンレディ・ダルキー',0,'up'),gl=mk('フォーチュンレディ・ライティー',0),ow=mk('ワイト',1,'up');
gameState.players[0].mz=[dk];gameState.players[0].grave=[gl];gameState.players[1].mz=[ow];gameState.phase='battle';baselineA();
ok('E: Level 5 → ATK 2000',curATK(C(dk))===2000);
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('E: ワイト destroyed by battle → ライティー special summoned from the GY',z(ow)==='grave'&&z(gl)==='mz',JSON.stringify({ow:z(ow),gl:z(gl),TRIG}));
audit('E');
`);
