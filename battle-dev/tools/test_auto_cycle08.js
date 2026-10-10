/* Auto cycle 08 — 28枚。positive / negative / ruling edge / Replay。 */
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
function pickNamed(nm){API.selectCard=(t,list,cb)=>{const hit=list.find(x=>x&&x.card&&dbOf(x.card).n===nm);cb(hit||list[0]);};}
function C(p,card,zone,idx,ev,extra){const c=makeContext(p,card,zone,idx,ev||'activate',extra||{});
  if(extra&&extra.event)c.event=extra.event;return c;}
function ctxEv(p,card,ev,evt,zone){const loc=h(card);
  return C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,ev,{event:evt});}
function ctxDS(p,card,battle,zone,step){const loc=h(card);
  const c=C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',{event:{},battle:battle,step:step||'after'});
  c.battle=battle;c.step=step||'after';return c;}
function equipTo(eq,mon){ ensureCardUid(gameState,mon); eq.equipTo={uid:mon.uid}; return eq; }
const PLAIN='ワイト';        /* 闇 lv1 ATK300 アンデット */
const BIG='青眼の白龍';       /* 光 lv8 ATK3000 ドラゴン */
const DARKM='デーモンの召喚';  /* 闇 lv6 ATK2500 悪魔 */

const ALL=['ニードルバンカー','フレムベル・グルニカ','マンモ・フォッシル','吸収天児','守護天使 ジャンヌ',
 'ジャッカルの霊騎士','カンガルー・チャンプ','ゴロゴル','ゴブリンエリート部隊','ゴブリン突撃部隊',
 'ジャイアント・オーク','スピア・ドラゴン','ライライダー','ドラゴン族・封印の壺','アメーバ','グリグル',
 '恵みの像','災いの像','ゼンマイニャンコ','ヒール・ウェーバー','ヴォルカニック・エッジ','リターン・ゾンビ',
 '不死式冥界砲','天空の泉','墓荒らしの報い','呪魂の仮面','強奪','リーフ・フェアリー'];
ALL.forEach(n=>ok('cycle08 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle08 枚数は28',ALL.length===28);

/* ================= FA ================= */
function killCtx(me,foe){ return {atkCard:me,defCard:foe,destroyedDef:true,destroyedAtk:false,step:'after'}; }
/* --- ニードルバンカー / フレムベル・グルニカ --- */
reset0();
let nb=mk('ニードルバンカー',0),v1=mk(BIG,1);   /* lv8 */
gameState.players[0].mz=[nb];gameState.players[1].mz=[v1];
let cnb=ctxDS(0,nb,killCtx(nb,v1),'mz','after');
ok('ニードルバンカー positive: 戦闘破壊で誘発する',sc('ニードルバンカー').passive.onDamageStep(cnb)===true);
let lp1=gameState.players[1].lp;
sc('ニードルバンカー').resolve(cnb);
ok('ニードルバンカー positive: レベル×500ダメージ（8×500）',gameState.players[1].lp===lp1-4000);
reset0();
let fg=mk('フレムベル・グルニカ',0),v2=mk(BIG,1);
gameState.players[0].mz=[fg];gameState.players[1].mz=[v2];
let lp2=gameState.players[1].lp;
sc('フレムベル・グルニカ').resolve(ctxDS(0,fg,killCtx(fg,v2),'mz','after'));
ok('フレムベル・グルニカ positive: レベル×200ダメージ（8×200）',gameState.players[1].lp===lp2-1600);

/* --- マンモ・フォッシル --- */
reset0();
let mf=mk('マンモ・フォッシル',0),v3=mk(PLAIN,1);
gameState.players[0].mz=[mf];gameState.players[1].mz=[v3];
let lp3=gameState.players[1].lp;
sc('マンモ・フォッシル').resolve(ctxDS(0,mf,killCtx(mf,v3),'mz','after'));
ok('マンモ・フォッシル positive: 400ダメージ',gameState.players[1].lp===lp3-400);

/* --- 吸収天児 / 守護天使 ジャンヌ --- */
reset0();
let kt=mk('吸収天児',0),v4=mk(BIG,1);   /* lv8 */
gameState.players[0].mz=[kt];gameState.players[1].mz=[v4];
gameState.players[0].lp=4000;
sc('吸収天児').resolve(ctxDS(0,kt,killCtx(kt,v4),'mz','after'));
ok('吸収天児 positive: レベル×300回復（8×300）',gameState.players[0].lp===4000+2400,'lp='+gameState.players[0].lp);
reset0();
let gj=mk('守護天使 ジャンヌ',0),v5=mk(BIG,1);   /* 元々のATK3000 */
gameState.players[0].mz=[gj];gameState.players[1].mz=[v5];
gameState.players[0].lp=4000;
API.modAtk(h(v5),-1000,0,'endTurn','テスト');   /* 現在値を下げても元々の攻撃力を使う */
sc('守護天使 ジャンヌ').resolve(ctxDS(0,gj,killCtx(gj,v5),'mz','after'));
ok('守護天使 ジャンヌ ruling: 現在値ではなく元々の攻撃力分回復する',
   gameState.players[0].lp===4000+3000,'lp='+gameState.players[0].lp);

/* --- ジャッカルの霊騎士 --- */
reset0();
gameState.phase='battle';
let jk=mk('ジャッカルの霊騎士',0),prey=mk(PLAIN,1);
gameState.players[0].mz=[jk];gameState.players[1].mz=[prey];
ensureCardUid(gameState,jk);ensureCardUid(gameState,prey);
recordBattlePhaseAttackV6(gameState,0,jk,prey);
ok('ジャッカルの霊騎士 negative: まだ破壊していなければ誘発しない',
   sc('ジャッカルの霊騎士').passive.onBattlePhaseEnd(ctxEv(0,jk,'onBattlePhaseEnd',{}))===false);
prey.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cjk=ctxEv(0,jk,'onBattlePhaseEnd',{});
ok('ジャッカルの霊騎士 positive: バトルフェイズ終了時に誘発する',
   sc('ジャッカルの霊騎士').passive.onBattlePhaseEnd(cjk)===true);
sc('ジャッカルの霊騎士').selectTargets(cjk,r=>{cjk.selectedTargets=r;});
sc('ジャッカルの霊騎士').resolve(cjk);
ok('ジャッカルの霊騎士 positive: 破壊した相手モンスターを自分の場に特殊召喚する',
   gameState.players[0].mz.some(c=>c&&c.uid===prey.uid));
ok('ジャッカルの霊騎士 ruling: 表側守備表示で特殊召喚する',
   prey.pos==='def'&&prey.face==='up','pos='+prey.pos);

/* ================= FB ================= */
/* --- カンガルー・チャンプ --- */
reset0();
let kc=mk('カンガルー・チャンプ',0),foe1=mk(BIG,1,'up','atk');
gameState.players[0].mz=[kc];gameState.players[1].mz=[foe1];
let ckc=ctxDS(0,kc,{atkCard:kc,defCard:foe1,step:'after'},'mz','after');
ok('カンガルー・チャンプ positive: 戦闘したら誘発する',sc('カンガルー・チャンプ').passive.onDamageStep(ckc)===true);
sc('カンガルー・チャンプ').resolve(ckc);
ok('カンガルー・チャンプ positive: 戦闘した相手が守備表示になる',foe1.pos==='def','pos='+foe1.pos);
ok('カンガルー・チャンプ negative: 既に表側守備なら誘発しない',
   sc('カンガルー・チャンプ').passive.onDamageStep(
     ctxDS(0,kc,{atkCard:kc,defCard:foe1},'mz','after'))===false);

/* --- ゴロゴル --- */
reset0();
let gg=mk('ゴロゴル',0),foe2=mk(BIG,1,'up','atk');
gameState.players[0].mz=[gg];gameState.players[1].mz=[foe2];
let cgg=ctxDS(0,gg,{atkCard:gg,defCard:foe2,step:'end'},'mz','end');
ok('ゴロゴル positive: 戦闘したら誘発する',sc('ゴロゴル').passive.onDamageStep(cgg)===true);
sc('ゴロゴル').resolve(cgg);
ok('ゴロゴル positive: 戦闘した相手が裏側守備表示になる',
   foe2.face==='down'&&foe2.pos==='def','face='+foe2.face+' pos='+foe2.pos);

/* --- ゴブリン系3枚 --- */
['ゴブリンエリート部隊','ゴブリン突撃部隊','ジャイアント・オーク'].forEach(nm=>{
  reset0();
  const g=mk(nm,0);
  gameState.players[0].mz=[g];
  ok(nm+' negative: 攻撃していなければ誘発しない',
     sc(nm).passive.onBattlePhaseEnd(ctxEv(0,g,'onBattlePhaseEnd',{}))===false);
  g.attacked=true;
  const cg=ctxEv(0,g,'onBattlePhaseEnd',{});
  ok(nm+' positive: 攻撃したらバトルフェイズ終了時に誘発する',
     sc(nm).passive.onBattlePhaseEnd(cg)===true);
  sc(nm).resolve(cg);
  ok(nm+' positive: 守備表示になる',g.pos==='def');
  ok(nm+' positive: 表示形式を変更できない',cannotChangePositionV10(g)===true);
});

/* --- スピア・ドラゴン --- */
reset0();
let sd=mk('スピア・ドラゴン',0),defFoe=mk(PLAIN,1,'up','def');
gameState.players[0].mz=[sd];gameState.players[1].mz=[defFoe];
ok('スピア・ドラゴン positive: 守備表示への攻撃で貫通する',(()=>{
   const amt=applyPiercingDamage({atkCard:sd,defCard:defFoe});
   return amt===Math.max(0,curATK(sd)-curDEF(defFoe))&&amt>0;})());
let csd=ctxDS(0,sd,{atkCard:sd,defCard:defFoe,step:'end'},'mz','end');
ok('スピア・ドラゴン positive: 攻撃したら誘発する',sc('スピア・ドラゴン').passive.onDamageStep(csd)===true);
sc('スピア・ドラゴン').resolve(csd);
ok('スピア・ドラゴン positive: ダメージステップ終了時に守備表示になる',sd.pos==='def');

/* --- ライライダー --- */
reset0();
let lr=mk('ライライダー',0),foe3=mk(BIG,1);
gameState.players[0].mz=[lr];gameState.players[1].mz=[foe3];
let clr=ctxDS(0,lr,{atkCard:lr,defCard:foe3,step:'end'},'mz','end');
ok('ライライダー positive: 戦闘したら誘発する',sc('ライライダー').passive.onDamageStep(clr)===true);
sc('ライライダー').resolve(clr);
ok('ライライダー positive: 戦闘した相手は攻撃できなくなる',cannotAttackNow(foe3)===true);
ok('ライライダー negative: 二重には適用しない',
   sc('ライライダー').passive.onDamageStep(ctxDS(0,lr,{atkCard:lr,defCard:foe3},'mz','end'))===false);
ok('ライライダー ruling: 場を離れて戻れば解除される（summonedTurn が変わる）',(()=>{
   foe3.summonedTurn=99;
   return cannotAttackNow(foe3)===false;})());

/* --- ドラゴン族・封印の壺 --- */
reset0();
let ft=mk('ドラゴン族・封印の壺',0,'up');
gameState.players[0].sz=[ft];
let dragon=mk(BIG,1,'up','atk'),nonDragon=mk(PLAIN,1,'up','atk');
gameState.players[1].mz=[dragon,nonDragon];
ok('ドラゴン族・封印の壺 positive: ドラゴン族は表示形式を変更できない',
   cannotChangePositionV10(dragon)===true);
ok('ドラゴン族・封印の壺 ruling: ドラゴン族以外は変更できる',
   cannotChangePositionV10(nonDragon)===false);
let cft=C(0,ft,'sz',0,'onNormalSummon',{event:{player:1,card:dragon,uid:dragon.uid}});
ok('ドラゴン族・封印の壺 positive: 守備表示でないドラゴンがいれば処理する',
   sc('ドラゴン族・封印の壺').passive.onNormalSummon(cft)===true);
sc('ドラゴン族・封印の壺').resolve(cft);
ok('ドラゴン族・封印の壺 positive: ドラゴン族が守備表示になる',dragon.pos==='def','pos='+dragon.pos);
ok('ドラゴン族・封印の壺 ruling: ドラゴン族以外は守備表示にならない',nonDragon.pos==='atk');

/* ================= FC. コントロール移動 ================= */
reset0();
let am=mk('アメーバ',0);
gameState.players[0].mz=[am];
let lpA=gameState.players[1].lp;
let cam=C(0,am,'mz',0,'onControlChange',{event:{uid:am.uid,fromPlayer:0,toPlayer:1,zone:'mz'}});
ok('アメーバ positive: コントロールが相手に移ったら誘発する',
   sc('アメーバ').passive.onControlChange(cam)===true);
sc('アメーバ').resolve(cam);
ok('アメーバ positive: 新しいコントローラーが2000ダメージを受ける',
   gameState.players[1].lp===lpA-2000,'lp='+gameState.players[1].lp);
ok('アメーバ ruling: 場にいる間は1度だけ',
   sc('アメーバ').passive.onControlChange(
     C(0,am,'mz',0,'onControlChange',{event:{uid:am.uid,fromPlayer:0,toPlayer:1,zone:'mz'}}))===false);
reset0();
let gr=mk('グリグル',0);
gameState.players[0].mz=[gr];gameState.players[0].lp=4000;
let cgr=C(0,gr,'mz',0,'onControlChange',{event:{uid:gr.uid,fromPlayer:0,toPlayer:1,zone:'mz'}});
sc('グリグル').resolve(cgr);
ok('グリグル positive: 元の持ち主が3000回復する',gameState.players[0].lp===7000,'lp='+gameState.players[0].lp);
reset0();
let am2=mk('アメーバ',0),other=mk(PLAIN,0);
gameState.players[0].mz=[am2,other];
ok('アメーバ negative: 別のカードのコントロール移動では誘発しない',
   sc('アメーバ').passive.onControlChange(
     C(0,am2,'mz',0,'onControlChange',{event:{uid:other.uid,fromPlayer:0,toPlayer:1,zone:'mz'}}))===false);

/* ================= FD. 手札から墓地へ ================= */
reset0();
let mz=mk('恵みの像',0);
gameState.players[0].hand=[mz];gameState.players[0].lp=4000;
API.discard(0,0,'相手の効果',{byEffect:true,byPlayer:1});
let cmz=ctxEv(0,mz,'onDiscard',{card:mz,uid:mz.uid,byPlayer:1},'grave');
ok('恵みの像 positive: 相手の効果で手札から墓地へ送られたら誘発する',
   sc('恵みの像').passive.onDiscard(cmz)===true);
sc('恵みの像').resolve(cmz);
ok('恵みの像 positive: 2000回復する',gameState.players[0].lp===6000,'lp='+gameState.players[0].lp);
reset0();
let wz=mk('災いの像',0);
gameState.players[0].hand=[wz];
API.discard(0,0,'相手の効果',{byEffect:true,byPlayer:1});
let cwz=ctxEv(0,wz,'onDiscard',{card:wz,uid:wz.uid,byPlayer:1},'grave');
let lpW=gameState.players[1].lp;
sc('災いの像').resolve(cwz);
ok('災いの像 positive: 相手に2000ダメージ',gameState.players[1].lp===lpW-2000);
reset0();
let mz2=mk('恵みの像',0);
gameState.players[0].hand=[mz2];
API.discard(0,0,'自分の効果',{byEffect:true,byPlayer:0});
ok('恵みの像 negative: 自分の効果で捨てた場合は誘発しない',
   sc('恵みの像').passive.onDiscard(ctxEv(0,mz2,'onDiscard',{card:mz2,uid:mz2.uid,byPlayer:0},'grave'))===false);

/* ================= FE ================= */
/* --- ゼンマイニャンコ --- */
reset0();
let zn=mk('ゼンマイニャンコ',0),foe4=mk(BIG,1);
gameState.players[0].mz=[zn];gameState.players[1].mz=[foe4];
let czn=C(0,zn,'mz',0);
ok('ゼンマイニャンコ positive: 相手モンスターがいれば発動できる',sc('ゼンマイニャンコ').condition(czn)===true);
sc('ゼンマイニャンコ').selectTargets(czn,r=>{czn.selectedTargets=r;});
sc('ゼンマイニャンコ').resolve(czn);
ok('ゼンマイニャンコ positive: 相手モンスターが持ち主の手札に戻る',
   gameState.players[1].hand.some(c=>c&&c.uid===foe4.uid));
gameState.players[1].mz=[mk(BIG,1)];
ok('ゼンマイニャンコ ruling: 場にいる間は1度だけ',sc('ゼンマイニャンコ').condition(C(0,zn,'mz',0))===false);

/* --- ヒール・ウェーバー --- */
reset0();
let hw=mk('ヒール・ウェーバー',0),lv8=mk(BIG,0);   /* lv8 */
gameState.players[0].mz=[hw,lv8];gameState.players[0].lp=4000;
let chw=C(0,hw,'mz',0);
ok('ヒール・ウェーバー positive: 他の表側モンスターがいれば発動できる',sc('ヒール・ウェーバー').condition(chw)===true);
pickNamed(BIG);
sc('ヒール・ウェーバー').selectTargets(chw,r=>{chw.selectedTargets=r;});
sc('ヒール・ウェーバー').resolve(chw);
ok('ヒール・ウェーバー positive: レベル×100回復（8×100）',gameState.players[0].lp===4800,'lp='+gameState.players[0].lp);
pickFirst();
reset0();
let hw2=mk('ヒール・ウェーバー',0);gameState.players[0].mz=[hw2];
ok('ヒール・ウェーバー negative: 他のモンスターがいなければ発動できない',
   sc('ヒール・ウェーバー').condition(C(0,hw2,'mz',0))===false);

/* --- ヴォルカニック・エッジ --- */
reset0();
let ve=mk('ヴォルカニック・エッジ',0);
gameState.players[0].mz=[ve];
let lpV=gameState.players[1].lp;
let cve=C(0,ve,'mz',0);
ok('ヴォルカニック・エッジ negative: 発動前は攻撃できる',cannotAttackNow(ve)===false);
sc('ヴォルカニック・エッジ').resolve(cve);
ok('ヴォルカニック・エッジ positive: 相手に500ダメージ',gameState.players[1].lp===lpV-500);
ok('ヴォルカニック・エッジ ruling: 発動したターンは攻撃できない',cannotAttackNow(ve)===true);
ok('ヴォルカニック・エッジ ruling: 1ターンに1度',sc('ヴォルカニック・エッジ').countLimit===1);

/* --- リターン・ゾンビ --- */
reset0();
let rz=mk('リターン・ゾンビ',0);
gameState.players[0].grave=[rz];gameState.players[0].hand=[];gameState.players[0].lp=4000;
let crz=C(0,rz,'grave',0,'onStandbyPhase',{event:{}});
ok('リターン・ゾンビ positive: 手札0・墓地にあれば誘発する',sc('リターン・ゾンビ').passive.onStandbyPhase(crz)===true);
sc('リターン・ゾンビ').cost(crz,()=>{});
ok('リターン・ゾンビ positive: 500ライフを払う',gameState.players[0].lp===3500);
sc('リターン・ゾンビ').resolve(crz);
ok('リターン・ゾンビ positive: 手札に加わる',gameState.players[0].hand.some(c=>c&&c.uid===rz.uid));
reset0();
let rz2=mk('リターン・ゾンビ',0);
gameState.players[0].grave=[rz2];gameState.players[0].hand=[mk(PLAIN,0)];
ok('リターン・ゾンビ negative: 手札があれば誘発しない',
   sc('リターン・ゾンビ').passive.onStandbyPhase(C(0,rz2,'grave',0,'onStandbyPhase',{event:{}}))===false);

/* --- 不死式冥界砲 --- */
reset0();
let fh=mk('不死式冥界砲',0,'up');
gameState.players[0].sz=[fh];
let undead=mk(PLAIN,0);   /* ワイト＝アンデット族 */
gameState.players[0].mz=[undead];
let cfh=C(0,fh,'sz',0,'onSpecialSummon',{event:{player:0,card:undead,uid:undead.uid,kind:'effect'}});
ok('不死式冥界砲 positive: アンデットが特殊召喚されたら誘発する',
   sc('不死式冥界砲').passive.onSpecialSummon(cfh)===true);
let lpF=gameState.players[1].lp;
sc('不死式冥界砲').resolve(cfh);
ok('不死式冥界砲 positive: 相手に800ダメージ',gameState.players[1].lp===lpF-800);
ok('不死式冥界砲 ruling: 1ターンに1度',sc('不死式冥界砲').countLimit===1);
reset0();
let fh2=mk('不死式冥界砲',0,'up');gameState.players[0].sz=[fh2];
let nonUndead=mk(BIG,0);gameState.players[0].mz=[nonUndead];
ok('不死式冥界砲 negative: アンデット族以外では誘発しない',
   sc('不死式冥界砲').passive.onSpecialSummon(
     C(0,fh2,'sz',0,'onSpecialSummon',{event:{player:0,card:nonUndead,uid:nonUndead.uid}}))===false);

/* --- 天空の泉 --- */
reset0();
let ti=mk('天空の泉',0,'up');
gameState.players[0].sz=[ti];
let lightM=mk(BIG,0),killer=mk(BIG,1);   /* 光属性 ATK3000 */
gameState.players[0].mz=[lightM];gameState.players[1].mz=[killer];
gameState.players[0].lp=4000;
lightM.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cti=C(0,ti,'sz',0);
ok('天空の泉 positive: 戦闘破壊された光属性が墓地にいれば発動できる',sc('天空の泉').condition(cti)===true);
sc('天空の泉').selectTargets(cti,r=>{cti.selectedTargets=r;});
sc('天空の泉').resolve(cti);
ok('天空の泉 positive: 除外して攻撃力分回復する',
   gameState.players[0].lp===7000&&gameState.players[0].banish.some(c=>c&&c.uid===lightM.uid),
   'lp='+gameState.players[0].lp);
reset0();
let ti2=mk('天空の泉',0,'up');gameState.players[0].sz=[ti2];
let darkM=mk(DARKM,0),k2=mk(BIG,1);
gameState.players[0].mz=[darkM];gameState.players[1].mz=[k2];
darkM.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
ok('天空の泉 negative: 光属性以外は対象にできない',sc('天空の泉').condition(C(0,ti2,'sz',0))===false);

/* --- 墓荒らしの報い --- */
reset0();
let hm=mk('墓荒らしの報い',0,'up');
gameState.players[0].sz=[hm];
gameState.players[1].banish=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
let chm=C(0,hm,'sz',0,'onStandbyPhase',{event:{}});
ok('墓荒らしの報い positive: 除外された相手モンスターがあれば誘発する',
   sc('墓荒らしの報い').passive.onStandbyPhase(chm)===true);
let lpH=gameState.players[1].lp;
sc('墓荒らしの報い').resolve(chm);
ok('墓荒らしの報い positive: 数×100ダメージ（3×100）',gameState.players[1].lp===lpH-300);

/* --- 呪魂の仮面 --- */
reset0();
let jm=mk('呪魂の仮面',0,'up'),eqMon=mk(BIG,1);   /* 相手のモンスターに装備 */
gameState.players[0].sz=[jm];gameState.players[1].mz=[eqMon];equipTo(jm,eqMon);
ok('呪魂の仮面 positive: 装備モンスターは攻撃できない',cannotAttackNow(eqMon)===true);
let cjm=C(0,jm,'sz',0,'onStandbyPhase',{event:{}});
ok('呪魂の仮面 positive: 自分のスタンバイフェイズで誘発する',sc('呪魂の仮面').passive.onStandbyPhase(cjm)===true);
let lpJ=gameState.players[1].lp;
sc('呪魂の仮面').resolve(cjm);
ok('呪魂の仮面 ruling: ダメージを受けるのは装備モンスターのコントローラー',
   gameState.players[1].lp===lpJ-500,'lp='+gameState.players[1].lp);

/* --- 強奪 --- */
reset0();
gameState.activePlayer=1;   /* 相手ターン */
let go=mk('強奪',0,'up'),stolen=mk(BIG,0);
gameState.players[0].sz=[go];gameState.players[0].mz=[stolen];equipTo(go,stolen);
let cgo=C(0,go,'sz',0,'onStandbyPhase',{event:{}});
ok('強奪 positive: 相手のスタンバイフェイズで誘発する',sc('強奪').passive.onStandbyPhase(cgo)===true);
let lpG=gameState.players[1].lp;
sc('強奪').resolve(cgo);
ok('強奪 positive: 相手が1000回復する',gameState.players[1].lp===lpG+1000,'lp='+gameState.players[1].lp);
reset0();
gameState.activePlayer=0;
let go2=mk('強奪',0,'up'),st2=mk(BIG,0);
gameState.players[0].sz=[go2];gameState.players[0].mz=[st2];equipTo(go2,st2);
ok('強奪 negative: 自分のスタンバイフェイズでは誘発しない',
   sc('強奪').passive.onStandbyPhase(C(0,go2,'sz',0,'onStandbyPhase',{event:{}}))===false);

/* --- リーフ・フェアリー --- */
reset0();
let lf=mk('リーフ・フェアリー',0),eq=mk('呪魂の仮面',0,'up');
gameState.players[0].mz=[lf];gameState.players[0].sz=[eq];equipTo(eq,lf);
let clf=C(0,lf,'mz',0);
ok('リーフ・フェアリー positive: 装備カードがあれば発動できる',sc('リーフ・フェアリー').condition(clf)===true);
sc('リーフ・フェアリー').cost(clf,()=>{});
ok('リーフ・フェアリー positive: コストで装備カードが墓地へ送られる',
   gameState.players[0].grave.some(c=>c&&c.uid===eq.uid));
let lpL=gameState.players[1].lp;
sc('リーフ・フェアリー').resolve(clf);
ok('リーフ・フェアリー positive: 相手に500ダメージ',gameState.players[1].lp===lpL-500);
reset0();
let lf2=mk('リーフ・フェアリー',0);gameState.players[0].mz=[lf2];
ok('リーフ・フェアリー negative: 装備カードが無ければ発動できない',
   sc('リーフ・フェアリー').condition(C(0,lf2,'mz',0))===false);

/* ================= Replay / SaveLoad ================= */
reset0();
let rc=mk('ライライダー',0),rf=mk(BIG,1);
gameState.players[0].mz=[rc];gameState.players[1].mz=[rf];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(rf),'b0RaiLock',rf.summonedTurn,'ライライダー');
let a1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle08 Replay: フィールド1度フラグが digest 一致で再生される',a1.ok,a1.reason||'');
ok('cycle08 Replay: 再生後も攻撃制限が一致する',cannotAttackNow(rf)===true);
reset0();
let rj=mk('ジャッカルの霊騎士',0),rp=mk(PLAIN,1);
gameState.players[0].mz=[rj];gameState.players[1].grave=[rp];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.specialSummon(0,'grave',0,'def','ジャッカルの霊騎士',1);
let pkg=v41ReplayPackage(gameState);
let replayed=JSON.parse(JSON.stringify(pkg.initialState));
pkg.actions.forEach(j=>applyAction(replayed,JSON.parse(JSON.stringify(j.action||j))));
ok('cycle08 Replay: 相手墓地からの特殊召喚が Journal 再適用で再現される',
   replayed.players[0].mz.some(c=>c&&c.uid===rp.uid));
ok('cycle08 Replay: 取り出し元プレイヤー（v30 B2）も一致する',
   replayed.players[0].mz[replayed.players[0].mz.length-1].specialSummonedFromPlayer===1);
let snap=JSON.stringify(gameState);
ok('cycle08 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
