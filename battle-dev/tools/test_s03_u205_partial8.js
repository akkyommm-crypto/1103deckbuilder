/* S03-U205: PARTIAL → TESTED — XX－セイバー ガルセム, 死の花－ネクロ・フルール, アームド・ドラゴン LV3, おジャマジック, インヴェルズを呼ぶ者, スカル・ナイト.
   Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
let PREFER=[],TRIG=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}

/* ===== A: XX－セイバー ガルセム — ATK +200 per own face-up 「X－セイバー」; destroyed by an effect: a 「X－セイバー」 to the hand ===== */
fresh();
let gs=mk('XX－セイバー ガルセム',0,'up'),xs=mk('X－セイバー アナペレラ',0,'up'),xd=mk('XX－セイバー フラムナイト',0),bh=mk('ブラック・ホール',0);
gameState.players[0].mz=[gs,xs];gameState.players[0].hand=[bh];gameState.players[0].deck.push(xd);baselineA();
const base=dbOf(C(gs)).atk;
ok('A: 2 face-up 「X－セイバー」 (itself + アナペレラ) → +400',curATK(C(gs))===base+400,String(curATK(C(gs))));
duelActivateFromHand(0);drive();
ok('A: destroyed by ブラック・ホール → XX－セイバー フラムナイト added',z(gs)==='grave'&&z(xd)==='hand');
audit('A');
fresh();
gs=mk('XX－セイバー ガルセム',0,'up');xd=mk('XX－セイバー フラムナイト',0);let at=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[gs];gameState.players[0].deck.push(xd);gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('A2: destroyed by battle — no activation',z(gs)==='grave'&&z(xd)==='deck'&&!TRIG.some(t=>/ガルセム/.test(t)));
audit('A2');

/* ===== B: 死の花－ネクロ・フルール — destroyed by an effect: 時花の魔女－フルール・ド・ソルシエール from the Deck ===== */
fresh();
let nf=mk('死の花－ネクロ・フルール',0,'up'),fw=mk('時花の魔女－フルール・ド・ソルシエール',0);bh=mk('ブラック・ホール',0);
gameState.players[0].mz=[nf];gameState.players[0].hand=[bh];gameState.players[0].deck.push(fw);baselineA();
duelActivateFromHand(0);drive();
ok('B: destroyed by ブラック・ホール → 時花の魔女 special summoned',z(nf)==='grave'&&z(fw)==='mz');
audit('B');

/* ===== C: アームド・ドラゴン LV3 — at the own Standby Phase: send it (cost), アームド・ドラゴン LV5 from the hand or the Deck ===== */
fresh();
let a3=mk('アームド・ドラゴン LV3',0,'up'),a5=mk('アームド・ドラゴン LV5',0);gameState.players[0].mz=[a3];gameState.players[0].deck.push(a5);
gameState.phase='draw';baselineA();
phase('standby');
ok('C: at the Standby Phase LV3 sent → LV5 special summoned from the Deck',z(a3)==='grave'&&z(a5)==='mz',JSON.stringify({a3:z(a3),a5:z(a5),TRIG}));
audit('C');
fresh();
a3=mk('アームド・ドラゴン LV3',0,'up');a5=mk('アームド・ドラゴン LV5',0);gameState.players[0].mz=[a3];gameState.players[0].hand=[a5];baselineA();
ok('C2: not in the Main Phase',strictScriptLegalityV2('アームド・ドラゴン LV3',0,'mz',0,{}).ok===false);

/* ===== D: おジャマジック — discarded from the hand: おジャマ・グリーン / イエロー / ブラック, one each ===== */
fresh();
let oj=mk('おジャマジック',0),o1=mk('おジャマ・グリーン',0),o2=mk('おジャマ・イエロー',0),o3=mk('おジャマ・ブラック',0),o4=mk('おジャマ・グリーン',0),lvx=mk('ライトニング・ボルテックス',0);
gameState.players[0].hand=[lvx,oj];gameState.players[0].deck.push(o1,o2,o3,o4);gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();
PREFER=[oj.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D: discarded → one of each おジャマ added (the second グリーン stays)',z(oj)==='grave'&&z(o1)==='hand'&&z(o2)==='hand'&&z(o3)==='hand'&&z(o4)==='deck');
audit('D');

/* ===== E: インヴェルズを呼ぶ者 — tributed for an 「インヴェルズ」 Tribute Summon: a Level 4 or lower 「インヴェルズ」 from the Deck ===== */
fresh();
let ic=mk('インヴェルズを呼ぶ者',0,'up'),ig=mk('インヴェルズ・ギラファ',0),ot=mk('ワイト',0,'up'),iv=mk('インヴェルズの門番',0);
gameState.players[0].mz=[ic,ot];gameState.players[0].hand=[ig];gameState.players[0].deck.push(iv);baselineA();
/* S03-U215: インヴェルズ・ギラファ now also has its 1-Tribute method, so the summon asks which method; this scenario Tributes two monsters
   (the standard method). The harness openPick is a no-op, so the method is chosen here. */
{const opS03=openPick;openPick=(t,s,rows)=>{const r=(rows||[]).find(x=>/2体分/.test(x.label))||(rows||[])[0];if(r)r.onPick();};
PREFER=[ic.uid,ot.uid];doNormalSummon(0,'atk');drive();PREFER=[];openPick=opS03;}
ok('E: ギラファ Tribute Summoned with 呼ぶ者 → インヴェルズの門番 special summoned',z(ig)==='mz'&&z(ic)==='grave'&&z(iv)==='mz',JSON.stringify({iv:z(iv),TRIG}));
audit('E');
fresh();
ic=mk('インヴェルズを呼ぶ者',0,'up');let dem=mk('デーモンの召喚',0);iv=mk('インヴェルズの門番',0);
gameState.players[0].mz=[ic];gameState.players[0].hand=[dem];gameState.players[0].deck.push(iv);baselineA();TRIG.length=0;
doNormalSummon(0,'atk');drive();
ok('E2: tributed for a non-「インヴェルズ」 (デーモンの召喚) — no activation',z(iv)==='deck'&&!TRIG.some(t=>/呼ぶ者/.test(t)));
audit('E2');

/* ===== F: スカル・ナイト — tributed for a Fiend Tribute Summon: another スカル・ナイト from the Deck (forced) ===== */
fresh();
let sk=mk('スカル・ナイト',0,'up'),dm=mk('デーモンの召喚',0),s2=mk('スカル・ナイト',0);
gameState.players[0].mz=[sk];gameState.players[0].hand=[dm];gameState.players[0].deck.push(s2);baselineA();
doNormalSummon(0,'atk');drive();
ok('F: デーモンの召喚 (Fiend) Tribute Summoned with スカル・ナイト → the Deck スカル・ナイト special summoned',z(dm)==='mz'&&z(sk)==='grave'&&z(s2)==='mz');
audit('F');
fresh();
sk=mk('スカル・ナイト',0,'up');let cd=mk('サイバー・ドラゴン',0);s2=mk('スカル・ナイト',0);
gameState.players[0].mz=[sk];gameState.players[0].hand=[cd];gameState.players[0].deck.push(s2);baselineA();TRIG.length=0;
const nsF=getLegalHandActions(0,0).find(a=>a.id==='normalSummon');if(nsF)(new Function(nsF.run))();drive();
ok('F2: tributed for a Machine — no activation',z(s2)==='deck'&&!TRIG.some(t=>/スカル・ナイト/.test(t)));
audit('F2');
`);
