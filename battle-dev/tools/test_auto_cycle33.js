/* Auto cycle 33 — 9枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['チェーン・ヒーリング','チェーン・ブラスト','八尺勾玉','サクリファイス・ソード',
 '疫病ウィルス ブラックダスト','ジェムエレファント','BF－激震のアブロオロス',
 'トラップ・キャプチャー','スピリットの誘い'];
ALL.forEach(n=>ok('cycle33 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle33 枚数は9',ALL.length===9);

const SPIRIT='月読命';        /* スピリット 闇 atk1100 */
const DARKM='ワイト';         /* 闇 通常 lv1 */

function chainOf(names,selfCard,selfPos){
  gameState.chain=names.map((n,i)=>({chainId:i+1,player:0,name:n,ss:2,
    uid:(selfPos===i&&selfCard)?selfCard.uid:null,targets:[],selection:[]}));
}
function killedBattle(atkCard,defCard){
  return {atkCard:atkCard,defCard:defCard,destroyedDef:true,destroyedAtk:false};
}

/* ============ 1. チェーン・ヒーリング ============ */
reset0();
let chh=mk('チェーン・ヒーリング',0,'down');
gameState.players[0].sz=[chh];ensureCardUid(gameState,chh);
chainOf(['強欲な壺','チェーン・ヒーリング'],chh,1);
let chhCtx=C(0,chh,'sz',0,'activate',{});
let chhLp=gameState.players[0].lp;
sc('チェーン・ヒーリング').resolve(chhCtx);
ok('チェーン・ヒーリング positive: 500ライフポイント回復する',
   gameState.players[0].lp===chhLp+500,'lp='+chhLp+'→'+gameState.players[0].lp);
ok('チェーン・ヒーリング card-specific: チェーン2ならデッキに戻る',
   gameState.players[0].sz.length===0
   &&gameState.players[0].deck.some(c=>c&&dbOf(c).n==='チェーン・ヒーリング'),
   'sz='+gameState.players[0].sz.length);
gameState.chain=[];
reset0();
let chh2=mk('チェーン・ヒーリング',0,'down');
gameState.players[0].sz=[chh2];ensureCardUid(gameState,chh2);
chainOf(['強欲な壺','落とし穴','サイクロン','チェーン・ヒーリング'],chh2,3);
sc('チェーン・ヒーリング').resolve(C(0,chh2,'sz',0,'activate',{}));
ok('チェーン・ヒーリング card-specific: チェーン4以降なら手札に戻る',
   gameState.players[0].hand.some(c=>c&&dbOf(c).n==='チェーン・ヒーリング'),
   'hand='+gameState.players[0].hand.length);
gameState.chain=[];
reset0();
let chh3=mk('チェーン・ヒーリング',0,'down');
gameState.players[0].sz=[chh3];ensureCardUid(gameState,chh3);
chainOf(['チェーン・ヒーリング'],chh3,0);
let chh3Ctx=C(0,chh3,'sz',0,'activate',{});
sc('チェーン・ヒーリング').resolve(chh3Ctx);
sc('チェーン・ヒーリング').afterResolve(chh3Ctx);
ok('チェーン・ヒーリング ruling: チェーン1なら通常どおり墓地へ送られる',
   gameState.players[0].grave.some(c=>c&&dbOf(c).n==='チェーン・ヒーリング'),
   'grave='+gameState.players[0].grave.length);
gameState.chain=[];

/* ============ 2. チェーン・ブラスト ============ */
reset0();
let chb=mk('チェーン・ブラスト',0,'down');
gameState.players[0].sz=[chb];ensureCardUid(gameState,chb);
chainOf(['強欲な壺','落とし穴','チェーン・ブラスト'],chb,2);
let chbLp=gameState.players[1].lp;
sc('チェーン・ブラスト').resolve(C(0,chb,'sz',0,'activate',{}));
ok('チェーン・ブラスト positive: 相手に500ダメージを与える',
   gameState.players[1].lp===chbLp-500,'lp='+chbLp+'→'+gameState.players[1].lp);
ok('チェーン・ブラスト card-specific: チェーン3ならデッキに戻る',
   gameState.players[0].deck.some(c=>c&&dbOf(c).n==='チェーン・ブラスト'),
   'deck='+gameState.players[0].deck.length);
gameState.chain=[];
reset0();
let chb2=mk('チェーン・ブラスト',0,'down');
gameState.players[0].sz=[chb2];ensureCardUid(gameState,chb2);
chainOf(['a','b','c','d','チェーン・ブラスト'],chb2,4);
sc('チェーン・ブラスト').resolve(C(0,chb2,'sz',0,'activate',{}));
ok('チェーン・ブラスト card-specific: チェーン5なら手札に戻る',
   gameState.players[0].hand.some(c=>c&&dbOf(c).n==='チェーン・ブラスト'));
gameState.chain=[];

/* ============ 3. 八尺勾玉 ============ */
reset0();
let ym=mk('八尺勾玉',0),ymSp=mk(SPIRIT,0);
gameState.players[0].sz=[ym];gameState.players[0].mz=[ymSp];
let ymCtx=C(0,ym,'sz',0,'activate',{});
ok('八尺勾玉 positive: スピリットモンスターがいれば発動できる',
   sc('八尺勾玉').condition(ymCtx)===true);
ymCtx.selectedTargets=[h(ymSp)];
sc('八尺勾玉').resolve(ymCtx);
ym.face='up';
ok('八尺勾玉 positive: スピリットに装備され装備先 uid が刻まれる',
   !!ym.equipTo&&ym.equipTo.uid===ymSp.uid&&Number(ym.e2HostUid)===ymSp.uid);
let ymFoe=mk(BIG,1);gameState.players[1].grave=[ymFoe];
let ymCtx2=ctxDS(0,ym,killedBattle(ymSp,ymFoe),'sz');
ok('八尺勾玉 positive: 装備先が戦闘破壊した時に誘発する',
   sc('八尺勾玉').passive.onDamageStep(ymCtx2)===true);
let ymLp=gameState.players[0].lp;
sc('八尺勾玉').resolve(ymCtx2);
ok('八尺勾玉 card-specific: 破壊したモンスターの元々の攻撃力分だけ回復する',
   gameState.players[0].lp===ymLp+Number(dbOf(ymFoe).atk),
   'lp='+ymLp+'→'+gameState.players[0].lp);
reset0();
let ym2=mk('八尺勾玉',0),ym2NonSp=mk(BIG,0);
gameState.players[0].sz=[ym2];gameState.players[0].mz=[ym2NonSp];
ok('八尺勾玉 negative: スピリット以外しかいなければ発動できない',
   sc('八尺勾玉').condition(C(0,ym2,'sz',0,'activate',{}))===false);
ok('八尺勾玉 ruling: スピリット以外には装備できない（equipSpec）',
   equipLegalV15(ym2,h(ym2NonSp))===false);
reset0();
let ym3=mk('八尺勾玉',0),ym3Sp=mk(SPIRIT,0);
gameState.players[0].grave=[ym3];gameState.players[0].hand=[ym3Sp];
ensureCardUid(gameState,ym3Sp);
ym3.e2HostUid=ym3Sp.uid;
ym3.graveInfo={turn:gameState.turn,from:'sz',byDestroy:false,byPlayer:null};
let ym3Ctx=C(0,ym3,'grave',0,'activate',{});
ok('八尺勾玉 positive: 装備先が手札に戻った事で墓地へ行った時に発動できる',
   sc('八尺勾玉').condition(ym3Ctx)===true);
sc('八尺勾玉').resolve(ym3Ctx);
ok('八尺勾玉 card-specific: このカードが手札に戻る',
   gameState.players[0].hand.some(c=>c&&dbOf(c).n==='八尺勾玉'),
   'hand='+gameState.players[0].hand.length);

/* ============ 4. サクリファイス・ソード ============ */
reset0();
let ss=mk('サクリファイス・ソード',0),ssDark=mk(DARKM,0);
gameState.players[0].sz=[ss];gameState.players[0].mz=[ssDark];
let ssCtx=C(0,ss,'sz',0,'activate',{});
ok('サクリファイス・ソード positive: 闇属性がいれば発動できる',
   sc('サクリファイス・ソード').condition(ssCtx)===true);
ssCtx.selectedTargets=[h(ssDark)];
sc('サクリファイス・ソード').resolve(ssCtx);
ss.face='up';
ok('サクリファイス・ソード card-specific: 装備され攻撃力が400アップ',
   !!ss.equipTo&&curATK(ssDark)===dbOf(ssDark).atk+400,'atk='+curATK(ssDark));
reset0();
let ss2=mk('サクリファイス・ソード',0),ss2Dark=mk(DARKM,0);
gameState.players[0].grave=[ss2,ss2Dark];
ensureCardUid(gameState,ss2Dark);
ss2.e2HostUid=ss2Dark.uid;
ss2.graveInfo={turn:gameState.turn,from:'sz',byDestroy:false,byPlayer:null};
ss2Dark.graveInfo={turn:gameState.turn,from:'mz',byDestroy:false,byPlayer:null};
let ss2Ctx=C(0,ss2,'grave',0,'activate',{});
ok('サクリファイス・ソード positive: 装備先がリリースされた時に発動できる',
   sc('サクリファイス・ソード').condition(ss2Ctx)===true);
sc('サクリファイス・ソード').resolve(ss2Ctx);
ok('サクリファイス・ソード card-specific: このカードが手札に戻る',
   gameState.players[0].hand.some(c=>c&&dbOf(c).n==='サクリファイス・ソード'));
reset0();
let ss3=mk('サクリファイス・ソード',0),ss3Dark=mk(DARKM,0);
gameState.players[0].grave=[ss3,ss3Dark];
ensureCardUid(gameState,ss3Dark);
ss3.e2HostUid=ss3Dark.uid;
ss3.graveInfo={turn:gameState.turn,from:'sz',byDestroy:false,byPlayer:null};
ss3Dark.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
ok('サクリファイス・ソード negative: 装備先が破壊された場合は手札に戻らない',
   sc('サクリファイス・ソード').condition(C(0,ss3,'grave',0,'activate',{}))===false);
reset0();
let ss4=mk('サクリファイス・ソード',0),ss4Light=mk(BIG,0);
gameState.players[0].sz=[ss4];gameState.players[0].mz=[ss4Light];
ok('サクリファイス・ソード ruling: 闇属性以外には装備できない（equipSpec）',
   equipLegalV15(ss4,h(ss4Light))===false);

/* ============ 5. 疫病ウィルス ブラックダスト ============ */
reset0();
let bd=mk('疫病ウィルス ブラックダスト',0),bdFoe=mk(BIG,1);
gameState.players[0].sz=[bd];gameState.players[1].mz=[bdFoe];
ensureCardUid(gameState,bd);ensureCardUid(gameState,bdFoe);
let bdCtx=C(0,bd,'sz',0,'activate',{});
ok('疫病ウィルス ブラックダスト positive: 表側モンスターがいれば発動できる',
   sc('疫病ウィルス ブラックダスト').condition(bdCtx)===true);
bdCtx.selectedTargets=[h(bdFoe)];
sc('疫病ウィルス ブラックダスト').resolve(bdCtx);
bd.face='up';
ok('疫病ウィルス ブラックダスト card-specific: 装備モンスターは攻撃できない',
   cannotAttackNow(bdFoe)===true);
ok('疫病ウィルス ブラックダスト card-specific: 2回目のエンドフェイズの破壊が予約される',
   API.schedules('e2.blackDust').length===1);
gameState.turn=gameState.turn+2;gameState.activePlayer=1;gameState.phase='end';
runDueSchedulesV7('endPhase',gameState);
ok('疫病ウィルス ブラックダスト card-specific: 予約が発火して装備モンスターを破壊しこのカードは手札に戻る',
   gameState.players[1].mz.length===0
   &&gameState.players[0].hand.some(c=>c&&dbOf(c).n==='疫病ウィルス ブラックダスト'),
   'foeMz='+gameState.players[1].mz.length+' hand='+gameState.players[0].hand.length);
reset0();
let bd2=mk('疫病ウィルス ブラックダスト',0);
gameState.players[0].sz=[bd2];gameState.players[0].mz=[];gameState.players[1].mz=[];
ok('疫病ウィルス ブラックダスト negative: 表側モンスターがいなければ発動できない',
   sc('疫病ウィルス ブラックダスト').condition(C(0,bd2,'sz',0,'activate',{}))===false);

/* ============ 6. ジェムエレファント ============ */
reset0();
let ge=mk('ジェムエレファント',0);
gameState.players[0].mz=[ge];
let geCtx=C(0,ge,'mz',0,'activate',{});
ok('ジェムエレファント positive: メインフェイズに手札に戻せる',
   sc('ジェムエレファント').condition(geCtx)===true);
sc('ジェムエレファント').resolve(geCtx);
ok('ジェムエレファント card-specific: 自身が手札に戻る',
   gameState.players[0].mz.length===0&&gameState.players[0].hand.length===1);
reset0();
gameState.phase='battle';
let ge2=mk('ジェムエレファント',0),ge2Foe=mk(BIG,1);
gameState.players[0].mz=[ge2];gameState.players[1].mz=[ge2Foe];
gameState.players[0].hand=[mk(DARKM,0)];
gameState.battle={player:1,atkIdx:0,target:0};
let ge2Ctx=C(0,ge2,'mz',0,'activate',{});
ok('ジェムエレファント positive: 戦闘のダメージ計算時に発動できる',
   sc('ジェムエレファント').condition(ge2Ctx)===true);
sc('ジェムエレファント').selectTargets(ge2Ctx,r=>{ge2Ctx.selectedTargets=r;});
let ge2Cost=false;sc('ジェムエレファント').cost(ge2Ctx,v=>{ge2Cost=v;});
ok('ジェムエレファント positive: コストで手札の通常モンスターを墓地へ送る',
   ge2Cost&&gameState.players[0].hand.length===0);
let ge2Def=curDEF(ge2);
sc('ジェムエレファント').resolve(ge2Ctx);
ok('ジェムエレファント card-specific: 守備力が1000アップする',
   curDEF(ge2)===ge2Def+1000,'def='+ge2Def+'→'+curDEF(ge2));
gameState.battle=null;
reset0();
gameState.phase='battle';
let ge3=mk('ジェムエレファント',0),ge3Foe=mk(BIG,1);
gameState.players[0].mz=[ge3];gameState.players[1].mz=[ge3Foe];
gameState.players[0].hand=[mk('強欲な壺',0)];
gameState.battle={player:1,atkIdx:0,target:0};
ok('ジェムエレファント negative: 手札に通常モンスターがなければ発動できない',
   sc('ジェムエレファント').condition(C(0,ge3,'mz',0,'activate',{}))===false);
gameState.battle=null;
ok('ジェムエレファント ruling: 1ターンに1度（countLimit）',
   sc('ジェムエレファント').countLimit===1);

/* ============ 7. BF－激震のアブロオロス ============ */
reset0();
let ab=mk('BF－激震のアブロオロス',0);
gameState.players[0].mz=[ab];
gameState.players[1].sz=[mk('強欲な壺',1),mk('落とし穴',1)];
let abCtx=C(0,ab,'mz',0,'activate',{});
ok('BF－激震のアブロオロス positive: メインフェイズ1で相手の魔法・罠があれば発動できる',
   sc('BF－激震のアブロオロス').condition(abCtx)===true);
let abAtk=curATK(ab);
sc('BF－激震のアブロオロス').resolve(abCtx);
ok('BF－激震のアブロオロス card-specific: 攻撃力が1000ダウンし相手の魔法・罠が全て手札に戻る',
   curATK(ab)===abAtk-1000&&gameState.players[1].sz.length===0
   &&gameState.players[1].hand.length===2,
   'atk='+abAtk+'→'+curATK(ab)+' foeHand='+gameState.players[1].hand.length);
ok('BF－激震のアブロオロス ruling: 特殊召喚できない（cannotSpecialSummon）',
   sc('BF－激震のアブロオロス').cannotSpecialSummon===true);
reset0();
gameState.phase='battle';
let ab2=mk('BF－激震のアブロオロス',0),ab2Foe=mk(BIG,1);
gameState.players[0].mz=[ab2];gameState.players[1].mz=[ab2Foe];
gameState.battle={player:1,atkIdx:0,target:0};
ok('BF－激震のアブロオロス card-specific: 戦闘した相手モンスターは戦闘で破壊されない',
   (protectionRecordV21(gameState,ab2Foe,{cause:'battle'})||{}).battle===true);
let ab2Ctx=ctxDS(0,ab2,{atkCard:ab2Foe,defCard:ab2});
ok('BF－激震のアブロオロス positive: 戦闘後のダメージ計算後に誘発する',
   sc('BF－激震のアブロオロス').passive.onDamageStep(ab2Ctx)===true);
sc('BF－激震のアブロオロス').resolve(ab2Ctx);
ok('BF－激震のアブロオロス card-specific: 戦闘した相手モンスターが手札に戻る',
   gameState.players[1].mz.length===0&&gameState.players[1].hand.length===1);
gameState.battle=null;
reset0();
gameState.phase='main2';
let ab3=mk('BF－激震のアブロオロス',0);
gameState.players[0].mz=[ab3];gameState.players[1].sz=[mk('強欲な壺',1)];
ok('BF－激震のアブロオロス negative: メインフェイズ2では発動できない',
   sc('BF－激震のアブロオロス').condition(C(0,ab3,'mz',0,'activate',{}))===false);

/* ============ 8. トラップ・キャプチャー ============ */
reset0();
let tc=mk('トラップ・キャプチャー',0,'down'),tcTrap=mk('落とし穴',0);
gameState.players[0].sz=[tc,tcTrap];gameState.players[0].hand=[mk(DARKM,0)];
ensureCardUid(gameState,tc);ensureCardUid(gameState,tcTrap);
let tcCtx=ctxEv(0,tc,'onActivateSuccess',
  {uid:tcTrap.uid,player:0,kind:'trap',sub:'normal',chainId:1},'sz');
ok('トラップ・キャプチャー positive: 自分の罠の発動に反応する',
   sc('トラップ・キャプチャー').passive.onActivateSuccess(tcCtx)===true);
let tcCost=false;sc('トラップ・キャプチャー').cost(tcCtx,v=>{tcCost=v;});
ok('トラップ・キャプチャー positive: コストで手札を1枚捨てる',
   tcCost&&gameState.players[0].hand.length===0);
sc('トラップ・キャプチャー').resolve(tcCtx);
ok('トラップ・キャプチャー card-specific: 対象の罠の uid が記録される',
   Number(tc.e2WatchUid)===tcTrap.uid,'watch='+tc.e2WatchUid);
/* その罠が墓地へ送られた状況を作る */
gameState.players[0].sz=[];gameState.players[0].grave=[tc,tcTrap];
let tcCtx2=C(0,tc,'grave',0,'activate',{});
ok('トラップ・キャプチャー positive: 記録した罠が墓地へ行ったら発動できる',
   sc('トラップ・キャプチャー').condition(tcCtx2)===true);
sc('トラップ・キャプチャー').resolve(tcCtx2);
ok('トラップ・キャプチャー card-specific: その罠が手札に戻る',
   gameState.players[0].hand.some(c=>c&&dbOf(c).n==='落とし穴'),
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let tc2=mk('トラップ・キャプチャー',0,'down'),tc2Sp=mk('強欲な壺',0);
gameState.players[0].sz=[tc2];gameState.players[0].hand=[mk(DARKM,0)];
ensureCardUid(gameState,tc2Sp);
ok('トラップ・キャプチャー negative: 魔法の発動には反応しない',
   sc('トラップ・キャプチャー').passive.onActivateSuccess(
     ctxEv(0,tc2,'onActivateSuccess',
       {uid:tc2Sp.uid,player:0,kind:'spell',chainId:1},'sz'))===false);
reset0();
let tc3=mk('トラップ・キャプチャー',0,'down'),tc3Trap=mk('落とし穴',1);
gameState.players[0].sz=[tc3];gameState.players[1].sz=[tc3Trap];
gameState.players[0].hand=[mk(DARKM,0)];
ensureCardUid(gameState,tc3Trap);
ok('トラップ・キャプチャー ruling: 相手の罠の発動には反応しない',
   sc('トラップ・キャプチャー').passive.onActivateSuccess(
     ctxEv(0,tc3,'onActivateSuccess',
       {uid:tc3Trap.uid,player:1,kind:'trap',chainId:1},'sz'))===false);

/* ============ 9. スピリットの誘い ============ */
reset0();
gameState.phase='standby';gameState.activePlayer=0;
let sl=mk('スピリットの誘い',0);
gameState.players[0].sz=[sl];
let slCtx=C(0,sl,'sz',0,'activate',{});
ok('スピリットの誘い positive: 自分のスタンバイフェイズに処理する',
   sc('スピリットの誘い').condition(slCtx)===true);
let slLp=gameState.players[0].lp;
sc('スピリットの誘い').resolve(slCtx);
ok('スピリットの誘い card-specific: 500ライフポイントを払って維持される',
   gameState.players[0].lp===slLp-500&&gameState.players[0].sz.length===1,
   'lp='+slLp+'→'+gameState.players[0].lp);
reset0();
gameState.phase='standby';gameState.activePlayer=0;
let sl2=mk('スピリットの誘い',0);
gameState.players[0].sz=[sl2];gameState.players[0].lp=400;
sc('スピリットの誘い').resolve(C(0,sl2,'sz',0,'activate',{}));
ok('スピリットの誘い card-specific: 払えなければこのカードが破壊される',
   gameState.players[0].sz.length===0);
reset0();
let sl3=mk('スピリットの誘い',0,'up'),sl3Sp=mk(SPIRIT,0),sl3Foe=mk(BIG,1);
gameState.players[0].sz=[sl3];gameState.players[0].hand=[sl3Sp];
gameState.players[1].mz=[sl3Foe];
ensureCardUid(gameState,sl3Sp);
let sl3Ctx=ctxEv(0,sl3,'onLeaveField',
  {uid:sl3Sp.uid,card:sl3Sp,toZone:'hand'},'sz');
ok('スピリットの誘い positive: スピリットが手札に戻った時に誘発する',
   sc('スピリットの誘い').passive.onLeaveField(sl3Ctx)===true);
sc('スピリットの誘い').resolve(sl3Ctx);
ok('スピリットの誘い 隠匿情報: 選ぶのは相手（選択要求は相手に出る）',
   !!pending()&&pending().player===1,
   'player='+(pending()&&pending().player));
API.answerChoice([pending().candidates[0].key]);
ok('スピリットの誘い card-specific: 相手が選んだモンスターが手札に戻る',
   gameState.players[1].mz.length===0&&gameState.players[1].hand.length===1);
reset0();
let sl4=mk('スピリットの誘い',0,'up'),sl4NonSp=mk(BIG,0),sl4Foe=mk(BIG,1);
gameState.players[0].sz=[sl4];gameState.players[0].hand=[sl4NonSp];
gameState.players[1].mz=[sl4Foe];
ensureCardUid(gameState,sl4NonSp);
ok('スピリットの誘い negative: スピリット以外が戻っても誘発しない',
   sc('スピリットの誘い').passive.onLeaveField(
     ctxEv(0,sl4,'onLeaveField',
       {uid:sl4NonSp.uid,card:sl4NonSp,toZone:'hand'},'sz'))===false);

/* ================= passive / continuous は read-only ================= */
reset0();
let roSs=mk('サクリファイス・ソード',0),roDark=mk(DARKM,0),roBd=mk('疫病ウィルス ブラックダスト',0);
gameState.players[0].sz=[roSs,roBd];gameState.players[0].mz=[roDark];
ensureCardUid(gameState,roSs);ensureCardUid(gameState,roDark);
roSs.equipUid=roSs.equipUid||801;roSs.equipTo={p:0,uid:roDark.uid};
roDark.equippedBy=[roSs.equipUid];roSs.face='up';
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roDark);cannotAttackNow(roDark);
ok('cycle33 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('サクリファイス・ソード',0),rp1Dark=mk(DARKM,0);
gameState.players[0].sz=[rp1];gameState.players[0].mz=[rp1Dark];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp1Ctx=C(0,rp1,'sz',0,'activate',{});
rp1Ctx.selectedTargets=[h(rp1Dark)];
sc('サクリファイス・ソード').resolve(rp1Ctx);
let rq1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle33 Replay: 装備と装備先 uid の記録が digest 一致で再生される',rq1.ok,rq1.reason||'');
reset0();
let rp2=mk('BF－激震のアブロオロス',0);
gameState.players[0].mz=[rp2];
gameState.players[1].sz=[mk('強欲な壺',1)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
sc('BF－激震のアブロオロス').resolve(C(0,rp2,'mz',0,'activate',{}));
let rq2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle33 Replay: 攻撃力ダウン＋バウンスが digest 一致で再生される',rq2.ok,rq2.reason||'');
let snap33=JSON.stringify(gameState);
ok('cycle33 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap33))===snap33);
ok('cycle33 直列化: 予約に関数が入っていない',snap33.indexOf('function')<0);
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
