/* S03-U232: NOT_STARTED → TESTED — 熟練の白魔導師, 熟練の黒魔術師, 魔導獣 ケルベロス, 闇紅の魔導師, 機皇兵グランエル・アイン, No.56 ゴールドラット.
   Real DUEL paths (real Spell activations, Normal Summons, attacks), Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5332a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
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
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function lp(p){return gameState.players[p].lp;}
function pots(p,n){return Array.from({length:n},()=>mk('強欲な壺',p));}
function pot(){duelActivateFromHand(0);drive();}
function cnt(c){return API.countCounter(h(C(c)),'魔力');}
function legal(name,p,idx){return strictScriptLegalityV2(name,p,'mz',idx,{}).ok;}

/* ===== A: 熟練の白魔導師 — +1 per Spell activation (max 3); release it with 3 → 「バスター・ブレイダー」 from hand / Deck / GY ===== */
fresh();
let wm=mk('熟練の白魔導師',0,'up'),bb1=mk('バスター・ブレイダー',0),bb2=mk('バスター・ブレイダー',0),bb3=mk('バスター・ブレイダー',0);
gameState.players[0].mz=[wm];gameState.players[0].hand=pots(0,4);gameState.players[0].deck.push(bb1);gameState.players[0].grave=[bb2];baselineA();
pot();pot();
ok('A: 2 Spell activations → 2 counters; the release effect is not yet available',cnt(wm)===2&&!legal('熟練の白魔導師',0,findCardByUid(wm.uid).index),String(cnt(wm)));
pot();pot();
ok('A: the 4th Spell does not add a 4th counter (max 3)',cnt(wm)===3,String(cnt(wm)));
PREFER=[bb2.uid];duelActivateFromZone(0,'mz',findCardByUid(wm.uid).index);drive();PREFER=[];
ok('A: released (cost); バスター・ブレイダー chosen from the GY special summoned, the Deck one stays',z(wm)==='grave'&&z(bb2)==='mz'&&z(bb1)==='deck',JSON.stringify([z(wm),z(bb2),z(bb1)]));
audit('A');

/* ===== B: 熟練の黒魔術師 — the opponent's Spell activations count too (サイクロン chained to the own Spell); 「ブラック・マジシャン」 from the hand ===== */
fresh();
let bm=mk('熟練の黒魔術師',0,'up'),bh=mk('ブラック・マジシャン',0),cy=mk('サイクロン',1,'down'),ts=mk('D2シールド',1,'down');cy.setTurn=4;ts.setTurn=4;
gameState.players[0].mz=[bm];gameState.players[0].hand=[bh].concat(pots(0,2));gameState.players[1].sz=[cy,ts];baselineA();
duelActivateFromHand(1);
let w1=toWindow();const offB=w1&&offered(1,cy);PREFER=[ts.uid];if(offB)duelActivateResponseV2(1,'sz',0);drive();PREFER=[];
ok('B: own 強欲な壺 + the opposing サイクロン (a Spell activation of the opponent) → 2 counters',offB&&z(cy)==='grave'&&cnt(bm)===2,JSON.stringify([offB,z(cy),cnt(bm)]));
duelActivateFromHand(1);drive();
ok('B: 3 counters',cnt(bm)===3,String(cnt(bm)));
duelActivateFromZone(0,'mz',findCardByUid(bm.uid).index);drive();
ok('B: released; ブラック・マジシャン from the hand special summoned',z(bm)==='grave'&&z(bh)==='mz',JSON.stringify([z(bm),z(bh)]));
audit('B');

/* ===== C: 魔導獣 ケルベロス — +1 per Spell, ATK +500 per counter; all counters removed at the end of the Battle Phase in which it battled ===== */
fresh();
let kb=mk('魔導獣 ケルベロス',0,'up'),vt=mk('ワイト',1,'up');
gameState.players[0].mz=[kb];gameState.players[0].hand=pots(0,2);gameState.players[1].mz=[vt];baselineA();
pot();pot();
ok('C: 2 counters, ATK 1400 + 1000',cnt(kb)===2&&curATK(C(kb))===2400,JSON.stringify([cnt(kb),curATK(C(kb))]));
phase('battle');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('C: battled (ワイト destroyed); the counters remain during the Battle Phase',z(vt)==='grave'&&cnt(kb)===2,JSON.stringify([z(vt),cnt(kb)]));
phase('main2');
ok('C: Battle Phase ended → all counters removed, ATK back to 1400',cnt(kb)===0&&curATK(C(kb))===1400,JSON.stringify([cnt(kb),curATK(C(kb))]));
audit('C');

/* ===== C2: 魔導獣 ケルベロス — no battle: counters remain through the Battle Phase ===== */
fresh();
kb=mk('魔導獣 ケルベロス',0,'up');gameState.players[0].mz=[kb];gameState.players[0].hand=pots(0,1);gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();
pot();phase('battle');phase('main2');
ok('C2: it did not battle → the counter stays',cnt(kb)===1,String(cnt(kb)));
audit('C2');

/* ===== D: 闇紅の魔導師 — Normal Summon: 2 counters; +1 per Spell; ATK +300 per counter; once per turn remove 2 → the opponent discards 1 at random ===== */
fresh();
let dm=mk('闇紅の魔導師',0),tr=mk('ワイト',0,'up'),o1=mk('ワイト',1),o2=mk('ワイト',1),o3=mk('ワイト',1);
gameState.players[0].mz=[tr];gameState.players[0].hand=[dm].concat(pots(0,3));gameState.players[1].hand=[o1,o2,o3];baselineA();
doNormalSummon(0,'atk');drive();
ok('D: Normal Summoned → 2 counters, ATK 1700 + 600',cnt(dm)===2&&curATK(C(dm))===2300,JSON.stringify([z(dm),cnt(dm)]));
pot();pot();pot();
ok('D: 3 Spells → 5 counters, ATK 1700 + 1500',cnt(dm)===5&&curATK(C(dm))===3200,JSON.stringify([cnt(dm),curATK(C(dm))]));
duelActivateFromZone(0,'mz',findCardByUid(dm.uid).index);drive();
const dh=[o1,o2,o3].filter(c=>z(c)==='hand').length;
ok('D: 2 counters removed (cost); the opponent discarded exactly 1 random card',cnt(dm)===3&&dh===2&&gameState.players[1].grave.length===1,JSON.stringify([cnt(dm),dh,gameState.players[1].grave.length]));
ok('D: once per turn (3 counters left but not activatable again)',!legal('闇紅の魔導師',0,findCardByUid(dm.uid).index));
audit('D');

/* ===== E: 機皇兵グランエル・アイン — ATK +100 per other face-up 「機皇」; Normal Summon: a face-up opponent monster's ATK halved until the End Phase ===== */
fresh();
let gr=mk('機皇兵グランエル・アイン',0),wz=mk('機皇兵ワイゼル・アイン',0,'up'),bw=mk('青眼の白龍',1,'up'),wt=mk('ワイト',1,'up');
gameState.players[0].hand=[gr];gameState.players[0].mz=[wz];gameState.players[1].mz=[bw,wt];baselineA();
PREFER=[bw.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('E: ATK 1600 + 100 (ワイゼル・アイン face-up)',z(gr)==='mz'&&curATK(C(gr))===1700,String(curATK(C(gr))));
ok('E: 青眼の白龍 3000 → 1500; ワイト unchanged',curATK(C(bw))===1500&&curATK(C(wt))===300,JSON.stringify([curATK(C(bw)),curATK(C(wt))]));
phase('end');
ok('E: End Phase → 青眼の白龍 back to 3000',curATK(C(bw))===3000,String(curATK(C(bw))));
audit('E');

/* ===== F: No.56 ゴールドラット — detach 1: draw 1, then return 1 hand card to the Deck; once per turn ===== */
fresh();
let gr1=mk('No.56 ゴールドラット',0,'up'),m1=mk('ワイト',0),m2=mk('ワイト',0),hk=mk('死者蘇生',0),hd=mk('ブラック・マジシャン',0);
gr1.xyz=[m1,m2];gameState.players[0].mz=[gr1];gameState.players[0].hand=[hk];gameState.players[0].deck=[hd].concat(gameState.players[0].deck);baselineA();
PREFER=[hk.uid];duelActivateFromZone(0,'mz',findCardByUid(gr1.uid).index);drive();PREFER=[];
ok('F: 1 material detached to the GY; drew ブラック・マジシャン; 死者蘇生 returned to the Deck',C(gr1).xyz.length===1&&z(hd)==='hand'&&z(hk)==='deck'&&gameState.players[0].hand.length===1&&[z(m1),z(m2)].filter(x=>x==='grave').length===1,JSON.stringify([C(gr1).xyz.length,z(hd),z(hk),gameState.players[0].hand.length]));
ok('F: once per turn',!legal('No.56 ゴールドラット',0,findCardByUid(gr1.uid).index));
audit('F');
`);
