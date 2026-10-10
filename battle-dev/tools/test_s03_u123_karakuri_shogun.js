/* S03-U123: カラクリ将軍 無零 — ① on its Synchro Summon: Special Summon a カラクリ from the Deck (optional);
   ② once per turn: change the position of 1 monster (target). Measured on U122: ① ran ②'s resolve (position change,
   no summon) and the shared countLimit made ① consume ②'s once-per-turn. Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<400;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function uid(c){return ensureCardUid(gameState,c);}
function chainAdds(){return v41ReplayPackage(gameState).actions.map(x=>x&&x.action).filter(a=>a&&a.type==='CHAIN_ADD').map(a=>a.name);}
function idx(c){return findCardByUid(c.uid).index;}
`;

/* ===== A. Synchro Summon → ① Special Summons the chosen カラクリ from the Deck; ② is still available afterwards ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
/* 無零 Lv7: Tuner カラクリ参謀 弐四八 (Lv3) + non-Tuner Machine カラクリ忍者 九壱九 (Lv4) */
const t=mk('カラクリ参謀 弐四八',0,'up'),m=mk('カラクリ忍者 九壱九',0,'up');gameState.players[0].mz=[t,m];
const mu=mk('カラクリ将軍 無零',0);gameState.players[0].ex=[mu];
const k1=mk('カラクリ兵 弐参六',0),k2=mk('カラクリ商人 壱七七',0);gameState.players[0].deck=[k1,k2,mk('ワイト',0)];
const foe=mk('ワイト',1,'up');gameState.players[1].mz=[foe];
baselineA();
ok('A: precondition — 弐四八 (Tuner) + 九壱九 (Machine) make 無零',exCombos(0,dbOf(mu)).combos.length>=1,JSON.stringify(exCombos(0,dbOf(mu)).combos));
PREFER=[uid(k2)];
const P=gameState.players[0];doExSummon(0,0,[P.mz.indexOf(t),P.mz.indexOf(m)],'synchro','atk');drive();PREFER=[];
ok('A ①: Synchro Summoned → the chosen カラクリ商人 壱七七 is Special Summoned from the Deck (no position change of ワイト)',z(mu)==='mz'&&z(k2)==='mz'&&z(k1)==='deck'&&foe.pos==='atk',JSON.stringify({mu:z(mu),k2:z(k2),k1:z(k1),foe:foe.pos,adds:chainAdds()}));
ok('A ①: ② is still available this turn (the once-per-turn belongs to ② only)',strictScriptLegalityV2('カラクリ将軍 無零',0,'mz',idx(mu),{}).ok===true,JSON.stringify(strictScriptLegalityV2('カラクリ将軍 無零',0,'mz',idx(mu),{})));
audit('A ①');
PREFER=[uid(foe)];
duelActivateFromZone(0,'mz',idx(mu));drive();PREFER=[];
ok('A ②: the targeted ワイト changes to Defense Position',foe.pos==='def',JSON.stringify(foe.pos));
ok('A ②: once per turn',strictScriptLegalityV2('カラクリ将軍 無零',0,'mz',idx(mu),{}).ok===false);
audit('A ②');
`);

/* ===== B. ① is optional; revived (not Synchro Summoned) → no ① ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const mu=mk('カラクリ将軍 無零',0);mu.properlySummonedS03=true;/* S03-U127: a Synchro Monster can be Special Summoned from the GY / banishment only after a proper summon — this setup card stands for one that was properly Synchro Summoned earlier */gameState.players[0].grave=[mu];gameState.players[0].hand=[mk('死者蘇生',0)];
gameState.players[0].deck=[mk('カラクリ兵 弐参六',0)];
baselineA();
PREFER=[uid(mu)];duelActivateFromHand(0);drive();PREFER=[];
ok('B: revived by 死者蘇生 → ① does not trigger (not a Synchro Summon)',z(mu)==='mz'&&!chainAdds().includes('カラクリ将軍 無零')&&gameState.players[0].deck.length===1,JSON.stringify({adds:chainAdds()}));
audit('B');
`);
