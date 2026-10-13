/* S03-U310: トゥーン monsters, part 2 — トゥーン・デーモン, トゥーン・マーメイド, トゥーン・ドラゴン・エッガー, トゥーン・ブラック・マジシャン・ガール, ブルーアイズ・トゥーン・ドラゴン.
   Real DUEL path (the Special Summon procedure from the hand with its release cost, Battle Phase attacks with the 500 LP cost and the attack-target rule, サイクロン on トゥーン・ワールド),
   Replay-audited. 通常召喚できない; special-summon-only turn ban; direct attack / must attack a Toon; destroyed with トゥーン・ワールド; BMG ATK per 「ブラック・マジシャン」/「カオス」 in the GYs. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3100001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function attackers(){return battleAttackersV29(0).map(x=>x.card.uid);}
function direct(c){return battleTargetsV29(c.uid).direct;}
function tgts(c){return battleTargetsV29(c.uid).targets.map(x=>x.card.uid);}
function atkDirect(c){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:'direct'});drive();}
function world(p){const w=mk('トゥーン・ワールド',p,'up');gameState.players[p].sz.push(w);return w;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function legalP(name){return strictSummonProcedureLegality(name,0,'hand',0);}
function procedure(name,prefer){PREFER=(prefer||[]).map(uid);runSummonProcedure(name,0,'hand',0);finishSummonProcedure(name,0,'hand',0,'atk');drive();PREFER=[];}
const DEMON='トゥーン・デーモン',MER='トゥーン・マーメイド',EGG='トゥーン・ドラゴン・エッガー',BMG='トゥーン・ブラック・マジシャン・ガール',BEWD='ブルーアイズ・トゥーン・ドラゴン';
const SPEC=[[DEMON,1,2500],[MER,0,1400],[EGG,2,2200],[BMG,1,2000],[BEWD,2,3000]];

/* ===== Special Summon procedure ===== */
for(const [n,rel,atk] of SPEC){
  /* no トゥーン・ワールド → refused */
  fresh();let t=mk(n,0);gameState.players[0].hand=[t];gameState.players[0].mz=[mon('ワイト',0),mon('ワイト',0)];baselineA();
  ok('proc('+n+'): refused without トゥーン・ワールド',legalP(n).ok===false,JSON.stringify(legalP(n)));
  ok('proc('+n+'): cannot be Normal Summoned',cannotNormalSummonS03(dbOf(t))===true);
  /* with トゥーン・ワールド: summoned, releasing exactly '+rel+' monsters */
  fresh();t=mk(n,0);const a=mon('ライオウ',0),b=mon('ワイト',0),c=mon('ワイト',0);gameState.players[0].hand=[t];gameState.players[0].mz=[a,b,c];world(0);baselineA();
  procedure(n,[a,b]);
  const gone=[a,b,c].filter(x=>z(x)==='grave').length;
  ok('proc('+n+'): Special Summoned from the hand, '+rel+' monster(s) released',z(t)==='mz'&&gone===rel,JSON.stringify({t:z(t),gone}));
  if(rel>=1) ok('proc('+n+'): the chosen monsters were released (first choice first)',z(a)==='grave'&&(rel<2||z(b)==='grave'),JSON.stringify([z(a),z(b),z(c)]));
  ok('proc('+n+'): printed ATK '+atk,curATK(C(t))===atk||n===BMG,String(curATK(C(t))));
  audit('proc('+n+')');
  /* not enough monsters to release */
  if(rel>=1){ fresh();t=mk(n,0);gameState.players[0].hand=[t];gameState.players[0].mz=rel===2?[mon('ワイト',0)]:[];world(0);baselineA();
    ok('proc('+n+'): refused with fewer than '+rel+' releasable monster(s)',legalP(n).ok===false,JSON.stringify(legalP(n))); }
  /* a full Monster Zone is no obstacle when the procedure releases */
  if(rel>=1){ fresh();t=mk(n,0);gameState.players[0].hand=[t];gameState.players[0].mz=Array.from({length:5},()=>mon('ワイト',0));world(0);baselineA();
    ok('proc('+n+'): full Monster Zone → still legal (the release frees a zone)',legalP(n).ok===true,JSON.stringify(legalP(n)));
    procedure(n);
    ok('proc('+n+'): summoned into the freed zone',z(t)==='mz'&&gameState.players[0].mz.length===5-rel+1,JSON.stringify([z(t),gameState.players[0].mz.length]));
    audit('proc-full('+n+')'); }
  /* a full zone with the Mermaid (no release) → refused */
  if(rel===0){ fresh();t=mk(n,0);gameState.players[0].hand=[t];gameState.players[0].mz=Array.from({length:5},()=>mon('ワイト',0));world(0);baselineA();
    ok('proc('+n+'): full Monster Zone and no release → refused',legalP(n).ok===false,JSON.stringify(legalP(n))); }
}

/* ===== the turn it was Special Summoned: no attack (BMG excepted); an older one attacks, paying 500 LP ===== */
for(const [n,rel] of SPEC){
  fresh();const t=mk(n,0),x=mon('ライオウ',0),y=mon('ワイト',0);gameState.players[0].hand=[t];gameState.players[0].mz=[x,y];world(0);baselineA();
  procedure(n,[y,x]);phase('battle');
  const can=attackers().indexOf(t.uid)>=0;
  ok('ban('+n+'): '+(n===BMG?'can attack on the turn it was Special Summoned (no such clause)':'cannot attack on the turn it was Special Summoned'),n===BMG?can:!can,JSON.stringify(attackers()));
}
for(const [n,rel] of SPEC){
  fresh();const t=mon(n,0);gameState.players[0].mz=[t];world(0);baselineA();phase('battle');
  const l0=lp(0),l1=lp(1);atkDirect(t);
  const cost=(n===BMG)?0:500;
  ok('cost('+n+'): direct attack, '+cost+' LP paid at the declaration',lp(0)===l0-cost&&lp(1)<l1,JSON.stringify([l0,lp(0),l1,lp(1)]));
  audit('cost('+n+')');
}
{ fresh();const t=mon(DEMON,0);gameState.players[0].mz=[t];gameState.players[0].lp=400;world(0);baselineA();phase('battle');
  ok('cost: with 400 LP (< 500) the Toon cannot declare an attack',attackers().indexOf(t.uid)<0,JSON.stringify(attackers())); }

/* ===== direct attack / must attack a Toon ===== */
for(const [n] of SPEC){
  fresh();const t=mon(n,0),w=mon('ワイト',1);gameState.players[0].mz=[t];gameState.players[1].mz=[w];baselineA();phase('battle');
  ok('target('+n+'): no opposing Toon → direct attack although a non-Toon is there (no トゥーン・ワールド needed to attack)',direct(t)===true,String(direct(t)));
  fresh();const t2=mon(n,0),w2=mon('ワイト',1),tw=mon('トゥーン・マーメイド',1);gameState.players[0].mz=[t2];gameState.players[1].mz=[w2,tw];baselineA();phase('battle');
  ok('target('+n+'): an opposing Toon → no direct attack, only the Toon can be chosen',direct(t2)===false&&JSON.stringify(tgts(t2))===JSON.stringify([tw.uid]),JSON.stringify({d:direct(t2),t:tgts(t2),toon:tw.uid}));
}
{ fresh();const t=mon(DEMON,0),w=mon('ワイト',1),tw=mon('トゥーン・マーメイド',1);tw.face='down';gameState.players[0].mz=[t];gameState.players[1].mz=[w,tw];baselineA();phase('battle');
  ok('target: a face-down monster is not a Toon monster → direct attack',direct(t)===true,String(direct(t))); }
{ fresh();const t=mon(DEMON,0),other=mon('ライオウ',0),w=mon('ワイト',1),tw=mon('トゥーン・マーメイド',1);gameState.players[0].mz=[t,other];gameState.players[1].mz=[w,tw];baselineA();phase('battle');
  ok('target: the rule is only for the Toon — ライオウ may still attack ワイト',tgts(other).indexOf(w.uid)>=0&&direct(other)===false,JSON.stringify(tgts(other))); }

/* ===== トゥーン・ワールド destroyed ===== */
{ fresh();const a=mon(DEMON,0),b=mon(BEWD,1),w=world(0),cy=mk('サイクロン',0,'up');gameState.players[0].hand=[cy];gameState.players[0].mz=[a];gameState.players[1].mz=[b];baselineA();
  PREFER=[uid(w)];duelActivateFromHand(0);drive();PREFER=[];
  ok('destroyed with トゥーン・ワールド: both Toon monsters (either player) are destroyed',z(w)==='grave'&&z(a)==='grave'&&z(b)==='grave',JSON.stringify([z(w),z(a),z(b)]));
  audit('world'); }

/* ===== トゥーン・ブラック・マジシャン・ガール: ATK per 「ブラック・マジシャン」 / 「マジシャン・オブ・ブラックカオス」 in both Graveyards ===== */
{ fresh();const t=mon(BMG,0);gameState.players[0].mz=[t];baselineA();
  ok('BMG: ATK 2000 with no such card in the GYs',curATK(C(t))===2000,String(curATK(C(t))));
  gameState.players[0].grave=[mk('ブラック・マジシャン',0),mk('ワイト',0)];gameState.players[1].grave=[mk('マジシャン・オブ・ブラックカオス',1),mk('ブラック・マジシャン',1)];
  ok('BMG: 3 cards in both GYs → ATK 2900',curATK(C(t))===2900,String(curATK(C(t))));
  /* (the Graveyards are set directly here — no Action, so no Replay audit for this check) */ }
`);
