/* S03-U367: 忍法 空蝉の術, コア・ブラスト, スターゲート, クローザー・フォレスト.
   Real DUEL paths (battle protection of a chosen monster, a Standby equalising destruction, a counter trap that summons from the hand, a Field Spell with ATK and a Field Spell lock), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3670001;
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



const UTS='忍法 空蝉の術',BLA='コア・ブラスト',GAT='スターゲート',FOR='クローザー・フォレスト';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function upCard(n,p){const c=mk(n,p,'up');c.setTurn=4;return c;}
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function legalHand(name,c){const i=gameState.players[0].hand.indexOf(c);const r=strictScriptLegalityV2(name,0,'hand',i,{});return !!(r&&r.ok);}

/* ===== 忍法 空蝉の術 ===== */
{ fresh();const t=setCard(UTS,0),n=mon('女忍者ヤエ',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[t];gameState.players[0].mz=[n];gameState.players[1].mz=[f];baselineA();
  PREFER=[n.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  toOppBattle();const l0=lp(0);foeAttack(f,n);
  ok('空蝉の術: the chosen ninja (女忍者ヤエ 1100) attacked by 青眼 (3000) is not destroyed, the damage calculation still applies (1900 damage)',pz(n)==='mz'&&lp(0)===l0-1900,JSON.stringify({n:pz(n),loss:l0-lp(0)}));
  audit('空蝉 1'); }
{ fresh();const n=mon('女忍者ヤエ',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[n];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,n);
  ok('空蝉の術 control: without the trap the ninja is destroyed',pz(n)==='grave',pz(n)); }

/* ===== コア・ブラスト ===== */
{ fresh();const t=upCard(BLA,0),c=mon('コアキメイル・ロック',0),f1=mon('青眼の白龍',1),f2=mon('ワイト',1),f3=mon('ワイト',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[c];gameState.players[1].mz=[f1,f2,f3];baselineA();
  endTurn();ok('コア・ブラスト: the opponent Standby Phase does nothing',[f1,f2,f3].every(x=>pz(x)==='mz'),JSON.stringify([f1,f2,f3].map(pz)));
  PREFER=[f2.uid,f3.uid];endTurn();PREFER=[];
  ok('コア・ブラスト: my Standby Phase (3 vs 1 monsters) -> 2 opposing monsters destroyed to equalise (ワイト x2), 青眼 stays',pz(f1)==='mz'&&pz(f2)==='grave'&&pz(f3)==='grave',JSON.stringify([f1,f2,f3].map(pz)));
  audit('コア・ブラスト 1'); }
{ fresh();const t=upCard(BLA,0),c=mon('コアキメイル・ロック',0),f1=mon('青眼の白龍',1);gameState.players[0].sz=[t];gameState.players[0].mz=[c];gameState.players[1].mz=[f1];baselineA();
  endTurn();endTurn();
  ok('コア・ブラスト negative: the monster counts are equal -> nothing destroyed',pz(f1)==='mz',pz(f1)); }
{ fresh();const t=upCard(BLA,0),w=mon('ワイト',0),f1=mon('青眼の白龍',1),f2=mon('ワイト',1);gameState.players[0].sz=[t];gameState.players[0].mz=[w];gameState.players[1].mz=[f1,f2];baselineA();
  endTurn();endTurn();
  ok('コア・ブラスト negative: no 「コアキメイル」 monster on my field -> nothing destroyed',pz(f1)==='mz'&&pz(f2)==='mz',JSON.stringify([f1,f2].map(pz))); }

/* ===== スターゲート ===== */
{ fresh();const t=upCard(GAT,0),m=mon('サファイアドラゴン',0),f=mon('ワイト',1),h=mk('ワイト',0);gameState.players[0].sz=[t];gameState.players[0].mz=[m];gameState.players[0].hand=[h];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,m,f);
  ok('スターゲート: a battle with an opposing monster -> 1 ゲートカウンター',API.countCounter({p:0,zone:'sz',index:idx(t)},'ゲート')===1,String(API.countCounter({p:0,zone:'sz',index:idx(t)},'ゲート')));
  phase('main2');
  PREFER=['summon',h.uid];duelActivateFromZone(0,'sz',idx(t));drive();PREFER=[];
  ok('スターゲート: sent to the Graveyard; a hand monster of Level 1 or lower (ワイト) Special Summoned',pz(t)==='grave'&&pz(h)==='mz',JSON.stringify({t:pz(t),h:pz(h)}));
  audit('スターゲート 1'); }
{ fresh();const t=upCard(GAT,0),h=mk('ワイト',0);gameState.players[0].sz=[t];gameState.players[0].hand=[h];baselineA();
  PREFER=['summon',h.uid];duelActivateFromZone(0,'sz',idx(t));drive();PREFER=[];
  ok('スターゲート negative: no counters -> nothing happens (the trap stays, ワイト stays in hand)',pz(t)==='sz'&&pz(h)==='hand',JSON.stringify({t:pz(t),h:pz(h)})); }

/* ===== クローザー・フォレスト ===== */
{ fresh();const fo=mk(FOR,0),b=mon('イビル・ラット',0),g1=mk('ワイト',0),g2=mk('ワイト',0),g3=mk('サファイアドラゴン',0);gameState.players[0].hand=[fo];gameState.players[0].mz=[b];gameState.players[0].grave=[g1,g2,g3];baselineA();
  duelActivateFromHand(0);drive();
  ok('フォレスト: activated into the Field Zone',pz(fo)==='field',pz(fo));
  ok('フォレスト: 3 monsters in my Graveyard -> my Beast ATK 750 + 300 = 1050',curATK(C(b))===1050,String(curATK(C(b))));
  audit('フォレスト 1'); }
{ fresh();const fo=upCard(FOR,0),az=mk('アマゾネスの里',0);gameState.players[0].field=fo;gameState.players[0].hand=[az];baselineA();
  ok('フォレスト: while it is face-up no other Field Spell can be activated',!legalHand('アマゾネスの里',az),''); }
{ fresh();const az=mk('アマゾネスの里',0);gameState.players[0].hand=[az];baselineA();
  ok('フォレスト control: without it the Field Spell is activatable',legalHand('アマゾネスの里',az),''); }
{ fresh();const fo=upCard(FOR,0),cy=mk('サイクロン',0),az=mk('アマゾネスの里',0);gameState.players[0].field=fo;gameState.players[0].hand=[cy,az];baselineA();
  cast(0,'サイクロン',[fo.uid]);
  ok('フォレスト: destroyed -> still no Field Spell can be activated this turn',pz(fo)==='grave'&&!legalHand('アマゾネスの里',az),JSON.stringify({fo:pz(fo)}));
  endTurn();endTurn();
  ok('フォレスト: ... but in a later turn it can',legalHand('アマゾネスの里',az),''); }

console.log('U367 done');
`);
