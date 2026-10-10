/* System v6 — Battle primitive 回帰テスト
   検証: 攻撃宣言 / 攻撃対象 / 直接攻撃 / 攻撃中止 / 攻撃対象消失 /
         attack replay（ルール上の巻き戻し） / 攻撃回数 / 追加攻撃 /
         Battle Step / Damage Step / ダメージ計算 / 戦闘破壊 / 戦闘ダメージ /
         provenance / metadata寿命 / uid世代 / SaveLoad / Undo / Redo /
         Action Journal / digest / System Replay                          */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let __u=97000;
function mkB(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos,uid:__u++};}
function resetB(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='battle';gameState.turn=3;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
function evts(name){return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt);}
function clearEvts(){gameState.deferredEvents=[];}
const BIG='青眼の白龍';     /* Lv8 3000/2500 */
const MID='ヂェミナイ・エルフ'; /* Lv4 1900/900 */
const ROCK='岩石の巨兵';     /* Lv3 1300/2000 */

/* =====================================================================
   1. 通常攻撃宣言 / ダメージ計算 / 戦闘破壊 / 戦闘ダメージイベント
   ===================================================================== */
resetB();
let atk=mkB(BIG),def=mkB(MID,1);
gameState.players[0].mz=[atk];gameState.players[1].mz=[def];
v41ResetActionJournal(gameState);clearEvts();
act({type:'ATTACK',player:0,atkIdx:0,target:0});
ok('戦闘: 攻撃側が勝ち相手モンスターが戦闘破壊確定',def.battleDestroyed===true);
ok('戦闘: 差分が戦闘ダメージになる',gameState.players[1].lp===8000-(3000-1900),'lp='+gameState.players[1].lp);
let bd=evts('onBattleDamage');
ok('戦闘ダメージイベント: 発火する',bd.length===1,JSON.stringify(bd));
ok('戦闘ダメージイベント: 金額を持つ',bd[0].amount===1100);
ok('戦闘ダメージイベント: 受けたプレイヤーを持つ',bd[0].player===1);
ok('戦闘ダメージイベント: 与えたプレイヤーを持つ',bd[0].dealtBy===0);
ok('戦闘ダメージイベント: 直接攻撃ではない',bd[0].direct===false);
ok('戦闘ダメージイベント: identity は uid',
   bd[0].attackerUid===atk.uid&&bd[0].defenderUid===def.uid);
ok('戦闘ダメージイベント: カード名を持たない',JSON.stringify(bd[0]).indexOf('青眼')<0);
ok('直接攻撃イベントは発火しない',evts('onDirectBattleDamage').length===0);
let lb=API.lastBattleContext();
ok('lastBattle identity: uid で攻撃者・被攻撃者が取れる',
   lb.attackerUid===atk.uid&&lb.defenderUid===def.uid&&lb.direct===false);
ok('lastBattle identity: 戦闘破壊の結果を持つ',lb.destroyedDefender===true&&lb.destroyedAttacker===false);
ok('lastBattle identity: 既存フィールドの意味を変えていない',
   gameState.lastBattle.atkName==='青眼の白龍'&&gameState.lastBattle.destroyedDef===true);

/* 相打ち・反射ダメージ */
resetB();
let a2=mkB(MID),d2=mkB(MID,1);
gameState.players[0].mz=[a2];gameState.players[1].mz=[d2];
v41ResetActionJournal(gameState);clearEvts();
act({type:'ATTACK',player:0,atkIdx:0,target:0});
ok('戦闘: 同値なら相打ち',a2.battleDestroyed===true&&d2.battleDestroyed===true);
ok('戦闘: 相打ちでは戦闘ダメージイベントが出ない',evts('onBattleDamage').length===0);
resetB();
let a3=mkB(ROCK),d3=mkB(BIG,1);
gameState.players[0].mz=[a3];gameState.players[1].mz=[d3];
v41ResetActionJournal(gameState);clearEvts();
act({type:'ATTACK',player:0,atkIdx:0,target:0});
ok('戦闘: 攻撃側が負けると自分がダメージを受ける',
   gameState.players[0].lp===8000-(3000-1300)&&a3.battleDestroyed===true);
bd=evts('onBattleDamage');
ok('戦闘ダメージイベント: 攻撃側が受けた場合も dealtBy が正しい',
   bd.length===1&&bd[0].player===0&&bd[0].dealtBy===1,JSON.stringify(bd));

/* 守備表示・貫通なし */
resetB();
let a4=mkB(BIG),d4=mkB(ROCK,1,'up','def');
gameState.players[0].mz=[a4];gameState.players[1].mz=[d4];
v41ResetActionJournal(gameState);clearEvts();
act({type:'ATTACK',player:0,atkIdx:0,target:0});
ok('戦闘: 守備表示を破壊しても貫通が無ければダメージ0',
   d4.battleDestroyed===true&&gameState.players[1].lp===8000);
ok('戦闘: 貫通なしでは戦闘ダメージイベントも出ない',evts('onBattleDamage').length===0);

/* =====================================================================
   2. 直接攻撃
   ===================================================================== */
resetB();
let da=mkB(MID);
gameState.players[0].mz=[da];gameState.players[1].mz=[];
v41ResetActionJournal(gameState);clearEvts();
act({type:'ATTACK',player:0,atkIdx:0,target:'direct'});
ok('直接攻撃: 攻撃力分のダメージ',gameState.players[1].lp===8000-1900);
bd=evts('onBattleDamage');
ok('直接攻撃: onBattleDamage が direct で出る',bd.length===1&&bd[0].direct===true&&bd[0].defenderUid===null);
ok('直接攻撃: onDirectBattleDamage も出る',evts('onDirectBattleDamage').length===1);
ok('直接攻撃: lastBattle が direct を記録する',API.lastBattleContext().direct===true);

/* 直接攻撃許可（他のカードから与える） */
resetB();
let g1=mkB(ROCK),block=mkB(MID,1);
gameState.players[0].mz=[g1];gameState.players[1].mz=[block];
v41ResetActionJournal(gameState);
ok('直接攻撃許可: 既定では直接攻撃できない',API.canDirectAttackNow(g1)===false);
API.grantDirectAttack({p:0,zone:'mz',index:0,card:g1});
ok('直接攻撃許可: 付与すると直接攻撃できる',API.canDirectAttackNow(g1)===true);
ok('直接攻撃許可: カード上に純JSONで載る',
   JSON.stringify(g1.battlePermission)==='{"directAttackTurn":3}',JSON.stringify(g1.battlePermission));
ok('直接攻撃許可: 他のモンスターには波及しない',
   API.canDirectAttackNow(gameState.players[1].mz[0])===false);
/* ターンが変われば失効する */
gameState.turn=4;
ok('直接攻撃許可: 次のターンには失効する',API.canDirectAttackNow(g1)===false);
gameState.turn=3;
/* 場を離れたら消える（ZONE_LOCAL_KEYS） */
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
ok('metadata寿命: 場を離れると battlePermission が消える',
   findCardByUid(g1.uid).card.battlePermission===undefined,
   JSON.stringify(findCardByUid(g1.uid).card.battlePermission));

/* =====================================================================
   3. 攻撃回数 / 追加攻撃
   ===================================================================== */
resetB();
let ac=mkB(BIG),t1=mkB(ROCK,1),t2=mkB(ROCK,1);
gameState.players[0].mz=[ac];gameState.players[1].mz=[t1,t2];
v41ResetActionJournal(gameState);
act({type:'ATTACK',player:0,atkIdx:0,target:0});
ok('攻撃回数: 攻撃すると attackCount が立つ',ac.attackCount===1&&ac.attacked===true);
ok('攻撃回数: 既定の攻撃可能回数は1',Math.max(1,Number(ac.attackLimit)||1)===1);
act({type:'GRANT_EXTRA_ATTACK_V48',player:0,zone:'mz',index:0,n:1});
ok('追加攻撃: 既存 Action で攻撃可能回数が増える',Number(ac.attackLimit)>=2,'limit='+ac.attackLimit);
/* 全体攻撃の許可 */
resetB();
let ma=mkB(BIG);
gameState.players[0].mz=[ma];gameState.players[1].mz=[mkB(ROCK,1),mkB(ROCK,1)];
v41ResetActionJournal(gameState);
ok('全体攻撃: 既定では許可されていない',grantedMultiAttackV6(ma,gameState)===false);
API.grantMultiAttack({p:0,zone:'mz',index:0,card:ma});
ok('全体攻撃: 付与すると許可される',grantedMultiAttackV6(ma,gameState)===true);
ok('全体攻撃: ターン番号で持つ（無制限履歴を作らない）',
   ma.battlePermission.multiAttackTurn===3&&Object.keys(ma.battlePermission).length===1);

/* =====================================================================
   4. Battle Step / Damage Step / 攻撃対象の差し替え・消失
   ===================================================================== */
resetB();
let sa=mkB(BIG),sd=mkB(MID,1),sd2=mkB(ROCK,1);
gameState.players[0].mz=[sa];gameState.players[1].mz=[sd,sd2];
v41ResetActionJournal(gameState);
startBattle(0,0,0);
ok('Battle Step: 戦闘状態が作られる',!!gameState.battle&&gameState.battle.step==='start');
let bc=API.battleContext();
ok('Battle Step: 進行中の identity が uid で取れる',
   bc.attackerUid===sa.uid&&bc.defenderUid===sd.uid&&bc.direct===false);
ok('Battle Step: ダメージ計算前は攻撃対象を差し替えられる',canRedirectAttackV6(gameState)===true);
ok('攻撃対象の差し替え: 別のモンスターへ変更できる',
   API.redirectAttack({targetUid:sd2.uid})===true&&gameState.battle.targetUid===sd2.uid);
ok('攻撃対象の差し替え: 直接攻撃へ変更できる',
   API.redirectAttack({toDirect:true})===true&&gameState.battle.target==='direct'&&gameState.battle.targetUid===null);
ok('攻撃対象の差し替え: 記録は純JSON',
   JSON.stringify(gameState.battle.redirectV6)==='{"toDirect":true}');
ok('攻撃対象の差し替え: 場にいないuidは拒否される',API.redirectAttack({targetUid:999999})===false);
/* ダメージ計算後は差し替えられない */
gameState.battle.step='calc';
ok('攻撃対象の差し替え: ダメージ計算に入った後は不可',
   canRedirectAttackV6(gameState)===false&&API.redirectAttack({targetUid:sd.uid})===false);
/* 攻撃対象が消失したら attack replay（ルール上の巻き戻し）が必要 */
resetB();
let ra=mkB(BIG),rd=mkB(MID,1);
gameState.players[0].mz=[ra];gameState.players[1].mz=[rd];
v41ResetActionJournal(gameState);
let decl={player:0,attackerUid:ra.uid,targetUid:rd.uid,defenderSnapshot:defenderSnapshotV28(0)};
ok('attack replay: 盤面が変わらなければ巻き戻し不要',attackReplayNeededV28(decl)===false);
act({type:'FX_TO_GRAVE',player:1,zone:'mz',index:0,reason:'攻撃対象が除去された',byDestroy:true});
ok('attack replay: 攻撃対象が消えたら巻き戻しが必要',attackReplayNeededV28(decl)===true);
ok('attack replay は System Replay とは別概念（命名が衝突していない）',
   typeof attackReplayNeededV28==='function'&&typeof v44ReplayAuditPackage==='function');
/* 攻撃中止 */
resetB();
let ca=mkB(BIG),cd=mkB(MID,1);
gameState.players[0].mz=[ca];gameState.players[1].mz=[cd];
v41ResetActionJournal(gameState);
startBattle(0,0,0);
ok('攻撃中止: 前提として戦闘中',!!gameState.battle);
cancelBattle();
ok('攻撃中止: 戦闘状態が破棄される',gameState.battle===null);
ok('攻撃中止: 相手モンスターは無傷',!cd.battleDestroyed&&gameState.players[1].mz.length===1);

/* =====================================================================
   5. バトルフェイズ制御 / バトルフェイズ終了時
   ===================================================================== */
resetB();
v41ResetActionJournal(gameState);
ok('バトルフェイズ: 既定ではスキップされない',battlePhaseSkippedV6(gameState,0)===false);
API.skipNextBattlePhase(0);
ok('バトルフェイズ: スキップを予約できる',battlePhaseSkippedV6(gameState,0)===true);
ok('バトルフェイズ: 相手には波及しない',battlePhaseSkippedV6(gameState,1)===false);
act({type:'BATTLE_PHASE_V6',player:0,mode:'consumeSkip'});
ok('バトルフェイズ: スキップは1回で消費される',battlePhaseSkippedV6(gameState,0)===false);
API.repeatBattlePhase(0,1);
ok('バトルフェイズ: 追加回数を予約できる',battlePhaseRepeatV6(gameState,0)===1);
act({type:'BATTLE_PHASE_V6',player:0,mode:'consumeRepeat'});
ok('バトルフェイズ: 追加回数は消費される',battlePhaseRepeatV6(gameState,0)===0);
resetB();
let eb=mkB(BIG);gameState.players[0].mz=[eb];
v41ResetActionJournal(gameState);
startBattle(0,0,'direct');
API.endBattlePhase();
ok('バトルフェイズ: 即時終了で戦闘状態が破棄される',gameState.battle===null);
ok('バトルフェイズ: 終了ターンが記録される',gameState.battlePhaseV6.endedTurn===3);
ok('バトルフェイズ state は純JSON',assertBattleStateSerializableV6(gameState).ok,
   assertBattleStateSerializableV6(gameState).why);

/* =====================================================================
   6. uid 世代 / metadata 寿命
   ===================================================================== */
resetB();
let gen=mkB(MID);gameState.players[0].mz=[gen];
v41ResetActionJournal(gameState);
API.grantDirectAttack({p:0,zone:'mz',index:0,card:gen});
ok('世代: 許可が付いている',API.canDirectAttackNow(gen)===true);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
let back=findCardByUid(gen.uid);
ok('世代: 墓地へ行くと許可が消える',!back.card.battlePermission);
act({type:'FX_SPECIAL_SUMMON',player:0,from:'grave',fromIndex:back.index,pos:'atk',reason:'蘇生'});
ok('世代: 同じ uid で場に戻っても古い許可は復活しない',
   API.canDirectAttackNow(findCardByUid(gen.uid).card)===false);

/* =====================================================================
   7. Replay / Undo / Redo / SaveLoad / Journal / digest
   ===================================================================== */
resetB();
let pa=mkB(BIG),pd=mkB(MID,1);
gameState.players[0].mz=[pa];gameState.players[1].mz=[pd];
v41ResetActionJournal(gameState);
let digestBefore=v41StateDigest(gameState);
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: 戦闘前は battlePermission が digest に出ない',
   textBefore.indexOf('battlePermission')<0);
API.grantDirectAttack({p:0,zone:'mz',index:0,card:pa});
act({type:'ATTACK',player:0,atkIdx:0,target:0});
act({type:'BATTLE_PHASE_V6',player:0,mode:'skipNext'});
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('System Replay: 戦闘を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let types=V41_ACTION_JOURNAL.map(e=>e.action.type);
ok('Action Journal: ATTACK が記録される',types.includes('ATTACK'));
ok('Action Journal: BATTLE_GRANT_V6 が記録される',types.includes('BATTLE_GRANT_V6'));
ok('Action Journal: BATTLE_PHASE_V6 が記録される',types.includes('BATTLE_PHASE_V6'));
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 復元後も戦闘許可が読める',
   findCardByUid(pa.uid).card.battlePermission.directAttackTurn===3);
ok('SaveLoad: 復元後もバトルフェイズ制御が読める',battlePhaseSkippedV6(gameState,0)===true);
ok('SaveLoad: 復元後も lastBattle identity が uid で読める',
   API.lastBattleContext().attackerUid===pa.uid);
undo();
ok('Undo: バトルフェイズ制御が巻き戻る',battlePhaseSkippedV6(gameState,0)===false);
undo();
ok('Undo: 戦闘が巻き戻る',!findCardByUid(pd.uid).card.battleDestroyed&&gameState.players[1].lp===8000);
undo();
ok('Undo: 戦闘許可が巻き戻る',!findCardByUid(pa.uid).card.battlePermission);
ok('Undo: 全て巻き戻すと元の digest に一致する',v41StateDigest(gameState)===digestBefore,
   'before='+digestBefore+' now='+v41StateDigest(gameState));
redo();redo();redo();
ok('Redo: 戦闘許可・戦闘・バトルフェイズ制御が復元される',
   findCardByUid(pa.uid).card.battlePermission.directAttackTurn===3&&
   gameState.players[1].lp<8000&&battlePhaseSkippedV6(gameState,0)===true);

/* 直列化の健全性 */
function scanFnsB(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsB(v[k],d+1)); }
ok('Battle 直列化: gameState 全体に関数が混入していない',
   !scanFnsB(JSON.parse(JSON.stringify(gameState)),0));
ok('Battle 直列化: 追加 state に Map/Set/DOM が無い',assertBattleStateSerializableV6(gameState).ok);
ok('Battle: gameState に無制限の戦闘履歴を作っていない',
   gameState.battleLog===undefined&&gameState.battleHistory===undefined);

/* =====================================================================
   8. 既存 hook を壊していないこと
   ===================================================================== */
ok('既存維持: continuous.battleDamage フックが残っている',typeof applyBattleDamageFilters==='function');
ok('既存維持: continuous.piercingDamage フックが残っている',typeof applyPiercingDamage==='function');
ok('既存維持: cannotAttack / mustAttack が残っている',
   typeof cannotAttackNow==='function'&&typeof mustAttackNow==='function');
ok('既存維持: negateAttack が残っている',typeof API.negateAttack==='function');
ok('既存維持: grantAdditionalAttack が残っている',typeof API.grantAdditionalAttack==='function');
ok('既存維持: Damage Step の発動可否判定が残っている',
   typeof damageStepResponseLegalV28==='function'&&typeof canModifyNow==='function');
ok('既存維持: BattlePhase と DamageStep が別概念のまま',
   typeof battleStepIndex==='function'&&typeof DAMAGE_STEPS!=='undefined'&&DAMAGE_STEPS.length>1);
ok('既存維持: noBattlePhase フラグは従来どおり',
   (()=>{resetB();gameState.players[0].temporaryFlags={noBattlePhase:true};
         return battlePhaseForbiddenV340(gameState)==='effect';})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}

