/* S03-U340: ストライク・ショット, チェンジ・デステニー, ライト・バニッシュ, ヴィクティム・カウンター, ワンダー・クローバー.
   Real DUEL paths (attack-declaration traps, the summon-negation window, chain responses, a lingering attack-limit spell), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3400001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(c){duelActivateFromZone(0,'mz',idx(c));drive();}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}


const STR='ストライク・ショット',DES='チェンジ・デステニー',BAN='ライト・バニッシュ',VIC='ヴィクティム・カウンター',CLO='ワンダー・クローバー';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
/* player p (the current attacker) attacks; the other player responds with the card at (zone, index) at the declaration when respond is given */
function attackRespond(p,att,target,respond){
  const q=p===0?1:0;
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<200;k++){const w=gameState.processorWaiting;
    if(respond&&!done&&gameState.pendingAttack&&w&&w.type==='POINT'&&gameState.processorPaused){try{pointActivateV27(respond[0],respond[1],respond[2],0);}catch(e){}done=true;continue;}
    if(drive()==='idle')break;}
  drive();return done;}

/* ===== ストライク・ショット ===== */
{ fresh();const a=mon('ジェムナイト・エメラル',0),tr=setCard(STR,0),f=mon('ワイト',1,'def');gameState.players[0].mz=[a];gameState.players[0].sz=[tr];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l1=lp(1);attackRespond(0,a,f,[0,'sz',0]);
  ok('ストライク・ショット: ATK 1800 + 700 = 2500 against a Defense Position ワイト (DEF 200): piercing 2300 damage',z(f)==='grave'&&z(tr)==='grave'&&l1-lp(1)===2300,JSON.stringify({f:z(f),tr:z(tr),loss:l1-lp(1)}));
  audit('ストライク・ショット ①');
  endTurn();ok('ストライク・ショット: ATK back to 1800 after the End Phase',curATK(C(a))===1800,String(curATK(C(a)))); }
{ fresh();const a=mon('ジェムナイト・エメラル',0),tr=setCard(STR,0),f=mon('ワイト',1);gameState.players[0].mz=[a];gameState.players[0].sz=[tr];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l1=lp(1);attackRespond(0,a,f,[0,'sz',0]);
  ok('ストライク・ショット: against an Attack Position ワイト (ATK 300) only the battle damage 2500 − 300 (no piercing)',z(f)==='grave'&&l1-lp(1)===2200,JSON.stringify({f:z(f),loss:l1-lp(1)})); }
{ fresh();const a=mon('ジェムナイト・エメラル',0),tr=setCard(STR,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[a];gameState.players[0].sz=[tr];gameState.players[1].mz=[f];baselineA();
  toOppBattle();attackRespond(1,f,a,[0,'sz',0]);
  ok('ストライク・ショット negative: the opponent\'s attack declaration → cannot be activated (the card stays Set)',z(tr)==='sz',z(tr)); }

/* ===== チェンジ・デステニー ===== */
function destiny(choice){fresh();const m=mon('ワイト',0),tr=setCard(DES,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[m];gameState.players[0].sz=[tr];gameState.players[1].mz=[f];baselineA();
  toOppBattle();PREFER=[choice];attackRespond(1,f,m,[0,'sz',0]);PREFER=[];return {m,tr,f};}
{ const x=destiny('damage');
  ok('デステニー: the attack is negated (ワイト survives, no battle damage) and 青眼 is put into Defense Position',z(x.m)==='mz'&&C(x.f).pos==='def'&&z(x.tr)==='grave',JSON.stringify({m:z(x.m),pos:C(x.f).pos,tr:z(x.tr)}));
  ok('デステニー: the opponent chose the damage → I take half of 3000 = 1500',lp(0)===6500&&lp(1)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
  ok('デステニー: 青眼 cannot change its position while face-up',cannotChangePositionV10(C(x.f))===true,'');
  audit('デステニー ①');
  endTurn();endTurn();
  ok('デステニー: the lock lasts across turns',cannotChangePositionV10(C(x.f))===true&&C(x.f).pos==='def',String(C(x.f).pos)); }
{ const x=destiny('heal');
  ok('デステニー: the opponent chose the recovery → they recover 1500 (LP 9500), I take no damage',lp(1)===9500&&lp(0)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
  audit('デステニー ②'); }
{ fresh();const m=mon('ワイト',0),tr=setCard(DES,0),f=mon('ワイト',1);gameState.players[0].mz=[m];gameState.players[0].sz=[tr];gameState.players[1].mz=[f];baselineA();
  phase('battle');attackRespond(0,m,f,[0,'sz',0]);
  ok('デステニー negative: my own attack declaration → cannot be activated',z(tr)==='sz',z(tr)); }
{ fresh();const m=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[m];gameState.players[1].mz=[f];baselineA();
  toOppBattle();attackRespond(1,f,m,null);
  ok('デステニー control: without it the ワイト is destroyed and 青眼 stays in Attack Position',z(m)==='grave'&&C(f).pos==='atk'&&cannotChangePositionV10(C(f))===false,JSON.stringify({m:z(m),pos:C(f).pos})); }

/* ===== ライト・バニッシュ ===== */
{ fresh();const lord=mon('ライトロード・ウォリアー ガロス',0),bn=setCard(BAN,0),w=mk('ワイト',1);gameState.activePlayer=1;gameState.players[0].mz=[lord];gameState.players[0].sz=[bn];gameState.players[1].hand=[w];baselineA();
  doNormalSummon(0,'atk');
  const neg=gameState.pendingSummon?summonNegatorsV2(gameState.pendingSummon):[];
  ok('ライト・バニッシュ: the summon-negation window offers it (a 「ライトロード」 monster on my field)',neg.some(x=>x.card===bn&&x.p===0),JSON.stringify(neg.map(x=>[x.db.n,x.p])));
  activateSummonNegatorV2(0,'sz',0);drive();
  ok('ライト・バニッシュ: the 「ライトロード」 released (cost), the opponent\'s Normal Summon negated and the monster destroyed',z(lord)==='grave'&&z(w)==='grave'&&z(bn)==='grave'&&!gameState.pendingSummon,JSON.stringify({lord:z(lord),w:z(w),bn:z(bn)}));
  audit('ライト・バニッシュ ①'); }
{ fresh();const bn=setCard(BAN,0),w=mk('ワイト',1);gameState.activePlayer=1;gameState.players[0].mz=[mon('ワイト',0)];gameState.players[0].sz=[bn];gameState.players[1].hand=[w];baselineA();
  doNormalSummon(0,'atk');
  const neg=gameState.pendingSummon?summonNegatorsV2(gameState.pendingSummon):[];
  ok('ライト・バニッシュ negative: no 「ライトロード」 monster on my field → not offered',!neg.some(x=>x.card===bn),JSON.stringify(neg.map(x=>x.db.n))); drive(); }
{ fresh();const lord=mon('ライトロード・ウォリアー ガロス',0),bn=setCard(BAN,0),rev=mk('死者蘇生',1),gy=mk('青眼の白龍',1);gameState.activePlayer=1;
  gameState.players[0].mz=[lord];gameState.players[0].sz=[bn];gameState.players[1].hand=[rev];gameState.players[1].grave=[gy];baselineA();
  PREFER=[uid(gy)];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(0):[];
  ok('ライト・バニッシュ: offered against 死者蘇生 (a Special Summon effect)',resp.some(x=>x.card===bn),JSON.stringify(resp.map(x=>x.db.n)));
  duelActivateResponseV2(0,'sz',0);drive();
  ok('ライト・バニッシュ: 死者蘇生 negated, 青眼 stays in the Graveyard; the 「ライトロード」 released',z(gy)==='grave'&&z(rev)==='grave'&&z(lord)==='grave',JSON.stringify({gy:z(gy),rev:z(rev),lord:z(lord)}));
  audit('ライト・バニッシュ ②'); }

/* ===== ヴィクティム・カウンター ===== */
{ fresh();const g=mon('ジェムナイト・アイオーラ',0),vc=setCard(VIC,0),bh=mk('ブラック・ホール',1);gameState.activePlayer=1;gameState.players[0].mz=[g];gameState.players[0].sz=[vc];gameState.players[1].hand=[bh];baselineA();
  duelActivateFromHand(0);for(let i=0;i<4&&pc();i++)pick();
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(0):[];
  ok('ヴィクティム・カウンター: offered against the opponent\'s Spell Card activation',resp.some(x=>x.card===vc),JSON.stringify(resp.map(x=>x.db.n)));
  duelActivateResponseV2(0,'sz',0);drive();
  ok('ヴィクティム・カウンター: the Gemini monster turned face-down Defense (cost), ブラック・ホール negated and destroyed (the monster was not destroyed)',z(g)==='mz'&&C(g).face==='down'&&C(g).pos==='def'&&z(bh)==='grave'&&z(vc)==='grave',JSON.stringify({g:z(g),face:C(g).face,bh:z(bh)}));
  audit('ヴィクティム・カウンター ①'); }
{ fresh();const vc=setCard(VIC,0),bh=mk('ブラック・ホール',1);gameState.activePlayer=1;gameState.players[0].mz=[mon('ワイト',0)];gameState.players[0].sz=[vc];gameState.players[1].hand=[bh];baselineA();
  duelActivateFromHand(0);for(let i=0;i<4&&pc();i++)pick();
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(0):[];
  ok('ヴィクティム・カウンター negative: no face-up Gemini monster (a ワイト only) → not offered',!resp.some(x=>x.card===vc),JSON.stringify(resp.map(x=>x.db.n))); drive(); }

/* ===== ワンダー・クローバー ===== */
{ fresh();const a=mon('ジェムナイト・エメラル',0),b=mon('ワイト',0),cl=mk(CLO,0),pl=mk('キラー・トマト',0),f1=mon('ワイト',1),f2=mon('ワイト',1),f3=mon('ワイト',1);
  gameState.players[0].mz=[a,b];gameState.players[0].hand=[cl,pl];gameState.players[1].mz=[f1,f2,f3];baselineA();
  PREFER=[uid(pl),uid(a)];duelActivateFromHand(0);drive();PREFER=[];
  ok('クローバー: the Level 4 Plant (キラー・トマト) sent to the Graveyard as the cost',z(pl)==='grave'&&z(cl)==='grave',JSON.stringify({pl:z(pl),cl:z(cl)}));
  audit('クローバー ①');
  phase('battle');atkTarget(0,a,f1);atkTarget(0,a,f2);
  ok('クローバー: the chosen monster attacks twice in the Battle Phase',z(f1)==='grave'&&z(f2)==='grave'&&z(f3)==='mz',JSON.stringify({f1:z(f1),f2:z(f2),f3:z(f3)}));
  atkTarget(0,a,f3);
  ok('クローバー: no third attack',z(f3)==='mz',z(f3));
  const l1=lp(1);atkTarget(0,b,f3);
  ok('クローバー: my other monster cannot declare an attack this turn',z(f3)==='mz'&&lp(1)===l1&&z(b)==='mz',JSON.stringify({f3:z(f3),b:z(b),loss:l1-lp(1)})); }
{ fresh();const a=mon('ワイト',0),cl=mk(CLO,0),w=mk('ワイト',0);gameState.players[0].mz=[a];gameState.players[0].hand=[cl,w];baselineA();
  duelActivateFromHand(0);drive();
  ok('クローバー negative: no Level 4 Plant in the hand → cannot be activated',z(cl)==='hand',z(cl)); }
{ fresh();const a=mon('ジェムナイト・エメラル',0),b=mon('ワイト',0),f1=mon('ワイト',1),f2=mon('ワイト',1);gameState.players[0].mz=[a,b];gameState.players[1].mz=[f1,f2];baselineA();
  phase('battle');atkTarget(0,a,f1);atkTarget(0,a,f2);
  ok('クローバー control: without it a monster attacks only once',z(f1)==='grave'&&z(f2)==='mz',JSON.stringify({f1:z(f1),f2:z(f2)})); }

console.log('U340 done');
`);
