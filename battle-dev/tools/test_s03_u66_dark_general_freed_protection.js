/* S03-U66 C-S03-24 extension — ダーク・ジェネラル フリード「自分フィールド上に表側表示で存在する闇属性
   モンスターを対象にする魔法カードの効果を無効にし破壊する」.
   Requirement: S03-U33 implemented this card's Draw Phase replacement through C-S03-26 but kept it PARTIAL,
   since its continuous protection effect (which — unlike 無敗将軍 フリード's self-only version declared in
   S03-U32 — covers *every* face-up DARK monster the controller has, not just itself) needed the existing
   declareTargetingNegatorS03 dispatch to be extended: that mechanism only ever checks a card that is itself
   one of the chain link's targets, so it cannot express "protects some OTHER card." New
   engine/1ZE_targeting_protection_s03.js adds declareTargetingProtectorS03/applyTargetingProtectorsS03,
   scanning the target's controller's other face-up Monster Zone cards for a declared protector. ダーク・ジェ
   ネラル フリード is now declared under BOTH mechanisms: the existing self-negator (when it is itself
   targeted) and the new protector (when another of the controller's face-up DARK monsters is targeted).
   Also wired up its "cannot be Special Summoned" restriction via the existing generic cannotSpecialSummon
   flag (S03-U66, trivial — no new engine work). All three clauses of the card's text are now implemented;
   the card is no longer PARTIAL.
   Cards named here: ワイト, 青眼の白龍, ソウルテイカー, 六芒星の呪縛 (all TESTED or GENERIC_OK). */
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
function settle(){for(let k=0;k<30;k++){const r=drive();if(r==='choice'){__choicePickV49(0);continue;}if(r==='evt'){eventSkipGroupV2();continue;}return r;}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand');return i;}
function ready(p){gameState.activePlayer=p;gameState.phase='main1';baselineA();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));return pkg;}
function negatedLinks(pkg){return pkg.actions.map(x=>x&&x.action).filter(x=>x&&x.type==='CHAIN_NEGATE_LINK').map(x=>({mode:x.mode,reason:x.reason}));}
function pickUid(uid){for(let k=0;k<4&&pendingChoiceV49(gameState);k++){const pc=pendingChoiceV49(gameState);const i=pc.candidates.findIndex(x=>x.uid===uid);__choicePickV49(i<0?0:i);}}
function pick(m){const pc=pendingChoiceV49(gameState);if(!pc)return false;const i=pc.candidates.findIndex(x=>String(x.label||x.key||'').includes(m));if(i<0)return false;__choicePickV49(i);return true;}

/* ===== A. self: a Spell targeting フリード itself is negated and destroyed ===== */
fresh();
const gf=mk('ダーク・ジェネラル フリード',0);gameState.players[0].mz=[gf];
const soul=mk('ソウルテイカー',1);gameState.players[1].hand=[soul];ready(1);
let lp1=gameState.players[1].lp;
duelActivateFromHand(handIdx(1,'ソウルテイカー'));
pickUid(gf.uid);
settle();
let pkg=audit('A フリード self-target');
ok('A: ソウルテイカー targeting フリード itself has its effect negated and is destroyed; フリード survives, no LP gained',
  zoneOf(gf)==='mz'&&zoneOf(soul)==='grave'&&gameState.players[1].lp===lp1&&negatedLinks(pkg).some(x=>x.mode==='effect'&&x.reason==='ダーク・ジェネラル フリード'),
  JSON.stringify({gf:zoneOf(gf),soul:zoneOf(soul),lp1:gameState.players[1].lp,neg:negatedLinks(pkg)}));

/* ===== B. protects OTHERS: a Spell targeting a different face-up DARK monster フリード controls is also
   negated and destroyed (the actual new capability this unit adds). ===== */
fresh();
const gf2=mk('ダーク・ジェネラル フリード',0),wight=mk('ワイト',0);gameState.players[0].mz=[gf2,wight];
const soul2=mk('ソウルテイカー',1);gameState.players[1].hand=[soul2];ready(1);
lp1=gameState.players[1].lp;
duelActivateFromHand(handIdx(1,'ソウルテイカー'));
pickUid(wight.uid);
settle();
pkg=audit('B フリード protects ワイト');
ok('B: ソウルテイカー targeting a different face-up DARK monster (ワイト) フリード controls is negated and destroyed; ワイト survives, no LP gained',
  zoneOf(wight)==='mz'&&zoneOf(soul2)==='grave'&&gameState.players[1].lp===lp1&&negatedLinks(pkg).some(x=>x.mode==='effect'&&x.reason==='ダーク・ジェネラル フリード'),
  JSON.stringify({wight:zoneOf(wight),soul:zoneOf(soul2),lp1:gameState.players[1].lp,neg:negatedLinks(pkg)}));

/* ===== C. control: a non-DARK monster the controller has is NOT protected (attribute-scoped) ===== */
fresh();
const gf3=mk('ダーク・ジェネラル フリード',0),bey=mk('青眼の白龍',0);gameState.players[0].mz=[gf3,bey];
const soul3=mk('ソウルテイカー',1);gameState.players[1].hand=[soul3];ready(1);
let lp0=gameState.players[0].lp;
duelActivateFromHand(handIdx(1,'ソウルテイカー'));
pickUid(bey.uid);
settle();
pkg=audit('C control: non-DARK not protected');
ok('C control: ソウルテイカー targeting a LIGHT monster (青眼の白龍) フリード also controls is NOT negated — the protection is DARK-attribute-scoped (its controller, P0, gains the 1000 LP from the resolved effect)',
  !negatedLinks(pkg).some(x=>x.reason==='ダーク・ジェネラル フリード')&&zoneOf(bey)==='grave'&&gameState.players[0].lp===lp0+1000,
  JSON.stringify({bey:zoneOf(bey),lp0After:gameState.players[0].lp,neg:negatedLinks(pkg)}));

/* ===== D. control: without フリード on the field, a DARK monster is not protected ===== */
fresh();
const wight4=mk('ワイト',0);gameState.players[0].mz=[wight4];
const soul4=mk('ソウルテイカー',1);gameState.players[1].hand=[soul4];ready(1);
lp0=gameState.players[0].lp;
duelActivateFromHand(handIdx(1,'ソウルテイカー'));
pickUid(wight4.uid);
settle();
pkg=audit('D control: no フリード present');
ok('D control: without フリード on the field, ソウルテイカー targeting a DARK monster is not negated — the protection comes from フリード, not a blanket rule (its controller, P0, gains the 1000 LP)',
  !negatedLinks(pkg).some(x=>x.reason==='ダーク・ジェネラル フリード')&&zoneOf(wight4)==='grave'&&gameState.players[0].lp===lp0+1000,
  JSON.stringify({wight:zoneOf(wight4),lp0After:gameState.players[0].lp,neg:negatedLinks(pkg)}));

/* ===== E. control (10/06/11-style ruling, same as 無敗将軍 フリード): a TRAP is not negated, Spells only ===== */
fresh();
const gf5=mk('ダーク・ジェネラル フリード',0);gameState.players[0].mz=[gf5];
const hex=mk('六芒星の呪縛',1,'down');hex.setTurn=gameState.turn-1;gameState.players[1].sz=[hex];ready(1);
duelActivateFromZone(1,'sz',0);
pickUid(gf5.uid);
settle();
pkg=audit('E control: Trap vs フリード');
ok('E control: 六芒星の呪縛 (a Trap) targeting フリード is NOT negated — the protection covers Spell cards only',
  !negatedLinks(pkg).some(x=>x.reason==='ダーク・ジェネラル フリード')&&zoneOf(hex)==='sz',
  JSON.stringify({gf:zoneOf(gf5),hex:zoneOf(hex),neg:negatedLinks(pkg)}));

/* ===== F. cannot be Special Summoned (real attempt) ===== */
fresh();
gameState.players[0].grave=[mk('ダーク・ジェネラル フリード',0)];
ready(0);
const before=gameState.players[0].mz.length;
API.specialSummon(0,'grave',0,'atk','test attempt');
ok('F: a real Special Summon attempt does not place フリード on the field (cannotSpecialSummon)',
  gameState.players[0].mz.length===before,JSON.stringify({mz:gameState.players[0].mz.map(nm)}));

/* ===== G. regression: the Draw Phase replacement (S03-U33) still works after adding cannotSpecialSummon ===== */
fresh();
const gf6=mk('ダーク・ジェネラル フリード',0);gameState.players[0].mz=[gf6];
gameState.players[0].deck=[mk('ワイト',0,'down'),mk('ダーク・グレファー',0,'down')];
gameState.players[0].hand=[];
gameState.activePlayer=0;gameState.phase='draw';gameState.drawnThisTurn=false;
baselineA();
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0,n:1,normal:true});
drive();
pick('ダーク・ジェネラル フリード');
for(let k=0;k<8;k++){const r=drive();if(r==='choice'){__choicePickV49(0);continue;}break;}
ok('G regression: フリード still adds a Level 4 DARK monster from the Deck instead of drawing',
  gameState.players[0].hand.some(c=>nm(c)==='ダーク・グレファー')&&gameState.drawnThisTurn===true,
  JSON.stringify({hand:gameState.players[0].hand.map(nm),drawn:gameState.drawnThisTurn}));
audit('G draw replacement regression');
`);
