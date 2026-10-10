/* S03-U267: 心鎮壷, A・O・J サウザンド・アームズ, エネルギー吸収板, 痛魂の呪術, ヴェノム・スワンプ, カーム・マジック, 白銀のバリア－シルバーフォース－ (2011 texts).
   Real DUEL paths (activation / POINT / chain windows / attacks / phases through the processor), Replay-audited. */
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
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
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
function lockWhy(p,c){return activationTypeLockReasonS03(p,C(c),z(c)==='sz'?'sz':z(c),dbOf(C(c)),{});}

/* ===== A: 心鎮壷 — two Set Spell/Trap cards on the field cannot be activated while it is face-up on the field ===== */
fresh();
let sh=setT('心鎮壷',0),c1=setT('サイクロン',1),c2=setT('サイクロン',1),c3=setT('サイクロン',1),mine=setT('サイクロン',0);
gameState.players[0].sz=[sh,mine];gameState.players[1].sz=[c1,c2,c3];baselineA();
PREFER=[c1.uid,c2.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('A: activated and resolved — it stays face-up on the field',z(sh)==='sz'&&C(sh).face==='up',JSON.stringify({z:z(sh),f:C(sh)&&C(sh).face}));
ok('A: it keeps the 2 chosen uids; each target keeps its uid',JSON.stringify((C(sh).stLinkTargetS03||[]).slice().sort())===JSON.stringify([c1.uid,c2.uid].sort())&&(C(c1).stLinkByS03||[])[0]===sh.uid&&(C(c2).stLinkByS03||[])[0]===sh.uid&&!C(c3).stLinkByS03,JSON.stringify({t:C(sh).stLinkTargetS03,b1:C(c1).stLinkByS03,b3:C(c3).stLinkByS03}));
ok('A: the two chosen cards are locked, the third Set card and its controller\'s own Set card are not',!!lockWhy(1,c1)&&!!lockWhy(1,c2)&&!lockWhy(1,c3)&&!lockWhy(0,mine),JSON.stringify({a:lockWhy(1,c1),b:lockWhy(1,c2),c:lockWhy(1,c3),d:lockWhy(0,mine)}));
nextTurn();toPhase('main1');
duelActivateFromZone(1,'sz',gameState.players[1].sz.indexOf(C(c1)));drive();
ok('A: on its opponent\'s turn the chosen Set サイクロン cannot be activated — it stays Set',z(c1)==='sz'&&C(c1).face==='down'&&z(mine)==='sz'&&z(sh)==='sz',JSON.stringify({c1:z(c1),f:C(c1).face,mine:z(mine)}));
audit('A');
PREFER=[sh.uid];duelActivateFromZone(1,'sz',gameState.players[1].sz.indexOf(C(c3)));drive();PREFER=[];
ok('A: the unchosen Set サイクロン is activated normally — it destroys 心鎮壷',z(c3)==='grave'&&z(sh)==='grave',JSON.stringify({c3:z(c3),sh:z(sh)}));
ok('A: with 心鎮壷 gone the chosen cards can be activated again',!lockWhy(1,c1)&&!lockWhy(1,c2),JSON.stringify({a:lockWhy(1,c1)}));
ok('A: the mark died with the trap (zone-local)',!C(sh).stLinkTargetS03);
/* A2: a target that leaves the field and is Set again is no longer locked */
fresh();
sh=setT('心鎮壷',0);c1=setT('サイクロン',1);c2=setT('サイクロン',1);gameState.players[0].sz=[sh];gameState.players[1].sz=[c1,c2];baselineA();
PREFER=[c1.uid,c2.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('A2: control — both locked',!!lockWhy(1,c1)&&!!lockWhy(1,c2));
gameState.activePlayer=1;gameState.turn=6;gameState.phase='main1';
API.returnToHand(findCardByUid(c1.uid),'test');
ok('A2: bounced — its zone-local mark is gone',z(c1)==='hand'&&!C(c1).stLinkByS03,JSON.stringify({z:z(c1),b:C(c1).stLinkByS03}));
doSetST(gameState.players[1].hand.indexOf(C(c1)));drive();
ok('A2: Set again — not locked any more; the other target still is',z(c1)==='sz'&&!lockWhy(1,c1)&&!!lockWhy(1,c2),JSON.stringify({z:z(c1),a:lockWhy(1,c1),b:lockWhy(1,c2)}));
/* A3: negatives for the activation itself */
fresh();
sh=setT('心鎮壷',0);c1=setT('サイクロン',1);gameState.players[0].sz=[sh];gameState.players[1].sz=[c1];baselineA();
ok('A3: only one other Set Spell/Trap on the field — it cannot be activated (it needs two)',!strictScriptLegalityV2('心鎮壷',0,'sz',0,{}).ok);
fresh();
sh=setT('心鎮壷',0);c1=setT('サイクロン',1);c2=mk('サイクロン',1,'up');gameState.players[0].sz=[sh];gameState.players[1].sz=[c1,c2];baselineA();
ok('A3: a face-up Spell is not a Set card — still only one candidate, not activatable',!strictScriptLegalityV2('心鎮壷',0,'sz',0,{}).ok);
fresh();
sh=setT('心鎮壷',0);c1=setT('サイクロン',1);c2=setT('サイクロン',1);c3=mk('ワイト',1,'down');gameState.players[0].sz=[sh];gameState.players[1].sz=[c1,c2];gameState.players[1].mz=[c3];baselineA();
ok('A3: with two Set Spell/Trap cards it is activatable (a Set monster does not count)',strictScriptLegalityV2('心鎮壷',0,'sz',0,{}).ok);

/* ===== B: A・O・J サウザンド・アームズ — attacks each opponent LIGHT monster once; destroyed before damage calculation when it battles a non-LIGHT monster ===== */
const LT='ウィング・エッグ・エルフ';
fresh();
let ar=up('A・O・J サウザンド・アームズ',0),l1=up(LT,1),l2=up(LT,1);gameState.players[0].mz=[ar];gameState.players[1].mz=[l1,l2];gameState.phase='battle';baselineA();
hitT(0,ar,l1);hitT(0,ar,l2);
ok('B1: it attacks both LIGHT monsters once each — both destroyed, 1200 + 1200 damage',z(l1)==='grave'&&z(l2)==='grave'&&lp(1)===8000-2400&&z(ar)==='mz',JSON.stringify({l1:z(l1),l2:z(l2),lp1:lp(1),ar:z(ar)}));
audit('B1');
fresh();
ar=up('A・O・J サウザンド・アームズ',0);l1=up(LT,1);let wt=up('ワイト',1);gameState.players[0].mz=[ar];gameState.players[1].mz=[l1,wt];gameState.phase='battle';baselineA();
hitT(0,ar,l1);
hitT(0,ar,wt);
ok('B2: after attacking the LIGHT monster it cannot attack the non-LIGHT ワイト (attack refused)',z(l1)==='grave'&&z(wt)==='mz'&&z(ar)==='mz'&&lp(0)===8000&&lp(1)===8000-1200,JSON.stringify({l1:z(l1),wt:z(wt),ar:z(ar),lp0:lp(0),lp1:lp(1)}));
ok('B2: the attack record holds the LIGHT monster only (the refused attack left no trace)',!!C(ar).attackAllS03&&C(ar).attackAllS03.uids.length===1&&C(ar).attackAllS03.uids[0]===l1.uid);
audit('B2');
fresh();
ar=up('A・O・J サウザンド・アームズ',0);l1=up(LT,1);wt=up('ワイト',1);gameState.players[0].mz=[ar];gameState.players[1].mz=[l1,wt];gameState.phase='battle';baselineA();
hitT(0,ar,wt);
ok('B3: attacking the non-LIGHT ワイト first — this card is destroyed before damage calculation (no damage to either side, ワイト survives)',z(ar)==='grave'&&z(wt)==='mz'&&lp(0)===8000&&lp(1)===8000,JSON.stringify({ar:z(ar),wt:z(wt),lp0:lp(0),lp1:lp(1)}));
audit('B3');
/* B4: it is attacked */
fresh();
ar=up('A・O・J サウザンド・アームズ',0);let bb=up('ベビードラゴン',1);gameState.players[0].mz=[ar];gameState.players[1].mz=[bb];gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';baselineA();
hitT(1,bb,ar);
ok('B4: attacked by a non-LIGHT monster — destroyed before damage calculation (no damage)',z(ar)==='grave'&&z(bb)==='mz'&&lp(0)===8000&&lp(1)===8000,JSON.stringify({ar:z(ar),bb:z(bb),lp0:lp(0)}));
fresh();
ar=up('A・O・J サウザンド・アームズ',0);l1=up(LT,1);gameState.players[0].mz=[ar];gameState.players[1].mz=[l1];gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';baselineA();
hitT(1,l1,ar);
ok('B4: attacked by a LIGHT monster — the normal battle: the LIGHT attacker is destroyed, 1200 damage to its controller',z(ar)==='mz'&&z(l1)==='grave'&&lp(1)===8000-1200,JSON.stringify({ar:z(ar),l1:z(l1),lp1:lp(1)}));
/* B5: face-down monsters are judged after the flip */
fresh();
ar=up('A・O・J サウザンド・アームズ',0);let fl=mk(LT,1,'down','def');fl.setTurn=3;gameState.players[0].mz=[ar];gameState.players[1].mz=[fl];gameState.phase='battle';baselineA();
hitT(0,ar,fl);
ok('B5: a face-down LIGHT monster is flipped, then battled normally — it is destroyed, this card survives',z(fl)==='grave'&&z(ar)==='mz',JSON.stringify({fl:z(fl),ar:z(ar)}));
audit('B5');
fresh();
ar=up('A・O・J サウザンド・アームズ',0);let fw=mk('ワイト',1,'down','def');fw.setTurn=3;gameState.players[0].mz=[ar];gameState.players[1].mz=[fw];gameState.phase='battle';baselineA();
hitT(0,ar,fw);
ok('B5: a face-down non-LIGHT monster is flipped — this card is destroyed before damage calculation, the flipped ワイト stays face-up',z(ar)==='grave'&&z(fw)==='mz'&&C(fw).face==='up',JSON.stringify({ar:z(ar),fw:z(fw),f:C(fw)&&C(fw).face}));
audit('B5b');
/* B6: direct attack with an empty opposing field is the normal rule */
fresh();
ar=up('A・O・J サウザンド・アームズ',0);gameState.players[0].mz=[ar];gameState.phase='battle';baselineA();
hitT(0,ar,'direct');
ok('B6: no opposing monster — a direct attack, 1700',lp(1)===8000-1700&&z(ar)==='mz',String(lp(1)));
audit('B6');

/* ===== C: エネルギー吸収板 — the damage the opponent's effect would inflict on its controller's opponent is gained instead (only that chain link) ===== */
/* C1: Spell (ファイヤー・ボール, 500) in the opponent's turn */
fresh();
gameState.activePlayer=1;gameState.turn=6;
let eb=setT('エネルギー吸収板',0),fb=mk('ファイヤー・ボール',1);gameState.players[0].sz=[eb];gameState.players[1].hand=[fb];baselineA();
castOpen(1,'ファイヤー・ボール');
ok('C1: the Spell is chained to — エネルギー吸収板 is offered in the chain window',toWindow()&&offered(0,eb));
windows([eb]);
ok('C1: the 500 damage was gained instead — own LP +500, the activator\'s LP untouched',lp(0)===8500&&lp(1)===8000&&z(eb)==='grave'&&z(fb)==='grave',JSON.stringify({lp0:lp(0),lp1:lp(1),eb:z(eb),fb:z(fb)}));
API.damageLP(0,300);
ok('C1: only that effect\'s damage — a later 300 effect damage is taken normally',lp(0)===8200,String(lp(0)));
audit('C1');
/* C2: a monster effect (キャノン・ソルジャー) */
fresh();
gameState.activePlayer=1;gameState.turn=6;
eb=setT('エネルギー吸収板',0);let cs=up('キャノン・ソルジャー',1),sac=up('ワイト',1);gameState.players[0].sz=[eb];gameState.players[1].mz=[cs,sac];baselineA();
PREFER=[sac.uid];duelActivateFromZone(1,'mz',0);windows([eb]);
ok('C2: the monster effect (cost: Tribute ワイト) — its 500 damage was gained instead',lp(0)===8500&&lp(1)===8000&&z(eb)==='grave'&&z(sac)==='grave'&&z(cs)==='mz',JSON.stringify({lp0:lp(0),lp1:lp(1),eb:z(eb),sac:z(sac)}));
audit('C2');
/* C3: negatives */
fresh();
gameState.activePlayer=1;gameState.turn=6;
eb=setT('エネルギー吸収板',0);let nd=mk('死者蘇生',1),gv=mk('ワイト',1);gameState.players[0].sz=[eb];gameState.players[1].hand=[nd];gameState.players[1].grave=[gv];baselineA();
PREFER=[gv.uid];cast(1,'死者蘇生');
let o3=false;for(let i=0;i<5;i++){if(!toWindow())break;o3=o3||offered(0,eb);chainPassV2();}drive();
ok('C3: an effect that inflicts no damage (死者蘇生) — not offered',!o3&&z(eb)==='sz');
fresh();
eb=setT('エネルギー吸収板',0);fb=mk('ファイヤー・ボール',0);gameState.players[0].sz=[eb];gameState.players[0].hand=[fb];baselineA();
cast(0,'ファイヤー・ボール');
o3=false;for(let i=0;i<5;i++){if(!toWindow())break;o3=o3||offered(0,eb);chainPassV2();}drive();
ok('C3: its own controller\'s damage effect — not offered; the opponent takes 500',!o3&&z(eb)==='sz'&&lp(1)===7500&&lp(0)===8000,JSON.stringify({o3,lp1:lp(1)}));
fresh();
gameState.activePlayer=1;gameState.turn=6;
eb=mk('エネルギー吸収板',0,'down');eb.setTurn=6;fb=mk('ファイヤー・ボール',1);gameState.players[0].sz=[eb];gameState.players[1].hand=[fb];baselineA();
cast(1,'ファイヤー・ボール');
o3=false;for(let i=0;i<5;i++){if(!toWindow())break;o3=o3||offered(0,eb);chainPassV2();}drive();
ok('C3: control — Set this very turn it cannot be activated (and the damage is taken): LP -500',!o3&&lp(0)===7500,JSON.stringify({o3,lp0:lp(0)}));

/* ===== D: 痛魂の呪術 — that effect's damage to us is taken by its activator instead ===== */
fresh();
gameState.activePlayer=1;gameState.turn=6;
let tk=setT('痛魂の呪術',0);fb=mk('ファイヤー・ボール',1);gameState.players[0].sz=[tk];gameState.players[1].hand=[fb];baselineA();
castOpen(1,'ファイヤー・ボール');
ok('D1: the Quick-Play Spell (Set) is offered against the opponent\'s Spell',toWindow()&&offered(0,tk));
windows([tk]);
ok('D1: the damage was taken by the activator instead: its LP 7500, own LP untouched',lp(0)===8000&&lp(1)===7500&&z(tk)==='grave',JSON.stringify({lp0:lp(0),lp1:lp(1),tk:z(tk)}));
API.damageLP(0,300);
ok('D1: only that effect\'s damage — a later effect damage is taken normally',lp(0)===7700,String(lp(0)));
audit('D1');
/* D2: monster effect */
fresh();
gameState.activePlayer=1;gameState.turn=6;
tk=setT('痛魂の呪術',0);cs=up('キャノン・ソルジャー',1);sac=up('ワイト',1);gameState.players[0].sz=[tk];gameState.players[1].mz=[cs,sac];baselineA();
PREFER=[sac.uid];duelActivateFromZone(1,'mz',0);windows([tk]);
ok('D2: キャノン・ソルジャー\'s damage is redirected to its controller',lp(0)===8000&&lp(1)===7500&&z(tk)==='grave',JSON.stringify({lp0:lp(0),lp1:lp(1)}));
audit('D2');
/* D3: from the hand, in the controller\'s own turn, against the opponent\'s Trap (チェーン・ブラスト) activated at the attack declaration */
fresh();
let ha=mk('痛魂の呪術',0),cb=setT('チェーン・ブラスト',1),at0=up('ベビードラゴン',0);gameState.players[0].hand=[ha];gameState.players[0].mz=[at0];gameState.players[1].sz=[cb];gameState.phase='battle';baselineA();
const doneD3=attackRespond(0,at0,'direct',1,p=>p.kind==='attackDeclare','sz',0);
ok('D3: the opponent activated チェーン・ブラスト at the attack declaration',doneD3&&toWindow());
ok('D3: 痛魂の呪術 is offered from the hand in its own turn',offered(0,ha));
windows([ha]);
ok('D3: 500 damage taken by the Trap\'s activator, then the direct attack goes through',lp(0)===8000&&lp(1)===8000-500-1200&&z(ha)==='grave',JSON.stringify({lp0:lp(0),lp1:lp(1),ha:z(ha)}));
audit('D3');
/* D4: negatives */
fresh();
gameState.activePlayer=1;gameState.turn=6;
tk=setT('痛魂の呪術',0);nd=mk('死者蘇生',1);gv=mk('ワイト',1);gameState.players[0].sz=[tk];gameState.players[1].hand=[nd];gameState.players[1].grave=[gv];baselineA();
PREFER=[gv.uid];cast(1,'死者蘇生');
o3=false;for(let i=0;i<5;i++){if(!toWindow())break;o3=o3||offered(0,tk);chainPassV2();}drive();
ok('D4: an effect that inflicts no damage — not offered',!o3&&z(tk)==='sz');
fresh();
tk=setT('痛魂の呪術',0);fb=mk('ファイヤー・ボール',0);gameState.players[0].sz=[tk];gameState.players[0].hand=[fb];baselineA();
cast(0,'ファイヤー・ボール');
o3=false;for(let i=0;i<5;i++){if(!toWindow())break;o3=o3||offered(0,tk);chainPassV2();}drive();
ok('D4: its own controller\'s damage effect — not offered',!o3&&z(tk)==='sz'&&lp(1)===7500);

/* ===== E: ヴェノム・スワンプ — a Venom Counter on every face-up non-「ヴェノム」 monster at each End Phase; -500 ATK per counter; 0 ATK by it destroys ===== */
fresh();
let sw=mk('ヴェノム・スワンプ',0),m1=up('ワイト',0),m2=up('ベビードラゴン',0),v1=up('ヴェノム・コブラ',1),m3=up('青眼の白龍',1),m4=up('おジャマ・イエロー',1),dn=mk('ワイト',1,'down','def');dn.setTurn=3;
gameState.players[0].hand=[sw];gameState.players[0].mz=[m1,m2];gameState.players[1].mz=[v1,m3,m4,dn];baselineA();
ok('E0: the 「ヴェノム」 predicate (GROUP.VENOM) holds for ヴェノム・コブラ only',isCardInGroupV4(dbOf(C(v1)),GROUP.VENOM)&&!isCardInGroupV4(dbOf(C(m3)),GROUP.VENOM));
cast(0,'ヴェノム・スワンプ');
ok('E1: activated from the hand in the Main Phase — on the field, no counter yet',gameState.players[0].field&&gameState.players[0].field.uid===sw.uid&&!C(m2).counters&&curATK(C(m2))===1200,JSON.stringify({f:!!gameState.players[0].field,c:C(m2).counters}));
toPhase('end');
const cnt=c=>(C(c)&&C(c).counters&&C(c).counters['ヴェノム'])||0;
ok('E2: own End Phase — a counter on every face-up non-Venom monster, both sides (ベビードラゴン, 青眼, おジャマ・イエロー)',cnt(m2)===1&&cnt(m3)===1&&cnt(m4)===1,JSON.stringify({m2:cnt(m2),m3:cnt(m3),m4:cnt(m4)}));
ok('E2: not on the 「ヴェノム」 monster nor on the face-down monster',cnt(v1)===0&&cnt(dn)===0,JSON.stringify({v1:cnt(v1),dn:cnt(dn)}));
ok('E2: -500 ATK per counter (ベビードラゴン 700, 青眼 2500); the Venom monster keeps 100',curATK(C(m2))===700&&curATK(C(m3))===2500&&curATK(C(v1))===100,JSON.stringify({a:curATK(C(m2)),b:curATK(C(m3)),c:curATK(C(v1))}));
ok('E2: ワイト (300 → 0 by this effect) is destroyed right after; おジャマ・イエロー (0 ATK before) is not',z(m1)==='grave'&&z(m4)==='mz'&&cnt(m4)===1,JSON.stringify({m1:z(m1),m4:z(m4)}));
nextTurn();
toPhase('end');
ok('E3: the opponent\'s End Phase too — second counters (ベビードラゴン 200, 青眼 2000)',cnt(m2)===2&&cnt(m3)===2&&curATK(C(m2))===200&&curATK(C(m3))===2000&&z(m2)==='mz',JSON.stringify({m2:cnt(m2),a:curATK(C(m2)),b:curATK(C(m3))}));
nextTurn();
toPhase('end');
ok('E4: the third counter takes ベビードラゴン from 200 to 0 — destroyed; 青眼 is at 1500',z(m2)==='grave'&&cnt(m3)===3&&curATK(C(m3))===1500,JSON.stringify({m2:z(m2),a:curATK(C(m3))}));
audit('E');
/* E5: the ATK loss lasts only while the Field Spell is face-up; the counters stay */
API.destroy(findCardByUid(sw.uid),'test');
ok('E5: Field Spell gone — 青眼 back to 3000, its 3 counters stay',z(sw)==='grave'&&curATK(C(m3))===3000&&cnt(m3)===3,JSON.stringify({a:curATK(C(m3)),c:cnt(m3)}));
/* E6: a Set Field Spell does nothing */
fresh();
sw=mk('ヴェノム・スワンプ',0,'down');sw.setTurn=3;m2=up('ベビードラゴン',0);gameState.players[0].field=sw;gameState.players[0].mz=[m2];baselineA();
toPhase('end');
ok('E6: face-down Field Spell — no counter at the End Phase',!C(m2).counters&&curATK(C(m2))===1200);
/* E7: no face-up non-Venom monster — nothing happens (and no error) */
fresh();
sw=mk('ヴェノム・スワンプ',0);v1=up('ヴェノム・コブラ',0);gameState.players[0].field=sw;gameState.players[0].mz=[v1];baselineA();
toPhase('end');
ok('E7: only a 「ヴェノム」 monster — no counter',!C(v1).counters);
audit('E7');

/* ===== F: カーム・マジック — at the start of Main Phase 1: no Normal / Flip / Special Summon by either player in the Main Phases and the Battle Phase ===== */
fresh();
let cm=mk('カーム・マジック',0),h1=mk('ベビードラゴン',0),h2=mk('ワイト',0),sd=setT('ワイト',0);sd.pos='def';let o1=mk('ベビードラゴン',1),o2=mk('ワイト',1);
gameState.players[0].hand=[cm,h1,h2];gameState.players[0].mz=[sd];gameState.players[1].hand=[o1,o2];baselineA();
cast(0,'カーム・マジック');
const tf0=()=>gameState.players[0].temporaryFlags||{},tf1=()=>gameState.players[1].temporaryFlags||{};
ok('F1: it resolved (GY) — both players are banned from summoning',z(cm)==='grave'&&!!tf0().noSummonS03&&!!tf1().noSummonS03&&!!tf0().noSpecialSummon&&!!tf1().noSpecialSummon,JSON.stringify({t0:tf0(),t1:tf1()}));
doNormalSummon(gameState.players[0].hand.indexOf(C(h1)),'atk');drive();
ok('F1: no Normal Summon (Main Phase 1)',z(h1)==='hand');
doFlipUp(0,'mz',0,'atk');drive();
ok('F1: no Flip Summon',C(sd).face==='down'&&z(sd)==='mz');
ok('F1: no Special Summon — either player',API.specialSummon(0,'hand',gameState.players[0].hand.indexOf(C(h2)),'atk','test')===false&&API.specialSummon(1,'hand',0,'atk','test')===false&&z(h2)==='hand'&&z(o1)==='hand');
toPhase('battle');
ok('F1: nor in the Battle Phase',!API.specialSummon(0,'hand',gameState.players[0].hand.indexOf(C(h2)),'atk','test')&&z(h2)==='hand'&&!!tf0().noSpecialSummon);
toPhase('main2');
doNormalSummon(gameState.players[0].hand.indexOf(C(h1)),'atk');drive();
ok('F1: nor in Main Phase 2',z(h1)==='hand');
audit('F1');
toPhase('end');
ok('F2: the End Phase — the ban is lifted (flags gone for both players)',!tf0().noSummonS03&&!tf1().noSummonS03&&!tf0().noSpecialSummon&&!tf1().noSpecialSummon,JSON.stringify({t0:tf0(),t1:tf1()}));
ok('F2: a Special Summon in the End Phase is possible again',API.specialSummon(0,'hand',gameState.players[0].hand.indexOf(C(h2)),'atk','test')!==false&&z(h2)==='mz',z(h2));
nextTurn();
ok('F3: next turn (opponent) — no ban',!tf0().noSummonS03&&!tf1().noSummonS03&&gameState.activePlayer===1);
/* F4: negatives — only at the start of Main Phase 1 */
fresh();
cm=mk('カーム・マジック',0);h1=mk('ベビードラゴン',0);gameState.players[0].hand=[cm,h1];baselineA();
ok('F4: control — at the start of Main Phase 1 it is activatable',legalHand('カーム・マジック',0,0).ok);
doNormalSummon(1,'atk');drive();
ok('F4: after a Normal Summon — not activatable',z(h1)==='mz'&&!legalHand('カーム・マジック',0,0).ok);
fresh();
cm=mk('カーム・マジック',0);fb=mk('ファイヤー・ボール',0);gameState.players[0].hand=[cm,fb];baselineA();
cast(0,'ファイヤー・ボール');
ok('F4: after activating another card this phase — not activatable',z(fb)==='grave'&&!legalHand('カーム・マジック',0,0).ok);
fresh();
cm=mk('カーム・マジック',0);gameState.players[0].hand=[cm];baselineA();
toPhase('battle');
ok('F4: in the Battle Phase — not activatable',!legalHand('カーム・マジック',0,0).ok);
toPhase('main2');
ok('F4: in Main Phase 2 — not activatable',!legalHand('カーム・マジック',0,0).ok);
fresh();
cm=mk('カーム・マジック',0);h1=mk('ベビードラゴン',0);gameState.players[0].hand=[cm,h1];baselineA();
doSetMonster(1);drive();
ok('F4: Setting a monster is not a summon — still activatable',z(h1)==='mz'&&legalHand('カーム・マジック',0,0).ok);

/* ===== G: 白銀のバリア－シルバーフォース－ — negate + destroy an opponent's damage-inflicting Trap activation, and destroy all its face-up Spell/Trap cards ===== */
fresh();
let sf=setT('白銀のバリア－シルバーフォース－',0),mySp=mk('コモンメンタルワールド',0,'up'),cb2=setT('チェーン・ブラスト',1),fsp=mk('コモンメンタルワールド',1,'up'),fdn=setT('サイクロン',1),fld=mk('伝説の都 アトランティス',1,'up'),a0=up('ベビードラゴン',0);
gameState.players[0].sz=[sf,mySp];gameState.players[0].mz=[a0];gameState.players[1].sz=[cb2,fsp,fdn];gameState.players[1].field=fld;gameState.phase='battle';baselineA();
const doneG=attackRespond(0,a0,'direct',1,p=>p.kind==='attackDeclare','sz',0);
ok('G1: the opponent activated チェーン・ブラスト at the attack declaration',doneG&&toWindow());
ok('G1: 白銀のバリア is offered against the damage Trap',offered(0,sf));
windows([sf]);
ok('G1: its activation was negated and it was destroyed — no damage to us',z(cb2)==='grave'&&lp(0)===8000,JSON.stringify({cb2:z(cb2),lp0:lp(0)}));
ok('G1: every face-up Spell/Trap of the opponent was destroyed (a face-up Spell and the Field Spell)',z(fsp)==='grave'&&z(fld)==='grave',JSON.stringify({fsp:z(fsp),fld:z(fld)}));
ok('G1: its Set card stays, and our own face-up Spell stays',z(fdn)==='sz'&&C(fdn).face==='down'&&z(mySp)==='sz',JSON.stringify({fdn:z(fdn),mySp:z(mySp)}));
ok('G1: the direct attack then goes through (1200)',lp(1)===8000-1200,String(lp(1)));
audit('G1');
/* G2: negatives */
fresh();
sf=setT('白銀のバリア－シルバーフォース－',0);fb=mk('ファイヤー・ボール',1);gameState.activePlayer=1;gameState.turn=6;gameState.players[0].sz=[sf];gameState.players[1].hand=[fb];baselineA();
cast(1,'ファイヤー・ボール');
o3=false;for(let i=0;i<5;i++){if(!toWindow())break;o3=o3||offered(0,sf);chainPassV2();}drive();
ok('G2: a damage Spell (not a Trap) — not offered',!o3&&z(sf)==='sz'&&lp(0)===7500,JSON.stringify({o3,lp0:lp(0)}));
fresh();
sf=setT('白銀のバリア－シルバーフォース－',0);let mf=setT('聖なるバリア －ミラーフォース－',1);a0=up('ベビードラゴン',0);gameState.players[0].sz=[sf];gameState.players[0].mz=[a0];gameState.players[1].sz=[mf];gameState.phase='battle';baselineA();
attackRespond(0,a0,'direct',1,p=>p.kind==='attackDeclare','sz',0);
o3=false;for(let i=0;i<8;i++){if(!toWindow())break;o3=o3||offered(0,sf);chainPassV2();}drive();
ok('G2: a Trap that inflicts no damage (ミラーフォース) — not offered',!o3&&z(sf)==='sz'&&z(mf)==='grave',JSON.stringify({o3,sf:z(sf)}));
fresh();
sf=setT('白銀のバリア－シルバーフォース－',0);cb2=setT('チェーン・ブラスト',0);gameState.players[0].sz=[sf,cb2];baselineA();
duelActivateFromZone(0,'sz',1);
o3=false;for(let i=0;i<5;i++){if(!toWindow())break;o3=o3||offered(0,sf);chainPassV2();}drive();
ok('G2: its own controller\'s damage Trap — not offered; the opponent takes 500',!o3&&z(sf)==='sz'&&lp(1)===7500,JSON.stringify({o3,lp1:lp(1)}));
`);
