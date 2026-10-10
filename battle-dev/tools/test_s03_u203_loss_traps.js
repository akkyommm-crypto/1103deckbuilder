/* S03-U203: Traps activated on the destruction of an own monster — ヒーロー・シグナル / デステニー・シグナル (by battle), スネーク・ホイッスル (a Reptile
   destroyed), 蛇神降臨 (毒蛇王ヴェノミノン destroyed other than by battle). Offered in the event group (Spell / Trap rank). Real DUEL paths,
   Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],SEEN=[];
function step(){const q=pc();if(q){SEEN.push({title:q.title,names:q.candidates.map(x=>x.label||x.name||'')});let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function offered(c){return SEEN.some(s=>s.names.some(n=>String(n).indexOf(cardName(c))>=0));}
function oppAttack(){gameState.activePlayer=1;gameState.phase='battle';}

/* ===== A: ヒーロー・シグナル — the own monster destroyed by battle: a Level 4 or lower 「E・HERO」 from the hand or the Deck ===== */
fresh();
let sg=mk('ヒーロー・シグナル',0,'down');sg.setTurn=4;let my=mk('ワイト',0,'up'),hr=mk('E・HERO スパークマン',0),big=mk('E・HERO エッジマン',0),at=mk('ブラッド・ヴォルス',1,'up');
gameState.players[0].sz=[sg];gameState.players[0].mz=[my];gameState.players[0].deck.push(big,hr);gameState.players[1].mz=[at];oppAttack();baselineA();SEEN=[];TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('A: ワイト destroyed → ヒーロー・シグナル activated; E・HERO スパークマン special summoned; エッジマン (Lv7) not offered',z(my)==='grave'&&z(sg)==='grave'&&z(hr)==='mz'&&!offered(big)&&TRIG.some(t=>/シグナル/.test(t)));
audit('A');
fresh();
sg=mk('ヒーロー・シグナル',0,'down');sg.setTurn=5;my=mk('ワイト',0,'up');hr=mk('E・HERO スパークマン',0);at=mk('ブラッド・ヴォルス',1,'up');
gameState.players[0].sz=[sg];gameState.players[0].mz=[my];gameState.players[0].deck.push(hr);gameState.players[1].mz=[at];oppAttack();baselineA();TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('A2: set this turn — not offered',z(sg)==='sz'&&z(hr)==='deck'&&!TRIG.some(t=>/シグナル/.test(t)),JSON.stringify(TRIG));
audit('A2');
fresh();
sg=mk('ヒーロー・シグナル',0,'down');sg.setTurn=4;hr=mk('E・HERO スパークマン',0);let om=mk('ワイト',1,'up'),mine=mk('ブラッド・ヴォルス',0,'up');
gameState.players[0].sz=[sg];gameState.players[0].mz=[mine];gameState.players[0].deck.push(hr);gameState.players[1].mz=[om];gameState.phase='battle';baselineA();TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('A3: the opponent’s monster destroyed by battle — not offered',z(om)==='grave'&&z(sg)==='sz'&&!TRIG.some(t=>/シグナル/.test(t)));
audit('A3');

/* ===== B: デステニー・シグナル — a Level 4 or lower 「D－HERO」 ===== */
fresh();
let ds=mk('デステニー・シグナル',0,'down');ds.setTurn=4;my=mk('ワイト',0,'up');let dh=mk('D－HERO ダイヤモンドガイ',0);at=mk('ブラッド・ヴォルス',1,'up');
gameState.players[0].sz=[ds];gameState.players[0].mz=[my];gameState.players[0].hand=[dh];gameState.players[1].mz=[at];oppAttack();baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('B: D－HERO ダイヤモンドガイ (Lv4) special summoned from the hand',z(dh)==='mz');
audit('B');

/* ===== C: スネーク・ホイッスル — an own Reptile destroyed (by an effect): a Level 4 or lower Reptile from the Deck ===== */
fresh();
let sw=mk('スネーク・ホイッスル',0,'down');sw.setTurn=4;let rp=mk('レプティレス・スキュラ',0,'up'),rd=mk('レプティレス・ナージャ',0),ts=mk('サンダー・ボルト',1);
gameState.players[0].sz=[sw];gameState.players[0].mz=[rp];gameState.players[0].deck.push(rd);gameState.players[1].hand=[ts];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('C: レプティレス・スキュラ destroyed by サンダー・ボルト → レプティレス・ナージャ special summoned',z(rp)==='grave'&&z(rd)==='mz');
audit('C');

/* ===== D: 蛇神降臨 — face-up 毒蛇王ヴェノミノン destroyed other than by battle: 毒蛇神ヴェノミナーガ from the hand or the Deck ===== */
fresh();
let jd=mk('蛇神降臨',0,'down');jd.setTurn=4;let vn=mk('毒蛇王ヴェノミノン',0,'up'),vg=mk('毒蛇神ヴェノミナーガ',0);ts=mk('サンダー・ボルト',1);
gameState.players[0].sz=[jd];gameState.players[0].mz=[vn];gameState.players[0].deck.push(vg);gameState.players[1].hand=[ts];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('D: ヴェノミノン destroyed by サンダー・ボルト → 毒蛇神ヴェノミナーガ special summoned',z(vn)==='grave'&&z(vg)==='mz',JSON.stringify({vg:z(vg),TRIG}));
audit('D');
fresh();
jd=mk('蛇神降臨',0,'down');jd.setTurn=4;vn=mk('毒蛇王ヴェノミノン',0,'up');vg=mk('毒蛇神ヴェノミナーガ',0);at=mk('青眼の白龍',1,'up');
gameState.players[0].sz=[jd];gameState.players[0].mz=[vn];gameState.players[0].deck.push(vg);gameState.players[1].mz=[at];oppAttack();baselineA();TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('D2: destroyed by battle — not offered',z(vg)==='deck'&&!TRIG.some(t=>/蛇神降臨/.test(t)),JSON.stringify(TRIG));
audit('D2');
`);
