/* S03-U265: アームズ・ホール, 暗黒界に続く結界通路, ネオフレムベル・ガルーダ, ジェネクス・ガイア, ウィード, エーリアン・サイコ (2011 texts).
   Real DUEL paths (activations from the hand, End Phase triggers, effect / battle destruction decisions, summons, attacks); each scenario Replay-audited.
   (ドラグニティ－ジャベリン is not covered here — it needs an engine change.) */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
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
function up(n,p,pos){return mk(n,p,'up',pos);}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function legalHand(name,p,i){const P=gameState.players[p],c=P.hand[i];return strictScriptLegalityV2(name,p,'hand',i,{cardOverride:c,logicalZone:'sz',prospectiveIndex:(P.sz||[]).length});}
function acts(p,c){return getLegalHandActions(p,gameState.players[p].hand.indexOf(c)).map(a=>a.id);}
function hitT(p,a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:findCardByUid(a.uid).index,target:findCardByUid(t.uid).index});drive();}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function nextTurn(){toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();}
const SUB='s03u173.destroy-sub';
function subPending(){const q=pc();return !!(q&&q.resume&&q.resume.handler===SUB);}
function driveSub(){for(let i=0;i<600;i++){
  if(subPending())return true;
  if(pc()){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function answer(key){const q=pc();if(!q)return;__choicePickV49(q.candidates.findIndex(c=>c.key===key));}
function keys(){return (pc()?pc().candidates:[]).map(c=>c.key);}
function earthquake(){gameState.activePlayer=1;const e=mk('地割れ',1);gameState.players[1].hand=[e];baselineA();duelActivateFromHand(0);return e;}
function attackOn(p,atkCard,target){const ai=gameState.players[p].mz.indexOf(atkCard),ti=gameState.players[p===0?1:0].mz.indexOf(target);
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:ai,target:ti});}

/* ===== A: アームズ・ホール — mill the top card (cost), add 1 Equip Spell from the Deck or GY; no Normal Summon / Set this turn ===== */
fresh();
let ah=mk('アームズ・ホール',0),bd=mk('ベビードラゴン',0),ax=mk('デーモンの斧',0),dx=mk('団結の力',0),top=mk('ワイト',0);
gameState.players[0].hand=[ah,bd];gameState.players[0].deck=[top,dx,mk('ワイト',0),mk('ワイト',0)];gameState.players[0].grave=[ax];baselineA();
ok('A0: before — the monster in the hand can be Normal Summoned and Set',acts(0,bd).includes('normalSummon')&&acts(0,bd).includes('setMonster'),JSON.stringify(acts(0,bd)));
cast(0,'アームズ・ホール',[ax.uid]);
ok('A: the top card of the Deck went to the GY as the cost',z(top)==='grave'&&gameState.players[0].deck.length===3,JSON.stringify({top:z(top),deck:gameState.players[0].deck.length}));
ok('A: 1 Equip Spell from the GY was added to the hand (デーモンの斧); the one in the Deck stayed',z(ax)==='hand'&&z(dx)==='deck',JSON.stringify({ax:z(ax),dx:z(dx)}));
ok('A: Arms Hole itself was sent to the GY after resolving',z(ah)==='grave');
ok('A: this turn the player cannot Normal Summon nor Set',gameState.players[0].normalSummonUsed===true&&!acts(0,bd).includes('normalSummon')&&!acts(0,bd).includes('setMonster'),JSON.stringify(acts(0,bd)));
audit('A');
nextTurn();nextTurn();toPhase('main1');
ok('A: its next turn the Normal Summon is available again',gameState.turn===7&&gameState.players[0].normalSummonUsed===false&&acts(0,bd).includes('normalSummon'),JSON.stringify({t:gameState.turn,u:gameState.players[0].normalSummonUsed,a:acts(0,bd)}));

/* A2: from the Deck (the Equip Spell chosen among both piles) */
fresh();
ah=mk('アームズ・ホール',0);ax=mk('デーモンの斧',0);dx=mk('団結の力',0);top=mk('ワイト',0);
gameState.players[0].hand=[ah];gameState.players[0].deck=[top,dx,mk('ワイト',0)];gameState.players[0].grave=[ax];baselineA();
cast(0,'アームズ・ホール',[dx.uid]);
ok('A2: the Equip Spell from the Deck (団結の力) is added; the one in the GY stays',z(dx)==='hand'&&z(ax)==='grave'&&z(top)==='grave',JSON.stringify({dx:z(dx),ax:z(ax),top:z(top)}));
audit('A2');

/* A3: the top card is itself the Equip Spell: it is milled as the cost and can then be taken from the GY */
fresh();
ah=mk('アームズ・ホール',0);dx=mk('団結の力',0);
gameState.players[0].hand=[ah];gameState.players[0].deck=[dx];baselineA();
cast(0,'アームズ・ホール',[dx.uid]);
ok('A3: the milled Equip Spell (団結の力) is taken from the GY into the hand',z(dx)==='hand'&&gameState.players[0].deck.length===0,JSON.stringify({dx:z(dx)}));
audit('A3');

/* A4: no Equip Spell at all — the cost is still paid, nothing is added */
fresh();
ah=mk('アームズ・ホール',0);top=mk('ワイト',0);
gameState.players[0].hand=[ah];gameState.players[0].deck=[top,mk('ワイト',0)];baselineA();
cast(0,'アームズ・ホール');
ok('A4: no Equip Spell in the Deck or GY — the top card is milled, the hand stays empty, no choice is left open',z(top)==='grave'&&gameState.players[0].hand.length===0&&!pc(),JSON.stringify({top:z(top),hand:gameState.players[0].hand.length}));
audit('A4');

/* A5: negatives — a Normal Summon / Set already used this turn; an empty Deck */
fresh();
ah=mk('アームズ・ホール',0);bd=mk('ベビードラゴン',0);
gameState.players[0].hand=[ah,bd];baselineA();
ok('A5: control — activatable with the Normal Summon right unused',legalHand('アームズ・ホール',0,0).ok,JSON.stringify(legalHand('アームズ・ホール',0,0)));
doNormalSummon(1,'atk');drive();
ok('A5: after Normal Summoning — not activatable',z(bd)==='mz'&&!legalHand('アームズ・ホール',0,gameState.players[0].hand.indexOf(ah)).ok);
fresh();
ah=mk('アームズ・ホール',0);gameState.players[0].hand=[ah];gameState.players[0].deck=[];baselineA();
ok('A5: empty Deck — not activatable',!legalHand('アームズ・ホール',0,0).ok);

/* ===== B: 暗黒界に続く結界通路 — Special Summon 1 「暗黒界」 from the GY; no Normal / Flip / Special Summon the turn it is activated ===== */
fresh();
let kk=mk('暗黒界に続く結界通路',0),br=mk('暗黒界の狩人 ブラウ',0),wg=mk('ワイト',0);bd=mk('ベビードラゴン',0);
gameState.players[0].hand=[kk,bd];gameState.players[0].grave=[wg,br];baselineA();
ok('B0: control — the Normal Summon of the hand monster is available',acts(0,bd).includes('normalSummon'));
cast(0,'暗黒界に続く結界通路',[br.uid]);
ok('B: 暗黒界の狩人 ブラウ is Special Summoned from the GY; ワイト (not 「暗黒界」) was not offered',z(br)==='mz'&&z(wg)==='grave'&&z(kk)==='grave',JSON.stringify({br:z(br),wg:z(wg),kk:z(kk)}));
ok('B: the rest of the turn — no Normal Summon, Set nor Special Summon',!acts(0,bd).includes('normalSummon')&&!!v46SpecialSummonRestrictionReason(0,dbOf(bd)),JSON.stringify({a:acts(0,bd),r:v46SpecialSummonRestrictionReason(0,dbOf(bd))}));
audit('B');
nextTurn();nextTurn();toPhase('main1');
ok('B: its next turn the lock is gone',gameState.turn===7&&acts(0,bd).includes('normalSummon')&&!v46SpecialSummonRestrictionReason(0,dbOf(bd)),JSON.stringify({a:acts(0,bd)}));
/* B2: negatives */
fresh();
kk=mk('暗黒界に続く結界通路',0);wg=mk('ワイト',0);gameState.players[0].hand=[kk];gameState.players[0].grave=[wg];baselineA();
ok('B2: only a non-「暗黒界」 monster in the GY — not activatable',!legalHand('暗黒界に続く結界通路',0,0).ok);
fresh();
kk=mk('暗黒界に続く結界通路',0);br=mk('暗黒界の狩人 ブラウ',0);bd=mk('ベビードラゴン',0);gameState.players[0].hand=[kk,bd];gameState.players[0].grave=[br];baselineA();
doNormalSummon(1,'atk');drive();
ok('B2: after Normal Summoning — not activatable',z(bd)==='mz'&&!legalHand('暗黒界に続く結界通路',0,gameState.players[0].hand.indexOf(kk)).ok);
fresh();
kk=mk('暗黒界に続く結界通路',0);br=mk('暗黒界の狩人 ブラウ',0);gameState.players[0].hand=[kk];gameState.players[0].grave=[br];gameState.players[1].grave=[mk('暗黒界の斥候 スカー',1)];baselineA();
ok('B2: a 「暗黒界」 monster only in the opponent\'s GY does not count',legalHand('暗黒界に続く結界通路',0,0).ok);
gameState.players[0].grave=[];
ok('B2: ... and with none in its own GY it cannot be activated',!legalHand('暗黒界に続く結界通路',0,0).ok);

/* ===== C: ネオフレムベル・ガルーダ — own End Phase, another 「フレムベル」 on the field: banish 1 card of the opponent's GY (forced) ===== */
fresh();
let ga=up('ネオフレムベル・ガルーダ',0),hd=up('フレムベル・ヘルドッグ',0),gw=mk('ワイト',1),gb=mk('青眼の白龍',1);
gameState.players[0].mz=[ga,hd];gameState.players[1].grave=[gw,gb];baselineA();
PREFER=[gb.uid];toPhase('end');drive();PREFER=[];
ok('C: at its End Phase the chosen card of the opponent\'s GY (青眼の白龍) is banished; the other stays',gameState.phase==='end'&&z(gb)==='banish'&&z(gw)==='grave',JSON.stringify({ph:gameState.phase,gb:z(gb),gw:z(gw)}));
audit('C');
/* C2: no other 「フレムベル」 */
fresh();
ga=up('ネオフレムベル・ガルーダ',0);gb=mk('青眼の白龍',1);gameState.players[0].mz=[ga,up('ワイト',0)];gameState.players[1].grave=[gb];baselineA();
toPhase('end');drive();
ok('C2: no other 「フレムベル」 monster — nothing is banished',z(gb)==='grave');
audit('C2');
/* C3: the opponent's End Phase — not the controller's */
fresh();
ga=up('ネオフレムベル・ガルーダ',0);hd=up('フレムベル・ヘルドッグ',0);gb=mk('青眼の白龍',1);gameState.players[0].mz=[ga,hd];gameState.players[1].grave=[gb];
gameState.activePlayer=1;gameState.turn=6;baselineA();
toPhase('end');drive();
ok('C3: at the opponent\'s End Phase — nothing is banished',gameState.phase==='end'&&z(gb)==='grave');
/* C4: a face-down 「フレムベル」 does not count; the controller's own GY is not a target */
fresh();
ga=up('ネオフレムベル・ガルーダ',0);gb=mk('青眼の白龍',1);let ownG=mk('ワイト',0);
gameState.players[0].mz=[ga,setT('フレムベル・ヘルドッグ',0)];gameState.players[0].grave=[ownG];gameState.players[1].grave=[gb];baselineA();
toPhase('end');drive();
ok('C4: the other 「フレムベル」 is face-down — nothing is banished',z(gb)==='grave'&&z(ownG)==='grave');
/* C5: empty opponent GY — nothing happens (no crash, no prompt left) */
fresh();
ga=up('ネオフレムベル・ガルーダ',0);hd=up('フレムベル・ヘルドッグ',0);gameState.players[0].mz=[ga,hd];ownG=mk('ワイト',0);gameState.players[0].grave=[ownG];baselineA();
toPhase('end');drive();
ok('C5: the opponent\'s GY is empty — nothing banished, no choice left open, own GY untouched',!pc()&&z(ownG)==='grave');

/* ===== D: ジェネクス・ガイア — when destroyed, may destroy 1 face-up 「ジェネクス・コントローラー」 you control instead ===== */
fresh();
let gi=up('ジェネクス・ガイア',0),gc=up('ジェネクス・コントローラー',0);
gameState.players[0].mz=[gi,gc];gameState.players[1].mz=[up('ギガンテス',1)];
let eq=earthquake();
let paused=driveSub();let q=pc();
ok('D: 地割れ destroys the lowest ATK (ジェネクス・ガイア 1000): the controller is asked, with ジェネクス・コントローラー as the only substitute',paused&&q.player===0&&q.title.indexOf('ジェネクス・ガイア')===0&&JSON.stringify(keys())===JSON.stringify(['sub:'+gc.uid,'decline']),JSON.stringify(q&&{p:q.player,t:q.title,k:keys()}));
ok('D: nothing moved while the decision is pending',z(gi)==='mz'&&z(gc)==='mz');
answer('sub:'+gc.uid);driveSub();
ok('D: used — ジェネクス・コントローラー is destroyed instead, ジェネクス・ガイア stays',z(gi)==='mz'&&z(gc)==='grave'&&z(eq)==='grave',JSON.stringify({gi:z(gi),gc:z(gc)}));
audit('D');
fresh();
gi=up('ジェネクス・ガイア',0);gc=up('ジェネクス・コントローラー',0);gameState.players[0].mz=[gi,gc];gameState.players[1].mz=[up('ギガンテス',1)];
eq=earthquake();driveSub();answer('decline');driveSub();
ok('D2: declined — ジェネクス・ガイア is destroyed, ジェネクス・コントローラー stays (optional: 「できる」)',z(gi)==='grave'&&z(gc)==='mz');
audit('D2');
fresh();
gi=up('ジェネクス・ガイア',0);let ot=up('ジェネクス・ニュートロン',0);gameState.players[0].mz=[gi,ot];gameState.players[1].mz=[up('ギガンテス',1)];
eq=earthquake();paused=driveSub();
ok('D3: another 「ジェネクス」 that is not ジェネクス・コントローラー is no substitute — nothing is asked, Gaia is destroyed',!paused&&z(gi)==='grave'&&z(ot)==='mz',JSON.stringify({gi:z(gi),ot:z(ot)}));
fresh();
gi=up('ジェネクス・ガイア',0);gc=setT('ジェネクス・コントローラー',0);gameState.players[0].mz=[gi,gc];gameState.players[1].mz=[up('ギガンテス',1)];
eq=earthquake();paused=driveSub();
ok('D4: a face-down ジェネクス・コントローラー is no substitute (must be face-up)',!paused&&z(gi)==='grave'&&z(gc)==='mz');
/* D5: battle destruction */
fresh();
gi=up('ジェネクス・ガイア',0);gc=up('ジェネクス・コントローラー',0);gameState.players[0].mz=[gi,gc];
let bl=up('青眼の白龍',1);gameState.players[1].mz=[bl];gameState.activePlayer=1;gameState.phase='battle';baselineA();
attackOn(1,bl,gi);paused=driveSub();q=pc();
ok('D5: battle destruction of ジェネクス・ガイア pauses and asks the same question',paused&&q.player===0&&q.title==='ジェネクス・ガイア：戦闘で破壊されます'&&JSON.stringify(keys())===JSON.stringify(['sub:'+gc.uid,'decline']),JSON.stringify(q&&{t:q.title,k:keys()}));
answer('sub:'+gc.uid);driveSub();
ok('D5: used — コントローラー destroyed, ガイア stays on the field',z(gi)==='mz'&&z(gc)==='grave',JSON.stringify({gi:z(gi),gc:z(gc)}));
audit('D5');

/* ===== E: ウィード — when destroyed, may destroy another face-up Plant-Type monster you control instead ===== */
fresh();
let wd=up('ウィード',0),pl=up('アルラウネ',0),nonpl=up('ワイト',0);
gameState.players[0].mz=[wd,pl,nonpl];bl=up('青眼の白龍',1);gameState.players[1].mz=[bl];gameState.activePlayer=1;gameState.phase='battle';baselineA();
attackOn(1,bl,wd);paused=driveSub();q=pc();
ok('E: Weed is destroyed by battle: only the other Plant (アルラウネ) is offered, not the non-Plant ワイト',paused&&q.player===0&&JSON.stringify(keys())===JSON.stringify(['sub:'+pl.uid,'decline']),JSON.stringify(q&&{t:q.title,k:keys()}));
answer('sub:'+pl.uid);driveSub();
ok('E: used — アルラウネ is destroyed instead, ウィード stays',z(wd)==='mz'&&z(pl)==='grave'&&z(nonpl)==='mz',JSON.stringify({wd:z(wd),pl:z(pl),nonpl:z(nonpl)}));
audit('E');
fresh();
wd=up('ウィード',0);pl=up('アルラウネ',0);gameState.players[0].mz=[wd,pl];bl=up('青眼の白龍',1);gameState.players[1].mz=[bl];gameState.activePlayer=1;gameState.phase='battle';baselineA();
attackOn(1,bl,wd);driveSub();answer('decline');driveSub();
ok('E2: declined — ウィード is destroyed, アルラウネ stays (optional)',z(wd)==='grave'&&z(pl)==='mz');
audit('E2');
fresh();
wd=up('ウィード',0);nonpl=up('ジェネクス・コントローラー',0);gameState.players[0].mz=[wd,nonpl];gameState.players[1].mz=[up('ギガンテス',1)];
eq=earthquake();paused=driveSub();
ok('E3: no other Plant — nothing is asked, ウィード is destroyed by 地割れ',!paused&&z(wd)==='grave'&&z(nonpl)==='mz',JSON.stringify({wd:z(wd)}));
fresh();
wd=up('ウィード',0);pl=setT('アルラウネ',0);gameState.players[0].mz=[wd,pl];bl=up('青眼の白龍',1);gameState.players[1].mz=[bl];gameState.activePlayer=1;gameState.phase='battle';baselineA();
attackOn(1,bl,wd);paused=driveSub();
ok('E4: a face-down Plant is no substitute — nothing is asked, ウィード is destroyed',!paused&&z(wd)==='grave'&&z(pl)==='mz',JSON.stringify({paused,wd:z(wd),pl:z(pl)}));

/* ===== F: エーリアン・サイコ — Normal / Flip Summon → Defense Position (forced); A-Counter monsters cannot declare an attack while it is face-up ===== */
fresh();
let ps=mk('エーリアン・サイコ',0);gameState.players[0].hand=[ps];baselineA();
doNormalSummon(0,'atk');drive();
ok('F1: Normal Summoned → Defense Position',z(ps)==='mz'&&C(ps).face==='up'&&C(ps).pos==='def',JSON.stringify({z:z(ps),pos:z(ps)==='mz'?C(ps).pos:null}));
audit('F1');
fresh();
ps=setT('エーリアン・サイコ',0);ps.pos='def';gameState.players[0].mz=[ps];baselineA();
doFlipUp(0,'mz',0,'atk');drive();
ok('F2: Flip Summoned (as Attack Position) → Defense Position',z(ps)==='mz'&&C(ps).face==='up'&&C(ps).pos==='def',JSON.stringify({pos:C(ps).pos}));
audit('F2');
fresh();
ps=mk('エーリアン・サイコ',0);let rv=mk('死者蘇生',0);gameState.players[0].hand=[rv];gameState.players[0].grave=[ps];baselineA();
PREFER=[ps.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('F3: Special Summoned (死者蘇生) → no position change, stays in Attack Position',z(ps)==='mz'&&C(ps).pos==='atk',JSON.stringify({pos:z(ps)==='mz'?C(ps).pos:null}));
/* F4: the attack lock */
fresh();
ps=up('エーリアン・サイコ',0,'def');let tgt=up('ワイト',0,'def');
let ac=up('ベビードラゴン',1),nc=up('ワイト',1);ac.counters={'A':1};
gameState.players[0].mz=[ps,tgt];gameState.players[1].mz=[ac,nc];gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';baselineA();
hitT(1,ac,tgt);
ok('F4: the monster with an A-Counter cannot declare an attack while エーリアン・サイコ is face-up',!canDeclareAttackV48(C(ac))&&!C(ac).attacked&&z(tgt)==='mz',JSON.stringify({can:canDeclareAttackV48(C(ac)),att:C(ac).attacked}));
ok('F4: the monster without a counter can still attack',canDeclareAttackV48(C(nc)));
hitT(1,nc,tgt);
ok('F4: ... and does (ワイト 300 destroys the Defense ワイト, DEF 200)',z(tgt)==='grave'&&z(nc)==='mz',JSON.stringify({tgt:z(tgt),nc:z(nc)}));
audit('F4');
/* F5: control — no エーリアン・サイコ: the A-Counter monster attacks; and a face-down one does not lock */
fresh();
tgt=up('ワイト',0,'def');ac=up('ベビードラゴン',1);ac.counters={'A':1};
gameState.players[0].mz=[tgt];gameState.players[1].mz=[ac];gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';baselineA();
ok('F5: control — without エーリアン・サイコ the A-Counter monster can declare an attack',canDeclareAttackV48(C(ac)));
fresh();
ps=setT('エーリアン・サイコ',0);tgt=up('ワイト',0,'def');ac=up('ベビードラゴン',1);ac.counters={'A':1};
gameState.players[0].mz=[ps,tgt];gameState.players[1].mz=[ac];gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';baselineA();
ok('F5: a face-down エーリアン・サイコ does not lock',canDeclareAttackV48(C(ac)));
`);
