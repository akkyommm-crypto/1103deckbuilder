/* S03-U138: fixed-list IMPLEMENTED singles, second batch — E・HERO エスクリダオ (hero), アーカナイト・マジシャン / グローアップ・バルブ
   (debris), 魔轟神レイジオン / レイヴン / レヴュアタン (dark). Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[],SEEN=[],MULTI=null,SEQ=[];
function pick(){const q=pc();SEEN.push({title:q.title,min:q.min,max:q.max,cands:q.candidates.map(x=>x.name||x.label||(x.card?nm(x.card):x.value))});
  if(MULTI&&q.max>1){MULTI.forEach(u=>{const j=q.candidates.findIndex(x=>x.uid===u);if(j>=0)__choicePickV49(j);});if(pc()===q&&typeof __choiceCommitV49==='function')__choiceCommitV49();return;}
  if(SEQ.length){const w=SEQ[0];const k=q.candidates.findIndex(x=>x.uid===w||x.key===w||x.value===w);if(k>=0){SEQ.shift();__choicePickV49(k);return;}}
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';}
function legal(n,zone,i){return strictScriptLegalityV2(n,0,zone,i||0,{});}
function synchro(ex,mats){const P=gameState.players[0];doExSummon(0,P.ex.indexOf(ex),mats.map(m=>P.mz.indexOf(m)),'synchro','atk');}
`;

/* ===== A. E・HERO エスクリダオ: ATK + 100 per E・HERO monster in its controller's GY ===== */
harness(COMMON+String.raw`
fresh();
const es=mk('E・HERO エスクリダオ',0,'up');es.properlySummonedS03=true;gameState.players[0].mz=[es];
gameState.players[0].grave=[mk('E・HERO エアーマン',0),mk('E・HERO バーストレディ',0),mk('E・HERO フェザーマン',0),mk('ワイト',0),mk('E・HERO フレイム・ウィングマン',0)];
gameState.players[1].grave=[mk('E・HERO エアーマン',1)];
ok('A: 4 E・HERO monsters in its GY (not the opponent\'s, not ワイト) → ATK 2900',curATK(es)===2900,String(curATK(es)));
`);

/* ===== B. アーカナイト・マジシャン: 2 Spell Counters on its Synchro Summon, ATK +1000 each, ③ remove one to destroy an opponent card ===== */
harness(COMMON+String.raw`
fresh();
const tn=mk('ジャンク・シンクロン',0,'up'),sp=mk('マジシャンズ・ヴァルキリア',0,'up');gameState.players[0].mz=[tn,sp];
const am=mk('アーカナイト・マジシャン',0);gameState.players[0].ex=[am];
const foeCard=mk('聖なるバリア －ミラーフォース－',1,'down');gameState.players[1].sz=[foeCard];
baselineA();
ok('B: precondition — ジャンク・シンクロン (3) + マジシャンズ・ヴァルキリア (4, Spellcaster) is a legal combination',exCombos(0,dbOf(am)).combos.length>=1);
synchro(am,[tn,sp]);drive();
ok('B ①: Synchro Summoned with 2 Spell Counters → ATK 400 + 2000',z(am)==='mz'&&API.countCounter(findCardByUid(am.uid),'魔力')===2&&curATK(am)===2400,JSON.stringify({z:z(am),n:z(am)==='mz'?API.countCounter(findCardByUid(am.uid),'魔力'):null,atk:curATK(am)}));
PREFER=[uid(foeCard)];duelActivateFromZone(0,'mz',gameState.players[0].mz.indexOf(am));drive();PREFER=[];
ok('B ③: one counter removed, the opponent\'s set card destroyed, ATK 1400',z(foeCard)==='grave'&&API.countCounter(findCardByUid(am.uid),'魔力')===1&&curATK(am)===1400,JSON.stringify({foe:z(foeCard),atk:curATK(am)}));
audit('B');
`);

/* ===== C. グローアップ・バルブ: only once per Duel ===== */
harness(COMMON+String.raw`
fresh();
const gb=mk('グローアップ・バルブ',0);gameState.players[0].grave=[gb];gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];
baselineA();
duelActivateFromZone(0,'grave',0);drive();
ok('C: revived, the top card of the Deck milled',z(gb)==='mz'&&gameState.players[0].grave.length===1);
API.destroy(findCardByUid(gb.uid),'test');drive();
const gi=gameState.players[0].grave.findIndex(c=>c.uid===gb.uid);
ok('C: back in the GY → cannot be used again this Duel',gi>=0&&legal('グローアップ・バルブ','grave',gi).ok===false,JSON.stringify(legal('グローアップ・バルブ','grave',gi)));
audit('C');
`);

/* ===== D. 魔轟神レイジオン: Synchro Summoned with ≤1 card in hand → draw until 2 ===== */
harness(COMMON+String.raw`
fresh();
const tn=mk('魔轟神獣ケルベラル',0,'up'),m2=mk('N・グラン・モール',0,'up');
gameState.players[0].mz=[tn,m2];
const rg=mk('魔轟神レイジオン',0);gameState.players[0].ex=[rg];gameState.players[0].hand=[];
gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];
baselineA();
ok('D: precondition — ケルベラル (Lv2 「魔轟神」 tuner) + N・グラン・モール (Lv3) is a legal combination',exCombos(0,dbOf(rg)).combos.length>=1);
const P=gameState.players[0];
const combos=exCombos(0,dbOf(rg)).combos;
if(combos.length){doExSummon(0,P.ex.indexOf(rg),combos[0].materials,'synchro','atk');drive();}
ok('D: Synchro Summoned with an empty hand → drew 2',z(rg)==='mz'&&gameState.players[0].hand.length===2,JSON.stringify({z:z(rg),hand:gameState.players[0].hand.length,combos:combos.length}));
audit('D');
`);

/* ===== E. 魔轟神レイヴン: discard N → Level + N and ATK + 400×N until the End Phase; once per turn ===== */
harness(COMMON+String.raw`
fresh();
const rv=mk('魔轟神レイヴン',0,'up');gameState.players[0].mz=[rv];
const h1=mk('ワイト',0),h2=mk('サンダー・ボルト',0),h3=mk('ワイトキング',0);gameState.players[0].hand=[h1,h2,h3];
baselineA();
SEQ=[uid(h1),'yes',uid(h2),'no'];duelActivateFromZone(0,'mz',0);drive();SEQ=[];
ok('E: 2 cards discarded → Level 4, ATK 2100',z(h1)==='grave'&&z(h2)==='grave'&&z(h3)==='hand'&&curLV(rv)===4&&curATK(rv)===2100,JSON.stringify({lv:curLV(rv),atk:curATK(rv),hand:names(0,'hand'),SEEN}));
ok('E: once per turn',legal('魔轟神レイヴン','mz',0).ok===false);
audit('E');
`);

/* ===== F. 魔轟神レヴュアタン: destroyed on the field and sent to the GY → up to 3 魔轟神 monsters from the GY to the hand ===== */
harness(COMMON+String.raw`
fresh();gameState.activePlayer=1;
const lv=mk('魔轟神レヴュアタン',0,'up');lv.properlySummonedS03=true;gameState.players[0].mz=[lv];
const g1=mk('魔轟神獣ケルベラル',0),g2=mk('魔轟神レイヴン',0),g3=mk('ワイト',0);gameState.players[0].grave=[g1,g2,g3];
gameState.players[1].hand=[mk('サンダー・ボルト',1)];
baselineA();
SEQ=[uid(g1),'yes',uid(g2),'no'];duelActivateFromHand(0);drive();SEQ=[];
ok('F: destroyed by サンダー・ボルト → the chosen ケルベラル and レイヴン to the hand; ワイト not offered',z(lv)==='grave'&&z(g1)==='hand'&&z(g2)==='hand'&&z(g3)==='grave'&&!SEEN.some(s=>s.cands.indexOf('ワイト')>=0),JSON.stringify({g1:z(g1),g2:z(g2),SEEN}));
audit('F');
`);

/* ===== E (duration): the Level / ATK boost ends in the End Phase ===== */
harness(COMMON+String.raw`
fresh();
const rv=mk('魔轟神レイヴン',0,'up');gameState.players[0].mz=[rv];
const h1=mk('ワイト',0);gameState.players[0].hand=[h1];
baselineA();
SEQ=[uid(h1)];duelActivateFromZone(0,'mz',0);drive();SEQ=[];
ok('E: 1 card discarded → Level 3, ATK 1700',curLV(rv)===3&&curATK(rv)===1700,JSON.stringify({lv:curLV(rv),atk:curATK(rv)}));
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});drive();act({type:'PASS_TURN'});drive();
ok('E: after the turn ends → Level 2, ATK 1300 again',curLV(rv)===2&&curATK(rv)===1300,JSON.stringify({lv:curLV(rv),atk:curATK(rv)}));
audit('E2');
`);
