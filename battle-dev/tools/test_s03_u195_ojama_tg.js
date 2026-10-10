/* S03-U195: おジャマトリオ (token destruction damage: engine/1A + engine/18; Tribute restriction; 3 zones), TG ジェット・ファルコン (trigger),
   TG カタパルト・ドラゴン (ignition), TGX300. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
let PREFER=[],TRIG=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}

/* ===== A: おジャマトリオ — 3 おジャマトークン on the opponent's field (Defense); not Tributes for a Tribute Summon ===== */
fresh();
let oj=mk('おジャマトリオ',0,'down');oj.setTurn=4;gameState.players[0].sz=[oj];baselineA();
duelActivateFromZone(0,'sz',0);drive();
const toks=gameState.players[1].mz.filter(c=>c.token);
ok('A: 3 おジャマトークン (0 / 1000, Defense) on the opponent’s field',toks.length===3&&toks.every(c=>c.pos==='def'&&cardName(c)==='おジャマトークン'&&curATK(c)===0&&curDEF(c)===1000));
ok('A: not Tribute candidates for the opponent',tributeCandidates(1).length===0);
audit('A');
fresh();
oj=mk('おジャマトリオ',0,'down');oj.setTurn=4;gameState.players[0].sz=[oj];gameState.players[1].mz=[mk('ワイト',1,'up'),mk('ワイト',1,'up'),mk('ワイト',1,'up')];baselineA();
ok('A2: not activatable with fewer than 3 free zones on the opponent’s side',strictScriptLegalityV2('おジャマトリオ',0,'sz',0,{}).ok===false);

/* ===== B: おジャマトークン destroyed — its controller takes 300 each (by an effect: ブラック・ホール; by battle) ===== */
fresh();
oj=mk('おジャマトリオ',0,'down');oj.setTurn=4;let bh=mk('ブラック・ホール',0);gameState.players[0].sz=[oj];gameState.players[0].hand=[bh];baselineA();
duelActivateFromZone(0,'sz',0);drive();
const lpB=gameState.players[1].lp;
duelActivateFromHand(0);drive();
ok('B: ブラック・ホール destroyed the 3 tokens; their controller (the opponent) took 900',gameState.players[1].mz.length===0&&gameState.players[1].lp===lpB-900&&gameState.players[0].lp===8000,JSON.stringify([gameState.players[0].lp,gameState.players[1].lp]));
audit('B');
fresh();
oj=mk('おジャマトリオ',0,'down');oj.setTurn=4;let at=mk('ブラッド・ヴォルス',0,'up');gameState.players[0].sz=[oj];gameState.players[0].mz=[at];baselineA();
duelActivateFromZone(0,'sz',0);drive();
phase('battle');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('B2: destroyed by battle (1900 vs DEF 1000) — the opponent took 300, no battle damage',gameState.players[1].mz.filter(c=>c.token).length===2&&gameState.players[1].lp===7700,String(gameState.players[1].lp));
audit('B2');

/* ===== C: TG ジェット・ファルコン — sent to the GY as Synchro Material: 500 to the opponent ===== */
fresh();
let jf=mk('TG ジェット・ファルコン',0,'up'),nt=mk('マシュマロン',0,'up'),syn=mk('大地の騎士ガイアナイト',0);
gameState.players[0].mz=[jf,nt];gameState.players[0].ex=[syn];baselineA();
const cb=exCombos(0,dbOf(syn)).combos.find(c=>c.materials.length===2);
if(cb)beginExSummonV2(0,0,cb.materials,'synchro','atk');drive();
ok('C: 大地の騎士ガイアナイト Synchro Summoned (3 + 3); ジェット・ファルコン: the opponent 7500',!!cb&&z(syn)==='mz'&&z(jf)==='grave'&&gameState.players[1].lp===7500,JSON.stringify({cb:!!cb,syn:z(syn),lp:gameState.players[1].lp}));
audit('C');
fresh();
jf=mk('TG ジェット・ファルコン',0);let dcd=mk('ライトニング・ボルテックス',0);gameState.players[0].hand=[dcd,jf];gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();TRIG.length=0;
PREFER=[jf.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('C2: discarded (not Synchro Material) — no damage, no activation',z(jf)==='grave'&&gameState.players[1].lp===8000&&!TRIG.some(t=>/ファルコン/.test(t)),JSON.stringify(TRIG));
ok('C2: not activatable from the GY as an ignition effect',strictScriptLegalityV2('TG ジェット・ファルコン',0,'grave',gameState.players[0].grave.indexOf(C(jf)),{}).ok===false);
audit('C2');

/* ===== D: TG カタパルト・ドラゴン — once per turn, a Level 3 or lower 「TG」 Tuner from the hand; own Main Phase only ===== */
fresh();
let cp=mk('TG カタパルト・ドラゴン',0,'up'),tu=mk('TG ジェット・ファルコン',0);gameState.players[0].mz=[cp];gameState.players[0].hand=[tu];baselineA();
PREFER=[tu.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('D: TG ジェット・ファルコン special summoned; once per turn',z(tu)==='mz'&&strictScriptLegalityV2('TG カタパルト・ドラゴン',0,'mz',0,{}).ok===false);
audit('D');
fresh();
cp=mk('TG カタパルト・ドラゴン',0,'up');tu=mk('TG ジェット・ファルコン',0);gameState.players[0].mz=[cp];gameState.players[0].hand=[tu];gameState.phase='battle';baselineA();
ok('D2: not in the Battle Phase',strictScriptLegalityV2('TG カタパルト・ドラゴン',0,'mz',0,{}).ok===false);

/* ===== E: TGX300 — +300 per own face-up 「TG」 to every own face-up monster ===== */
fresh();
let tx=mk('TGX300',0,'up'),g1=mk('TG カタパルト・ドラゴン',0,'up'),g2=mk('TG ジェット・ファルコン',0,'up'),w1=mk('ワイト',0,'up'),ow=mk('ワイト',1,'up');
gameState.players[0].sz=[tx];gameState.players[0].mz=[g1,g2,w1];gameState.players[1].mz=[ow];baselineA();
ok('E: 2 「TG」 → +600: カタパルト 1500, ファルコン 2000, ワイト 900; the opponent’s ワイト 300',curATK(C(g1))===1500&&curATK(C(g2))===2000&&curATK(C(w1))===900&&curATK(C(ow))===300,
  JSON.stringify([curATK(C(g1)),curATK(C(g2)),curATK(C(w1)),curATK(C(ow))]));
`);
