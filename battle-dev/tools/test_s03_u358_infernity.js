/* S03-U358: ZERO－MAX, インフェルニティ・ミラージュ, インフェルニティ・リフレクター (and the engine rule 「このカードは墓地からの特殊召喚はできない」).
   Real DUEL paths (a hand-empty Spell, an ignition from the field, a trap that answers a battle destruction), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3580001;
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



const ZER='ZERO－MAX',MIR='インフェルニティ・ミラージュ',REF='インフェルニティ・リフレクター';
const DES='インフェルニティ・デストロイヤー',DWA='インフェルニティ・ドワーフ',BEA='インフェルニティ・ビースト',ARC='インフェルニティ・アーチャー';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== ZERO－MAX ===== */
{ fresh();const z=mk(ZER,0),des=mk(DES,0),low=mon('ワイト',0),fl=mon('ワイト',1),fh=mon('青眼の白龍',1);
  gameState.players[0].hand=[z];gameState.players[0].grave=[des];gameState.players[0].mz=[low];gameState.players[1].mz=[fl,fh];baselineA();
  cast(0,ZER,[des.uid]);
  ok('ZERO－MAX: デストロイヤー (ATK 2300) Special Summoned from the Graveyard',pz(des)==='mz'&&pp(des)===0,JSON.stringify({d:pz(des)}));
  ok('ZERO－MAX: face-up monsters with lower ATK destroyed on both fields (ワイト x2), 青眼 (3000) survives',pz(low)==='grave'&&pz(fl)==='grave'&&pz(fh)==='mz',JSON.stringify({low:pz(low),fl:pz(fl),fh:pz(fh)}));
  phase('battle');
  ok('ZERO－MAX: the Battle Phase cannot be entered this turn',gameState.phase!=='battle',gameState.phase);
  audit('ZERO－MAX 1'); }
{ fresh();const z=mk(ZER,0),des=mk(DES,0),ex=mk('ワイト',0);
  gameState.players[0].hand=[z,ex];gameState.players[0].grave=[des];baselineA();
  const r=strictScriptLegality(CARD_SCRIPTS[ZER],dbOf(z),'hand',z,0);
  ok('ZERO－MAX negative: another card in hand -> not activatable',r&&r.ok===false,JSON.stringify(r)); }
{ fresh();const z=mk(ZER,0);gameState.players[0].hand=[z];gameState.players[0].grave=[mk('ワイト',0)];baselineA();
  const r=strictScriptLegality(CARD_SCRIPTS[ZER],dbOf(z),'hand',z,0);
  ok('ZERO－MAX negative: no Infernity monster in the Graveyard',r&&r.ok===false,JSON.stringify(r)); }

/* ===== インフェルニティ・ミラージュ ===== */
{ fresh();const m=mon(MIR,0),a=mk(DWA,0),b=mk(BEA,0);gameState.players[0].mz=[m];gameState.players[0].grave=[a,b];baselineA();
  ok('ミラージュ: empty hand and 2 Infernity in the Graveyard -> can activate',canZ(m),'');
  actC(m,[a.uid,b.uid]);
  ok('ミラージュ: released; both Infernity monsters Special Summoned',pz(m)==='grave'&&pz(a)==='mz'&&pz(b)==='mz',JSON.stringify({m:pz(m),a:pz(a),b:pz(b)}));
  audit('ミラージュ 1'); }
{ fresh();const m=mon(MIR,0),a=mk(DWA,0),b=mk(BEA,0),h=mk('ワイト',0);gameState.players[0].mz=[m];gameState.players[0].grave=[a,b];gameState.players[0].hand=[h];baselineA();
  ok('ミラージュ negative: a card in hand',!canZ(m),''); }
{ fresh();const m=mon(MIR,0),a=mk(DWA,0);gameState.players[0].mz=[m];gameState.players[0].grave=[a];baselineA();
  ok('ミラージュ negative: only one Infernity in the Graveyard',!canZ(m),''); }
{ fresh();const g=mk(MIR,0),rv=mk('死者蘇生',0);gameState.players[0].grave=[g];gameState.players[0].hand=[rv];baselineA();
  cast(0,'死者蘇生',[g.uid]);
  ok('ミラージュ: cannot be Special Summoned from the Graveyard (死者蘇生 does not revive it)',pz(g)==='grave',pz(g)); }
{ fresh();const g=mk(DWA,0),rv=mk('死者蘇生',0);gameState.players[0].grave=[g];gameState.players[0].hand=[rv];baselineA();
  cast(0,'死者蘇生',[g.uid]);
  ok('ミラージュ control: another monster is revived normally',pz(g)==='mz',pz(g)); }

/* ===== インフェルニティ・リフレクター ===== */
{ fresh();const t=setCard(REF,0),d=mon(DES,0),h1=mk('ワイト',0),h2=mk('ワイト',0),f=mon('青眼の白龍',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[d];gameState.players[0].hand=[h1,h2];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l1=lp(1);foeAttack(f,d);
  ok('リフレクター: デストロイヤー destroyed by battle -> Special Summoned back, the whole hand discarded, 1000 damage',pz(d)==='mz'&&pz(h1)==='grave'&&pz(h2)==='grave'&&lp(1)===l1-1000,JSON.stringify({d:pz(d),h1:pz(h1),h2:pz(h2),loss:l1-lp(1)}));
  audit('リフレクター 1'); }
{ fresh();const t=setCard(REF,0),d=mon('ワイト',0),f=mon('青眼の白龍',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[d];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,d);
  ok('リフレクター negative: a non-Infernity monster destroyed -> the trap does not react',pz(d)==='grave'&&pz(t)==='sz',JSON.stringify({d:pz(d),t:pz(t)})); }

console.log('U358 done');
`);
