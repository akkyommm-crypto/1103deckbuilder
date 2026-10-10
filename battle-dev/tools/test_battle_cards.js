/* Battle recovery batch — 40枚の positive / negative / ruling edge case。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let __u=98000;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos,uid:__u++};}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='battle';gameState.turn=3;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
/* S03-U62: some cards now open a real (SaveLoad-safe) API.requestChoice pending choice instead of the
   old synchronous API.selectCard closure the reset0() stub above intercepts. Auto-answer any such pending
   choice by always picking the first candidate (matches the stub's own semantics). */
function drain0(){for(let i=0;i<10&&typeof pendingChoiceV49==='function'&&pendingChoiceV49(gameState);i++)__choicePickV49(0);}
function ctxAt(card,zone,ev,extra){const h=locateCardAnyV4(card);
  return makeContext(0,card,zone||(h&&h.zone)||'mz',(h&&h.index)||0,ev||'activate',extra||{});}
/* 戦闘ダメージイベントの payload を作る（engine と同じ形） */
function dmgEvt(o){return makeBattleDamageEventV6(o);}
const BIG='青眼の白龍',MID='ヂェミナイ・エルフ',ROCK='岩石の巨兵';

const NAMES=['BF－鉄鎖のフェーン','エレキンギョ','エレキングコブラ','ドリル・バーニカル','逆巻く炎の精霊',
 'プラズマ・ボール','記憶破壊者','仮面魔道士','吸血コアラ','大盤振舞侍','エレキュア','ポイズン・ファング',
 'セベクの祝福','デスカウンター','ダメージ・コンデンサー','エレキー','威圧する魔眼','財宝への隠し通路',
 'ディスカバード・アタック','ウィルスメール','光学迷彩アーマー','流星の弓－シール','アストラルバリア',
 'トゥーン・ディフェンス','絶体絶命','地縛霊の誘い','ディフェンド・スライム','立ちはだかる強敵',
 'ディメンション・ウォール','ビッグ・ジョーズ','ステルスロイド','惑星からの物体A','剣闘獣セクトル',
 'ハーフorストップ','スピード・ウォリアー','虚栄巨影','ジュラック・モノロフ','神機王ウル','ライノタウルス','闘争本能'];
NAMES.forEach(n=>ok('Battle registration '+n,!!CARD_SCRIPTS[n]));

/* =====================================================================
   直接攻撃の戦闘ダメージで誘発するモンスター
   ===================================================================== */
function directDamageCase(name,setup,check,negName,negEvt){
  reset0();
  const self=mk(name);gameState.players[0].mz=[self];
  if(setup) setup(self);
  v41ResetActionJournal(gameState);
  const e=nativeEffectsV4(name)[0];
  const evt=dmgEvt({to:1,amount:1000,direct:true,attackerUid:self.uid,defenderUid:null,atkOwner:0});
  const c=ctxAt(self,'mz','onDirectBattleDamage',{event:evt});
  ok(name+' positive: 自分が直接攻撃で与えたダメージで誘発する',e.condition(c)===true,JSON.stringify(evt));
  if(check){if(e.target)e.target(c,r=>{c.selectedTargets=r;});e.operation(c);check(self);}
  /* negative: 別のモンスターが与えたダメージでは誘発しない */
  const other=mk(MID);gameState.players[0].mz.push(other);
  const evt2=dmgEvt({to:1,amount:1000,direct:true,attackerUid:other.uid,defenderUid:null,atkOwner:0});
  ok(name+' negative: '+(negName||'他のモンスターが与えたダメージでは誘発しない'),
     e.condition(ctxAt(self,'mz','onDirectBattleDamage',{event:negEvt||evt2}))===false);
}
directDamageCase('BF－鉄鎖のフェーン',
  self=>{gameState.players[1].mz=[mk(MID,1)];},
  self=>{ok('BF－鉄鎖のフェーン: 相手モンスターを守備表示にする',gameState.players[1].mz[0].pos==='def');});
ok('BF－鉄鎖のフェーン ruling: 自身は直接攻撃できる',
   (()=>{reset0();const f=mk('BF－鉄鎖のフェーン');gameState.players[0].mz=[f];
         gameState.players[1].mz=[mk(MID,1)];return API.canDirectAttackNow(f)===true;})());

directDamageCase('エレキンギョ',self=>{gameState.players[1].hand=[mk(MID,1)];},
  self=>{ok('エレキンギョ: 相手が手札を1枚捨てる',gameState.players[1].grave.length===1);});
directDamageCase('エレキングコブラ',self=>{gameState.players[0].deck=[mk('エレキンギョ')];},
  self=>{ok('エレキングコブラ: デッキから「エレキ」を手札に加える',gameState.players[0].hand.length===1);});
ok('エレキングコブラ ruling: 自身は直接攻撃できる',
   (()=>{reset0();const f=mk('エレキングコブラ');gameState.players[0].mz=[f];
         gameState.players[1].mz=[mk(MID,1)];return API.canDirectAttackNow(f)===true;})());
directDamageCase('ドリル・バーニカル',null,
  self=>{ok('ドリル・バーニカル: 攻撃力が1000上がる',curATK(self)===(dbOf(self).atk||0)+1000,'atk='+curATK(self));});
directDamageCase('逆巻く炎の精霊',null,
  self=>{ok('逆巻く炎の精霊: 攻撃力が1000上がる',curATK(self)===(dbOf(self).atk||0)+1000);});
directDamageCase('プラズマ・ボール',null,
  self=>{ok('プラズマ・ボール: 自壊する',gameState.players[0].mz.length===0&&gameState.players[0].grave.length===1);});
directDamageCase('記憶破壊者',self=>{gameState.players[1].ex=[mk(BIG,1),mk(BIG,1)];},
  self=>{ok('記憶破壊者: 融合デッキ枚数×100のダメージ',gameState.players[1].lp===8000-200,'lp='+gameState.players[1].lp);});

/* =====================================================================
   戦闘ダメージ全般で誘発するカード
   ===================================================================== */
reset0();
let mm=mk('仮面魔道士');gameState.players[0].mz=[mm];gameState.players[0].deck=[mk(MID)];
v41ResetActionJournal(gameState);
let e1=nativeEffectsV4('仮面魔道士')[0];
let ev1=dmgEvt({to:1,amount:800,direct:false,attackerUid:mm.uid,defenderUid:null,atkOwner:0});
ok('仮面魔道士 positive: 相手に戦闘ダメージを与えて誘発',e1.condition(ctxAt(mm,'mz','onBattleDamage',{event:ev1}))===true);
e1.operation(ctxAt(mm,'mz','onBattleDamage',{event:ev1}));
ok('仮面魔道士: 1枚ドローする',gameState.players[0].hand.length===1);
ok('仮面魔道士 negative: 自分が受けたダメージでは誘発しない',
   e1.condition(ctxAt(mm,'mz','onBattleDamage',{event:dmgEvt({to:0,amount:800,direct:false,attackerUid:mm.uid,atkOwner:1})}))===false);

reset0();
let ko=mk('吸血コアラ');gameState.players[0].mz=[ko];
v41ResetActionJournal(gameState);
let e2=nativeEffectsV4('吸血コアラ')[0];
let ev2=dmgEvt({to:1,amount:900,direct:false,attackerUid:ko.uid,defenderUid:12345,atkOwner:0});
ok('吸血コアラ positive: モンスターとの戦闘ダメージで誘発',e2.condition(ctxAt(ko,'mz','onBattleDamage',{event:ev2}))===true);
e2.operation(ctxAt(ko,'mz','onBattleDamage',{event:ev2}));
ok('吸血コアラ: 与えたダメージ分回復する',gameState.players[0].lp===8000+900,'lp='+gameState.players[0].lp);
ok('吸血コアラ ruling: 直接攻撃では誘発しない（テキストは「モンスターとの戦闘」）',
   e2.condition(ctxAt(ko,'mz','onBattleDamage',{event:dmgEvt({to:1,amount:900,direct:true,attackerUid:ko.uid,atkOwner:0})}))===false);

reset0();
let sm=mk('大盤振舞侍');gameState.players[0].mz=[sm];
gameState.players[1].hand=[mk(MID,1)];gameState.players[1].deck=[mk(MID,1),mk(MID,1),mk(MID,1),mk(MID,1),mk(MID,1),mk(MID,1),mk(MID,1)];
v41ResetActionJournal(gameState);
let e3=nativeEffectsV4('大盤振舞侍')[0];
let ev3=dmgEvt({to:1,amount:500,direct:true,attackerUid:sm.uid,atkOwner:0});
ok('大盤振舞侍 positive: 相手への戦闘ダメージで誘発',e3.condition(ctxAt(sm,'mz','onBattleDamage',{event:ev3}))===true);
e3.operation(ctxAt(sm,'mz','onBattleDamage',{event:ev3}));
ok('大盤振舞侍: 相手の手札が7枚になる',gameState.players[1].hand.length===7,'hand='+gameState.players[1].hand.length);

reset0();
let ec=mk('エレキュア'),thunder=mk('エレキンギョ');
gameState.players[0].sz=[ec];gameState.players[0].mz=[thunder];
v41ResetActionJournal(gameState);
let e4=nativeEffectsV4('エレキュア')[0];
let ev4=dmgEvt({to:1,amount:700,direct:true,attackerUid:thunder.uid,atkOwner:0});
ok('エレキュア positive: 雷族が与えた戦闘ダメージで誘発',e4.condition(ctxAt(ec,'sz','onBattleDamage',{event:ev4}))===true);
e4.operation(ctxAt(ec,'sz','onBattleDamage',{event:ev4}));
ok('エレキュア: 与えたダメージ分回復する',gameState.players[0].lp===8000+700);
let nonThunder=mk(ROCK);gameState.players[0].mz.push(nonThunder);
ok('エレキュア negative: 雷族以外では誘発しない',
   e4.condition(ctxAt(ec,'sz','onBattleDamage',{event:dmgEvt({to:1,amount:700,direct:true,attackerUid:nonThunder.uid,atkOwner:0})}))===false);

reset0();
let pf=mk('ポイズン・ファング'),beast=mk('吸血コアラ');
gameState.players[0].sz=[pf];gameState.players[0].mz=[beast];
v41ResetActionJournal(gameState);
let e5=nativeEffectsV4('ポイズン・ファング')[0];
let ev5=dmgEvt({to:1,amount:1000,direct:true,attackerUid:beast.uid,atkOwner:0});
ok('ポイズン・ファング positive: 獣族の直接攻撃ダメージで誘発',e5.condition(ctxAt(pf,'sz','onDirectBattleDamage',{event:ev5}))===true);
e5.operation(ctxAt(pf,'sz','onDirectBattleDamage',{event:ev5}));
ok('ポイズン・ファング: 相手に500ダメージ',gameState.players[1].lp===8000-500);
let nonBeast=mk(ROCK);gameState.players[0].mz.push(nonBeast);
ok('ポイズン・ファング negative: 獣族以外では誘発しない',
   e5.condition(ctxAt(pf,'sz','onDirectBattleDamage',{event:dmgEvt({to:1,amount:1000,direct:true,attackerUid:nonBeast.uid,atkOwner:0})}))===false);

reset0();
let sb=mk('セベクの祝福'),att=mk(MID);
gameState.players[0].sz=[sb];gameState.players[0].mz=[att];
v41ResetActionJournal(gameState);
let e6=nativeEffectsV4('セベクの祝福')[0];
let ev6=dmgEvt({to:1,amount:1900,direct:true,attackerUid:att.uid,atkOwner:0});
ok('セベクの祝福 positive: 自分の直接攻撃ダメージで発動できる',e6.condition(ctxAt(sb,'sz','onDirectBattleDamage',{event:ev6}))===true);
e6.operation(ctxAt(sb,'sz','onDirectBattleDamage',{event:ev6}));
ok('セベクの祝福: その数値分回復する',gameState.players[0].lp===8000+1900);
ok('セベクの祝福 negative: 相手が与えたダメージでは発動できない',
   e6.condition(ctxAt(sb,'sz','onDirectBattleDamage',{event:dmgEvt({to:0,amount:1900,direct:true,attackerUid:att.uid,atkOwner:1})}))===false);

reset0();
let dc=mk('デスカウンター'),foeAtt=mk(MID,1);
gameState.players[0].sz=[dc];gameState.players[1].mz=[foeAtt];
v41ResetActionJournal(gameState);
let e7=nativeEffectsV4('デスカウンター')[0];
let ev7=dmgEvt({to:0,amount:1900,direct:true,attackerUid:foeAtt.uid,atkOwner:1});
ok('デスカウンター positive: 直接攻撃したモンスターを特定できる',e7.condition(ctxAt(dc,'sz','onDirectBattleDamage',{event:ev7}))===true);
e7.operation(ctxAt(dc,'sz','onDirectBattleDamage',{event:ev7}));
ok('デスカウンター: そのモンスターを破壊する',gameState.players[1].grave.length===1);
ok('デスカウンター negative: 攻撃者が場にいなければ誘発しない',
   e7.condition(ctxAt(dc,'sz','onDirectBattleDamage',{event:dmgEvt({to:0,amount:100,direct:true,attackerUid:999999,atkOwner:1})}))===false);

reset0();
let cond=mk('ダメージ・コンデンサー');
gameState.players[0].sz=[cond];gameState.players[0].hand=[mk(MID)];
gameState.players[0].deck=[mk(ROCK),mk(BIG)];
v41ResetActionJournal(gameState);
let e8=nativeEffectsV4('ダメージ・コンデンサー')[0];
let ev8=dmgEvt({to:0,amount:1500,direct:true,attackerUid:12345,atkOwner:1});
let c8=ctxAt(cond,'sz','onBattleDamage',{event:ev8});
ok('ダメージ・コンデンサー positive: 自分が受けた戦闘ダメージで発動できる',e8.condition(c8)===true);
let paid=false;e8.cost(c8,v=>{paid=v;});
ok('ダメージ・コンデンサー: 手札1枚を捨てる',paid&&gameState.players[0].grave.length===1);
e8.operation(c8);drain0();
ok('ダメージ・コンデンサー: ダメージ以下の攻撃力を特殊召喚する',
   gameState.players[0].mz.length===1&&(dbOf(gameState.players[0].mz[0]).atk||0)<=1500,
   'mz='+gameState.players[0].mz.length);
ok('ダメージ・コンデンサー ruling: 攻撃力がダメージを超えるモンスターは出せない',
   (()=>{reset0();const cd=mk('ダメージ・コンデンサー');gameState.players[0].sz=[cd];
     gameState.players[0].hand=[mk(MID)];gameState.players[0].deck=[mk(BIG)];
     return nativeEffectsV4('ダメージ・コンデンサー')[0].condition(
       ctxAt(cd,'sz','onBattleDamage',{event:dmgEvt({to:0,amount:1000,direct:true,attackerUid:1,atkOwner:1})}))===false;})());

/* =====================================================================
   直接攻撃の許可
   ===================================================================== */
function directGrantCase(name,poolSetup,targetName){
  reset0();
  const sp=mk(name);gameState.players[0].sz=[sp];
  const t=poolSetup();
  v41ResetActionJournal(gameState);
  const e=nativeEffectsV4(name)[0];
  const c=ctxAt(sp,'sz','activate',{});
  ok(name+' positive: 対象がいれば発動できる',e.condition(c)===true);
  if(e.cost){let p=false;e.cost(c,v=>{p=v;});ok(name+': コストを払える',p===true);}
  if(e.target)e.target(c,r=>{c.selectedTargets=r;});
  e.operation(c);
  const h=findCardByUid(t.uid);
  ok(name+': 対象が直接攻撃できるようになる',!!h&&API.canDirectAttackNow(h.card)===true);
  reset0();
  const sp2=mk(name);gameState.players[0].sz=[sp2];
  ok(name+' negative: 対象がいなければ発動できない',
     nativeEffectsV4(name)[0].condition(ctxAt(sp2,'sz','activate',{}))===false);
}
directGrantCase('エレキー',()=>{const t=mk('エレキンギョ');gameState.players[0].mz=[t];return t;});
directGrantCase('威圧する魔眼',()=>{const t=mk('再生ミイラ');gameState.players[0].mz=[t];return t;});
directGrantCase('財宝への隠し通路',()=>{const t=mk('ハネクリボー');gameState.players[0].mz=[t];return t;});
directGrantCase('ディスカバード・アタック',()=>{
  const t=mk('ジェノサイドキングデーモン');gameState.players[0].mz=[mk('デーモンの召喚'),t];return t;});
ok('威圧する魔眼 ruling: 攻撃力2000超のアンデットは対象外',
   (()=>{reset0();const s=mk('威圧する魔眼');gameState.players[0].sz=[s];
     gameState.players[0].mz=[mk('闇より出でし絶望')];
     return nativeEffectsV4('威圧する魔眼')[0].condition(ctxAt(s,'sz','activate',{}))===false;})());
ok('財宝への隠し通路 ruling: 攻撃力1000超は対象外',
   (()=>{reset0();const s=mk('財宝への隠し通路');gameState.players[0].sz=[s];
     gameState.players[0].mz=[mk(MID)];
     return nativeEffectsV4('財宝への隠し通路')[0].condition(ctxAt(s,'sz','activate',{}))===false;})());

/* ウィルスメール: 許可 + バトルフェイズ終了時に墓地へ */
reset0();
let vm2=mk('ウィルスメール'),lowLv=mk(ROCK);
gameState.players[0].sz=[vm2];gameState.players[0].mz=[lowLv];
v41ResetActionJournal(gameState);
let e9=eff('ウィルスメール','grant-direct-attack-then-grave');
let c9=ctxAt(vm2,'sz','activate',{});
ok('ウィルスメール positive: Lv4以下がいれば発動できる',e9.condition(c9)===true);
e9.target(c9,r=>{c9.selectedTargets=r;});e9.operation(c9);
ok('ウィルスメール: 対象が直接攻撃できる',API.canDirectAttackNow(findCardByUid(lowLv.uid).card)===true);
ok('ウィルスメール: 対象を uid でカード上に記録する',vm2.v6VirusMailUid===lowLv.uid,'flag='+vm2.v6VirusMailUid);
let e9b=eff('ウィルスメール','send-to-grave-at-bp-end');
let c9b=ctxAt(vm2,'sz','onBattlePhaseEnd',{event:{player:0,turn:3}});
ok('ウィルスメール: バトルフェイズ終了時に誘発する',e9b.condition(c9b)===true);
e9b.operation(c9b);
ok('ウィルスメール: 対象が墓地へ送られる',gameState.players[0].mz.length===0&&gameState.players[0].grave.length===1);

/* 装備カードによる直接攻撃許可 */
reset0();
let armor=mk('光学迷彩アーマー'),lv1=mk('ハネクリボー');
gameState.players[0].sz=[armor];gameState.players[0].mz=[lv1];
v41ResetActionJournal(gameState);
let e10=nativeEffectsV4('光学迷彩アーマー')[0];
let c10=ctxAt(armor,'sz','activate',{});
ok('光学迷彩アーマー positive: レベル1がいれば発動できる',e10.condition(c10)===true);
e10.target(c10,r=>{c10.selectedTargets=r;});e10.operation(c10);
ok('光学迷彩アーマー: 装備モンスターが直接攻撃できる',API.canDirectAttackNow(findCardByUid(lv1.uid).card)===true);
ok('光学迷彩アーマー ruling: レベル2以上には装備できない',
   (()=>{reset0();const a=mk('光学迷彩アーマー');gameState.players[0].sz=[a];
     gameState.players[0].mz=[mk(MID)];
     return nativeEffectsV4('光学迷彩アーマー')[0].condition(ctxAt(a,'sz','activate',{}))===false;})());
reset0();
let bow=mk('流星の弓－シール'),any=mk(MID);
gameState.players[0].sz=[bow];gameState.players[0].mz=[any];
v41ResetActionJournal(gameState);
let e11=nativeEffectsV4('流星の弓－シール')[0];
let c11=ctxAt(bow,'sz','activate',{});
e11.target(c11,r=>{c11.selectedTargets=r;});e11.operation(c11);
ok('流星の弓－シール: 装備モンスターが直接攻撃できる',API.canDirectAttackNow(findCardByUid(any.uid).card)===true);
ok('流星の弓－シール: 攻撃力が1000下がる',curATK(findCardByUid(any.uid).card)===1900-1000,
   'atk='+curATK(findCardByUid(any.uid).card));

/* =====================================================================
   攻撃対象の変更・固定
   ===================================================================== */
function redirectCase(name,setup,expect){
  reset0();
  const sp=mk(name);gameState.players[0].sz=[sp];
  const foe=mk(BIG,1),mine=mk(MID);
  gameState.players[1].mz=[foe];gameState.players[0].mz=[mine];
  if(setup) setup(sp,foe,mine);
  v41ResetActionJournal(gameState);
  startBattle(1,0,0);
  const e=nativeEffectsV4(name)[0];
  const c=ctxAt(sp,'sz','onAttackDeclare',{});
  ok(name+' positive: 相手の攻撃宣言に反応できる',e.condition(c)===true);
  if(e.target)e.target(c,r=>{c.selectedTargets=r;});
  e.operation(c);
  expect(sp,foe,mine);
  reset0();
  const sp2=mk(name);gameState.players[0].sz=[sp2];
  ok(name+' negative: 戦闘中でなければ反応できない',
     nativeEffectsV4(name)[0].condition(ctxAt(sp2,'sz','onAttackDeclare',{}))===false);
}
redirectCase('アストラルバリア',null,()=>{
  ok('アストラルバリア: 攻撃が直接攻撃になる',gameState.battle.target==='direct'&&gameState.battle.targetUid===null);});
redirectCase('絶体絶命',(sp,foe,mine)=>{gameState.activePlayer=1;},()=>{
  ok('絶体絶命: 攻撃が直接攻撃になる',gameState.battle.target==='direct');});
redirectCase('地縛霊の誘い',(sp,foe,mine)=>{gameState.players[0].mz.push(mk(ROCK));},
  (sp,foe,mine)=>{ok('地縛霊の誘い: 攻撃対象が選び直される',gameState.battle.targetUid!=null);});
redirectCase('立ちはだかる強敵',null,(sp,foe,mine)=>{
  ok('立ちはだかる強敵: 攻撃対象が固定される',
     gameState.battle.targetUid===mine.uid&&
     findCardByUid(mine.uid).card.battlePermission.attackLockUid===mine.uid);});
reset0();
let td=mk('トゥーン・ディフェンス'),toon=mk('トゥーン・キャノン・ソルジャー');
gameState.players[0].sz=[td];gameState.players[0].mz=[toon];gameState.players[1].mz=[mk(BIG,1)];
v41ResetActionJournal(gameState);startBattle(1,0,0);
let e12=nativeEffectsV4('トゥーン・ディフェンス')[0];
ok('トゥーン・ディフェンス positive: Lv4以下のトゥーンが攻撃対象',
   e12.condition(ctxAt(td,'sz','onAttackDeclare',{}))===true,
   'toonLv='+(dbOf(toon).lv));
reset0();
let td2=mk('トゥーン・ディフェンス');
gameState.players[0].sz=[td2];gameState.players[0].mz=[mk(MID)];gameState.players[1].mz=[mk(BIG,1)];
v41ResetActionJournal(gameState);startBattle(1,0,0);
ok('トゥーン・ディフェンス negative: トゥーンでなければ反応できない',
   nativeEffectsV4('トゥーン・ディフェンス')[0].condition(ctxAt(td2,'sz','onAttackDeclare',{}))===false);
reset0();
let ds=mk('ディフェンド・スライム'),slime=mk('リバイバルスライム'),other2=mk(MID);
gameState.players[0].sz=[ds];gameState.players[0].mz=[other2,slime];gameState.players[1].mz=[mk(BIG,1)];
v41ResetActionJournal(gameState);startBattle(1,0,0);
let e13=nativeEffectsV4('ディフェンド・スライム')[0];
ok('ディフェンド・スライム positive: リバイバルスライムがいれば反応できる',
   e13.condition(ctxAt(ds,'sz','onAttackDeclare',{}))===true);
e13.operation(ctxAt(ds,'sz','onAttackDeclare',{}));
ok('ディフェンド・スライム: 攻撃対象がリバイバルスライムになる',gameState.battle.targetUid===slime.uid);
reset0();
let ds2=mk('ディフェンド・スライム');
gameState.players[0].sz=[ds2];gameState.players[0].mz=[mk(MID)];gameState.players[1].mz=[mk(BIG,1)];
v41ResetActionJournal(gameState);startBattle(1,0,0);
ok('ディフェンド・スライム negative: リバイバルスライムがいなければ反応できない',
   nativeEffectsV4('ディフェンド・スライム')[0].condition(ctxAt(ds2,'sz','onAttackDeclare',{}))===false);

/* 戦闘ダメージの受け手の差し替え */
reset0();
let dw=mk('ディメンション・ウォール'),myMon=mk(ROCK),foeMon=mk(BIG,1);
gameState.players[0].sz=[dw];gameState.players[0].mz=[myMon];gameState.players[1].mz=[foeMon];
v41ResetActionJournal(gameState);startBattle(1,0,0);
let e14=nativeEffectsV4('ディメンション・ウォール')[0];
ok('ディメンション・ウォール positive: 相手の攻撃宣言に反応できる',
   e14.condition(ctxAt(dw,'sz','onAttackDeclare',{}))===true);
e14.operation(ctxAt(dw,'sz','onAttackDeclare',{}));
ok('ディメンション・ウォール: このターンの発動が記録される',dw.v6WallTurn===3);
gameState.battle=null;
act({type:'ATTACK',player:1,atkIdx:0,target:0});
ok('ディメンション・ウォール: 自分が受けるはずのダメージを相手が受ける',
   gameState.players[0].lp===8000&&gameState.players[1].lp===8000-(3000-1300),
   'me='+gameState.players[0].lp+' foe='+gameState.players[1].lp);
ok('ディメンション・ウォール ruling: 受け手の差し替えが lastBattle にも反映される',
   API.lastBattleContext().damagePlayer===1);

/* =====================================================================
   バトルフェイズ終了時
   ===================================================================== */
reset0();
let bj=mk('ビッグ・ジョーズ');gameState.players[0].mz=[bj];gameState.players[1].mz=[mk(ROCK,1)];
v41ResetActionJournal(gameState);
act({type:'ATTACK',player:0,atkIdx:0,target:0});
let e15=nativeEffectsV4('ビッグ・ジョーズ')[0];
ok('ビッグ・ジョーズ positive: 攻撃したので誘発する',
   e15.condition(ctxAt(bj,'mz','onBattlePhaseEnd',{event:{player:0}}))===true);
e15.operation(ctxAt(bj,'mz','onBattlePhaseEnd',{event:{player:0}}));
ok('ビッグ・ジョーズ: 除外される',gameState.players[0].banish.length===1&&gameState.players[0].mz.length===0);
reset0();
let bj2=mk('ビッグ・ジョーズ');gameState.players[0].mz=[bj2];
v41ResetActionJournal(gameState);
ok('ビッグ・ジョーズ negative: 攻撃していなければ誘発しない',
   nativeEffectsV4('ビッグ・ジョーズ')[0].condition(ctxAt(bj2,'mz','onBattlePhaseEnd',{event:{player:0}}))===false);

reset0();
let sr=mk('ステルスロイド'),roid=mk('ジャイロイド');
gameState.players[0].mz=[sr,roid];gameState.players[1].mz=[mk(ROCK,1)];gameState.players[1].sz=[mk('サイクロン',1,'down')];
v41ResetActionJournal(gameState);
act({type:'ATTACK',player:0,atkIdx:0,target:0});
let e16=nativeEffectsV4('ステルスロイド')[0];
let c16=ctxAt(sr,'mz','onBattlePhaseEnd',{event:{player:0}});
ok('ステルスロイド positive: 他の「ロイド」がいて戦闘を行った',e16.condition(c16)===true);
e16.target(c16,r=>{c16.selectedTargets=r;});e16.operation(c16);
ok('ステルスロイド: 魔法・罠を1枚破壊する',gameState.players[1].sz.length===0);
reset0();
let sr2=mk('ステルスロイド');gameState.players[0].mz=[sr2];gameState.players[1].sz=[mk('サイクロン',1,'down')];
v41ResetActionJournal(gameState);
ok('ステルスロイド negative: 他の「ロイド」がいなければ誘発しない',
   nativeEffectsV4('ステルスロイド')[0].condition(ctxAt(sr2,'mz','onBattlePhaseEnd',{event:{player:0}}))===false);

reset0();
let obj=mk('惑星からの物体A'),attacker=mk(MID,1);
gameState.players[0].mz=[obj];gameState.players[1].mz=[attacker];
v41ResetActionJournal(gameState);
act({type:'ATTACK',player:1,atkIdx:0,target:0});
let e17=nativeEffectsV4('惑星からの物体A')[0];
ok('惑星からの物体A positive: 自分を攻撃したモンスターを特定できる',
   API.attackersAgainst(obj).indexOf(attacker.uid)>=0&&
   e17.condition(ctxAt(obj,'mz','onBattlePhaseEnd',{event:{player:1}}))===true,
   JSON.stringify(API.attackersAgainst(obj)));
e17.operation(ctxAt(obj,'mz','onBattlePhaseEnd',{event:{player:1}}));
ok('惑星からの物体A: 攻撃したモンスターのコントロールを得る',
   gameState.players[0].mz.some(x=>x.uid===attacker.uid),'mz='+gameState.players[0].mz.length);
reset0();
let obj2=mk('惑星からの物体A');gameState.players[0].mz=[obj2];
v41ResetActionJournal(gameState);
ok('惑星からの物体A negative: 攻撃されていなければ誘発しない',
   nativeEffectsV4('惑星からの物体A')[0].condition(ctxAt(obj2,'mz','onBattlePhaseEnd',{event:{player:1}}))===false);

reset0();
let sec=mk('剣闘獣セクトル');
gameState.players[0].mz=[sec];gameState.players[1].mz=[mk(ROCK,1)];
gameState.players[0].deck=[mk('剣闘獣アンダル'),mk('剣闘獣エクイテ')];
v41ResetActionJournal(gameState);
act({type:'ATTACK',player:0,atkIdx:0,target:0});
let e18=nativeEffectsV4('剣闘獣セクトル')[0];
/* S03-U180: the 2011 text is 「「剣闘獣」と名のついたモンスターの効果によって特殊召喚したこのカードが戦闘を行ったバトルフェイズ終了時、…2体を特殊召喚
   する」 — only a セクトル summoned by a gladiator effect (gladiatorSummonedS03) triggers, and the player chooses the monsters and their
   positions (journaled choices). The old assertions placed an unmarked セクトル and expected an automatic pick. */
ok('剣闘獣セクトル negative: not summoned by a 「剣闘獣」 effect → no trigger',
   e18.condition(ctxAt(sec,'mz','onBattlePhaseEnd',{event:{player:0}}))===false);
sec.gladiatorSummonedS03=true;
ok('剣闘獣セクトル positive: 戦闘を行いデッキに剣闘獣が2体いる',
   e18.condition(ctxAt(sec,'mz','onBattlePhaseEnd',{event:{player:0}}))===true);
e18.operation(ctxAt(sec,'mz','onBattlePhaseEnd',{event:{player:0}}));
for(let k=0;k<3&&pendingChoiceV49(gameState);k++){const q=pendingChoiceV49(gameState);answerChoiceV49(q.kind==='declare'?['atk']:q.candidates.map(c=>c.key));}
ok('剣闘獣セクトル: 剣闘獣2体を特殊召喚する',gameState.players[0].mz.length===3,'mz='+gameState.players[0].mz.length);

/* =====================================================================
   バトルフェイズ制御・攻撃回数
   ===================================================================== */
reset0();
let hs=mk('ハーフorストップ',0);
gameState.activePlayer=1;
gameState.players[0].sz=[hs];gameState.players[1].mz=[mk(BIG,1),mk(MID,1)];
v41ResetActionJournal(gameState);
let e19=nativeEffectsV4('ハーフorストップ')[0];
let c19=ctxAt(hs,'sz','activate',{});
ok('ハーフorストップ positive: 相手のバトルフェイズに発動できる',e19.condition(c19)===true);
e19.operation(c19);
let pc19=pendingChoiceV49(gameState);
ok('ハーフorストップ: 選ぶのは相手（P1のプレイヤー指定選択）',!!pc19&&pc19.player===1);
ok('ハーフorストップ: 選択待ちは純JSON',assertChoiceSerializableV49(gameState).ok);
answerChoiceV49(['stop']);
ok('ハーフorストップ: バトルフェイズ終了を選ぶと戦闘が終わる',gameState.battlePhaseV6.endedTurn===3);
reset0();
gameState.activePlayer=1;
let hs2=mk('ハーフorストップ');gameState.players[0].sz=[hs2];
let foeA=mk(BIG,1);gameState.players[1].mz=[foeA];
v41ResetActionJournal(gameState);
nativeEffectsV4('ハーフorストップ')[0].operation(ctxAt(hs2,'sz','activate',{}));
answerChoiceV49(['half']);
ok('ハーフorストップ: 攻撃力半分を選ぶと相手モンスターの攻撃力が半分になる',
   curATK(findCardByUid(foeA.uid).card)===1500,'atk='+curATK(findCardByUid(foeA.uid).card));
reset0();
gameState.activePlayer=0;
let hs3=mk('ハーフorストップ');gameState.players[0].sz=[hs3];
ok('ハーフorストップ negative: 自分のターンには発動できない',
   nativeEffectsV4('ハーフorストップ')[0].condition(ctxAt(hs3,'sz','activate',{}))===false);

reset0();
let sw=mk('スピード・ウォリアー');gameState.players[0].mz=[sw];sw.summonedTurn=3;
v41ResetActionJournal(gameState);
let e20=nativeEffectsV4('スピード・ウォリアー')[0];
ok('スピード・ウォリアー positive: 召喚したターンのバトルフェイズに発動できる',
   e20.condition(ctxAt(sw,'mz','activate',{}))===true);
e20.operation(ctxAt(sw,'mz','activate',{}));
ok('スピード・ウォリアー: 攻撃力が元々の攻撃力の倍になる',
   curATK(sw)===(dbOf(sw).atk||0)*2,'atk='+curATK(sw));
sw.summonedTurn=2;
ok('スピード・ウォリアー negative: 召喚したターンでなければ発動できない',
   nativeEffectsV4('スピード・ウォリアー')[0].condition(ctxAt(sw,'mz','activate',{}))===false);

reset0();
let vg=mk('虚栄巨影'),boost=mk(MID);
gameState.players[0].sz=[vg];gameState.players[0].mz=[boost];
v41ResetActionJournal(gameState);
let e21=nativeEffectsV4('虚栄巨影')[0];
let c21=ctxAt(vg,'sz','onAttackDeclare',{});
ok('虚栄巨影 positive: 表側モンスターがいれば発動できる',e21.condition(c21)===true);
e21.target(c21,r=>{c21.selectedTargets=r;});e21.operation(c21);
ok('虚栄巨影: 攻撃力が1000上がる',curATK(boost)===1900+1000);
act({type:'BATTLE_PHASE_V6',player:0,mode:'finish'});
ok('虚栄巨影 ruling: バトルフェイズ終了時に上昇が消える',curATK(boost)===1900,'atk='+curATK(boost));

/* S03-U149: the ability is a continuous rule now (engine/1ZQ attackAllMonstersS03). The old checks exercised a Battle Phase
   trigger that wrote a permission nothing read; these check the rule itself (the real-path attacks: test_s03_u149_attack_all.js). */
function multiAttackCase(name){
  reset0();
  const a=mk(ROCK,1),b=mk(ROCK,1);
  const m=mk(name);gameState.players[0].mz=[m];gameState.players[1].mz=[a,b];
  v41ResetActionJournal(gameState);
  ok(name+' positive: 全てのモンスターに1回ずつ攻撃できる（永続）',attackAllActiveS03(m)===true&&attackAllCanDeclareS03(m)===true);
  noteAttackAllTargetS03(gameState,m,ensureCardUid(gameState,a));
  ok(name+': 1体に攻撃した後も、まだ攻撃していないモンスターに攻撃できる',attackAllCanDeclareS03(m)===true&&!attackAllTargetReasonS03(m,b)&&!!attackAllTargetReasonS03(m,a));
  noteAttackAllTargetS03(gameState,m,ensureCardUid(gameState,b));
  ok(name+' negative: 全てに攻撃した後はもう攻撃できない',attackAllCanDeclareS03(m)===false);
}
multiAttackCase('ジュラック・モノロフ');
multiAttackCase('神機王ウル');
ok('神機王ウル ruling: この戦闘で相手が受ける戦闘ダメージは0',
   (()=>{reset0();const ur=mk('神機王ウル');gameState.players[0].mz=[ur];
     gameState.players[1].mz=[mk(ROCK,1)];v41ResetActionJournal(gameState);
     const before=gameState.players[1].lp;
     act({type:'ATTACK',player:0,atkIdx:0,target:0});
     return gameState.players[1].lp===before;})());

reset0();
let rt=mk('ライノタウルス');gameState.players[0].mz=[rt];
gameState.players[1].mz=[mk(ROCK,1),mk(ROCK,1)];
v41ResetActionJournal(gameState);
let e22=nativeEffectsV4('ライノタウルス')[0];
ok('ライノタウルス negative: 破壊数が2未満では誘発しない',
   e22.condition(ctxAt(rt,'mz','onBattleDestroy',{event:{}}))===false);
gameState.battlePhaseV6.destroyedThisPhase=2;rt.attackCount=1;
ok('ライノタウルス positive: このバトルフェイズに2体以上破壊した',
   e22.condition(ctxAt(rt,'mz','onBattleDestroy',{event:{}}))===true);
e22.operation(ctxAt(rt,'mz','onBattleDestroy',{event:{}}));
ok('ライノタウルス: 攻撃可能回数が増える',Number(findCardByUid(rt.uid).card.attackLimit)>=2);

reset0();
let ti=mk('闘争本能');gameState.players[0].sz=[ti];
gameState.players[0].hand=[mk('吸血コアラ')];gameState.players[1].mz=[mk(MID,1)];
v41ResetActionJournal(gameState);
startBattle(1,0,'direct');
let e23=nativeEffectsV4('闘争本能')[0];
ok('闘争本能 positive: 相手の直接攻撃宣言時に発動できる',
   e23.condition(ctxAt(ti,'sz','onAttackDeclare',{}))===true);
e23.operation(ctxAt(ti,'sz','onAttackDeclare',{}));drain0();
ok('闘争本能: 手札から獣族を特殊召喚する',gameState.players[0].mz.length===1);
reset0();
let ti2=mk('闘争本能');gameState.players[0].sz=[ti2];
gameState.players[0].hand=[mk('吸血コアラ')];gameState.players[0].mz=[mk(MID)];
gameState.players[1].mz=[mk(MID,1)];
v41ResetActionJournal(gameState);startBattle(1,0,0);
ok('闘争本能 negative: 直接攻撃でなければ発動できない',
   nativeEffectsV4('闘争本能')[0].condition(ctxAt(ti2,'sz','onAttackDeclare',{}))===false);

ok('Battle cards: 盤面はJSON直列化できる',!!JSON.stringify(gameState));
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}

