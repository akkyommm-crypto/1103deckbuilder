/* S03-U176: contact-fusion cards with their whole texts — E・HERO アクア・ネオス / マリン・ネオス (random hand destruction, drawn inside
   the Action), XY－ドラゴン・キャノン / XZ－キャタピラー・キャノン / YZ－キャタピラー・ドラゴン / XYZ－ドラゴン・キャノン (discard, targeted
   destruction; no Special Summon from the GY), VW－タイガー・カタパルト (discard, position change without the flip effect).
   Real DUEL paths; Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:8},()=>mk('ワイト',p));}
let PREFER=[],SEEN=[],TRIG=[];
function drive(){for(let i=0;i<600;i++){
  const q=pc();
  if(q){SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid!=null?x.uid:x.label)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function contact(name,p){const i=gameState.players[p].ex.findIndex(c=>cardName(c)===name);finishSummonProcedure(name,p,'ex',i,'atk');drive();}
function fire(c){const h=findCardByUid(c.uid);const L=strictScriptLegalityV2(cardName(c),h.p,'mz',h.index,{});if(!L.ok)return L.reason;duelActivateFromZone(h.p,'mz',h.index);drive();return true;}

/* ===== A: アクア・ネオス — contact, discard 1 → a random opponent hand card destroyed; once per turn; End Phase return ===== */
fresh();
let neos=mk('E・HERO ネオス',0,'up'),dol=mk('N・アクア・ドルフィン',0,'up');gameState.players[0].mz=[neos,dol];
let aqua=mk('E・HERO アクア・ネオス',0,'up');gameState.players[0].ex=[aqua];
let d1=mk('ワイト',0),d2=mk('ワイト',0);gameState.players[0].hand=[d1,d2];
const oh=[mk('サイクロン',1),mk('ギガンテス',1),mk('強欲な壺',1)];gameState.players[1].hand=oh.slice();baselineA();
contact('E・HERO アクア・ネオス',0);
ok('A: アクア・ネオス contact-summoned (ネオス + アクア・ドルフィン back to the Deck)',z(aqua)==='mz'&&z(neos)==='deck'&&z(dol)==='deck');
const jA=V41_ACTION_JOURNAL.map(x=>x.action.type);const lastRet=jA.lastIndexOf('FX_RETURN_DECK'),shuf=jA.lastIndexOf('SHUFFLE');
ok('A: 「デッキに戻す」 — the Deck is shuffled after the materials return (they are not left on top)',lastRet>=0&&shuf>lastRet&&V41_ACTION_JOURNAL[shuf].action.player===0,JSON.stringify(jA));
PREFER=[d1.uid];const rA=fire(aqua);PREFER=[];
const gone=oh.filter(c=>z(c)==='grave');
ok('A: discarding 1 destroys exactly one random card of the opponent’s hand (destroyed, from the hand)',rA===true&&z(d1)==='grave'&&gone.length===1&&gameState.players[1].hand.length===2
  &&gameState.players[1].grave[0].graveInfo.byDestroy===true&&gameState.players[1].grave[0].graveInfo.from==='hand',JSON.stringify({rA,gone:gone.length}));
const rA2=fire(aqua);
ok('A: a second activation this turn is refused (1ターンに1度)',rA2!==true&&z(d2)==='hand',String(rA2));
phase('battle');phase('main2');phase('end');
ok('A: returns to the EX Deck in the End Phase',z(aqua)==='ex');
audit('A');

/* ===== B: マリン・ネオス — no cost, once per turn, no End Phase return ===== */
fresh();
gameState.players[0].mz=[mk('E・HERO ネオス',0,'up'),mk('N・マリン・ドルフィン',0,'up')];
let marine=mk('E・HERO マリン・ネオス',0,'up');gameState.players[0].ex=[marine];
gameState.players[1].hand=[mk('サイクロン',1),mk('ギガンテス',1)];baselineA();
contact('E・HERO マリン・ネオス',0);
const rB=fire(marine);
ok('B: マリン・ネオス destroys a random opponent hand card without a cost',rB===true&&gameState.players[1].hand.length===1&&gameState.players[1].grave.length===1&&gameState.players[0].grave.length===0);
ok('B: once per turn',fire(marine)!==true&&gameState.players[1].hand.length===1);
phase('battle');phase('main2');phase('end');
ok('B: it has no End Phase return (stays on the field)',z(marine)==='mz');
audit('B');

/* ===== C: XYZ－ドラゴン・キャノン — materials banished; discard + target any opponent card; usable again with another discard ===== */
fresh();
let xh=mk('X－ヘッド・キャノン',0,'up'),yd=mk('Y－ドラゴン・ヘッド',0,'up'),zm=mk('Z－メタル・キャタピラー',0,'up');gameState.players[0].mz=[xh,yd,zm];
let xyz=mk('XYZ－ドラゴン・キャノン',0,'up');gameState.players[0].ex=[xyz];
let h1=mk('ワイト',0),h2=mk('ワイト',0);gameState.players[0].hand=[h1,h2];
let st=mk('聖なるバリア －ミラーフォース－',1,'down'),om=mk('ギガンテス',1,'up');gameState.players[1].sz=[st];gameState.players[1].mz=[om];baselineA();
contact('XYZ－ドラゴン・キャノン',0);
ok('C: XYZ contact-summoned; X / Y / Z banished',z(xyz)==='mz'&&[xh,yd,zm].every(c=>z(c)==='banish'));
PREFER=[h1.uid,st.uid];fire(xyz);
PREFER=[h2.uid,om.uid];const rC2=fire(xyz);PREFER=[];
ok('C: the set card and then the monster are destroyed (no once-per-turn limit; one discard each)',z(st)==='grave'&&rC2===true&&z(om)==='grave'&&z(h1)==='grave'&&z(h2)==='grave');
audit('C');

/* ===== D: XY / XZ / YZ offer only their own kind of target ===== */
fresh();
gameState.players[0].mz=[mk('XY－ドラゴン・キャノン',0,'up'),mk('XZ－キャタピラー・キャノン',0,'up'),mk('YZ－キャタピラー・ドラゴン',0,'up')];
gameState.players[0].hand=[mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];
let fu=mk('王宮のお触れ',1,'up'),fd=mk('サイクロン',1,'down'),mu=mk('ギガンテス',1,'up'),md=mk('ワイト',1,'down','def');
gameState.players[1].sz=[fu,fd];gameState.players[1].mz=[mu,md];baselineA();
SEEN=[];fire(gameState.players[0].mz[0]);const tXY=SEEN.find(s=>/対象/.test(s.title));
SEEN=[];fire(findCardByUid(gameState.players[0].mz.find(c=>cardName(c)==='XZ－キャタピラー・キャノン').uid).card);const tXZ=SEEN.find(s=>/対象/.test(s.title));
SEEN=[];fire(findCardByUid(gameState.players[0].mz.find(c=>cardName(c)==='YZ－キャタピラー・ドラゴン').uid).card);const tYZ=SEEN.find(s=>/対象/.test(s.title));
ok('D: XY offers only the face-up Spell / Trap, XZ only the set one, YZ only the face-down monster — each destroyed',
  tXY&&JSON.stringify(tXY.cands)===JSON.stringify([fu.uid])&&tXZ&&JSON.stringify(tXZ.cands)===JSON.stringify([fd.uid])&&tYZ&&JSON.stringify(tYZ.cands)===JSON.stringify([md.uid])
  &&z(fu)==='grave'&&z(fd)==='grave'&&z(md)==='grave'&&z(mu)==='mz',JSON.stringify({tXY,tXZ,tYZ}));
audit('D');

/* ===== E: VW－タイガー・カタパルト — a face-down Flip monster becomes face-up Attack Position and its flip effect does not activate ===== */
fresh();
let vw=mk('VW－タイガー・カタパルト',0,'up');gameState.players[0].mz=[vw];gameState.players[0].hand=[mk('ワイト',0),mk('ワイト',0)];
let pot=mk('メタモルポット',1,'down','def');gameState.players[1].mz=[pot];gameState.players[1].hand=[mk('サイクロン',1)];baselineA();
TRIG=[];fire(vw);
const potH=findCardByUid(pot.uid);
ok('E: メタモルポット is now face-up Attack Position; its flip effect was not activated (hands unchanged)',potH.card.face==='up'&&potH.card.pos==='atk'&&!TRIG.some(g=>g.indexOf('メタモルポット')>=0)&&gameState.players[1].hand.length===1,JSON.stringify({f:potH.card.face,p:potH.card.pos,TRIG}));
TRIG=[];
ok('E: VW has no once-per-turn limit — face-up Attack → Defense with another discard',fire(vw)===true&&findCardByUid(pot.uid).card.pos==='def');
audit('E');

/* ===== F: 「墓地からの特殊召喚はできない」 (the cannons), VW has no such text ===== */
fresh();
const gx=mk('XYZ－ドラゴン・キャノン',0,'up');gx.properlySummonedS03=true;const gv=mk('VW－タイガー・カタパルト',0,'up');gv.properlySummonedS03=true;
gameState.players[0].grave=[gx,gv];baselineA();
ok('F: a properly summoned XYZ－ドラゴン・キャノン in the GY cannot be Special Summoned from there; VW can',
  canEffectSpecialSummonS03(gx,'grave','死者蘇生')===false&&canEffectSpecialSummonS03(gv,'grave','死者蘇生')===true);
const before=gameState.players[0].mz.length;const res=API.specialSummon(0,'grave',0,'atk','死者蘇生');
ok('F: API.specialSummon from the GY refuses it',res===false&&gameState.players[0].mz.length===before&&z(gx)==='grave');
`);
