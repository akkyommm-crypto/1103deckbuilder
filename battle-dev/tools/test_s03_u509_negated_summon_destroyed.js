/* S03-U509: 召喚を無効にされたモンスターが「破壊され墓地へ送られた」扱いになるようにした単位
   （5-a #1-j の**手札から出した召喚の分**。挙動の変更あり）。

   S03-U501 で実測した食い違い: 手札から出した召喚を無効にすると、取り消しが素の MOVE だったので
   そのモンスターのイベントが 1 つも積まれず、graveInfo も付かなかった。

   当時裁定（**回答日つき**。発動できる側）
     `WIKI-EFB088FAC57A`（**2010-05-17**、《アマゾネスの里》）
       「《神の宣告》でアマゾネスの召喚を無効にし破壊され墓地へ送られた時も、効果を発動できますか？」
       →「はい、その場合でも発動できます。(10/05/17)」
     `WIKI-0A19E6117879`（**2010-06-05**、《人造人間－サイコ・リターナー》）
       「このカードの召喚などを《神の宣告》などで無効にされ墓地へ送られた場合でも効果は発動できますか？」
       →「はい、できます。(10/06/05)」
     `WIKI-D70393946D93`（**2010-09-16**、《聖騎士ジャンヌ》）
       「《神の警告》で召喚を無効にされるなど、**フィールド上以外で破壊され墓地へ送られた**場合、
         効果は発動できますか？」→「はい、発動できます。(10/09/16)」
     `WIKI-6745DCCBE047`（**2010-07-18**、《スクラップ・ツイン・ドラゴン》）・
     `WIKI-EFE5568A43B4`（**2010-05-18**、《ブラック・ブルドラゴ》）はシンクロ召喚の側（本単位の対象外）。

   当時裁定（フィールドでの破壊**ではない**側）
     `WIKI-643A78AB3480`（**2008-03-19**）「『フィールド上のモンスターを破壊する』扱いではありません」
     `WIKI-9E991E9B14E9`（**2010-04-21**）「フィールド上で破壊された扱いではない」
     `WIKI-2C8BE04F46E9` / `WIKI-2ABC596B02C7`（**2007-03-26**）通常召喚の権利は戻らない
     `R1103-WARNING-002`（**回答日なし**）《クリッター》《カードガンナー》のように
       「フィールドから墓地へ送られた場合」と書いてあるものは発動しない

   入れた形: 取り消しを**手札からの効果破壊**にした（`FX_TO_GRAVE` の zone 'hand' ＋ `byDestroy`）。
   実測（S03-U509）で、この Action は graveInfo を {from:'hand', byDestroy:true} にし、
   onDestroy と onSendToGrave だけを積み、onRemove も onLeaveField も積まない。
   つまり当時裁定の両側（発動できる／フィールドでの破壊ではない）を同時に満たす。

   固定するもの:
     A 取り消しの形（通常召喚・手札からの特殊召喚手順）
     B 当時裁定の場面（発動できる 2 件と、発動しない 1 件）
     C negative control（反転召喚・解決中の召喚・手札に戻す枝・通常召喚の権利）
     D 共有ヘルパ `e8FromFieldToGrave` は変えていない
     E Replay 監査
     F 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S509 = pathA.resolve(__dirname, '..');
const rdS509 = p => fsA.readFileSync(pathA.join(ROOT_S509, p), 'utf8');
const SRC_S509 = {
  'cards/E1_auto_cycle39.js': rdS509('cards/E1_auto_cycle39.js'),
  'docs/S03_MISSED_TIMING_DESIGN.md': rdS509('docs/S03_MISSED_TIMING_DESIGN.md'),
  'docs/S03_MISSED_TIMING_RULINGS.md': rdS509('docs/S03_MISSED_TIMING_RULINGS.md'),
  'docs/S03_U509_REPORT.md': rdS509('docs/S03_U509_REPORT.md'),
  'engine/40_legal_script_engine.js': rdS509('engine/40_legal_script_engine.js'),
  'tools/check.py': rdS509('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function graveCard(p,uid){return (gameState.players[p].grave||[]).find(c=>c&&c.uid===uid)||null;}
let STEPS=[], QLOG=[];
(function(){
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31;
    try{return h.apply(this,arguments);}finally{
      if(d===0)STEPS.push({t:(a&&a.type)||'?',zone:(a&&a.zone)||'',byDestroy:!!(a&&a.byDestroy)});}};
  /* 応答できるカードが無いと emitEvent は呼ばれないので、起きたことは**積まれた**方で見る（S03-U500 の教訓） */
  const qd=queueDeferredEventV2;queueDeferredEventV2=function(name,evt){
    QLOG.push({name,uid:(evt&&evt.uid)!=null?evt.uid:((evt&&evt.card&&evt.card.uid)!=null?evt.card.uid:null)});
    return qd.apply(this,arguments);};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();STEPS=[];QLOG=[];TOASTS.length=0;
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setTrap(nm,p){const c=mk(nm,p,'down');c.setTurn=gameState.turn-1;return c;}
function actTypes(){return STEPS.map(x=>x.t);}
function ownEvents(uid){return QLOG.filter(x=>x.uid===uid).map(x=>x.name);}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function driveToResolvedWindow(){for(let i=0;i<120;i++){
  if(gameState.pendingSummon&&!gameState.chain.length&&gameState.pendingSummon.resolvedSummonS03) return 'window';
  if(pc()){__choicePickV49(0);continue;}
  if(!step()) return 'idle';}
  return 'loop';}
function negateInWindow(name){const ps=gameState.pendingSummon;if(!ps)return 'no-window';
  const list=summonNegatorsV2(ps),hit=list.find(x=>x.db.n===name);
  if(!hit)return 'not-offered:'+JSON.stringify(list.map(x=>x.db.n));
  activateSummonNegatorV2(hit.p,hit.zone,hit.index);drive();return 'done';}
function handDestroyStep(){return STEPS.filter(x=>x.t==='FX_TO_GRAVE'&&x.zone==='hand'&&x.byDestroy===true).length;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}
`;

/* ===== A. 取り消しの形 ===== */
harness(COMMON + String.raw`
fresh();
const mon=mk('アマゾネスの剣士',0);
gameState.players[0].hand=[mon];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
finishNormalSummon(0,'atk',{bodies:0,value:0},null,null);
const r=negateInWindow('神の宣告');
drive();
const gi=(graveCard(0,mon.uid)||{}).graveInfo||null;
ok('A1 ★ UI 起点の通常召喚の取り消しは手札からの効果破壊（FX_TO_GRAVE zone hand + byDestroy）',
   r==='done' && zu(mon.uid)==='grave' && handDestroyStep()===1
   && !actTypes().includes('MOVE'),
   JSON.stringify({r,zone:zu(mon.uid),types:actTypes().filter(t=>/MOVE|FX_TO_GRAVE/.test(t))}));
ok('A2 ★ 積まれるのは onDestroy と onSendToGrave だけ（onRemove も onLeaveField も積まれない）'
   +'＝「フィールド上で破壊された」扱いにはならない（WIKI-643A78AB3480 08/03/19・WIKI-9E991E9B14E9 10/04/21）',
   ownEvents(mon.uid).indexOf('onDestroy')>=0 && ownEvents(mon.uid).indexOf('onSendToGrave')>=0
   && ownEvents(mon.uid).indexOf('onRemove')<0 && ownEvents(mon.uid).indexOf('onLeaveField')<0,
   JSON.stringify(ownEvents(mon.uid)));
ok('A3 ★ graveInfo は {from:hand, byDestroy:true}（from が mz ではないので「フィールドから墓地へ」の条件には当たらない）',
   !!gi && gi.from==='hand' && gi.byDestroy===true,
   JSON.stringify(gi));
audit('A');
`, {expect:4});

harness(COMMON + String.raw`
fresh();
const cd=mk('サイバー・ドラゴン',0);
gameState.players[0].hand=[cd];
gameState.players[1].mz=[mk('ワイト',1,'up')];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
finishSummonProcedure('サイバー・ドラゴン',0,'hand',0,'atk');
const r=negateInWindow('神の宣告');
drive();
ok('A4 ★ 手札からの特殊召喚手順も同じ形になる',
   r==='done' && zu(cd.uid)==='grave' && handDestroyStep()===1
   && ownEvents(cd.uid).indexOf('onDestroy')>=0 && ownEvents(cd.uid).indexOf('onSendToGrave')>=0
   && ownEvents(cd.uid).indexOf('onLeaveField')<0
   && ((graveCard(0,cd.uid)||{}).graveInfo||{}).from==='hand',
   JSON.stringify({r,own:ownEvents(cd.uid),gi:(graveCard(0,cd.uid)||{}).graveInfo}));
audit('A4');
`, {expect:2});

/* ===== B. 当時裁定の場面 ===== */
harness(COMMON + String.raw`
/* 《ダンディライオン》は「このカードが墓地へ送られた」だけを条件にする強制誘発。 */
fresh();
const mon=mk('ダンディライオン',0);
gameState.players[0].hand=[mon];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
finishNormalSummon(0,'atk',{bodies:0,value:0},null,null);
const r=negateInWindow('神の宣告');
drive();
ok('B1 ★ 《ダンディライオン》の召喚を無効にされると、綿毛トークン2体が出る（S03-U509 の前は出なかった）',
   r==='done' && zu(mon.uid)==='grave'
   && gameState.players[0].mz.filter(c=>c&&cardName(c)==='綿毛トークン').length===2,
   JSON.stringify({r,mz:gameState.players[0].mz.map(c=>c&&cardName(c))}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
/* WIKI-0A19E6117879（**回答日 2010-06-05**、掲載ページ《人造人間－サイコ・リターナー》）:
   「このカードの召喚などを《神の宣告》などで無効にされ墓地へ送られた場合でも効果は発動できますか？」
   →「はい、できます。(10/06/05)」 カード側の判定も S03-U509 で直した（それまでは graveInfo.from が
   mz / sz でなければ発動できなかった）。 */
fresh();
const mon=mk('人造人間－サイコ・リターナー',0);
gameState.players[0].hand=[mon];
const sh=mk('人造人間－サイコ・ショッカー',0);
gameState.players[0].grave=[sh];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
finishNormalSummon(0,'atk',{bodies:0,value:0},null,null);
const r=negateInWindow('神の宣告');
drive();
ok('B2 ★ 当時裁定 WIKI-0A19E6117879（10/06/05）: 召喚を無効にされても②を発動でき、'
   +'《人造人間－サイコ・ショッカー》が墓地から特殊召喚される',
   r==='done' && zu(mon.uid)==='grave' && zu(sh.uid)==='mz',
   JSON.stringify({r,mon:zu(mon.uid),shocker:zu(sh.uid),own:ownEvents(mon.uid)}));
audit('B2');
`, {expect:2});

harness(COMMON + String.raw`
/* 《クリッター》のテキストは「このカードが**フィールドから**墓地へ送られた場合」。
   R1103-WARNING-002（**回答日なし**）も「召喚無効時はフィールドに出る前の領域で破壊された扱いとなり、
   『フィールド上から墓地へ送られた』条件を満たさない」と言う。graveInfo.from が 'hand' なので当たらない。 */
fresh();
const mon=mk('クリッター',0);
gameState.players[0].hand=[mon];
gameState.players[0].deck.splice(1,0,mk('ワイト',0));
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
finishNormalSummon(0,'atk',{bodies:0,value:0},null,null);
const r=negateInWindow('神の宣告');
drive();
ok('B3 ★ negative control: 《クリッター》は発動しない（「フィールドから墓地へ送られた場合」なので）',
   r==='done' && zu(mon.uid)==='grave'
   && gameState.players[0].hand.length===0
   && ownEvents(mon.uid).indexOf('onSendToGrave')>=0,
   JSON.stringify({r,hand:gameState.players[0].hand.map(c=>cardName(c)),own:ownEvents(mon.uid)}));
audit('B3');
`, {expect:2});

/* ===== C. negative control（変えていない経路） ===== */
harness(COMMON + String.raw`
/* 反転召喚の取り消しは、そのカードが召喚の前から場に居るので変えていない。 */
fresh();
const f=mk('メデューサ・ワーム',0,'down','def'); f.setTurn=gameState.turn-1;
gameState.players[0].mz=[f];
gameState.players[1].mz=[mk('ワイト',1,'up')];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
doFlipUp(0,'mz',0,'atk');
const r=negateInWindow('神の宣告');
drive();
const gi=(graveCard(0,f.uid)||{}).graveInfo||null;
ok('C1 ★ negative control: 反転召喚の取り消しは今までどおり場からの破壊（from mz・onRemove と onLeaveField も積まれる）',
   r==='done' && zu(f.uid)==='grave' && handDestroyStep()===0
   && !!gi && gi.from==='mz' && gi.byDestroy===true
   && ownEvents(f.uid).indexOf('onLeaveField')>=0 && ownEvents(f.uid).indexOf('onRemove')>=0,
   JSON.stringify({r,gi,own:ownEvents(f.uid)}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
/* U510: 解決中の通常召喚も同じ当時裁定に合わせた。旧 C2 は既知の欠陥を固定していた。 */
fresh();
gameState.players[0].sz=[mk('血の代償',0,'up')];
gameState.players[1].sz=[setTrap('神の宣告',1)];
const mon=mk('ダンディライオン',0);
gameState.players[0].hand=[mon];
baselineA();
duelActivateFromZone(0,'sz',0);
ok('C2-0 前提: 窓が開く', driveToResolvedWindow()==='window', 'x');
const r=negateInWindow('神の宣告');
drive();
ok('C2 ★ 解決中の通常召喚も破壊・墓地送りを積み、綿毛トークン2体を出す（U510）',
   r==='done' && zu(mon.uid)==='grave' && handDestroyStep()===0
   && actTypes().includes('FX_TO_GRAVE')
   && ownEvents(mon.uid).indexOf('onDestroy')>=0 && ownEvents(mon.uid).indexOf('onSendToGrave')>=0
   && ownEvents(mon.uid).indexOf('onLeaveField')<0 && ownEvents(mon.uid).indexOf('onRemove')<0
   && gameState.players[0].mz.filter(c=>c&&cardName(c)==='綿毛トークン').length===2,
   JSON.stringify({r,own:ownEvents(mon.uid),mz:gameState.players[0].mz.map(c=>c&&cardName(c))}));
audit('C2');
`, {expect:3});

harness('const ENG=' + JSON.stringify(SRC_S509['engine/40_legal_script_engine.js']) + ';'
      + 'const CARD=' + JSON.stringify(SRC_S509['cards/E1_auto_cycle39.js']) + ';' + COMMON + String.raw`
fresh();
/* 手札に戻す枝（S03-U277 キックバック）と反転召喚の枝は、新しい枝より**前**に残っている。 */
const iHand=ENG.indexOf('if(ps.negateToHandS03){');
const iFlip=ENG.indexOf("if(ps.kind==='flip'){ act({type:'FX_TO_GRAVE'");
/* 「手札に戻す」枝の中にも if(hit.zone==='hand'){ があるので、新しい枝は Action そのもので探す。 */
const iNew=ENG.indexOf("act({type:'FX_TO_GRAVE',player:hit.p,zone:'hand',index:hit.index,reason:'召喚を無効'");
ok('C3 ★ 判定の順序: 手札に戻す枝（S03-U277）と反転召喚の枝が新しい枝より前にある',
   iHand>=0 && iFlip>iHand && iNew>iFlip,
   JSON.stringify({iHand,iFlip,iNew}));
ok('D1 ★ 共有ヘルパ e8FromFieldToGrave は変えていない（zone を指定して使う 5 箇所はそのまま）',
   CARD.indexOf('function e8FromFieldToGrave(ctx, from){')>=0
   && (CARD.match(/e8FromFieldToGrave\(ctx, 'sz'\)/g)||[]).length===5
   && CARD.indexOf('function e8PsychoReturnerToGraveS03(ctx){')>=0
   && CARD.indexOf('WIKI-0A19E6117879')>=0,
   JSON.stringify({sz:(CARD.match(/e8FromFieldToGrave\(ctx, 'sz'\)/g)||[]).length}));
`, {expect:2});

harness(COMMON + String.raw`
/* 通常召喚の権利は戻らない（WIKI-2C8BE04F46E9 / WIKI-2ABC596B02C7、回答日 2007-03-26）。 */
fresh();
const mon=mk('ダンディライオン',0);
gameState.players[0].hand=[mon,mk('ワイト',0)];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
finishNormalSummon(0,'atk',{bodies:0,value:0},null,null);
const r=negateInWindow('神の宣告');
drive();
ok('C4 ★ negative control: 通常召喚の権利は戻らない（WIKI-2C8BE04F46E9 07/03/26）',
   r==='done' && gameState.players[0].normalSummonUsed===true,
   JSON.stringify({r,used:gameState.players[0].normalSummonUsed}));
`, {expect:1});

/* ===== F. 文書・登録 ===== */
harness('const S=' + JSON.stringify(SRC_S509) + ';' + String.raw`
const DES=S['docs/S03_MISSED_TIMING_DESIGN.md'], RUL=S['docs/S03_MISSED_TIMING_RULINGS.md'];
const REP=S['docs/S03_U509_REPORT.md'], CHK=S['tools/check.py'];
ok('F1 ★ 設計書に S03-U509 の段と、(E) の 3 つ目の取り除き方が書かれている',
   DES.indexOf('S03-U509')>=0 && DES.indexOf('手札からの効果破壊')>=0
   && DES.indexOf('5-a. 未対応')>=0, '');
ok('F2 ★ 裁定記録に S03-U509 節と裁定 ID が揃っている',
   RUL.indexOf('S03-U509')>=0
   && ['WIKI-EFB088FAC57A','WIKI-0A19E6117879','WIKI-D70393946D93','WIKI-6745DCCBE047',
       'WIKI-EFE5568A43B4','WIKI-643A78AB3480','WIKI-9E991E9B14E9','R1103-WARNING-002']
      .every(id=>RUL.indexOf(id)>=0), '');
ok('F3 ★ 報告書に、対応した範囲と未対応の範囲が分けて書かれている',
   REP.indexOf('対応した範囲')>=0 && REP.indexOf('未対応の範囲')>=0
   && REP.indexOf('WIKI-0A19E6117879')>=0, '');
ok('F4 ★ check.py にこのテストが登録されている',
   CHK.indexOf('test_s03_u509_negated_summon_destroyed.js')>=0, '');
`, {expect:4});
