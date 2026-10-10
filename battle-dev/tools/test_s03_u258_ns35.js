/* S03-U258: NOT_STARTED → TESTED — パルキオンのうろこ, ナチュル・ナーブ, ナチュル・サンフラワー, 暗黒の眠りを誘うルシファー, ソードハンター, 霞の谷の雷鳥, 地獄からの使い
   (2011 texts). Real DUEL paths (POINT / chain windows / summon procedure through the processor), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
/* the harness stubs openPick (DOM-only legacy pick: summon method / Tribute choice): capture its items and answer like the UI */
openPick=function(t,n,items,oc){PICK_ITEMS=items;};
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function pl(c){const hh=findCardByUid(c.uid);return hh?hh.p:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function domPick(){if(!PICK_ITEMS||!PICK_ITEMS.length)return false;let k=-1,j=-1;for(k=0;k<PREFER.length;k++){j=PICK_ITEMS.findIndex(it=>it.label===PREFER[k]||(it.card&&it.card.uid===PREFER[k]));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__pick(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(domPick())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);drive();}
function lp(p){return gameState.players[p].lp;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function setc(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function atk(p,a,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});drive();}
function atkReq(p,a,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});}
function toOppBattle(){phase('end');turn();phase('standby');phase('main1');phase('battle');}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
const USED=new Set();
function windows(use,seen){seen=seen||[];USED.clear();
  for(let i=0;i<60;i++){ if(!toWindow())break;
    let did=false;
    for(const c of use){ const o=findCardByUid(c.uid); if(!o||USED.has(c.uid))continue; if(offered(o.p,c)){seen.push(c.uid);USED.add(c.uid);duelActivateResponseV2(o.p,o.zone,o.index);did=true;break;} }
    if(!did)chainPassV2(); }
  drive();return seen;}
function respondOffer(cards){ if(!toWindow())return null; return cards.map(c=>{const o=findCardByUid(c.uid);return !!o&&offered(o.p,c);});}
/* player ap attacks; player rp responds at the first POINT matching want(payload) with the card at (zone,i) */
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(!step())break;}
  drive();return done;}
function lingers(p){const t=gameState.players[p].temporaryFlags;return (t&&t.lingerUidsS03)||[];}
const NAT='ナチュル・ビーンズ';

/* ===== A: パルキオンのうろこ — needs a face-up 「ナチュル」; this turn the opponent cannot activate Trap cards ===== */
fresh();
let bt=up('ナチュル・ビートル',0),pk=mk('パルキオンのうろこ',0),mf=setc('聖なるバリア －ミラーフォース－',1);
gameState.players[0].mz=[bt];gameState.players[0].hand=[pk];gameState.players[1].sz=[mf];baselineA();
cast(0,'パルキオンのうろこ');
ok('A: activated and resolved (GY), registered as a lingering source for this turn',z(pk)==='grave'&&lingers(0).indexOf(pk.uid)>=0&&Number(C(pk).u258ParkionTurn)===5&&!graveContinuousNamesV29().has('パルキオンのうろこ'),JSON.stringify({z:z(pk),l:lingers(0),t:C(pk)&&C(pk).u258ParkionTurn}));
ok('A: the opponent\'s Trap is forbidden, its controller\'s own is not',trapActivationForbiddenS03(1,C(mf))!==''&&trapActivationForbiddenS03(0,C(mf))==='',trapActivationForbiddenS03(1,C(mf))+'|'+trapActivationForbiddenS03(0,C(mf)));
phase('battle');
const hpA=lp(1);
attackRespond(0,bt,'direct',1,pl2=>pl2.kind==='attackDeclare','sz',0);
ok('A: the opponent\'s ミラーフォース cannot be activated against the attack — it stays Set, the attack deals 1700 (ナチュル・ビートル)',z(mf)==='sz'&&z(bt)==='mz'&&lp(1)===hpA-curATK(C(bt)),JSON.stringify({mf:z(mf),bt:z(bt),lp1:lp(1),hpA}));
audit('A');
/* control: without it the opponent's Trap works */
fresh();
bt=up('ナチュル・ビートル',0);mf=setc('聖なるバリア －ミラーフォース－',1);gameState.players[0].mz=[bt];gameState.players[1].sz=[mf];gameState.phase='battle';baselineA();
attackRespond(0,bt,'direct',1,pl2=>pl2.kind==='attackDeclare','sz',0);
ok('A3 control: without it the opponent\'s ミラーフォース destroys the attacker',z(mf)==='grave'&&z(bt)==='grave',JSON.stringify({mf:z(mf),bt:z(bt)}));
/* it lasts only this turn: on the opponent's turn the controller's own Trap works */
fresh();
bt=up('ナチュル・ビートル',0);pk=mk('パルキオンのうろこ',0);let mf0=setc('聖なるバリア －ミラーフォース－',0),ob=up('青眼の白龍',1);
gameState.players[0].mz=[bt];gameState.players[0].hand=[pk];gameState.players[0].sz=[mf0];gameState.players[1].mz=[ob];baselineA();
cast(0,'パルキオンのうろこ');toOppBattle();
attackRespond(1,ob,bt,0,pl2=>pl2.kind==='attackDeclare','sz',0);
ok('A2: next turn the lock is gone — its own ミラーフォース is activated and destroys the attacker',lingers(0).length===0&&z(mf0)==='grave'&&z(ob)==='grave',JSON.stringify({mf0:z(mf0),ob:z(ob),l:lingers(0)}));
audit('A2');
/* negatives: no 「ナチュル」, only a face-down one, only a non-ナチュル monster */
fresh();
pk=mk('パルキオンのうろこ',0);let wt0=up('ワイト',0);gameState.players[0].mz=[wt0];gameState.players[0].hand=[pk];baselineA();
cast(0,'パルキオンのうろこ');
ok('A4: no 「ナチュル」 on the field — cannot be activated',z(pk)==='hand'&&lingers(0).length===0,JSON.stringify({z:z(pk)}));
fresh();
pk=mk('パルキオンのうろこ',0);let bd=mk('ナチュル・ビートル',0,'down','def');gameState.players[0].mz=[bd];gameState.players[0].hand=[pk];baselineA();
cast(0,'パルキオンのうろこ');
ok('A4: a face-down 「ナチュル」 does not count',z(pk)==='hand',JSON.stringify({z:z(pk)}));

/* ===== B: ナチュル・ナーブ — the opponent activates a Spell / Trap: release another 「ナチュル」 and this card → negate and destroy ===== */
fresh();
let nv=up('ナチュル・ナーブ',0),bn=up(NAT,0),pot=mk('強欲な壺',1);
gameState.players[0].mz=[nv,bn];gameState.players[1].hand=[pot];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);
let seenB=windows([nv],[]);
ok('B: the opponent\'s Spell (強欲な壺) — offered; both 「ナチュル」 released, the Spell negated and destroyed (no draw)',seenB.indexOf(nv.uid)>=0&&z(nv)==='grave'&&z(bn)==='grave'&&z(pot)==='grave'&&gameState.players[1].hand.length===0,JSON.stringify({seen:seenB,nv:z(nv),bn:z(bn),pot:z(pot),h1:gameState.players[1].hand.length}));
audit('B');
fresh();
nv=up('ナチュル・ナーブ',0);bn=up(NAT,0);let bw0=up('青眼の白龍',0),mf1=setc('聖なるバリア －ミラーフォース－',1);
gameState.players[0].mz=[nv,bn,bw0];gameState.players[1].sz=[mf1];gameState.phase='battle';baselineA();
atkReq(0,bw0,'direct');
seenB=windows([mf1,nv],[]);
ok('B2: the opponent\'s Trap (ミラーフォース) — negated and destroyed: 青眼 survives, direct attack deals 3000',seenB.indexOf(nv.uid)>=0&&z(mf1)==='grave'&&z(bw0)==='mz'&&z(nv)==='grave'&&z(bn)==='grave'&&lp(1)===8000-3000,JSON.stringify({seen:seenB,mf1:z(mf1),bw0:z(bw0),lp1:lp(1)}));
audit('B2');
/* negatives */
fresh();
nv=up('ナチュル・ナーブ',0);bn=up(NAT,0);pot=mk('強欲な壺',0);gameState.players[0].mz=[nv,bn];gameState.players[0].hand=[pot];baselineA();
duelActivateFromHand(0);let offB=respondOffer([nv]);
ok('B3: its controller\'s own Spell — not offered',offB&&offB[0]===false,JSON.stringify({offB}));
drive();
fresh();
nv=up('ナチュル・ナーブ',0);pot=mk('強欲な壺',1);gameState.players[0].mz=[nv];gameState.players[1].hand=[pot];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);offB=respondOffer([nv]);
ok('B3: no other 「ナチュル」 to release — not offered',offB&&offB[0]===false,JSON.stringify({offB}));
drive();
fresh();
nv=up('ナチュル・ナーブ',0);bn=mk(NAT,0,'down','def');pot=mk('強欲な壺',1);gameState.players[0].mz=[nv,bn];gameState.players[1].hand=[pot];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);offB=respondOffer([nv]);
ok('B3: the other 「ナチュル」 is face-down (no name) — not offered',offB&&offB[0]===false,JSON.stringify({offB}));
drive();
fresh();
nv=up('ナチュル・ナーブ',0);bn=up(NAT,0);let rm=up('ならず者傭兵部隊',1),vt=up('ワイト',0);
gameState.players[0].mz=[nv,bn,vt];gameState.players[1].mz=[rm];gameState.activePlayer=1;baselineA();
PREFER=[vt.uid];duelActivateFromZone(1,'mz',0);offB=respondOffer([nv]);
ok('B3: the opponent\'s monster effect — ナーブ (Spell / Trap only) is not offered',offB&&offB[0]===false,JSON.stringify({offB}));
drive();PREFER=[];

/* ===== C: ナチュル・サンフラワー — the opponent's effect monster's effect is activated: release another 「ナチュル」 and this card → negate and destroy ===== */
fresh();
let sf=up('ナチュル・サンフラワー',0);bn=up(NAT,0);rm=up('ならず者傭兵部隊',1);vt=up('ワイト',0);
gameState.players[0].mz=[sf,bn,vt];gameState.players[1].mz=[rm];gameState.activePlayer=1;baselineA();
PREFER=[vt.uid];duelActivateFromZone(1,'mz',0);
let seenC=windows([sf],[]);PREFER=[];
ok('C: the opponent\'s monster effect (ならず者傭兵部隊) — サンフラワー is offered and negates it: the target ワイト survives',seenC.indexOf(sf.uid)>=0&&z(vt)==='mz'&&z(sf)==='grave'&&z(bn)==='grave'&&z(rm)==='grave',JSON.stringify({seen:seenC,vt:z(vt),sf:z(sf),bn:z(bn),rm:z(rm)}));
audit('C');
fresh();
sf=up('ナチュル・サンフラワー',0);bn=up(NAT,0);pot=mk('強欲な壺',1);gameState.players[0].mz=[sf,bn];gameState.players[1].hand=[pot];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);let offC=respondOffer([sf]);
ok('C2: the opponent\'s Spell — サンフラワー (monster effects only) is not offered',offC&&offC[0]===false,JSON.stringify({offC}));
drive();
fresh();
sf=up('ナチュル・サンフラワー',0);bn=up(NAT,0);rm=up('ならず者傭兵部隊',0);vt=up('ワイト',1);
gameState.players[0].mz=[sf,bn,rm];gameState.players[1].mz=[vt];baselineA();
PREFER=[vt.uid];duelActivateFromZone(0,'mz',idx(rm));offC=respondOffer([sf]);
ok('C2: its controller\'s own monster effect — not offered',offC&&offC[0]===false,JSON.stringify({offC}));
drive();PREFER=[];
fresh();
sf=up('ナチュル・サンフラワー',0);rm=up('ならず者傭兵部隊',1);vt=up('ワイト',0);gameState.players[0].mz=[sf,vt];gameState.players[1].mz=[rm];gameState.activePlayer=1;baselineA();
PREFER=[vt.uid];duelActivateFromZone(1,'mz',0);offC=respondOffer([sf]);
ok('C2: no other 「ナチュル」 — not offered',offC&&offC[0]===false,JSON.stringify({offC}));
drive();PREFER=[];

/* ===== D: 暗黒の眠りを誘うルシファー — Normal / Flip Summoned: select 1 opponent monster, it cannot attack while this card is face-up ===== */
fresh();
let lu=mk('暗黒の眠りを誘うルシファー',0),tr=up('ワイト',0),obw=up('青眼の白龍',1),owt=up('ワイト',1);
gameState.players[0].hand=[lu];gameState.players[0].mz=[tr];gameState.players[1].mz=[obw,owt];baselineA();
PREFER=[tr.uid,obw.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('D: Normal Summoned (Tribute) → 青眼 is the selected monster (link mark on the Lucifer)',z(lu)==='mz'&&C(lu).stLinkTargetS03===obw.uid,JSON.stringify({z:z(lu),m:C(lu)&&C(lu).stLinkTargetS03}));
ok('D: 青眼 cannot attack, the other opponent monster can',cannotAttackNow(C(obw))===true&&cannotAttackNow(C(owt))===false);
phase('end');turn();phase('standby');phase('main1');phase('battle');
atk(1,obw,lu);
ok('D: on the opponent\'s turn 青眼 does not attack',lp(0)===8000,JSON.stringify({lp0:lp(0)}));
atk(1,owt,lu);
ok('D: the other monster (ワイト) attacks normally (it battles ルシファー and is destroyed; 1200 to its controller)',lp(1)===8000-1200&&z(owt)==='grave',JSON.stringify({lp0:lp(0)}));
API.sendToGrave(findCardByUid(lu.uid),'test');drive();
ok('D: once the Lucifer has left the field, 青眼 can attack',z(lu)==='grave'&&cannotAttackNow(C(obw))===false&&(atk(1,obw,'direct'),lp(0)===8000-3000),JSON.stringify({lp0:lp(0)}));
audit('D');
/* Flip Summon */
fresh();
lu=mk('暗黒の眠りを誘うルシファー',0,'down','def');lu.setTurn=3;obw=up('青眼の白龍',1);gameState.players[0].mz=[lu];gameState.players[1].mz=[obw];baselineA();
PREFER=[obw.uid];doFlipUp(0,'mz',0,'atk');drive();PREFER=[];
ok('D2: Flip Summoned → 青眼 selected',C(lu).face==='up'&&C(lu).stLinkTargetS03===obw.uid&&cannotAttackNow(C(obw))===true,JSON.stringify({m:C(lu).stLinkTargetS03}));
audit('D2');
/* negatives: Special Summon, nothing to select */
fresh();
lu=mk('暗黒の眠りを誘うルシファー',0);obw=up('青眼の白龍',1);gameState.players[0].hand=[lu];gameState.players[1].mz=[obw];baselineA();
API.specialSummon(0,'hand',0,'atk','test');drive();
ok('D3: a Special Summon does not trigger it',z(lu)==='mz'&&C(lu).stLinkTargetS03==null&&cannotAttackNow(C(obw))===false,JSON.stringify({z:z(lu),m:C(lu)&&C(lu).stLinkTargetS03}));
fresh();
lu=mk('暗黒の眠りを誘うルシファー',0);tr=up('ワイト',0);gameState.players[0].hand=[lu];gameState.players[0].mz=[tr];baselineA();
PREFER=[tr.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('D3: no opponent monster — no selection, no link',z(lu)==='mz'&&C(lu).stLinkTargetS03==null,JSON.stringify({z:z(lu)}));

/* ===== E: ソードハンター — at the end of the Battle Phase in which it destroyed monsters by battle, equip them from the GY, ATK +200 each ===== */
fresh();
let sh=up('ソードハンター',0),ew=up('ワイト',1,'atk');
gameState.players[0].mz=[sh];gameState.players[1].mz=[ew];gameState.phase='battle';baselineA();
atk(0,sh,ew);
ok('E: the destroyed ワイト is in the GY during the Battle Phase (not yet equipped)',z(ew)==='grave'&&gameState.phase==='battle',JSON.stringify({z:z(ew),ph:gameState.phase}));
phase('main2');
ok('E: at the end of the Battle Phase ワイト is equipped to ソードハンター as an Equip Card, ATK 2450 + 200',z(ew)==='sz'&&pl(ew)===0&&C(ew).v46MonsterEquip===true&&C(ew).equipTo&&C(ew).equipTo.uid===sh.uid&&curATK(C(sh))===2650,JSON.stringify({z:z(ew),atk:curATK(C(sh))}));
audit('E');
/* it destroyed nothing (a Defense Position 青眼 with 2500 DEF) → nothing to equip */
fresh();
sh=up('ソードハンター',0);let od=up('青眼の白龍',1,'def');gameState.players[0].mz=[sh];gameState.players[1].mz=[od];gameState.phase='battle';baselineA();
atk(0,sh,od);phase('main2');
ok('E2: it destroyed nothing — no equip, ATK unchanged',z(od)==='mz'&&gameState.players[0].sz.length===0&&curATK(C(sh))===2450,JSON.stringify({z:z(od),sz:gameState.players[0].sz.length}));
/* the opponent's turn: two attackers destroyed by the Sword Hunter in defence → both equipped, +400 */
fresh();
sh=up('ソードハンター',0);let a1=up('ワイト',1),a2=up('ワイト',1);gameState.players[0].mz=[sh];gameState.players[1].mz=[a1,a2];baselineA();
toOppBattle();atk(1,a1,sh);atk(1,a2,sh);phase('main2');
ok('E3: two attackers destroyed in the opponent\'s Battle Phase — both equipped to ソードハンター (owner kept), ATK 2450 + 400',z(a1)==='sz'&&z(a2)==='sz'&&pl(a1)===0&&pl(a2)===0&&C(a1).owner===1&&curATK(C(sh))===2850,JSON.stringify({a1:z(a1),a2:z(a2),atk:curATK(C(sh))}));
audit('E3');
/* a monster destroyed by an effect in the Battle Phase is not equipped */
fresh();
sh=up('ソードハンター',0);ew=up('ワイト',1,'atk');let ow2=up('ワイト',1,'atk');gameState.players[0].mz=[sh];gameState.players[1].mz=[ew,ow2];gameState.phase='battle';baselineA();
atk(0,sh,ew);API.destroy(findCardByUid(ow2.uid),'test');drive();phase('main2');
ok('E4: only the monster it destroyed by battle is equipped, not one destroyed by an effect',z(ew)==='sz'&&z(ow2)==='grave'&&curATK(C(sh))===2650,JSON.stringify({ew:z(ew),ow2:z(ow2)}));

/* ===== F: 霞の谷の雷鳥 — returned to the hand from the face-up field: Special Summon it; it cannot attack that turn ===== */
fresh();
let rc=up('霞の谷の雷鳥',0),bw1=up('青眼の白龍',0),cf=setc('強制脱出装置',1);
gameState.players[0].mz=[rc,bw1];gameState.players[1].sz=[cf];gameState.phase='battle';baselineA();
PREFER=[rc.uid];const usedF=attackRespond(0,bw1,'direct',1,pl2=>pl2.kind==='attackDeclare','sz',0);PREFER=[];
ok('F: 強制脱出装置 returns it to the hand → it is Special Summoned back to the field',usedF&&z(cf)==='grave'&&z(rc)==='mz'&&pl(rc)===0,JSON.stringify({usedF,cf:z(cf),rc:z(rc)}));
ok('F: it cannot attack the turn it was Special Summoned this way (zone-local stamp)',cannotAttackNow(C(rc))===true&&C(rc).cannotAttackTurn===gameState.turn,JSON.stringify({t:C(rc)&&C(rc).cannotAttackTurn}));
audit('F');
phase('end');turn();phase('end');turn();
ok('F: two turns later it can attack again',z(rc)==='mz'&&cannotAttackNow(C(rc))===false,JSON.stringify({z:z(rc),t:gameState.turn,st:C(rc)&&C(rc).cannotAttackTurn,ph:gameState.phase}));
/* negatives */
fresh();
rc=mk('霞の谷の雷鳥',0);gameState.players[0].hand=[rc];baselineA();
drive();
ok('F2: a copy in the hand does nothing by itself',z(rc)==='hand');
fresh();
rc=up('霞の谷の雷鳥',0);let fm=[1,2,3,4].map(()=>up('ワイト',0));gameState.players[0].mz=[rc].concat(fm);baselineA();
API.returnToHand(findCardByUid(rc.uid),'test');drive();
ok('F3: no free Monster Zone — it stays in the hand',z(rc)==='hand',JSON.stringify({z:z(rc)}));
fresh();
rc=mk('霞の谷の雷鳥',0,'down','def');rc.setTurn=3;gameState.players[0].mz=[rc];baselineA();
API.returnToHand(findCardByUid(rc.uid),'test');drive();
ok('F3: returned face-down — it is not Special Summoned',z(rc)==='hand',JSON.stringify({z:z(rc)}));
fresh();
rc=up('霞の谷の雷鳥',0);gameState.players[0].mz=[rc];baselineA();
API.sendToGrave(findCardByUid(rc.uid),'test');drive();
ok('F3: sent to the Graveyard (not the hand) — nothing',z(rc)==='grave');

/* ===== G: 地獄からの使い — cannot be Special Summoned; Normal Summon with 1 Tribute: Level 5, original ATK / DEF halved; the 2-Tribute Summon stays ===== */
fresh();
let hj=mk('地獄からの使い',0),t1=up('ワイト',0),t0=up('ワイト',0);
gameState.players[0].hand=[hj];gameState.players[0].mz=[t1,t0];baselineA();
const mths=normalSummonMethodsFor(dbOf(C(hj)),0,'summon');
ok('G: methods — 1-Tribute and 2-Tribute Summons; Set only with the 2-Tribute standard',mths.some(m=>m.tributes===1)&&mths.some(m=>m.tributes===2)&&normalSummonMethodsFor(dbOf(C(hj)),0,'set').every(m=>m.tributes===2),JSON.stringify(mths.map(m=>m.id+':'+m.tributes)));
PREFER=['1体リリースして召喚（レベル5・元々の攻撃力・守備力は半分）',t1.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('G: Summoned with 1 Tribute — Level 5, ATK 1300, DEF 900',z(hj)==='mz'&&z(t1)==='grave'&&curLV(C(hj))===5&&curATK(C(hj))===1300&&curDEF(C(hj))===900,JSON.stringify({z:z(hj),lv:curLV(C(hj)),atk:curATK(C(hj)),def:curDEF(C(hj))}));
audit('G');
fresh();
hj=mk('地獄からの使い',0);t1=up('ワイト',0);let t2=up('ワイト',0);
gameState.players[0].hand=[hj];gameState.players[0].mz=[t1,t2];baselineA();
PREFER=['2体分リリースして召喚',t1.uid,t2.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('G2: the standard 2-Tribute Summon — printed Level 7, ATK 2600, DEF 1800',z(hj)==='mz'&&curLV(C(hj))===7&&curATK(C(hj))===2600&&curDEF(C(hj))===1800,JSON.stringify({z:z(hj),lv:z(hj)==='mz'&&curLV(C(hj)),atk:z(hj)==='mz'&&curATK(C(hj))}));
audit('G2');
fresh();
hj=mk('地獄からの使い',0);gameState.players[0].hand=[hj];baselineA();
const spOk=API.specialSummon(0,'hand',0,'atk','test');
ok('G3: cannot be Special Summoned',!spOk&&z(hj)==='hand',JSON.stringify({spOk,z:z(hj)}));
`);
