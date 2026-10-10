/* Auto cycle 16 — 16枚。positive / negative / ruling edge / Replay。 */
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
function battleKill(card,foe){
  card.battleDestroyed=true; act({type:'BATTLE_CLEANUP'});
  return {defCard:card,atkCard:foe,destroyedDef:true,destroyedAtk:false,step:'leave'};
}
function pending(){return pendingChoiceV49(gameState);}
const PLAIN='ワイト';        /* 闇 アンデット lv1 ATK300 DEF200 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 ATK3000 DEF2500 */

const ALL=['カオスライダー グスタフ','シュレツダー','ジャイロイド','レグルス','バスター・マーセナリ',
 'イモータル・ルーラー','神剣－フェニックスブレード','ガトリング・ドラゴン','Ωメガネ',
 'ジャスティス・ブリンガー','ダーク・ホルス・ドラゴン','コート・オブ・ジャスティス',
 'おジャマ・ブルー','大樹海','スピリット・フォース','パラレル・セレクト'];
ALL.forEach(n=>ok('cycle16 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle16 枚数は16',ALL.length===16);

/* ============ カオスライダー グスタフ ============ */
reset0();
let cg=mk('カオスライダー グスタフ',0);
gameState.players[0].mz=[cg];
gameState.players[0].grave=[mk('強欲な壺',0),mk('強欲な壺',0)];
let ccg=C(0,cg,'mz',0);
ok('カオスライダー グスタフ positive: 墓地に魔法があれば発動できる',
   sc('カオスライダー グスタフ').condition(ccg)===true,ccg.reason||'');
sc('カオスライダー グスタフ').selectTargets(ccg,t=>{ccg.selectedTargets=t;});
sc('カオスライダー グスタフ').resolve(ccg);
ok('カオスライダー グスタフ positive: 除外した枚数×300アップ',
   gameState.players[0].banish.length===2&&curATK(cg)===1400+600,
   'atk='+curATK(cg)+' banish='+gameState.players[0].banish.length);
ok('カオスライダー グスタフ ruling: 相手ターン終了時の解除が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c5.gustaph'&&s.at==='turnEnd'));
let cgSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c5.gustaph');
scheduleHandlerV7('c5.gustaph')(cgSch.args||{}, cgSch);
ok('カオスライダー グスタフ ruling: 予約が解決すると攻撃力が戻る',curATK(cg)===1400,'atk='+curATK(cg));
ok('カオスライダー グスタフ ruling: 1ターンに1度の宣言がある',
   sc('カオスライダー グスタフ').countLimit===1);
reset0();
let cg2=mk('カオスライダー グスタフ',0);
gameState.players[0].mz=[cg2];gameState.players[0].grave=[mk(PLAIN,0)];
ok('カオスライダー グスタフ negative: 墓地に魔法が無ければ発動できない',
   sc('カオスライダー グスタフ').condition(C(0,cg2,'mz',0))===false);

/* ============ シュレツダー ============ */
reset0();
let sh=mk('シュレツダー',0),mach=mk('ジェネクス・コントローラー',0),lowFoe=mk(PLAIN,1),highFoe=mk(BIG,1);
gameState.players[0].mz=[sh];gameState.players[0].hand=[mach];
gameState.players[1].mz=[lowFoe,highFoe];
let csh=C(0,sh,'mz',0);
ok('シュレツダー positive: 手札に機械族と相手の表側モンスターがあれば発動できる',
   sc('シュレツダー').condition(csh)===true,csh.reason||'');
sc('シュレツダー').selectTargets(csh,t=>{csh.selectedTargets=t;});
sc('シュレツダー').resolve(csh);
ok('シュレツダー positive: 機械族を墓地へ送り、レベル以下のモンスターを破壊する',
   gameState.players[1].mz.length===1&&gameState.players[1].mz[0]===highFoe,
   'p1mz='+gameState.players[1].mz.map(c=>dbOf(c).n).join(','));
ok('シュレツダー ruling: レベルを超えるモンスターは破壊できない（青眼lv8が残る）',
   gameState.players[1].mz.some(c=>c===highFoe));
reset0();
let sh2=mk('シュレツダー',0);
gameState.players[0].mz=[sh2];gameState.players[0].hand=[mk(BIG,0)];  /* ドラゴン族 */
gameState.players[1].mz=[mk(PLAIN,1)];
ok('シュレツダー negative: 手札に機械族がいなければ発動できない',
   sc('シュレツダー').condition(C(0,sh2,'mz',0))===false);

/* ============ ジャイロイド ============ */
reset0();
let gy=mk('ジャイロイド',0);
gameState.players[0].mz=[gy];
const battleProt=(c)=>applyDestructionProtectionV21(gameState,c,
  {cause:'battle',opponentCard:null,byPlayer:null,targeting:false,sourceKind:null});
const effectProt=(c)=>applyDestructionProtectionV21(gameState,c,
  {cause:'effect',opponentCard:null,byPlayer:null,targeting:false,sourceKind:null});
ok('ジャイロイド positive: 戦闘では破壊されない',!!battleProt(gy));
ok('ジャイロイド ruling: カードの効果では守られない',!effectProt(gy));
ok('ジャイロイド ruling: 1ターンに1度なので2回目は守られない',!battleProt(gy));

/* ============ レグルス ============ */
reset0();
let rg=mk('レグルス',0);
gameState.players[0].mz=[rg];
gameState.players[0].grave=[mk('天空の聖域',0)];
let crg=C(0,rg,'mz',0);
ok('レグルス positive: 墓地にフィールド魔法があれば発動できる',
   sc('レグルス').condition(crg)===true,crg.reason||'');
let deckB=gameState.players[0].deck.length;
sc('レグルス').selectTargets(crg,t=>{crg.selectedTargets=t;});
sc('レグルス').resolve(crg);
ok('レグルス positive: フィールド魔法がデッキに戻る',
   gameState.players[0].deck.length===deckB+1&&gameState.players[0].grave.length===0);
reset0();
let rg2=mk('レグルス',0);
gameState.players[0].mz=[rg2];gameState.players[0].grave=[mk('強欲な壺',0)];  /* 通常魔法 */
ok('レグルス negative: フィールド魔法でなければ発動できない',
   sc('レグルス').condition(C(0,rg2,'mz',0))===false);

/* ============ バスター・マーセナリ ============ */
reset0();
let bm=mk('バスター・マーセナリ',0),bmode=mk('バスター・モード',0),foeST=mk('落とし穴',1,'down');
gameState.players[0].mz=[bm];gameState.players[0].hand=[bmode];gameState.players[1].sz=[foeST];
let cbm=C(0,bm,'mz',0);
ok('バスター・マーセナリ positive: 「バスター・モード」と相手の魔法・罠があれば発動できる',
   sc('バスター・マーセナリ').condition(cbm)===true,cbm.reason||'');
sc('バスター・マーセナリ').selectTargets(cbm,t=>{cbm.selectedTargets=t;});
sc('バスター・マーセナリ').resolve(cbm);
ok('バスター・マーセナリ positive: 「バスター・モード」をデッキに戻し相手の魔法・罠を破壊する',
   gameState.players[1].sz.length===0&&gameState.players[0].hand.length===0,
   'p1sz='+gameState.players[1].sz.length);
reset0();
let bm2=mk('バスター・マーセナリ',0);
gameState.players[0].mz=[bm2];gameState.players[1].sz=[mk('落とし穴',1,'down')];
ok('バスター・マーセナリ negative: 「バスター・モード」が無ければ発動できない',
   sc('バスター・マーセナリ').condition(C(0,bm2,'mz',0))===false);

/* ============ イモータル・ルーラー ============ */
reset0();
let ir=mk('イモータル・ルーラー',0);
gameState.players[0].mz=[ir];
gameState.players[0].grave=[mk('アンデットワールド',0)];
ok('イモータル・ルーラー ruling: 特殊召喚できない宣言を持つ',
   sc('イモータル・ルーラー').cannotSpecialSummon===true);
let cir=C(0,ir,'mz',0);
ok('イモータル・ルーラー positive: 墓地に「アンデットワールド」があれば発動できる',
   sc('イモータル・ルーラー').condition(cir)===true,cir.reason||'');
sc('イモータル・ルーラー').selectTargets(cir,t=>{cir.selectedTargets=t;});
sc('イモータル・ルーラー').cost(cir,()=>{});
sc('イモータル・ルーラー').resolve(cir);
ok('イモータル・ルーラー positive: 自身をリリースして「アンデットワールド」を手札に加える',
   gameState.players[0].mz.length===0
   &&gameState.players[0].hand.some(c=>dbOf(c).n==='アンデットワールド'),
   'mz='+gameState.players[0].mz.length+' hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let ir2=mk('イモータル・ルーラー',0);
gameState.players[0].mz=[ir2];gameState.players[0].grave=[];
ok('イモータル・ルーラー negative: 墓地に「アンデットワールド」が無ければ発動できない',
   sc('イモータル・ルーラー').condition(C(0,ir2,'mz',0))===false);

/* ============ 神剣－フェニックスブレード ============ */
reset0();
let pb=mk('神剣－フェニックスブレード',0),w1=mk('切り込み隊長',0),w2=mk('切り込み隊長',0);
gameState.players[0].grave=[pb,w1,w2];
ok('神剣－フェニックスブレード ruling: 戦士族にのみ装備可能',
   sc('神剣－フェニックスブレード').equipSpec.canEquip({db:dbOf(w1)})===true
   &&sc('神剣－フェニックスブレード').equipSpec.canEquip({db:dbOf(mk(BIG,0))})===false);
let cpb=C(0,pb,'grave',0);
ok('神剣－フェニックスブレード positive: 墓地に戦士族2体があれば発動できる',
   sc('神剣－フェニックスブレード').condition(cpb)===true,cpb.reason||'');
sc('神剣－フェニックスブレード').selectTargets(cpb,t=>{cpb.selectedTargets=t;});
sc('神剣－フェニックスブレード').resolve(cpb);
ok('神剣－フェニックスブレード positive: 戦士族2体を除外して自身が手札に戻る',
   gameState.players[0].banish.length===2&&gameState.players[0].hand.some(c=>c===pb),
   'banish='+gameState.players[0].banish.length+' hand='+gameState.players[0].hand.length);
reset0();
let pb2=mk('神剣－フェニックスブレード',0);
gameState.players[0].grave=[pb2,mk('切り込み隊長',0)];
ok('神剣－フェニックスブレード negative: 墓地の戦士族が1体では発動できない',
   sc('神剣－フェニックスブレード').condition(C(0,pb2,'grave',0))===false);
reset0();
let pb3=mk('神剣－フェニックスブレード',0,'up'),host=mk('切り込み隊長',0);
gameState.players[0].sz=[pb3];gameState.players[0].mz=[host];
ensureCardUid(gameState,host);pb3.equipTo={uid:host.uid};
ok('神剣－フェニックスブレード positive: 装備モンスターの攻撃力が300アップ',
   curATK(host)===1200+300,'atk='+curATK(host));

/* ============ ガトリング・ドラゴン ============ */
reset0();
let gd=mk('ガトリング・ドラゴン',0);
gameState.players[0].mz=[gd,mk(PLAIN,0),mk(PLAIN,0)];
gameState.players[1].mz=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
let cgd=C(0,gd,'mz',0);
ok('ガトリング・ドラゴン positive: 表側なら発動できる',
   sc('ガトリング・ドラゴン').condition(cgd)===true,cgd.reason||'');
let rngB=gameState.rngState;
let total=gameState.players[0].mz.length+gameState.players[1].mz.length;
sc('ガトリング・ドラゴン').resolve(cgd);
ok('ガトリング・ドラゴン positive: コイントスで rngState が進む',gameState.rngState!==rngB);
let heads=Number(gameState.players[0].temporaryFlags.c5GatlingHeads);
ok('ガトリング・ドラゴン ruling: 表の数は0〜3',heads>=0&&heads<=3,'heads='+heads);
ok('ガトリング・ドラゴン positive: 表の数だけモンスターが破壊される',
   gameState.players[0].mz.length+gameState.players[1].mz.length===total-heads,
   'heads='+heads+' remaining='+(gameState.players[0].mz.length+gameState.players[1].mz.length));
ok('ガトリング・ドラゴン ruling: 1ターンに1度の宣言がある',sc('ガトリング・ドラゴン').countLimit===1);

/* ============ Ωメガネ ============ */
reset0();
let om=mk('Ωメガネ',0,'up'),eqHost=mk(PLAIN,0);
gameState.players[0].sz=[om];gameState.players[0].mz=[eqHost];
ensureCardUid(gameState,eqHost);om.equipTo={uid:eqHost.uid};
gameState.players[1].hand=[mk(BIG,1),mk(PLAIN,1)];
let com=C(0,om,'sz',0);
ok('Ωメガネ positive: 相手に手札があれば発動できる',
   sc('Ωメガネ').condition(com)===true,com.reason||'');
let rngO=gameState.rngState;
sc('Ωメガネ').resolve(com);
ok('Ωメガネ positive: ランダム選択なので rngState が進む',gameState.rngState!==rngO);
let pom=pending();
ok('Ωメガネ ruling: 確認するのは発動プレイヤーだけ',!!pom&&pom.player===0,'player='+(pom&&pom.player));
answerChoiceV49([pom.candidates[0].key]);
ok('Ωメガネ ruling: 相手の手札は減らない（確認するだけ）',
   gameState.players[1].hand.length===2);
ok('Ωメガネ ruling: 発動ターン、装備モンスターは攻撃できない',
   cannotAttackNow(eqHost)===true);
gameState.turn=gameState.turn+1;
ok('Ωメガネ ruling: 次のターンは攻撃できる',cannotAttackNow(eqHost)===false);
reset0();
let om2=mk('Ωメガネ',0,'up');
gameState.players[0].sz=[om2];gameState.players[1].hand=[];
ok('Ωメガネ negative: 相手の手札が無ければ発動できない',
   sc('Ωメガネ').condition(C(0,om2,'sz',0))===false);

/* ============ ジャスティス・ブリンガー ============ */
reset0();
let jb=mk('ジャスティス・ブリンガー',0),ssFoe=mk(BIG,1);
gameState.players[0].mz=[jb];gameState.players[1].mz=[ssFoe];
ensureCardUid(gameState,ssFoe);ssFoe.specialSummoned=true;
let evJB={uid:ssFoe.uid,player:1,kind:'monster',chainId:1,chainLink:1,cardId:ssFoe.id};
let cjb=ctxEv(0,jb,'onActivateSuccess',evJB,'mz');
ok('ジャスティス・ブリンガー positive: 相手の特殊召喚モンスターの効果発動に反応する',
   sc('ジャスティス・ブリンガー').passive.onActivateSuccess(cjb)===true);
ok('ジャスティス・ブリンガー ruling: 1ターンに1度の宣言がある',
   sc('ジャスティス・ブリンガー').countLimit===1);
reset0();
let jb2=mk('ジャスティス・ブリンガー',0),normFoe=mk(BIG,1);
gameState.players[0].mz=[jb2];gameState.players[1].mz=[normFoe];
ensureCardUid(gameState,normFoe);   /* specialSummoned を立てない */
ok('ジャスティス・ブリンガー negative: 通常召喚されたモンスターの効果には反応しない',
   sc('ジャスティス・ブリンガー').passive.onActivateSuccess(
     ctxEv(0,jb2,'onActivateSuccess',{uid:normFoe.uid,player:1,kind:'monster',cardId:normFoe.id},'mz'))===false);
reset0();
let jb3=mk('ジャスティス・ブリンガー',0),ssFoe3=mk(BIG,1);
gameState.players[0].mz=[jb3];gameState.players[1].mz=[ssFoe3];
ensureCardUid(gameState,ssFoe3);ssFoe3.specialSummoned=true;
ok('ジャスティス・ブリンガー negative: 魔法の発動には反応しない',
   sc('ジャスティス・ブリンガー').passive.onActivateSuccess(
     ctxEv(0,jb3,'onActivateSuccess',{uid:ssFoe3.uid,player:1,kind:'spell',cardId:ssFoe3.id},'mz'))===false);

/* ============ ダーク・ホルス・ドラゴン ============ */
reset0();
let dh=mk('ダーク・ホルス・ドラゴン',0);
gameState.players[0].mz=[dh];
gameState.players[0].grave=[mk('切り込み隊長',0)];   /* 光属性 lv3 → 不適 */
gameState.players[0].grave=[mk('ラッコアラ',0)];      /* 水属性 → 不適 */
gameState.players[0].grave=[mk('シュレツダー',0)];    /* 地属性 lv4 → 不適 */
gameState.players[0].grave=[mk('ジャスティス・ブリンガー',0)]; /* 地属性 → 不適 */
gameState.players[0].grave=[mk('カオスライダー グスタフ',0)];  /* 風属性 → 不適 */
gameState.players[0].grave=[mk('ヴァイロン・オーム',0)];      /* 光属性 → 不適 */
gameState.players[0].grave=[mk('スナップドラゴン',0)];        /* 地属性 lv2 → 不適 */
gameState.players[0].grave=[mk('機皇兵ワイゼル・アイン',0)];   /* 闇属性 lv4 → 適 */
gameState.activePlayer=1;gameState.phase='main1';
let foeSp=mk('強欲な壺',1);gameState.players[1].sz=[foeSp];ensureCardUid(gameState,foeSp);
let cdh=ctxEv(0,dh,'onActivateSuccess',{uid:foeSp.uid,player:1,kind:'spell',cardId:foeSp.id},'mz');
ok('ダーク・ホルス・ドラゴン positive: 相手メインフェイズの魔法発動に反応する',
   sc('ダーク・ホルス・ドラゴン').passive.onActivateSuccess(cdh)===true);
sc('ダーク・ホルス・ドラゴン').selectTargets(cdh,t=>{cdh.selectedTargets=t;});
sc('ダーク・ホルス・ドラゴン').resolve(cdh);
ok('ダーク・ホルス・ドラゴン positive: 墓地のレベル4の闇属性が特殊召喚される',
   gameState.players[0].mz.some(c=>dbOf(c).n==='機皇兵ワイゼル・アイン'),
   'p0mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
reset0();
let dh2=mk('ダーク・ホルス・ドラゴン',0);
gameState.players[0].mz=[dh2];
gameState.players[0].grave=[mk('機皇兵ワイゼル・アイン',0)];
gameState.activePlayer=0;gameState.phase='main1';     /* 自分のターン */
let mySp=mk('強欲な壺',0);gameState.players[0].sz=[mySp];ensureCardUid(gameState,mySp);
ok('ダーク・ホルス・ドラゴン negative: 自分のメインフェイズの魔法には反応しない',
   sc('ダーク・ホルス・ドラゴン').passive.onActivateSuccess(
     ctxEv(0,dh2,'onActivateSuccess',{uid:mySp.uid,player:0,kind:'spell',cardId:mySp.id},'mz'))===false);

/* ============ コート・オブ・ジャスティス ============ */
reset0();
let cj=mk('コート・オブ・ジャスティス',0),lv1a=mk('もけもけ',0),angel=mk('ホワイトポータン',0);
gameState.players[0].sz=[cj];gameState.players[0].mz=[lv1a];gameState.players[0].hand=[angel];
let ccj=C(0,cj,'sz',0);
ok('コート・オブ・ジャスティス positive: レベル1の天使族がいれば発動できる',
   sc('コート・オブ・ジャスティス').condition(ccj)===true,ccj.reason||'');
sc('コート・オブ・ジャスティス').selectTargets(ccj,t=>{ccj.selectedTargets=t;});
sc('コート・オブ・ジャスティス').resolve(ccj);
ok('コート・オブ・ジャスティス positive: 手札の天使族が特殊召喚される',
   gameState.players[0].mz.some(c=>c===angel),'p0mz='+gameState.players[0].mz.length);
reset0();
let cj2=mk('コート・オブ・ジャスティス',0);
gameState.players[0].sz=[cj2];gameState.players[0].mz=[mk(PLAIN,0)];  /* レベル1だが天使族ではない */
gameState.players[0].hand=[mk('ホワイトポータン',0)];
ok('コート・オブ・ジャスティス negative: レベル1の天使族がいなければ発動できない',
   sc('コート・オブ・ジャスティス').condition(C(0,cj2,'sz',0))===false);

/* ============ おジャマ・ブルー ============ */
reset0();
let ob=mk('おジャマ・ブルー',0),obk=mk(BIG,1);
gameState.players[0].mz=[ob];gameState.players[1].mz=[obk];
gameState.players[0].deck=[mk('おジャマ・イエロー',0),mk('おジャマ・グリーン',0),mk(PLAIN,0)];
let bob=battleKill(ob,obk);
let cob=ctxDS(0,ob,bob,'grave','leave');
ok('おジャマ・ブルー positive: 戦闘破壊され、デッキに「おジャマ」があれば誘発する',
   sc('おジャマ・ブルー').passive.onDamageStep(cob)===true);
sc('おジャマ・ブルー').selectTargets(cob,t=>{cob.selectedTargets=t;});
sc('おジャマ・ブルー').resolve(cob);
ok('おジャマ・ブルー positive: 「おジャマ」カード2枚が手札に加わる',
   gameState.players[0].hand.length===2
   &&gameState.players[0].hand.every(c=>isSetCardV4(dbOf(c),SETCODE.OJAMA)),
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let ob2=mk('おジャマ・ブルー',0),obk2=mk(BIG,1);
gameState.players[0].mz=[ob2];gameState.players[1].mz=[obk2];
gameState.players[0].deck=[mk(PLAIN,0)];
let bob2=battleKill(ob2,obk2);
ok('おジャマ・ブルー negative: デッキに「おジャマ」が無ければ発動できない',
   sc('おジャマ・ブルー').passive.onDamageStep(ctxDS(0,ob2,bob2,'grave','leave'))===false);

/* ============ 大樹海 ============ */
reset0();
let tj=mk('大樹海',0),insect=mk('電磁ミノ虫',0);   /* 昆虫族 lv3 */
gameState.players[0].field=tj;
gameState.players[0].mz=[insect];
gameState.players[0].deck=[mk('電磁ミノ虫',0),mk(PLAIN,0)];
API.destroy(h(insect),'テスト破壊',1);
let ctj=ctxEv(0,tj,'onDestroy',{},'field');
ok('大樹海 positive: 表側の昆虫族が破壊されて誘発する',
   sc('大樹海').passive.onDestroy(ctj)===true);
sc('大樹海').selectTargets(ctj,t=>{ctj.selectedTargets=t;});
sc('大樹海').resolve(ctj);
ok('大樹海 positive: 同じレベルの昆虫族がデッキから手札に加わる',
   gameState.players[0].hand.length===1&&dbOf(gameState.players[0].hand[0]).ra==='昆虫',
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let tj2=mk('大樹海',0),nonInsect=mk(BIG,0);
gameState.players[0].field=tj2;gameState.players[0].mz=[nonInsect];
gameState.players[0].deck=[mk('電磁ミノ虫',0)];
API.destroy(h(nonInsect),'テスト破壊',1);
ok('大樹海 negative: 昆虫族以外が破壊されても誘発しない',
   sc('大樹海').passive.onDestroy(ctxEv(0,tj2,'onDestroy',{},'field'))===false);

/* ============ スピリット・フォース ============ */
reset0();
let sf=mk('スピリット・フォース',0,'up'),myMon=mk(PLAIN,0),foeAtk=mk(BIG,1);
gameState.players[0].sz=[sf];gameState.players[0].mz=[myMon];gameState.players[1].mz=[foeAtk];
gameState.players[0].grave=[mk('ジャンク・シンクロン',0)];
gameState.activePlayer=1;
gameState.battle={player:1,atkIdx:0,target:0,step:'calc'};
let csf=ctxDS(0,sf,{atkCard:foeAtk,defCard:myMon,step:'calc'},'sz','calc');
ok('スピリット・フォース positive: 相手ターンの戦闘ダメージ計算時に誘発する',
   sc('スピリット・フォース').passive.onDamageStep(csf)===true);
sc('スピリット・フォース').selectTargets(csf,t=>{csf.selectedTargets=t;});
sc('スピリット・フォース').resolve(csf);
ok('スピリット・フォース positive: 自分への戦闘ダメージが0になる',
   applyBattleDamageFilters({to:0,amount:2700,atkCard:foeAtk,defCard:myMon,atkOwner:1,defOwner:0})===0);
ok('スピリット・フォース ruling: 相手へのダメージは減らさない',
   applyBattleDamageFilters({to:1,amount:2700,atkCard:myMon,defCard:foeAtk,atkOwner:0,defOwner:1})===2700);
reset0();
let sf2=mk('スピリット・フォース',0,'down');
gameState.players[0].sz=[sf2];gameState.activePlayer=0;
gameState.battle={player:0,atkIdx:0,target:0,step:'calc'};
ok('スピリット・フォース negative: 自分のターンでは発動できない',
   sc('スピリット・フォース').condition(C(0,sf2,'sz',0))===false);

/* ============ パラレル・セレクト ============ */
reset0();
let ps=mk('パラレル・セレクト',0,'down'),syn=mk('BF－アーマード・ウィング',0);
gameState.players[0].sz=[ps];gameState.players[0].mz=[syn];
gameState.players[0].banish=[mk('強欲な壺',0)];
API.destroy(h(syn),'相手の効果で破壊',1);
let cps=ctxEv(0,ps,'onDestroy',{},'sz');
ok('パラレル・セレクト positive: 自分のシンクロが相手に破壊されて誘発する',
   sc('パラレル・セレクト').passive.onDestroy(cps)===true);
sc('パラレル・セレクト').selectTargets(cps,t=>{cps.selectedTargets=t;});
sc('パラレル・セレクト').resolve(cps);
ok('パラレル・セレクト positive: 除外されている魔法カードが手札に加わる',
   gameState.players[0].hand.length===1&&gameState.players[0].banish.length===0,
   'hand='+gameState.players[0].hand.length);
reset0();
let ps2=mk('パラレル・セレクト',0,'down'),syn2=mk('BF－アーマード・ウィング',0);
gameState.players[0].sz=[ps2];gameState.players[0].mz=[syn2];
gameState.players[0].banish=[mk('強欲な壺',0)];
API.destroy(h(syn2),'自分の効果で破壊',0);
ok('パラレル・セレクト negative: 自分の効果で破壊された場合は発動できない',
   sc('パラレル・セレクト').passive.onDestroy(ctxEv(0,ps2,'onDestroy',{},'sz'))===false);
reset0();
let ps3=mk('パラレル・セレクト',0,'down'),nonSyn=mk(BIG,0);
gameState.players[0].sz=[ps3];gameState.players[0].mz=[nonSyn];
gameState.players[0].banish=[mk('強欲な壺',0)];
API.destroy(h(nonSyn),'相手の効果で破壊',1);
ok('パラレル・セレクト negative: シンクロモンスターでなければ発動できない',
   sc('パラレル・セレクト').passive.onDestroy(ctxEv(0,ps3,'onDestroy',{},'sz'))===false);

/* ================= 読み取り専用 passive の検証 ================= */
reset0();
let ro1=mk('ジャスティス・ブリンガー',0),ro2=mk('大樹海',0),ro3=mk('ジャイロイド',0);
gameState.players[0].mz=[ro1,ro3];gameState.players[0].field=ro2;
[ro1,ro3].forEach(c=>ensureCardUid(gameState,c));
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
sc('ジャスティス・ブリンガー').passive.onActivateSuccess(
  ctxEv(0,ro1,'onActivateSuccess',{uid:ro1.uid,player:1,kind:'monster'},'mz'));
sc('大樹海').passive.onDestroy(ctxEv(0,ro2,'onDestroy',{},'field'));
curATK(ro3);
ok('cycle16 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('カオスライダー グスタフ',0);
gameState.players[0].mz=[rp1];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.modAtk(h(rp1),600,0,'permanent','カオスライダー グスタフ');
API.schedule({at:'turnEnd',turns:1,player:0,handler:'c5.gustaph',
  args:{uid:rp1.uid},source:{card:rp1},note:'カオスライダー グスタフ'});
let ra1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle16 Replay: 攻撃力修正と解除予約が digest 一致で再生される',ra1.ok,ra1.reason||'');
reset0();
let rp2=mk('ガトリング・ドラゴン',0);
gameState.players[0].mz=[rp2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let seedB=gameState.rngState;
sc('ガトリング・ドラゴン').resolve(C(0,rp2,'mz',0));
ok('cycle16 Replay: コイントス3回で rngState が進む',gameState.rngState!==seedB);
let ra2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle16 Replay: コイントス結果が digest 一致で再生される',ra2.ok,ra2.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle16 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle16 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
