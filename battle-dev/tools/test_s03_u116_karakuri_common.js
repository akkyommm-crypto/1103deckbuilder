/* S03-U116: カラクリ common clauses (must attack + attack target → position change) on the four fixed-list Karakuri
   monsters that lacked them (cards/HM_claude_s03_u116_karakuri_common.js). Real DUEL path: an opponent's attack
   declaration → the mandatory trigger → position; the cards' own triggers still work; per-event mandatory-ness. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
/* drive to the end; forced triggers are taken; an optional group is skipped when skipOptional */
let PREFER_UID=null;
function drive(skipOptional){for(let i=0;i<400;i++){
  if(pc()){const j=PREFER_UID==null?-1:pc().candidates.findIndex(x=>x.uid===PREFER_UID);__choicePickV49(j>=0?j:0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length&&!(skipOptional&&EVT_V2_STATE.rank>=2))eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function chainAdds(){return v41ReplayPackage(gameState).actions.map(x=>x&&x.action).filter(a=>a&&a.type==='CHAIN_ADD').map(a=>a.name);}
/* the opponent (P2) attacks P1's face-up Karakuri with a strong attacker */
function attackOn(name,pos){
  resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='battle';
  const k=mk(name,0,'up');k.pos=pos||'atk';gameState.players[0].mz=[k];
  const atk=mk('ダーク・アームド・ドラゴン',1,'up');gameState.players[1].mz=[atk];
  gameState.players[0].deck=[mk('カラクリ兵 弐参六',0),mk('カラクリ商人 壱七七',0)];
  baselineA();
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
  return k;
}
`;

harness(COMMON+String.raw`
for(const n of ['カラクリ兵 弐参六','カラクリ商人 壱七七','カラクリ参謀 弐四八','カラクリ忍者 九壱九']){
  resetA();const c=mk(n,0,'up');gameState.players[0].mz=[c];gameState.phase='battle';
  gameState.activePlayer=0;c.pos='atk';
  ok('must attack: '+n+' is in the must-attack list that blocks ending the Battle Phase',mustAttackNow(c)===true&&pendingMustAttack().includes(c),n);
}
`);

/* ===== A. 'atkToDef' cards: targeted in face-up Attack Position → Defense Position (mandatory; survives the 2800 ATK attack) ===== */
harness(COMMON+String.raw`
for(const n of ['カラクリ兵 弐参六','カラクリ商人 壱七七','カラクリ参謀 弐四八']){
  const k=attackOn(n,'atk');
  drive(true);
  ok('A '+n+': targeted in Attack Position → the mandatory trigger resolved (a chain link, not skippable)',chainAdds().includes(n),JSON.stringify(chainAdds()));
  ok('A '+n+': it was changed to Defense Position before damage (no battle damage to P1)',gameState.players[0].lp===8000&&(z(k)!=='mz'||k.pos==='def'),JSON.stringify({pos:k.pos,zone:z(k),lp:gameState.players[0].lp}));
  audit('A '+n);
}
/* already in Defense Position → no trigger */
const d=attackOn('カラクリ参謀 弐四八','def');drive(true);
ok('A: in face-up Defense Position the clause does not trigger',!chainAdds().includes('カラクリ参謀 弐四八'),JSON.stringify(chainAdds()));
`);

/* ===== B. 'toggle' (九壱九): Attack → Defense, Defense → Attack ===== */
harness(COMMON+String.raw`
let k=attackOn('カラクリ忍者 九壱九','atk');drive(true);
ok('B 九壱九: targeted in Attack Position → Defense Position',chainAdds().includes('カラクリ忍者 九壱九')&&gameState.players[0].lp===8000,JSON.stringify({pos:k.pos,zone:z(k),lp:gameState.players[0].lp,adds:chainAdds()}));
audit('B atk');
k=attackOn('カラクリ忍者 九壱九','def');drive(true);
ok('B 九壱九: targeted in Defense Position → Attack Position (then destroyed by 2800 ATK, 1100 damage)',chainAdds().includes('カラクリ忍者 九壱九')&&z(k)==='grave'&&gameState.players[0].lp===8000-(2800-1700),JSON.stringify({zone:z(k),lp:gameState.players[0].lp}));
audit('B def');
`);

/* ===== C. the cards' own triggers still work; per-event mandatory-ness ===== */
harness(COMMON+String.raw`
/* 弐参六: destroyed by battle → the recruit is OPTIONAL (can be declined) */
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='battle';
const k=mk('カラクリ兵 弐参六',0,'up');k.pos='def';gameState.players[0].mz=[k];
gameState.players[1].mz=[mk('ダーク・アームド・ドラゴン',1,'up')];
gameState.players[0].deck=[mk('カラクリ商人 壱七七',0)];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive(true);
ok('C 弐参六: its recruit on battle destruction stays optional (declined → nothing summoned)',z(k)==='grave'&&!gameState.players[0].mz.length&&gameState.players[0].deck.length===1,JSON.stringify({mz:names(0,'mz'),deck:gameState.players[0].deck.length}));
ok('C: forcedForEventS03 — onAttackDeclare mandatory, onBattleDestroy optional',CARD_SCRIPTS['カラクリ兵 弐参六'].forcedForEventS03('onAttackDeclare')===true&&CARD_SCRIPTS['カラクリ兵 弐参六'].forcedForEventS03('onBattleDestroy')===false);
/* 壱七七: Normal Summon → search still works */
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
gameState.players[0].hand=[mk('カラクリ商人 壱七七',0)];gameState.players[0].deck=[mk('カラクリ兵 弐参六',0),mk('ワイト',0)];
baselineA();
doNormalSummon(0,'atk');drive(false);
ok('C 壱七七: the Normal Summon search still works',names(0,'hand').includes('カラクリ兵 弐参六'),JSON.stringify(names(0,'hand')));
audit('C 177');
/* 弐四八: summon → position change of a monster still works */
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
gameState.players[0].hand=[mk('カラクリ参謀 弐四八',0)];const foe=mk('ワイト',1,'up');gameState.players[1].mz=[foe];
baselineA();
PREFER_UID=ensureCardUid(gameState,foe);doNormalSummon(0,'atk');drive(false);PREFER_UID=null;
ok('C 弐四八: its summon trigger still changes a monster\'s position',foe.pos==='def',JSON.stringify(foe.pos));
audit('C 248');
`);

/* ===== D. 九壱九 ③: 戦闘によって相手モンスターを破壊し墓地へ送った時 → 墓地のLv4以下カラクリを選択して表側守備表示で特殊召喚 ===== */
harness(COMMON+String.raw`
function setup(){
  resetA();gameState.turn=5;gameState.phase='battle';
  const n=mk('カラクリ忍者 九壱九',0,'up');gameState.players[0].mz=[n];
  const g1=mk('カラクリ兵 弐参六',0),g2=mk('カラクリ商人 壱七七',0);gameState.players[0].grave=[g1,g2];
  return {n,g1,g2};
}
/* D1: as the attacker it destroys a monster → the selected Karakuri is Special Summoned in Defense Position */
let {n,g1,g2}=setup();gameState.activePlayer=0;
const w=mk('ワイト',1,'up');w.pos='atk';gameState.players[1].mz=[w];
baselineA();
PREFER_UID=ensureCardUid(gameState,g2);
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive(false);PREFER_UID=null;
ok('D1 九壱九 (attacker): destroys ワイト → the chosen 壱七七 is Special Summoned in face-up Defense Position',z(w)==='grave'&&z(g2)==='mz'&&g2.pos==='def'&&g2.face==='up'&&z(g1)==='grave',JSON.stringify({w:z(w),g2:z(g2),pos:g2.pos,g1:z(g1)}));
audit('D1');
/* D2: as the attack target in Defense Position → it becomes Attack Position, destroys the weaker attacker → trigger */
({n,g1,g2}=setup());gameState.activePlayer=1;n.pos='def';
const a=mk('ワイト',1,'up');gameState.players[1].mz=[a];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive(false);
ok('D2 九壱九 (attack target): toggled to Attack Position, destroys the attacker → a Karakuri is Special Summoned',n.pos==='atk'&&z(a)==='grave'&&gameState.players[0].mz.length===2,JSON.stringify({pos:n.pos,a:z(a),mz:names(0,'mz')}));
audit('D2');
/* D3: the opponent's monster is not destroyed → no trigger */
({n,g1,g2}=setup());gameState.activePlayer=0;
const big=mk('ダーク・アームド・ドラゴン',1,'up');big.pos='atk';gameState.players[1].mz=[big];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive(false);
ok('D3 九壱九: it is destroyed by the stronger monster, which survives → no Special Summon',z(big)==='mz'&&z(n)==='grave'&&gameState.players[0].mz.length===0&&!chainAdds().includes('カラクリ忍者 九壱九'),JSON.stringify({mz:names(0,'mz'),adds:chainAdds()}));
audit('D3');
`);
