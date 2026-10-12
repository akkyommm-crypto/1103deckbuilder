/* S03-U327: 氷結界の封魔団 / 風水師 and 墓守の監視者 — the two-player Spell lock, the declared-Attribute attack restriction, the hand-discard negation. Real DUEL paths, Replay-audited. */
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
function pick(){const q=pc();
  const find=u=>q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));
  if(q.max>1){let ks=[];for(const u of PREFER){const c=find(u);if(c&&ks.indexOf(c.key)<0)ks.push(c.key);}ks=ks.slice(0,q.max);for(const c of q.candidates){if(ks.length>=q.min)break;if(ks.indexOf(c.key)<0)ks.push(c.key);}PREFER=PREFER.filter(u=>!find(u));answerChoiceV49(ks);return;}
  if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3270001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function actZ(zone,c){duelActivateFromZone(0,zone,idx(c));drive();}
function canZ(zone,c){return getLegalZoneActions(0,zone,idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function legalHand(name,p,i){const P=gameState.players[p],c=P.hand[i];return strictScriptLegalityV2(name,p,'hand',i,{cardOverride:c,logicalZone:'sz',prospectiveIndex:(P.sz||[]).length}).ok;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function toWindow(){for(let i=0;i<200;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
const USED=new Set();
function windows(use,seen){seen=seen||[];USED.clear();
  for(let i=0;i<60;i++){ if(!toWindow())break;
    let did=false;
    for(const c of use){ const o=findCardByUid(c.uid); if(!o||USED.has(c.uid))continue; if(offered(o.p,c)){seen.push(c.uid);USED.add(c.uid);duelActivateResponseV2(o.p,o.zone,o.index);did=true;break;} }
    if(!did)chainPassV2(); }
  drive();return seen;}
const ICE1='氷結界の番人ブリズド',ICE2='氷結界の守護陣';

/* ===== 封魔団 ===== */
{ fresh();const fm=mon('氷結界の封魔団',0),ih=mk(ICE1,0),s0=mk('おろかな埋葬',0),s1=mk('おろかな埋葬',1);
  gameState.players[0].mz=[fm];gameState.players[0].hand=[ih,s0];gameState.players[1].hand=[s1];baselineA();
  ok('封魔団: available with a 「氷結界」 monster in the hand',canZ('mz',fm)===true,'');
  PREFER=[uid(ih)];actZ('mz',fm);PREFER=[];
  ok('封魔団: the 「氷結界」 monster sent to the Graveyard (cost)',z(ih)==='grave',z(ih));
  ok('封魔団: once per turn; my own Spell cannot be activated now',canZ('mz',fm)===false&&legalHand('おろかな埋葬',0,gameState.players[0].hand.indexOf(s0))===false,'');
  audit('封魔団');
  endTurn();
  ok('封魔団: the opponent\'s Spell cannot be activated on his turn',legalHand('おろかな埋葬',1,0)===false,'');
  endTurn();
  ok('封魔団: still locked in my next turn (until its End Phase)',legalHand('おろかな埋葬',0,gameState.players[0].hand.indexOf(s0))===false,'');
  endTurn();
  ok('封魔団: lifted afterwards (the opponent can activate)',legalHand('おろかな埋葬',1,0)===true,''); }
{ fresh();const fm=mon('氷結界の封魔団',0),ih=mk(ICE1,0),s1=mk('おろかな埋葬',1),bh=mk('ブラック・ホール',1);
  gameState.players[0].mz=[fm];gameState.players[0].hand=[ih];gameState.players[1].hand=[s1,bh];baselineA();
  PREFER=[uid(ih)];actZ('mz',fm);PREFER=[];
  endTurn();
  gameState.players[0].mz=[];
  ok('封魔団: the lock is gone when it leaves the field',legalHand('おろかな埋葬',1,0)===true,''); }
{ fresh();const fm=mon('氷結界の封魔団',0),w=mk('ワイト',0);gameState.players[0].mz=[fm];gameState.players[0].hand=[w];baselineA();
  ok('封魔団 negative: no 「氷結界」 monster in the hand → not available',canZ('mz',fm)===false,''); }

/* ===== 風水師 ===== */
{ fresh();const fs=mon('氷結界の風水師',0),hf=mk('ワイト',0),wy=mon('ワイト',0),f1=mon('青眼の白龍',1),f2=mon('ワイト',1);
  gameState.players[0].mz=[fs,wy];gameState.players[0].hand=[hf];gameState.players[1].mz=[f1,f2];baselineA();
  PREFER=['光'];actZ('mz',fs);PREFER=[];
  ok('風水師: discarded 1 hand card (cost), declared 光',z(hf)==='grave'&&C(fs).u327Attr==='光',JSON.stringify({hf:z(hf),attr:C(fs)&&C(fs).u327Attr}));
  audit('風水師');
  endTurn();
  const t1=battleTargetsV29(f1.uid).targets.map(x=>x.card.uid),t2=battleTargetsV29(f2.uid).targets.map(x=>x.card.uid);
  ok('風水師: the 光 monster (青眼) cannot choose it as an attack target; the 闇 monster can',t1.indexOf(fs.uid)<0&&t1.indexOf(wy.uid)>=0&&t2.indexOf(fs.uid)>=0,JSON.stringify({t1,t2})); }
{ fresh();const fs=mon('氷結界の風水師',0),hf=mk('ワイト',0);gameState.players[0].mz=[fs];gameState.players[0].hand=[hf,mk('ワイト',0)];baselineA();
  PREFER=['光'];actZ('mz',fs);PREFER=[];
  ok('風水師: a second use is not available (once while face-up)',canZ('mz',fs)===false,''); }
{ fresh();const fs=mon('氷結界の風水師',0);gameState.players[0].mz=[fs];baselineA();
  ok('風水師 negative: no hand card to discard → not available',canZ('mz',fs)===false,''); }

/* ===== 墓守の監視者 ===== */
{ fresh();const kn=mk('墓守の監視者',0),dd=mk('手札抹殺',1),x0=mk('ワイト',0),x1=mk('ワイト',1);
  gameState.players[0].hand=[kn,x0];gameState.players[1].hand=[dd,x1];gameState.activePlayer=1;baselineA();
  duelActivateFromHand(gameState.players[1].hand.indexOf(dd));
  const seen=windows([kn]);
  ok('監視者: offered when the opponent activated 手札抹殺 (it discards his own hand); used: itself to the Graveyard, the activation negated and 手札抹殺 destroyed (nobody discarded)',seen.indexOf(kn.uid)>=0&&z(kn)==='grave'&&z(dd)==='grave'&&z(x0)==='hand'&&z(x1)==='hand',JSON.stringify({seen,kn:z(kn),dd:z(dd),x0:z(x0),x1:z(x1)}));
  audit('監視者'); }
{ fresh();const kn=mk('墓守の監視者',0),sp=mk('サイクロン',1),ft=mk('サイクロン',0,'down');ft.setTurn=3;
  gameState.players[0].hand=[kn];gameState.players[0].sz=[ft];gameState.players[1].hand=[sp];gameState.activePlayer=1;baselineA();
  duelActivateFromHand(0);toWindow();
  ok('監視者 negative: an activation that does not discard from the hand (サイクロン) → not offered',offered(0,kn)===false,'');drive(); }
{ fresh();const kn=mk('墓守の監視者',0),dd=mk('手札抹殺',0);
  gameState.players[0].hand=[kn,dd];baselineA();
  duelActivateFromHand(gameState.players[0].hand.indexOf(dd));toWindow();
  ok('監視者 negative: my own 手札抹殺 (it reacts to the opponent only) → not offered to me',offered(0,kn)===false,'');drive(); }

console.log('U327 done');
`);
