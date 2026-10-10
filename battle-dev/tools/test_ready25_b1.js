/* Class A bulk 50 — READY25 batch 1 / 除去・バーン・ステータス。positive / negative / ruling edge。 */
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
const TRAP='落とし穴';           /* 罠 */
const SPELL='サイクロン';         /* 魔法 */
const FIELD='王家の眠る谷－ネクロバレー'; /* TESTED・フィールド魔法 */
const EFFMON='キラー・トマト';     /* TESTED・効果モンスター */
const NORMMON='ヂェミナイ・エルフ'; /* GENERIC_OK・通常モンスター */

const NAMES=['派手ハネ','尾も白い黒猫','水晶の占い師','聖なる守り手','幸運を告げるフクロウ',
 'カードを狩る死神','トラップ・マスター','爆弾かめ虫','雷仙人','ワーム・リンクス'];
NAMES.forEach(n=>ok('bulk50-b1 registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 落とし穴は罠',dbOf({id:findCardIndex(TRAP)}).k==='t');
ok('前提: サイクロンは魔法',dbOf({id:findCardIndex(SPELL)}).k==='s');
ok('前提: ネクロバレーはフィールド魔法',dbOf({id:findCardIndex(FIELD)}).sub==='フィールド');
ok('前提: キラー・トマトは効果モンスター',(dbOf({id:findCardIndex(EFFMON)}).st||[]).includes('効果'));
ok('前提: ヂェミナイ・エルフは通常モンスター',(dbOf({id:findCardIndex(NORMMON)}).st||[]).includes('通常'));
function ctxR(p,card,evname,evt,zone){const loc=h(card);
  const c=makeContext(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,evname||'activate',{event:evt});
  if(evt)c.event=evt;return c;}
function answerKey(k){const pc=pending();if(!pc)throw Error('no pending');
  const hit=pc.candidates.find(x=>x&&x.key===k);return answerChoiceV49([(hit||pc.candidates[0]).key]);}
const JAR='強欲な瓶';             /* TESTED・通常魔法 */
const AG='古代の機械兵士';         /* NOT_STARTED・ANCIENT_GEAR */
const REPT='ガガギゴ';            /* GENERIC_OK・爬虫類 */

const N1=['魔法除去','古代の整備場','死角からの一撃','ダークシー・フロート','棺桶売り',
 'ピラミッドパワー','毒蛇の供物','ドリーム・ピエロ','瓶亀'];
N1.forEach(n=>ok('ready25-b1 registration '+n,!!CARD_SCRIPTS[n]));
/* READY25 当時は SKIP（破壊者 byPlayer が効果破壊経路で伝播していなかった）。
   System v30 B1 で destroyerPlayerV30 が入り解禁済み。記録は削除せず移設する。
   実挙動の検証は tools/test_provenance_v30.js が持つ。 */
ok('ready25-b1 engineRepairUnlocked: コザッキーの自爆装置は v30 B1 で解禁',
   !!CARD_SCRIPTS['コザッキーの自爆装置']);
ok('前提: 古代の機械兵士は ANCIENT_GEAR',isCardInGroupV4(dbOf({id:findCardIndex(AG)}),GROUP.ANCIENT_GEAR)===true);
ok('前提: ガガギゴは爬虫類族',dbOf({id:findCardIndex(REPT)}).ra==='爬虫類');

/* ===== 魔法除去 ===== */
reset0();
let ms=mk('魔法除去',0,'down'),setSp=mk(SPELL,1,'down'),setTr=mk(TRAP,1,'down');
gameState.players[0].sz=[ms];gameState.players[1].sz=[setSp,setTr];
gameState.players[1].field=mk(FIELD,1,'up');   /* 表側のフィールド魔法 */
let mse=effOf('魔法除去');
ok('魔法除去 positive: 対象があれば発動できる',mse.condition(ctxR(0,ms,'activate'))===true);
ok('魔法除去 positive: 候補はセット2枚＋表側のフィールド魔法（自身は除く）',
   rzSpellOrSetTargets(ms).length===3,
   rzSpellOrSetTargets(ms).map(x=>dbOf(x.card).n).join(','));
ok('魔法除去 positive: 表側の魔法カードも対象にできる',
   rzSpellOrSetTargets(ms).some(x=>dbOf(x.card).n===FIELD));
pickNamed(SPELL);run(mse,ctxR(0,ms,'activate'));
ok('魔法除去 positive: セットが魔法なら破壊される',
   (gameState.players[1].grave||[]).some(c=>c&&c.uid===setSp.uid));
reset0();
let ms2=mk('魔法除去',0,'down'),onlyTr=mk(TRAP,1,'down');
gameState.players[0].sz=[ms2];gameState.players[1].sz=[onlyTr];
pickNamed(TRAP);run(effOf('魔法除去'),ctxR(0,ms2,'activate'));
ok('魔法除去 ruling: セットが罠なら破壊せず元に戻す',
   (gameState.players[1].sz||[]).some(c=>c&&c.uid===onlyTr.uid)&&onlyTr.face==='down');
ok('魔法除去 negative: 表側の罠は候補にならない',(()=>{
   reset0();const m3=mk('魔法除去',0,'down');gameState.players[0].sz=[m3];
   gameState.players[1].sz=[mk(TRAP,1,'up')];
   return effOf('魔法除去').condition(ctxR(0,m3,'activate'))===false;})());

/* ===== 古代の整備場 ===== */
reset0();
let ag=mk('古代の整備場',0,'down'),agm=mk(AG,0),other=mk(PLAIN,0);
gameState.players[0].sz=[ag];gameState.players[0].grave=[other,agm];
let age=effOf('古代の整備場');
ok('古代の整備場 positive: 墓地にアンティーク・ギアがあれば発動できる',
   age.condition(ctxR(0,ag,'activate'))===true);
ok('古代の整備場 positive: 候補はアンティーク・ギアだけ',
   rzGraveAncientGear(0).length===1,String(rzGraveAncientGear(0).length));
pickFirst();run(age,ctxR(0,ag,'activate'));
ok('古代の整備場 positive: 手札に加わる',inHand(0,agm));
ok('古代の整備場 negative: 墓地にいなければ発動できない',(()=>{
   reset0();const a2=mk('古代の整備場',0,'down');gameState.players[0].sz=[a2];
   gameState.players[0].grave=[mk(PLAIN,0)];
   return effOf('古代の整備場').condition(ctxR(0,a2,'activate'))===false;})());
ok('古代の整備場 negative: 相手の墓地は対象外',(()=>{
   reset0();const a3=mk('古代の整備場',0,'down');gameState.players[0].sz=[a3];
   gameState.players[1].grave=[mk(AG,1)];
   return effOf('古代の整備場').condition(ctxR(0,a3,'activate'))===false;})());

/* ===== 死角からの一撃 ===== */
reset0();
let bs=mk('死角からの一撃',0,'down'),mine=mk(PLAIN,0),foeDef=mk(BIG,1,'up','def');
gameState.players[0].sz=[bs];gameState.players[0].mz=[mine];gameState.players[1].mz=[foeDef];
let bse=effOf('死角からの一撃');
let mineBase=curATK(mine);
ok('死角からの一撃 positive: 条件を満たす',bse.condition(ctxR(0,bs,'activate'))===true);
pickFirst();run(bse,ctxR(0,bs,'activate'));
ok('死角からの一撃 positive: 相手の守備力分だけ攻撃力が上がる',
   curATK(mine)===mineBase+dbOf(foeDef).def,mineBase+'→'+curATK(mine)+' def='+dbOf(foeDef).def);
ok('死角からの一撃 ruling: エンドフェイズまで（endPhase で失効）',(()=>{
   clearExpiredMods(gameState,'endPhase');return curATK(mine)===mineBase;})());
ok('死角からの一撃 negative: 相手に表側守備がいなければ発動できない',(()=>{
   reset0();const b2=mk('死角からの一撃',0,'down');gameState.players[0].sz=[b2];
   gameState.players[0].mz=[mk(PLAIN,0)];gameState.players[1].mz=[mk(BIG,1,'up','atk')];
   return effOf('死角からの一撃').condition(ctxR(0,b2,'activate'))===false;})());
ok('死角からの一撃 negative: 自分に表側攻撃表示がなければ発動できない',(()=>{
   reset0();const b3=mk('死角からの一撃',0,'down');gameState.players[0].sz=[b3];
   gameState.players[0].mz=[mk(PLAIN,0,'up','def')];gameState.players[1].mz=[mk(BIG,1,'up','def')];
   return effOf('死角からの一撃').condition(ctxR(0,b3,'activate'))===false;})());

/* ===== ダークシー・フロート ===== */
reset0();
let df=mk('ダークシー・フロート',0);gameState.players[0].mz=[df];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0)];
let dfe=effOf('ダークシー・フロート');
let evEff={player:0,card:df,uid:df.uid,reason:'effect'};
ok('ダークシー・フロート positive: 効果破壊で条件成立',dfe.condition(ctxR(0,df,'onDestroy',evEff,'grave'))===true);
let hd=gameState.players[0].hand.length;
dfe.operation(ctxR(0,df,'onDestroy',evEff,'grave'));
ok('ダークシー・フロート positive: 1枚ドローする',gameState.players[0].hand.length===hd+1);
ok('ダークシー・フロート negative: 戦闘破壊では誘発しない',
   dfe.condition(ctxR(0,df,'onDestroy',{player:0,card:df,uid:df.uid,reason:'battle'},'grave'))===false);
ok('ダークシー・フロート negative: 他のカードの破壊では誘発しない',
   dfe.condition(ctxR(0,df,'onDestroy',{player:0,card:mk(PLAIN,0),uid:df.uid+9999,reason:'effect'},'grave'))===false);
ok('ダークシー・フロート negative: デッキが0枚なら発動しない',(()=>{
   gameState.players[0].deck=[];
   return dfe.condition(ctxR(0,df,'onDestroy',evEff,'grave'))===false;})());

/* ===== 棺桶売り ===== */
reset0();
let cs=mk('棺桶売り',0,'up');gameState.players[0].sz=[cs];
let foeMon=mk(BIG,1),ownMon=mk(PLAIN,0),foeSpell=mk(SPELL,1);
let cse=effOf('棺桶売り');
let lpF=gameState.players[1].lp;
let evG={player:1,card:foeMon,uid:foeMon.uid,reason:'effect'};
ok('棺桶売り positive: 相手のモンスターが墓地へ送られたら条件成立',
   cse.condition(ctxR(0,cs,'onSendToGrave',evG,'sz'))===true);
cse.operation(ctxR(0,cs,'onSendToGrave',evG,'sz'));
ok('棺桶売り positive: 相手に300ダメージ',gameState.players[1].lp===lpF-300,lpF+'→'+gameState.players[1].lp);
ok('棺桶売り ruling: 破壊以外の墓地送りでも誘発する（reason:effect でも battle でも）',
   cse.condition(ctxR(0,cs,'onSendToGrave',{player:1,card:foeMon,uid:foeMon.uid,reason:'battle'},'sz'))===true);
ok('棺桶売り negative: 自分のモンスターが墓地へ行っても誘発しない',
   cse.condition(ctxR(0,cs,'onSendToGrave',{player:0,card:ownMon,uid:ownMon.uid,reason:'effect'},'sz'))===false);
ok('棺桶売り negative: 魔法・罠が墓地へ行っても誘発しない',
   cse.condition(ctxR(0,cs,'onSendToGrave',{player:1,card:foeSpell,uid:foeSpell.uid,reason:'effect'},'sz'))===false);
ok('棺桶売り negative: 裏側のままでは誘発しない',(()=>{
   cs.face='down';const r=cse.condition(ctxR(0,cs,'onSendToGrave',evG,'sz'));cs.face='up';return r===false;})());

/* ===== ピラミッドパワー ===== */
reset0();
let pp=mk('ピラミッドパワー',0,'down'),m1=mk(PLAIN,0),m2=mk(BIG,0);
gameState.players[0].sz=[pp];gameState.players[0].mz=[m1,m2];
let ppe=effOf('ピラミッドパワー');
let a1=curATK(m1),a2=curATK(m2),d1=curDEF(m1);
ok('ピラミッドパワー positive: 自分に表側モンスターがいれば発動できる',
   ppe.condition(ctxR(0,pp,'activate'))===true);
ppe.operation(ctxR(0,pp,'activate'));
let pq=pending();
ok('ピラミッドパワー positive: 2択が提示される',!!pq&&pq.candidates.length===2,pq?String(pq.candidates.length):'none');
answerKey('atk');
ok('ピラミッドパワー positive: 攻撃力モードで全員+200',
   curATK(m1)===a1+200&&curATK(m2)===a2+200,curATK(m1)+'/'+curATK(m2));
ok('ピラミッドパワー ruling: 2択は同時適用しない（守備力は変わらない）',curDEF(m1)===d1);
ok('ピラミッドパワー positive: 守備力モードで全員+500',(()=>{
   reset0();const p2=mk('ピラミッドパワー',0,'down'),n1=mk(PLAIN,0);
   gameState.players[0].sz=[p2];gameState.players[0].mz=[n1];
   const base=curDEF(n1),abase=curATK(n1);
   effOf('ピラミッドパワー').operation(ctxR(0,p2,'activate'));
   answerKey('def');
   return curDEF(n1)===base+500&&curATK(n1)===abase;})());
ok('ピラミッドパワー negative: 相手のモンスターは上がらない',(()=>{
   reset0();const p3=mk('ピラミッドパワー',0,'down'),own=mk(PLAIN,0),foe=mk(PLAIN,1);
   gameState.players[0].sz=[p3];gameState.players[0].mz=[own];gameState.players[1].mz=[foe];
   const fb=curATK(foe);
   effOf('ピラミッドパワー').operation(ctxR(0,p3,'activate'));answerKey('atk');
   return curATK(foe)===fb;})());
ok('ピラミッドパワー negative: 自分に表側モンスターがいなければ発動できない',(()=>{
   reset0();const p4=mk('ピラミッドパワー',0,'down');gameState.players[0].sz=[p4];
   return effOf('ピラミッドパワー').condition(ctxR(0,p4,'activate'))===false;})());

/* ===== 毒蛇の供物 ===== */
reset0();
let vo=mk('毒蛇の供物',0,'down'),rep=mk(REPT,0);
gameState.players[0].sz=[vo];gameState.players[0].mz=[rep];
let f1=mk(BIG,1),f2=mk(PLAIN,1),f3=mk(TRAP,1,'down');
gameState.players[1].mz=[f1,f2];gameState.players[1].sz=[f3];
let voe=effOf('毒蛇の供物');
ok('毒蛇の供物 positive: 爬虫類と相手カード2枚があれば発動できる',
   voe.condition(ctxR(0,vo,'activate'))===true);
pickFirst();run(voe,ctxR(0,vo,'activate'));
ok('毒蛇の供物 positive: 自分の爬虫類が破壊される',
   (gameState.players[0].grave||[]).some(c=>c&&c.uid===rep.uid));
ok('毒蛇の供物 positive: 相手のカード2枚が破壊される',
   (gameState.players[1].grave||[]).length>=2,String((gameState.players[1].grave||[]).length));
ok('毒蛇の供物 negative: 爬虫類がいなければ発動できない',(()=>{
   reset0();const v2=mk('毒蛇の供物',0,'down');gameState.players[0].sz=[v2];
   gameState.players[0].mz=[mk(PLAIN,0)];
   gameState.players[1].mz=[mk(BIG,1),mk(PLAIN,1)];
   return effOf('毒蛇の供物').condition(ctxR(0,v2,'activate'))===false;})());
ok('毒蛇の供物 negative: 相手のカードが1枚なら発動できない',(()=>{
   reset0();const v3=mk('毒蛇の供物',0,'down');gameState.players[0].sz=[v3];
   gameState.players[0].mz=[mk(REPT,0)];gameState.players[1].mz=[mk(BIG,1)];
   return effOf('毒蛇の供物').condition(ctxR(0,v3,'activate'))===false;})());
ok('毒蛇の供物 ruling: 相手の魔法・罠も対象にできる',(()=>{
   reset0();const v4=mk('毒蛇の供物',0,'down');gameState.players[0].sz=[v4];
   gameState.players[0].mz=[mk(REPT,0)];
   gameState.players[1].sz=[mk(TRAP,1,'down'),mk(SPELL,1,'down')];
   return effOf('毒蛇の供物').condition(ctxR(0,v4,'activate'))===true;})());

/* ===== ドリーム・ピエロ ===== */
reset0();
let dp=mk('ドリーム・ピエロ',0),fm=mk(BIG,1);
gameState.players[0].mz=[dp];gameState.players[1].mz=[fm];
let dpe=effOf('ドリーム・ピエロ');
let evPos={uid:dp.uid,player:0,zone:'mz',fromFace:'up',fromPos:'atk',toFace:'up',toPos:'def'};
ok('ドリーム・ピエロ positive: 攻撃表示→表側守備表示で条件成立',
   dpe.condition(ctxR(0,dp,'onPositionChange',evPos))===true);
pickFirst();run(dpe,ctxR(0,dp,'onPositionChange',evPos));
ok('ドリーム・ピエロ positive: 相手モンスターが破壊される',
   (gameState.players[1].grave||[]).some(c=>c&&c.uid===fm.uid));
ok('ドリーム・ピエロ negative: 裏側守備→表側守備（リバース）では誘発しない',
   dpe.condition(ctxR(0,dp,'onPositionChange',{uid:dp.uid,player:0,zone:'mz',fromFace:'down',fromPos:'def',toFace:'up',toPos:'def'}))===false);
ok('ドリーム・ピエロ negative: 守備→攻撃では誘発しない',
   dpe.condition(ctxR(0,dp,'onPositionChange',{uid:dp.uid,player:0,zone:'mz',fromFace:'up',fromPos:'def',toFace:'up',toPos:'atk'}))===false);
ok('ドリーム・ピエロ negative: 他のカードの表示形式変更では誘発しない',
   dpe.condition(ctxR(0,dp,'onPositionChange',{uid:dp.uid+999,player:0,zone:'mz',fromFace:'up',fromPos:'atk',toFace:'up',toPos:'def'}))===false);
ok('ドリーム・ピエロ negative: 相手にモンスターがいなければ発動しない',(()=>{
   reset0();const d2=mk('ドリーム・ピエロ',0);gameState.players[0].mz=[d2];
   return effOf('ドリーム・ピエロ').condition(ctxR(0,d2,'onPositionChange',{uid:d2.uid,player:0,zone:'mz',fromFace:'up',fromPos:'atk',toFace:'up',toPos:'def'}))===false;})());

/* ===== 瓶亀 ===== */
reset0();
let bk=mk('瓶亀',0);gameState.players[0].mz=[bk];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0)];
let bke=effOf('瓶亀');
let jarId=findCardIndex(JAR), spellId=findCardIndex(SPELL);
let evJar={player:0,kind:'spell',sub:'normal',cardId:jarId,uid:777};
ok('瓶亀 positive: 「強欲な瓶」の発動で条件成立',bke.condition(ctxR(0,bk,'onActivateSuccess',evJar))===true);
let hb=gameState.players[0].hand.length;
bke.operation(ctxR(0,bk,'onActivateSuccess',evJar));
ok('瓶亀 positive: 1枚ドローする',gameState.players[0].hand.length===hb+1);
ok('瓶亀 ruling: 相手が発動した「強欲な瓶」でも自分がドローする',
   bke.condition(ctxR(0,bk,'onActivateSuccess',{player:1,kind:'spell',sub:'normal',cardId:jarId}))===true);
ok('瓶亀 negative: 別の魔法では誘発しない',
   bke.condition(ctxR(0,bk,'onActivateSuccess',{player:0,kind:'spell',sub:'quick',cardId:spellId}))===false);
ok('瓶亀 negative: 裏側では誘発しない',(()=>{
   bk.face='down';const r=bke.condition(ctxR(0,bk,'onActivateSuccess',evJar));bk.face='up';return r===false;})());
ok('瓶亀 negative: デッキが0枚なら発動しない',(()=>{
   gameState.players[0].deck=[];
   return bke.condition(ctxR(0,bk,'onActivateSuccess',evJar))===false;})());

/* ================= Replay / SaveLoad ================= */
reset0();
let za=mk('ピラミッドパワー',0,'down'),zm=mk(PLAIN,0);
gameState.players[0].sz=[za];gameState.players[0].mz=[zm];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
effOf('ピラミッドパワー').operation(ctxR(0,za,'activate'));
answerKey('atk');
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('ready25-b1 Replay: mode選択つき修整が digest 一致で再生される',audit.ok,audit.reason||'');
let snap=JSON.stringify(gameState);
ok('ready25-b1 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('ready25-b1 直列化: gameState に関数が漏れていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
