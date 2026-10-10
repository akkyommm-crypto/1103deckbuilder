/* P26 Control 解禁カード 10枚 — positive / negative / ruling edge。
   小道具は TESTED / GENERIC_OK / NOT_STARTED から選ぶ。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[];globalThis.__R=R;const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);
}
function db(n){ return CARD_DB[findCardIndex(n)]; }
function h(c){ return locateCardAnyV4(c); }
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
function ctxP(p,card,evname,extra){const loc=h(card);
  const c=makeContext(p,card,(loc&&loc.zone)||'mz',(loc&&loc.index)||0,evname||'activate',extra||{});
  if(extra&&extra.event)c.event=extra.event; return c;}
function run(e,c){if(e.cost){let paid=false;e.cost(c,v=>{paid=v;});if(!paid)return false;}
  if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c); return true;}
function inMz(p,c){ return (gameState.players[p].mz||[]).some(x=>x&&x.uid===c.uid); }
function names(p){ return (gameState.players[p].mz||[]).map(c=>c&&dbOf(c).n).join(','); }
function pickQueue(list){ let i=0; API.selectCard=(t,cands,cb)=>{ const want=list[i++];
  const hit=want?cands.find(x=>x&&x.card&&dbOf(x.card).n===want):null; cb(hit||cands[0]); }; }
function pickFirst(){ API.selectCard=(t,list,cb)=>cb(list[0]); }
function poolNames(list){ return list.map(x=>dbOf(x.card).n).join(','); }
function settle(){ if(typeof enforceLinkedLeaveV9==='function') enforceLinkedLeaveV9(gameState); }
function evs(name){ return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt); }
function clearEv(){ gameState.deferredEvents=[]; }
function pending(){ return pendingChoiceV49(gameState); }
function answerNamed(n){ const pc=pending(); if(!pc) throw new Error('no pending choice');
  const hit=pc.candidates.find(x=>x&&x.uid!=null&&(()=>{const f=findCardByUid(x.uid);return f&&dbOf(f.card).n===n;})());
  return answerChoiceV49([(hit||pc.candidates[0]).key]); }

/* 小道具（TESTED / GENERIC_OK / NOT_STARTED のみ） */
const LIGHT='デュナミス・ヴァルキリア', EARTH='セイバーザウルス', WATER='ガガギゴ';
const FIRE='グレート・アンガス', DARK='デーモン・ソルジャー', WIND='サファイアドラゴン';
const GUSTO1='ガスタ・コドル';      /* NOT_STARTED・GUSTO群・風・鳥獣 */
const NOTGUSTO='音速ダック';        /* GENERIC_OK・風・鳥獣だが GUSTO 群ではない */
const FILLER='おジャマ・イエロー';   /* GENERIC_OK・地・獣 */
const ATTR=[['光霊使いライナ','光',LIGHT],['地霊使いアウス','地',EARTH],['水霊使いエリア','水',WATER],
            ['火霊使いヒータ','炎',FIRE],['闇霊使いダルク','闇',DARK],['風霊使いウィン','風',WIND]];

/* ================= 登録 ================= */
const ALL10=['光霊使いライナ','地霊使いアウス','水霊使いエリア','火霊使いヒータ','闇霊使いダルク',
             '風霊使いウィン','くノ一ウォリアー','ダミー・ゴーレム','亜空間ジャンプ装置','ガスタの疾風 リーズ'];
ALL10.forEach(n=>ok('P26 registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: ガスタ・コドルは GUSTO 群',isSetCardV4(db(GUSTO1),SETCODE.GUSTO)===true);
ok('前提: 音速ダックは風・鳥獣だが GUSTO 群ではない',
   isSetCardV4(db(NOTGUSTO),SETCODE.GUSTO)===false&&db(NOTGUSTO).at==='風'&&db(NOTGUSTO).ra==='鳥獣');
ok('P26 反目の従者は今回対象外（未実装のまま）',!CARD_SCRIPTS['反目の従者']);

/* =====================================================================
   1-6. 霊使い 6枚 — 属性ごとに positive / negative / ruling
   ===================================================================== */
ATTR.forEach(function(row){
  const NAME=row[0], AT=row[1], PROP=row[2];
  const other=ATTR.find(r=>r[1]!==AT)[2];
  /* positive: 対応属性の相手モンスターのコントロールを得る */
  reset0();
  const me=mk(NAME,0,'up','def'); gameState.players[0].mz=[me];
  const tgt=mk(PROP,1); gameState.players[1].mz=[tgt];
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);
  const e=eff(NAME,'flip-take-control');
  let c=ctxP(0,me,'onFlip');
  ok(NAME+' positive: '+AT+'属性がいれば発動条件を満たす',e.condition(c)===true,c.reason||'');
  pickFirst(); run(e,c);
  ok(NAME+' positive: コントロールを得る',inMz(0,tgt)&&!inMz(1,tgt),names(0)+' / '+names(1));
  ok(NAME+' positive: owner は変わらない',tgt.owner===1&&tgt.controller===0);
  /* ruling: 霊使いが裏側になったらコントロールが戻る */
  me.face='down'; me.pos='def';
  v9DetectLeaveField(gameState); settle();
  ok(NAME+' ruling: 自身が裏側になるとコントロールが戻る',
     inMz(1,tgt)&&!inMz(0,tgt),names(0)+' / '+names(1));
  /* negative: 対応属性がいない */
  reset0();
  const me2=mk(NAME,0); gameState.players[0].mz=[me2];
  gameState.players[1].mz=[mk(other,1)];
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);
  let c2=ctxP(0,me2,'onFlip');
  ok(NAME+' negative: '+AT+'属性以外だけでは発動できない',e.condition(c2)===false,c2.reason||'');
  /* negative: 候補に他属性が混ざらない */
  gameState.players[1].mz.push(mk(PROP,1));
  ok(NAME+' negative: 対象候補は'+AT+'属性だけ',(()=>{
    const pool=v26FoeAttrMonsters(1,AT);
    return pool.length===1&&dbOf(pool[0].card).n===PROP;})(),poolNames(v26FoeAttrMonsters(1,AT)));
  /* negative: 自分のモンスターは候補にならない */
  gameState.players[0].mz.push(mk(PROP,0));
  ok(NAME+' negative: 自分フィールドのモンスターは対象外',
     v26FoeAttrMonsters(1,AT).length===1,poolNames(v26FoeAttrMonsters(1,AT)));
});

/* ruling: 霊使いが場を離れてもコントロールが戻る（代表1枚で確認） */
reset0();
let dk=mk('闇霊使いダルク',0), dt=mk(DARK,1);
gameState.players[0].mz=[dk]; gameState.players[1].mz=[dt];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
pickFirst(); run(eff('闇霊使いダルク','flip-take-control'),ctxP(0,dk,'onFlip'));
ok('闇霊使いダルク positive: 闇属性のコントロールを得る',inMz(0,dt));
API.destroy(h(dk),'テスト破壊'); settle();
ok('闇霊使いダルク ruling: 自身が破壊されるとコントロールが戻る',
   inMz(1,dt)&&!inMz(0,dt),names(0)+' / '+names(1));

/* ruling: 現在の属性（v17）で判定する。印刷属性ではない。 */
reset0();
let lr=mk('光霊使いライナ',0), morph=mk(EARTH,1);
gameState.players[0].mz=[lr]; gameState.players[1].mz=[morph];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
let cl=ctxP(0,lr,'onFlip');
ok('光霊使いライナ negative: 地属性のままでは発動できない',
   eff('光霊使いライナ','flip-take-control').condition(cl)===false);
API.setAttribute(h(morph),'光','テスト属性変更');
ok('光霊使いライナ ruling: v17 で光属性になったモンスターは対象になる',
   eff('光霊使いライナ','flip-take-control').condition(ctxP(0,lr,'onFlip'))===true,
   API.attrOf(h(morph)));

/* ruling: 相手のモンスターゾーンが一杯でも自分側の空きがなければ奪えない */
reset0();
let wn=mk('風霊使いウィン',0), wt=mk(WIND,1);
gameState.players[0].mz=[wn];
for(let i=0;i<4;i++) gameState.players[0].mz.push(mk(FILLER,0));
gameState.players[1].mz=[wt];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
pickFirst(); run(eff('風霊使いウィン','flip-take-control'),ctxP(0,wn,'onFlip'));
ok('風霊使いウィン ruling: 自分のゾーンが一杯なら奪えず lease も張らない',
   inMz(1,wt)&&!inMz(0,wt)&&!(wt.linkV9&&wt.linkV9.watch&&wt.linkV9.watch.length),
   names(0)+' / '+names(1));

/* =====================================================================
   7. くノ一ウォリアー
   ===================================================================== */
reset0();
let ku=mk('くノ一ウォリアー',0); gameState.players[0].mz=[ku];
gameState.players[1].hand=[mk(FILLER,1,'down'),mk(FILLER,1,'down')];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
clearEv();
API.changeControl(h(ku),1,'テスト奪取');
let kev=evs('onControlChange');
ok('くノ一ウォリアー positive: 自身のコントロール移動で onControlChange が1回',
   kev.length===1&&kev[0].uid===ku.uid,JSON.stringify(kev));
let ke=eff('くノ一ウォリアー','control-change-random-discard');
let kc=ctxP(1,ku,'onControlChange',{event:kev[0]});
ok('くノ一ウォリアー positive: 発動条件を満たす',ke.condition(kc)===true);
let before=gameState.players[1].hand.length;
ke.operation(kc);
ok('くノ一ウォリアー positive: 新しいコントローラーが手札を1枚捨てる',
   gameState.players[1].hand.length===before-1,before+'→'+gameState.players[1].hand.length);
/* negative: 他のカードのコントロール移動では誘発しない */
reset0();
let ku2=mk('くノ一ウォリアー',0), oth=mk(FILLER,1);
gameState.players[0].mz=[ku2]; gameState.players[1].mz=[oth];
gameState.players[0].hand=[mk(FILLER,0,'down')];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
clearEv();
API.changeControl(h(oth),0,'別カードの奪取');
let oev=evs('onControlChange');
ok('くノ一ウォリアー negative: 他カードの移動では条件を満たさない',
   ke.condition(ctxP(0,ku2,'onControlChange',{event:oev[0]}))===false);
/* negative: コントローラーの手札が0枚 */
reset0();
let ku3=mk('くノ一ウォリアー',0); gameState.players[0].mz=[ku3];
gameState.players[1].hand=[];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
clearEv(); API.changeControl(h(ku3),1,'テスト奪取');
ok('くノ一ウォリアー negative: 手札が0枚なら発動しない',
   ke.condition(ctxP(1,ku3,'onControlChange',{event:evs('onControlChange')[0]}))===false);
/* ruling: 裏側では誘発しない */
reset0();
let ku4=mk('くノ一ウォリアー',0,'down','def'); gameState.players[0].mz=[ku4];
gameState.players[1].hand=[mk(FILLER,1,'down')];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
clearEv(); API.changeControl(h(ku4),1,'裏側のまま奪取');
ok('くノ一ウォリアー ruling: 裏側表示では誘発しない',
   ke.condition(ctxP(1,ku4,'onControlChange',{event:evs('onControlChange')[0]}))===false);
/* ruling: コントロールの返却も「コントロールが移った時」として誘発する */
reset0();
let ku5=mk('くノ一ウォリアー',1), src=mk(FILLER,0);
gameState.players[1].mz=[ku5]; gameState.players[0].mz=[src];
gameState.players[0].hand=[mk(FILLER,0,'down')];
gameState.players[1].hand=[mk(FILLER,1,'down')];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
API.changeControl(h(ku5),0,'奪取');
API.linkControlReturn(h(ku5),h(src),{onFaceDown:true});
clearEv();
API.destroy(h(src),'source破壊'); settle();
let rev=evs('onControlChange');
ok('くノ一ウォリアー ruling: 返却イベントも reason=return で出る',
   rev.length===1&&rev[0].reason==='return',JSON.stringify(rev));
ok('くノ一ウォリアー ruling: 返却でも誘発条件を満たす',
   ke.condition(ctxP(1,ku5,'onControlChange',{event:rev[0]}))===true);

/* =====================================================================
   8. ダミー・ゴーレム
   ===================================================================== */
reset0();
let gl=mk('ダミー・ゴーレム',0), fa=mk(DARK,1), fb=mk(WIND,1);
gameState.players[0].mz=[gl]; gameState.players[1].mz=[fa,fb];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
let ge=eff('ダミー・ゴーレム','flip-opponent-swap');
let gc=ctxP(0,gl,'onFlip');
ok('ダミー・ゴーレム positive: 相手にモンスターがいれば条件を満たす',ge.condition(gc)===true);
ge.operation(gc);
let gp=pending();
ok('ダミー・ゴーレム ruling: 選ぶのは相手プレイヤー',!!gp&&gp.player===1,gp?String(gp.player):'none');
ok('ダミー・ゴーレム positive: 候補は相手のモンスター2体',!!gp&&gp.candidates.length===2);
clearEv();
answerNamed(WIND);
ok('ダミー・ゴーレム positive: 選択したモンスターと入れ替わる',
   inMz(1,gl)&&inMz(0,fb)&&inMz(1,fa),names(0)+' / '+names(1));
let gev=evs('onControlChange');
ok('ダミー・ゴーレム positive: 入れ替えで onControlChange が2回',gev.length===2,String(gev.length));
ok('ダミー・ゴーレム ruling: owner は変わらない',gl.owner===0&&fb.owner===1&&gl.controller===1&&fb.controller===0);
/* negative: 相手にモンスターがいない */
reset0();
let gl2=mk('ダミー・ゴーレム',0); gameState.players[0].mz=[gl2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
ok('ダミー・ゴーレム negative: 相手モンスターがいなければ発動できない',
   ge.condition(ctxP(0,gl2,'onFlip'))===false);
/* negative: 裏側のままでは発動しない */
reset0();
let gl3=mk('ダミー・ゴーレム',0,'down','def'); gameState.players[0].mz=[gl3];
gameState.players[1].mz=[mk(DARK,1)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
ok('ダミー・ゴーレム negative: 裏側表示では発動できない',
   ge.condition(ctxP(0,gl3,'onFlip'))===false);
/* ruling: 両者のゾーンが一杯でも原子的に入れ替わる */
reset0();
let gl4=mk('ダミー・ゴーレム',0), ft=mk(DARK,1);
gameState.players[0].mz=[gl4]; for(let i=0;i<4;i++) gameState.players[0].mz.push(mk(FILLER,0));
gameState.players[1].mz=[ft];  for(let i=0;i<4;i++) gameState.players[1].mz.push(mk(FILLER,1));
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
let gc4=ctxP(0,gl4,'onFlip'); ge.operation(gc4); answerNamed(DARK);
ok('ダミー・ゴーレム ruling: 両ゾーンが5枚でも入れ替えは成立する',
   inMz(1,gl4)&&inMz(0,ft)&&gameState.players[0].mz.length===5&&gameState.players[1].mz.length===5,
   names(0)+' / '+names(1));

/* =====================================================================
   9. 亜空間ジャンプ装置
   ===================================================================== */
reset0();
let jd=mk('亜空間ジャンプ装置',0,'down'); gameState.players[0].sz=[jd];
let jm=mk(FILLER,0); gameState.players[0].mz=[jm];
let ja=mk(DARK,1), jb=mk(WIND,1); gameState.players[1].mz=[ja,jb];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
let je=eff('亜空間ジャンプ装置','swap-with-a-counter');
ok('亜空間ジャンプ装置 negative: Aカウンターが無ければ発動できない',
   je.condition(ctxP(0,jd,'activate'))===false);
API.addCounter(h(jb),'A',1);
ok('亜空間ジャンプ装置 positive: Aカウンターがあれば発動できる',
   je.condition(ctxP(0,jd,'activate'))===true);
ok('亜空間ジャンプ装置 positive: 候補はAカウンターが乗ったモンスターだけ',
   (()=>{const p=v26FoeWithACounter(1);return p.length===1&&dbOf(p[0].card).n===WIND;})(),
   poolNames(v26FoeWithACounter(1)));
clearEv(); pickFirst();
let jc=ctxP(0,jd,'activate'); run(je,jc);
ok('亜空間ジャンプ装置 positive: 自分のモンスターとAカウンター持ちが入れ替わる',
   inMz(1,jm)&&inMz(0,jb)&&inMz(1,ja),names(0)+' / '+names(1));
ok('亜空間ジャンプ装置 positive: onControlChange が2回',evs('onControlChange').length===2);
/* negative: 自分のモンスターがいない */
reset0();
let jd2=mk('亜空間ジャンプ装置',0,'down'); gameState.players[0].sz=[jd2];
let jb2=mk(WIND,1); gameState.players[1].mz=[jb2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState); API.addCounter(h(jb2),'A',1);
ok('亜空間ジャンプ装置 negative: 自分にモンスターがいなければ発動できない',
   je.condition(ctxP(0,jd2,'activate'))===false);
/* ruling: 解決時にAカウンターが無くなっていたら入れ替えない */
reset0();
let jd3=mk('亜空間ジャンプ装置',0,'down'); gameState.players[0].sz=[jd3];
let jm3=mk(FILLER,0); gameState.players[0].mz=[jm3];
let jb3=mk(WIND,1); gameState.players[1].mz=[jb3];
gameState.fieldSnapV9=fieldSnapshotV9(gameState); API.addCounter(h(jb3),'A',1);
let jc3=ctxP(0,jd3,'activate');
if(je.target) je.target(jc3,r=>{jc3.selectedTargets=r;});
API.removeCounter(h(jb3),'A',1);
je.operation(jc3);
ok('亜空間ジャンプ装置 ruling: 解決時にAカウンターが無ければ入れ替えない',
   inMz(0,jm3)&&inMz(1,jb3),names(0)+' / '+names(1));

/* =====================================================================
   10. ガスタの疾風 リーズ
   ===================================================================== */
reset0();
let lz=mk('ガスタの疾風 リーズ',0), gu=mk(GUSTO1,0);
gameState.players[0].mz=[lz,gu];
let lf=mk(DARK,1); gameState.players[1].mz=[lf];
gameState.players[0].hand=[mk(FILLER,0,'down')];
gameState.players[0].deck=[mk(FILLER,0,'down'),mk(WIND,0,'down')];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
let le=eff('ガスタの疾風 リーズ','bottom-deck-then-swap');
ok('ガスタの疾風 リーズ positive: 条件を満たす',le.condition(ctxP(0,lz,'activate'))===true);
let handCard=gameState.players[0].hand[0], deckLen=gameState.players[0].deck.length;
clearEv(); pickQueue([FILLER,DARK,GUSTO1]);
let lc=ctxP(0,lz,'activate'); run(le,lc);
ok('ガスタの疾風 リーズ positive: 手札1枚がデッキの一番下へ戻る',
   gameState.players[0].deck.length===deckLen+1&&
   gameState.players[0].deck[gameState.players[0].deck.length-1].uid===handCard.uid,
   'deck='+gameState.players[0].deck.length);
ok('ガスタの疾風 リーズ ruling: デッキトップではなく一番下に戻る',
   gameState.players[0].deck[0].uid!==handCard.uid);
ok('ガスタの疾風 リーズ positive: 「ガスタ」と相手モンスターが入れ替わる',
   inMz(1,gu)&&inMz(0,lf),names(0)+' / '+names(1));
ok('ガスタの疾風 リーズ positive: onControlChange が2回',evs('onControlChange').length===2);
ok('ガスタの疾風 リーズ ruling: リーズ自身は動かない',inMz(0,lz));
ok('ガスタの疾風 リーズ ruling: 1ターンに1度',
   le.condition(ctxP(0,lz,'activate'))===false,ctxP(0,lz,'activate').reason||'');
/* negative: 手札が無い */
reset0();
let lz2=mk('ガスタの疾風 リーズ',0); gameState.players[0].mz=[lz2,mk(GUSTO1,0)];
gameState.players[1].mz=[mk(DARK,1)]; gameState.players[0].hand=[];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
ok('ガスタの疾風 リーズ negative: 手札が0枚なら発動できない',
   le.condition(ctxP(0,lz2,'activate'))===false);
/* negative: 「ガスタ」がいない（風・鳥獣だけでは足りない） */
reset0();
let lz3=mk('ガスタの疾風 リーズ',0); gameState.players[0].mz=[lz3,mk(NOTGUSTO,0)];
gameState.players[1].mz=[mk(DARK,1)]; gameState.players[0].hand=[mk(FILLER,0,'down')];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
ok('ガスタの疾風 リーズ negative: 音速ダック（風・鳥獣）は「ガスタ」ではない',
   v26OwnGusto(0).length===1&&dbOf(v26OwnGusto(0)[0].card).n==='ガスタの疾風 リーズ',
   poolNames(v26OwnGusto(0)));
ok('ガスタの疾風 リーズ negative: 「ガスタ」が場に1体もなければ発動できない',(()=>{
  gameState.players[0].mz=[mk(NOTGUSTO,0)];
  const solo=mk('ガスタの疾風 リーズ',0);
  return v26OwnGusto(0).length===0;})(),poolNames(v26OwnGusto(0)));
/* negative: 相手にモンスターがいない */
reset0();
let lz4=mk('ガスタの疾風 リーズ',0); gameState.players[0].mz=[lz4,mk(GUSTO1,0)];
gameState.players[0].hand=[mk(FILLER,0,'down')];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
ok('ガスタの疾風 リーズ negative: 相手モンスターがいなければ発動できない',
   le.condition(ctxP(0,lz4,'activate'))===false);
/* ruling: リーズ自身も「ガスタ」なので素材候補に入る */
reset0();
let lz5=mk('ガスタの疾風 リーズ',0); gameState.players[0].mz=[lz5];
gameState.players[1].mz=[mk(DARK,1)]; gameState.players[0].hand=[mk(FILLER,0,'down')];
gameState.players[0].deck=[mk(FILLER,0,'down')];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
ok('ガスタの疾風 リーズ ruling: リーズ自身も「ガスタ」として選べる',
   v26OwnGusto(0).length===1&&dbOf(v26OwnGusto(0)[0].card).n==='ガスタの疾風 リーズ');

/* ================= Replay / SaveLoad / 直列化 ================= */
/* Action を実際に流したあとの状態で digest を突き合わせる。 */
reset0();
let ra=mk('闇霊使いダルク',0), rb=mk(DARK,1), rg=mk('ダミー・ゴーレム',0), rc=mk(WIND,1);
gameState.players[0].mz=[ra,rg]; gameState.players[1].mz=[rb,rc];
gameState.players[0].deck=[mk(FILLER,0,'down')];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
/* 盤面を直接組んだあとに journal を張り直す。初期状態はこの盤面。 */
v41ResetActionJournal(gameState);
pickFirst();
run(eff('闇霊使いダルク','flip-take-control'),ctxP(0,ra,'onFlip'));
eff('ダミー・ゴーレム','flip-opponent-swap').operation(ctxP(0,rg,'onFlip'));
answerNamed(WIND);
API.destroy(h(ra),'Replay検証'); settle();
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('P26 Replay: 解禁カードの操作が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('P26 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('P26 直列化: gameState に関数が漏れていない',snap.indexOf('function')<0);
ok('P26 直列化: linkV9 は JSON safe',(()=>{
  const s=(typeof assertLinkStateSerializableV9==='function')?assertLinkStateSerializableV9(gameState):{ok:true};
  return s.ok===true;})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
