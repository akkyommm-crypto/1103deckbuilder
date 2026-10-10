/* S03-U167: オシャレオン / ジェイドナイト / 機皇兵スキエル・アイン (continuous effect + battle-destroyed deck trigger on engine/1ZT,
   spec.continuous) and バイオファルコン (search when another own Machine is destroyed by battle). Also the engine fix: the v21
   effect-destruction context now takes the source kind from the action's stamp (a.srcS03.k) — the resolving link has already left
   the chain, so 「罠／魔法・罠カードの効果では破壊されない」 never applied in the real path (E: 氷結界の大僧正). Real DUEL path; Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function uid(c){return ensureCardUid(gameState,c);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;}
/* SEEN: every choice shown {title, names, min, max, cancelable}; TRIG: every trigger group offered {names, forced}.
   PREFER: uids / keys to pick first; SKIP_OPTIONAL: decline optional trigger groups. */
let PREFER=[],SEEN=[],TRIG=[],SKIP_OPTIONAL=false;
function pick(){const q=pc();SEEN.push({title:q.title,names:q.candidates.map(x=>x.name||x.label||(x.uid!=null?nm(findCardByUid(x.uid)&&findCardByUid(x.uid).card):x.value)),min:q.min,max:q.max,cancelable:!!q.cancelable,kind:q.kind});
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u||x.value===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length){TRIG.push({names:g.map(c=>c.name),forced:st.rank<2});}
    if(g.length&&!(SKIP_OPTIONAL&&st.rank>=2))eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function journal(t){return V41_ACTION_JOURNAL.filter(x=>x.action.type===t);}
function chains(name){return journal('CHAIN_ADD').filter(x=>x.action&&(x.action.name===name||(x.action.link&&x.action.link.name===name)));}
function evOffered(name){return TRIG.some(e=>e.names.indexOf(name)>=0);}
function evForced(name){const e=TRIG.find(e=>e.names.indexOf(name)>=0);return !!(e&&e.forced);}
function seenFor(name){return SEEN.filter(s=>s.title.indexOf(name)===0);}
function atk(p,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:0,target:t==null?0:t});}
`;

const HELP=String.raw`
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function decks(){for(let p=0;p<2;p++) gameState.players[p].deck=[mk('ワイト',p),mk('ワイト',p),mk('ワイト',p),mk('ワイト',p),mk('ワイト',p)];}
function hitAt(p,atkCard,target){const ai=gameState.players[p].mz.indexOf(atkCard),ti=gameState.players[p===0?1:0].mz.indexOf(target);
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:ai,target:ti});drive();}
`;


/* ===== A. オシャレオン ===== */
harness(COMMON+HELP+String.raw`
const MAIN=CARD_DB.filter(d=>d&&d.k==='m'&&!d.ex&&d.n);
const rep=MAIN.find(d=>d.ra==='爬虫類'&&Number(d.atk)<=500&&d.n!=='オシャレオン'), repHi=MAIN.find(d=>d.ra==='爬虫類'&&Number(d.atk)>500&&d.n!=='オシャレオン');
fresh();
const os=mk('オシャレオン',0,'up','atk'),w=mk('ワイト',0,'up','atk');gameState.players[0].mz=[os,w];
const gob=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[gob];
const m=mk(rep.n,0),hi=mk(repHi.n,0);gameState.players[0].deck=[hi,m,mk('ワイト',0)];gameState.players[1].deck=[mk('ワイト',1)];
gameState.activePlayer=1;gameState.phase='battle';baselineA();
const T=battleTargetsV29(gob.uid).targets.map(x=>x.card.uid);
ok('A: face-up Attack Position オシャレオン — the opponent can only choose 「オシャレオン」 as an attack target (not ワイト)',T.length===1&&T[0]===os.uid,JSON.stringify(T));
PREFER=[uid(m)];hitAt(1,gob,os);PREFER=[];
const s=seenFor('オシャレオン')[0];
ok('A: destroyed by battle — offers only the ATK ≤ 500 Reptile ('+rep.n+', not '+repHi.n+'); added to the hand',z(os)==='grave'&&!!s&&JSON.stringify(s.names)===JSON.stringify([rep.n])&&z(m)==='hand',JSON.stringify(SEEN));
audit('A');
fresh();
const o2=mk('オシャレオン',0,'up','def'),w2=mk('ワイト',0,'up','atk');gameState.players[0].mz=[o2,w2];const g2=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[g2];
decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
ok('A: in Defense Position the restriction does not apply',battleTargetsV29(g2.uid).targets.some(x=>x.card.uid===w2.uid));
`);

/* ===== B. ジェイドナイト ===== */
harness(COMMON+HELP+String.raw`
fresh();
const jk=mk('ジェイドナイト',0,'up','atk'),dv=mk('D・ビデオン',0,'up','atk'),xh=mk('X－ヘッド・キャノン',0,'up','atk');gameState.players[0].mz=[jk,dv,xh];
const mf=mk('聖なるバリア －ミラーフォース－',1,'down');mf.setTurn=4;gameState.players[1].sz=[mf];gameState.players[1].mz=[mk('ワイト',1,'up','def')];
decks();gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:2,target:0});
const at=toPoint('attackDeclare');if(at)pointActivateV27(1,'sz',0);drive();
ok('B: 聖なるバリア －ミラーフォース－ (a Trap) — ジェイドナイト and D・ビデオン (Machine, ATK ≤ 1200) are not destroyed; X－ヘッド・キャノン (1800) is',at&&z(jk)==='mz'&&z(dv)==='mz'&&z(xh)==='grave',JSON.stringify({at,jk:z(jk),dv:z(dv),xh:z(xh)}));
audit('B trap');
fresh();
const j2=mk('ジェイドナイト',0,'up','atk'),d2=mk('D・ビデオン',0,'up','atk');gameState.players[0].mz=[j2,d2];gameState.players[1].hand=[mk('サンダー・ボルト',1)];
decks();gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('B: a Spell (サンダー・ボルト) destroys them',z(j2)==='grave'&&z(d2)==='grave');
fresh();SEEN=[];
const j3=mk('ジェイドナイト',0,'up','atk');gameState.players[0].mz=[j3];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
const dvd=mk('D・ビデオン',0),gir=mk('サイバー・ジラフ',0);gameState.players[0].deck=[gir,dvd,mk('ワイト',0)];gameState.players[1].deck=[mk('ワイト',1)];
gameState.activePlayer=1;gameState.phase='battle';baselineA();
PREFER=[uid(dvd)];hitAt(1,gameState.players[1].mz[0],j3);PREFER=[];
const s=seenFor('ジェイドナイト')[0];
ok('B: face-up and destroyed by battle — offers only the Machine / LIGHT / Lv4 D・ビデオン (not the Lv3 サイバー・ジラフ)',z(j3)==='grave'&&!!s&&JSON.stringify(s.names)==='["D・ビデオン"]'&&z(dvd)==='hand',JSON.stringify(SEEN));
audit('B search');
`);

/* ===== C. 機皇兵スキエル・アイン ===== */
harness(COMMON+HELP+String.raw`
fresh();
const sk=mk('機皇兵スキエル・アイン',0,'up','atk'),wz=mk('機皇兵ワイゼル・アイン',0,'up','atk'),fd=mk('機皇兵グランエル・アイン',0,'down','def');gameState.players[0].mz=[sk,wz,fd];
const og=mk('機皇兵グランエル・アイン',1,'up','atk');gameState.players[1].mz=[og,mk('青眼の白龍',1,'up')];
const w2=mk('機皇兵ワイゼル・アイン',0),inf=mk('機皇帝スキエル∞',0),wall=mk('鉄壁の機皇兵',0);gameState.players[0].deck=[inf,wall,w2,mk('ワイト',0)];gameState.players[1].deck=[mk('ワイト',1)];
baselineA();
ok('C: ATK 1200 + 200 × face-up 「機皇」 monsters other than itself (own ワイゼル + the opponent\'s グランエル; the face-down one is not counted) = 1600',curATK(sk)===1600,String(curATK(sk)));
gameState.activePlayer=1;gameState.phase='battle';baselineA();
PREFER=[uid(w2),'def'];hitAt(1,gameState.players[1].mz[1],sk);PREFER=[];
const s=seenFor('機皇兵スキエル・アイン')[0];
ok('C: destroyed by battle — Special Summons a 「機皇兵」 monster: only 機皇兵ワイゼル・アイン offered (not the 機皇帝, not the Spell 鉄壁の機皇兵)',z(sk)==='grave'&&!!s&&JSON.stringify(s.names)==='["機皇兵ワイゼル・アイン"]'&&z(w2)==='mz',JSON.stringify(SEEN));
audit('C');
`);

/* ===== D. バイオファルコン ===== */
harness(COMMON+HELP+String.raw`
fresh();
const bf=mk('バイオファルコン',0,'up','atk'),dv=mk('D・ビデオン',0,'up','atk');gameState.players[0].mz=[bf,dv];
const gob=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[gob];
const gir=mk('サイバー・ジラフ',0),xh=mk('X－ヘッド・キャノン',0);gameState.players[0].deck=[xh,gir,mk('ワイト',0)];gameState.players[1].deck=[mk('ワイト',1)];
gameState.activePlayer=1;gameState.phase='battle';baselineA();
PREFER=[uid(gir)];hitAt(1,gob,dv);PREFER=[];
const s=seenFor('バイオファルコン')[0];
ok('D: another own Machine (D・ビデオン) destroyed by battle — offers only the ATK ≤ 1000 Machine サイバー・ジラフ (not X－ヘッド・キャノン)',z(dv)==='grave'&&!!s&&JSON.stringify(s.names)==='["サイバー・ジラフ"]'&&z(gir)==='hand',JSON.stringify({seen:SEEN,trig:TRIG}));
audit('D');
fresh();SEEN=[];TRIG=[];
const b2=mk('バイオファルコン',0,'up','atk'),w2=mk('ワイト',0,'up','atk');gameState.players[0].mz=[b2,w2];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up'),mk('青眼の白龍',1,'up')];
decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
hitAt(1,gameState.players[1].mz[0],w2);
const nonMachine=!evOffered('バイオファルコン');
hitAt(1,gameState.players[1].mz[1],b2);
ok('D: not for a non-Machine (ワイト), nor for バイオファルコン itself',nonMachine&&z(b2)==='grave'&&!evOffered('バイオファルコン'));
`);

/* ===== E. engine fix: 「魔法・罠カードの効果では破壊されない」 in the real chain path (氷結界の大僧正, TESTED since System v21) ===== */
harness(COMMON+HELP+String.raw`
fresh();
const ab=mk('氷結界の大僧正',0,'up','def'),ib=mk('氷結界の修験者',0,'up','atk'),w=mk('ワイト',0,'up','atk');gameState.players[0].mz=[ab,ib,w];
gameState.players[1].hand=[mk('サンダー・ボルト',1)];
decks();gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('E: the opponent\'s サンダー・ボルト (a Spell) — 氷結界の大僧正 and 氷結界の修験者 are not destroyed; ワイト is',z(ab)==='mz'&&z(ib)==='mz'&&z(w)==='grave',JSON.stringify({ab:z(ab),ib:z(ib),w:z(w)}));
audit('E');
`);
