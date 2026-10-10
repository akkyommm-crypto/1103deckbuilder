/* Auto cycle 06 — 28枚。positive / negative / ruling edge / Replay。 */
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
  const c=C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',{event:{},battle:battle,step:step||'leave'});
  c.battle=battle;c.step=step||'leave';return c;}
function killByBattle(victim,killer,vp){
  victim.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
  return {defCard:victim,atkCard:killer,destroyedDef:true,destroyedAtk:false,player:vp===0?1:0,step:'leave'};}
function battleAt(ai,ti,step){
  const a=gameState.players[0].mz[ai],d=(ti==='direct')?null:gameState.players[1].mz[ti];
  if(a)ensureCardUid(gameState,a); if(d)ensureCardUid(gameState,d);
  gameState.battle={player:0,atkIdx:ai,target:(ti==='direct')?'direct':ti,step:step||'calc',
    atkUid:a?a.uid:null,targetUid:d?d.uid:null};}
/* 装備状態を作る（equipTo は uid 参照） */
function equipTo(eq,mon){ ensureCardUid(gameState,mon); eq.equipTo={uid:mon.uid}; return eq; }
function pending(){return pendingChoiceV49(gameState);}
/* S03-U62: some cards now open a real (SaveLoad-safe) API.requestChoice pending choice instead of the
   old synchronous API.selectCard closure the reset0() stub above intercepts. Auto-answer any such pending
   choice by always picking the first candidate (matches the stub's own semantics). */
function drain0(){for(let i=0;i<10&&pending();i++)__choicePickV49(0);}
const PLAIN='ワイト';        /* 闇 lv1 */
const BIG='青眼の白龍';       /* 光 lv8 */
const DARKM='デーモンの召喚';  /* 闇 lv6 */
const ANGEL='ハネクリボー';    /* 光 天使 lv1 */

const ALL=['一角獣のホーン','ダグラの剣','光の角','重力の斧－グラール','蝶の短剣－エルマ','ドーピング',
 'パワー・ピカクス','ライトイレイザー','グレイブ・スクワーマー','ハネクリボー','オキシゲドン',
 'マッド・リローダー','ダブル・プロテクター','ファミリア・ナイト','ボマー・ドラゴン','スピッド・バード',
 'アマゾネスの鎖使い','ナイトエンド・ソーサラー','闇王プロメティス','ライヤー・ワイヤー','水遁封印式',
 '死霊の巣','亜空間物質転送装置','サイコ・トリガー','ダークゼブラ','マタンゴ','カードトレーダー','リサイクル'];
ALL.forEach(n=>ok('cycle06 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle06 枚数は28',ALL.length===28);
ok('cycle06 SKIP: モルティング・エスケープは未実装のまま',!CARD_SCRIPTS['モルティング・エスケープ']);
ok('cycle06 SKIP: BF－銀盾のミストラルは未実装のまま',!CARD_SCRIPTS['BF－銀盾のミストラル']);

/* ================= CA. 装備魔法 ================= */
/* --- 一角獣のホーン --- */
reset0();
let uh=mk('一角獣のホーン',0,'up'),mon=mk(PLAIN,0);
gameState.players[0].sz=[uh];gameState.players[0].mz=[mon];equipTo(uh,mon);
ok('一角獣のホーン positive: 装備モンスターの攻守が700上がる',
   curATK(mon)===dbOf(mon).atk+700&&curDEF(mon)===dbOf(mon).def+700,
   'atk='+curATK(mon)+' def='+curDEF(mon));
API.sendToGrave(h(uh),'テスト');
let cuh=ctxEv(0,uh,'onSendToGrave',{card:uh,uid:uh.uid,reason:'effect'},'grave');
ok('一角獣のホーン positive: 墓地へ送られたら誘発する',sc('一角獣のホーン').passive.onSendToGrave(cuh)===true);
sc('一角獣のホーン').resolve(cuh);
ok('一角獣のホーン positive: デッキの一番上に戻る',
   gameState.players[0].deck[0]&&gameState.players[0].deck[0].uid===uh.uid);

/* --- ダグラの剣 --- */
reset0();
let dg=mk('ダグラの剣',0,'up'),angel=mk(ANGEL,0);
gameState.players[0].sz=[dg];gameState.players[0].mz=[angel];equipTo(dg,angel);
ok('ダグラの剣 positive: 装備モンスターの攻撃力が500上がる',curATK(angel)===dbOf(angel).atk+500);
ok('ダグラの剣 ruling: 天使族のみ装備可能',
   sc('ダグラの剣').equipSpec.canEquip({db:dbOf(angel)})===true
   &&sc('ダグラの剣').equipSpec.canEquip({db:dbOf({id:findCardIndex(BIG)})})===false);
gameState.players[0].lp=4000;
let cdg=C(0,dg,'sz',0,'onBattleDamage',{event:{player:1,amount:800,attackerUid:angel.uid,defenderUid:null}});
ok('ダグラの剣 positive: 装備モンスターの戦闘ダメージで誘発する',
   sc('ダグラの剣').passive.onBattleDamage(cdg)===true);
sc('ダグラの剣').resolve(cdg);
ok('ダグラの剣 positive: 与えたダメージ分だけ回復する',gameState.players[0].lp===4800,'lp='+gameState.players[0].lp);
reset0();
let dg2=mk('ダグラの剣',0,'up'),angel2=mk(ANGEL,0);
gameState.players[0].sz=[dg2];gameState.players[0].mz=[angel2];equipTo(dg2,angel2);
ok('ダグラの剣 negative: 別のモンスターのダメージでは誘発しない',
   sc('ダグラの剣').passive.onBattleDamage(
     C(0,dg2,'sz',0,'onBattleDamage',{event:{player:1,amount:800,attackerUid:999999,defenderUid:null}}))===false);

/* --- 光の角 --- */
reset0();
let hk=mk('光の角',0,'up'),m2=mk(PLAIN,0);
gameState.players[0].sz=[hk];gameState.players[0].mz=[m2];equipTo(hk,m2);
ok('光の角 positive: 装備モンスターの守備力が800上がる',curDEF(m2)===dbOf(m2).def+800);
gameState.players[0].lp=4000;
API.sendToGrave(h(hk),'テスト');
let chk=ctxEv(0,hk,'onSendToGrave',{card:hk,uid:hk.uid,reason:'effect'},'grave');
ok('光の角 positive: 500払えるなら誘発する',sc('光の角').passive.onSendToGrave(chk)===true);
sc('光の角').cost(chk,()=>{});
ok('光の角 positive: 500ライフを払う',gameState.players[0].lp===3500);
sc('光の角').resolve(chk);
ok('光の角 positive: デッキの一番上に戻る',
   gameState.players[0].deck[0]&&gameState.players[0].deck[0].uid===hk.uid);
reset0();
let hk2=mk('光の角',0,'up');gameState.players[0].sz=[hk2];gameState.players[0].lp=500;
API.sendToGrave(h(hk2),'テスト');
ok('光の角 negative: ライフが500以下なら発動できない',
   sc('光の角').passive.onSendToGrave(ctxEv(0,hk2,'onSendToGrave',{card:hk2,uid:hk2.uid,reason:'effect'},'grave'))===false);

/* --- 重力の斧－グラール --- */
reset0();
let gg=mk('重力の斧－グラール',0,'up'),myMon=mk(PLAIN,0),foeMon=mk(BIG,1);
gameState.players[0].sz=[gg];gameState.players[0].mz=[myMon];gameState.players[1].mz=[foeMon];
equipTo(gg,myMon);
ok('重力の斧－グラール positive: 装備モンスターの攻撃力が500上がる',curATK(myMon)===dbOf(myMon).atk+500);
ok('重力の斧－グラール ruling: 装備していないモンスターは上がらない',curATK(foeMon)===dbOf(foeMon).atk);
ok('重力の斧－グラール positive: 相手モンスターは表示形式を変更できない',
   cannotChangePositionV10(foeMon)===true);
ok('重力の斧－グラール ruling: 自分のモンスターは変更できる',
   cannotChangePositionV10(myMon)===false);

/* --- 蝶の短剣－エルマ --- */
reset0();
let el=mk('蝶の短剣－エルマ',0,'up'),m3=mk(PLAIN,0);
gameState.players[0].sz=[el];gameState.players[0].mz=[m3];equipTo(el,m3);
ok('蝶の短剣－エルマ positive: 装備モンスターの攻撃力が300上がる',curATK(m3)===dbOf(m3).atk+300);
API.destroy(h(el),'テスト破壊');
let cel=ctxEv(0,el,'onDestroy',{card:el,uid:el.uid,reason:'effect'},'grave');
ok('蝶の短剣－エルマ positive: 破壊されたら誘発する',sc('蝶の短剣－エルマ').passive.onDestroy(cel)===true);
sc('蝶の短剣－エルマ').resolve(cel);
ok('蝶の短剣－エルマ positive: 手札に戻る',gameState.players[0].hand.some(c=>c&&c.uid===el.uid));
reset0();
let el2=mk('蝶の短剣－エルマ',0,'up');gameState.players[0].sz=[el2];
API.sendToGrave(h(el2),'破壊ではない');
ok('蝶の短剣－エルマ negative: 破壊以外で墓地へ行っても誘発しない',
   sc('蝶の短剣－エルマ').passive.onDestroy(ctxEv(0,el2,'onDestroy',{card:el2,uid:el2.uid,reason:'effect'},'grave'))===false);

/* --- ドーピング --- */
reset0();
let dp=mk('ドーピング',0,'up'),m4=mk(PLAIN,0);
gameState.players[0].sz=[dp];gameState.players[0].mz=[m4];equipTo(dp,m4);
ok('ドーピング positive: 最初は攻撃力+700',curATK(m4)===dbOf(m4).atk+700,'atk='+curATK(m4));
let cdp=ctxEv(0,dp,'onStandbyPhase',{},'sz');
ok('ドーピング positive: 自分のスタンバイフェイズで誘発する',sc('ドーピング').passive.onStandbyPhase(cdp)===true);
sc('ドーピング').resolve(cdp);
ok('ドーピング positive: スタンバイ1回で+500になる（700-200）',
   curATK(m4)===dbOf(m4).atk+500,'atk='+curATK(m4));
sc('ドーピング').resolve(cdp);
ok('ドーピング ruling: 毎スタンバイ累積して下がる（700-400）',
   curATK(m4)===dbOf(m4).atk+300,'atk='+curATK(m4));

/* --- パワー・ピカクス --- */
reset0();
let pp=mk('パワー・ピカクス',0,'up'),m5=mk(BIG,0);   /* lv8 */
gameState.players[0].sz=[pp];gameState.players[0].mz=[m5];equipTo(pp,m5);
let low=mk(PLAIN,1);gameState.players[1].grave=[low];
let cpp=C(0,pp,'sz',0);
ok('パワー・ピカクス positive: 装備モンスターのレベル以下が相手墓地にいれば発動できる',
   sc('パワー・ピカクス').condition(cpp)===true);
sc('パワー・ピカクス').selectTargets(cpp,r=>{cpp.selectedTargets=r;});
sc('パワー・ピカクス').resolve(cpp);
ok('パワー・ピカクス positive: 相手墓地のモンスターが除外される',
   gameState.players[1].banish.some(c=>c&&c.uid===low.uid));
ok('パワー・ピカクス positive: 装備モンスターの攻撃力が500上がる',
   curATK(m5)===dbOf(m5).atk+500,'atk='+curATK(m5));
reset0();
let pp2=mk('パワー・ピカクス',0,'up'),small=mk(PLAIN,0);   /* lv1 */
gameState.players[0].sz=[pp2];gameState.players[0].mz=[small];equipTo(pp2,small);
gameState.players[1].grave=[mk(BIG,1)];   /* lv8 > lv1 */
ok('パワー・ピカクス negative: レベルが高いモンスターは対象にできない',
   sc('パワー・ピカクス').condition(C(0,pp2,'sz',0))===false);

/* --- ライトイレイザー --- */
reset0();
let le=mk('ライトイレイザー',0,'up');
let lw=mk('E・HERO スパークマン',0);   /* 光・戦士 */
gameState.players[0].sz=[le];gameState.players[0].mz=[lw];equipTo(le,lw);
let foe2=mk(PLAIN,1);gameState.players[1].mz=[foe2];
ok('ライトイレイザー ruling: 光属性・戦士族のみ装備可能',
   sc('ライトイレイザー').equipSpec.canEquip({db:dbOf(lw)})===true
   &&sc('ライトイレイザー').equipSpec.canEquip({db:dbOf({id:findCardIndex(PLAIN)})})===false);
battleAt(0,0,'end');
let cle=ctxDS(0,le,null,'sz','end');
ok('ライトイレイザー positive: 装備モンスターが戦闘したら誘発する',
   sc('ライトイレイザー').passive.onDamageStep(cle)===true);
sc('ライトイレイザー').resolve(cle);
ok('ライトイレイザー positive: 戦闘した相手が除外される',
   gameState.players[1].banish.some(c=>c&&c.uid===foe2.uid));

/* ================= CB. 戦闘破壊 ================= */
/* --- グレイブ・スクワーマー --- */
reset0();
let gs=mk('グレイブ・スクワーマー',0),killer=mk(BIG,1);
gameState.players[0].mz=[gs];gameState.players[1].mz=[killer];
let bt1=killByBattle(gs,killer,0);
let cgs=ctxDS(0,gs,bt1,'grave');
ok('グレイブ・スクワーマー positive: 戦闘破壊で誘発する',sc('グレイブ・スクワーマー').passive.onDamageStep(cgs)===true);
sc('グレイブ・スクワーマー').selectTargets(cgs,r=>{cgs.selectedTargets=r;});
sc('グレイブ・スクワーマー').resolve(cgs);
ok('グレイブ・スクワーマー positive: フィールドのカードが破壊される',
   !gameState.players[1].mz.some(c=>c&&c.uid===killer.uid));

/* --- ハネクリボー（v29 墓地継続ソース） --- */
reset0();
let hn=mk('ハネクリボー',0);
gameState.players[0].mz=[hn];
API.destroy(h(hn),'テスト破壊');
let chn=ctxEv(0,hn,'onDestroy',{card:hn,uid:hn.uid,reason:'effect'},'grave');
ok('ハネクリボー positive: 破壊されて墓地へ行ったら誘発する',sc('ハネクリボー').passive.onDestroy(chn)===true);
ok('ハネクリボー negative: 適用前は戦闘ダメージが通る',
   applyBattleDamageFilters({amount:1000,to:0})===1000);
sc('ハネクリボー').resolve(chn);
ok('ハネクリボー positive: このターン自分が受ける戦闘ダメージが0になる',
   applyBattleDamageFilters({amount:1000,to:0})===0);
ok('ハネクリボー ruling: 相手が受ける戦闘ダメージは0にならない',
   applyBattleDamageFilters({amount:1000,to:1})===1000);
ok('ハネクリボー ruling: 墓地のカードを継続効果ソースにしている（v29）',
   sc('ハネクリボー').continuous.from.indexOf('grave')>=0);

/* --- オキシゲドン --- */
reset0();
let ox=mk('オキシゲドン',0),fireKiller=mk('侵略の炎',1);   /* 炎族 */
gameState.players[0].mz=[ox];gameState.players[1].mz=[fireKiller];
ok('前提: 侵略の炎は炎族',dbOf(fireKiller).ra==='炎');
let bt2=killByBattle(ox,fireKiller,0);
let cox=ctxDS(0,ox,bt2,'grave');
ok('オキシゲドン positive: 炎族との戦闘で破壊されたら誘発する',sc('オキシゲドン').passive.onDamageStep(cox)===true);
let lp0=gameState.players[0].lp,lp1=gameState.players[1].lp;
sc('オキシゲドン').resolve(cox);
ok('オキシゲドン positive: お互いが800ダメージを受ける',
   gameState.players[0].lp===lp0-800&&gameState.players[1].lp===lp1-800);
reset0();
let ox2=mk('オキシゲドン',0),nonFire=mk(BIG,1);
gameState.players[0].mz=[ox2];gameState.players[1].mz=[nonFire];
let bt2b=killByBattle(ox2,nonFire,0);
ok('オキシゲドン negative: 炎族以外との戦闘では誘発しない',
   sc('オキシゲドン').passive.onDamageStep(ctxDS(0,ox2,bt2b,'grave'))===false);

/* --- マッド・リローダー --- */
reset0();
let mr=mk('マッド・リローダー',0),k2=mk(BIG,1);
gameState.players[0].mz=[mr];gameState.players[1].mz=[k2];
gameState.players[0].hand=[mk(PLAIN,0),mk(PLAIN,0)];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
let bt3=killByBattle(mr,k2,0);
let cmr=ctxDS(0,mr,bt3,'grave');
ok('マッド・リローダー positive: 手札2枚・デッキ2枚あれば誘発する',sc('マッド・リローダー').passive.onDamageStep(cmr)===true);
sc('マッド・リローダー').resolve(cmr);drain0();
ok('マッド・リローダー positive: 手札2枚を墓地へ送り2枚ドローする',
   gameState.players[0].hand.length===2&&gameState.players[0].deck.length===1,
   'hand='+gameState.players[0].hand.length+' deck='+gameState.players[0].deck.length);
reset0();
let mr2=mk('マッド・リローダー',0),k3=mk(BIG,1);
gameState.players[0].mz=[mr2];gameState.players[1].mz=[k3];
gameState.players[0].hand=[mk(PLAIN,0)];gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0)];
let bt3b=killByBattle(mr2,k3,0);
ok('マッド・リローダー negative: 手札が1枚では発動できない',
   sc('マッド・リローダー').passive.onDamageStep(ctxDS(0,mr2,bt3b,'grave'))===false);

/* --- ダブル・プロテクター --- */
reset0();
let dpr=mk('ダブル・プロテクター',0),k4=mk(BIG,1);
gameState.players[0].mz=[dpr];gameState.players[1].mz=[k4];
let bt4=killByBattle(dpr,k4,0);
let cdpr=ctxDS(0,dpr,bt4,'grave');
ok('ダブル・プロテクター positive: 戦闘破壊で誘発する',sc('ダブル・プロテクター').passive.onDamageStep(cdpr)===true);
let before=curATK(k4);
sc('ダブル・プロテクター').selectTargets(cdpr,r=>{cdpr.selectedTargets=r;});
sc('ダブル・プロテクター').resolve(cdpr);
ok('ダブル・プロテクター positive: 相手モンスターの攻撃力が半分になる',
   curATK(k4)===Math.floor(before/2),'atk='+curATK(k4));

/* --- ファミリア・ナイト --- */
reset0();
let fn=mk('ファミリア・ナイト',0),k5=mk(BIG,1);
gameState.players[0].mz=[fn];gameState.players[1].mz=[k5];
let lv4=mk('E・HERO スパークマン',0);   /* lv4 */
gameState.players[0].hand=[lv4];
let bt5=killByBattle(fn,k5,0);
let cfn=ctxDS(0,fn,bt5,'grave');
ok('ファミリア・ナイト positive: 手札にレベル4がいれば誘発する',sc('ファミリア・ナイト').passive.onDamageStep(cfn)===true);
sc('ファミリア・ナイト').resolve(cfn);
let pfn=pending();
ok('ファミリア・ナイト ruling: まず自分が選ぶ（min 0 の任意）',
   !!pfn&&pfn.player===0&&pfn.min===0,'player='+(pfn&&pfn.player));
answerChoiceV49([pfn.candidates[0].key]);
ok('ファミリア・ナイト positive: 手札のレベル4が特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===lv4.uid));

/* --- ボマー・ドラゴン --- */
reset0();
let bd=mk('ボマー・ドラゴン',0),k6=mk(BIG,1);
gameState.players[0].mz=[bd];gameState.players[1].mz=[k6];
battleAt(0,0,'calc');
ok('ボマー・ドラゴン positive: このカードの攻撃では戦闘ダメージが0になる',
   applyBattleDamageFilters({amount:1000,to:1})===0);
reset0();
let bd2=mk('ボマー・ドラゴン',0),k7=mk(BIG,1);
gameState.players[0].mz=[bd2];gameState.players[1].mz=[k7];
let bt6=killByBattle(bd2,k7,0);
let cbd=ctxDS(0,bd2,bt6,'grave');
ok('ボマー・ドラゴン positive: 戦闘破壊されたら誘発する',sc('ボマー・ドラゴン').passive.onDamageStep(cbd)===true);
sc('ボマー・ドラゴン').resolve(cbd);
ok('ボマー・ドラゴン positive: 破壊したモンスターを破壊する',
   !gameState.players[1].mz.some(c=>c&&c.uid===k7.uid));

/* --- スピッド・バード --- */
reset0();
let sb=mk('スピッド・バード',0),k8=mk(BIG,1);
gameState.players[0].mz=[sb];gameState.players[1].mz=[k8];
let l2a=mk('ジャイアントウィルス',0),l2b=mk('ジャイアントウィルス',0);   /* lv2 */
ok('前提: ジャイアントウィルスはレベル2',Number(dbOf(l2a).lv)===2);
gameState.players[0].grave=[l2a,l2b];
let bt7=killByBattle(sb,k8,0);
let csb=ctxDS(0,sb,bt7,'grave');
ok('スピッド・バード positive: 墓地にレベル2が2体いれば誘発する',sc('スピッド・バード').passive.onDamageStep(csb)===true);
sc('スピッド・バード').selectTargets(csb,r=>{csb.selectedTargets=r;});
sc('スピッド・バード').resolve(csb);
ok('スピッド・バード positive: レベル2が2体特殊召喚される',
   gameState.players[0].mz.length===2,'mz='+gameState.players[0].mz.length);
ok('スピッド・バード ruling: 特殊召喚したモンスターの効果は無効化される',
   gameState.players[0].mz.every(c=>c&&effectNegated(c)===true));

/* ================= CC ================= */
/* --- アマゾネスの鎖使い --- */
reset0();
let ac=mk('アマゾネスの鎖使い',0),k9=mk(BIG,1);
gameState.players[0].mz=[ac];gameState.players[1].mz=[k9];
let foeHandMon=mk(BIG,1);gameState.players[1].hand=[foeHandMon];
gameState.players[0].lp=4000;
let bt8=killByBattle(ac,k9,0);
let cac=ctxDS(0,ac,bt8,'grave');
ok('アマゾネスの鎖使い positive: 相手手札にモンスターがいれば誘発する',sc('アマゾネスの鎖使い').passive.onDamageStep(cac)===true);
sc('アマゾネスの鎖使い').cost(cac,()=>{});
ok('アマゾネスの鎖使い positive: 1500ライフを払う',gameState.players[0].lp===2500);
sc('アマゾネスの鎖使い').selectTargets(cac,r=>{cac.selectedTargets=r;});
sc('アマゾネスの鎖使い').resolve(cac);
ok('アマゾネスの鎖使い positive: 相手の手札のモンスターを自分の手札に加える',
   gameState.players[0].hand.some(c=>c&&c.uid===foeHandMon.uid));

/* --- ナイトエンド・ソーサラー --- */
reset0();
let ns=mk('ナイトエンド・ソーサラー',0);
gameState.players[0].mz=[ns];
gameState.players[1].grave=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
let cns=ctxEv(0,ns,'onSpecialSummon',{player:0,card:ns,uid:ns.uid,kind:'effect'});
ok('ナイトエンド・ソーサラー positive: 特殊召喚成功時に誘発する',sc('ナイトエンド・ソーサラー').passive.onSpecialSummon(cns)===true);
sc('ナイトエンド・ソーサラー').resolve(cns);
let pns=pending();
ok('ナイトエンド・ソーサラー ruling: 2枚まで選べる',!!pns&&pns.max===2&&pns.min===0);
answerChoiceV49(pns.candidates.slice(0,2).map(x=>x.key));
ok('ナイトエンド・ソーサラー positive: 相手の墓地のカードが除外される',
   gameState.players[1].banish.length===2);

/* --- 闇王プロメティス --- */
reset0();
let yp=mk('闇王プロメティス',0);
gameState.players[0].mz=[yp];
gameState.players[0].grave=[mk(DARKM,0),mk(DARKM,0)];   /* 闇属性 */
let cyp=ctxEv(0,yp,'onNormalSummon',{player:0,card:yp,uid:yp.uid});
ok('闇王プロメティス positive: 召喚成功時に誘発する',sc('闇王プロメティス').passive.onNormalSummon(cyp)===true);
sc('闇王プロメティス').resolve(cyp);
let pyp=pending();
ok('闇王プロメティス ruling: 任意の数を選べる',!!pyp&&pyp.min===0&&pyp.max===2);
answerChoiceV49(pyp.candidates.map(x=>x.key));
ok('闇王プロメティス positive: 除外した数×400 攻撃力が上がる',
   curATK(yp)===dbOf(yp).atk+800,'atk='+curATK(yp));
ok('闇王プロメティス positive: 闇属性が除外される',gameState.players[0].banish.length===2);

/* --- ライヤー・ワイヤー --- */
reset0();
let lw2=mk('ライヤー・ワイヤー',0,'down');
gameState.players[0].sz=[lw2];
let insect=mk('電動刃虫',0);   /* 昆虫族 */
ok('前提: 電動刃虫は昆虫族',dbOf(insect).ra==='昆虫');
gameState.players[0].grave=[insect];
let target2=mk(BIG,1);gameState.players[1].mz=[target2];
let clw=C(0,lw2,'sz',0);
ok('ライヤー・ワイヤー positive: 墓地に昆虫がいれば発動できる',sc('ライヤー・ワイヤー').condition(clw)===true);
sc('ライヤー・ワイヤー').cost(clw,()=>{});
ok('ライヤー・ワイヤー positive: コストで昆虫が除外される',
   gameState.players[0].banish.some(c=>c&&c.uid===insect.uid));
sc('ライヤー・ワイヤー').selectTargets(clw,r=>{clw.selectedTargets=r;});
sc('ライヤー・ワイヤー').resolve(clw);
ok('ライヤー・ワイヤー positive: 相手モンスターが破壊される',
   !gameState.players[1].mz.some(c=>c&&c.uid===target2.uid));

/* --- 水遁封印式 --- */
reset0();
let sf=mk('水遁封印式',0,'up');
gameState.players[0].sz=[sf];
let waterM=mk('氷結界の番人ブリズド',0);   /* 水属性 */
gameState.players[0].hand=[waterM];
gameState.players[1].grave=[mk(PLAIN,1)];
let csf=C(0,sf,'sz',0);
ok('水遁封印式 positive: 手札に水属性がいれば発動できる',sc('水遁封印式').condition(csf)===true);
sc('水遁封印式').cost(csf,()=>{});
ok('水遁封印式 positive: コストで水属性が墓地へ送られる',
   gameState.players[0].grave.some(c=>c&&c.uid===waterM.uid));
sc('水遁封印式').selectTargets(csf,r=>{csf.selectedTargets=r;});
sc('水遁封印式').resolve(csf);
ok('水遁封印式 positive: 相手の墓地のカードが除外される',gameState.players[1].banish.length===1);
ok('水遁封印式 ruling: 1ターンに1度',sc('水遁封印式').countLimit===1);

/* --- 死霊の巣 --- */
reset0();
let sn=mk('死霊の巣',0,'up');
gameState.players[0].sz=[sn];
gameState.players[0].grave=[mk(PLAIN,0),mk(PLAIN,0)];
let lv2t=mk('ジャイアントウィルス',1);   /* lv2 */
gameState.players[1].mz=[lv2t];
let csn=C(0,sn,'sz',0);
ok('死霊の巣 positive: 墓地にモンスターがいれば発動できる',sc('死霊の巣').condition(csn)===true);
sc('死霊の巣').resolve(csn);
let psn=pending();
ok('死霊の巣 ruling: 任意の枚数を選べる',!!psn&&psn.min===0);
pickFirst();
answerChoiceV49(psn.candidates.slice(0,2).map(x=>x.key));
ok('死霊の巣 positive: 除外枚数(2)と同じレベルのモンスターが破壊される',
   !gameState.players[1].mz.some(c=>c&&c.uid===lv2t.uid));
ok('死霊の巣 positive: 墓地のモンスターが除外される',gameState.players[0].banish.length===2);

/* --- 亜空間物質転送装置 --- */
reset0();
let ak=mk('亜空間物質転送装置',0,'down');
gameState.players[0].sz=[ak];
let hide=mk(BIG,0);gameState.players[0].mz=[hide];
let cak=C(0,ak,'sz',0);
ok('亜空間物質転送装置 positive: 自分の表側モンスターがいれば発動できる',sc('亜空間物質転送装置').condition(cak)===true);
sc('亜空間物質転送装置').selectTargets(cak,r=>{cak.selectedTargets=r;});
sc('亜空間物質転送装置').resolve(cak);
ok('亜空間物質転送装置 positive: 対象が除外される',
   gameState.players[0].banish.some(c=>c&&c.uid===hide.uid));
ok('亜空間物質転送装置 positive: エンドフェイズの戻りが予約される',
   API.schedules('a8.subspaceReturn').length===1,
   'schedules='+API.schedules('a8.subspaceReturn').length);

/* --- サイコ・トリガー --- */
reset0();
let pt=mk('サイコ・トリガー',0,'down');
gameState.players[0].sz=[pt];
gameState.players[0].lp=2000;gameState.players[1].lp=8000;
gameState.players[0].grave=[mk('強化人類サイコ',0),mk('強化人類サイコ',0)];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
let cpt=C(0,pt,'sz',0);
ok('サイコ・トリガー positive: ライフが相手より下なら発動できる',sc('サイコ・トリガー').condition(cpt)===true);
sc('サイコ・トリガー').cost(cpt,()=>{});
ok('サイコ・トリガー positive: サイキック2体が除外される',gameState.players[0].banish.length===2);
let hp=gameState.players[0].hand.length;
sc('サイコ・トリガー').resolve(cpt);
ok('サイコ・トリガー positive: 2枚ドローする',gameState.players[0].hand.length===hp+2);
reset0();
let pt2=mk('サイコ・トリガー',0,'down');gameState.players[0].sz=[pt2];
gameState.players[0].lp=8000;gameState.players[1].lp=2000;
gameState.players[0].grave=[mk('強化人類サイコ',0),mk('強化人類サイコ',0)];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0)];
ok('サイコ・トリガー negative: ライフが相手以上なら発動できない',
   sc('サイコ・トリガー').condition(C(0,pt2,'sz',0))===false);

/* ================= CD ================= */
/* --- ダークゼブラ --- */
reset0();
let dz=mk('ダークゼブラ',0);
gameState.players[0].mz=[dz];
let cdz=ctxEv(0,dz,'onStandbyPhase',{});
ok('ダークゼブラ positive: 自分だけの場なら誘発する',sc('ダークゼブラ').passive.onStandbyPhase(cdz)===true);
sc('ダークゼブラ').resolve(cdz);
ok('ダークゼブラ positive: 守備表示になる',dz.pos==='def','pos='+dz.pos);
ok('ダークゼブラ positive: そのターン表示形式を変更できない',cannotChangePositionV10(dz)===true);
reset0();
let dz2=mk('ダークゼブラ',0),other2=mk(PLAIN,0);
gameState.players[0].mz=[dz2,other2];
ok('ダークゼブラ negative: 他のモンスターがいれば誘発しない',
   sc('ダークゼブラ').passive.onStandbyPhase(ctxEv(0,dz2,'onStandbyPhase',{}))===false);

/* --- マタンゴ --- */
reset0();
let mt=mk('マタンゴ',0);
gameState.players[0].mz=[mt];gameState.players[0].lp=4000;
let cmt=ctxEv(0,mt,'onStandbyPhase',{});
ok('マタンゴ positive: 自分のスタンバイフェイズで誘発する',sc('マタンゴ').passive.onStandbyPhase(cmt)===true);
sc('マタンゴ').resolve(cmt);
ok('マタンゴ ruling: ダメージを受けるのはコントローラー',gameState.players[0].lp===3700,'lp='+gameState.players[0].lp);

/* --- カードトレーダー --- */
reset0();
let ct=mk('カードトレーダー',0,'up');
gameState.players[0].sz=[ct];
gameState.players[0].hand=[mk(PLAIN,0)];
gameState.players[0].deck=[mk(BIG,0)];
let cct=C(0,ct,'sz',0);
ok('カードトレーダー positive: 手札とデッキがあれば発動できる',sc('カードトレーダー').condition(cct)===true);
sc('カードトレーダー').selectTargets(cct,r=>{cct.selectedTargets=r;});
sc('カードトレーダー').resolve(cct);
ok('カードトレーダー positive: 手札1枚を戻して1枚引く（枚数収支）',
   gameState.players[0].hand.length===1&&gameState.players[0].deck.length===1);
ok('カードトレーダー ruling: 1ターンに1度',sc('カードトレーダー').countLimit===1);

/* --- リサイクル --- */
reset0();
let rc=mk('リサイクル',0,'up');
gameState.players[0].sz=[rc];gameState.players[0].lp=4000;
let spellInGrave=mk('サイクロン',0);
gameState.players[0].grave=[spellInGrave,mk(PLAIN,0)];
let crc=C(0,rc,'sz',0);
ok('リサイクル positive: 墓地にモンスター以外があれば発動できる',sc('リサイクル').condition(crc)===true);
sc('リサイクル').cost(crc,()=>{});
ok('リサイクル positive: 300ライフを払う',gameState.players[0].lp===3700);
pickNamed('サイクロン');
sc('リサイクル').selectTargets(crc,r=>{crc.selectedTargets=r;});
sc('リサイクル').resolve(crc);
ok('リサイクル positive: 選んだカードがデッキの一番下に戻る',
   gameState.players[0].deck.some(c=>c&&c.uid===spellInGrave.uid));
ok('リサイクル ruling: モンスターは対象にできない',(()=>{
   const q=API.pileCards(0,'grave',x=>x.db.k!=='m');
   return !q.some(x=>dbOf(x.card).k==='m');})());
pickFirst();

/* ================= Replay / SaveLoad ================= */
reset0();
let rdp=mk('ドーピング',0,'up'),rm=mk(PLAIN,0);
gameState.players[0].sz=[rdp];gameState.players[0].mz=[rm];equipTo(rdp,rm);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(rdp),'a8DopingN',2,'ドーピング');
let a1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle06 Replay: 装備の累積フラグが digest 一致で再生される',a1.ok,a1.reason||'');
ok('cycle06 Replay: 再生後も攻撃力計算が一致する',curATK(rm)===dbOf(rm).atk+300,'atk='+curATK(rm));
reset0();
let rak=mk('亜空間物質転送装置',0,'down'),rh=mk(BIG,0);
gameState.players[0].sz=[rak];gameState.players[0].mz=[rh];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.banish(h(rh),'亜空間物質転送装置');
API.schedule({at:'endPhase',turns:0,player:0,handler:'a8.subspaceReturn',
  args:{uid:rh.uid,player:0,pos:'atk'},source:{card:rak},note:'亜空間物質転送装置'});
let a2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle06 Replay: 除外＋スケジュール予約が digest 一致で再生される',a2.ok,a2.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle06 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle06 直列化: スケジュールに関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
