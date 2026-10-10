/* S03-U122: デュアル batch 2 (cards/HQ_claude_s03_u122_gemini2.js) on the U119 Gemini capability.
   巨人ゴーグル, サンライズ・ガードナー, 未来サムライ, シャドウ・ダイバー, インフィニティ・ダーク, ギガプラント.
   Real DUEL path (もう1度召喚 via doGeminiSummonS03, activations, attacks), Replay-audited. */
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
function gemini(c){const h=findCardByUid(c.uid);doGeminiSummonS03(0,h.zone,h.index);drive();}
function fresh(name){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  const g=mk(name,0,'up');g.summonedTurn=3;gameState.players[0].mz=[g];return g;}
function chainAdds(){return v41ReplayPackage(gameState).actions.map(x=>x&&x.action).filter(a=>a&&a.type==='CHAIN_ADD').map(a=>a.name);}
function idx(c){return findCardByUid(c.uid).index;}
`;

/* ===== A. 巨人ゴーグル / サンライズ・ガードナー: original ATK / DEF only after もう1度召喚 ===== */
harness(COMMON+String.raw`
let g=fresh('巨人ゴーグル');baselineA();
const atk0=curATK(g);
gemini(g);
ok('A 巨人ゴーグル: ATK 1500 as a Normal Monster → 2100 after もう1度召喚',atk0===1500&&curATK(g)===2100&&g.dualUp===true,JSON.stringify({atk0,atk:curATK(g)}));
audit('A goggle');
g=fresh('サンライズ・ガードナー');baselineA();
const def0=curDEF(g);
gemini(g);
ok('A サンライズ・ガードナー: original DEF → 2300 after もう1度召喚',def0!==2300&&curDEF(g)===2300,JSON.stringify({def0,def:curDEF(g)}));
`);

/* ===== B. 未来サムライ: cost = banish a GY monster; destroy a face-up monster (chosen at resolution); once per turn ===== */
harness(COMMON+String.raw`
const s=fresh('未来サムライ');
const gy=mk('ワイト',0);gameState.players[0].grave=[gy];
const foe=mk('ジェネティック・ワーウルフ',1,'up');gameState.players[1].mz=[foe];
baselineA();
ok('B: not activatable while it is a Normal Monster',strictScriptLegalityV2('未来サムライ',0,'mz',0,{}).ok===false);
gemini(s);
ok('B: activatable after もう1度召喚',strictScriptLegalityV2('未来サムライ',0,'mz',idx(s),{}).ok===true);
PREFER=[uid(gy),uid(foe)];
duelActivateFromZone(0,'mz',idx(s));drive();PREFER=[];
ok('B: the GY monster is banished as the cost; the chosen face-up monster is destroyed',z(gy)==='banish'&&z(foe)==='grave'&&z(s)==='mz',JSON.stringify({gy:z(gy),foe:z(foe)}));
ok('B: once per turn',strictScriptLegalityV2('未来サムライ',0,'mz',idx(s),{}).ok===false);
audit('B');
`);

/* ===== C. シャドウ・ダイバー: a face-up DARK Level 4- monster may attack directly this turn ===== */
harness(COMMON+String.raw`
const d=fresh('シャドウ・ダイバー');
const w=mk('ワイト',0,'up');w.summonedTurn=3;gameState.players[0].mz.push(w);
gameState.players[1].mz=[mk('ジェネティック・ワーウルフ',1,'up')];
baselineA();
gemini(d);
PREFER=[uid(w)];
duelActivateFromZone(0,'mz',idx(d));drive();PREFER=[];
ok('C: ワイト (DARK Lv1) is granted a direct attack',canDirectAttackThroughMonstersV51(w)===true&&chainAdds().includes('シャドウ・ダイバー'),JSON.stringify(chainAdds()));
doPhase('battle');drive();
const lp=gameState.players[1].lp;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(w),target:'direct'});drive();
ok('C: ワイト attacks directly past ジェネティック・ワーウルフ (300)',gameState.players[1].lp===lp-300,String(gameState.players[1].lp));
audit('C');
`);

/* ===== D. インフィニティ・ダーク: its attack declaration → change the position of 1 face-up opponent monster (optional) ===== */
harness(COMMON+String.raw`
const d=fresh('インフィニティ・ダーク');
const foe=mk('ワイト',1,'up');foe.pos='atk';const other=mk('ゴブリンドバーグ',1,'up');gameState.players[1].mz=[foe,other];
baselineA();
gemini(d);
doPhase('battle');drive();
PREFER=[uid(foe)];
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(d),target:1});drive();PREFER=[];
ok('D: the trigger resolved and the chosen ワイト changed to Defense Position',chainAdds().includes('インフィニティ・ダーク')&&foe.pos==='def',JSON.stringify({pos:foe.pos,adds:chainAdds()}));
audit('D');
/* without もう1度召喚: no trigger */
const d2=fresh('インフィニティ・ダーク');const f2=mk('ワイト',1,'up');gameState.players[1].mz=[f2];
baselineA();doPhase('battle');drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('D: as a Normal Monster it does not trigger',!chainAdds().includes('インフィニティ・ダーク'));
`);

/* ===== E. ギガプラント: once per turn, Special Summon an Insect / Plant from the hand or GY ===== */
harness(COMMON+String.raw`
const gp=fresh('ギガプラント');
const ins=mk('ゴキボール',0);gameState.players[0].hand=[ins];const pl=mk('ローンファイア・ブロッサム',0);gameState.players[0].grave=[pl];
baselineA();
ok('E: precondition — ゴキボール is an Insect, ローンファイア・ブロッサム a Plant',dbOf(ins).ra==='昆虫'&&dbOf(pl).ra==='植物',JSON.stringify([dbOf(ins).ra,dbOf(pl).ra]));
gemini(gp);
PREFER=[uid(pl)];
duelActivateFromZone(0,'mz',idx(gp));drive();PREFER=[];
ok('E: the chosen Plant is Special Summoned from the GY',z(pl)==='mz'&&z(ins)==='hand',JSON.stringify({pl:z(pl),ins:z(ins)}));
ok('E: once per turn',strictScriptLegalityV2('ギガプラント',0,'mz',idx(gp),{}).ok===false);
audit('E');
`);
