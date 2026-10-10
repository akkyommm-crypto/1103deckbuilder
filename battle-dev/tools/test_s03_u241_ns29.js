/* S03-U241: NOT_STARTED → TESTED — 宝玉の双璧, ジェムナイト・エメラル, ドラゴニック・ガード, インフェルニティガン, ナチュラル・ディザスター, ヒーロー逆襲.
   Real DUEL paths (attacks, Normal Summons, Spell / Trap / ignition activations), Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
const DC='ドラゴニック',FOG='フォッグ';
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;TRIG.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5341a5e5;
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
function lp(p){return gameState.players[p].lp;}
function sz(p){return gameState.players[p].sz;}
function idx(c){return findCardByUid(c.uid).index;}
function legal(name,p,zone,i){return strictScriptLegalityV2(name,p,zone,i,{}).ok;}
function placed(c){const hh=findCardByUid(c.uid);return !!hh&&hh.zone==='sz'&&!!hh.card.asSpellS03&&hh.card.face==='up';}
function dc(c){return API.countCounter(h(C(c)),DC);}
function fog(c){return API.countCounter(findCardByUid(c.uid),FOG);}
function setTrap(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function atk(p,i,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:i,target:t});drive();}

/* ===== A: 宝玉の双璧 — an own 宝玉獣 destroyed by battle and sent to the GY: a 宝玉獣 from the Deck placed; battle damage 0 for the rest of the turn ===== */
fresh();
let wl=setTrap('宝玉の双璧',0),tp=mk('宝玉獣 トパーズ・タイガー',0,'up'),dt=mk('宝玉獣 コバルト・イーグル',0),be=mk('青眼の白龍',1,'up'),ow=mk('エーリアン・ソルジャー',1,'up'),mw=mk('ワイト',0,'up');
gameState.players[0].sz=[wl];gameState.players[0].mz=[tp,mw];gameState.players[0].deck.push(dt);gameState.players[1].mz=[be,ow];gameState.activePlayer=1;gameState.phase='battle';baselineA();
PREFER=['decline',dt.uid];atk(1,0,0);PREFER=[];
ok('A: the 宝玉獣 went to the GY (declined to place), 1400 battle damage taken; 宝玉の双璧 activated: コバルト・イーグル from the Deck placed as a Continuous Spell',z(tp)==='grave'&&lp(0)===8000-1400&&placed(dt)&&z(wl)==='grave',JSON.stringify({tp:z(tp),dt:z(dt),wl:z(wl),lp0:lp(0),TRIG}));
atk(1,1,idx(mw));
ok('A: this turn the controller\'s battle damage is 0 (エーリアン・ソルジャー 1900 destroys ワイト 300, no damage)',z(mw)==='grave'&&lp(0)===8000-1400,JSON.stringify({mw:z(mw),lp0:lp(0)}));
audit('A');
/* A2 (negative): the 宝玉獣 was placed instead of being sent to the GY — never 「墓地へ送られた」: no activation */
fresh();
wl=setTrap('宝玉の双璧',0);tp=mk('宝玉獣 トパーズ・タイガー',0,'up');dt=mk('宝玉獣 コバルト・イーグル',0);be=mk('青眼の白龍',1,'up');ow=mk('エーリアン・ソルジャー',1,'up');mw=mk('ワイト',0,'up');
gameState.players[0].sz=[wl];gameState.players[0].mz=[tp,mw];gameState.players[0].deck.push(dt);gameState.players[1].mz=[be,ow];gameState.activePlayer=1;gameState.phase='battle';baselineA();
PREFER=['place:'+tp.uid];atk(1,0,0);PREFER=[];
ok('A2: placed as a Continuous Spell instead of the GY → 宝玉の双璧 not activated (still Set, Deck card stays)',placed(tp)&&z(wl)==='sz'&&C(wl).face==='down'&&z(dt)==='deck'&&TRIG.every(t=>t.indexOf('宝玉の双璧')<0),JSON.stringify({tp:z(tp),wl:z(wl),dt:z(dt),TRIG}));
atk(1,1,idx(mw));
ok('A2: no protection — the second battle deals 1600',z(mw)==='grave'&&lp(0)===8000-1400-1600,JSON.stringify({lp0:lp(0)}));
audit('A2');
/* A3 (negative): a non-宝玉獣 destroyed by battle */
fresh();
wl=setTrap('宝玉の双璧',0);let wt=mk('ワイト',0,'up');be=mk('青眼の白龍',1,'up');
gameState.players[0].sz=[wl];gameState.players[0].mz=[wt];gameState.players[1].mz=[be];gameState.activePlayer=1;gameState.phase='battle';baselineA();
atk(1,0,0);
ok('A3: a destroyed ワイト does not enable 宝玉の双璧',z(wt)==='grave'&&z(wl)==='sz'&&lp(0)===8000-2700,JSON.stringify({wt:z(wt),wl:z(wl),lp0:lp(0),TRIG}));
audit('A3');
/* A4: no 宝玉獣 left in the Deck — still activated (no target, no cost): the damage part applies */
fresh();
wl=setTrap('宝玉の双璧',0);tp=mk('宝玉獣 トパーズ・タイガー',0,'up');be=mk('青眼の白龍',1,'up');ow=mk('エーリアン・ソルジャー',1,'up');mw=mk('ワイト',0,'up');
gameState.players[0].sz=[wl];gameState.players[0].mz=[tp,mw];gameState.players[1].mz=[be,ow];gameState.activePlayer=1;gameState.phase='battle';baselineA();
PREFER=['decline'];atk(1,0,0);PREFER=[];atk(1,1,idx(mw));
ok('A4: no 宝玉獣 in the Deck — 宝玉の双璧 still used (to the GY), the following damage is 0',z(wl)==='grave'&&z(mw)==='grave'&&lp(0)===8000-1400,JSON.stringify({wl:z(wl),lp0:lp(0),TRIG}));
audit('A4');

/* ===== B: ジェムナイト・エメラル — banish a face-up Normal Monster + itself (cost) → special summon a 「ジェムナイト」 Fusion Monster from the GY ===== */
fresh();
let em=mk('ジェムナイト・エメラル',0,'up'),nm=mk('青眼の白龍',0,'up'),ru=mk('ジェムナイト・ルビーズ',0),ef=mk('ブラック・マジシャン',0,'up');ru.properlySummonedS03=true;
gameState.players[0].mz=[em,nm];gameState.players[0].grave=[ru];baselineA();
PREFER=[nm.uid,ru.uid];duelActivateFromZone(0,'mz',idx(em));drive();PREFER=[];
ok('B: エメラル and 青眼の白龍 banished (cost); ジェムナイト・ルビーズ special summoned from the GY',z(em)==='banish'&&z(nm)==='banish'&&z(ru)==='mz'&&C(ru).face==='up',JSON.stringify({em:z(em),nm:z(nm),ru:z(ru)}));
audit('B');
/* B2 (negative): the Fusion Monster was never properly summoned — not a target (U127); a non-Normal / face-down Normal cannot be the cost */
fresh();
em=mk('ジェムナイト・エメラル',0,'up');nm=mk('青眼の白龍',0,'up');ru=mk('ジェムナイト・ルビーズ',0);
gameState.players[0].mz=[em,nm];gameState.players[0].grave=[ru];baselineA();
ok('B2: ルビーズ not properly summoned → not activatable',!legal('ジェムナイト・エメラル',0,'mz',idx(em)));
fresh();
em=mk('ジェムナイト・エメラル',0,'up');ef=mk('ブラック・マジシャン',0,'down');let ef2=mk('エーリアン・ソルジャー',0,'up'),ru2=mk('ジェムナイト・パーズ',0);ru2.properlySummonedS03=true;
gameState.players[0].mz=[em,ef,ef2];gameState.players[0].grave=[ru2];baselineA();
ok('B2: a face-down Normal does not count, but the face-up エーリアン・ソルジャー is enough',legal('ジェムナイト・エメラル',0,'mz',idx(em)));
fresh();
em=mk('ジェムナイト・エメラル',0,'up');ef=mk('ブラック・マジシャン',0,'down');ru2=mk('ジェムナイト・パーズ',0);ru2.properlySummonedS03=true;let gk=mk('E・HERO ワイルドマン',0,'up');
gameState.players[0].mz=[em,ef,gk];gameState.players[0].grave=[ru2];baselineA();
ok('B2: only a face-down Normal and an Effect Monster on the field → not activatable',!legal('ジェムナイト・エメラル',0,'mz',idx(em)));
fresh();
em=mk('ジェムナイト・エメラル',0,'up');nm=mk('青眼の白龍',0,'up');let nf=mk('E・HERO フェザーマン',0,'up');ru2=mk('ジェムナイト・パーズ',0);ru2.properlySummonedS03=true;let nfu=mk('ワイト',0,'up');
gameState.players[0].mz=[em,nm,nf,nfu];gameState.players[0].grave=[ru2];baselineA();
ok('B2: 4 monsters on the field, a properly summoned Fusion in the GY → activatable',legal('ジェムナイト・エメラル',0,'mz',idx(em)));
fresh();
em=mk('ジェムナイト・エメラル',0,'up');nm=mk('青眼の白龍',0,'up');ru2=mk('ブラック・マジシャン',0);
gameState.players[0].mz=[em,nm];gameState.players[0].grave=[ru2];baselineA();
ok('B2: no 「ジェムナイト」 Fusion Monster in the GY → not activatable',!legal('ジェムナイト・エメラル',0,'mz',idx(em)));

/* ===== C: ドラゴニック・ガード — a counter for each Normal Summon (either player); send itself → a Dragon of Level ≤ the counters from the Deck ===== */
fresh();
let dg=mk('ドラゴニック・ガード',0,'up'),h1=mk('ワイト',0),fd=mk('ガード・オブ・フレムベル',0),bd=mk('ベビードラゴン',0),sd=mk('サファイアドラゴン',0);
gameState.players[0].mz=[dg];gameState.players[0].hand=[h1];gameState.players[0].deck.push(fd,bd,sd);baselineA();
doNormalSummon(0,'atk');drive();
ok('C: an own Normal Summon → 1 Dragonic Counter',z(h1)==='mz'&&dc(dg)===1,JSON.stringify({n:dc(dg),TRIG}));
PREFER=[bd.uid,fd.uid];duelActivateFromZone(0,'mz',idx(dg));drive();PREFER=[];
ok('C: sent itself to the GY (cost); with 1 counter only Level 1 ガード・オブ・フレムベル qualifies — special summoned; the Level 3 / 4 Dragons stay in the Deck',z(dg)==='grave'&&z(fd)==='mz'&&z(bd)==='deck'&&z(sd)==='deck',JSON.stringify({dg:z(dg),fd:z(fd),bd:z(bd),sd:z(sd)}));
audit('C');
/* C2: the opponent's Normal Summon counts; a Set monster is not summoned */
fresh();
dg=mk('ドラゴニック・ガード',0,'up');h1=mk('ワイト',1);let h2=mk('ギル・ガース',1);
gameState.players[0].mz=[dg];gameState.players[1].hand=[h1,h2];gameState.activePlayer=1;baselineA();
doNormalSummon(0,'atk');drive();
ok('C2: the opponent\'s Normal Summon → 1 counter',z(h1)==='mz'&&dc(dg)===1,JSON.stringify({n:dc(dg)}));
audit('C2');
fresh();
dg=mk('ドラゴニック・ガード',0,'up');h1=mk('ワイト',0);gameState.players[0].mz=[dg];gameState.players[0].hand=[h1];baselineA();
doSetMonster(0);drive();
ok('C2: a Set monster is not a Normal Summon → no counter',z(h1)==='mz'&&C(h1).face==='down'&&dc(dg)===0,JSON.stringify({n:dc(dg),f:C(h1).face}));
audit('C2b');
/* C3: the Level limit follows the counters */
fresh();
dg=mk('ドラゴニック・ガード',0,'up');bd=mk('ベビードラゴン',0);sd=mk('サファイアドラゴン',0);
dg.counters={[DC]:2};gameState.players[0].mz=[dg];gameState.players[0].deck.push(bd,sd);baselineA();
ok('C3: 2 counters — no Dragon of Level 2 or lower in the Deck (Level 3 / 4) → not activatable',!legal('ドラゴニック・ガード',0,'mz',idx(dg)));
fresh();
dg=mk('ドラゴニック・ガード',0,'up');bd=mk('ベビードラゴン',0);sd=mk('サファイアドラゴン',0);let gz=mk('ギル・ガース',0);
dg.counters={[DC]:3};gameState.players[0].mz=[dg];gameState.players[0].deck.push(gz,bd,sd);baselineA();
PREFER=[sd.uid,bd.uid];duelActivateFromZone(0,'mz',idx(dg));drive();PREFER=[];
ok('C3: 3 counters — Level 3 ベビードラゴン special summoned (the Level 4 Dragon and the Level 4 non-Dragon are not offered)',z(bd)==='mz'&&z(sd)==='deck'&&z(gz)==='deck'&&z(dg)==='grave',JSON.stringify({bd:z(bd),sd:z(sd),gz:z(gz)}));
audit('C3');
fresh();
dg=mk('ドラゴニック・ガード',0,'up');bd=mk('ベビードラゴン',0);sd=mk('サファイアドラゴン',0);
dg.counters={[DC]:4};gameState.players[0].mz=[dg];gameState.players[0].deck.push(bd,sd);baselineA();
PREFER=[sd.uid];duelActivateFromZone(0,'mz',idx(dg));drive();PREFER=[];
ok('C3: 4 counters — the Level 4 サファイアドラゴン can be chosen',z(sd)==='mz'&&z(bd)==='deck',JSON.stringify({sd:z(sd),bd:z(bd)}));
audit('C3b');
fresh();
dg=mk('ドラゴニック・ガード',0,'up');bd=mk('ベビードラゴン',0);gameState.players[0].mz=[dg];gameState.players[0].deck.push(bd);baselineA();
ok('C3: no counter → not activatable',!legal('ドラゴニック・ガード',0,'mz',idx(dg)));

/* ===== D: インフェルニティガン — activated from the hand; ① send an 「インフェルニティ」 from the hand (once per turn); ② with an empty hand send itself → up to 2 from the GY ===== */
fresh();
let gn=mk('インフェルニティガン',0),kn=mk('インフェルニティ・ナイト',0),bs=mk('インフェルニティ・ビースト',0),dd=mk('インフェルニティ・デス・ドラゴン',0),wt1=mk('ワイト',0);
gameState.players[0].hand=[gn,kn,wt1];gameState.players[0].grave=[bs,dd];baselineA();
duelActivateFromHand(0);drive();
ok('D: activated from the hand — stays face-up in the Spell & Trap Zone',z(gn)==='sz'&&C(gn).face==='up',JSON.stringify({gn:z(gn)}));
ok('D: ① available (an 「インフェルニティ」 in the hand)',legal('インフェルニティガン',0,'sz',idx(gn)));
PREFER=[kn.uid];duelActivateFromZone(0,'sz',idx(gn));drive();PREFER=[];
ok('D: ① sent the 「インフェルニティ」 ナイト from the hand to the GY; the non-Infernity ワイト stays',z(kn)==='grave'&&z(wt1)==='hand',JSON.stringify({kn:z(kn),wt1:z(wt1)}));
ok('D: ① is once per turn; ② still needs an empty hand (ワイト in the hand) → not activatable',!legal('インフェルニティガン',0,'sz',idx(gn)));
audit('D');
/* D2: ② — empty hand */
fresh();
gn=mk('インフェルニティガン',0,'up');kn=mk('インフェルニティ・ナイト',0);bs=mk('インフェルニティ・ビースト',0);dd=mk('インフェルニティ・デス・ドラゴン',0);wt1=mk('ワイト',0);let mr=mk('インフェルニティ・ミラージュ',0);
gameState.players[0].sz=[gn];gameState.players[0].grave=[kn,bs,dd,wt1,mr];baselineA();
PREFER=[kn.uid,bs.uid];duelActivateFromZone(0,'sz',idx(gn));drive();PREFER=[];
ok('D2: empty hand → sent itself (cost); ナイト and ビースト special summoned (2 targets); the Synchro デス・ドラゴン (never properly summoned) and ミラージュ stay in the GY',z(gn)==='grave'&&z(kn)==='mz'&&z(bs)==='mz'&&z(dd)==='grave'&&z(mr)==='grave'&&z(wt1)==='grave',JSON.stringify({gn:z(gn),kn:z(kn),bs:z(bs),dd:z(dd),mr:z(mr),TRIG}));
audit('D2');
/* D3 (negative): cards in the hand; no 「インフェルニティ」 in the hand / the GY */
fresh();
gn=mk('インフェルニティガン',0,'up');kn=mk('インフェルニティ・ナイト',0);wt1=mk('ワイト',0);
gameState.players[0].sz=[gn];gameState.players[0].hand=[wt1];gameState.players[0].grave=[kn];baselineA();
ok('D3: ワイト in the hand — ② not activatable, ① has no 「インフェルニティ」 in the hand',!legal('インフェルニティガン',0,'sz',idx(gn)));
fresh();
gn=mk('インフェルニティガン',0,'up');wt1=mk('ワイト',0);gameState.players[0].sz=[gn];gameState.players[0].grave=[wt1];baselineA();
ok('D3: empty hand but no 「インフェルニティ」 in the GY → not activatable',!legal('インフェルニティガン',0,'sz',idx(gn)));
fresh();
gn=mk('インフェルニティガン',0,'up');dd=mk('インフェルニティ・デス・ドラゴン',0);gameState.players[0].sz=[gn];gameState.players[0].grave=[dd];baselineA();
ok('D3: only the never properly summoned Synchro in the GY → not activatable',!legal('インフェルニティガン',0,'sz',idx(gn)));

/* ===== E: ナチュラル・ディザスター — a 「雲魔物」 monster effect destroys an opponent's card and sends it to the GY → 500 damage each time ===== */
fresh();
let ds=setTrap('ナチュラル・ディザスター',0),ki=mk('雲魔物－キロスタス',0,'up'),bw=mk('青眼の白龍',1,'up');ki.counters={[FOG]:2};
gameState.players[0].sz=[ds];gameState.players[0].mz=[ki];gameState.players[1].mz=[bw];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('E: activated (face-up Continuous Trap)',C(ds).face==='up'&&z(ds)==='sz',JSON.stringify({f:C(ds).face}));
PREFER=[bw.uid];duelActivateFromZone(0,'mz',idx(ki));drive();PREFER=[];
ok('E: キロスタス destroys 青眼 → 500 damage to the opponent',z(bw)==='grave'&&lp(1)===7500&&lp(0)===8000,JSON.stringify({bw:z(bw),lp1:lp(1),TRIG}));
audit('E');
/* E2: アシッド・クラウド destroying an opponent's Spell / Trap also counts */
fresh();
ds=mk('ナチュラル・ディザスター',0,'up');let ac=mk('雲魔物－アシッド・クラウド',0,'up'),tr=setTrap('サイクロン',1);ac.counters={[FOG]:2};
gameState.players[0].sz=[ds];gameState.players[0].mz=[ac];gameState.players[1].sz=[tr];baselineA();
PREFER=[tr.uid];duelActivateFromZone(0,'mz',idx(ac));drive();PREFER=[];
ok('E2: a destroyed Set Trap sent to the GY by アシッド・クラウド → 500 damage',z(tr)==='grave'&&lp(1)===7500,JSON.stringify({tr:z(tr),lp1:lp(1)}));
audit('E2');
/* E3 (negative): an own card destroyed by a 「雲魔物」 effect; a destroying effect that is not a 「雲魔物」 monster's; battle destruction; face-down */
fresh();
ds=mk('ナチュラル・ディザスター',0,'up');ki=mk('雲魔物－キロスタス',0,'up');ow=mk('ワイト',0,'up');ki.counters={[FOG]:2};
gameState.players[0].sz=[ds];gameState.players[0].mz=[ki,ow];baselineA();
PREFER=[ow.uid];duelActivateFromZone(0,'mz',idx(ki));drive();PREFER=[];
ok('E3: own ワイト destroyed by キロスタス → no damage to anyone',z(ow)==='grave'&&lp(0)===8000&&lp(1)===8000,JSON.stringify({ow:z(ow),lp0:lp(0),lp1:lp(1)}));
audit('E3');
fresh();
ds=mk('ナチュラル・ディザスター',0,'up');let cy=mk('サイクロン',0);tr=setTrap('サイクロン',1);
gameState.players[0].sz=[ds];gameState.players[0].hand=[cy];gameState.players[1].sz=[tr];baselineA();
PREFER=[tr.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('E3: サイクロン (not a 「雲魔物」 monster) destroys the opponent\'s Trap → no damage',z(tr)==='grave'&&lp(1)===8000,JSON.stringify({tr:z(tr),lp1:lp(1),TRIG}));
audit('E3b');
fresh();
ds=mk('ナチュラル・ディザスター',0,'up');ki=mk('雲魔物－キロスタス',0,'up');bw=mk('ワイト',1,'up');
gameState.players[0].sz=[ds];gameState.players[0].mz=[ki];gameState.players[1].mz=[bw];gameState.phase='battle';baselineA();
atk(0,0,0);
ok('E3: キロスタス (900) destroys ワイト (300) by battle (not by an effect) → only the 600 battle damage, no 500',z(bw)==='grave'&&lp(1)===8000-600&&lp(0)===8000,JSON.stringify({bw:z(bw),lp0:lp(0),lp1:lp(1),TRIG}));
audit('E3c');
fresh();
ds=setTrap('ナチュラル・ディザスター',0);ki=mk('雲魔物－キロスタス',0,'up');bw=mk('青眼の白龍',1,'up');ki.counters={[FOG]:2};
gameState.players[0].sz=[ds];gameState.players[0].mz=[ki];gameState.players[1].mz=[bw];baselineA();
PREFER=[bw.uid];duelActivateFromZone(0,'mz',idx(ki));drive();PREFER=[];
ok('E3: still Set (not activated) → no damage',z(bw)==='grave'&&lp(1)===8000&&C(ds).face==='down',JSON.stringify({lp1:lp(1)}));
audit('E3d');

/* ===== F: ヒーロー逆襲 — an own 「E・HERO」 destroyed by battle: a random hand card; an 「E・HERO」 monster → destroy an opponent's monster and special summon it ===== */
fresh();
let hr=setTrap('ヒーロー逆襲',0),cl=mk('E・HERO クレイマン',0,'up'),fm=mk('E・HERO フェザーマン',0);be=mk('青眼の白龍',1,'up');ow=mk('ワイト',1,'up');
gameState.players[0].sz=[hr];gameState.players[0].mz=[cl];gameState.players[0].hand=[fm];gameState.players[1].mz=[be,ow];gameState.activePlayer=1;gameState.phase='battle';baselineA();
PREFER=[ow.uid];atk(1,0,0);PREFER=[];
ok('F: クレイマン destroyed by battle; the random pick was フェザーマン (the only card): ワイト destroyed (chosen by the activating player), フェザーマン special summoned',z(cl)==='grave'&&z(ow)==='grave'&&z(fm)==='mz'&&C(fm).face==='up'&&z(be)==='mz'&&z(hr)==='grave',JSON.stringify({cl:z(cl),ow:z(ow),fm:z(fm),be:z(be),hr:z(hr),TRIG}));
audit('F');
/* F2 (negative): the random pick is not an 「E・HERO」 monster card */
fresh();
hr=setTrap('ヒーロー逆襲',0);cl=mk('E・HERO クレイマン',0,'up');wt1=mk('ワイト',0);be=mk('青眼の白龍',1,'up');ow=mk('ワイト',1,'up');
gameState.players[0].sz=[hr];gameState.players[0].mz=[cl];gameState.players[0].hand=[wt1];gameState.players[1].mz=[be,ow];gameState.activePlayer=1;gameState.phase='battle';baselineA();
PREFER=[ow.uid];atk(1,0,0);PREFER=[];
ok('F2: the pick (ワイト) is not an 「E・HERO」 → nothing destroyed, nothing summoned; ヒーロー逆襲 is used up',z(cl)==='grave'&&z(be)==='mz'&&z(ow)==='mz'&&z(wt1)==='hand'&&z(hr)==='grave',JSON.stringify({be:z(be),ow:z(ow),wt1:z(wt1),hr:z(hr),TRIG}));
audit('F2');
/* F3 (negative): a non-「E・HERO」 destroyed; the opponent's 「E・HERO」 destroyed; Set 「E・HERO」 trap not offered when it is destroyed by an effect */
fresh();
hr=setTrap('ヒーロー逆襲',0);wt1=mk('ワイト',0,'up');fm=mk('E・HERO フェザーマン',0);be=mk('青眼の白龍',1,'up');
gameState.players[0].sz=[hr];gameState.players[0].mz=[wt1];gameState.players[0].hand=[fm];gameState.players[1].mz=[be];gameState.activePlayer=1;gameState.phase='battle';baselineA();
atk(1,0,0);
ok('F3: a destroyed non-「E・HERO」 monster does not enable ヒーロー逆襲',z(wt1)==='grave'&&z(hr)==='sz'&&z(fm)==='hand',JSON.stringify({hr:z(hr),TRIG}));
audit('F3');
fresh();
hr=setTrap('ヒーロー逆襲',0);fm=mk('E・HERO フェザーマン',0);let oh=mk('E・HERO クレイマン',1,'up');bw=mk('青眼の白龍',0,'up');
gameState.players[0].sz=[hr];gameState.players[0].mz=[bw];gameState.players[0].hand=[fm];gameState.players[1].mz=[oh];gameState.phase='battle';baselineA();
atk(0,0,0);
ok('F3: the opponent\'s 「E・HERO」 destroyed by battle → not applicable (own field only)',z(oh)==='grave'&&z(hr)==='sz'&&z(fm)==='hand',JSON.stringify({hr:z(hr),TRIG}));
audit('F3b');
`);
