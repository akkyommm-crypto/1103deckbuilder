/* Class A bulk 50 — batch 2 / 戦闘ダメージ・攻撃対象・リクルート10枚。positive / negative / ruling edge。 */
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
function effOf(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw Error('effect '+n+' '+k);return e;}
function ctxF(p,card,evname,evt){const loc=h(card);
  const c=makeContext(p,card,(loc&&loc.zone)||'mz',(loc&&loc.index)||0,evname||'onFlip',{event:evt});
  if(evt)c.event=evt;return c;}
function run(e,c){if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c);}
function pending(){return pendingChoiceV49(gameState);}
function answerAll(){const pc=pending();if(!pc)throw Error('no pending');return answerChoiceV49(pc.candidates.map(x=>x.key));}
function answerN(n){const pc=pending();if(!pc)throw Error('no pending');return answerChoiceV49(pc.candidates.slice(0,n).map(x=>x.key));}
function answerNamed(nm){const pc=pending();if(!pc)throw Error('no pending');
  const hit=pc.candidates.find(x=>{const f=x&&x.uid!=null?findCardByUid(x.uid):null;return f&&dbOf(f.card).n===nm;});
  return answerChoiceV49([(hit||pc.candidates[0]).key]);}
function inHand(p,c){return (gameState.players[p].hand||[]).some(x=>x&&x.uid===c.uid);}
function inMz(p,c){return (gameState.players[p].mz||[]).some(x=>x&&x.uid===c.uid);}
function pickFirst(){API.selectCard=(t,list,cb)=>cb(list[0]);}
function pickNamed(nm){API.selectCard=(t,list,cb)=>{const hit=list.find(x=>x&&x.card&&dbOf(x.card).n===nm);cb(hit||list[0]);};}

/* 小道具は TESTED / GENERIC_OK / NOT_STARTED のみ */
const PLAIN='ワイト';           /* GENERIC_OK lv3 */
const BIG='青眼の白龍';          /* GENERIC_OK */
const WARRIOR='ゾンビタイガー';    /* NOT_STARTED・アンデット */
const WAR2='E・HERO クレイマン';  /* GENERIC_OK・戦士 */
const TRAP='落とし穴';           /* 罠 */
const SPELL='サイクロン';         /* 魔法 */
const FIELD='王家の眠る谷－ネクロバレー'; /* TESTED・フィールド魔法 */
const FIELD2='闇';              /* フィールド魔法（別） */
const EFFMON='キラー・トマト';     /* TESTED・効果モンスター */
const NORMMON='ヂェミナイ・エルフ'; /* GENERIC_OK・通常モンスター */

function declare(atkCard,defCard,atkPlayer){
  gameState.pendingAttack={player:(atkPlayer==null?1:atkPlayer),
    attackerUid:atkCard?atkCard.uid:null,targetUid:defCard?defCard.uid:null};}
function battleCtx(p,card,zone,b,step){
  const loc=locateCardAnyV4(card);
  const c=makeContext(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',{});
  c.battle=b; c.step=step||'after'; return c;}

const NAMES=['ワーム・ノーブル','ワーム・ホープ','エレキンメダイ','追い剥ぎゴブリン','義賊の極意書',
 '朽ち果てた武将','クレイ・チャージ','機皇廠','ダブルアタック'];
NAMES.forEach(n=>ok('bulk50-b2 registration '+n,!!CARD_SCRIPTS[n]));
const CLAY='E・HERO クレイマン';      /* GENERIC_OK */
const TIGER='ゾンビタイガー';          /* NOT_STARTED */
const OJA1='おジャマ・イエロー';        /* GENERIC_OK・OJAMA */
const OJA2='おジャマ・グリーン';        /* GENERIC_OK・OJAMA */
const OJA3='おジャマ・ブラック';        /* GENERIC_OK・OJAMA */
const MEK='機皇帝ワイゼル∞';           /* NOT_STARTED・MEKLORD */
const ARMY='機皇兵ワイゼル・アイン';     /* MEKLORD_ARMY */
ok('前提: 機皇帝ワイゼル∞ は MEKLORD',isCardInGroupV4(dbOf({id:findCardIndex(MEK)}),GROUP.MEKLORD)===true);
ok('前提: 機皇兵ワイゼル・アイン は MEKLORD_ARMY',
   isCardInGroupV4(dbOf({id:findCardIndex(ARMY)}),GROUP.MEKLORD_ARMY)===true);
ok('bulk50-b2: おジャマ・レッドは engine repair batch で解禁され登録済み',!!CARD_SCRIPTS['おジャマ・レッド']);

/* ===== ワーム・ノーブル / ワーム・ホープ（攻撃によるリバース） ===== */
for(const NAME of ['ワーム・ノーブル','ワーム・ホープ']){
  reset0();
  const me=mk(NAME,0),atk=mk(BIG,1);
  gameState.players[0].mz=[me];gameState.players[1].mz=[atk];
  gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0)];
  gameState.battle={flipped:true,flippedUid:me.uid,flippedCard:me,atkCard:atk,defCard:me};
  const key=(NAME==='ワーム・ノーブル')?'flip-by-attack-burn':'flip-by-attack-draw';
  const e=effOf(NAME,key);
  ok(NAME+' positive: 相手の攻撃でリバースしたら条件成立',
     e.condition(ctxF(0,me,'onFlip',{uid:me.uid,treatAsField:true,step:'after'}))===true);
  if(NAME==='ワーム・ノーブル'){
    const lp=gameState.players[1].lp;
    e.operation(ctxF(0,me,'onFlip',{uid:me.uid}));
    ok(NAME+' positive: 攻撃モンスターの攻撃力の半分を相手に与える',
       gameState.players[1].lp===lp-Math.floor(curATK(atk)/2),
       lp+'→'+gameState.players[1].lp+' atk='+curATK(atk));
  }else{
    const hd=gameState.players[0].hand.length;
    e.operation(ctxF(0,me,'onFlip',{uid:me.uid}));
    ok(NAME+' positive: 1枚ドローする',gameState.players[0].hand.length===hd+1);
  }
  ok(NAME+' negative: 戦闘以外のリバースでは誘発しない',(()=>{
     gameState.battle=null;
     return effOf(NAME,key).condition(ctxF(0,me,'onFlip',{uid:me.uid}))===false;})());
  ok(NAME+' negative: 自分のモンスターの攻撃では誘発しない',(()=>{
     reset0();const m2=mk(NAME,0),own=mk(BIG,0);
     gameState.players[0].mz=[m2,own];gameState.players[0].deck=[mk(PLAIN,0)];
     gameState.battle={flipped:true,flippedUid:m2.uid,atkCard:own,defCard:m2};
     return effOf(NAME,key).condition(ctxF(0,m2,'onFlip',{uid:m2.uid}))===false;})());
  ok(NAME+' negative: 他のカードのリバースでは誘発しない',(()=>{
     reset0();const m3=mk(NAME,0),oth=mk(PLAIN,0),atk3=mk(BIG,1);
     gameState.players[0].mz=[m3,oth];gameState.players[1].mz=[atk3];
     gameState.players[0].deck=[mk(PLAIN,0)];
     gameState.battle={flipped:true,flippedUid:oth.uid,atkCard:atk3,defCard:oth};
     return effOf(NAME,key).condition(ctxF(0,m3,'onFlip',{uid:oth.uid}))===false;})());
}
/* ワーム・ホープ の②墓地送り時の手札1枚墓地送り */
reset0();
let wh=mk('ワーム・ホープ',0);gameState.players[0].mz=[wh];
gameState.players[0].hand=[mk(PLAIN,0),mk(BIG,0)];
let whe=effOf('ワーム・ホープ','leave-field-discard-one');
let whEvt={uid:wh.uid,player:0,fromZone:'mz',toZone:'grave'};
ok('ワーム・ホープ positive: 墓地へ送られた時に条件成立',whe.condition(ctxF(0,wh,'onLeaveField',whEvt))===true);
let hb=gameState.players[0].hand.length;
whe.operation(ctxF(0,wh,'onLeaveField',whEvt));
answerN(1);
ok('ワーム・ホープ positive: 手札を1枚墓地へ送る',gameState.players[0].hand.length===hb-1);
gameState.players[0].hand=[];
ok('ワーム・ホープ negative: 手札0枚なら発動しない',
   whe.condition(ctxF(0,wh,'onLeaveField',whEvt))===false);
ok('ワーム・ホープ negative: 除外では誘発しない',(()=>{
   gameState.players[0].hand=[mk(PLAIN,0)];
   return whe.condition(ctxF(0,wh,'onLeaveField',{uid:wh.uid,player:0,fromZone:'mz',toZone:'banish'}))===false;})());

/* ===== エレキンメダイ（直接攻撃限定） ===== */
reset0();
let em=mk('エレキンメダイ',0);gameState.players[0].mz=[em];
gameState.players[1].hand=[mk(PLAIN,1),mk(PLAIN,1)];
let eme=effOf('エレキンメダイ');
let bDirect={atkCard:em,damage:300,toPlayer:1,target:'direct'};
ok('エレキンメダイ positive: 直接攻撃の戦闘ダメージで条件成立',
   eme.condition(battleCtx(0,em,'mz',bDirect))===true);
let fh=gameState.players[1].hand.length;
eme.operation(battleCtx(0,em,'mz',bDirect));
ok('エレキンメダイ positive: 相手の手札がランダムに1枚減る',gameState.players[1].hand.length===fh-1);
ok('エレキンメダイ negative: モンスター戦闘のダメージでは誘発しない',
   eme.condition(battleCtx(0,em,'mz',{atkCard:em,damage:300,toPlayer:1}))===false);
ok('エレキンメダイ negative: 相手の手札が0枚なら発動しない',(()=>{
   gameState.players[1].hand=[];
   return eme.condition(battleCtx(0,em,'mz',bDirect))===false;})());
ok('エレキンメダイ negative: 他のモンスターの直接攻撃では誘発しない',(()=>{
   gameState.players[1].hand=[mk(PLAIN,1)];
   const oth=mk(BIG,0);gameState.players[0].mz.push(oth);
   return eme.condition(battleCtx(0,em,'mz',{atkCard:oth,damage:300,toPlayer:1,target:'direct'}))===false;})());

/* ===== 追い剥ぎゴブリン ===== */
reset0();
let og=mk('追い剥ぎゴブリン',0,'up');gameState.players[0].sz=[og];
let om=mk(BIG,0);gameState.players[0].mz=[om];
gameState.players[1].hand=[mk(PLAIN,1),mk(PLAIN,1)];
let oge=effOf('追い剥ぎゴブリン');
let ob={atkCard:om,damage:500,toPlayer:1};
ok('追い剥ぎゴブリン positive: 自分のモンスターの戦闘ダメージで条件成立',
   oge.condition(battleCtx(0,og,'sz',ob))===true);
let oh=gameState.players[1].hand.length;
oge.operation(battleCtx(0,og,'sz',ob));
ok('追い剥ぎゴブリン positive: 相手の手札がランダムに1枚減る',gameState.players[1].hand.length===oh-1);
ok('追い剥ぎゴブリン ruling: 直接攻撃のダメージでも誘発する',
   oge.condition(battleCtx(0,og,'sz',{atkCard:om,damage:900,toPlayer:1,target:'direct'}))===true);
ok('追い剥ぎゴブリン negative: 相手のモンスターの戦闘ダメージでは誘発しない',(()=>{
   const foe=mk(BIG,1);gameState.players[1].mz=[foe];
   return oge.condition(battleCtx(0,og,'sz',{atkCard:foe,damage:500,toPlayer:1}))===false;})());
ok('追い剥ぎゴブリン negative: 自分が受けたダメージでは誘発しない',
   oge.condition(battleCtx(0,og,'sz',{atkCard:om,damage:500,toPlayer:0}))===false);
ok('追い剥ぎゴブリン negative: 裏側のままでは誘発しない',(()=>{
   og.face='down';const r=oge.condition(battleCtx(0,og,'sz',ob));og.face='up';return r===false;})());

/* ===== 義賊の極意書 ===== */
reset0();
let bk=mk('義賊の極意書',0,'down');gameState.players[0].sz=[bk];
let nm=mk(NORMMON,0),efm=mk(EFFMON,0);
gameState.players[0].mz=[nm,efm];
gameState.players[1].hand=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
let bke=effOf('義賊の極意書','mark-normal-monster');
ok('義賊の極意書 positive: 自分の通常モンスターがいれば発動できる',
   bke.condition(ctxF(0,bk,'activate'))===true);
ok('義賊の極意書 positive: 候補は通常モンスターだけ',
   cwOwnNormalMonsters(0).length===1&&dbOf(cwOwnNormalMonsters(0)[0].card).n===NORMMON);
pickFirst();run(bke,ctxF(0,bk,'activate'));
ok('義賊の極意書 positive: 選んだ通常モンスターに刻印が付く',nm.cwBanditTurn===gameState.turn);
let bkd=effOf('義賊の極意書','marked-battle-damage-discard-two');
gameState.players[0].grave=[bk];gameState.players[0].sz=[];
let bb2={atkCard:nm,damage:400,toPlayer:1};
ok('義賊の極意書 positive: 刻印されたモンスターの戦闘ダメージで条件成立',
   bkd.condition(battleCtx(0,bk,'grave',bb2))===true);
let bh=gameState.players[1].hand.length;
bkd.operation(battleCtx(0,bk,'grave',bb2));
ok('義賊の極意書 positive: 相手の手札がランダムに2枚減る',
   gameState.players[1].hand.length===bh-2,bh+'→'+gameState.players[1].hand.length);
ok('義賊の極意書 negative: 刻印の無いモンスターでは誘発しない',
   bkd.condition(battleCtx(0,bk,'grave',{atkCard:efm,damage:400,toPlayer:1}))===false);
ok('義賊の極意書 ruling: 刻印はこのターンだけ有効',(()=>{
   gameState.turn+=1;
   return bkd.condition(battleCtx(0,bk,'grave',bb2))===false;})());
ok('義賊の極意書 negative: 通常モンスターがいなければ発動できない',(()=>{
   reset0();const b2=mk('義賊の極意書',0,'down');gameState.players[0].sz=[b2];
   gameState.players[0].mz=[mk(EFFMON,0)];
   return effOf('義賊の極意書','mark-normal-monster').condition(ctxF(0,b2,'activate'))===false;})());

/* ===== 朽ち果てた武将 ===== */
reset0();
let kw=mk('朽ち果てた武将',0),tg2=mk(TIGER,0);
gameState.players[0].mz=[kw];gameState.players[0].hand=[mk(PLAIN,0),tg2];
let kwe=effOf('朽ち果てた武将','summon-recruit-zombie-tiger');
ok('朽ち果てた武将 positive: 召喚成功時に「ゾンビタイガー」を呼べる',
   kwe.condition(ctxF(0,kw,'onNormalSummon',{player:0,card:kw}))===true);
kwe.operation(ctxF(0,kw,'onNormalSummon',{player:0,card:kw}));
answerNamed(TIGER);
ok('朽ち果てた武将 positive: 手札から特殊召喚される',inMz(0,tg2));
ok('朽ち果てた武将 negative: 「ゾンビタイガー」が手札に無ければ発動しない',(()=>{
   reset0();const k2=mk('朽ち果てた武将',0);gameState.players[0].mz=[k2];
   gameState.players[0].hand=[mk(PLAIN,0)];
   return effOf('朽ち果てた武将','summon-recruit-zombie-tiger')
     .condition(ctxF(0,k2,'onNormalSummon',{player:0,card:k2}))===false;})());
reset0();
let kw3=mk('朽ち果てた武将',0);gameState.players[0].mz=[kw3];
gameState.players[1].hand=[mk(PLAIN,1)];
let kwd=effOf('朽ち果てた武将','direct-attack-random-discard');
ok('朽ち果てた武将 positive: 直接攻撃成功でランダム捨ての条件成立',
   kwd.condition(battleCtx(0,kw3,'mz',{atkCard:kw3,damage:1000,toPlayer:1,target:'direct'}))===true);
ok('朽ち果てた武将 negative: モンスター戦闘では捨てさせない',
   kwd.condition(battleCtx(0,kw3,'mz',{atkCard:kw3,damage:1000,toPlayer:1}))===false);

function realAttack(p,mzIndex,target){
  act({type:'ATTACK_DECLARE_V48',player:p,mzIndex:mzIndex});
  act({type:'ATTACK',player:p,atkIdx:mzIndex,target:target});
}

/* ===== クレイ・チャージ ===== */
reset0();
let cc=mk('クレイ・チャージ',0,'down'),clay=mk(CLAY,0),foeA=mk(BIG,1);
gameState.players[0].sz=[cc];gameState.players[0].mz=[clay];gameState.players[1].mz=[foeA];
let cce=effOf('クレイ・チャージ');
declare(foeA,clay,1);
ok('クレイ・チャージ positive: クレイマンが攻撃対象なら発動できる',cce.condition(ctxF(0,cc,'onAttackDeclare'))===true);
let lpF=gameState.players[1].lp;
cce.operation(ctxF(0,cc,'onAttackDeclare'));
ok('クレイ・チャージ positive: 攻撃モンスターが破壊される',
   (gameState.players[1].grave||[]).some(c=>c&&c.uid===foeA.uid));
ok('クレイ・チャージ positive: クレイマンも破壊される',
   (gameState.players[0].grave||[]).some(c=>c&&c.uid===clay.uid));
ok('クレイ・チャージ positive: 相手に800ダメージ',gameState.players[1].lp===lpF-800,lpF+'→'+gameState.players[1].lp);
ok('クレイ・チャージ negative: 攻撃対象がクレイマン以外なら発動できない',(()=>{
   reset0();const c2=mk('クレイ・チャージ',0,'down'),oth=mk(BIG,0),f2=mk(BIG,1);
   gameState.players[0].sz=[c2];gameState.players[0].mz=[oth];gameState.players[1].mz=[f2];
   declare(f2,oth,1);
   return effOf('クレイ・チャージ').condition(ctxF(0,c2,'onAttackDeclare'))===false;})());
ok('クレイ・チャージ negative: 相手のクレイマンが対象でも発動できない',(()=>{
   reset0();const c3=mk('クレイ・チャージ',0,'down'),fc=mk(CLAY,1),f3=mk(BIG,0);
   gameState.players[0].sz=[c3];gameState.players[1].mz=[fc];gameState.players[0].mz=[f3];
   declare(f3,fc,0);
   return effOf('クレイ・チャージ').condition(ctxF(0,c3,'onAttackDeclare'))===false;})());
ok('クレイ・チャージ negative: 攻撃宣言が無ければ発動できない',(()=>{
   gameState.pendingAttack=null;
   return effOf('クレイ・チャージ').condition(ctxF(0,cc,'onAttackDeclare'))===false;})());

/* ===== 機皇廠 ===== */
reset0();
let ks=mk('機皇廠',0,'down'),mek=mk(MEK,0),fB=mk(BIG,1),army=mk(ARMY,0);
gameState.players[0].sz=[ks];gameState.players[0].mz=[mek];gameState.players[1].mz=[fB];
gameState.players[0].grave=[army];
let kse=effOf('機皇廠');
declare(fB,mek,1);
ok('機皇廠 positive: 「機皇」が攻撃対象で墓地に「機皇兵」があれば発動できる',
   kse.condition(ctxF(0,ks,'onAttackDeclare'))===true);
kse.operation(ctxF(0,ks,'onAttackDeclare'));
answerNamed(ARMY);
ok('機皇廠 positive: 「機皇兵」が手札に加わる',inHand(0,army));
ok('機皇廠 positive: 攻撃対象となったモンスターが破壊される',
   (gameState.players[0].grave||[]).some(c=>c&&c.uid===mek.uid));
ok('機皇廠 negative: 墓地に「機皇兵」が無ければ発動できない',(()=>{
   reset0();const k2=mk('機皇廠',0,'down'),m2=mk(MEK,0),f2=mk(BIG,1);
   gameState.players[0].sz=[k2];gameState.players[0].mz=[m2];gameState.players[1].mz=[f2];
   declare(f2,m2,1);
   return effOf('機皇廠').condition(ctxF(0,k2,'onAttackDeclare'))===false;})());
ok('機皇廠 negative: 攻撃対象が「機皇」でなければ発動できない',(()=>{
   reset0();const k3=mk('機皇廠',0,'down'),o3=mk(BIG,0),f3=mk(BIG,1);
   gameState.players[0].sz=[k3];gameState.players[0].mz=[o3];gameState.players[1].mz=[f3];
   gameState.players[0].grave=[mk(ARMY,0)];
   declare(f3,o3,1);
   return effOf('機皇廠').condition(ctxF(0,k3,'onAttackDeclare'))===false;})());

/* ===== ダブルアタック ===== */
reset0();
let da=mk('ダブルアタック',0,'down');gameState.players[0].sz=[da];
let low=mk(PLAIN,0);gameState.players[0].mz=[low];
gameState.players[0].hand=[mk(BIG,0)];
let dae=effOf('ダブルアタック');
ok('ダブルアタック positive: 手札のモンスターより低いレベルがいれば発動できる',
   dae.condition(ctxF(0,da,'activate'))===true);
pickFirst();
let dc=ctxF(0,da,'activate');
let paid=false; dae.cost(dc,v=>{paid=v;});
ok('ダブルアタック positive: コストの手札1枚を捨てる',paid===true&&gameState.players[0].hand.length===0);
dae.target(dc,r=>{dc.selectedTargets=r;});
dae.operation(dc);
ok('ダブルアタック positive: 攻撃可能回数が2回になる',low.attackLimit===2,'limit='+low.attackLimit);
gameState.players[1].mz=[mk(PLAIN,1)];
realAttack(0,0,0);
ok('ダブルアタック positive: 実戦で1回攻撃した後も2回目を宣言できる',
   Number(low.attackCount)===1&&canDeclareAttackV48(low)===true);
ok('ダブルアタック negative: 手札にモンスターが無ければ発動できない',(()=>{
   reset0();const d2=mk('ダブルアタック',0,'down');gameState.players[0].sz=[d2];
   gameState.players[0].mz=[mk(PLAIN,0)];gameState.players[0].hand=[];
   return effOf('ダブルアタック').condition(ctxF(0,d2,'activate'))===false;})());
ok('ダブルアタック negative: 手札より低いレベルのモンスターがいなければ発動できない',(()=>{
   reset0();const d3=mk('ダブルアタック',0,'down');gameState.players[0].sz=[d3];
   gameState.players[0].mz=[mk(BIG,0)];gameState.players[0].hand=[mk(PLAIN,0)];
   return effOf('ダブルアタック').condition(ctxF(0,d3,'activate'))===false;})());

/* ================= Replay / SaveLoad ================= */
reset0();
let za=mk('朽ち果てた武将',0),zt=mk(TIGER,0);
gameState.players[0].mz=[za];gameState.players[0].hand=[zt];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
effOf('朽ち果てた武将','summon-recruit-zombie-tiger').operation(ctxF(0,za,'onNormalSummon',{player:0,card:za}));
answerN(1);
if(typeof flushDeferredEventsV2==='function') flushDeferredEventsV2();
ok('bulk50-b2 positive: Replay検証用の特殊召喚が成立',inMz(0,zt));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('bulk50-b2 Replay: リクルートが digest 一致で再生される',audit.ok,audit.reason||'');
let snap=JSON.stringify(gameState);
ok('bulk50-b2 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('bulk50-b2 直列化: gameState に関数が漏れていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
