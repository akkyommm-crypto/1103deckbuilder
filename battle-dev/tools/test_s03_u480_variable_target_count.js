/* S03-U480: variable target cardinality is declared before target selection,
   filtered with that exact count, and journaled on the chain link. */
const harness=require('./astra_harness');
harness(String.raw`
const ARM='メタルシルバー・アーマー',OBE='オベリスクの巨神兵';
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);} function hit(c){return c&&findCardByUid(c.uid);} function zone(c){const h=hit(c);return h&&h.zone;}
function fresh(active,phase){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;gameState.activePlayer=active;gameState.firstPlayer=0;gameState.turn=5;gameState.phase=phase||'main1';gameState.rngInitialSeed=gameState.rngState=0x4800001;for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:8},()=>mk('ワイト',p));TOASTS.length=0;}
function armor(p){const host=mk('サイバー・ドラゴン',p,'up'),arm=mk(ARM,p,'up');gameState.players[p].mz.push(host);gameState.players[p].sz.push(arm);API.equipSpell(locateCardAnyV4(arm),locateCardAnyV4(host),'S03-U480');return {host,arm};}
function drive(stopName){for(let i=0;i<800;i++){if(pc())return 'choice';if(stopName&&gameState.chain.some(l=>l.name===stopName))return 'link';if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}return 'idle';}return 'loop';}
function chooseValue(n){const q=pc(),c=q&&q.candidates.find(c=>Number(c.value)===n);return !!c&&answerChoiceV49([c.key]);}
function chooseCards(cards){const q=pc(),uids=cards.map(c=>c.uid);return !!q&&answerChoiceV49(q.candidates.filter(c=>uids.includes(c.uid)).map(c=>c.key));}
function link(name){return gameState.chain.find(l=>l.name===name)||null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label,pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,180));}
function attackKaiku(withArmor){fresh(1,'battle');const P=gameState.players,k=mk('霊滅術師 カイクウ',1,'up'),victim=mk('はにわ',0,'up'),g1=mk('青眼の白龍',0),g2=mk('ホーリー・エルフ',0);P[1].mz=[k];P[0].mz=[victim];P[0].grave=[g1,g2];const ar=withArmor?armor(0):null;baselineA();requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:P[1].mz.indexOf(k),target:P[0].mz.indexOf(victim)});drive();return {k,victim,g1,g2,ar};}
function startGoldd(withArmor,obe){fresh(1);const P=gameState.players,dd=mk('手札抹殺',1,'down'),gold=mk('暗黒界の武神 ゴルド',0),a=mk('ゴブリン突撃部隊',1,'up'),b=mk('ギガンテス',1,'up'),c=mk(obe?OBE:'ライオウ',1,'up');dd.setTurn=2;P[1].sz=[dd];P[0].hand=[gold];P[1].hand=[mk('ワイト',1),mk('ワイト',1)];P[1].mz=[a,b,c];const ar=withArmor?armor(1):null;baselineA();duelActivateFromZone(1,'sz',0);drive();return {gold,a,b,c,ar};}

/* Contracts: fixed declarations stay fixed; only these two ranges exist. */
ok('contracts: Kaiku [1,2], Goldd [0,2], neither has a static targetCount:2',JSON.stringify(CARD_SCRIPTS['霊滅術師 カイクウ'].targetCountRange)==='[1,2]'&&JSON.stringify(CARD_SCRIPTS['暗黒界の武神 ゴルド'].targetCountRange)==='[0,2]'&&CARD_SCRIPTS['霊滅術師 カイクウ'].targetCount==null&&CARD_SCRIPTS['暗黒界の武神 ゴルド'].targetCount==null);
ok('contracts: zero is accepted for Goldd only, while Pot of Avarice keeps fixed five',targetEffectSourceS03(0,{name:'暗黒界の武神 ゴルド',targetCount:0}).targetCount===0&&targetEffectSourceS03(0,{name:'霊滅術師 カイクウ',targetCount:0}).targetCount===null&&targetEffectSourceS03(0,{name:'貪欲な壺',targetCount:0}).targetCount===5);

/* Kaiku one target: non-targeting count choice -> exact one target -> scalar on link. */
let x=attackKaiku(false),q=pc();
ok('Kaiku 1: count is chosen first and is not itself targeting',q&&/対象にする枚数/.test(q.title)&&q.targeting===false&&q.candidates.map(c=>c.value).join()==='1,2',JSON.stringify(q&&{t:q.title,tg:q.targeting,v:q.candidates.map(c=>c.value)}));
chooseValue(1);q=pc();ok('Kaiku 1: exact one-card target choice',q&&q.targeting===true&&q.min===1&&q.max===1,JSON.stringify(q&&{min:q.min,max:q.max,tg:q.targeting}));chooseCards([x.g1]);drive('霊滅術師 カイクウ');let l=link('霊滅術師 カイクウ');
ok('Kaiku 1: link journals targetCount 1 and one target uid',l&&l.targetCount===1&&linkTargetUidsS03(l).join()===String(x.g1.uid),JSON.stringify(l&&{n:l.targetCount,u:linkTargetUidsS03(l)}));drive();ok('Kaiku 1: selected monster is banished, the other remains',zone(x.g1)==='banish'&&zone(x.g2)==='grave');audit('Kaiku 1: Replay');

/* Kaiku two under Armor: multi-target exception; a one-target declaration aborts if insufficient. */
x=attackKaiku(true);chooseValue(2);q=pc();ok('Kaiku 2 + Armor: exact two-card choice keeps protected Graveyard monsters (multi-target exception)',q&&q.min===2&&q.max===2&&q.candidates.some(c=>c.uid===x.g1.uid)&&q.candidates.some(c=>c.uid===x.g2.uid),JSON.stringify(q&&q.candidates.map(c=>c.uid)));chooseCards([x.g1,x.g2]);drive('霊滅術師 カイクウ');l=link('霊滅術師 カイクウ');ok('Kaiku 2: link journals actual count 2',l&&l.targetCount===2&&linkTargetUidsS03(l).length===2);drive();ok('Kaiku 2: both declared targets are banished',zone(x.g1)==='banish'&&zone(x.g2)==='banish');audit('Kaiku 2: Replay');
x=attackKaiku(true);const before=V41_ACTION_JOURNAL.length;chooseValue(1);ok('Kaiku 1 + Armor: exact-one target filtering finds insufficient candidates and aborts without a link',!pc()&&!link('霊滅術師 カイクウ')&&V41_ACTION_JOURNAL.slice(before).some(e=>e.action.type==='PREP_TX_ABORT_S03'),JSON.stringify({toast:TOASTS.slice(-1),types:V41_ACTION_JOURNAL.slice(before).map(e=>e.action.type+':'+(e.action.reason||'')),chain:gameState.chain.map(l=>l.name)}));

/* Goldd zero remains a real option and is journaled. */
x=startGoldd(false,false);q=pc();ok('Goldd 0: count choice offers 0,1,2 before any target choice',q&&q.targeting===false&&q.candidates.map(c=>c.value).join()==='0,1,2',JSON.stringify(q&&q.candidates.map(c=>c.value)));chooseValue(0);drive('暗黒界の武神 ゴルド');l=link('暗黒界の武神 ゴルド');ok('Goldd 0: link journals scalar 0 with no targets',l&&l.targetCount===0&&linkTargetUidsS03(l).length===0,JSON.stringify(l&&{n:l.targetCount,u:linkTargetUidsS03(l)}));drive();ok('Goldd 0 resolves: Goldd is summoned and no opponent card is destroyed',zone(x.gold)==='mz'&&zone(x.a)==='mz'&&zone(x.b)==='mz');audit('Goldd 0: Replay');

/* One target remains restricted by Armor; two targets receive only Armor's multi exception. */
x=startGoldd(true,false);chooseValue(1);q=pc();ok('Goldd 1 + Armor: exact-one choice excludes protected monsters (the equipped host and non-monster Armor remain legal)',q&&q.min===1&&q.max===1&&q.candidates.some(c=>c.uid===x.ar.host.uid)&&q.candidates.some(c=>c.uid===x.ar.arm.uid)&&!q.candidates.some(c=>c.uid===x.a.uid||c.uid===x.b.uid||c.uid===x.c.uid),JSON.stringify(q&&q.candidates.map(c=>c.uid)));chooseCards([x.ar.host]);drive('暗黒界の武神 ゴルド');l=link('暗黒界の武神 ゴルド');ok('Goldd 1: link journals count 1',l&&l.targetCount===1&&linkTargetUidsS03(l).length===1);drive();ok('Goldd 1: chosen equipped monster is destroyed; protected others remain',zone(x.ar.host)==='grave'&&zone(x.a)==='mz'&&zone(x.b)==='mz');audit('Goldd 1: Replay');
x=startGoldd(true,false);chooseValue(2);q=pc();ok('Goldd 2 + Armor: protected non-equipped cards are offered by the multi-target exception',q&&q.min===2&&q.max===2&&q.candidates.some(c=>c.uid===x.a.uid)&&q.candidates.some(c=>c.uid===x.b.uid),JSON.stringify(q&&q.candidates.map(c=>c.uid)));chooseCards([x.a,x.b]);drive('暗黒界の武神 ゴルド');l=link('暗黒界の武神 ゴルド');
ok('Goldd 2: link journals count 2 and survives JSON round-trip',l&&l.targetCount===2&&JSON.parse(JSON.stringify(l)).targetCount===2&&linkTargetUidsS03(l).length===2,JSON.stringify(l&&{n:l.targetCount,u:linkTargetUidsS03(l)}));
API.destroy(locateCardAnyV4(x.a),'U480 response removes one target');ok('Goldd 2: losing a target after activation does not change the original count',l.targetCount===2&&zone(x.a)==='grave');
saveDuel();const saved=localStorage.getItem(DUEL_SAVE_KEY);resetA();localStorage.setItem(DUEL_SAVE_KEY,saved);const resumed=offerResumeDuel();l=link('暗黒界の武神 ゴルド');ok('Goldd 2 Save/Load: link retains scalar count 2 and both original target references',resumed&&l&&l.targetCount===2&&linkTargetUidsS03(l).length===2);drive();ok('Goldd 2 resolves after one target was lost: remaining target is destroyed and Goldd is summoned',zone(x.b)==='grave'&&zone(x.gold)==='mz');audit('Goldd 2 lost target + Save/Load: Replay');

/* Other immunity is unaffected: Obelisk stays excluded even when count is two. */
x=startGoldd(false,true);chooseValue(2);q=pc();ok('Goldd 2 + other immunity: Obelisk is still excluded (only Armor reads the multi-target contract)',q&&q.targeting===true&&!q.candidates.some(c=>c.uid===x.c.uid)&&q.candidates.some(c=>c.uid===x.a.uid)&&q.candidates.some(c=>c.uid===x.b.uid),JSON.stringify(q&&q.candidates.map(c=>c.uid)));

/* Generic commit guard: a dynamic effect cannot journal a count different from selected targets. */
const fake={player:0,uid:x.gold.uid,name:'暗黒界の武神 ゴルド',from:'grave',index:0,ss:1,effectClass:null,keep:true};
const chainBefore=gameState.chain.length;ok('generic guard: wrong count/selection mismatch is rejected without a CHAIN_ADD',commitPreparedActivationV11(fake,{targets:[locateCardAnyV4(x.a)],targetCount:2})===false&&gameState.chain.length===chainBefore);
globalThis.__R=R;
`);
