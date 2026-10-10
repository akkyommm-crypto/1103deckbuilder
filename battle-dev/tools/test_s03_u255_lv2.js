/* S03-U255: LV monsters 2 — アルティメット・インセクト LV1 / LV3 / LV5 / LV7, 漆黒の魔王 LV6 / LV8, アームド・ドラゴン LV5 / LV7 / LV10, 異次元の狂獣
   (2011 texts). Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function up(n,p,pos){return mk(n,p,'up',pos);}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function ign(c,prefer){const h=findCardByUid(c.uid);PREFER=(prefer||[]).slice();duelActivateFromZone(h.p,'mz',h.index);drive();PREFER=[];}
function hit(a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:findCardByUid(a.uid).p,atkIdx:findCardByUid(a.uid).index,target:findCardByUid(t.uid).index});drive();}
function toStandby(turn){gameState.turn=turn;gameState.activePlayer=0;gameState.phase='draw';ensureAllCardUids(gameState);baselineA();phase('standby');}
function toMain(turn){gameState.turn=turn;gameState.activePlayer=0;gameState.phase='main1';ensureAllCardUids(gameState);baselineA();}
function src(c){const s=C(c).summonSrcS03;return s?s.name:null;}

/* ===== A: アルティメット・インセクト LV1 → LV3 → LV5 → LV7 at own Standby Phases; each debuff only when summoned by the previous LV ===== */
fresh();
let i1=up('アルティメット・インセクト LV1',0),i3=mk('アルティメット・インセクト LV3',0),i5=mk('アルティメット・インセクト LV5',0),i7=mk('アルティメット・インセクト LV7',0),be=up('青眼の白龍',1);
i1.summonedTurn=3;gameState.players[0].mz=[i1];gameState.players[0].deck.push(i3,i5,i7);gameState.players[1].mz=[be];
toStandby(5);
ok('A: LV1 → LV3 (summoned by LV1); 青眼の白龍 3000 − 300',z(i1)==='grave'&&z(i3)==='mz'&&src(i3)==='アルティメット・インセクト LV1'&&curATK(C(be))===2700,JSON.stringify({i1:z(i1),i3:z(i3),src:src(i3),atk:curATK(C(be))}));
audit('A1');
toStandby(7);
ok('A: LV3 → LV5; 3000 − 500',z(i3)==='grave'&&z(i5)==='mz'&&curATK(C(be))===2500,JSON.stringify({i5:z(i5),atk:curATK(C(be))}));
audit('A2');
toStandby(9);
ok('A: LV5 → LV7; ATK / DEF − 700',z(i5)==='grave'&&z(i7)==='mz'&&curATK(C(be))===2300&&curDEF(C(be))===1800,JSON.stringify({i7:z(i7),atk:curATK(C(be)),def:curDEF(C(be))}));
audit('A3');
fresh();
i1=up('アルティメット・インセクト LV1',0);i3=mk('アルティメット・インセクト LV3',0);i1.summonedTurn=5;gameState.players[0].mz=[i1];gameState.players[0].deck.push(i3);
toStandby(5);
ok('A4: summoned this turn — no LV-up',z(i1)==='mz'&&z(i3)==='deck');
fresh();
i3=up('アルティメット・インセクト LV3',0);i7=up('アルティメット・インセクト LV7',0);be=up('青眼の白龍',1);gameState.players[0].mz=[i3,i7];gameState.players[1].mz=[be];baselineA();
ok('A5: LV3 / LV7 not summoned by the previous LV — no debuff',curATK(C(be))===3000&&curDEF(C(be))===2500,JSON.stringify({atk:curATK(C(be))}));
fresh();
i1=up('アルティメット・インセクト LV1',0);let wt=up('ワイト',0);gameState.players[0].mz=[i1,wt];gameState.players[1].hand=[mk('ブラック・ホール',1)];gameState.activePlayer=1;baselineA();
cast(1,'ブラック・ホール');
ok('A6: LV1 is unaffected by Spells (ブラック・ホール destroys only ワイト)',z(i1)==='mz'&&z(wt)==='grave',JSON.stringify({i1:z(i1),wt:z(wt)}));
audit('A6');

/* ===== B: 漆黒の魔王 LV4 → LV6 (summoned by LV4) negates キラー・トマト destroyed by battle → LV8 (summoned by LV6) banishes what it destroys ===== */
fresh();
let d4=up('漆黒の魔王 LV4',0),d6=mk('漆黒の魔王 LV6',0),d8=mk('漆黒の魔王 LV8',0),w1=up('ワイト',1);
gameState.players[0].mz=[d4];gameState.players[0].deck.push(d6,d8);gameState.players[1].mz=[w1];gameState.phase='battle';baselineA();
hit(d4,w1);
ok('B: LV4 destroys ワイト by battle',z(w1)==='grave');
toStandby(7);
ok('B: next Standby — LV4 → LV6, recorded as summoned by LV4',z(d4)==='grave'&&z(d6)==='mz'&&src(d6)==='漆黒の魔王 LV4',JSON.stringify({d6:z(d6),src:src(d6)}));
let kt=up('キラー・トマト',1);gameState.players[1].mz=[kt];gameState.phase='battle';ensureAllCardUids(gameState);baselineA();
hit(d6,kt);
ok('B: LV6 destroys キラー・トマト — its effect is negated (no monster special summoned from the Deck)',z(kt)==='grave'&&gameState.players[1].mz.length===0&&C(d6).battleKillEffectTurnS03===7,JSON.stringify({kt:z(kt),mz1:gameState.players[1].mz.map(cardName),t:C(d6).battleKillEffectTurnS03}));
audit('B1');
toStandby(9);
ok('B: next Standby — LV6 → LV8, summoned by LV6',z(d6)==='grave'&&z(d8)==='mz'&&src(d8)==='漆黒の魔王 LV6',JSON.stringify({d8:z(d8),src:src(d8)}));
let kt2=up('キラー・トマト',1);gameState.players[1].mz=[kt2];gameState.phase='battle';ensureAllCardUids(gameState);baselineA();
hit(d8,kt2);
ok('B: LV8 destroys キラー・トマト — banished, not sent to the GY; nothing summoned',z(kt2)==='banish'&&gameState.players[1].mz.length===0,JSON.stringify({kt2:z(kt2),mz1:gameState.players[1].mz.map(cardName)}));
audit('B2');
fresh();
d6=up('漆黒の魔王 LV6',0);kt=up('キラー・トマト',1);gameState.players[0].mz=[d6];gameState.players[1].mz=[kt];gameState.phase='battle';baselineA();
hit(d6,kt);
ok('B3 control: LV6 not summoned by LV4 — キラー・トマト\'s effect special summons ワイト',z(kt)==='grave'&&gameState.players[1].mz.some(c=>cardName(c)==='ワイト'),JSON.stringify({mz1:gameState.players[1].mz.map(cardName)}));
audit('B3');
fresh();
d8=up('漆黒の魔王 LV8',0);w1=up('ワイト',1);gameState.players[0].mz=[d8];gameState.players[1].mz=[w1];gameState.phase='battle';baselineA();
hit(d8,w1);
ok('B4 control: LV8 not summoned by LV6 — ワイト goes to the GY',z(w1)==='grave');

/* ===== C: 異次元の狂獣 — a monster it destroys by battle is banished ===== */
fresh();
let bx=up('異次元の狂獣',0);w1=up('ワイト',1);gameState.players[0].mz=[bx];gameState.players[1].mz=[w1];gameState.phase='battle';baselineA();
hit(bx,w1);
ok('C: ワイト destroyed by 異次元の狂獣 is banished',z(w1)==='banish',JSON.stringify({w1:z(w1)}));
audit('C');

/* ===== D: アームド・ドラゴン LV5 ① / ② → LV7 ① → LV10 ===== */
fresh();
let a5=up('アームド・ドラゴン LV5',0),hb=mk('青眼の白龍',0),gw=up('ジェネティック・ワーウルフ',1),w2=up('ワイト',1);
gameState.players[0].mz=[a5];gameState.players[0].hand=[hb];gameState.players[1].mz=[gw,w2];baselineA();
ign(a5,[hb.uid,gw.uid]);
ok('D: LV5 ① — 青眼の白龍 (3000) from the hand to the GY, ジェネティック・ワーウルフ (2000) destroyed',z(hb)==='grave'&&z(gw)==='grave'&&z(w2)==='mz',JSON.stringify({hb:z(hb),gw:z(gw)}));
audit('D1');
fresh();
a5=up('アームド・ドラゴン LV5',0);gw=up('ジェネティック・ワーウルフ',1);gameState.players[0].mz=[a5];gameState.players[0].hand=[mk('ワイト',0)];gameState.players[1].mz=[gw];baselineA();
ok('D2: only ワイト (300) in the hand — no opponent monster with ATK ≤ 300, not activatable',!strictScriptLegalityV2('アームド・ドラゴン LV5',0,'mz',0,{}).ok);
fresh();
a5=up('アームド・ドラゴン LV5',0);let a7=mk('アームド・ドラゴン LV7',0),a10=mk('アームド・ドラゴン LV10',0);w2=up('ワイト',1);
gameState.players[0].mz=[a5];gameState.players[0].deck.push(a7);gameState.players[1].mz=[w2];gameState.phase='battle';baselineA();
hit(a5,w2);phase('main2');phase('end');
ok('D3: LV5 ② — battle kill → End Phase: LV5 → LV7 (summoned by LV5)',z(a5)==='grave'&&z(a7)==='mz'&&src(a7)==='アームド・ドラゴン LV5',JSON.stringify({a5:z(a5),a7:z(a7)}));
audit('D3');
let g1=up('ジェネティック・ワーウルフ',1),g2=up('青眼の白龍',1),fd=mk('ワイト',1,'down','def');gameState.players[1].mz=[g1,g2,fd];
gameState.players[0].hand=[mk('ジェネティック・ワーウルフ',0),a10];toMain(7);
ign(a7,[gameState.players[0].hand[0].uid]);
ok('D4: LV7 ① — sends ジェネティック・ワーウルフ (2000): destroys the opponent\'s monsters with ATK ≤ 2000 (also the face-down ワイト), not 青眼の白龍',z(g1)==='grave'&&z(fd)==='grave'&&z(g2)==='mz',JSON.stringify({g1:z(g1),g2:z(g2),fd:z(fd)}));
audit('D4');
const lg10=strictSummonProcedureLegality('アームド・ドラゴン LV10',0,'hand',0);
runSummonProcedure('アームド・ドラゴン LV10',0,'hand',0);if(!gameState.pendingSummon&&!pc())finishSummonProcedure('アームド・ドラゴン LV10',0,'hand',0,'atk');drive();
ok('D5: LV10 special summoned from the hand by releasing LV7',lg10.ok===true&&z(a10)==='mz'&&z(a7)==='grave',JSON.stringify({lg10,a10:z(a10),a7:z(a7)}));
let f2=up('ワイト',1),f3=mk('ジェネティック・ワーウルフ',1,'down','def');gameState.players[1].mz.push(f2,f3);gameState.players[0].hand.push(mk('ワイト',0));ensureAllCardUids(gameState);baselineA();
ign(a10);
ok('D6: LV10 — discard 1: destroys the opponent\'s face-up monsters (青眼, ワイト), not the face-down one',z(g2)==='grave'&&z(f2)==='grave'&&z(f3)==='mz',JSON.stringify({g2:z(g2),f2:z(f2),f3:z(f3)}));
audit('D6');
fresh();
a10=mk('アームド・ドラゴン LV10',0);a7=mk('アームド・ドラゴン LV7',0);gameState.players[0].hand=[a10,a7];baselineA();
ok('D7: no LV7 on the field — LV10\'s procedure is not legal; LV7 cannot be special summoned by another effect',strictSummonProcedureLegality('アームド・ドラゴン LV10',0,'hand',0).ok===false&&!API.specialSummon(0,'hand',1,'atk','リミッター解除')&&z(a7)==='hand');
`);
