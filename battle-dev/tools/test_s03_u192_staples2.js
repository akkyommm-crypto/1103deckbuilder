/* S03-U192: staples 2 — デステニー・ドロー, 地砕き, 非常食, 抹殺の使徒, 魔宮の賄賂, 死のマジック・ボックス (fixed), 生者の書－禁断の呪術－,
   異次元からの埋葬, ソーラー・エクスチェンジ, 鳳翼の爆風 (scripts unchanged, now tested). Real DUEL paths, Replay-audited.
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
let PREFER=[],MULTI=null,SEEN=[];
function step(){const q=pc();if(!q)return false;SEEN.push({title:q.title,min:q.min,max:q.max,cancelable:!!q.cancelable});
  if(MULTI&&q.max>1){const keys=q.candidates.filter(x=>MULTI.includes(x.uid)).map(x=>x.key);MULTI=null;answerChoiceV49(keys);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
/* drive until a chain window with a non-empty chain opens (no pass) */
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function hi(p,c){return gameState.players[p].hand.indexOf(C(c));}

/* ===== A: デステニー・ドロー — discard a 「D－HERO」 as the cost, draw 2 ===== */
fresh();
let dd=mk('デステニー・ドロー',0),dh=mk('D－HERO ディアボリックガイ',0),w0=mk('ワイト',0);gameState.players[0].hand=[dd,w0,dh];baselineA();
const hA=gameState.players[0].hand.length;
PREFER=[dh.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('A: ディアボリックガイ discarded (cost), 2 drawn; ワイト stays',z(dh)==='grave'&&z(w0)==='hand'&&gameState.players[0].hand.length===hA-2+2);
ok('A: the discard is recorded before the activation (a cost), not at resolution',(function(){const acts=v41ReplayPackage(gameState).actions.map(x=>x.action||x);
  const iD=acts.findIndex(a=>a.type==='FX_DISCARD'),iC=acts.findIndex(a=>a.type==='CHAIN_ADD');return iD>=0&&iC>=0&&iD<iC;})());
audit('A');

/* ===== B: 地砕き — the highest DEF; a tie is the controller's choice, not cancelable ===== */
fresh();
let js=mk('地砕き',0),t1=mk('ギガンテス',1,'up'),t2=mk('ギガンテス',1,'up'),t3=mk('ワイト',1,'up');gameState.players[0].hand=[js];gameState.players[1].mz=[t1,t2,t3];baselineA();
SEEN=[];PREFER=[t2.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('B: the chosen ギガンテス (DEF tie) destroyed; the tie choice is not cancelable',z(t2)==='grave'&&z(t1)==='mz'&&z(t3)==='mz'&&SEEN.some(s=>/地砕き/.test(s.title)&&!s.cancelable),JSON.stringify(SEEN));
audit('B');

/* ===== C: 非常食 — send any number (2) of the other own Spell / Trap cards as the cost: 2000 LP ===== */
fresh();
let ef=mk('非常食',0),s1=mk('サイクロン',0,'down'),s2=mk('強欲な壺',0,'down'),s3=mk('大嵐',0,'down');
gameState.players[0].hand=[ef];gameState.players[0].sz=[s1,s2,s3];baselineA();
MULTI=[s1.uid,s3.uid];duelActivateFromHand(0);drive();MULTI=null;
ok('C: サイクロン and 大嵐 sent (cost); 強欲な壺 stays; 8000 + 2000',z(s1)==='grave'&&z(s3)==='grave'&&z(s2)==='sz'&&gameState.players[0].lp===10000,JSON.stringify({lp:gameState.players[0].lp,s:[z(s1),z(s2),z(s3)]}));
audit('C');

/* ===== D: 抹殺の使徒 — a face-down Flip monster destroyed and banished; the same-name cards in both Decks banished ===== */
fresh();
let ms=mk('抹殺の使徒',0),fr=mk('ライトロード・ハンター ライコウ',1,'down','def'),r0=mk('ライトロード・ハンター ライコウ',0),r1=mk('ライトロード・ハンター ライコウ',1);
gameState.players[0].hand=[ms];gameState.players[1].mz=[fr];gameState.players[0].deck.push(r0);gameState.players[1].deck.push(r1);baselineA();
PREFER=[fr.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D: ライコウ destroyed and banished; the copies in both Decks banished',z(fr)==='banish'&&z(r0)==='banish'&&z(r1)==='banish');
ok('D: it was a destruction (graveInfo-free banish by FX_DESTROY_BANISH)',v41ReplayPackage(gameState).actions.map(x=>x.action||x).some(a=>a.type==='FX_DESTROY_BANISH'));
audit('D');
fresh();
ms=mk('抹殺の使徒',0);let nf=mk('ワイト',1,'down','def'),n0=mk('ワイト',0);
gameState.players[0].hand=[ms];gameState.players[1].mz=[nf];const d0=gameState.players[0].deck.length;baselineA();
PREFER=[nf.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D2: a non-Flip monster (ワイト) — banished; the Decks untouched',z(nf)==='banish'&&gameState.players[0].deck.length===d0&&gameState.players[1].deck.length===6);
audit('D2');

/* ===== E: 魔宮の賄賂 — the opponent activates 強欲な壺: negated and destroyed, the opponent draws 1 ===== */
fresh();
let br=mk('魔宮の賄賂',0,'down');br.setTurn=4;gameState.players[0].sz=[br];let pot=mk('強欲な壺',1);gameState.players[1].hand=[pot];
gameState.activePlayer=1;baselineA();
const hE=gameState.players[1].hand.length;
duelActivateFromHand(0);const winE=toWindow();
const offE=winE&&(getChainResponsesV2(0)||[]).some(r=>r.card===C(br));
if(offE)duelActivateResponseV2(0,'sz',0);
drive();
ok('E: 魔宮の賄賂 offered; 強欲な壺 negated and destroyed; the opponent drew 1 (not 2)',offE&&z(pot)==='grave'&&z(br)==='grave'&&gameState.players[1].hand.length===hE-1+1,
  JSON.stringify({offE,pot:z(pot),h:gameState.players[1].hand.length,hE}));
audit('E');
fresh();
br=mk('魔宮の賄賂',0,'down');br.setTurn=4;gameState.players[0].sz=[br];gameState.players[1].sz=[mk('サイクロン',1,'down')];
ok('E2: not activatable without an opponent activation (a set Spell on the field is not enough)',strictScriptLegalityV2('魔宮の賄賂',0,'sz',0,{}).ok===false);

/* ===== F: 死のマジック・ボックス — both targets at activation: the opponent monster destroyed, then the own monster to the opponent ===== */
fresh();
let db=mk('死のマジック・ボックス',0),mine=mk('ワイト',0,'up'),th=mk('ギガンテス',1,'up');gameState.players[0].hand=[db];gameState.players[0].mz=[mine];gameState.players[1].mz=[th];baselineA();
PREFER=[th.uid,mine.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('F: ギガンテス destroyed; ワイト now controlled by the opponent',z(th)==='grave'&&findCardByUid(mine.uid).p===1&&z(mine)==='mz');
ok('F: both monsters are targets of the activation (CHAIN_ADD targets: ギガンテス, ワイト)',(function(){const c=v41ReplayPackage(gameState).actions.map(x=>x.action||x).find(a=>a.type==='CHAIN_ADD'&&a.name==='死のマジック・ボックス');
  const u=(c&&c.targets||[]).map(t=>t&&t.ref&&t.ref.uid);return u.length===2&&u[0]===th.uid&&u[1]===mine.uid;})());
audit('F');

/* ===== G: 生者の書－禁断の呪術－ — an own Zombie revived, an opponent GY monster banished ===== */
fresh();
let bl=mk('生者の書－禁断の呪術－',0),zm=mk('ワイト',0),og=mk('ギガンテス',1);gameState.players[0].hand=[bl];gameState.players[0].grave=[zm];gameState.players[1].grave=[og];baselineA();
PREFER=[zm.uid,og.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('G: ワイト special summoned; ギガンテス banished',z(zm)==='mz'&&z(og)==='banish');
audit('G');

/* ===== H: 異次元からの埋葬 — up to 3 banished monsters (both sides) back to the GY ===== */
fresh();
let ib=mk('異次元からの埋葬',0),b1=mk('ワイト',0),b2=mk('ギガンテス',1),b3=mk('ワイト',1),b4=mk('ギガンテス',0);
gameState.players[0].hand=[ib];gameState.players[0].banish=[b1,b4];gameState.players[1].banish=[b2,b3];baselineA();
PREFER=[b1.uid,'yes',b2.uid,'yes',b3.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('H: the 3 chosen back to their owners’ GYs; the fourth stays banished',z(b1)==='grave'&&z(b2)==='grave'&&z(b3)==='grave'&&z(b4)==='banish');
audit('H');

/* ===== I: ソーラー・エクスチェンジ — discard a 「ライトロード」 monster: draw 2, then mill 2 ===== */
fresh();
let se=mk('ソーラー・エクスチェンジ',0),lw=mk('ライトロード・パラディン ジェイン',0);gameState.players[0].hand=[se,lw];baselineA();
const hI=gameState.players[0].hand.length,dI=gameState.players[0].deck.length,gI=gameState.players[0].grave.length;
duelActivateFromHand(0);drive();
ok('I: ジェイン discarded; drew 2; milled 2',z(lw)==='grave'&&gameState.players[0].hand.length===hI-2+2&&gameState.players[0].deck.length===dI-4&&gameState.players[0].grave.length===gI+1+1+2);
audit('I');

/* ===== J: 鳳翼の爆風 — discard 1, an opponent card to the top of its owner's Deck ===== */
fresh();
let hb=mk('鳳翼の爆風',0,'down');hb.setTurn=4;let dc=mk('ワイト',0),tg=mk('ギガンテス',1,'up');gameState.players[0].sz=[hb];gameState.players[0].hand=[dc];gameState.players[1].mz=[tg];baselineA();
PREFER=[dc.uid,tg.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('J: ワイト discarded; ギガンテス on top of the opponent’s Deck',z(dc)==='grave'&&gameState.players[1].deck[0]===C(tg));
audit('J');
`);
