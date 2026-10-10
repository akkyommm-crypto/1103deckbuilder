/* S03-U214: 「墓地へ送られるカードは墓地へは行かず除外される」 — 光の追放者, 閃光の追放者 (NOT_STARTED → TESTED), マクロコスモス (PARTIAL → TESTED),
   次元の裂け目 (ENGINE_GAP → TESTED); engine/1ZZG. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function step(){const q=pc();if(q&&q.min===0){const keys=q.candidates.filter(x=>PREFER.includes(x.uid)||(x.card&&PREFER.includes(x.card.uid))).map(x=>x.key).slice(0,q.max);answerChoiceV49(keys);return true;}if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}

/* ===== A: 光の追放者 — every card sent to the GY is banished instead (a Deck card, the Spell itself) ===== */
fresh();
let bl=mk('光の追放者',0,'up'),fb=mk('おろかな埋葬',0),wd=mk('ワイト',0);
gameState.players[0].mz=[bl];gameState.players[0].hand=[fb];gameState.players[0].deck.unshift(wd);baselineA();
PREFER=[wd.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('A: おろかな埋葬 — ワイト banished instead of the GY; the Spell itself banished too',z(wd)==='banish'&&z(fb)==='banish'&&gameState.players[0].grave.length===0,JSON.stringify({wd:z(wd),fb:z(fb)}));
ok('A: banishInfo records the replacement',C(wd).banishInfo&&C(wd).banishInfo.from==='graveRedirect'&&!C(wd).graveInfo);
audit('A');

/* ===== A2: destroyed by battle — banished; its 「戦闘によって破壊され墓地へ送られた時」 trigger does not activate ===== */
fresh();
bl=mk('光の追放者',0,'up');let be=mk('青眼の白龍',0,'up'),kt=mk('キラー・トマト',1,'up');
gameState.players[0].mz=[bl,be];gameState.players[1].mz=[kt];gameState.players[1].deck.unshift(mk('キラー・トマト',1));gameState.phase='battle';baselineA();TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:1,target:0});drive();
ok('A2: キラー・トマト banished; no trigger',z(kt)==='banish'&&!TRIG.some(t=>/キラー・トマト/.test(t)),JSON.stringify({kt:z(kt),TRIG}));
audit('A2');

/* ===== A3: destroyed together with 光の追放者 (ブラック・ホール) — the others are banished, 光の追放者 goes to the GY; afterwards the GY is normal ===== */
fresh();
bl=mk('光の追放者',0,'up');let ow=mk('ワイト',1,'up'),bh=mk('ブラック・ホール',0);fb=mk('おろかな埋葬',0);wd=mk('ワイト',0);
gameState.players[0].mz=[bl];gameState.players[1].mz=[ow];gameState.players[0].hand=[bh,fb];gameState.players[0].deck.unshift(wd);baselineA();
duelActivateFromHand(0);drive();
ok('A3: ブラック・ホール — the opponent\'s ワイト banished; 光の追放者 to the GY; ブラック・ホール to the GY',z(ow)==='banish'&&z(bl)==='grave'&&z(bh)==='grave',JSON.stringify({ow:z(ow),bl:z(bl),bh:z(bh)}));
PREFER=[wd.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('A3: with 光の追放者 gone, おろかな埋葬 sends to the GY',z(wd)==='grave'&&z(fb)==='grave');
audit('A3');

/* ===== B: 閃光の追放者 — the same replacement ===== */
fresh();
let fl=mk('閃光の追放者',1,'up');fb=mk('おろかな埋葬',0);wd=mk('ワイト',0);
gameState.players[1].mz=[fl];gameState.players[0].hand=[fb];gameState.players[0].deck.unshift(wd);baselineA();
PREFER=[wd.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('B: the opponent\'s 閃光の追放者 — ワイト and おろかな埋葬 banished',z(wd)==='banish'&&z(fb)==='banish');
audit('B');

/* ===== C: 次元の裂け目 — monsters only ===== */
fresh();
let rf=mk('次元の裂け目',0,'up');fb=mk('おろかな埋葬',0);wd=mk('ワイト',0);
gameState.players[0].sz=[rf];gameState.players[0].hand=[fb];gameState.players[0].deck.unshift(wd);baselineA();
PREFER=[wd.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('C: ワイト banished; the Spell おろかな埋葬 goes to the GY',z(wd)==='banish'&&z(fb)==='grave');
audit('C');
fresh();
rf=mk('次元の裂け目',0);gameState.players[0].hand=[rf];baselineA();
duelActivateFromHand(0);drive();
ok('C2: activated from the hand — stays face-up in the Spell & Trap Zone',z(rf)==='sz'&&C(rf).face==='up');

/* ===== D: マクロコスモス — on activation 原始太陽ヘリオス may be special summoned from the Deck; then every card is banished instead ===== */
fresh();
let mc=mk('マクロコスモス',0,'down');mc.setTurn=4;let he=mk('原始太陽ヘリオス',0);fb=mk('おろかな埋葬',0);wd=mk('ワイト',0);
gameState.players[0].sz=[mc];gameState.players[0].deck.push(he);gameState.players[0].deck.unshift(wd);gameState.players[0].hand=[fb];baselineA();
PREFER=[he.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('D: 原始太陽ヘリオス special summoned from the Deck; マクロコスモス stays face-up',z(he)==='mz'&&z(mc)==='sz'&&C(mc).face==='up');
PREFER=[wd.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D: then ワイト and おろかな埋葬 are banished',z(wd)==='banish'&&z(fb)==='banish');
ok('D: ヘリオス counts the banished monster (ATK 100)',curATK(C(he))===100,String(curATK(C(he))));
audit('D');
fresh();
mc=mk('マクロコスモス',0,'down');mc.setTurn=4;he=mk('原始太陽ヘリオス',0);gameState.players[0].sz=[mc];gameState.players[0].deck.push(he);baselineA();
const pcD=(function(){duelActivateFromZone(0,'sz',0);for(let i=0;i<60;i++){const q=pc();if(q)return q;if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}return null;})();
ok('D2: the summon is optional (the choice allows no pick)',!!pcD&&pcD.min===0);
`);
