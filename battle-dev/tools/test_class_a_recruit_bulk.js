/* Class A bulk 召喚成功リクルータ／サーチャー14枚 — positive / negative / ruling edge。 */
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
  gameState.phase='main1';gameState.turn=7;PLAY_MODE=PLAY_MODES.DUEL;
  HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();
  v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function h(c){return locateCardAnyV4(c);}
function eff(n){const e=nativeEffectsV4(n)[0];if(!e)throw Error('effect '+n);return e;}
function ctxS(p,card,evname,evt){const loc=h(card);
  const c=makeContext(p,card,(loc&&loc.zone)||'mz',(loc&&loc.index)||0,evname,{event:evt});
  c.event=evt;return c;}
function selfEvt(card,p){return {player:p,name:dbOf(card).n,card};}
function pending(){return pendingChoiceV49(gameState);}
function answerNamed(n){const pc=pending();if(!pc)throw Error('no pending choice');
  const hit=pc.candidates.find(x=>{const f=x&&x.uid!=null?findCardByUid(x.uid):null;return f&&dbOf(f.card).n===n;});
  return answerChoiceV49([(hit||pc.candidates[0]).key]);}
function inMz(p,c){return (gameState.players[p].mz||[]).some(x=>x&&x.uid===c.uid);}
function inHand(p,c){return (gameState.players[p].hand||[]).some(x=>x&&x.uid===c.uid);}

/* 小道具は TESTED / GENERIC_OK / NOT_STARTED のみ */
const EVOL='エヴォルダー・ケラト';        /* NOT_STARTED・EVOLSAUR群 */
const NAT2='ナチュル・エッグプラント';      /* TESTED・NATURIA lv2 */
const NAT9='ナチュル・ガオドレイク';       /* GENERIC_OK・NATURIA lv9 */
const GEN3='ジェネクス・コントローラー';     /* GENERIC_OK・GENEX lv3 */
const GEN4='A・ジェネクス・パワーコール';    /* TESTED・GENEX lv4 */
const MACH='マシンナーズ・スナイパー';      /* NOT_STARTED・MACHINA lv4 */
const DUAL3='サンライズ・ガードナー';       /* NOT_STARTED・デュアル lv3 */
const RITM='サクリファイス';             /* NOT_STARTED・儀式モンスター */
const RITS='イリュージョンの儀式';         /* TESTED・儀式魔法 */
const GISH='リチュアの儀水鏡';            /* TESTED・GISHKI 儀式魔法 */
const BLAZE='ブレイズ・キャノン';          /* NOT_STARTED・BLAZE_CANNON群 */
const LV3='B・プラント';                /* GENERIC_OK・レベル3通常 */
const LV4='ヂェミナイ・エルフ';           /* GENERIC_OK・レベル4通常 */
const DEND='デス・デンドル';             /* NOT_STARTED */
const FILL='おジャマ・イエロー';          /* GENERIC_OK・レベル2 */

const NAMES=['エヴォルド・オドケリス','エヴォルド・ウェストロ','デュアル・スコーピオン','ナチュル・パンプキン',
 'ナチュル・アントジョー','レアル・ジェネクス・コーディネイター','ブラッド・オーキス','デイブレーカー',
 'マシンナーズ・ソルジャー','トライデント・ウォリアー','ゴブリンドバーグ','マンジュ・ゴッド',
 'ヴォルカニック・ロケット','リチュア・マーカー'];
NAMES.forEach(n=>ok('ClassA-recruit registration '+n,!!CARD_SCRIPTS[n]));
/* authority の前提（名前の部分一致ではなく setcode / overlay 群） */
ok('前提: エヴォルダーは EVOLSAUR 群、エヴォルドは別群',
   isCardInGroupV4(dbOf({id:findCardIndex(EVOL)}),GROUP.EVOLSAUR)===true&&
   isCardInGroupV4(dbOf({id:findCardIndex('エヴォルド・オドケリス')}),GROUP.EVOLSAUR)===false);
ok('前提: ナチュルは NATURIA setcode',isSetCardV4(dbOf({id:findCardIndex(NAT2)}),SETCODE.NATURIA)===true);
ok('前提: マシンナーズは MACHINA setcode',isSetCardV4(dbOf({id:findCardIndex(MACH)}),SETCODE.MACHINA)===true);
ok('前提: リチュアの儀水鏡は GISHKI setcode',isSetCardV4(dbOf({id:findCardIndex(GISH)}),SETCODE.GISHKI)===true);
ok('前提: ブレイズ・キャノンは BLAZE_CANNON 群',isCardInGroupV4(dbOf({id:findCardIndex(BLAZE)}),GROUP.BLAZE_CANNON)===true);

/* 手札からリクルートする定型の共通検証。
   good=呼べる手札札、bad=呼べない手札札、ev=誘発イベント名 */
function handRecruitSuite(NAME,ev,good,bad,setup){
  reset0();
  const me=mk(NAME,0);gameState.players[0].mz=[me];
  const g=mk(good,0),b=mk(bad,0);gameState.players[0].hand=[b,g];
  if(setup) setup(me);
  const e=eff(NAME);
  const c=ctxS(0,me,ev,selfEvt(me,0));
  ok(NAME+' positive: 自身の召喚成功で条件を満たす',e.condition(c)===true);
  e.operation(c);
  const pc=pending();
  ok(NAME+' positive: 呼べる候補だけが提示される',
     !!pc&&pc.candidates.length===1,pc?String(pc.candidates.length):'none');
  answerNamed(good);
  ok(NAME+' positive: 手札から特殊召喚される',inMz(0,g)&&!inHand(0,g));
  ok(NAME+' negative: 対象外の手札は残る',inHand(0,b));
  /* 呼べる札が無ければ発動しない */
  reset0();
  const me2=mk(NAME,0);gameState.players[0].mz=[me2];
  gameState.players[0].hand=[mk(bad,0)];
  if(setup) setup(me2);
  ok(NAME+' negative: 呼べる手札が無ければ発動しない',
     eff(NAME).condition(ctxS(0,me2,ev,selfEvt(me2,0)))===false);
  /* 他のカードの召喚では誘発しない */
  reset0();
  const me3=mk(NAME,0),other=mk(FILL,0);gameState.players[0].mz=[me3,other];
  gameState.players[0].hand=[mk(good,0)];
  if(setup) setup(me3);
  ok(NAME+' negative: 他のモンスターの召喚では誘発しない',
     eff(NAME).condition(ctxS(0,me3,ev,selfEvt(other,0)))===false);
  /* モンスターゾーンが一杯なら発動しない */
  reset0();
  const me4=mk(NAME,0);gameState.players[0].mz=[me4];
  for(let i=0;i<4;i++) gameState.players[0].mz.push(mk(FILL,0));
  gameState.players[0].hand=[mk(good,0)];
  if(setup) setup(me4);
  ok(NAME+' negative: 自分のモンスターゾーンが一杯なら発動しない',
     eff(NAME).condition(ctxS(0,me4,ev,selfEvt(me4,0)))===false);
}

handRecruitSuite('エヴォルド・オドケリス','onNormalSummon',EVOL,LV4);
handRecruitSuite('デュアル・スコーピオン','onNormalSummon',DUAL3,LV4);
handRecruitSuite('レアル・ジェネクス・コーディネイター','onNormalSummon',GEN3,GEN4);
handRecruitSuite('ブラッド・オーキス','onNormalSummon',DEND,LV4);
handRecruitSuite('トライデント・ウォリアー','onNormalSummon',LV3,LV4);
handRecruitSuite('ゴブリンドバーグ','onNormalSummon',LV4,NAT9);

/* ---- カード固有条件 ---- */
/* デュアル・スコーピオン: 特殊召喚成功時にも誘発する */
reset0();
let ds=mk('デュアル・スコーピオン',0);gameState.players[0].mz=[ds];
gameState.players[0].hand=[mk(DUAL3,0)];
ok('デュアル・スコーピオン ruling: 特殊召喚成功時にも誘発する',
   eff('デュアル・スコーピオン').condition(ctxS(0,ds,'onSpecialSummon',selfEvt(ds,0)))===true);
ok('デュアル・スコーピオン negative: レベル5以上のデュアルは呼べない',(()=>{
   gameState.players[0].hand=[mk(LV4,0)];
   return eff('デュアル・スコーピオン').condition(ctxS(0,ds,'onNormalSummon',selfEvt(ds,0)))===false;})());
/* レアル・ジェネクス・コーディネイター: レベル4のジェネクスは呼べない */
reset0();
let rg=mk('レアル・ジェネクス・コーディネイター',0);gameState.players[0].mz=[rg];
gameState.players[0].hand=[mk(GEN4,0)];
ok('レアル・ジェネクス・コーディネイター negative: レベル4の「ジェネクス」は呼べない',
   eff('レアル・ジェネクス・コーディネイター').condition(ctxS(0,rg,'onNormalSummon',selfEvt(rg,0)))===false);
/* トライデント・ウォリアー: レベル3ちょうど */
reset0();
let tw=mk('トライデント・ウォリアー',0);gameState.players[0].mz=[tw];
gameState.players[0].hand=[mk(FILL,0)];
ok('トライデント・ウォリアー negative: レベル2は呼べない（レベル3ちょうど）',
   eff('トライデント・ウォリアー').condition(ctxS(0,tw,'onNormalSummon',selfEvt(tw,0)))===false);
/* ゴブリンドバーグ: 発動したら自身は守備表示 */
reset0();
let gb=mk('ゴブリンドバーグ',0),gt=mk(LV4,0);
gameState.players[0].mz=[gb];gameState.players[0].hand=[gt];
let ge=eff('ゴブリンドバーグ');let gc=ctxS(0,gb,'onNormalSummon',selfEvt(gb,0));
ge.operation(gc);answerNamed(LV4);
ok('ゴブリンドバーグ positive: レベル4以下を特殊召喚する',inMz(0,gt));
ok('ゴブリンドバーグ ruling: 効果を発動したら自身は守備表示になる',gb.pos==='def',gb.pos);

/* ---- ナチュル・パンプキン: 相手フィールドにモンスターが必要 ---- */
reset0();
let np=mk('ナチュル・パンプキン',0);gameState.players[0].mz=[np];
gameState.players[0].hand=[mk(NAT2,0)];
ok('ナチュル・パンプキン negative: 相手フィールドが空なら発動しない',
   eff('ナチュル・パンプキン').condition(ctxS(0,np,'onNormalSummon',selfEvt(np,0)))===false);
gameState.players[1].mz=[mk(FILL,1)];
ok('ナチュル・パンプキン positive: 相手にモンスターがいれば発動できる',
   eff('ナチュル・パンプキン').condition(ctxS(0,np,'onNormalSummon',selfEvt(np,0)))===true);
ok('ナチュル・パンプキン ruling: レベル制限は無く高レベルの「ナチュル」も呼べる',(()=>{
   gameState.players[0].hand=[mk(NAT9,0)];
   return eff('ナチュル・パンプキン').condition(ctxS(0,np,'onNormalSummon',selfEvt(np,0)))===true;})());
ok('ナチュル・パンプキン negative: 「ナチュル」以外は呼べない',(()=>{
   gameState.players[0].hand=[mk(LV4,0)];
   return eff('ナチュル・パンプキン').condition(ctxS(0,np,'onNormalSummon',selfEvt(np,0)))===false;})());

/* ---- ナチュル・アントジョー: 相手の特殊召喚成功時にデッキから ---- */
reset0();
let aj=mk('ナチュル・アントジョー',0);gameState.players[0].mz=[aj];
let foeSS=mk(FILL,1);gameState.players[1].mz=[foeSS];
gameState.players[0].deck=[mk(NAT9,0),mk(NAT2,0),mk(LV4,0)];
let ae=eff('ナチュル・アントジョー');
let ac=ctxS(0,aj,'onSpecialSummon',{player:1,name:dbOf(foeSS).n,card:foeSS});
ok('ナチュル・アントジョー positive: 相手の特殊召喚で条件を満たす',ae.condition(ac)===true);
ae.operation(ac);
let apc=pending();
ok('ナチュル・アントジョー positive: 候補はレベル3以下の「ナチュル」だけ',
   !!apc&&apc.candidates.length===1,apc?String(apc.candidates.length):'none');
answerNamed(NAT2);
ok('ナチュル・アントジョー positive: デッキから特殊召喚される',
   (gameState.players[0].mz||[]).some(x=>x&&dbOf(x).n===NAT2));
ok('ナチュル・アントジョー negative: 自分の特殊召喚では誘発しない',(()=>{
   reset0();const a2=mk('ナチュル・アントジョー',0);gameState.players[0].mz=[a2];
   const own=mk(FILL,0);gameState.players[0].mz.push(own);
   gameState.players[0].deck=[mk(NAT2,0)];
   return eff('ナチュル・アントジョー').condition(ctxS(0,a2,'onSpecialSummon',{player:0,name:dbOf(own).n,card:own}))===false;})());
ok('ナチュル・アントジョー negative: レベル4以上の「ナチュル」は呼べない',(()=>{
   reset0();const a3=mk('ナチュル・アントジョー',0);gameState.players[0].mz=[a3];
   const f=mk(FILL,1);gameState.players[1].mz=[f];
   gameState.players[0].deck=[mk(NAT9,0)];
   return eff('ナチュル・アントジョー').condition(ctxS(0,a3,'onSpecialSummon',{player:1,name:dbOf(f).n,card:f}))===false;})());

/* ---- エヴォルド・ウェストロ: リバース時にデッキから「エヴォルダー」 ---- */
reset0();
let ew=mk('エヴォルド・ウェストロ',0);gameState.players[0].mz=[ew];
gameState.players[0].deck=[mk(LV4,0),mk(EVOL,0)];
let we=eff('エヴォルド・ウェストロ');
let wc=ctxS(0,ew,'onFlip',{player:0,name:'エヴォルド・ウェストロ',card:ew});
ok('エヴォルド・ウェストロ positive: リバースで条件を満たす',we.condition(wc)===true);
we.operation(wc);
let wpc=pending();
ok('エヴォルド・ウェストロ positive: 候補は「エヴォルダー」だけ',
   !!wpc&&wpc.candidates.length===1,wpc?String(wpc.candidates.length):'none');
answerNamed(EVOL);
ok('エヴォルド・ウェストロ positive: デッキから特殊召喚される',
   (gameState.players[0].mz||[]).some(x=>x&&dbOf(x).n===EVOL));
ok('エヴォルド・ウェストロ negative: デッキに「エヴォルダー」が無ければ発動しない',(()=>{
   reset0();const w2=mk('エヴォルド・ウェストロ',0);gameState.players[0].mz=[w2];
   gameState.players[0].deck=[mk(LV4,0)];
   return eff('エヴォルド・ウェストロ').condition(ctxS(0,w2,'onFlip',{player:0,card:w2}))===false;})());
ok('エヴォルド・ウェストロ negative: 裏側のままでは発動しない',(()=>{
   reset0();const w3=mk('エヴォルド・ウェストロ',0,'down','def');gameState.players[0].mz=[w3];
   gameState.players[0].deck=[mk(EVOL,0)];
   return eff('エヴォルド・ウェストロ').condition(ctxS(0,w3,'onFlip',{player:0,card:w3}))===false;})());

/* ---- デイブレーカー: 特殊召喚成功時に手札から同名1体 ---- */
reset0();
let dbk=mk('デイブレーカー',0),dbk2=mk('デイブレーカー',0);
gameState.players[0].mz=[dbk];gameState.players[0].hand=[mk(LV4,0),dbk2];
let de=eff('デイブレーカー');
ok('デイブレーカー positive: 特殊召喚成功時に同名を呼べる',
   de.condition(ctxS(0,dbk,'onSpecialSummon',selfEvt(dbk,0)))===true);
ok('デイブレーカー negative: 通常召喚は誘発イベントに含まれない',
   nativeEffectsV4('デイブレーカー')[0].events.indexOf('onNormalSummon')<0
   &&nativeEffectsV4('デイブレーカー')[0].events.indexOf('onSpecialSummon')>=0,
   JSON.stringify(nativeEffectsV4('デイブレーカー')[0].events));
ok('デイブレーカー negative: 手札に同名が無ければ発動しない',(()=>{
   gameState.players[0].hand=[mk(LV4,0)];
   return de.condition(ctxS(0,dbk,'onSpecialSummon',selfEvt(dbk,0)))===false;})());

/* ---- マシンナーズ・ソルジャー: 他に自分のモンスターがいない召喚成功時 ---- */
reset0();
let ms=mk('マシンナーズ・ソルジャー',0);gameState.players[0].mz=[ms];
gameState.players[0].hand=[mk(MACH,0)];
let mse=eff('マシンナーズ・ソルジャー');
ok('マシンナーズ・ソルジャー positive: 自分の場に他がいなければ発動できる',
   mse.condition(ctxS(0,ms,'onNormalSummon',selfEvt(ms,0)))===true);
gameState.players[0].mz.push(mk(FILL,0));
ok('マシンナーズ・ソルジャー negative: 他の自分のモンスターがいると発動しない',
   mse.condition(ctxS(0,ms,'onNormalSummon',selfEvt(ms,0)))===false);
ok('マシンナーズ・ソルジャー negative: 同名の「マシンナーズ・ソルジャー」は呼べない',(()=>{
   reset0();const m2=mk('マシンナーズ・ソルジャー',0);gameState.players[0].mz=[m2];
   gameState.players[0].hand=[mk('マシンナーズ・ソルジャー',0)];
   return eff('マシンナーズ・ソルジャー').condition(ctxS(0,m2,'onNormalSummon',selfEvt(m2,0)))===false;})());

/* ---- マンジュ・ゴッド: デッキから儀式モンスターまたは儀式魔法 ---- */
reset0();
let mj=mk('マンジュ・ゴッド',0);gameState.players[0].mz=[mj];
let rm=mk(RITM,0),rs=mk(RITS,0);
gameState.players[0].deck=[mk(LV4,0),rm,rs];
let mje=eff('マンジュ・ゴッド');
let mjc=ctxS(0,mj,'onNormalSummon',selfEvt(mj,0));
ok('マンジュ・ゴッド positive: 召喚成功で条件を満たす',mje.condition(mjc)===true);
mje.operation(mjc);
let mpc=pending();
ok('マンジュ・ゴッド positive: 候補は儀式モンスターと儀式魔法の2枚',
   !!mpc&&mpc.candidates.length===2,mpc?String(mpc.candidates.length):'none');
answerNamed(RITS);
ok('マンジュ・ゴッド positive: 儀式魔法を手札に加えられる',inHand(0,rs));
ok('マンジュ・ゴッド ruling: 儀式モンスターも選べる（センジュ・ゴッドとの差）',(()=>{
   reset0();const m2=mk('マンジュ・ゴッド',0);gameState.players[0].mz=[m2];
   const r=mk(RITM,0);gameState.players[0].deck=[r];
   const e2=eff('マンジュ・ゴッド'),c2=ctxS(0,m2,'onNormalSummon',selfEvt(m2,0));
   if(!e2.condition(c2))return false;e2.operation(c2);answerNamed(RITM);return inHand(0,r);})());
ok('マンジュ・ゴッド ruling: 反転召喚でも誘発する',(()=>{
   reset0();const m3=mk('マンジュ・ゴッド',0);gameState.players[0].mz=[m3];
   gameState.players[0].deck=[mk(RITM,0)];
   return eff('マンジュ・ゴッド').condition(ctxS(0,m3,'onFlip',{player:0,card:m3,flipSummon:true}))===true;})());
ok('マンジュ・ゴッド negative: 反転召喚でないリバースでは誘発しない',(()=>{
   reset0();const m4=mk('マンジュ・ゴッド',0);gameState.players[0].mz=[m4];
   gameState.players[0].deck=[mk(RITM,0)];
   return eff('マンジュ・ゴッド').condition(ctxS(0,m4,'onFlip',{player:0,card:m4}))===false;})());
ok('マンジュ・ゴッド negative: デッキに儀式カードが無ければ発動しない',(()=>{
   reset0();const m5=mk('マンジュ・ゴッド',0);gameState.players[0].mz=[m5];
   gameState.players[0].deck=[mk(LV4,0)];
   return eff('マンジュ・ゴッド').condition(ctxS(0,m5,'onNormalSummon',selfEvt(m5,0)))===false;})());

/* ---- ヴォルカニック・ロケット: デッキ・墓地から「ブレイズ・キャノン」 ---- */
reset0();
let vr=mk('ヴォルカニック・ロケット',0);gameState.players[0].mz=[vr];
let bz1=mk(BLAZE,0),bz2=mk(BLAZE,0);
gameState.players[0].deck=[mk(LV4,0),bz1];gameState.players[0].grave=[bz2];
let ve=eff('ヴォルカニック・ロケット');
let vc=ctxS(0,vr,'onNormalSummon',selfEvt(vr,0));
ok('ヴォルカニック・ロケット positive: 召喚成功で条件を満たす',ve.condition(vc)===true);
ve.operation(vc);
let vpc=pending();
ok('ヴォルカニック・ロケット positive: 候補はデッキと墓地の両方から2枚',
   !!vpc&&vpc.candidates.length===2,vpc?String(vpc.candidates.length):'none');
answerNamed(BLAZE);
ok('ヴォルカニック・ロケット positive: 手札に加えられる',
   (gameState.players[0].hand||[]).some(x=>x&&dbOf(x).n===BLAZE));
ok('ヴォルカニック・ロケット ruling: 墓地だけにあっても手札に加えられる',(()=>{
   reset0();const v2=mk('ヴォルカニック・ロケット',0);gameState.players[0].mz=[v2];
   const g=mk(BLAZE,0);gameState.players[0].grave=[g];
   const e2=eff('ヴォルカニック・ロケット'),c2=ctxS(0,v2,'onSpecialSummon',selfEvt(v2,0));
   if(!e2.condition(c2))return false;e2.operation(c2);answerNamed(BLAZE);return inHand(0,g);})());
ok('ヴォルカニック・ロケット negative: 「ヴォルカニック」は対象外（別群）',(()=>{
   reset0();const v3=mk('ヴォルカニック・ロケット',0);gameState.players[0].mz=[v3];
   gameState.players[0].deck=[mk('ヴォルカニック・バレット',0)];
   return eff('ヴォルカニック・ロケット').condition(ctxS(0,v3,'onNormalSummon',selfEvt(v3,0)))===false;})());

/* ---- リチュア・マーカー: 墓地の「リチュア」儀式カード ---- */
reset0();
let rk=mk('リチュア・マーカー',0);gameState.players[0].mz=[rk];
let gi=mk(GISH,0);gameState.players[0].grave=[mk(RITS,0),gi];
let re2=eff('リチュア・マーカー');
let rc=ctxS(0,rk,'onNormalSummon',selfEvt(rk,0));
ok('リチュア・マーカー positive: 召喚成功で条件を満たす',re2.condition(rc)===true);
re2.operation(rc);
let rpc=pending();
ok('リチュア・マーカー positive: 候補は「リチュア」儀式カードだけ',
   !!rpc&&rpc.candidates.length===1,rpc?String(rpc.candidates.length):'none');
answerNamed(GISH);
ok('リチュア・マーカー positive: 墓地から手札に加えられる',inHand(0,gi));
ok('リチュア・マーカー negative: 「リチュア」でない儀式魔法は対象外',(()=>{
   reset0();const r2=mk('リチュア・マーカー',0);gameState.players[0].mz=[r2];
   gameState.players[0].grave=[mk(RITS,0)];
   return eff('リチュア・マーカー').condition(ctxS(0,r2,'onNormalSummon',selfEvt(r2,0)))===false;})());
ok('リチュア・マーカー negative: デッキにあっても墓地でなければ対象外',(()=>{
   reset0();const r3=mk('リチュア・マーカー',0);gameState.players[0].mz=[r3];
   gameState.players[0].deck=[mk(GISH,0)];gameState.players[0].grave=[];
   return eff('リチュア・マーカー').condition(ctxS(0,r3,'onNormalSummon',selfEvt(r3,0)))===false;})());

/* ================= Replay / SaveLoad / 直列化 ================= */
reset0();
let za=mk('トライデント・ウォリアー',0),zb=mk(LV3,0);
gameState.players[0].mz=[za];gameState.players[0].hand=[zb];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let ze=eff('トライデント・ウォリアー'),zc=ctxS(0,za,'onNormalSummon',selfEvt(za,0));
ze.operation(zc);answerNamed(LV3);
/* 実戦と同じく、溜まった誘発イベントを流し切ってから digest を突き合わせる。 */
if(typeof flushDeferredEventsV2==='function') flushDeferredEventsV2();
ok('ClassA-recruit positive: Replay検証用の特殊召喚が成立',inMz(0,zb));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('ClassA-recruit Replay: 選択つきリクルートが digest 一致で再生される',audit.ok,audit.reason||'');
let snap=JSON.stringify(gameState);
ok('ClassA-recruit SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('ClassA-recruit 直列化: gameState に関数が漏れていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
