/* S03-U243: NOT_STARTED → TESTED — ワンショット・キャノン, ベビー・トラゴン, シャインエルフ, スクラップ・ビースト, ミラー・レディバグ, カラクリ忍者 参参九.
   Real DUEL paths (ignition / trigger activations, Normal / Special Summons, attacks, the Battle Phase end, Flip Summon), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;TRIG.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
function base(){gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();}
let PREFER=[],TRIG=[];
function step(){const q=pc();if(q){if(q.max>1){answerChoiceV49(q.candidates.slice(0,Math.min(q.max,q.candidates.length)).map(x=>x.key));return true;}let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function lp(p){return gameState.players[p].lp;}
function idx(c){return findCardByUid(c.uid).index;}
function legal(name,p,zone,i){return strictScriptLegalityV2(name,p,zone,i,{}).ok;}
function atk(p,i,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:i,target:t});drive();}
function setC(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function xyz(c,n){c.xyz=Array.from({length:n},()=>mk('ワイト',c.owner));return c;}
function proc(name,i){runSummonProcedure(name,0,'hand',i||0);if(!gameState.pendingSummon&&!pendingChoiceV49(gameState))finishSummonProcedure(name,0,'hand',i||0,'atk');drive();}

/* ===== A: ワンショット・キャノン — once per turn, own Main Phase: destroy 1 face-up monster, half of its ATK to its controller ===== */
fresh();
let cn=mk('ワンショット・キャノン',0,'up'),bw=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[cn];gameState.players[1].mz=[bw];base();
PREFER=[bw.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('A: 青眼の白龍 destroyed; its controller takes 1500 (half of 3000)',z(bw)==='grave'&&lp(1)===8000-1500&&lp(0)===8000,JSON.stringify({bw:z(bw),lp0:lp(0),lp1:lp(1),TRIG}));
ok('A: once per turn',!legal('ワンショット・キャノン',0,'mz',0));
audit('A');
/* A2: the ATK at destruction time counts (an own monster, lowered to 2000 → 1000) */
fresh();
cn=mk('ワンショット・キャノン',0,'up');let ow=mk('青眼の白龍',0,'up');
gameState.players[0].mz=[cn,ow];gameState.phase='main2';base();
API.modAtk(h(ow),-1000,0,'permanent','test');
PREFER=[ow.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('A2: Main Phase 2 works; an own monster with ATK 2000 is destroyed → its controller (the player) takes 1000',z(ow)==='grave'&&lp(0)===8000-1000&&lp(1)===8000,JSON.stringify({ow:z(ow),lp0:lp(0),lp1:lp(1)}));
audit('A2');
/* A3 (negative): Battle Phase / the opponent's turn */
fresh();
cn=mk('ワンショット・キャノン',0,'up');bw=mk('青眼の白龍',1,'up');gameState.players[0].mz=[cn];gameState.players[1].mz=[bw];gameState.phase='battle';base();
ok('A3: Battle Phase → not activatable',!legal('ワンショット・キャノン',0,'mz',0));
gameState.phase='main1';gameState.activePlayer=1;
ok('A3: the opponent\'s Main Phase → not activatable',!legal('ワンショット・キャノン',0,'mz',0));

/* ===== B: ベビー・トラゴン — Main Phase 1, detach 1: a face-up Level 1 monster you control attacks directly this turn ===== */
fresh();
let tg=xyz(mk('ベビー・トラゴン',0,'up'),2),w1=mk('ワイト',0,'up'),w2=mk('ワイト',0,'up');bw=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[tg,w1,w2];gameState.players[1].mz=[bw];base();
PREFER=[w1.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('B: 1 material detached; targeted ワイト selected',C(tg).xyz.length===1,JSON.stringify({n:C(tg).xyz.length,TRIG}));
phase('battle');
atk(0,idx(w1),'direct');
ok('B: ワイト (granted) attacks directly despite 青眼の白龍 → 300 damage',lp(1)===8000-300,JSON.stringify({lp1:lp(1)}));
atk(0,idx(w2),'direct');
ok('B: the other Level 1 ワイト (not selected) cannot attack directly',lp(1)===8000-300,JSON.stringify({lp1:lp(1)}));
audit('B');
/* B2 (negatives): Main Phase 2, no material, only Xyz / non-Level-1 monsters, opponent's turn */
fresh();
tg=xyz(mk('ベビー・トラゴン',0,'up'),1);w1=mk('ワイト',0,'up');gameState.players[0].mz=[tg,w1];gameState.phase='main2';base();
ok('B2: Main Phase 2 → not activatable',!legal('ベビー・トラゴン',0,'mz',0));
fresh();
tg=mk('ベビー・トラゴン',0,'up');w1=mk('ワイト',0,'up');gameState.players[0].mz=[tg,w1];base();
ok('B2: no Xyz Material → not activatable',!legal('ベビー・トラゴン',0,'mz',0));
fresh();
tg=xyz(mk('ベビー・トラゴン',0,'up'),2);let w3=mk('ワイト',0,'down'),dr=mk('ベビードラゴン',0,'up');gameState.players[0].mz=[tg,w3,dr];base();
ok('B2: only a face-down Level 1 monster, a Level 3 monster and the Rank 1 Xyz Monster itself (no Level) → not activatable',!legal('ベビー・トラゴン',0,'mz',0));
fresh();
tg=xyz(mk('ベビー・トラゴン',0,'up'),2);w1=mk('ワイト',0,'up');gameState.players[0].mz=[tg,w1];gameState.activePlayer=1;base();
ok('B2: the opponent\'s turn → not activatable',!legal('ベビー・トラゴン',0,'mz',0));
fresh();
tg=xyz(mk('ベビー・トラゴン',0,'up'),2);w1=mk('ワイト',0,'up');gameState.players[0].mz=[tg,w1];base();
ok('B2: Main Phase 1 with 2 materials and a face-up Level 1 monster → activatable (control)',legal('ベビー・トラゴン',0,'mz',0));

/* ===== C: シャインエルフ — the opponent's Normal / Special Summon: detach 1 → that monster loses 500 ATK ===== */
fresh();
let el=xyz(mk('シャインエルフ',0,'up'),2),bd=mk('ベビードラゴン',1);
gameState.players[0].mz=[el];gameState.players[1].hand=[bd];gameState.activePlayer=1;base();
doNormalSummon(0,'atk');drive();
ok('C: the opponent\'s Normal Summon of ベビードラゴン (1200) → 700; 1 Xyz Material removed',z(bd)==='mz'&&curATK(C(bd))===700&&C(el).xyz.length===1,JSON.stringify({atk:z(bd)==='mz'?curATK(C(bd)):null,n:C(el).xyz.length,TRIG}));
phase('end');
ok('C: the decrease is permanent while it is face-up (still 700 after the End Phase)',curATK(C(bd))===700,String(curATK(C(bd))));
audit('C');
/* C2: Special Summon (死者蘇生 of the opponent) */
fresh();
el=xyz(mk('シャインエルフ',0,'up'),1);bd=mk('ベビードラゴン',1);let rv=mk('死者蘇生',1);
gameState.players[0].mz=[el];gameState.players[1].hand=[rv];gameState.players[1].grave=[bd];gameState.activePlayer=1;base();
PREFER=[bd.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('C2: the opponent\'s Special Summon → ベビードラゴン 700, the last material removed',z(bd)==='mz'&&curATK(C(bd))===700&&C(el).xyz.length===0,JSON.stringify({bd:z(bd),n:C(el).xyz.length,TRIG}));
audit('C2');
/* C3 (negatives): own summon; no material */
fresh();
el=xyz(mk('シャインエルフ',0,'up'),2);let mb=mk('ベビードラゴン',0);
gameState.players[0].mz=[el];gameState.players[0].hand=[mb];base();
doNormalSummon(0,'atk');drive();
ok('C3: its controller\'s own Normal Summon → no effect (ATK 1200, 2 materials)',z(mb)==='mz'&&curATK(C(mb))===1200&&C(el).xyz.length===2,JSON.stringify({atk:curATK(C(mb)),n:C(el).xyz.length,TRIG}));
audit('C3');
fresh();
el=mk('シャインエルフ',0,'up');bd=mk('ベビードラゴン',1);gameState.players[0].mz=[el];gameState.players[1].hand=[bd];gameState.activePlayer=1;base();
doNormalSummon(0,'atk');drive();
ok('C3: no Xyz Material → the opponent\'s summon is not answered (ATK 1200)',z(bd)==='mz'&&curATK(C(bd))===1200,JSON.stringify({atk:curATK(C(bd)),TRIG}));
audit('C3b');

/* ===== D: スクラップ・ビースト ===== */
/* D: face-up Defense Position selected as an attack target → destroyed at the end of that Battle Phase; ② then may add another 「スクラップ」 (it is itself the 「スクラップ」 card) */
fresh();
let sb=mk('スクラップ・ビースト',0,'up','def'),ww=mk('スクラップ・ワーム',0),aw=mk('ワイト',1,'up');
gameState.players[0].mz=[sb];gameState.players[0].grave=[ww];gameState.players[1].mz=[aw];gameState.activePlayer=1;gameState.phase='battle';base();
atk(1,0,0);
const midD=z(sb);
phase('main2');
ok('D: ワイト attacks the Defense Position ビースト (DEF 1300): it survives the battle, stays until the end of the Battle Phase, then is destroyed',midD==='mz'&&z(sb)==='grave',JSON.stringify({midD,sb:z(sb),TRIG}));
ok('D: ② — destroyed by its own 「スクラップ」 effect: スクラップ・ワーム added from the GY to the hand',z(ww)==='hand',JSON.stringify({ww:z(ww),TRIG}));
audit('D');
/* D2 (negatives): Attack Position; not attacked; Set (face-down) when selected */
fresh();
sb=mk('スクラップ・ビースト',0,'up','atk');aw=mk('ワイト',1,'up');gameState.players[0].mz=[sb];gameState.players[1].mz=[aw];gameState.activePlayer=1;gameState.phase='battle';base();
atk(1,0,0);phase('main2');
ok('D2: selected in Attack Position → not destroyed at the end of the Battle Phase',z(sb)==='mz'&&z(aw)==='grave',JSON.stringify({sb:z(sb),aw:z(aw)}));
audit('D2');
fresh();
sb=mk('スクラップ・ビースト',0,'up','def');aw=mk('ワイト',1,'up');gameState.players[0].mz=[sb];gameState.players[1].mz=[aw];gameState.activePlayer=1;gameState.phase='battle';base();
phase('main2');
ok('D2: face-up Defense Position but not selected as an attack target → stays',z(sb)==='mz',JSON.stringify({sb:z(sb)}));
audit('D2b');
fresh();
sb=mk('スクラップ・ビースト',0,'down','def');sb.setTurn=4;aw=mk('ワイト',1,'up');gameState.players[0].mz=[sb];gameState.players[1].mz=[aw];gameState.activePlayer=1;gameState.phase='battle';base();
atk(1,0,0);phase('main2');
ok('D2: Set when it was selected (flipped by the battle) → not destroyed',z(sb)==='mz'&&C(sb).face==='up',JSON.stringify({sb:z(sb),f:z(sb)==='mz'?C(sb).face:null}));
audit('D2c');
/* D3: ② only for a 「スクラップ」 card's effect — destroyed by ブラック・ホール (not a 「スクラップ」 card) → no retrieval */
fresh();
sb=mk('スクラップ・ビースト',0,'up');ww=mk('スクラップ・ワーム',0);let bh=mk('ブラック・ホール',0);
gameState.players[0].mz=[sb];gameState.players[0].hand=[bh];gameState.players[0].grave=[ww];base();
duelActivateFromHand(0);drive();
ok('D3: destroyed by ブラック・ホール → no retrieval (ワーム stays in the GY)',z(sb)==='grave'&&z(ww)==='grave'&&TRIG.every(t=>t.indexOf('スクラップ・ビースト')<0),JSON.stringify({sb:z(sb),ww:z(ww),TRIG}));
audit('D3');
/* D3b: ② has nothing to add (only スクラップ・ビースト itself / non-スクラップ monsters in the GY) */
fresh();
sb=mk('スクラップ・ビースト',0,'up','def');let ot=mk('ワイト',0);aw=mk('ワイト',1,'up');
gameState.players[0].mz=[sb];gameState.players[0].grave=[ot];gameState.players[1].mz=[aw];gameState.activePlayer=1;gameState.phase='battle';base();
atk(1,0,0);phase('main2');
ok('D3b: destroyed at the end of the Battle Phase; no other 「スクラップ」 monster → nothing added',z(sb)==='grave'&&z(ot)==='grave'&&gameState.players[0].hand.length===0,JSON.stringify({sb:z(sb),hand:gameState.players[0].hand.length,TRIG}));
audit('D3b');

/* ===== E: ミラー・レディバグ ===== */
fresh();
let lb=mk('ミラー・レディバグ',0),f1=mk('ワイト',0,'up'),f2=mk('ベビードラゴン',0,'up'),fd=mk('ブラック・マジシャン',0,'down'),sp=mk('サイクロン',0);fd.setTurn=4;
gameState.players[0].hand=[lb];gameState.players[0].mz=[f1,f2,fd];gameState.players[0].grave=[sp];base();
proc('ミラー・レディバグ');
ok('E: special summoned from the hand (only a Spell in the GY); Level = 1 + 3 (the face-down monster has no Level) = 4',z(lb)==='mz'&&curLV(C(lb))===4,JSON.stringify({lb:z(lb),lv:z(lb)==='mz'?curLV(C(lb)):null,TRIG}));
audit('E');
/* E2: Level exactly 12 stays; over 12 → destroyed */
fresh();
lb=mk('ミラー・レディバグ',0);gameState.players[0].hand=[lb];gameState.players[0].mz=[mk('ブラック・マジシャン',0,'up'),mk('ベビードラゴン',0,'up'),mk('ワイト',0,'up'),mk('ワイト',0,'up')];base();
proc('ミラー・レディバグ');
ok('E2: Level 7 + 3 + 1 + 1 = 12 → stays on the field',z(lb)==='mz'&&curLV(C(lb))===12,JSON.stringify({lb:z(lb),lv:z(lb)==='mz'?curLV(C(lb)):null}));
audit('E2');
fresh();
lb=mk('ミラー・レディバグ',0);gameState.players[0].hand=[lb];gameState.players[0].mz=[mk('ブラック・マジシャン',0,'up'),mk('青眼の白龍',0,'up')];base();
proc('ミラー・レディバグ');
ok('E2: Level 7 + 8 = 15 (over 12) → destroyed',z(lb)==='grave',JSON.stringify({lb:z(lb)}));
audit('E2b');
/* E3 (negatives): the procedure conditions; a Special Summon by another effect does not set the Level */
fresh();
lb=mk('ミラー・レディバグ',0);gameState.players[0].hand=[lb];gameState.players[0].mz=[mk('ワイト',0,'up')];gameState.players[0].grave=[mk('ベビードラゴン',0)];base();
ok('E3: a monster in the GY → no procedure',strictSummonProcedureLegality('ミラー・レディバグ',0,'hand',0).ok===false);
fresh();
lb=mk('ミラー・レディバグ',0);gameState.players[0].hand=[lb];gameState.players[0].mz=[mk('ワイト',0,'down')];base();
ok('E3: only a face-down monster → no procedure',strictSummonProcedureLegality('ミラー・レディバグ',0,'hand',0).ok===false);
fresh();
lb=mk('ミラー・レディバグ',0);gameState.players[0].hand=[lb];base();
ok('E3: no monster at all → no procedure',strictSummonProcedureLegality('ミラー・レディバグ',0,'hand',0).ok===false);
fresh();
lb=mk('ミラー・レディバグ',0);gameState.players[0].hand=[lb];gameState.players[0].mz=[mk('ワイト',0,'up')];base();
ok('E3: a face-up monster and no monster in the GY → the procedure is legal (control)',strictSummonProcedureLegality('ミラー・レディバグ',0,'hand',0).ok===true);
fresh();
lb=mk('ミラー・レディバグ',0);rv=mk('死者蘇生',0);gameState.players[0].hand=[rv];gameState.players[0].grave=[lb];gameState.players[0].mz=[mk('ブラック・マジシャン',0,'up')];base();
PREFER=[lb.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('E3: revived by 死者蘇生 (not by its own procedure) → the Level stays 1',z(lb)==='mz'&&curLV(C(lb))===1,JSON.stringify({lb:z(lb),lv:z(lb)==='mz'?curLV(C(lb)):null,TRIG}));
audit('E3');

/* ===== F: カラクリ忍者 参参九 ===== */
fresh();
let sz=mk('カラクリ忍者 参参九',0,'up'),op=mk('ワイト',1,'up');
gameState.players[0].mz=[sz];gameState.players[1].mz=[op];base();
ok('F: it must attack if able',mustAttackNow(C(sz))===true);
/* F: selected as an attack target in face-up Attack Position → Defense Position (the weak attacker's controller takes the 900 difference) */
fresh();
sz=mk('カラクリ忍者 参参九',0,'up');op=mk('ワイト',1,'up');
gameState.players[0].mz=[sz];gameState.players[1].mz=[op];gameState.activePlayer=1;gameState.phase='battle';base();
atk(1,0,0);
ok('F: ワイト attacks the Attack Position 参参九 → it becomes Defense Position (DEF 1200 > ATK 300: 900 damage to the attacker, nothing to the controller)',z(sz)==='mz'&&C(sz).pos==='def'&&lp(1)===8000-900&&lp(0)===8000,JSON.stringify({pos:C(sz).pos,lp0:lp(0),lp1:lp(1),TRIG}));
audit('F');
/* F2: FLIP — attacked while Set: send 1 face-up monster to the GY */
fresh();
sz=mk('カラクリ忍者 参参九',0,'down','def');sz.setTurn=4;op=mk('ワイト',1,'up');let bk=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[sz];gameState.players[1].mz=[op,bk];gameState.activePlayer=1;gameState.phase='battle';base();
PREFER=[bk.uid];atk(1,0,0);PREFER=[];
ok('F2: flipped by the attack → 青眼の白龍 chosen and sent to the GY',z(bk)==='grave'&&z(sz)==='mz'&&C(sz).face==='up',JSON.stringify({bk:z(bk),sz:z(sz),TRIG}));
audit('F2');
/* F3: Flip Summoned in the Main Phase 1 → that turn it can attack directly (the opponent has a monster left) */
fresh();
sz=mk('カラクリ忍者 参参九',0,'down','def');sz.setTurn=4;op=mk('ワイト',1,'up');bk=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[sz];gameState.players[1].mz=[op,bk];base();
PREFER=[bk.uid];doFlipUp(0,'mz',0,'atk');drive();PREFER=[];
ok('F3: flip effect — 青眼の白龍 sent to the GY',z(bk)==='grave'&&C(sz).face==='up',JSON.stringify({bk:z(bk),TRIG}));
phase('battle');
atk(0,0,'direct');
ok('F3: the turn it was flipped, 参参九 attacks directly although ワイト is on the field → 1200 damage',lp(1)===8000-1200&&z(op)==='mz',JSON.stringify({lp1:lp(1),op:z(op)}));
audit('F3');
/* F4 (negative): never flipped this turn → no direct attack while the opponent has a monster */
fresh();
sz=mk('カラクリ忍者 参参九',0,'up');op=mk('ワイト',1,'up');gameState.players[0].mz=[sz];gameState.players[1].mz=[op];gameState.phase='battle';base();
atk(0,0,'direct');
ok('F4: not flipped → cannot attack directly (the request is refused, nothing is journaled)',lp(1)===8000&&z(op)==='mz',JSON.stringify({lp1:lp(1)}));
/* F5 (negative): a face-up Defense Position 参参九 attacked: no position change (only an Attack Position card is changed) */
fresh();
sz=mk('カラクリ忍者 参参九',0,'up','def');op=mk('ワイト',1,'up');gameState.players[0].mz=[sz];gameState.players[1].mz=[op];gameState.activePlayer=1;gameState.phase='battle';base();
atk(1,0,0);
ok('F5: the Defense Position 参参九 stays in Defense Position',z(sz)==='mz'&&C(sz).pos==='def',JSON.stringify({pos:C(sz).pos,TRIG}));
audit('F5');
`);
