/* S03-U527 《偽物のわな》
   自分フィールドの罠カードを破壊する相手の効果の発動にチェーンして発動し、このカードを代わりに破壊して
   他の自分の罠カードを守る。セットされたカードは全てめくって確認する。

   当時裁定（判定と測定の根拠）
     WIKI-D4E66D1A9A3F（09/03/11）《大嵐》: 自分の罠は守られ、相手の罠は破壊される。
     WIKI-F00EA2A4035E（07/06/18）守るのはフィールドの罠カードだけ。
     WIKI-5439C489E102（10/09/13）破壊が不確定な効果には発動できない。
     WIKI-D5F300A58DC3（09/03/11）/ WIKI-861BDA6FCE50（10/09/13）確認と守る対象は発動時に決まる。
     WIKI-DA0C326CE2A9（11/03/11）魔法＆罠ゾーンのセットカードは全て確認させる。
     WIKI-C705DA31850D（09/04/11）このカード自身が先に破壊されたら代わりに破壊する効果は適用されない。
     WIKI-3FFD3A9DA6A1（11/06/09）発動元のゾーンは問わない。

   場面
     A 形
     B 《大嵐》にチェーン: 自分の罠は残り、自分のセット魔法と相手のカードは破壊される／セットカードの確認
     C 《サイクロン》が自分の罠を対象: 守る ／ 自分の魔法を対象: 発動できない（negative control）
     D 《地砕き》（モンスター破壊）には発動できない（negative control）
     E 《ハーピィの羽根帚》（相手の魔法・罠を全て破壊）にも発動できる
     F 自分自身が先に破壊された場合は適用されない（negative control）
     G 自分が発動した効果には発動できない（negative control）
     H 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S527 = pathA.resolve(__dirname, '..');
const rdS527 = p => fsA.readFileSync(pathA.join(ROOT_S527, p), 'utf8');
const SRC_S527 = {
  'cards/HZZZZZZZZZZZZK_claude_s03_u527_fake_trap.js': rdS527('cards/HZZZZZZZZZZZZK_claude_s03_u527_fake_trap.js'),
  'engine/1ZZZD_fake_trap_s03.js': rdS527('engine/1ZZZD_fake_trap_s03.js'),
  'docs/S03_U527_REPORT.md': rdS527('docs/S03_U527_REPORT.md'),
  'tools/check.py': rdS527('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function cardOf(uid){const h=findCardByUid(uid);return h?h.card:null;}
function nmOf(c){return c?cardName(c):null;}
let PREFER=[], TITLES=[];
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
function fresh(){resetA();resetVolatile();TOASTS.length=0;PREFER=[];TITLES=[];
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setc(n,p){const c=mk(n,p,'down');c.setTurn=0;return c;}
function drive(){
  for(let i=0;i<900;i++){
    if(pc()){pick();continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();continue;}
    return 'idle';}
  return 'loop';}
function settle(){for(let i=0;i<40&&pc();i++)pick();}
function handIdx(p,name){return (gameState.players[p].hand||[]).findIndex(c=>c&&cardName(c)===name);}
function respond(p,c){settle();const h=findCardByUid(c.uid);duelActivateResponseV2(p,h.zone,h.index,p);settle();
  return gameState.chain.some(l=>l.name===cardName(c));}
function szNames(p){return (gameState.players[p].sz||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
ok('A1 ★ 登録され、発動への応答として宣言され、破壊の確定判定と印の関数がある',
   !!CARD_SCRIPTS['偽物のわな'] && activationResponseDeclaredS03('偽物のわな')
   && typeof fakeTrapCertainS03==='function' && typeof fakeTrapSpareS03==='function'
   && typeof fakeTrapNoteS03==='function' && ZONE_LOCAL_KEYS.indexOf('revealedTurnS527')>=0,
   JSON.stringify({declared:activationResponseDeclaredS03('偽物のわな')}));
`, {expect:1});

/* ===== B. 《大嵐》にチェーン ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-D4E66D1A9A3F（09/03/11）: 自分の罠は守られ、相手のカードは破壊される。
   WIKI-F00EA2A4035E（07/06/18）: 守るのはフィールドの罠カードだけ（セットした魔法は破壊される）。 */
gameState.activePlayer=1;
const fake=setc('偽物のわな',0), t1=setc('激流葬',0), t2=setc('聖なるバリア －ミラーフォース－',0), sp=setc('強欲な壺',0);
const foe=setc('サイクロン',1);
gameState.players[0].sz=[fake,t1,t2,sp];
gameState.players[1].sz=[foe];
gameState.players[1].hand=[mk('大嵐',1)];
baselineA();
duelActivateFromHand(handIdx(1,'大嵐'));
const resp=respond(0,fake);
const t=drive();
ok('B1 ★ WIKI-D4E66D1A9A3F / WIKI-F00EA2A4035E: 《大嵐》にチェーンして発動すると、このカードだけが破壊され、'
   +'自分フィールドの罠カードは残り、自分のセット魔法と相手のカードは破壊される',
   t==='idle' && resp===true && zu(fake.uid)==='grave'
   && zu(t1.uid)==='sz' && zu(t2.uid)==='sz' && zu(sp.uid)==='grave' && zu(foe.uid)==='grave',
   JSON.stringify({fake:zu(fake.uid),t1:zu(t1.uid),t2:zu(t2.uid),sp:zu(sp.uid),foe:zu(foe.uid),
     sz0:szNames(0),sz1:szNames(1)}));
ok('B2 ★ WIKI-D5F300A58DC3 / WIKI-DA0C326CE2A9: 発動時に魔法＆罠ゾーンのセットカードを確認させた印が残る',
   Number(cardOf(t1.uid).revealedTurnS527)===5 && Number(cardOf(t2.uid).revealedTurnS527)===5,
   JSON.stringify({t1:cardOf(t1.uid).revealedTurnS527,t2:cardOf(t2.uid).revealedTurnS527}));
audit('B');
`, {expect:3});

/* ===== C. 《サイクロン》（対象を取る効果） ===== */
harness(COMMON + String.raw`
fresh();
/* 対象が自分の罠カードなら破壊は確定している。 */
gameState.activePlayer=1;
const fake=setc('偽物のわな',0), t1=setc('激流葬',0);
gameState.players[0].sz=[fake,t1];
gameState.players[1].hand=[mk('サイクロン',1)];
baselineA();
PREFER=[t1.uid];
duelActivateFromHand(handIdx(1,'サイクロン'));
const resp=respond(0,fake);
const t=drive();
ok('C1 ★ 《サイクロン》が自分の罠カードを対象にした場合、このカードが代わりに破壊され、対象の罠は残る',
   t==='idle' && resp===true && zu(fake.uid)==='grave' && zu(t1.uid)==='sz',
   JSON.stringify({fake:zu(fake.uid),t1:zu(t1.uid),sz0:szNames(0),titles:TITLES.slice(0,3)}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 対象が自分のセット魔法なら、罠カードの破壊は確定していない。 */
gameState.activePlayer=1;
const fake=setc('偽物のわな',0), sp=setc('強欲な壺',0), t1=setc('激流葬',0);
gameState.players[0].sz=[fake,sp,t1];
gameState.players[1].hand=[mk('サイクロン',1)];
baselineA();
PREFER=[sp.uid];
duelActivateFromHand(handIdx(1,'サイクロン'));
settle();
const legal=strictScriptLegalityV2('偽物のわな',0,'sz',findCardByUid(fake.uid).index,{});
const t=drive();
ok('C2 ★ negative control: 《サイクロン》が自分のセット魔法を対象にした場合は発動できない（破壊が確定していない）',
   t==='idle' && legal.ok===false && zu(fake.uid)==='sz' && zu(sp.uid)==='grave' && zu(t1.uid)==='sz',
   JSON.stringify({legal:legal.ok,reason:String(legal.reason||'').slice(0,40),
     fake:zu(fake.uid),sp:zu(sp.uid),t1:zu(t1.uid)}));
audit('C2');
`, {expect:2});

/* ===== D. モンスターを破壊する効果 ===== */
harness(COMMON + String.raw`
fresh();
/* negative control: WIKI-5439C489E102（10/09/13）の読み方 —
   自分フィールドの罠カードを破壊しない効果には発動できない。 */
gameState.activePlayer=1;
const fake=setc('偽物のわな',0), t1=setc('激流葬',0);
gameState.players[0].sz=[fake,t1];
gameState.players[0].mz=[mk('デーモンの召喚',0,'up')];
gameState.players[1].hand=[mk('地砕き',1)];
baselineA();
duelActivateFromHand(handIdx(1,'地砕き'));
settle();
const legal=strictScriptLegalityV2('偽物のわな',0,'sz',findCardByUid(fake.uid).index,{});
const t=drive();
ok('D1 ★ negative control: モンスターを破壊する効果（《地砕き》）には発動できない',
   t==='idle' && legal.ok===false && zu(fake.uid)==='sz' && zu(t1.uid)==='sz',
   JSON.stringify({legal:legal.ok,reason:String(legal.reason||'').slice(0,40),mz0:(gameState.players[0].mz||[]).map(nmOf)}));
audit('D1');
`, {expect:2});

/* ===== E. 相手の魔法・罠を全て破壊する効果 ===== */
harness(COMMON + String.raw`
fresh();
/* 「相手の魔法・罠カードを全て破壊する」効果（対象を取らない）にも発動できる。 */
gameState.activePlayer=1;
const fake=setc('偽物のわな',0), t1=setc('激流葬',0), t2=setc('聖なるバリア －ミラーフォース－',0);
gameState.players[0].sz=[fake,t1,t2];
gameState.players[1].hand=[mk('ハーピィの羽根帚',1)];
baselineA();
duelActivateFromHand(handIdx(1,'ハーピィの羽根帚'));
const resp=respond(0,fake);
const t=drive();
ok('E1 ★ 《ハーピィの羽根帚》（相手の魔法・罠を全て破壊）にもチェーンして発動でき、自分の罠は残る',
   t==='idle' && resp===true && zu(fake.uid)==='grave' && zu(t1.uid)==='sz' && zu(t2.uid)==='sz',
   JSON.stringify({fake:zu(fake.uid),t1:zu(t1.uid),t2:zu(t2.uid),sz0:szNames(0)}));
audit('E1');
`, {expect:2});

/* ===== F. 自分自身が先に破壊された場合 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-C705DA31850D（09/04/11）: このカードの発動にチェーンして発動した《サイクロン》で
   このカード自身が破壊されると、代わりに破壊する効果は適用されない。 */
gameState.activePlayer=1;
const fake=setc('偽物のわな',0), t1=setc('激流葬',0);
gameState.players[0].sz=[fake,t1];
gameState.players[1].hand=[mk('大嵐',1),mk('サイクロン',1)];
baselineA();
duelActivateFromHand(handIdx(1,'大嵐'));
const resp=respond(0,fake);
PREFER=[fake.uid];
duelActivateResponseV2(1,'hand',handIdx(1,'サイクロン'),1);
settle();
const t=drive();
ok('F1 ★ WIKI-C705DA31850D（09/04/11）: チェーンでこのカード自身が破壊された場合、他の罠カードは守られない',
   t==='idle' && resp===true && zu(fake.uid)==='grave' && zu(t1.uid)==='grave',
   JSON.stringify({fake:zu(fake.uid),t1:zu(t1.uid),sz0:szNames(0),titles:TITLES.slice(0,4)}));
audit('F1');
`, {expect:2});

/* ===== G. 自分が発動した効果 ===== */
harness(COMMON + String.raw`
fresh();
/* negative control: テキストは「相手が発動した時」。 */
const fake=setc('偽物のわな',0), t1=setc('激流葬',0);
gameState.players[0].sz=[fake,t1];
gameState.players[0].hand=[mk('大嵐',0)];
baselineA();
duelActivateFromHand(handIdx(0,'大嵐'));
settle();
const legal=strictScriptLegalityV2('偽物のわな',0,'sz',findCardByUid(fake.uid).index,{});
const t=drive();
ok('G1 ★ negative control: 自分が発動した《大嵐》には発動できない（罠は守られず破壊される）',
   t==='idle' && legal.ok===false && zu(fake.uid)==='grave' && zu(t1.uid)==='grave',
   JSON.stringify({legal:legal.ok,fake:zu(fake.uid),t1:zu(t1.uid)}));
audit('G1');
`, {expect:2});

/* ===== I. 《王宮のお触れ》がある場合 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-4E31065236CC（09/03/12）: 《王宮のお触れ》が存在する時もセットカードは確認させる
   （確認は発動時に行う）。ただし効果は無効なので罠カードは守られない。 */
gameState.activePlayer=1;
const fake=setc('偽物のわな',0), t1=setc('激流葬',0);
const decree=mk('王宮のお触れ',1,'up');
gameState.players[0].sz=[fake,t1];
gameState.players[1].sz=[decree];
gameState.players[1].hand=[mk('大嵐',1)];
baselineA();
duelActivateFromHand(handIdx(1,'大嵐'));
const resp=respond(0,fake);
const revealed=Number(cardOf(t1.uid)&&cardOf(t1.uid).revealedTurnS527)===5;
const t=drive();
ok('I1 ★ WIKI-4E31065236CC（09/03/12）: 《王宮のお触れ》があっても発動時にセットカードを確認させるが、'
   +'効果は無効なので罠カードは守られない',
   t==='idle' && resp===true && revealed===true && zu(fake.uid)==='grave' && zu(t1.uid)==='grave',
   JSON.stringify({resp:resp,revealed:revealed,fake:zu(fake.uid),t1:zu(t1.uid),decree:zu(decree.uid)}));
audit('I1');
`, {expect:2});

/* ===== H. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S527['cards/HZZZZZZZZZZZZK_claude_s03_u527_fake_trap.js'];
const engSrc = SRC_S527['engine/1ZZZD_fake_trap_s03.js'];
const doc = SRC_S527['docs/S03_U527_REPORT.md'];
okJs('H1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-D4E66D1A9A3F','WIKI-F00EA2A4035E','WIKI-5439C489E102','WIKI-D5F300A58DC3','WIKI-861BDA6FCE50',
   'WIKI-DA0C326CE2A9','WIKI-C705DA31850D','WIKI-F7E74B443EB4'].every(id=>cardSrc.indexOf(id) >= 0));
okJs('H2 ★ 共通側に、破壊が確定しているかの判定と「破壊だけを止める」理由が書かれている',
  engSrc.indexOf('WIKI-5439C489E102') >= 0 && engSrc.indexOf('WIKI-F7E74B443EB4') >= 0);
okJs('H3 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-D4E66D1A9A3F') >= 0 && doc.indexOf('未対応') >= 0);
okJs('H4 ★ このテストが tools/check.py に登録されている',
  SRC_S527['tools/check.py'].indexOf('test_s03_u527_fake_trap.js') >= 0);
