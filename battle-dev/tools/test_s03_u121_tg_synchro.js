/* S03-U121: effect Synchro Summon (engine/1ZJ_effect_synchro_s03.js) + TG / Synchron cluster:
   フォーミュラ・シンクロン, TG ワンダー・マジシャン, TG ハイパー・ライブラリアン, TG パワー・グラディエイター.
   Real DUEL path (EX summon window, chain responses, attacks), Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<400;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function choose(){for(let i=0;i<20&&pc();i++)pick();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function setc(n,p){const c=mk(n,p,'down');c.setTurn=gameState.turn-1;return c;}
function uid(c){return ensureCardUid(gameState,c);}
function chainAdds(){return v41ReplayPackage(gameState).actions.map(x=>x&&x.action).filter(a=>a&&a.type==='CHAIN_ADD').map(a=>a.name);}
/* P0 Synchro Summons by the real EX path (DUEL: summon window then commit) */
function synchro(p,exCard,mats){const P=gameState.players[p];doExSummon(p,P.ex.indexOf(exCard),mats.map(m=>P.mz.indexOf(m)),'synchro','atk');drive();}
/* opponent's (P1's) Main Phase: P1 activates サイクロン on P0's set card, P0 gets a chain response window */
/* (サイクロン must already be in P2's hand before baselineA: addCyclone()) */
function addCyclone(){gameState.players[1].hand=[mk('サイクロン',1)];}
function oppSpellWindow(){
  PREFER=[uid(gameState.players[0].sz[0])];
  duelActivateFromHand(0);choose();PREFER=[];
}
`;

/* ===== A. フォーミュラ・シンクロン ②: in response during the opponent's Main Phase → Synchro Summon with it ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
const f=mk('フォーミュラ・シンクロン',0,'up'),g=mk('ゴブリンドバーグ',0,'up');gameState.players[0].mz=[f,g];
const br=mk('氷結界の龍 ブリューナク',0);gameState.players[0].ex=[br];gameState.players[0].sz=[setc('聖なるバリア －ミラーフォース－',0)];
addCyclone();
baselineA();
ok('A: not on its controller\'s own turn / outside a Main Phase',(()=>{const s=gameState.activePlayer;gameState.activePlayer=0;const r=strictScriptLegalityV2('フォーミュラ・シンクロン',0,'mz',0,{}).ok;gameState.activePlayer=s;return r===false;})());
oppSpellWindow();
ok('A: P2 activated サイクロン; P1 may respond with フォーミュラ・シンクロン ②',gameState.chain.length===1&&getChainResponsesV2(0).some(x=>x.db.n==='フォーミュラ・シンクロン'),JSON.stringify({chain:gameState.chain.map(l=>l.name),r:getChainResponsesV2(0).map(x=>x.db.n)}));
duelActivateResponseV2(0,'mz',0);choose();
drive();
ok('A: ② resolved: 氷結界の龍 ブリューナク is Synchro Summoned with フォーミュラ・シンクロン + ゴブリンドバーグ',z(br)==='mz'&&br.specialSummonKind==='synchro'&&z(f)==='grave'&&z(g)==='grave',JSON.stringify({br:z(br),f:z(f),g:z(g),k:br.specialSummonKind}));
ok('A: its ① (optional draw) is NOT triggered by being used as material; the Synchro Summon was during resolution (no negation window)',!chainAdds().filter(n=>n==='フォーミュラ・シンクロン').slice(1).length,JSON.stringify(chainAdds()));
audit('A');
`);

/* ===== B. フォーミュラ・シンクロン ①: draws when Synchro Summoned (optional), not when revived ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const t=mk('グローアップ・バルブ',0,'up'),w=mk('ワイト',0,'up');gameState.players[0].mz=[t,w];
const f=mk('フォーミュラ・シンクロン',0);gameState.players[0].ex=[f];gameState.players[0].deck=[mk('ワイトキング',0),mk('ワイト夫人',0)];
baselineA();
synchro(0,f,[t,w]);
ok('B ①: Synchro Summoned → draws 1',z(f)==='mz'&&names(0,'hand').length===1,JSON.stringify({f:z(f),h:names(0,'hand')}));
audit('B synchro');
/* revived by 死者蘇生 → no draw */
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const f2=mk('フォーミュラ・シンクロン',0);f2.properlySummonedS03=true;/* S03-U127: a Synchro Monster can be Special Summoned from the GY / banishment only after a proper summon — this setup card stands for one that was properly Synchro Summoned earlier */gameState.players[0].grave=[f2];gameState.players[0].deck=[mk('ワイトキング',0)];
gameState.players[0].hand=[mk('死者蘇生',0)];
baselineA();
PREFER=[uid(f2)];duelActivateFromHand(0);drive();PREFER=[];
ok('B ①: revived by 死者蘇生 → it is not a Synchro Summon, no draw',z(f2)==='mz'&&names(0,'hand').length===0&&!chainAdds().includes('フォーミュラ・シンクロン'),JSON.stringify({f:z(f2),h:names(0,'hand'),adds:chainAdds()}));
audit('B revive');
`);

/* ===== C. TG ハイパー・ライブラリアン: another Synchro Summon → draw; left the field before resolution → no draw ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const lib=mk('TG ハイパー・ライブラリアン',0,'up');const t=mk('グローアップ・バルブ',0,'up'),w=mk('ワイト',0,'up');gameState.players[0].mz=[lib,t,w];
const f=mk('フォーミュラ・シンクロン',0);gameState.players[0].ex=[f];gameState.players[0].deck=[mk('ワイトキング',0),mk('ワイト夫人',0),mk('ワイト',0)];
baselineA();
synchro(0,f,[t,w]);
ok('C: another monster Synchro Summoned → ライブラリアン draws (plus フォーミュラ ①: 2 cards)',z(f)==='mz'&&names(0,'hand').length===2&&chainAdds().includes('TG ハイパー・ライブラリアン'),JSON.stringify({h:names(0,'hand'),adds:chainAdds()}));
audit('C');
/* the opponent destroys the Librarian in response to its trigger → no draw */
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const lib2=mk('TG ハイパー・ライブラリアン',0,'up');const t2=mk('グローアップ・バルブ',0,'up'),w2=mk('ワイト',0,'up');gameState.players[0].mz=[lib2,t2,w2];
const f2=mk('フォーミュラ・シンクロン',0);gameState.players[0].ex=[f2];gameState.players[0].deck=[mk('ワイトキング',0),mk('ワイト夫人',0),mk('ワイト',0)];
gameState.players[1].sz=[setc('サンダー・ブレイク',1)];gameState.players[1].hand=[mk('ワイト',1)];
baselineA();
const P0=gameState.players[0];doExSummon(0,0,[P0.mz.indexOf(t2),P0.mz.indexOf(w2)],'synchro','atk');
for(let i=0;i<60;i++){
  if(pc()){ PREFER=[uid(lib2)];pick();PREFER=[];continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];const li=g.findIndex(x=>x.name==='TG ハイパー・ライブラリアン');if(li>=0)eventPickV2(li);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){
    if(gameState.chainWindow.priority===1&&gameState.chain.some(l=>l.name==='TG ハイパー・ライブラリアン')&&!gameState.chain.some(l=>l.name==='サンダー・ブレイク')&&getChainResponsesV2(1).some(x=>x.db.n==='サンダー・ブレイク')){duelActivateResponseV2(1,'sz',0);continue;}
    chainPassV2();continue;}
  const pw=gameState.processorWaiting; if(pw&&pw.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  break;}
ok('C: サンダー・ブレイク destroyed ライブラリアン in response → its draw does not happen',z(lib2)==='grave'&&chainAdds().includes('サンダー・ブレイク')&&names(0,'hand').length===0,JSON.stringify({lib:z(lib2),h:names(0,'hand'),adds:chainAdds()}));
audit('C left');
`);

/* ===== D. TG ワンダー・マジシャン: ① only for its own Synchro Summon (mandatory); ③ destroyed → draw (mandatory); ② ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const t=mk('TG ストライカー',0,'up'),n2=mk('TG ワーウルフ',0,'up');gameState.players[0].mz=[t,n2];
const wm=mk('TG ワンダー・マジシャン',0);gameState.players[0].ex=[wm];
const st=setc('聖なるバリア －ミラーフォース－',1);gameState.players[1].sz=[st];
baselineA();
ok('D: precondition — TG ストライカー (Tuner) + TG ワーウルフ make the Lv5 TG ワンダー・マジシャン',exCombos(0,dbOf(wm)).combos.length===1,JSON.stringify(exCombos(0,dbOf(wm)).combos));
synchro(0,wm,[t,n2]);
ok('D ①: Synchro Summoned → the opponent set Trap is destroyed (mandatory)',z(wm)==='mz'&&z(st)==='grave'&&chainAdds().includes('TG ワンダー・マジシャン'),JSON.stringify({wm:z(wm),st:z(st),adds:chainAdds()}));
audit('D ①');
/* another Synchro Summon while it is on the field → ① does not trigger */
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const wm2=mk('TG ワンダー・マジシャン',0,'up');const gb=mk('グローアップ・バルブ',0,'up'),w=mk('ワイト',0,'up');gameState.players[0].mz=[wm2,gb,w];
const f=mk('フォーミュラ・シンクロン',0);gameState.players[0].ex=[f];gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0)];
const st2=setc('聖なるバリア －ミラーフォース－',1);gameState.players[1].sz=[st2];
baselineA();
synchro(0,f,[gb,w]);
ok('D ①: another monster Synchro Summon does not trigger it',z(st2)==='sz'&&!chainAdds().includes('TG ワンダー・マジシャン'),JSON.stringify({st:z(st2),adds:chainAdds()}));
/* ③ destroyed on the field (by サンダー・ブレイク) → draw 1, mandatory; not activatable manually from the GY */
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
const wm3=mk('TG ワンダー・マジシャン',0,'up');gameState.players[0].mz=[wm3];gameState.players[0].deck=[mk('ワイトキング',0)];
gameState.players[1].sz=[setc('サンダー・ブレイク',1)];gameState.players[1].hand=[mk('ワイト',1)];
baselineA();
PREFER=[uid(wm3)];duelActivateFromZone(1,'sz',0);drive();PREFER=[];
ok('D ③: destroyed on the field → draws 1 (a chain link)',z(wm3)==='grave'&&names(0,'hand').join()==='ワイトキング'&&chainAdds().includes('TG ワンダー・マジシャン'),JSON.stringify({wm:z(wm3),h:names(0,'hand'),adds:chainAdds()}));
audit('D ③');
gameState.activePlayer=0;
ok('D ③: it cannot be activated manually from the GY afterwards',strictScriptLegalityV2('TG ワンダー・マジシャン',0,'grave',0,{}).ok===false);
/* ② in the opponent Main Phase (in response): Synchro Summon with it */
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
const wm4=mk('TG ワンダー・マジシャン',0,'up'),gw=mk('TG ワーウルフ',0,'up');gameState.players[0].mz=[wm4,gw];
const tr=mk('スターダスト・ドラゴン',0);gameState.players[0].ex=[tr];gameState.players[0].sz=[setc('聖なるバリア －ミラーフォース－',0)];
addCyclone();
baselineA();
oppSpellWindow();
ok('D ②: in response in the opponent Main Phase it is offered',getChainResponsesV2(0).some(x=>x.db.n==='TG ワンダー・マジシャン'),JSON.stringify(getChainResponsesV2(0).map(x=>x.db.n)));
duelActivateResponseV2(0,'mz',0);choose();drive();
ok('D ②: スターダスト・ドラゴン (Lv8 = 5+3) is Synchro Summoned with it; ③ does not trigger (material, not destroyed)',z(tr)==='mz'&&z(wm4)==='grave'&&chainAdds().filter(n=>n==='TG ワンダー・マジシャン').length===1,JSON.stringify({tr:z(tr),wm:z(wm4),adds:chainAdds()}));
audit('D ②');
`);

/* ===== E. TG パワー・グラディエイター: piercing; destroyed → draw (mandatory); no manual GY activation ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const pg=mk('TG パワー・グラディエイター',0,'up');gameState.players[0].mz=[pg];
const w=mk('ワイト',1,'up');w.pos='def';gameState.players[1].mz=[w];
baselineA();doPhase('battle');drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('E: piercing — 2300 vs DEF 200 → 2100 damage',gameState.players[1].lp===8000-2100&&z(w)==='grave',String(gameState.players[1].lp));
audit('E pierce');
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
const pg2=mk('TG パワー・グラディエイター',0,'up');gameState.players[0].mz=[pg2];gameState.players[0].deck=[mk('ワイトキング',0)];
gameState.players[1].sz=[setc('サンダー・ブレイク',1)];gameState.players[1].hand=[mk('ワイト',1)];
baselineA();
PREFER=[uid(pg2)];duelActivateFromZone(1,'sz',0);drive();PREFER=[];
ok('E: destroyed on the field → draws 1 (a chain link)',z(pg2)==='grave'&&names(0,'hand').join()==='ワイトキング'&&chainAdds().includes('TG パワー・グラディエイター'),JSON.stringify({h:names(0,'hand'),adds:chainAdds()}));
audit('E draw');
gameState.activePlayer=0;
ok('E: not activatable manually from the GY',strictScriptLegalityV2('TG パワー・グラディエイター',0,'grave',0,{}).ok===false);
`);
