/* S03-U326: ワーム・ソリッド / プリンス / ミリディス — DEF per Graveyard Worm, the end-of-Damage-Step destruction, the battle-kill search, the End Phase self-destruction, the Flip equip with Standby Phase damage. Real DUEL paths, Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3260001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
const W1='ワーム・ホープ',W2='ワーム・オペラ';

/* ===== ソリッド ===== */
{ fresh();const so=mon('ワーム・ソリッド',0),g1=mk(W1,0),g2=mk(W2,0),g3=mk('ワイト',0);gameState.players[0].mz=[so];gameState.players[0].grave=[g1,g2,g3];baselineA();
  ok('ソリッド: DEF 1600 + 100 × 2 Worm Reptiles in my Graveyard (ワイト not counted) = 1800',curDEF(C(so))===1800,String(curDEF(C(so)))); }
{ fresh();const so=mon('ワーム・ソリッド',0),fs=mk('サイクロン',1,'down'),f=mon('ワイト',1);fs.setTurn=3;gameState.players[0].mz=[so];gameState.players[1].mz=[f];gameState.players[1].sz=[fs];baselineA();
  toOppBattle();const l1=lp(1);atkTarget(1,f,so);
  ok('ソリッド: attacked by ワイト (300 < 1000): the opponent takes battle damage → at the end of the Damage Step the Set Spell/Trap is destroyed',z(f)==='grave'&&l1-lp(1)===700&&z(fs)==='grave',JSON.stringify({f:z(f),loss:l1-lp(1),fs:z(fs)}));
  audit('ソリッド'); }
{ fresh();const so=mon('ワーム・ソリッド',0,'def'),fs=mk('サイクロン',1,'down'),f=mon('ワイト',1);fs.setTurn=3;gameState.players[0].mz=[so];gameState.players[1].mz=[f];gameState.players[1].sz=[fs];baselineA();
  toOppBattle();const l1=lp(1);atkTarget(1,f,so);
  ok('ソリッド: also in Defense Position — the attacker (ATK 300) takes the DEF 1600 − 300 = 1300 difference, so the Set card is destroyed',z(fs)==='grave'&&l1-lp(1)===1300,JSON.stringify({loss:l1-lp(1),fs:z(fs)})); }
{ fresh();const so=mon('ワーム・ソリッド',0),fs=mk('サイクロン',1,'down'),f=mon('青眼の白龍',1);fs.setTurn=3;gameState.players[0].mz=[so];gameState.players[1].mz=[f];gameState.players[1].sz=[fs];baselineA();
  toOppBattle();atkTarget(1,f,so);
  ok('ソリッド negative: the opponent took no battle damage (ソリッド was destroyed, I took it) → the Set card stays',z(so)==='grave'&&z(fs)==='sz',JSON.stringify({so:z(so),fs:z(fs)})); }
{ fresh();const so=mon('ワーム・ソリッド',0),f=mon('ワイト',1);gameState.players[0].mz=[so];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l1=lp(1);atkTarget(1,f,so);
  ok('ソリッド: with no Spell/Trap on the opponent field nothing is destroyed (and nothing breaks)',z(f)==='grave'&&l1-lp(1)===700,JSON.stringify({f:z(f),loss:l1-lp(1)})); }

/* ===== プリンス ===== */
{ fresh();const pr=mon('ワーム・プリンス',0),w2=mon(W1,0),dk=mk(W2,0),f=mon('ワイト',1);gameState.players[0].mz=[pr,w2];gameState.players[0].deck=[dk,mk('ワイト',0)];gameState.players[1].mz=[f];baselineA();phase('battle');
  PREFER=[uid(dk)];atkTarget(0,pr,f);PREFER=[];
  ok('プリンス: destroyed ワイト by battle → a Worm Reptile (オペラ) of my Deck added to the hand',z(f)==='grave'&&z(dk)==='hand',JSON.stringify({f:z(f),dk:z(dk)}));
  audit('プリンス ①');
  phase('end');
  ok('プリンス: End Phase — another Worm Reptile (ホープ) is on my field → it stays',z(pr)==='mz',z(pr)); }
{ fresh();const pr=mon('ワーム・プリンス',0);gameState.players[0].mz=[pr];baselineA();
  phase('end');
  ok('プリンス: End Phase — no other Worm Reptile → destroyed',z(pr)==='grave',z(pr));
  audit('プリンス ②'); }
{ fresh();const pr=mon('ワーム・プリンス',0);gameState.players[0].mz=[pr];gameState.activePlayer=1;baselineA();
  phase('end');
  ok('プリンス: also at the opponent End Phase (the text is every End Phase)',z(pr)==='grave',z(pr)); }
{ fresh();const pr=mon('ワーム・プリンス',0),f=mon('ワイト',1);gameState.players[0].mz=[pr];gameState.players[1].mz=[f];gameState.players[0].deck=[mk(W1,0)];baselineA();phase('battle');
  atkTarget(0,pr,'direct');
  ok('プリンス negative: a direct attack destroyed nothing → no search',gameState.players[0].hand.length===0,String(gameState.players[0].hand.length)); }

/* ===== ミリディス ===== */
{ fresh();const mi=mk('ワーム・ミリディス',0,'down','def'),f=mon('ワイト',1);mi.setTurn=3;gameState.players[0].mz=[mi];gameState.players[1].mz=[f];baselineA();
  toOppBattle();atkTarget(1,f,mi);
  const e=C(mi);
  ok('ミリディス: flipped by the attack → equipped to the opponent monster (ワイト) as an Equip Card (in my Spell & Trap Zone)',z(mi)==='sz'&&e&&e.v46MonsterEquip===true&&e.equipTo&&e.equipTo.uid===f.uid&&z(f)==='mz',JSON.stringify({mi:z(mi),f:z(f),eq:e&&e.equipTo}));
  audit('ミリディス ①');
  const l1=lp(1);endTurn();
  ok('ミリディス: my Standby Phase → 400 damage to the equipped monster controller (the opponent)',l1-lp(1)===400,JSON.stringify({loss:l1-lp(1)}));
  const l2=lp(1);endTurn();
  ok('ミリディス: the opponent Standby Phase → 400 more',l2-lp(1)===400,JSON.stringify({loss:l2-lp(1)})); }
{ fresh();const mi=mk('ワーム・ミリディス',0,'down','def'),f=mon('青眼の白龍',1);mi.setTurn=3;gameState.players[0].mz=[mi];gameState.players[1].mz=[f];baselineA();
  toOppBattle();atkTarget(1,f,mi);
  ok('ミリディス: also against a stronger attacker (青眼, 3000): the Flip effect equips it before the damage calculation, so the battle ends without damage to me',z(mi)==='sz'&&lp(0)===8000&&z(f)==='mz',JSON.stringify({mi:z(mi),f:z(f),lp0:lp(0)})); }

console.log('U326 done');
`);
