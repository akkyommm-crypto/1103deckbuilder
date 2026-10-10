/* DestructionProtection recovery batch — 24枚の positive / negative / ruling edge case。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];globalThis.__R=R;const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function h(c){ return locateCardAnyV4(c); }
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
function ctxAt(card,zone,ev,extra){const loc=h(card);
  const c=makeContext(0,card,zone||(loc&&loc.zone)||'sz',(loc&&loc.index)||0,ev||'activate',extra||{});
  if(extra&&extra.event)c.event=extra.event; return c;}
function run(e,c){if(e.cost){let p=false;e.cost(c,v=>{p=v;});} if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c);}
function attack(atkIdx,tgtIdx){ act({type:"ATTACK", player:0, atkIdx, target:tgtIdx}); act({type:"BATTLE_CLEANUP"}); }
function attackBy(p,atkIdx,tgtIdx){ act({type:"ATTACK", player:p, atkIdx, target:tgtIdx}); act({type:"BATTLE_CLEANUP"}); }
function inMz(p,c){ return (gameState.players[p].mz||[]).some(x=>x&&x.uid===c.uid); }
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
/* 小道具はスクリプトを持たない通常モンスターだけを使う（fixture 誤昇格を避ける）。 */
const BIG='ヂェミナイ・エルフ';       /* 攻1900 */
const SMALL='おジャマ・イエロー';        /* 攻 0 lv2 */
const HUGE='サファイアドラゴン';       /* 攻1900 */
const SPELL='サイクロン';                /* チェーン元に使う魔法 */
function db(n){ return CARD_DB[findCardIndex(n)]; }

const NAMES=['シールド・ウィング','ダーク・リゾネーター','マッシブ・ウォリアー','ゴゴゴゴーレム',
 'ナチュル・ビーンズ','ロードランナー','氷結界の修験者','翻弄するエルフの剣士','氷弾使いレイス',
 '異次元竜 トワイライトゾーンドラゴン','リボーン・ゾンビ','インフェルニティ・ガーディアン',
 'クロック・リゾネーター','深海王デビルシャーク','ジュラック・ブラキス','ブラックポータン',
 'アマゾネス女王','騎士道精神','暴走闘君','氷結界の大僧正','エナジー・ブレイブ',
 '融合武器ムラサメブレード','皇の波動','キャッスル・ゲート'];
NAMES.forEach(n=>ok('v21 registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 小道具が DB にある',!!db(BIG)&&!!db(SMALL)&&!!db(HUGE),
   [db(BIG).atk,db(SMALL).atk,db(HUGE).atk].join('/'));

/* =====================================================================
   1. 回数制限つき
   ===================================================================== */
reset0();
let sw=mk('シールド・ウィング',1,'up','def'),atk=mk(BIG,0);
gameState.players[1].mz=[sw];gameState.players[0].mz=[atk];
attack(0,0);
ok('シールド・ウィング positive: 1度目は破壊されない',inMz(1,sw));
atk.attacked=false;atk.attackCount=0;attack(0,0);
ok('シールド・ウィング positive: 2度目も破壊されない',inMz(1,sw));
atk.attacked=false;atk.attackCount=0;attack(0,0);
ok('シールド・ウィング negative: 3度目は破壊される',!inMz(1,sw));
reset0();
let sw2=mk('シールド・ウィング',1,'up','def'),atk2=mk(BIG,0);
gameState.players[1].mz=[sw2];gameState.players[0].mz=[atk2];
attack(0,0);attack(0,0);
gameState.turn++;
atk2.attacked=false;atk2.attackCount=0;attack(0,0);
ok('シールド・ウィング ruling: 次のターンには回数が戻る',inMz(1,sw2));

reset0();
let dr=mk('ダーク・リゾネーター',1,'up','def'),atk3=mk(BIG,0);
gameState.players[1].mz=[dr];gameState.players[0].mz=[atk3];
attack(0,0);
ok('ダーク・リゾネーター positive: 1ターンに1度は破壊されない',inMz(1,dr));
atk3.attacked=false;atk3.attackCount=0;attack(0,0);
ok('ダーク・リゾネーター negative: 2度目は破壊される',!inMz(1,dr));
reset0();
let dr2=mk('ダーク・リゾネーター',1);gameState.players[1].mz=[dr2];
API.destroy(h(dr2),'テスト');
ok('ダーク・リゾネーター ruling: 効果破壊は防がない',!inMz(1,dr2));

reset0();
let mw=mk('マッシブ・ウォリアー',1,'up','def'),atk4=mk(BIG,0);
gameState.players[1].mz=[mw];gameState.players[0].mz=[atk4];
attack(0,0);
ok('マッシブ・ウォリアー positive: 1ターンに1度は破壊されない',inMz(1,mw));

reset0();
let gg=mk('ゴゴゴゴーレム',1,'up','def'),atk5=mk(BIG,0);
gameState.players[1].mz=[gg];gameState.players[0].mz=[atk5];
attack(0,0);
ok('ゴゴゴゴーレム positive: 守備表示なら破壊されない',inMz(1,gg));
reset0();
let gg2=mk('ゴゴゴゴーレム',1,'up','atk'),atk6=mk(HUGE,0);
gameState.players[1].mz=[gg2];gameState.players[0].mz=[atk6];
attack(0,0);
ok('ゴゴゴゴーレム negative: 攻撃表示では守られない',!inMz(1,gg2),
   'atk '+curATK(atk6)+' vs '+curATK(gg2));

reset0();
let nb=mk('ナチュル・ビーンズ',1,'up','def'),atk7=mk(BIG,0);
gameState.players[1].mz=[nb];gameState.players[0].mz=[atk7];
let lpBefore=gameState.players[0].lp;
attack(0,0);
ok('ナチュル・ビーンズ positive: 1ターンに1度は破壊されない',inMz(1,nb));
let eNb=eff('ナチュル・ビーンズ');
let cNb=ctxAt(nb,'mz','onAttackDeclare',{event:{player:0,defenderUid:nb.uid}});
cNb.player=1;cNb.opponent=0;
ok('ナチュル・ビーンズ positive: 攻撃対象になった時に誘発する',eNb.condition(cNb)===true);
eNb.operation(cNb);
ok('ナチュル・ビーンズ positive: 相手に500ダメージ',gameState.players[0].lp===lpBefore-500);
ok('ナチュル・ビーンズ negative: 別のモンスターが対象なら誘発しない',
   eNb.condition(ctxAt(nb,'mz','onAttackDeclare',{event:{player:0,defenderUid:atk7.uid}}))===false);

/* =====================================================================
   2. 戦闘相手を見る条件
   ===================================================================== */
[['ロードランナー'],['氷結界の修験者'],['翻弄するエルフの剣士']].forEach(([nm])=>{
  reset0();
  let m=mk(nm,1,'up','def'),a=mk(BIG,0);
  gameState.players[1].mz=[m];gameState.players[0].mz=[a];
  attack(0,0);
  ok(nm+' positive: 攻撃力1900以上との戦闘では破壊されない',inMz(1,m),'foe '+curATK(a));
  reset0();
  m=mk(nm,1,'up','def');let weak=mk(SMALL,0);
  gameState.players[1].mz=[m];gameState.players[0].mz=[weak];
  addStatModV14(h(weak),{kind:'setAtk',atk:1800,until:'endTurn',label:'テスト'});
  addStatModV14(h(m),{kind:'setDef',def:0,until:'endTurn',label:'テスト'});
  attack(0,0);
  ok(nm+' negative: 攻撃力1900未満との戦闘では守られない',!inMz(1,m),'foe '+curATK(weak));
});

reset0();
let wr=mk('氷弾使いレイス',1,'up','def'),lv4=mk(BIG,0);
gameState.players[1].mz=[wr];gameState.players[0].mz=[lv4];
ok('前提: 小道具はレベル4',curLV(lv4)===4);
attack(0,0);
ok('氷弾使いレイス positive: レベル4以上との戦闘では破壊されない',inMz(1,wr));
reset0();
let wr2=mk('氷弾使いレイス',1,'up','def'),lv3=mk(SMALL,0);
gameState.players[1].mz=[wr2];gameState.players[0].mz=[lv3];
addStatModV14(h(lv3),{kind:'setAtk',atk:1000,until:'endTurn',label:'テスト'});
addStatModV14(h(wr2),{kind:'setDef',def:0,until:'endTurn',label:'テスト'});
ok('前提: 攻撃者はレベル3以下',curLV(lv3)<=3);
attack(0,0);
ok('氷弾使いレイス negative: レベル3との戦闘では守られない',!inMz(1,wr2),'lv '+curLV(lv3));

reset0();
let tz=mk('異次元竜 トワイライトゾーンドラゴン',1,'up','def'),weak2=mk(BIG,0);
gameState.players[1].mz=[tz];gameState.players[0].mz=[weak2];
addStatModV14(h(tz),{kind:'setDef',def:0,until:'endTurn',label:'テスト'});
attack(0,0);
ok('異次元竜 positive: 攻撃力1900以下との戦闘では破壊されない',inMz(1,tz),'foe '+curATK(weak2));
reset0();
let tz2=mk('異次元竜 トワイライトゾーンドラゴン',1,'up','def'),strong=mk(BIG,0);
gameState.players[1].mz=[tz2];gameState.players[0].mz=[strong];
addStatModV14(h(strong),{kind:'setAtk',atk:1901,until:'endTurn',label:'テスト'});
addStatModV14(h(tz2),{kind:'setDef',def:0,until:'endTurn',label:'テスト'});
attack(0,0);
ok('異次元竜 negative: 攻撃力1901との戦闘では守られない',!inMz(1,tz2),'foe '+curATK(strong));
reset0();
let tz3=mk('異次元竜 トワイライトゾーンドラゴン',1),sp=mk(SPELL,0);
gameState.players[1].mz=[tz3];gameState.players[0].sz=[sp];ensureCardUid(gameState,sp);
act({type:'CHAIN_ADD',player:0,cardId:sp.id,uid:sp.uid,name:SPELL,from:'sz',index:0,targets:[]});
API.destroy(h(tz3),'テスト');
ok('異次元竜 positive: 対象を取らない効果では破壊されない',inMz(1,tz3));
gameState.chain[gameState.chain.length-1].targets=[{p:1,zone:'mz',index:0,uid:tz3.uid}];
API.destroy(h(tz3),'テスト');
ok('異次元竜 negative: 対象を取る効果では守られない',!inMz(1,tz3));

/* =====================================================================
   3. 自分の状況を見る条件
   ===================================================================== */
reset0();
let rz=mk('リボーン・ゾンビ',1,'up','atk'),atk8=mk(BIG,0);
gameState.players[1].mz=[rz];gameState.players[0].mz=[atk8];gameState.players[1].hand=[];
attack(0,0);
ok('リボーン・ゾンビ positive: 手札0枚で攻撃表示なら破壊されない',inMz(1,rz));
reset0();
let rz2=mk('リボーン・ゾンビ',1,'up','atk'),atk9=mk(BIG,0);
gameState.players[1].mz=[rz2];gameState.players[0].mz=[atk9];gameState.players[1].hand=[mk(BIG,1)];
attack(0,0);
ok('リボーン・ゾンビ negative: 手札があれば守られない',!inMz(1,rz2));
reset0();
let rz3=mk('リボーン・ゾンビ',1,'up','def'),atkA=mk(BIG,0);
gameState.players[1].mz=[rz3];gameState.players[0].mz=[atkA];gameState.players[1].hand=[];
addStatModV14(h(rz3),{kind:'setDef',def:0,until:'endTurn',label:'テスト'});
attack(0,0);
ok('リボーン・ゾンビ negative: 守備表示では守られない',!inMz(1,rz3));

reset0();
let ig=mk('インフェルニティ・ガーディアン',1);
gameState.players[1].mz=[ig];gameState.players[1].hand=[];
API.destroy(h(ig),'テスト');
ok('インフェルニティ・ガーディアン positive: 手札0枚なら効果破壊されない',inMz(1,ig));
let atkB=mk(BIG,0);gameState.players[0].mz=[atkB];
ig.pos='def';addStatModV14(h(ig),{kind:'setDef',def:0,until:'endTurn',label:'テスト'});
attack(0,0);
ok('インフェルニティ・ガーディアン positive: 戦闘でも破壊されない',inMz(1,ig));
gameState.players[1].hand=[mk(BIG,1)];
API.destroy(h(ig),'テスト');
ok('インフェルニティ・ガーディアン negative: 手札があれば守られない',!inMz(1,ig));

reset0();
let cr=mk('クロック・リゾネーター',1,'up','def');
gameState.players[1].mz=[cr];
API.destroy(h(cr),'テスト');
ok('クロック・リゾネーター positive: 表側守備なら1度は効果破壊されない',inMz(1,cr));
API.destroy(h(cr),'テスト');
ok('クロック・リゾネーター negative: 同じターンの2度目は破壊される',!inMz(1,cr));
reset0();
let cr2=mk('クロック・リゾネーター',1,'up','atk');
gameState.players[1].mz=[cr2];
API.destroy(h(cr2),'テスト');
ok('クロック・リゾネーター negative: 攻撃表示では守られない',!inMz(1,cr2));

reset0();
let ds=mk('深海王デビルシャーク',1),sp2=mk(SPELL,0);
gameState.players[1].mz=[ds];gameState.players[0].sz=[sp2];ensureCardUid(gameState,sp2);
act({type:'CHAIN_ADD',player:0,cardId:sp2.id,uid:sp2.uid,name:SPELL,from:'sz',index:0,targets:[]});
API.destroy(h(ds),'テスト');
ok('深海王デビルシャーク positive: 対象を取らない効果では1度は破壊されない',inMz(1,ds));
API.destroy(h(ds),'テスト');
ok('深海王デビルシャーク negative: 同じターンの2度目は破壊される',!inMz(1,ds));

reset0();
let jb=mk('ジュラック・ブラキス',1,'up','def'),other=mk('ジュラック・アウロ',1),atkC=mk(BIG,0);
gameState.players[1].mz=[jb,other];gameState.players[0].mz=[atkC];
ok('前提: ジュラックの setcode を引ける',isSetCardV4(dbOf(other),SETCODE.JURRAC));
attack(0,0);
ok('ジュラック・ブラキス positive: 他のジュラックがいれば破壊されない',inMz(1,jb));
reset0();
let jb2=mk('ジュラック・ブラキス',1,'up','def'),atkD=mk(BIG,0);
gameState.players[1].mz=[jb2];gameState.players[0].mz=[atkD];
attack(0,0);
ok('ジュラック・ブラキス negative: 自分以外のジュラックがいなければ守られない',!inMz(1,jb2));

reset0();
let bp=mk('ブラックポータン',1,'up','def'),tuner=mk('ジャンク・シンクロン',1),atkE=mk(BIG,0);
gameState.players[1].mz=[bp,tuner];gameState.players[0].mz=[atkE];
ok('前提: 小道具はチューナー',isTunerNowV17(tuner));
attack(0,0);
ok('ブラックポータン positive: チューナーがいれば破壊されない',inMz(1,bp));
let eBp=eff('ブラックポータン');
let lpB=gameState.players[1].lp;
let cBp=ctxAt(bp,'mz','onLeaveField',{event:{player:1,zone:'mz',face:'up',wasTuner:true}});
cBp.player=1;cBp.opponent=0;
ok('ブラックポータン positive: チューナーが場を離れた時に誘発する',eBp.condition(cBp)===true);
eBp.operation(cBp);
ok('ブラックポータン positive: 800回復する',gameState.players[1].lp===lpB+800);
ok('ブラックポータン negative: チューナーでなければ誘発しない',
   eBp.condition(ctxAt(bp,'mz','onLeaveField',{event:{player:1,zone:'mz',face:'up',wasTuner:false}}))===false);
reset0();
let bp2=mk('ブラックポータン',1,'up','def'),atkF=mk(BIG,0);
gameState.players[1].mz=[bp2];gameState.players[0].mz=[atkF];
attack(0,0);
ok('ブラックポータン negative: チューナーがいなければ守られない',!inMz(1,bp2));

/* =====================================================================
   4. 継続効果で味方へ与える
   ===================================================================== */
reset0();
let aq=mk('アマゾネス女王',1),ama=mk('アマゾネスの吹き矢兵',1,'up','def'),atkG=mk(BIG,0);
gameState.players[1].mz=[aq,ama];gameState.players[0].mz=[atkG];
ok('前提: アマゾネスの setcode を引ける',isSetCardV4(dbOf(ama),SETCODE.AMAZONESS));
attack(0,1);
ok('アマゾネス女王 positive: 自分のアマゾネスは戦闘では破壊されない',inMz(1,ama));
reset0();
let aq2=mk('アマゾネス女王',1),nonAma=mk(SMALL,1,'up','def'),atkH=mk(BIG,0);
gameState.players[1].mz=[aq2,nonAma];gameState.players[0].mz=[atkH];
attack(0,1);
ok('アマゾネス女王 negative: アマゾネス以外は守られない',!inMz(1,nonAma));

reset0();
let ks=mk('騎士道精神',0,'up'),mine=mk(BIG,0),foe=mk(BIG,1);
gameState.players[0].sz=[ks];gameState.players[0].mz=[mine];gameState.players[1].mz=[foe];
ok('前提: 攻撃力が同じ',curATK(mine)===curATK(foe));
attack(0,0);
ok('騎士道精神 positive: 攻撃力が同じなら自分のモンスターは破壊されない',inMz(0,mine));
ok('騎士道精神 ruling: 相手のモンスターは守られない',!inMz(1,foe));
reset0();
let ks2=mk('騎士道精神',0,'up'),mine2=mk(BIG,0),foe2=mk(BIG,1);
gameState.players[0].sz=[ks2];gameState.players[0].mz=[mine2];gameState.players[1].mz=[foe2];
addStatModV14(h(foe2),{kind:'setAtk',atk:2400,until:'endTurn',label:'テスト'});
attack(0,0);
ok('騎士道精神 negative: 攻撃力が違えば守られない',!inMz(0,mine2));

reset0();
let bk=mk('暴走闘君',1,'up');
gameState.players[1].sz=[bk];
API.createToken(1,{name:'テストトークン',key:'v21.testToken',atk:0,def:0,lv:1,at:'闇',ra:'戦士',pos:'atk'},1);
let tok=(gameState.players[1].mz||[])[0];
ok('前提: トークンが出ている',!!tok&&!!tok.token);
ok('暴走闘君 positive: トークンの攻撃力が1000アップする',curATK(tok)===1000,String(curATK(tok)));
let atkI=mk(BIG,0);gameState.players[0].mz=[atkI];
attack(0,0);
ok('暴走闘君 positive: 攻撃表示のトークンは戦闘では破壊されない',
   (gameState.players[1].mz||[]).some(c=>c&&c.token));
reset0();
let bk2=mk('暴走闘君',1,'up'),nonTok=mk(SMALL,1,'up','def'),atkJ=mk(BIG,0);
gameState.players[1].sz=[bk2];gameState.players[1].mz=[nonTok];gameState.players[0].mz=[atkJ];
attack(0,0);
ok('暴走闘君 negative: トークン以外は守られない',!inMz(1,nonTok));

reset0();
let ib=mk('氷結界の大僧正',1),ibm=mk('氷結界の水影',1),sp3=mk(SPELL,0);
gameState.players[1].mz=[ib,ibm];gameState.players[0].sz=[sp3];ensureCardUid(gameState,sp3);
ok('前提: 氷結界の setcode を引ける',isSetCardV4(dbOf(ibm),SETCODE.ICE_BARRIER));
act({type:'CHAIN_ADD',player:0,cardId:sp3.id,uid:sp3.uid,name:SPELL,from:'sz',index:0,targets:[]});
API.destroy(h(ibm),'テスト');
ok('氷結界の大僧正 positive: 魔法カードの効果では自分の氷結界は破壊されない',inMz(1,ibm));
act({type:'CHAIN_CLEAR'});
let tr=mk('D2シールド',0);gameState.players[0].sz=[tr];ensureCardUid(gameState,tr);
act({type:'CHAIN_ADD',player:0,cardId:tr.id,uid:tr.uid,name:'D2シールド',from:'sz',index:0,targets:[]});
API.destroy(h(ibm),'テスト');
ok('氷結界の大僧正 ruling: 罠カードの効果でも守られる',inMz(1,ibm));
let eIb=eff('氷結界の大僧正');
reset0();
let ib2=mk('氷結界の大僧正',0,'up','atk');
gameState.players[0].mz=[ib2];
let cIb=ctxAt(ib2,'mz','onNormalSummon');
ok('氷結界の大僧正 positive: 攻撃表示なら守備表示への変更が誘発する',eIb.condition(cIb)===true);
eIb.operation(cIb);
ok('氷結界の大僧正 positive: 守備表示になる',gameState.players[0].mz[0].pos==='def');
ok('氷結界の大僧正 negative: 既に守備表示なら誘発しない',
   eIb.condition(ctxAt(ib2,'mz','onNormalSummon'))===false);

reset0();
let eb=mk('エナジー・ブレイブ',1,'up'),dual=mk('ギガプラント',1);
gameState.players[1].sz=[eb];gameState.players[1].mz=[dual];
dual.dualUp=true;
API.destroy(h(dual),'テスト');
ok('エナジー・ブレイブ positive: 再度召喚したデュアルは効果破壊されない',inMz(1,dual));
delete dual.dualUp;
API.destroy(h(dual),'テスト');
ok('エナジー・ブレイブ negative: 再度召喚していなければ守られない',!inMz(1,dual));

/* =====================================================================
   5. 装備・エクシーズ・チェーン応答
   ===================================================================== */
reset0();
let mb=mk('融合武器ムラサメブレード',0),war=mk('D.D.アサイラント',0);
gameState.players[0].sz=[mb];gameState.players[0].mz=[war];
let eMb=eff('融合武器ムラサメブレード');
ok('融合武器ムラサメブレード positive: 戦士族がいれば発動できる',eMb.condition(ctxAt(mb,'sz'))===true);
let atkWar=curATK(war);
run(eMb,ctxAt(mb,'sz'));
ok('融合武器ムラサメブレード positive: 装備モンスターの攻撃力が800アップ',
   curATK(war)===atkWar+800,String(curATK(war)));
API.destroy(h(mb),'テスト');
ok('融合武器ムラサメブレード positive: 装備中は効果破壊されない',
   (gameState.players[0].sz||[]).some(c=>c&&c.uid===mb.uid));
reset0();
let mb2=mk('融合武器ムラサメブレード',0),nonWar=mk(SMALL,0);
gameState.players[0].sz=[mb2];gameState.players[0].mz=[nonWar];
ok('融合武器ムラサメブレード negative: 戦士族がいなければ発動できない',
   eMb.condition(ctxAt(mb2,'sz'))===false);
API.destroy(h(mb2),'テスト');
ok('融合武器ムラサメブレード negative: 装備していなければ守られない',
   !(gameState.players[0].sz||[]).some(c=>c&&c.uid===mb2.uid));

reset0();
let kh=mk('皇の波動',0,'down'),xyz=mk('No.17 リバイス・ドラゴン',0);
gameState.players[0].sz=[kh];gameState.players[0].mz=[xyz];
xyz.xyz=[mk(SMALL,0),mk(SMALL,0)];
let eKh=eff('皇の波動');
ok('皇の波動 positive: 素材のあるエクシーズがあれば発動できる',eKh.condition(ctxAt(kh,'sz'))===true);
/* S03-U114: with 2 materials the cost asks which one to detach (before: always the first) */
{const c=ctxAt(kh,'sz');let paid=false;eKh.cost(c,v=>{paid=v;});
 const pcK=pendingChoiceV49(gameState);
 ok('皇の波動 positive: 素材2つなら取り除く素材を選ばせる',!!pcK&&/取り除くX素材/.test(pcK.title||'')&&pcK.candidates.length===2,JSON.stringify(pcK&&pcK.title));
 if(pcK)__choicePickV49(1);
 if(eKh.target)eKh.target(c,r=>{c.selectedTargets=r;}); if(paid!==false)eKh.operation(c);}
ok('皇の波動 positive: 素材を1つ取り除く',(xyz.xyz||[]).length===1);
API.destroy(h(xyz),'テスト');
ok('皇の波動 positive: 自分のエクシーズは効果破壊されない',inMz(0,xyz));
clearExpiredMods(gameState,'endPhase');
API.destroy(h(xyz),'テスト');
ok('皇の波動 ruling: エンドフェイズで耐性が切れる',!inMz(0,xyz));
reset0();
let kh2=mk('皇の波動',0,'down'),xyz2=mk('No.17 リバイス・ドラゴン',0);
gameState.players[0].sz=[kh2];gameState.players[0].mz=[xyz2];
ok('皇の波動 negative: 素材が無ければ発動できない',eKh.condition(ctxAt(kh2,'sz'))===false);

/* =====================================================================
   6. 無条件耐性 + リリースコスト
   ===================================================================== */
reset0();
let cg=mk('キャッスル・ゲート',0,'up','atk'),fodder=mk(SMALL,0),atkK=mk(BIG,1);
gameState.players[0].mz=[cg,fodder];gameState.players[1].mz=[atkK];
attackBy(1,0,0);
ok('キャッスル・ゲート positive: 戦闘では破壊されない',inMz(0,cg));
let eCg=eff('キャッスル・ゲート');
let cCg=ctxAt(cg,'mz');
ok('キャッスル・ゲート positive: レベル5以下がいれば発動できる',eCg.condition(cCg)===true);
let foeLp=gameState.players[1].lp, fodderAtk=db(SMALL).atk;
run(eCg,cCg);
ok('キャッスル・ゲート positive: リリースした元々の攻撃力分のダメージ',
   gameState.players[1].lp===foeLp-fodderAtk,
   'lp '+gameState.players[1].lp+' expect '+(foeLp-fodderAtk));
ok('キャッスル・ゲート negative: 同じターンに2度は使えない',
   eCg.condition(ctxAt(cg,'mz'))===false);
reset0();
let cg2=mk('キャッスル・ゲート',0,'up','def');
gameState.players[0].mz=[cg2,mk(SMALL,0)];
ok('キャッスル・ゲート negative: 守備表示では発動できない',
   eCg.condition(ctxAt(cg2,'mz'))===false);

/* =====================================================================
   7. Replay / SaveLoad / 直列化
   ===================================================================== */
reset0();
let rSw=mk('シールド・ウィング',1,'up','def'),rAtk=mk(BIG,0);
let rXyz=mk('No.17 リバイス・ドラゴン',0);
gameState.players[1].mz=[rSw];gameState.players[0].mz=[rAtk,rXyz];
/* 盤面を作ってから Journal を初期化する。
   以降の変化はすべて Action 経由なので Replay で再現できる。 */
v41ResetActionJournal(gameState);
attack(0,0);
API.grantProtection(h(rXyz),{effect:true,until:'endPhase',key:'v21.test',label:'テスト'});
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 耐性の消費と付与が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('直列化: 耐性の記録は純JSON',assertProtSerializableV21(gameState)===null,
   String(assertProtSerializableV21(gameState)));

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);console.error('LAST:',(c.__R||[]).length);process.exit(1);}
