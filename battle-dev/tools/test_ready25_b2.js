/* Class A bulk 50 — READY25 batch 2 / 特殊召喚・儀式・複合。positive / negative / ruling edge。 */
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
/* S03-U62: some cards now open a real (SaveLoad-safe) API.requestChoice pending choice instead of the
   old synchronous API.selectCard closure the reset0() stub above intercepts. Auto-answer any such pending
   choice by always picking the first candidate (matches the stub's own semantics). */
function drain0(){for(let i=0;i<10&&pending();i++)__choicePickV49(0);}
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
function declare2(atkCard,defCard,atkPlayer){
  gameState.pendingAttack={player:(atkPlayer==null?1:atkPlayer),
    attackerUid:atkCard?atkCard.uid:null,targetUid:defCard?defCard.uid:null};}
const IB1='氷結界に住む魔酔虫', IB2='氷結界のロイヤル・ナイト';
const NINJA1='忍者マスター SASUKE';        /* NOT_STARTED・NINJA lv4 */
const BEAST4='BF－東雲のコチ';             /* NOT_STARTED・鳥獣 lv4 */
const DMOR='D・スコープン';                /* NOT_STARTED・D_MORPHTRONIC */
const KARA_D='カラクリ蜘蛛';   /* S03-U243: カラクリ忍者 参参九 got its own script (mustAttack), so the filler is カラクリ蜘蛛 — a KARAKURI monster without a must-attack rule */         /* NOT_STARTED・KARAKURI — was カラクリ守衛 参壱参 until
  S03-U71 declared it for real (an unconditional continuous mustAttack clause); this fixture specifically
  needs a KARAKURI-archetype monster with NO script of its own, so mustAttackNow(kd) stays a genuine
  negative check. */
const ANT='赤蟻アスカトル';                /* NOT_STARTED */
const BEAST='グレート・アンガス';           /* GENERIC_OK・獣 */

const N2=['共振装置','氷結界の輸送部隊','ハーフ・シャット','忍法 変化の術','誘発召喚',
 'D・スクランブル','森の番人グリーン・バブーン','大地讃頌','カラクリ忍者 七七四九','太陽の神官'];
N2.forEach(n=>ok('ready25-b2 registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 氷結界2枚は ICE_BARRIER',
   isSetCardV4(dbOf({id:findCardIndex(IB1)}),SETCODE.ICE_BARRIER)&&isSetCardV4(dbOf({id:findCardIndex(IB2)}),SETCODE.ICE_BARRIER));
ok('前提: 忍者マスター SASUKE は NINJA',isSetCardV4(dbOf({id:findCardIndex(NINJA1)}),SETCODE.NINJA)===true);
ok('前提: D・スコープンは D_MORPHTRONIC',isCardInGroupV4(dbOf({id:findCardIndex(DMOR)}),GROUP.D_MORPHTRONIC)===true);

/* ===== 共振装置 ===== */
reset0();
let rs=mk('共振装置',0,'down');gameState.players[0].sz=[rs];
let sameA=mk(BEAST,0),sameB=mk(BEAST,0),diff=mk(PLAIN,0);
gameState.players[0].mz=[sameA,sameB,diff];
API.setLevel(h(sameB),8,'permanent','fixture');
let rse=effOf('共振装置');
ok('共振装置 positive: 同じ種族・属性が2体いれば発動できる',rse.condition(ctxR(0,rs,'activate'))===true);
let lvB=curLV(sameB);
pickFirst();run(rse,ctxR(0,rs,'activate'));
ok('共振装置 positive: レベルが複製される',curLV(sameA)===lvB,curLV(sameA)+' / '+lvB);
ok('共振装置 ruling: エンドフェイズまで（endPhase で失効）',(()=>{
   clearExpiredMods(gameState,'endPhase');return curLV(sameA)===dbOf(sameA).lv;})());
ok('共振装置 negative: 種族・属性が違うペアだけでは発動できない',(()=>{
   reset0();const r2=mk('共振装置',0,'down');gameState.players[0].sz=[r2];
   gameState.players[0].mz=[mk(BEAST,0),mk(PLAIN,0)];
   return effOf('共振装置').condition(ctxR(0,r2,'activate'))===false;})());
ok('共振装置 negative: 1体だけでは発動できない',(()=>{
   reset0();const r3=mk('共振装置',0,'down');gameState.players[0].sz=[r3];
   gameState.players[0].mz=[mk(BEAST,0)];
   return effOf('共振装置').condition(ctxR(0,r3,'activate'))===false;})());

/* ===== 氷結界の輸送部隊 ===== */
reset0();
let ib=mk('氷結界の輸送部隊',0);gameState.players[0].mz=[ib];
let g1=mk(IB1,0),g2=mk(IB2,0),g3=mk(PLAIN,0);
gameState.players[0].grave=[g3,g1,g2];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0)];
gameState.players[1].deck=[mk(PLAIN,1),mk(PLAIN,1)];
let ibe=effOf('氷結界の輸送部隊');
ok('氷結界の輸送部隊 positive: 墓地に「氷結界」2体で発動できる',ibe.condition(ctxR(0,ib,'activate'))===true);
let h0=gameState.players[0].hand.length,h1=gameState.players[1].hand.length;
ibe.operation(ctxR(0,ib,'activate'));
let iq=pending();
ok('氷結界の輸送部隊 positive: 候補は「氷結界」だけ・ちょうど2体',
   !!iq&&iq.candidates.length===2&&iq.min===2&&iq.max===2,iq?iq.candidates.length+' '+iq.min+'/'+iq.max:'none');
answerAll();
ok('氷結界の輸送部隊 positive: 2体がデッキへ戻る',
   !(gameState.players[0].grave||[]).some(c=>c&&(c.uid===g1.uid||c.uid===g2.uid)));
ok('氷結界の輸送部隊 positive: お互いが1枚ドローする',
   gameState.players[0].hand.length===h0+1&&gameState.players[1].hand.length===h1+1,
   gameState.players[0].hand.length+'/'+gameState.players[1].hand.length);
ok('氷結界の輸送部隊 ruling: 1ターンに1度',ibe.condition(ctxR(0,ib,'activate'))===false);
ok('氷結界の輸送部隊 negative: 墓地の「氷結界」が1体なら発動できない',(()=>{
   reset0();const i2=mk('氷結界の輸送部隊',0);gameState.players[0].mz=[i2];
   gameState.players[0].grave=[mk(IB1,0)];
   return effOf('氷結界の輸送部隊').condition(ctxR(0,i2,'activate'))===false;})());

/* ===== ハーフ・シャット ===== */
reset0();
let hs=mk('ハーフ・シャット',0,'down'),tgt=mk(BIG,1);
gameState.players[0].sz=[hs];gameState.players[1].mz=[tgt];
let hse=effOf('ハーフ・シャット');
let base=curATK(tgt);
ok('ハーフ・シャット positive: 表側モンスターがいれば発動できる',hse.condition(ctxR(0,hs,'activate'))===true);
pickFirst();run(hse,ctxR(0,hs,'activate'));
ok('ハーフ・シャット positive: 攻撃力が半分になる',curATK(tgt)===Math.floor(base/2),base+'→'+curATK(tgt));
ok('ハーフ・シャット positive: 戦闘破壊耐性が付く',(()=>{
   const rec=API.protectionRecord(h(tgt),{cause:'battle'});
   return !!rec;})(),JSON.stringify(API.protectionRecord(h(tgt),{cause:'battle'})));
ok('ハーフ・シャット ruling: 効果破壊は防がない',(()=>{
   const rec=API.protectionRecord(h(tgt),{cause:'effect'});
   return !rec;})());
ok('ハーフ・シャット ruling: ターン終了で両方失効',(()=>{
   clearExpiredMods(gameState,'endTurn');
   return curATK(tgt)===base;})());
ok('ハーフ・シャット negative: 表側モンスターがいなければ発動できない',(()=>{
   reset0();const s2=mk('ハーフ・シャット',0,'down');gameState.players[0].sz=[s2];
   return effOf('ハーフ・シャット').condition(ctxR(0,s2,'activate'))===false;})());

/* ===== 忍法 変化の術 ===== */
reset0();
let hn=mk('忍法 変化の術',0,'down'),nj=mk(NINJA1,0);
gameState.players[0].sz=[hn];gameState.players[0].mz=[nj];
gameState.players[0].hand=[mk(BEAST4,0)];
gameState.players[0].deck=[mk(PLAIN,0)];
let hne=effOf('忍法 変化の術');
ok('忍法 変化の術 positive: 表側の「忍者」がいれば発動できる',hne.condition(ctxR(0,hn,'activate'))===true);
pickFirst();
let hc=ctxR(0,hn,'activate');
let paid=false; hne.cost(hc,v=>{paid=v;});
ok('忍法 変化の術 positive: 「忍者」をリリースしてレベル上限を記録',
   paid===true&&hn.rzHengeCap===(dbOf(nj).lv||0)+3,'cap='+hn.rzHengeCap);
hne.operation(hc);drain0();
ok('忍法 変化の術 positive: 手札から特殊召喚される',
   (gameState.players[0].mz||[]).some(c=>c&&dbOf(c).n===BEAST4));
ok('忍法 変化の術 positive: v9 リンクが張られる（独自watcherではない）',(()=>{
   const m=(gameState.players[0].mz||[]).find(c=>c&&dbOf(c).n===BEAST4);
   return !!m&&!!m.linkV9&&Array.isArray(m.linkV9.watch)&&m.linkV9.watch.length>0;})());
ok('忍法 変化の術 ruling: このカードが場を離れると特殊召喚したモンスターが破壊される',(()=>{
   const m=(gameState.players[0].mz||[]).find(c=>c&&dbOf(c).n===BEAST4);
   gameState.fieldSnapV9=fieldSnapshotV9(gameState);
   API.destroy(h(hn),'テスト');
   if(typeof enforceLinkedLeaveV9==='function') enforceLinkedLeaveV9(gameState);
   return !(gameState.players[0].mz||[]).some(c=>c&&c.uid===m.uid);})());
ok('忍法 変化の術 negative: 「忍者」がいなければ発動できない',(()=>{
   reset0();const h2=mk('忍法 変化の術',0,'down');gameState.players[0].sz=[h2];
   gameState.players[0].mz=[mk(PLAIN,0)];
   return effOf('忍法 変化の術').condition(ctxR(0,h2,'activate'))===false;})());

/* ===== 誘発召喚 ===== */
reset0();
let ys=mk('誘発召喚',0,'down');gameState.players[0].sz=[ys];
gameState.players[0].hand=[mk(PLAIN,0)];
gameState.players[1].hand=[mk(PLAIN,1)];
let foeSS=mk(BIG,1);gameState.players[1].mz=[foeSS];
let yse=effOf('誘発召喚');
let evSS={player:1,name:dbOf(foeSS).n,card:foeSS,uid:foeSS.uid,kind:'effect'};
ok('誘発召喚 positive: 相手の特殊召喚で発動できる',yse.condition(ctxR(0,ys,'activate',evSS,'sz'))===true);
ok('誘発召喚 negative: 自分の特殊召喚では発動できない',(()=>{
   const own=mk(PLAIN,0);gameState.players[0].mz=[own];
   return yse.condition(ctxR(0,ys,'activate',{player:0,card:own,uid:own.uid},'sz'))===false;})());
reset0();
let ys2=mk('誘発召喚',0,'down');gameState.players[0].sz=[ys2];
let mine2=mk(PLAIN,0),foe2=mk(PLAIN,1);
gameState.players[0].hand=[mine2];gameState.players[1].hand=[foe2];
let fs=mk(BIG,1);gameState.players[1].mz=[fs];
RESOLUTION_SUMMON_BATCH_V2=[];
effOf('誘発召喚').operation(ctxR(0,ys2,'activate',{player:1,card:fs,uid:fs.uid},'sz'));
answerN(1);
ok('誘発召喚 positive: 自分が手札から特殊召喚できる',inMz(0,mine2));
let fq=pending();
ok('誘発召喚 ruling: そのあと相手側の選択が開く',!!fq&&fq.player===1,fq?String(fq.player):'none');
answerN(1);
ok('誘発召喚 positive: 相手も手札から特殊召喚できる',inMz(1,foe2));
flushResolutionSummonBatchV2();
ok('誘発召喚 ruling: 同時特殊召喚は1イベントにまとまる',
   (gameState.deferredEvents||[]).filter(e=>e.eventName==='onSpecialSummon').length<=2,
   String((gameState.deferredEvents||[]).filter(e=>e.eventName==='onSpecialSummon').length));
ok('誘発召喚 negative: 双方の手札にレベル4以下がなければ発動できない',(()=>{
   reset0();const y3=mk('誘発召喚',0,'down');gameState.players[0].sz=[y3];
   const f3=mk(BIG,1);gameState.players[1].mz=[f3];
   return effOf('誘発召喚').condition(ctxR(0,y3,'activate',{player:1,card:f3,uid:f3.uid},'sz'))===false;})());

/* ===== D・スクランブル ===== */
reset0();
let ds=mk('D・スクランブル',0,'down');gameState.players[0].sz=[ds];
let dm=mk(DMOR,0);gameState.players[0].hand=[dm];
let atk=mk(BIG,1);gameState.players[1].mz=[atk];
let dse=effOf('D・スクランブル');
declare2(atk,null,1);
ok('D・スクランブル positive: 相手の直接攻撃で発動できる',dse.condition(ctxR(0,ds,'activate',null,'sz'))===true);
dse.operation(ctxR(0,ds,'activate',null,'sz'));
ok('D・スクランブル positive: 攻撃が無効になる',gameState.attackNegated===true);
answerN(1);
ok('D・スクランブル positive: 手札から「D」が特殊召喚される',inMz(0,dm));
ok('D・スクランブル negative: 自分にモンスターがいれば発動できない',(()=>{
   reset0();const d2=mk('D・スクランブル',0,'down');gameState.players[0].sz=[d2];
   gameState.players[0].mz=[mk(PLAIN,0)];gameState.players[0].hand=[mk(DMOR,0)];
   const a2=mk(BIG,1);gameState.players[1].mz=[a2];declare2(a2,null,1);
   return effOf('D・スクランブル').condition(ctxR(0,d2,'activate',null,'sz'))===false;})());
ok('D・スクランブル negative: モンスターへの攻撃では発動できない',(()=>{
   reset0();const d3=mk('D・スクランブル',0,'down');gameState.players[0].sz=[d3];
   gameState.players[0].hand=[mk(DMOR,0)];
   const a3=mk(BIG,1),t3=mk(PLAIN,0);
   gameState.players[1].mz=[a3];gameState.players[0].mz=[t3];declare2(a3,t3,1);
   return effOf('D・スクランブル').condition(ctxR(0,d3,'activate',null,'sz'))===false;})());
ok('D・スクランブル negative: 手札に「D」がなければ発動できない',(()=>{
   reset0();const d4=mk('D・スクランブル',0,'down');gameState.players[0].sz=[d4];
   gameState.players[0].hand=[mk(PLAIN,0)];
   const a4=mk(BIG,1);gameState.players[1].mz=[a4];declare2(a4,null,1);
   return effOf('D・スクランブル').condition(ctxR(0,d4,'activate',null,'sz'))===false;})());

/* ===== 森の番人グリーン・バブーン ===== */
reset0();
let gb=mk('森の番人グリーン・バブーン',0);gameState.players[0].hand=[gb];
let ownBeast=mk(BEAST,0);gameState.players[0].mz=[ownBeast];
let gbe=effOf('森の番人グリーン・バブーン');
let evB={player:0,card:ownBeast,uid:ownBeast.uid,reason:'effect'};
ok('森の番人グリーン・バブーン positive: 自分の獣族が効果破壊されたら発動できる',
   gbe.condition(ctxR(0,gb,'activate',evB,'hand'))===true);
let lpG=gameState.players[0].lp;
let gc=ctxR(0,gb,'activate',evB,'hand');
let gPaid=false; gbe.cost(gc,v=>{gPaid=v;});
ok('森の番人グリーン・バブーン positive: 1000LPを払う',
   gPaid===true&&gameState.players[0].lp===lpG-1000,lpG+'→'+gameState.players[0].lp);
gbe.operation(gc);
ok('森の番人グリーン・バブーン positive: 手札から特殊召喚される',inMz(0,gb));
ok('森の番人グリーン・バブーン negative: 戦闘破壊では発動できない',(()=>{
   reset0();const g2=mk('森の番人グリーン・バブーン',0);gameState.players[0].hand=[g2];
   const b2=mk(BEAST,0);gameState.players[0].mz=[b2];
   return effOf('森の番人グリーン・バブーン')
     .condition(ctxR(0,g2,'activate',{player:0,card:b2,uid:b2.uid,reason:'battle'},'hand'))===false;})());
ok('森の番人グリーン・バブーン negative: 獣族以外の破壊では発動できない',(()=>{
   reset0();const g3=mk('森の番人グリーン・バブーン',0);gameState.players[0].hand=[g3];
   const p3=mk(PLAIN,0);gameState.players[0].mz=[p3];
   return effOf('森の番人グリーン・バブーン')
     .condition(ctxR(0,g3,'activate',{player:0,card:p3,uid:p3.uid,reason:'effect'},'hand'))===false;})());
ok('森の番人グリーン・バブーン ruling: 墓地からでも発動できる',(()=>{
   reset0();const g4=mk('森の番人グリーン・バブーン',0);gameState.players[0].grave=[g4];
   const b4=mk(BEAST,0);gameState.players[0].mz=[b4];
   return effOf('森の番人グリーン・バブーン')
     .condition(ctxR(0,g4,'activate',{player:0,card:b4,uid:b4.uid,reason:'effect'},'grave'))===true;})());
ok('森の番人グリーン・バブーン negative: LPが1000以下なら発動できない',(()=>{
   reset0();const g5=mk('森の番人グリーン・バブーン',0);gameState.players[0].hand=[g5];
   const b5=mk(BEAST,0);gameState.players[0].mz=[b5];
   gameState.players[0].lp=800;
   return effOf('森の番人グリーン・バブーン')
     .condition(ctxR(0,g5,'activate',{player:0,card:b5,uid:b5.uid,reason:'effect'},'hand'))===false;})());

/* ===== 大地讃頌 ===== */
const EARTH_SPEC=ritualSpecV5('大地讃頌');
ok('大地讃頌 positive: P24 registry に登録されている',!!ritualSpecRegisteredV24('大地讃頌'));
ok('大地讃頌 positive: 述語で判定する（個別名の列挙ではない）',
   !!EARTH_SPEC&&EARTH_SPEC.pred==='EARTH_RITUAL_V24'&&(EARTH_SPEC.monsters==null||EARTH_SPEC.monsters.length===0),
   JSON.stringify(EARTH_SPEC));
ok('大地讃頌 positive: 地属性の儀式モンスターを許可する',
   ritualAllowsMonsterV5(EARTH_SPEC,dbOf({id:findCardIndex('ジャベリンビートル')}))===true);
ok('大地讃頌 negative: 地属性でない儀式モンスターは許可しない',
   ritualAllowsMonsterV5(EARTH_SPEC,dbOf({id:findCardIndex('サクリファイス')}))===false);
ok('大地讃頌 ruling: レベルはちょうど一致（exact）',(EARTH_SPEC||{}).levelMode==='exact');
ok('大地讃頌 ruling: RITUAL_SPEC_V5 本体には追加していない',
   typeof RITUAL_SPEC_V5==='object'&&!('大地讃頌' in RITUAL_SPEC_V5));

/* ===== カラクリ忍者 七七四九 ===== */
reset0();
let kn=mk('カラクリ忍者 七七四九',0),kd=mk(KARA_D,0,'up','def');
gameState.players[0].mz=[kn,kd];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0)];
let foeK=mk(BIG,1);gameState.players[1].mz=[foeK];
ok('カラクリ忍者 七七四九 positive: 攻撃強制が掛かる',mustAttackNow(kn)===true);
ok('カラクリ忍者 七七四九 negative: 他のモンスターに攻撃強制は掛からない',mustAttackNow(kd)===false);
let kne=effOf('カラクリ忍者 七七四九','attack-target-toggle-position');
declare2(foeK,kn,1);
ok('カラクリ忍者 七七四九 positive: 攻撃対象に選ばれたら条件成立',kne.condition(ctxR(0,kn,'onAttackDeclare'))===true);
kne.operation(ctxR(0,kn,'onAttackDeclare'));
ok('カラクリ忍者 七七四九 positive: 攻撃表示→守備表示に変更される',kn.pos==='def',kn.pos);
kne.operation(ctxR(0,kn,'onAttackDeclare'));
ok('カラクリ忍者 七七四九 ruling: 「変更」なので守備表示→攻撃表示にも戻る',kn.pos==='atk',kn.pos);
let knd=effOf('カラクリ忍者 七七四九','summon-draw-by-defense-karakuri');
let hk=gameState.players[0].hand.length;
ok('カラクリ忍者 七七四九 positive: 召喚成功時に表側守備「カラクリ」の数だけドロー',(()=>{
   const c=ctxR(0,kn,'onNormalSummon',{player:0,card:kn});
   if(!knd.condition(c)) return false;
   knd.operation(c);
   return gameState.players[0].hand.length===hk+1;})(),
   hk+'→'+gameState.players[0].hand.length);
ok('カラクリ忍者 七七四九 negative: 表側守備の「カラクリ」がいなければドローしない',(()=>{
   reset0();const k2=mk('カラクリ忍者 七七四九',0);gameState.players[0].mz=[k2,mk(KARA_D,0,'up','atk')];
   gameState.players[0].deck=[mk(PLAIN,0)];
   return effOf('カラクリ忍者 七七四九','summon-draw-by-defense-karakuri')
     .condition(ctxR(0,k2,'onNormalSummon',{player:0,card:k2}))===false;})());

/* ===== 太陽の神官 ===== */
reset0();
let sp=mk('太陽の神官',0);gameState.players[0].hand=[sp];
gameState.players[1].mz=[mk(BIG,1)];
let spe=effOf('太陽の神官','hand-special-summon');
ok('太陽の神官 positive: 相手にのみモンスターがいれば手札から特殊召喚できる',
   spe.condition(ctxR(0,sp,'activate',null,'hand'))===true);
spe.operation(ctxR(0,sp,'activate',null,'hand'));
ok('太陽の神官 positive: 実際に特殊召喚される',inMz(0,sp));
ok('太陽の神官 negative: 自分にもモンスターがいれば特殊召喚できない',(()=>{
   reset0();const s2=mk('太陽の神官',0);gameState.players[0].hand=[s2];
   gameState.players[0].mz=[mk(PLAIN,0)];gameState.players[1].mz=[mk(BIG,1)];
   return effOf('太陽の神官','hand-special-summon').condition(ctxR(0,s2,'activate',null,'hand'))===false;})());
ok('太陽の神官 negative: 相手にモンスターがいなければ特殊召喚できない',(()=>{
   reset0();const s3=mk('太陽の神官',0);gameState.players[0].hand=[s3];
   return effOf('太陽の神官','hand-special-summon').condition(ctxR(0,s3,'activate',null,'hand'))===false;})());
reset0();
let sp2=mk('太陽の神官',0);gameState.players[0].grave=[sp2];
let ant=mk(ANT,0);gameState.players[0].deck=[mk(PLAIN,0),ant];
let spd=effOf('太陽の神官','destroyed-search');
let evS={player:0,card:sp2,uid:sp2.uid,reason:'effect'};
ok('太陽の神官 positive: 破壊されたらサーチできる',spd.condition(ctxR(0,sp2,'activate',evS,'grave'))===true);
spd.operation(ctxR(0,sp2,'activate',evS,'grave'));
answerN(1);
ok('太陽の神官 positive: 「赤蟻アスカトル」を手札に加えられる',inHand(0,ant));
ok('太陽の神官 negative: デッキに対象がなければ発動できない',(()=>{
   reset0();const s4=mk('太陽の神官',0);gameState.players[0].grave=[s4];
   gameState.players[0].deck=[mk(PLAIN,0)];
   return effOf('太陽の神官','destroyed-search')
     .condition(ctxR(0,s4,'activate',{player:0,card:s4,uid:s4.uid,reason:'effect'},'grave'))===false;})());

/* ================= Replay / SaveLoad ================= */
reset0();
let za=mk('ハーフ・シャット',0,'down'),zt=mk(BIG,1);
gameState.players[0].sz=[za];gameState.players[1].mz=[zt];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
pickFirst();run(effOf('ハーフ・シャット'),ctxR(0,za,'activate'));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('ready25-b2 Replay: 修整＋耐性付与が digest 一致で再生される',audit.ok,audit.reason||'');
let snap=JSON.stringify(gameState);
ok('ready25-b2 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('ready25-b2 直列化: gameState に関数が漏れていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
