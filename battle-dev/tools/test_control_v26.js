/* System v26 — Control Event / Source-Linked Control / Atomic Swap の基盤テスト。
   カード個別の TESTED 判定の証拠にはしない。 */
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
}
function h(c){ return locateCardAnyV4(c); }
function ev(name){ return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt); }
function clearEv(){ gameState.deferredEvents=[]; }
function ctrl(){ return gameState.deferredEvents ? ev('onControlChange') : []; }
function zoneOf(p){ return (gameState.players[p].mz||[]).map(c=>c&&dbOf(c).n); }
function inMz(p,c){ return (gameState.players[p].mz||[]).some(x=>x&&x.uid===c.uid); }
function fill(p,n,name){ for(let i=0;i<n;i++) gameState.players[p].mz.push(mk(name,p)); }
/* v9 のリンク解決は act() のルール処理点から走る。テストでは明示的に回す。 */
function settle(){ if(typeof enforceLinkedLeaveV9==='function') enforceLinkedLeaveV9(gameState); }
const A='ヂェミナイ・エルフ', B='セイバーザウルス', C='ライオウ', SRC='D2シールド';
const FILLER='おジャマ・イエロー';

/* =====================================================================
   P26-A  Control Change Event
   ===================================================================== */
reset0();
ok('v26: onControlChange が EVENTS に登録されている',EVENTS.indexOf('onControlChange')>=0);
ok('v26: API が公開されている',
   typeof API.linkControlReturn==='function'&&typeof API.swapControl==='function');
ok('v26: v9 に controlReturn が追加されている',LINK_ON_GONE_V9.indexOf('controlReturn')>=0);
ok('v26: 裏側化の検出関数がある',typeof flippedFaceDownV9==='function');

/* 1. 通常の成功 → event 1 */
reset0();
let t1=mk(A,1);gameState.players[1].mz=[t1];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
clearEv();
API.changeControl(h(t1),0,'テスト奪取');
ok('P26-A positive: コントロールが移る',inMz(0,t1)&&!inMz(1,t1));
ok('P26-A positive: イベントがちょうど1回',ctrl().length===1,String(ctrl().length));
let e1=ctrl()[0];
ok('P26-A positive: from/to が正しい',e1.fromPlayer===1&&e1.toPlayer===0,JSON.stringify(e1));
ok('P26-A positive: uid が正しい',e1.uid===t1.uid);
ok('P26-A positive: zone が載る',e1.zone==='mz');
ok('P26-A positive: reason が載る',e1.reason==='テスト奪取');
ok('P26-A: payload は純JSON',(()=>{try{JSON.parse(JSON.stringify(e1));return true;}catch(x){return false;}})());

/* sourceUid */
reset0();
let t1b=mk(A,1),src1=mk(SRC,0);
gameState.players[1].mz=[t1b];gameState.players[0].sz=[src1];
clearEv();
API.changeControl(h(t1b),0,'テスト',null,h(src1));
ok('P26-A positive: sourceUid が載る',ctrl()[0].sourceUid===src1.uid,JSON.stringify(ctrl()[0]));
ok('P26-A: source 未指定なら sourceUid は null',(()=>{
  reset0();const x=mk(A,1);gameState.players[1].mz=[x];clearEv();
  API.changeControl(h(x),0,'テスト');
  return ctrl()[0].sourceUid===null;})());

/* 2. ゾーン満杯で失敗 → event 0 */
reset0();
let t2=mk(A,1);gameState.players[1].mz=[t2];
fill(0,ZONE_LIMITS.mz,FILLER);
clearEv();
API.changeControl(h(t2),0,'テスト');
ok('P26-A negative: 満杯ならコントロールは移らない',inMz(1,t2)&&!inMz(0,t2));
ok('P26-A negative: 失敗時はイベントが出ない',ctrl().length===0,String(ctrl().length));

/* 3. endPhase の返却 → reason:'return' */
reset0();
let t3=mk(A,1);gameState.players[1].mz=[t3];
API.changeControl(h(t3),0,'一時奪取','endPhase');
clearEv();
act({type:'CONTROL_RETURN'});
ok('P26-A positive: 返却でもイベントが出る',ctrl().length===1,String(ctrl().length));
ok('P26-A positive: 返却は reason で区別できる',ctrl()[0].reason==='return',JSON.stringify(ctrl()[0]));
ok('P26-A positive: 返却の from/to が正しい',
   ctrl()[0].fromPlayer===0&&ctrl()[0].toPlayer===1);
ok('P26-A positive: 返却後は元のコントローラへ',inMz(1,t3));

/* 7. 二重 emit が無い */
reset0();
let t7=mk(A,1);gameState.players[1].mz=[t7];
clearEv();
API.changeControl(h(t7),0,'テスト');
API.changeControl(h(t7),1,'テスト戻し');
ok('P26-A: 2回の変更でイベントは2回だけ',ctrl().length===2,String(ctrl().length));
ok('P26-A: 2回目の from/to が正しい',
   ctrl()[1].fromPlayer===0&&ctrl()[1].toPlayer===1);

/* 6. Replay */
reset0();
let r1=mk(A,1);gameState.players[1].mz=[r1];
v41ResetActionJournal(gameState);
API.changeControl(h(r1),0,'Replayテスト');
let auditA=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('P26-A Replay: digest 一致で再生される',auditA.ok,auditA.reason||auditA.finalDigest);

/* =====================================================================
   P26-B  Source-Linked Control Duration
   ===================================================================== */
function setupLease(sourceFace){
  reset0();
  const stolen=mk(A,1), source=mk(SRC,0,sourceFace||'up');
  gameState.players[1].mz=[stolen];
  gameState.players[0].sz=[source];
  API.changeControl(h(stolen),0,'奪取',null,h(source));
  API.linkControlReturn(h(stolen),h(source),{label:'テストリース'});
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);
  return {stolen,source};
}
/* 1. source が居る間は維持 */
let s1=setupLease();
ok('P26-B positive: source がある間はコントロールが移ったまま',inMz(0,s1.stolen));
ok('P26-B: リースは linkV9 に純JSONで載る',(()=>{
  const w=(s1.stolen.linkV9||{}).watch||[];
  const hit=w.find(x=>x&&x.onGone==='controlReturn');
  return !!hit&&hit.uid===s1.source.uid&&hit.returnTo===1&&hit.onFaceDown===true;})(),
  JSON.stringify(s1.stolen.linkV9));
settle();
ok('P26-B negative: 何も起きなければ戻らない',inMz(0,s1.stolen));

/* 2. source を破壊 → 戻る */
let s2=setupLease();
API.destroy(h(s2.source),'テスト破壊');
settle();
ok('P26-B positive: source が破壊されたら戻る',inMz(1,s2.stolen)&&!inMz(0,s2.stolen));
ok('P26-B positive: controller が元へ',s2.stolen.controller===1);
ok('P26-B positive: owner は変わらない',s2.stolen.owner===1);
ok('P26-B: 使い終わったリースは消える',
   !(s2.stolen.linkV9&&(s2.stolen.linkV9.watch||[]).some(w=>w&&w.onGone==='controlReturn')));

/* 3. banish */
let s3=setupLease();
act({type:'FX_BANISH',player:0,zone:'sz',index:0,reason:'テスト除外'});
settle();
ok('P26-B positive: source が除外されたら戻る',inMz(1,s3.stolen));
/* 4. 手札へ */
let s4=setupLease();
act({type:'FX_BOUNCE',player:0,zone:'sz',index:0,reason:'テストバウンス'});
settle();
ok('P26-B positive: source が手札へ戻ったら戻る',inMz(1,s4.stolen));
/* 5. デッキへ */
let s5=setupLease();
act({type:'FX_RETURN_DECK',player:0,zone:'sz',index:0,reason:'テストデッキ戻し'});
settle();
ok('P26-B positive: source がデッキへ戻ったら戻る',inMz(1,s5.stolen));

/* 11. source が裏側になった場合 */
let s11=setupLease();
act({type:'FX_SET_STATE',player:0,zone:'sz',index:0,face:'down',reason:'テスト裏側'});
settle();
ok('P26-B positive: source が裏側になったら戻る（表側表示で存在する限り）',
   inMz(1,s11.stolen)&&!inMz(0,s11.stolen));
/* onFaceDown:false なら裏側では戻らない */
reset0();
let nf=mk(A,1), nsrc=mk(SRC,0,'up');
gameState.players[1].mz=[nf];gameState.players[0].sz=[nsrc];
API.changeControl(h(nf),0,'奪取',null,h(nsrc));
API.linkControlReturn(h(nf),h(nsrc),{onFaceDown:false,label:'裏側は無視'});
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
act({type:'FX_SET_STATE',player:0,zone:'sz',index:0,face:'down',reason:'テスト裏側'});
settle();
ok('P26-B: onFaceDown:false なら裏側化では戻らない',inMz(0,nf));
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'テスト',byDestroy:true});
settle();
ok('P26-B: それでも場を離れれば戻る',inMz(1,nf));

/* 6. source が離れて戻っても古いリースは復活しない */
let s6=setupLease();
API.destroy(h(s6.source),'テスト破壊');
settle();
ok('P26-B: いったん戻っている',inMz(1,s6.stolen));
/* 同じカード実体を場へ戻す（uid は同じ） */
const graveIdx=(gameState.players[0].grave||[]).findIndex(c=>c&&c.uid===s6.source.uid);
act({type:'MOVE',player:0,from:'grave',fromIndex:graveIdx,to:'sz',face:'up'});
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
API.destroy(h(s6.source),'テスト再破壊');
settle();
ok('P26-B: source が戻ってきても古いリースは復活しない',
   inMz(1,s6.stolen)&&!inMz(0,s6.stolen));

/* 7. 返却先が満杯 → 既存 fallback（墓地へ） */
reset0();
let f1=mk(A,1), fsrc=mk(SRC,0);
gameState.players[1].mz=[f1];gameState.players[0].sz=[fsrc];
API.changeControl(h(f1),0,'奪取',null,h(fsrc));
API.linkControlReturn(h(f1),h(fsrc),{label:'テスト'});
fill(1,ZONE_LIMITS.mz,FILLER);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
API.destroy(h(fsrc),'テスト破壊');
settle();
ok('P26-B: 返却先が満杯なら既存の裁定どおり墓地へ',
   !inMz(0,f1)&&!inMz(1,f1)&&(gameState.players[1].grave||[]).some(c=>c&&c.uid===f1.uid));

/* 8. endPhase 返却との競合 */
reset0();
let g1=mk(A,1), gsrc=mk(SRC,0);
gameState.players[1].mz=[g1];gameState.players[0].sz=[gsrc];
API.changeControl(h(g1),0,'一時奪取','endPhase',h(gsrc));
API.linkControlReturn(h(g1),h(gsrc),{label:'テスト'});
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
clearEv();
act({type:'CONTROL_RETURN'});          /* 先に endPhase 返却 */
ok('P26-B 競合: endPhase 返却が先に走る',inMz(1,g1));
ok('P26-B 競合: 返却イベントは1回',ctrl().length===1,String(ctrl().length));
API.destroy(h(gsrc),'あとから source 破壊');
settle();
ok('P26-B 競合: そのあと source が消えても二重返却しない',
   inMz(1,g1)&&(gameState.players[1].mz||[]).filter(c=>c&&c.uid===g1.uid).length===1);
/* 逆順: source が先に消える → その後 endPhase */
reset0();
let g2=mk(A,1), gsrc2=mk(SRC,0);
gameState.players[1].mz=[g2];gameState.players[0].sz=[gsrc2];
API.changeControl(h(g2),0,'一時奪取','endPhase',h(gsrc2));
API.linkControlReturn(h(g2),h(gsrc2),{label:'テスト'});
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
API.destroy(h(gsrc2),'テスト破壊');
settle();
ok('P26-B 競合: source が先に消えれば source 連動で戻る',inMz(1,g2));
clearEv();
act({type:'CONTROL_RETURN'});
ok('P26-B 競合: そのあと endPhase が来ても二重返却しない',
   inMz(1,g2)&&ctrl().length===0,String(ctrl().length));

/* 9. 複数カードに同時リース */
reset0();
let m1=mk(A,1), m2=mk(B,1), msrc=mk(SRC,0);
gameState.players[1].mz=[m1,m2];gameState.players[0].sz=[msrc];
API.changeControl(h(m1),0,'奪取1',null,h(msrc));
API.changeControl(h(m2),0,'奪取2',null,h(msrc));
API.linkControlReturn(h(m1),h(msrc),{label:'テスト'});
API.linkControlReturn(h(m2),h(msrc),{label:'テスト'});
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
ok('P26-B 複数: 2枚とも奪えている',inMz(0,m1)&&inMz(0,m2));
API.destroy(h(msrc),'テスト破壊');
settle();
ok('P26-B 複数: source が消えたら2枚とも戻る',inMz(1,m1)&&inMz(1,m2));

/* 10. Replay */
reset0();
let rb=mk(A,1), rsrc=mk(SRC,0);
gameState.players[1].mz=[rb];gameState.players[0].sz=[rsrc];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.changeControl(h(rb),0,'奪取',null,h(rsrc));
API.linkControlReturn(h(rb),h(rsrc),{label:'テスト'});
API.destroy(h(rsrc),'テスト破壊');
settle();
let auditB=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('P26-B Replay: source 連動の返却が digest 一致で再生される',
   auditB.ok,auditB.reason||auditB.finalDigest);
let snapB=JSON.stringify(gameState);
ok('P26-B SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snapB))===snapB);
ok('P26-B 直列化: linkV9 は純JSONのまま',
   assertLinkStateSerializableV9(gameState).ok===true,
   assertLinkStateSerializableV9(gameState).why||'');

/* =====================================================================
   P26-C  Atomic Control Swap
   ===================================================================== */
/* 1. 通常の入れ替え */
reset0();
let a1=mk(A,0), b1=mk(B,1);
gameState.players[0].mz=[a1];gameState.players[1].mz=[b1];
clearEv();
ok('P26-C positive: 入れ替えを実行できる',API.swapControl(h(a1),h(b1),'テスト交換')===true);
ok('P26-C positive: 相互にコントロールが移る',inMz(1,a1)&&inMz(0,b1));
ok('P26-C positive: controller が入れ替わる',a1.controller===1&&b1.controller===0);
ok('P26-C positive: owner は変わらない',a1.owner===0&&b1.owner===1);
ok('P26-C positive: イベントはちょうど2回',ctrl().length===2,String(ctrl().length));
ok('P26-C positive: 順序は a → b で決定的',
   ctrl()[0].uid===a1.uid&&ctrl()[1].uid===b1.uid,
   ctrl().map(e=>e.uid).join(','));
ok('P26-C positive: 各イベントの from/to が正しい',
   ctrl()[0].fromPlayer===0&&ctrl()[0].toPlayer===1
   &&ctrl()[1].fromPlayer===1&&ctrl()[1].toPlayer===0);

/* 2. 両側満杯でも成立する */
reset0();
let a2=mk(A,0), b2=mk(B,1);
gameState.players[0].mz=[a2];gameState.players[1].mz=[b2];
fill(0,ZONE_LIMITS.mz-1,FILLER);
fill(1,ZONE_LIMITS.mz-1,FILLER);
ok('前提: 両側が満杯',
   gameState.players[0].mz.length===ZONE_LIMITS.mz&&gameState.players[1].mz.length===ZONE_LIMITS.mz);
clearEv();
API.swapControl(h(a2),h(b2),'満杯交換');
ok('P26-C 満杯: 両側満杯でも入れ替わる',inMz(1,a2)&&inMz(0,b2));
ok('P26-C 満杯: 枚数は変わらない',
   gameState.players[0].mz.length===ZONE_LIMITS.mz&&gameState.players[1].mz.length===ZONE_LIMITS.mz);
ok('P26-C 満杯: イベント2回',ctrl().length===2);
/* 比較: FX_CONTROL ×2 では満杯時に片方が失敗する */
reset0();
let x1=mk(A,0), x2=mk(B,1);
gameState.players[0].mz=[x1];gameState.players[1].mz=[x2];
fill(0,ZONE_LIMITS.mz-1,FILLER);
fill(1,ZONE_LIMITS.mz-1,FILLER);
API.changeControl(h(x1),1,'素朴な移動');
ok('P26-C 比較: FX_CONTROL 単独では満杯側へ移せない（だから atomic が要る）',
   inMz(0,x1));

/* 3. 片側だけ満杯 */
reset0();
let a3=mk(A,0), b3=mk(B,1);
gameState.players[0].mz=[a3];gameState.players[1].mz=[b3];
fill(1,ZONE_LIMITS.mz-1,FILLER);
API.swapControl(h(a3),h(b3),'片側満杯');
ok('P26-C 片側満杯: 入れ替わる',inMz(1,a3)&&inMz(0,b3));

/* 4. 片側が不在 */
reset0();
let a4=mk(A,0), b4=mk(B,1);
gameState.players[0].mz=[a4];gameState.players[1].mz=[b4];
let ha4=h(a4), hb4=h(b4);
API.sendToGrave(hb4,'先に退場');
clearEv();
act({type:'CONTROL_SWAP_V26',aPlayer:0,aIndex:0,aUid:a4.uid,
     bPlayer:1,bIndex:0,bUid:b4.uid,reason:'不在テスト'});
ok('P26-C 不在: 片方が居なければ交換は不成立',inMz(0,a4));
ok('P26-C 不在: 部分的な移動が起きない',
   (gameState.players[1].mz||[]).length===0);
ok('P26-C 不在: イベントは出ない',ctrl().length===0,String(ctrl().length));

/* 5. 不正な対象 */
reset0();
let a5=mk(A,0), b5=mk(B,0);
gameState.players[0].mz=[a5,b5];
clearEv();
ok('P26-C 不正: 同じ側どうしは拒否される',API.swapControl(h(a5),h(b5),'同側')===false);
ok('P26-C 不正: 盤面が変わらない',inMz(0,a5)&&inMz(0,b5)&&ctrl().length===0);
reset0();
let a6=mk(A,0);
gameState.players[0].mz=[a6];
ok('P26-C 不正: 同じカードは拒否される',API.swapControl(h(a6),h(a6),'同一')===false);
reset0();
let a7=mk(A,0), hand7=mk(B,1);
gameState.players[0].mz=[a7];gameState.players[1].hand=[hand7];
ok('P26-C 不正: モンスターゾーン以外は拒否される',
   API.swapControl(h(a7),h(hand7),'手札')===false);
/* uid 不一致（解決時に入れ替わっていた） */
reset0();
let a8=mk(A,0), b8=mk(B,1);
gameState.players[0].mz=[a8];gameState.players[1].mz=[b8];
clearEv();
act({type:'CONTROL_SWAP_V26',aPlayer:0,aIndex:0,aUid:a8.uid,
     bPlayer:1,bIndex:0,bUid:999999,reason:'uid不一致'});
ok('P26-C 不正: uid が合わなければ全体不成立',
   inMz(0,a8)&&inMz(1,b8)&&ctrl().length===0);

/* 6. トークン */
reset0();
let a9=mk(A,0);
gameState.players[0].mz=[a9];
API.createToken(1,{name:'テストトークン',key:'v26.tok',atk:0,def:0,lv:1,at:'闇',ra:'戦士',pos:'atk'},1);
let tok=gameState.players[1].mz[0];
ok('前提: トークンが出ている',!!tok&&!!tok.token);
clearEv();
API.swapControl(h(a9),h(tok),'トークン交換');
ok('P26-C トークン: トークンとも入れ替えられる',
   inMz(1,a9)&&(gameState.players[0].mz||[]).some(c=>c&&c.token));
ok('P26-C トークン: イベント2回',ctrl().length===2);

/* 7. owner/controller の差分が保たれる */
reset0();
let oc=mk(A,1);
gameState.players[1].mz=[oc];
API.changeControl(h(oc),0,'先に奪取');
let oc2=mk(B,1);
gameState.players[1].mz.push(oc2);
ok('前提: owner と controller が食い違っている',oc.owner===1&&oc.controller===0);
API.swapControl(h(oc),h(oc2),'差分テスト');
ok('P26-C owner: 交換しても owner は不変',oc.owner===1&&oc2.owner===1);
ok('P26-C owner: controller だけが入れ替わる',oc.controller===1&&oc2.controller===0);

/* 10. Replay */
reset0();
let rc1=mk(A,0), rc2=mk(B,1);
gameState.players[0].mz=[rc1];gameState.players[1].mz=[rc2];
fill(0,ZONE_LIMITS.mz-1,FILLER);
fill(1,ZONE_LIMITS.mz-1,FILLER);
v41ResetActionJournal(gameState);
API.swapControl(h(rc1),h(rc2),'Replay交換');
let auditC=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('P26-C Replay: 満杯どうしの交換が digest 一致で再生される',
   auditC.ok,auditC.reason||auditC.finalDigest);
let snapC=JSON.stringify(gameState);
ok('P26-C SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snapC))===snapC);

/* =====================================================================
   非回帰 / 直列化
   ===================================================================== */
reset0();
ok('v26 非回帰: 新しい gameState キーを作っていない',(()=>{
  const g=newGame();
  return g.controlLeaseV26===undefined&&g.lastControlV26===undefined
    &&g.controlSwapV26===undefined;})());
reset0();
ok('v26 非回帰: コントロールを使わない局面の digest に v26 の追記が無い',
   v41StateDigestText(gameState).indexOf('V26')<0
   &&v41StateDigestText(gameState).indexOf('controlLease')<0);
reset0();
ok('v26 非回帰: endPhase 返却は従来通り動く',(()=>{
  const c=mk(A,1);gameState.players[1].mz=[c];
  API.changeControl(h(c),0,'一時','endPhase');
  const moved=inMz(0,c);
  act({type:'CONTROL_RETURN'});
  return moved&&inMz(1,c);})());
reset0();
ok('v26 非回帰: 既存の linkOnLeave（destroy）は従来通り',(()=>{
  const me=mk(A,0), watched=mk(B,0);
  gameState.players[0].mz=[me,watched];
  API.linkOnLeave(h(me),h(watched),'destroy','テスト');
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);
  API.sendToGrave(h(watched),'テスト');
  settle();
  return !inMz(0,me);})());
reset0();
ok('v26 非回帰: v9 の onLeaveField は従来通り出る',(()=>{
  const c=mk(A,0);gameState.players[0].mz=[c];
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);
  clearEv();
  API.sendToGrave(h(c),'テスト');
  return ev('onLeaveField').length===1;})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
