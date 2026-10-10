/* S03-U119: デュアル (Gemini) — "もう1度召喚" as a Normal Summon (engine/1ZI_gemini_s03.js) and 6 Gemini monsters
   (cards/HO_claude_s03_u119_gemini.js). Real DUEL path (legal zone action → summon window → commit / negation),
   Replay-audited. */
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
function actions(p,c){const h=findCardByUid(c.uid);return getLegalZoneActions(p,h.zone,h.index).map(a=>a.id);}
function gemini(p,c){const h=findCardByUid(c.uid);doGeminiSummonS03(p,h.zone,h.index);}
/* a face-up Gemini monster already on P0's field (summoned an earlier turn) */
function fresh(name){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  const g=mk(name,0,'up');g.summonedTurn=3;gameState.players[0].mz=[g];return g;}
function setc(n,p){const c=mk(n,p,'down');c.setTurn=gameState.turn-1;return c;}
`;

/* ===== A. もう1度召喚: legal action, uses the Normal Summon, gains the effect (アナザー・ネオス → name E・HERO ネオス) ===== */
harness(COMMON+String.raw`
const g=fresh('E・HERO アナザー・ネオス');
baselineA();
ok('A: before: a Normal Monster (treatedAsNormal), its own name',treatedAsNormal(g)&&currentNameV17(g)==='E・HERO アナザー・ネオス'&&!geminiActiveS03(g),currentNameV17(g));
ok('A: the legal zone actions offer もう1度召喚',actions(0,g).includes('geminiSummon'),JSON.stringify(actions(0,g)));
gemini(0,g);drive();
ok('A: Gemini Summoned: dualUp, the Normal Summon is used, it is now treated as an Effect Monster',g.dualUp===true&&gameState.players[0].normalSummonUsed===true&&!treatedAsNormal(g)&&geminiActiveS03(g),JSON.stringify({d:g.dualUp,ns:gameState.players[0].normalSummonUsed}));
ok('A アナザー・ネオス: its name is treated as E・HERO ネオス in the Monster Zone',currentNameV17(g)==='E・HERO ネオス',currentNameV17(g));
ok('A: it counts as summoned this turn',g.summonedTurn===gameState.turn);
ok('A: no second もう1度召喚',!actions(0,g).includes('geminiSummon'));
audit('A');
/* SaveLoad keeps the state */
const g2=JSON.parse(JSON.stringify(gameState));
ok('A: SaveLoad (JSON) keeps dualUp',g2.players[0].mz[0].dualUp===true);
/* leaves the field → back to a Normal Monster; face-down → loses it */
const hh=findCardByUid(g.uid);act({type:'FX_SET_STATE',player:0,zone:'mz',index:hh.index,face:'down',pos:'def',reason:'test'});
ok('A: turned face-down → no longer Gemini-Summoned',!g.dualUp&&!geminiActiveS03(g));
`);

/* ===== B. restrictions: Normal Summon already used / Battle Phase / opponent's monster / not face-up ===== */
harness(COMMON+String.raw`
let g=fresh('E・HERO アナザー・ネオス');gameState.players[0].hand=[mk('ワイト',0)];
baselineA();
doNormalSummon(0,'atk');drive();
ok('B: after a Normal Summon this turn, no もう1度召喚',!actions(0,g).includes('geminiSummon')&&/既に通常召喚/.test(geminiSummonBlockedS03(g,0)),geminiSummonBlockedS03(g,0));
g=fresh('E・HERO アナザー・ネオス');gameState.phase='battle';
ok('B: not in the Battle Phase',/メインフェイズ/.test(geminiSummonBlockedS03(g,0)));
g=fresh('E・HERO アナザー・ネオス');g.face='down';g.pos='def';
ok('B: not while face-down',!!geminiSummonBlockedS03(g,0));
g=fresh('ワイト');
ok('B: a non-Gemini monster has no such action',!actions(0,g).includes('geminiSummon'));
`);

/* ===== C. 神の宣告 negates the もう1度召喚 → the monster is destroyed; the Normal Summon stays used ===== */
harness(COMMON+String.raw`
const g=fresh('E・HERO アナザー・ネオス');
const jd=setc('神の宣告',1);gameState.players[1].sz=[jd];
baselineA();
gemini(0,g);
ok('C: the summon window is open and lists 神の宣告 (it is a Normal Summon)',!!gameState.pendingSummon&&gameState.pendingSummon.geminiS03===true&&summonNegatorsV2(gameState.pendingSummon).some(x=>x.db.n==='神の宣告'),JSON.stringify(gameState.pendingSummon));
activateSummonNegatorV2(1,'sz',0);drive();
ok('C: negated → the Gemini monster is destroyed, 神の宣告 paid half LP',z(g)==='grave'&&gameState.players[1].lp===4000&&gameState.players[0].normalSummonUsed===true&&!g.dualUp,JSON.stringify({g:z(g),lp:gameState.players[1].lp}));
audit('C');
`);

/* ===== D. "召喚に成功した時" reacts: 奈落の落とし穴 (ATK 1500+) ===== */
harness(COMMON+String.raw`
const g=fresh('E・HERO アナザー・ネオス');
const nr=setc('奈落の落とし穴',1);gameState.players[1].sz=[nr];
baselineA();
gemini(0,g);
for(let i=0;i<50;i++){
  if(pc()){pick();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const gg=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(gg.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  break;
}
const onChain=gameState.chain.map(l=>l.name).includes('奈落の落とし穴');
const resp=getChainResponsesV2(1).map(x=>x.db.n);
ok('D: after the もう1度召喚 succeeds, 奈落の落とし穴 is offered / activated against it',g.dualUp===true&&(onChain||resp.includes('奈落の落とし穴')),JSON.stringify({d:g.dualUp,resp,chain:gameState.chain.map(l=>l.name)}));
if(!onChain&&resp.includes('奈落の落とし穴')) duelActivateResponseV2(1,'sz',0);
drive();
ok('D: 奈落の落とし穴 destroys and banishes it',z(g)==='banish',JSON.stringify(z(g)));
audit('D');
`);

/* ===== E. effects only after もう1度召喚: 灼熱王パイロン / ヘルカイザー・ドラゴン / チューンド・マジシャン ===== */
harness(COMMON+String.raw`
let g=fresh('灼熱王パイロン');
baselineA();
ok('E パイロン: before, its effect cannot be activated',strictScriptLegalityV2('灼熱王パイロン',0,'mz',0,{}).ok===false,JSON.stringify(strictScriptLegalityV2('灼熱王パイロン',0,'mz',0,{})));
gemini(0,g);drive();
ok('E パイロン: after, it can',strictScriptLegalityV2('灼熱王パイロン',0,'mz',0,{}).ok===true);
duelActivateFromZone(0,'mz',0);drive();
ok('E パイロン: 1000 damage',gameState.players[1].lp===7000,String(gameState.players[1].lp));
ok('E パイロン: once per turn',strictScriptLegalityV2('灼熱王パイロン',0,'mz',0,{}).ok===false);
audit('E pyron');
g=fresh('ヘルカイザー・ドラゴン');baselineA();
ok('E ヘルカイザー: 1 attack before',attackLimitV48(g)===1);
gemini(0,g);drive();
ok('E ヘルカイザー: 2 attacks after',attackLimitV48(g)===2);
g=fresh('チューンド・マジシャン');baselineA();
ok('E チューンド・マジシャン: not a Tuner before',isTunerNowV17(g)===false);
gemini(0,g);drive();
ok('E チューンド・マジシャン: a Tuner after',isTunerNowV17(g)===true);
`);

/* ===== F. battle effects: デュアル・ランサー (piercing), 幸運の笛吹き (draw) ===== */
harness(COMMON+String.raw`
function attack(){doPhase('battle');drive();requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();}
let g=fresh('デュアル・ランサー');let w=mk('ワイト',1,'up');w.pos='def';gameState.players[1].mz=[w];baselineA();
attack();
ok('F ランサー: without もう1度召喚, no piercing',gameState.players[1].lp===8000&&z(w)==='grave',String(gameState.players[1].lp));
g=fresh('デュアル・ランサー');w=mk('ワイト',1,'up');w.pos='def';gameState.players[1].mz=[w];baselineA();
gemini(0,g);drive();attack();
ok('F ランサー: after, piercing 1800-200=1600',gameState.players[1].lp===8000-1600,String(gameState.players[1].lp));
audit('F lancer');
g=fresh('幸運の笛吹き');w=mk('ワイト',1,'up');gameState.players[1].mz=[w];gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0)];baselineA();
attack();
ok('F 笛吹き: without もう1度召喚, no draw',gameState.players[0].hand.length===0);
g=fresh('幸運の笛吹き');w=mk('ワイト',1,'up');gameState.players[1].mz=[w];gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0)];baselineA();
gemini(0,g);drive();attack();
ok('F 笛吹き: after, destroys ワイト → draws 1',z(w)==='grave'&&gameState.players[0].hand.length===1,JSON.stringify(names(0,'hand')));
audit('F piper');
`);
