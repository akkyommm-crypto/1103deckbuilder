/* S03-U329: 紫炎の参謀 / 寄子 / 老中 エニシ and ヴォルカニック・ハンマー — the declared Race (attack and Special Summon bans), the lingering battle protection, the hand procedure + destruction, the Graveyard-count burn. Real DUEL paths, Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3290001;
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
function attackers(p){return battleAttackersV29(p).map(x=>x.card.uid);}
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
const ZJ='六武衆－ザンジ',YA='六武衆－ヤリザ';

/* ===== 参謀 ===== */
{ fresh();const sb=mk('紫炎の参謀',0),zj=mon(ZJ,0),wa=mon('ワイト',0),f=mon('ワイト',1),lw=mk('青眼の白龍',0),w2=mon('ガスタ・ガルド',1);
  gameState.players[0].hand=[sb];gameState.players[0].mz=[zj,wa];gameState.players[1].mz=[f];baselineA();
  PREFER=['アンデット'];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('参謀: Normal Summoned with a 六武衆 on my field → the declared Race (アンデット) is stored',z(sb)==='mz'&&C(sb).u329Race==='アンデット',JSON.stringify({z:z(sb),r:C(sb)&&C(sb).u329Race}));
  audit('参謀 ①');phase('battle');
  ok('参謀: the アンデット monster (my ワイト) cannot attack, the Warrior (ザンジ) can',attackers(0).indexOf(wa.uid)<0&&attackers(0).indexOf(zj.uid)>=0,JSON.stringify(attackers(0)));
  }
{ fresh();const sb=mk('紫炎の参謀',0),wa=mon('ワイト',0);gameState.players[0].hand=[sb];gameState.players[0].mz=[wa];baselineA();
  doNormalSummon(0,'atk');drive();phase('battle');
  ok('参謀 negative: no 六武衆 on my field → no declaration, no ban (the アンデット ワイト may attack)',z(sb)==='mz'&&!C(sb).u329Race&&attackers(0).indexOf(wa.uid)>=0,JSON.stringify({r:C(sb)&&C(sb).u329Race,att:attackers(0)})); }
{ fresh();const sb=mk('紫炎の参謀',0),zj=mon(ZJ,0),gy=mk('ワイト',0),rv=mk('死者蘇生',0);
  gameState.players[0].hand=[sb,rv];gameState.players[0].mz=[zj];gameState.players[0].grave=[gy];baselineA();
  PREFER=['アンデット'];doNormalSummon(0,'atk');drive();PREFER=[];
  duelActivateFromHand(gameState.players[0].hand.indexOf(rv));drive();
  ok('参謀: the Special Summon ban is real — 死者蘇生 cannot revive the アンデット ワイト',z(gy)==='grave',JSON.stringify({gy:z(gy),toasts:TOASTS.slice(-2)})); }
{ fresh();const zj=mon(ZJ,0),gy=mk('ワイト',0),rv=mk('死者蘇生',0);gameState.players[0].hand=[rv];gameState.players[0].mz=[zj];gameState.players[0].grave=[gy];baselineA();
  duelActivateFromHand(0);drive();
  ok('参謀 control: without 参謀 the 死者蘇生 revives the ワイト',z(gy)==='mz',JSON.stringify({gy:z(gy)})); }

/* ===== 寄子 ===== */
{ fresh();const zj=mon(ZJ,0),yo=mk('紫炎の寄子',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[zj];gameState.players[0].hand=[yo];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);
  const used=attackRespond(1,f,zj,0,pl=>pl.kind==='damageStep'&&pl.step==='calc','hand',0);
  ok('寄子: used at the damage calculation of 青眼 vs ザンジ → ザンジ not destroyed by that battle (damage still dealt)',used&&z(zj)==='mz'&&z(yo)==='grave'&&lp(0)<l0,JSON.stringify({used,zj:z(zj),yo:z(yo),loss:l0-lp(0)}));
  audit('寄子'); }
{ fresh();const wa=mon('ワイト',0),yo=mk('紫炎の寄子',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[wa];gameState.players[0].hand=[yo];gameState.players[1].mz=[f];baselineA();
  toOppBattle();
  const used=attackRespond(1,f,wa,0,pl=>pl.kind==='damageStep'&&pl.step==='calc','hand',0);
  ok('寄子 negative: the battle does not involve a 六武衆 → not usable',!used&&z(yo)==='hand'&&z(wa)==='grave',JSON.stringify({used,yo:z(yo),wa:z(wa)})); }

/* ===== エニシ ===== */
{ fresh();const en=mk('紫炎の老中 エニシ',0),g1=mk(ZJ,0),g2=mk(YA,0),g3=mk('ワイト',0);gameState.players[0].hand=[en];gameState.players[0].grave=[g1,g2,g3];baselineA();
  ok('エニシ: two 六武衆 in the Graveyard → the procedure is legal',procOk('紫炎の老中 エニシ',0)===true,'');
  procRun('紫炎の老中 エニシ',0);
  ok('エニシ: Special Summoned; both 六武衆 banished (the ワイト stays)',z(en)==='mz'&&z(g1)==='banish'&&z(g2)==='banish'&&z(g3)==='grave',JSON.stringify({en:z(en),g1:z(g1),g2:z(g2),g3:z(g3)}));
  audit('エニシ ①'); }
{ fresh();const en=mk('紫炎の老中 エニシ',0),g1=mk(ZJ,0);gameState.players[0].hand=[en];gameState.players[0].grave=[g1];baselineA();
  ok('エニシ negative: one 六武衆 only → not legal',procOk('紫炎の老中 エニシ',0)===false,''); }
{ fresh();const en=mon('紫炎の老中 エニシ',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[en];gameState.players[1].mz=[f];baselineA();
  PREFER=[uid(f)];actZ('mz',en);PREFER=[];
  ok('エニシ: destroyed the chosen face-up monster; it cannot attack this turn; once per turn',z(f)==='grave'&&cannotAttackNow(C(en))===true&&canZ('mz',en)===false,JSON.stringify({f:z(f)}));
  audit('エニシ ②'); }

/* ===== ハンマー ===== */
{ fresh();const hm=mon('ヴォルカニック・ハンマー',0),g1=mk('ヴォルカニック・ラット',0),g2=mk('ヴォルカニック・ラット',0),g3=mk('ワイト',0);gameState.players[0].mz=[hm];gameState.players[0].grave=[g1,g2,g3];baselineA();
  const l1=lp(1);actZ('mz',hm);
  ok('ハンマー: 2 ヴォルカニック monsters in the Graveyard → 400 damage (ワイト not counted); it cannot attack; once per turn',l1-lp(1)===400&&cannotAttackNow(C(hm))===true&&canZ('mz',hm)===false,JSON.stringify({loss:l1-lp(1)}));
  audit('ハンマー'); }

console.log('U329 done');
`);
