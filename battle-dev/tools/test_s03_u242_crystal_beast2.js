/* S03-U242: 「宝玉獣」 2 — 宝玉の樹, 究極宝玉神 レインボー・ドラゴン, 宝玉の氾濫, レインボー・ライフ. Engine: onPlacedAsSpellS03, LP rule damageToRecover;
   battle damage of direct attacks goes through the v18 LP rules. Real DUEL paths, Replay-audited. */
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
/* multi-card choices (max > 1) answered with the first max candidates (confirmed); single choices as before */
function step(){const q=pc();if(q){if(q.max>1){answerChoiceV49(q.candidates.slice(0,Math.min(q.max,q.candidates.length)).map(x=>x.key));return true;}let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function placedC(c){const h=findCardByUid(c.uid);return !!h&&h.zone==='sz'&&!!h.card.asSpellS03;}
const BEASTS=['宝玉獣 アメジスト・キャット','宝玉獣 アンバー・マンモス','宝玉獣 エメラルド・タートル','宝玉獣 コバルト・イーグル','宝玉獣 サファイア・ペガサス','宝玉獣 トパーズ・タイガー','宝玉獣 ルビー・カーバンクル'];

/* ===== A: 宝玉の樹 — a gem counter for each 宝玉獣 placed (2 destroyed by ブラック・ホール and placed); ② send it → 2 from the Deck placed ===== */
fresh();
let tr=mk('宝玉の樹',0,'up'),b1=mk(BEASTS[0],0,'up'),b2=mk(BEASTS[1],0,'up'),bh=mk('ブラック・ホール',0),d1=mk(BEASTS[2],0),d2=mk(BEASTS[3],0);
gameState.players[0].sz=[tr];gameState.players[0].mz=[b1,b2];gameState.players[0].hand=[bh];gameState.players[0].deck.push(d1,d2);baselineA();
PREFER=['place:'+b1.uid,'place:'+b2.uid];duelActivateFromHand(0);drive();PREFER=[];
const gA=API.countCounter(findCardByUid(tr.uid),'ジェム');
ok('A: both 宝玉獣 placed → 2 gem counters',placedC(b1)&&placedC(b2)&&gA===2,JSON.stringify({b1:z(b1),b2:z(b2),gA,TRIG}));
duelActivateFromZone(0,'sz',0);drive();
ok('A: 宝玉の樹 sent (cost) → 2 宝玉獣 from the Deck placed',z(tr)==='grave'&&placedC(d1)&&placedC(d2),JSON.stringify({tr:z(tr),d1:z(d1),d2:z(d2)}));
audit('A');

/* ===== B: 究極宝玉神 レインボー・ドラゴン — the special summon procedure (7 kinds in field / GY); no effect the turn it was summoned ===== */
fresh();
let rd=mk('究極宝玉神 レインボー・ドラゴン',0);gameState.players[0].hand=[rd];gameState.players[0].grave=BEASTS.slice(0,6).map(n=>mk(n,0));baselineA();
const lg6=strictSummonProcedureLegality('究極宝玉神 レインボー・ドラゴン',0,'hand',0);
ok('B: 6 kinds — the procedure is not legal',lg6.ok===false,JSON.stringify(lg6));
fresh();
rd=mk('究極宝玉神 レインボー・ドラゴン',0);gameState.players[0].hand=[rd];gameState.players[0].grave=BEASTS.slice(0,6).map(n=>mk(n,0));
let pr=mk(BEASTS[6],0,'up');pr.asSpellS03={turn:4};gameState.players[0].sz=[pr];baselineA();
runSummonProcedure('究極宝玉神 レインボー・ドラゴン',0,'hand',0);if(!gameState.pendingSummon&&!pendingChoiceV49(gameState))finishSummonProcedure('究極宝玉神 レインボー・ドラゴン',0,'hand',0,'atk');drive();
ok('B: 6 in the GY + 1 placed on the field = 7 kinds → special summoned',z(rd)==='mz',JSON.stringify({rd:z(rd)}));
const lgB=strictScriptLegalityV2('究極宝玉神 レインボー・ドラゴン',0,'mz',findCardByUid(rd.uid).index,{});
ok('B: its effects cannot be activated the turn it was special summoned',lgB.ok===false,JSON.stringify(lgB));
audit('B');

/* ===== C: ① — send every face-up 宝玉獣 monster → ATK +1000 each (mode chosen when ② could also be activated) ===== */
fresh();
let rc=mk('究極宝玉神 レインボー・ドラゴン',0,'up'),m1=mk(BEASTS[0],0,'up'),m2=mk(BEASTS[1],0,'up'),gb=mk(BEASTS[2],0);
gameState.players[0].mz=[rc,m1,m2];gameState.players[0].grave=[gb];baselineA();
PREFER=['m1'];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('C: both 宝玉獣 sent to the GY → 4000 + 2000',z(m1)==='grave'&&z(m2)==='grave'&&curATK(C(rc))===6000&&z(gb)==='grave',JSON.stringify({atk:curATK(C(rc)),m1:z(m1)}));
audit('C');

/* ===== D: ② — banish every 宝玉獣 in the GY → every card on the field back to its owner's Deck ===== */
fresh();
rc=mk('究極宝玉神 レインボー・ドラゴン',0,'up');m1=mk(BEASTS[0],0,'up');gb=mk(BEASTS[2],0);let g2=mk(BEASTS[3],0),ob=mk('青眼の白龍',1,'up'),os=mk('サイクロン',1,'down');os.setTurn=4;
gameState.players[0].mz=[rc,m1];gameState.players[0].grave=[gb,g2];gameState.players[1].mz=[ob];gameState.players[1].sz=[os];baselineA();
PREFER=['m2'];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('D: the GY 宝玉獣 banished; every card on the field (itself included) back to the Deck',z(gb)==='banish'&&z(g2)==='banish'&&z(rc)==='deck'&&z(m1)==='deck'&&z(ob)==='deck'&&z(os)==='deck',JSON.stringify({gb:z(gb),rc:z(rc),ob:z(ob),os:z(os)}));
audit('D');

/* ===== E: 宝玉の氾濫 — 4 宝玉獣 in the Spell & Trap Zone (cost) → every card on the field to the GY → summon up to the opponent's count ===== */
fresh();
let fl=mk('宝玉の氾濫',0),ps=BEASTS.slice(0,4).map(n=>{const c=mk(n,0,'up');c.asSpellS03={turn:4};return c;});
let o1=mk('ワイト',1,'up'),o2=mk('青眼の白龍',1,'up'),mw=mk('ワイト',0,'up');
gameState.players[0].hand=[fl];gameState.players[0].sz=ps;gameState.players[0].mz=[mw];gameState.players[1].mz=[o1,o2];baselineA();
duelActivateFromHand(0);drive();
const upE=(gameState.players[0].mz||[]).filter(c=>c&&BEASTS.indexOf(cardName(c))>=0).length;
ok('E: all field cards to the GY; 2 opponent cards → exactly 2 宝玉獣 special summoned from the GY',z(o1)==='grave'&&z(o2)==='grave'&&z(mw)==='grave'&&upE===2,JSON.stringify({upE,o2:z(o2),mw:z(mw),ps:ps.map(z)}));
audit('E');

/* ===== F: レインボー・ライフ — damage this turn becomes recovery (battle and effect) ===== */
fresh();
let rl=mk('レインボー・ライフ',0,'down');rl.setTurn=4;let dh=mk('ワイト',0),bt=mk('青眼の白龍',1,'up');
gameState.players[0].sz=[rl];gameState.players[0].hand=[dh];gameState.players[1].mz=[bt];gameState.activePlayer=1;gameState.phase='battle';baselineA();
duelActivateResponseV2(0,'sz',0);drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:'direct'});drive();
ok('F: discarded (cost); a 3000 direct attack → +3000',z(dh)==='grave'&&lp(0)===11000,JSON.stringify({dh:z(dh),lp0:lp(0)}));
audit('F');
fresh();
rl=mk('レインボー・ライフ',0,'down');rl.setTurn=4;dh=mk('ワイト',0);bt=mk('青眼の白龍',1,'up');let wd=mk('ワイト',0,'up');
gameState.players[0].sz=[rl];gameState.players[0].hand=[dh];gameState.players[0].mz=[wd];gameState.players[1].mz=[bt];gameState.activePlayer=1;gameState.phase='battle';baselineA();
duelActivateResponseV2(0,'sz',0);drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('F2: 青眼 destroys ワイト (attack position): 2700 battle damage → +2700',z(wd)==='grave'&&lp(0)===10700,JSON.stringify({lp0:lp(0)}));
audit('F2');
/* ===== G: (engine fix) a v18 「このターン、自分が受ける戦闘ダメージは0」 rule now reaches a direct attack — 宝玉の双璧 (S03-U241) then a direct attack ===== */
fresh();
let tw=mk('宝玉の双璧',0,'down');tw.setTurn=4;let tg=mk('宝玉獣 トパーズ・タイガー',0,'up'),dk=mk('宝玉獣 コバルト・イーグル',0),bg=mk('青眼の白龍',1,'up'),ag=mk('エーリアン・ソルジャー',1,'up');
gameState.players[0].sz=[tw];gameState.players[0].mz=[tg];gameState.players[0].deck.push(dk);gameState.players[1].mz=[bg,ag];gameState.activePlayer=1;gameState.phase='battle';baselineA();
PREFER=['decline',dk.uid];requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();PREFER=[];
const lpG=lp(0);
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:findCardByUid(ag.uid).index,target:'direct'});drive();
ok('G: 宝玉の双璧 activated (1400 taken before it); the following direct attack (1900) deals 0',z(tw)==='grave'&&lpG===6600&&lp(0)===6600,JSON.stringify({tw:z(tw),lpG,lp0:lp(0),TRIG}));
audit('G');
`);
