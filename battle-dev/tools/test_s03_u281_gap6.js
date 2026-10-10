/* S03-U281: ENGINE_GAP re-check 6 — エヴォルダー・ディプロドクス, 反撃の毒牙, 古代の機械爆弾, 黒蠍団召集, 連鎖旋風, シャーク・ザ・クルー (2011 texts).
   Real DUEL paths (activation / chain windows / attack declaration / resolution-time choices), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
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
function step(){const q=pc();if(!q)return false;
  const find=u=>q.candidates.find(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));
  if(q.max>1||q.min!==q.max){
    let ks=[];for(const u of PREFER){const c=find(u);if(c&&ks.indexOf(c.key)<0)ks.push(c.key);}
    ks=ks.slice(0,q.max);for(const c of q.candidates){if(ks.length>=q.min)break;if(ks.indexOf(c.key)<0)ks.push(c.key);}
    PREFER=PREFER.filter(u=>!find(u));answerChoiceV49(ks);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
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
function lp(p){return gameState.players[p].lp;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function castOpen(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);PREFER=[];}
function legalHand(name,p,i){const P=gameState.players[p],c=P.hand[i];return strictScriptLegalityV2(name,p,'hand',i,{cardOverride:c,logicalZone:'sz',prospectiveIndex:(P.sz||[]).length});}
function hitT(p,a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:findCardByUid(a.uid).index,target:t==='direct'?'direct':findCardByUid(t.uid).index});drive();}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function nextTurn(){toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();}
/* the cards in use respond in the chain windows (each at most once); the others pass */
const USED=new Set();
function windows(use,seen){seen=seen||[];USED.clear();
  for(let i=0;i<60;i++){ if(!toWindow())break;
    let did=false;
    for(const c of use){ const o=findCardByUid(c.uid); if(!o||USED.has(c.uid))continue; if(offered(o.p,c)){seen.push(c.uid);USED.add(c.uid);duelActivateResponseV2(o.p,o.zone,o.index);did=true;break;} }
    if(!did)chainPassV2(); }
  drive();return seen;}
/* player ap attacks; player rp responds at the first POINT matching want(payload) with the card at (zone,i) */
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(!step())break;}
  return done;}
/* captures the Choice requests (title, candidate names) for the position question and the resolution-time pools */
let CH=[];const __rq0=requestChoiceV49;requestChoiceV49=function(spec){CH.push({t:spec&&spec.title||'',names:(spec&&spec.candidates||[]).map(x=>x.card?cardName(x.card):(x.label||''))});return __rq0.apply(this,arguments);};
function posQ(){return CH.filter(c=>/表示形式/.test(c.t));}
function poolQ(re){return CH.filter(c=>re.test(c.t));}
function setf(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function lo(c){const hh=findCardByUid(c.uid);return hh?hh.p:-1;}

/* advance everything, declining every offer; true if card c (of its controller) was offered at an event group / chain window / point on the way */
function sawOffer(c,pre){
  if(pre)pre();
  let seen=false;
  for(let k=0;k<400;k++){
    if(step())continue;
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.some(x=>x.card===C(c)))seen=true;eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){const o=findCardByUid(c.uid);if(o&&offered(o.p,c))seen=true;chainPassV2();continue;}
    const w=gameState.processorWaiting;
    if(w&&w.type==='POINT'&&gameState.processorPaused){const o=findCardByUid(c.uid);if(o&&offered(o.p,c))seen=true;pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    break;}
  return seen;}
function attackOffer(ap,a,target,c){return sawOffer(c,()=>requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)}));}
/* player ap attacks; the card c is activated from the attack-declaration event group where it is offered; everything else passes */
function declareRespond(ap,a,target,c){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<400;k++){
    if(step())continue;
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];const j=g.findIndex(x=>x.card===C(c));
      if(!done&&j>=0){eventPickV2(j);done=true;continue;} eventSkipGroupV2();continue;}
    if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;
    if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    break;}
  return done;}

/* ===== A: エヴォルダー・ディプロドクス — Special Summoned by the effect of an 「エヴォルド」 monster: destroy 1 Spell/Trap of the opponent ===== */
function diploSetup(){
  fresh();
  const od=mk('エヴォルド・オドケリス',0),dp=mk('エヴォルダー・ディプロドクス',0),w=mk('ワイト',0);
  const t1=setf('強制脱出装置',1),t2=setf('サイクロン',1);
  gameState.players[0].hand=[od,dp,w];gameState.players[1].sz=[t1,t2];baselineA();
  return {od,dp,w,t1,t2};
}
/* A1: エヴォルド・オドケリス Normal Summoned → its effect Special Summons ディプロドクス from the hand → the forced trigger destroys the chosen Spell/Trap */
let a=diploSetup();CH=[];
PREFER=[a.dp.uid,a.t2.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('A1: ディプロドクス is Special Summoned from the hand by the effect of エヴォルド・オドケリス',z(a.dp)==='mz'&&C(a.dp).specialSummoned===true&&z(a.od)==='mz',JSON.stringify({dp:z(a.dp),od:z(a.od)}));
ok('A1: the Special Summon source of the 「エヴォルド」 is recorded on it (summonSrcS03)',!!C(a.dp).summonSrcS03&&C(a.dp).summonSrcS03.name==='エヴォルド・オドケリス',JSON.stringify(C(a.dp)&&C(a.dp).summonSrcS03));
const dq=poolQ(/破壊する相手の魔法・罠カード/)[0];
ok('A1: the target is chosen among the opponent\'s Spell/Trap cards (both Set cards offered)',!!dq&&dq.names.slice().sort().join()===['サイクロン','強制脱出装置'].sort().join(),JSON.stringify(dq));
ok('A1: the chosen サイクロン is destroyed, the other Set card stays',z(a.t2)==='grave'&&z(a.t1)==='sz',JSON.stringify({t1:z(a.t1),t2:z(a.t2)}));
audit('A1');
/* A2: the Field Zone counts too — a face-up Field Spell is the only target */
fresh();
let od2=mk('エヴォルド・オドケリス',0),dp2=mk('エヴォルダー・ディプロドクス',0),fs2=mk('海',1,'up');
gameState.players[0].hand=[od2,dp2];gameState.players[1].field=fs2;baselineA();
PREFER=[dp2.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('A2: the opponent\'s Field Spell is destroyed',z(dp2)==='mz'&&z(fs2)==='grave',JSON.stringify({dp:z(dp2),fs:z(fs2)}));
audit('A2');
/* A3 (negative): Special Summoned by a card that is not an 「エヴォルド」 (死者蘇生) — no destruction */
fresh();
let rv3=mk('死者蘇生',0),dp3=mk('エヴォルダー・ディプロドクス',0),t3=setf('強制脱出装置',1);
gameState.players[0].hand=[rv3];gameState.players[0].grave=[dp3];gameState.players[1].sz=[t3];baselineA();
cast(0,'死者蘇生',[dp3.uid]);
ok('A3: Special Summoned by 死者蘇生 — ディプロドクス is on the field but the opponent\'s Set card is not destroyed',z(dp3)==='mz'&&z(t3)==='sz',JSON.stringify({dp:z(dp3),t:z(t3)}));
audit('A3');
/* A4 (negative): the opponent has no Spell/Trap — it simply does nothing */
fresh();
let od4=mk('エヴォルド・オドケリス',0),dp4=mk('エヴォルダー・ディプロドクス',0);
gameState.players[0].hand=[od4,dp4];baselineA();
PREFER=[dp4.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('A4: the opponent controls no Spell/Trap — ディプロドクス is summoned and nothing else happens (no pending choice)',z(dp4)==='mz'&&!pc(),JSON.stringify({dp:z(dp4),pc:!!pc()}));
/* A5: Special Summoned by エヴォルド・ウェストロ's Flip effect from the Deck (a second 「エヴォルド」 path) */
fresh();gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
let we=mk('エヴォルド・ウェストロ',0,'down','def'),dp5=mk('エヴォルダー・ディプロドクス',0),t5=setf('強制脱出装置',1),at5=up('ワイト',1);
gameState.players[0].mz=[we];gameState.players[0].deck.push(dp5);gameState.players[1].sz=[t5];gameState.players[1].mz=[at5];baselineA();
PREFER=[dp5.uid,t5.uid];hitT(1,at5,we);PREFER=[];
ok('A5: エヴォルド・ウェストロ flipped by the attack — ディプロドクス Special Summoned from the Deck and the opponent\'s Set card destroyed',z(dp5)==='mz'&&z(t5)==='grave',JSON.stringify({dp:z(dp5),t:z(t5)}));
audit('A5');

/* ===== B: 反撃の毒牙 — the opponent attacks my face-up 「ヴェノム」: negate, end the Battle Phase, Venom Counter on the attacker ===== */
function venomSetup(venomFace){
  fresh();gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
  const v=mk('ヴェノム・コブラ',0,venomFace||'up','def'),o=up('ワイト',0),at=up('ジェネティック・ワーウルフ',1),at2=up('ワイト',1),tr=setT('反撃の毒牙',0);
  gameState.players[0].mz=[v,o];gameState.players[0].sz=[tr];gameState.players[1].mz=[at,at2];baselineA();
  return {v,o,at,at2,tr};
}
let b=venomSetup();
ok('B1: it is offered at the attack declaration against the 「ヴェノム」 monster (and stays Set when declined)',attackOffer(1,b.at,b.v,b.tr)===true&&z(b.tr)==='sz');
b=venomSetup();
const done=declareRespond(1,b.at,b.v,b.tr);drive();
ok('B1: activated — the attack is negated: the Venom monster is intact and its controller takes no damage',done&&z(b.v)==='mz'&&lp(0)===8000,JSON.stringify({done,v:z(b.v),lp0:lp(0)}));
ok('B1: the attacker gets exactly 1 Venom Counter',C(b.at).counters&&C(b.at).counters['ヴェノム']===1,JSON.stringify(C(b.at)&&C(b.at).counters));
ok('B1: the trap went to the Graveyard',z(b.tr)==='grave',z(b.tr));
ok('B1: the Battle Phase is over — the phase is no longer battle',gameState.phase!=='battle',gameState.phase);
hitT(1,b.at2,b.o);
ok('B1: the opponent\'s second monster cannot attack any more this turn',z(b.o)==='mz'&&lp(0)===8000&&C(b.at2).attacked!==true,JSON.stringify({o:z(b.o),lp0:lp(0)}));
audit('B1');
/* B2 (negative): the attack targets a non-ヴェノム monster */
b=venomSetup();
ok('B2: attack on ワイト (not a 「ヴェノム」) — not offered',attackOffer(1,b.at,b.o,b.tr)===false);
/* B3 (negative): a direct attack */
b=venomSetup();gameState.players[0].mz=[b.v];baselineA();
ok('B3: a direct attack — not offered',attackOffer(1,b.at,'direct',b.tr)===false);
/* B4 (negative): the 「ヴェノム」 monster is face-down (Defense) — it is not a face-up Venom monster */
b=venomSetup('down');
ok('B4: attack on a face-down monster — not offered',attackOffer(1,b.at,b.v,b.tr)===false);
/* B5: the same from the other side — player 0 attacks, the defender (player 1) owns the Venom monster and the trap */
fresh();gameState.phase='battle';
let v5=mk('ヴェノム・コブラ',1,'up','def'),a5=up('ジェネティック・ワーウルフ',0),tr5=setT('反撃の毒牙',1);
gameState.players[1].mz=[v5];gameState.players[1].sz=[tr5];gameState.players[0].mz=[a5];baselineA();
ok('B5: player 1 owns the attacked 「ヴェノム」 monster (player 0 attacks) — the trap of player 1 is offered, symmetric',attackOffer(0,a5,v5,tr5)===true);
/* B6: the counter is placed after the attack is negated — a Venom Counter lowers nothing by itself (no ヴェノム・スワンプ), the attacker stays on the field */
b=venomSetup();declareRespond(1,b.at,b.v,b.tr);drive();
ok('B6: the attacker is still on the field with its ATK unchanged (the counter alone changes no ATK)',z(b.at)==='mz'&&curATK(C(b.at))===dbOf(C(b.at)).atk,JSON.stringify({at:z(b.at),atk:curATK(C(b.at))}));

/* ===== C: 古代の機械爆弾 — destroy my face-up 「アンティーク・ギア」; half its original ATK as damage ===== */
function bombSetup(extra){
  fresh();
  const g=up('古代の機械兵士',0),w=up('ワイト',0),bomb=mk('古代の機械爆弾',0);
  gameState.players[0].mz=[g,w];gameState.players[0].hand=[bomb];if(extra)extra(g);baselineA();
  return {g,w,bomb};
}
let c=bombSetup();
PREFER=[c.g.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('C1: 古代の機械兵士 (ATK 1300) is destroyed',z(c.g)==='grave'&&z(c.w)==='mz'&&z(c.bomb)==='grave',JSON.stringify({g:z(c.g),w:z(c.w),b:z(c.bomb)}));
ok('C1: the opponent takes 650 (half of the original ATK)',lp(1)===7350&&lp(0)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
audit('C1');
/* C2: 「元々の攻撃力」 — a lowered current ATK (2 Venom Counters under ヴェノム・スワンプ: −1000) is not used */
fresh();
let g2=up('古代の機械兵士',0),sw2=mk('ヴェノム・スワンプ',0,'up'),bomb2=mk('古代の機械爆弾',0);
gameState.players[0].mz=[g2];gameState.players[0].field=sw2;gameState.players[0].hand=[bomb2];baselineA();
API.addCounter(findCardByUid(g2.uid),'ヴェノム',2);
ok('C2 setup: the current ATK is 300 (1300 − 1000), the original ATK is 1300',curATK(C(g2))===300&&dbOf(C(g2)).atk===1300,JSON.stringify({cur:curATK(C(g2))}));
PREFER=[g2.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('C2: the damage is half of the ORIGINAL ATK (650), not of the current 300',z(g2)==='grave'&&lp(1)===7350,JSON.stringify({g:z(g2),lp1:lp(1)}));
audit('C2');
/* C3: 古代の機械巨人 (ATK 3000) → 1500 */
fresh();
let g3=up('古代の機械巨人',0),bomb3=mk('古代の機械爆弾',0);
gameState.players[0].mz=[g3];gameState.players[0].hand=[bomb3];baselineA();
PREFER=[g3.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('C3: 古代の機械巨人 destroyed, the opponent takes 1500',z(g3)==='grave'&&lp(1)===6500,JSON.stringify({g:z(g3),lp1:lp(1)}));
/* C4 (negative): the only monsters are a non-「アンティーク・ギア」 and a face-down 「アンティーク・ギア」 — cannot be activated */
fresh();
let n4=up('ワイト',0),f4=mk('古代の機械兵士',0,'down','def'),bomb4=mk('古代の機械爆弾',0),og=up('古代の機械兵士',1);
gameState.players[0].mz=[n4,f4];gameState.players[1].mz=[og];gameState.players[0].hand=[bomb4];baselineA();
duelActivateFromHand(0);drive();
ok('C4: nothing happened — the Spell stays in the hand, nothing destroyed, no damage',z(bomb4)==='hand'&&z(n4)==='mz'&&lp(1)===8000,JSON.stringify({b:z(bomb4),n:z(n4),lp1:lp(1)}));
/* C5 (negative): the target leaves the field in response (強制脱出装置) — it is not destroyed and no damage is inflicted */
fresh();
let g5=up('古代の機械兵士',0),bomb5=mk('古代の機械爆弾',0),esc5=setT('強制脱出装置',1);
gameState.players[0].mz=[g5];gameState.players[0].hand=[bomb5];gameState.players[1].sz=[esc5];baselineA();
PREFER=[g5.uid];duelActivateFromHand(0);windows([esc5]);PREFER=[];
ok('C5: the target was returned to the hand in response — the Spell resolves to nothing: no destruction, no damage',z(g5)==='hand'&&z(esc5)==='grave'&&z(bomb5)==='grave'&&lp(1)===8000,JSON.stringify({g:z(g5),esc:z(esc5),lp1:lp(1)}));
audit('C5');

/* ===== D: 黒蠍団召集 — with a face-up 首領・ザルーグ: Special Summon 「黒蠍」 monsters from the hand (one per name) ===== */
function scSetup(opts){
  opts=opts||{};
  fresh();
  const zg=mk('首領・ザルーグ',0,opts.zargFace||'up'),sp=mk('黒蠍団召集',0);
  const m1=mk('黒蠍盗掘団',0),m1b=mk('黒蠍盗掘団',0),m2=mk('黒蠍－強力のゴーグ',0),m3=mk('黒蠍－棘のミーネ',0),m4=mk('黒蠍－罠はずしのクリフ',0),other=mk('ワイト',0);
  gameState.players[0].mz=[zg].concat(opts.fill||[]);gameState.players[0].hand=[sp,m1,m1b,m2,m3,other];
  if(opts.m4)gameState.players[0].hand.push(m4);
  if(opts.foeZarg)gameState.players[1].mz=[mk('首領・ザルーグ',1,'up')];
  baselineA();
  return {zg,sp,m1,m1b,m2,m3,m4,other};
}
let d=scSetup();CH=[];
PREFER=[d.m1.uid,d.m2.uid,d.m3.uid,'atk','def','atk'];duelActivateFromHand(0);drive();PREFER=[];
const sq=poolQ(/黒蠍団召集：特殊召喚する/)[0];
ok('D1: the pool offers one card per name (盗掘団 once, ゴーグ, ミーネ) — not ワイト',!!sq&&sq.names.slice().sort().join()===['黒蠍盗掘団','黒蠍－強力のゴーグ','黒蠍－棘のミーネ'].sort().join(),JSON.stringify(sq));
ok('D1: the three chosen 「黒蠍」 monsters are Special Summoned face-up',[d.m1,d.m2,d.m3].every(x=>z(x)==='mz'&&C(x).face==='up'),JSON.stringify([d.m1,d.m2,d.m3].map(x=>[z(x),C(x)&&C(x).face])));
ok('D1: the positions asked by the engine are applied (one Defense, two Attack)',[d.m1,d.m2,d.m3].map(x=>C(x).pos).sort().join()==='atk,atk,def'&&posQ().length===3,JSON.stringify({pos:[d.m1,d.m2,d.m3].map(x=>C(x).pos),q:posQ().length}));
ok('D1: the second 黒蠍盗掘団 (same name) and ワイト stay in the hand; the Spell is in the Graveyard',z(d.m1b)==='hand'&&z(d.other)==='hand'&&z(d.sp)==='grave',JSON.stringify({m1b:z(d.m1b),o:z(d.other),sp:z(d.sp)}));
audit('D1');
/* D2: the player may choose only some */
d=scSetup();PREFER=[d.m2.uid,'atk'];duelActivateFromHand(0);drive();PREFER=[];
ok('D2: only the chosen ゴーグ is summoned; the others remain in the hand',z(d.m2)==='mz'&&z(d.m1)==='hand'&&z(d.m3)==='hand',JSON.stringify({m2:z(d.m2),m1:z(d.m1),m3:z(d.m3)}));
audit('D2');
/* D3: choosing none is allowed */
d=scSetup();PREFER=[];duelActivateFromHand(0);drive();
ok('D3: summoning none is allowed — the Spell resolves, nothing is summoned',z(d.sp)==='grave'&&z(d.m1)==='hand'&&z(d.m2)==='hand'&&z(d.m3)==='hand'&&!pc(),JSON.stringify({sp:z(d.sp),m1:z(d.m1)}));
/* D4: limited by the free Monster Zones — 首領・ザルーグ + 3 other monsters leave one free zone */
d=scSetup({fill:[up('ワイト',0),up('ワイト',0),up('ワイト',0)]});CH=[];
PREFER=[d.m2.uid,d.m3.uid,'atk'];duelActivateFromHand(0);drive();PREFER=[];
const sq4=poolQ(/黒蠍団召集：特殊召喚する/)[0];
const n4s=[d.m1,d.m2,d.m3].filter(x=>z(x)==='mz').length;
ok('D4: one free Monster Zone — at most one 「黒蠍」 monster can be chosen and summoned',!!sq4&&/1枚まで/.test(sq4.t)&&n4s===1&&gameState.players[0].mz.length===5,JSON.stringify({n:n4s,mz:gameState.players[0].mz.length,t:sq4&&sq4.t}));
audit('D4');
/* D5 (negative): 首領・ザルーグ face-down — cannot be activated */
d=scSetup({zargFace:'down'});
duelActivateFromHand(0);drive();
ok('D5: 首領・ザルーグ is face-down — not activated, nothing summoned',z(d.sp)==='hand'&&z(d.m2)==='hand'&&!pc(),JSON.stringify({sp:z(d.sp),m2:z(d.m2)}));
/* D6 (negative): only the opponent controls 首領・ザルーグ */
d=scSetup({foeZarg:true});gameState.players[0].mz=[];baselineA();
duelActivateFromHand(0);drive();
ok('D6: 首領・ザルーグ only on the opponent\'s field — not activated',z(d.sp)==='hand'&&z(d.m2)==='hand'&&!pc(),JSON.stringify({sp:z(d.sp),m2:z(d.m2)}));
/* D7: no 「黒蠍」 monster in the hand — it resolves with nothing to summon */
fresh();
let zg7=mk('首領・ザルーグ',0),sp7=mk('黒蠍団召集',0),w7=mk('ワイト',0);
gameState.players[0].mz=[zg7];gameState.players[0].hand=[sp7,w7];baselineA();
duelActivateFromHand(0);drive();
ok('D7: 首領・ザルーグ is face-up, no 「黒蠍」 monster in the hand — activated, resolves doing nothing',z(sp7)==='grave'&&z(w7)==='hand'&&!pc(),JSON.stringify({sp:z(sp7),w:z(w7)}));

/* ===== E: 連鎖旋風 — a card on the field is destroyed by a card effect: destroy 2 Spell/Trap cards on the field ===== */
function chainSetup(){
  fresh();gameState.activePlayer=1;gameState.turn=6;
  const cy=setT('連鎖旋風',0),vic=up('ワイト',0),bolt=mk('サンダー・ボルト',1);
  const x1=setf('強制脱出装置',1),x2=setf('サイクロン',1),x3=setf('聖なるバリア －ミラーフォース－',0);
  gameState.players[0].sz=[cy,x3];gameState.players[0].mz=[vic];gameState.players[1].sz=[x1,x2];gameState.players[1].hand=[bolt];baselineA();
  return {cy,vic,bolt,x1,x2,x3};
}
/* E0: offered after the destruction; declined */
let e=chainSetup();
ok('E0: the opponent\'s サンダー・ボルト destroys ワイト — 連鎖旋風 is offered after the destruction (and stays Set when declined)',sawOffer(e.cy,()=>castOpen(1,'サンダー・ボルト'))===true&&z(e.vic)==='grave'&&z(e.cy)==='sz',JSON.stringify({vic:z(e.vic),cy:z(e.cy)}));
e=chainSetup();CH=[];
PREFER=[e.x1.uid,e.x3.uid];castOpen(1,'サンダー・ボルト');PREFER=[e.x1.uid,e.x3.uid];windows([e.cy]);PREFER=[];
const eq=poolQ(/連鎖旋風：破壊する/)[0];
ok('E1: the two targets are chosen among the Spell/Trap cards of both fields, not 連鎖旋風 itself',!!eq&&eq.names.length===3&&eq.names.indexOf('連鎖旋風')<0,JSON.stringify(eq));
ok('E1: the two chosen cards (one of each side) are destroyed; the third stays; 連鎖旋風 goes to the Graveyard',z(e.vic)==='grave'&&z(e.x1)==='grave'&&z(e.x3)==='grave'&&z(e.x2)==='sz'&&z(e.cy)==='grave',JSON.stringify({vic:z(e.vic),x1:z(e.x1),x2:z(e.x2),x3:z(e.x3),cy:z(e.cy)}));
audit('E1');
/* E2: destroyed by an Effect Monster's effect (サンダーエンド・ドラゴン) */
fresh();
let cy2=setT('連鎖旋風',1),vic2=up('ワイト',1),x21=setf('強制脱出装置',0),x22=setf('サイクロン',0);
const te=mk('サンダーエンド・ドラゴン',0,'up');te.xyz=[mk('ワイト',0)];te.summonedTurn=1;
gameState.players[0].mz=[te];gameState.players[0].sz=[x21,x22];gameState.players[1].mz=[vic2];gameState.players[1].sz=[cy2];baselineA();
PREFER=[x21.uid,x22.uid];duelActivateFromZone(0,'mz',0);PREFER=[x21.uid,x22.uid];windows([cy2]);PREFER=[];
ok('E2: a monster effect destroyed ワイト — 連鎖旋風 destroys the two chosen Set cards of the other player',z(vic2)==='grave'&&z(x21)==='grave'&&z(x22)==='grave'&&z(cy2)==='grave',JSON.stringify({vic:z(vic2),x21:z(x21),x22:z(x22),cy2:z(cy2)}));
audit('E2');
/* E3 (negative): destruction by battle is not an effect destruction */
fresh();gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
let cy3=setT('連鎖旋風',0),vic3=up('ワイト',0),at3=up('ジェネティック・ワーウルフ',1),y31=setf('強制脱出装置',1),y32=setf('サイクロン',1);
gameState.players[0].sz=[cy3];gameState.players[0].mz=[vic3];gameState.players[1].mz=[at3];gameState.players[1].sz=[y31,y32];baselineA();
ok('E3: ワイト destroyed by battle — 連鎖旋風 is not offered',sawOffer(cy3,()=>requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(at3),target:idx(vic3)}))===false&&z(vic3)==='grave'&&z(cy3)==='sz',JSON.stringify({vic:z(vic3),cy:z(cy3)}));
/* E4 (negative): fewer than 2 other Spell/Trap cards on the field (itself does not count) */
fresh();gameState.activePlayer=1;gameState.turn=6;
let cy4=setT('連鎖旋風',0),vic4=up('ワイト',0),bolt4=mk('サンダー・ボルト',1),z4=setf('強制脱出装置',1);
gameState.players[0].sz=[cy4];gameState.players[0].mz=[vic4];gameState.players[1].sz=[z4];gameState.players[1].hand=[bolt4];baselineA();
ok('E4: only one other Spell/Trap on the field — 連鎖旋風 is not offered',sawOffer(cy4,()=>castOpen(1,'サンダー・ボルト'))===false&&z(vic4)==='grave'&&z(cy4)==='sz',JSON.stringify({vic:z(vic4),cy:z(cy4)}));

/* ===== F: シャーク・ザ・クルー — destroyed by the opponent's card effect: Special Summon up to 2 WATER Lv4 or lower from the Deck ===== */
function sharkSetup(fill){
  fresh();gameState.activePlayer=1;gameState.turn=6;
  const sh=up('シャーク・ザ・クルー',0),bolt=mk('サンダー・ボルト',1);
  const w1=mk('ひょうすべ',0),w2=mk('アクア・スネーク',0),w3=mk('アンモ・ナイト',0),big=mk('3万年の白亀',0),fire=mk('ギガテック・ウルフ',0);
  gameState.players[0].mz=[sh].concat(fill||[]);gameState.players[0].deck=[w1,w2,w3,big,fire,mk('ワイト',0),mk('ワイト',0)];gameState.players[1].hand=[bolt];baselineA();
  return {sh,bolt,w1,w2,w3,big,fire};
}
let f=sharkSetup();CH=[];
cast(1,'サンダー・ボルト',[f.w1.uid,f.w3.uid,'def','atk']);
const fq=poolQ(/シャーク・ザ・クルー：特殊召喚する/)[0];
ok('F1: サンダー・ボルト of the opponent destroys it — the Deck pool is only the three WATER Lv4-or-lower monsters (not Lv5 WATER, not FIRE)',z(f.sh)==='grave'&&!!fq&&fq.names.slice().sort().join()===['ひょうすべ','アクア・スネーク','アンモ・ナイト'].sort().join(),JSON.stringify({sh:z(f.sh),fq}));
ok('F1: the two chosen monsters are Special Summoned face-up from the Deck, the others stay',z(f.w1)==='mz'&&z(f.w3)==='mz'&&C(f.w1).face==='up'&&z(f.w2)==='deck'&&z(f.big)==='deck'&&z(f.fire)==='deck',JSON.stringify([f.w1,f.w3,f.w2,f.big,f.fire].map(z)));
ok('F1: the positions asked by the engine are applied (one Defense, one Attack)',[f.w1,f.w3].map(x=>C(x).pos).sort().join()==='atk,def'&&posQ().length===2,JSON.stringify({pos:[f.w1,f.w3].map(x=>C(x).pos),q:posQ().length}));
audit('F1');
/* F2: up to 2 — choosing only 1 is allowed */
f=sharkSetup();cast(1,'サンダー・ボルト',[f.w2.uid,'atk']);
ok('F2: only one monster chosen — only it is summoned',z(f.w2)==='mz'&&z(f.w1)==='deck'&&z(f.w3)==='deck',JSON.stringify([f.w2,f.w1,f.w3].map(z)));
/* F3: limited by the free Monster Zones — 4 other monsters (all stronger): the opponent's 地割れ destroys only the lowest-ATK monster, so one zone is free */
fresh();gameState.activePlayer=1;gameState.turn=6;
let sh3=up('シャーク・ザ・クルー',0),ot3=[1,2,3,4].map(()=>up('ジェネティック・ワーウルフ',0)),q1=mk('ひょうすべ',0),q2=mk('アクア・スネーク',0);
gameState.players[0].mz=[sh3].concat(ot3);gameState.players[0].deck=[q1,q2,mk('ワイト',0)];gameState.players[1].hand=[mk('地割れ',1)];baselineA();CH=[];
cast(1,'地割れ',[q1.uid,q2.uid,'atk']);
const fq3=poolQ(/シャーク・ザ・クルー：特殊召喚する/)[0];
ok('F3: one free Monster Zone — at most one monster can be chosen and summoned',z(sh3)==='grave'&&!!fq3&&/1体まで/.test(fq3.t)&&[q1,q2].filter(x=>z(x)==='mz').length===1&&gameState.players[0].mz.length===5,JSON.stringify({sh:z(sh3),t:fq3&&fq3.t,mz:gameState.players[0].mz.length}));
audit('F3');
/* F4 (negative): destroyed in battle — no effect */
fresh();gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
let sh4=up('シャーク・ザ・クルー',0),at4=up('アビス・ソルジャー',1),dw4=mk('ひょうすべ',0);
gameState.players[0].mz=[sh4];gameState.players[0].deck=[dw4,mk('ワイト',0)];gameState.players[1].mz=[at4];baselineA();
CH=[];hitT(1,at4,sh4);
ok('F4: destroyed in battle (ATK 1800 each: both destroyed) — it goes to the Graveyard and no Deck monster is summoned',z(sh4)==='grave'&&z(dw4)==='deck'&&!poolQ(/シャーク・ザ・クルー：特殊召喚する/).length,JSON.stringify({sh:z(sh4),dw:z(dw4)}));
/* F5 (negative): destroyed by its own controller's effect (ブラック・ホール) */
fresh();
let sh5=up('シャーク・ザ・クルー',0),bh5=mk('ブラック・ホール',0),dw5=mk('ひょうすべ',0);
gameState.players[0].mz=[sh5];gameState.players[0].hand=[bh5];gameState.players[0].deck=[dw5,mk('ワイト',0)];baselineA();CH=[];
cast(0,'ブラック・ホール');
ok('F5: destroyed by its controller\'s own ブラック・ホール — no effect',z(sh5)==='grave'&&z(dw5)==='deck'&&!poolQ(/シャーク・ザ・クルー：特殊召喚する/).length,JSON.stringify({sh:z(sh5),dw:z(dw5)}));
/* F6 (negative): destroyed while face-down (a face-down monster applies no effect) */
fresh();gameState.activePlayer=1;gameState.turn=6;
let sh6=mk('シャーク・ザ・クルー',0,'down','def'),bolt6=mk('サンダー・ボルト',1),dw6=mk('ひょうすべ',0);
gameState.players[0].mz=[sh6];gameState.players[0].deck=[dw6,mk('ワイト',0)];gameState.players[1].hand=[bolt6];baselineA();CH=[];
cast(1,'サンダー・ボルト');
ok('F6: destroyed face-down — no effect',z(sh6)==='grave'&&z(dw6)==='deck'&&!poolQ(/シャーク・ザ・クルー：特殊召喚する/).length,JSON.stringify({sh:z(sh6),dw:z(dw6)}));
`);
