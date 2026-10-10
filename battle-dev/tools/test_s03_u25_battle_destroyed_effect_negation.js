/* S03-U25 BATTLE_DESTROYED_EFFECT_NEGATION
   Requirement: 「このカードが戦闘で（によって）破壊した（相手／効果）モンスターの効果は無効化される」 negates the effect the destroyed
   monster activates from the GY because of that battle destruction.
   2011 wiki: for ワーム・ウォーロード this is a continuous effect, and in mutual destruction it cannot negate effects conditioned on
   「戦闘破壊された」; for 漆黒の魔王 LV6, the activated effect of the destroyed キラー・トマト is negated.
   Before the fix: the scripts put a zone-local negation on the destroyed monster while it was still on the field; it was erased when the
   monster was sent to the GY, and chain resolution never checked GY-activated effects, so 紫炎の足軽 still Special Summoned.
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
function settle(){for(let k=0;k<30;k++){const r=drive();if(r==='evt'){EVT_V2_STATE.groups.flat().forEach(c=>SEEN.push(c.name));const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank];if(g&&g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));return pkg;}
function chained(pkg,name){return pkg.actions.map(x=>x&&x.action).some(x=>x&&x.type==='CHAIN_ADD'&&x.name===name);}
/* P1 attacks P2's first monster; build() runs after the reset. */
function battle(build){fresh();SEEN=[];const b=build();gameState.activePlayer=0;gameState.phase='battle';baselineA();
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});settle();return b;}
function footBoard(attackers){return ()=>{const mine=attackers.map(n=>mk(n,0));const foot=mk('紫炎の足軽',1),pay=mk('六武衆の露払い',1,'down');
  gameState.players[0].mz=mine;gameState.players[1].mz=[foot];gameState.players[1].deck=[pay,mk('ワイト',1,'down')];return {mine,foot,pay};};}

/* ===== 漆黒の魔王 LV4 destroys 紫炎の足軽 ===== */
let B=battle(footBoard(['漆黒の魔王 LV4']));
let pkg=audit('漆黒の魔王 LV4');
ok('漆黒の魔王 LV4 destroys 紫炎の足軽: its trigger is activated, but its effect is negated — nothing is Special Summoned',
  zoneOf(B.foot)==='grave'&&chained(pkg,'紫炎の足軽')&&zoneOf(B.pay)==='deck'&&gameState.players[1].mz.length===0,
  JSON.stringify({pay:zoneOf(B.pay),mz1:gameState.players[1].mz.map(nm),seen:SEEN}));
ok('the destroyed 紫炎の足軽 records 漆黒の魔王 LV4 as its battle destroyer',!!B.foot.graveInfo&&B.foot.graveInfo.battleNegatorUidS03===B.mine[0].uid,JSON.stringify(B.foot.graveInfo));

/* ===== ワーム・ウォーロード destroys 紫炎の足軽 ===== */
B=battle(footBoard(['ワーム・ウォーロード']));
pkg=audit('ワーム・ウォーロード');
ok('ワーム・ウォーロード destroys 紫炎の足軽: the trigger is negated; ワーム・ウォーロード can still attack once more',
  zoneOf(B.foot)==='grave'&&chained(pkg,'紫炎の足軽')&&zoneOf(B.pay)==='deck'&&Number(B.mine[0].attackLimit)>=2,
  JSON.stringify({pay:zoneOf(B.pay),limit:B.mine[0].attackLimit,seen:SEEN}));

/* ===== エレメント・デビル with an EARTH monster on the field ===== */
B=battle(footBoard(['エレメント・デビル','ジェネティック・ワーウルフ']));
audit('エレメント・デビル (EARTH)');
ok('エレメント・デビル destroys 紫炎の足軽 while the EARTH ジェネティック・ワーウルフ is on the field: the trigger is negated',
  zoneOf(B.foot)==='grave'&&zoneOf(B.pay)==='deck',JSON.stringify({pay:zoneOf(B.pay),seen:SEEN}));

/* ===== エレメント・デビル without an EARTH monster: no negation ===== */
B=battle(footBoard(['エレメント・デビル']));
audit('エレメント・デビル (no EARTH)');
ok('エレメント・デビル destroys 紫炎の足軽 with no EARTH monster left on the field: the trigger resolves and Special Summons 六武衆の露払い',
  zoneOf(B.foot)==='grave'&&zoneOf(B.pay)==='mz',JSON.stringify({pay:zoneOf(B.pay),seen:SEEN}));

/* ===== mutual destruction: 漆黒の魔王 LV4 (1000) vs クリッター (1000) ===== */
B=battle(()=>{const lv4=mk('漆黒の魔王 LV4',0),crit=mk('クリッター',1),w=mk('ワイト',1,'down');gameState.players[0].mz=[lv4];gameState.players[1].mz=[crit];gameState.players[1].deck=[w];return {lv4,crit,w};});
audit('mutual destruction');
ok('mutual destruction (2011 wiki): 漆黒の魔王 LV4 and クリッター destroy each other; クリッター’s effect is not negated and adds ワイト',
  zoneOf(B.lv4)==='grave'&&zoneOf(B.crit)==='grave'&&zoneOf(B.w)==='hand'&&!(B.crit.graveInfo&&B.crit.graveInfo.battleNegatorUidS03!=null),
  JSON.stringify({w:zoneOf(B.w),gi:B.crit.graveInfo,seen:SEEN}));

/* ===== control: a destroyer without the negation ===== */
B=battle(footBoard(['ジェネティック・ワーウルフ']));
audit('control ジェネティック・ワーウルフ');
ok('control: ジェネティック・ワーウルフ destroys 紫炎の足軽: it Special Summons 六武衆の露払い, and its graveInfo carries no battle destroyer',
  zoneOf(B.pay)==='mz'&&!!B.foot.graveInfo&&!('battleNegatorUidS03' in B.foot.graveInfo),JSON.stringify({pay:zoneOf(B.pay),gi:B.foot.graveInfo}));
`);
