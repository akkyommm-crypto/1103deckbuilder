/* S03-U206: PARTIAL → TESTED — インフェルニティ・インフェルノ, コンバート・コンタクト, フェザー・ウィンド・アタック, 督戦官コヴィントン, ロード・ウォリアー,
   黒魔術のカーテン, デーモンとの駆け引き, 魔轟神獣ペガラサス. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
let PREFER=[],MULTI=null,TRIG=[],SEEN=[];
function step(){const q=pc();if(!q)return false;SEEN.push({title:q.title,names:q.candidates.map(x=>x.label||x.name||'')});
  if(MULTI&&q.max>1){const keys=q.candidates.filter(x=>MULTI.includes(x.uid)).map(x=>x.key);MULTI=null;answerChoiceV49(keys);return true;}
  if(q.min>1&&q.min===q.max){answerChoiceV49(q.candidates.slice(0,q.min).map(x=>x.key));return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function offered(c){return SEEN.some(s=>s.names.some(n=>String(n).indexOf(cardName(c))>=0));}
function hi(c){return gameState.players[0].hand.indexOf(C(c));}

/* ===== A: インフェルニティ・インフェルノ — discard up to 2; as many 「インフェルニティ」 cards from the Deck to the GY ===== */
fresh();
let ii=mk('インフェルニティ・インフェルノ',0,'down');ii.setTurn=4;let d1=mk('ワイト',0),d2=mk('ブラッド・ヴォルス',0),i1=mk('インフェルニティ・アーチャー',0),i2=mk('インフェルニティ・デストロイヤー',0),i3=mk('インフェルニティ・ガーディアン',0);
gameState.players[0].sz=[ii];gameState.players[0].hand=[d1,d2];gameState.players[0].deck.push(i1,i2,i3);baselineA();
MULTI=[d1.uid,d2.uid];duelActivateFromZone(0,'sz',0);drive();MULTI=null;
ok('A: 2 discarded; 2 「インフェルニティ」 sent from the Deck',z(d1)==='grave'&&z(d2)==='grave'&&[i1,i2,i3].filter(c=>z(c)==='grave').length===2);
audit('A');

/* ===== B: コンバート・コンタクト — no own monster: an 「N」 from the hand and one from the Deck to the GY, then draw 2 ===== */
fresh();
let cc=mk('コンバート・コンタクト',0),nh=mk('N・グラン・モール',0),nd=mk('N・フレア・スカラベ',0);gameState.players[0].hand=[cc,nh];gameState.players[0].deck.push(nd);baselineA();
const hB=gameState.players[0].hand.length;
duelActivateFromHand(0);drive();
ok('B: N・グラン・モール (hand) and N・フレア・スカラベ (Deck) to the GY; drew 2',z(nh)==='grave'&&z(nd)==='grave'&&gameState.players[0].hand.length===hB-2+2);
audit('B');
fresh();
cc=mk('コンバート・コンタクト',0);gameState.players[0].hand=[cc,mk('N・グラン・モール',0)];gameState.players[0].mz=[mk('ワイト',0,'up')];gameState.players[0].deck.push(mk('N・フレア・スカラベ',0));baselineA();
ok('B2: with an own monster — not activatable',strictScriptLegalityV2('コンバート・コンタクト',0,'hand',0,{}).ok===false);

/* ===== C: フェザー・ウィンド・アタック — a face-up 「BF」 back to the Deck (cost): a 「BF」 from the Deck ===== */
fresh();
let fa=mk('フェザー・ウィンド・アタック',0),bf=mk('BF－そよ風のブリーズ',0,'up'),bd=mk('BF－疾風のゲイル',0);gameState.players[0].hand=[fa];gameState.players[0].mz=[bf];gameState.players[0].deck.push(bd);baselineA();SEEN=[];
PREFER=[bf.uid,bd.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('C: そよ風のブリーズ returned to the Deck (cost); BF－疾風のゲイル added',z(bf)!=='mz'&&z(bd)==='hand');
audit('C');

/* ===== D: 督戦官コヴィントン — the 3 マシンナーズ to the GY: マシンナーズ・フォース from the hand or the Deck ===== */
fresh();
let cv=mk('督戦官コヴィントン',0,'up'),m1=mk('マシンナーズ・ソルジャー',0,'up'),m2=mk('マシンナーズ・スナイパー',0,'up'),m3=mk('マシンナーズ・ディフェンダー',0,'up'),mf=mk('マシンナーズ・フォース',0);
gameState.players[0].mz=[cv,m1,m2,m3];gameState.players[0].deck.push(mf);baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('D: ソルジャー / スナイパー / ディフェンダー sent; マシンナーズ・フォース special summoned',[m1,m2,m3].every(c=>z(c)==='grave')&&z(mf)==='mz');
audit('D');

/* ===== E: ロード・ウォリアー — once per turn: a Level 2 or lower Warrior or Machine from the Deck ===== */
fresh();
let rw=mk('ロード・ウォリアー',0,'up'),ts=mk('チューニング・サポーター',0),gd=mk('ガード・オブ・フレムベル',0);gameState.players[0].mz=[rw];gameState.players[0].deck.push(gd,ts);baselineA();SEEN=[];
duelActivateFromZone(0,'mz',0);drive();
ok('E: チューニング・サポーター (Lv1 Machine) special summoned; ガード・オブ・フレムベル (Dragon) not offered; once per turn',z(ts)==='mz'&&!offered(gd)&&strictScriptLegalityV2('ロード・ウォリアー',0,'mz',0,{}).ok===false);
audit('E');

/* ===== F: 黒魔術のカーテン — pay half: ブラック・マジシャン from the Deck; no other summon this turn ===== */
fresh();
let ku=mk('黒魔術のカーテン',0),bm=mk('ブラック・マジシャン',0),nw=mk('ワイト',0);gameState.players[0].hand=[ku,nw];gameState.players[0].deck.push(bm);baselineA();
duelActivateFromHand(0);drive();
ok('F: 4000 paid; ブラック・マジシャン special summoned',gameState.players[0].lp===4000&&z(bm)==='mz');
ok('F: no Normal Summon afterwards',!getLegalHandActions(0,hi(nw)).some(a=>a.id==='normalSummon'));
audit('F');
fresh();
ku=mk('黒魔術のカーテン',0);nw=mk('ワイト',0);gameState.players[0].hand=[nw,ku];gameState.players[0].deck.push(mk('ブラック・マジシャン',0));baselineA();
doNormalSummon(0,'atk');drive();
ok('F2: after a Normal Summon — not activatable',strictScriptLegalityV2('黒魔術のカーテン',0,'hand',hi(ku),{}).ok===false);

/* ===== G: デーモンとの駆け引き — the turn an own Level 8+ monster went to the GY: バーサーク・デッド・ドラゴン from the hand or the Deck ===== */
fresh();
let dk=mk('デーモンとの駆け引き',0),bw=mk('青眼の白龍',0,'up'),bh=mk('ブラック・ホール',0),bdd=mk('バーサーク・デッド・ドラゴン',0);
gameState.players[0].hand=[bh,dk];gameState.players[0].mz=[bw];gameState.players[0].deck.push(bdd);baselineA();
ok('G: not activatable before a Level 8+ monster went to the GY',strictScriptLegalityV2('デーモンとの駆け引き',0,'hand',1,{}).ok===false);
duelActivateFromHand(0);drive();
duelActivateFromHand(hi(dk));drive();
ok('G: 青眼の白龍 destroyed → バーサーク・デッド・ドラゴン special summoned',z(bw)==='grave'&&z(bdd)==='mz');
audit('G');

/* ===== H: 魔轟神獣ペガラサス — discarded: special summons itself face-down; flipped: show a 「魔轟神」, a 「魔轟神」 from the Deck to the GY ===== */
fresh();
let hb=mk('鳳翼の爆風',0,'down');hb.setTurn=4;let pg=mk('魔轟神獣ペガラサス',0),tg=mk('ワイト',1,'up');
gameState.players[0].sz=[hb];gameState.players[0].hand=[pg];gameState.players[1].mz=[tg];baselineA();
PREFER=[pg.uid,tg.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('H: discarded as the cost → special summoned face-down Defense',z(pg)==='mz'&&C(pg).face==='down'&&C(pg).pos==='def');
audit('H');
fresh();
pg=mk('魔轟神獣ペガラサス',0,'down','def');pg.setTurn=4;let rv=mk('魔轟神レイヴン',0),kb=mk('魔轟神獣ケルベラル',0);
gameState.players[0].mz=[pg];gameState.players[0].hand=[rv];gameState.players[0].deck.push(kb);baselineA();
doFlipUp(0,'mz',0,'atk');drive();
ok('H2: flipped with 魔轟神レイヴン in the hand → 魔轟神獣ケルベラル sent from the Deck; レイヴン stays in the hand',z(kb)==='grave'&&z(rv)==='hand');
audit('H2');
`);
