/* S03-U515: 貫通ダメージを持つ未実装カード 2 枚（カード実装）。

   《螺旋槍殺》（NOT_STARTED・永続魔法）
     ①:自分の「暗黒騎士ガイア」「疾風の暗黒騎士ガイア」「竜騎士ガイア」が守備表示モンスターを
       攻撃した場合、その守備力を攻撃力が超えた分だけ相手に戦闘ダメージを与える。
     ②:①の効果の適用によって「竜騎士ガイア」が相手に戦闘ダメージを与えた場合に発動する。
       自分はデッキから2枚ドローし、その後手札を1枚選んで捨てる。
   《天空勇士ネオパーシアス》（NOT_STARTED・星7 天使/光 2300/2000）
     ①「天空騎士パーシアス」1体をリリースして手札から特殊召喚できる。
     ②「天空の聖域」が存在し自分の LP が相手より多い場合、その差だけ攻撃力・守備力アップ。
     ③守備表示モンスターを攻撃した場合の貫通。
     ④相手に戦闘ダメージを与えた場合、デッキから1枚ドローする。

   **新しい共通処理は足していない。** 使ったのは既存の仕組みだけ:
     continuous.piercingDamage（System v3.3.0）・continuous.apply・summonProcedure・
     onBattleDamage（a3DealtBattleDamage と同じ読み方）。

   固定するもの:
     A 形
     B 螺旋槍殺（①の貫通・②のドロー・negative control）
     C 天空勇士ネオパーシアス（①②③④）
     D Replay 監査
     E 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S515 = pathA.resolve(__dirname, '..');
const rdS515 = p => fsA.readFileSync(pathA.join(ROOT_S515, p), 'utf8');
const SRC_S515 = {
  'cards/HZZZZZZZZZZZY_claude_s03_u515_piercing.js': rdS515('cards/HZZZZZZZZZZZY_claude_s03_u515_piercing.js'),
  'docs/S03_U515_REPORT.md': rdS515('docs/S03_U515_REPORT.md'),
  'tools/check.py': rdS515('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();TOASTS.length=0;
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function attackS515(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function defMon(name,p){const c=mk(name,p,'up');c.pos='def';return c;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness('const SRC=' + JSON.stringify(SRC_S515) + ';' + COMMON + String.raw`
fresh();
ok('A1 ★ 2 枚が登録され、既存の仕組みだけを使っている',
   !!CARD_SCRIPTS['螺旋槍殺'] && !!CARD_SCRIPTS['天空勇士ネオパーシアス']
   && typeof CARD_SCRIPTS['螺旋槍殺'].continuous.piercingDamage==='function'
   && typeof CARD_SCRIPTS['天空勇士ネオパーシアス'].continuous.piercingDamage==='function'
   && !!(CARD_SCRIPTS['天空勇士ネオパーシアス'].summonProcedure||{}).cost,
   JSON.stringify({sp:Object.keys((CARD_SCRIPTS['天空勇士ネオパーシアス']||{}).summonProcedure||{})}));
ok('A2 ★ 永続魔法《螺旋槍殺》は「発動時に効果の無いカード」として宣言されている',
   SRC['cards/HZZZZZZZZZZZY_claude_s03_u515_piercing.js'].indexOf('onBattleDamage')>=0
   && rdCardActivationS515(),'');
function rdCardActivationS515(){
  try{ return typeof declareCardActivationFreeV32==='function'
    && cardActivationOnlyV32('螺旋槍殺', CARD_SCRIPTS['螺旋槍殺'],
         CARD_DB[findCardIndex('螺旋槍殺')], 'sz', mk('螺旋槍殺',0), {cardActivation:true})===true; }
  catch(e){ return 'err:'+e.message; }
}
`, {expect:2});

/* ===== B. 螺旋槍殺 ===== */
harness(COMMON + String.raw`
fresh();
const sp=mk('螺旋槍殺',0,'up');
gameState.players[0].sz=[sp];
const gaia=mk('竜騎士ガイア',0,'up');          /* 攻 2600 */
gameState.players[0].mz=[gaia];
const def=defMon('ワイト',1);                   /* 守備 200 */
gameState.players[1].mz=[def];
gameState.phase='battle';
baselineA();
const before=gameState.players[0].hand.length;
const tr=attackS515(0,0,0);
ok('B1 ★ ①: 自分の「竜騎士ガイア」が守備表示を攻撃すると守備力超過分の貫通ダメージ'
   +'（2600 − 200 = 2400）',
   tr==='idle' && zu(def.uid)==='grave' && gameState.players[1].lp===8000-2400,
   JSON.stringify({lp1:gameState.players[1].lp,def:zu(def.uid)}));
ok('B2 ★ ②: その貫通で相手に戦闘ダメージを与えたので 2 枚ドローして 1 枚捨てる（手札 +1）',
   gameState.players[0].hand.length===before+1 && gameState.players[0].grave.length>=1,
   JSON.stringify({before,hand:gameState.players[0].hand.length,grave:gameState.players[0].grave.length}));
audit('B');
`, {expect:3});

harness(COMMON + String.raw`
fresh();
/* negative control: 《暗黒騎士ガイア》は①の貫通は受けるが、②のドローは起きない */
const sp=mk('螺旋槍殺',0,'up');
gameState.players[0].sz=[sp];
const gaia=mk('暗黒騎士ガイア',0,'up');        /* 攻 2300 */
gameState.players[0].mz=[gaia];
const def=defMon('ワイト',1);
gameState.players[1].mz=[def];
gameState.phase='battle';
baselineA();
const before=gameState.players[0].hand.length;
const tr=attackS515(0,0,0);
ok('B3 ★ negative control: 「暗黒騎士ガイア」では貫通は起きるがドローは起きない',
   tr==='idle' && gameState.players[1].lp===8000-2100
   && gameState.players[0].hand.length===before,
   JSON.stringify({lp1:gameState.players[1].lp,hand:gameState.players[0].hand.length,before}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* negative control: 《螺旋槍殺》が無ければ貫通しない（守備表示なので相手は無傷） */
const gaia=mk('竜騎士ガイア',0,'up');
gameState.players[0].mz=[gaia];
const def=defMon('ワイト',1);
gameState.players[1].mz=[def];
gameState.phase='battle';
baselineA();
const tr=attackS515(0,0,0);
ok('B4 ★ negative control: 《螺旋槍殺》が無ければ貫通しない',
   tr==='idle' && zu(def.uid)==='grave' && gameState.players[1].lp===8000,
   JSON.stringify({lp1:gameState.players[1].lp,def:zu(def.uid)}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* negative control: 相手の「竜騎士ガイア」には①が働かない（「自分の」） */
const sp=mk('螺旋槍殺',0,'up');
gameState.players[0].sz=[sp];
const foeGaia=mk('竜騎士ガイア',1,'up');
gameState.players[1].mz=[foeGaia];
const myDef=defMon('ワイト',0);
gameState.players[0].mz=[myDef];
gameState.activePlayer=1;
gameState.phase='battle';
baselineA();
const tr=attackS515(1,0,0);
ok('B5 ★ negative control: 相手の「竜騎士ガイア」は①の対象外（自分は貫通ダメージを受けない）',
   tr==='idle' && zu(myDef.uid)==='grave' && gameState.players[0].lp===8000,
   JSON.stringify({lp0:gameState.players[0].lp,myDef:zu(myDef.uid)}));
`, {expect:1});

/* ===== C. 天空勇士ネオパーシアス ===== */
harness(COMMON + String.raw`
fresh();
const neo=mk('天空勇士ネオパーシアス',0);
gameState.players[0].hand=[neo];
const per=mk('天空騎士パーシアス',0,'up');
gameState.players[0].mz=[per];
baselineA();
const L=strictSummonProcedureLegality('天空勇士ネオパーシアス',0,'hand',0);
finishSummonProcedure('天空勇士ネオパーシアス',0,'hand',0,'atk');
const tr=drive();
ok('C1 ★ ①: 「天空騎士パーシアス」1体をリリースして手札から特殊召喚できる',
   L.ok===true && tr==='idle' && zu(neo.uid)==='mz' && zu(per.uid)==='grave',
   JSON.stringify({legal:{ok:L.ok,reason:L.reason},neo:zu(neo.uid),per:zu(per.uid)}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 「天空騎士パーシアス」がいなければ特殊召喚できない */
gameState.players[0].hand=[mk('天空勇士ネオパーシアス',0)];
gameState.players[0].mz=[mk('ワイト',0,'up')];
baselineA();
const L=strictSummonProcedureLegality('天空勇士ネオパーシアス',0,'hand',0);
ok('C2 ★ negative control: 「天空騎士パーシアス」がいなければ特殊召喚できない',
   L.ok===false && String(L.reason||'').indexOf('天空騎士パーシアス')>=0,
   JSON.stringify({ok:L.ok,reason:L.reason}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
const neo=mk('天空勇士ネオパーシアス',0,'up');   /* 攻 2300 */
gameState.players[0].mz=[neo];
gameState.players[0].field=mk('天空の聖域',0,'up');
gameState.players[1].lp=6000;                     /* LP 差 2000 */
const def=defMon('ワイト',1);
gameState.players[1].mz=[def];
gameState.phase='battle';
baselineA();
const atkWith=curATK(neo);
const before=gameState.players[0].hand.length;
const tr=attackS515(0,0,0);
ok('C3 ★ ②③④: 聖域と LP 差で 2300→4300、貫通で 4100 ダメージ、戦闘ダメージでドロー 1',
   tr==='idle' && atkWith===4300
   && gameState.players[1].lp===6000-4100
   && gameState.players[0].hand.length===before+1,
   JSON.stringify({atkWith,lp1:gameState.players[1].lp,
     hand:gameState.players[0].hand.length,before}));
audit('C3');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 「天空の聖域」が無ければ打点は上がらない（貫通とドローは効く） */
const neo=mk('天空勇士ネオパーシアス',0,'up');
gameState.players[0].mz=[neo];
gameState.players[1].lp=6000;
const def=defMon('ワイト',1);
gameState.players[1].mz=[def];
gameState.phase='battle';
baselineA();
const atkNo=curATK(neo);
const tr=attackS515(0,0,0);
ok('C4 ★ negative control: 「天空の聖域」が無ければ打点は上がらない（2300 のまま・貫通は 2100）',
   tr==='idle' && atkNo===2300 && gameState.players[1].lp===6000-2100,
   JSON.stringify({atkNo,lp1:gameState.players[1].lp}));
`, {expect:1});

/* ===== E. 文書・登録 ===== */
harness('const S=' + JSON.stringify(SRC_S515) + ';' + String.raw`
const REP=S['docs/S03_U515_REPORT.md'], CHK=S['tools/check.py'];
ok('E1 ★ 報告書に、実装した効果と未対応の範囲が分けて書かれている',
   REP.indexOf('実装した範囲')>=0 && REP.indexOf('未対応の範囲')>=0
   && REP.indexOf('螺旋槍殺')>=0 && REP.indexOf('天空勇士ネオパーシアス')>=0,'');
ok('E2 ★ check.py にこのテストが登録されている',
   CHK.indexOf('test_s03_u515_piercing.js')>=0,'');
`, {expect:2});
