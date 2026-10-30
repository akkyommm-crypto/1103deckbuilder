/* S03-U487: 《血の代償》の効果による通常召喚を、本当の通常召喚として扱う。
   S03-U486 の測定中に見つけた欠陥。cards/00_generic_core.js の s03BloodOfferTributeThenSummon が raw FX_SPECIAL_SUMMON を
   直接発火していたため、
     - onNormalSummon が一度も発火せず、召喚誘発（《E・HERO エアーマン》《グリーン・ガジェット》等）が丸ごと起きない
     - 相手の「召喚に成功した時」の応答（《奈落の落とし穴》《激流葬》等）の機会も一切無い（召喚成功後の POINT も作られない）
     - 特殊召喚扱い（specialSummoned / ssHistory）になり、「召喚に成功したターン」の記録（normalSummonSuccessS03）が付かない
     - アドバンス召喚の手順記録（tributeCount / tributeValue / normalSummonMethod）が残らない
   当時裁定（1103_SHARED の wiki-rulings.js）:
     「通常召喚は、どのように行いますか？」→「まず、500ライフを払い効果を発動します。その効果はチェーンブロックを作りますので、
       次にチェーンの有無を確認します。そして効果処理の段階で、手札からモンスターを『通常召喚扱いで』召喚します。
       アドバンス召喚の場合は、その効果処理の時点でリリースします。」
     「この効果による通常召喚に対し《奈落の落とし穴》を発動できますか？」→「チェーン1で行っているならば、発動可能です。
       チェーン2以上で行い、召喚の後に別の処理がある場合はタイミングを逃すことになり発動できません。」
     「…《神の宣告》《キックバック》《神の角笛》などの召喚を無効にするカードを発動できますか？」→同じ（11/08/25）。
     「まだこのターン通常召喚を行っていない状態で…本来の通常召喚を行わずにこのカードの効果による通常召喚を行うことは出来ますか？」
       →「1ターンに1度可能な通常召喚を行う前に、《血の代償》の効果による通常召喚を行う事はできます。(10/7/19)」
   修正: 正規経路（engine/40 の runSummonWindowResumeS03）と同じ NORMAL_SUMMON（prepaid=true）＋ queueDeferredEventV2('onNormalSummon')。
   リリースは今までどおりスクリプト側が効果処理の段階で行い、その直前に P3 の素材スナップショットを取る（engine/70 の pickTributes と同じ作法）。 */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function live(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function uid(c){return ensureCardUid(gameState,c);}
let ENQ=[],EVS=[];
(function(){const f=enqueueProcessorV27;enqueueProcessorV27=function(t,pl,front){
  if(t===PROCESSOR_V27.POINT&&pl&&pl.kind)ENQ.push(pl.kind);return f.apply(this,arguments);};
 const g=queueDeferredEventV2;queueDeferredEventV2=function(n,e){EVS.push(n);return g.apply(this,arguments);};})();
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  return null;}
function drive(){for(let i=0;i<600;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,180));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;ENQ=[];EVS=[];
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4870011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
/* 相手が前のターンに伏せた《奈落の落とし穴》 */
function foeAbyss(){const t=mk('奈落の落とし穴',1,'down');t.setTurn=gameState.turn-1;gameState.players[1].sz.push(t);return t;}
function normalRightLeft(){return (typeof normalRightFreeS03==='function')?!!normalRightFreeS03(gameState.players[0]):null;}
`;

/* ===== A. 召喚誘発と相手の応答が、普通の通常召喚と同じように働く ===== */
harness(COMMON+String.raw`
/* --- A1: 《血の代償》経由 --- */
fresh();
const bo=mk('血の代償',0,'up');gameState.players[0].sz=[bo];
const air=mk('E・HERO エアーマン',0);gameState.players[0].hand=[air];
gameState.players[0].deck.unshift(mk('E・HERO オーシャン',0));
foeAbyss();
baselineA();
duelActivateFromZone(0,'sz',0);
drive();
const a1={evs:EVS.slice(),enq:ENQ.slice(),hand:gameState.players[0].hand.length,zone:z(air),lp:gameState.players[0].lp};
ok('A1 ★ 《血の代償》の召喚で onNormalSummon が発火する（修正前は一度も発火しなかった）',
   a1.evs.indexOf('onNormalSummon')>=0,JSON.stringify(a1.evs));
ok('A1 ★ 召喚成功後のクイックエフェクト確認（summonFast）が作られる',
   a1.enq.indexOf('summonFast')>=0,JSON.stringify(a1.enq));
ok('A1 ★ 召喚したモンスター自身の召喚誘発が働く（エアーマンがデッキから手札に加えた）',
   a1.hand===1,'hand='+a1.hand);
ok('A1 ★ 相手の「召喚に成功した時」の応答が働く（《奈落の落とし穴》で除外された）',
   a1.zone==='banish',JSON.stringify({zone:a1.zone}));
ok('A1: コストの 500 は支払われている',a1.lp===7500,String(a1.lp));
audit('A1');
globalThis.__A1=JSON.stringify(a1);

/* --- A2: 対照。同じ盤面を普通の通常召喚で --- */
fresh();
const air2=mk('E・HERO エアーマン',0);gameState.players[0].hand=[air2];
gameState.players[0].deck.unshift(mk('E・HERO オーシャン',0));
foeAbyss();
baselineA();
doNormalSummon(0,'atk');
drive();
const a2={evs:EVS.slice(),enq:ENQ.slice(),hand:gameState.players[0].hand.length,zone:z(air2)};
ok('A2 対照: 普通の通常召喚では onNormalSummon と summonFast があり、誘発も相手の応答も働く',
   a2.evs.indexOf('onNormalSummon')>=0&&a2.enq.indexOf('summonFast')>=0&&a2.hand===1&&a2.zone==='banish',
   JSON.stringify(a2));
ok('A ★ 《血の代償》経由と普通の通常召喚で、誘発・応答・最終的な置き場所が一致する',
   a1.hand===a2.hand&&a1.zone===a2.zone
   &&(a1.evs.indexOf('onNormalSummon')>=0)===(a2.evs.indexOf('onNormalSummon')>=0)
   &&(a1.enq.indexOf('summonFast')>=0)===(a2.enq.indexOf('summonFast')>=0),
   JSON.stringify({blood:a1,normal:a2}));
`);

/* ===== B. 「通常召喚扱い」であること（特殊召喚扱いにしない） ===== */
harness(COMMON+String.raw`
fresh();
const bo=mk('血の代償',0,'up');gameState.players[0].sz=[bo];
const g=mk('グリーン・ガジェット',0);gameState.players[0].hand=[g];
gameState.players[0].deck.unshift(mk('レッド・ガジェット',0));
baselineA();
ok('B 前提: 召喚前は通常召喚権が残っている',normalRightLeft()===true,String(normalRightLeft()));
duelActivateFromZone(0,'sz',0);
drive();
const c=live(g);
ok('B 前提: 場に出ている',!!c&&z(g)==='mz',z(g));
ok('B ★ 特殊召喚扱いになっていない（specialSummoned が立たない）',
   !c.specialSummoned&&!c.specialSummonedFrom,JSON.stringify({ss:!!c.specialSummoned,from:c.specialSummonedFrom||null}));
ok('B ★ 特殊召喚の履歴にも載らない',
   (gameState.players[0].ssHistory||[]).every(h=>h.name!=='グリーン・ガジェット'),
   JSON.stringify(gameState.players[0].ssHistory||[]));
ok('B ★ 「召喚に成功したターン」の記録が付く（normalSummonSuccessS03）',
   !!(gameState.players[0].temporaryFlags||{}).normalSummonSuccessS03,
   JSON.stringify((gameState.players[0].temporaryFlags||{}).normalSummonSuccessS03||null));
ok('B ★ 召喚のターン記録が付く',Number(c.summonedTurn)===gameState.turn,String(c.summonedTurn));
ok('B ★ P3 の召喚由来が「通常召喚」になっている',
   !!c.summonProvenance&&c.summonProvenance.summonType==='normal',JSON.stringify(c.summonProvenance||null));
ok('B ★ 通常召喚権は消費されない（当時裁定 10/7/19: 本来の通常召喚の前にこの効果の通常召喚を行える）',
   normalRightLeft()===true,String(normalRightLeft()));
ok('B: ガジェットの召喚誘発も働いている（デッキから手札に加えた）',gameState.players[0].hand.length===1,String(gameState.players[0].hand.length));
audit('B');
`);

/* ===== C. アドバンス召喚: リリースは効果処理の段階で行われ、手順が記録される ===== */
harness(COMMON+String.raw`
fresh();
const bo=mk('血の代償',0,'up');gameState.players[0].sz=[bo];
const big=mk('サイバー・ドラゴン',0);   /* レベル5 = リリース1体 */
gameState.players[0].hand=[big];
const food=mk('ワイト',0,'up');gameState.players[0].mz=[food];
baselineA();
ok('C 前提: レベル5以上で、リリースを必要とする召喚方法がある',
   normalSummonMethodsFor(dbOf(big),0,'summon').some(m=>(m.tributes||0)>=1),
   JSON.stringify(normalSummonMethodsFor(dbOf(big),0,'summon').map(m=>({id:m.id,t:m.tributes}))));
duelActivateFromZone(0,'sz',0);
drive();
const c=live(big);
ok('C ★ リリースが行われ、モンスターが通常召喚された',
   !!c&&z(big)==='mz'&&z(food)==='grave',JSON.stringify({big:z(big),food:z(food)}));
ok('C ★ アドバンス召喚の手順が記録される（tributeCount / tributeValue）',
   Number(c.tributeCount)>=1&&Number(c.tributeValue)>=1,JSON.stringify({n:c.tributeCount,v:c.tributeValue}));
ok('C ★ 召喚方法が記録される（normalSummonMethod）',c.normalSummonMethod!=null,String(c.normalSummonMethod));
ok('C ★ P3 の召喚由来がアドバンス召喚（tribute）になり、素材が uid で辿れる',
   !!c.summonProvenance&&c.summonProvenance.summonType==='tribute'
   &&(c.summonProvenance.materialRefs||[]).indexOf(uid(food))>=0,
   JSON.stringify(c.summonProvenance||null));
ok('C ★ リリース前のスナップショットが残っている（場を離れた後では取れない値）',
   (c.summonProvenance.materialSnapshots||[]).length===1
   &&(c.summonProvenance.materialSnapshots[0]||{}).uid===uid(food),
   JSON.stringify(c.summonProvenance.materialSnapshots||null));
ok('C: onNormalSummon も発火している',EVS.indexOf('onNormalSummon')>=0,JSON.stringify(EVS));
audit('C');
`);

/* ===== D. Negative control: 修正前の raw FX_SPECIAL_SUMMON に戻すと、誘発も応答も失われる ===== */
harness(COMMON+String.raw`
/* S03-U487 より前の実装に差し替える */
s03BloodOfferTributeThenSummon=function(p,targetCard,method,db,chosen){
  const need=method.tributes||0, spent=chosen.reduce((s,x)=>s+(x.value||1),0), remaining=need-spent;
  if(remaining<=0){
    chosen.forEach(ent=>{const loc=locateCardAnyV4(ent.card); if(loc) API.sendToGrave(loc,"血の代償（アドバンス召喚のリリース）");});
    const hr=locateCardAnyV4(targetCard); if(!hr||hr.zone!=='hand') return;
    act({type:"FX_SPECIAL_SUMMON",player:p,from:'hand',fromIndex:hr.index,pos:'atk',reason:"血の代償（通常召喚扱い）"});
    return;
  }
  const used=new Set(chosen.map(x=>x.card));
  const left=tributeCandidatesForV23(p,db,method,'summon').filter(x=>!used.has(x.card));
  if(!left.length) return;
  API.selectCard('血の代償：リリースするモンスター（残り'+remaining+'体分）',left,x=>{
    const vals=tributeValueOptions(x.card,db).filter(v=>v<=remaining);
    chosen.push({card:x.card,value:vals.length?vals[vals.length-1]:1});
    s03BloodOfferTributeThenSummon(p,targetCard,method,db,chosen);});
};
fresh();
const bo=mk('血の代償',0,'up');gameState.players[0].sz=[bo];
const air=mk('E・HERO エアーマン',0);gameState.players[0].hand=[air];
gameState.players[0].deck.unshift(mk('E・HERO オーシャン',0));
foeAbyss();
baselineA();
duelActivateFromZone(0,'sz',0);
drive();
ok('D negative control 前提: 同じ盤面で場に出るところまでは同じ',z(air)==='mz',z(air));
ok('D negative control: 修正前は onNormalSummon が発火しない（これが直した欠陥）',
   EVS.indexOf('onNormalSummon')<0,JSON.stringify(EVS));
ok('D negative control: 召喚成功後の POINT も作られない',ENQ.indexOf('summonFast')<0,JSON.stringify(ENQ));
ok('D negative control: 召喚したモンスター自身の召喚誘発が起きない（エアーマンが手札を増やせない）',
   gameState.players[0].hand.length===0,String(gameState.players[0].hand.length));
ok('D negative control: 相手の《奈落の落とし穴》も発動できない（除外されずに場に残る）',
   z(air)==='mz',z(air));
ok('D negative control: 特殊召喚扱いになってしまう',!!live(air).specialSummoned,String(!!live(air).specialSummoned));
`);
