/* S03-U20 BATTLE_DAMAGE_BEFORE_DESTRUCTION
   Requirement: battle damage is calculated (③-ⅳ) before battle destruction is determined (③-ⅴ), so a monster that is destroyed in
   the battle still applies its own damage text to that battle: 「このカードの戦闘で発生する自分への戦闘ダメージは0」
   (マジック・ストライカー, レスキュー・ウォリアー), 「このカードが戦闘を行う事によって受けるコントローラーの戦闘ダメージは0」
   (アマゾネスの格闘戦士, モンク・ファイター; 2011 wiki: the monster is destroyed, only its controller's damage becomes 0),
   「このカードの攻撃で発生するお互いの戦闘ダメージは0」 (ボマー・ドラゴン).
   Before the fix: processAttack marked the monster battle-destroyed before dealing damage, and confirmed battle-destroyed monsters
   supply no continuous effects, so their controller took the damage. Found by vertical slice #4 (ジェネティック・ワーウルフ
   destroying マジック・ストライカー dealt 1400).
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
function settle(){for(let k=0;k<16;k++){const r=drive();if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}
/* atkSpec / defSpec: [name, pos]; the attacker belongs to player 'attacker', the defender to the other player. */
function battle(attacker,atkSpec,defSpec){
  fresh();const def=1-attacker;
  const atkCard=mk(atkSpec[0],attacker,'up',atkSpec[1]||'atk'),defCard=mk(defSpec[0],def,'up',defSpec[1]||'atk');
  gameState.players[attacker].mz=[atkCard];gameState.players[def].mz=[defCard];
  gameState.activePlayer=attacker;gameState.phase='battle';baselineA();
  const lp=[gameState.players[0].lp,gameState.players[1].lp];
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:attacker,atkIdx:0,target:0});settle();
  return {atk:atkCard,def:defCard,d0:lp[0]-gameState.players[0].lp,d1:lp[1]-gameState.players[1].lp};
}
function info(r){return JSON.stringify({d0:r.d0,d1:r.d1,atk:nm(r.atk)+':'+zoneOf(r.atk),def:nm(r.def)+':'+zoneOf(r.def),log:(gameState.log||[]).slice(0,4).map(x=>x.msg||x),toasts:TOASTS.slice(-2)});}

/* ===== マジック・ストライカー is attacked and destroyed ===== */
let r=battle(1,['ジェネティック・ワーウルフ'],['マジック・ストライカー']);
ok('マジック・ストライカー attacked by ジェネティック・ワーウルフ: it is destroyed and its controller takes no battle damage',zoneOf(r.def)==='grave'&&r.d0===0&&r.d1===0,info(r));
replay('マジック・ストライカー attacked');

/* ===== マジック・ストライカー attacks a stronger monster ===== */
r=battle(0,['マジック・ストライカー'],['ジェネティック・ワーウルフ']);
ok('マジック・ストライカー attacks ジェネティック・ワーウルフ: it is destroyed and its controller takes no battle damage',zoneOf(r.atk)==='grave'&&zoneOf(r.def)==='mz'&&r.d0===0,info(r));
replay('マジック・ストライカー attacks');

/* ===== レスキュー・ウォリアー: destroyed / destroying ===== */
r=battle(1,['ジェネティック・ワーウルフ'],['レスキュー・ウォリアー']);
ok('レスキュー・ウォリアー attacked by ジェネティック・ワーウルフ: it is destroyed and its controller takes no battle damage',zoneOf(r.def)==='grave'&&r.d0===0,info(r));
replay('レスキュー・ウォリアー attacked');
r=battle(0,['レスキュー・ウォリアー'],['ワイト']);
ok('レスキュー・ウォリアー attacks ワイト: the opponent still takes 1300',zoneOf(r.def)==='grave'&&zoneOf(r.atk)==='mz'&&r.d1===1300&&r.d0===0,info(r));

/* ===== アマゾネスの格闘戦士 attacks a stronger monster (2011 wiki: destroyed; only its controller's damage is 0) ===== */
r=battle(0,['アマゾネスの格闘戦士'],['ジェネティック・ワーウルフ']);
ok('アマゾネスの格闘戦士 attacks ジェネティック・ワーウルフ: it is destroyed and its controller takes no battle damage',zoneOf(r.atk)==='grave'&&r.d0===0,info(r));
replay('アマゾネスの格闘戦士 attacks');

/* ===== モンク・ファイター in defense position takes a piercing attack ===== */
r=battle(1,['E・HERO エッジマン'],['モンク・ファイター','def']);
ok('モンク・ファイター (DEF 1000) attacked by E・HERO エッジマン: it is destroyed and the piercing damage to its controller is 0',zoneOf(r.def)==='grave'&&r.d0===0,info(r));
replay('モンク・ファイター pierced');
r=battle(1,['E・HERO エッジマン'],['ワイト','def']);
ok('control: ワイト (DEF 200) attacked by E・HERO エッジマン takes 2400 piercing damage',zoneOf(r.def)==='grave'&&r.d0===2400,info(r));

/* ===== ボマー・ドラゴン attacks a stronger monster ===== */
r=battle(0,['ボマー・ドラゴン'],['ジェネティック・ワーウルフ']);
ok('ボマー・ドラゴン attacks ジェネティック・ワーウルフ: it is destroyed and neither player takes battle damage',zoneOf(r.atk)==='grave'&&r.d0===0&&r.d1===0,info(r));
replay('ボマー・ドラゴン attacks');

/* ===== control: a monster without such text ===== */
r=battle(1,['ジェネティック・ワーウルフ'],['ワイト']);
ok('control: ワイト attacked by ジェネティック・ワーウルフ is destroyed and its controller takes 1700',zoneOf(r.def)==='grave'&&r.d0===1700,info(r));
replay('control ワイト');
`);
