/* S03-U32 TARGETING_NEGATION_2 (C-S03-24 extension)
   Requirement: two more cards negate what targets them, automatically and without a chain block.
   - 無敗将軍 フリード 「このカードがフィールド上に表側表示で存在する限り、このカードを対象にする魔法カードの効果を無効にし破壊する。」
     2011 wiki (10/06/11): the negation is a continuous effect; Spell cards only.
   - カオス・マジシャン 「このカード1枚を対象にするモンスターの効果を無効にする。」
     2011 wiki (08/05/31): negated when this card ALONE is targeted; when two or more cards are
     targeted together it is not 「このカード1枚だけ」 and the effect applies normally. No destruction.
   Before this unit: neither card was declared (nor even registered), so both negations did nothing.
   Every card named here is TESTED or GENERIC_OK: ADチェンジャー, 使徒喰い虫, ソウルテイカー, 六芒星の呪縛, ワイト. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
let SEEN=[];
function settle(take){take=take||[];for(let k=0;k<30;k++){const r=drive();
  if(r==='evt'){const st=EVT_V2_STATE;st.groups.flat().forEach(c=>SEEN.push(c.name));const g=st.groups[st.rank];
    if(!(g&&g.length)){eventSkipGroupV2();continue;}
    const i=g.findIndex(c=>take.includes(c.name));
    if(i<0&&st.rank>=2){eventSkipGroupV2();continue;}
    eventPickV2(i<0?0:i);continue;}
  if(r==='choice'){__choicePickV49(0);continue;}
  return r;}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function posOf(c){const h=findCardByUid(c.uid);return h?h.card.pos:null;}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand');return i;}
function ready(p){gameState.activePlayer=p;gameState.phase='main1';baselineA();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));return pkg;}
function negatedLinks(pkg){return pkg.actions.map(x=>x&&x.action).filter(x=>x&&x.type==='CHAIN_NEGATE_LINK').map(x=>({mode:x.mode,reason:x.reason}));}
function pickUid(uid){for(let k=0;k<4&&pendingChoiceV49(gameState);k++){const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>x.uid===uid);__choicePickV49(i<0?0:i);}}

/* ===== A. カオス・マジシャン: a monster effect targeting only it is negated (no destruction) ===== */
fresh();
const cm=mk('カオス・マジシャン',0);gameState.players[0].mz=[cm];
const adc=mk('ADチェンジャー',1);gameState.players[1].grave=[adc];
ready(1);
duelActivateFromZone(1,'grave',0);
pickUid(cm.uid);
settle();
let pkg=audit('カオス・マジシャン vs ADチェンジャー');
ok('カオス・マジシャン: ADチェンジャー targeting only it has its effect negated — its position is unchanged and カオス・マジシャン is not destroyed',
  zoneOf(cm)==='mz'&&posOf(cm)==='atk'&&negatedLinks(pkg).some(x=>x.mode==='effect'&&x.reason==='カオス・マジシャン'),
  JSON.stringify({cm:zoneOf(cm),pos:posOf(cm),neg:negatedLinks(pkg),adc:zoneOf(adc),toasts:TOASTS.slice(-3)}));
ok('カオス・マジシャン: no chain block is created for it',
  !pkg.actions.map(x=>x&&x.action).some(x=>x&&x.type==='CHAIN_ADD'&&x.name==='カオス・マジシャン'),JSON.stringify(SEEN));

/* ===== B. control (the 08/05/31 ruling): two cards targeted together — the effect applies normally =====
   Driver: 使徒喰い虫 「リバース:フィールド上のモンスター2体を破壊する」, flip summoned through the real path
   (the zone menu's 反転召喚 entry -> doFlipUp -> summon window -> onFlip), which raises two target rounds. */
fresh();SEEN=[];
const cm2=mk('カオス・マジシャン',0);const ally=mk('ワイト',0);gameState.players[0].mz=[cm2,ally];
const bug=mk('使徒喰い虫',1,'down','def');bug.setTurn=gameState.turn-1;gameState.players[1].mz=[bug];
ready(1);
ok('control setup: the set 使徒喰い虫 can be flip summoned',canFlipSummonLegal(bug,1)===true,
  JSON.stringify({setTurn:bug.setTurn,turn:gameState.turn}));
doFlipUp(1,'mz',0,'atk');
for(let k=0;k<12;k++){
  const r=drive();
  if(r==='choice'){const pc=pendingChoiceV49(gameState);
    let i=pc.candidates.findIndex(x=>x.uid===cm2.uid);
    if(i<0)i=pc.candidates.findIndex(x=>x.uid===ally.uid);
    __choicePickV49(i<0?0:i);continue;}
  if(r==='evt'){const st=EVT_V2_STATE;st.groups.flat().forEach(c=>SEEN.push(c.name));
    const g=st.groups[st.rank];const i=g?g.findIndex(c=>c.name==='使徒喰い虫'):-1;
    if(g&&g.length)eventPickV2(i<0?0:i);else eventSkipGroupV2();continue;}
  break;}
pkg=audit('control: two targets');
ok('control (wiki 08/05/31): 使徒喰い虫 targets カオス・マジシャン together with another monster, so it is not 「このカード1枚だけ」 and カオス・マジシャン does not negate — both are destroyed',
  !negatedLinks(pkg).some(x=>x.reason==='カオス・マジシャン')&&zoneOf(cm2)==='grave'&&zoneOf(ally)==='grave',
  JSON.stringify({cm:zoneOf(cm2),ally:zoneOf(ally),neg:negatedLinks(pkg),seen:SEEN,toasts:TOASTS.slice(-3)}));

/* ===== C. control: a SPELL targeting カオス・マジシャン is not negated (its text says monster effects) ===== */
fresh();
const cm3=mk('カオス・マジシャン',0);gameState.players[0].mz=[cm3];
gameState.players[1].hand=[mk('ソウルテイカー',1)];ready(1);
duelActivateFromHand(handIdx(1,'ソウルテイカー'));
pickUid(cm3.uid);
settle();
pkg=audit('control: Spell vs カオス・マジシャン');
ok('control: ソウルテイカー (a Spell) targeting カオス・マジシャン is NOT negated — it destroys it',
  zoneOf(cm3)==='grave'&&!negatedLinks(pkg).some(x=>x.reason==='カオス・マジシャン'),
  JSON.stringify({cm:zoneOf(cm3),neg:negatedLinks(pkg)}));

/* ===== D. 無敗将軍 フリード: a Spell targeting it is negated and destroyed ===== */
fresh();
const freed=mk('無敗将軍 フリード',0);gameState.players[0].mz=[freed];
const soul=mk('ソウルテイカー',1);gameState.players[1].hand=[soul];ready(1);
const lp1=gameState.players[1].lp;
duelActivateFromHand(handIdx(1,'ソウルテイカー'));
pickUid(freed.uid);
settle();
pkg=audit('フリード vs ソウルテイカー');
ok('無敗将軍 フリード: P2 ソウルテイカー targeting it has its effect negated and the Spell is destroyed; フリード survives and no LP is gained',
  zoneOf(freed)==='mz'&&zoneOf(soul)==='grave'&&gameState.players[1].lp===lp1&&negatedLinks(pkg).some(x=>x.mode==='effect'&&x.reason==='無敗将軍 フリード'),
  JSON.stringify({freed:zoneOf(freed),soul:zoneOf(soul),lp1:gameState.players[1].lp,neg:negatedLinks(pkg)}));

/* ===== E. control: a TRAP targeting フリード is not negated (wiki 10/06/11: Spell cards only) ===== */
fresh();
const freed2=mk('無敗将軍 フリード',0);gameState.players[0].mz=[freed2];
const hex=mk('六芒星の呪縛',1,'down');hex.setTurn=gameState.turn-1;gameState.players[1].sz=[hex];ready(1);
duelActivateFromZone(1,'sz',0);
pickUid(freed2.uid);
settle();
pkg=audit('control: Trap vs フリード');
ok('control (wiki 10/06/11): 六芒星の呪縛 (a Trap) targeting フリード is NOT negated — the negation covers Spell cards only',
  !negatedLinks(pkg).some(x=>x.reason==='無敗将軍 フリード')&&zoneOf(hex)==='sz',
  JSON.stringify({freed:zoneOf(freed2),hex:zoneOf(hex),neg:negatedLinks(pkg),toasts:TOASTS.slice(-3)}));
`);
