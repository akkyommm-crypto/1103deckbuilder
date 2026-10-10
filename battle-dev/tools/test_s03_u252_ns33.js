/* S03-U252: NOT_STARTED → TESTED — 不意打ち又佐, サイレント・マジシャン LV8, トラップ処理班 Aチーム, 死霊騎士デスカリバー・ナイト, 神罰,
   ガリトラップ－ピクシーの輪－ (2011 texts). Real DUEL paths, Replay-audited.
   Not covered (reported): マシンナーズ・スナイパー — engine/1ZU skips the attacking player's own source, so 「お互いに」 cannot be expressed yet. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function ctl(c){const hh=findCardByUid(c.uid);return hh?hh.p:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;TRIG.length=0;
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
function idx(c){return findCardByUid(c.uid).index;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function setc(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function atk(p,i,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:i,target:t});drive();}
function atkReq(p,i,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:i,target:t});}
function toOppBattle(){phase('end');turn();phase('standby');phase('main1');phase('battle');}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
/* run the chain windows: respond with each card in order of 'use' ([card,...]) when it is offered to its owner; otherwise pass. Returns the cards that were offered. */
const USED=new Set();
function windows(use,seen){seen=seen||[];USED.clear();
  for(let i=0;i<60;i++){ if(!toWindow())break;
    let did=false;
    for(const c of use){ const o=findCardByUid(c.uid); if(!o||USED.has(c.uid))continue; if(offered(o.p,c)){seen.push(c.uid);USED.add(c.uid);duelActivateResponseV2(o.p,o.zone,o.index);did=true;break;} }
    if(!did)chainPassV2(); }
  drive();return seen;}
function windowsAll(use){const seen=[];windows(use,seen);return seen;}
function respondOffer(cards){ /* which of the cards are offered at the first window; null when no window opens */
  if(!toWindow())return null; return cards.map(c=>{const o=findCardByUid(c.uid);return !!o&&offered(o.p,c);});}

/* ===== A: 不意打ち又佐 — attacks twice per Battle Phase; control cannot change while face-up ===== */
fresh();
let mt=up('不意打ち又佐',0);gameState.players[0].mz=[mt];gameState.phase='battle';baselineA();
atk(0,0,'direct');atk(0,0,'direct');
ok('A: 又佐 attacks twice directly — 1300 x 2 = 2600',lp(1)===8000-2600,JSON.stringify({lp1:lp(1)}));
atk(0,0,'direct');
ok('A: a third attack in the same Battle Phase is refused',lp(1)===8000-2600,JSON.stringify({lp1:lp(1)}));
audit('A');
fresh();
let wt=up('ワイト',0);gameState.players[0].mz=[wt];gameState.phase='battle';baselineA();
atk(0,0,'direct');atk(0,0,'direct');
ok('A2 control: a normal monster (ワイト) attacks only once',lp(1)===8000-300,JSON.stringify({lp1:lp(1)}));
fresh();
mt=up('不意打ち又佐',0);wt=up('ワイト',0);gameState.players[0].mz=[mt,wt];gameState.players[1].hand=[mk('心変わり',1),mk('心変わり',1)];gameState.activePlayer=1;baselineA();
cast(1,'心変わり',[mt.uid]);
ok('A3: 心変わり on 又佐 — control does not change',ctl(mt)===0&&z(mt)==='mz',JSON.stringify({ctl:ctl(mt)}));
cast(1,'心変わり',[wt.uid]);
ok('A3: 心変わり on ワイト still takes it',ctl(wt)===1,JSON.stringify({ctl:ctl(wt)}));
audit('A3');

/* ===== B: サイレント・マジシャン LV8 — not Normal Summonable; only 「LV4」's effect may Special Summon it; unaffected by the opponent's Spells ===== */
fresh();
let s8=mk('サイレント・マジシャン LV8',0);gameState.players[0].hand=[s8];baselineA();
const okOther=API.specialSummon(0,'hand',0,'atk','リミッター解除');
ok('B: another effect cannot Special Summon LV8 from the hand',!okOther&&z(s8)==='hand',JSON.stringify({okOther,z:z(s8)}));
ok('B: not Normal Summonable (no Normal Summon method)',normalSummonMethodsFor(dbOf(C(s8)),0,'summon').length===0);
ok('B: 「サイレント・マジシャン LV4」 may Special Summon it, another effect may not',summonOnlyReasonS03(C(s8),null,'サイレント・マジシャン LV4')===''&&summonOnlyReasonS03(C(s8),null,'リミッター解除')!=='',summonOnlyReasonS03(C(s8),null,'サイレント・マジシャン LV4')+'|'+summonOnlyReasonS03(C(s8),null,'リミッター解除'));
fresh();
s8=up('サイレント・マジシャン LV8',0);wt=up('ワイト',0);gameState.players[0].mz=[s8,wt];gameState.players[1].hand=[mk('サンダー・ボルト',1)];gameState.activePlayer=1;baselineA();
cast(1,'サンダー・ボルト');
ok('B: the opponent\'s サンダー・ボルト destroys ワイト, not LV8',z(wt)==='grave'&&z(s8)==='mz',JSON.stringify({wt:z(wt),s8:z(s8)}));
audit('B');
fresh();
s8=up('サイレント・マジシャン LV8',0);gameState.players[0].mz=[s8];gameState.players[0].hand=[mk('ブラック・ホール',0)];baselineA();
cast(0,'ブラック・ホール');
ok('B2: its controller\'s own ブラック・ホール destroys it',z(s8)==='grave',JSON.stringify({z:z(s8)}));
fresh();
s8=up('サイレント・マジシャン LV8',0);gameState.players[0].mz=[s8];gameState.players[1].hand=[mk('ブラック・ホール',1)];gameState.activePlayer=1;baselineA();
cast(1,'ブラック・ホール');
ok('B2: the opponent\'s ブラック・ホール does not destroy it',z(s8)==='mz',JSON.stringify({z:z(s8)}));
audit('B2');

/* ===== C: トラップ処理班 Aチーム — the opponent activates a Trap: release it → negate and destroy that Trap ===== */
fresh();
let tm=up('トラップ処理班 Aチーム',1),bw=up('青眼の白龍',1),mf=setc('聖なるバリア －ミラーフォース－',0);
gameState.players[1].mz=[tm,bw];gameState.players[0].sz=[mf];gameState.activePlayer=1;gameState.phase='battle';baselineA();
atkReq(1,idx(bw),'direct');
let seen=windows([mf,tm]);
ok('C: the opponent\'s ミラーフォース activated — 処理班 is offered to its controller',seen.indexOf(tm.uid)>=0&&z(mf)==='grave',JSON.stringify({seen,tm:z(tm),mf:z(mf)}));
ok('C: 処理班 released (GY), ミラーフォース negated and destroyed, 青眼 survives and the direct attack deals 3000',z(tm)==='grave'&&z(mf)==='grave'&&z(bw)==='mz'&&lp(0)===8000-3000,JSON.stringify({tm:z(tm),mf:z(mf),bw:z(bw),lp0:lp(0)}));
audit('C');
/* C2 negatives: the controller's own Trap; the opponent's Spell */
fresh();
tm=up('トラップ処理班 Aチーム',1);mf=setc('聖なるバリア －ミラーフォース－',1);let a0=up('青眼の白龍',0);
gameState.players[1].mz=[tm];gameState.players[1].sz=[mf];gameState.players[0].mz=[a0];gameState.phase='battle';baselineA();
atkReq(0,0,0);
let sn=windows([mf,tm],[]);
ok('C2: its controller\'s own Trap — 処理班 is not offered; ミラーフォース destroys the attacker',z(a0)==='grave'&&z(tm)==='mz'&&z(mf)==='grave'&&sn.indexOf(tm.uid)<0,JSON.stringify({a0:z(a0),tm:z(tm),sn}));
fresh();
tm=up('トラップ処理班 Aチーム',1);gameState.players[1].mz=[tm];gameState.players[0].hand=[mk('強欲な壺',0)];baselineA();
duelActivateFromHand(0);
const off=respondOffer([tm]);
ok('C2: the opponent\'s Spell — 処理班 is not offered',off&&off[0]===false,JSON.stringify({off}));
drive();
ok('C2: 強欲な壺 resolves (draw 2), 処理班 stays',gameState.players[0].hand.length===2&&z(tm)==='mz',JSON.stringify({h:gameState.players[0].hand.length}));
audit('C2');

/* ===== D: 死霊騎士デスカリバー・ナイト — cannot be Special Summoned; a monster effect is activated (either player's): release it → negate and destroy ===== */
fresh();
let dk=up('死霊騎士デスカリバー・ナイト',0),rm=up('ならず者傭兵部隊',1),vt=up('ワイト',0);
gameState.players[0].mz=[dk,vt];gameState.players[1].mz=[rm];gameState.activePlayer=1;baselineA();
PREFER=[vt.uid];duelActivateFromZone(1,'mz',0);
seen=windows([dk],[]);PREFER=[];
ok('D: the opponent\'s monster effect (ならず者傭兵部隊) — デスカリバー・ナイト is offered and negates it: the target ワイト survives',seen.indexOf(dk.uid)>=0&&z(vt)==='mz'&&z(dk)==='grave'&&z(rm)==='grave',JSON.stringify({seen,vt:z(vt),dk:z(dk),rm:z(rm)}));
audit('D');
fresh();
dk=up('死霊騎士デスカリバー・ナイト',0);rm=up('ならず者傭兵部隊',0);vt=up('ワイト',1);
gameState.players[0].mz=[dk,rm];gameState.players[1].mz=[vt];baselineA();
PREFER=[vt.uid];duelActivateFromZone(0,'mz',idx(rm));
seen=windows([dk],[]);PREFER=[];
ok('D2: its controller\'s own monster effect also can be answered — the target ワイト survives',seen.indexOf(dk.uid)>=0&&z(vt)==='mz'&&z(dk)==='grave',JSON.stringify({seen,vt:z(vt),dk:z(dk),rm:z(rm)}));
audit('D2');
fresh();
dk=up('死霊騎士デスカリバー・ナイト',1);gameState.players[1].mz=[dk];gameState.players[0].hand=[mk('強欲な壺',0)];baselineA();
duelActivateFromHand(0);
const offD=respondOffer([dk]);
ok('D3: a Spell activation (not a monster effect) — デスカリバー・ナイト is not offered',offD&&offD[0]===false,JSON.stringify({offD}));
drive();
fresh();
dk=mk('死霊騎士デスカリバー・ナイト',0);gameState.players[0].hand=[dk];baselineA();
ok('D4: another effect cannot Special Summon デスカリバー・ナイト',!API.specialSummon(0,'hand',0,'atk','リミッター解除')&&z(dk)==='hand',JSON.stringify({z:z(dk)}));

/* ===== E: 神罰 — with 「天空の聖域」 on the field (either Field Zone), a monster effect / Spell / Trap activation is negated and destroyed ===== */
fresh();
let ss=setc('神罰',0),sa=mk('天空の聖域',0,'up');gameState.players[0].sz=[ss];gameState.players[0].field=sa;gameState.players[1].hand=[mk('強欲な壺',1)];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);seen=windows([ss],[]);
ok('E: the opponent\'s Spell (強欲な壺) is negated and destroyed — no draw; 神罰 goes to the GY',seen.indexOf(ss.uid)>=0&&gameState.players[1].hand.length===0&&gameState.players[1].deck.length===6&&gameState.players[1].grave.some(c=>cardName(c)==='強欲な壺')&&z(ss)==='grave',JSON.stringify({seen,h:gameState.players[1].hand.length,d:gameState.players[1].deck.length}));
audit('E');
fresh();
ss=setc('神罰',0);rm=up('ならず者傭兵部隊',1);vt=up('ワイト',0);
gameState.players[0].sz=[ss];gameState.players[0].mz=[vt];gameState.players[1].mz=[rm];gameState.players[1].field=mk('天空の聖域',1,'up');gameState.activePlayer=1;baselineA();
PREFER=[vt.uid];duelActivateFromZone(1,'mz',0);seen=windows([ss],[]);PREFER=[];
ok('E2: the opponent\'s monster effect is negated (「天空の聖域」 in the opponent\'s Field Zone) — the target ワイト survives',seen.indexOf(ss.uid)>=0&&z(vt)==='mz'&&z(ss)==='grave',JSON.stringify({seen,vt:z(vt),ss:z(ss)}));
audit('E2');
fresh();
ss=setc('神罰',1);mf=setc('聖なるバリア －ミラーフォース－',0);bw=up('青眼の白龍',1);
gameState.players[1].sz=[ss];gameState.players[1].mz=[bw];gameState.players[0].sz=[mf];gameState.players[0].field=mk('天空の聖域',0,'up');gameState.activePlayer=1;gameState.phase='battle';baselineA();
atkReq(1,0,'direct');seen=windows([mf,ss],[]);
ok('E3: a Trap (ミラーフォース) is negated and destroyed — 青眼 survives, 3000 direct damage',seen.indexOf(ss.uid)>=0&&z(mf)==='grave'&&z(ss)==='grave'&&z(bw)==='mz'&&lp(0)===8000-3000,JSON.stringify({seen,mf:z(mf),bw:z(bw),lp0:lp(0)}));
audit('E3');
/* E4 negative: no 「天空の聖域」 on the field — not offered */
fresh();
ss=setc('神罰',0);gameState.players[0].sz=[ss];gameState.players[1].hand=[mk('強欲な壺',1)];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);
const offE=respondOffer([ss]);
ok('E4: no 「天空の聖域」 on the field — 神罰 is not offered',offE&&offE[0]===false,JSON.stringify({offE}));
drive();
ok('E4: 強欲な壺 resolves (draw 2)',gameState.players[1].hand.length===2&&z(ss)==='sz',JSON.stringify({h:gameState.players[1].hand.length}));
/* E5 negative: a face-down 「天空の聖域」 is not 「天空の聖域」 on the field is not possible for a Field Spell; a Set copy would be face-down */
fresh();
ss=setc('神罰',0);gameState.players[0].sz=[ss];gameState.players[0].field=mk('天空の聖域',0,'down');gameState.players[1].hand=[mk('強欲な壺',1)];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);
const offE5=respondOffer([ss]);
ok('E5: a face-down 「天空の聖域」 does not count',offE5&&offE5[0]===false,JSON.stringify({offE5}));
drive();

/* ===== F: ガリトラップ－ピクシーの輪－ — with 2+ face-up Attack Position monsters, the opponent cannot target the lowest-ATK monster(s) for attacks ===== */
function galiSetup(own){fresh();const gl=setc('ガリトラップ－ピクシーの輪－',0),att=up('ワイト',1);
  gameState.players[0].mz=own;gameState.players[0].sz=[gl];gameState.players[1].mz=[att];baselineA();
  duelActivateFromZone(0,'sz',0);drive();return {gl,att};}
let wt1=up('ワイト',0),ab=up('青眼の白龍',0),G=galiSetup([wt1,ab]);
ok('F: the Continuous Trap is face-up on the field',z(G.gl)==='sz'&&C(G.gl).face==='up',JSON.stringify({z:z(G.gl),TRIG}));
toOppBattle();
ok('F: with 2 Attack Position monsters the lowest-ATK ワイト cannot be chosen; 青眼 can',attackTargetForbiddenReasonS03(1,C(wt1))!==''&&attackTargetForbiddenReasonS03(1,C(ab))==='',attackTargetForbiddenReasonS03(1,C(wt1))+'|'+attackTargetForbiddenReasonS03(1,C(ab)));
atk(1,idx(G.att),idx(wt1));
ok('F: the attack on ワイト is refused',z(wt1)==='mz'&&lp(1)===8000&&z(G.att)==='mz',JSON.stringify({wt:z(wt1),lp1:lp(1)}));
atk(1,idx(G.att),idx(ab));
ok('F: the attack on 青眼 goes through — the attacker is destroyed by 3000',z(G.att)==='grave'&&lp(1)===8000-2700,JSON.stringify({att:z(G.att),lp1:lp(1)}));
audit('F');
/* F2: a tie — every lowest-ATK monster is protected */
wt1=up('ワイト',0);let wt2=up('ワイト',0);ab=up('青眼の白龍',0);G=galiSetup([wt1,wt2,ab]);toOppBattle();
ok('F2: tie — both ワイト are protected, 青眼 is not',attackTargetForbiddenReasonS03(1,C(wt1))!==''&&attackTargetForbiddenReasonS03(1,C(wt2))!==''&&attackTargetForbiddenReasonS03(1,C(ab))==='');
audit('F2');
/* F3 negatives: only one Attack Position monster (the other is in Defense Position); a face-down monster does not count */
wt1=up('ワイト',0);ab=up('青眼の白龍',0,'def');G=galiSetup([wt1,ab]);toOppBattle();
ok('F3: one Attack Position monster + one Defense Position — the Trap does not apply',attackTargetForbiddenReasonS03(1,C(wt1))===''&&attackTargetForbiddenReasonS03(1,C(ab))==='');
wt1=up('ワイト',0);ab=mk('青眼の白龍',0,'down','def');ab.setTurn=3;G=galiSetup([wt1,ab]);toOppBattle();
ok('F3: a face-down monster does not count — the Trap does not apply',attackTargetForbiddenReasonS03(1,C(wt1))==='');
atk(1,idx(G.att),idx(wt1));
ok('F3: ワイト can be attacked and is destroyed',z(wt1)==='grave',JSON.stringify({wt:z(wt1)}));
/* F4: the Trap controller's own attacks are not restricted; a Trap that is still face-down protects nothing */
fresh();
wt1=up('ワイト',0);ab=up('青眼の白龍',0);let gl4=setc('ガリトラップ－ピクシーの輪－',0),ow=up('ワイト',1);
gameState.players[0].mz=[wt1,ab];gameState.players[0].sz=[gl4];gameState.players[1].mz=[ow];baselineA();
ok('F4: before activation (face-down) nothing is protected',attackTargetForbiddenReasonS03(1,C(wt1))==='');
ok('F4: the opponent\'s own monster is never protected by it',attackTargetForbiddenReasonS03(0,C(ow))==='');
`);
