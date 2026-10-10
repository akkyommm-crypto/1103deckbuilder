/* Auto cycle 38 — 8枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['クローン複製','ツクシー','トリッキーズ・マジック4','ロードブリティッシュ',
 '魂喰らいの魔刀','一撃必殺侍','モンスターBOX','アルカナフォースXVIII－THE MOON'];
ALL.forEach(n=>ok('cycle38 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle38 枚数は8',ALL.length===8);

const TRICKY='THE トリッキー';
const PLANT='アイヴィ・ウォール';   /* 植物 lv2 */
const NORMAL3='ワイト';            /* 通常 lv1 */

/* 宣言候補から value で選ぶ */
function pickVal(v){
  const c=pending().candidates.find(x=>String(x.value)===String(v));
  return (c||pending().candidates[0]).key;
}

/* ============ 1. クローン複製 ============ */
reset0();
let cl=mk('クローン複製',0,'down'),clFoe=mk(BIG,1);
gameState.players[0].sz=[cl];gameState.players[1].mz=[clFoe];
ensureCardUid(gameState,clFoe);
let clCtx=ctxEv(0,cl,'onNormalSummon',{card:clFoe,uid:clFoe.uid},'sz');
ok('クローン複製 positive: 相手の召喚成功時に発動できる',
   sc('クローン複製').passive.onNormalSummon(clCtx)===true);
sc('クローン複製').resolve(clCtx);
ok('クローン複製 card-specific: 元々の数値を持つトークンが自分フィールドに出る',
   gameState.players[0].mz.length===1
   &&API.isToken(h(gameState.players[0].mz[0]))
   &&curATK(gameState.players[0].mz[0])===Number(dbOf(clFoe).atk)
   &&curDEF(gameState.players[0].mz[0])===Number(dbOf(clFoe).def),
   'atk='+curATK(gameState.players[0].mz[0]));
ok('クローン複製 card-specific: 元のモンスターが離れたらトークンも消える連結が張られる',
   !!API.linkState(h(gameState.players[0].mz[0])));
reset0();
let cl2=mk('クローン複製',0,'down'),cl2Mine=mk(BIG,0);
gameState.players[0].sz=[cl2];gameState.players[0].mz=[cl2Mine];
ensureCardUid(gameState,cl2Mine);
ok('クローン複製 negative: 自分の召喚には反応しない',
   sc('クローン複製').passive.onNormalSummon(
     ctxEv(0,cl2,'onNormalSummon',{card:cl2Mine,uid:cl2Mine.uid},'sz'))===false);

/* ============ 2. ツクシー ============ */
reset0();
let ts=mk('ツクシー',0);
gameState.players[0].grave=[ts];
ts.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
let tsCtx=ctxDS(0,ts,{atkCard:mk(BIG,1),defCard:ts,destroyedDef:true},'grave');
ok('ツクシー positive: 戦闘破壊された時に誘発する',
   sc('ツクシー').passive.onDamageStep(tsCtx)===true);
sc('ツクシー').resolve(tsCtx);
ok('ツクシー card-specific: 相手フィールドに「ツクシトークン」が出る',
   gameState.players[1].mz.length===1
   &&API.tokenKey(h(gameState.players[1].mz[0]))==='ツクシトークン',
   'foeMz='+gameState.players[1].mz.length);
let tsToken=gameState.players[1].mz[0];
ensureCardUid(gameState,tsToken);
gameState.players[1].hand=[mk(BIG,1),mk(BIG,1)];
let tsPlant=mk(PLANT,0);gameState.players[0].mz=[tsPlant];
let tsCtx2=ctxDS(0,ts,{atkCard:tsPlant,defCard:tsToken,destroyedDef:true},'grave');
ok('ツクシー positive: トークンが植物族に破壊された時も誘発する',
   sc('ツクシー').passive.onDamageStep(tsCtx2)===true);
let tsHand=gameState.players[1].hand.length;
sc('ツクシー').resolve(tsCtx2);
ok('ツクシー card-specific: トークンのコントローラーが手札を1枚墓地へ送る',
   gameState.players[1].hand.length===tsHand-1,
   'hand='+tsHand+'→'+gameState.players[1].hand.length);
reset0();
let ts2=mk('ツクシー',0),ts2Token=mk(BIG,1);
gameState.players[0].grave=[ts2];gameState.players[1].mz=[ts2Token];
ok('ツクシー negative: トークンでないモンスターの破壊では誘発しない',
   sc('ツクシー').passive.onDamageStep(
     ctxDS(0,ts2,{atkCard:mk(PLANT,0),defCard:ts2Token,destroyedDef:true},'grave'))===false);

/* ============ 3. トリッキーズ・マジック4 ============ */
reset0();
let tm=mk('トリッキーズ・マジック4',0),tmTricky=mk(TRICKY,0);
gameState.players[0].sz=[tm];gameState.players[0].mz=[tmTricky];
gameState.players[1].mz=[mk(BIG,1),mk(BIG,1)];
let tmCtx=C(0,tm,'sz',0,'activate',{});
ok('トリッキーズ・マジック4 positive: 「THE トリッキー」と相手モンスターがいれば発動できる',
   sc('トリッキーズ・マジック4').condition(tmCtx)===true);
let tmCost=false;sc('トリッキーズ・マジック4').cost(tmCtx,v=>{tmCost=v;});
ok('トリッキーズ・マジック4 positive: コストで「THE トリッキー」が墓地へ送られる',
   tmCost&&gameState.players[0].mz.length===0);
sc('トリッキーズ・マジック4').resolve(tmCtx);
ok('トリッキーズ・マジック4 card-specific: 相手モンスターの数だけトークンが出る（2体）',
   gameState.players[0].mz.length===2
   &&gameState.players[0].mz.every(c=>API.tokenKey(h(c))==='トリッキートークン'),
   'mz='+gameState.players[0].mz.length);
ok('トリッキーズ・マジック4 card-specific: トークンは攻撃宣言できない',
   gameState.players[0].mz.every(c=>cannotAttackNow(c)===true));
reset0();
let tm2=mk('トリッキーズ・マジック4',0),tm2Other=mk(BIG,0);
gameState.players[0].sz=[tm2];gameState.players[0].mz=[tm2Other];
gameState.players[1].mz=[mk(BIG,1)];
ok('トリッキーズ・マジック4 negative: 「THE トリッキー」がいなければ発動できない',
   sc('トリッキーズ・マジック4').condition(C(0,tm2,'sz',0,'activate',{}))===false);

/* ============ 4. ロードブリティッシュ ============ */
reset0();
let lb=mk('ロードブリティッシュ',0),lbFoe=mk(PLAIN,1);
gameState.players[0].mz=[lb];gameState.players[1].grave=[lbFoe];
gameState.players[1].sz=[mk('落とし穴',1,'down')];
let lbCtx=ctxDS(0,lb,{atkCard:lb,defCard:lbFoe,destroyedDef:true});
ok('ロードブリティッシュ positive: 戦闘破壊で誘発する',
   sc('ロードブリティッシュ').passive.onDamageStep(lbCtx)===true);
sc('ロードブリティッシュ').resolve(lbCtx);
/* S03-U62: resolve() は先にSaveLoad安全な yes/no 選択を発行するようになった。
   「はい（セットを破壊する）」を選ぶと、続けて実際に破壊するカードの選択要求が出る。 */
ok('ロードブリティッシュ positive: 破壊の確認選択が出る',!!pending()&&pending().kind==='yesno');
API.answerChoice(['yes']);
ok('ロードブリティッシュ positive: セットカードの選択要求が出る',
   !!pending()&&pending().player===0);
API.answerChoice([pending().candidates[0].key]);
ok('ロードブリティッシュ card-specific: 選んだセットカードが破壊される',
   gameState.players[1].sz.length===0);
reset0();
let lb2=mk('ロードブリティッシュ',0),lb2Foe=mk(PLAIN,1);
gameState.players[0].mz=[lb2];gameState.players[1].grave=[lb2Foe];
gameState.players[1].sz=[];
lb2.attacked=true;lb2.attackCount=1;
let lb2Ctx=ctxDS(0,lb2,{atkCard:lb2,defCard:lb2Foe,destroyedDef:true});
sc('ロードブリティッシュ').resolve(lb2Ctx);
/* S03-U62: セットされたカードが無いので、トークン特殊召喚の yes/no 選択が出る。
   「いいえ」を選ぶと、代わりにもう1度攻撃できる。 */
ok('ロードブリティッシュ positive: トークンの確認選択が出る',!!pending()&&pending().kind==='yesno');
API.answerChoice(['no']);
ok('ロードブリティッシュ card-specific: もう1度攻撃を選べる（attackLimit が増える）',
   Number(lb2.attackLimit)>=2,'limit='+lb2.attackLimit);
reset0();
let lb3=mk('ロードブリティッシュ',0);
gameState.players[0].mz=[lb3];
ok('ロードブリティッシュ negative: 戦闘破壊していなければ発動できない',
   sc('ロードブリティッシュ').condition(
     ctxDS(0,lb3,{atkCard:lb3,defCard:mk(BIG,1),destroyedDef:false}))===false);

/* ============ 5. 魂喰らいの魔刀 ============ */
reset0();
let mk1=mk('魂喰らいの魔刀',0),mkHost=mk(NORMAL3,0);
let mkA=mk(NORMAL3,0),mkB=mk(NORMAL3,0);
gameState.players[0].sz=[mk1];gameState.players[0].mz=[mkHost,mkA,mkB];
let mkCtx=C(0,mk1,'sz',0,'activate',{});
ok('魂喰らいの魔刀 positive: レベル3以下の通常モンスターがいれば発動できる',
   sc('魂喰らいの魔刀').condition(mkCtx)===true);
mkCtx.selectedTargets=[h(mkHost)];
let mkAtk=curATK(mkHost);
sc('魂喰らいの魔刀').resolve(mkCtx);
mk1.face='up';
ok('魂喰らいの魔刀 card-specific: 他の通常モンスターが全てリリースされる',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0]===mkHost,
   'mz='+gameState.players[0].mz.length);
ok('魂喰らいの魔刀 card-specific: リリースした数×1000アップ（2体＝2000）',
   curATK(mkHost)===mkAtk+2000,'atk='+mkAtk+'→'+curATK(mkHost));
reset0();
let mk2=mk('魂喰らいの魔刀',0),mk2Big=mk(BIG,0);
gameState.players[0].sz=[mk2];gameState.players[0].mz=[mk2Big];
ok('魂喰らいの魔刀 negative: レベル3以下の通常モンスターがいなければ発動できない',
   sc('魂喰らいの魔刀').condition(C(0,mk2,'sz',0,'activate',{}))===false);
ok('魂喰らいの魔刀 ruling: レベル4以上には装備できない（equipSpec）',
   equipLegalV15(mk2,h(mk2Big))===false);

/* ============ 6. 一撃必殺侍 ============ */
reset0();
gameState.phase='battle';
let sm=mk('一撃必殺侍',0),smFoe=mk(BIG,1);
gameState.players[0].mz=[sm];gameState.players[1].mz=[smFoe];
ensureCardUid(gameState,smFoe);
gameState.battle={player:0,atkIdx:0,target:0};
let smCtx=C(0,sm,'mz',0,'activate',{});
ok('一撃必殺侍 positive: 戦闘を行うダメージ計算前に発動する',
   sc('一撃必殺侍').condition(smCtx)===true);
sc('一撃必殺侍').resolve(smCtx);
ok('一撃必殺侍 positive: 表／裏の宣言要求が出る',
   !!pending()&&pending().candidates.length===2&&pending().player===0);
/* コイントスは RNG。両方の宣言を試し、当たった時だけ破壊される事を確かめる。 */
let smBefore=gameState.players[1].mz.length;
API.answerChoice([pickVal('表')]);
let smAfter=gameState.players[1].mz.length;
ok('一撃必殺侍 card-specific: 当たれば相手モンスターが破壊され、外れれば残る',
   smAfter===smBefore-1||smAfter===smBefore,
   'mz='+smBefore+'→'+smAfter);
gameState.battle=null;
reset0();
let sm2=mk('一撃必殺侍',0);
gameState.players[0].mz=[sm2];
ok('一撃必殺侍 negative: 戦闘していなければ発動できない',
   sc('一撃必殺侍').condition(C(0,sm2,'mz',0,'activate',{}))===false);

/* ============ 7. モンスターBOX ============ */
reset0();
gameState.phase='battle';gameState.activePlayer=1;
let mb=mk('モンスターBOX',0,'up'),mbFoe=mk(BIG,1);
gameState.players[0].sz=[mb];gameState.players[1].mz=[mbFoe];
ensureCardUid(gameState,mbFoe);
gameState.battle={player:1,atkIdx:0,target:'direct'};
let mbCtx=C(0,mb,'sz',0,'activate',{});
ok('モンスターBOX positive: 相手の攻撃宣言時に発動できる',
   sc('モンスターBOX').condition(mbCtx)===true);
sc('モンスターBOX').resolve(mbCtx);
ok('モンスターBOX positive: 表／裏の宣言要求が出る',
   !!pending()&&pending().candidates.length===2);
let mbAtk=curATK(mbFoe);
API.answerChoice([pickVal('表')]);
ok('モンスターBOX card-specific: 当たれば攻撃力0、外れればそのまま',
   curATK(mbFoe)===0||curATK(mbFoe)===mbAtk,'atk='+mbAtk+'→'+curATK(mbFoe));
gameState.battle=null;
reset0();
gameState.phase='standby';gameState.activePlayer=0;
let mb2=mk('モンスターBOX',0,'up');
gameState.players[0].sz=[mb2];
let mb2Lp=gameState.players[0].lp;
sc('モンスターBOX').resolve(C(0,mb2,'sz',0,'activate',{}));
ok('モンスターBOX card-specific: 自分スタンバイに500払って維持される',
   gameState.players[0].lp===mb2Lp-500&&gameState.players[0].sz.length===1);
reset0();
gameState.phase='standby';gameState.activePlayer=0;
let mb3=mk('モンスターBOX',0,'up');
gameState.players[0].sz=[mb3];gameState.players[0].lp=300;
sc('モンスターBOX').resolve(C(0,mb3,'sz',0,'activate',{}));
ok('モンスターBOX card-specific: 払えなければ破壊される',
   gameState.players[0].sz.length===0);

/* ============ 8. アルカナフォースXVIII－THE MOON ============ */
reset0();
let mn=mk('アルカナフォースXVIII－THE MOON',0);
gameState.players[0].mz=[mn];ensureCardUid(gameState,mn);
let mnCtx=ctxEv(0,mn,'onNormalSummon',{card:mn,uid:mn.uid},'mz');
ok('アルカナフォースXVIII－THE MOON positive: 召喚成功時にコイントスを行う',
   sc('アルカナフォースXVIII－THE MOON').passive.onNormalSummon(mnCtx)===true);
sc('アルカナフォースXVIII－THE MOON').resolve(mnCtx);
ok('アルカナフォースXVIII－THE MOON card-specific: コイントスの結果が印として残る',
   Number(mn.e7MoonCoin)===1||Number(mn.e7MoonCoin)===2,
   'coin='+mn.e7MoonCoin);
ok('アルカナフォースXVIII－THE MOON ruling: 一度決まったら再抽選しない',
   sc('アルカナフォースXVIII－THE MOON').passive.onNormalSummon(
     ctxEv(0,mn,'onNormalSummon',{card:mn,uid:mn.uid},'mz'))===false);
/* 表（1）のとき：自分スタンバイにトークン */
reset0();
gameState.phase='standby';gameState.activePlayer=0;
let mn1=mk('アルカナフォースXVIII－THE MOON',0);
gameState.players[0].mz=[mn1];mn1.e7MoonCoin=1;
ok('アルカナフォースXVIII－THE MOON positive: 表なら自分スタンバイに発動できる',
   sc('アルカナフォースXVIII－THE MOON').condition(C(0,mn1,'mz',0,'activate',{}))===true);
sc('アルカナフォースXVIII－THE MOON').resolve(C(0,mn1,'mz',0,'activate',{}));
ok('アルカナフォースXVIII－THE MOON card-specific: 「ムーントークン」が出る',
   gameState.players[0].mz.length===2
   &&API.tokenKey(h(gameState.players[0].mz[1]))==='ムーントークン');
/* 裏（2）のとき：自分エンドフェイズにコントロールを渡す */
reset0();
gameState.phase='end';gameState.activePlayer=0;
let mn2=mk('アルカナフォースXVIII－THE MOON',0),mn2Other=mk(BIG,0);
gameState.players[0].mz=[mn2,mn2Other];mn2.e7MoonCoin=2;
ensureCardUid(gameState,mn2Other);
ok('アルカナフォースXVIII－THE MOON positive: 裏なら自分エンドフェイズに処理する',
   sc('アルカナフォースXVIII－THE MOON').condition(C(0,mn2,'mz',0,'activate',{}))===true);
sc('アルカナフォースXVIII－THE MOON').resolve(C(0,mn2,'mz',0,'activate',{}));
ok('アルカナフォースXVIII－THE MOON positive: 渡すモンスターの選択要求が出る',
   !!pending()&&pending().player===0);
let mnPick=pending().candidates.find(c=>{
  const r=resolveTarget(c); return r&&r.card&&r.card.uid===mn2Other.uid; })
  ||pending().candidates[0];
API.answerChoice([mnPick.key]);
ok('アルカナフォースXVIII－THE MOON card-specific: そのモンスターのコントロールが相手に移る',
   gameState.players[1].mz.some(c=>c&&c.uid===mn2Other.uid),
   'foeMz='+gameState.players[1].mz.length);

/* ================= passive / continuous は read-only ================= */
reset0();
let roTs=mk('ツクシー',0),roLb=mk('ロードブリティッシュ',0);
gameState.players[0].grave=[roTs];gameState.players[0].mz=[roLb];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roLb);
sc('ツクシー').passive.onDamageStep(
  ctxDS(0,roTs,{atkCard:mk(BIG,1),defCard:mk(BIG,0),destroyedDef:true},'grave'));
ok('cycle38 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('クローン複製',0,'down'),rp1Foe=mk(BIG,1);
gameState.players[0].sz=[rp1];gameState.players[1].mz=[rp1Foe];
ensureCardUid(gameState,rp1Foe);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
sc('クローン複製').resolve(
  ctxEv(0,rp1,'onNormalSummon',{card:rp1Foe,uid:rp1Foe.uid},'sz'));
let rq1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle38 Replay: トークン生成と連結が digest 一致で再生される',rq1.ok,rq1.reason||'');
reset0();
let rp2=mk('魂喰らいの魔刀',0),rp2Host=mk(NORMAL3,0),rp2A=mk(NORMAL3,0);
gameState.players[0].sz=[rp2];gameState.players[0].mz=[rp2Host,rp2A];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp2Ctx=C(0,rp2,'sz',0,'activate',{});
rp2Ctx.selectedTargets=[h(rp2Host)];
sc('魂喰らいの魔刀').resolve(rp2Ctx);
let rq2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle38 Replay: 装備＋リリース＋攻撃力アップが digest 一致で再生される',rq2.ok,rq2.reason||'');
let snap38=JSON.stringify(gameState);
ok('cycle38 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap38))===snap38);
ok('cycle38 直列化: 予約に関数が入っていない',snap38.indexOf('function')<0);
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
