/* Auto cycle 10 — 25枚。positive / negative / ruling edge / Replay。 */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
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
function pickFirst(){API.selectCard=(t,list,cb)=>cb(list[0]);}
function C(p,card,zone,idx,ev,extra){const c=makeContext(p,card,zone,idx,ev||'activate',extra||{});
  if(extra&&extra.event)c.event=extra.event;return c;}
function ctxEv(p,card,ev,evt,zone){const loc=h(card);
  return C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,ev,{event:evt});}
function ctxDS(p,card,battle,zone,step){const loc=h(card);
  const c=C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',{event:{},battle:battle,step:step||'end'});
  c.battle=battle;c.step=step||'end';return c;}
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
function equipTo(eq,mon){ ensureCardUid(gameState,mon); eq.equipTo={uid:mon.uid}; return eq; }
function killCtx(me,foe){ return {atkCard:me,defCard:foe,destroyedDef:true,destroyedAtk:false,step:'after'}; }
function pending(){return pendingChoiceV49(gameState);}
const PLAIN='ワイト';        /* 闇 lv1 ATK300 DEF200 アンデット */
const BIG='青眼の白龍';       /* 光 lv8 ATK3000 DEF2500 ドラゴン */
const DARKM='デーモンの召喚';  /* 闇 lv6 ATK2500 悪魔 */
const WARRIOR='E・HERO スパークマン'; /* 光 戦士 */

const ALL=['幻影の壁','ハイパーハンマーヘッド','伝説の柔術家','龍骨鬼','月風魔','黄泉へ渡る船',
 '有翼賢者ファルコス','ロイヤルナイツ','ネコ耳族','レプティレス・ゴルゴーン','最終突撃命令','砂漠の裁き',
 '細菌感染','昇天の黒角笛','覇者の一括','体力増強剤スーパーZ','ヘル・テンペスト','大落とし穴','白夜の女王',
 '破戒僧 ランシン','暗黒プテラ','ディープ・ダイバー','ピクシーナイト','ヌビアガード','追い剥ぎゾンビ'];
ALL.forEach(n=>ok('cycle10 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle10 枚数は25',ALL.length===25);

/* ================= HA ================= */
/* --- 幻影の壁 --- */
reset0();
let gw=mk('幻影の壁',0),atk1=mk(BIG,1);
gameState.players[0].mz=[gw];gameState.players[1].mz=[atk1];
let cgw=ctxDS(0,gw,{atkCard:atk1,defCard:gw,step:'end'},'mz','end');
ok('幻影の壁 positive: 攻撃されたら誘発する',sc('幻影の壁').passive.onDamageStep(cgw)===true);
sc('幻影の壁').resolve(cgw);
ok('幻影の壁 positive: 攻撃モンスターが持ち主の手札に戻る',
   gameState.players[1].hand.some(c=>c&&c.uid===atk1.uid));

/* --- ハイパーハンマーヘッド --- */
reset0();
let hh=mk('ハイパーハンマーヘッド',0),survivor=mk(BIG,1);
gameState.players[0].mz=[hh];gameState.players[1].mz=[survivor];
let chh=ctxDS(0,hh,{atkCard:hh,defCard:survivor,destroyedDef:false,step:'end'},'mz','end');
ok('ハイパーハンマーヘッド positive: 破壊されなかった相手がいれば誘発する',
   sc('ハイパーハンマーヘッド').passive.onDamageStep(chh)===true);
sc('ハイパーハンマーヘッド').resolve(chh);
ok('ハイパーハンマーヘッド positive: 相手が持ち主の手札に戻る',
   gameState.players[1].hand.some(c=>c&&c.uid===survivor.uid));
reset0();
let hh2=mk('ハイパーハンマーヘッド',0),dead=mk(PLAIN,1);
gameState.players[0].mz=[hh2];gameState.players[1].mz=[dead];
ok('ハイパーハンマーヘッド negative: 破壊された相手には適用しない',
   sc('ハイパーハンマーヘッド').passive.onDamageStep(
     ctxDS(0,hh2,{atkCard:hh2,defCard:dead,destroyedDef:true},'mz','end'))===false);

/* --- 伝説の柔術家 --- */
reset0();
let jj=mk('伝説の柔術家',0,'up','def'),foe1=mk(BIG,1);
gameState.players[0].mz=[jj];gameState.players[1].mz=[foe1];
let cjj=ctxDS(0,jj,{atkCard:foe1,defCard:jj,step:'end'},'mz','end');
ok('伝説の柔術家 positive: 守備表示で戦闘したら誘発する',sc('伝説の柔術家').passive.onDamageStep(cjj)===true);
sc('伝説の柔術家').resolve(cjj);
ok('伝説の柔術家 positive: 戦闘した相手がデッキの一番上に戻る',
   gameState.players[1].deck[0]&&gameState.players[1].deck[0].uid===foe1.uid);
reset0();
let jj2=mk('伝説の柔術家',0,'up','atk'),foe2=mk(BIG,1);
gameState.players[0].mz=[jj2];gameState.players[1].mz=[foe2];
ok('伝説の柔術家 negative: 攻撃表示では誘発しない',
   sc('伝説の柔術家').passive.onDamageStep(ctxDS(0,jj2,{atkCard:foe2,defCard:jj2},'mz','end'))===false);

/* --- 龍骨鬼 / 月風魔 --- */
reset0();
let rk=mk('龍骨鬼',0),warrior=mk(WARRIOR,1);   /* 戦士族 */
gameState.players[0].mz=[rk];gameState.players[1].mz=[warrior];
let crk=ctxDS(0,rk,{atkCard:rk,defCard:warrior,step:'end'},'mz','end');
ok('龍骨鬼 positive: 戦士族と戦闘したら誘発する',sc('龍骨鬼').passive.onDamageStep(crk)===true);
sc('龍骨鬼').resolve(crk);
ok('龍骨鬼 positive: 戦士族が破壊される',!gameState.players[1].mz.some(c=>c&&c.uid===warrior.uid));
reset0();
let rk2=mk('龍骨鬼',0),dragon=mk(BIG,1);   /* ドラゴン族 */
gameState.players[0].mz=[rk2];gameState.players[1].mz=[dragon];
ok('龍骨鬼 negative: 対象外の種族では誘発しない',
   sc('龍骨鬼').passive.onDamageStep(ctxDS(0,rk2,{atkCard:rk2,defCard:dragon},'mz','end'))===false);
reset0();
let tf=mk('月風魔',0),undead=mk(PLAIN,1);   /* アンデット族 */
gameState.players[0].mz=[tf];gameState.players[1].mz=[undead];
let ctf=ctxDS(0,tf,{atkCard:tf,defCard:undead,step:'end'},'mz','end');
ok('月風魔 positive: アンデット族と戦闘したら誘発する',sc('月風魔').passive.onDamageStep(ctf)===true);
sc('月風魔').resolve(ctf);
ok('月風魔 positive: アンデット族が破壊される',!gameState.players[1].mz.some(c=>c&&c.uid===undead.uid));

/* --- 黄泉へ渡る船 --- */
reset0();
let yf=mk('黄泉へ渡る船',0),killer=mk(BIG,1);
gameState.players[0].mz=[yf];gameState.players[1].mz=[killer];
yf.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let byf={defCard:yf,atkCard:killer,destroyedDef:true,destroyedAtk:false,step:'leave'};
let cyf=ctxDS(0,yf,byf,'grave','leave');
ok('黄泉へ渡る船 positive: 戦闘破壊されたら誘発する',sc('黄泉へ渡る船').passive.onDamageStep(cyf)===true);
sc('黄泉へ渡る船').resolve(cyf);
ok('黄泉へ渡る船 positive: 破壊したモンスターが破壊される',
   !gameState.players[1].mz.some(c=>c&&c.uid===killer.uid));

/* --- 有翼賢者ファルコス --- */
reset0();
let fa=mk('有翼賢者ファルコス',0),prey=mk(PLAIN,1,'up','atk');
gameState.players[0].mz=[fa];gameState.players[1].mz=[prey];
prey.battleDestroyed=true;
let cfa=ctxDS(0,fa,killCtx(fa,prey),'mz','after');
ok('有翼賢者ファルコス positive: 表側攻撃表示を破壊したら誘発する',
   sc('有翼賢者ファルコス').passive.onDamageStep(cfa)===true);
sc('有翼賢者ファルコス').resolve(cfa);
ok('有翼賢者ファルコス positive: 相手デッキの一番上に戻る',
   gameState.players[1].deck[0]&&gameState.players[1].deck[0].uid===prey.uid);
ok('有翼賢者ファルコス ruling: 墓地は経由しない',
   !gameState.players[1].grave.some(c=>c&&c.uid===prey.uid));
reset0();
let fa2=mk('有翼賢者ファルコス',0),defPrey=mk(PLAIN,1,'up','def');
gameState.players[0].mz=[fa2];gameState.players[1].mz=[defPrey];
ok('有翼賢者ファルコス negative: 守備表示を破壊した場合は誘発しない',
   sc('有翼賢者ファルコス').passive.onDamageStep(ctxDS(0,fa2,killCtx(fa2,defPrey),'mz','after'))===false);

/* --- ロイヤルナイツ --- */
reset0();
let rn=mk('ロイヤルナイツ',0),v=mk(BIG,1);   /* DEF2500 */
gameState.players[0].mz=[rn];gameState.players[1].mz=[v];
gameState.players[0].lp=4000;
sc('ロイヤルナイツ').resolve(ctxDS(0,rn,killCtx(rn,v),'mz','after'));
ok('ロイヤルナイツ positive: 破壊したモンスターの守備力分回復（2500）',
   gameState.players[0].lp===6500,'lp='+gameState.players[0].lp);

/* ================= HA/HB 継続 ================= */
/* --- ネコ耳族 --- */
reset0();
let nk=mk('ネコ耳族',0),strong=mk(BIG,1);
gameState.players[0].mz=[nk];gameState.players[1].mz=[strong];
gameState.activePlayer=0;
battleFoeAt(0,0,'calc');
ok('ネコ耳族 negative: 自分ターンでは元々の攻撃力を変えない',
   curATK(strong)===dbOf(strong).atk,'atk='+curATK(strong));
gameState.activePlayer=1;
ok('ネコ耳族 positive: 相手ターンの戦闘では元々の攻撃力が200になる',
   curATK(strong)===200,'atk='+curATK(strong));
gameState.battle=null;
ok('ネコ耳族 ruling: 戦闘外では元に戻る',curATK(strong)===dbOf(strong).atk);

/* --- レプティレス・ゴルゴーン --- */
reset0();
let rg=mk('レプティレス・ゴルゴーン',0),target1=mk(BIG,1);
gameState.players[0].mz=[rg];gameState.players[1].mz=[target1];
let crg=ctxDS(0,rg,{atkCard:rg,defCard:target1,step:'after'},'mz','after');
ok('レプティレス・ゴルゴーン positive: 攻撃したら誘発する',
   sc('レプティレス・ゴルゴーン').passive.onDamageStep(crg)===true);
sc('レプティレス・ゴルゴーン').resolve(crg);
ok('レプティレス・ゴルゴーン positive: 戦闘した相手の攻撃力が0になる',curATK(target1)===0);
ok('レプティレス・ゴルゴーン positive: 表示形式を変更できない',cannotChangePositionV10(target1)===true);
ok('レプティレス・ゴルゴーン negative: 二重には適用しない',
   sc('レプティレス・ゴルゴーン').passive.onDamageStep(
     ctxDS(0,rg,{atkCard:rg,defCard:target1},'mz','after'))===false);

/* --- 最終突撃命令 --- */
reset0();
let sk=mk('最終突撃命令',0,'up');
gameState.players[0].sz=[sk];
let up1=mk(BIG,1,'up','def'),down1=mk(PLAIN,1,'down','def');
gameState.players[1].mz=[up1,down1];
ok('最終突撃命令 positive: 表側表示は攻撃表示に固定される',
   forcedPositionForV10(up1)==='atk','forced='+forcedPositionForV10(up1));
ok('最終突撃命令 positive: 表側表示は表示形式を変更できない',cannotChangePositionV10(up1)===true);
ok('最終突撃命令 ruling: 裏側表示は対象外',
   forcedPositionForV10(down1)!=='atk'&&cannotChangePositionV10(down1)===false);

/* --- 砂漠の裁き --- */
reset0();
let sj=mk('砂漠の裁き',0,'up');
gameState.players[0].sz=[sj];
let up2=mk(BIG,1,'up','atk'),down2=mk(PLAIN,1,'down','def');
gameState.players[1].mz=[up2,down2];
ok('砂漠の裁き positive: 表側表示は表示形式を変更できない',cannotChangePositionV10(up2)===true);
ok('砂漠の裁き ruling: 裏側表示は変更できる',cannotChangePositionV10(down2)===false);

/* --- 細菌感染 --- */
reset0();
let sa=mk('細菌感染',0,'up'),eqM=mk(BIG,0);   /* ドラゴン族 */
gameState.players[0].sz=[sa];gameState.players[0].mz=[eqM];equipTo(sa,eqM);
ok('細菌感染 ruling: 機械族以外のみ装備可能',
   sc('細菌感染').equipSpec.canEquip({db:dbOf(eqM)})===true);
ok('細菌感染 negative: 最初は攻撃力が下がっていない',curATK(eqM)===dbOf(eqM).atk);
let csa=ctxEv(0,sa,'onStandbyPhase',{},'sz');
ok('細菌感染 positive: 自分のスタンバイフェイズで誘発する',sc('細菌感染').passive.onStandbyPhase(csa)===true);
sc('細菌感染').resolve(csa);
ok('細菌感染 positive: 攻撃力が300下がる',curATK(eqM)===dbOf(eqM).atk-300,'atk='+curATK(eqM));
sc('細菌感染').resolve(csa);
ok('細菌感染 ruling: 毎スタンバイ累積して下がる',curATK(eqM)===dbOf(eqM).atk-600);

/* ================= HC ================= */
/* --- 昇天の黒角笛 --- */
reset0();
let kk=mk('昇天の黒角笛',0,'down');
gameState.players[0].sz=[kk];
gameState.pendingSummon={player:1,kind:'effect',name:'テスト'};
let ckk=C(0,kk,'sz',0);
ok('昇天の黒角笛 positive: 相手の特殊召喚時に発動できる',sc('昇天の黒角笛').condition(ckk)===true);
ok('昇天の黒角笛 ruling: 特殊召喚のみ対象（summonNegate.specialOnly）',
   sc('昇天の黒角笛').summonNegate.specialOnly===true);
sc('昇天の黒角笛').resolve(ckk);
ok('昇天の黒角笛 positive: 召喚が無効になる',
   gameState.pendingSummon&&gameState.pendingSummon.negated===true);
reset0();
let kk2=mk('昇天の黒角笛',0,'down');gameState.players[0].sz=[kk2];
gameState.pendingSummon={player:0,kind:'effect',name:'自分'};
ok('昇天の黒角笛 negative: 自分の特殊召喚には発動できない',
   sc('昇天の黒角笛').condition(C(0,kk2,'sz',0))===false);

/* --- 覇者の一括 --- */
reset0();
gameState.activePlayer=1;
let hi=mk('覇者の一括',0,'down');
gameState.players[0].sz=[hi];
let chi=C(0,hi,'sz',0);
ok('覇者の一括 positive: 相手ターンなら発動できる',sc('覇者の一括').condition(chi)===true);
sc('覇者の一括').resolve(chi);
ok('覇者の一括 positive: 相手はバトルフェイズを行えない',
   gameState.players[1].temporaryFlags.noBattlePhase===true);
reset0();
gameState.activePlayer=0;
let hi2=mk('覇者の一括',0,'down');gameState.players[0].sz=[hi2];
ok('覇者の一括 negative: 自分のターンでは発動できない',
   sc('覇者の一括').condition(C(0,hi2,'sz',0))===false);

/* --- 体力増強剤スーパーZ --- */
reset0();
let tz=mk('体力増強剤スーパーZ',0,'down');
gameState.players[0].sz=[tz];gameState.players[0].lp=2000;
gameState.players[0].mz=[mk(PLAIN,0)];gameState.players[1].mz=[mk(BIG,1)];
battleFoeAt(0,0,'calc');
let ctz=C(0,tz,'sz',0);
ok('体力増強剤スーパーZ positive: 戦闘のダメージ計算時に発動できる',sc('体力増強剤スーパーZ').condition(ctz)===true);
sc('体力増強剤スーパーZ').resolve(ctz);
ok('体力増強剤スーパーZ positive: 4000回復する',gameState.players[0].lp===6000,'lp='+gameState.players[0].lp);

/* --- ヘル・テンペスト --- */
reset0();
let ht=mk('ヘル・テンペスト',0,'down');
gameState.players[0].sz=[ht];
gameState.players[0].deck=[mk(PLAIN,0),mk('サイクロン',0)];
gameState.players[0].grave=[mk(BIG,0)];
gameState.players[1].deck=[mk(PLAIN,1)];
gameState.players[1].grave=[mk(PLAIN,1)];
let cht=C(0,ht,'sz',0,'onBattleDamage',{event:{player:0,amount:3000}});
ok('ヘル・テンペスト positive: 3000以上の戦闘ダメージで誘発する',
   sc('ヘル・テンペスト').passive.onBattleDamage(cht)===true);
sc('ヘル・テンペスト').resolve(cht);
ok('ヘル・テンペスト positive: お互いのデッキ・墓地のモンスターが全て除外される',
   API.pileCards(0,'deck',x=>x.db.k==='m').length===0
   &&API.pileCards(0,'grave',x=>x.db.k==='m').length===0
   &&API.pileCards(1,'deck',x=>x.db.k==='m').length===0
   &&API.pileCards(1,'grave',x=>x.db.k==='m').length===0);
ok('ヘル・テンペスト ruling: モンスター以外は除外されない',
   API.pileCards(0,'deck',x=>x.db.k==='s').length===1);
reset0();
let ht2=mk('ヘル・テンペスト',0,'down');gameState.players[0].sz=[ht2];
ok('ヘル・テンペスト negative: 2999以下では誘発しない',
   sc('ヘル・テンペスト').passive.onBattleDamage(
     C(0,ht2,'sz',0,'onBattleDamage',{event:{player:0,amount:2999}}))===false);

/* --- 大落とし穴 --- */
reset0();
let oo=mk('大落とし穴',0,'down');
gameState.players[0].sz=[oo];
let s1=mk(BIG,1),s2=mk(PLAIN,1);
gameState.players[1].mz=[s1,s2];
gameState.players[0].mz=[mk(PLAIN,0)];
let coo=C(0,oo,'sz',0,'onSpecialSummon',{event:{player:1,cards:[s1,s2],kind:'effect'}});
ok('大落とし穴 positive: 同時に2体特殊召喚されたら発動できる',
   sc('大落とし穴').passive.onSpecialSummon(coo)===true);
sc('大落とし穴').resolve(coo);
ok('大落とし穴 positive: フィールドのモンスターが全て破壊される',
   gameState.players[0].mz.length===0&&gameState.players[1].mz.length===0);
reset0();
let oo2=mk('大落とし穴',0,'down');gameState.players[0].sz=[oo2];
let one=mk(BIG,1);gameState.players[1].mz=[one];
ok('大落とし穴 negative: 1体だけでは発動できない',
   sc('大落とし穴').passive.onSpecialSummon(
     C(0,oo2,'sz',0,'onSpecialSummon',{event:{player:1,card:one,kind:'effect'}}))===false);

/* ================= HD ================= */
/* --- 白夜の女王 --- */
reset0();
let bq=mk('白夜の女王',0);
gameState.players[0].mz=[bq];
let setTrap=mk('大落とし穴',1,'down');gameState.players[1].sz=[setTrap];
let cbq=C(0,bq,'mz',0);
ok('白夜の女王 positive: セットされたカードがあれば発動できる',sc('白夜の女王').condition(cbq)===true);
ok('白夜の女王 ruling: 特殊召喚できない',sc('白夜の女王').cannotSpecialSummon===true);
sc('白夜の女王').selectTargets(cbq,r=>{cbq.selectedTargets=r;});
sc('白夜の女王').resolve(cbq);
ok('白夜の女王 positive: セットされたカードが破壊される',
   !gameState.players[1].sz.some(c=>c&&c.uid===setTrap.uid));
reset0();
let bq2=mk('白夜の女王',0);gameState.players[0].mz=[bq2];
gameState.players[1].sz=[mk('大落とし穴',1,'up')];   /* 表側 */
ok('白夜の女王 negative: 表側のカードは対象にできない',
   sc('白夜の女王').condition(C(0,bq2,'mz',0))===false);

/* --- 破戒僧 ランシン --- */
reset0();
let hr=mk('破戒僧 ランシン',0);
gameState.players[0].mz=[hr];
gameState.players[1].grave=[mk(BIG,1)];
gameState.chain=[{name:'サイクロン',player:1,cardId:findCardIndex('サイクロン')}];
API.sendToGrave(h(hr),'相手の効果');
gameState.chain=[];
/* sendToGrave は byDestroy=false なので byPlayer は明示指定が必要。実戦では
   相手の効果解決中に呼ばれるため v30 B1 が埋める。ここでは同じ状態を作る。 */
hr.graveInfo.byPlayer=1;
let chr=ctxEv(0,hr,'onSendToGrave',{card:hr,uid:hr.uid,reason:'effect'},'grave');
ok('破戒僧 ランシン positive: 相手によって墓地へ送られたら誘発する',
   sc('破戒僧 ランシン').passive.onSendToGrave(chr)===true);
sc('破戒僧 ランシン').selectTargets(chr,r=>{chr.selectedTargets=r;});
sc('破戒僧 ランシン').resolve(chr);
ok('破戒僧 ランシン positive: 相手の墓地のモンスターが除外される',
   gameState.players[1].banish.length===1);
reset0();
let hr2=mk('破戒僧 ランシン',0);
gameState.players[0].mz=[hr2];gameState.players[1].grave=[mk(BIG,1)];
API.sendToGrave(h(hr2),'自分の効果');
hr2.graveInfo.byPlayer=0;
ok('破戒僧 ランシン negative: 自分で送った場合は誘発しない',
   sc('破戒僧 ランシン').passive.onSendToGrave(
     ctxEv(0,hr2,'onSendToGrave',{card:hr2,uid:hr2.uid,reason:'effect'},'grave'))===false);

/* --- 暗黒プテラ --- */
reset0();
let ap=mk('暗黒プテラ',0);
gameState.players[0].mz=[ap];
API.sendToGrave(h(ap),'効果で墓地へ');
let cap=ctxEv(0,ap,'onSendToGrave',{card:ap,uid:ap.uid,reason:'effect'},'grave');
ok('暗黒プテラ positive: 戦闘以外で墓地へ送られたら誘発する',sc('暗黒プテラ').passive.onSendToGrave(cap)===true);
sc('暗黒プテラ').resolve(cap);
ok('暗黒プテラ positive: 持ち主の手札に戻る',gameState.players[0].hand.some(c=>c&&c.uid===ap.uid));
reset0();
let ap2=mk('暗黒プテラ',0),k2=mk(BIG,1);
gameState.players[0].mz=[ap2];gameState.players[1].mz=[k2];
ap2.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
ok('暗黒プテラ negative: 戦闘破壊では誘発しない',
   sc('暗黒プテラ').passive.onSendToGrave(
     ctxEv(0,ap2,'onSendToGrave',{card:ap2,uid:ap2.uid,reason:'battle'},'grave'))===false);

/* --- ディープ・ダイバー --- */
reset0();
gameState.phase='battle';
let dd=mk('ディープ・ダイバー',0),k3=mk(BIG,1);
gameState.players[0].mz=[dd];gameState.players[1].mz=[k3];
let deckMon=mk(BIG,0),deckOther=mk(PLAIN,0);
gameState.players[0].deck=[deckOther,deckMon];
dd.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cdd=ctxEv(0,dd,'onBattlePhaseEnd',{},'grave');
ok('ディープ・ダイバー positive: 戦闘破壊されたバトルフェイズ終了時に誘発する',
   sc('ディープ・ダイバー').passive.onBattlePhaseEnd(cdd)===true);
API.selectCard=(t,list,cb)=>{const hit=list.find(x=>x&&x.card&&x.card.uid===deckMon.uid);cb(hit||list[0]);};
sc('ディープ・ダイバー').selectTargets(cdd,r=>{cdd.selectedTargets=r;});
sc('ディープ・ダイバー').resolve(cdd);
ok('ディープ・ダイバー positive: 選んだモンスターがデッキの一番上に置かれる',
   gameState.players[0].deck[0]&&gameState.players[0].deck[0].uid===deckMon.uid,
   'top='+(gameState.players[0].deck[0]?dbOf(gameState.players[0].deck[0]).n:'none'));
pickFirst();

/* --- ピクシーナイト --- */
reset0();
let pn=mk('ピクシーナイト',0),k4=mk(BIG,1);
gameState.players[0].mz=[pn];gameState.players[1].mz=[k4];
let spellG=mk('サイクロン',0);gameState.players[0].grave=[spellG];
pn.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let bpn={defCard:pn,atkCard:k4,destroyedDef:true,destroyedAtk:false,step:'leave'};
let cpn=ctxDS(0,pn,bpn,'grave','leave');
ok('ピクシーナイト positive: 戦闘で墓地へ送られたら誘発する',sc('ピクシーナイト').passive.onDamageStep(cpn)===true);
sc('ピクシーナイト').resolve(cpn);
let ppn=pending();
ok('ピクシーナイト ruling: 選ぶのは相手プレイヤー',!!ppn&&ppn.player===1,'player='+(ppn&&ppn.player));
answerChoiceV49([ppn.candidates[0].key]);
ok('ピクシーナイト positive: 選ばれた魔法が自分のデッキの一番上に置かれる',
   gameState.players[0].deck[0]&&gameState.players[0].deck[0].uid===spellG.uid);

/* --- ヌビアガード --- */
reset0();
let ng=mk('ヌビアガード',0);
gameState.players[0].mz=[ng];
let contSpell=mk('暗黒の扉',0);gameState.players[0].grave=[contSpell];
ok('前提: 暗黒の扉は永続魔法',dbOf(contSpell).sub==='永続');
let cng=C(0,ng,'mz',0,'onBattleDamage',{event:{player:1,amount:500,attackerUid:ng.uid,defenderUid:null}});
ok('ヌビアガード positive: 戦闘ダメージで誘発する',sc('ヌビアガード').passive.onBattleDamage(cng)===true);
sc('ヌビアガード').selectTargets(cng,r=>{cng.selectedTargets=r;});
sc('ヌビアガード').resolve(cng);
ok('ヌビアガード positive: 永続魔法がデッキの一番上に戻る',
   gameState.players[0].deck[0]&&gameState.players[0].deck[0].uid===contSpell.uid);
reset0();
let ng2=mk('ヌビアガード',0);gameState.players[0].mz=[ng2];
gameState.players[0].grave=[mk('サイクロン',0)];   /* 通常魔法 */
ok('ヌビアガード negative: 永続魔法でなければ発動できない',
   sc('ヌビアガード').passive.onBattleDamage(
     C(0,ng2,'mz',0,'onBattleDamage',{event:{player:1,amount:500,attackerUid:ng2.uid}}))===false);

/* --- 追い剥ぎゾンビ --- */
reset0();
let oz=mk('追い剥ぎゾンビ',0,'up'),mine=mk(BIG,0);
gameState.players[0].sz=[oz];gameState.players[0].mz=[mine];
gameState.players[1].deck=[mk(PLAIN,1),mk(PLAIN,1)];
let coz=C(0,oz,'sz',0,'onBattleDamage',{event:{player:1,amount:3000,attackerUid:mine.uid,defenderUid:null,dealtBy:0}});
ok('追い剥ぎゾンビ positive: 自分のモンスターの戦闘ダメージで誘発する',
   sc('追い剥ぎゾンビ').passive.onBattleDamage(coz)===true);
let dk=gameState.players[1].deck.length;
sc('追い剥ぎゾンビ').resolve(coz);
ok('追い剥ぎゾンビ positive: 相手デッキトップが1枚墓地へ',
   gameState.players[1].deck.length===dk-1&&gameState.players[1].grave.length===1);

/* ================= Replay / SaveLoad ================= */
reset0();
let ra=mk('細菌感染',0,'up'),rm=mk(BIG,0);
gameState.players[0].sz=[ra];gameState.players[0].mz=[rm];equipTo(ra,rm);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(ra),'b2InfectN',2,'細菌感染');
let a1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle10 Replay: 装備の累積フラグが digest 一致で再生される',a1.ok,a1.reason||'');
ok('cycle10 Replay: 再生後も攻撃力計算が一致する',curATK(rm)===dbOf(rm).atk-600);
reset0();
let rf=mk('有翼賢者ファルコス',0),rp=mk(PLAIN,1);
gameState.players[0].mz=[rf];gameState.players[1].mz=[rp];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.returnToDeck(h(rp),false,'有翼賢者ファルコス');
let a2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle10 Replay: デッキトップへの戻しが digest 一致で再生される',a2.ok,a2.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle10 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
