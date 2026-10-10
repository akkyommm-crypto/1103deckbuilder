/* Auto cycle 14 — 19枚。positive / negative / ruling edge / Replay。 */
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
const PLAIN='ワイト';        /* 闇 アンデット lv1 ATK300 DEF200 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 ATK3000 DEF2500 */
const PSY='サイコ・コマンダー'; /* サイキック族 */

const ALL=['サイコ・ヘルストランサー','ハイドロ・ジェネクス','ホーリー・ジェラル','マスター・ジーグ',
 '白衣の天使','サイコ・ウォールド','ゴブリンのその場しのぎ','誤作動','混沌の落とし穴',
 'A・ジェネクス・ドゥルダーク','エアジャチ','パワー・ブレイカー','放浪の勇者 フリード',
 'ライトニングパニッシャー','エヴォリューション・バースト','ジェノサイド・ウォー',
 '早すぎた埋葬','千里眼','紅蓮の指名者'];
ALL.forEach(n=>ok('cycle14 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle14 枚数は19',ALL.length===19);

/* ============ 1. サイコ・ヘルストランサー ============ */
reset0();
let ph=mk('サイコ・ヘルストランサー',0);
gameState.players[0].mz=[ph];
gameState.players[0].grave=[mk(PSY,0)];
let cph=C(0,ph,'mz',0);
ok('サイコ・ヘルストランサー positive: 墓地にサイキック族がいれば発動できる',
   sc('サイコ・ヘルストランサー').condition(cph)===true,cph.reason||'');
let lpBefore=gameState.players[0].lp;
sc('サイコ・ヘルストランサー').selectTargets(cph,t=>{cph.selectedTargets=t;});
sc('サイコ・ヘルストランサー').resolve(cph);
ok('サイコ・ヘルストランサー positive: サイキック族を除外して1200回復する',
   gameState.players[0].lp===lpBefore+1200&&gameState.players[0].banish.length===1,
   'lp='+gameState.players[0].lp+' banish='+gameState.players[0].banish.length);
ok('サイコ・ヘルストランサー ruling: 1ターンに1度の宣言がある',
   sc('サイコ・ヘルストランサー').countLimit===1);
reset0();
let ph2=mk('サイコ・ヘルストランサー',0);
gameState.players[0].mz=[ph2];gameState.players[0].grave=[mk(BIG,0)];
ok('サイコ・ヘルストランサー negative: 墓地にサイキック族がいなければ発動できない',
   sc('サイコ・ヘルストランサー').condition(C(0,ph2,'mz',0))===false);

/* ============ 2. ハイドロ・ジェネクス ============ */
reset0();
let hg=mk('ハイドロ・ジェネクス',0),hv=mk(BIG,1);
gameState.players[0].mz=[hg];gameState.players[1].mz=[hv];
hv.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let chg=ctxDS(0,hg,{atkCard:hg,defCard:hv,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('ハイドロ・ジェネクス positive: 戦闘破壊して誘発する',
   sc('ハイドロ・ジェネクス').passive.onDamageStep(chg)===true);
let lpH=gameState.players[0].lp;
sc('ハイドロ・ジェネクス').resolve(chg);
ok('ハイドロ・ジェネクス positive: 破壊したモンスターの攻撃力分だけ回復する',
   gameState.players[0].lp===lpH+3000,'lp='+gameState.players[0].lp);
reset0();
let hg2=mk('ハイドロ・ジェネクス',0),hv2=mk(BIG,1);
gameState.players[0].mz=[hg2];gameState.players[1].mz=[hv2];
ok('ハイドロ・ジェネクス negative: 破壊していなければ発動しない',
   sc('ハイドロ・ジェネクス').passive.onDamageStep(
     ctxDS(0,hg2,{atkCard:hg2,defCard:hv2,destroyedDef:false,step:'after'},'mz','after'))===false);

/* ============ 3. ホーリー・ジェラル ============ */
reset0();
let hj=mk('ホーリー・ジェラル',0),sanc=mk('天空の聖域',0);
gameState.players[0].mz=[hj];gameState.players[0].field=sanc;
API.destroy(h(hj),'テスト効果破壊',1);
let chj=ctxEv(0,hj,'onDestroy',{},'grave');
ok('ホーリー・ジェラル positive: 「天空の聖域」があり戦闘破壊以外で墓地へ行くと誘発する',
   sc('ホーリー・ジェラル').passive.onDestroy(chj)===true);
let lpG=gameState.players[0].lp;
sc('ホーリー・ジェラル').resolve(chj);
ok('ホーリー・ジェラル positive: 1000ライフポイント回復する',
   gameState.players[0].lp===lpG+1000,'lp='+gameState.players[0].lp);
reset0();
let hj2=mk('ホーリー・ジェラル',0);
gameState.players[0].mz=[hj2];      /* 天空の聖域なし */
API.destroy(h(hj2),'テスト効果破壊',1);
ok('ホーリー・ジェラル negative: 「天空の聖域」が無ければ発動しない',
   sc('ホーリー・ジェラル').passive.onDestroy(ctxEv(0,hj2,'onDestroy',{},'grave'))===false);
reset0();
let hj3=mk('ホーリー・ジェラル',0),sanc3=mk('天空の聖域',0),hk3=mk(BIG,1);
gameState.players[0].mz=[hj3];gameState.players[0].field=sanc3;gameState.players[1].mz=[hk3];
hj3.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
ok('ホーリー・ジェラル negative: 戦闘破壊では発動しない',
   sc('ホーリー・ジェラル').passive.onDestroy(ctxEv(0,hj3,'onDestroy',{},'grave'))===false);

/* ============ 4. マスター・ジーグ ============ */
reset0();
let mj=mk('マスター・ジーグ',0),psy1=mk(PSY,0),f1=mk(PLAIN,1),f2=mk(PLAIN,1),f3=mk(PLAIN,1);
gameState.players[0].mz=[mj,psy1];gameState.players[1].mz=[f1,f2,f3];
let cmj=C(0,mj,'mz',0);
ok('マスター・ジーグ positive: 1000払えて相手モンスターがいれば発動できる',
   sc('マスター・ジーグ').condition(cmj)===true,cmj.reason||'');
sc('マスター・ジーグ').cost(cmj,()=>{});
sc('マスター・ジーグ').resolve(cmj);
ok('マスター・ジーグ positive: 表側サイキック族の数だけ破壊する（マスター・ジーグ自身も含め2体）',
   gameState.players[1].mz.length===1,'p1mz='+gameState.players[1].mz.length);
ok('マスター・ジーグ positive: 1000ライフポイントを払っている',
   gameState.players[0].lp===8000-1000,'lp='+gameState.players[0].lp);
reset0();
let mj2=mk('マスター・ジーグ',0);
gameState.players[0].mz=[mj2];gameState.players[0].lp=1000;
gameState.players[1].mz=[mk(PLAIN,1)];
ok('マスター・ジーグ negative: ライフが1000以下では発動できない',
   sc('マスター・ジーグ').condition(C(0,mj2,'mz',0))===false);

/* ============ 5. 白衣の天使 ============ */
reset0();
let wn=mk('白衣の天使',0,'down');
gameState.players[0].sz=[wn];
let cwn=ctxEv(0,wn,'onLPChange',{player:0,delta:-1500},'sz');
ok('白衣の天使 positive: 自分がダメージを受けた時に誘発する',
   sc('白衣の天使').passive.onLPChange(cwn)===true);
let lpW=gameState.players[0].lp;
sc('白衣の天使').resolve(cwn);
ok('白衣の天使 positive: 1000ライフポイント回復する',
   gameState.players[0].lp===lpW+1000,'lp='+gameState.players[0].lp);
reset0();
let wn2=mk('白衣の天使',0,'down');
gameState.players[0].sz=[wn2];
gameState.players[0].grave=[mk('白衣の天使',0),mk('白衣の天使',0)];
let lpW2=gameState.players[0].lp;
sc('白衣の天使').resolve(ctxEv(0,wn2,'onLPChange',{player:0,delta:-800},'sz'));
ok('白衣の天使 ruling: 墓地の同名の数×500がさらに回復する',
   gameState.players[0].lp===lpW2+1000+1000,'lp='+gameState.players[0].lp);
reset0();
let wn3=mk('白衣の天使',0,'down');
gameState.players[0].sz=[wn3];
ok('白衣の天使 negative: 相手がダメージを受けても誘発しない',
   sc('白衣の天使').passive.onLPChange(ctxEv(0,wn3,'onLPChange',{player:1,delta:-1500},'sz'))===false);

/* ============ 6. サイコ・ウォールド ============ */
reset0();
let pw=mk('サイコ・ウォールド',0),psy2=mk(PSY,0);
gameState.players[0].mz=[pw,psy2];
ensureCardUid(gameState,pw);ensureCardUid(gameState,psy2);
let cpw=C(0,pw,'mz',0);
ok('サイコ・ウォールド positive: 自分の場にサイキック族がいれば発動できる',
   sc('サイコ・ウォールド').condition(cpw)===true,cpw.reason||'');
API.selectCard=(t,list,cb)=>cb(list.find(x=>x.card===psy2)||list[0]);
sc('サイコ・ウォールド').cost(cpw,()=>{});
sc('サイコ・ウォールド').selectTargets(cpw,t=>{cpw.selectedTargets=t;});
sc('サイコ・ウォールド').resolve(cpw);
API.selectCard=(t,list,cb)=>cb(list[0]);
ok('サイコ・ウォールド positive: 800ライフポイントを払っている',
   gameState.players[0].lp===8000-800,'lp='+gameState.players[0].lp);
ok('サイコ・ウォールド ruling: 発動ターンこのカードは攻撃できない',
   cannotAttackNow(pw)===true);
ok('サイコ・ウォールド negative: 対象にしたサイキック族は攻撃できる',
   cannotAttackNow(psy2)===false);
gameState.turn=gameState.turn+1;
ok('サイコ・ウォールド ruling: 次のターンは攻撃できる',cannotAttackNow(pw)===false);

/* ============ 7. ゴブリンのその場しのぎ ============ */
reset0();
let gb=mk('ゴブリンのその場しのぎ',0,'down'),foeSpell=mk('強欲な壺',1);
gameState.players[0].sz=[gb];gameState.players[1].sz=[foeSpell];
ensureCardUid(gameState,foeSpell);
let evSp={uid:foeSpell.uid,player:1,kind:'spell',sub:'',chainId:1,chainLink:1,cardId:foeSpell.id};
let cgb=ctxEv(0,gb,'onActivateSuccess',evSp,'sz');
ok('ゴブリンのその場しのぎ positive: 相手の魔法発動に反応する',
   sc('ゴブリンのその場しのぎ').passive.onActivateSuccess(cgb)===true);
sc('ゴブリンのその場しのぎ').cost(cgb,()=>{});
sc('ゴブリンのその場しのぎ').resolve(cgb);
ok('ゴブリンのその場しのぎ positive: 500払い、そのカードが持ち主の手札に戻る',
   gameState.players[0].lp===8000-500&&gameState.players[1].hand.some(c=>c===foeSpell),
   'lp='+gameState.players[0].lp+' hand='+gameState.players[1].hand.length);
reset0();
let gb2=mk('ゴブリンのその場しのぎ',0,'down'),foeTrap=mk('落とし穴',1);
gameState.players[0].sz=[gb2];gameState.players[1].sz=[foeTrap];
ensureCardUid(gameState,foeTrap);
ok('ゴブリンのその場しのぎ negative: 罠の発動には反応しない',
   sc('ゴブリンのその場しのぎ').passive.onActivateSuccess(
     ctxEv(0,gb2,'onActivateSuccess',{uid:foeTrap.uid,player:1,kind:'trap',cardId:foeTrap.id},'sz'))===false);
reset0();
let gb3=mk('ゴブリンのその場しのぎ',0,'down'),mySpell=mk('強欲な壺',0);
gameState.players[0].sz=[gb3,mySpell];ensureCardUid(gameState,mySpell);
ok('ゴブリンのその場しのぎ negative: 自分の魔法発動には反応しない',
   sc('ゴブリンのその場しのぎ').passive.onActivateSuccess(
     ctxEv(0,gb3,'onActivateSuccess',{uid:mySpell.uid,player:0,kind:'spell',cardId:mySpell.id},'sz'))===false);

/* ============ 8. 誤作動 ============ */
reset0();
let gs2=mk('誤作動',0,'down'),foeTrap2=mk('落とし穴',1,'up');
gameState.players[0].sz=[gs2];gameState.players[1].sz=[foeTrap2];
ensureCardUid(gameState,foeTrap2);
let evTr={uid:foeTrap2.uid,player:1,kind:'trap',sub:'',chainId:1,chainLink:1,cardId:foeTrap2.id};
let cgs=ctxEv(0,gs2,'onActivateSuccess',evTr,'sz');
ok('誤作動 positive: 相手の罠発動に反応する',
   sc('誤作動').passive.onActivateSuccess(cgs)===true);
sc('誤作動').cost(cgs,()=>{});
sc('誤作動').resolve(cgs);
ok('誤作動 positive: 500払い、そのカードがセット状態に戻る',
   gameState.players[0].lp===8000-500&&foeTrap2.face==='down',
   'lp='+gameState.players[0].lp+' face='+foeTrap2.face);
reset0();
let gs3=mk('誤作動',0,'down'),foeSpell3=mk('強欲な壺',1);
gameState.players[0].sz=[gs3];gameState.players[1].sz=[foeSpell3];
ensureCardUid(gameState,foeSpell3);
ok('誤作動 negative: 魔法の発動には反応しない',
   sc('誤作動').passive.onActivateSuccess(
     ctxEv(0,gs3,'onActivateSuccess',{uid:foeSpell3.uid,player:1,kind:'spell',cardId:foeSpell3.id},'sz'))===false);

/* ============ 9. 混沌の落とし穴 ============ */
reset0();
let kt=mk('混沌の落とし穴',0,'down'),lightMon=mk(BIG,1);
gameState.players[0].sz=[kt];
ensureCardUid(gameState,lightMon);
gameState.pendingSummon={player:1,name:'青眼の白龍',kind:'normal',uid:lightMon.uid,label:'召喚'};
gameState.players[1].mz=[lightMon];
let ckt=C(0,kt,'sz',0);
ok('混沌の落とし穴 positive: 光属性の召喚に対して発動できる',
   sc('混沌の落とし穴').condition(ckt)===true,ckt.reason||'');
ok('混沌の落とし穴 ruling: summonNegate 宣言が光・闇だけを通す',
   sc('混沌の落とし穴').summonNegate.condition(gameState.pendingSummon)===true);
sc('混沌の落とし穴').cost(ckt,()=>{});
sc('混沌の落とし穴').resolve(ckt);
ok('混沌の落とし穴 positive: 2000払い、そのモンスターが除外される',
   gameState.players[0].lp===8000-2000&&gameState.players[1].banish.some(c=>c===lightMon),
   'lp='+gameState.players[0].lp+' banish='+gameState.players[1].banish.length);
reset0();
let kt2=mk('混沌の落とし穴',0,'down'),earthMon=mk(PSY,1);  /* サイコ・コマンダー＝地属性 */
gameState.players[0].sz=[kt2];ensureCardUid(gameState,earthMon);
gameState.players[1].mz=[earthMon];
gameState.pendingSummon={player:1,name:PSY,kind:'normal',uid:earthMon.uid};
ok('混沌の落とし穴 negative: 光属性でも闇属性でもない召喚には発動できない',
   sc('混沌の落とし穴').condition(C(0,kt2,'sz',0))===false);
ok('混沌の落とし穴 negative: summonNegate 宣言も通さない',
   sc('混沌の落とし穴').summonNegate.condition(gameState.pendingSummon)===false);

/* ============ 10. A・ジェネクス・ドゥルダーク ============ */
reset0();
let dd=mk('A・ジェネクス・ドゥルダーク',0),darkFoe=mk(PLAIN,1,'up','atk'),lightFoe=mk(BIG,1,'up','atk');
gameState.players[0].mz=[dd];gameState.players[1].mz=[darkFoe,lightFoe];
ensureCardUid(gameState,dd);
let cdd=C(0,dd,'mz',0);
ok('A・ジェネクス・ドゥルダーク positive: 同じ属性（闇）の表側攻撃表示がいれば発動できる',
   sc('A・ジェネクス・ドゥルダーク').condition(cdd)===true,cdd.reason||'');
sc('A・ジェネクス・ドゥルダーク').selectTargets(cdd,t=>{cdd.selectedTargets=t;});
sc('A・ジェネクス・ドゥルダーク').resolve(cdd);
ok('A・ジェネクス・ドゥルダーク positive: 同じ属性のモンスターだけを破壊する',
   gameState.players[1].mz.length===1&&gameState.players[1].mz[0]===lightFoe,
   'p1mz='+gameState.players[1].mz.map(c=>dbOf(c).n).join(','));
ok('A・ジェネクス・ドゥルダーク ruling: 発動ターンこのカードは攻撃できない',
   cannotAttackNow(dd)===true);
reset0();
let dd2=mk('A・ジェネクス・ドゥルダーク',0),defFoe=mk(PLAIN,1,'up','def');
gameState.players[0].mz=[dd2];gameState.players[1].mz=[defFoe];
ok('A・ジェネクス・ドゥルダーク negative: 守備表示は対象にできない',
   sc('A・ジェネクス・ドゥルダーク').condition(C(0,dd2,'mz',0))===false);

/* ============ 11. エアジャチ ============ */
reset0();
let aj=mk('エアジャチ',0),fish=mk('サウザンド・アイズ・フィッシュ',0),foeCard=mk(BIG,1);
gameState.players[0].mz=[aj];gameState.players[0].hand=[fish];
gameState.players[1].mz=[foeCard];
ensureCardUid(gameState,aj);
let caj=C(0,aj,'mz',0);
ok('エアジャチ positive: 手札に魚族がいて相手の表側カードがあれば発動できる',
   sc('エアジャチ').condition(caj)===true,caj.reason||'');
sc('エアジャチ').selectTargets(caj,t=>{caj.selectedTargets=t;});
sc('エアジャチ').resolve(caj);
ok('エアジャチ positive: 手札を除外し相手のカードを破壊する',
   gameState.players[1].mz.length===0&&gameState.players[0].banish.some(c=>c===fish),
   'p1mz='+gameState.players[1].mz.length+' banish='+gameState.players[0].banish.length);
ok('エアジャチ positive: その後このカード自身も除外される',
   gameState.players[0].banish.some(c=>c===aj)&&gameState.players[0].mz.length===0);
ok('エアジャチ ruling: 次の自分のスタンバイに帰還が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c3.airjachi'&&s.at==='standbyPhase'));
let ajSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c3.airjachi');
scheduleHandlerV7('c3.airjachi')(ajSch.args||{}, ajSch);
ok('エアジャチ ruling: 予約が解決するとフィールドに戻る',
   gameState.players[0].mz.some(c=>c===aj),'p0mz='+gameState.players[0].mz.length);
reset0();
let aj2=mk('エアジャチ',0);
gameState.players[0].mz=[aj2];gameState.players[0].hand=[mk(BIG,0)];
gameState.players[1].mz=[mk(BIG,1)];
ok('エアジャチ negative: 手札に魚族・海竜族・水族がいなければ発動できない',
   sc('エアジャチ').condition(C(0,aj2,'mz',0))===false);

/* ============ 12. パワー・ブレイカー ============ */
reset0();
let pb=mk('パワー・ブレイカー',0),foeST=mk('落とし穴',1,'up'),pk=mk(BIG,1);
gameState.players[0].mz=[pb];gameState.players[1].sz=[foeST];gameState.players[1].mz=[pk];
pb.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cpb=ctxDS(0,pb,{defCard:pb,atkCard:pk,destroyedDef:true,destroyedAtk:false,step:'leave'},'grave','leave');
ok('パワー・ブレイカー positive: 相手の攻撃で破壊されて誘発する',
   sc('パワー・ブレイカー').passive.onDamageStep(cpb)===true);
sc('パワー・ブレイカー').selectTargets(cpb,t=>{cpb.selectedTargets=t;});
sc('パワー・ブレイカー').resolve(cpb);
ok('パワー・ブレイカー positive: 相手の表側表示の魔法・罠を破壊する',
   gameState.players[1].sz.length===0);
reset0();
let pb2=mk('パワー・ブレイカー',0);
gameState.players[0].mz=[pb2];gameState.players[1].sz=[mk('落とし穴',1,'up')];
API.destroy(h(pb2),'自分の効果で破壊',0);          /* 自分の効果 */
ok('パワー・ブレイカー negative: 自分の効果で破壊された場合は発動しない',
   sc('パワー・ブレイカー').passive.onDestroy(ctxEv(0,pb2,'onDestroy',{},'grave'))===false);
reset0();
let pb3=mk('パワー・ブレイカー',0);
gameState.players[0].mz=[pb3];gameState.players[1].sz=[mk('落とし穴',1,'up')];
API.destroy(h(pb3),'相手の効果で破壊',1);          /* 相手の効果 */
ok('パワー・ブレイカー positive: 相手の効果で破壊された場合も発動する',
   sc('パワー・ブレイカー').passive.onDestroy(ctxEv(0,pb3,'onDestroy',{},'grave'))===true);

/* ============ 13. 放浪の勇者 フリード ============ */
reset0();
let fr=mk('放浪の勇者 フリード',0),bigFoe=mk(BIG,1);
gameState.players[0].mz=[fr];gameState.players[1].mz=[bigFoe];
gameState.players[0].grave=[mk(BIG,0),mk(BIG,0)];   /* 光属性2体 */
let cfr=C(0,fr,'mz',0);
ok('放浪の勇者 フリード positive: 墓地に光属性2体、より高い攻撃力のモンスターがいれば発動できる',
   sc('放浪の勇者 フリード').condition(cfr)===true,cfr.reason||'');
sc('放浪の勇者 フリード').selectTargets(cfr,t=>{cfr.selectedTargets=t;});
sc('放浪の勇者 フリード').resolve(cfr);
ok('放浪の勇者 フリード positive: 光属性2体を除外して高攻撃力モンスターを破壊する',
   gameState.players[0].banish.length===2&&gameState.players[1].mz.length===0,
   'banish='+gameState.players[0].banish.length+' p1mz='+gameState.players[1].mz.length);
reset0();
let fr2=mk('放浪の勇者 フリード',0),smallFoe=mk(PLAIN,1);
gameState.players[0].mz=[fr2];gameState.players[1].mz=[smallFoe];
gameState.players[0].grave=[mk(BIG,0),mk(BIG,0)];
ok('放浪の勇者 フリード negative: 自身より攻撃力が高くないモンスターは破壊できない',
   sc('放浪の勇者 フリード').condition(C(0,fr2,'mz',0))===false);
reset0();
let fr3=mk('放浪の勇者 フリード',0);
gameState.players[0].mz=[fr3];gameState.players[1].mz=[mk(BIG,1)];
gameState.players[0].grave=[mk(BIG,0)];             /* 1体しかいない */
ok('放浪の勇者 フリード negative: 墓地の光属性が1体では発動できない',
   sc('放浪の勇者 フリード').condition(C(0,fr3,'mz',0))===false);

/* ============ 14. ライトニングパニッシャー ============ */
reset0();
let lp=mk('ライトニングパニッシャー',0),lfoe=mk(BIG,1);
gameState.players[0].mz=[lp];gameState.players[1].mz=[lfoe];
gameState.chain=[{name:'A'},{name:'B'},{name:'C'}];
let clp=C(0,lp,'mz',0);
ok('ライトニングパニッシャー positive: チェーンが3つ以上で発動できる',
   sc('ライトニングパニッシャー').condition(clp)===true,clp.reason||'');
sc('ライトニングパニッシャー').selectTargets(clp,t=>{clp.selectedTargets=t;});
sc('ライトニングパニッシャー').resolve(clp);
ok('ライトニングパニッシャー positive: 相手のカード1枚を破壊する',
   gameState.players[1].mz.length===0);
reset0();
let lp2=mk('ライトニングパニッシャー',0);
gameState.players[0].mz=[lp2];gameState.players[1].mz=[mk(BIG,1)];
gameState.chain=[{name:'A'},{name:'B'}];
ok('ライトニングパニッシャー negative: チェーンが2つでは発動できない',
   sc('ライトニングパニッシャー').condition(C(0,lp2,'mz',0))===false);
reset0();
let lp3=mk('ライトニングパニッシャー',0);
gameState.players[0].mz=[lp3];gameState.players[1].mz=[mk(BIG,1)];
gameState.chain=[{name:'A'},{name:'A'},{name:'C'}];
ok('ライトニングパニッシャー negative: 同一チェーン上に同名カードが複数あると発動できない',
   sc('ライトニングパニッシャー').condition(C(0,lp3,'mz',0))===false);

/* ============ 15. エヴォリューション・バースト ============ */
reset0();
let eb=mk('エヴォリューション・バースト',0),cyber=mk('サイバー・ドラゴン',0),ebFoe=mk(BIG,1);
gameState.players[0].sz=[eb];gameState.players[0].mz=[cyber];gameState.players[1].mz=[ebFoe];
ensureCardUid(gameState,cyber);
let ceb=C(0,eb,'sz',0);
ok('エヴォリューション・バースト positive: 「サイバー・ドラゴン」があれば発動できる',
   sc('エヴォリューション・バースト').condition(ceb)===true,ceb.reason||'');
sc('エヴォリューション・バースト').selectTargets(ceb,t=>{ceb.selectedTargets=t;});
sc('エヴォリューション・バースト').resolve(ceb);
ok('エヴォリューション・バースト positive: 相手のカードを破壊する',
   gameState.players[1].mz.length===0);
ok('エヴォリューション・バースト ruling: 発動ターン「サイバー・ドラゴン」は攻撃できない',
   cannotAttackNow(cyber)===true);
reset0();
let eb2=mk('エヴォリューション・バースト',0);
gameState.players[0].sz=[eb2];gameState.players[1].mz=[mk(BIG,1)];
ok('エヴォリューション・バースト negative: 「サイバー・ドラゴン」が無ければ発動できない',
   sc('エヴォリューション・バースト').condition(C(0,eb2,'sz',0))===false);

/* ============ 16. ジェノサイド・ウォー ============ */
reset0();
let gw=mk('ジェノサイド・ウォー',0);
gameState.players[0].sz=[gw];
let cgw=C(0,gw,'sz',0);
ok('ジェノサイド・ウォー positive: メインフェイズ1で発動できる',
   sc('ジェノサイド・ウォー').condition(cgw)===true,cgw.reason||'');
sc('ジェノサイド・ウォー').resolve(cgw);
ok('ジェノサイド・ウォー positive: エンドフェイズに予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c3.genocideWar'&&s.at==='endPhase'));
/* 予約後に戦闘が起きる。対象は発火時点で確定する。 */
let atkr=mk(BIG,0),defr=mk(PLAIN,1);
gameState.players[0].mz=[atkr];gameState.players[1].mz=[defr];
ensureCardUid(gameState,atkr);ensureCardUid(gameState,defr);
gameState.battlePhaseV6={attacks:[{attackerUid:atkr.uid,defenderUid:defr.uid,player:0}]};
let gwSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c3.genocideWar');
scheduleHandlerV7('c3.genocideWar')(gwSch.args||{}, gwSch);
ok('ジェノサイド・ウォー positive: 戦闘を行ったモンスターが全て破壊される',
   gameState.players[0].mz.length===0&&gameState.players[1].mz.length===0,
   'p0='+gameState.players[0].mz.length+' p1='+gameState.players[1].mz.length);
reset0();
let gw2=mk('ジェノサイド・ウォー',0);
gameState.players[0].sz=[gw2];gameState.phase='main2';
ok('ジェノサイド・ウォー negative: メインフェイズ2では発動できない',
   sc('ジェノサイド・ウォー').condition(C(0,gw2,'sz',0))===false);

/* ============ 17. 早すぎた埋葬 ============ */
reset0();
let hb=mk('早すぎた埋葬',0),dead=mk(BIG,0);
gameState.players[0].sz=[hb];gameState.players[0].grave=[dead];
let chb=C(0,hb,'sz',0);
ok('早すぎた埋葬 positive: 800払えて墓地にモンスターがいれば発動できる',
   sc('早すぎた埋葬').condition(chb)===true,chb.reason||'');
sc('早すぎた埋葬').cost(chb,()=>{});
sc('早すぎた埋葬').selectTargets(chb,t=>{chb.selectedTargets=t;});
sc('早すぎた埋葬').resolve(chb);
ok('早すぎた埋葬 positive: 800払い、墓地のモンスターが表側攻撃表示で特殊召喚される',
   gameState.players[0].lp===8000-800&&gameState.players[0].mz.some(c=>c===dead)
   &&dead.pos==='atk'&&dead.face==='up',
   'lp='+gameState.players[0].lp+' mz='+gameState.players[0].mz.length);
ok('早すぎた埋葬 positive: このカードが装備される',
   !!hb.equipTo&&hb.equipTo.uid===dead.uid,'equipTo='+JSON.stringify(hb.equipTo||null));
ok('早すぎた埋葬 ruling: このカードが離れたら装備モンスターを破壊する生存リンクが張られる',
   !!dead.linkV9&&Array.isArray(dead.linkV9.watch)&&dead.linkV9.watch.some(w=>w.onGone==='destroy'),
   'link='+JSON.stringify(dead.linkV9||null));
API.destroy(h(hb),'テスト：早すぎた埋葬を破壊',1);
ok('早すぎた埋葬 ruling: 破壊されると装備モンスターも破壊される',
   !gameState.players[0].mz.some(c=>c===dead),'p0mz='+gameState.players[0].mz.length);
reset0();
let hb2=mk('早すぎた埋葬',0);
gameState.players[0].sz=[hb2];gameState.players[0].lp=800;
gameState.players[0].grave=[mk(BIG,0)];
ok('早すぎた埋葬 negative: ライフが800以下では発動できない',
   sc('早すぎた埋葬').condition(C(0,hb2,'sz',0))===false);

/* ============ 18. 千里眼 ============ */
reset0();
let sg=mk('千里眼',0,'up');
gameState.players[0].sz=[sg];
gameState.players[1].deck=[mk(BIG,1),mk(PLAIN,1)];
gameState.phase='standby';gameState.activePlayer=0;
let csg=ctxEv(0,sg,'onStandbyPhase',{},'sz');
ok('千里眼 positive: 自分のスタンバイフェイズに誘発する',
   sc('千里眼').passive.onStandbyPhase(csg)===true);
sc('千里眼').cost(csg,()=>{});
sc('千里眼').resolve(csg);
let psg=pending();
ok('千里眼 ruling: 確認できるのは発動プレイヤーだけ（相手には見せない）',
   !!psg&&psg.player===0,'player='+(psg&&psg.player));
ok('千里眼 ruling: 選択肢に相手デッキの一番上の名前が入る',
   !!psg&&psg.title.indexOf('青眼の白龍')>=0,'title='+(psg&&psg.title));
answerChoiceV49([psg.candidates[0].key]);
ok('千里眼 positive: デッキは並び替えられない（元に戻す）',
   gameState.players[1].deck.length===2&&dbOf(gameState.players[1].deck[0]).n==='青眼の白龍');
ok('千里眼 positive: 100ライフポイントを払っている',
   gameState.players[0].lp===8000-100,'lp='+gameState.players[0].lp);
ok('千里眼 ruling: 1ターンに1度の宣言がある',sc('千里眼').countLimit===1);
reset0();
let sg2=mk('千里眼',0,'up');
gameState.players[0].sz=[sg2];gameState.players[1].deck=[mk(BIG,1)];
gameState.phase='standby';gameState.activePlayer=1;
ok('千里眼 negative: 相手のスタンバイフェイズでは発動できない',
   sc('千里眼').passive.onStandbyPhase(ctxEv(0,sg2,'onStandbyPhase',{},'sz'))===false);

/* ============ 19. 紅蓮の指名者 ============ */
reset0();
let gu=mk('紅蓮の指名者',0,'down');
gameState.players[0].sz=[gu];
gameState.players[1].hand=[mk(BIG,1),mk(PLAIN,1)];
let cgu=C(0,gu,'sz',0);
ok('紅蓮の指名者 positive: 2000払えて相手に手札があれば発動できる',
   sc('紅蓮の指名者').condition(cgu)===true,cgu.reason||'');
sc('紅蓮の指名者').cost(cgu,()=>{});
sc('紅蓮の指名者').resolve(cgu);
let pgu=pending();
ok('紅蓮の指名者 ruling: 相手の手札を確認するのは発動プレイヤー',
   !!pgu&&pgu.player===0&&pgu.candidates.length===2,
   'player='+(pgu&&pgu.player)+' n='+(pgu&&pgu.candidates.length));
answerChoiceV49([pgu.candidates[0].key]);
ok('紅蓮の指名者 positive: 選択したカードが除外される',
   gameState.players[1].banish.length===1&&gameState.players[1].hand.length===1,
   'banish='+gameState.players[1].banish.length);
ok('紅蓮の指名者 ruling: 次の相手のエンドフェイズに帰還が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c3.gurenReturn'&&s.at==='endPhase'));
let guSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c3.gurenReturn');
scheduleHandlerV7('c3.gurenReturn')(guSch.args||{}, guSch);
ok('紅蓮の指名者 ruling: 予約が解決すると手札に戻る',
   gameState.players[1].hand.length===2&&gameState.players[1].banish.length===0);
reset0();
let gu2=mk('紅蓮の指名者',0,'down');
gameState.players[0].sz=[gu2];gameState.players[1].hand=[];
ok('紅蓮の指名者 negative: 相手の手札が無ければ発動できない',
   sc('紅蓮の指名者').condition(C(0,gu2,'sz',0))===false);
reset0();
let gu3=mk('紅蓮の指名者',0,'down');
gameState.players[0].sz=[gu3];gameState.players[0].lp=2000;
gameState.players[1].hand=[mk(BIG,1)];
ok('紅蓮の指名者 negative: ライフが2000以下では発動できない',
   sc('紅蓮の指名者').condition(C(0,gu3,'sz',0))===false);

/* ================= 読み取り専用 passive の検証 ================= */
reset0();
let ro1=mk('白衣の天使',0,'down'),ro2=mk('千里眼',0,'up'),ro3=mk('ハイドロ・ジェネクス',0);
gameState.players[0].sz=[ro1,ro2];gameState.players[0].mz=[ro3];
gameState.players[1].deck=[mk(BIG,1)];
gameState.phase='standby';gameState.activePlayer=0;
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
sc('白衣の天使').passive.onLPChange(ctxEv(0,ro1,'onLPChange',{player:0,delta:-500},'sz'));
sc('千里眼').passive.onStandbyPhase(ctxEv(0,ro2,'onStandbyPhase',{},'sz'));
sc('ハイドロ・ジェネクス').passive.onDamageStep(
  ctxDS(0,ro3,{atkCard:ro3,defCard:null,destroyedDef:false,step:'after'},'mz','after'));
ok('cycle14 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('サイコ・ウォールド',0);
gameState.players[0].mz=[rp1];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(rp1),'c3WalledNoAttackTurn',gameState.turn,'サイコ・ウォールド');
let ra1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle14 Replay: 攻撃制限フラグが digest 一致で再生される',ra1.ok,ra1.reason||'');
reset0();
let rp2=mk('紅蓮の指名者',0,'down');
gameState.players[0].sz=[rp2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.schedule({at:'endPhase',turns:1,player:0,handler:'c3.gurenReturn',
  args:{uid:rp2.uid},note:'紅蓮の指名者'});
let ra2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle14 Replay: 帰還予約が digest 一致で再生される',ra2.ok,ra2.reason||'');
reset0();
let rp3=mk('ジェノサイド・ウォー',0);
gameState.players[0].sz=[rp3];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.schedule({at:'endPhase',turns:0,player:0,handler:'c3.genocideWar',
  args:{player:0},source:{card:rp3},note:'ジェノサイド・ウォー'});
let ra3=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle14 Replay: エンドフェイズ予約が digest 一致で再生される',ra3.ok,ra3.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle14 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle14 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
