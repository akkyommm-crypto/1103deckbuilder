/* S03-U23 BATTLE_DESTROY_TRIGGER_TIMING
   Requirement: triggers 「戦闘で（相手）モンスターを破壊し墓地へ送った時」 and 「このカードが（モンスターとの）戦闘で破壊された場合」
   are offered once the destroyed monster has been sent to the GY (damage step ⑤), and resolve as their text says.
   Before the fix: seven scripts declared dsTiming 'after' (④ ダメージ計算後) while their condition requires the destroyed monster
   in the GY. At ④ it is still on the field (battle destruction is only confirmed); it moves at ⑤, where the 'after' scripts are
   not collected. None of the seven was ever offered in a real duel.
   Every card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
let SEEN=[];
function settle(){for(let k=0;k<24;k++){const r=drive();if(r==='evt'){EVT_V2_STATE.groups.flat().forEach(c=>SEEN.push(c.name));const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank];if(g&&g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));return pkg;}
function chained(pkg,name){return pkg.actions.map(x=>x&&x.action).some(x=>x&&x.type==='CHAIN_ADD'&&x.name===name);}
/* build() runs after the reset and returns the named cards; P1 attacks P2's first monster. */
function battle(build){fresh();SEEN=[];const b=build();gameState.activePlayer=0;gameState.phase='battle';baselineA();
  b.lp=[gameState.players[0].lp,gameState.players[1].lp];
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});settle();
  b.loss=[b.lp[0]-gameState.players[0].lp,b.lp[1]-gameState.players[1].lp];return b;}
function mzNames(p){return gameState.players[p].mz.map(nm);}

/* ===== ヘル・ツイン・コップ ===== */
let B=battle(()=>{const cop=mk('ヘル・ツイン・コップ',0),w=mk('ワイト',1);gameState.players[0].mz=[cop];gameState.players[1].mz=[w];return {cop,w};});
let pkg=audit('ヘル・ツイン・コップ');
ok('ヘル・ツイン・コップ destroys ワイト and sends it to the GY: its trigger is offered; ATK 3000 and one more attack this turn',
  zoneOf(B.w)==='grave'&&SEEN.includes('ヘル・ツイン・コップ')&&chained(pkg,'ヘル・ツイン・コップ')&&curATK(B.cop)===3000&&Number(B.cop.attackLimit)>=2&&B.cop.attackLimitTurn===gameState.turn,
  JSON.stringify({atk:curATK(B.cop),limit:B.cop.attackLimit,seen:SEEN,toasts:TOASTS}));

/* ===== ワーム・ウォーロード ===== */
B=battle(()=>{const worm=mk('ワーム・ウォーロード',0),w=mk('ワイト',1);gameState.players[0].mz=[worm];gameState.players[1].mz=[w];return {worm,w};});
audit('ワーム・ウォーロード');
ok('ワーム・ウォーロード destroys ワイト: its trigger is offered and it can attack once more',zoneOf(B.w)==='grave'&&SEEN.includes('ワーム・ウォーロード')&&Number(B.worm.attackLimit)>=2,JSON.stringify({limit:B.worm.attackLimit,seen:SEEN}));

/* ===== ライトニング・ウォリアー ===== */
B=battle(()=>{const lw=mk('ライトニング・ウォリアー',0),w=mk('ワイト',1);gameState.players[0].mz=[lw];gameState.players[1].mz=[w];gameState.players[1].hand=[mk('ワイト',1),mk('ワイト',1)];return {lw,w};});
audit('ライトニング・ウォリアー');
ok('ライトニング・ウォリアー destroys ワイト: 2100 battle damage, then 2 cards in the opponent’s hand × 300 = 600',zoneOf(B.w)==='grave'&&SEEN.includes('ライトニング・ウォリアー')&&B.loss[1]===2700,JSON.stringify({loss:B.loss,seen:SEEN}));

/* ===== ハイドロゲドン ===== */
B=battle(()=>{const hy=mk('ハイドロゲドン',0),w=mk('ワイト',1);const hy2=mk('ハイドロゲドン',0,'down');gameState.players[0].mz=[hy];gameState.players[1].mz=[w];gameState.players[0].deck=[hy2,mk('ワイト',0,'down')];return {hy,w,hy2};});
audit('ハイドロゲドン');
ok('ハイドロゲドン destroys ワイト: it Special Summons 「ハイドロゲドン」 from the Deck',zoneOf(B.w)==='grave'&&zoneOf(B.hy2)==='mz'&&mzNames(0).filter(n=>n==='ハイドロゲドン').length===2,JSON.stringify({mz:mzNames(0),seen:SEEN}));

/* ===== フレムベル・ヘルドッグ ===== */
B=battle(()=>{const dog=mk('フレムベル・ヘルドッグ',0),w=mk('ワイト',1);const aitsu=mk('アイツ',0,'down');gameState.players[0].mz=[dog];gameState.players[1].mz=[w];gameState.players[0].deck=[aitsu,mk('ワイト',0,'down')];return {dog,w,aitsu};});
audit('フレムベル・ヘルドッグ');
ok('フレムベル・ヘルドッグ destroys ワイト: it Special Summons a FIRE monster with DEF 200 or less (アイツ) from the Deck',zoneOf(B.w)==='grave'&&zoneOf(B.aitsu)==='mz',JSON.stringify({mz:mzNames(0),seen:SEEN,toasts:TOASTS}));

/* ===== A・O・J リーサル・ウェポン ===== */
B=battle(()=>{const aoj=mk('A・O・J リーサル・ウェポン',0),light=mk('ロケット戦士',1);const top=mk('ワイト',0,'down');gameState.players[0].mz=[aoj];gameState.players[1].mz=[light];gameState.players[0].deck=[top,mk('ワイト',0,'down')];return {aoj,light,top};});
audit('A・O・J リーサル・ウェポン');
ok('A・O・J リーサル・ウェポン destroys the LIGHT ロケット戦士 on the opponent’s side: it draws 1, and the drawn Level 1 DARK ワイト may be Special Summoned',
  zoneOf(B.light)==='grave'&&SEEN.includes('A・O・J リーサル・ウェポン')&&gameState.players[0].deck.length===1&&(zoneOf(B.top)==='mz'||zoneOf(B.top)==='hand'),JSON.stringify({top:zoneOf(B.top),deck:gameState.players[0].deck.length,seen:SEEN}));

/* ===== 電磁ミノ虫 ===== */
B=battle(()=>{const wolf=mk('ジェネティック・ワーウルフ',0),mino=mk('電磁ミノ虫',1);gameState.players[0].mz=[wolf];gameState.players[1].mz=[mino];return {wolf,mino};});
audit('電磁ミノ虫');
ok('電磁ミノ虫 destroyed by ジェネティック・ワーウルフ: its trigger lowers the destroyer’s ATK/DEF by 500 (1500 / 0)',zoneOf(B.mino)==='grave'&&SEEN.includes('電磁ミノ虫')&&curATK(B.wolf)===1500&&curDEF(B.wolf)===0,JSON.stringify({atk:curATK(B.wolf),def:curDEF(B.wolf),seen:SEEN}));

/* ===== control: 「破壊した場合」 at ④ keeps working ===== */
B=battle(()=>{const ape=mk('ファイターズ・エイプ',0),w=mk('ワイト',1);gameState.players[0].mz=[ape];gameState.players[1].mz=[w];return {ape,w};});
audit('control ファイターズ・エイプ');
ok('control: ファイターズ・エイプ destroys ワイト and gains 300 (2200)',zoneOf(B.w)==='grave'&&curATK(B.ape)===2200,JSON.stringify({atk:curATK(B.ape)}));
`);
