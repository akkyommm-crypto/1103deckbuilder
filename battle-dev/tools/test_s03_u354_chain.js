/* S03-U354: 連鎖爆撃, 一陣の風, 積み上げる幸福, 奇跡の蘇生.
   Real DUEL chains (links 2 to 4 built by responses from both players), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3540001;
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



const REN='連鎖爆撃',ICH='一陣の風',TSU='積み上げる幸福',KIS='奇跡の蘇生';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function respond(p,c,prefer){
  const h=findCardByUid(c.uid); if(!h) return false;
  const offered=(gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(p):[]).some(x=>x.card===c);
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,h.zone,h.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  return offered;
}
function legal(c,zone,p){return strictSummonProcedureLegality?null:null;}

/* ===== legality without a chain ===== */
{ fresh();const a=mk(REN,0),b=mk(ICH,0),c=setCard(TSU,0),d=mk(KIS,0);gameState.players[0].hand=[a,b,d];gameState.players[0].sz=[c];
  gameState.players[0].grave=[mk('ワイト',0)];gameState.players[1].sz=[setCard('ブラック・ホール',1)];baselineA();
  const L=(card,zone)=>{const r=strictScriptLegality(CARD_SCRIPTS[cardName(card)],dbOf(card),zone,card,0);return r&&r.ok;};
  ok('連鎖爆撃: not activatable without a chain',L(a,'hand')===false,'');
  ok('一陣の風: not activatable without a chain',L(b,'hand')===false,'');
  ok('積み上げる幸福: not activatable without a chain',L(c,'sz')===false,'');
  ok('奇跡の蘇生: not activatable without a chain',L(d,'hand')===false,''); }

/* ===== chain 2: 連鎖爆撃 ===== */
{ fresh();const cy=mk('サイクロン',0),dm=setCard('ブラック・ホール',1),ren=setCard(REN,1);
  gameState.players[0].hand=[cy];gameState.players[1].sz=[dm,ren];baselineA();
  const l0=lp(0),l1=lp(1);
  PREFER=[dm.uid];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  ok('連鎖爆撃: chain 1 is サイクロン',gameState.chain.length===1,String(gameState.chain.length));
  const off=respond(1,ren);
  ok('連鎖爆撃: offered as chain link 2 (the opponent set it)',off===true&&gameState.chain.length>=2,JSON.stringify({off,len:gameState.chain.length}));
  drive();
  /* S03-U449 (ChatGPT audit): changed expectation 400 → 800. 「発動時に積まれているチェーンの数」 includes the card itself (yugioh-wiki FAQ, backup 2011-03-28: チェーンブロック3で発動 → 1200 = 3x400), so as chain link 2 it deals 2 x 400. */
  ok('連鎖爆撃: as chain link 2 (itself included) 2 x 400 = 800 damage to the chain starter',lp(0)===l0-800&&lp(1)===l1,JSON.stringify({d0:l0-lp(0),d1:l1-lp(1)}));
  ok('連鎖爆撃: サイクロン still resolved (target destroyed)',pz(dm)==='grave',pz(dm));
  audit('連鎖爆撃 1'); }

/* ===== chain 4: 一陣の風 (link 3) + 積み上げる幸福 (link 4) ===== */
{ fresh();const cy=mk('サイクロン',0),ich=mk(ICH,0),dm=setCard('ブラック・ホール',1),ren=setCard(REN,1),tsu=setCard(TSU,1),tgt=setCard('ブラック・ホール',0);
  gameState.players[0].hand=[cy,ich];gameState.players[0].sz=[tgt];gameState.players[1].sz=[dm,ren,tsu];baselineA();
  const h1=gameState.players[1].hand.length,dk1=gameState.players[1].deck.length;
  PREFER=[dm.uid];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  const o2=respond(1,ren);
  const o3=respond(0,ich,[tgt.uid]);
  const o4=respond(1,tsu);
  ok('チェーン: 4 links built (サイクロン, 連鎖爆撃, 一陣の風, 積み上げる幸福)',o2&&o4&&gameState.chain.length>=4,JSON.stringify({o2,o3,o4,len:gameState.chain.length}));
  drive();
  ok('積み上げる幸福: link 4 resolved first - the opponent drew 2',gameState.players[1].deck.length===dk1-2,JSON.stringify({d:dk1-gameState.players[1].deck.length}));
  ok('一陣の風: link 3 destroyed the chosen Spell/Trap (my set card)',pz(tgt)==='grave',pz(tgt));
  audit('一陣の風 1'); }

/* ===== 一陣の風 as link 3 and 積み上げる幸福 refused at chain 3 ===== */
{ fresh();const cy=mk('サイクロン',0),dm=setCard('ブラック・ホール',1),ren=setCard(REN,1),tsu=setCard(TSU,1);
  gameState.players[0].hand=[cy];gameState.players[1].sz=[dm,ren,tsu];baselineA();
  PREFER=[dm.uid];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  const o2=respond(1,ren);
  const offered=(gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(1):[]).some(x=>x.card===tsu);
  ok('積み上げる幸福: not offered as link 3 (needs chain 4)',o2===true&&offered===false,JSON.stringify({o2,offered,len:gameState.chain.length}));
  drive(); }

/* ===== 奇跡の蘇生 ===== */
{ fresh();const cy=mk('サイクロン',0),ich=mk(ICH,0),dm=setCard('ブラック・ホール',1),ren=setCard(REN,1),kis=setCard(KIS,1),tgt=setCard('ブラック・ホール',0),gy=mk('ブラック・マジシャン',0);
  gameState.players[0].hand=[cy,ich];gameState.players[0].sz=[tgt];gameState.players[0].grave=[gy];gameState.players[1].sz=[dm,ren,kis];baselineA();
  PREFER=[dm.uid];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  respond(1,ren);respond(0,ich,[tgt.uid]);
  const o4=respond(1,kis,[gy.uid]);
  ok('奇跡の蘇生: offered as chain link 4',o4===true&&gameState.chain.length>=4,JSON.stringify({o4,len:gameState.chain.length}));
  drive();
  ok('奇跡の蘇生: the monster from the OTHER player Graveyard is now on the activator field',pz(gy)==='mz'&&pp(gy)===1,JSON.stringify({z:pz(gy),p:pp(gy)}));
  audit('奇跡の蘇生 1'); }

console.log('U354 done');
`);
