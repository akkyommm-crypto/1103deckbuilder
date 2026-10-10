/* S03-U148: Gemini batch 3 — 水面のアレサ, 竜影魚レイ・ブロント, 炎妖蝶ウィルプス, 地獄の門番イル・ブラッド, 魔族召喚師.
   Real DUEL path: the Gemini Summon (doGeminiSummonS03), phase changes, attacks and activations through the processor; Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(name){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  const g=mk(name,0,'up');g.summonedTurn=3;gameState.players[0].mz=[g];return g;}
function gemini(c){const h=findCardByUid(c.uid);doGeminiSummonS03(0,h.zone,h.index);drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function toPhase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function attack(c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:t});drive();}
function legal(c){const h=findCardByUid(c.uid);return strictScriptLegalityV2(nm(c),0,h.zone,h.index,{});}
`;

/* ===== A. 水面のアレサ ===== */
harness(COMMON+String.raw`
const g=fresh('水面のアレサ');const foe=mk('ワイト',1,'up');gameState.players[1].mz=[foe];
gameState.players[1].hand=[mk('ワイト',1),mk('ワイト',1)];
baselineA();
gemini(g);toPhase('battle');attack(g,0);
ok('A: Gemini Summoned アレサ destroys ワイト by battle → the opponent discards 1 card at random',z(foe)==='grave'&&gameState.players[1].hand.length===1&&gameState.players[1].grave.length===2,
  JSON.stringify({foe:z(foe),hand:gameState.players[1].hand.length,grave:gameState.players[1].grave.map(nm)}));
audit('A');
const g2=fresh('水面のアレサ');const foe2=mk('ワイト',1,'up');gameState.players[1].mz=[foe2];gameState.players[1].hand=[mk('ワイト',1),mk('ワイト',1)];
baselineA();
toPhase('battle');attack(g2,0);
ok('A: control — not Gemini Summoned (a Normal Monster) → no discard',z(foe2)==='grave'&&gameState.players[1].hand.length===2);
`);

/* ===== B. 竜影魚レイ・ブロント ===== */
harness(COMMON+String.raw`
const g=fresh('竜影魚レイ・ブロント');const foe=mk('ワイト',1,'up');gameState.players[1].mz=[foe];
baselineA();
ok('B: before the Gemini Summon its ATK is the printed one',curATK(g)===Number(dbOf(g).atk),String(curATK(g)));
gemini(g);
ok('B: Gemini Summoned → original ATK 2300',curATK(g)===2300,String(curATK(g)));
toPhase('battle');attack(g,0);
ok('B: it attacked (ワイト destroyed, 2000 damage)',z(foe)==='grave'&&gameState.players[1].lp===6000,JSON.stringify({lp:gameState.players[1].lp}));
toPhase('main2');
const hb=findCardByUid(g.uid);
ok('B: at the end of the Battle Phase it is in Defense Position',hb.card.pos==='def',hb.card.pos);
ok('B: it cannot change its battle position until the end of its controller next turn',Number(hb.card.b0DefLockUntil)===gameState.turn+2,String(hb.card.b0DefLockUntil));
audit('B');
`);

/* ===== C. 炎妖蝶ウィルプス ===== */
harness(COMMON+String.raw`
const g=fresh('炎妖蝶ウィルプス');const neo=mk('E・HERO アナザー・ネオス',0),w2=mk('炎妖蝶ウィルプス',0);gameState.players[0].grave=[w2,neo];
baselineA();
gemini(g);
duelActivateFromZone(0,'mz',idx(g));PREFER=[uid(neo)];drive();PREFER=[];
const n=findCardByUid(neo.uid);
ok('C: ウィルプス is released (cost) and E・HERO アナザー・ネオス is Special Summoned',z(g)==='grave'&&n&&n.zone==='mz',JSON.stringify({g:z(g),neo:n&&n.zone}));
ok('C: … treated as Gemini Summoned (its effect is on: name E・HERO ネオス)',n&&n.card.dualUp===true&&geminiActiveS03(n.card)&&currentNameV17(n.card)==='E・HERO ネオス',JSON.stringify(n&&{d:n.card.dualUp,name:currentNameV17(n.card)}));
ok('C: the other 炎妖蝶ウィルプス in the GY was not a candidate',z(w2)==='grave');
audit('C');
const g3=fresh('炎妖蝶ウィルプス');gameState.players[0].grave=[mk('E・HERO アナザー・ネオス',0)];
baselineA();
ok('C: not Gemini Summoned → cannot be activated',legal(g3).ok===false);
`);

/* ===== D. 地獄の門番イル・ブラッド: once per turn, a Zombie from the hand or either GY; leaving the field destroys it ===== */
harness(COMMON+String.raw`
const g=fresh('地獄の門番イル・ブラッド');const zw=mk('ワイト',1);gameState.players[1].grave=[zw];
const other=mk('ワイト',0,'up');gameState.players[0].mz.push(other);
gameState.players[0].grave=[mk('ワイト',0)];
const ej=mk('強制脱出装置',0,'down');ej.setTurn=3;gameState.players[0].sz=[ej];
baselineA();
gemini(g);
duelActivateFromZone(0,'mz',idx(g));PREFER=[uid(zw)];drive();PREFER=[];
const s=findCardByUid(zw.uid);const summoned=!!(s&&s.zone==='mz'&&s.p===0);
ok('D: the opponent GY ワイト (Zombie) is Special Summoned under my control',s&&s.zone==='mz'&&s.p===0,JSON.stringify(s&&{zone:s.zone,p:s.p}));
ok('D: once per turn — after one use, a second activation this turn is refused',summoned&&legal(g).ok===false,JSON.stringify(legal(g)));
duelActivateFromZone(0,'sz',0);PREFER=[uid(g)];drive();PREFER=[];
ok('D: イル・ブラッド leaves the field (強制脱出装置) → the Zombie it summoned is destroyed',summoned&&z(g)==='hand'&&z(zw)==='grave',JSON.stringify({g:z(g),zw:z(zw)}));
ok('D: … a Zombie it did not summon stays',summoned&&z(other)==='mz');
audit('D');
`);

/* ===== E. 魔族召喚師: a Fiend from the hand; leaving the field destroys it ===== */
harness(COMMON+String.raw`
const g=fresh('魔族召喚師');const dm=mk('デーモンの召喚',0);gameState.players[0].hand=[dm];
const ej=mk('強制脱出装置',0,'down');ej.setTurn=3;gameState.players[0].sz=[ej];
baselineA();
gemini(g);
duelActivateFromZone(0,'mz',idx(g));PREFER=[uid(dm)];drive();PREFER=[];
ok('E: デーモンの召喚 is Special Summoned from the hand',z(dm)==='mz');
duelActivateFromZone(0,'sz',0);PREFER=[uid(g)];drive();PREFER=[];
ok('E: 魔族召喚師 leaves the field → the Fiend it summoned is destroyed',z(g)==='hand'&&z(dm)==='grave',JSON.stringify({g:z(g),dm:z(dm)}));
audit('E');
const g2=fresh('魔族召喚師');gameState.players[0].hand=[mk('デーモンの召喚',0)];
baselineA();
ok('E: not Gemini Summoned → cannot be activated',legal(g2).ok===false);
`);
