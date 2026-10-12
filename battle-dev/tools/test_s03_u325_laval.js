/* S03-U325: ラヴァル — ロード・ジャッジメント, グレイター, ステライド, ツインスレイヤー, 炎湖畔の淑女, ラヴァルバル・ドラゴン (engine: destroy substitute kind banishGrave, engine/1ZV). Real DUEL paths (Synchro Summons, battles, chain windows, the substitute prompt), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3250001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function doSynchro(mats){const P=gameState.players[0];doExSummon(0,0,mats.map(m=>P.mz.indexOf(m)),'synchro','atk');drive();}
function canZ(zone,c){return getLegalZoneActions(0,zone,idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(zone,c){duelActivateFromZone(0,zone,idx(c));drive();}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function toWindow(){for(let i=0;i<200;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
const USED=new Set();
function windows(use,seen){seen=seen||[];USED.clear();
  for(let i=0;i<60;i++){ if(!toWindow())break;
    let did=false;
    for(const c of use){ const o=findCardByUid(c.uid); if(!o||USED.has(c.uid))continue; if(offered(o.p,c)){seen.push(c.uid);USED.add(c.uid);duelActivateResponseV2(o.p,o.zone,o.index);did=true;break;} }
    if(!did)chainPassV2(); }
  drive();return seen;}
const TUN='ラヴァル炎湖畔の淑女',F2='スティング',F3='死神ブーメラン',F4='ギガテック・ウルフ';
const LW='ラヴァル・ウォリアー',LG='ラヴァル・ガンナー',LC='ラヴァル・キャノン';

/* ===== ロード・ジャッジメント ===== */
{ fresh();const jd=mon('ラヴァルロード・ジャッジメント',0),lw=mk(LW,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[jd];gameState.players[0].grave=[lw];gameState.players[1].mz=[f];baselineA();
  ok('ジャッジメント: available with a 「ラヴァル」 in the Graveyard',canZ('mz',jd)===true,'');
  const l1=lp(1);actZ('mz',jd);
  ok('ジャッジメント: banished 「ラヴァル」, 1000 damage to the opponent',z(lw)==='banish'&&l1-lp(1)===1000,JSON.stringify({lw:z(lw),loss:l1-lp(1)}));
  ok('ジャッジメント: once per turn, and it cannot declare an attack this turn',canZ('mz',jd)===false&&cannotAttackNow(C(jd))===true,'');
  audit('ジャッジメント'); }
{ fresh();const jd=mon('ラヴァルロード・ジャッジメント',0);gameState.players[0].mz=[jd];gameState.players[0].grave=[mk('ワイト',0)];baselineA();
  ok('ジャッジメント negative: no 「ラヴァル」 in the Graveyard → not available',canZ('mz',jd)===false,''); }

/* ===== グレイター ===== */
function graterField(withBh){fresh();const t=mon(TUN,0),m=mon(F3,0),gr=mk('ラヴァル・グレイター',0),h1=mk('サイクロン',0),h2=mk('強欲な壺',0),lw=mk(LW,0),bh=mk('ブラック・ホール',0);
  gameState.players[0].ex=[gr];gameState.players[0].mz=[t,m];gameState.players[0].hand=withBh?[h1,bh]:[h1,h2];gameState.players[0].grave=[lw];baselineA();return {t,m,gr,h1,h2,lw,bh};}
{ const x=graterField();PREFER=[uid(x.h2)];doSynchro([x.t,x.m]);PREFER=[];
  ok('グレイター: Synchro Summoned → I send a chosen hand card to the Graveyard (the other stays)',z(x.gr)==='mz'&&z(x.h2)==='grave'&&z(x.h1)==='hand',JSON.stringify({gr:z(x.gr),h2:z(x.h2),h1:z(x.h1)}));
  audit('グレイター ①'); }
{ const x=graterField(true);PREFER=[uid(x.h1)];doSynchro([x.t,x.m]);PREFER=[];
  const bh=x.bh;
  PREFER=[uid(x.lw)];duelActivateFromHand(gameState.players[0].hand.indexOf(bh));drive();PREFER=[];
  ok('グレイター ②: destroyed by an effect (ブラック・ホール) → a 「ラヴァル」 banished from the Graveyard instead; it stays on the field',z(x.gr)==='mz'&&z(x.lw)==='banish',JSON.stringify({gr:z(x.gr),lw:z(x.lw),t:TOASTS.slice(-2)}));
  audit('グレイター ②'); }
{ const x=graterField(true);PREFER=[uid(x.h1)];doSynchro([x.t,x.m]);PREFER=[];
  const bh=x.bh;
  PREFER=['decline'];duelActivateFromHand(gameState.players[0].hand.indexOf(bh));drive();PREFER=[];
  ok('グレイター ②: declining the substitute destroys it',z(x.gr)==='grave'&&z(x.lw)==='grave',JSON.stringify({gr:z(x.gr),lw:z(x.lw)})); }
{ const x=graterField();doSynchro([x.t,x.m]);gameState.players[1].mz=[mon('青眼の白龍',1)];
  toOppBattle();const f=gameState.players[1].mz[0];atkTarget(1,f,x.gr);
  ok('グレイター negative: destroyed in battle → no substitute (the text says by a card effect)',z(x.gr)==='grave'&&z(x.lw)==='grave',JSON.stringify({gr:z(x.gr),lw:z(x.lw)})); }

/* ===== ステライド ===== */
function stellaidField(){fresh();const t=mon(TUN,0),m=mon(F4,0),sd=mk('ラヴァル・ステライド',0),lw=mk(LW,0),ec=mk('エネミーコントローラー',1),wy=mon('ワイト',0);
  gameState.players[0].ex=[sd];gameState.players[0].mz=[t,m,wy];gameState.players[0].hand=[mk('サイクロン',0)];gameState.players[0].grave=[lw];gameState.players[1].hand=[ec];baselineA();return {t,m,sd,lw,ec,wy};}
{ const x=stellaidField();doSynchro([x.t,x.m]);
  ok('ステライド: Synchro Summoned → the hand card (サイクロン) was sent to the Graveyard',z(x.sd)==='mz'&&gameState.players[0].hand.length===0,JSON.stringify({sd:z(x.sd),hand:gameState.players[0].hand.length}));
  endTurn();
  PREFER=['yes',uid(x.sd)];duelActivateFromHand(0);const seen=windows([x.sd]);PREFER=[];
  ok('ステライド ②: the opponent targeted it → offered; cost banished the 「ラヴァル」, the activation negated and エネミーコントローラー destroyed, ステライド unchanged',seen.indexOf(x.sd.uid)>=0&&z(x.lw)==='banish'&&z(x.ec)==='grave'&&z(x.sd)==='mz'&&C(x.sd).pos==='atk',JSON.stringify({seen,lw:z(x.lw),ec:z(x.ec),sd:z(x.sd),pos:C(x.sd)&&C(x.sd).pos}));
  audit('ステライド'); }
{ const x=stellaidField();doSynchro([x.t,x.m]);
  endTurn();
  PREFER=['yes',uid(x.wy)];duelActivateFromHand(0);const seen=windows([x.sd]);PREFER=[];
  ok('ステライド negative: another monster was the target → not offered',seen.indexOf(x.sd.uid)<0&&z(x.lw)==='grave',JSON.stringify({seen,lw:z(x.lw)})); }

/* ===== ツインスレイヤー ===== */
function twinField(extraGrave,foes){fresh();const t=mon(TUN,0),m=mon(F2,0),ts=mk('ラヴァル・ツインスレイヤー',0),gy=extraGrave.map(n=>mk(n,0));
  gameState.players[0].ex=[ts];gameState.players[0].mz=[t,m];gameState.players[0].grave=gy;gameState.players[1].mz=foes();baselineA();doSynchro([t,m]);return {ts,gy};}
{ const x=twinField([LW],()=>[mon('ワイト',1,'def'),mon('ワイト',1,'def')]);   /* GY after the Synchro Summon: 淑女 + ウォリアー = 2 */
  ok('ツインスレイヤー: Synchro Summoned (GY: 2 「ラヴァル」)',z(x.ts)==='mz'&&u325c()===2,String(u325c()));
  endTurn();endTurn();phase('battle');
  const f1=gameState.players[1].mz[0],f2=gameState.players[1].mz[1];atkTarget(0,x.ts,f1);
  const again=battleAttackersV29(0).some(a=>a.card.uid===x.ts.uid);
  ok('ツインスレイヤー ≥2: destroyed the Defense Position monster and may attack once more',z(f1)==='grave'&&again===true,JSON.stringify({f1:z(f1),again}));
  atkTarget(0,x.ts,f2);
  ok('ツインスレイヤー ≥2: the second attack happened; no third',z(f2)==='grave'&&battleAttackersV29(0).every(a=>a.card.uid!==x.ts.uid),JSON.stringify({f2:z(f2)}));
  audit('ツインスレイヤー ②'); }
function u325c(){return gameState.players[0].grave.filter(c=>String(dbOf(c).n).indexOf('ラヴァル')>=0&&dbOf(c).k==='m').length;}
{ const x=twinField([],()=>[mon('ワイト',1,'def'),mon('ワイト',1,'def')]);   /* GY after: 淑女 only = 1 */
  endTurn();endTurn();phase('battle');const f1=gameState.players[1].mz[0];atkTarget(0,x.ts,f1);
  ok('ツインスレイヤー negative: with one 「ラヴァル」 in the Graveyard it cannot attack again',z(f1)==='grave'&&battleAttackersV29(0).every(a=>a.card.uid!==x.ts.uid),JSON.stringify({f1:z(f1)})); }
{ const x=twinField([LW,LG],()=>[mon('ギガテック・ウルフ',1,'def')]);   /* GY after: 淑女 + 2 = 3 */
  endTurn();endTurn();phase('battle');const f=gameState.players[1].mz[0];const l1=lp(1);atkTarget(0,x.ts,f);
  ok('ツインスレイヤー ≥3: piercing damage ('+ '2400 − 1200 = 1200' +')',z(f)==='grave'&&l1-lp(1)===2400-dbOf(f).def,JSON.stringify({loss:l1-lp(1),def:dbOf(f).def,f:z(f)}));
  audit('ツインスレイヤー ③'); }

/* ===== 炎湖畔の淑女 ===== */
{ fresh();const lk=mk(TUN,0),lw=mk(LW,0),lg=mk(LG,0),fs=mk('サイクロン',1,'down');fs.setTurn=3;
  gameState.players[0].grave=[lk,lw,lg];gameState.players[1].sz=[fs];baselineA();
  ok('淑女: three kinds of 「ラヴァル」 in the Graveyard + a Set card → the effect is offered',canZ('grave',lk)===true,'');
  PREFER=[uid(lw),uid(fs)];actZ('grave',lk);PREFER=[];
  ok('淑女: itself and ウォリアー banished (the cost); the Set card destroyed; ガンナー stays',z(lk)==='banish'&&z(lw)==='banish'&&z(lg)==='grave'&&z(fs)==='grave',JSON.stringify({lk:z(lk),lw:z(lw),lg:z(lg),fs:z(fs)}));
  audit('淑女'); }
{ fresh();const lk=mk(TUN,0),lw=mk(LW,0),fs=mk('サイクロン',1,'down');fs.setTurn=3;gameState.players[0].grave=[lk,lw];gameState.players[1].sz=[fs];baselineA();
  ok('淑女 negative: only two kinds → not offered',canZ('grave',lk)===false,''); }
{ fresh();const lk=mk(TUN,0),lw=mk(LW,0),lg=mk(LG,0),fu=mon('青眼の白龍',1);gameState.players[0].grave=[lk,lw,lg];gameState.players[1].mz=[fu];baselineA();
  ok('淑女 negative: no Set card on the opponent field → not offered',canZ('grave',lk)===false,''); }

/* ===== ラヴァルバル・ドラゴン ===== */
{ fresh();const lb=mon('ラヴァルバル・ドラゴン',0),lw=mk(LW,0),lg=mk(LG,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[lb];gameState.players[0].grave=[lw,lg];gameState.players[1].mz=[f];baselineA();
  const d0=gameState.players[0].deck.length;PREFER=[uid(f)];actZ('mz',lb);PREFER=[];
  ok('ラヴァルバル: both 「ラヴァル」 returned to the Deck (cost); the opponent card returned to the hand',z(lw)==='deck'&&z(lg)==='deck'&&gameState.players[0].deck.length===d0+2&&z(f)==='hand'&&pl(f)===1,JSON.stringify({lw:z(lw),lg:z(lg),f:z(f)}));
  audit('ラヴァルバル'); }
{ fresh();const lb=mon('ラヴァルバル・ドラゴン',0),lw=mk(LW,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[lb];gameState.players[0].grave=[lw];gameState.players[1].mz=[f];baselineA();
  ok('ラヴァルバル negative: only one 「ラヴァル」 in the Graveyard → not available',canZ('mz',lb)===false,''); }

console.log('U325 done');
`);
