/* S03-U200: PARTIAL → TESTED — summon searches (ジェネクス・パワー・プランナー, ジェネクス・ブラスト, ジェムレシス, レアル・ジェネクス・クラッシャー /
   ターボ / マグナ, リチュア・アビス), Flip searches (リチュア・エリアル, ジェムタートル), Deck Spells (召喚師のスキル, 氷結界の紋章, 精神統一,
   緊急鋼核処分). Each with a near miss left in the Deck. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
/* the Deck is examined at resolution: the near miss must not be a candidate */
function offered(c){return SEEN.some(s=>s.names.some(n=>String(n).indexOf(cardName(c))>=0));}

/* ===== A: Normal Summon searches ===== */
function summonSearch(label, src, hit, miss){
  fresh();const s=mk(src,0),h=mk(hit,0),m=mk(miss,0);gameState.players[0].hand=[s];gameState.players[0].deck.push(m,h);baselineA();SEEN=[];
  PREFER=[h.uid];doNormalSummon(0,'atk');drive();PREFER=[];
  ok(label+': '+hit+' added; '+miss+' not offered',z(h)==='hand'&&z(m)==='deck'&&!offered(m),JSON.stringify(SEEN));
  audit(label);
}
summonSearch('A1 ジェネクス・パワー・プランナー','ジェネクス・パワー・プランナー','ジェネクス・ドクター','ジェネクス・コントローラー');   // Lv3 effect vs Lv3 Normal
summonSearch('A2 ジェムレシス','ジェムレシス','ジェムナイト・ガネット','ブラッド・ヴォルス');
summonSearch('A3 レアル・ジェネクス・クラッシャー','レアル・ジェネクス・クラッシャー','レアル・ジェネクス・アクセラレーター','ジェネクス・サーチャー');   // Lv4 レアル vs Lv4 not レアル
summonSearch('A4 レアル・ジェネクス・ターボ','レアル・ジェネクス・ターボ','ジェネクス・パワー・プランナー','ジェネクス・コントローラー');   // Lv1 vs Lv3
summonSearch('A5 レアル・ジェネクス・マグナ','レアル・ジェネクス・マグナ','レアル・ジェネクス・クラッシャー','ジェネクス・ドクター');     // Lv2 レアル vs Lv3
summonSearch('A6 リチュア・アビス','リチュア・アビス','リチュア・チェイン','リチュア・ビースト');   // DEF 1000 vs 1300

/* ===== B: ジェネクス・ブラスト — Special Summoned: a DARK 「ジェネクス」 ===== */
fresh();
let gb=mk('ジェネクス・ブラスト',0),dk=mk('ジェネクス・コントローラー',0),wt=mk('ジェネクス・ウンディーネ',0),rv=mk('死者蘇生',0);
gameState.players[0].grave=[gb];gameState.players[0].hand=[rv];gameState.players[0].deck.push(wt,dk);baselineA();SEEN=[];
PREFER=[gb.uid,dk.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('B: revived → ジェネクス・コントローラー (DARK) added; ジェネクス・ウンディーネ (WATER) not offered',z(gb)==='mz'&&z(dk)==='hand'&&z(wt)==='deck'&&!offered(wt));
audit('B');
fresh();
gb=mk('ジェネクス・ブラスト',0);dk=mk('ジェネクス・コントローラー',0);gameState.players[0].hand=[gb];gameState.players[0].deck.push(dk);baselineA();TRIG.length=0;
doNormalSummon(0,'atk');drive();
ok('B2: Normal Summoned — no activation',z(dk)==='deck'&&!TRIG.some(t=>/ブラスト/.test(t)));

/* ===== C: Flip searches ===== */
fresh();
let ra=mk('リチュア・エリアル',0,'down','def');ra.setTurn=4;let rb=mk('リチュア・ビースト',0),nm=mk('ブラッド・ヴォルス',0);gameState.players[0].mz=[ra];gameState.players[0].deck.push(nm,rb);baselineA();SEEN=[];
doFlipUp(0,'mz',0,'atk');drive();
ok('C: リチュア・エリアル flipped → リチュア・ビースト added; ブラッド・ヴォルス not offered',z(rb)==='hand'&&!offered(nm));
audit('C');
fresh();
let gt=mk('ジェムタートル',0,'down','def');gt.setTurn=4;let gf=mk('ジェムナイト・フュージョン',0);gameState.players[0].mz=[gt];gameState.players[0].deck.push(gf);baselineA();
doFlipUp(0,'mz',0,'atk');drive();
ok('C2: ジェムタートル flipped → ジェムナイト・フュージョン added',z(gf)==='hand');
audit('C2');
fresh();
let ab=mk('リチュア・アビス',0,'down','def');ab.setTurn=4;let ch=mk('リチュア・チェイン',0);gameState.players[0].mz=[ab];gameState.players[0].deck.push(ch);baselineA();
doFlipUp(0,'mz',0,'atk');drive();
ok('C3: リチュア・アビス Flip Summoned → リチュア・チェイン added',z(ch)==='hand');
audit('C3');

/* ===== D: Deck Spells ===== */
fresh();
let sk=mk('召喚師のスキル',0),be=mk('青眼の白龍',0),cy=mk('サイバー・ドラゴン',0);gameState.players[0].hand=[sk];gameState.players[0].deck.push(cy,be);baselineA();SEEN=[];
duelActivateFromHand(0);drive();
ok('D1: 召喚師のスキル — 青眼の白龍 (Lv8 Normal) added; サイバー・ドラゴン (effect) not offered',z(be)==='hand'&&!offered(cy));
audit('D1');
fresh();
let ib=mk('氷結界の紋章',0),ig=mk('氷結界の守護陣',0);gameState.players[0].hand=[ib];gameState.players[0].deck.push(ig);baselineA();
duelActivateFromHand(0);drive();
ok('D2: 氷結界の紋章 — 氷結界の守護陣 added',z(ig)==='hand');
audit('D2');
fresh();
let s1=mk('精神統一',0),s2=mk('精神統一',0),s3=mk('精神統一',0);gameState.players[0].hand=[s1,s2];gameState.players[0].deck.push(s3);baselineA();
duelActivateFromHand(0);drive();
const i2=gameState.players[0].hand.indexOf(C(s2));
ok('D3: 精神統一 — the Deck copy added; a second 精神統一 cannot be activated this turn',z(s3)==='hand'&&strictScriptLegalityV2('精神統一',0,'hand',i2,{}).ok===false);
audit('D3');
fresh();
let kd=mk('緊急鋼核処分',0),kc=mk('コアキメイルの鋼核',0);gameState.players[0].hand=[kd];gameState.players[0].deck.push(kc);baselineA();
duelActivateFromHand(0);drive();
ok('D4: 緊急鋼核処分 — コアキメイルの鋼核 sent from the Deck to the GY',z(kc)==='grave');
audit('D4');
`);
