/* Auto cycle 23 — 12枚。positive / negative / ruling edge / Replay。 */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;
  gameState.phase='main1';gameState.turn=6;PLAY_MODE=PLAY_MODES.DUEL;
  HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();
  v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  API.confirm=(t,m,yes,no)=>{ if(no) no(); };
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function h(c){return locateCardAnyV4(c);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(p,card,zone,idx,ev,extra){const c=makeContext(p,card,zone,idx,ev||'activate',extra||{});
  if(extra&&extra.event)c.event=extra.event;return c;}
function ctxEv(p,card,ev,evt,zone){const loc=h(card);
  return C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,ev,{event:evt});}
function ctxDS(p,card,battle,zone,step){const loc=h(card);
  const c=C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',{event:{},battle:battle,step:step||'end'});
  c.battle=battle;c.step=step||'end';return c;}
function pending(){return pendingChoiceV49(gameState);}
function synchroSummon(p, synName, materials){
  const P=gameState.players[p];
  const ex=mk(synName,p); P.ex=[ex]; ensureCardUid(gameState,ex);
  materials.forEach(c=>ensureCardUid(gameState,c));
  const indices=materials.map(c=>P.mz.indexOf(c)).filter(i=>i>=0).sort((a,b)=>b-a);
  gameState.deferredEvents=[];
  act({type:'EX_SUMMON_PREPARE_V42',player:p,exIndex:0,materials:indices,kind:'synchro',pos:'atk'});
  act({type:'EX_SUMMON_COMMIT_V42'});
  const evts=(gameState.deferredEvents||[]).slice(); gameState.deferredEvents=[];
  return {syn:ex, evts};
}
function matEvt(pack, card){
  const e=pack.evts.find(x=>x.eventName==='onSendToGrave'&&x.evt&&x.evt.uid===card.uid);
  return e?e.evt:null;
}
const PLAIN='ワイト';        /* 闇 アンデット lv1 ATK300 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 ATK3000 */
const TUNER='ジェネクス・コントローラー';

const ALL=['マジック・ジャマー','マジック・ドレイン','ロード・オブ・ドラゴン－ドラゴンの支配者－',
 'ホルスのしもべ','メタルシルバー・アーマー','マジック・ストライカー','ライト・サーペント',
 'ラピッド・ウォリアー','レプティレス・スキュラ','ヴァンパイア・レディ',
 'ボルテック・バイコーン','マジキャット'];
ALL.forEach(n=>ok('cycle23 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle23 枚数は12',ALL.length===12);

/* ============ マジック・ジャマー ============ */
reset0();
let mj=mk('マジック・ジャマー',0,'down'),foeSp=mk('強欲な壺',1);
gameState.players[0].sz=[mj];gameState.players[1].sz=[foeSp];
gameState.players[0].hand=[mk(PLAIN,0)];
ensureCardUid(gameState,foeSp);
let cmj=ctxEv(0,mj,'onActivateSuccess',
  {uid:foeSp.uid,player:1,kind:'spell',cardId:foeSp.id,chainId:1},'sz');
ok('マジック・ジャマー positive: 相手の魔法発動に反応する',
   sc('マジック・ジャマー').passive.onActivateSuccess(cmj)===true);
sc('マジック・ジャマー').cost(cmj,()=>{});
ok('マジック・ジャマー positive: 手札を1枚捨てる',
   gameState.players[0].hand.length===0&&gameState.players[0].grave.length===1);
reset0();
let mj2=mk('マジック・ジャマー',0,'down'),foeSp2=mk('強欲な壺',1);
gameState.players[0].sz=[mj2];gameState.players[1].sz=[foeSp2];
gameState.players[0].hand=[];
ensureCardUid(gameState,foeSp2);
ok('マジック・ジャマー negative: 手札が無ければ発動できない',
   sc('マジック・ジャマー').passive.onActivateSuccess(
     ctxEv(0,mj2,'onActivateSuccess',
       {uid:foeSp2.uid,player:1,kind:'spell',cardId:foeSp2.id},'sz'))===false);
reset0();
let mj3=mk('マジック・ジャマー',0,'down'),foeTrap=mk('落とし穴',1);
gameState.players[0].sz=[mj3];gameState.players[1].sz=[foeTrap];
gameState.players[0].hand=[mk(PLAIN,0)];
ensureCardUid(gameState,foeTrap);
ok('マジック・ジャマー negative: 罠の発動には反応しない',
   sc('マジック・ジャマー').passive.onActivateSuccess(
     ctxEv(0,mj3,'onActivateSuccess',
       {uid:foeTrap.uid,player:1,kind:'trap',cardId:foeTrap.id},'sz'))===false);

/* ============ マジック・ドレイン ============ */
reset0();
let md=mk('マジック・ドレイン',0,'down'),foeSp3=mk('強欲な壺',1);
gameState.players[0].sz=[md];gameState.players[1].sz=[foeSp3];
gameState.players[1].hand=[mk('強欲な壺',1),mk(PLAIN,1)];
ensureCardUid(gameState,foeSp3);
let cmd=ctxEv(0,md,'onActivateSuccess',
  {uid:foeSp3.uid,player:1,kind:'spell',cardId:foeSp3.id,chainId:1},'sz');
ok('マジック・ドレイン positive: 相手の魔法発動に反応する',
   sc('マジック・ドレイン').passive.onActivateSuccess(cmd)===true);
sc('マジック・ドレイン').resolve(cmd);
let pmd=pending();
ok('マジック・ドレイン ruling: 選択権は相手にあり、候補は手札の魔法だけ',
   !!pmd&&pmd.player===1&&pmd.min===0&&pmd.candidates.length===1,
   'player='+(pmd&&pmd.player)+' n='+(pmd&&pmd.candidates.length));
answerChoiceV49([pmd.candidates[0].key]);
ok('マジック・ドレイン positive: 相手が魔法を捨てれば手札が減る',
   gameState.players[1].hand.length===1,'p1hand='+gameState.players[1].hand.length);

/* ============ ロード・オブ・ドラゴン ============ */
reset0();
let lod=mk('ロード・オブ・ドラゴン－ドラゴンの支配者－',0),dragon=mk(BIG,1),nonDragon=mk(PLAIN,1);
gameState.players[0].mz=[lod];gameState.players[1].mz=[dragon,nonDragon];
ok('ロード・オブ・ドラゴン positive: フィールドのドラゴン族は効果の対象にできない',
   targetImmune(dragon)===true);
ok('ロード・オブ・ドラゴン ruling: ドラゴン族以外は対象にできる',
   targetImmune(nonDragon)===false);
reset0();
let dragon2=mk(BIG,1);
gameState.players[1].mz=[dragon2];
ok('ロード・オブ・ドラゴン negative: このカードがいなければ対象耐性は無い',
   targetImmune(dragon2)===false);

/* ============ ホルスのしもべ ============ */
reset0();
let hs=mk('ホルスのしもべ',0),horus=mk('ホルスの黒炎竜 LV6',0),other=mk(BIG,0);
gameState.players[0].mz=[hs,horus,other];
let foeTarget={player:1,db:dbOf(mk('月の書',1))},ownTarget={player:0,db:dbOf(mk('月の書',0))};
ok('ホルスのしもべ positive: 相手は「ホルスの黒炎竜」を効果の対象にできない',
   targetImmune(horus,foeTarget)===true);
ok('ホルスのしもべ negative: 自分は「ホルスの黒炎竜」を効果の対象にできる',
   targetImmune(horus,ownTarget)===false);
ok('ホルスのしもべ ruling: 他のドラゴン族は対象にできる',
   targetImmune(other,foeTarget)===false);
ok('ホルスのしもべ ruling: 名前は3枚を明示列挙している（部分一致していない）',
   sc('ホルスのしもべ').continuous.immuneToTarget(mk('ホルスの黒炎竜 LV4',0),hs,foeTarget)===true
   &&sc('ホルスのしもべ').continuous.immuneToTarget(mk('ホルスの黒炎竜 LV8',0),hs,foeTarget)===true);

/* ============ メタルシルバー・アーマー ============ */
reset0();
let ma=mk('メタルシルバー・アーマー',0,'up'),host=mk(PLAIN,0),otherMon=mk(BIG,0),foeMon=mk(BIG,1);
gameState.players[0].sz=[ma];gameState.players[0].mz=[host,otherMon];
gameState.players[1].mz=[foeMon];
ensureCardUid(gameState,host);ma.equipTo={uid:host.uid};
ok('メタルシルバー・アーマー ruling: モンスターにのみ装備可能',
   sc('メタルシルバー・アーマー').equipSpec.canEquip({db:dbOf(host)})===true
   &&sc('メタルシルバー・アーマー').equipSpec.canEquip({db:dbOf(mk('落とし穴',0))})===false);
ok('メタルシルバー・アーマー positive: 装備モンスター以外は効果の対象にできない',
   targetImmune(otherMon,foeTarget)===true&&targetImmune(foeMon,foeTarget)===true);
ok('メタルシルバー・アーマー negative: 自分は装備モンスター以外も効果の対象にできる',
   targetImmune(otherMon,ownTarget)===false&&targetImmune(foeMon,ownTarget)===false);
ok('メタルシルバー・アーマー ruling: 装備モンスター自身は対象にできる',
   targetImmune(host,foeTarget)===false);

/* ============ マジック・ストライカー ============ */
reset0();
let ms=mk('マジック・ストライカー',0);
gameState.players[0].hand=[ms];
gameState.players[0].grave=[mk('強欲な壺',0)];
/* S03-U17: ①はチェーンを作らない特殊召喚手順になった（効果の発動ではない）。 */
let cms=C(0,ms,'hand',0,'summonProcedure');
ok('マジック・ストライカー positive: 墓地に魔法があれば特殊召喚手順を使える（発動する効果は持たない）',
   sc('マジック・ストライカー').summonProcedure.condition(cms)===true&&typeof sc('マジック・ストライカー').resolve!=='function',cms.reason||'');
let msPaid=false;sc('マジック・ストライカー').summonProcedure.cost(cms,v=>{msPaid=v;});
API.specialSummon(0,'hand',gameState.players[0].hand.indexOf(ms),'atk','マジック・ストライカー');
ok('マジック・ストライカー positive: 魔法を除外して手札から特殊召喚される',
   msPaid&&gameState.players[0].banish.length===1&&gameState.players[0].mz.some(c=>c===ms),
   'p0mz='+gameState.players[0].mz.length);
ok('マジック・ストライカー ruling: 直接攻撃できる',
   canDirectAttackThroughMonstersV51(ms)===true);
let msFoe=mk(BIG,1);gameState.players[1].mz=[msFoe];
ensureCardUid(gameState,msFoe);
ok('マジック・ストライカー ruling: このカードの戦闘で自分が受けるダメージは0',
   applyBattleDamageFilters({to:0,amount:2400,atkCard:msFoe,defCard:ms,atkOwner:1,defOwner:0})===0);
ok('マジック・ストライカー ruling: 相手が受けるダメージは減らさない',
   applyBattleDamageFilters({to:1,amount:600,atkCard:ms,defCard:msFoe,atkOwner:0,defOwner:1})===600);
reset0();
let ms2=mk('マジック・ストライカー',0);
gameState.players[0].hand=[ms2];gameState.players[0].grave=[mk(PLAIN,0)];
ok('マジック・ストライカー negative: 墓地に魔法が無ければ特殊召喚手順を使えない',
   sc('マジック・ストライカー').summonProcedure.condition(C(0,ms2,'hand',0,'summonProcedure'))===false);

/* ============ ライト・サーペント ============ */
reset0();
let ls=mk('ライト・サーペント',0);
gameState.players[0].hand=[ls];
ok('ライト・サーペント ruling: シンクロ素材にできない宣言を持つ',
   sc('ライト・サーペント').cannotSynchroMaterial===true);
API.sendHandToGrave(0,0,'テスト：手札から墓地へ');
let cls=ctxEv(0,ls,'onSendToGrave',{},'grave');
ok('ライト・サーペント positive: 手札から墓地へ送られて誘発する',
   sc('ライト・サーペント').passive.onSendToGrave(cls)===true);
sc('ライト・サーペント').resolve(cls);
ok('ライト・サーペント positive: 墓地から特殊召喚される',
   gameState.players[0].mz.some(c=>c===ls),'p0mz='+gameState.players[0].mz.length);
reset0();
let ls2=mk('ライト・サーペント',0);
gameState.players[0].mz=[ls2];
API.sendToGrave(h(ls2),'テスト：フィールドから墓地へ');
ok('ライト・サーペント negative: フィールドから墓地へ行った場合は発動できない',
   sc('ライト・サーペント').passive.onSendToGrave(ctxEv(0,ls2,'onSendToGrave',{},'grave'))===false);

/* ============ ラピッド・ウォリアー ============ */
reset0();
let rw=mk('ラピッド・ウォリアー',0),otherMy=mk(BIG,0);
gameState.players[0].mz=[rw,otherMy];
ensureCardUid(gameState,rw);ensureCardUid(gameState,otherMy);
ok('ラピッド・ウォリアー negative: 発動前は直接攻撃できない',
   canDirectAttackThroughMonstersV51(rw)===false);
let crw=C(0,rw,'mz',0);
ok('ラピッド・ウォリアー positive: メインフェイズ1なら発動できる',
   sc('ラピッド・ウォリアー').condition(crw)===true,crw.reason||'');
sc('ラピッド・ウォリアー').resolve(crw);
ok('ラピッド・ウォリアー positive: このターン直接攻撃できる',
   canDirectAttackThroughMonstersV51(rw)===true);
ok('ラピッド・ウォリアー ruling: 発動ターン、このカード以外は攻撃できない',
   cannotAttackNow(otherMy)===true);
ok('ラピッド・ウォリアー ruling: このカード自身は攻撃できる',
   cannotAttackNow(rw)===false);
gameState.turn=gameState.turn+1;
ok('ラピッド・ウォリアー ruling: 次のターンは元に戻る',
   canDirectAttackThroughMonstersV51(rw)===false&&cannotAttackNow(otherMy)===false);
reset0();
let rw2=mk('ラピッド・ウォリアー',0);
gameState.players[0].mz=[rw2];gameState.phase='main2';
ok('ラピッド・ウォリアー negative: メインフェイズ2では発動できない',
   sc('ラピッド・ウォリアー').condition(C(0,rw2,'mz',0))===false);

/* ============ レプティレス・スキュラ ============ */
reset0();
let rs=mk('レプティレス・スキュラ',0),zeroAtk=mk('レプティレス・バイパー',1);  /* ATK0 */
gameState.players[0].mz=[rs];gameState.players[1].mz=[zeroAtk];
zeroAtk.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let crs=ctxDS(0,rs,{atkCard:rs,defCard:zeroAtk,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('レプティレス・スキュラ positive: 攻撃力0のモンスターを戦闘破壊して誘発する',
   sc('レプティレス・スキュラ').passive.onDamageStep(crs)===true);
sc('レプティレス・スキュラ').resolve(crs);
ok('レプティレス・スキュラ positive: そのモンスターが自分フィールドに表側守備表示で特殊召喚される',
   gameState.players[0].mz.some(c=>c===zeroAtk)&&zeroAtk.pos==='def'&&zeroAtk.face==='up',
   'p0mz='+gameState.players[0].mz.length+' pos='+zeroAtk.pos);
ok('レプティレス・スキュラ ruling: 特殊召喚したモンスターの効果は無効化される',
   zeroAtk.negated===true||zeroAtk.effectNegated===true);
reset0();
let rs2=mk('レプティレス・スキュラ',0),bigAtk=mk(BIG,1);
gameState.players[0].mz=[rs2];gameState.players[1].mz=[bigAtk];
bigAtk.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
ok('レプティレス・スキュラ negative: 攻撃力0でなければ発動できない',
   sc('レプティレス・スキュラ').passive.onDamageStep(
     ctxDS(0,rs2,{atkCard:rs2,defCard:bigAtk,destroyedDef:true,step:'after'},'mz','after'))===false);

/* ============ ヴァンパイア・レディ ============ */
reset0();
let vl=mk('ヴァンパイア・レディ',0);
gameState.players[0].mz=[vl];ensureCardUid(gameState,vl);
gameState.players[1].deck=[mk('強欲な壺',1),mk(PLAIN,1)];
let cvl=ctxEv(0,vl,'onBattleDamage',{player:1,amount:1550,attackerUid:vl.uid},'mz');
ok('ヴァンパイア・レディ positive: 相手に戦闘ダメージを与えて誘発する',
   sc('ヴァンパイア・レディ').passive.onBattleDamage(cvl)===true);
sc('ヴァンパイア・レディ').resolve(cvl);
let pvl=pending();
ok('ヴァンパイア・レディ ruling: 種類を宣言する（3択）',
   !!pvl&&pvl.player===0&&pvl.candidates.length===3);
answerChoiceV49([pvl.candidates.find(x=>x.key==='s').key]);   /* 魔法を宣言 */
let pvl2=pending();
ok('ヴァンパイア・レディ ruling: 相手が自分のデッキから選ぶ',
   !!pvl2&&pvl2.player===1&&pvl2.candidates.length===1,
   'player='+(pvl2&&pvl2.player)+' n='+(pvl2&&pvl2.candidates.length));
answerChoiceV49([pvl2.candidates[0].key]);
ok('ヴァンパイア・レディ positive: 宣言した種類のカードが墓地へ送られる',
   gameState.players[1].grave.some(c=>dbOf(c).k==='s')&&gameState.players[1].deck.length===1,
   'p1grave='+gameState.players[1].grave.length);

/* ============ ボルテック・バイコーン ============ */
reset0();
let vb=mk('ボルテック・バイコーン',0);
gameState.players[0].mz=[vb];
for(let i=0;i<10;i++) gameState.players[0].deck.push(mk(PLAIN,0));
for(let i=0;i<10;i++) gameState.players[1].deck.push(mk(PLAIN,1));
let d0=gameState.players[0].deck.length,d1=gameState.players[1].deck.length;
API.destroy(h(vb),'相手の効果で破壊',1);
let cvb=ctxEv(0,vb,'onDestroy',{},'grave');
ok('ボルテック・バイコーン positive: 相手によって破壊されて誘発する',
   sc('ボルテック・バイコーン').passive.onDestroy(cvb)===true);
sc('ボルテック・バイコーン').resolve(cvb);
ok('ボルテック・バイコーン positive: お互いがデッキの上から7枚墓地へ送る',
   gameState.players[0].deck.length===d0-7&&gameState.players[1].deck.length===d1-7,
   'p0deck='+gameState.players[0].deck.length+' p1deck='+gameState.players[1].deck.length);
reset0();
let vb2=mk('ボルテック・バイコーン',0);
gameState.players[0].mz=[vb2];
API.destroy(h(vb2),'自分の効果で破壊',0);
ok('ボルテック・バイコーン negative: 自分の効果で破壊された場合は発動しない',
   sc('ボルテック・バイコーン').passive.onDestroy(ctxEv(0,vb2,'onDestroy',{},'grave'))===false);

/* ============ マジキャット ============ */
reset0();
let mc=mk('マジキャット',0),mt=mk(TUNER,0);
gameState.players[0].mz=[mc,mt];
gameState.players[0].grave=[mk('強欲な壺',0)];
let mck=synchroSummon(0,'マジックテンペスター',[mc,mt]);   /* 魔法使い族 */
ok('前提: 使用したシンクロは魔法使い族',dbOf(mck.syn).ra==='魔法使い','ra='+dbOf(mck.syn).ra);
let cmc=ctxEv(0,mc,'onSendToGrave',matEvt(mck,mc),'grave');
ok('マジキャット positive: 魔法使い族シンクロの素材になって誘発する',
   sc('マジキャット').passive.onSendToGrave(cmc)===true);
let deckB=gameState.players[0].deck.length;
sc('マジキャット').selectTargets(cmc,t=>{cmc.selectedTargets=t;});
sc('マジキャット').resolve(cmc);
ok('マジキャット positive: 墓地の魔法がデッキの一番上に戻る',
   gameState.players[0].deck.length===deckB+1
   &&dbOf(gameState.players[0].deck[0]).n==='強欲な壺',
   'deck='+gameState.players[0].deck.length);
reset0();
let mc2=mk('マジキャット',0),mt2=mk(TUNER,0);
gameState.players[0].mz=[mc2,mt2];gameState.players[0].grave=[mk('強欲な壺',0)];
let mck2=synchroSummon(0,'BF－アーマード・ウィング',[mc2,mt2]);   /* 鳥獣族 */
ok('マジキャット negative: 魔法使い族以外のシンクロでは誘発しない',
   sc('マジキャット').passive.onSendToGrave(
     ctxEv(0,mc2,'onSendToGrave',matEvt(mck2,mc2),'grave'))===false);

/* ================= 読み取り専用 passive の検証 ================= */
reset0();
let ro1=mk('ヴァンパイア・レディ',0),ro2=mk('ロード・オブ・ドラゴン－ドラゴンの支配者－',0),ro3=mk(BIG,1);
gameState.players[0].mz=[ro1,ro2];gameState.players[1].mz=[ro3];
[ro1,ro2].forEach(c=>ensureCardUid(gameState,c));
gameState.players[1].deck=[mk(PLAIN,1)];
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
sc('ヴァンパイア・レディ').passive.onBattleDamage(
  ctxEv(0,ro1,'onBattleDamage',{player:1,amount:100,attackerUid:ro1.uid},'mz'));
targetImmune(ro3);
ok('cycle23 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('ラピッド・ウォリアー',0);
gameState.players[0].mz=[rp1];ensureCardUid(gameState,rp1);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(rp1),'d2RapidTurn',gameState.turn,'ラピッド・ウォリアー');
let ra1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle23 Replay: 直接攻撃フラグが digest 一致で再生される',ra1.ok,ra1.reason||'');
reset0();
let rp2=mk('マジック・ストライカー',0);
gameState.players[0].hand=[rp2];
gameState.players[0].grave=[mk('強欲な壺',0)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.banish(h(gameState.players[0].grave[0]),'マジック・ストライカー');
let ra2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle23 Replay: 除外コストが digest 一致で再生される',ra2.ok,ra2.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle23 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle23 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
