/* S03-U181: 剣闘獣 stage 2 (engine/1ZZ) — スパルティクス / アレクサンデル (「「X」以外の効果によって特殊召喚できない」, 闘器 search, spell
   immunity), サムニテ (battle destroy → search), オクタビウス (set card destruction; discard or return at its Battle Phase end),
   ゲオルディアス / ガイザレス (contact fusion, burn / destroy 2, EX tag-out of 2). Real DUEL paths; Replay-audited.
   Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(ph){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase=ph||'battle';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:4},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],SEEN=[];
function drive(){for(let i=0;i<600;i++){
  const q=pc();
  if(q){SEEN.push({t:q.title,c:q.candidates.map(x=>x.uid!=null?x.uid:x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}
    if(q.max>1&&j<0){__choicePickV49(0);continue;}
    if(q.max>1){const ks=PREFER.map(u=>q.candidates.find(x=>x.uid===u||x.key===u)).filter(Boolean).slice(0,q.max).map(x=>x.key);answerChoiceV49(ks);continue;}
    __choicePickV49(j>=0?j:0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function attack(p,a,t){const ai=gameState.players[p].mz.indexOf(C(a)),ti=gameState.players[p===0?1:0].mz.indexOf(C(t));requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:ai,target:ti});drive();}
function trig(name){return TRIG.some(g=>g.indexOf(name)>=0);}
function offeredIn(uid){return SEEN.some(s=>s.c.indexOf(uid)>=0);}

/* ===== A: スパルティクス only by ホプロムス; its 闘器 search ===== */
fresh();
let rq=mk('剣闘獣ラクエル',0,'up'),sp=mk('剣闘獣スパルティクス',0),an=mk('剣闘獣アンダル',0);gameState.players[0].mz=[rq];gameState.players[0].deck.push(sp,an);
let w1=mk('ワイト',1,'up');gameState.players[1].mz=[w1];baselineA();
attack(0,rq,w1);SEEN=[];PREFER=[an.uid,'atk'];phase('main2');PREFER=[];
ok('A: ラクエル’s tag-out does not offer スパルティクス (「剣闘獣ホプロムス」以外の効果によって特殊召喚できない)',!offeredIn(sp.uid)&&offeredIn(an.uid)&&z(sp)==='deck',JSON.stringify(SEEN));
fresh();
let hp=mk('剣闘獣ホプロムス',0,'up');sp=mk('剣闘獣スパルティクス',0);let arms=mk('剣闘獣の闘器グラディウス',0);gameState.players[0].mz=[hp];gameState.players[0].deck.push(sp,arms);
w1=mk('ワイト',1,'up');gameState.players[1].mz=[w1];baselineA();
attack(0,hp,w1);SEEN=[];PREFER=[sp.uid,'atk',arms.uid];phase('main2');PREFER=[];
ok('A: ホプロムス’s tag-out summons スパルティクス, whose forced trigger adds 剣闘獣の闘器グラディウス',z(sp)==='mz'&&z(arms)==='hand'&&trig('剣闘獣スパルティクス'),JSON.stringify({sp:z(sp),arms:z(arms),TRIG}));
audit('A');

/* ===== B: アレクサンデル only by ディカエリィ; special summoned it is unaffected by Spell cards (ブラック・ホール) ===== */
fresh();
let dk=mk('剣闘獣ディカエリィ',0,'up'),al=mk('剣闘獣アレクサンデル',0);gameState.players[0].mz=[dk];gameState.players[0].deck.push(al);
w1=mk('ワイト',1,'up');gameState.players[1].mz=[w1];gameState.players[1].hand=[mk('ブラック・ホール',1)];baselineA();
attack(0,dk,w1);SEEN=[];PREFER=[al.uid,'atk'];phase('main2');PREFER=[];
ok('B: ディカエリィ’s tag-out summons アレクサンデル',z(al)==='mz');
gameState.players[0];requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});drive();requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');
duelActivateFromHand(0);drive();
ok('B: the opponent’s ブラック・ホール — the special-summoned アレクサンデル is unaffected and stays',z(al)==='mz',z(al));
audit('B');

/* ===== C: サムニテ (gladiator-summoned) destroys a monster by battle → may add a 「剣闘獣」 card; a normal one may not ===== */
fresh();
let sa=mk('剣闘獣サムニテ',0,'up');sa.gladiatorSummonedS03=true;let want=mk('剣闘獣ラクエル',0);gameState.players[0].mz=[sa];gameState.players[0].deck.push(want);
let w2=mk('ワイト',1,'up');gameState.players[1].mz=[w2];baselineA();
TRIG=[];PREFER=[want.uid];attack(0,sa,w2);PREFER=[];
ok('C: サムニテ destroyed ワイト by battle → its trigger added ラクエル from the Deck',z(w2)==='grave'&&trig('剣闘獣サムニテ')&&z(want)==='hand',JSON.stringify({TRIG,want:z(want)}));
audit('C');
fresh();
sa=mk('剣闘獣サムニテ',0,'up');gameState.players[0].mz=[sa];gameState.players[0].deck.push(mk('剣闘獣ラクエル',0));w2=mk('ワイト',1,'up');gameState.players[1].mz=[w2];baselineA();
TRIG=[];attack(0,sa,w2);
ok('C: a normally summoned サムニテ — no search offered',z(w2)==='grave'&&!trig('剣闘獣サムニテ'));

/* ===== D: オクタビウス — gladiator summon destroys a set card; at its own Battle Phase end after battling: discard 1 (chosen) ===== */
fresh();
hp=mk('剣闘獣ホプロムス',0,'up');let oc=mk('剣闘獣オクタビウス',0);gameState.players[0].mz=[hp];gameState.players[0].deck.push(oc);
let set=mk('強欲な壺',1,'down');gameState.players[1].sz=[set];w1=mk('ワイト',1,'up');gameState.players[1].mz=[w1];baselineA();
attack(0,hp,w1);PREFER=[oc.uid,'atk',set.uid];phase('main2');PREFER=[];
ok('D: オクタビウス summoned by ホプロムス destroys the set card',z(oc)==='mz'&&z(set)==='grave');
audit('D');
fresh();
oc=mk('剣闘獣オクタビウス',0,'up');let dh=mk('ワイト',0);gameState.players[0].mz=[oc];gameState.players[0].hand=[dh];w1=mk('ワイト',1,'up');gameState.players[1].mz=[w1];baselineA();
attack(0,oc,w1);TRIG=[];PREFER=['discard',dh.uid];phase('main2');PREFER=[];
ok('D: after battling in its own Battle Phase, オクタビウス (forced) — its controller discarded 1 and it stays',trig('剣闘獣オクタビウス')&&z(dh)==='grave'&&z(oc)==='mz');
audit('D2');

/* ===== E: ゲオルディアス — contact; destroys a monster by battle → damage = its DEF; tag-out of 2 (not スパルティクス) ===== */
fresh('main1');
let s2=mk('剣闘獣スパルティクス',0,'up'),r2=mk('剣闘獣ラクエル',0,'up');gameState.players[0].mz=[s2,r2];
let geo=mk('剣闘獣ゲオルディアス',0,'up');gameState.players[0].ex=[geo];
let d1=mk('剣闘獣アンダル',0),d2=mk('剣闘獣ラクエル',0),d3=mk('剣闘獣スパルティクス',0);gameState.players[0].deck.push(d1,d2,d3);
let gi=mk('ギガンテス',1,'up','def');gameState.players[1].mz=[gi];baselineA();
finishSummonProcedure('剣闘獣ゲオルディアス',0,'ex',0,'atk');drive();
ok('E: ゲオルディアス contact-summoned (スパルティクス + ラクエル to the Deck)',z(geo)==='mz'&&z(s2)==='deck'&&z(r2)==='deck');
phase('battle');const lp1=gameState.players[1].lp;
attack(0,geo,gi);
ok('E: it destroyed Defense Position ギガンテス and dealt its DEF (1300) as damage',z(gi)==='grave'&&gameState.players[1].lp===lp1-1300,JSON.stringify({gi:z(gi),lp:gameState.players[1].lp,lp1}));
SEEN=[];PREFER=[d1.uid,d2.uid,'atk'];phase('main2');PREFER=[];
ok('E: Battle Phase end — ゲオルディアス back to the EX Deck, 2 「剣闘獣」 summoned; スパルティクス not offered',z(geo)==='ex'&&z(d1)==='mz'&&z(d2)==='mz'&&!offeredIn(d3.uid),JSON.stringify({geo:z(geo),d1:z(d1),d2:z(d2),SEEN}));
audit('E');

/* ===== F: ガイザレス — contact; ① destroys up to 2 chosen cards; ② tag-out of 2 not ベストロウリィ ===== */
fresh('main1');
let bw=mk('剣闘獣ベストロウリィ',0,'up'),an2=mk('剣闘獣アンダル',0,'up');gameState.players[0].mz=[bw,an2];
let gz=mk('剣闘獣ガイザレス',0,'up');gameState.players[0].ex=[gz];
let t1=mk('聖なるバリア －ミラーフォース－',1,'down'),t2=mk('ギガンテス',1,'up'),t3=mk('サイクロン',1,'down');gameState.players[1].sz=[t1,t3];gameState.players[1].mz=[t2];baselineA();
PREFER=[t1.uid,t2.uid];finishSummonProcedure('剣闘獣ガイザレス',0,'ex',0,'atk');drive();PREFER=[];
ok('F: ガイザレス contact-summoned; ① destroyed the 2 chosen cards (ミラーフォース, ギガンテス), the third stays',z(gz)==='mz'&&z(t1)==='grave'&&z(t2)==='grave'&&z(t3)==='sz',JSON.stringify({gz:z(gz),t1:z(t1),t2:z(t2),t3:z(t3)}));
audit('F');
fresh();
gz=mk('剣闘獣ガイザレス',0,'up');gz.properlySummonedS03=true;gameState.players[0].mz=[gz];
let e1=mk('剣闘獣アンダル',0),e2=mk('剣闘獣ラクエル',0),e3=mk('剣闘獣ベストロウリィ',0);gameState.players[0].deck.push(e1,e2,e3);
let wz=mk('ワイト',1,'up');gameState.players[1].mz=[wz];baselineA();
attack(0,gz,wz);SEEN=[];PREFER=[e1.uid,e2.uid,'atk'];phase('main2');PREFER=[];
ok('F: ② after battling, ガイザレス returns to the EX Deck and summons 2 「剣闘獣」 (ベストロウリィ not offered)',z(gz)==='ex'&&z(e1)==='mz'&&z(e2)==='mz'&&!offeredIn(e3.uid),JSON.stringify({gz:z(gz),e1:z(e1),e2:z(e2)}));
audit('F2');
`);
