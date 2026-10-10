/* S03-U302: 霞の谷のファルコン — 「このカード以外の自分フィールド上のカード1枚を手札に戻さなければ攻撃宣言できない」 (engine/1ZZQ).
   Real DUEL battle path (battlePickAttackerV29 / battlePickTargetV29 / battleDirectV29), the cost choice, a cancel, no other card,
   a save / resume during the cost choice; Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function zoneOf(u){const h=findCardByUid(u);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function drive(){for(let i=0;i<400;i++){
  if(pc())return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length&&st.rank<2)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function lp(p){return gameState.players[p].lp;}
const FAL='霞の谷のファルコン';
/* P0: Falcon (+ own cards), P1: foe monsters; into the Battle Phase, the battle-start window passed */
function setup(own, foe){
  resetA();
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5330200;
  const f=mk(FAL,0,'up','atk');f.summonedTurn=3;
  const o=(own||[]).map(x=>{const c=mk(x.n,0,x.face||'up',x.pos||'atk');if(x.set){c.setTurn=3;}return {c,zone:x.zone||'mz'};});
  gameState.players[0].mz=[f].concat(o.filter(x=>x.zone==='mz').map(x=>x.c));
  gameState.players[0].sz=o.filter(x=>x.zone==='sz').map(x=>x.c);
  const fo=(foe||[]).map(n=>mk(n,1,'up','atk'));gameState.players[1].mz=fo.slice();   /* a copy: destruction splices the zone array */
  gameState.players[0].deck=Array.from({length:8},()=>mk('ワイト',0));gameState.players[1].deck=Array.from({length:8},()=>mk('ワイト',1));
  baselineA();
  requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
  return {f,own:o.map(x=>x.c),foe:fo};
}
function attackers(){return battleAttackersV29(0).map(x=>cardName(x.card));}
`;
const first=harness(COMMON+String.raw`
/* F1: Falcon attacks ワイト; the cost choice offers the other own cards only; a set Trap is returned; the attack goes on */
let S=setup([{n:'ワイト'},{n:'落とし穴',zone:'sz',face:'down',set:true}],['ワイト']);
ok('F1: Falcon may attack (another own card exists)',attackers().indexOf(FAL)>=0,JSON.stringify(attackers()));
battlePickAttackerV29(S.f.uid);battlePickTargetV29(S.foe[0].uid);
let q=pc();
ok('F1: the attack declaration first asks which other own card to return (2 candidates, not the Falcon)',!!q&&/攻撃宣言のために手札に戻す/.test(q.title)&&q.candidates.length===2&&!q.candidates.some(x=>x.uid===S.f.uid)&&!gameState.pendingAttack,JSON.stringify(q&&{t:q.title,n:q.candidates.length}));
const trap=S.own[1];if(q&&q.candidates.some(x=>x.uid===trap.uid))answerChoiceV49([q.candidates.find(x=>x.uid===trap.uid).key]);drive();
ok('F1: the set Trap is back in the hand; the Falcon attacked and destroyed ワイト (1700 damage)',zoneOf(trap.uid)==='hand'&&zoneOf(S.foe[0].uid)==='grave'&&lp(1)===6300,JSON.stringify({trap:zoneOf(trap.uid),foe:zoneOf(S.foe[0].uid),lp:lp(1)}));
audit('F1');
/* F2: Falcon alone — it cannot declare an attack */
S=setup([],['ワイト']);
ok('F2: no other own card — the Falcon is not offered as an attacker and canDeclareAttackV48 is false',attackers().indexOf(FAL)<0&&canDeclareAttackV48(S.f)===false,JSON.stringify(attackers()));
/* F3: cancel the cost choice — no attack, the attack is not used up */
S=setup([{n:'ワイト'}],['ワイト']);
battlePickAttackerV29(S.f.uid);battlePickTargetV29(S.foe[0].uid);
cancelChoiceV49();drive();
ok('F3: cancelled — nothing returned, no attack, the Falcon can still attack',zoneOf(S.own[0].uid)==='mz'&&zoneOf(S.foe[0].uid)==='mz'&&lp(1)===8000&&attackers().indexOf(FAL)>=0,JSON.stringify({own:zoneOf(S.own[0].uid),lp:lp(1),att:attackers()}));
audit('F3');
/* F4: direct attack — the own ワイト is returned, 2000 damage */
S=setup([{n:'ワイト'}],[]);
battlePickAttackerV29(S.f.uid);battleDirectV29();
q=pc();if(q)answerChoiceV49([q.candidates[0].key]);drive();
ok('F4: direct attack after returning ワイト — 2000 damage',zoneOf(S.own[0].uid)==='hand'&&lp(1)===6000,JSON.stringify({own:zoneOf(S.own[0].uid),lp:lp(1)}));
audit('F4');
/* F5 (save point): the cost choice is open; returning a monster to the left of the Falcon shifts its index */
S=setup([{n:'ワイト'}],['ワイト']);
gameState.players[0].mz=[S.own[0],S.f];baselineA();
battlePickAttackerV29(S.f.uid);battlePickTargetV29(S.foe[0].uid);
ok('F5: the cost choice is open before the save',!!pc(),'');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__U={f:S.f.uid,own:S.own[0].uid,foe:S.foe[0].uid};
`);
if(!first.__RAW){console.log('FAIL F5 did not reach the save point');process.exitCode=2;}
else harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
const r=offerResumeDuel();const q=pc();
ok('F5: the resume keeps the cost choice open',r&&!!q&&/攻撃宣言のために手札に戻す/.test(q.title),JSON.stringify({r,t:q&&q.title}));
if(q&&q.candidates.some(x=>x.uid===U.own))answerChoiceV49([q.candidates.find(x=>x.uid===U.own).key]);drive();
ok('F5: after the resume, ワイト (left of the Falcon) is returned and the Falcon (index shifted) destroys the foe — 1700',zoneOf(U.own)==='hand'&&zoneOf(U.foe)==='grave'&&gameState.players[1].lp===6300,JSON.stringify({own:zoneOf(U.own),foe:zoneOf(U.foe),lp:gameState.players[1].lp}));
audit('F5');
`);
