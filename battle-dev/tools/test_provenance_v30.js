/* System v30 B1/B2/B3 provenance + 解禁3枚。positive / negative / ruling edge / Replay。 */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;
  gameState.phase='main1';gameState.turn=6;PLAY_MODE=PLAY_MODES.DUEL;
  HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();
  v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  API.confirm=(t,m,yes,no)=>{ if(no) no(); };
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function h(c){return locateCardAnyV4(c);}
function ctxE(p,card,evname,evt,zone){const loc=h(card);
  const c=makeContext(p,card,zone||(loc&&loc.zone)||'sz',(loc&&loc.index)||0,evname,{event:evt});
  if(evt)c.event=evt;return c;}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function realAttack(p,mzIndex,target){
  act({type:'ATTACK_DECLARE_V48',player:p,mzIndex:mzIndex});
  act({type:'ATTACK',player:p,atkIdx:mzIndex,target:target});
}
function pickFirst(){API.selectCard=(t,list,cb)=>cb(list[0]);}

const PLAIN='ワイト';            /* GENERIC_OK lv1 */
const BIG='青眼の白龍';           /* GENERIC_OK lv8 */
const CYC='サイクロン';
const ZOMB='ゾンビタイガー';       /* アンデット族 */
const NONZOMB='E・HERO クレイマン'; /* 戦士族 */

/* ===== 登録確認 ===== */
['コザッキーの自爆装置','王墓の罠','破壊神の系譜'].forEach(n=>
  ok('v30 registration '+n, !!CARD_SCRIPTS[n]));
ok('前提: 青眼の白龍はレベル8', dbOf({id:findCardIndex(BIG)}).lv===8);
ok('前提: ゾンビタイガーはアンデット族', dbOf({id:findCardIndex(ZOMB)}).ra==='アンデット');
ok('前提: E・HERO クレイマンはアンデット族ではない', dbOf({id:findCardIndex(NONZOMB)}).ra!=='アンデット');

/* ================= B1 primitive ================= */
reset0();
ok('B1 primitive: チェーン外の破壊では破壊者を推測しない', destroyerPlayerV30(gameState,{})===null);
gameState.chain=[{name:CYC,player:1,cardId:findCardIndex(CYC)}];
ok('B1 primitive: 解決中リンクの発動プレイヤーが破壊者になる', destroyerPlayerV30(gameState,{})===1);
ok('B1 primitive: 明示指定は解決中リンクより優先される', destroyerPlayerV30(gameState,{byPlayer:0})===0);
gameState.chain=[];

reset0();
let t1=mk('落とし穴',1,'down');gameState.players[1].sz=[t1];
gameState.chain=[{name:CYC,player:0,cardId:findCardIndex(CYC)}];
API.destroy(h(t1),'v30');
ok('B1 positive: 効果破壊で graveInfo.byPlayer が入る',
   gameState.players[1].grave[0].graveInfo.byPlayer===0);
ok('B1 positive: onDestroy にも byPlayer が乗る',
   (gameState.deferredEvents||[]).some(e=>e.eventName==='onDestroy'&&e.evt.byPlayer===0));
reset0();
let t1b=mk('落とし穴',1,'down');gameState.players[1].sz=[t1b];
API.destroy(h(t1b),'v30',1);
ok('B1 ruling: 明示 byPlayer で「別のプレイヤーが破壊した」を表現できる',
   gameState.players[1].grave[0].graveInfo.byPlayer===1);
reset0();
let t1c=mk('落とし穴',1,'down');gameState.players[1].sz=[t1c];
API.destroy(h(t1c),'v30');
ok('B1 negative: 破壊者不明ならあくまで null（0 に丸めない）',
   gameState.players[1].grave[0].graveInfo.byPlayer===null);
reset0();
let t1d=mk('落とし穴',1,'down');gameState.players[1].sz=[t1d];
gameState.chain=[{name:CYC,player:0,cardId:findCardIndex(CYC)}];
API.sendToGrave(h(t1d),'v30');
ok('B1 negative: 破壊でない墓地送りは byDestroy=false のまま',
   gameState.players[1].grave[0].graveInfo.byDestroy===false);
reset0();
let ba=mk(BIG,0),bd=mk(PLAIN,1,'up','def');
gameState.players[0].mz=[ba];gameState.players[1].mz=[bd];
bd.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
ok('B1 ruling: 戦闘破壊の byPlayer は従来どおり相手側',
   gameState.players[1].grave[0].graveInfo.byPlayer===0);

/* ================= B2 primitive ================= */
reset0();
let z1=mk(ZOMB,1);gameState.players[1].grave=[z1];
API.specialSummon(0,'grave',0,'atk','v30',1);
let sm=gameState.players[0].mz[0];
ok('B2 positive: 取り出し元プレイヤーが残る', specialSummonFromPlayerV30(sm)===1);
ok('B2 positive: 相手の墓地からの特殊召喚と判定できる',
   summonedFromOpponentV30(sm,0,'grave')===true);
ok('B2 ruling: ゾーン違い（除外指定）では一致しない',
   summonedFromOpponentV30(sm,0,'banish')===false);
reset0();
let z2=mk(ZOMB,0);gameState.players[0].grave=[z2];
API.specialSummon(0,'grave',0,'atk','v30',0);
let sm2=gameState.players[0].mz[0];
ok('B2 negative: 自分の墓地からなら相手由来にならない',
   summonedFromOpponentV30(sm2,0,'grave')===false);
ok('B2 negative: fromPlayer 省略時も自分側として扱う',
   specialSummonFromPlayerV30(sm2)===0);
reset0();
let z3=mk(ZOMB,1);gameState.players[1].grave=[z3];
API.specialSummon(0,'grave',0,'atk','v30',1);
let sm3=gameState.players[0].mz[0];
API.destroy(h(sm3),'v30');
ok('B2 ruling: 場を離れたら召喚由来は消える（領域ローカル）',
   gameState.players[1].grave.slice(-1)[0].specialSummonedFromPlayer===undefined);

/* ================= B3 primitive ================= */
reset0();
let d1=mk(PLAIN,1,'up','def');gameState.players[1].mz=[d1];
gameState.chain=[{name:CYC,player:0,cardId:findCardIndex(CYC)}];
API.destroy(h(d1),'v30');
ok('B3 positive: 守備表示モンスターを効果破壊したターンとして残る',
   destroyedDefenseMonsterThisTurnV30(gameState,0,1)===true);
ok('B3 negative: 破壊者と被害者を入れ替えると成立しない',
   destroyedDefenseMonsterThisTurnV30(gameState,1,0)===false);
reset0();
let a1=mk(PLAIN,1,'up','atk');gameState.players[1].mz=[a1];
gameState.chain=[{name:CYC,player:0,cardId:findCardIndex(CYC)}];
API.destroy(h(a1),'v30');
ok('B3 negative: 攻撃表示モンスターの破壊では成立しない',
   destroyedDefenseMonsterThisTurnV30(gameState,0,1)===false);
reset0();
let fd=mk(PLAIN,1,'down','def');gameState.players[1].mz=[fd];
gameState.chain=[{name:CYC,player:0,cardId:findCardIndex(CYC)}];
API.destroy(h(fd),'v30');
ok('B3 ruling: 裏側守備表示も「守備表示」に含む',
   destroyedDefenseMonsterThisTurnV30(gameState,0,1)===true);
reset0();
let ba2=mk(BIG,0),bd2=mk(PLAIN,1,'up','def');
gameState.players[0].mz=[ba2];gameState.players[1].mz=[bd2];
bd2.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
ok('B3 positive: 戦闘破壊も同じターン記録に入る',
   destroyedDefenseMonsterThisTurnV30(gameState,0,1)===true);
ok('B3 ruling: バトルフェイズ終了に依存しない（turn 単位）',(()=>{
   gameState.phase='main2';
   return destroyedDefenseMonsterThisTurnV30(gameState,0,1)===true;})());
ok('B3 ruling: 破壊されたカードが墓地を離れても判定は残る',(()=>{
   gameState.players[1].grave=[];
   return destroyedDefenseMonsterThisTurnV30(gameState,0,1)===true;})());
ok('B3 negative: ターンが変わると記録は消える',(()=>{
   act({type:'PASS_TURN'});
   return destroyedDefenseMonsterThisTurnV30(gameState,0,1)===false
       && gameState.destroyedThisTurnV30.length===0;})());

/* ================= コザッキーの自爆装置 ================= */
reset0();
let kz=mk('コザッキーの自爆装置',0,'down');gameState.players[0].sz=[kz];
gameState.chain=[{name:CYC,player:1,cardId:findCardIndex(CYC)}];
API.destroy(h(kz),'v30');
let kzc=ctxE(0,kz,'onDestroy',null,'grave');
ok('コザッキーの自爆装置 positive: セット状態で相手に破壊されたら発動できる',
   sc('コザッキーの自爆装置').passive.onDestroy(kzc)===true&&sc('コザッキーの自爆装置').condition(kzc)===true);
let lpBefore=gameState.players[1].lp;
sc('コザッキーの自爆装置').resolve(kzc);
ok('コザッキーの自爆装置 positive: 破壊したプレイヤーに1000ダメージ',
   gameState.players[1].lp===lpBefore-1000,'lp='+gameState.players[1].lp);
reset0();
let kz2=mk('コザッキーの自爆装置',0,'down');gameState.players[0].sz=[kz2];
gameState.chain=[{name:CYC,player:0,cardId:findCardIndex(CYC)}];
API.destroy(h(kz2),'v30');
let kzc2=ctxE(0,kz2,'onDestroy',null,'grave');
let lpSelf=gameState.players[0].lp;
sc('コザッキーの自爆装置').resolve(kzc2);
ok('コザッキーの自爆装置 ruling: 自分で破壊した場合は自分がダメージを受ける',
   gameState.players[0].lp===lpSelf-1000,'lp='+gameState.players[0].lp);
reset0();
let kz3=mk('コザッキーの自爆装置',0,'up');gameState.players[0].sz=[kz3];
gameState.chain=[{name:CYC,player:1,cardId:findCardIndex(CYC)}];
API.destroy(h(kz3),'v30');
ok('コザッキーの自爆装置 negative: 表側（セットされていない）破壊では発動しない',
   sc('コザッキーの自爆装置').passive.onDestroy(ctxE(0,kz3,'onDestroy',null,'grave'))===false);
reset0();
let kz4=mk('コザッキーの自爆装置',0,'down');gameState.players[0].sz=[kz4];
API.sendToGrave(h(kz4),'v30');
ok('コザッキーの自爆装置 negative: 破壊以外で墓地へ行っても発動しない',
   sc('コザッキーの自爆装置').passive.onDestroy(ctxE(0,kz4,'onDestroy',null,'grave'))===false);
reset0();
let kz5=mk('コザッキーの自爆装置',0,'down');gameState.players[0].sz=[kz5];
API.destroy(h(kz5),'v30');
ok('コザッキーの自爆装置 negative: 破壊者が特定できない破壊では発動しない',
   sc('コザッキーの自爆装置').passive.onDestroy(ctxE(0,kz5,'onDestroy',null,'grave'))===false);

/* ================= 王墓の罠 ================= */
reset0();
let ot=mk('王墓の罠',0,'down');gameState.players[0].sz=[ot];
let oz=mk(ZOMB,1);gameState.players[1].grave=[oz];
gameState.players[1].mz=[mk(PLAIN,1),mk(PLAIN,1)];
API.specialSummon(0,'grave',0,'atk','王墓の罠テスト',1);
let osum=gameState.players[0].mz[0];
let octx=ctxE(0,ot,'onSpecialSummon',{player:0,card:osum,kind:'effect'});
ok('王墓の罠 positive: 相手の墓地からアンデットが特殊召喚されたら発動できる',
   sc('王墓の罠').passive.onSpecialSummon(octx)===true&&sc('王墓の罠').condition(octx)===true);
pickFirst();
sc('王墓の罠').selectTargets(octx,r=>{octx.selectedTargets=r;});
ok('王墓の罠 positive: フィールドのカード2枚を対象にする',
   (octx.selectedTargets||[]).length===2);
let fieldBefore=API.fieldCards({}).length;
sc('王墓の罠').resolve(octx);
ok('王墓の罠 positive: 対象2枚が破壊される',
   API.fieldCards({}).length===fieldBefore-2,'field='+API.fieldCards({}).length);
reset0();
let ot2=mk('王墓の罠',0,'down');gameState.players[0].sz=[ot2];
let oz2=mk(ZOMB,0);gameState.players[0].grave=[oz2];
gameState.players[1].mz=[mk(PLAIN,1),mk(PLAIN,1)];
API.specialSummon(0,'grave',0,'atk','v30',0);
ok('王墓の罠 negative: 自分の墓地からの特殊召喚では発動できない',
   sc('王墓の罠').passive.onSpecialSummon(
     ctxE(0,ot2,'onSpecialSummon',{player:0,card:gameState.players[0].mz[0],kind:'effect'}))===false);
reset0();
let ot3=mk('王墓の罠',0,'down');gameState.players[0].sz=[ot3];
let nz=mk(NONZOMB,1);gameState.players[1].grave=[nz];
gameState.players[1].mz=[mk(PLAIN,1),mk(PLAIN,1)];
API.specialSummon(0,'grave',0,'atk','v30',1);
ok('王墓の罠 negative: アンデット族以外では発動できない',
   sc('王墓の罠').passive.onSpecialSummon(
     ctxE(0,ot3,'onSpecialSummon',{player:0,card:gameState.players[0].mz[0],kind:'effect'}))===false);
reset0();
let ot4=mk('王墓の罠',0,'down');gameState.players[0].sz=[ot4];
let oz4=mk(ZOMB,1);gameState.players[1].grave=[oz4];
API.specialSummon(0,'grave',0,'atk','v30',1);
let octx4=ctxE(0,ot4,'onSpecialSummon',{player:0,card:gameState.players[0].mz[0],kind:'effect'});
ok('王墓の罠 ruling: 自身＋特殊召喚モンスターの2枚だけでも発動できる',
   sc('王墓の罠').condition(octx4)===true);
pickFirst();
let cand4=[];API.selectCard=(t,list,cb)=>{cand4=list;cb(list[0]);};
sc('王墓の罠').selectTargets(octx4,()=>{});
ok('王墓の罠 ruling: 発動した自身もフィールドのカードとして対象にできる',
   cand4.some(x=>x&&x.card===ot4),'cand='+cand4.length);
API.selectCard=(t,list,cb)=>cb(list[0]);
reset0();
let ot5=mk('王墓の罠',0,'down');gameState.players[0].sz=[ot5];
let oz5=mk(ZOMB,1),oz6=mk(ZOMB,1);gameState.players[1].grave=[oz5,oz6];
gameState.players[1].mz=[mk(PLAIN,1)];
RESOLUTION_SUMMON_BATCH_V2=[];
API.specialSummon(0,'grave',1,'atk','v30',1);
API.specialSummon(0,'grave',0,'atk','v30',1);
flushResolutionSummonBatchV2();
let batchEvt=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onSpecialSummon').slice(-1)[0];
ok('王墓の罠 ruling: 同時特殊召喚は1イベントにまとめられる（batch）',
   !!batchEvt&&(batchEvt.evt.uids||[]).length===2,
   batchEvt?('uids='+((batchEvt.evt.uids||[]).length)):'no evt');
ok('王墓の罠 ruling: batch の純JSON（uids）形からも判定できる',
   !!batchEvt&&sc('王墓の罠').passive.onSpecialSummon(
     ctxE(0,ot5,'onSpecialSummon',batchEvt.evt))===true);

/* ================= 破壊神の系譜 ================= */
reset0();
let hk=mk('破壊神の系譜',0,'down');gameState.players[0].sz=[hk];
let lv8=mk(BIG,0);gameState.players[0].mz=[lv8];
let vic=mk(PLAIN,1,'up','def');gameState.players[1].mz=[vic];
gameState.chain=[{name:CYC,player:0,cardId:findCardIndex(CYC)}];
API.destroy(h(vic),'v30');
gameState.chain=[];
let hctx=ctxE(0,hk,'activate');
ok('破壊神の系譜 positive: 守備表示を破壊したターンなら発動できる',
   sc('破壊神の系譜').condition(hctx)===true);
pickFirst();
sc('破壊神の系譜').selectTargets(hctx,r=>{hctx.selectedTargets=r;});
sc('破壊神の系譜').resolve(hctx);
ok('破壊神の系譜 positive: 選択したレベル8の攻撃可能回数が2回になる',
   lv8.attackLimit===2&&lv8.attackLimitTurn===gameState.turn,'attackLimit='+lv8.attackLimit);
gameState.players[1].mz=[mk(PLAIN,1),mk(PLAIN,1)];
gameState.phase='battle';
ok('破壊神の系譜 ruling: 1回攻撃する前は当然攻撃できる',canDeclareAttackV48(lv8)===true);
realAttack(0,0,0);
ok('破壊神の系譜 positive: 1回攻撃しても2回目を宣言できる',
   Number(lv8.attackCount)===1&&canDeclareAttackV48(lv8)===true,'attackCount='+lv8.attackCount);
realAttack(0,0,0);
ok('破壊神の系譜 ruling: 2回攻撃した後は3回目を宣言できない',
   Number(lv8.attackCount)===2&&canDeclareAttackV48(lv8)===false,'attackCount='+lv8.attackCount);
reset0();
let hk2=mk('破壊神の系譜',0,'down');gameState.players[0].sz=[hk2];
gameState.players[0].mz=[mk(BIG,0)];
gameState.players[1].mz=[mk(PLAIN,1,'up','atk')];
gameState.chain=[{name:CYC,player:0,cardId:findCardIndex(CYC)}];
API.destroy(h(gameState.players[1].mz[0]),'v30');
gameState.chain=[];
ok('破壊神の系譜 negative: 攻撃表示を破壊しただけでは発動できない',
   sc('破壊神の系譜').condition(ctxE(0,hk2,'activate'))===false);
reset0();
let hk3=mk('破壊神の系譜',0,'down');gameState.players[0].sz=[hk3];
gameState.players[0].mz=[mk(PLAIN,0)];
let vic3=mk(PLAIN,1,'up','def');gameState.players[1].mz=[vic3];
gameState.chain=[{name:CYC,player:0,cardId:findCardIndex(CYC)}];
API.destroy(h(vic3),'v30');
gameState.chain=[];
ok('破壊神の系譜 negative: レベル8がいなければ発動できない',
   sc('破壊神の系譜').condition(ctxE(0,hk3,'activate'))===false);
reset0();
let hk4=mk('破壊神の系譜',0,'down');gameState.players[0].sz=[hk4];
gameState.players[0].mz=[mk(BIG,0)];
let own=mk(PLAIN,0,'up','def');gameState.players[0].mz.push(own);
gameState.chain=[{name:CYC,player:0,cardId:findCardIndex(CYC)}];
API.destroy(h(own),'v30');
gameState.chain=[];
ok('破壊神の系譜 negative: 自分の守備表示を破壊しても発動できない',
   sc('破壊神の系譜').condition(ctxE(0,hk4,'activate'))===false);

/* ================= Replay / 直列化 ================= */
reset0();
let rv=mk(PLAIN,1,'up','def');gameState.players[1].mz=[rv];
let rz=mk(ZOMB,1);gameState.players[1].grave=[rz];
/* 破壊者はチェーンリンクから決まるので、chain も初期状態の一部にする。
   実戦では CHAIN_ADD が journal に載るため再生側でも同じ chain が再現される。 */
gameState.chain=[{name:CYC,player:0,cardId:findCardIndex(CYC)}];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.destroy(h(rv),'v30 replay');
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('v30 Replay: 破壊由来（B1/B3）は digest 一致で再生される',audit.ok,audit.reason||'');

/* B2 の特殊召喚は API.specialSummon が正規 resolution の外で
   成功イベントを積むため、単体呼び出しでは finalDigest がずれる。
   これは v30 以前からある既存の性質なので engine は変えない
   （pristine checkpoint でも同じ挙動を実測済み）。
   ここでは「provenance が action と state だけから決まる」ことを
   Action Journal の再適用で確かめる。 */
reset0();
let rz2=mk(ZOMB,1);gameState.players[1].grave=[rz2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.specialSummon(0,'grave',0,'atk','v30 replay',1);
let pkg=v41ReplayPackage(gameState);
let replayed=JSON.parse(JSON.stringify(pkg.initialState));
pkg.actions.forEach(j=>applyAction(replayed, JSON.parse(JSON.stringify(j.action||j))));
let liveSum=gameState.players[0].mz[0], repSum=replayed.players[0].mz[0];
ok('v30 Replay: 特殊召喚由来は Journal 再適用で同じ値を再現する',
   !!repSum && repSum.specialSummonedFromPlayer===1
   && repSum.specialSummonedFromPlayer===liveSum.specialSummonedFromPlayer,
   'replay='+(repSum&&repSum.specialSummonedFromPlayer)+' live='+(liveSum&&liveSum.specialSummonedFromPlayer));
ok('v30 Replay: 再適用後の ssHistory も一致する',
   JSON.stringify(replayed.players[0].ssHistory)===JSON.stringify(gameState.players[0].ssHistory));
let snap=JSON.stringify(gameState);
ok('v30 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('v30 直列化: 破壊記録は純 JSON',assertProvenanceSerializableV30(gameState).ok,
   assertProvenanceSerializableV30(gameState).why||'');
ok('v30 直列化: 破壊記録にカード実体を持たない',
   (gameState.destroyedThisTurnV30||[]).every(x=>x.card===undefined));
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
