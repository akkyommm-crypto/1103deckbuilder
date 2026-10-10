/* S03-U82: A・O・J ディサイシブ・アームズ — a NOT_STARTED main-deck Six Samurai Synchro monster found via
   priority #7 (continuing S03-U79/U80/U81's cross-reference pass). Real text (this project's own card
   database, printed 2009-07-01, within cutoff), DARK Machine Synchro Effect Monster, Level 10 (Tuner + 2+
   non-Tuner monsters, no archetype-name restriction): if the opponent controls a face-up LIGHT monster, once
   per turn activate 1 of 3 modes: destroy 1 set opponent card / discard 1 to destroy all opponent Spell-Trap
   / discard your entire hand to mill the opponent's revealed LIGHT hand monsters and deal ATK-sum damage.
   Reuses the established P1.1 "choose 1 of N modes" pattern (precedent: 竜の渓谷,
   cards/89_p11_activation_choice_recovery.js) end to end — see cards/HP_claude_s03u82_aoj_decisive_armor.js's
   own header comment for the full primitive breakdown. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';}
function drive(){for(let i=0;i<600;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
    const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length) eventPickV2(0); else eventSkipGroupV2();
    continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if(gameState.pendingSummon){commitPendingSummonV2();continue;}
  return 'idle';}
  return 'loop';}
function driveAll(){for(let i=0;i<30;i++){const st=drive();if(st!=='choice')return st;__choicePickV49(0);}return 'loop';}
function pickKey(key){const q=pendingChoiceV49(gameState);if(!q)return false;
  const i=q.candidates.findIndex(c=>c.key===key);if(i<0)return false;__choicePickV49(i);return true;}
function driveModeThenAll(mode){
  for(let i=0;i<5;i++){ const st=drive(); if(st!=='choice') return driveAll(); if(pickKey(mode)) return driveAll(); __choicePickV49(0); }
  return driveAll();
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
`;

/* ===== A. Real Synchro Summon (ジュラック・アウロ Tuner + 青眼の白龍 + ワイト, Level 10 total) ->
   A・O・J ディサイシブ・アームズ. Real mode 1: destroy a real set opponent card. ===== */
harness(COMMON+String.raw`
fresh();
const auro=mk('ジュラック・アウロ',0), bew=mk('青眼の白龍',0), wight=mk('ワイト',0);
const aoj=mk('A・O・J ディサイシブ・アームズ',0);
gameState.players[0].mz=[auro,bew,wight];
gameState.players[0].ex=[aoj];
const light=mk('聖なる魔術師',1), setCard=mk('聖なるバリア －ミラーフォース－',1,'down');
setCard.setTurn=gameState.turn-1;
gameState.players[1].mz=[light];
gameState.players[1].sz=[setCard];
baselineA();
const combos=exCombos(0,dbOf(aoj)).combos;
ok('A setup: a real Synchro combo (Tuner + 2 non-Tuner monsters, Level 10 total, no archetype restriction) is legal',combos.length>0,JSON.stringify(combos.map(c=>c.label)));
doExSummon(0,0,combos[0].materials,'synchro','atk');
driveAll();
audit('A real Synchro Summon');
ok('A: A・O・J ディサイシブ・アームズ is really Synchro Summoned',zoneOf(aoj.uid)==='mz',JSON.stringify({zone:zoneOf(aoj.uid)}));
const leg=strictScriptLegalityV2('A・O・J ディサイシブ・アームズ',0,'mz',gameState.players[0].mz.indexOf(aoj),{});
ok('A: really legal to activate with a real opponent LIGHT monster on the field',leg.ok,JSON.stringify(leg));
duelActivateFromZone(0,'mz',gameState.players[0].mz.indexOf(aoj),{});
driveModeThenAll('destroy-set');
audit('A real mode 1: destroy a real set opponent card');
ok('A: mode 1 really destroys the real set opponent card',zoneOf(setCard.uid)==='grave',JSON.stringify({setCard:zoneOf(setCard.uid)}));
`);

/* ===== B. Real mode 2: discard 1 real card (cost) -> destroy ALL real opponent Spell/Trap. ===== */
harness(COMMON+String.raw`
fresh();
const aoj=mk('A・O・J ディサイシブ・アームズ',0);
gameState.players[0].mz=[aoj];
gameState.players[0].hand=[mk('もけもけ',0)];
const light=mk('聖なる魔術師',1);
const st1=mk('聖なるバリア －ミラーフォース－',1,'up'), st2=mk('強欲な壺',1,'up');
gameState.players[1].mz=[light];
gameState.players[1].sz=[st1,st2];
baselineA();
duelActivateFromZone(0,'mz',0,{});
driveModeThenAll('wipe-st');
audit('B real mode 2: discard-cost then wipe all opponent Spell/Trap');
ok('B: mode 2 really discards 1 real hand card as the cost and really destroys BOTH real opponent Spell/Trap cards',
  gameState.players[0].hand.length===0&&zoneOf(st1.uid)==='grave'&&zoneOf(st2.uid)==='grave',
  JSON.stringify({hand:gameState.players[0].hand.length,st1:zoneOf(st1.uid),st2:zoneOf(st2.uid)}));
`);

/* ===== C. Real mode 3: discard the entire real hand (cost) -> mill the opponent's revealed LIGHT hand
   monsters (a DARK monster in the same hand is untouched) and deal real ATK-sum damage. ===== */
harness(COMMON+String.raw`
fresh();
const aoj=mk('A・O・J ディサイシブ・アームズ',0);
gameState.players[0].mz=[aoj];
gameState.players[0].hand=[mk('もけもけ',0),mk('ワイト',0)];
const light=mk('聖なる魔術師',1);
gameState.players[1].mz=[light];
gameState.players[1].hand=[mk('聖なる魔術師',1),mk('カオス・ソルジャー －開闢の使者－',1),mk('ダーク・アームド・ドラゴン',1)];
gameState.players[1].lp=8000;
baselineA();
const lpBefore=gameState.players[1].lp;
duelActivateFromZone(0,'mz',0,{});
driveModeThenAll('mill-light');
audit('C real mode 3: discard entire hand then mill real opponent LIGHT hand monsters and deal damage');
ok('C: mode 3 really discards the entire real hand as the cost',gameState.players[0].hand.length===0,JSON.stringify(gameState.players[0].hand.length));
ok('C: the real LIGHT-attribute opponent hand monsters (聖なる魔術師, カオス・ソルジャー －開闢の使者－) are really milled; the real DARK one (ダーク・アームド・ドラゴン) stays in hand',
  gameState.players[1].hand.length===1&&nm(gameState.players[1].hand[0])==='ダーク・アームド・ドラゴン'
  &&gameState.players[1].grave.some(c=>nm(c)==='聖なる魔術師')&&gameState.players[1].grave.some(c=>nm(c)==='カオス・ソルジャー －開闢の使者－'),
  JSON.stringify({hand:gameState.players[1].hand.map(nm),grave:gameState.players[1].grave.map(nm)}));
ok('C: real LP damage equals the real total ATK of the 2 real milled LIGHT monsters (300+3000)',
  gameState.players[1].lp===lpBefore-(300+3000),JSON.stringify({lpBefore,lpAfter:gameState.players[1].lp}));
function nm(c){return c?cardName(c):null;}
`);

/* ===== D. Negative control: without any real opponent LIGHT monster, the effect is illegal. ===== */
harness(COMMON+String.raw`
fresh();
const aoj=mk('A・O・J ディサイシブ・アームズ',0);
gameState.players[0].mz=[aoj];
const foe=mk('ワイト',1);
gameState.players[1].mz=[foe];
baselineA();
const leg=strictScriptLegalityV2('A・O・J ディサイシブ・アームズ',0,'mz',0,{});
ok('D: illegal when the opponent controls no real face-up LIGHT monster',!leg.ok,JSON.stringify(leg));
`);
