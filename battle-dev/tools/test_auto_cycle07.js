/* Auto cycle 07 — 28枚。positive / negative / ruling edge / Replay。 */
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
function battleAt(ai,ti,step){
  const a=gameState.players[0].mz[ai],d=(ti==='direct')?null:gameState.players[1].mz[ti];
  if(a)ensureCardUid(gameState,a); if(d)ensureCardUid(gameState,d);
  gameState.battle={player:0,atkIdx:ai,target:(ti==='direct')?'direct':ti,step:step||'calc',
    atkUid:a?a.uid:null,targetUid:d?d.uid:null};}
function battleFoeAt(ai,ti,step){
  const a=gameState.players[1].mz[ai],d=gameState.players[0].mz[ti];
  if(a)ensureCardUid(gameState,a); if(d)ensureCardUid(gameState,d);
  gameState.battle={player:1,atkIdx:ai,target:ti,step:step||'calc',
    atkUid:a?a.uid:null,targetUid:d?d.uid:null};}
function pending(){return pendingChoiceV49(gameState);}
const PLAIN='ワイト';        /* 闇 lv1 通常 ATK300 */
const BIG='青眼の白龍';       /* 光 lv8 通常 ATK3000 DEF2500 */
const DARKM='デーモンの召喚';  /* 闇 lv6 通常 ATK2500 */
const EFFM='氷結界の番人ブリズド'; /* 水 lv1 効果 */

const ALL=['KA－2 デス・シザース','エメス・ザ・インフィニティ','インフェルノ・ハンマー','アマゾネス訓練生',
 'アックス・ドラゴニュート','アマゾネスの賢者','エレキタリス','A・O・J ブラインド・サッカー','エレキツツキ',
 'でんきトカゲ','アスワンの亡霊','クロスカウンター','ダメージ・ゲート','ガード・ブロック','心変わり',
 'ミスフォーチュン','魂の解放','終わりの始まり','次元の歪み','黙する死者','思い出のブランコ','真炎の爆発',
 '生け贄人形','受け継がれる力','死者の生還','催眠術','アースクエイク・ジャイアント','A・ジェネクス・クラッシャー'];
ALL.forEach(n=>ok('cycle07 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle07 枚数は28',ALL.length===28);

/* ================= DA ================= */
/* --- KA－2 デス・シザース --- */
reset0();
let ka=mk('KA－2 デス・シザース',0),v1=mk(BIG,1);   /* lv8 */
gameState.players[0].mz=[ka];gameState.players[1].mz=[v1];
let b1={atkCard:ka,defCard:v1,destroyedDef:true,destroyedAtk:false,step:'after'};
let cka=ctxDS(0,ka,b1,'mz','after');
ok('KA－2 デス・シザース positive: 戦闘破壊で誘発する',sc('KA－2 デス・シザース').passive.onDamageStep(cka)===true);
let lp1=gameState.players[1].lp;
sc('KA－2 デス・シザース').resolve(cka);
ok('KA－2 デス・シザース positive: レベル×500ダメージ（8×500=4000）',
   gameState.players[1].lp===lp1-4000,'lp='+gameState.players[1].lp);
reset0();
let ka2=mk('KA－2 デス・シザース',0),s1=mk(BIG,1);
gameState.players[0].mz=[ka2];gameState.players[1].mz=[s1];
ok('KA－2 デス・シザース negative: 破壊していなければ誘発しない',
   sc('KA－2 デス・シザース').passive.onDamageStep(
     ctxDS(0,ka2,{atkCard:ka2,defCard:s1,destroyedDef:false},'mz','after'))===false);

/* --- エメス・ザ・インフィニティ --- */
reset0();
let em=mk('エメス・ザ・インフィニティ',0),v2=mk(PLAIN,1);
gameState.players[0].mz=[em];gameState.players[1].mz=[v2];
ok('エメス・ザ・インフィニティ negative: 初期値は上がっていない',curATK(em)===dbOf(em).atk);
let b2={atkCard:em,defCard:v2,destroyedDef:true,destroyedAtk:false,step:'after'};
let cem=ctxDS(0,em,b2,'mz','after');
sc('エメス・ザ・インフィニティ').resolve(cem);
ok('エメス・ザ・インフィニティ positive: 攻撃力が700上がる',
   curATK(em)===dbOf(em).atk+700,'atk='+curATK(em));
sc('エメス・ザ・インフィニティ').resolve(cem);
ok('エメス・ザ・インフィニティ ruling: 破壊する度に累積する',curATK(em)===dbOf(em).atk+1400);

/* --- インフェルノ・ハンマー --- */
reset0();
let ih=mk('インフェルノ・ハンマー',0),v3=mk(PLAIN,1),other=mk(BIG,1,'up','atk');
gameState.players[0].mz=[ih];gameState.players[1].mz=[v3,other];
let b3={atkCard:ih,defCard:v3,destroyedDef:true,destroyedAtk:false,step:'after'};
let cih=ctxDS(0,ih,b3,'mz','after');
ok('インフェルノ・ハンマー positive: 戦闘破壊で誘発する',sc('インフェルノ・ハンマー').passive.onDamageStep(cih)===true);
pickNamed(BIG);
sc('インフェルノ・ハンマー').selectTargets(cih,r=>{cih.selectedTargets=r;});
sc('インフェルノ・ハンマー').resolve(cih);
ok('インフェルノ・ハンマー positive: 対象が裏側守備表示になる',
   other.face==='down'&&other.pos==='def','face='+other.face+' pos='+other.pos);
pickFirst();

/* --- アマゾネス訓練生 --- */
reset0();
let at=mk('アマゾネス訓練生',0),v4=mk(PLAIN,1);
gameState.players[0].mz=[at];gameState.players[1].mz=[v4];
v4.battleDestroyed=true;
let b4={atkCard:at,defCard:v4,destroyedDef:true,destroyedAtk:false,step:'after'};
let cat=ctxDS(0,at,b4,'mz','after');
ok('アマゾネス訓練生 positive: 戦闘破壊で誘発する',sc('アマゾネス訓練生').passive.onDamageStep(cat)===true);
sc('アマゾネス訓練生').resolve(cat);
ok('アマゾネス訓練生 positive: 破壊したモンスターがデッキの一番下に戻る',
   gameState.players[1].deck.some(c=>c&&c.uid===v4.uid));
ok('アマゾネス訓練生 ruling: 墓地は経由しない',
   !gameState.players[1].grave.some(c=>c&&c.uid===v4.uid));
ok('アマゾネス訓練生 positive: 攻撃力が200上がる',curATK(at)===dbOf(at).atk+200,'atk='+curATK(at));

/* ================= DB ================= */
/* --- アックス・ドラゴニュート --- */
reset0();
let ad=mk('アックス・ドラゴニュート',0),f1=mk(PLAIN,1);
gameState.players[0].mz=[ad];gameState.players[1].mz=[f1];
let b5={atkCard:ad,defCard:f1,step:'end'};
let cad=ctxDS(0,ad,b5,'mz','end');
ok('アックス・ドラゴニュート positive: 攻撃したら誘発する',sc('アックス・ドラゴニュート').passive.onDamageStep(cad)===true);
sc('アックス・ドラゴニュート').resolve(cad);
ok('アックス・ドラゴニュート positive: 守備表示になる',ad.pos==='def','pos='+ad.pos);
reset0();
let ad2=mk('アックス・ドラゴニュート',0),f2=mk(PLAIN,1);
gameState.players[0].mz=[ad2];gameState.players[1].mz=[f2];
ok('アックス・ドラゴニュート negative: 攻撃されただけでは誘発しない',
   sc('アックス・ドラゴニュート').passive.onDamageStep(
     ctxDS(0,ad2,{atkCard:f2,defCard:ad2},'mz','end'))===false);

/* --- アマゾネスの賢者 --- */
reset0();
let ak2=mk('アマゾネスの賢者',0),f3=mk(PLAIN,1),foeTrap=mk('クロスカウンター',1,'down');
gameState.players[0].mz=[ak2];gameState.players[1].mz=[f3];gameState.players[1].sz=[foeTrap];
let b6={atkCard:ak2,defCard:f3,step:'end'};
let cak2=ctxDS(0,ak2,b6,'mz','end');
ok('アマゾネスの賢者 positive: 攻撃して相手に魔法罠があれば誘発する',
   sc('アマゾネスの賢者').passive.onDamageStep(cak2)===true);
sc('アマゾネスの賢者').selectTargets(cak2,r=>{cak2.selectedTargets=r;});
sc('アマゾネスの賢者').resolve(cak2);
ok('アマゾネスの賢者 positive: 相手の魔法・罠が破壊される',
   !gameState.players[1].sz.some(c=>c&&c.uid===foeTrap.uid));
reset0();
let ak3=mk('アマゾネスの賢者',0),f4=mk(PLAIN,1);
gameState.players[0].mz=[ak3];gameState.players[1].mz=[f4];
ok('アマゾネスの賢者 negative: 相手に魔法罠が無ければ誘発しない',
   sc('アマゾネスの賢者').passive.onDamageStep(ctxDS(0,ak3,{atkCard:ak3,defCard:f4},'mz','end'))===false);

/* --- エレキタリス / ブラインド・サッカー --- */
reset0();
let et=mk('エレキタリス',0),effFoe=mk(EFFM,1);
gameState.players[0].mz=[et];gameState.players[1].mz=[effFoe];
ok('エレキタリス positive: 攻撃可能回数は2回',attackLimitV48(et)===2,'limit='+attackLimitV48(et));
let b7={atkCard:et,defCard:effFoe,step:'after'};
let cet=ctxDS(0,et,b7,'mz','after');
ok('エレキタリス positive: 効果モンスターと戦闘したら誘発する',sc('エレキタリス').passive.onDamageStep(cet)===true);
sc('エレキタリス').resolve(cet);
ok('エレキタリス positive: 戦闘した効果モンスターの効果が無効になる',effectNegated(effFoe)===true);
reset0();
let et2=mk('エレキタリス',0),normalFoe=mk(BIG,1);   /* 通常モンスター */
gameState.players[0].mz=[et2];gameState.players[1].mz=[normalFoe];
ok('エレキタリス negative: 通常モンスターには適用しない',
   sc('エレキタリス').passive.onDamageStep(ctxDS(0,et2,{atkCard:et2,defCard:normalFoe},'mz','after'))===false);
reset0();
let bs=mk('A・O・J ブラインド・サッカー',0),lightFoe=mk(BIG,1);   /* 光属性 */
gameState.players[0].mz=[bs];gameState.players[1].mz=[lightFoe];
let cbs=ctxDS(0,bs,{atkCard:bs,defCard:lightFoe,step:'after'},'mz','after');
ok('A・O・J ブラインド・サッカー positive: 光属性と戦闘したら誘発する',
   sc('A・O・J ブラインド・サッカー').passive.onDamageStep(cbs)===true);
sc('A・O・J ブラインド・サッカー').resolve(cbs);
ok('A・O・J ブラインド・サッカー positive: 光属性の効果が無効になる',effectNegated(lightFoe)===true);
reset0();
let bs2=mk('A・O・J ブラインド・サッカー',0),darkFoe=mk(DARKM,1);
gameState.players[0].mz=[bs2];gameState.players[1].mz=[darkFoe];
ok('A・O・J ブラインド・サッカー negative: 光属性以外では誘発しない',
   sc('A・O・J ブラインド・サッカー').passive.onDamageStep(
     ctxDS(0,bs2,{atkCard:bs2,defCard:darkFoe},'mz','after'))===false);

/* --- エレキツツキ --- */
reset0();
let ez=mk('エレキツツキ',0),f5=mk(PLAIN,1);
gameState.players[0].mz=[ez];gameState.players[1].mz=[f5];
ok('エレキツツキ positive: 攻撃可能回数は2回',attackLimitV48(ez)===2);
let cez=ctxDS(0,ez,{atkCard:ez,defCard:f5,step:'after'},'mz','after');
ok('エレキツツキ positive: 戦闘したら誘発する',sc('エレキツツキ').passive.onDamageStep(cez)===true);
sc('エレキツツキ').resolve(cez);
ok('エレキツツキ positive: 戦闘した相手は表示形式を変更できない',cannotChangePositionV10(f5)===true);
ok('エレキツツキ ruling: 戦闘していないモンスターは変更できる',
   cannotChangePositionV10(ez)===false);

/* --- でんきトカゲ --- */
reset0();
let dt=mk('でんきトカゲ',0),warrior=mk(BIG,1);   /* ドラゴン族 */
gameState.players[0].mz=[dt];gameState.players[1].mz=[warrior];
let cdt=ctxDS(0,dt,{atkCard:warrior,defCard:dt,step:'end'},'mz','end');
ok('でんきトカゲ positive: アンデット族以外に攻撃されたら誘発する',
   sc('でんきトカゲ').passive.onDamageStep(cdt)===true);
sc('でんきトカゲ').resolve(cdt);
ok('でんきトカゲ negative: 攻撃した同じターンには制限がかからない',
   cannotAttackNow(warrior)===false);
gameState.turn+=2;
ok('でんきトカゲ positive: 次の自分のターンに攻撃宣言できない',
   cannotAttackNow(warrior)===true,'turn='+gameState.turn);
gameState.turn+=2;
ok('でんきトカゲ ruling: そのターンを過ぎれば再び攻撃できる',
   cannotAttackNow(warrior)===false);
reset0();
let dt2=mk('でんきトカゲ',0),undead=mk(PLAIN,1);   /* ワイト＝アンデット族 */
gameState.players[0].mz=[dt2];gameState.players[1].mz=[undead];
ok('前提: ワイトはアンデット族',dbOf(undead).ra==='アンデット');
ok('でんきトカゲ negative: アンデット族には適用しない',
   sc('でんきトカゲ').passive.onDamageStep(ctxDS(0,dt2,{atkCard:undead,defCard:dt2},'mz','end'))===false);

/* ================= DC ================= */
/* --- アスワンの亡霊 --- */
reset0();
let aw=mk('アスワンの亡霊',0);
gameState.players[0].mz=[aw];
let trapG=mk('クロスカウンター',0);gameState.players[0].grave=[trapG];
let caw=C(0,aw,'mz',0,'onBattleDamage',{event:{player:1,amount:500,attackerUid:aw.uid,defenderUid:null}});
ok('アスワンの亡霊 positive: 戦闘ダメージで誘発する',sc('アスワンの亡霊').passive.onBattleDamage(caw)===true);
sc('アスワンの亡霊').selectTargets(caw,r=>{caw.selectedTargets=r;});
sc('アスワンの亡霊').resolve(caw);
ok('アスワンの亡霊 positive: 墓地の罠がデッキの一番上に戻る',
   gameState.players[0].deck[0]&&gameState.players[0].deck[0].uid===trapG.uid);
reset0();
let aw2=mk('アスワンの亡霊',0);gameState.players[0].mz=[aw2];
gameState.players[0].grave=[mk(PLAIN,0)];   /* モンスターのみ */
ok('アスワンの亡霊 negative: 墓地に罠が無ければ発動できない',
   sc('アスワンの亡霊').passive.onBattleDamage(
     C(0,aw2,'mz',0,'onBattleDamage',{event:{player:1,amount:500,attackerUid:aw2.uid}}))===false);

/* --- クロスカウンター --- */
reset0();
let cc=mk('クロスカウンター',0,'up'),myDef=mk(BIG,0,'up','def');   /* DEF2500 */
gameState.players[0].sz=[cc];gameState.players[0].mz=[myDef];
let weakAtk=mk(PLAIN,1);gameState.players[1].mz=[weakAtk];   /* ATK300 */
battleFoeAt(0,0,'calc');
ok('クロスカウンター positive: 守備力が攻撃力を越えていれば相手へのダメージが倍',
   applyBattleDamageFilters({amount:1000,to:1})===2000,
   'dmg='+applyBattleDamageFilters({amount:1000,to:1}));
ok('クロスカウンター ruling: 自分が受けるダメージは倍にならない',
   applyBattleDamageFilters({amount:1000,to:0})===1000);
let ccc=ctxDS(0,cc,null,'sz','after');
ok('クロスカウンター positive: ダメージ計算後に誘発する',sc('クロスカウンター').passive.onDamageStep(ccc)===true);
sc('クロスカウンター').resolve(ccc);
ok('クロスカウンター positive: 攻撃モンスターが破壊される',
   !gameState.players[1].mz.some(c=>c&&c.uid===weakAtk.uid));
reset0();
let cc2=mk('クロスカウンター',0,'up'),weakDef=mk(PLAIN,0,'up','def');   /* DEF200 */
gameState.players[0].sz=[cc2];gameState.players[0].mz=[weakDef];
gameState.players[1].mz=[mk(BIG,1)];   /* ATK3000 */
battleFoeAt(0,0,'calc');
ok('クロスカウンター negative: 守備力が下回っていれば発動しない',
   sc('クロスカウンター').passive.onDamageStep(ctxDS(0,cc2,null,'sz','after'))===false);
ok('クロスカウンター negative: ダメージも倍にならない',
   applyBattleDamageFilters({amount:1000,to:1})===1000);

/* --- ダメージ・ゲート --- */
reset0();
let dg=mk('ダメージ・ゲート',0,'down');
gameState.players[0].sz=[dg];
let small=mk(PLAIN,0);gameState.players[0].grave=[small];   /* ATK300 */
let cdg=C(0,dg,'sz',0,'onBattleDamage',{event:{player:0,amount:1000,attackerUid:null,defenderUid:null}});
ok('ダメージ・ゲート positive: 受けたダメージ以下の攻撃力なら誘発する',
   sc('ダメージ・ゲート').passive.onBattleDamage(cdg)===true);
sc('ダメージ・ゲート').selectTargets(cdg,r=>{cdg.selectedTargets=r;});
sc('ダメージ・ゲート').resolve(cdg);
ok('ダメージ・ゲート positive: 墓地のモンスターが特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===small.uid));
reset0();
let dg2=mk('ダメージ・ゲート',0,'down');gameState.players[0].sz=[dg2];
gameState.players[0].grave=[mk(BIG,0)];   /* ATK3000 */
ok('ダメージ・ゲート negative: 受けたダメージより攻撃力が高ければ対象にできない',
   sc('ダメージ・ゲート').passive.onBattleDamage(
     C(0,dg2,'sz',0,'onBattleDamage',{event:{player:0,amount:1000}}))===false);
reset0();
let dg3=mk('ダメージ・ゲート',0,'down');gameState.players[0].sz=[dg3];
gameState.players[0].grave=[mk(PLAIN,0)];
ok('ダメージ・ゲート negative: 相手が受けたダメージでは誘発しない',
   sc('ダメージ・ゲート').passive.onBattleDamage(
     C(0,dg3,'sz',0,'onBattleDamage',{event:{player:1,amount:1000}}))===false);

/* --- ガード・ブロック --- */
reset0();
gameState.activePlayer=1;   /* 相手ターン */
let gb=mk('ガード・ブロック',0,'up');   /* 発動中は表側 */
gameState.players[0].sz=[gb];gameState.players[0].deck=[mk(PLAIN,0)];
gameState.players[0].mz=[mk(BIG,0)];gameState.players[1].mz=[mk(BIG,1)];
battleFoeAt(0,0,'calc');
let cgb=ctxDS(0,gb,null,'sz','calc');
ok('ガード・ブロック positive: 相手ターンのダメージ計算時に発動できる',
   sc('ガード・ブロック').passive.onDamageStep(cgb)===true);
let hd=gameState.players[0].hand.length;
sc('ガード・ブロック').resolve(cgb);
ok('ガード・ブロック positive: 1枚ドローする',gameState.players[0].hand.length===hd+1);
ok('ガード・ブロック positive: 自分への戦闘ダメージが0になる',
   applyBattleDamageFilters({amount:2000,to:0})===0);
ok('ガード・ブロック ruling: 相手へのダメージは0にならない',
   applyBattleDamageFilters({amount:2000,to:1})===2000);
reset0();
let gb2=mk('ガード・ブロック',0,'up');gameState.players[0].sz=[gb2];
gameState.players[0].deck=[mk(PLAIN,0)];
gameState.activePlayer=0;
ok('ガード・ブロック negative: 自分のターンでは発動できない',
   sc('ガード・ブロック').passive.onDamageStep(ctxDS(0,gb2,null,'sz','calc'))===false);

/* ================= DD ================= */
/* --- 心変わり --- */
reset0();
let kg=mk('心変わり',0,'down'),foeM=mk(BIG,1);
gameState.players[0].sz=[kg];gameState.players[1].mz=[foeM];
let ckg=C(0,kg,'sz',0);
ok('心変わり positive: 相手モンスターがいれば発動できる',sc('心変わり').condition(ckg)===true);
sc('心変わり').selectTargets(ckg,r=>{ckg.selectedTargets=r;});
sc('心変わり').resolve(ckg);
ok('心変わり positive: コントロールを得る',gameState.players[0].mz.some(c=>c&&c.uid===foeM.uid));

/* --- ミスフォーチュン --- */
reset0();
let mf=mk('ミスフォーチュン',0,'up'),foeBig=mk(BIG,1);   /* 発動中は表側 */   /* 元々のATK3000 */
gameState.players[0].sz=[mf];gameState.players[1].mz=[foeBig];
let myMon=mk(PLAIN,0);gameState.players[0].mz=[myMon];
let cmf=C(0,mf,'sz',0);
ok('ミスフォーチュン positive: 相手の表側モンスターがいれば発動できる',sc('ミスフォーチュン').condition(cmf)===true);
let lpm=gameState.players[1].lp;
sc('ミスフォーチュン').selectTargets(cmf,r=>{cmf.selectedTargets=r;});
sc('ミスフォーチュン').resolve(cmf);
ok('ミスフォーチュン positive: 元々の攻撃力の半分のダメージ（3000/2）',
   gameState.players[1].lp===lpm-1500,'lp='+gameState.players[1].lp);
ok('ミスフォーチュン ruling: このターン自分のモンスターは攻撃できない',
   cannotAttackNow(myMon)===true);
API.sendToGrave(h(mf),'解決後');
ok('ミスフォーチュン ruling: 解決後に墓地へ行っても効果はこのターン続く（v29 墓地ソース）',
   cannotAttackNow(myMon)===true);

/* --- 魂の解放 --- */
reset0();
let sr=mk('魂の解放',0,'down');
gameState.players[0].sz=[sr];
gameState.players[0].grave=[mk(PLAIN,0),mk(PLAIN,0)];
gameState.players[1].grave=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
let csr=C(0,sr,'sz',0);
ok('魂の解放 positive: 墓地にカードがあれば発動できる',sc('魂の解放').condition(csr)===true);
sc('魂の解放').resolve(csr);
let psr=pending();
ok('魂の解放 ruling: お互いの墓地から合計5枚まで選べる',
   !!psr&&psr.max===5&&psr.candidates.length===5,'max='+(psr&&psr.max));
answerChoiceV49(psr.candidates.map(x=>x.key));
ok('魂の解放 positive: 選んだカードが全て除外される',
   gameState.players[0].banish.length===2&&gameState.players[1].banish.length===3);

/* --- 終わりの始まり --- */
reset0();
let ob=mk('終わりの始まり',0,'down');
gameState.players[0].sz=[ob];
gameState.players[0].grave=[];
for(let i=0;i<7;i++) gameState.players[0].grave.push(mk(DARKM,0));
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
let cob=C(0,ob,'sz',0);
ok('終わりの始まり positive: 闇属性が7体以上なら発動できる',sc('終わりの始まり').condition(cob)===true);
sc('終わりの始まり').cost(cob,()=>{});
ok('終わりの始まり positive: 5体が除外される',gameState.players[0].banish.length===5);
let hb=gameState.players[0].hand.length;
sc('終わりの始まり').resolve(cob);
ok('終わりの始まり positive: 3枚ドローする',gameState.players[0].hand.length===hb+3);
reset0();
let ob2=mk('終わりの始まり',0,'down');gameState.players[0].sz=[ob2];
gameState.players[0].grave=[mk(DARKM,0),mk(DARKM,0)];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
ok('終わりの始まり negative: 6体以下では発動できない',
   sc('終わりの始まり').condition(C(0,ob2,'sz',0))===false);

/* --- 次元の歪み --- */
reset0();
let jg=mk('次元の歪み',0,'down');
gameState.players[0].sz=[jg];gameState.players[0].grave=[];
let banished=mk(BIG,0);gameState.players[0].banish=[banished];
let cjg=C(0,jg,'sz',0);
ok('次元の歪み positive: 墓地が空で除外があれば発動できる',sc('次元の歪み').condition(cjg)===true);
sc('次元の歪み').selectTargets(cjg,r=>{cjg.selectedTargets=r;});
sc('次元の歪み').resolve(cjg);
ok('次元の歪み positive: 除外されたモンスターが特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===banished.uid));
reset0();
let jg2=mk('次元の歪み',0,'down');gameState.players[0].sz=[jg2];
gameState.players[0].grave=[mk(PLAIN,0)];gameState.players[0].banish=[mk(BIG,0)];
ok('次元の歪み negative: 墓地にカードがあれば発動できない',
   sc('次元の歪み').condition(C(0,jg2,'sz',0))===false);

/* --- 黙する死者 --- */
reset0();
let ms=mk('黙する死者',0,'down');
gameState.players[0].sz=[ms];
let normalG=mk(BIG,0);gameState.players[0].grave=[normalG];
ok('前提: 青眼の白龍は通常モンスター',(dbOf(normalG).st||[]).includes('通常'));
let cms=C(0,ms,'sz',0);
ok('黙する死者 positive: 墓地に通常モンスターがいれば発動できる',sc('黙する死者').condition(cms)===true);
sc('黙する死者').selectTargets(cms,r=>{cms.selectedTargets=r;});
sc('黙する死者').resolve(cms);
ok('黙する死者 positive: 守備表示で特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===normalG.uid)&&normalG.pos==='def','pos='+normalG.pos);
ok('黙する死者 ruling: 特殊召喚したモンスターは攻撃できない',cannotAttackNow(normalG)===true);
reset0();
let ms2=mk('黙する死者',0,'down');gameState.players[0].sz=[ms2];
gameState.players[0].grave=[mk(EFFM,0)];   /* 効果モンスター */
ok('黙する死者 negative: 効果モンスターは対象にできない',
   sc('黙する死者').condition(C(0,ms2,'sz',0))===false);

/* --- 思い出のブランコ --- */
reset0();
let ob3=mk('思い出のブランコ',0,'down');
gameState.players[0].sz=[ob3];
let nm=mk(BIG,0);gameState.players[0].grave=[nm];
let cob3=C(0,ob3,'sz',0);
sc('思い出のブランコ').selectTargets(cob3,r=>{cob3.selectedTargets=r;});
sc('思い出のブランコ').resolve(cob3);
ok('思い出のブランコ positive: 通常モンスターが特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===nm.uid));
ok('思い出のブランコ positive: エンドフェイズの破壊が予約される',
   API.schedules('a9.swingDestroy').length===1);

/* --- 真炎の爆発 --- */
reset0();
let sh=mk('真炎の爆発',0,'down');
gameState.players[0].sz=[sh];
let fire1=mk('フレムベル・パウン',0),fire2=mk('フレムベル・パウン',0);   /* 炎属性 DEF200 */
ok('前提: フレムベル・パウンは炎属性・守備力200',
   dbOf(fire1).at==='炎'&&Number(dbOf(fire1).def)===200);
gameState.players[0].grave=[fire1,fire2];
let csh=C(0,sh,'sz',0);
ok('真炎の爆発 positive: 対象がいれば発動できる',sc('真炎の爆発').condition(csh)===true);
sc('真炎の爆発').resolve(csh);
ok('真炎の爆発 positive: 可能な限り特殊召喚する（2体）',
   gameState.players[0].mz.length===2,'mz='+gameState.players[0].mz.length);
ok('真炎の爆発 positive: エンドフェイズの除外が予約される',
   API.schedules('a9.blazeBanish').length===1);

/* --- 生け贄人形 --- */
reset0();
let ik=mk('生け贄人形',0,'down'),tribute=mk(PLAIN,0);
gameState.players[0].sz=[ik];gameState.players[0].mz=[tribute];
let lv7=null;
for(let i=0;i<CARD_DB.length;i++){const d=CARD_DB[i];
  /* 「特殊召喚できるレベル7」を選ぶ。カード側が cannotSpecialSummon を
     宣言していると engine が特殊召喚を弾くので、そこも除外する。 */
  const sc7=d?CARD_SCRIPTS[d.n]:null;
  if(d&&d.k==='m'&&Number(d.lv)===7&&!d.ex&&!(d.st||[]).includes('特殊召喚')
     &&!(sc7&&sc7.cannotSpecialSummon===true)){
    lv7={id:i,owner:0,controller:0,face:'up',pos:'atk'};ensureCardUid(gameState,lv7);break;}}
gameState.players[0].hand=[lv7];
let cik=C(0,ik,'sz',0);
ok('生け贄人形 positive: リリース対象と手札のレベル7があれば発動できる',sc('生け贄人形').condition(cik)===true);
sc('生け贄人形').cost(cik,()=>{});
ok('生け贄人形 positive: コストでモンスターがリリースされる',
   !gameState.players[0].mz.some(c=>c&&c.uid===tribute.uid));
sc('生け贄人形').selectTargets(cik,r=>{cik.selectedTargets=r;});
sc('生け贄人形').resolve(cik);
ok('生け贄人形 positive: 手札のレベル7が特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===lv7.uid));
ok('生け贄人形 ruling: そのモンスターはこのターン攻撃できない',cannotAttackNow(lv7)===true);

/* --- 受け継がれる力 --- */
reset0();
let uk=mk('受け継がれる力',0,'down'),src=mk(BIG,0),dst=mk(PLAIN,0);   /* ATK3000 → ATK300 */
gameState.players[0].sz=[uk];gameState.players[0].mz=[src,dst];
let cuk=C(0,uk,'sz',0);
ok('受け継がれる力 positive: モンスターが2体いれば発動できる',sc('受け継がれる力').condition(cuk)===true);
pickNamed(BIG);
sc('受け継がれる力').cost(cuk,()=>{});
ok('受け継がれる力 positive: コストでモンスターが墓地へ送られる',
   gameState.players[0].grave.some(c=>c&&c.uid===src.uid));
pickNamed(PLAIN);
sc('受け継がれる力').selectTargets(cuk,r=>{cuk.selectedTargets=r;});
sc('受け継がれる力').resolve(cuk);
ok('受け継がれる力 positive: 墓地へ送ったモンスターの攻撃力分アップする',
   curATK(dst)===dbOf(dst).atk+3000,'atk='+curATK(dst));
pickFirst();

/* --- 死者の生還 --- */
reset0();
let sk=mk('死者の生還',0,'down'),dead=mk(BIG,0),killer=mk(BIG,1);
gameState.players[0].sz=[sk];gameState.players[0].mz=[dead];gameState.players[1].mz=[killer];
gameState.players[0].hand=[mk(PLAIN,0)];
dead.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let csk=C(0,sk,'sz',0);
ok('死者の生還 positive: このターン戦闘破壊されたモンスターがいれば発動できる',
   sc('死者の生還').condition(csk)===true);
sc('死者の生還').cost(csk,()=>{});
sc('死者の生還').selectTargets(csk,r=>{csk.selectedTargets=r;});
sc('死者の生還').resolve(csk);
ok('死者の生還 positive: ターン終了時の手札戻しが予約される',
   API.schedules('a9.reviveHand').length===1);
reset0();
let sk2=mk('死者の生還',0,'down');gameState.players[0].sz=[sk2];
gameState.players[0].hand=[mk(PLAIN,0)];
ok('死者の生還 negative: 戦闘破壊されたモンスターがいなければ発動できない',
   sc('死者の生還').condition(C(0,sk2,'sz',0))===false);

/* --- 催眠術 --- */
reset0();
let sj=mk('催眠術',0,'up'),foeM2=mk(BIG,1);   /* 発動中は表側 */
gameState.players[0].sz=[sj];gameState.players[1].mz=[foeM2];
let myM2=mk(PLAIN,0);gameState.players[0].mz=[myM2];
let csj=C(0,sj,'sz',0);
ok('催眠術 negative: 発動前は相手も表示形式を変更できる',cannotChangePositionV10(foeM2)===false);
sc('催眠術').resolve(csj);
ok('催眠術 positive: 相手は表示形式を変更できない',cannotChangePositionV10(foeM2)===true);
ok('催眠術 ruling: 自分のモンスターは変更できる',cannotChangePositionV10(myM2)===false);
API.sendToGrave(h(sj),'解決後');
ok('催眠術 ruling: 解決後に墓地へ行っても効果は続く（v29 墓地ソース）',
   cannotChangePositionV10(foeM2)===true);

/* --- アースクエイク・ジャイアント --- */
reset0();
let eg=mk('アースクエイク・ジャイアント',0),foeM3=mk(BIG,1,'up','atk');
gameState.players[0].mz=[eg];gameState.players[1].mz=[foeM3];
let ceg=ctxEv(0,eg,'onPositionChange',{player:0,card:eg,uid:eg.uid});
ok('アースクエイク・ジャイアント positive: 表示形式が変更されたら誘発する',
   sc('アースクエイク・ジャイアント').passive.onPositionChange(ceg)===true);
sc('アースクエイク・ジャイアント').selectTargets(ceg,r=>{ceg.selectedTargets=r;});
sc('アースクエイク・ジャイアント').resolve(ceg);
ok('アースクエイク・ジャイアント positive: 相手モンスターの表示形式が変わる',
   foeM3.pos==='def','pos='+foeM3.pos);
ok('アースクエイク・ジャイアント ruling: 1ターンに1度',sc('アースクエイク・ジャイアント').countLimit===1);
reset0();
let eg2=mk('アースクエイク・ジャイアント',0),other3=mk(PLAIN,0);
gameState.players[0].mz=[eg2,other3];gameState.players[1].mz=[mk(BIG,1)];
ok('アースクエイク・ジャイアント negative: 他のカードの表示形式変更では誘発しない',
   sc('アースクエイク・ジャイアント').passive.onPositionChange(
     ctxEv(0,eg2,'onPositionChange',{player:0,card:other3,uid:other3.uid}))===false);

/* --- A・ジェネクス・クラッシャー --- */
reset0();
let gc=mk('A・ジェネクス・クラッシャー',0);   /* 闇属性 */
gameState.players[0].mz=[gc];
let sameAttr=mk(DARKM,0);   /* 闇属性 */
gameState.players[0].mz.push(sameAttr);
let foeCard=mk(BIG,1);gameState.players[1].mz=[foeCard];
let cgc=ctxEv(0,gc,'onNormalSummon',{player:0,card:sameAttr,uid:sameAttr.uid});
ok('A・ジェネクス・クラッシャー positive: 同じ属性が召喚されたら誘発する',
   sc('A・ジェネクス・クラッシャー').passive.onNormalSummon(cgc)===true);
sc('A・ジェネクス・クラッシャー').selectTargets(cgc,r=>{cgc.selectedTargets=r;});
sc('A・ジェネクス・クラッシャー').resolve(cgc);
ok('A・ジェネクス・クラッシャー positive: 相手のカードが破壊される',
   !gameState.players[1].mz.some(c=>c&&c.uid===foeCard.uid));
reset0();
let gc2=mk('A・ジェネクス・クラッシャー',0),diffAttr=mk(BIG,0);   /* 光属性 */
gameState.players[0].mz=[gc2,diffAttr];gameState.players[1].mz=[mk(BIG,1)];
ok('A・ジェネクス・クラッシャー negative: 属性が違えば誘発しない',
   sc('A・ジェネクス・クラッシャー').passive.onNormalSummon(
     ctxEv(0,gc2,'onNormalSummon',{player:0,card:diffAttr,uid:diffAttr.uid}))===false);

/* ================= Replay / SaveLoad ================= */
reset0();
let re=mk('エメス・ザ・インフィニティ',0);
gameState.players[0].mz=[re];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(re),'a9EmesN',2,'エメス・ザ・インフィニティ');
let a1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle07 Replay: 累積フラグが digest 一致で再生される',a1.ok,a1.reason||'');
ok('cycle07 Replay: 再生後も攻撃力計算が一致する',curATK(re)===dbOf(re).atk+1400);
reset0();
let rb=mk('思い出のブランコ',0,'down'),rn=mk(BIG,0);
gameState.players[0].sz=[rb];gameState.players[0].grave=[rn];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.specialSummon(0,'grave',0,'atk','思い出のブランコ',0);
API.schedule({at:'endPhase',turns:0,player:0,handler:'a9.swingDestroy',
  args:{uid:rn.uid},source:{card:rb},note:'思い出のブランコ'});
let pkg=v41ReplayPackage(gameState);
let replayed=JSON.parse(JSON.stringify(pkg.initialState));
pkg.actions.forEach(j=>applyAction(replayed,JSON.parse(JSON.stringify(j.action||j))));
ok('cycle07 Replay: 特殊召喚＋スケジュール予約が Journal 再適用で再現される',
   replayed.players[0].mz.length===1&&replayed.players[0].mz[0].uid===rn.uid);
let snap=JSON.stringify(gameState);
ok('cycle07 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle07 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
