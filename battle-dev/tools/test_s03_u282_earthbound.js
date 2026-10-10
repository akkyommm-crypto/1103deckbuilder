/* S03-U282: 「地縛神」 common clauses — only one face-up, destroyed without a face-up Field Spell, not an attack target, direct attack; 地縛神 Ccapac Apu, 地縛大神官 (2011 texts).
   Real DUEL paths (summon legality, activation, flips, battle), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function pl(c){const hh=findCardByUid(c.uid);return hh?hh.p:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[];
function step(){const q=pc();if(!q)return false;
  const find=u=>q.candidates.find(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));
  if(q.max>1||q.min!==q.max){
    let ks=[];for(const u of PREFER){const c=find(u);if(c&&ks.indexOf(c.key)<0)ks.push(c.key);}
    ks=ks.slice(0,q.max);for(const c of q.candidates){if(ks.length>=q.min)break;if(ks.indexOf(c.key)<0)ks.push(c.key);}
    PREFER=PREFER.filter(u=>!find(u));answerChoiceV49(ks);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function lp(p){return gameState.players[p].lp;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function castOpen(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);PREFER=[];}
function legalHand(name,p,i){const P=gameState.players[p],c=P.hand[i];return strictScriptLegalityV2(name,p,'hand',i,{cardOverride:c,logicalZone:'sz',prospectiveIndex:(P.sz||[]).length});}
function hitT(p,a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:findCardByUid(a.uid).index,target:t==='direct'?'direct':findCardByUid(t.uid).index});drive();}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function nextTurn(){toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();}
/* the cards in use respond in the chain windows (each at most once); the others pass */
const USED=new Set();
function windows(use,seen){seen=seen||[];USED.clear();
  for(let i=0;i<60;i++){ if(!toWindow())break;
    let did=false;
    for(const c of use){ const o=findCardByUid(c.uid); if(!o||USED.has(c.uid))continue; if(offered(o.p,c)){seen.push(c.uid);USED.add(c.uid);duelActivateResponseV2(o.p,o.zone,o.index);did=true;break;} }
    if(!did)chainPassV2(); }
  drive();return seen;}
/* player ap attacks; player rp responds at the first POINT matching want(payload) with the card at (zone,i) */
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(!step())break;}
  return done;}
const CA='地縛神 Ccapac Apu';
function hacts(p,c){const i=gameState.players[p].hand.findIndex(x=>x.uid===c.uid);return i<0?[]:getLegalHandActions(p,i).map(x=>x.id);}
function fieldSp(p){const f=up('山',p);gameState.players[p].field=f;return f;}
/* ===== U1: only one face-up 「地縛神」 — a second cannot be Normal Summoned (either side), but it can be Set ===== */
fresh();
fieldSp(0);let ca1=up(CA,0),ca2=mk(CA,0),t1=up('ワイト',0),t2=up('ワイト',0);gameState.players[0].mz=[ca1,t1,t2];gameState.players[0].hand=[ca2];baselineA();
ok('U1: with a face-up 地縛神 on the field, another 地縛神 cannot be Normal Summoned; it can be Set',!hacts(0,ca2).includes('normalSummon')&&hacts(0,ca2).includes('setMonster'),JSON.stringify(hacts(0,ca2)));
fresh();
fieldSp(0);ca1=up(CA,1);ca2=mk(CA,0);t1=up('ワイト',0);t2=up('ワイト',0);gameState.players[1].mz=[ca1];gameState.players[0].mz=[t1,t2];gameState.players[0].hand=[ca2];baselineA();
ok('U1: the opponent’s face-up 地縛神 blocks it too',!hacts(0,ca2).includes('normalSummon'),JSON.stringify(hacts(0,ca2)));
fresh();
fieldSp(0);ca2=mk(CA,0);t1=up('ワイト',0);t2=up('ワイト',0);gameState.players[0].mz=[t1,t2];gameState.players[0].hand=[ca2];baselineA();
ok('U1: with none face-up, it can be Normal Summoned (2 Tributes)',hacts(0,ca2).includes('normalSummon'),JSON.stringify(hacts(0,ca2)));
/* U2: flip — a face-down 地縛神 cannot be Flip Summoned while another is face-up; turned face-up by 太陽の書 it is destroyed */
fresh();
fieldSp(0);let fd=mk(CA,0,'down');fd.pos='def';fd.setTurn=3;ca1=up(CA,1);let sb=mk('太陽の書',0);gameState.players[0].mz=[fd];gameState.players[1].mz=[ca1];gameState.players[0].hand=[sb];baselineA();
ok('U2: Flip Summon refused while the opponent has a face-up 地縛神',!canFlipSummonLegal(C(fd),0));
PREFER=[fd.uid];cast(0,'太陽の書');PREFER=[];
ok('U2: turned face-up by 太陽の書 — destroyed (only one face-up 地縛神); the opponent’s stays',z(fd)==='grave'&&z(ca1)==='mz',JSON.stringify({fd:z(fd),ca1:z(ca1)}));
audit('U2');

/* ===== F: no face-up Field Spell → destroyed; 地縛大神官 prevents destruction by its own effect ===== */
fresh();
let fs=fieldSp(0);ca1=up(CA,0);let cy=mk('サイクロン',0);gameState.players[0].mz=[ca1];gameState.players[0].hand=[cy];baselineA();
PREFER=[fs.uid];cast(0,'サイクロン');PREFER=[];
ok('F1: the Field Spell destroyed — 地縛神 Ccapac Apu is destroyed by its own effect',z(fs)==='grave'&&z(ca1)==='grave'&&C(ca1).graveInfo&&C(ca1).graveInfo.byDestroy===true,JSON.stringify({fs:z(fs),ca:z(ca1)}));
audit('F1');
fresh();
fs=fieldSp(0);ca1=up(CA,0);let hp=up('地縛大神官',0);cy=mk('サイクロン',0);gameState.players[0].mz=[ca1,hp];gameState.players[0].hand=[cy];baselineA();
PREFER=[fs.uid];cast(0,'サイクロン');PREFER=[];
ok('F2: with 地縛大神官 face-up, it is not destroyed by its own effect',z(fs)==='grave'&&z(ca1)==='mz',JSON.stringify({fs:z(fs),ca:z(ca1)}));
audit('F2');
fresh();
fs=fieldSp(1);ca1=up(CA,0);gameState.players[0].mz=[ca1];baselineA();
API.damageLP(1,0);
ok('F3: the opponent’s face-up Field Spell counts — it stays',z(ca1)==='mz');

/* ===== A: the opponent cannot target it for attacks; it can attack directly; its battle-destruction burn ===== */
fresh();
gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
fieldSp(0);ca1=up(CA,0);let fo=up('ジェネティック・ワーウルフ',1);gameState.players[0].mz=[ca1];gameState.players[1].mz=[fo];baselineA();
hitT(1,fo,ca1);
ok('A1: the opponent’s attack on it is refused (not selectable)',z(ca1)==='mz'&&lp(0)===8000&&!C(fo).attacked,JSON.stringify({lp0:lp(0),att:C(fo).attacked}));
fresh();
gameState.phase='battle';
fieldSp(0);ca1=up(CA,0);let wy=up('ワイト',1);gameState.players[0].mz=[ca1];gameState.players[1].mz=[wy];baselineA();
hitT(0,ca1,'direct');
ok('A2: it attacks directly although the opponent has a monster (3000)',lp(1)===5000,String(lp(1)));
audit('A2');
fresh();
gameState.phase='battle';
fieldSp(0);ca1=up(CA,0);let gwo=up('ジェネティック・ワーウルフ',1);gameState.players[0].mz=[ca1];gameState.players[1].mz=[gwo];baselineA();
hitT(0,ca1,gwo);
ok('A3: it destroys ジェネティック・ワーウルフ (2000) by battle — 1000 battle damage + 2000 (its original ATK)',z(gwo)==='grave'&&lp(1)===5000,JSON.stringify({gw:z(gwo),lp1:lp(1)}));
audit('A3');
`);
