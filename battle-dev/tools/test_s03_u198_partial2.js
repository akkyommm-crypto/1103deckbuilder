/* S03-U198: PARTIAL → TESTED — 深海のディーヴァ, ヒーロー・キッズ, 充電池メン (summon triggers), バスター・ビースト, ビーストライカー, ネフティスの導き手
   (ignition + cost), 闇・道化師のペーテン (sent to the GY; banish itself as the cost). Real DUEL paths, Replay-audited.
   Other cards named here are TESTED / GENERIC_OK. */
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
let PREFER=[],MULTI=null,TRIG=[];
function step(){const q=pc();if(!q)return false;
  if(MULTI&&q.max>1){const keys=q.candidates.filter(x=>MULTI.includes(x.uid)).map(x=>x.key);MULTI=null;answerChoiceV49(keys);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function acts(){return v41ReplayPackage(gameState).actions.map(x=>x.action||x);}
function hi(c){return gameState.players[0].hand.indexOf(C(c));}

/* ===== A: 深海のディーヴァ — Normal Summon: a Level 3 or lower Sea Serpent from the Deck ===== */
fresh();
let dv=mk('深海のディーヴァ',0),ss=mk('シー・アーチャー',0);gameState.players[0].hand=[dv];gameState.players[0].deck.push(ss);baselineA();
doNormalSummon(0,'atk');drive();
ok('A: シー・アーチャー (Sea Serpent, Lv3) special summoned',z(dv)==='mz'&&z(ss)==='mz');
audit('A');

/* ===== B: ヒーロー・キッズ — Special Summoned: any number of 「ヒーロー・キッズ」 from the Deck ===== */
fresh();
let hk=mk('ヒーロー・キッズ',0),k2=mk('ヒーロー・キッズ',0),k3=mk('ヒーロー・キッズ',0),rv=mk('死者蘇生',0);
gameState.players[0].grave=[hk];gameState.players[0].hand=[rv];gameState.players[0].deck.push(k2,k3);baselineA();
PREFER=[hk.uid];MULTI=[k2.uid,k3.uid];duelActivateFromHand(0);drive();PREFER=[];MULTI=null;
ok('B: revived → the 2 「ヒーロー・キッズ」 from the Deck special summoned',z(hk)==='mz'&&z(k2)==='mz'&&z(k3)==='mz');
audit('B');
fresh();
hk=mk('ヒーロー・キッズ',0);k2=mk('ヒーロー・キッズ',0);gameState.players[0].hand=[hk];gameState.players[0].deck.push(k2);baselineA();TRIG.length=0;
doNormalSummon(0,'atk');drive();
ok('B2: Normal Summoned — no activation (Special Summon only)',z(hk)==='mz'&&z(k2)==='deck'&&!TRIG.some(t=>/キッズ/.test(t)));
audit('B2');

/* ===== C: 充電池メン — Tribute Summon: another 「電池メン」 from the hand or the Deck; ATK / DEF +300 per own face-up Thunder ===== */
fresh();
let jd=mk('充電池メン',0),tr=mk('ワイト',0,'up'),tan=mk('電池メン－単三型',0),self2=mk('充電池メン',0);
gameState.players[0].hand=[jd];gameState.players[0].mz=[tr];gameState.players[0].deck.push(self2,tan);baselineA();
PREFER=[tr.uid,tan.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('C: 電池メン－単三型 special summoned (the other 充電池メン is not a candidate)',z(jd)==='mz'&&z(tan)==='mz'&&z(self2)==='deck');
ok('C: 2 Thunders → 1800 + 600 = 2400 / 1200 + 600 = 1800',curATK(C(jd))===2400&&curDEF(C(jd))===1800,JSON.stringify([curATK(C(jd)),curDEF(C(jd))]));
audit('C');

/* ===== D: バスター・ビースト — discard it from the hand (cost): 「バスター・モード」 from the Deck ===== */
fresh();
let bb=mk('バスター・ビースト',0),bm=mk('バスター・モード',0);gameState.players[0].hand=[bb];gameState.players[0].deck.push(bm);baselineA();
duelActivateFromHand(0);drive();
ok('D: バスター・ビースト discarded (cost); バスター・モード added',z(bb)==='grave'&&z(bm)==='hand');
ok('D: the discard is a cost (before CHAIN_ADD)',(function(){const a=acts();const iD=a.findIndex(x=>x.type==='FX_DISCARD'),iC=a.findIndex(x=>x.type==='CHAIN_ADD');return iD>=0&&iC>=0&&iD<iC;})());
audit('D');

/* ===== E: ビーストライカー — discard 1 (cost): モジャ from the Deck; once per turn ===== */
fresh();
let bs=mk('ビーストライカー',0,'up'),dc=mk('ワイト',0),mj=mk('モジャ',0),mj2=mk('モジャ',0);gameState.players[0].mz=[bs];gameState.players[0].hand=[dc];gameState.players[0].deck.push(mj,mj2);baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('E: ワイト discarded; one モジャ special summoned; once per turn',z(dc)==='grave'&&[z(mj),z(mj2)].filter(x=>x==='mz').length===1&&strictScriptLegalityV2('ビーストライカー',0,'mz',0,{}).ok===false);
audit('E');

/* ===== F: ネフティスの導き手 — Tribute another own monster and this card (cost): ネフティスの鳳凰神 from the hand or the Deck ===== */
fresh();
let ng=mk('ネフティスの導き手',0,'up'),ot=mk('ワイト',0,'up'),nf=mk('ネフティスの鳳凰神',0);gameState.players[0].mz=[ng,ot];gameState.players[0].deck.push(nf);baselineA();
PREFER=[ot.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('F: 導き手 and ワイト tributed; ネフティスの鳳凰神 special summoned',z(ng)==='grave'&&z(ot)==='grave'&&z(nf)==='mz');
audit('F');

/* ===== G: 闇・道化師のペーテン — sent to the GY (as a discard cost): banish it, another ペーテン from the hand or the Deck ===== */
fresh();
let pt=mk('闇・道化師のペーテン',0),pd=mk('闇・道化師のペーテン',0),lv=mk('ライトニング・ボルテックス',0);
gameState.players[0].hand=[lv,pt];gameState.players[0].deck.push(pd);gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();
PREFER=[pt.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('G: discarded ペーテン banished (cost); the Deck ペーテン special summoned',z(pt)==='banish'&&z(pd)==='mz');
audit('G');
`);
