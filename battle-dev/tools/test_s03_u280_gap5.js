/* S03-U280: ENGINE_GAP re-check 5 — 深海の戦士, 砲弾ヤリ貝, 魚雷魚 (immune to Spell effects while 「海」 is on the field), キャトルミューティレーション, ライバル登場!, 魂の氷結 (2011 texts).
   Real DUEL paths (activation / chain windows / resolution-time choices / phase changes), Replay-audited. */
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

/* ===== A: 深海の戦士 / 砲弾ヤリ貝 / 魚雷魚 — unaffected by Spell card effects while 「海」 is on the field ===== */
function seaSetup(withSea,seaFace){
  fresh();gameState.activePlayer=1;gameState.turn=6;gameState.phase='main1';
  const w=up('深海の戦士',0),h=up('砲弾ヤリ貝',0),t=up('魚雷魚',0),n=up('ワイト',0);
  gameState.players[0].mz=[w,h,t,n];
  if(withSea) gameState.players[0].field=mk('海',0,seaFace||'up');
  gameState.players[1].hand=[mk('サンダー・ボルト',1)];
  baselineA();return {w,h,t,n};
}
/* A1: 海 face-up on the opponent's field (either side counts) — サンダー・ボルト destroys only the ワイト */
let s=seaSetup(true);gameState.players[0].field=null;gameState.players[1].field=mk('海',1,'up');ensureAllCardUids(gameState);baselineA();
cast(1,'サンダー・ボルト');
ok('A1: 海 on the OPPONENT side — サンダー・ボルト destroys ワイト but none of the three sea monsters',z(s.n)==='grave'&&z(s.w)==='mz'&&z(s.h)==='mz'&&z(s.t)==='mz',JSON.stringify({n:z(s.n),w:z(s.w),h:z(s.h),t:z(s.t)}));
audit('A1');
/* A2: 海 on the controller's own side */
s=seaSetup(true);cast(1,'サンダー・ボルト');
ok('A2: 海 on the own side — the three survive サンダー・ボルト, ワイト is destroyed',z(s.n)==='grave'&&z(s.w)==='mz'&&z(s.h)==='mz'&&z(s.t)==='mz',JSON.stringify({n:z(s.n),w:z(s.w),h:z(s.h),t:z(s.t)}));
audit('A2');
/* A3 (negative): no 海 — all four are destroyed */
s=seaSetup(false);cast(1,'サンダー・ボルト');
ok('A3: without 海 — サンダー・ボルト destroys all four monsters',[s.w,s.h,s.t,s.n].every(c=>z(c)==='grave'),JSON.stringify([s.w,s.h,s.t,s.n].map(z)));
/* A4 (negative): a face-down 海 (Set Field Spell) does not count */
s=seaSetup(true,'down');cast(1,'サンダー・ボルト');
ok('A4: a face-down 海 does not protect — all four are destroyed',[s.w,s.h,s.t,s.n].every(c=>z(c)==='grave'),JSON.stringify([s.w,s.h,s.t,s.n].map(z)));
/* A5: a card treated as 「海」 counts */
s=seaSetup(false);gameState.players[0].field=mk('暗黒界の門',0,'up');ensureAllCardUids(gameState);baselineA();
API.setCardName(locateCardAnyV4(gameState.players[0].field),'海','endPhase','test');
ok('A5 setup: the Field Spell is treated as 海',cardName(gameState.players[0].field)==='暗黒界の門'&&currentNameV17(gameState.players[0].field)==='海');
cast(1,'サンダー・ボルト');
ok('A5: a card treated as 海 is a 海 — the sea monsters survive',z(s.n)==='grave'&&z(s.w)==='mz'&&z(s.h)==='mz'&&z(s.t)==='mz',JSON.stringify({n:z(s.n),w:z(s.w),h:z(s.h),t:z(s.t)}));
audit('A5');
/* A6: it ends when 海 leaves the field */
s=seaSetup(true);gameState.players[0].field=null;ensureAllCardUids(gameState);
cast(1,'サンダー・ボルト');
ok('A6: once 海 is gone the monsters are affected again',[s.w,s.h,s.t].every(c=>z(c)==='grave'),JSON.stringify([s.w,s.h,s.t].map(z)));

/* B: continuous Spell effects — 海's own ATK/DEF changes do not apply to a sea monster; they still apply to other monsters */
fresh();
const tp=up('魚雷魚',0),ya=up('砲弾ヤリ貝',0),sw=up('深海の戦士',0),fish=up('魚ギョ戦士',0);
gameState.players[0].mz=[tp,ya,sw,fish];baselineA();
const base0=[curATK(tp),curATK(ya),curATK(sw),curATK(fish)];
ok('B setup: no 海 yet — 魚雷魚 1000, 砲弾ヤリ貝 1000, 深海の戦士 1600, 魚ギョ戦士 1250',JSON.stringify(base0)==='[1000,1000,1600,1250]',JSON.stringify(base0));
gameState.players[1].field=mk('海',1,'up');ensureAllCardUids(gameState);
ok('B1: with 海 the other Fish gets +200/+200',curATK(fish)===1450&&curDEF(fish)===dbOf(fish).def+200,JSON.stringify([curATK(fish),curDEF(fish)]));
ok('B2: 魚雷魚 (Fish) does NOT get 海\'s +200',curATK(tp)===1000&&curDEF(tp)===1000,JSON.stringify([curATK(tp),curDEF(tp)]));
ok('B3: 砲弾ヤリ貝 (Aqua) does NOT get 海\'s +200',curATK(ya)===1000&&curDEF(ya)===1000,JSON.stringify([curATK(ya),curDEF(ya)]));
ok('B4: 深海の戦士 stays at 1600',curATK(sw)===1600,String(curATK(sw)));

/* C: Trap and monster effects still apply to them */
/* C1: 強制脱出装置 (Trap) returns a targeted sea monster to the hand */
fresh();gameState.activePlayer=1;gameState.turn=6;
let tc=up('魚雷魚',0);gameState.players[0].mz=[tc];gameState.players[0].field=mk('海',0,'up');
let esc=setf('強制脱出装置',1);gameState.players[1].sz=[esc];baselineA();
duelActivateFromZone(1,'sz',0);drive();
ok('C1: a Trap effect (強制脱出装置) still affects 魚雷魚 under 海 — it is returned to the hand',z(tc)==='hand'&&z(esc)==='grave',JSON.stringify({tc:z(tc),esc:z(esc)}));
audit('C1');
/* C2: a monster effect (サンダーエンド・ドラゴン) still destroys it */
fresh();
let ss=up('深海の戦士',1);gameState.players[1].mz=[ss];gameState.players[1].field=mk('海',1,'up');
const te=mk('サンダーエンド・ドラゴン',0,'up');te.xyz=[mk('ワイト',0)];te.summonedTurn=1;gameState.players[0].mz=[te];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('C2: a monster effect still destroys 深海の戦士 under 海',z(ss)==='grave',JSON.stringify({ss:z(ss)}));
audit('C2');

/* D: キャトルミューティレーション */
function catSetup(){
  fresh();
  const panda=up('キラーパンダ',0),wil=mk('ウィルミー',0,'down'),rat=mk('イビル・ラット',0,'down'),wt=mk('ワイト',0,'down');
  const trap=setf('キャトルミューティレーション',0);
  gameState.players[0].mz=[panda];gameState.players[0].sz=[trap];gameState.players[0].hand=[wil,rat,wt];
  baselineA();return {panda,wil,rat,wt,trap};
}
/* D1: return the Beast, then Special Summon a same-Level Beast from the hand */
let c=catSetup();CH=[];
PREFER=[c.panda.uid,c.wil.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('D1: キラーパンダ (Lv4) returned to the hand, ウィルミー (Lv4) Special Summoned face-up',z(c.panda)==='hand'&&z(c.wil)==='mz'&&C(c.wil).face==='up'&&z(c.trap)==='grave',JSON.stringify({p:z(c.panda),w:z(c.wil),t:z(c.trap)}));
const pq=poolQ(/特殊召喚するレベル4/)[0];
ok('D1: the hand pool holds only Lv4 Beasts (ウィルミー and the returned キラーパンダ) — not Lv3 イビル・ラット or ワイト',!!pq&&pq.names.slice().sort().join()===['ウィルミー','キラーパンダ'].sort().join(),JSON.stringify(pq));
ok('D1: the position question is asked by the engine (once)',posQ().length===1&&C(c.wil).pos==='atk',JSON.stringify(posQ()));
ok('D1: the other hand cards stay in the hand',z(c.rat)==='hand'&&z(c.wt)==='hand');
audit('D1');
/* D2: the returned card itself may be chosen */
c=catSetup();PREFER=[c.panda.uid,c.panda.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('D2: choosing the returned キラーパンダ itself — it is Special Summoned back from the hand',z(c.panda)==='mz'&&C(c.panda).face==='up'&&z(c.wil)==='hand'&&z(c.trap)==='grave',JSON.stringify({p:z(c.panda),w:z(c.wil)}));
audit('D2');
/* D3: the Special Summon position can be chosen (Defense) */
c=catSetup();PREFER=[c.panda.uid,c.wil.uid,'def'];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('D3: the summoning player answers the position question — Defense',z(c.wil)==='mz'&&C(c.wil).pos==='def'&&C(c.wil).face==='up',JSON.stringify({w:z(c.wil),pos:C(c.wil)&&C(c.wil).pos}));
/* D4: the Level is taken from the returned monster: a Lv3 Beast returned → the Lv3 hand Beast, not the Lv4 one */
fresh();
let rt=up('イビル・ラット',0),w4=mk('ウィルミー',0,'down'),r4=mk('イビル・ラット',0,'down'),tr4=setf('キャトルミューティレーション',0);
gameState.players[0].mz=[rt];gameState.players[0].sz=[tr4];gameState.players[0].hand=[w4,r4];baselineA();CH=[];
PREFER=[rt.uid,r4.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
const pq4=poolQ(/特殊召喚するレベル3/)[0];
ok('D4: Lv3 Beast returned — the pool is the Lv3 Beasts only (the two イビル・ラット)',!!pq4&&pq4.names.join()==='イビル・ラット,イビル・ラット',JSON.stringify(pq4));
ok('D4: the other イビル・ラット is Special Summoned, ウィルミー stays in the hand',z(r4)==='mz'&&z(rt)==='hand'&&z(w4)==='hand',JSON.stringify({r4:z(r4),rt:z(rt),w4:z(w4)}));
/* D5 (negative): no face-up Beast on the own field — cannot be activated */
fresh();
let fd=mk('キラーパンダ',0,'down'),nb=up('ワイト',0),ob=up('キラーパンダ',1),tr5=setf('キャトルミューティレーション',0);
gameState.players[0].mz=[fd,nb];gameState.players[1].mz=[ob];gameState.players[0].sz=[tr5];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('D5: only a face-down Beast, a non-Beast and the opponent\'s Beast — it is not activated',z(tr5)==='sz'&&C(tr5).face==='down'&&z(fd)==='mz'&&!pc(),JSON.stringify({t:z(tr5),face:C(tr5)&&C(tr5).face}));
/* D6: two face-up Beasts — the choice is made at resolution among them; only the chosen one returns */
fresh();
let b1=up('キラーパンダ',0),b2=up('ウィルミー',0),hw=mk('ウィルミー',0,'down'),tr6=setf('キャトルミューティレーション',0);
gameState.players[0].mz=[b1,b2];gameState.players[0].sz=[tr6];gameState.players[0].hand=[hw];baselineA();CH=[];
PREFER=[b2.uid,hw.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
const rq=poolQ(/手札に戻す獣族/)[0];
ok('D6: the returned Beast is chosen at resolution among both face-up Beasts',!!rq&&rq.names.slice().sort().join()===['キラーパンダ','ウィルミー'].sort().join(),JSON.stringify(rq));
ok('D6: the chosen ウィルミー returned, the other stays; the hand ウィルミー is summoned',z(b1)==='mz'&&z(b2)==='hand'&&z(hw)==='mz',JSON.stringify({b1:z(b1),b2:z(b2),hw:z(hw)}));
audit('D6');
/* D7: the opponent's turn — the opponent's own Beasts, and the summon goes to the activator's field */
fresh();gameState.activePlayer=0;
let pb=up('キラーパンダ',1),pw=mk('ウィルミー',1,'down'),tr7=setf('キャトルミューティレーション',1);
gameState.players[1].mz=[pb];gameState.players[1].sz=[tr7];gameState.players[1].hand=[pw];baselineA();
PREFER=[pb.uid,pw.uid];duelActivateFromZone(1,'sz',0);drive();PREFER=[];
ok('D7: activated by player 1 — their ウィルミー is Special Summoned to their own field',z(pw)==='mz'&&lo(pw)===1&&z(pb)==='hand',JSON.stringify({pw:z(pw),p:lo(pw),pb:z(pb)}));

/* E: ライバル登場! */
function rivSetup(){
  fresh();
  const tg=up('アックス・レイダー',1),other=up('ワイト',1),wil=mk('ウィルミー',0,'down'),rat=mk('イビル・ラット',0,'down');
  const trap=setf('ライバル登場!',0);
  gameState.players[1].mz=[tg,other];gameState.players[0].sz=[trap];gameState.players[0].hand=[wil,rat];baselineA();return {tg,other,wil,rat,trap};
}
let r=rivSetup();CH=[];
ok('E0 setup: アックス・レイダー is Lv4',curLV(r.tg)===4,String(curLV(r.tg)));
PREFER=[r.tg.uid,r.wil.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
const tq=poolQ(/相手の表側表示モンスター/)[0];
ok('E1: the target is chosen at activation among the opponent\'s face-up monsters',!!tq&&tq.names.slice().sort().join()===['アックス・レイダー','ワイト'].sort().join(),JSON.stringify(tq));
const rp=poolQ(/特殊召喚するレベル4/)[0];
ok('E1: the same-Level hand pool is the Lv4 monsters only (ウィルミー), not Lv3 イビル・ラット',!!rp&&rp.names.join()==='ウィルミー',JSON.stringify(rp));
ok('E1: ウィルミー is Special Summoned face-up to the activator\'s field; the target stays; イビル・ラット stays in hand',z(r.wil)==='mz'&&lo(r.wil)===0&&C(r.wil).face==='up'&&z(r.tg)==='mz'&&z(r.rat)==='hand'&&z(r.trap)==='grave',JSON.stringify({w:z(r.wil),t:z(r.tg),rat:z(r.rat)}));
ok('E1: the position question is asked by the engine',posQ().length===1,JSON.stringify(posQ()));
audit('E1');
/* E2: the other target (ワイト Lv1) — no Lv1 monster in hand: nothing is summoned and the Trap is still used up */
r=rivSetup();CH=[];PREFER=[r.other.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('E2: target Lv1 with no Lv1 monster in the hand — nothing is Special Summoned, no hand choice is opened',z(r.wil)==='hand'&&z(r.rat)==='hand'&&z(r.trap)==='grave'&&poolQ(/特殊召喚するレベル/).length===0&&!pc(),JSON.stringify({w:z(r.wil),rat:z(r.rat),t:z(r.trap)}));
/* E3 (negative): only a face-down opposing monster — not activatable */
r=rivSetup();gameState.players[1].mz=[mk('アックス・レイダー',1,'down')];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('E3: the opponent has only a face-down monster — ライバル登場! is not activated',z(r.trap)==='sz'&&C(r.trap).face==='down'&&!pc(),JSON.stringify({t:z(r.trap)}));
/* E4 (negative): own Monster Zones full — not activatable */
r=rivSetup();gameState.players[0].mz=Array.from({length:5},()=>up('ワイト',0));baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('E4: no free Monster Zone — ライバル登場! is not activated',z(r.trap)==='sz'&&C(r.trap).face==='down'&&!pc());
/* E5: the target is turned face-down in response (月の書) — it is no longer a face-up monster: nothing is summoned */
r=rivSetup();const moon=setf('月の書',1);gameState.players[1].sz=[moon];baselineA();
PREFER=[r.tg.uid];duelActivateFromZone(0,'sz',0);
ok('E5 setup: the opponent can respond with 月の書',toWindow()&&offered(1,moon),'');
PREFER=[r.tg.uid];windows([moon]);PREFER=[];
ok('E5: the target was turned face-down — ライバル登場! summons nothing',C(r.tg).face==='down'&&z(r.wil)==='hand'&&z(r.rat)==='hand'&&z(r.trap)==='grave',JSON.stringify({face:C(r.tg)&&C(r.tg).face,w:z(r.wil),t:z(r.trap)}));
audit('E5');
/* E6: the Level is read at resolution (current Level): the target's Level is raised to 5 in the chain — the Lv4 monster is no longer matching */
r=rivSetup();const lv5=mk('ワイト',0,'down');gameState.players[0].hand.push(lv5);baselineA();
PREFER=[r.tg.uid];duelActivateFromZone(0,'sz',0);toWindow();
API.setLevel(locateCardAnyV4(r.tg),3,'endPhase','test');
ok('E6 setup: the target\'s current Level is now 3',curLV(r.tg)===3,String(curLV(r.tg)));
CH=[];PREFER=[r.rat.uid];windows([]);PREFER=[];
const lp6=poolQ(/特殊召喚するレベル/)[0];
ok('E6: resolution uses the target\'s current Level 3 — イビル・ラット (Lv3) is summoned, ウィルミー (Lv4) is not',!!lp6&&lp6.names.join()==='イビル・ラット'&&z(r.rat)==='mz'&&z(r.wil)==='hand',JSON.stringify({pool:lp6,rat:z(r.rat),w:z(r.wil)}));
audit('E6');
/* E7: activated by player 1 in their own turn against player 0's monster */
fresh();gameState.activePlayer=1;gameState.turn=6;
let tg7=up('アックス・レイダー',0),wil7=mk('ウィルミー',1,'down'),tr7b=setf('ライバル登場!',1);
gameState.players[0].mz=[tg7];gameState.players[1].sz=[tr7b];gameState.players[1].hand=[wil7];baselineA();
PREFER=[tg7.uid,wil7.uid];duelActivateFromZone(1,'sz',0);drive();PREFER=[];
ok('E7: player 1 targets player 0\'s monster and Special Summons from their own hand to their own field',z(wil7)==='mz'&&lo(wil7)===1&&z(tg7)==='mz'&&lo(tg7)===0,JSON.stringify({w:z(wil7),p:lo(wil7)}));

/* F: 魂の氷結 */
function iceSetup(lp0,lp1){
  fresh();
  const trap=setf('魂の氷結',0);gameState.players[0].sz=[trap];
  gameState.players[0].mz=[up('ワイト',0)];gameState.players[1].mz=[up('ワイト',1)];
  gameState.players[0].lp=lp0;gameState.players[1].lp=lp1;baselineA();return trap;
}
/* F1 (negative): 1999 less — not activatable */
let it=iceSetup(6001,8000);duelActivateFromZone(0,'sz',0);drive();
ok('F1: 1999 LP less (6001 vs 8000) — 魂の氷結 cannot be activated',z(it)==='sz'&&C(it).face==='down',JSON.stringify({t:z(it)}));
/* F2 (negative): more LP than the opponent */
it=iceSetup(8000,3000);duelActivateFromZone(0,'sz',0);drive();
ok('F2: own LP higher — cannot be activated',z(it)==='sz'&&C(it).face==='down');
/* F3: exactly 2000 less — activated in the own turn: the opponent's next Battle Phase is skipped, the own one is not */
it=iceSetup(6000,8000);duelActivateFromZone(0,'sz',0);drive();
ok('F3: exactly 2000 less — activated and resolved (to the GY)',z(it)==='grave',JSON.stringify({t:z(it)}));
toPhase('battle');
ok('F3: the activator\'s own Battle Phase is not skipped',gameState.phase==='battle',gameState.phase);
nextTurn();
ok('F3 setup: the opponent\'s turn',gameState.activePlayer===1,String(gameState.activePlayer));
toPhase('main1');toPhase('battle');
ok('F3: the opponent\'s next Battle Phase is skipped — straight to Main Phase 2',gameState.phase==='main2',gameState.phase);
audit('F3');
nextTurn();nextTurn();
toPhase('battle');
ok('F3: two turns later the opponent\'s Battle Phase is back to normal',gameState.activePlayer===1&&gameState.phase==='battle',JSON.stringify({ap:gameState.activePlayer,ph:gameState.phase}));
/* F4: responded to a Spell in the opponent's Main Phase 1 — that turn's Battle Phase is the one skipped, and the one after is not */
fresh();gameState.activePlayer=1;gameState.turn=6;
it=setf('魂の氷結',0);let fb=mk('ファイヤー・ボール',1),sac=up('ワイト',1),cs=up('キャノン・ソルジャー',1);
gameState.players[0].sz=[it];gameState.players[0].lp=2500;gameState.players[1].lp=8000;gameState.players[1].hand=[fb];gameState.players[1].mz=[cs,sac];baselineA();
castOpen(1,'ファイヤー・ボール');
ok('F4 setup: 魂の氷結 is offered in the chain window of the opponent\'s Spell (LP 2500 vs 8000)',toWindow()&&offered(0,it),'');
windows([it]);
ok('F4: it resolved',z(it)==='grave',z(it));
toPhase('battle');
ok('F4: the opponent\'s Battle Phase of THIS turn is skipped (Main Phase 2)',gameState.activePlayer===1&&gameState.phase==='main2',JSON.stringify({ap:gameState.activePlayer,ph:gameState.phase}));
audit('F4');
nextTurn();nextTurn();
toPhase('battle');
ok('F4: the opponent\'s following turn Battle Phase is normal',gameState.activePlayer===1&&gameState.phase==='battle',JSON.stringify({ap:gameState.activePlayer,ph:gameState.phase}));
/* F5: activated during the opponent's Battle Phase (attack declaration) — that Battle Phase goes on, the NEXT one is skipped */
fresh();gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
it=setf('魂の氷結',0);let a5=up('ワイト',1),d5=up('ワイト',0);
gameState.players[0].sz=[it];gameState.players[0].mz=[d5];gameState.players[1].mz=[a5];gameState.players[0].lp=3000;gameState.players[1].lp=8000;baselineA();
const did5=attackRespond(1,a5,d5,0,()=>true,'sz',0);drive();
ok('F5: 魂の氷結 activated at the attack declaration of the opponent',did5&&z(it)==='grave',JSON.stringify({did5,t:z(it)}));
ok('F5: the current Battle Phase is not skipped (the battle took place)',gameState.phase==='battle'&&z(a5)==='grave'&&z(d5)==='grave',JSON.stringify({ph:gameState.phase,a5:z(a5),d5:z(d5)}));
nextTurn();nextTurn();
toPhase('main1');toPhase('battle');
ok('F5: the opponent\'s NEXT turn Battle Phase is skipped',gameState.activePlayer===1&&gameState.phase==='main2',JSON.stringify({ap:gameState.activePlayer,ph:gameState.phase}));
audit('F5');
`);
