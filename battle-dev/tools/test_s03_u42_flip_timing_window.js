/* S03-U42 C-S03-34 FLIP_TIMING_WINDOW_SCOPE — activating a set Spell / Trap does not open a summon-success window.
   Found by R1-v1 (Astra's fixed lists 1103_MAJOR_DECKS_v1: Dragunity / レダメ vs 1103兎ラギア, seed 0x52310101, Dragunity first, turn 3):
   after the opponent activated a set 強制脱出装置, レッドアイズ・ダークネスメタルドラゴン's ignition effect was refused for the rest of
   Main Phase 1 with 「召喚成功直後にモンスターの起動効果は発動できません」. updateTimingWindow opened kind:'flip' for every face-up
   FX_SET_STATE, including a set card being activated, and nothing closed that window.
   2011 sources: yugioh-wiki 「起動効果」 age 82 (2011-05-23), 「優先権」 age 69 (2011-07-28): the restriction concerns summons
   (Normal / Flip / Special Summon success), after which both players pass priority.
   Cards named here: レッドアイズ・ダークネスメタルドラゴン, ドラグニティ－ブラックスピア, 強制脱出装置 (TESTED); ワイト (GENERIC_OK). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function step(){
  const w=gameState.processorWaiting;
  if(pendingChoiceV49(gameState)){const q=pendingChoiceV49(gameState);const want=globalThis.__PICK_UID;const i=want!=null?q.candidates.findIndex(c=>c.uid===want):-1;__choicePickV49(i>=0?i:0);return 'choice';}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();return 'evt';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chainPass';}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'pointPass';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summonCommit';}
  return 'idle';
}
function drive(){for(let i=0;i<300;i++){if(step()==='idle')return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function zoneOf(c){const x=findCardByUid(c.uid);return x?x.zone:null;}

/* ===== A. activating a set trap leaves no summon window; the ignition effect stays legal ===== */
resetA();
const redmd=mk('レッドアイズ・ダークネスメタルドラゴン',0);gameState.players[0].mz=[redmd];
const spear=mk('ドラグニティ－ブラックスピア',0);gameState.players[0].hand=[spear];
const trap=mk('強制脱出装置',0,'down');trap.setTurn=gameState.turn-1;gameState.players[0].sz=[trap];
const foe=mk('ワイト',1);gameState.players[1].mz=[foe];
baselineA();
ok('A: setup — the ignition effect is legal before the trap',strictScriptLegalityV2('レッドアイズ・ダークネスメタルドラゴン',0,'mz',0,{}).ok);
globalThis.__PICK_UID=foe.uid;
duelActivateFromZone(0,'sz',0);
const rA=drive();
globalThis.__PICK_UID=null;
ok('A: 強制脱出装置 resolved (the opponent monster returned to the hand)',rA==='idle'&&zoneOf(foe)==='hand'&&zoneOf(trap)==='grave',JSON.stringify({rA,foe:zoneOf(foe),trap:zoneOf(trap)}));
ok('A: activating the set trap opens no summon / flip timing window',!gameState.timingWindow||!['summon','flip','summonFast','flipFast'].includes(gameState.timingWindow.kind),JSON.stringify(gameState.timingWindow));
const LA=strictScriptLegalityV2('レッドアイズ・ダークネスメタルドラゴン',0,'mz',0,{});
ok('A: afterwards the ignition effect of レッドアイズ・ダークネスメタルドラゴン is legal',LA.ok,JSON.stringify(LA));
audit('A');

/* ===== B. a Flip Summon still opens its window, which closes once both players pass ===== */
resetA();
const wight=mk('ワイト',0,'down','def');wight.setTurn=gameState.turn-1;gameState.players[0].mz=[wight];
const redmd2=mk('レッドアイズ・ダークネスメタルドラゴン',0);gameState.players[0].mz.push(redmd2);
const spear2=mk('ドラグニティ－ブラックスピア',0);gameState.players[0].hand=[spear2];
baselineA();
doFlipUp(0,'mz',0,'atk');
const typesAfterFlip=()=>(v41ReplayPackage(gameState).actions||[]).map(e=>e.action||{});
const flipAct=typesAfterFlip().find(a=>a.type==='FX_SET_STATE'&&a.face==='up'&&a.zone==='mz');
ok('B: the Flip Summon is journaled as a Flip Summon (FX_SET_STATE with flipSummon)',!!flipAct&&flipAct.flipSummon===true,JSON.stringify(flipAct||null));
const rB=drive();
ok('B: the flipped monster is face-up Attack Position and the window is closed after both pass',rB==='idle'&&wight.face==='up'&&wight.pos==='atk'&&gameState.timingWindow==null,JSON.stringify({rB,face:wight.face,pos:wight.pos,tw:gameState.timingWindow}));
ok('B: afterwards the ignition effect is legal',strictScriptLegalityV2('レッドアイズ・ダークネスメタルドラゴン',0,'mz',1,{}).ok);
audit('B');

/* ===== C. the window rule itself (updateTimingWindow on a detached state object) ===== */
{
  const g={turn:5,timingWindow:null};
  updateTimingWindow(g,{type:'FX_SET_STATE',player:0,zone:'sz',index:0,face:'up',reason:'発動'});
  ok('C: a set Spell / Trap turned face-up by its activation opens no window',g.timingWindow===null,JSON.stringify(g.timingWindow));
  updateTimingWindow(g,{type:'FX_SET_STATE',player:0,zone:'mz',index:0,face:'up',reason:'ダメージ計算前のリバース'});
  ok('C: a monster turned face-up by battle (not a Flip Summon) opens no window',g.timingWindow===null,JSON.stringify(g.timingWindow));
  updateTimingWindow(g,{type:'FX_SET_STATE',player:0,zone:'mz',index:0,face:'up',pos:'atk',reason:'反転召喚成功',flipSummon:true});
  ok('C: a Flip Summon opens the flip window',!!g.timingWindow&&g.timingWindow.kind==='flip',JSON.stringify(g.timingWindow));
  const g2={turn:5,timingWindow:null};
  updateTimingWindow(g2,{type:'FX_SET_STATE',player:0,zone:'mz',index:0,face:'up',pos:'atk',reason:'反転召喚成功'});
  ok('C: an older journal entry without the flag (reason 反転召喚成功) still opens the flip window',!!g2.timingWindow&&g2.timingWindow.kind==='flip',JSON.stringify(g2.timingWindow));
}
`);
