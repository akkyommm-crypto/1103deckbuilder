/* S03-U18 C-S03-15 ACTIVATION_RESPONSE_EVENT
   Requirement: a card that negates an activation 「…が発動した時、その発動を無効にする」 can be activated as a chain response to that
   activation while it is on the chain, and resolves against it; it is not offered afterwards as a late trigger.
   Before the fix: these scripts read the activation from ctx.event, but the chain-response path passed no event, so they were never
   legal responses; the deferred onActivateSuccess offered them after the activation had already resolved (cost paid, nothing negated).
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
  if(i<0)throw Error('candidate '+match+' missing: '+JSON.stringify(labels()));__choicePickV49(i);}
function responses(p){return getChainResponsesV2(p).map(x=>x.db.n);}
function chainNames(){return gameState.chain.map(l=>l.name);}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}
const DECLARED=['王宮の陥落','魔力終了宣告','蛇神の勅命','威風堂々','ダメージ・ポラリライザー','フュージョン・ガード','ゴブリンのその場しのぎ','誤作動','ギョッ!','フレムベルカウンター',
 'アーマーブレイク','オーバーウェルム','マジック・ジャマー','マジック・ドレイン','鋼核の輝き','墓場からの呼び声','グリフォンの翼','壺盗み','ネイビィロイド','ヂェミナイ・デビル','ジャスティス・ブリンガー'];

ok('the 21 activation-response scripts are declared',DECLARED.length===21&&DECLARED.every(n=>typeof activationResponseDeclaredS03==='function'&&activationResponseDeclaredS03(n)&&!!CARD_SCRIPTS[n]),JSON.stringify(DECLARED.filter(n=>!(typeof activationResponseDeclaredS03==='function'&&activationResponseDeclaredS03(n)))));

/* ===== フレムベルカウンター negates サイクロン ===== */
fresh();gameState.activePlayer=1;
const fc=mk('フレムベルカウンター',0,'down');fc.setTurn=3;const mySet=mk('サイクロン',0,'down');mySet.setTurn=3;gameState.players[0].sz=[fc,mySet];
gameState.players[0].grave=[mk('ネオフレムベル・サーベル')];gameState.players[1].hand=[mk('サイクロン',1)];baselineA();
ok('フレムベルカウンター: with no activation on the chain it is not legal',!strictScriptLegalityV2('フレムベルカウンター',0,'sz',0,{}).ok);
duelActivateFromHand(0);pick(mySet.uid);
ok('フレムベルカウンター: P2 activates サイクロン targeting P1’s set サイクロン; P1’s responses list フレムベルカウンター',chainNames().join()==='サイクロン'&&responses(0).includes('フレムベルカウンター'),JSON.stringify({chain:chainNames(),resp:responses(0)}));
duelActivateResponseV2(0,'sz',0);
if(pendingChoiceV49(gameState))pick('ネオフレムベル・サーベル');
const fcLink=gameState.chain.find(l=>l.name==='フレムベルカウンター');
ok('フレムベルカウンター: it is chained to サイクロン with that activation as its event, after banishing ネオフレムベル・サーベル',
  !!fcLink&&fcLink.event&&fcLink.event.chainId===gameState.chain[0].chainId&&gameState.players[0].banish.some(c=>nm(c)==='ネオフレムベル・サーベル'),JSON.stringify({chain:chainNames(),ev:fcLink&&fcLink.event,toasts:TOASTS.slice(-3)}));
SEEN=[];settle();
ok('フレムベルカウンター: resolution negates and destroys サイクロン; P1’s set サイクロン survives',
  gameState.players[1].grave.some(c=>nm(c)==='サイクロン')&&gameState.players[0].sz.includes(mySet)&&!gameState.chain.length,JSON.stringify({p0sz:gameState.players[0].sz.map(nm),p1grave:gameState.players[1].grave.map(nm),log:(gameState.log||[]).slice(0,4).map(x=>x.msg||x)}));
ok('フレムベルカウンター: it is not offered again as a trigger after the chain',!SEEN.includes('フレムベルカウンター'),JSON.stringify(SEEN));
replay('フレムベルカウンター');

/* ===== ギョッ! negates レスキューラビット's effect ===== */
function rabbitBoard(){fresh();gameState.activePlayer=1;
  const gy=mk('ギョッ!',0,'down');gy.setTurn=3;gameState.players[0].sz=[gy];gameState.players[0].banish=[mk('アクア・スネーク')];
  gameState.players[1].mz=[mk('レスキューラビット',1)];
  gameState.players[1].deck=[mk('セイバーザウルス',1,'down'),mk('セイバーザウルス',1,'down'),mk('ジェネティック・ワーウルフ',1,'down')];baselineA();return gy;}
const gy=rabbitBoard();
duelActivateFromZone(1,'mz',0);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++)__choicePickV49(0);
ok('ギョッ!: P2 activates レスキューラビット; P1’s responses list ギョッ!',chainNames().join()==='レスキューラビット'&&responses(0).includes('ギョッ!'),JSON.stringify({chain:chainNames(),resp:responses(0)}));
duelActivateResponseV2(0,'sz',0);
if(pendingChoiceV49(gameState))pick('アクア・スネーク');
SEEN=[];settle();
ok('ギョッ!: the effect is negated, so P2 Special Summons nothing; アクア・スネーク was returned to the Deck as cost',
  !gameState.players[1].mz.some(c=>nm(c)==='セイバーザウルス')&&gameState.players[0].deck.some(c=>nm(c)==='アクア・スネーク')&&gameState.players[0].grave.some(c=>c===gy),
  JSON.stringify({p1mz:gameState.players[1].mz.map(nm),p0deck:gameState.players[0].deck.map(nm),log:(gameState.log||[]).slice(0,5).map(x=>x.msg||x)}));
ok('ギョッ!: it is not offered again as a trigger after the chain',!SEEN.includes('ギョッ!'),JSON.stringify(SEEN));
replay('ギョッ!');

/* ===== no response: no late offer ===== */
const gy2=rabbitBoard();
duelActivateFromZone(1,'mz',0);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++)__choicePickV49(0);
SEEN=[];settle();
ok('no response: レスキューラビット resolves; ギョッ! is not offered afterwards and stays set',
  gameState.players[1].mz.filter(c=>nm(c)==='セイバーザウルス').length===2&&!SEEN.includes('ギョッ!')&&gameState.players[0].sz.includes(gy2)&&gy2.face==='down',
  JSON.stringify({p1mz:gameState.players[1].mz.map(nm),seen:SEEN,face:gy2.face}));

/* ===== unified 魔力終了宣告 negates the activation of the Continuous Spell 六武の門 ===== */
fresh();gameState.activePlayer=1;
const mt=mk('魔力終了宣告',0,'down');mt.setTurn=3;gameState.players[0].sz=[mt];gameState.players[1].hand=[mk('六武の門',1)];baselineA();
duelActivateFromHand(0);
ok('魔力終了宣告: P2 activates 六武の門; P1’s responses list 魔力終了宣告',chainNames().join()==='六武の門'&&responses(0).includes('魔力終了宣告'),JSON.stringify({chain:chainNames(),resp:responses(0)}));
duelActivateResponseV2(0,'sz',0);
for(let k=0;k<3&&pendingChoiceV49(gameState);k++)__choicePickV49(0);
SEEN=[];settle();
ok('魔力終了宣告: resolution negates and destroys 六武の門',gameState.players[1].grave.some(c=>nm(c)==='六武の門')&&!gameState.players[1].sz.some(c=>nm(c)==='六武の門')&&!gameState.chain.length,
  JSON.stringify({p1sz:gameState.players[1].sz.map(nm),p1grave:gameState.players[1].grave.map(nm),log:(gameState.log||[]).slice(0,4).map(x=>x.msg||x)}));
replay('魔力終了宣告');
`);
