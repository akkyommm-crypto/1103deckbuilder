/* S03-U318: 「ガスタ」 — ダイガスタ・ファルコス / スフィアード / ガルドス / イグルス and ガスタの神官 ムスト. Real DUEL path (Synchro Summons through doExSummon), Replay-audited. */
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
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3180001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function doSynchro(syn,mats){const P=gameState.players[0];doExSummon(0,0,mats.map(m=>P.mz.indexOf(m)),'synchro','atk');drive();}
function canEffect(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function doAct(c){duelActivateFromZone(0,'mz',idx(c));drive();}
function atkOf(c){return curATK(C(c));}

/* ===== ダイガスタ・ファルコス: Synchro Summon success → every face-up 「ガスタ」 monster on the field +600 (permanent) ===== */
{ fresh();const t=mon('ガスタ・ファルコ',0),m=mon('ガスタの巫女 ウィンダ',0),g2=mon('ガスタの静寂 カーム',0),fg=mon('ガスタの静寂 カーム',1),fw=mon('ワイト',1),fd=mon('ガスタの静寂 カーム',1);fd.face='down';fd.pos='def';fd.setTurn=3;
  const fa=mk('ダイガスタ・ファルコス',0);gameState.players[0].ex=[fa];gameState.players[0].mz=[t,m,g2];gameState.players[1].mz=[fg,fw,fd];baselineA();
  const b={g2:atkOf(g2),fg:atkOf(fg),fw:atkOf(fw)};
  ok('ファルコス: precondition — ファルコ(Tuner Lv2)+ウィンダ(Lv2) make Lv4',exCombos(0,dbOf(fa)).combos.length>=1,JSON.stringify(exCombos(0,dbOf(fa)).combos));
  doSynchro(fa,[t,m]);
  ok('ファルコス: Synchro Summoned',z(fa)==='mz',z(fa));
  ok('ファルコス: my other face-up 「ガスタ」 +600, the opponent\'s face-up 「ガスタ」 +600, a non-「ガスタ」 unchanged',atkOf(g2)===b.g2+600&&atkOf(fg)===b.fg+600&&atkOf(fw)===b.fw,JSON.stringify({g2:atkOf(g2),fg:atkOf(fg),fw:atkOf(fw),b}));
  ok('ファルコス: a face-down 「ガスタ」 is not raised (face-up only)',(C(fd).atkMod||0)===0&&atkOf(fd)===dbOf(fd).atk,JSON.stringify({m:C(fd).atkMod,a:atkOf(fd)}));
  audit('ファルコス');
  const g3=mon('ガスタの静寂 カーム',0);gameState.players[0].mz.push(g3);
  ok('ファルコス: a 「ガスタ」 that arrives later does not get the bonus (it was applied once)',atkOf(g3)===dbOf(g3).atk,String(atkOf(g3))); }
/* negative: a Normal Summon / Special Summon that is not a Synchro Summon does nothing (a copy put on the field directly is not Synchro Summoned) */
{ fresh();const fa=mon('ダイガスタ・ファルコス',0),g2=mon('ガスタの静寂 カーム',0);gameState.players[0].mz=[fa,g2];baselineA();
  ok('ファルコス: on the field without a Synchro Summon the ATK is the printed one',atkOf(g2)===dbOf(g2).atk,String(atkOf(g2))); }

/* ===== ダイガスタ・スフィアード: Synchro success → add a 「ガスタ」 card from my GY; redirect; no battle destruction ===== */
{ fresh();const t=mon('ガスタ・ファルコ',0),m=mon('ガスタの静寂 カーム',0),gy1=mk('ガスタ・コドル',0),gy2=mk('ガスタの賢者 ウィンダール',0),gy3=mk('ワイト',0);
  const sp=mk('ダイガスタ・スフィアード',0);gameState.players[0].ex=[sp];gameState.players[0].mz=[t,m];gameState.players[0].grave=[gy1,gy2,gy3];baselineA();
  ok('スフィアード: precondition — ファルコ(Lv2)+カーム(Lv4) make Lv6',exCombos(0,dbOf(sp)).combos.length>=1,JSON.stringify(exCombos(0,dbOf(sp)).combos));
  PREFER=[uid(gy2)];doSynchro(sp,[t,m]);PREFER=[];
  const g=gameState.players[0];
  ok('スフィアード: Synchro Summoned and the chosen 「ガスタ」 card (ウィンダール) returned to my hand; ワイト stays in the Graveyard',z(sp)==='mz'&&z(gy2)==='hand'&&z(gy3)==='grave',JSON.stringify({sp:z(sp),gy2:z(gy2),gy3:z(gy3),events:TOASTS.slice(-3)}));
  audit('スフィアード ①'); }
/* redirect: the opponent's stronger monster attacks my 「ガスタ」 → the damage is dealt to the opponent instead */
{ fresh();const sp=mon('ダイガスタ・スフィアード',0),gu=mon('ガスタの静寂 カーム',0),foe=mon('ダイガスタ・イグルス',1);
  gameState.players[0].mz=[sp,gu];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();
  const l0=lp(0),l1=lp(1);atkTarget(1,foe,gu);
  ok('スフィアード: my 「ガスタ」 カーム (1700) destroyed by イグルス (2600); the 900 damage to me is dealt to the opponent instead',z(gu)==='grave'&&lp(0)===l0&&lp(1)===l1-900,JSON.stringify({gu:z(gu),l0:lp(0),l1:lp(1),was:[l0,l1]}));
  audit('スフィアード redirect'); }
/* negative: a battle that does not involve a 「ガスタ」 of mine is not redirected */
{ fresh();const sp=mon('ダイガスタ・スフィアード',0),w=mon('ワイト',0),foe=mon('ダイガスタ・イグルス',1);
  w.def=0;gameState.players[0].mz=[sp,w];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();
  const l0=lp(0),l1=lp(1);atkTarget(1,foe,w);
  ok('スフィアード negative: ワイト (not 「ガスタ」) destroyed → the damage hits me, not redirected',z(w)==='grave'&&lp(0)<l0&&lp(1)===l1,JSON.stringify({w:z(w),l0:lp(0),l1:lp(1),was:[l0,l1]})); }
/* the monster itself: not destroyed by battle (and the damage is the opponent's) */
{ fresh();const sp=mon('ダイガスタ・スフィアード',0),foe=mon('ダイガスタ・イグルス',1);
  gameState.players[0].mz=[sp];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();
  const l0=lp(0),l1=lp(1);atkTarget(1,foe,sp);
  ok('スフィアード: attacked by イグルス (2600 > 2000) it is not destroyed by battle, and the 600 damage to me goes to the opponent',z(sp)==='mz'&&lp(0)===l0&&lp(1)===l1-600,JSON.stringify({sp:z(sp),l0:lp(0),l1:lp(1),was:[l0,l1]}));
  audit('スフィアード protected'); }
/* the opponent's own Spheared: its controller's Gusto, not mine — my battle damage is not redirected by it */
{ fresh();const sp=mon('ダイガスタ・スフィアード',1),gu=mon('ガスタの静寂 カーム',0),foe=mon('ダイガスタ・イグルス',1);
  gameState.players[0].mz=[gu];gameState.players[1].mz=[sp,foe];baselineA();
  phase('battle');const l0=lp(0);atkTarget(0,gu,foe);
  ok('スフィアード: the opponent\'s copy does not protect me (the damage hit me)',lp(0)<l0,JSON.stringify({l0:lp(0),was:l0})); }

/* ===== ダイガスタ・ガルドス: return two 「ガスタ」 monsters from my GY to the Deck, destroy a face-up opponent monster ===== */
{ fresh();const ga=mon('ダイガスタ・ガルドス',0),g1=mk('ガスタの静寂 カーム',0),g2=mk('ガスタ・イグル',0),g3=mk('ワイト',0),foe=mon('ワイト',1),fd=mon('ワイト',1);fd.face='down';fd.pos='def';fd.setTurn=3;
  gameState.players[0].mz=[ga];gameState.players[0].grave=[g1,g2,g3];gameState.players[1].mz=[foe,fd];baselineA();
  ok('ガルドス: with two 「ガスタ」 monsters in the Graveyard the effect is available',canEffect(ga)===true,'');
  const d0=gameState.players[0].deck.length;PREFER=[uid(foe)];doAct(ga);PREFER=[];
  ok('ガルドス: both 「ガスタ」 returned to the Deck (ワイト stays), the face-up opponent monster destroyed, the face-down one not a legal target',z(g1)==='deck'&&z(g2)==='deck'&&z(g3)==='grave'&&z(foe)==='grave'&&z(fd)==='mz'&&gameState.players[0].deck.length===d0+2,JSON.stringify({g1:z(g1),g2:z(g2),g3:z(g3),foe:z(foe),fd:z(fd),deck:gameState.players[0].deck.length,d0}));
  ok('ガルドス: once per turn',canEffect(ga)===false,'');
  audit('ガルドス'); }
{ fresh();const ga=mon('ダイガスタ・ガルドス',0),g1=mk('ガスタの静寂 カーム',0),g3=mk('ワイト',0),foe=mon('ワイト',1);
  gameState.players[0].mz=[ga];gameState.players[0].grave=[g1,g3];gameState.players[1].mz=[foe];baselineA();
  ok('ガルドス negative: only one 「ガスタ」 monster in the Graveyard → not available',canEffect(ga)===false,''); }
{ fresh();const ga=mon('ダイガスタ・ガルドス',0),g1=mk('ガスタの静寂 カーム',0),g2=mk('ガスタ・イグル',0);
  gameState.players[0].mz=[ga];gameState.players[0].grave=[g1,g2];baselineA();
  ok('ガルドス negative: no face-up opponent monster → not available',canEffect(ga)===false,''); }

/* ===== ダイガスタ・イグルス: my End Phase, banish a WIND monster from my GY → destroy a Set card of the opponent ===== */
{ fresh();const ig=mon('ダイガスタ・イグルス',0),wind=mk('ガスタの静寂 カーム',0),dark=mk('ワイト',0),fd=mon('ワイト',1),fs=mk('サイクロン',1,'down');fd.face='down';fd.pos='def';fd.setTurn=3;fs.setTurn=3;
  gameState.players[0].mz=[ig];gameState.players[0].grave=[wind,dark];gameState.players[1].mz=[fd];gameState.players[1].sz=[fs];baselineA();
  PREFER=[uid(wind),uid(fs)];phase('end');PREFER=[];
  ok('イグルス: End Phase — the WIND monster banished from my Graveyard (the DARK ワイト stays), the Set Spell/Trap destroyed',z(wind)==='banish'&&z(dark)==='grave'&&z(fs)==='grave'&&z(fd)==='mz',JSON.stringify({wind:z(wind),dark:z(dark),fs:z(fs),fd:z(fd),t:TOASTS.slice(-3)}));
  audit('イグルス'); }
{ fresh();const ig=mon('ダイガスタ・イグルス',0),wind=mk('ガスタの静寂 カーム',0),fd=mon('ワイト',1);fd.face='down';fd.pos='def';fd.setTurn=3;
  gameState.players[0].mz=[ig];gameState.players[0].grave=[wind];gameState.players[1].mz=[fd];baselineA();
  PREFER=[uid(wind),uid(fd)];phase('end');PREFER=[];
  ok('イグルス: a Set monster is a legal target too',z(wind)==='banish'&&z(fd)==='grave',JSON.stringify({wind:z(wind),fd:z(fd)})); }
{ fresh();const ig=mon('ダイガスタ・イグルス',0),dark=mk('ワイト',0),fd=mon('ワイト',1);fd.face='down';fd.pos='def';fd.setTurn=3;
  gameState.players[0].mz=[ig];gameState.players[0].grave=[dark];gameState.players[1].mz=[fd];baselineA();
  phase('end');
  ok('イグルス negative: no WIND monster in my Graveyard → nothing happens',z(fd)==='mz'&&z(dark)==='grave',JSON.stringify({fd:z(fd),dark:z(dark)})); }
{ fresh();const ig=mon('ダイガスタ・イグルス',0),wind=mk('ガスタの静寂 カーム',0),fu=mon('ワイト',1);
  gameState.players[0].mz=[ig];gameState.players[0].grave=[wind];gameState.players[1].mz=[fu];baselineA();
  phase('end');
  ok('イグルス negative: no Set card on the opponent\'s field (only a face-up monster) → nothing happens',z(wind)==='grave'&&z(fu)==='mz',JSON.stringify({wind:z(wind),fu:z(fu)})); }
/* only my own End Phase */
{ fresh();const ig=mon('ダイガスタ・イグルス',0),wind=mk('ガスタの静寂 カーム',0),fd=mon('ワイト',1);fd.face='down';fd.pos='def';fd.setTurn=3;
  gameState.players[0].mz=[ig];gameState.players[1].mz=[];baselineA();
  endTurn();gameState.players[0].grave=[wind];gameState.players[1].mz=[fd];phase('end');
  ok('イグルス negative: the opponent\'s End Phase does not trigger it',z(wind)==='grave'&&z(fd)==='mz',JSON.stringify({wind:z(wind),fd:z(fd)})); }

/* ===== ガスタの神官 ムスト: return a 「ガスタ」 monster from my GY to the Deck, negate a face-up monster until the End Phase ===== */
{ fresh();const mu=mon('ガスタの神官 ムスト',0),g1=mk('ガスタの静寂 カーム',0),g2=mk('ワイト',0),foe=mon('ワイト',1);
  gameState.players[0].mz=[mu];gameState.players[0].grave=[g1,g2];gameState.players[1].mz=[foe];baselineA();
  PREFER=[uid(g1),uid(foe)];doAct(mu);PREFER=[];
  ok('ムスト: the 「ガスタ」 monster returned to the Deck (ワイト stays) and the opponent monster\'s effect is negated this turn',z(g1)==='deck'&&z(g2)==='grave'&&effectNegated(C(foe))===true,JSON.stringify({g1:z(g1),g2:z(g2),neg:effectNegated(C(foe))}));
  ok('ムスト: once per turn',canEffect(mu)===false,'');
  audit('ムスト');
  endTurn();
  ok('ムスト: the negation ends with the turn',effectNegated(C(foe))===false,String(effectNegated(C(foe)))); }
{ fresh();const mu=mon('ガスタの神官 ムスト',0),g2=mk('ワイト',0),foe=mon('ワイト',1);
  gameState.players[0].mz=[mu];gameState.players[0].grave=[g2];gameState.players[1].mz=[foe];baselineA();
  ok('ムスト negative: no 「ガスタ」 monster in the Graveyard → not available',canEffect(mu)===false,''); }

console.log('U318 done');
`);
