/* S03-U112: 暗黒界の門 (The Gates of Dark World) — priority #7's IMPLEMENTED tier, main-deck qty=2 (dark).
   2011 text: フィールド上に表側表示で存在する悪魔族モンスターの攻撃力・守備力は300ポイントアップする。
   1ターンに1度、自分の墓地に存在する悪魔族モンスター1体をゲームから除外する事で、手札から悪魔族モンスター
   1体を選択して捨てる。その後、自分のデッキからカードを1枚ドローする。
   Measured defect (probe on the U111 build): the discard prompt at resolution was cancelable — after the cost
   (banishing a Fiend from the GY) was paid, cancelling skipped both the discard and the draw, making a mandatory
   effect optional. Fix: cancelable:false. Everything else (cost, continuous +300, once per turn per card, the
   discard counting as a discard by card effect for 暗黒界 triggers) was already correct and is pinned here. */
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
function legal(){return strictScriptLegalityV2('暗黒界の門',0,'field',0,{});}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}
function board(){
  fresh();
  const gw=mk('暗黒界の門',0,'up');gameState.players[0].field=gw;
  gameState.players[0].grave=[mk('暗黒界の狩人 ブラウ',0),mk('ワイト',0)];
  gameState.players[0].hand=[mk('暗黒界の尖兵 ベージ',0),mk('ワイト',0)];
  gameState.players[0].deck=[mk('サイクロン',0),mk('ワイト',0)];
  return gw;
}
`;

/* ===== A. Legality ===== */
harness(COMMON+String.raw`
board();baselineA();
ok('A: legal with a Fiend in the GY and a Fiend in the hand',legal().ok,JSON.stringify(legal()));
gameState.players[0].grave=[mk('ワイト',0)];
ok('A: illegal without a Fiend in the GY (a non-Fiend does not count)',!legal().ok,JSON.stringify(legal()));
board();gameState.players[0].hand=[mk('ワイト',0)];baselineA();
ok('A: illegal without a Fiend in the hand',!legal().ok,JSON.stringify(legal()));
`);

/* ===== B. Cost, mandatory discard, 暗黒界 discard trigger, draw, once per turn ===== */
harness(COMMON+String.raw`
board();baselineA();
duelActivateFromZone(0,'field',0);
let st=drive();
ok('B: the cost prompt offers only the Fiend in the GY',st==='choice'&&labels().length===1&&labels()[0].includes('暗黒界の狩人 ブラウ'),JSON.stringify({st,labels:labels()}));
pick('暗黒界の狩人 ブラウ');st=drive();
ok('B: the cost banishes it',names(0,'banish').includes('暗黒界の狩人 ブラウ')&&!names(0,'grave').includes('暗黒界の狩人 ブラウ'),JSON.stringify({banish:names(0,'banish')}));
ok('B: at resolution the discard prompt offers only the Fiend in the hand',st==='choice'&&labels().length===1&&labels()[0].includes('暗黒界の尖兵 ベージ'),JSON.stringify({st,labels:labels()}));
__choiceCancelV49();st=drive();
ok('B: the discard is mandatory — a cancel attempt does not skip it (the prompt stays, nothing drawn)',
  st==='choice'&&labels().length===1&&names(0,'deck').length===2&&names(0,'hand').includes('暗黒界の尖兵 ベージ'),
  JSON.stringify({st,labels:labels(),deck:names(0,'deck').length,hand:names(0,'hand')}));
pick('暗黒界の尖兵 ベージ');st=settle();
ok('B: ベージ is discarded by a card effect and its own trigger Special Summons it from the GY',
  names(0,'mz').includes('暗黒界の尖兵 ベージ')&&!names(0,'hand').includes('暗黒界の尖兵 ベージ'),JSON.stringify({mz:names(0,'mz'),grave:names(0,'grave'),hand:names(0,'hand'),st}));
ok('B: then 1 card is drawn',names(0,'hand').includes('サイクロン')&&names(0,'deck').length===1,JSON.stringify({hand:names(0,'hand'),deck:names(0,'deck')}));
ok('B: the summoned Fiend gets +300 from the continuous effect',curATK(gameState.players[0].mz.find(c=>nm(c)==='暗黒界の尖兵 ベージ'))===dbOf(mk('暗黒界の尖兵 ベージ',0)).atk+300,
  String(curATK(gameState.players[0].mz.find(c=>nm(c)==='暗黒界の尖兵 ベージ'))));
audit('B');
/* after the audit: direct (unjournaled) setup so that only the once-per-turn limit can make it illegal */
gameState.players[0].grave.push(mk('暗黒界の狩人 ブラウ',0));gameState.players[0].hand.push(mk('暗黒界の龍神 グラファ',0));
ok('B: once per turn — a second activation this turn is illegal',!legal().ok&&/1ターン|回数|使用/.test(legal().reason||''),JSON.stringify(legal()));
`);

/* ===== C. Continuous: +300 ATK/DEF to face-up Fiends on both sides only ===== */
harness(COMMON+String.raw`
board();
const f0=mk('暗黒界の狩人 ブラウ',0,'up'),f1=mk('暗黒界の龍神 グラファ',1,'up'),n1=mk('ワイト',1,'up');
gameState.players[0].mz=[f0];gameState.players[1].mz=[f1,n1];
baselineA();
const d=x=>dbOf(x);
ok('C: own face-up Fiend +300/+300',curATK(f0)===d(f0).atk+300&&curDEF(f0)===d(f0).def+300,JSON.stringify([curATK(f0),curDEF(f0)]));
ok('C: opponent face-up Fiend +300/+300 too',curATK(f1)===d(f1).atk+300&&curDEF(f1)===d(f1).def+300,JSON.stringify([curATK(f1),curDEF(f1)]));
ok('C: a non-Fiend is unchanged',curATK(n1)===d(n1).atk&&curDEF(n1)===d(n1).def,JSON.stringify([curATK(n1),curDEF(n1)]));
gameState.players[0].field=null;
ok('C: without the field spell the bonus is gone',curATK(f0)===d(f0).atk,String(curATK(f0)));
`);

/* ===== D. The same "mandatory discard effect" contract on the 暗黒界 monsters (S03-U112 cluster):
   the first clause is mandatory (forced trigger); "相手のカードの効果によって捨てられた場合、さらに…" is decided by
   the recorded discard source (discardInfo.byPlayer), not by asking the player. ===== */
harness(COMMON+String.raw`
function noPrompt(){return !pendingChoiceV49(gameState);}
/* D1: ブラウ discarded by its controller's own effect (暗黒界の門) → exactly 1 draw, no question asked */
board();gameState.players[0].hand=[mk('暗黒界の狩人 ブラウ',0)];gameState.players[0].deck=[mk('サイクロン',0),mk('ワイト',0),mk('ワイト',0)];
baselineA();
duelActivateFromZone(0,'field',0);drive();pick('暗黒界の狩人 ブラウ');drive();pick('暗黒界の狩人 ブラウ');
let st=settle();
ok('D1: ブラウ discarded by its own side draws exactly 1 (+1 for 暗黒界の門) with no self-report prompt',
  st==='idle'&&noPrompt()&&names(0,'hand').length===2&&gameState.players[0].deck.length===1,JSON.stringify({st,hand:names(0,'hand'),deck:gameState.players[0].deck.length,toasts:TOASTS.slice(-2)}));
audit('D1');

/* D2: ブラウ and ゴルド discarded by the OPPONENT's 手札抹殺 → ブラウ draws 2; ゴルド is Special Summoned and may destroy */
fresh();gameState.activePlayer=1;
const dd=mk('手札抹殺',1,'down');dd.setTurn=2;gameState.players[1].sz=[dd];
gameState.players[0].hand=[mk('暗黒界の狩人 ブラウ',0),mk('暗黒界の武神 ゴルド',0)];
gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0),mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];
gameState.players[1].deck=[mk('ワイト',1),mk('ワイト',1)];
gameState.players[1].mz=[mk('BF－黒槍のブラスト',1,'up')];
baselineA();
duelActivateFromZone(1,'sz',0);
const deck0=gameState.players[0].deck.length;
st=settle();
let guard=0;while(st==='choice'&&guard++<6){const t=(pendingChoiceV49(gameState)||{}).title||'';if(/ゴルド/.test(t)){pick('BF－黒槍のブラスト');__choiceCommitV49();/* S03-U125: ゴルド's targets (0–2) are chosen on activation as a multi-select — confirm like the UI's 確定 */}else __choicePickV49(0);st=settle();}
ok('D2: ブラウ discarded by the opponent draws 2 (and 手札抹殺 itself replaces the 2 discarded cards)',
  deck0-gameState.players[0].deck.length===4,JSON.stringify({deckBefore:deck0,deckAfter:gameState.players[0].deck.length,hand:names(0,'hand')}));
ok('D2: ゴルド is Special Summoned and, discarded by the opponent, may destroy — it destroyed the chosen card',
  names(0,'mz').includes('暗黒界の武神 ゴルド')&&names(1,'grave').includes('BF－黒槍のブラスト'),JSON.stringify({mz0:names(0,'mz'),g1:names(1,'grave'),mz1:names(1,'mz')}));
audit('D2');

/* D3: ゴルド discarded by its own side (暗黒界の門) → Special Summoned, no destruction offered */
board();gameState.players[0].hand=[mk('暗黒界の武神 ゴルド',0)];gameState.players[1].mz=[mk('ワイト',1,'up')];
baselineA();
duelActivateFromZone(0,'field',0);drive();pick('暗黒界の狩人 ブラウ');drive();pick('暗黒界の武神 ゴルド');
st=settle();
ok('D3: ゴルド discarded by its own side is Special Summoned and offers no destruction',
  st==='idle'&&noPrompt()&&names(0,'mz').includes('暗黒界の武神 ゴルド')&&names(1,'mz').includes('ワイト'),JSON.stringify({st,mz0:names(0,'mz'),mz1:names(1,'mz')}));
audit('D3');

/* D4: 暗黒界の雷 — "その後、手札を1枚捨てる" is mandatory */
fresh();
const th=mk('暗黒界の雷',0,'down');th.setTurn=2;gameState.players[0].sz=[th];
gameState.players[0].hand=[mk('ワイト',0)];
const tgt=mk('サイクロン',1,'down');tgt.setTurn=2;gameState.players[1].sz=[tgt];
baselineA();
duelActivateFromZone(0,'sz',0);st=drive();if(st==='choice')pick('サイクロン');st=drive();
__choiceCancelV49();st=drive();
ok('D4: 暗黒界の雷 — the discard prompt survives a cancel attempt',st==='choice'&&names(0,'hand').includes('ワイト'),JSON.stringify({st,hand:names(0,'hand')}));
pick('ワイト');settle();
ok('D4: 暗黒界の雷 destroys the set card and the hand card is discarded',names(1,'grave').includes('サイクロン')&&names(0,'grave').includes('ワイト'),JSON.stringify({g0:names(0,'grave'),g1:names(1,'grave')}));
audit('D4');
`);

/* ===== E. The discard sources used above, pinned on their own ===== */
harness(COMMON+String.raw`
/* E1 手札抹殺: both players discard their whole hand, then each draws as many as they discarded */
fresh();
const cd=mk('手札抹殺',0,'down');cd.setTurn=2;gameState.players[0].sz=[cd];
gameState.players[0].hand=[mk('ワイト',0),mk('サイクロン',0)];
gameState.players[1].hand=[mk('ワイト',1),mk('ワイト',1),mk('サイクロン',1)];
gameState.players[0].deck=[mk('BF－疾風のゲイル',0),mk('BF－疾風のゲイル',0),mk('ワイト',0)];
gameState.players[1].deck=[mk('BF－黒槍のブラスト',1),mk('BF－黒槍のブラスト',1),mk('BF－黒槍のブラスト',1),mk('ワイト',1)];
baselineA();
duelActivateFromZone(0,'sz',0);settle();
ok('E1: 手札抹殺 — P0 discards 2 and draws 2',names(0,'grave').filter(n=>n!=='手札抹殺').length===2&&names(0,'hand').length===2&&names(0,'hand').every(n=>n==='BF－疾風のゲイル'),
  JSON.stringify({g0:names(0,'grave'),h0:names(0,'hand')}));
ok('E1: 手札抹殺 — P1 discards 3 and draws 3',names(1,'grave').length===3&&names(1,'hand').length===3&&names(1,'hand').every(n=>n==='BF－黒槍のブラスト'),
  JSON.stringify({g1:names(1,'grave'),h1:names(1,'hand')}));
/* P3 contract (test_p3_provenance.js): discardInfo.byPlayer keeps the hand-owner meaning; the effect controller is
   the separate provenance field actingPlayer, read through movedByOpponentEffectV3 (what darkWorldDiscard uses). */
ok('E1: P1\'s discards are recorded as moved by P0\'s effect (P3 actingPlayer 0); P0\'s own are not',
  gameState.players[1].grave.every(c=>c.discardInfo&&c.discardInfo.byEffect&&movedByOpponentEffectV3(c,1)&&moveProvenanceOfV3(c).actingPlayer===0)
  &&gameState.players[0].grave.filter(c=>nm(c)!=='手札抹殺').every(c=>c.discardInfo&&!movedByOpponentEffectV3(c,0)),
  JSON.stringify(gameState.players[1].grave.map(c=>[c.discardInfo,moveProvenanceOfV3(c)])));
audit('E1');

/* E2 暗黒界の雷 legality: needs a face-down card on the field and a card in the hand */
fresh();
const th=mk('暗黒界の雷',0,'down');th.setTurn=2;gameState.players[0].sz=[th];gameState.players[0].hand=[mk('ワイト',0)];
gameState.players[1].mz=[mk('ワイト',1,'up')];
baselineA();
const L1=strictScriptLegalityV2('暗黒界の雷',0,'sz',0,{});
ok('E2: 暗黒界の雷 is illegal with no other face-down card on the field',!L1.ok,JSON.stringify(L1));
const s1=mk('サイクロン',1,'down');s1.setTurn=2;gameState.players[1].sz=[s1];
const L2=strictScriptLegalityV2('暗黒界の雷',0,'sz',0,{});
ok('E2: legal once the opponent has a set card',L2.ok,JSON.stringify(L2));
`);
