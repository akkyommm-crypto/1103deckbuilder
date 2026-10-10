/* S03-U233: NOT_STARTED → TESTED — 異次元グランド, 黒いペンダント, 魔界の足枷, 明鏡止水の心, 機皇兵ワイゼル・アイン.
   Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function lp(p){return gameState.players[p].lp;}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);drive();}

/* ===== A: 異次元グランド — this turn, monsters going to the GY are banished instead; the next turn they go to the GY again ===== */
fresh();
let gr=mk('異次元グランド',0,'down');gr.setTurn=4;let be=mk('青眼の白龍',0,'up'),wt=mk('ワイト',1,'up'),w2=mk('ワイト',1,'up');
gameState.players[0].sz=[gr];gameState.players[0].mz=[be];gameState.players[1].mz=[wt,w2];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('A: resolved — the Trap itself (not a monster) goes to the GY',z(gr)==='grave',JSON.stringify({gr:z(gr)}));
phase('battle');requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('A: ワイト destroyed by battle → banished instead of the GY',z(wt)==='banish'&&C(wt).banishInfo&&C(wt).banishInfo.by==='異次元グランド',JSON.stringify({wt:z(wt),bi:C(wt).banishInfo}));
phase('main2');phase('end');turn();phase('standby');phase('main1');phase('battle');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:findCardByUid(w2.uid).index,target:0});drive();
ok('A: the next turn — the destroyed ワイト goes to the GY',gameState.turn===6&&z(w2)==='grave',JSON.stringify({t:gameState.turn,w2:z(w2)}));
audit('A');

/* ===== B: 黒いペンダント — ATK +500; sent from the field to the GY → 500 damage to the opponent; not from the hand ===== */
fresh();
let pd=mk('黒いペンダント',0),os=mk('大嵐',0),wb=mk('ワイト',0,'up');gameState.players[0].hand=[pd,os];gameState.players[0].mz=[wb];baselineA();
PREFER=[wb.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('B: equipped to ワイト — ATK 300 + 500',z(pd)==='sz'&&curATK(C(wb))===800,JSON.stringify({pd:z(pd),atk:curATK(C(wb))}));
duelActivateFromHand(0);drive();
ok('B: destroyed by 大嵐 → to the GY from the field → 500 damage to the opponent',z(pd)==='grave'&&lp(1)===7500&&lp(0)===8000,JSON.stringify({pd:z(pd),lp0:lp(0),lp1:lp(1)}));
audit('B');
fresh();
pd=mk('黒いペンダント',0);let lv=mk('ライトニング・ボルテックス',0),xx=mk('ワイト',0),ow=mk('ワイト',1,'up');gameState.players[0].hand=[lv,pd,xx];gameState.players[1].mz=[ow];baselineA();
PREFER=[pd.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('B2: discarded from the hand to the GY (a cost) — no damage',z(pd)==='grave'&&z(ow)==='grave'&&lp(1)===8000,JSON.stringify({pd:z(pd),ow:z(ow),lp1:lp(1)}));
audit('B2');

/* ===== C: 魔界の足枷 — equipped monster: ATK / DEF 100, cannot attack; its controller takes 500 at the Spell controller's Standby Phases ===== */
fresh();TRIG.length=0;
let ft=mk('魔界の足枷',0),bb=mk('青眼の白龍',1,'up');gameState.players[0].hand=[ft];gameState.players[1].mz=[bb];baselineA();
PREFER=[bb.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('C: equipped to the opponent 青眼 — ATK / DEF 100',z(ft)==='sz'&&curATK(C(bb))===100&&curStat(C(bb),'def')===100,JSON.stringify({atk:curATK(C(bb)),def:curStat(C(bb),'def')}));
phase('end');turn();
ok('C: the equipped monster cannot attack',gameState.activePlayer===1&&cannotAttackNow(C(bb)),JSON.stringify({ap:gameState.activePlayer}));
phase('standby');
ok('C: the opponent\'s Standby Phase — no damage',lp(1)===8000&&lp(0)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
phase('main1');phase('end');turn();phase('standby');
ok('C: its own Standby Phase — 500 to the equipped monster\'s controller',gameState.activePlayer===0&&lp(1)===7500&&lp(0)===8000,JSON.stringify({ap:gameState.activePlayer,lp0:lp(0),lp1:lp(1),TRIG}));
audit('C');

/* ===== D: 明鏡止水の心 — not destroyed by battle or by an effect that targets it; destroyed by a non-targeting effect; self-destroyed at ATK 1300+ ===== */
fresh();
let ht=mk('明鏡止水の心',0),sc=mk('シールドクラッシュ',0),bh=mk('ブラック・ホール',0),wd=mk('ワイト',0,'up','def');
gameState.players[0].hand=[ht,sc,bh];gameState.players[0].mz=[wd];baselineA();
PREFER=[wd.uid];duelActivateFromHand(0);drive();
ok('D: equipped to ワイト',z(ht)==='sz'&&C(ht).equipTo&&C(ht).equipTo.uid===wd.uid);
PREFER=[wd.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D: シールドクラッシュ targeting it — not destroyed',z(sc)==='grave'&&z(wd)==='mz',JSON.stringify({sc:z(sc),wd:z(wd)}));
audit('D');
gameState.activePlayer=1;let ab=mk('青眼の白龍',1,'up');gameState.players[1].mz=[ab];gameState.phase='battle';ensureAllCardUids(gameState);baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('D: attacked by 青眼 — not destroyed by battle',z(wd)==='mz',JSON.stringify({wd:z(wd)}));
gameState.activePlayer=0;gameState.phase='main1';baselineA();
duelActivateFromHand(0);drive();
ok('D: ブラック・ホール (not targeting) — destroyed',z(wd)==='grave'&&z(ht)==='grave',JSON.stringify({wd:z(wd),ht:z(ht)}));
fresh();
ht=mk('明鏡止水の心',0);let bw=mk('青眼の白龍',0,'up');gameState.players[0].hand=[ht];gameState.players[0].mz=[bw];baselineA();
PREFER=[bw.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D2: equipped to 青眼 (ATK 3000 ≥ 1300) — the card destroys itself',z(ht)==='grave'&&z(bw)==='mz',JSON.stringify({ht:z(ht)}));
audit('D2');

/* ===== E: 機皇兵ワイゼル・アイン — ATK +100 per other 「機皇」; another own 「機皇」 attacking a Defense Position monster pierces ===== */
fresh();
let wz=mk('機皇兵ワイゼル・アイン',0,'up'),sk=mk('機皇兵スキエル・アイン',0,'up'),dd=mk('ワイト',1,'up','def');
gameState.players[0].mz=[sk,wz];gameState.players[1].mz=[dd];gameState.phase='battle';baselineA();
ok('E: ATK 1800 + 100 (スキエル・アイン)',curATK(C(wz))===1900,JSON.stringify({atk:curATK(C(wz))}));
const skAtk=curATK(C(sk));TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('E: スキエル・アイン attacks the Defense Position ワイト — piercing damage ATK − 200',z(dd)==='grave'&&lp(1)===8000-(skAtk-200),JSON.stringify({skAtk,lp1:lp(1),TRIG}));
audit('E');
fresh();
wz=mk('機皇兵ワイゼル・アイン',0,'up');sk=mk('機皇兵スキエル・アイン',0,'up');dd=mk('ワイト',1,'up','def');
gameState.players[0].mz=[wz,sk];gameState.players[1].mz=[dd];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('E2: ワイゼル・アイン itself attacking — no piercing damage',z(dd)==='grave'&&lp(1)===8000,JSON.stringify({lp1:lp(1)}));
audit('E2');
`);
