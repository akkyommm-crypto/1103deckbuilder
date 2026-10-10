/* S03-U197: PARTIAL → TESTED — C・チッキー / C・ドルフィーナ / C・パンテール / C・ピニー / C・モーグ / C・ラーバ (ignition: Tribute this card while
   ネオスペース is face-up, the named Neo-Spacian from the hand or the Deck), 共鳴虫 (battle), ガスタ・スクイレル / ベビケラサウルス (destroyed by a card
   effect), レプティレス・ガードナー (destroyed). Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function acts(){return v41ReplayPackage(gameState).actions.map(x=>x.action||x);}

/* ===== A: C・ — with ネオスペース: Tribute it (cost), the named Neo-Spacian from the Deck (or the hand) ===== */
const PAIRS=[['C・チッキー','N・エア・ハミングバード'],['C・ドルフィーナ','N・アクア・ドルフィン'],['C・パンテール','N・ブラック・パンサー'],
  ['C・ピニー','N・グロー・モス'],['C・モーグ','N・グラン・モール'],['C・ラーバ','N・フレア・スカラベ']];
for(const [cn,nn] of PAIRS){
  fresh();
  const cc=mk(cn,0,'up'),nd=mk(nn,0),other=mk('N・フレア・スカラベ'===nn?'N・グラン・モール':'N・フレア・スカラベ',0);
  gameState.players[0].mz=[cc];gameState.players[0].field=mk('ネオスペース',0,'up');gameState.players[0].deck.push(other,nd);baselineA();
  duelActivateFromZone(0,'mz',0);drive();
  ok('A: '+cn+' tributed; '+nn+' special summoned from the Deck (another Neo-Spacian stays)',z(cc)==='grave'&&z(nd)==='mz'&&z(other)==='deck');
  ok('A: '+cn+' — the Tribute is a cost (before CHAIN_ADD)',(function(){const a=acts();const iT=a.findIndex(x=>x.type==='FX_TO_GRAVE'),iC=a.findIndex(x=>x.type==='CHAIN_ADD');return iT>=0&&iC>=0&&iT<iC;})());
  audit('A '+cn);
}
fresh();
let ch=mk('C・チッキー',0,'up'),nh=mk('N・エア・ハミングバード',0),nd2=mk('N・エア・ハミングバード',0);
gameState.players[0].mz=[ch];gameState.players[0].hand=[nh];gameState.players[0].deck.push(nd2);gameState.players[0].field=mk('ネオスペース',0,'up');baselineA();
PREFER=[nh.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('A2: the copy in the hand chosen and special summoned; the Deck copy stays',z(nh)==='mz'&&z(nd2)==='deck');
audit('A2');
fresh();
ch=mk('C・チッキー',0,'up');gameState.players[0].mz=[ch];gameState.players[0].deck.push(mk('N・エア・ハミングバード',0));baselineA();
ok('A3: not activatable without ネオスペース',strictScriptLegalityV2('C・チッキー',0,'mz',0,{}).ok===false);
fresh();
ch=mk('C・チッキー',0,'up');gameState.players[0].mz=[ch];gameState.players[0].deck.push(mk('N・エア・ハミングバード',0));gameState.players[0].field=mk('ネオスペース',0,'up');gameState.phase='battle';baselineA();
ok('A4: not in the Battle Phase (ignition)',strictScriptLegalityV2('C・チッキー',0,'mz',0,{}).ok===false);

/* ===== B: 共鳴虫 — destroyed by battle: an Insect with 1500 or less ATK from the Deck ===== */
fresh();
let ky=mk('共鳴虫',0,'up'),ins=mk('N・フレア・スカラベ',0),big=mk('ブラッド・ヴォルス',1,'up');
gameState.players[0].mz=[ky];gameState.players[0].deck.push(ins);gameState.players[1].mz=[big];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('B: 共鳴虫 destroyed by battle; N・フレア・スカラベ (Insect, 500) special summoned',z(ky)==='grave'&&z(ins)==='mz');
audit('B');

/* ===== C: ガスタ・スクイレル — destroyed by a card effect: a Level 5 or higher 「ガスタ」 (not the Level 3 one) ===== */
fresh();
let sq=mk('ガスタ・スクイレル',0,'up'),lz=mk('ガスタの疾風 リーズ',0),gg=mk('ガスタ・ガルド',0),bh=mk('ブラック・ホール',0);
gameState.players[0].mz=[sq];gameState.players[0].hand=[bh];gameState.players[0].deck.push(gg,lz);baselineA();
duelActivateFromHand(0);drive();
ok('C: destroyed by ブラック・ホール → ガスタの疾風 リーズ (Lv5) special summoned; ガスタ・ガルド (Lv3) stays',z(sq)==='grave'&&z(lz)==='mz'&&z(gg)==='deck');
audit('C');
fresh();
sq=mk('ガスタ・スクイレル',0,'up');lz=mk('ガスタの疾風 リーズ',0);let at=mk('ブラッド・ヴォルス',1,'up');
gameState.players[0].mz=[sq];gameState.players[0].deck.push(lz);gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('C2: destroyed by battle — no activation',z(sq)==='grave'&&z(lz)==='deck'&&!TRIG.some(t=>/スクイレル/.test(t)),JSON.stringify(TRIG));
audit('C2');

/* ===== D: ベビケラサウルス — destroyed by a card effect: a Level 4 or lower Dinosaur (forced) ===== */
fresh();
let bk=mk('ベビケラサウルス',0,'up'),dn=mk('エレメント・ザウルス',0);bh=mk('ブラック・ホール',0);
gameState.players[0].mz=[bk];gameState.players[0].hand=[bh];gameState.players[0].deck.push(dn);baselineA();
duelActivateFromHand(0);drive();
ok('D: destroyed by ブラック・ホール → エレメント・ザウルス special summoned',z(bk)==='grave'&&z(dn)==='mz');
audit('D');

/* ===== E: レプティレス・ガードナー — destroyed: a 「レプティレス」 monster from the Deck to the hand (forced) ===== */
fresh();
let rg=mk('レプティレス・ガードナー',0,'up'),rp=mk('レプティレス・スキュラ',0);bh=mk('ブラック・ホール',0);
gameState.players[0].mz=[rg];gameState.players[0].hand=[bh];gameState.players[0].deck.push(rp);baselineA();
duelActivateFromHand(0);drive();
ok('E: destroyed → レプティレス・スキュラ added to the hand',z(rg)==='grave'&&z(rp)==='hand');
audit('E');
`);
