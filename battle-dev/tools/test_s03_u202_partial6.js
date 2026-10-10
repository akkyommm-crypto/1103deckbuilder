/* S03-U202: PARTIAL → TESTED — アトランティスの戦士, キラーザウルス (discard: search), ウェポンサモナー, マシンナーズ・ディフェンダー (Flip search),
   バフォメット (summon search), ドラグニティ－トリブル (summon mill), 伝説の白石 (sent to the GY), シンクロ・フュージョニスト / アーケイン・ファイロ
   (Synchro Material), コール・リゾネーター, トゥーンのもくじ, 融合賢者, 儀式の準備 (Spells). Near misses stay in the Deck and are not offered.
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
function offered(c){return SEEN.some(s=>s.names.some(n=>String(n).indexOf(cardName(c))>=0));}
function acts(){return v41ReplayPackage(gameState).actions.map(x=>x.action||x);}

/* ===== A: discard searchers ===== */
for(const [src,hit] of [['アトランティスの戦士','伝説の都 アトランティス'],['キラーザウルス','ジュラシックワールド']]){
  fresh();const s=mk(src,0),h=mk(hit,0),m=mk('サイクロン',0);gameState.players[0].hand=[s];gameState.players[0].deck.push(m,h);baselineA();SEEN=[];
  duelActivateFromHand(0);drive();
  ok('A: '+src+' discarded (cost, before CHAIN_ADD); '+hit+' added; サイクロン not offered',z(s)==='grave'&&z(h)==='hand'&&!offered(m)
    &&(function(){const a=acts();const iD=a.findIndex(x=>x.type==='FX_DISCARD'),iC=a.findIndex(x=>x.type==='CHAIN_ADD');return iD>=0&&iD<iC;})());
  audit('A '+src);
}

/* ===== B: Flip searches (forced) ===== */
for(const [src,hit,miss] of [['ウェポンサモナー','ガーディアン・エアトス','ブラッド・ヴォルス'],['マシンナーズ・ディフェンダー','督戦官コヴィントン','ワイト']]){
  fresh();const s=mk(src,0,'down','def');s.setTurn=4;const h=mk(hit,0),m=mk(miss,0);gameState.players[0].mz=[s];gameState.players[0].deck.unshift(m);gameState.players[0].deck.push(h);baselineA();SEEN=[];TRIG.length=0;
  doFlipUp(0,'mz',0,'atk');drive();
  ok('B: '+src+' flipped → '+hit+' added (forced)',z(h)==='hand'&&TRIG.some(t=>t.indexOf(src)>=0));
  audit('B '+src);
}

/* ===== C: バフォメット — Normal Summon / Flip Summon: 幻獣王ガゼル ===== */
fresh();
let bp=mk('バフォメット',0),gz=mk('幻獣王ガゼル',0),tr=mk('ワイト',0,'up');gameState.players[0].hand=[bp];gameState.players[0].mz=[tr];gameState.players[0].deck.push(gz);baselineA();
PREFER=[tr.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('C: Tribute Summoned → 幻獣王ガゼル added',z(bp)==='mz'&&z(gz)==='hand');
audit('C');
fresh();
bp=mk('バフォメット',0,'down','def');bp.setTurn=4;gz=mk('幻獣王ガゼル',0);gameState.players[0].mz=[bp];gameState.players[0].deck.push(gz);baselineA();
doFlipUp(0,'mz',0,'atk');drive();
ok('C2: Flip Summoned → 幻獣王ガゼル added',z(gz)==='hand');
audit('C2');

/* ===== D: ドラグニティ－トリブル — summoned: a Level 3 or lower Dragon from the Deck to the GY ===== */
fresh();
let tb=mk('ドラグニティ－トリブル',0),dg=mk('グレイ・ウイング',0),big=mk('青眼の白龍',0);gameState.players[0].hand=[tb];gameState.players[0].deck.push(big,dg);baselineA();SEEN=[];
doNormalSummon(0,'atk');drive();
ok('D: グレイ・ウイング (Lv3 Dragon) sent; 青眼の白龍 not offered',z(dg)==='grave'&&!offered(big));
audit('D');

/* ===== E: 伝説の白石 — sent to the GY (discarded as a cost): 青眼の白龍 to the hand (forced) ===== */
fresh();
let ws=mk('伝説の白石',0),bw=mk('青眼の白龍',0),lvx=mk('ライトニング・ボルテックス',0);gameState.players[0].hand=[lvx,ws];gameState.players[0].deck.push(bw);gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();
PREFER=[ws.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('E: 伝説の白石 discarded → 青眼の白龍 added',z(ws)==='grave'&&z(bw)==='hand');
audit('E');

/* ===== F: Synchro Material searches ===== */
/* シンクロ・フュージョニスト (Lv2) + ジャンク・シンクロン (Tuner, Lv3) → TG ハイパー・ライブラリアン (Lv5); アーケイン・ファイロ (Tuner, Lv2) + ブラッド・ヴォルス (Lv4) → 大地の騎士ガイアナイト (Lv6) */
for(const [src,hit,miss,partner,syn] of [['シンクロ・フュージョニスト','ミラクル・フュージョン','サイクロン','ジャンク・シンクロン','TG ハイパー・ライブラリアン'],['アーケイン・ファイロ','バスター・モード','強欲な壺','ブラッド・ヴォルス','大地の騎士ガイアナイト']]){
  fresh();const js=mk(partner,0,'up'),s=mk(src,0,'up'),sy=mk(syn,0),h=mk(hit,0),m=mk(miss,0);
  gameState.players[0].mz=[js,s];gameState.players[0].ex=[sy];gameState.players[0].deck.push(m,h);baselineA();SEEN=[];
  const cb=exCombos(0,dbOf(sy)).combos.find(c=>c.materials.length===2);
  if(cb)beginExSummonV2(0,0,cb.materials,'synchro','atk');drive();
  ok('F: '+src+' used as Synchro Material → '+hit+' added; '+miss+' not offered',!!cb&&z(sy)==='mz'&&z(h)==='hand'&&!offered(m),JSON.stringify({cb:!!cb,h:z(h)}));
  audit('F '+src);
}

/* ===== G: search Spells ===== */
for(const [src,hit,miss] of [['コール・リゾネーター','ダーク・リゾネーター','ワイト'],['トゥーンのもくじ','トゥーン・アリゲーター','サイクロン'],['融合賢者','融合','ミラクル・フュージョン']]){
  fresh();const s=mk(src,0),h=mk(hit,0),m=mk(miss,0);gameState.players[0].hand=[s];gameState.players[0].deck.push(m,h);baselineA();SEEN=[];
  duelActivateFromHand(0);drive();
  ok('G: '+src+' → '+hit+' added; '+miss+' not offered',z(h)==='hand'&&!offered(m));
  audit('G '+src);
}

/* ===== H: 儀式の準備 — a Level 7 or lower Ritual Monster from the Deck, then a Ritual Spell from the GY (optional) ===== */
fresh();
let rp=mk('儀式の準備',0),rm=mk('イビリチュア・ガストクラーケ',0),hi=mk('カオス・ソルジャー',0),rs=mk('カオスの儀式',0);
gameState.players[0].hand=[rp];gameState.players[0].deck.push(hi,rm);gameState.players[0].grave=[rs];baselineA();SEEN=[];
PREFER=[rm.uid,rs.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('H: イビリチュア・ガストクラーケ (Lv6) added, カオス・ソルジャー (Lv8) not offered; カオスの儀式 back from the GY',z(rm)==='hand'&&!offered(hi)&&z(rs)==='hand',JSON.stringify({rm:z(rm),rs:z(rs),SEEN}));
audit('H');
`);
