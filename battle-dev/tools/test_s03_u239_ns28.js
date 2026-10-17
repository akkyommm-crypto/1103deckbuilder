/* S03-U239: NOT_STARTED → TESTED — マジカル・コンダクター, エクスプローシブ・マジシャン, 魔法族の結界, デモニック・モーター・Ω, レスキューロイド, レプティレス・スポーン.
   Real DUEL paths (Spell activations, ignition effects, attacks, phase changes), Replay-audited. Spell Counters are kind '魔力'. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
const SC='魔力';
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;TRIG.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5339a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
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
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function lp(p){return gameState.players[p].lp;}
function cnt(c){return API.countCounter(h(C(c)),SC);}
function idx(c){return findCardByUid(c.uid).index;}
function legal(name,p,zone,i){return strictScriptLegalityV2(name,p,zone,i,{}).ok;}
function pots(p,n){return Array.from({length:n},()=>mk('強欲な壺',p));}
function pot(){duelActivateFromHand(0);drive();}
function withSC(c,n){c.counters={[SC]:n};return c;}
function tokens(p,name){return (gameState.players[p].mz||[]).filter(c=>c&&c.token&&c.token.n===name);}

/* ===== A: マジカル・コンダクター — +2 per Spell (either player); remove N (chosen) → special summon a Spellcaster of Level N from the hand / GY ===== */
fresh();
let cd=mk('マジカル・コンダクター',0,'up'),ap=mk('見習い魔術師',0),va=mk('マジシャンズ・ヴァルキリア',0),bg=mk('ブラック・マジシャン・ガール',0);
gameState.players[0].mz=[cd];gameState.players[0].hand=pots(0,2).concat([ap]);gameState.players[0].grave=[va];baselineA();
ok('A: Spellcasters in the data (race 魔法使い)',dbOf(C(ap)).ra==='魔法使い'&&Number(dbOf(C(ap)).lv)===2&&Number(dbOf(C(va)).lv)===4,JSON.stringify([dbOf(C(ap)).ra,dbOf(C(ap)).lv,dbOf(C(va)).lv]));
pot();
ok('A: own Spell activation → 2 counters',cnt(cd)===2,String(cnt(cd)));
pot();
ok('A: second Spell → 4 counters (no cap)',cnt(cd)===4,String(cnt(cd)));
PREFER=['2',ap.uid];duelActivateFromZone(0,'mz',idx(cd));drive();PREFER=[];
/* S03-U373: 見習い魔術師 now has its exact script (text ①: on Special Summon success it places a Spell Counter on a capable card) — the summoned 見習い魔術師 puts 1 counter back on マジカル・コンダクター: 4 − 2 + 1 = 3. The card text, not the old coarse entry, is the authority. */
ok('A: chose 2 → 2 counters removed (cost) and 1 placed by the summoned 見習い魔術師 (3); the Level 2 見習い魔術師 special summoned from the hand; the Level 4 in the GY stays',cnt(cd)===3&&z(ap)==='mz'&&z(va)==='grave',JSON.stringify([cnt(cd),z(ap),z(va)]));
ok('A: once per turn (3 counters left but not activatable again)',!legal('マジカル・コンダクター',0,'mz',idx(cd)));
audit('A');

/* A2: the opponent's Spell counts too (+2) */
fresh();
cd=mk('マジカル・コンダクター',0,'up');let pp=mk('強欲な壺',1);
gameState.players[0].mz=[cd];gameState.players[1].hand=[pp];withSC(cd,2);gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('A2: the opponent Spell activation → +2 (4 counters)',cnt(cd)===4,String(cnt(cd)));
audit('A2');
/* A2b: N = 4 → a Level 4 Spellcaster from the GY (the Level 6 in the hand is not chosen) */
fresh();
cd=mk('マジカル・コンダクター',0,'up');va=mk('マジシャンズ・ヴァルキリア',0);bg=mk('ブラック・マジシャン・ガール',0);
gameState.players[0].mz=[cd];gameState.players[0].hand=[bg];gameState.players[0].grave=[va];withSC(cd,4);baselineA();
PREFER=['4',va.uid];duelActivateFromZone(0,'mz',idx(cd));drive();PREFER=[];
ok('A2b: chose 4 → the Level 4 Spellcaster special summoned from the GY; the Level 6 in the hand stays; all counters gone',cnt(cd)===0&&z(va)==='mz'&&z(bg)==='hand',JSON.stringify([cnt(cd),z(va),z(bg)]));
audit('A2b');

/* A3 (negative): the chosen number matches no Spellcaster's Level → the cost is paid, nothing is summoned */
fresh();
cd=mk('マジカル・コンダクター',0,'up');va=mk('マジシャンズ・ヴァルキリア',0);bg=mk('ブラック・マジシャン・ガール',0);
gameState.players[0].mz=[cd];gameState.players[0].hand=[bg];gameState.players[0].grave=[va];withSC(cd,3);baselineA();
PREFER=['3'];duelActivateFromZone(0,'mz',idx(cd));drive();PREFER=[];
ok('A3: chose 3 (no Level 3 Spellcaster) → counters spent, nothing special summoned',cnt(cd)===0&&z(va)==='grave'&&z(bg)==='hand'&&gameState.players[0].mz.length===1,JSON.stringify([cnt(cd),z(va),z(bg),gameState.players[0].mz.length]));
audit('A3');

/* ===== B: エクスプローシブ・マジシャン — remove 2 counters from anywhere on the field (cost) → destroy 1 opponent Spell / Trap; no once-per-turn limit ===== */
fresh();
let ex=mk('エクスプローシブ・マジシャン',0,'up'),cd2=withSC(mk('マジカル・コンダクター',0,'up'),1),kk=withSC(mk('魔法族の結界',0,'up'),1);
let t1=mk('サイクロン',1,'down'),t2=mk('落とし穴',1,'down'),t3=mk('サイクロン',1,'down');t1.setTurn=4;t2.setTurn=4;t3.setTurn=4;
gameState.players[0].mz=[ex,cd2];gameState.players[0].sz=[kk];gameState.players[1].sz=[t1,t2,t3];baselineA();
ok('B: Level 6, ATK 2500',curLV(C(ex))===6&&curATK(C(ex))===2500);
PREFER=[t2.uid];duelActivateFromZone(0,'mz',idx(ex));drive();PREFER=[];
ok('B: 1 counter from the Conductor + 1 from the 結界 removed (cost); the chosen Set Trap destroyed, the others stay',cnt(cd2)===0&&cnt(kk)===0&&z(t2)==='grave'&&z(t1)==='sz'&&z(t3)==='sz',JSON.stringify([cnt(cd2),cnt(kk),z(t1),z(t2),z(t3)]));
ok('B: no counters left → not activatable',!legal('エクスプローシブ・マジシャン',0,'mz',idx(ex)));
audit('B');
fresh();
ex=mk('エクスプローシブ・マジシャン',0,'up');cd2=withSC(mk('マジカル・コンダクター',0,'up'),4);t1=mk('サイクロン',1,'down');t2=mk('サイクロン',1,'down');t1.setTurn=4;t2.setTurn=4;
gameState.players[0].mz=[ex,cd2];gameState.players[1].sz=[t1,t2];baselineA();
PREFER=[t1.uid];duelActivateFromZone(0,'mz',idx(ex));drive();PREFER=[t2.uid];
ok('B2: 2 of 4 counters removed (from one card); first Spell/Trap destroyed',cnt(cd2)===2&&z(t1)==='grave'&&z(t2)==='sz',JSON.stringify([cnt(cd2),z(t1),z(t2)]));
duelActivateFromZone(0,'mz',idx(ex));drive();PREFER=[];
ok('B2: activated again in the same turn (no once-per-turn limit) → second destroyed, 0 counters',cnt(cd2)===0&&z(t2)==='grave',JSON.stringify([cnt(cd2),z(t2)]));
audit('B2');
/* B3 (negative): only 1 counter in total, or no opponent Spell / Trap */
fresh();
ex=mk('エクスプローシブ・マジシャン',0,'up');cd2=withSC(mk('マジカル・コンダクター',0,'up'),1);t1=mk('サイクロン',1,'down');t1.setTurn=4;
gameState.players[0].mz=[ex,cd2];gameState.players[1].sz=[t1];baselineA();
ok('B3: only 1 counter → not activatable',!legal('エクスプローシブ・マジシャン',0,'mz',idx(ex)));
fresh();
ex=mk('エクスプローシブ・マジシャン',0,'up');cd2=withSC(mk('マジカル・コンダクター',0,'up'),2);gameState.players[0].mz=[ex,cd2];baselineA();
ok('B3: 2 counters but no opponent Spell / Trap → not activatable',!legal('エクスプローシブ・マジシャン',0,'mz',idx(ex)));

/* ===== C: 魔法族の結界 — +1 counter when a face-up Spellcaster on the field is destroyed (either side, battle or effect), max 4; send it + a Spellcaster → draw N ===== */
fresh();
let kb=mk('魔法族の結界',0,'up'),vk=mk('マジシャンズ・ヴァルキリア',0,'up'),jr=mk('地割れ',1);
gameState.players[0].sz=[kb];gameState.players[0].mz=[vk];gameState.players[1].hand=[jr];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('C: 地割れ destroys the own face-up Spellcaster → 1 counter on the 結界',z(vk)==='grave'&&cnt(kb)===1,JSON.stringify([z(vk),cnt(kb),TRIG]));
audit('C');
/* C2: the opponent's Spellcaster destroyed by battle counts; a non-Spellcaster does not */
fresh();
kb=mk('魔法族の結界',0,'up');let ow=mk('ワイト',0,'up'),os=mk('マジシャンズ・ヴァルキリア',1,'up'),bw=mk('青眼の白龍',0,'up');
gameState.players[0].sz=[kb];gameState.players[0].mz=[bw,ow];gameState.players[1].mz=[os];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('C2: the opponent\'s face-up Spellcaster destroyed by battle → 1 counter',z(os)==='grave'&&cnt(kb)===1,JSON.stringify([z(os),cnt(kb)]));
fresh();
kb=mk('魔法族の結界',0,'up');ow=mk('ワイト',0,'up');jr=mk('地割れ',1);
gameState.players[0].sz=[kb];gameState.players[0].mz=[ow];gameState.players[1].hand=[jr];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('C2: a destroyed non-Spellcaster (ワイト) gives no counter',z(ow)==='grave'&&cnt(kb)===0,JSON.stringify([z(ow),cnt(kb)]));
audit('C2');
/* C3: maximum 4 */
fresh();
kb=withSC(mk('魔法族の結界',0,'up'),4);vk=mk('マジシャンズ・ヴァルキリア',0,'up');jr=mk('地割れ',1);
gameState.players[0].sz=[kb];gameState.players[0].mz=[vk];gameState.players[1].hand=[jr];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('C3: at 4 counters another destroyed Spellcaster adds none (max 4)',z(vk)==='grave'&&cnt(kb)===4,JSON.stringify([z(vk),cnt(kb)]));
audit('C3');
/* C4: send this card (3 counters) + a face-up Spellcaster → draw 3 */
fresh();
kb=withSC(mk('魔法族の結界',0,'up'),3);vk=mk('マジシャンズ・ヴァルキリア',0,'up');let ow2=mk('ワイト',0,'up');
gameState.players[0].sz=[kb];gameState.players[0].mz=[ow2,vk];baselineA();
const h0=gameState.players[0].hand.length;
PREFER=[vk.uid];duelActivateFromZone(0,'sz',idx(kb));drive();PREFER=[];
ok('C4: the 結界 and the Spellcaster sent to the GY (cost); drew 3 (= its counters); the non-Spellcaster stays',z(kb)==='grave'&&z(vk)==='grave'&&z(ow2)==='mz'&&gameState.players[0].hand.length===h0+3,JSON.stringify([z(kb),z(vk),z(ow2),gameState.players[0].hand.length]));
audit('C4');
/* C5 (negative): without counters, or without an own face-up Spellcaster, the second effect is not available */
fresh();
kb=mk('魔法族の結界',0,'up');vk=mk('マジシャンズ・ヴァルキリア',0,'up');gameState.players[0].sz=[kb];gameState.players[0].mz=[vk];baselineA();
ok('C5: no counters → not activatable',!legal('魔法族の結界',0,'sz',idx(kb)));
fresh();
kb=withSC(mk('魔法族の結界',0,'up'),2);ow2=mk('ワイト',0,'up');gameState.players[0].sz=[kb];gameState.players[0].mz=[ow2];baselineA();
ok('C5: counters but no own Spellcaster → not activatable',!legal('魔法族の結界',0,'sz',idx(kb)));

/* ===== D: デモニック・モーター・Ω — ① ATK +1000 (once per turn, Main Phase) ② destroyed at the End Phase if ① was used ③ own End Phase: モータートークン ===== */
fresh();
let om=mk('デモニック・モーター・Ω',0,'up');gameState.players[0].mz=[om];baselineA();
ok('D: Level 8, ATK 2800',curLV(C(om))===8&&curATK(C(om))===2800);
duelActivateFromZone(0,'mz',idx(om));drive();
ok('D: ① → ATK 3800',curATK(C(om))===3800,String(curATK(C(om))));
ok('D: once per turn',!legal('デモニック・モーター・Ω',0,'mz',idx(om)));
phase('end');
let mt=tokens(0,'モータートークン');
ok('D: End Phase → Ω destroyed (②) and a モータートークン special summoned (③)',z(om)==='grave'&&mt.length===1,JSON.stringify([z(om),mt.length,TRIG]));
ok('D: the token: Machine / EARTH / Level 1 / 200 / 200 in Attack Position',mt.length===1&&mt[0].pos==='atk'&&curATK(mt[0])===200&&curStat(mt[0],'def')===200&&curLV(mt[0])===1&&currentRaceV17(mt[0])==='機械',JSON.stringify(mt.map(t=>[t.pos,curATK(t),curLV(t)])));
audit('D');
/* D2 (negative): without ① there is no self-destruction, but ③ still summons the token; the opponent's End Phase gives no token */
fresh();
om=mk('デモニック・モーター・Ω',0,'up');gameState.players[0].mz=[om];baselineA();
phase('end');mt=tokens(0,'モータートークン');
ok('D2: ① not used → Ω stays; the End Phase token (③) is still special summoned',z(om)==='mz'&&mt.length===1,JSON.stringify([z(om),mt.length]));
audit('D2');
fresh();
om=mk('デモニック・モーター・Ω',1,'up');gameState.players[1].mz=[om];baselineA();
phase('end');
ok('D3: the opponent\'s Ω at MY End Phase: no token (③ is own End Phase only), no self-destruction',z(om)==='mz'&&tokens(1,'モータートークン').length===0&&tokens(0,'モータートークン').length===0,JSON.stringify([z(om),tokens(1,'モータートークン').length]));
audit('D3');

/* ===== E: レスキューロイド — an own 「ロイド」 destroyed by battle and sent to the GY returns to the hand ===== */
fresh();
let rs=mk('レスキューロイド',0,'up'),gy=mk('パトロイド',0,'up'),b1=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[rs,gy];gameState.players[1].mz=[b1];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:1});drive();
ok('E: パトロイド destroyed by battle → returned to the hand',z(gy)==='hand'&&z(rs)==='mz',JSON.stringify([z(gy),z(rs),TRIG]));
audit('E');
/* E2 (negative): a non-「ロイド」 monster; a 「ロイド」 destroyed by an effect; the opponent's 「ロイド」 */
fresh();
rs=mk('レスキューロイド',0,'up');let wt=mk('ワイト',0,'up');b1=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[rs,wt];gameState.players[1].mz=[b1];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:1});drive();
ok('E2: a non-「ロイド」 monster destroyed by battle stays in the GY',z(wt)==='grave'&&z(rs)==='mz',JSON.stringify([z(wt),z(rs)]));
audit('E2');
fresh();
rs=mk('レスキューロイド',0,'up');gy=mk('パトロイド',0,'up');jr=mk('地割れ',1);
gameState.players[0].mz=[rs,gy];gameState.players[1].hand=[jr];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('E3: a 「ロイド」 destroyed by an effect (not battle) stays in the GY',z(gy)==='grave'&&z(rs)==='mz',JSON.stringify([z(gy),z(rs)]));
audit('E3');
fresh();
rs=mk('レスキューロイド',0,'up');b1=mk('青眼の白龍',0,'up');let og=mk('パトロイド',1,'up');
gameState.players[0].mz=[rs,b1];gameState.players[1].mz=[og];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:1,target:0});drive();
ok('E4: the opponent\'s 「ロイド」 destroyed by battle is not returned (own field only)',z(og)==='grave'&&gameState.players[1].hand.length===0,JSON.stringify([z(og),gameState.players[1].hand.length]));
audit('E4');

/* ===== F: レプティレス・スポーン — banish a 「レプティレス」 from the GY (cost) → 2 レプティレストークン ===== */
fresh();
let sp=mk('レプティレス・スポーン',0),rv=mk('レプティレス・バイパー',0),rg=mk('レプティレス・ナージャ',0),ww=mk('ワイト',0);
gameState.players[0].hand=[sp];gameState.players[0].grave=[ww,rv,rg];baselineA();
PREFER=[rv.uid];duelActivateFromHand(0);drive();PREFER=[];
let rt=tokens(0,'レプティレストークン');
ok('F: the chosen 「レプティレス」 banished (cost); the other and the non-Reptiless stay in the GY',z(rv)==='banish'&&z(rg)==='grave'&&z(ww)==='grave',JSON.stringify([z(rv),z(rg),z(ww)]));
ok('F: 2 レプティレストークン special summoned (Reptile / EARTH / Level 1 / 0 / 0); the Spell went to the GY',rt.length===2&&rt.every(t=>curATK(t)===0&&curStat(t,'def')===0&&curLV(t)===1&&currentRaceV17(t)==='爬虫類')&&z(sp)==='grave',JSON.stringify([rt.length,z(sp)]));
audit('F');
/* F2 (negative): no 「レプティレス」 in the GY; fewer than 2 free Monster Zones */
fresh();
sp=mk('レプティレス・スポーン',0);ww=mk('ワイト',0);gameState.players[0].hand=[sp];gameState.players[0].grave=[ww];baselineA();
ok('F2: no 「レプティレス」 in the GY → not activatable',!legal('レプティレス・スポーン',0,'hand',0));
fresh();
sp=mk('レプティレス・スポーン',0);rv=mk('レプティレス・バイパー',0);
gameState.players[0].hand=[sp];gameState.players[0].grave=[rv];gameState.players[0].mz=Array.from({length:4},()=>mk('ワイト',0,'up'));baselineA();
ok('F2: only 1 free Monster Zone → not activatable',!legal('レプティレス・スポーン',0,'hand',0));
`);
