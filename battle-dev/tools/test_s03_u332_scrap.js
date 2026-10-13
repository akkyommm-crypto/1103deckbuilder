/* S03-U332: スクラップ・ゴブリン / ソルジャー / ゴーレム / オルトロス / カウンター — Defense-Position destruction, recovery after a スクラップ card's effect destroyed them, the Synchro Material restriction, the revive on either field, the hand procedure, the DEF boost Trap. Real DUEL paths, Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3320001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function canZ(zone,c){return getLegalZoneActions(0,zone,idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(zone,c){duelActivateFromZone(0,zone,idx(c));drive();}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<400;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(pc()){pick();continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    break;}
  return done;}
const GB='スクラップ・ゴブリン',SO='スクラップ・ソルジャー',GO='スクラップ・ゴーレム',OR='スクラップ・オルトロス',CN='スクラップ・カウンター',SE='スクラップ・サーチャー',KI='スクラップ・キマイラ',HA='スクラップ・ハンター';

/* ===== ゴブリン ===== */
{ fresh();const gb=mon(GB,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[gb];gameState.players[1].mz=[f];baselineA();
  toOppBattle();atkTarget(1,f,gb);
  ok('ゴブリン: not destroyed by battle (青眼 3000 vs ATK 0)',z(gb)==='mz',z(gb));
  audit('ゴブリン ①'); }
{ fresh();const gb=mon(GB,0,'def'),f=mon('ワイト',1);gameState.players[0].mz=[gb];gameState.players[1].mz=[f];baselineA();
  toOppBattle();atkTarget(1,f,gb);
  ok('ゴブリン: a face-up Defense Position goblin was chosen as the attack target → still there during the Battle Phase…',z(gb)==='mz',z(gb));
  phase('main2');
  ok('ゴブリン: …and destroyed at the end of the Battle Phase',z(gb)==='grave',z(gb));
  audit('ゴブリン ②'); }
{ fresh();const gb=mon(GB,0,'atk'),f=mon('ワイト',1);gameState.players[0].mz=[gb];gameState.players[1].mz=[f];baselineA();
  toOppBattle();atkTarget(1,f,gb);phase('main2');
  ok('ゴブリン negative: in Attack Position it is not destroyed at the end of the Battle Phase',z(gb)==='mz',z(gb)); }
/* recovery: destroyed by the effect of a スクラップ card (オルトロス targets it) */
{ fresh();const gb=mon(GB,0),or=mk(OR,0),sa=mk(HA,0),sa2=mk('ワイト',0);gameState.players[0].mz=[gb];gameState.players[0].hand=[or];gameState.players[0].grave=[sa,sa2];baselineA();
  PREFER=[uid(gb)];procRun(OR,0);PREFER=[uid(sa)];drive();PREFER=[];
  ok('ゴブリン: destroyed by スクラップ・オルトロス (a スクラップ card effect) → it added a スクラップ monster of the Graveyard (ハンター) to the hand',z(or)==='mz'&&z(gb)==='grave'&&z(sa)==='hand'&&z(sa2)==='grave',JSON.stringify({or:z(or),gb:z(gb),sa:z(sa),sa2:z(sa2)}));
  audit('ゴブリン ③'); }
{ fresh();const gb=mon(GB,0),bh=mk('ブラック・ホール',0),sa=mk(HA,0);gameState.players[0].mz=[gb];gameState.players[0].hand=[bh];gameState.players[0].grave=[sa];baselineA();
  duelActivateFromHand(0);drive();
  ok('ゴブリン negative: destroyed by a non-スクラップ card (ブラック・ホール) → no recovery',z(gb)==='grave'&&z(sa)==='grave',JSON.stringify({gb:z(gb),sa:z(sa)})); }

/* ===== ソルジャー ===== */
{ fresh();const so=mon(SO,0),or=mk(OR,0),sa=mk(HA,0);gameState.players[0].mz=[so];gameState.players[0].hand=[or];gameState.players[0].grave=[sa];baselineA();
  PREFER=[uid(so)];procRun(OR,0);PREFER=[uid(sa)];drive();PREFER=[];
  ok('ソルジャー: the same recovery after オルトロス destroyed it',z(so)==='grave'&&z(sa)==='hand',JSON.stringify({so:z(so),sa:z(sa)})); }
{ fresh();const so=mon(SO,0),ko=mon('ガスタ・コドル',0),gd=mon('ガスタ・ガルド',0),gy=mk('大地の騎士ガイアナイト',0);gameState.players[0].ex=[gy];gameState.players[0].mz=[so,ko,gd];baselineA();
  const i=x=>gameState.players[0].mz.indexOf(x);
  const k=exCombos(0,dbOf(gy)).combos.map(c=>c.materials.slice().sort().join());
  ok('ソルジャー: not usable for a non-「スクラップ」 Synchro Monster (Lv5 + Lv1 would be Lv6 …); the other Tuner ガルド + コドル still is',k.indexOf([i(gd),i(ko)].sort().join())>=0&&k.every(c=>c.split(',').map(Number).indexOf(i(so))<0),JSON.stringify({k})); }

/* ===== ゴーレム ===== */
{ fresh();const gl=mon(GO,0),sa=mk(KI,0),hi=mk('青眼の白龍',0);gameState.players[0].mz=[gl];gameState.players[0].grave=[sa,hi];baselineA();
  PREFER=[uid(sa),'own'];actZ('mz',gl);PREFER=[];
  ok('ゴーレム: the Lv4 スクラップ (キマイラ) revived on my field',z(sa)==='mz'&&pl(sa)===0&&z(hi)==='grave',JSON.stringify({sa:z(sa),p:pl(sa)}));
  ok('ゴーレム: once per turn',canZ('mz',gl)===false,'');
  audit('ゴーレム ①'); }
{ fresh();const gl=mon(GO,0),sa=mk(KI,0);gameState.players[0].mz=[gl];gameState.players[0].grave=[sa];baselineA();
  PREFER=[uid(sa),'foe'];actZ('mz',gl);PREFER=[];
  ok('ゴーレム: or onto the opponent field',z(sa)==='mz'&&pl(sa)===1,JSON.stringify({sa:z(sa),p:pl(sa)}));
  audit('ゴーレム ②'); }
{ fresh();const gl=mon(GO,0),sa=mk('スクラップ・ドラゴン',0);gameState.players[0].mz=[gl];gameState.players[0].grave=[sa];baselineA();
  ok('ゴーレム negative: only a Lv8 Synchro スクラップ in the Graveyard → not available',canZ('mz',gl)===false,''); }

/* ===== オルトロス ===== */
{ fresh();const or=mk(OR,0);gameState.players[0].hand=[or];baselineA();
  ok('オルトロス negative: no スクラップ monster on my field → the procedure is not legal',procOk(OR,0)===false,'');
  const mm=normalSummonMethodsFor(dbOf(C(or)),0,'summon');ok('オルトロス: cannot be Normal Summoned',mm.length===0,JSON.stringify(mm)); }
{ fresh();const or=mk(OR,0),sa=mon(SE,0),sa2=mk(KI,0);gameState.players[0].mz=[sa];gameState.players[0].hand=[or];gameState.players[0].grave=[sa2];baselineA();
  PREFER=[uid(sa)];procRun(OR,0);PREFER=[];
  ok('オルトロス: Special Summoned by the procedure; the forced destruction destroyed the chosen own スクラップ (サーチャー)',z(or)==='mz'&&z(sa)==='grave',JSON.stringify({or:z(or),sa:z(sa)}));
  audit('オルトロス ①'); }
{ fresh();const or=mk(OR,0),sa=mon(SE,0),gy=mk(KI,0);gameState.players[0].mz=[sa];gameState.players[0].hand=[or];gameState.players[0].grave=[gy];baselineA();
  PREFER=[uid(or)];procRun(OR,0);PREFER=[uid(gy)];drive();PREFER=[];
  ok('オルトロス: it may target itself; destroyed by its own スクラップ effect → ②: a スクラップ monster of the Graveyard (キマイラ) added to the hand',z(or)==='grave'&&z(gy)==='hand',JSON.stringify({or:z(or),gy:z(gy),sa:z(sa)}));
  audit('オルトロス ②'); }

/* ===== カウンター ===== */
{ fresh();const gl=mon(GO,0,'def'),tr=mk(CN,0,'down'),f=mon('青眼の白龍',1);tr.setTurn=3;gameState.players[0].mz=[gl];gameState.players[0].sz=[tr];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l1=lp(1);
  const used=attackRespond(1,f,gl,0,pl=>pl.kind==='damageStep'&&pl.step==='calc','sz',0);
  ok('カウンター: used at the damage calculation of the attack on my Defense Position ゴーレム: DEF 1400 + 2000 = 3400 > 3000 → it survives and 青眼 takes 400',used&&z(gl)==='mz'&&l1-lp(1)===400&&z(tr)==='grave',JSON.stringify({used,gl:z(gl),loss:l1-lp(1),tr:z(tr)}));
  phase('main2');
  ok('カウンター: the boosted スクラップ is destroyed at the end of the Battle Phase',z(gl)==='grave',z(gl));
  audit('カウンター'); }
{ fresh();const wy=mon('ワイト',0,'def'),tr=mk(CN,0,'down'),f=mon('青眼の白龍',1);tr.setTurn=3;gameState.players[0].mz=[wy];gameState.players[0].sz=[tr];gameState.players[1].mz=[f];baselineA();
  toOppBattle();
  const used=attackRespond(1,f,wy,0,pl=>pl.kind==='damageStep'&&pl.step==='calc','sz',0);
  ok('カウンター negative: the attacked monster is not a スクラップ → not usable',!used&&z(tr)==='sz',JSON.stringify({used,tr:z(tr)})); }

console.log('U332 done');
`);
