/* S03-U481: E・HERO エアーマン / ダスト・シュート — the card choice is non-targeting
   and belongs to resolution.  This deliberately checks the registered continuation shape (no closures),
   current candidates, save/resume and Replay, not merely the resulting move. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));ASK_CHAIN=false;
function nm(c){return c&&cardName(c);} function fresh(){resetA();EVT_V2_STATE=null;gameState.activePlayer=0;gameState.phase='main1';}
function drive(){for(let i=0;i<600;i++){if(pendingChoiceV49(gameState))return 'choice';if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}return 'idle';}return 'loop';}
function audit(s){const p=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(p);ok(s+' Replay audit',p.actions.length>0&&a.ok,JSON.stringify(a).slice(0,180));}
function pickUid(uid){const q=pendingChoiceV49(gameState),c=q&&q.candidates.find(x=>x.uid===uid);if(!c)throw Error('missing uid '+uid);return answerChoiceV49([c.key]);}function pickUids(uids){const q=pendingChoiceV49(gameState),cs=q&&q.candidates.filter(x=>uids.includes(x.uid));if(!q||cs.length!==uids.length)throw Error('missing uid set');return answerChoiceV49(cs.map(x=>x.key));}function zoneUid(uid){const h=findCardByUid(uid);return h&&h.zone;}
`;

/* Airman: the activation payload is mode only; resolution uses the CURRENT other HERO count and S/T. */
harness(COMMON+String.raw`
fresh();const air=mk('E・HERO エアーマン',0),hero=mk('E・HERO クレイマン',0),hero2=mk('E・HERO オーシャン',0),a=mk('サイクロン',1,'down'),b=mk('死者蘇生',1,'down');
gameState.players[0].mz=[air,hero,hero2];gameState.players[1].sz=[a,b];baselineA();
let selected=null;CARD_SCRIPTS['E・HERO エアーマン'].selectTargets({player:0,index:0,opponent:1},x=>selected=x);const mode=pendingChoiceV49(gameState);
ok('Airman activation opens only its mode choice, never a card target',mode&&mode.kind==='yesno'&&mode.targeting===false&&mode.candidates.every(x=>x.uid==null),JSON.stringify(mode));
__choicePickV49(1);ok('Airman destroy mode activation stores no card target',selected&&selected.length===1&&selected[0].mode==='destroy'&&!selected[0].t,JSON.stringify(selected));
CARD_SCRIPTS['E・HERO エアーマン'].resolve({player:0,card:air,selectedTargets:selected});let q=pendingChoiceV49(gameState);
ok('Airman resolution requires at least one and offers both CURRENT Spell/Traps up to CURRENT other-HERO count, non-targeting',q&&q.targeting===false&&q.min===1&&q.max===2&&!q.cancelable&&q.candidates.length===2,JSON.stringify(q&&{targeting:q.targeting,min:q.min,max:q.max,n:q.candidates.length,resume:q.resume}));
ok('Airman pending resolution choice has JSON-safe registered resume data',q.resume.handler==='s03u481.airman-destroy'&&q.resume.args.limit===2,JSON.stringify(q.resume));pickUids([a.uid,b.uid]);ok('Airman handler destroys the selected current S/T cards',zoneUid(a.uid)==='grave'&&zoneUid(b.uid)==='grave','');
fresh();const air2=mk('E・HERO エアーマン',0),hero3=mk('E・HERO クレイマン',0),st=mk('サイクロン',1,'down');gameState.players[0].mz=[air2,hero3];gameState.players[1].sz=[st];baselineA();CARD_SCRIPTS['E・HERO エアーマン'].resolve({player:0,card:air2,selectedTargets:[{mode:'destroy'}]});ok('Airman has a resolution choice before response-state change',!!pendingChoiceV49(gameState),'');API.destroy(locateCardAnyV4(st),'response fixture');q=pendingChoiceV49(gameState);answerChoiceV49([q.candidates[0].key]);ok('Airman stale response candidate resolves safely without a further effect',findCardByUid(st.uid).zone==='grave'&&!gameState.systemFault,'');
fresh();const air3=mk('E・HERO エアーマン',0),hero4=mk('E・HERO クレイマン',0);gameState.players[0].mz=[air3,hero4];baselineA();CARD_SCRIPTS['E・HERO エアーマン'].resolve({player:0,card:air3,selectedTargets:[{mode:'destroy'}]});ok('Airman opens no resolution choice when responses leave no current Spell/Trap',!pendingChoiceV49(gameState),'');
`);

/* Airman real trigger/chain: response changes the board before resolution, then the registered choice survives a real save/resume. */
harness(COMMON+String.raw`
fresh();const air=mk('E・HERO エアーマン',0),h1=mk('E・HERO クレイマン',0),h2=mk('E・HERO オーシャン',0),old=mk('サイクロン',1,'down'),live=mk('死者蘇生',1,'down');
gameState.players[0].hand=[air];gameState.players[0].mz=[h1,h2];gameState.players[0].deck=[mk('E・HERO ネオス',0)];gameState.players[1].sz=[old,live];baselineA();doNormalSummon(0,'atk');drive();let q=pendingChoiceV49(gameState);
ok('Airman real trigger chooses only the mode at activation',q&&q.kind==='yesno'&&q.targeting===false&&q.candidates.every(c=>c.uid==null),JSON.stringify(q));answerChoiceV49([q.candidates.find(c=>c.value===false).key]);
const l=gameState.chain.find(x=>x.name==='E・HERO エアーマン');ok('Airman real chain has no activation target uid (only the destroy-mode declaration)',l&&linkTargetUidsS03(l).length===0,JSON.stringify(l&&l.targets));
API.destroy(locateCardAnyV4(h2),'response removes one other HERO');API.destroy(locateCardAnyV4(old),'response removes one old S/T');drive();q=pendingChoiceV49(gameState);
ok('Airman resolution re-reads CURRENT board after the response (limit 1, only surviving S/T)',q&&q.targeting===false&&q.max===1&&q.candidates.length===1&&q.candidates[0].uid===live.uid,JSON.stringify(q&&{max:q.max,u:q.candidates.map(c=>c.uid)}));
saveDuel();const raw=localStorage.getItem(DUEL_SAVE_KEY);resetA();localStorage.setItem(DUEL_SAVE_KEY,raw);const resumed=offerResumeDuel();q=pendingChoiceV49(gameState);
ok('Airman Save/Load restores the pending registered resolution choice',resumed&&q&&q.resume.handler==='s03u481.airman-destroy'&&assertChoiceSerializableV49(gameState).ok,JSON.stringify(q&&q.resume));pickUid(live.uid);drive();
ok('Airman resumed resolution destroys the current selected S/T and completes',zoneUid(live.uid)==='grave'&&gameState.chain.length===0&&!gameState.systemFault,'');audit('Airman real chain + Save/Load');
`);

/* Dustshoot: activation has no hand target; reveal/choice is at resolution and consults current hand. */
harness(COMMON+String.raw`
fresh();const ds=mk('ダスト・シュート',0,'down');ds.setTurn=gameState.turn-1;const w=mk('ワイト',1),m=mk('もけもけ',1),sp=mk('サイクロン',1);gameState.players[0].sz=[ds];gameState.players[1].hand=[w,m,sp,mk('死者蘇生',1)];baselineA();duelActivateFromZone(0,'sz',0);ok('Dustshoot activation creates no target/card choice and chain link has empty targets',!pendingChoiceV49(gameState)&&gameState.chain[0]&&(!gameState.chain[0].targets||gameState.chain[0].targets.length===0),JSON.stringify(gameState.chain[0]));ok('Dustshoot does not reveal the hand before resolution',!JSON.stringify(gameState.log).includes('現在の手札を公開'),'');drive();let q=pendingChoiceV49(gameState);ok('Dustshoot reveals and offers only CURRENT hand monsters at resolution, non-targeting',q&&q.targeting===false&&q.candidates.length===2&&q.candidates.every(x=>x.zone==='hand')&&JSON.stringify(gameState.log).includes('現在の手札を公開'),JSON.stringify(q&&{targeting:q.targeting,n:q.candidates.length,resume:q.resume}));ok('Dustshoot pending resolution choice has JSON-safe registered resume data',q.resume.handler==='s03u481.dustshoot-return'&&q.resume.args.opponent===1,JSON.stringify(q.resume));saveDuel();const raw=localStorage.getItem(DUEL_SAVE_KEY);resetA();localStorage.setItem(DUEL_SAVE_KEY,raw);const resumed=offerResumeDuel();q=pendingChoiceV49(gameState);ok('Dustshoot Save/Load restores the current-hand resolution choice',resumed&&q&&q.resume.handler==='s03u481.dustshoot-return'&&assertChoiceSerializableV49(gameState).ok,JSON.stringify(q&&q.resume));pickUid(w.uid);drive();ok('Dustshoot returns the selected current hand monster then shuffles',zoneUid(w.uid)==='deck'&&zoneUid(m.uid)==='hand','');audit('Dustshoot real chain + Save/Load');
fresh();const ds2=mk('ダスト・シュート',0,'down');ds2.setTurn=gameState.turn-1;const only=mk('ワイト',1);gameState.players[0].sz=[ds2];gameState.players[1].hand=[only,mk('サイクロン',1),mk('死者蘇生',1),mk('強欲な壺',1)];baselineA();duelActivateFromZone(0,'sz',0);API.discard(1,0,'response removes the only monster');drive();ok('Dustshoot response leaving no current monster opens no choice and resolves safely',!pendingChoiceV49(gameState)&&zoneUid(only.uid)==='grave'&&!gameState.systemFault,'');audit('Dustshoot no-monster response');
`);
