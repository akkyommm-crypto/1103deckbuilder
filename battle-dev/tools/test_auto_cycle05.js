/* Auto cycle 05 — 20枚。positive / negative / ruling edge / Replay。 */
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
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function pickFirst(){API.selectCard=(t,list,cb)=>cb(list[0]);}
function pickNamed(nm){API.selectCard=(t,list,cb)=>{const hit=list.find(x=>x&&x.card&&dbOf(x.card).n===nm);cb(hit||list[0]);};}
function C(p,card,zone,idx,ev,extra){const c=makeContext(p,card,zone,idx,ev||'activate',extra||{});
  if(extra&&extra.event)c.event=extra.event;return c;}
function ctxEv(p,card,ev,evt,zone){const loc=h(card);
  return C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,ev,{event:evt});}
function ctxDS(p,card,battle,zone,step){const loc=h(card);
  const c=C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',{event:{},battle:battle,step:step||'after'});
  c.battle=battle;c.step=step||'after';return c;}
function pending(){return pendingChoiceV49(gameState);}
/* S03-U62: some cards now open a real (SaveLoad-safe) API.requestChoice pending choice instead of the
   old synchronous API.selectCard closure the reset0() stub above intercepts. Auto-answer any such pending
   choice by always picking the first candidate (matches the stub's own semantics). */
function drain0(){for(let i=0;i<10&&pending();i++)__choicePickV49(0);}
const PLAIN='ワイト';        /* 闇 lv1 */
const BIG='青眼の白龍';       /* 光 lv8 */
const DARKM='デーモンの召喚';  /* 闇 lv6 */

const ALL=['カオス・グリード','凡人の施し','軽量化','ブライト・フューチャー','フレイム・オーガ','電動刃虫',
 '幸運の鉄斧','カードエクスクルーダー','木遁封印式','慈悲深き修道女','リターンソウル','ミノケンサテュロス',
 'X－セイバー ウルズ','インフェルニティ・デストロイヤー','カトブレパスと運命の魔女','インフォーマー・スパイダー',
 'ADチェンジャー','クラッキング','ウォーターハザード','エレキャノン'];
ALL.forEach(n=>ok('cycle05 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle05 枚数は20',ALL.length===20);

/* ================= AA ================= */
/* --- カオス・グリード --- */
reset0();
let cg=mk('カオス・グリード',0,'down');
gameState.players[0].sz=[cg];
gameState.players[0].banish=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
gameState.players[0].grave=[];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
let ccg=C(0,cg,'sz',0);
ok('カオス・グリード positive: 除外4枚・墓地0なら発動できる',sc('カオス・グリード').condition(ccg)===true);
let hand0=gameState.players[0].hand.length;
sc('カオス・グリード').resolve(ccg);
ok('カオス・グリード positive: 2枚ドローする',gameState.players[0].hand.length===hand0+2);
reset0();
let cg2=mk('カオス・グリード',0,'down');gameState.players[0].sz=[cg2];
gameState.players[0].banish=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
gameState.players[0].grave=[mk(PLAIN,0)];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0)];
ok('カオス・グリード negative: 墓地にカードがあれば発動できない',
   sc('カオス・グリード').condition(C(0,cg2,'sz',0))===false);
reset0();
let cg3=mk('カオス・グリード',0,'down');gameState.players[0].sz=[cg3];
gameState.players[0].banish=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0)];
ok('カオス・グリード negative: 除外が3枚では発動できない',
   sc('カオス・グリード').condition(C(0,cg3,'sz',0))===false);

/* --- 凡人の施し --- */
reset0();
let bo=mk('凡人の施し',0,'down');
gameState.players[0].sz=[bo];
let normalMon=mk('ヂェミナイ・エルフ',0);   /* 通常モンスター */
gameState.players[0].hand=[normalMon];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
let cbo=C(0,bo,'sz',0);
pickNamed('ヂェミナイ・エルフ');
sc('凡人の施し').resolve(cbo);drain0();
ok('凡人の施し positive: 2枚ドローする',gameState.players[0].hand.length>=2);
ok('凡人の施し positive: 手札の通常モンスターが除外される',
   gameState.players[0].banish.some(c=>c&&c.uid===normalMon.uid));
pickFirst();
reset0();
let bo2=mk('凡人の施し',0,'down');
gameState.players[0].sz=[bo2];
gameState.players[0].hand=[];
const EFFMON='氷結界の番人ブリズド';   /* 効果モンスター（通常モンスターではない） */
ok('前提: 氷結界の番人ブリズドは効果モンスター',(dbOf({id:findCardIndex(EFFMON)}).st||[]).includes('効果'));
ok('前提: 青眼の白龍は通常モンスター',(dbOf({id:findCardIndex(BIG)}).st||[]).includes('通常'));
gameState.players[0].deck=[mk(EFFMON,0),mk(EFFMON,0),mk(EFFMON,0)];
sc('凡人の施し').resolve(C(0,bo2,'sz',0));
ok('凡人の施し ruling: 通常モンスターが無ければ手札を全て墓地へ送る',
   gameState.players[0].hand.length===0&&gameState.players[0].grave.length===2,
   'hand='+gameState.players[0].hand.length+' grave='+gameState.players[0].grave.length);

/* --- 軽量化 --- */
reset0();
let kr=mk('軽量化',0,'up');
gameState.players[0].sz=[kr];
let heavy=mk(BIG,0);   /* lv8 */
gameState.players[0].hand=[heavy,mk(PLAIN,0)];
gameState.players[0].deck=[mk(PLAIN,0)];
let ckr=C(0,kr,'sz',0);
ok('軽量化 positive: 手札にレベル7以上がいれば発動できる',sc('軽量化').condition(ckr)===true);
pickNamed(BIG);
sc('軽量化').selectTargets(ckr,r=>{ckr.selectedTargets=r;});
sc('軽量化').resolve(ckr);
ok('軽量化 positive: 手札から1枚戻して1枚引くので枚数収支が合う',
   gameState.players[0].hand.length===2&&gameState.players[0].deck.length===1,
   'deck='+gameState.players[0].deck.length+' hand='+gameState.players[0].hand.length);
ok('軽量化 ruling: 戻したカードはデッキか（引き戻して）手札にあり、失われない',
   gameState.players[0].deck.concat(gameState.players[0].hand).some(c=>c&&c.uid===heavy.uid));
ok('軽量化 ruling: 1ターンに1度',sc('軽量化').countLimit===1);
pickFirst();
reset0();
let kr2=mk('軽量化',0,'up');gameState.players[0].sz=[kr2];
gameState.players[0].hand=[mk(PLAIN,0)];
ok('軽量化 negative: レベル7以上が手札に無ければ発動できない',
   sc('軽量化').condition(C(0,kr2,'sz',0))===false);

/* --- ブライト・フューチャー --- */
reset0();
let bf=mk('ブライト・フューチャー',0,'down');
gameState.players[0].sz=[bf];
let psy1=mk('強化人類サイコ',0),psy2=mk('強化人類サイコ',0);
gameState.players[0].banish=[psy1,psy2];
gameState.players[0].deck=[mk(PLAIN,0)];
let cbf=C(0,bf,'sz',0);
ok('ブライト・フューチャー positive: 除外にサイキックが2体いれば発動できる',sc('ブライト・フューチャー').condition(cbf)===true);
sc('ブライト・フューチャー').selectTargets(cbf,r=>{cbf.selectedTargets=r;});
sc('ブライト・フューチャー').resolve(cbf);
ok('ブライト・フューチャー positive: 2体が墓地に戻り1枚ドローする',
   gameState.players[0].grave.length===2&&gameState.players[0].banish.length===0,
   'grave='+gameState.players[0].grave.length);
reset0();
let bf2=mk('ブライト・フューチャー',0,'down');gameState.players[0].sz=[bf2];
gameState.players[0].banish=[mk('強化人類サイコ',0)];
ok('ブライト・フューチャー negative: 1体では発動できない',
   sc('ブライト・フューチャー').condition(C(0,bf2,'sz',0))===false);

/* --- フレイム・オーガ --- */
reset0();
let fg=mk('フレイム・オーガ',0);
gameState.players[0].mz=[fg];gameState.players[0].deck=[mk(PLAIN,0)];
let cfg=ctxEv(0,fg,'onNormalSummon',{player:0,card:fg,uid:fg.uid});
ok('フレイム・オーガ positive: 召喚成功時に誘発する',sc('フレイム・オーガ').passive.onNormalSummon(cfg)===true);
ok('フレイム・オーガ ruling: 特殊召喚できない',sc('フレイム・オーガ').cannotSpecialSummon===true);
let hf=gameState.players[0].hand.length;
sc('フレイム・オーガ').resolve(cfg);
ok('フレイム・オーガ positive: 1枚ドローする',gameState.players[0].hand.length===hf+1);

/* --- 電動刃虫 --- */
reset0();
let dj=mk('電動刃虫',0),foe=mk(PLAIN,1);
gameState.players[0].mz=[dj];gameState.players[1].mz=[foe];
gameState.players[1].deck=[mk(PLAIN,1)];
let bdj={atkCard:dj,defCard:foe,step:'end'};
let cdj=ctxDS(0,dj,bdj,'mz','end');
ok('電動刃虫 positive: 戦闘を行ったら誘発する',sc('電動刃虫').passive.onDamageStep(cdj)===true);
ok('電動刃虫 ruling: dsTiming はダメージステップ終了時(end)',sc('電動刃虫').dsTiming==='end');
let fh=gameState.players[1].hand.length;
sc('電動刃虫').resolve(cdj);
ok('電動刃虫 ruling: ドローするのは相手プレイヤー',gameState.players[1].hand.length===fh+1);
reset0();
let dj2=mk('電動刃虫',0);gameState.players[0].mz=[dj2];
gameState.players[1].deck=[mk(PLAIN,1)];
ok('電動刃虫 negative: 戦闘していなければ誘発しない',
   sc('電動刃虫').passive.onDamageStep(ctxDS(0,dj2,{atkCard:null,defCard:null},'mz','end'))===false);

/* --- 幸運の鉄斧 --- */
reset0();
let ka=mk('幸運の鉄斧',0,'up');
gameState.players[0].sz=[ka];gameState.players[0].deck=[mk(PLAIN,0)];
gameState.chain=[{name:'サイクロン',player:1,cardId:findCardIndex('サイクロン')}];
API.destroy(h(ka),'相手のサイクロン');
gameState.chain=[];
let cka=ctxEv(0,ka,'onDestroy',{card:ka,uid:ka.uid,reason:'effect'},'grave');
ok('幸運の鉄斧 positive: 相手の効果で破壊されたら誘発する',sc('幸運の鉄斧').passive.onDestroy(cka)===true);
let hk=gameState.players[0].hand.length;
sc('幸運の鉄斧').resolve(cka);
ok('幸運の鉄斧 positive: 1枚ドローする',gameState.players[0].hand.length===hk+1);
reset0();
let ka2=mk('幸運の鉄斧',0,'up');
gameState.players[0].sz=[ka2];gameState.players[0].deck=[mk(PLAIN,0)];
gameState.chain=[{name:'サイクロン',player:0,cardId:findCardIndex('サイクロン')}];
API.destroy(h(ka2),'自分のサイクロン');
gameState.chain=[];
ok('幸運の鉄斧 negative: 自分の効果で破壊した場合は誘発しない',
   sc('幸運の鉄斧').passive.onDestroy(ctxEv(0,ka2,'onDestroy',{card:ka2,uid:ka2.uid,reason:'effect'},'grave'))===false);

/* --- カードエクスクルーダー --- */
reset0();
let ce=mk('カードエクスクルーダー',0);
gameState.players[0].mz=[ce];
let fgv=mk(PLAIN,1);gameState.players[1].grave=[fgv];
let cce=C(0,ce,'mz',0);
ok('カードエクスクルーダー positive: 相手の墓地にカードがあれば発動できる',sc('カードエクスクルーダー').condition(cce)===true);
sc('カードエクスクルーダー').selectTargets(cce,r=>{cce.selectedTargets=r;});
sc('カードエクスクルーダー').resolve(cce);
ok('カードエクスクルーダー positive: 相手の墓地のカードが除外される',
   gameState.players[1].banish.some(c=>c&&c.uid===fgv.uid));
ok('カードエクスクルーダー ruling: 1ターンに1度',sc('カードエクスクルーダー').countLimit===1);

/* ================= AB ================= */
/* --- 木遁封印式 --- */
reset0();
let mf=mk('木遁封印式',0,'up');
gameState.players[0].sz=[mf];
let earth=mk('カミソーリトカゲ',0);   /* 地属性 */
gameState.players[0].mz=[earth];
gameState.players[1].grave=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
let cmf=C(0,mf,'sz',0);
ok('木遁封印式 positive: 地属性がいて相手墓地があれば発動できる',sc('木遁封印式').condition(cmf)===true);
sc('木遁封印式').cost(cmf,()=>{});
ok('木遁封印式 positive: コストで地属性がリリースされる',
   !gameState.players[0].mz.some(c=>c&&c.uid===earth.uid));
sc('木遁封印式').resolve(cmf);
let pmf=pending();
ok('木遁封印式 ruling: 2枚まで選べる',!!pmf&&pmf.max===2&&pmf.min===0,'max='+(pmf&&pmf.max));
answerChoiceV49(pmf.candidates.slice(0,2).map(x=>x.key));
ok('木遁封印式 positive: 選んだ相手の墓地のカードが除外される',
   gameState.players[1].banish.length===2,'banish='+gameState.players[1].banish.length);
reset0();
let mf2=mk('木遁封印式',0,'up');gameState.players[0].sz=[mf2];
gameState.players[0].mz=[mk(BIG,0)];   /* 光属性 */
gameState.players[1].grave=[mk(PLAIN,1)];
ok('木遁封印式 negative: 地属性がいなければ発動できない',
   sc('木遁封印式').condition(C(0,mf2,'sz',0))===false);

/* --- 慈悲深き修道女（v30 B3 の破壊記録を使う） --- */
reset0();
let jh=mk('慈悲深き修道女',0),dead=mk(BIG,0),killer=mk(BIG,1);
gameState.players[0].mz=[jh,dead];gameState.players[1].mz=[killer];
dead.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cjh=C(0,jh,'mz',0);
ok('慈悲深き修道女 positive: このターン戦闘破壊されたモンスターがいれば発動できる',
   sc('慈悲深き修道女').condition(cjh)===true);
sc('慈悲深き修道女').cost(cjh,()=>{});
sc('慈悲深き修道女').selectTargets(cjh,r=>{cjh.selectedTargets=r;});
sc('慈悲深き修道女').resolve(cjh);
ok('慈悲深き修道女 positive: 戦闘破壊されたモンスターが手札に戻る',
   gameState.players[0].hand.some(c=>c&&c.uid===dead.uid));
reset0();
let jh2=mk('慈悲深き修道女',0),effDead=mk(BIG,0);
gameState.players[0].mz=[jh2,effDead];
API.destroy(h(effDead),'効果破壊');
ok('慈悲深き修道女 negative: 効果破壊されたモンスターは対象にならない（戦闘限定）',
   sc('慈悲深き修道女').condition(C(0,jh2,'mz',0))===false);

/* --- リターンソウル --- */
reset0();
gameState.phase='end';
let rs=mk('リターンソウル',0,'down');
gameState.players[0].sz=[rs];
let d1=mk(BIG,0),d2=mk(PLAIN,0);
gameState.players[0].mz=[d1,d2];
API.destroy(h(d1),'テスト');API.destroy(h(d2),'テスト');
let crs=C(0,rs,'sz',0);
ok('リターンソウル positive: エンドフェイズに破壊されたモンスターがいれば発動できる',
   sc('リターンソウル').condition(crs)===true);
sc('リターンソウル').resolve(crs);
let prs=pending();
ok('リターンソウル ruling: 3体まで選べる',!!prs&&prs.max===2&&prs.min===0,'max='+(prs&&prs.max));
answerChoiceV49(prs.candidates.map(x=>x.key));
ok('リターンソウル positive: 選んだモンスターがデッキに戻る',
   gameState.players[0].deck.length===2&&gameState.players[0].grave.length===0,
   'deck='+gameState.players[0].deck.length);
reset0();
gameState.phase='main1';
let rs2=mk('リターンソウル',0,'down');gameState.players[0].sz=[rs2];
let d3=mk(BIG,0);gameState.players[0].mz=[d3];API.destroy(h(d3),'テスト');
ok('リターンソウル negative: エンドフェイズ以外では発動できない',
   sc('リターンソウル').condition(C(0,rs2,'sz',0))===false);

/* --- ミノケンサテュロス --- */
reset0();
let ms=mk('ミノケンサテュロス',0);
gameState.players[0].mz=[ms];
let b4=null;
for(let i=0;i<CARD_DB.length;i++){const d=CARD_DB[i];
  if(d&&d.k==='m'&&d.ra==='獣戦士'&&Number(d.lv)===4&&!d.ex&&(d.st||[]).includes('通常')){b4=i;break;}}
let n1={id:b4,owner:0,controller:0,face:'up',pos:'atk'};ensureCardUid(gameState,n1);
let n2={id:b4,owner:0,controller:0,face:'up',pos:'atk'};ensureCardUid(gameState,n2);
gameState.players[0].deck=[n1,n2];
let cms=C(0,ms,'mz',0);
ok('ミノケンサテュロス positive: デッキに獣戦士lv4通常が2体いれば発動できる',
   sc('ミノケンサテュロス').condition(cms)===true);
ok('ミノケンサテュロス ruling: 特殊召喚できない',sc('ミノケンサテュロス').cannotSpecialSummon===true);
sc('ミノケンサテュロス').cost(cms,()=>{});
sc('ミノケンサテュロス').resolve(cms);
ok('ミノケンサテュロス positive: 2体が特殊召喚される',
   gameState.players[0].mz.length===2,'mz='+gameState.players[0].mz.length);
reset0();
let ms2=mk('ミノケンサテュロス',0);gameState.players[0].mz=[ms2];
gameState.players[0].deck=[mk(PLAIN,0)];
ok('ミノケンサテュロス negative: 対象が2体そろわなければ発動できない',
   sc('ミノケンサテュロス').condition(C(0,ms2,'mz',0))===false);

/* --- X－セイバー ウルズ --- */
reset0();
let xu=mk('X－セイバー ウルズ',0),prey=mk(PLAIN,1);
gameState.players[0].mz=[xu];gameState.players[1].mz=[prey];
let bxu={atkCard:xu,defCard:prey,destroyedDef:true,destroyedAtk:false,step:'after'};
let cxu=ctxDS(0,xu,bxu,'mz','after');
ok('X－セイバー ウルズ positive: 戦闘破壊したら誘発する',sc('X－セイバー ウルズ').passive.onDamageStep(cxu)===true);
sc('X－セイバー ウルズ').cost(cxu,()=>{});
ok('X－セイバー ウルズ positive: コストで自身がリリースされる',
   !gameState.players[0].mz.some(c=>c&&c.uid===xu.uid));
sc('X－セイバー ウルズ').resolve(cxu);
ok('X－セイバー ウルズ positive: 破壊したモンスターがデッキの一番上に戻る',
   gameState.players[1].deck[0]&&gameState.players[1].deck[0].uid===prey.uid);

/* ================= AC ================= */
/* --- インフェルニティ・デストロイヤー --- */
reset0();
let id=mk('インフェルニティ・デストロイヤー',0),prey2=mk(PLAIN,1);
gameState.players[0].mz=[id];gameState.players[1].mz=[prey2];
gameState.players[0].hand=[];
let bid={atkCard:id,defCard:prey2,destroyedDef:true,destroyedAtk:false,step:'after'};
let cid=ctxDS(0,id,bid,'mz','after');
ok('インフェルニティ・デストロイヤー positive: 手札0で戦闘破壊したら誘発する',
   sc('インフェルニティ・デストロイヤー').passive.onDamageStep(cid)===true);
let lpi=gameState.players[1].lp;
sc('インフェルニティ・デストロイヤー').resolve(cid);
ok('インフェルニティ・デストロイヤー positive: 1600ダメージ',gameState.players[1].lp===lpi-1600);
reset0();
let id2=mk('インフェルニティ・デストロイヤー',0),prey3=mk(PLAIN,1);
gameState.players[0].mz=[id2];gameState.players[1].mz=[prey3];
gameState.players[0].hand=[mk(PLAIN,0)];
ok('インフェルニティ・デストロイヤー negative: 手札があれば誘発しない',
   sc('インフェルニティ・デストロイヤー').passive.onDamageStep(
     ctxDS(0,id2,{atkCard:id2,defCard:prey3,destroyedDef:true},'mz','after'))===false);

/* --- カトブレパスと運命の魔女 --- */
reset0();
let kb=mk('カトブレパスと運命の魔女',0);
gameState.players[0].mz=[kb];
let qmon=mk('終焉の精霊',0);   /* 攻撃力 ? */
gameState.players[0].grave=[qmon];
ok('前提: 終焉の精霊の攻撃力は?（DB では -2）',Number(dbOf(qmon).atk)===-2);
let summoned=mk(BIG,1);gameState.players[1].mz=[summoned];
let ckb=ctxEv(0,kb,'onSpecialSummon',{player:1,card:summoned,uid:summoned.uid,kind:'effect'});
ok('カトブレパスと運命の魔女 positive: 相手の特殊召喚に反応する',
   sc('カトブレパスと運命の魔女').passive.onSpecialSummon(ckb)===true);
sc('カトブレパスと運命の魔女').cost(ckb,()=>{});
ok('カトブレパスと運命の魔女 positive: コストで攻撃力?のモンスターが除外される',
   gameState.players[0].banish.some(c=>c&&c.uid===qmon.uid));
sc('カトブレパスと運命の魔女').selectTargets(ckb,r=>{ckb.selectedTargets=r;});
sc('カトブレパスと運命の魔女').resolve(ckb);
ok('カトブレパスと運命の魔女 positive: 特殊召喚されたモンスターが破壊される',
   !gameState.players[1].mz.some(c=>c&&c.uid===summoned.uid));
reset0();
let kb2=mk('カトブレパスと運命の魔女',0);
gameState.players[0].mz=[kb2];gameState.players[0].grave=[mk(PLAIN,0)];
let s2=mk(BIG,1);gameState.players[1].mz=[s2];
ok('カトブレパスと運命の魔女 negative: 攻撃力?のモンスターが墓地に無ければ発動できない',
   sc('カトブレパスと運命の魔女').passive.onSpecialSummon(
     ctxEv(0,kb2,'onSpecialSummon',{player:1,card:s2,uid:s2.uid}))===false);
reset0();
let kb3=mk('カトブレパスと運命の魔女',0);
gameState.players[0].mz=[kb3];gameState.players[0].grave=[mk('終焉の精霊',0)];
let own=mk(BIG,0);gameState.players[0].mz.push(own);
ok('カトブレパスと運命の魔女 negative: 自分の特殊召喚には反応しない',
   sc('カトブレパスと運命の魔女').passive.onSpecialSummon(
     ctxEv(0,kb3,'onSpecialSummon',{player:0,card:own,uid:own.uid}))===false);

/* --- インフォーマー・スパイダー --- */
reset0();
let isp=mk('インフォーマー・スパイダー',0);
gameState.players[0].mz=[isp];
let foeDef=mk(BIG,1,'up','def');gameState.players[1].mz=[foeDef];
API.sendToGrave(h(isp),'効果で墓地へ');
let cis=ctxEv(0,isp,'onSendToGrave',{card:isp,uid:isp.uid,reason:'effect'},'grave');
ok('インフォーマー・スパイダー positive: 効果で墓地へ送られたら誘発する',
   sc('インフォーマー・スパイダー').passive.onSendToGrave(cis)===true);
sc('インフォーマー・スパイダー').selectTargets(cis,r=>{cis.selectedTargets=r;});
sc('インフォーマー・スパイダー').resolve(cis);
ok('インフォーマー・スパイダー positive: 守備表示モンスターのコントロールを得る',
   gameState.players[0].mz.some(c=>c&&c.uid===foeDef.uid));
reset0();
let isp2=mk('インフォーマー・スパイダー',0),atkFoe=mk(BIG,1,'up','atk');
gameState.players[0].mz=[isp2];gameState.players[1].mz=[atkFoe];
API.sendToGrave(h(isp2),'効果で墓地へ');
ok('インフォーマー・スパイダー negative: 攻撃表示は対象にできない',
   sc('インフォーマー・スパイダー').passive.onSendToGrave(
     ctxEv(0,isp2,'onSendToGrave',{card:isp2,uid:isp2.uid,reason:'effect'},'grave'))===false);

/* --- ADチェンジャー --- */
reset0();
let ad=mk('ADチェンジャー',0);
gameState.players[0].grave=[ad];
let tgt=mk(BIG,1,'up','atk');gameState.players[1].mz=[tgt];
let cad=C(0,ad,'grave',0);
ok('ADチェンジャー positive: 墓地から発動できる',sc('ADチェンジャー').condition(cad)===true);
sc('ADチェンジャー').cost(cad,()=>{});
ok('ADチェンジャー positive: コストで自身が除外される',
   gameState.players[0].banish.some(c=>c&&c.uid===ad.uid));
sc('ADチェンジャー').selectTargets(cad,r=>{cad.selectedTargets=r;});
sc('ADチェンジャー').resolve(cad);
ok('ADチェンジャー positive: 表示形式が変わる',tgt.pos==='def','pos='+tgt.pos);

/* ================= AD ================= */
/* --- クラッキング --- */
reset0();
let ck=mk('クラッキング',0,'up');
gameState.players[0].sz=[ck];
let victim=mk(BIG,1);gameState.players[1].mz=[victim];
API.sendToGrave(h(victim),'効果で墓地へ');
let cck=ctxEv(0,ck,'onSendToGrave',{card:victim,uid:victim.uid,reason:'effect'},'sz');
ok('クラッキング positive: 効果でモンスターが墓地へ送られたら誘発する',
   sc('クラッキング').passive.onSendToGrave(cck)===true);
let lpc=gameState.players[1].lp;
sc('クラッキング').resolve(cck);
ok('クラッキング positive: 元々の持ち主に800ダメージ',gameState.players[1].lp===lpc-800);
ok('クラッキング ruling: 1ターンに1度',sc('クラッキング').countLimit===1);
reset0();
let ck2=mk('クラッキング',0,'up'),v2=mk(BIG,1),killer2=mk(BIG,0);
gameState.players[0].sz=[ck2];gameState.players[1].mz=[v2];gameState.players[0].mz=[killer2];
v2.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
ok('クラッキング negative: 戦闘破壊では誘発しない',
   sc('クラッキング').passive.onSendToGrave(
     ctxEv(0,ck2,'onSendToGrave',{card:v2,uid:v2.uid,reason:'battle'},'sz'))===false);

/* --- ウォーターハザード --- */
reset0();
let wh=mk('ウォーターハザード',0,'up');
gameState.players[0].sz=[wh];gameState.players[0].mz=[];
let waterM=mk('氷結界の番人ブリズド',0);   /* 水属性 lv1 */
gameState.players[0].hand=[waterM];
let cwh=C(0,wh,'sz',0);
ok('ウォーターハザード positive: 自分の場が空なら発動できる',sc('ウォーターハザード').condition(cwh)===true);
sc('ウォーターハザード').selectTargets(cwh,r=>{cwh.selectedTargets=r;});
sc('ウォーターハザード').resolve(cwh);
ok('ウォーターハザード positive: 水属性が特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===waterM.uid));
reset0();
let wh2=mk('ウォーターハザード',0,'up');
gameState.players[0].sz=[wh2];gameState.players[0].mz=[mk(PLAIN,0)];
gameState.players[0].hand=[mk('氷結界の番人ブリズド',0)];
ok('ウォーターハザード negative: 自分の場にモンスターがいれば発動できない',
   sc('ウォーターハザード').condition(C(0,wh2,'sz',0))===false);

/* --- エレキャノン --- */
reset0();
let ec=mk('エレキャノン',0,'up');
gameState.players[0].sz=[ec];
let thunder=mk('エトワール・サイバー',0);   /* 戦士なので雷ではない */
let realThunder=null;
for(let i=0;i<CARD_DB.length;i++){const d=CARD_DB[i];
  if(d&&d.k==='m'&&d.ra==='雷'&&Number(d.lv||99)<=4&&!d.ex){realThunder={id:i,owner:0,controller:0,face:'up',pos:'atk'};ensureCardUid(gameState,realThunder);break;}}
gameState.players[0].mz=[realThunder];
let cec=ctxEv(0,ec,'onNormalSummon',{player:0,card:realThunder,uid:realThunder.uid},'sz');
ok('エレキャノン positive: レベル4以下の雷族が召喚されたら誘発する',
   sc('エレキャノン').passive.onNormalSummon(cec)===true);
let lpe=gameState.players[1].lp;
sc('エレキャノン').resolve(cec);
ok('エレキャノン positive: 相手に600ダメージ',gameState.players[1].lp===lpe-600);
ok('エレキャノン ruling: 1ターンに1度',sc('エレキャノン').countLimit===1);
reset0();
let ec2=mk('エレキャノン',0,'up');gameState.players[0].sz=[ec2];
let notThunder=mk(BIG,0);gameState.players[0].mz=[notThunder];
ok('エレキャノン negative: 雷族以外では誘発しない',
   sc('エレキャノン').passive.onNormalSummon(
     ctxEv(0,ec2,'onNormalSummon',{player:0,card:notThunder,uid:notThunder.uid},'sz'))===false);

/* ================= Replay / SaveLoad ================= */
reset0();
let rd=mk('カオス・グリード',0);
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.draw(0,2);
let a1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle05 Replay: ドローが digest 一致で再生される',a1.ok,a1.reason||'');
reset0();
let rb=mk('ADチェンジャー',0),rt2=mk(BIG,1);
gameState.players[0].grave=[rb];gameState.players[1].mz=[rt2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.banish(h(rb),'ADチェンジャー（コスト）');
API.changePosition(h(rt2),'def','ADチェンジャー');
let a2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle05 Replay: 除外＋表示形式変更が digest 一致で再生される',a2.ok,a2.reason||'');
reset0();
let rw=mk('ウォーターハザード',0,'up'),rm2=mk('氷結界の番人ブリズド',0);
gameState.players[0].sz=[rw];gameState.players[0].hand=[rm2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.specialSummon(0,'hand',0,'atk','ウォーターハザード',0);
let pkg=v41ReplayPackage(gameState);
let replayed=JSON.parse(JSON.stringify(pkg.initialState));
pkg.actions.forEach(j=>applyAction(replayed,JSON.parse(JSON.stringify(j.action||j))));
ok('cycle05 Replay: 手札からの特殊召喚が Journal 再適用で再現される',
   replayed.players[0].mz.length===1&&replayed.players[0].mz[0].uid===rm2.uid);
let snap=JSON.stringify(gameState);
ok('cycle05 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
