/* S03-U328: the five 巨大戦艦 — counters on summon, the battle-indestructibility, the counter removal / destruction at the end of the Damage Step, カバード・コア' coin call, クリスタル・コア' position change, テトラン' Spell/Trap destruction, Mk－II's summon rules. Real DUEL paths, Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(seed){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=seed||0x3280001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function canZ(zone,c){return getLegalZoneActions(0,zone,idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(zone,c){duelActivateFromZone(0,zone,idx(c));drive();}
const K=c=>{const k=C(c);return (k&&k.counters&&Number(k.counters['カウンター']))||0;};
function seeded(want,run){for(let s=1;s<=80;s++){const r=run(0x3280000+s*7919);if(r&&r.res===want)return r;}return null;}
/* a Normal Summon from the hand with the given tributes (the standard Tribute method) */
function sumWith(name,tributes){fresh();const bs=mk(name,0),t=tributes.map(()=>mon('ワイト',0));gameState.players[0].hand=[bs];gameState.players[0].mz=t;gameState.players[1].mz=[mon('ワイト',1)];baselineA();
  PREFER=t.map(uid);doNormalSummon(0,'atk');drive();PREFER=[];return {bs,t};}

/* ===== ビッグ・コア: 3 counters, indestructible in battle, a counter per battle, destroyed without counters ===== */
{ const x=sumWith('巨大戦艦 ビッグ・コア',[0,1]);
  ok('ビッグ・コア: Normal Summoned (2 Tributes) → 3 counters',z(x.bs)==='mz'&&K(x.bs)===3,JSON.stringify({z:z(x.bs),k:K(x.bs)}));
  audit('ビッグ・コア ①');
  const f=gameState.players[1].mz[0];endTurn();endTurn();phase('battle');atkTarget(0,x.bs,f);
  ok('ビッグ・コア: it destroyed ワイト by battle; one counter removed at the end of the Damage Step (3 → 2)',z(f)==='grave'&&K(x.bs)===2&&z(x.bs)==='mz',JSON.stringify({f:z(f),k:K(x.bs)})); }
{ fresh();const bs=mon('巨大戦艦 ビッグ・コア',0),f=mon('青眼の白龍',1);bs.counters={'カウンター':1};gameState.players[0].mz=[bs];gameState.players[1].mz=[f];baselineA();
  toOppBattle();atkTarget(1,f,bs);
  ok('ビッグ・コア: attacked by 青眼 (3000 > 2300) it is not destroyed by battle; the counter 1 → 0',z(bs)==='mz'&&K(bs)===0,JSON.stringify({z:z(bs),k:K(bs)}));
  audit('ビッグ・コア ②'); }
{ fresh();const bs=mon('巨大戦艦 ビッグ・コア',0),f=mon('ワイト',1);gameState.players[0].mz=[bs];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,bs,f);
  ok('ビッグ・コア: a battle without counters → destroyed at the end of the Damage Step (it still destroyed ワイト)',z(f)==='grave'&&z(bs)==='grave',JSON.stringify({f:z(f),bs:z(bs)}));
  audit('ビッグ・コア ③'); }
{ fresh();const bs=mon('巨大戦艦 ビッグ・コア',0),f=mon('ワイト',1);bs.counters={'カウンター':2};gameState.players[0].mz=[bs];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,bs,'direct');
  ok('ビッグ・コア negative: a direct attack is not a battle with a monster → the counters stay (2)',K(bs)===2&&z(bs)==='mz',JSON.stringify({k:K(bs)})); }
{ fresh();const bs=mk('巨大戦艦 ビッグ・コア',0),f=mon('ワイト',1);gameState.players[0].hand=[bs];gameState.players[1].mz=[f];baselineA();
  const mths=normalSummonMethodsFor(dbOf(C(bs)),0,'summon');
  ok('ビッグ・コア negative: it is not Tribute-free (Lv6: only the standard method)',!mths.some(m=>m.tributes===0),JSON.stringify(mths.map(m=>m.id+':'+m.tributes))); }

/* ===== カバード・コア: 2 counters, the coin call at the end of the Damage Step ===== */
function covered(seed){
  fresh(seed);const bs=mon('巨大戦艦 カバード・コア',0),f=mon('ワイト',1);bs.counters={'カウンター':2};gameState.players[0].mz=[bs];gameState.players[1].mz=[f];baselineA();
  phase('battle');PREFER=['heads'];atkTarget(0,bs,f);PREFER=[];
  return {bs,f,res:K(bs)===2?'right':'wrong'};
}
{ const r=seeded('right',covered);
  ok('カバード・コア: the call was right → the counter stays (2)',!!r&&K(r.bs)===2&&z(r.bs)==='mz'&&z(r.f)==='grave',JSON.stringify({k:r&&K(r.bs)}));
  audit('カバード・コア right'); }
{ const r=seeded('wrong',covered);
  ok('カバード・コア: the call was wrong → one counter removed (2 → 1)',!!r&&K(r.bs)===1&&z(r.bs)==='mz',JSON.stringify({k:r&&K(r.bs)}));
  audit('カバード・コア wrong'); }
{ const x=sumWith('巨大戦艦 カバード・コア',[0,1]);
  ok('カバード・コア: Normal Summoned (2 Tributes) → 2 counters',z(x.bs)==='mz'&&K(x.bs)===2,JSON.stringify({k:K(x.bs)})); }
{ fresh();const bs=mon('巨大戦艦 カバード・コア',0),f=mon('ワイト',1);gameState.players[0].mz=[bs];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,bs,f);
  ok('カバード・コア: no counter → destroyed after the battle (no coin toss needed)',z(bs)==='grave'&&z(f)==='grave',JSON.stringify({bs:z(bs),f:z(f)})); }

/* ===== クリスタル・コア ===== */
{ const x=sumWith('巨大戦艦 クリスタル・コア',[0]);
  ok('クリスタル・コア: Normal Summoned (1 Tribute) → 3 counters',z(x.bs)==='mz'&&K(x.bs)===3,JSON.stringify({k:K(x.bs)})); }
{ fresh();const bs=mon('巨大戦艦 クリスタル・コア',0),f=mon('青眼の白龍',1),fd=mon('ワイト',1,'def');bs.counters={'カウンター':3};gameState.players[0].mz=[bs];gameState.players[1].mz=[f,fd];baselineA();
  ok('クリスタル・コア: available (a face-up Attack Position monster)',canZ('mz',bs)===true,'');
  PREFER=[uid(f)];actZ('mz',bs);PREFER=[];
  ok('クリスタル・コア: 青眼 changed to face-up Defense Position',f.pos==='def'&&C(f).pos==='def'&&C(f).face==='up',JSON.stringify({pos:C(f)&&C(f).pos}));
  ok('クリスタル・コア: once per turn',canZ('mz',bs)===false,'');
  audit('クリスタル・コア'); }
{ fresh();const bs=mon('巨大戦艦 クリスタル・コア',0),fd=mon('ワイト',1,'def');gameState.players[0].mz=[bs];gameState.players[1].mz=[fd];baselineA();
  ok('クリスタル・コア negative: no Attack Position monster → not available',canZ('mz',bs)===false,''); }

/* ===== テトラン ===== */
{ const x=sumWith('巨大戦艦 テトラン',[0,1]);
  ok('テトラン: Normal Summoned (2 Tributes) → 3 counters',z(x.bs)==='mz'&&K(x.bs)===3,JSON.stringify({k:K(x.bs)})); }
{ fresh();const bs=mon('巨大戦艦 テトラン',0),fs=mk('サイクロン',1,'down');fs.setTurn=3;bs.counters={'カウンター':3};gameState.players[0].mz=[bs];gameState.players[1].sz=[fs];baselineA();
  ok('テトラン: available with a counter and a Spell/Trap on the field',canZ('mz',bs)===true,'');
  PREFER=[uid(fs)];actZ('mz',bs);PREFER=[];
  ok('テトラン: a counter removed (3 → 2) as the cost, the Set card destroyed; once per turn',K(bs)===2&&z(fs)==='grave'&&canZ('mz',bs)===false,JSON.stringify({k:K(bs),fs:z(fs)}));
  audit('テトラン'); }
{ fresh();const bs=mon('巨大戦艦 テトラン',0),fs=mk('サイクロン',1,'down');fs.setTurn=3;gameState.players[0].mz=[bs];gameState.players[1].sz=[fs];baselineA();
  ok('テトラン negative: no counter → not available',canZ('mz',bs)===false,''); }

/* ===== ビッグ・コアMk－II ===== */
{ fresh();const bs=mk('巨大戦艦 ビッグ・コアMk－II',0);gameState.players[0].hand=[bs];baselineA();
  const mths=normalSummonMethodsFor(dbOf(C(bs)),0,'summon');
  ok('Mk－II: with no monster on my field a Tribute-free Normal Summon is offered',mths.some(m=>m.tributes===0),JSON.stringify(mths.map(m=>m.id+':'+m.tributes)));
  doNormalSummon(0,'atk');drive();
  ok('Mk－II: Normal Summoned without Tributes — and it has NO counters (they come with a Special Summon only)',z(bs)==='mz'&&K(bs)===0,JSON.stringify({z:z(bs),k:K(bs)}));
  audit('Mk－II ①'); }
{ fresh();const bs=mk('巨大戦艦 ビッグ・コアMk－II',0),o=mon('ワイト',0);gameState.players[0].hand=[bs];gameState.players[0].mz=[o];baselineA();
  const mths=normalSummonMethodsFor(dbOf(C(bs)),0,'summon');
  ok('Mk－II negative: with a monster on my field the Tribute-free method is not offered',!mths.some(m=>m.tributes===0),JSON.stringify(mths.map(m=>m.id+':'+m.tributes))); }
{ fresh();const bs=mk('巨大戦艦 ビッグ・コアMk－II',0),rv=mk('死者蘇生',0);gameState.players[0].hand=[rv];gameState.players[0].grave=[bs];baselineA();
  PREFER=[uid(bs)];duelActivateFromHand(0);drive();PREFER=[];
  ok('Mk－II: Special Summoned (死者蘇生) → 3 counters',z(bs)==='mz'&&K(bs)===3,JSON.stringify({z:z(bs),k:K(bs)}));
  audit('Mk－II ②'); }

console.log('U328 done');
`);
