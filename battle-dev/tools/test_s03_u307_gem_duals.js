/* S03-U307: ジェムナイト・アイオーラ / ジェムナイト・アンバー (Gemini) — real DUEL path (Gemini Summon, ignition activation, cost, target, resolution), Replay-audited.
   「ジェム」「ジェムナイト」と名のついた = P4 authority GROUP.GEM / GROUP.GEMKNIGHT (P4-v8, passcode only).
   A. アイオーラ: banish a Graveyard 「ジェム」 monster (cost) → add a Graveyard 「ジェムナイト」 card to the hand; once per turn.
      The cost and the target are two different cards; the setcode-tagged but not-named cards (ジェム・エンハンス) and a non-monster cost (カウンター・ジェム) do not count.
   B. アンバー: send a hand 「ジェムナイト」 card to the Graveyard (cost) → return a banished monster of mine to the hand; once per turn. */
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
const SEEN=[];
function drive(){for(let i=0;i<600;i++){
  if(pc()){SEEN.push({title:pc().title,cands:pc().candidates.map(x=>x.uid||x.value||x.key)});pick();continue;}
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
function legal(c){const h=findCardByUid(c.uid);return strictScriptLegalityV2(nm(c),0,h.zone,h.index,{});}
function activate(g,prefer){SEEN.length=0;PREFER=prefer.map(uid);duelActivateFromZone(0,'mz',idx(g));drive();PREFER=[];}
`;

/* ===== A. ジェムナイト・アイオーラ ===== */
harness(COMMON+String.raw`
/* A1: cost = ジェムエレファント (a 「ジェム」 monster that is not a ジェムナイト), target = ジェムナイト・ガネット */
{
  const g=fresh('ジェムナイト・アイオーラ');const ele=mk('ジェムエレファント',0),gan=mk('ジェムナイト・ガネット',0);
  gameState.players[0].grave=[ele,gan];baselineA();
  ok('A1: before the Gemini Summon (a Normal Monster) the effect cannot be activated',legal(g).ok===false,JSON.stringify(legal(g)));
  gemini(g);
  ok('A1: Gemini Summoned: activatable with a 「ジェム」 monster and a different 「ジェムナイト」 card in the GY',legal(g).ok===true,JSON.stringify(legal(g)));
  activate(g,[ele,gan]);
  ok('A1: the cost card is banished',z(ele)==='banish',z(ele));
  ok('A1: the targeted ジェムナイト・ガネット is added to the hand',z(gan)==='hand'&&gameState.players[0].hand.some(c=>c.uid===gan.uid),z(gan));
  ok('A1: the cost step offered only the usable cost (ジェムエレファント; ガネット alone could not be both cost and target)',
     SEEN.length===2&&SEEN[0].cands.length===1&&SEEN[0].cands[0]===ele.uid&&SEEN[1].cands.length===1&&SEEN[1].cands[0]===gan.uid,JSON.stringify(SEEN));
  ok('A1: once per turn — a second activation this turn is refused',legal(g).ok===false,JSON.stringify(legal(g)));
  audit('A1');
}
/* A2: two ジェムナイト monsters in the GY: one is the cost (a 「ジェム」 monster), the other the target */
{
  const g=fresh('ジェムナイト・アイオーラ');const gan=mk('ジェムナイト・ガネット',0),rub=mk('ジェムナイト・クリスタ',0);
  gameState.players[0].grave=[gan,rub];baselineA();gemini(g);
  ok('A2: two ジェムナイト monsters → activatable (cost one, target the other)',legal(g).ok===true);
  activate(g,[gan,rub]);
  ok('A2: ガネット (the first choice) is banished as the cost and クリスタ is added to the hand',z(gan)==='banish'&&z(rub)==='hand',JSON.stringify({gan:z(gan),rub:z(rub)}));
  audit('A2');
}
/* A2b: a Fusion monster is a legal target; added to the hand it returns to the Extra Deck */
{
  const g=fresh('ジェムナイト・アイオーラ');const ele=mk('ジェムエレファント',0),rub=mk('ジェムナイト・ルビーズ',0);
  gameState.players[0].grave=[ele,rub];baselineA();gemini(g);
  activate(g,[ele,rub]);
  ok('A2b: ジェムナイト・ルビーズ (Fusion) targeted → it goes back to the Extra Deck, not the hand',z(ele)==='banish'&&z(rub)==='ex'&&!gameState.players[0].hand.some(c=>c.uid===rub.uid),JSON.stringify({ele:z(ele),rub:z(rub)}));
  audit('A2b');
}
/* A3: the Spell ジェムナイト・フュージョン is a 「ジェムナイト」 card and a legal target (the cost must still be a monster) */
{
  const g=fresh('ジェムナイト・アイオーラ');const ele=mk('ジェムタートル',0),fus=mk('ジェムナイト・フュージョン',0);
  gameState.players[0].grave=[ele,fus];baselineA();gemini(g);
  ok('A3: a 「ジェムナイト」 Spell in the GY is a legal target',legal(g).ok===true);
  activate(g,[ele,fus]);
  ok('A3: ジェムタートル banished, ジェムナイト・フュージョン added to the hand',z(ele)==='banish'&&z(fus)==='hand',JSON.stringify({ele:z(ele),fus:z(fus)}));
  audit('A3');
}
/* A4: cannot be activated: one lone ジェムナイト monster (cost = target), no 「ジェム」 monster, no 「ジェムナイト」 card, the setcode-only trap, the non-monster 「ジェム」 card as the cost */
for(const c of [
  {label:'one ジェムナイト monster alone (it cannot be both the cost and the target)',gy:['ジェムナイト・ガネット']},
  {label:'a 「ジェム」 monster but no 「ジェムナイト」 card',gy:['ジェムエレファント']},
  {label:'a Spell 「ジェムナイト」 card but no 「ジェム」 monster to banish',gy:['ジェムナイト・フュージョン']},
  {label:'ジェム・エンハンス (setcode 0x100f but not named ジェムナイト) is not a target',gy:['ジェムエレファント','ジェム・エンハンス']},
  {label:'カウンター・ジェム (a Trap) cannot be the cost; the ジェムナイト monster alone cannot be both',gy:['カウンター・ジェム','ジェムナイト・ガネット']},
  {label:'empty Graveyard',gy:[]}]){
  const g=fresh('ジェムナイト・アイオーラ');gameState.players[0].grave=c.gy.map(n=>mk(n,0));baselineA();gemini(g);
  ok('A4: refused — '+c.label,legal(g).ok===false,JSON.stringify(legal(g)));
}
/* A5: the opponent's Graveyard is not used */
{
  const g=fresh('ジェムナイト・アイオーラ');gameState.players[1].grave=[mk('ジェムエレファント',1),mk('ジェムナイト・ガネット',1)];baselineA();gemini(g);
  ok('A5: refused — only the opponent GY holds 「ジェム」 cards',legal(g).ok===false);
}
`);

/* ===== B. ジェムナイト・アンバー ===== */
harness(COMMON+String.raw`
/* B1: cost = ジェムナイト・サフィア from the hand, target = my banished ワイト */
{
  const g=fresh('ジェムナイト・アンバー');const rub=mk('ジェムナイト・サフィア',0),oth=mk('ジェム・エンハンス',0),wt=mk('ワイト',0),sp=mk('強欲な壺',0);
  gameState.players[0].hand=[oth,rub];gameState.players[0].banish=[sp,wt];baselineA();
  ok('B1: before the Gemini Summon the effect cannot be activated',legal(g).ok===false);
  gemini(g);
  ok('B1: Gemini Summoned: activatable with a hand 「ジェムナイト」 card and a banished monster',legal(g).ok===true,JSON.stringify(legal(g)));
  activate(g,[rub,wt]);
  ok('B1: only the 「ジェムナイト」 card was offered as the cost (ジェム・エンハンス is not named ジェムナイト)',SEEN[0]&&SEEN[0].cands.length===1&&SEEN[0].cands[0]===rub.uid,JSON.stringify(SEEN));
  ok('B1: only the banished monster was offered as the target (not the banished Spell)',SEEN[1]&&SEEN[1].cands.length===1&&SEEN[1].cands[0]===wt.uid,JSON.stringify(SEEN));
  ok('B1: サフィア is in the Graveyard (cost) and the banished ワイト is back in the hand',z(rub)==='grave'&&z(wt)==='hand'&&z(sp)==='banish',JSON.stringify({rub:z(rub),wt:z(wt),sp:z(sp)}));
  ok('B1: once per turn — a second activation this turn is refused',legal(g).ok===false,JSON.stringify(legal(g)));
  audit('B1');
}
/* B2: the cost can be a Spell 「ジェムナイト」 card (「ジェムナイト」と名のついたカード) */
{
  const g=fresh('ジェムナイト・アンバー');const fus=mk('ジェムナイト・フュージョン',0),wt=mk('ワイト',0);
  gameState.players[0].hand=[fus];gameState.players[0].banish=[wt];baselineA();gemini(g);
  activate(g,[fus,wt]);
  ok('B2: ジェムナイト・フュージョン (Spell) sent as the cost; ワイト returned to the hand',z(fus)==='grave'&&z(wt)==='hand',JSON.stringify({fus:z(fus),wt:z(wt)}));
  audit('B2');
}
/* B3: refused */
for(const c of [
  {label:'no 「ジェムナイト」 card in the hand (ジェムエレファント / ジェム・エンハンス are not ジェムナイト)',hand:['ジェムエレファント','ジェム・エンハンス'],ban:['ワイト']},
  {label:'no banished monster of mine (only a Spell is banished)',hand:['ジェムナイト・サフィア'],ban:['強欲な壺']},
  {label:'nothing banished',hand:['ジェムナイト・サフィア'],ban:[]}]){
  const g=fresh('ジェムナイト・アンバー');gameState.players[0].hand=c.hand.map(n=>mk(n,0));gameState.players[0].banish=c.ban.map(n=>mk(n,0));baselineA();gemini(g);
  ok('B3: refused — '+c.label,legal(g).ok===false,JSON.stringify(legal(g)));
}
/* B4: the opponent's banished monster is not mine */
{
  const g=fresh('ジェムナイト・アンバー');gameState.players[0].hand=[mk('ジェムナイト・サフィア',0)];gameState.players[1].banish=[mk('ワイト',1)];baselineA();gemini(g);
  ok('B4: refused — only the opponent has a banished monster',legal(g).ok===false);
}
`);
