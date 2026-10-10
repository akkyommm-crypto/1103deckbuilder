/* S03-U201: PARTIAL → TESTED — スクラップ・ハンター, スクラップ・リサイクラー, ジェネクス・ニュートロン, ラヴァル炎火山の侍女, ヴォルカニック・バレット,
   宝玉の導き, 賢者の宝石, 氷結界の決起隊, スモール・ピース・ゴーレム / ミッド・ピース・ゴーレム. Real DUEL paths, Replay-audited.
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
let PREFER=[],TRIG=[],SEEN=[];
function step(){const q=pc();if(q){SEEN.push({title:q.title,names:q.candidates.map(x=>x.label||x.name||'')});let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function offered(c){return SEEN.some(s=>s.names.some(n=>String(n).indexOf(cardName(c))>=0));}

/* ===== A: スクラップ・ハンター — once per turn: another own 「スクラップ」 destroyed, a Tuner from the Deck to the GY ===== */
fresh();
let sh=mk('スクラップ・ハンター',0,'up'),sg=mk('スクラップ・ゴブリン',0,'up'),tn=mk('ジャンク・シンクロン',0),nt=mk('ブラッド・ヴォルス',0);
gameState.players[0].mz=[sh,sg];gameState.players[0].deck.push(nt,tn);baselineA();SEEN=[];
PREFER=[sg.uid,tn.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('A: スクラップ・ゴブリン destroyed; ジャンク・シンクロン (Tuner) to the GY; ブラッド・ヴォルス not offered; once per turn',z(sg)==='grave'&&z(tn)==='grave'&&!offered(nt)&&strictScriptLegalityV2('スクラップ・ハンター',0,'mz',0,{}).ok===false);
audit('A');

/* ===== B: スクラップ・リサイクラー — ① summoned: a Machine from the Deck to the GY; ② return 2 Machine / EARTH / Lv4 from the GY: draw 1 ===== */
fresh();
let rc=mk('スクラップ・リサイクラー',0),m1=mk('ジェネクス・サーチャー',0),g1=mk('ジェネクス・サーチャー',0),g2=mk('ジェネクス・サーチャー',0);
gameState.players[0].hand=[rc];gameState.players[0].deck.push(m1);gameState.players[0].grave=[g1,g2];baselineA();
PREFER=[m1.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('B: ① ジェネクス・サーチャー (Machine) sent from the Deck',z(m1)==='grave');
const hB=gameState.players[0].hand.length;
PREFER=[g1.uid,'yes',g2.uid];duelActivateFromZone(0,'mz',findCardByUid(rc.uid).index);drive();PREFER=[];
ok('B: ② the 2 chosen returned to the Deck; drew 1; ② once per turn',z(g1)==='deck'&&z(g2)==='deck'&&gameState.players[0].hand.length===hB+1&&strictScriptLegalityV2('スクラップ・リサイクラー',0,'mz',findCardByUid(rc.uid).index,{}).ok===false);
audit('B');

/* ===== C: ジェネクス・ニュートロン — Normal Summoned this turn: at the End Phase, a Machine Tuner from the Deck ===== */
fresh();
let nu=mk('ジェネクス・ニュートロン',0),mt=mk('ジェネクス・コントローラー',0),wt=mk('ジャンク・シンクロン',0);
gameState.players[0].hand=[nu];gameState.players[0].deck.push(wt,mt);baselineA();
doNormalSummon(0,'atk');drive();SEEN=[];
phase('battle');phase('main2');phase('end');
ok('C: ジェネクス・コントローラー (Machine Tuner) added at the End Phase; ジャンク・シンクロン (Warrior Tuner) not offered',z(mt)==='hand'&&!offered(wt),JSON.stringify(SEEN));
audit('C');

/* ===== D: ラヴァル炎火山の侍女 — sent to the GY with another 「ラヴァル」 in the GY: a 「ラヴァル」 from the Deck to the GY ===== */
fresh();
let lj=mk('ラヴァル炎火山の侍女',0),lg=mk('ラヴァル・ウォリアー',0),ld=mk('ラヴァルのマグマ砲兵',0),lvx=mk('ライトニング・ボルテックス',0);
gameState.players[0].hand=[lvx,lj];gameState.players[0].grave=[lg];gameState.players[0].deck.push(ld);gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();
PREFER=[lj.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D: 侍女 discarded → ラヴァルのマグマ砲兵 sent from the Deck',z(lj)==='grave'&&z(ld)==='grave');
audit('D');

/* ===== E: ヴォルカニック・バレット — in the GY, once per turn, pay 500: another バレット from the Deck ===== */
fresh();
let vb=mk('ヴォルカニック・バレット',0),v2=mk('ヴォルカニック・バレット',0),v3=mk('ヴォルカニック・バレット',0);
gameState.players[0].grave=[vb];gameState.players[0].deck.push(v2,v3);baselineA();
duelActivateFromZone(0,'grave',0);drive();
ok('E: 500 paid, one バレット added; once per turn',gameState.players[0].lp===7500&&[z(v2),z(v3)].filter(x=>x==='hand').length===1&&strictScriptLegalityV2('ヴォルカニック・バレット',0,'grave',0,{}).ok===false);
audit('E');

/* ===== F: 宝玉の導き — 2 「宝玉獣」 in the Spell & Trap Zone: a 「宝玉獣」 from the Deck ===== */
fresh();
let gd=mk('宝玉の導き',0),c1=mk('宝玉獣 ルビー・カーバンクル',0,'up'),c2=mk('宝玉獣 アメジスト・キャット',0,'up'),cd=mk('宝玉獣 サファイア・ペガサス',0);
gameState.players[0].hand=[gd];gameState.players[0].sz=[c1,c2];gameState.players[0].deck.push(cd);baselineA();
duelActivateFromHand(0);drive();
ok('F: 宝玉獣 サファイア・ペガサス special summoned',z(cd)==='mz');
audit('F');
fresh();
gd=mk('宝玉の導き',0);c1=mk('宝玉獣 ルビー・カーバンクル',0,'up');gameState.players[0].hand=[gd];gameState.players[0].sz=[c1];gameState.players[0].deck.push(mk('宝玉獣 サファイア・ペガサス',0));baselineA();
ok('F2: only 1 「宝玉獣」 in the Spell & Trap Zone — not activatable',strictScriptLegalityV2('宝玉の導き',0,'hand',0,{}).ok===false);

/* ===== G: 賢者の宝石 — with ブラック・マジシャン・ガール: ブラック・マジシャン from the hand or the Deck ===== */
fresh();
let jw=mk('賢者の宝石',0),bmg=mk('ブラック・マジシャン・ガール',0,'up'),bm=mk('ブラック・マジシャン',0);
gameState.players[0].hand=[jw];gameState.players[0].mz=[bmg];gameState.players[0].deck.push(bm);baselineA();
duelActivateFromHand(0);drive();
ok('G: ブラック・マジシャン special summoned from the Deck',z(bm)==='mz');
audit('G');

/* ===== H: 氷結界の決起隊 — Tribute it (cost): a WATER monster destroyed, a 「氷結界」 monster from the Deck ===== */
fresh();
let iu=mk('氷結界の決起隊',0,'up'),wa=mk('シー・アーチャー',1,'up'),ib=mk('氷結界の守護陣',0);
gameState.players[0].mz=[iu];gameState.players[1].mz=[wa];gameState.players[0].deck.push(ib);baselineA();
PREFER=[wa.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('H: 決起隊 tributed; シー・アーチャー (WATER) destroyed; 氷結界の守護陣 added',z(iu)==='grave'&&z(wa)==='grave'&&z(ib)==='hand');
audit('H');

/* ===== I: スモール・ピース・ゴーレム — with ビッグ・ピース・ゴーレム: ミッド・ピース・ゴーレム from the Deck, its effect negated ===== */
fresh();
let sp=mk('スモール・ピース・ゴーレム',0),bg=mk('ビッグ・ピース・ゴーレム',0,'up'),md=mk('ミッド・ピース・ゴーレム',0);
gameState.players[0].hand=[sp];gameState.players[0].mz=[bg];gameState.players[0].deck.push(md);baselineA();
doNormalSummon(0,'atk');drive();
ok('I: ミッド・ピース・ゴーレム special summoned with its effect negated',z(md)==='mz'&&effectNegated(C(md))===true);
audit('I');
fresh();
sp=mk('スモール・ピース・ゴーレム',0);md=mk('ミッド・ピース・ゴーレム',0);gameState.players[0].hand=[sp];gameState.players[0].deck.push(md);baselineA();TRIG.length=0;
doNormalSummon(0,'atk');drive();
ok('I2: without ビッグ・ピース・ゴーレム — no activation',z(md)==='deck'&&!TRIG.some(t=>/ピース/.test(t)));
audit('I2');
fresh();
let mdd=mk('ミッド・ピース・ゴーレム',0),bg3=mk('ビッグ・ピース・ゴーレム',0,'up'),smd=mk('スモール・ピース・ゴーレム',0);
gameState.players[0].hand=[mdd];gameState.players[0].mz=[bg3];gameState.players[0].deck.push(smd);baselineA();
doNormalSummon(0,'atk');drive();
ok('I3: ミッド・ピース・ゴーレム summoned with ビッグ → スモール・ピース・ゴーレム special summoned, its effect negated',z(smd)==='mz'&&effectNegated(C(smd))===true);
audit('I3');
`);
