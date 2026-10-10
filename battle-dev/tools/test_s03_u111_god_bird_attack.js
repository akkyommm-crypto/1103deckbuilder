/* S03-U111: ゴッドバードアタック (Icarus Attack) — priority #7's IMPLEMENTED tier, main-deck qty=2 (bf).
   2011 text: 自分フィールド上に存在する鳥獣族モンスター1体をリリースして発動する。
   フィールド上に存在するカード2枚を選択して破壊する。
   Measured defects of the previous implementation (probe on the U110 build, same board as A1):
   (1) the release was not a cost — the Winged Beast was picked as if it were a target and only sent to the GY
       at resolution (so a negated activation released nothing, and removing the bird in response did not stop
       the destruction);
   (2) it could be activated with fewer than 2 cards to target;
   (3) the activated ゴッドバードアタック itself was offered as one of the 2 targets.
   Fix: cost() releases the bird before target selection (the デュアルスパーク S03-U98 pattern); 2 distinct
   targets that exclude the card itself (the サイクロン convention); resolve destroys the targets still there. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';gameState.turn=3;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<16;k++){const r=drive();if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}return r;}return 'loop';}
function labels(){const pc=pendingChoiceV49(gameState);return pc?pc.candidates.map(x=>String(x.label||'')):[];}
function pick(match){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing for '+match+' toasts='+JSON.stringify(TOASTS.slice(-3)));
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return (h&&nm(h.card)===match)||String(x.label||'').includes(match);});
  if(i<0)throw Error('candidate '+match+' missing: '+JSON.stringify(labels()));__choicePickV49(i);}
function names(p,z){return (gameState.players[p][z]||[]).map(nm);}
function set(name,p){const c=mk(name,p,'down');c.setTurn=gameState.turn-1;return c;}
function legal(){return strictScriptLegalityV2('ゴッドバードアタック',0,'sz',0,{});}
function journal(){return v41ReplayPackage(gameState).actions.map(x=>x&&x.action).filter(Boolean);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}
`;

/* ===== A. Legality ===== */
harness(COMMON+String.raw`
fresh();
gameState.players[0].sz=[set('ゴッドバードアタック',0)];
gameState.players[0].mz=[mk('BF－疾風のゲイル',0,'up')];
gameState.players[1].mz=[mk('ワイト',1,'up')];
baselineA();
let L=legal();
ok('A1: with only 1 card besides the card itself and the bird to release, it cannot be activated (2 targets required, itself excluded)',!L.ok,JSON.stringify(L));
gameState.players[1].sz=[set('サイクロン',1)];
L=legal();
ok('A2: with 2 such cards it can be activated',L.ok,JSON.stringify(L));
gameState.players[0].mz=[mk('ワイト',0,'up')];
L=legal();
ok('A3: without a Winged Beast to release it cannot be activated',!L.ok,JSON.stringify(L));
`);

/* ===== B. Cost before targets; the card itself and the released bird are not targetable; both targets destroyed ===== */
harness(COMMON+String.raw`
fresh();
const g=set('ゴッドバードアタック',0);gameState.players[0].sz=[g];
gameState.players[0].mz=[mk('BF－疾風のゲイル',0,'up')];
gameState.players[1].mz=[mk('ワイト',1,'up')];gameState.players[1].sz=[set('サイクロン',1)];
baselineA();
duelActivateFromZone(0,'sz',0);
let st=drive();
ok('B: the first prompt is the cost — only the Winged Beast is offered',st==='choice'&&labels().length===1&&labels()[0].includes('BF－疾風のゲイル'),JSON.stringify({st,labels:labels()}));
pick('BF－疾風のゲイル');st=drive();
ok('B: the bird is released (in the GY) before the targets are chosen',
  st==='choice'&&names(0,'grave').includes('BF－疾風のゲイル')&&!names(0,'mz').length,JSON.stringify({st,grave:names(0,'grave'),labels:labels()}));
ok('B: the target candidates exclude ゴッドバードアタック itself',
  labels().length===2&&!labels().some(l=>l.includes('ゴッドバードアタック')),JSON.stringify(labels()));
pick('ワイト');st=drive();
const cand2=(pendingChoiceV49(gameState)||{candidates:[]}).candidates.map(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h?nm(h.card):null;});
ok('B: the second target prompt offers only the remaining card (the set サイクロン, shown face-down)',st==='choice'&&cand2.length===1&&cand2[0]==='サイクロン',JSON.stringify({st,labels:labels(),cand2}));
pick('サイクロン');st=settle();
ok('B: both targets are destroyed; ゴッドバードアタック goes to the GY',
  !names(1,'mz').length&&!names(1,'sz').length&&names(1,'grave').includes('ワイト')&&names(1,'grave').includes('サイクロン')&&names(0,'grave').includes('ゴッドバードアタック'),
  JSON.stringify({g0:names(0,'grave'),g1:names(1,'grave'),mz1:names(1,'mz'),sz1:names(1,'sz'),st}));
audit('B');
`);

/* ===== B2. Another own Winged Beast can be one of the targets ===== */
harness(COMMON+String.raw`
fresh();
gameState.players[0].sz=[set('ゴッドバードアタック',0)];
gameState.players[0].mz=[mk('BF－疾風のゲイル',0,'up'),mk('BF－黒槍のブラスト',0,'up')];
gameState.players[1].mz=[mk('ワイト',1,'up')];
baselineA();
ok('B2: legal with a second bird that can be targeted',legal().ok,JSON.stringify(legal()));
duelActivateFromZone(0,'sz',0);drive();
pick('BF－疾風のゲイル');drive();
ok('B2: the other own bird is a target candidate, the released one is not',
  labels().some(l=>l.includes('BF－黒槍のブラスト'))&&!labels().some(l=>l.includes('BF－疾風のゲイル')),JSON.stringify(labels()));
pick('BF－黒槍のブラスト');drive();pick('ワイト');settle();
ok('B2: both targets destroyed',names(0,'grave').includes('BF－黒槍のブラスト')&&names(1,'grave').includes('ワイト')&&!names(0,'mz').length,
  JSON.stringify({g0:names(0,'grave'),g1:names(1,'grave')}));
audit('B2');
`);

/* ===== C. Negated by 神の宣告: the cost stays paid, the targets survive ===== */
harness(COMMON+String.raw`
fresh();
gameState.players[0].sz=[set('ゴッドバードアタック',0)];
gameState.players[0].mz=[mk('BF－疾風のゲイル',0,'up')];
gameState.players[1].mz=[mk('ワイト',1,'up')];
const warn=set('神の宣告',1);gameState.players[1].sz=[warn,set('サイクロン',1)];
gameState.players[1].lp=8000;
baselineA();
duelActivateFromZone(0,'sz',0);drive();
pick('BF－疾風のゲイル');drive();pick('ワイト');
const pc=pendingChoiceV49(gameState);
if(pc) pick('サイクロン');
const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(1):[];
ok('C setup: 神の宣告 is offered as a real chain response',resp.some(x=>x.card===warn),JSON.stringify(resp.map(x=>x.db.n)));
duelActivateResponseV2(1,'sz',0);
settle();
ok('C: negated — the released bird stays in the GY (cost is not refunded) and both targets survive',
  names(0,'grave').includes('BF－疾風のゲイル')&&names(1,'mz').includes('ワイト')&&names(1,'sz').includes('サイクロン')&&gameState.players[1].lp===4000,
  JSON.stringify({g0:names(0,'grave'),mz1:names(1,'mz'),sz1:names(1,'sz'),lp1:gameState.players[1].lp}));
audit('C');
`);

/* ===== S. Same rule on the other cards found by the survey (every scripted targeting Spell/Trap activated on a
   rich board; before this unit サンダー・ブレイク, デュアルスパーク and ツイスター offered themselves):
   an activated Spell/Trap card cannot target itself. ===== */
harness(COMMON+String.raw`
function selfOffered(card){const pc=pendingChoiceV49(gameState);return !!pc&&pc.candidates.some(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&h.card===card;});}
function candNames(){const pc=pendingChoiceV49(gameState);return pc?pc.candidates.map(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h?nm(h.card):x.label;}):[];}

/* S1 サンダー・ブレイク: discard cost, then target — itself not offered; the target is destroyed */
fresh();
const tb=set('サンダー・ブレイク',0);gameState.players[0].sz=[tb];
gameState.players[0].hand=[mk('ワイト',0)];
gameState.players[1].mz=[mk('BF－黒槍のブラスト',1,'up')];
baselineA();
duelActivateFromZone(0,'sz',0);let st=drive();
if(st==='choice'&&candNames().includes('ワイト')&&!candNames().includes('BF－黒槍のブラスト')){pick('ワイト');st=drive();}
ok('S1: サンダー・ブレイク — after the discard cost, the target prompt does not offer the card itself',
  st==='choice'&&!selfOffered(tb)&&candNames().length===1&&candNames()[0]==='BF－黒槍のブラスト'&&names(0,'grave').includes('ワイト'),
  JSON.stringify({st,cands:candNames(),grave:names(0,'grave')}));
pick('BF－黒槍のブラスト');settle();
ok('S1: サンダー・ブレイク destroys its target',names(1,'grave').includes('BF－黒槍のブラスト')&&!names(1,'mz').length,JSON.stringify({g1:names(1,'grave')}));
audit('S1');
fresh();
gameState.players[0].sz=[set('サンダー・ブレイク',0)];gameState.players[0].hand=[mk('ワイト',0)];
baselineA();
const Ls1=strictScriptLegalityV2('サンダー・ブレイク',0,'sz',0,{});
ok('S1: with no card on the field but itself, サンダー・ブレイク cannot be activated',!Ls1.ok,JSON.stringify(Ls1));

/* S2 デュアルスパーク (set): the card itself is not offered; with only the released Gemini besides itself it cannot be activated */
fresh();
const ds=set('デュアルスパーク',0);gameState.players[0].sz=[ds];
gameState.players[0].mz=[mk('E・HERO アナザー・ネオス',0,'up')];
gameState.players[1].mz=[mk('ワイト',1,'up')];
gameState.players[0].deck=[mk('ワイト',0)];
baselineA();
duelActivateFromZone(0,'sz',0);st=drive();
if(st==='choice'&&candNames().includes('E・HERO アナザー・ネオス')){pick('E・HERO アナザー・ネオス');st=drive();}
ok('S2: デュアルスパーク — the target prompt does not offer the card itself',st==='choice'&&!selfOffered(ds)&&candNames().join()==='ワイト',JSON.stringify({st,cands:candNames()}));
pick('ワイト');settle();
ok('S2: デュアルスパーク destroys the target and draws',names(1,'grave').includes('ワイト')&&names(0,'hand').includes('ワイト'),JSON.stringify({g1:names(1,'grave'),hand:names(0,'hand')}));
audit('S2');
fresh();
gameState.players[0].sz=[set('デュアルスパーク',0)];
gameState.players[0].mz=[mk('E・HERO アナザー・ネオス',0,'up')];
baselineA();
const Ls2=strictScriptLegalityV2('デュアルスパーク',0,'sz',0,{});
ok('S2: with only the Gemini to release and itself on the field, デュアルスパーク cannot be activated',!Ls2.ok,JSON.stringify(Ls2));

/* S3 ツイスター (set): itself (face-up once activated) is not offered */
fresh();
const tw=set('ツイスター',0);gameState.players[0].sz=[tw];
gameState.players[1].sz=[mk('スキルドレイン',1,'up')];
gameState.players[0].lp=8000;
baselineA();
duelActivateFromZone(0,'sz',0);st=drive();
ok('S3: ツイスター — the target prompt offers the opponent face-up スキルドレイン and not the card itself',
  st==='choice'&&!selfOffered(tw)&&candNames().join()==='スキルドレイン',JSON.stringify({st,cands:candNames()}));
pick('スキルドレイン');settle();
ok('S3: ツイスター destroys the target after paying 500',names(1,'grave').includes('スキルドレイン')&&gameState.players[0].lp===7500,JSON.stringify({g1:names(1,'grave'),lp:gameState.players[0].lp}));
audit('S3');
`);
