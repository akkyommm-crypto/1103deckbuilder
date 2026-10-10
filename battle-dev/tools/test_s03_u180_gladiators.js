/* S03-U180: 剣闘獣 (Gladiator Beast) common mechanism (engine/1ZZ) — Battle Phase end tag-out (cost: return to the Deck; the player picks
   the 「剣闘獣」 and its position), 「「剣闘獣」…の効果によって特殊召喚に成功した時／場合」 effects, 「戦闘を行った」 per damage calculation.
   Cards: ラクエル, ホプロムス, ディカエリィ, エクイテ, ムルミロ, レティアリィ, ベストロウリィ, トラケス, ティゲル (セクトル: tools/test_battle_cards.js).
   Real DUEL paths; Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='battle';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:4},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],SKIP=[];
function drive(){for(let i=0;i<600;i++){
  const q=pc();
  if(q){let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length){TRIG.push(g.map(c=>c.name));const k=g.findIndex(c=>SKIP.indexOf(c.name)<0);if(k>=0&&!(st.rank>=2&&SKIP.indexOf(g[k].name)>=0))eventPickV2(k);else eventSkipGroupV2();}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function attack(p,a,t){const ai=gameState.players[p].mz.indexOf(C(a)),ti=t?gameState.players[p===0?1:0].mz.indexOf(C(t)):'direct';requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:ai,target:ti});drive();}
function trig(name){return TRIG.some(g=>g.indexOf(name)>=0);}

/* ===== A: ラクエル battles → at the Battle Phase end it returns to the Deck and brings ホプロムス (Defense, chosen): base DEF 2400 ===== */
fresh();
let rq=mk('剣闘獣ラクエル',0,'up'),hop=mk('剣闘獣ホプロムス',0),and=mk('剣闘獣アンダル',0);gameState.players[0].mz=[rq];gameState.players[0].deck.push(hop,and);
let wt=mk('ワイト',1,'up');gameState.players[1].mz=[wt];baselineA();
attack(0,rq,wt);
ok('A: ラクエル (normal summon) is not gladiator-summoned — base ATK 1800',curATK(C(rq))===1800);
PREFER=[hop.uid,'def'];TRIG=[];phase('main2');PREFER=[];
ok('A: the tag-out was offered at the Battle Phase end; ラクエル back in the Deck; ホプロムス in Defense Position with DEF 2400',
  trig('剣闘獣ラクエル')&&z(rq)==='deck'&&z(hop)==='mz'&&C(hop).pos==='def'&&C(hop).gladiatorSummonedS03===true&&curDEF(C(hop))===2400,
  JSON.stringify({TRIG,rq:z(rq),hop:z(hop),def:z(hop)==='mz'&&curDEF(C(hop))}));
audit('A');

/* ===== B: a monster that did not battle is not offered; ホプロムス brings ラクエル (base ATK 2100) and ディカエリィ may attack twice ===== */
fresh();
hop=mk('剣闘獣ホプロムス',0,'up');let idle=mk('剣闘獣ムルミロ',0,'up');gameState.players[0].mz=[hop,idle];
rq=mk('剣闘獣ラクエル',0);gameState.players[0].deck.push(rq);let wt2=mk('ワイト',1,'up');gameState.players[1].mz=[wt2];baselineA();
attack(0,hop,wt2);
PREFER=[rq.uid,'atk'];TRIG=[];phase('main2');PREFER=[];
ok('B: only the monster that battled (ホプロムス) is offered, not ムルミロ; ラクエル summoned by it has base ATK 2100',
  trig('剣闘獣ホプロムス')&&!trig('剣闘獣ムルミロ')&&z(rq)==='mz'&&curATK(C(rq))===2100&&z(hop)==='deck',JSON.stringify({TRIG,atk:z(rq)==='mz'&&curATK(C(rq))}));
audit('B');
fresh();
let dk=mk('剣闘獣ディカエリィ',0,'up');dk.gladiatorSummonedS03=true;let dk2=mk('剣闘獣ディカエリィ',0,'up');gameState.players[0].mz=[dk,dk2];baselineA();
ok('B: ディカエリィ summoned by a 「剣闘獣」 effect may attack twice in a Battle Phase; a normally summoned one once',attackLimitV48(C(dk))===2&&attackLimitV48(C(dk2))===1);

/* ===== C: on-summon effects — ムルミロ (destroy a face-up monster), then ベストロウリィ (destroy a Spell / Trap), エクイテ (GY 「剣闘獣」 card to hand),
   レティアリィ (optional: banish from the opponent's GY) ===== */
fresh();
rq=mk('剣闘獣ラクエル',0,'up');let mu=mk('剣闘獣ムルミロ',0);gameState.players[0].mz=[rq];gameState.players[0].deck.push(mu);
let big=mk('ギガンテス',1,'up'),st=mk('サイクロン',1,'down');gameState.players[1].mz=[big];gameState.players[1].sz=[st];baselineA();
attack(0,rq,big);   /* 1800 vs 1900: ラクエル is destroyed — no tag-out */
ok('C: a monster destroyed in the battle cannot tag out',z(rq)==='grave');
fresh();
let an=mk('剣闘獣アンダル',0,'up');an.gladiatorSummonedS03=false;
let hp=mk('剣闘獣ホプロムス',0,'up');gameState.players[0].mz=[hp];mu=mk('剣闘獣ムルミロ',0);gameState.players[0].deck.push(mu);
big=mk('ギガンテス',1,'up');let wt3=mk('ワイト',1,'up');gameState.players[1].mz=[big,wt3];baselineA();
attack(0,hp,wt3);
PREFER=[big.uid,mu.uid,'atk'];TRIG=[];phase('main2');PREFER=[];
ok('C: ムルミロ summoned by the tag-out destroys the chosen face-up ギガンテス (forced)',z(mu)==='mz'&&z(big)==='grave'&&trig('剣闘獣ムルミロ'),JSON.stringify({mu:z(mu),big:z(big),TRIG}));
audit('C');
fresh();
hp=mk('剣闘獣ホプロムス',0,'up');gameState.players[0].mz=[hp];let bw=mk('剣闘獣ベストロウリィ',0);gameState.players[0].deck.push(bw);
st=mk('サイクロン',1,'down');gameState.players[1].sz=[st];wt3=mk('ワイト',1,'up');gameState.players[1].mz=[wt3];baselineA();
attack(0,hp,wt3);
PREFER=[st.uid,bw.uid,'atk'];phase('main2');PREFER=[];
ok('C: ベストロウリィ destroys the targeted set サイクロン',z(bw)==='mz'&&z(st)==='grave');
audit('C2');
fresh();
hp=mk('剣闘獣ホプロムス',0,'up');let gyc=mk('剣闘獣アンダル',0);gameState.players[0].mz=[hp];gameState.players[0].grave=[gyc];
let eq=mk('剣闘獣エクイテ',0),rt=mk('剣闘獣レティアリィ',0);gameState.players[0].deck.push(eq);
let og=mk('サイクロン',1);gameState.players[1].grave=[og];wt3=mk('ワイト',1,'up');gameState.players[1].mz=[wt3];baselineA();
attack(0,hp,wt3);
PREFER=[gyc.uid,eq.uid,'atk'];phase('main2');PREFER=[];
ok('C: エクイテ adds the 「剣闘獣」 card from its GY to the hand (forced)',z(eq)==='mz'&&z(gyc)==='hand');
audit('C3');

fresh();
hp=mk('剣闘獣ホプロムス',0,'up');gameState.players[0].mz=[hp];rt=mk('剣闘獣レティアリィ',0);gameState.players[0].deck.push(rt);
og=mk('サイクロン',1);let og2=mk('強欲な壺',1);gameState.players[1].grave=[og,og2];wt3=mk('ワイト',1,'up');gameState.players[1].mz=[wt3];baselineA();
attack(0,hp,wt3);
PREFER=[og2.uid,rt.uid,'atk'];TRIG=[];phase('main2');PREFER=[];
ok('C: レティアリィ (optional trigger offered) banishes the chosen card from the opponent’s GY',z(rt)==='mz'&&trig('剣闘獣レティアリィ')&&z(og2)==='banish'&&z(og)==='grave');
audit('C4');

/* ===== D: トラケス (summoned by a 「剣闘獣」 effect) returns itself at the Battle Phase end and draws 1 ===== */
fresh();
let tr=mk('剣闘獣トラケス',0,'up');tr.gladiatorSummonedS03=true;gameState.players[0].mz=[tr];wt3=mk('ワイト',1,'def');gameState.players[1].mz=[wt3];baselineA();
const hand0=gameState.players[0].hand.length;
attack(0,tr,wt3);TRIG=[];phase('main2');
ok('D: トラケス returned to the Deck and its controller drew 1',trig('剣闘獣トラケス')&&z(tr)==='deck'&&gameState.players[0].hand.length===hand0+1,JSON.stringify({TRIG,tr:z(tr)}));
audit('D');

/* ===== E: ティゲル — cannot be a fusion material (contact fusion of ヘラクレイノス refuses it); on a gladiator summon: discard a 「剣闘獣」 → search ===== */
fresh();
gameState.phase='main1';
gameState.players[0].mz=[mk('剣闘獣ラクエル',0,'up'),mk('剣闘獣ティゲル',0,'up'),mk('剣闘獣アンダル',0,'up')];gameState.players[0].ex=[mk('剣闘獣ヘラクレイノス',0,'up')];baselineA();
const rowE=contactProcRowS03(0,0,dbOf(gameState.players[0].ex[0]));
ok('E: ティゲル is not a fusion material — ラクエル + ティゲル + アンダル cannot contact-fuse ヘラクレイノス',rowE&&rowE.ok===false,JSON.stringify(rowE));
fresh();
hp=mk('剣闘獣ホプロムス',0,'up');gameState.players[0].mz=[hp];let ti=mk('剣闘獣ティゲル',0),want=mk('剣闘獣ディカエリィ',0);gameState.players[0].deck.push(ti,want);
let dis=mk('剣闘獣アンダル',0);gameState.players[0].hand=[dis];wt3=mk('ワイト',1,'up');gameState.players[1].mz=[wt3];baselineA();
attack(0,hp,wt3);
PREFER=[ti.uid,'atk',dis.uid,want.uid];phase('main2');PREFER=[];
ok('E: ティゲル — the 「剣闘獣」 in hand discarded, ディカエリィ added from the Deck',z(ti)==='mz'&&z(dis)==='grave'&&z(want)==='hand');
audit('E');
`);
