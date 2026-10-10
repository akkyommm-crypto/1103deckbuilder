/* S03-U19 MONSTER_ACTIVATION_RESPONSE
   Requirement: the monsters declared in S03-U18 as activation responses (ネイビィロイド on the field, ヂェミナイ・デビル in the hand,
   ジャスティス・ブリンガー on the field) are offered as chain responses to the activation their text names, and negate it.
   Before the fix: getChainResponsesV2 scanned hand / field monsters only when quickEffect was true, so these trigger-type responders were
   never offered; ネイビィロイド and ヂェミナイ・デビル (unified, no passive) could not be activated at all.
   Every card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
let SEEN=[];
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE){EVT_V2_STATE.groups.flat().forEach(c=>SEEN.push(c.name));return 'evt';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<16;k++){const r=drive();if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}return r;}return 'loop';}
function labels(){const pc=pendingChoiceV49(gameState);return pc?pc.candidates.map(x=>String(x.label||'')):[];}
function pick(match){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing for '+match+' toasts='+JSON.stringify(TOASTS.slice(-3)));
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return (h&&nm(h.card)===match)||String(x.label||'').includes(match)||x.uid===match;});
  if(i<0)throw Error('candidate '+match+' missing in '+pc.title+': '+JSON.stringify(labels()));__choicePickV49(i);}
function responses(p){return getChainResponsesV2(p).map(x=>x.db.n);}
function chainNames(){return gameState.chain.map(l=>l.name);}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}

/* ===== ネイビィロイド: サイクロン targeting P1's set card ===== */
fresh();gameState.activePlayer=1;
const navy=mk('ネイビィロイド');gameState.players[0].mz=[navy];
const mySet=mk('サイクロン',0,'down');mySet.setTurn=3;gameState.players[0].sz=[mySet];gameState.players[0].hand=[mk('ワイト')];
gameState.players[1].hand=[mk('サイクロン',1)];baselineA();
duelActivateFromHand(0);pick(mySet.uid);
ok('ネイビィロイド: P2 activates サイクロン targeting P1’s set card; P1’s responses list ネイビィロイド',chainNames().join()==='サイクロン'&&responses(0).includes('ネイビィロイド'),JSON.stringify({chain:chainNames(),resp:responses(0)}));
duelActivateResponseV2(0,'mz',0);
if(pendingChoiceV49(gameState))pick('ワイト');
ok('ネイビィロイド: it is chained after discarding ワイト',chainNames().join()==='サイクロン,ネイビィロイド'&&gameState.players[0].grave.some(c=>nm(c)==='ワイト'),JSON.stringify({chain:chainNames(),toasts:TOASTS.slice(-3)}));
SEEN=[];settle();
ok('ネイビィロイド: サイクロン is negated and destroyed; P1’s set card survives',gameState.players[1].grave.some(c=>nm(c)==='サイクロン')&&gameState.players[0].sz.includes(mySet)&&!gameState.chain.length,JSON.stringify({p0sz:gameState.players[0].sz.map(nm),p1grave:gameState.players[1].grave.map(nm)}));
replay('ネイビィロイド');

/* ===== ヂェミナイ・デビル: 天使の施し includes discarding ===== */
fresh();gameState.activePlayer=1;
gameState.players[0].hand=[mk('ヂェミナイ・デビル')];gameState.players[0].deck=[mk('ワイト',0,'down'),mk('ワイト',0,'down')];
gameState.players[1].hand=[mk('天使の施し',1),mk('ワイト',1)];gameState.players[1].deck=[mk('ワイト',1,'down'),mk('ワイト',1,'down'),mk('ワイト',1,'down')];baselineA();
duelActivateFromHand(0);
for(let k=0;k<3&&pendingChoiceV49(gameState);k++)__choicePickV49(0);
ok('ヂェミナイ・デビル: P2 activates 天使の施し; P1’s responses list ヂェミナイ・デビル (in the hand)',chainNames().join()==='天使の施し'&&responses(0).includes('ヂェミナイ・デビル'),JSON.stringify({chain:chainNames(),resp:responses(0)}));
const p0hand0=gameState.players[0].hand.length,p1deck0=gameState.players[1].deck.length;
duelActivateResponseV2(0,'hand',0);
SEEN=[];settle();
ok('ヂェミナイ・デビル: sent from the hand, it negates 天使の施し (P2 draws nothing) and P1 draws 1',
  gameState.players[0].grave.some(c=>nm(c)==='ヂェミナイ・デビル')&&gameState.players[1].grave.some(c=>nm(c)==='天使の施し')&&gameState.players[1].deck.length===p1deck0&&gameState.players[0].hand.length===p0hand0-1+1,
  JSON.stringify({p0hand:gameState.players[0].hand.map(nm),p1deck:gameState.players[1].deck.length,p1grave:gameState.players[1].grave.map(nm),toasts:TOASTS.slice(-3)}));
replay('ヂェミナイ・デビル');

/* ===== ジャスティス・ブリンガー: the effect of a Special Summoned monster ===== */
fresh();gameState.activePlayer=1;
const jb=mk('ジャスティス・ブリンガー');gameState.players[0].mz=[jb];
const mizuho=mk('真六武衆－ミズホ',1);mizuho.specialSummoned=true;gameState.players[1].mz=[mizuho,mk('真六武衆－カゲキ',1)];baselineA();
duelActivateFromZone(1,'mz',0);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++){const pc=pendingChoiceV49(gameState);if(/リリース/.test(pc.title))pick('真六武衆－カゲキ');else pick('ジャスティス・ブリンガー');}
ok('ジャスティス・ブリンガー: P2 activates the Special Summoned ミズホ; P1’s responses list ジャスティス・ブリンガー',chainNames().join()==='真六武衆－ミズホ'&&responses(0).includes('ジャスティス・ブリンガー'),JSON.stringify({chain:chainNames(),resp:responses(0),toasts:TOASTS.slice(-3)}));
duelActivateResponseV2(0,'mz',0);
SEEN=[];settle();
ok('ジャスティス・ブリンガー: ミズホ’s activation is negated, so ジャスティス・ブリンガー is not destroyed',gameState.players[0].mz.includes(jb)&&!gameState.chain.length,JSON.stringify({p0mz:gameState.players[0].mz.map(nm),p0grave:gameState.players[0].grave.map(nm),log:(gameState.log||[]).slice(0,5).map(x=>x.msg||x)}));
ok('ジャスティス・ブリンガー: it is not offered again as a trigger after the chain',!SEEN.includes('ジャスティス・ブリンガー'),JSON.stringify(SEEN));
replay('ジャスティス・ブリンガー');

/* ===== chain-link targets decode; no late offer for the targeting reactions that are not activation responses ===== */
fresh();gameState.activePlayer=1;
const msg=mk('ミドル・シールド・ガードナー',0,'down','def');msg.setTurn=3;gameState.players[0].mz=[msg];
gameState.players[1].hand=[mk('死者への手向け',1),mk('ワイト',1)];baselineA();
duelActivateFromHand(0);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++){const pc=pendingChoiceV49(gameState);if(labels().some(l=>l.includes('ワイト')))pick('ワイト');else pick(msg.uid);}
const tev=topActivationEventS03(gameState);
const decoded=tev?API.activationTargets(tev).map(h=>h&&h.card):[];
ok('targets: the chain link of 死者への手向け decodes to its target ミドル・シールド・ガードナー',chainNames().join()==='死者への手向け'&&decoded.length===1&&decoded[0]===msg,JSON.stringify({chain:chainNames(),decoded:decoded.map(nm),toasts:TOASTS.slice(-3)}));
SEEN=[];settle();
ok('targets: ミドル・シールド・ガードナー is not offered as a late trigger after the chain (suppressed until its negation is modelled)',!SEEN.includes('ミドル・シールド・ガードナー')&&!gameState.chain.length,JSON.stringify({seen:SEEN,p0mz:gameState.players[0].mz.map(nm),p0grave:gameState.players[0].grave.map(nm)}));
replay('targets decode');
`);
