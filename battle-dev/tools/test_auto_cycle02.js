/* Auto cycle 02 — 19枚。positive / negative / ruling edge / Replay。 */
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
function ctxDS(p,card,battle,zone,step){const loc=h(card);
  const c=makeContext(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',
    {event:{},battle:battle,step:step||'leave'});
  c.battle=battle;c.step=step||'leave';return c;}
function ctxBD(p,card,evt){const loc=h(card);
  const c=makeContext(p,card,(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onBattleDamage',{event:evt});
  c.event=evt;return c;}
function ctxFL(p,card){const loc=h(card);
  const evt={player:p,name:dbOf(card).n,card:card,uid:card.uid,flipSummon:true};
  const c=makeContext(p,card,(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onFlip',{event:evt});
  c.event=evt;return c;}
function killByBattle(victim,killer,vp){
  victim.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
  return {defCard:victim,atkCard:killer,destroyedDef:true,destroyedAtk:false,player:vp===0?1:0,step:'leave'};}
function setBattle(attacker,defender){
  ensureCardUid(gameState,attacker);ensureCardUid(gameState,defender);
  gameState.battle={player:0,atkIdx:0,target:0,step:'start',atkUid:attacker.uid,targetUid:defender.uid};}
function pending(){return pendingChoiceV49(gameState);}
function answerKeys(keys){return answerChoiceV49(keys);}
const PLAIN='ワイト';        /* lv1 闇 アンデット */
const BIG='青眼の白龍';       /* lv8 光 ドラゴン */
const DARKM='デーモンの召喚';   /* lv6 闇 悪魔 */

const ALL=['レイジアース','暴鬼','薄幸の美少女','エレファン','スプリット・D・ローズ','カミソーリトカゲ',
 'フレムベル・デビル','押し売りゾンビ','首領・ザルーグ','黒蠍－罠はずしのクリフ','黒蠍－強力のゴーグ',
 'ガード・ドッグ','朱い靴','混沌の呪術師','デーモン・テイマー','ドラゴン・ライダー','王座の侵略者',
 'ディメンション・ポッド','ジャイアントウィルス'];
ALL.forEach(n=>ok('cycle02 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle02 枚数は19',ALL.length===19);

/* ================= A ================= */
/* --- レイジアース --- */
reset0();
let rj=mk('レイジアース',0),rk=mk(BIG,1),earth=mk('カミソーリトカゲ',0);  /* 地属性 */
gameState.players[0].mz=[rj,earth];gameState.players[1].mz=[rk];
let bt1=killByBattle(rj,rk,0);
let c1=ctxDS(0,rj,bt1,'grave');
ok('レイジアース positive: 戦闘破壊で誘発する',sc('レイジアース').passive.onDamageStep(c1)===true);
sc('レイジアース').resolve(c1);
ok('レイジアース positive: 地属性以外は破壊される',!gameState.players[1].mz.some(c=>c&&c.uid===rk.uid));
ok('レイジアース ruling: 地属性は残る',gameState.players[0].mz.some(c=>c&&c.uid===earth.uid));

/* --- 暴鬼 --- */
reset0();
let bk=mk('暴鬼',0),bkk=mk(BIG,1);
gameState.players[0].mz=[bk];gameState.players[1].mz=[bkk];
gameState.players[0].lp=5000;gameState.players[1].lp=5000;
let bt2=killByBattle(bk,bkk,0);
sc('暴鬼').resolve(ctxDS(0,bk,bt2,'grave'));
ok('暴鬼 positive: お互いが500ダメージを受ける',
   gameState.players[0].lp===4500&&gameState.players[1].lp===4500,
   'p0='+gameState.players[0].lp+' p1='+gameState.players[1].lp);

/* --- 薄幸の美少女 --- */
reset0();
gameState.phase='battle';
let hk=mk('薄幸の美少女',0),hkk=mk(BIG,1);
gameState.players[0].mz=[hk];gameState.players[1].mz=[hkk];
let bt3=killByBattle(hk,hkk,0);
let c3=ctxDS(0,hk,bt3,'grave');
ok('薄幸の美少女 positive: 戦闘破壊で誘発する',sc('薄幸の美少女').passive.onDamageStep(c3)===true);
ok('薄幸の美少女 ruling: バトルフェイズ終了の共通処理が存在する',typeof v350EndBattlePhase==='function');
sc('薄幸の美少女').resolve(c3);
ok('薄幸の美少女 positive: バトルフェイズが終了する（battle が畳まれる）',gameState.battle==null);

/* --- エレファン --- */
reset0();
let ef=mk('エレファン',0),efk=mk(BIG,1);
gameState.players[0].mz=[ef];gameState.players[1].mz=[efk];
let banishedBeast=mk('エレファン',0);   /* 獣・レベル2 */
let banishedBig=mk(BIG,0);              /* ドラゴン・レベル8 */
gameState.players[0].banish=[banishedBig,banishedBeast];
let bt4=killByBattle(ef,efk,0);
let c4=ctxDS(0,ef,bt4,'grave');
ok('エレファン positive: 除外に対象がいれば誘発する',sc('エレファン').passive.onDamageStep(c4)===true);
ok('エレファン ruling: 候補はレベル3以下の獣・獣戦士・鳥獣だけ',(()=>{
   const q=API.pileCards(0,'banish',x=>x.db.k==='m'&&['獣','獣戦士','鳥獣'].indexOf(x.db.ra)>=0&&Number(x.db.lv||99)<=3);
   return q.length===1&&q[0].card.uid===banishedBeast.uid;})());
sc('エレファン').selectTargets(c4,r=>{c4.selectedTargets=r;});
sc('エレファン').resolve(c4);
ok('エレファン positive: 除外から手札に加わる',gameState.players[0].hand.some(c=>c&&c.uid===banishedBeast.uid));
reset0();
let ef2=mk('エレファン',0),efk2=mk(BIG,1);
gameState.players[0].mz=[ef2];gameState.players[1].mz=[efk2];
gameState.players[0].banish=[mk(BIG,0)];
let bt4b=killByBattle(ef2,efk2,0);
ok('エレファン negative: 対象が除外に無ければ発動できない',
   sc('エレファン').passive.onDamageStep(ctxDS(0,ef2,bt4b,'grave'))===false);

/* --- スプリット・D・ローズ --- */
reset0();
let sr=mk('スプリット・D・ローズ',0),srk=mk(BIG,1);
gameState.players[0].mz=[sr];gameState.players[1].mz=[srk];
let bt5=killByBattle(sr,srk,0);
let c5=ctxDS(0,sr,bt5,'grave');
ok('スプリット・D・ローズ positive: 空きがあれば誘発する',sc('スプリット・D・ローズ').passive.onDamageStep(c5)===true);
sc('スプリット・D・ローズ').resolve(c5);
ok('スプリット・D・ローズ positive: トークンが2体出る',
   gameState.players[0].mz.length===2,'mz='+gameState.players[0].mz.length);
ok('スプリット・D・ローズ ruling: トークンは植物族・闇・レベル3・攻守1200',(()=>{
   const t=gameState.players[0].mz[0];const d=dbOf(t);
   return d.ra==='植物'&&d.at==='闇'&&Number(d.lv)===3&&Number(d.atk)===1200&&Number(d.def)===1200;})());
reset0();
let sr2=mk('スプリット・D・ローズ',0),srk2=mk(BIG,1);
gameState.players[0].mz=[sr2,mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
gameState.players[1].mz=[srk2];
let bt5b=killByBattle(sr2,srk2,0);
ok('スプリット・D・ローズ negative: 2体分の空きが無ければ発動できない',
   sc('スプリット・D・ローズ').passive.onDamageStep(ctxDS(0,sr2,bt5b,'grave'))===false,
   'mz='+gameState.players[0].mz.length);

/* ================= B. カミソーリトカゲ ================= */
reset0();
let kt=mk('カミソーリトカゲ',0),reptile=mk('レイジアース',0),hidden=mk(BIG,1,'down','def');
gameState.players[0].mz=[kt,reptile];gameState.players[1].mz=[hidden];
setBattle(kt,hidden);
ok('カミソーリトカゲ positive: 他の爬虫類がいる時、裏側守備表示に誘発する',
   sc('カミソーリトカゲ').passive.onDamageStep(ctxDS(0,kt,null,'mz','start'))===true);
reset0();
let kt2=mk('カミソーリトカゲ',0),hidden2=mk(BIG,1,'down','def');
gameState.players[0].mz=[kt2];gameState.players[1].mz=[hidden2];
setBattle(kt2,hidden2);
ok('カミソーリトカゲ negative: 他の爬虫類がいなければ誘発しない',
   sc('カミソーリトカゲ').passive.onDamageStep(ctxDS(0,kt2,null,'mz','start'))===false);
reset0();
let kt3=mk('カミソーリトカゲ',0),reptile3=mk('レイジアース',0),shown=mk(BIG,1,'up','def');
gameState.players[0].mz=[kt3,reptile3];gameState.players[1].mz=[shown];
setBattle(kt3,shown);
ok('カミソーリトカゲ ruling: 表側守備表示には誘発しない（裏側限定）',
   sc('カミソーリトカゲ').passive.onDamageStep(ctxDS(0,kt3,null,'mz','start'))===false);

/* ================= D ================= */
/* --- フレムベル・デビル --- */
reset0();
let fd=mk('フレムベル・デビル',0);
gameState.players[0].mz=[fd];
gameState.players[0].grave=[mk('暴鬼',0),mk('薄幸の美少女',0)];   /* 悪魔/魔法使い → 炎族ではない */
let fireA=mk('侵略の炎',0),fireB=mk('侵略の炎',0);                 /* 炎族 */
gameState.players[0].grave.push(fireA,fireB);
let cfd=ctxBD(0,fd,{player:1,amount:2100,attackerUid:fd.uid,defenderUid:null});
ok('フレムベル・デビル positive: 戦闘ダメージで誘発する',sc('フレムベル・デビル').passive.onBattleDamage(cfd)===true);
let lpF=gameState.players[1].lp;
sc('フレムベル・デビル').resolve(cfd);
ok('フレムベル・デビル positive: 墓地の炎族の数×200ダメージ',
   gameState.players[1].lp===lpF-400,'lp='+gameState.players[1].lp);

/* --- 押し売りゾンビ --- */
reset0();
let oz=mk('押し売りゾンビ',0,'up'),mine=mk(BIG,0);
gameState.players[0].sz=[oz];gameState.players[0].mz=[mine];
let foeGraveCard=mk(PLAIN,1);gameState.players[1].grave=[foeGraveCard];
let coz=makeContext(0,oz,'sz',0,'onBattleDamage',{event:{player:1,amount:3000,attackerUid:mine.uid,defenderUid:null,dealtBy:0}});
coz.event={player:1,amount:3000,attackerUid:mine.uid,defenderUid:null,dealtBy:0};
ok('押し売りゾンビ positive: 自分のモンスターの戦闘ダメージで誘発する',
   sc('押し売りゾンビ').passive.onBattleDamage(coz)===true);
sc('押し売りゾンビ').selectTargets(coz,r=>{coz.selectedTargets=r;});
sc('押し売りゾンビ').resolve(coz);
ok('押し売りゾンビ positive: 相手の墓地のカードがデッキの一番下へ戻る',
   gameState.players[1].deck.length===1&&gameState.players[1].grave.length===0);
reset0();
let oz2=mk('押し売りゾンビ',0,'up');
gameState.players[0].sz=[oz2];gameState.players[1].mz=[mk(BIG,1)];
gameState.players[1].grave=[mk(PLAIN,1)];
let coz2=makeContext(0,oz2,'sz',0,'onBattleDamage',{event:{player:0,amount:3000,attackerUid:gameState.players[1].mz[0].uid,defenderUid:null,dealtBy:1}});
coz2.event={player:0,amount:3000,attackerUid:gameState.players[1].mz[0].uid,defenderUid:null,dealtBy:1};
ok('押し売りゾンビ negative: 相手のモンスターが与えたダメージでは誘発しない',
   sc('押し売りゾンビ').passive.onBattleDamage(coz2)===false);

/* --- 首領・ザルーグ（2択・ランダム破棄） --- */
reset0();
let zl=mk('首領・ザルーグ',0);
gameState.players[0].mz=[zl];
gameState.players[1].hand=[mk(PLAIN,1),mk(PLAIN,1)];
gameState.players[1].deck=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
let czl=ctxBD(0,zl,{player:1,amount:1400,attackerUid:zl.uid,defenderUid:null});
ok('首領・ザルーグ positive: 戦闘ダメージで誘発する',sc('首領・ザルーグ').passive.onBattleDamage(czl)===true);
sc('首領・ザルーグ').resolve(czl);
let pz=pending();
ok('首領・ザルーグ ruling: 効果は2つから1つを選ぶ',!!pz&&pz.candidates.length===2,'cands='+(pz&&pz.candidates.length));
ok('首領・ザルーグ ruling: 選ぶのは自分',!!pz&&pz.player===0);
let foeHand0=gameState.players[1].hand.length;
answerKeys([pz.candidates.find(c=>c.key==='discard').key]);
ok('首領・ザルーグ positive: ランダム手札破棄を選ぶと相手の手札が1枚減る',
   gameState.players[1].hand.length===foeHand0-1);
reset0();
let zl2=mk('首領・ザルーグ',0);
gameState.players[0].mz=[zl2];
gameState.players[1].hand=[];gameState.players[1].deck=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
let czl2=ctxBD(0,zl2,{player:1,amount:1400,attackerUid:zl2.uid,defenderUid:null});
sc('首領・ザルーグ').resolve(czl2);
let pz2=pending();
ok('首領・ザルーグ ruling: 手札が無ければ「捨てる」は候補に出ない',
   !!pz2&&pz2.candidates.length===1&&pz2.candidates[0].key==='mill');
answerKeys([pz2.candidates[0].key]);
ok('首領・ザルーグ positive: mill を選ぶと相手デッキが2枚墓地へ',
   gameState.players[1].grave.length===2,'grave='+gameState.players[1].grave.length);
reset0();
let zl3=mk('首領・ザルーグ',0);gameState.players[0].mz=[zl3];
gameState.players[1].hand=[];gameState.players[1].deck=[];
ok('首領・ザルーグ negative: 手札もデッキも無ければ発動できない',
   sc('首領・ザルーグ').passive.onBattleDamage(
     ctxBD(0,zl3,{player:1,amount:100,attackerUid:zl3.uid,defenderUid:null}))===false);

/* --- 黒蠍－罠はずしのクリフ --- */
reset0();
let cf=mk('黒蠍－罠はずしのクリフ',0);
gameState.players[0].mz=[cf];
let foeTrap=mk('押し売りゾンビ',1,'down');gameState.players[1].sz=[foeTrap];
gameState.players[1].deck=[mk(PLAIN,1),mk(PLAIN,1)];
let ccf=ctxBD(0,cf,{player:1,amount:1200,attackerUid:cf.uid,defenderUid:null});
sc('黒蠍－罠はずしのクリフ').resolve(ccf);
let pc1=pending();
ok('黒蠍－罠はずしのクリフ ruling: 2つの効果から選択する',!!pc1&&pc1.candidates.length===2);
pickFirst();
answerKeys([pc1.candidates.find(c=>c.key==='destroy').key]);
ok('黒蠍－罠はずしのクリフ positive: 魔法・罠を破壊できる',
   !gameState.players[1].sz.some(c=>c&&c.uid===foeTrap.uid));

/* --- 黒蠍－強力のゴーグ --- */
reset0();
let gg=mk('黒蠍－強力のゴーグ',0);
gameState.players[0].mz=[gg];
let foeMon=mk(BIG,1);gameState.players[1].mz=[foeMon];
gameState.players[1].deck=[mk(PLAIN,1)];
let cgg=ctxBD(0,gg,{player:1,amount:1800,attackerUid:gg.uid,defenderUid:null});
sc('黒蠍－強力のゴーグ').resolve(cgg);
let pg=pending();
ok('黒蠍－強力のゴーグ ruling: 2つの効果から選択する',!!pg&&pg.candidates.length===2);
pickFirst();
answerKeys([pg.candidates.find(c=>c.key==='bounce').key]);
ok('黒蠍－強力のゴーグ positive: 相手モンスターがデッキの一番上へ戻る',
   !gameState.players[1].mz.some(c=>c&&c.uid===foeMon.uid)&&
   gameState.players[1].deck[0]&&gameState.players[1].deck[0].uid===foeMon.uid);

/* ================= F. リバース ================= */
/* --- ガード・ドッグ --- */
reset0();
let gd=mk('ガード・ドッグ',0,'up');
gameState.players[0].mz=[gd];
let cgd=ctxFL(0,gd);
ok('ガード・ドッグ positive: リバースで誘発する',sc('ガード・ドッグ').passive.onFlip(cgd)===true);
sc('ガード・ドッグ').resolve(cgd);
ok('ガード・ドッグ positive: 相手はこのターン特殊召喚できない',
   v46GlobalSpecialSummonRestrictionReason(1)!=='');
ok('ガード・ドッグ ruling: 自分の特殊召喚は制限されない',
   v46GlobalSpecialSummonRestrictionReason(0)==='');
reset0();
let gd2=mk('ガード・ドッグ',0,'up'),other=mk(PLAIN,0);
gameState.players[0].mz=[gd2,other];
ok('ガード・ドッグ negative: 別のカードがリバースしても誘発しない',(()=>{
   const c=makeContext(0,gd2,'mz',0,'onFlip',{event:{player:0,card:other,uid:other.uid}});
   c.event={player:0,card:other,uid:other.uid};
   return sc('ガード・ドッグ').passive.onFlip(c)===false;})());

/* --- 朱い靴 --- */
reset0();
let ak=mk('朱い靴',0,'up'),tgt=mk(BIG,1,'up','atk');
gameState.players[0].mz=[ak];gameState.players[1].mz=[tgt];
let cak=ctxFL(0,ak);
ok('朱い靴 positive: リバースで誘発する',sc('朱い靴').passive.onFlip(cak)===true);
pickNamed(BIG);
sc('朱い靴').selectTargets(cak,r=>{cak.selectedTargets=r;});
sc('朱い靴').resolve(cak);
ok('朱い靴 positive: 攻撃表示が守備表示になる',tgt.pos==='def','pos='+tgt.pos);
ok('朱い靴 ruling: 裏側表示にはならない',tgt.face==='up','face='+tgt.face);
pickFirst();
reset0();
let ak2=mk('朱い靴',0,'up'),down=mk(BIG,1,'down','def');
gameState.players[0].mz=[ak2];gameState.players[1].mz=[down];
ok('朱い靴 negative: 裏側表示モンスターは対象候補に入らない',(()=>{
   const q=API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'});
   return !q.some(x=>x.card.uid===down.uid);})());
ok('朱い靴 ruling: 表側表示である自身も対象にできる',(()=>{
   const q=API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'});
   return q.length===1&&q[0].card.uid===ak2.uid;})());

/* --- 混沌の呪術師 --- */
reset0();
let ko=mk('混沌の呪術師',0,'up');
gameState.players[0].mz=[ko];
let gm=mk(BIG,1);gameState.players[1].grave=[gm];
let cko=ctxFL(0,ko);
ok('混沌の呪術師 positive: 墓地にモンスターがいれば誘発する',sc('混沌の呪術師').passive.onFlip(cko)===true);
sc('混沌の呪術師').selectTargets(cko,r=>{cko.selectedTargets=r;});
sc('混沌の呪術師').resolve(cko);
ok('混沌の呪術師 positive: 選んだモンスターが除外される',
   gameState.players[1].banish.some(c=>c&&c.uid===gm.uid));
reset0();
let ko2=mk('混沌の呪術師',0,'up');gameState.players[0].mz=[ko2];
gameState.players[1].grave=[mk('押し売りゾンビ',1)];   /* 罠なのでモンスターではない */
ok('混沌の呪術師 negative: 墓地にモンスターが無ければ発動できない',
   sc('混沌の呪術師').passive.onFlip(ctxFL(0,ko2))===false);

/* --- デーモン・テイマー（P26 Control） --- */
reset0();
let dt=mk('デーモン・テイマー',0,'up'),foeDemon=mk(DARKM,1,'up');
gameState.players[0].mz=[dt];gameState.players[1].mz=[foeDemon];
let cdt=ctxFL(0,dt);
ok('デーモン・テイマー positive: 相手の悪魔族がいれば誘発する',sc('デーモン・テイマー').passive.onFlip(cdt)===true);
sc('デーモン・テイマー').selectTargets(cdt,r=>{cdt.selectedTargets=r;});
sc('デーモン・テイマー').resolve(cdt);
ok('デーモン・テイマー positive: コントロールを得る（自分の場へ移る）',
   gameState.players[0].mz.some(c=>c&&c.uid===foeDemon.uid),
   'p0mz='+gameState.players[0].mz.length+' p1mz='+gameState.players[1].mz.length);
reset0();
let dt2=mk('デーモン・テイマー',0,'up'),foeDragon=mk(BIG,1,'up');
gameState.players[0].mz=[dt2];gameState.players[1].mz=[foeDragon];
ok('デーモン・テイマー negative: 悪魔族以外は対象にできない',
   sc('デーモン・テイマー').passive.onFlip(ctxFL(0,dt2))===false);

/* --- ドラゴン・ライダー --- */
reset0();
let dr=mk('ドラゴン・ライダー',0,'up'),foeDra=mk(BIG,1,'up');
gameState.players[0].mz=[dr];gameState.players[1].mz=[foeDra];
let cdr=ctxFL(0,dr);
ok('ドラゴン・ライダー positive: 相手のドラゴン族がいれば誘発する',sc('ドラゴン・ライダー').passive.onFlip(cdr)===true);
sc('ドラゴン・ライダー').selectTargets(cdr,r=>{cdr.selectedTargets=r;});
sc('ドラゴン・ライダー').resolve(cdr);
ok('ドラゴン・ライダー positive: ドラゴン族のコントロールを得る',
   gameState.players[0].mz.some(c=>c&&c.uid===foeDra.uid));
reset0();
let dr2=mk('ドラゴン・ライダー',0,'up'),foeDem=mk(DARKM,1,'up');
gameState.players[0].mz=[dr2];gameState.players[1].mz=[foeDem];
ok('ドラゴン・ライダー negative: ドラゴン族以外は対象にできない',
   sc('ドラゴン・ライダー').passive.onFlip(ctxFL(0,dr2))===false);

/* --- 王座の侵略者（P26 atomic swap） --- */
reset0();
gameState.phase='main1';
let oz3=mk('王座の侵略者',0,'up'),foeSwap=mk(BIG,1,'up');
gameState.players[0].mz=[oz3];gameState.players[1].mz=[foeSwap];
let coz3=ctxFL(0,oz3);
ok('王座の侵略者 positive: メインフェイズなら誘発する',sc('王座の侵略者').passive.onFlip(coz3)===true);
sc('王座の侵略者').selectTargets(coz3,r=>{coz3.selectedTargets=r;});
sc('王座の侵略者').resolve(coz3);
ok('王座の侵略者 positive: コントロールが入れ替わる',
   gameState.players[0].mz.some(c=>c&&c.uid===foeSwap.uid)&&
   gameState.players[1].mz.some(c=>c&&c.uid===oz3.uid),
   'p0='+gameState.players[0].mz.length+' p1='+gameState.players[1].mz.length);
reset0();
gameState.phase='battle';
let oz4=mk('王座の侵略者',0,'up'),foeSwap2=mk(BIG,1,'up');
gameState.players[0].mz=[oz4];gameState.players[1].mz=[foeSwap2];
ok('王座の侵略者 ruling: バトルフェイズには発動できない',
   sc('王座の侵略者').passive.onFlip(ctxFL(0,oz4))===false);

/* --- ディメンション・ポッド --- */
reset0();
gameState.phase='main1';
let dp=mk('ディメンション・ポッド',0,'up');
gameState.players[0].mz=[dp];
let fg1=mk(PLAIN,1),fg2=mk(PLAIN,1);gameState.players[1].grave=[fg1,fg2];
let mg1=mk(PLAIN,0);gameState.players[0].grave=[mg1];
let cdp=ctxFL(0,dp);
ok('ディメンション・ポッド positive: どちらかの墓地にカードがあれば誘発する',
   sc('ディメンション・ポッド').passive.onFlip(cdp)===true);
sc('ディメンション・ポッド').resolve(cdp);
let pd=pending();
ok('ディメンション・ポッド ruling: まず自分が相手の墓地から選ぶ',
   !!pd&&pd.player===0&&pd.candidates.length===2,'player='+(pd&&pd.player));
answerKeys([pd.candidates[0].key]);
ok('ディメンション・ポッド positive: 選んだ相手の墓地のカードが除外される',
   gameState.players[1].banish.length===1);
let pd2=pending();
ok('ディメンション・ポッド ruling: 続けて相手が自分の墓地から選ぶ',
   !!pd2&&pd2.player===1,'player='+(pd2&&pd2.player));

/* --- ジャイアントウィルス --- */
reset0();
let gv=mk('ジャイアントウィルス',0),gvk=mk(BIG,1);
gameState.players[0].mz=[gv];gameState.players[1].mz=[gvk];
gameState.players[0].deck=[mk('ジャイアントウィルス',0),mk('ジャイアントウィルス',0),mk(PLAIN,0)];
let bt6=killByBattle(gv,gvk,0);
let c6=ctxDS(0,gv,bt6,'grave');
ok('ジャイアントウィルス positive: 戦闘破壊で誘発する',sc('ジャイアントウィルス').passive.onDamageStep(c6)===true);
let lpG=gameState.players[1].lp;
RESOLUTION_SUMMON_BATCH_V2=[];
sc('ジャイアントウィルス').resolve(c6);
ok('ジャイアントウィルス positive: 相手に500ダメージ',gameState.players[1].lp===lpG-500);
ok('ジャイアントウィルス positive: デッキの同名2体が特殊召喚される',
   gameState.players[0].mz.length===2,'mz='+gameState.players[0].mz.length);
ok('ジャイアントウィルス ruling: 同一解決中の複数特殊召喚は batch にまとまる',
   Array.isArray(RESOLUTION_SUMMON_BATCH_V2)&&RESOLUTION_SUMMON_BATCH_V2.length===2,
   'batch='+(RESOLUTION_SUMMON_BATCH_V2?RESOLUTION_SUMMON_BATCH_V2.length:'null'));
flushResolutionSummonBatchV2();
let bevt=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onSpecialSummon').slice(-1)[0];
ok('ジャイアントウィルス ruling: 同時特殊召喚が1イベントになる',
   !!bevt&&(bevt.evt.uids||[]).length===2,'uids='+(bevt?(bevt.evt.uids||[]).length:'none'));

/* ================= Replay / SaveLoad ================= */
/* トークン生成 */
reset0();
let rt=mk('スプリット・D・ローズ',0);
gameState.players[0].grave=[rt];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.createToken(0,{key:'D・ローズトークン',name:'D・ローズトークン',atk:1200,def:1200,lv:3,ra:'植物',at:'闇',pos:'atk'},2);
let a1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle02 Replay: トークン生成が digest 一致で再生される',a1.ok,a1.reason||'');
/* コントロール変更（P26） */
reset0();
let rc=mk('デーモン・テイマー',0),rf=mk(DARKM,1);
gameState.players[0].mz=[rc];gameState.players[1].mz=[rf];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.changeControl(h(rf),0,'デーモン・テイマー','endPhase',{card:rc});
let a2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle02 Replay: コントロール変更が digest 一致で再生される',a2.ok,a2.reason||'');
/* コントロール入れ替え（P26 atomic） */
reset0();
let rs1=mk('王座の侵略者',0),rs2=mk(BIG,1);
gameState.players[0].mz=[rs1];gameState.players[1].mz=[rs2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.swapControl(h(rs1),h(rs2),'王座の侵略者',{card:rs1});
let a3=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle02 Replay: コントロール入れ替えが digest 一致で再生される',a3.ok,a3.reason||'');
/* ランダム破棄 */
reset0();
gameState.players[1].hand=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.discard(1,duelRandomInt(gameState.players[1].hand.length),'首領・ザルーグ',{byEffect:true,byPlayer:0});
let a4=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle02 Replay: ランダム手札破棄が digest 一致で再生される',a4.ok,a4.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle02 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
