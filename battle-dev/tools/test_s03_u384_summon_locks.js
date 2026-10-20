/* S03-U384: summon locks by kind (engine/1ZZS): ジェノサイドキングデーモン, レプティレス・サーヴァント, 大熱波, 完全防音壁 (NOT_STARTED cards).
   Real DUEL paths, Replay-audited. */
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
let PREFER=[];const SEEN=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3840001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function equipped(host,eq){const h=C(host),e=C(eq);return !!h&&!!e&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0;}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function cc(c){const x=C(c);return x&&x.counters?Number(x.counters['魔力'])||0:0;}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

function offeredTo(p,c){return !!(gameState.chainWindow&&gameState.chain.length&&getChainResponsesV2(p).some(x=>x.card===c));}
function respond(p,c,prefer){const hh=findCardByUid(c.uid); if(!hh) return false;
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,hh.zone,hh.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];return true;}
function foeCast(name,prefer){const i=gameState.players[1].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let i2=0;i2<10&&pc();i2++)pick();PREFER=[];}
function actZ(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}

function sz(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function actSz(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function legalSz(c){return strictScriptLegalityV2(cardName(c),0,'sz',idx(c)).ok;}
function gv(c){return curATK(C(c));}










const GEN='ジェノサイドキングデーモン',SRV='レプティレス・サーヴァント',HOT='大熱波',SND='完全防音壁',PWN='ヘルポーンデーモン';
function foeTurn(){gameState.activePlayer=1;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function canNS(i){return getLegalHandActions(0,i).some(a=>a.id==='normalSummon');}
function ssReason(p,name){return v46SpecialSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}));}
function nsReason(p,name,kind){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),kind);}

/* ===== ジェノサイドキングデーモン ===== */
{ fresh();const g=mk(GEN,0);gameState.players[0].hand=[g];gameState.players[0].mz=[mon('ワイト',0)];baselineA();
  ok('ジェノサイド: no 「デーモン」 on my field -> cannot be Normal Summoned',canNS(0)===false&&!!nsReason(0,GEN,'normal')&&!!nsReason(0,GEN,'flip'),JSON.stringify([canNS(0),nsReason(0,GEN,'normal')]));
  ok('ジェノサイド: it can still be Special Summoned (the condition is for 召喚・反転召喚 only)',nsReason(0,GEN,'special')==='',nsReason(0,GEN,'special')); }
{ fresh();const g=mk(GEN,0),d=mon(PWN,0);gameState.players[0].hand=[g];gameState.players[0].mz=[d];baselineA();
  ok('ジェノサイド: with a face-up 「デーモン」 on my field it can be Normal Summoned',canNS(0)===true,String(canNS(0)));
  doNormalSummon(0,'atk');drive();
  ok('ジェノサイド: Normal Summoned',z(g)==='mz',z(g)); }
{ fresh();const g=mon(GEN,0),f=mon('ライオウ',1);gameState.players[0].mz=[g];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,g,f);
  ok('ジェノサイド: the Effect Monster it destroys in battle is negated (battleNegatorUidS03)',z(f)==='grave'&&C(f).graveInfo&&C(f).graveInfo.battleNegatorUidS03===g.uid,JSON.stringify([z(f),C(f)&&C(f).graveInfo&&C(f).graveInfo.battleNegatorUidS03,g.uid]));
  audit('ジェノサイド 1'); }

/* ===== レプティレス・サーヴァント ===== */
{ fresh();const s=mon(SRV,0),h=mk('ワイト',0),h2=mk('ワイト',1);gameState.players[0].hand=[h];gameState.players[0].mz=[s];gameState.players[1].hand=[h2];baselineA();
  ok('サーヴァント: nobody can Normal Summon while it is face-up (both players)',canNS(0)===false&&!!nsReason(0,'ワイト','normal')&&!!nsReason(1,'ワイト','normal'),JSON.stringify([canNS(0),nsReason(0,'ワイト','normal')]));
  ok('サーヴァント: Flip and Special Summons are not 「召喚」 and stay legal',nsReason(0,'ワイト','flip')===''&&ssReason(0,'ワイト')==='',JSON.stringify([nsReason(0,'ワイト','flip'),ssReason(0,'ワイト')])); }
{ fresh();const s=mon(SRV,0),w=mk('ワイト',0);gameState.players[0].mz=[s];gameState.players[0].hand=[w];baselineA();
  act({type:'MOVE',player:0,from:'hand',fromIndex:0,to:'mz',face:'up'});drive();
  ok('サーヴァント: another monster appears face-up -> it is destroyed by its own text',z(s)==='grave',z(s)); }
{ fresh();foeTurn();const s=mon(SRV,0),mn=mk('月の書',1,'up');gameState.players[0].mz=[s];gameState.players[1].hand=[mn];baselineA();
  PREFER=[uid(s)];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  ok('サーヴァント: targeted by a Spell (月の書) -> destroyed',z(s)!=='mz',z(s)); }
ok('サーヴァント: the targeted self-destroy is declared for Spells / Traps only (a monster effect may target it)',TARGETED_SELF_DESTROY_S03['レプティレス・サーヴァント'].kinds.join()==='s,t','');

/* ===== 大熱波 ===== */
{ fresh();const f=mk(HOT,0,'up'),e=mk('ライオウ',0),n=mk('13人目の埋葬者',0),sy=mk('ジャンク・ウォリアー',0);gameState.players[0].hand=[f,e,n];baselineA();
  ok('大熱波: activatable at the start of my Main Phase 1',getLegalHandActions(0,0).some(a=>a.id==='activate'),'');
  cast(0,HOT);
  ok('大熱波: an Effect Monster (ライオウ) cannot be Normal Summoned for both players, nor Special Summoned',!!nsReason(0,'ライオウ','normal')&&!!nsReason(1,'ライオウ','normal')&&!!ssReason(0,'ライオウ')&&!!ssReason(1,'ライオウ'),JSON.stringify([nsReason(0,'ライオウ','normal'),ssReason(1,'ライオウ')]));
  ok('大熱波: a Normal Monster can still be summoned (13人目の埋葬者)',nsReason(0,'13人目の埋葬者','normal')===''&&ssReason(0,'13人目の埋葬者')==='',JSON.stringify([nsReason(0,'13人目の埋葬者','normal'),ssReason(0,'13人目の埋葬者')]));
  ok('大熱波: a Flip Summon is not covered',nsReason(0,'ライオウ','flip')==='',nsReason(0,'ライオウ','flip'));
  endTurn();
  ok('大熱波: still in force during the opponent turn',!!nsReason(1,'ライオウ','normal'),nsReason(1,'ライオウ','normal'));
  endTurn();
  ok('大熱波: over at my next Draw Phase',nsReason(0,'ライオウ','normal')===''&&ssReason(0,'ライオウ')==='',JSON.stringify([nsReason(0,'ライオウ','normal'),ssReason(0,'ライオウ')]));
  audit('大熱波 1'); }
{ fresh();const f=mk(HOT,0,'up'),n=mk('13人目の埋葬者',0);gameState.players[0].hand=[f,n];baselineA();
  doNormalSummon(1,'atk');drive();
  ok('大熱波 negative: after a Normal Summon it is no longer the start of Main Phase 1 -> not activatable',getLegalHandActions(0,0).some(a=>a.id==='activate')===false,''); }

/* ===== 完全防音壁 ===== */
{ fresh();const f=mk(SND,0,'up');gameState.players[0].hand=[f];baselineA();
  cast(0,SND);
  ok('完全防音壁: a Synchro Monster cannot be Special Summoned by either player',!!ssReason(0,'ジャンク・ウォリアー')&&!!ssReason(1,'ジャンク・ウォリアー'),JSON.stringify([ssReason(0,'ジャンク・ウォリアー')]));
  ok('完全防音壁: a non-Synchro Special Summon is unaffected',ssReason(0,'ライオウ')==='',ssReason(0,'ライオウ'));
  endTurn();
  ok('完全防音壁: lasts through the opponent turn',!!ssReason(1,'ジャンク・ウォリアー'),'');
  endTurn();
  ok('完全防音壁: over afterwards',ssReason(0,'ジャンク・ウォリアー')==='','');
  audit('完全防音壁 1'); }
{ fresh();const f=mk(SND,0,'up'),sy=mon('ジャンク・ウォリアー',0);gameState.players[0].hand=[f];gameState.players[0].mz=[sy];baselineA();
  ok('完全防音壁 negative: with my face-up Synchro Monster -> not activatable',getLegalHandActions(0,0).some(a=>a.id==='activate')===false,''); }
`);
