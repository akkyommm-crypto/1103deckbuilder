/* S03-U521: 闇よりの罠（カード実装）。

   《闇よりの罠》（NOT_STARTED・通常罠）
     ①:自分LPが3000以下の時、1000LPを払い、「闇よりの罠」以外の自分の墓地の通常罠カード1枚を対象として
     発動できる。このカードの効果は、その墓地の通常罠カード発動時の効果と同じになる。
     その後、その墓地の通常罠カードを除外する。

   当時裁定（回答日つき）
     WIKI-0503968039BC（2008-08-25）墓地の罠カードを対象に取る。
     WIKI-9AE0A5CB7D81（回答日なし）墓地の罠を選ぶのはカードの発動時。
     WIKI-94EA0CA95399（2010-04-13）複製する罠自身の対象も、その時に選ぶ。
     WIKI-2CF8CB52445A（回答日なし）複製する罠のコストは払わない。
     WIKI-B458649D4609（2010-08-01）コストに応じて効果が変動する通常罠（生存本能）は使えない。
     WIKI-DA2CD0377F38（2010-04-13）解決時に対象が墓地に無ければ効果は適用されない。
     WIKI-AF3464450C52（2010-08-01）LP2000 対 8000 では《自爆スイッチ》の条件（7000以上少ない）を満たさない。

   固定するもの:
     A 形（登録・宣言表）
     B 対象を取る罠の複製（強制脱出装置：対象は発動時に選ぶ・墓地の罠は除外される・LPは1000だけ払う）
     C 対象を取らない罠の複製（強欲な瓶：1枚ドロー）
     D 解決時に対象が墓地から除外された場合は効果が適用されない（D.D.クロウをチェーン）
     E negative control（LPが3000より多い・墓地が生存本能だけ・自爆スイッチの条件を満たさない）
     F Replay 監査・文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S521 = pathA.resolve(__dirname, '..');
const rdS521 = p => fsA.readFileSync(pathA.join(ROOT_S521, p), 'utf8');
const SRC_S521 = {
  'cards/HZZZZZZZZZZZZE_claude_s03_u521_copied_trap.js': rdS521('cards/HZZZZZZZZZZZZE_claude_s03_u521_copied_trap.js'),
  'docs/S03_U521_REPORT.md': rdS521('docs/S03_U521_REPORT.md'),
  'tools/check.py': rdS521('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function nmOf(c){return c?cardName(c):null;}
let PREFER=[], OFFERS=[], RESPOND_WITH=[], TITLES=[];
function pick(){
  const q=pc(); let j=-1; TITLES.push(String(q.title||''));
  for(const want of PREFER){
    j=(q.candidates||[]).findIndex(x=>x && (x.uid===want || x.key===want || x.value===want || x.label===want));
    if(j>=0) break;
  }
  __choicePickV49(j>=0?j:0);
}
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}
  try{DESTROY_SUB_BATCH_S03=null;}catch(e){}}
function fresh(){resetA();resetVolatile();TOASTS.length=0;PREFER=[];OFFERS=[];RESPOND_WITH=[];TITLES=[];
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setc(n,p){const c=mk(n,p,'down');c.setTurn=0;return c;}
function drive(){
  for(let i=0;i<900;i++){
    if(pc()){pick();continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){
      const pr=gameState.chainWindow.priority;
      let resp=[]; try{ resp=getChainResponsesV2(pr)||[]; }catch(e){ resp=[]; }
      OFFERS.push({pr:pr,len:gameState.chain.length,names:resp.map(r=>cardName(r.card))});
      const want=resp.find(r=>RESPOND_WITH.indexOf(cardName(r.card))>=0);
      if(want){ RESPOND_WITH.splice(RESPOND_WITH.indexOf(cardName(want.card)),1);
        duelActivateResponseV2(pr,want.zone,want.index,want.ownerS03); continue;}
      chainPassV2(); continue;}
    const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();continue;}
    return 'idle';}
  return 'loop';}
function useField(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function graveNames(p){return (gameState.players[p].grave||[]).map(nmOf);}
function banishNames(p){return (gameState.players[p].banish||[]).map(nmOf);}
function handNames(p){return (gameState.players[p].hand||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
ok('A1 ★ 登録され、対象を取る罠として宣言されている。参照できないカードと afterResolve も実行するカードは'
   +'当時裁定で名指しされたものだけが宣言表にある',
   !!CARD_SCRIPTS['闇よりの罠'] && CARD_SCRIPTS['闇よりの罠'].targets===true
   && Object.keys(U521_COPY_BLOCKED_S03).length===1 && U521_COPY_BLOCKED_S03['生存本能']==='WIKI-B458649D4609'
   && Object.keys(U521_COPY_AFTER_RESOLVE_S03).length===1
   && U521_COPY_AFTER_RESOLVE_S03['くず鉄のかかし']==='WIKI-BB9A0BE15C4B',
   JSON.stringify({blocked:Object.keys(U521_COPY_BLOCKED_S03),after:Object.keys(U521_COPY_AFTER_RESOLVE_S03)}));
`, {expect:1});

/* ===== B. 対象を取る罠の複製 ===== */
harness(COMMON + String.raw`
fresh();
/* 墓地の《強制脱出装置》を対象にして発動する。複製する罠の対象（相手モンスター）も発動時に選ぶ。 */
const dark=setc('闇よりの罠',0);
gameState.players[0].sz=[dark];
const ref=mk('強制脱出装置',0);
gameState.players[0].grave=[ref];
const foe=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[foe];
gameState.players[0].lp=3000;
baselineA();
const tr=useField(0,dark);
ok('B1 ★ 墓地の通常罠を対象に発動し、その罠の発動時の効果（相手モンスターを手札に戻す）が適用され、'
   +'対象にした墓地の罠は除外される。払うのは1000LPだけ',
   tr==='idle' && gameState.players[0].lp===2000
   && zu(foe.uid)==='hand' && zu(ref.uid)==='banish' && zu(dark.uid)==='grave',
   JSON.stringify({lp:gameState.players[0].lp,foe:zu(foe.uid),ref:zu(ref.uid),dark:zu(dark.uid),
     titles:TITLES.slice(0,3)}));
audit('B1');
`, {expect:2});

/* ===== C. 対象を取らない罠の複製 ===== */
harness(COMMON + String.raw`
fresh();
/* 墓地の《強欲な瓶》を対象にして発動する（1枚ドロー）。 */
const dark=setc('闇よりの罠',0);
gameState.players[0].sz=[dark];
const ref=mk('強欲な瓶',0);
gameState.players[0].grave=[ref];
gameState.players[0].lp=2500;
gameState.players[0].hand=[];
baselineA();
const tr=useField(0,dark);
ok('C1 ★ 対象を取らない罠（強欲な瓶）も複製でき、1枚ドローして墓地の罠は除外される',
   tr==='idle' && gameState.players[0].lp===1500
   && (gameState.players[0].hand||[]).length===1
   && zu(ref.uid)==='banish' && zu(dark.uid)==='grave',
   JSON.stringify({lp:gameState.players[0].lp,hand:handNames(0),ref:zu(ref.uid)}));
audit('C1');
`, {expect:2});

/* ===== D. 解決時に対象が墓地に無い場合 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-DA2CD0377F38（10/04/13）: 対象が墓地に無ければ効果は適用されない。
   相手が《転生の予言》をチェーンして、対象の《強制脱出装置》を含む墓地 2 枚をデッキへ戻す
   （候補をちょうど 2 枚にしてあるので、戻る 2 枚は必ずこの罠を含む）。 */
const dark=setc('闇よりの罠',0);
gameState.players[0].sz=[dark];
const ref=mk('強制脱出装置',0);
gameState.players[0].grave=[ref];
gameState.players[1].grave=[mk('ワイト',1)];
gameState.players[1].sz=[setc('転生の予言',1)];
const foe=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[foe];
gameState.players[0].lp=3000;
baselineA();
RESPOND_WITH=['転生の予言'];
PREFER=[ref.uid,foe.uid];
const tr=useField(0,dark);
ok('D1 ★ WIKI-DA2CD0377F38（10/04/13）: 解決時に対象の罠が墓地に無い（デッキへ戻された）場合、'
   +'複製した効果は適用されない（相手モンスターは手札に戻らない）',
   tr==='idle' && zu(ref.uid)==='deck' && zu(foe.uid)==='mz'
   && gameState.players[0].lp===2000 && zu(dark.uid)==='grave',
   JSON.stringify({ref:zu(ref.uid),foe:zu(foe.uid),lp:gameState.players[0].lp,
     offers:OFFERS.map(o=>o.len+':'+o.names.join('/')).join('|')}));
audit('D1');
`, {expect:2});

/* ===== E. negative control ===== */
harness(COMMON + String.raw`
fresh();
/* LP が 3000 より多い時は発動できない。 */
const dark=setc('闇よりの罠',0);
gameState.players[0].sz=[dark];
gameState.players[0].grave=[mk('強制脱出装置',0)];
gameState.players[1].mz=[mk('デーモンの召喚',1,'up')];
gameState.players[0].lp=3100;
baselineA();
const t1=useField(0,dark);
const kept=zu(dark.uid)==='sz' && findCardByUid(dark.uid).card.face==='down';
ok('E1 ★ negative control: 自分のLPが3000より多い時は発動できない',
   t1==='idle' && kept && gameState.players[0].lp===3100,
   JSON.stringify({dark:zu(dark.uid),lp:gameState.players[0].lp,toasts:TOASTS.slice(0,2)}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* WIKI-B458649D4609（10/08/01）: コストに応じて効果が変動する《生存本能》は参照できない。
   WIKI-AF3464450C52（10/08/01）: LP2000 対 8000 では《自爆スイッチ》の条件を満たさない。 */
const dark=setc('闇よりの罠',0);
gameState.players[0].sz=[dark];
gameState.players[0].grave=[mk('生存本能',0),mk('自爆スイッチ',0)];
gameState.players[0].lp=2000;
gameState.players[1].lp=8000;
baselineA();
const t1=useField(0,dark);
ok('E2 ★ negative control: 墓地が《生存本能》（コスト依存）と《自爆スイッチ》（条件を満たさない）だけなら'
   +'発動できない',
   t1==='idle' && zu(dark.uid)==='sz' && findCardByUid(dark.uid).card.face==='down'
   && gameState.players[0].lp===2000 && gameState.players[1].lp===8000,
   JSON.stringify({dark:zu(dark.uid),lp:[gameState.players[0].lp,gameState.players[1].lp],
     toasts:TOASTS.slice(0,2)}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* WIKI-AF3464450C52 の裏側: 当時テキストの条件（相手より7000以上少ない）をそのまま読んでいる事を、
   engine 自身の発動可否で測る（解決まで行くとデュエルが終わるので、可否だけを見る）。 */
const dark=setc('闇よりの罠',0);
gameState.players[0].sz=[dark];
gameState.players[0].grave=[mk('自爆スイッチ',0)];
gameState.players[0].lp=2000;
gameState.players[1].lp=8000;
baselineA();
const no=strictScriptLegalityV2('闇よりの罠',0,'sz',0,{});
gameState.players[0].lp=1000;
const yes=strictScriptLegalityV2('闇よりの罠',0,'sz',0,{});
ok('E3 ★ 《自爆スイッチ》は 6000 差では参照できず、7000 差なら参照できる'
   +'（参照する罠自身の条件を発動時に見ている）',
   no.ok===false && yes.ok===true,
   JSON.stringify({no:no,yes:yes}));
`, {expect:1});

/* ===== F. 文書・登録 ===== */
const okJs = (label, cond, info) => {
  if (!cond) { console.log('FAIL ' + label + (info ? ' ' + info : '')); process.exitCode = 1; }
  else console.log('PASS ' + label);
};
const cardSrc = SRC_S521['cards/HZZZZZZZZZZZZE_claude_s03_u521_copied_trap.js'];
const doc = SRC_S521['docs/S03_U521_REPORT.md'];
okJs('F1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-0503968039BC', 'WIKI-9AE0A5CB7D81', 'WIKI-94EA0CA95399', 'WIKI-2CF8CB52445A',
   'WIKI-B458649D4609', 'WIKI-DA2CD0377F38', 'WIKI-BB9A0BE15C4B', 'WIKI-AF3464450C52'].every(id => cardSrc.indexOf(id) >= 0));
okJs('F2 ★ 未対応（装備になる罠の装備部分）が根拠つきで書かれている',
  cardSrc.indexOf('WIKI-D40DED072699') >= 0 && cardSrc.indexOf('ENGINE_GAP') >= 0);
okJs('F3 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-DA2CD0377F38') >= 0 && doc.indexOf('鎖付き爆弾') >= 0);
okJs('F4 ★ このテストが tools/check.py に登録されている',
  SRC_S521['tools/check.py'].indexOf('test_s03_u521_copied_trap.js') >= 0);
