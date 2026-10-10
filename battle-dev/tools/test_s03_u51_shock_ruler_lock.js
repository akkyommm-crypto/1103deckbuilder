/* S03-U51 C-S03-39 ACTIVATION_TYPE_LOCK — No.16 色の支配者ショック・ルーラー on the DUEL path.
   Found by R1 on Astra's fixed lists (【Jurrac】 vs 1103兎ラギア, R1_DECKS=jurrac,rabbit, seed 0x52310705, first 1, turn 20): SYSTEM_FAULT
   「No.16 色の支配者ショック・ルーラー 解決エラー：Cannot read properties of undefined (reading 'n')」 — the declaration candidates were fake card objects,
   and in DUEL the pick came back without their data. The lock the card recorded was also never consulted by any legality check.
   2011 source: yugioh-wiki 《Ｎｏ.１６ 色の支配者ショック・ルーラー》 age 8 (2011-08-31): until the end of the opponent's next turn neither player can
   activate cards of the declared type; monster declared → monster effects cannot be activated, summons stay legal; spell / trap declared → card
   activations are blocked, effect activations of face-up Continuous Spells / Traps stay legal (11/08/19).
   Cards named here: No.16 色の支配者ショック・ルーラー (IMPLEMENTED → TESTED, declared); 神の警告, 王宮の弾圧, 死者蘇生, BF－極北のブリザード,
   BF－蒼炎のシュラ (TESTED); ワイト (GENERIC_OK). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
const SR='No.16 色の支配者ショック・ルーラー';
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const x=findCardByUid(c.uid);return x?x.zone:null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;TOASTS.length=0;}
function labels(){const pc=pendingChoiceV49(gameState);return pc?pc.candidates.map(x=>String(x.label||'')):[];}
function pickLabel(lbl){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('no choice for '+lbl+' toasts='+JSON.stringify(TOASTS.slice(-3)));
  const i=pc.candidates.findIndex(x=>String(x.label||'')===lbl);if(i<0)throw Error('label '+lbl+' missing: '+JSON.stringify(labels()));__choicePickV49(i);}
const SEEN=[];
function settle(take){for(let i=0;i<400;i++){
  if(pendingChoiceV49(gameState)){__choicePickV49(0);continue;}
  if(EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];g.forEach(c=>SEEN.push(c.name));const k=g.findIndex(c=>c.name===take);if(k>=0)eventPickV2(k);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function shockRuler(p){const c=mk(SR,p);c.xyz=[mk('ワイト',p),mk('ワイト',p),mk('ワイト',p)];return c;}
function declare(lbl){
  duelActivateFromZone(0,'mz',0,{});
  /* S03-U114: with 3 materials the cost first asks which X material to detach */
  const pcS03=pendingChoiceV49(gameState);
  ok(lbl+': the cost asks which of the 3 X materials to detach',!!pcS03&&/取り除くX素材/.test(pcS03.title||'')&&pcS03.candidates.length===3,JSON.stringify(pcS03&&{t:pcS03.title,n:pcS03.candidates.length}));
  if(pcS03&&/取り除くX素材/.test(pcS03.title||'')){__choicePickV49(0);}
  ok(lbl+': the declaration offers モンスター / 魔法 / 罠',JSON.stringify(labels())===JSON.stringify(['モンスター','魔法','罠']),JSON.stringify(labels()));
  pickLabel(lbl);settle();
}

/* ===== A. declare 罠: resolves without a fault; both players are locked until the end of the opponent's next turn ===== */
fresh();
{
  const sr=shockRuler(0);gameState.players[0].mz=[sr];
  baselineA();
  declare('罠');
  const f0=gameState.players[0].effectFlags.shockRuler, f1=gameState.players[1].effectFlags.shockRuler;
  ok('A: no resolution fault; both players record the 罠 lock until turn 6 (turn 5 + the opponent\'s next turn)',
    !gameState.systemFault&&f0&&f1&&f0.kind==='t'&&f1.kind==='t'&&f0.untilTurn===6&&f1.untilTurn===6,JSON.stringify({fault:gameState.systemFault||null,f0,f1}));
  ok('A: one Xyz material was detached',(sr.xyz||[]).length===2,JSON.stringify((sr.xyz||[]).length));
  audit('A');
}

/* ===== B. under the 罠 lock: a set 神の警告 is not offered, the face-up 王宮の弾圧's effect is (11/08/19) ===== */
fresh();
{
  const sr=shockRuler(0);gameState.players[0].mz=[sr];
  const rez=mk('死者蘇生',0);gameState.players[0].hand=[rez];
  const wight=mk('ワイト',0);gameState.players[0].grave=[wight];
  const warn=setCard('神の警告',1), ro=mk('王宮の弾圧',1);gameState.players[1].sz=[warn,ro];
  baselineA();
  declare('罠');
  ok('B: 死者蘇生 (a spell) can still be activated from the hand',getLegalHandActions(0,0).map(a=>a.id).includes('activate'),JSON.stringify(getLegalHandActions(0,0).map(a=>a.id)));
  duelActivateFromHand(0);
  for(let i=0;i<10&&pendingChoiceV49(gameState);i++)__choicePickV49(0);
  const resp=(gameState.chainWindow&&gameState.chain.length)?getChainResponsesV2(1):[];
  const Lw=strictScriptLegalityV2('神の警告',1,'sz',0,{});
  ok('B: the set 神の警告 is not offered and legality gives the lock reason',!resp.some(x=>x.card===warn)&&!Lw.ok&&/ショック・ルーラー/.test(Lw.reason),JSON.stringify({resp:resp.map(x=>x.db.n),Lw}));
  ok('B: the face-up 王宮の弾圧 is still offered (effect activation, not card activation)',resp.some(x=>x.card===ro),JSON.stringify(resp.map(x=>x.db.n)));
  settle();
  audit('B');
}

/* ===== C. the lock ends after the opponent's next turn ===== */
fresh();
{
  const sr=shockRuler(0);gameState.players[0].mz=[sr];
  const warn=setCard('神の警告',1);gameState.players[1].sz=[warn];
  baselineA();
  declare('罠');
  const db=dbOf(warn);
  const during=activationTypeLockReasonS03(1,warn,'sz',db,{});
  act({type:'PASS_TURN',player:0});
  const onOppTurn=activationTypeLockReasonS03(1,warn,'sz',db,{});
  act({type:'PASS_TURN',player:1});
  const after=activationTypeLockReasonS03(1,warn,'sz',db,{});
  ok('C: locked on turn 5 and on the opponent\'s turn 6, released on turn 7',!!during&&!!onOppTurn&&after==='',JSON.stringify({turn:gameState.turn,during,onOppTurn,after}));
}

/* ===== D. declare モンスター: a monster trigger is not offered, while the Normal Summon itself stays legal ===== */
fresh();
{
  const sr=shockRuler(0);gameState.players[0].mz=[sr];
  const bliz=mk('BF－極北のブリザード',0);gameState.players[0].hand=[bliz];
  const shura=mk('BF－蒼炎のシュラ',0);gameState.players[0].grave=[shura];
  baselineA();
  declare('モンスター');
  ok('D: the Normal Summon is still offered',getLegalHandActions(0,0).map(a=>a.id).includes('normalSummon'),JSON.stringify(getLegalHandActions(0,0).map(a=>a.id)));
  SEEN.length=0;
  doNormalSummon(0,'atk');settle('BF－極北のブリザード');
  ok('D: BF－極北のブリザード is summoned but its trigger is not offered; BF－蒼炎のシュラ stays in the GY',
    zoneOf(bliz)==='mz'&&!SEEN.includes('BF－極北のブリザード')&&zoneOf(shura)==='grave',JSON.stringify({bliz:zoneOf(bliz),shura:zoneOf(shura),seen:SEEN}));
  const Lm=strictScriptLegalityV2(SR,0,'mz',0,{});
  ok('D: ショック・ルーラー\'s own effect (a monster effect) is locked too',!Lm.ok,JSON.stringify(Lm));
  audit('D');
}
`);
