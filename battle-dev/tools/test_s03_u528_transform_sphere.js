/* S03-U528 《トランスフォーム・スフィア》
   相手の表側守備表示モンスター1体を選択し、手札を1枚捨てて装備カード扱いで自分に装備する（1体のみ）。
   攻撃力はその分アップし、攻撃した場合はバトルフェイズ終了時に守備表示になり、
   エンドフェイズに装備したモンスターを相手フィールドへ表側守備表示で特殊召喚する。

   当時裁定（判定と測定の根拠）
     WIKI-2EF617C51571（09/12/28）装備は起動効果・自己強化と表示形式変更は永続効果・特殊召喚は誘発効果。
     WIKI-FDFA38E9B4B6（10/01/09）手札を捨てるのは効果処理。
     WIKI-B19BA75E212C（10/01/09）解決時に手札が 0 枚なら装備する効果は適用されない。
     WIKI-78672B59DAAC（10/08/16）捨てるのと装備するのは同時。
     WIKI-C3A441FCF1AA（10/01/27）解決時に裏側表示でもそのまま装備され、攻撃力はアップせず、
       エンドフェイズには表側守備表示で特殊召喚される。
     WIKI-C4CD12F0F66F（09/12/28）特殊召喚できないモンスターは墓地へ送られる。
     WIKI-BCC222AD1322（10/01/27）特殊召喚できない状況でも効果は発動し、装備されたままにはならない。

   場面
     A 形
     B 装備（攻撃力アップ・手札を 1 枚捨てる）と 1 ターンに 1 度
     C 《マインドクラッシュ》で解決時に手札が 0 枚になった場合は装備されない／表側守備が居ない場合は発動できない
     D エンドフェイズに相手フィールドへ表側守備表示で特殊召喚／特殊召喚できないモンスターは墓地へ
     E 攻撃した場合はバトルフェイズ終了時に守備表示になる
     F 《月の書》で裏側になった場合も装備され、攻撃力はアップしない
     G 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S528 = pathA.resolve(__dirname, '..');
const rdS528 = p => fsA.readFileSync(pathA.join(ROOT_S528, p), 'utf8');
const SRC_S528 = {
  'cards/HZZZZZZZZZZZZL_claude_s03_u528_transform_sphere.js': rdS528('cards/HZZZZZZZZZZZZL_claude_s03_u528_transform_sphere.js'),
  'docs/S03_U528_REPORT.md': rdS528('docs/S03_U528_REPORT.md'),
  'tools/check.py': rdS528('tools/check.py')
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
function mkdef(n,p){const c=mk(n,p,'up');c.pos='def';return c;}
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
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);return drive();}
function useCard(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function respond(p,c){settle();const h=findCardByUid(c.uid);duelActivateResponseV2(p,h.zone,h.index,p);settle();
  return gameState.chain.some(l=>l.name===cardName(c));}
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function szNames(p){return (gameState.players[p].sz||[]).map(nmOf);}
function atkOf(uid){const h=findCardByUid(uid);return h?API.curAtk(h):null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const keys=nativeEffectsV4('トランスフォーム・スフィア').map(e=>e.key);
ok('A1 ★ 登録され、装備（起動）・守備表示（バトルフェイズ終了時）・特殊召喚（エンドフェイズ）の 3 つの効果と'
   +'自己強化の永続効果を持つ',
   keys.indexOf('equip-foe')>=0 && keys.indexOf('to-defense')>=0 && keys.indexOf('end-return')>=0
   && !!CARD_SCRIPTS['トランスフォーム・スフィア'].continuous
   && CARD_SCRIPTS['トランスフォーム・スフィア'].targets===true
   && ZONE_LOCAL_KEYS.indexOf('u528EquipTurnS03')>=0,
   JSON.stringify({keys:keys}));
`, {expect:1});

/* ===== B. 装備と攻撃力アップ ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-FDFA38E9B4B6（10/01/09）: 手札を捨てるのは効果処理。 */
const me=mk('トランスフォーム・スフィア',0,'up');
const dis=mk('ワイト',0);
const foe=mkdef('デーモンの召喚',1);
gameState.players[0].mz=[me];
gameState.players[0].hand=[dis];
gameState.players[1].mz=[foe];
baselineA();
PREFER=[foe.uid,dis.uid];
const t1=useCard(0,me);
ok('B1 ★ 相手の表側守備表示モンスターを選択し、手札を1枚捨てて装備カード扱いで装備し、'
   +'攻撃力がその分アップする（100 → 2600）',
   t1==='idle' && zu(foe.uid)==='sz' && zu(dis.uid)==='grave' && atkOf(me.uid)===2600
   && (gameState.players[1].mz||[]).length===0 && (gameState.players[0].hand||[]).length===0,
   JSON.stringify({foe:zu(foe.uid),dis:zu(dis.uid),atk:atkOf(me.uid),sz0:szNames(0),titles:TITLES.slice(0,3)}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* 1ターンに1度・1体のみ。 */
const me=mk('トランスフォーム・スフィア',0,'up');
const foeA=mkdef('デーモンの召喚',1), foeB=mkdef('ワイト',1);
gameState.players[0].mz=[me];
gameState.players[0].hand=[mk('ワイト',0),mk('ワイト',0)];
gameState.players[1].mz=[foeA,foeB];
baselineA();
PREFER=[foeA.uid];
const t1=useCard(0,me);
TOASTS.length=0;
const t2=useCard(0,me);
ok('B2 ★ 1ターンに1度なので 2 回目は発動できず、装備は 1 体のみ',
   t1==='idle' && t2==='idle' && zu(foeA.uid)==='sz' && zu(foeB.uid)==='mz'
   && TOASTS.some(x=>x.indexOf('このターンは既に使用しています')>=0),
   JSON.stringify({a:zu(foeA.uid),b:zu(foeB.uid),toasts:TOASTS.slice(0,2)}));
audit('B2');
`, {expect:2});

/* ===== C. 手札が 0 枚になった場合／相手に表側守備が居ない場合 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-B19BA75E212C（10/01/09）: 効果解決時に手札が 0 枚で捨てられない場合、装備する効果は適用されない。
   相手が《マインドクラッシュ》をチェーンして手札の《ワイト》を宣言し、捨てさせる。 */
const me=mk('トランスフォーム・スフィア',0,'up');
const dis=mk('ワイト',0);
const foe=mkdef('デーモンの召喚',1);
const crush=setc('マインドクラッシュ',1);
gameState.players[0].mz=[me];
gameState.players[0].hand=[dis];
gameState.players[1].mz=[foe];
gameState.players[1].sz=[crush];
baselineA();
PREFER=[foe.uid,'ワイト'];
duelActivateFromZone(0,'mz',findCardByUid(me.uid).index,{});
const resp=respond(1,crush);
const t1=drive();
ok('C1 ★ WIKI-B19BA75E212C（10/01/09）: 解決時に手札が 0 枚になった場合、装備する効果は適用されない',
   t1==='idle' && resp===true && zu(dis.uid)==='grave' && zu(foe.uid)==='mz'
   && atkOf(me.uid)===100 && (gameState.players[0].sz||[]).length===0,
   JSON.stringify({dis:zu(dis.uid),foe:zu(foe.uid),atk:atkOf(me.uid),sz0:szNames(0),titles:TITLES.slice(0,4)}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 相手の表側守備表示モンスターが居ない（攻撃表示だけ）場合は発動できない。 */
const me=mk('トランスフォーム・スフィア',0,'up');
const foe=mk('デーモンの召喚',1,'up');
gameState.players[0].mz=[me];
gameState.players[0].hand=[mk('ワイト',0)];
gameState.players[1].mz=[foe];
baselineA();
const legal=strictScriptLegalityV2('トランスフォーム・スフィア',0,'mz',0,{});
TOASTS.length=0;
const t1=useCard(0,me);
ok('C2 ★ negative control: 相手の表側守備表示モンスターが居ない場合は発動できない',
   t1==='idle' && legal.ok===false && zu(foe.uid)==='mz' && atkOf(me.uid)===100,
   JSON.stringify({legal:legal.ok,reason:String(legal.reason||'').slice(0,40),toasts:TOASTS.slice(0,2)}));
/* action が 1 つもない場面なので Replay 監査は行わない */
`, {expect:1});

/* ===== D. エンドフェイズの特殊召喚 ===== */
harness(COMMON + String.raw`
fresh();
/* 装備したモンスターは相手フィールドへ表側守備表示で特殊召喚される。 */
const me=mk('トランスフォーム・スフィア',0,'up');
const foe=mkdef('デーモンの召喚',1);
gameState.players[0].mz=[me];
gameState.players[0].hand=[mk('ワイト',0)];
gameState.players[1].mz=[foe];
baselineA();
PREFER=[foe.uid];
const t1=useCard(0,me);
const equipped=zu(foe.uid)==='sz';
const tEnd=phase('end');
const back=findCardByUid(foe.uid);
ok('D1 ★ エンドフェイズに装備したモンスターを相手フィールド上に表側守備表示で特殊召喚する',
   t1==='idle' && tEnd==='idle' && equipped && !!back && back.zone==='mz' && back.p===1
   && back.card.face==='up' && back.card.pos==='def' && atkOf(me.uid)===100,
   JSON.stringify({equipped:equipped,zone:back&&back.zone,p:back&&back.p,pos:back&&back.card.pos,
     atk:atkOf(me.uid),mz1:mzNames(1)}));
audit('D1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-C4CD12F0F66F（09/12/28）/ WIKI-BCC222AD1322（10/01/27）:
   特殊召喚できないモンスター（正規の方法で特殊召喚されていない特殊召喚モンスター）は墓地へ送られる。 */
const me=mk('トランスフォーム・スフィア',0,'up');
const lava=mkdef('溶岩魔神ラヴァ・ゴーレム',1);
gameState.players[0].mz=[me];
gameState.players[0].hand=[mk('ワイト',0)];
gameState.players[1].mz=[lava];
baselineA();
PREFER=[lava.uid];
const t1=useCard(0,me);
const equipped=zu(lava.uid)==='sz';
const tEnd=phase('end');
ok('D2 ★ WIKI-C4CD12F0F66F / WIKI-BCC222AD1322: 特殊召喚できないモンスターは装備されたままにならず墓地へ送られる',
   t1==='idle' && tEnd==='idle' && equipped && zu(lava.uid)==='grave'
   && (gameState.players[0].sz||[]).length===0 && (gameState.players[1].mz||[]).length===0,
   JSON.stringify({equipped:equipped,lava:zu(lava.uid),sz0:szNames(0),mz1:mzNames(1)}));
audit('D2');
`, {expect:2});

/* ===== E. 攻撃した場合はバトルフェイズ終了時に守備表示 ===== */
harness(COMMON + String.raw`
fresh();
const me=mk('トランスフォーム・スフィア',0,'up');
const foe=mkdef('ワイト',1);
gameState.players[0].mz=[me];
gameState.players[0].hand=[mk('ワイト',0)];
gameState.players[1].mz=[foe];
baselineA();
PREFER=[foe.uid];
const t1=useCard(0,me);        /* 装備して攻撃力 2600（ワイト 1200 → 1300） */
const atkAfterEquip=atkOf(me.uid);
phase('battle');
PREFER=[];
const t3=attack(0,findCardByUid(me.uid).index,'direct');   /* 相手の場は空なのでダイレクトアタック */
const tEnd=phase('end');
ok('E1 ★ 攻撃した場合、バトルフェイズ終了時に守備表示になる',
   t1==='idle' && t3==='idle' && cardOf(me.uid).pos==='def' && !!cardOf(me.uid).attacked,
   JSON.stringify({pos:cardOf(me.uid).pos,attacked:!!cardOf(me.uid).attacked,atk:atkAfterEquip,
     lp1:gameState.players[1].lp}));
audit('E1');
`, {expect:2});

/* ===== F. 《月の書》で裏側になった場合 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-C3A441FCF1AA（10/01/27）: 解決時に裏側表示でもそのまま装備カードになり、攻撃力はアップせず、
   エンドフェイズには表側守備表示で特殊召喚される。 */
const me=mk('トランスフォーム・スフィア',0,'up');
const foe=mkdef('デーモンの召喚',1);
const book=setc('月の書',1);
gameState.players[0].mz=[me];
gameState.players[0].hand=[mk('ワイト',0)];
gameState.players[1].mz=[foe];
gameState.players[1].sz=[book];
baselineA();
PREFER=[foe.uid];
duelActivateFromZone(0,'mz',findCardByUid(me.uid).index,{});
const resp=respond(1,book);
const t1=drive();
/* engine はゾーンを移ると必ず表側にするので、「裏側のまま装備された」事は印で測る
   （攻撃力がアップしない事が裁定の測れる帰結。報告書の未対応に書いた）。 */
const equippedDown=zu(foe.uid)==='sz' && Number(cardOf(foe.uid).u528FaceDownS03)===5;
const atkNow=atkOf(me.uid);
const tEnd=phase('end');
const back=findCardByUid(foe.uid);
ok('F1 ★ WIKI-C3A441FCF1AA（10/01/27）: 裏側表示でも装備され、攻撃力はアップせず、'
   +'エンドフェイズには表側守備表示で特殊召喚される',
   t1==='idle' && resp===true && equippedDown && atkNow===100
   && !!back && back.zone==='mz' && back.p===1 && back.card.face==='up' && back.card.pos==='def',
   JSON.stringify({resp:resp,equippedDown:equippedDown,atk:atkNow,zone:back&&back.zone,
     face:back&&back.card.face,pos:back&&back.card.pos,toasts:TOASTS.slice(0,3),titles:TITLES.slice(0,4)}));
audit('F1');
`, {expect:2});

/* ===== G. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S528['cards/HZZZZZZZZZZZZL_claude_s03_u528_transform_sphere.js'];
const doc = SRC_S528['docs/S03_U528_REPORT.md'];
okJs('G1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-2EF617C51571','WIKI-FDFA38E9B4B6','WIKI-B19BA75E212C','WIKI-78672B59DAAC','WIKI-C3A441FCF1AA',
   'WIKI-C4CD12F0F66F','WIKI-BCC222AD1322','WIKI-CF2792307CF3','WIKI-25181714FCFA'].every(id=>cardSrc.indexOf(id) >= 0));
okJs('G2 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-2EF617C51571') >= 0 && doc.indexOf('未対応') >= 0);
okJs('G3 ★ このテストが tools/check.py に登録されている',
  SRC_S528['tools/check.py'].indexOf('test_s03_u528_transform_sphere.js') >= 0);
