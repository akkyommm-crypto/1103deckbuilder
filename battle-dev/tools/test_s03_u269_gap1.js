/* S03-U269: ENGINE_GAP re-check — 四次元の墓, 補充要員, 救急救命, 光神化, 裏ガエル, 魔轟神ガルバス, ガルドスの羽根ペン, トライワイトゾーン.
   Real DUEL paths (hand / set card / monster activation, battle, flip summon, phase steps); targets and costs chosen at activation, resolution choices answered; Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(ph){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;SEEN=[];TRIG=[];PREFER=[];
  gameState.activePlayer=0;gameState.turn=5;gameState.phase=ph||'main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],SEEN=[];
/* a choice: PREFER lists the uids to answer (multi choices take every listed uid up to max, then fill up to min); SEEN records each query */
function step(){const q=pc();if(!q)return false;
  const find=u=>q.candidates.find(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));
  SEEN.push({title:q.title,min:q.min,max:q.max,uids:q.candidates.map(x=>x.uid!=null?x.uid:x.key)});
  if(q.max>1||q.min!==q.max){
    let ks=[];for(const u of PREFER){const c=find(u);if(c&&ks.indexOf(c.key)<0)ks.push(c.key);}
    ks=ks.slice(0,q.max);for(const c of q.candidates){if(ks.length>=q.min)break;if(ks.indexOf(c.key)<0)ks.push(c.key);}
    PREFER=PREFER.filter(u=>!find(u));answerChoiceV49(ks);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){j=q.candidates.findIndex(x=>x.uid===PREFER[k]||x.key===PREFER[k]);if(j>=0)break;}
  if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function offered(c){return SEEN.some(s=>s.uids.indexOf(c.uid)>=0);}
function hi(p,c){return gameState.players[p].hand.findIndex(x=>x.uid===c.uid);}
function up(n,p,pos){return mk(n,p,'up',pos);}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function nextTurn(){toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();}
function hitT(p,a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:findCardByUid(a.uid).index,target:t==='direct'?'direct':findCardByUid(t.uid).index});drive();}
function idle(){return !pc()&&gameState.chain.length===0;}

/* ===== A: 四次元の墓 — 2 「LV」 monsters of the GY to the Deck + shuffle; chosen on resolution ===== */
fresh();
let lv1=mk('アルティメット・インセクト LV1',0),sm=mk('サイレント・ソードマン LV3',0),lv3=mk('アルティメット・インセクト LV3',0),wt=mk('ワイト',0),lvs=mk('磁力の召喚円 LV2',0),fd=mk('四次元の墓',0);
gameState.players[0].grave=[lv1,sm,lv3,wt,lvs];gameState.players[0].hand=[fd];baselineA();
const decA=gameState.players[0].deck.length;
PREFER=[lv1.uid,sm.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('A: the two chosen 「LV」 monsters went to the Deck; the third stayed in the GY',z(lv1)==='deck'&&z(sm)==='deck'&&z(lv3)==='grave'&&gameState.players[0].deck.length===decA+2,JSON.stringify({a:z(lv1),b:z(sm),c:z(lv3),d:gameState.players[0].deck.length}));
ok('A: only 「LV」 monsters were offered (not ワイト nor the 「LV」 Spell)',offered(lv1)&&offered(sm)&&offered(lv3)&&!offered(wt)&&!offered(lvs),JSON.stringify(SEEN));
ok('A: the Deck was shuffled (SHUFFLE journaled)',v41ReplayPackage(gameState).actions.some(a=>a&&a.action&&a.action.type==='SHUFFLE'));
ok('A: the Spell is in the GY',z(fd)==='grave');
audit('A');
fresh();
lv1=mk('アルティメット・インセクト LV1',0);wt=mk('ワイト',0);lvs=mk('磁力の召喚円 LV2',0);fd=mk('四次元の墓',0);
gameState.players[0].grave=[lv1,wt,lvs];gameState.players[0].hand=[fd];baselineA();
duelActivateFromHand(0);drive();
ok('A2: only one 「LV」 monster in the GY — cannot be activated',z(fd)==='hand'&&z(lv1)==='grave'&&idle(),JSON.stringify({fd:z(fd)}));

/* ===== B: 補充要員 (Trap) — 5+ monsters in the GY; up to 3 non-Effect monsters with ATK 1500 or less to the hand ===== */
fresh();
let rv=setT('補充要員',0),g1=mk('ワイト',0),g2=mk('ハーピィ・レディ',0),g3=mk('もけもけ',0),g4=mk('青眼の白龍',0),g5=mk('黄泉ガエル',0);
gameState.players[0].sz=[rv];gameState.players[0].grave=[g1,g2,g3,g4,g5];baselineA();
PREFER=[g1.uid,g2.uid,g3.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('B: ワイト / ハーピィ・レディ / もけもけ added to the hand',z(g1)==='hand'&&z(g2)==='hand'&&z(g3)==='hand',JSON.stringify([z(g1),z(g2),z(g3)]));
ok('B: 青眼 (ATK 3000) and 黄泉ガエル (Effect) were not offered and stay',!offered(g4)&&!offered(g5)&&z(g4)==='grave'&&z(g5)==='grave',JSON.stringify(SEEN));
ok('B: the Trap went to the GY',z(rv)==='grave');
audit('B');
fresh();
rv=setT('補充要員',0);g1=mk('ワイト',0);g2=mk('ハーピィ・レディ',0);g3=mk('もけもけ',0);g4=mk('青眼の白龍',0);g5=mk('黄泉ガエル',0);
gameState.players[0].sz=[rv];gameState.players[0].grave=[g1,g2,g3,g4,g5];baselineA();
PREFER=[g2.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('B2: 「up to 3」 — choosing 1 adds only that monster',z(g2)==='hand'&&z(g1)==='grave'&&z(g3)==='grave',JSON.stringify([z(g1),z(g2),z(g3)]));
audit('B2');
fresh();
rv=setT('補充要員',0);g1=mk('ワイト',0);g2=mk('ハーピィ・レディ',0);g3=mk('もけもけ',0);g4=mk('青眼の白龍',0);
gameState.players[0].sz=[rv];gameState.players[0].grave=[g1,g2,g3,g4];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('B3: only 4 monsters in the GY — cannot be activated',z(rv)==='sz'&&C(rv).face==='down'&&idle()&&z(g1)==='grave');
fresh();
rv=setT('補充要員',0);
gameState.players[0].sz=[rv];gameState.players[0].grave=[mk('青眼の白龍',0),mk('黄泉ガエル',0),mk('鬼ガエル',0),mk('裏ガエル',0),mk('魔轟神ガルバス',0)];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('B4: 5 monsters but none is a non-Effect monster with ATK 1500 or less — cannot be activated',z(rv)==='sz'&&C(rv).face==='down'&&idle());

/* ===== C: 救急救命 — Main Phase 2 only; a Level 4 monster destroyed by a card effect this turn, special summoned from your GY ===== */
fresh();
let hs=mk('ブラック・ホール',0),rs=mk('救急救命',0),w4=up('ジェネティック・ワーウルフ',0),hl=up('ハーピィ・レディ',0),lv3m=up('ウィング・エッグ・エルフ',0),ow=up('ワイト',1),oh=up('ハーピィ・レディ',1);
gameState.players[0].hand=[hs,rs];gameState.players[0].mz=[w4,hl,lv3m];gameState.players[1].mz=[ow,oh];baselineA();
duelActivateFromHand(hi(0,hs));drive();
ok('C: ブラック・ホール destroyed every monster (own ジェネティック・ワーウルフ / ハーピィ・レディ / ウィング・エッグ・エルフ)',z(w4)==='grave'&&z(hl)==='grave'&&z(lv3m)==='grave'&&z(oh)==='grave',JSON.stringify([z(w4),z(hl),z(lv3m),z(oh)]));
duelActivateFromHand(hi(0,rs));drive();
ok('C: in the Main Phase 1 — 救急救命 cannot be activated',z(rs)==='hand'&&z(w4)==='grave'&&idle());
toPhase('main2');SEEN=[];
PREFER=[w4.uid];duelActivateFromHand(hi(0,rs));drive();PREFER=[];
ok('C: Main Phase 2 — the chosen Level 4 monster is special summoned in Attack Position; the other stays in the GY',z(w4)==='mz'&&C(w4).face==='up'&&C(w4).pos==='atk'&&z(hl)==='grave',JSON.stringify({w4:z(w4),hl:z(hl)}));
ok('C: offered the own Level 4 effect-destroyed monsters only (not Level 3 / the opponent\'s)',offered(w4)&&offered(hl)&&!offered(lv3m)&&!offered(oh),JSON.stringify(SEEN));
audit('C');
/* destroyed by battle does not count */
fresh('battle');
hl=up('ハーピィ・レディ',0);let be=up('青眼の白龍',1);rs=mk('救急救命',0);gameState.players[0].mz=[hl];gameState.players[0].hand=[rs];gameState.players[1].mz=[be];baselineA();
hitT(0,hl,be);
ok('C2: ハーピィ・レディ was destroyed by battle',z(hl)==='grave');
toPhase('main2');duelActivateFromHand(0);drive();
ok('C2: a battle-destroyed monster does not count — cannot be activated',z(rs)==='hand'&&z(hl)==='grave'&&idle());
/* destroyed in an earlier turn does not count */
fresh();
hs=mk('ブラック・ホール',0);rs=mk('救急救命',0);hl=up('ハーピィ・レディ',0);gameState.players[0].hand=[hs];gameState.players[0].mz=[hl];baselineA();
duelActivateFromHand(0);drive();nextTurn();nextTurn();
gameState.players[0].hand.push(rs);toPhase('main2');
ok('C3: reached my next Main Phase 2 (turn '+gameState.turn+')',gameState.phase==='main2'&&gameState.activePlayer===0,JSON.stringify({ph:gameState.phase,ap:gameState.activePlayer}));
duelActivateFromHand(gameState.players[0].hand.indexOf(rs));drive();
ok('C3: destroyed in an earlier turn — cannot be activated',z(rs)==='hand'&&z(hl)==='grave'&&idle());

/* ===== D: 光神化 — a Fairy from the hand; its ATK is halved; destroyed in the End Phase ===== */
fresh();
let lg=mk('光神化',0),ee=mk('ウィング・エッグ・エルフ',0),mk2=mk('もけもけ',0),hw=mk('ワイト',0);
gameState.players[0].hand=[lg,ee,mk2,hw];baselineA();
PREFER=[ee.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D: ウィング・エッグ・エルフ special summoned face-up from the hand (Attack Position)',z(ee)==='mz'&&C(ee).face==='up'&&C(ee).pos==='atk',JSON.stringify({z:z(ee)}));
ok('D: its ATK is halved (500 → 250)',curATK(C(ee))===250,String(curATK(C(ee))));
ok('D: only Fairy monsters were offered (not ワイト)',offered(ee)&&offered(mk2)&&!offered(hw)&&z(mk2)==='hand'&&z(hw)==='hand',JSON.stringify(SEEN));
toPhase('main2');
ok('D: still on the field with the halved ATK before the End Phase',z(ee)==='mz'&&curATK(C(ee))===250);
toPhase('end');
ok('D: destroyed in the End Phase',z(ee)==='grave'&&C(ee).graveInfo&&C(ee).graveInfo.byDestroy===true,JSON.stringify({z:z(ee)}));
audit('D');
fresh();
lg=mk('光神化',0);hw=mk('ワイト',0);gameState.players[0].hand=[lg,hw];baselineA();
duelActivateFromHand(0);drive();
ok('D2: no Fairy in the hand — cannot be activated',z(lg)==='hand'&&z(hw)==='hand'&&idle());
fresh();
lg=mk('光神化',0);ee=mk('アギド',0);gameState.players[0].hand=[lg,ee];gameState.players[0].mz=[up('ワイト',0),up('ワイト',0),up('ワイト',0),up('ワイト',0),up('ワイト',0)];baselineA();
duelActivateFromHand(0);drive();
ok('D3: Monster Zones full — cannot be activated',z(lg)==='hand'&&z(ee)==='hand'&&idle());
/* the only Fairy is chosen automatically; ATK 1500 → 750 */
fresh();
lg=mk('光神化',0);ee=mk('アギド',0);gameState.players[0].hand=[lg,ee];baselineA();
duelActivateFromHand(0);drive();
ok('D4: アギド (ATK 1500) special summoned with ATK 750',z(ee)==='mz'&&curATK(C(ee))===750,String(curATK(C(ee))));
audit('D4');

/* ===== E: 裏ガエル — set itself face-down once a turn; flipped: return up to (number of 「ガエル」) opponent monsters to the hand ===== */
fresh();
let ug=up('裏ガエル',0);gameState.players[0].mz=[ug];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('E: sets itself face-down Defense Position',z(ug)==='mz'&&C(ug).face==='down'&&C(ug).pos==='def',JSON.stringify({f:C(ug).face,p:C(ug).pos}));
audit('E');
fresh();
gameState.activePlayer=1;gameState.turn=6;gameState.phase='main1';
ug=up('裏ガエル',0);gameState.players[0].mz=[ug];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('E2: in the opponent\'s turn — cannot set itself',C(ug).face==='up'&&idle());
/* flip summon: 裏ガエル + 黄泉ガエル face-up = 2 「ガエル」 → up to 2 of 3 opponent monsters */
fresh();
ug=setT('裏ガエル',0);ug.pos='def';let yg=up('黄泉ガエル',0),nf=up('ワイト',0),o1=up('青眼の白龍',1),o2=up('ワイト',1),o3=setT('ハーピィ・レディ',1);o3.pos='def';
gameState.players[0].mz=[ug,yg,nf];gameState.players[1].mz=[o1,o2,o3];baselineA();
PREFER=[o1.uid,o3.uid,o2.uid];doFlipUp(0,'mz',0,'atk');drive();PREFER=[];
const qE=SEEN.find(s=>/裏ガエル/.test(s.title));
ok('E3: the flip trigger was offered; 2 「ガエル」 face-up → at most 2 of the 3 opponent monsters (face-down included)',TRIG.some(t=>t.indexOf('裏ガエル')>=0)&&qE&&qE.max===2&&qE.uids.length===3,JSON.stringify({TRIG,qE}));
ok('E3: the two chosen (青眼 and the face-down ハーピィ・レディ) are back in the hand; the third stays',z(o1)==='hand'&&z(o3)==='hand'&&z(o2)==='mz',JSON.stringify([z(o1),z(o3),z(o2)]));
audit('E3');
/* flipped by an attack: only itself is a 「ガエル」 → 1 monster */
fresh('battle');
gameState.activePlayer=1;gameState.turn=6;
ug=setT('裏ガエル',0);ug.pos='def';o1=up('アンサイクラー',1);o2=up('ワイト',1);
gameState.players[0].mz=[ug];gameState.players[1].mz=[o1,o2];baselineA();
PREFER=[o1.uid];hitT(1,o1,ug);PREFER=[];
const qE2=SEEN.find(s=>/裏ガエル/.test(s.title));
ok('E4: flipped by the attack — N = 1 (only itself): 1 monster; the attacker アンサイクラー returned to the hand; 裏ガエル survives (DEF 200 vs ATK 100)',qE2&&qE2.max===1&&z(o1)==='hand'&&z(o2)==='mz'&&z(ug)==='mz',JSON.stringify({qE2,o1:z(o1),o2:z(o2)}));
audit('E4');
/* the opponent has no monster: no bounce */
fresh();
ug=setT('裏ガエル',0);ug.pos='def';gameState.players[0].mz=[ug];baselineA();
doFlipUp(0,'mz',0,'atk');drive();
ok('E5: no opponent monster — nothing to return (no choice opened)',!SEEN.some(s=>/裏ガエル/.test(s.title))&&C(ug).face==='up'&&idle());

/* ===== F: 魔轟神ガルバス — discard 1 (cost); destroy an opponent monster whose DEF <= this card's ATK ===== */
fresh();
let gb=up('魔轟神ガルバス',0),kb=mk('魔轟神獣ケルベラル',0);hw=mk('ワイト',0);
let fb=up('青眼の白龍',1,'atk'),fw=up('ワイト',1,'def'),fh=setT('ハーピィ・レディ',1);fh.pos='def';
gameState.players[0].mz=[gb];gameState.players[0].hand=[kb,hw];gameState.players[1].mz=[fb,fw,fh];baselineA();
PREFER=[kb.uid,fw.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('F: the discarded 魔轟神獣ケルベラル triggered (discard as a cost) and came back to the field',z(kb)==='mz'&&TRIG.some(t=>t.indexOf('魔轟神獣ケルベラル')>=0),JSON.stringify({kb:z(kb),TRIG}));
ok('F: the opponent ワイト (DEF 200 <= ATK 1500) was destroyed',z(fw)==='grave'&&C(fw).graveInfo&&C(fw).graveInfo.byDestroy===true,JSON.stringify({fw:z(fw)}));
ok('F: 青眼 (DEF 2500) and the face-down monster were not offered; they stay; ワイト in hand remains',!offered(fb)&&!offered(fh)&&z(fb)==='mz'&&z(fh)==='mz'&&z(hw)==='hand',JSON.stringify(SEEN));
audit('F');
fresh();
gb=up('魔轟神ガルバス',0);hw=mk('ワイト',0);fb=up('青眼の白龍',1);
gameState.players[0].mz=[gb];gameState.players[0].hand=[hw];gameState.players[1].mz=[fb];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('F2: no opponent monster with DEF <= 1500 — cannot be activated (no discard)',z(hw)==='hand'&&z(fb)==='mz'&&idle());
fresh();
gb=up('魔轟神ガルバス',0);fw=up('ワイト',1);gameState.players[0].mz=[gb];gameState.players[1].mz=[fw];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('F3: no card in the hand to discard — cannot be activated',z(fw)==='mz'&&idle());
fresh();
gameState.activePlayer=1;gameState.turn=6;
gb=up('魔轟神ガルバス',0);hw=mk('ワイト',0);fw=up('ワイト',1);gameState.players[0].mz=[gb];gameState.players[0].hand=[hw];gameState.players[1].mz=[fw];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('F4: in the opponent\'s turn — cannot be activated',z(hw)==='hand'&&z(fw)==='mz'&&idle());

/* ===== G: ガルドスの羽根ペン — 2 WIND monsters of the GY to the Deck; 1 card on the field to its owner's hand ===== */
fresh();
let fp=mk('ガルドスの羽根ペン',0),kbee=mk('キラー・ビー',0),sbird=mk('セイント・バード',0),spk=mk('スピック',0),gw=mk('ワイト',0);
let fb2=up('青眼の白龍',1),ost=setT('サイクロン',1);
gameState.players[0].hand=[fp];gameState.players[0].grave=[kbee,sbird,spk,gw];gameState.players[1].mz=[fb2];gameState.players[1].sz=[ost];baselineA();
const decG=gameState.players[0].deck.length;
PREFER=[kbee.uid,sbird.uid,fb2.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('G: キラー・ビー / セイント・バード returned to the Deck (shuffled); スピック stays in the GY',z(kbee)==='deck'&&z(sbird)==='deck'&&z(spk)==='grave'&&gameState.players[0].deck.length===decG+2,JSON.stringify([z(kbee),z(sbird),z(spk)]));
ok('G: the opponent 青眼 returned to its owner\'s hand',z(fb2)==='hand'&&C(fb2).owner===1&&gameState.players[1].hand.some(x=>x.uid===fb2.uid),JSON.stringify({z:z(fb2)}));
ok('G: offered only WIND monsters (not ワイト) and not the Spell itself as a field target',offered(kbee)&&offered(sbird)&&offered(spk)&&!offered(gw)&&!offered(fp),JSON.stringify(SEEN));
ok('G: the Deck was shuffled (SHUFFLE journaled)',v41ReplayPackage(gameState).actions.some(a=>a&&a.action&&a.action.type==='SHUFFLE'));
audit('G');
/* the field target can be a set Spell/Trap */
fresh();
fp=mk('ガルドスの羽根ペン',0);kbee=mk('キラー・ビー',0);sbird=mk('セイント・バード',0);ost=setT('サイクロン',1);
gameState.players[0].hand=[fp];gameState.players[0].grave=[kbee,sbird];gameState.players[1].sz=[ost];baselineA();
PREFER=[ost.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('G2: a face-down opponent Spell/Trap is returned to its owner\'s hand',z(ost)==='hand'&&z(kbee)==='deck'&&z(sbird)==='deck',JSON.stringify([z(ost),z(kbee),z(sbird)]));
audit('G2');
fresh();
fp=mk('ガルドスの羽根ペン',0);gameState.players[0].hand=[fp];gameState.players[0].grave=[mk('キラー・ビー',0),mk('ワイト',0)];gameState.players[1].mz=[up('青眼の白龍',1)];baselineA();
duelActivateFromHand(0);drive();
ok('G3: only one WIND monster in the GY — cannot be activated',z(fp)==='hand'&&idle());
fresh();
fp=mk('ガルドスの羽根ペン',0);gameState.players[0].hand=[fp];gameState.players[0].grave=[mk('キラー・ビー',0),mk('セイント・バード',0)];baselineA();
duelActivateFromHand(0);drive();
ok('G4: no other card on the field — cannot be activated',z(fp)==='hand'&&idle());

/* ===== H: トライワイトゾーン — 3 Level 2 or lower Normal Monsters of the GY special summoned (3 free Monster Zones) ===== */
fresh();
let tz=mk('トライワイトゾーン',0),t1=mk('ワイト',0),t2=mk('もけもけ',0),t3=mk('はにわ',0),th=mk('ハーピィ・レディ',0),te=mk('裏ガエル',0);
gameState.players[0].hand=[tz];gameState.players[0].grave=[t1,t2,t3,th,te];baselineA();
duelActivateFromHand(0);drive();
ok('H: the three Level 2 or lower Normal Monsters special summoned face-up in Attack Position',[t1,t2,t3].every(c=>z(c)==='mz'&&C(c).face==='up'&&C(c).pos==='atk'),JSON.stringify([z(t1),z(t2),z(t3)]));
ok('H: the Level 4 Normal Monster and the Level 2 Effect Monster were not offered and stay in the GY',!offered(th)&&!offered(te)&&z(th)==='grave'&&z(te)==='grave',JSON.stringify(SEEN));
audit('H');
fresh();
tz=mk('トライワイトゾーン',0);t1=mk('ワイト',0);t2=mk('もけもけ',0);t3=mk('はにわ',0);
gameState.players[0].hand=[tz];gameState.players[0].grave=[t1,t2,t3];gameState.players[0].mz=[up('ワイト',0),up('ワイト',0),up('ワイト',0)];baselineA();
duelActivateFromHand(0);drive();
ok('H2: only 2 free Monster Zones — cannot be activated',z(tz)==='hand'&&z(t1)==='grave'&&idle());
fresh();
tz=mk('トライワイトゾーン',0);t1=mk('ワイト',0);t2=mk('もけもけ',0);t3=mk('ハーピィ・レディ',0);
gameState.players[0].hand=[tz];gameState.players[0].grave=[t1,t2,t3,mk('裏ガエル',0)];baselineA();
duelActivateFromHand(0);drive();
ok('H3: only 2 eligible monsters in the GY — cannot be activated',z(tz)==='hand'&&z(t1)==='grave'&&idle());
`);
