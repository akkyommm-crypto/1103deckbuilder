/* S03-U125: 暗黒界の武神 ゴルド / 暗黒界の龍神 グラファ — targets are chosen on activation (were chosen at resolution);
   グラファ's "相手の手札をランダムに1枚確認し、モンスターなら自分フィールドに特殊召喚できる" (was missing) with the random
   pick inside a journaled Action (GRAPHA_PEEK_S03). Real DUEL path (手札抹殺 / 暗黒界の門), Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function ctl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function uid(c){return ensureCardUid(gameState,c);}
/* run until a choice / idle, answering event groups (mandatory first) */
function run(){for(let i=0;i<400;i++){
  if(pc())return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function keysFor(cards){const q=pc();return q.candidates.filter(c=>cards.some(x=>c.uid===uid(x))).map(c=>c.key);}
function chainTargets(name){const l=gameState.chain.find(l=>l.name===name);return l?(l.targets||[]).length:-1;}
/* P2 (turn player) activates a set 手札抹殺 */
function oppHandDestruction(){const dd=mk('手札抹殺',1,'down');dd.setTurn=2;gameState.players[1].sz.push(dd);return dd;}
`;

/* ===== A. ゴルド discarded by the opponent: up to 2 targets on activation → both destroyed; 0 chosen → none ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
const dd=oppHandDestruction();
const gold=mk('暗黒界の武神 ゴルド',0);gameState.players[0].hand=[gold];gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0)];
const f1=mk('BF－黒槍のブラスト',1,'up'),f2=mk('ワイト',1,'up'),f3=mk('ゴブリンドバーグ',1,'up');gameState.players[1].mz=[f1,f2,f3];
baselineA();
duelActivateFromZone(1,'sz',0);
let st=run();
const q=pc();
ok('A: when ゴルド\'s trigger is activated, the target choice (0 to 2 of the opponent\'s cards) comes first',st==='choice'&&/ゴルド/.test(q.title||'')&&q.min===0&&q.max===2&&q.targeting===true&&!gameState.chain.some(l=>l.name==='暗黒界の武神 ゴルド'),JSON.stringify(q&&{t:q.title,min:q.min,max:q.max,tg:q.targeting}));
answerChoiceV49(keysFor([f1,f3]));
ok('A: ゴルド is on the chain with its 2 targets',chainTargets('暗黒界の武神 ゴルド')===2,JSON.stringify(gameState.chain.map(l=>[l.name,(l.targets||[]).length])));
st=run();
ok('A: resolved: ゴルド Special Summoned; the 2 targets destroyed; the non-target stays',z(gold)==='mz'&&z(f1)==='grave'&&z(f3)==='grave'&&z(f2)==='mz',JSON.stringify({gold:z(gold),f1:z(f1),f2:z(f2),f3:z(f3)}));
audit('A');
/* 0 targets */
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
oppHandDestruction();
const g2=mk('暗黒界の武神 ゴルド',0);gameState.players[0].hand=[g2];gameState.players[0].deck=[mk('ワイト',0)];
const e1=mk('ワイト',1,'up');gameState.players[1].mz=[e1];
baselineA();
duelActivateFromZone(1,'sz',0);run();
answerChoiceV49([]);run();
ok('A: choosing no target → ゴルド is still Special Summoned, nothing destroyed',z(g2)==='mz'&&z(e1)==='mz',JSON.stringify({g:z(g2),e:z(e1)}));
audit('A none');
`);

/* ===== B. グラファ discarded by its own side (暗黒界の門): the target is chosen on activation; no hand peek ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const gate=mk('暗黒界の門',0,'up');gameState.players[0].field=gate;
const bro=mk('暗黒界の狩人 ブラウ',0,'up');gameState.players[0].grave=[bro];
const gr=mk('暗黒界の龍神 グラファ',0);gameState.players[0].hand=[gr];gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0)];
const t1=mk('ワイト',1,'up'),t2=mk('ゴブリンドバーグ',1,'up');gameState.players[1].mz=[t1,t2];gameState.players[1].hand=[mk('ワイトキング',1)];
baselineA();
duelActivateFromZone(0,'field',0);
for(let i=0;i<6;i++){ if(run()!=='choice')break; const q=pc();
  if(/グラファ/.test(q.title||'')){ ok('B: グラファ\'s target is chosen on activation (targeting)',q.targeting===true&&!gameState.chain.some(l=>l.name==='暗黒界の龍神 グラファ'),JSON.stringify({t:q.title,tg:q.targeting})); answerChoiceV49(keysFor([t2])); continue; }
  const k=q.candidates.find(c=>c.uid===uid(bro)||c.uid===uid(gr)); answerChoiceV49([ (q.candidates.find(c=>c.uid===uid(gr))||k||q.candidates[0]).key ]); }
run();
ok('B: the chosen ゴブリンドバーグ is destroyed; ワイト stays; no hand peek (discarded by its own side)',z(t2)==='grave'&&z(t1)==='mz'&&!v41ReplayPackage(gameState).actions.some(x=>x&&x.action&&x.action.type==='GRAPHA_PEEK_S03'),JSON.stringify({t1:z(t1),t2:z(t2)}));
audit('B');
`);

/* ===== C. グラファ discarded by the opponent's 手札抹殺: destroy the target, then peek a random card of the opponent's hand;
   a monster may be Special Summoned to グラファ's controller's field ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
oppHandDestruction();
const gr=mk('暗黒界の龍神 グラファ',0);gameState.players[0].hand=[gr];gameState.players[0].deck=[mk('ワイト',0)];
gameState.players[1].hand=[mk('ワイト',1),mk('ワイト',1)];gameState.players[1].deck=[mk('ワイトキング',1),mk('ワイト夫人',1)];
const tg=mk('ゴブリンドバーグ',1,'up');gameState.players[1].mz=[tg];
baselineA();
duelActivateFromZone(1,'sz',0);
let st=run();
ok('C: グラファ\'s target choice on activation',st==='choice'&&/グラファ/.test(pc().title||'')&&pc().targeting===true,JSON.stringify(pc()&&pc().title));
answerChoiceV49(keysFor([tg]));
st=run();
const peek=v41ReplayPackage(gameState).actions.map(x=>x&&x.action).filter(a=>a&&a.type==='GRAPHA_PEEK_S03');
const q=pc();
ok('C: the target is destroyed, a random opponent hand card is checked (journaled GRAPHA_PEEK_S03) — a monster → the summon question',z(tg)==='grave'&&peek.length===1&&!!q&&/特殊召喚しますか/.test(q.title||''),JSON.stringify({tg:z(tg),peek:peek.length,q:q&&q.title,log:gameState.log.slice(-2).map(x=>typeof x==='string'?x:(x.msg||''))}));
const peeked=findCardByUid(gameState.graphaPeekS03.uid).card;
answerChoiceV49(['yes']);run();
ok('C: yes → the checked monster is Special Summoned to グラファ\'s controller\'s field',z(peeked)==='mz'&&ctl(peeked)===0,JSON.stringify({z:z(peeked),ctl:ctl(peeked),name:nm(peeked)}));
audit('C (the random pick reproduces in Replay)');
`);

/* ===== D. the checked card is not a monster → no question ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
oppHandDestruction();
const gr=mk('暗黒界の龍神 グラファ',0);gameState.players[0].hand=[gr];gameState.players[0].deck=[mk('ワイト',0)];
gameState.players[1].hand=[mk('ワイト',1)];gameState.players[1].deck=[mk('サイクロン',1)];
const tg=mk('ゴブリンドバーグ',1,'up');gameState.players[1].mz=[tg];
baselineA();
duelActivateFromZone(1,'sz',0);run();answerChoiceV49(keysFor([tg]));
const st=run();
ok('D: the only opponent hand card is サイクロン → checked, not a monster → no summon question',st==='idle'&&z(tg)==='grave'&&names(1,'hand').join()==='サイクロン',JSON.stringify({st,hand1:names(1,'hand')}));
audit('D');
`);
