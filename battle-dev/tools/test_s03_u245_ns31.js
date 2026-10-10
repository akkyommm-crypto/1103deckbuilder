/* S03-U245: 寡黙なるサイコプリースト, 沈黙のサイコウィザード, 疾風!凶殺陣, 風雲カラクリ城, 底なし流砂, 化石発掘.
   Real DUEL paths (summons, ignition / trigger activations, attacks, spells destroying cards, phase changes), each scenario Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;TRIG.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
function base(){gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();}
let PREFER=[],TRIG=[];
function step(){const q=pc();if(q){if(q.max>1){answerChoiceV49(q.candidates.slice(0,Math.min(q.max,q.candidates.length)).map(x=>x.key));return true;}let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
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
function legal(name,p,zone,i){return strictScriptLegalityV2(name,p,zone,i,{}).ok;}
function atk(p,i,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:i,target:t});drive();}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function eff(name,key){return (nativeEffectsV4(name)||[]).find(e=>e.key===key);}
function names(arr){return arr.map(c=>cardName(c));}
function mzNames(p){return names(gameState.players[p].mz);}
const KEY='psyBanishedS03U245';

/* ===== 0: static facts ===== */
ok('0: Priest — banish is optional (ignition), the position change and the revive are forced; 1 optional + 2 forced effects',
   eff('寡黙なるサイコプリースト','to-defense')?.forced===true&&eff('寡黙なるサイコプリースト','revive-banished')?.forced===true&&!eff('寡黙なるサイコプリースト','banish-psychic')?.forced);
ok('0: Wizard — the summon banish is optional, the revive is forced',
   !eff('沈黙のサイコウィザード','summon-banish')?.forced&&eff('沈黙のサイコウィザード','revive-banished')?.forced===true);
ok('0: the record key is NOT zone-local (it must survive the trip field → GY)',ZONE_LOCAL_KEYS.indexOf(KEY)<0);

/* ===== P: 寡黙なるサイコプリースト ===== */
/* P1: Normal Summon → Defense Position (forced) */
fresh();
let pr=mk('寡黙なるサイコプリースト',0);gameState.players[0].hand=[pr];base();
doNormalSummon(0,'atk');drive();
ok('P1: Normal Summoned → Defense Position (forced trigger)',z(pr)==='mz'&&C(pr).pos==='def',JSON.stringify({z:z(pr),pos:z(pr)==='mz'?C(pr).pos:null,TRIG}));
audit('P1');
/* P2: Flip Summon → Defense Position; Special Summon → stays in Attack Position (negative) */
fresh();
pr=setT('寡黙なるサイコプリースト',0);pr.pos='def';gameState.players[0].mz=[pr];base();
doFlipUp(0,'mz',0,'atk');drive();
ok('P2: Flip Summoned (as Attack Position) → Defense Position',z(pr)==='mz'&&C(pr).face==='up'&&C(pr).pos==='def',JSON.stringify({pos:C(pr).pos,TRIG}));
audit('P2');
fresh();
pr=mk('寡黙なるサイコプリースト',0);let rv=mk('死者蘇生',0);gameState.players[0].hand=[rv];gameState.players[0].grave=[pr];base();
PREFER=[pr.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('P2: Special Summoned (死者蘇生) → no position change, stays in Attack Position',z(pr)==='mz'&&C(pr).pos==='atk'&&TRIG.every(t=>t.indexOf('寡黙')<0),JSON.stringify({pos:z(pr)==='mz'?C(pr).pos:null,TRIG}));
audit('P2b');
/* P3: ignition — send 1 hand card (cost), banish 1 Psychic from the GY, recorded on the card; once per turn */
fresh();
pr=mk('寡黙なるサイコプリースト',0,'up','def');let hd=mk('ワイト',0),hd2=mk('ベビードラゴン',0),cb=mk('カバリスト',0),sg=mk('サイ・ガール',0);
gameState.players[0].mz=[pr];gameState.players[0].hand=[hd,hd2];gameState.players[0].grave=[cb,sg];base();
PREFER=[hd.uid,cb.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('P3: cost — the chosen hand card (ワイト) was sent to the GY (not discarded as an effect: it is in the GY)',z(hd)==='grave'&&z(hd2)==='hand',JSON.stringify({hd:z(hd),hd2:z(hd2),TRIG}));
ok('P3: the chosen Psychic (カバリスト) is banished, the other (サイ・ガール) stays in the GY',z(cb)==='banish'&&z(sg)==='grave',JSON.stringify({cb:z(cb),sg:z(sg)}));
ok('P3: the banished uid is recorded on the Priest (journaled card flag)',Array.isArray(C(pr)[KEY])&&(C(pr)[KEY]||[]).length===1&&C(pr)[KEY][0]===cb.uid,JSON.stringify(C(pr)[KEY]));
ok('P3: once per turn — not activatable again',!legal('寡黙なるサイコプリースト',0,'mz',0));
audit('P3');
/* P4: sent from the field to the GY → special summon the monster banished by its effect (forced); a Psychic banished otherwise stays */
let other=mk('サイ・ガール',0);gameState.players[0].banish.push(other);
gameState.activePlayer=0;gameState.phase='main2';
let bh=mk('ブラック・ホール',0);gameState.players[0].hand.push(bh);
ok('P4: precondition — the Priest is on the field with the record',z(pr)==='mz'&&(C(pr)[KEY]||[]).length===1);
base();
duelActivateFromHand(gameState.players[0].hand.length-1);drive();
ok('P4: destroyed by ブラック・ホール → the banished カバリスト (and only it) is Special Summoned',z(pr)==='grave'&&z(cb)==='mz'&&C(cb).pos==='atk'&&z(other)==='banish',JSON.stringify({pr:z(pr),cb:z(cb),other:z(other),TRIG}));
ok('P4: the record survived the field → GY trip and is cleared after the trigger',C(pr)[KEY]===undefined,JSON.stringify(C(pr)[KEY]));
audit('P4');
/* P4b: the record is readable in the GY between the leave and the resolution (trigger put on the chain with the pool from the record) */
fresh();
pr=mk('寡黙なるサイコプリースト',0,'up','def');cb=mk('カバリスト',0);gameState.players[0].mz=[pr];gameState.players[0].banish=[cb];
pr[KEY]=[cb.uid];bh=mk('ブラック・ホール',0);gameState.players[0].hand=[bh];base();
duelActivateFromHand(0);drive();
ok('P4b: a record that already exists is honoured (destroyed → カバリスト returns)',z(cb)==='mz',JSON.stringify({cb:z(cb),TRIG}));
audit('P4b');
/* P5 (negatives): nothing recorded; the recorded monster is no longer banished; sent from the hand */
fresh();
pr=mk('寡黙なるサイコプリースト',0,'up','def');cb=mk('カバリスト',0);gameState.players[0].mz=[pr];gameState.players[0].banish=[cb];
bh=mk('ブラック・ホール',0);gameState.players[0].hand=[bh];base();
duelActivateFromHand(0);drive();
ok('P5: no monster banished by its effect (カバリスト was banished by something else) → nothing is Special Summoned',z(pr)==='grave'&&z(cb)==='banish'&&TRIG.every(t=>t.indexOf('寡黙')<0),JSON.stringify({cb:z(cb),TRIG}));
audit('P5');
/* P6 (negatives of the ignition) */
fresh();
pr=mk('寡黙なるサイコプリースト',0,'up','def');cb=mk('カバリスト',0);gameState.players[0].mz=[pr];gameState.players[0].grave=[cb];gameState.players[0].hand=[];base();
ok('P6: no hand card → not activatable',!legal('寡黙なるサイコプリースト',0,'mz',0));
fresh();
pr=mk('寡黙なるサイコプリースト',0,'up','def');gameState.players[0].mz=[pr];gameState.players[0].grave=[mk('ワイト',0)];gameState.players[0].hand=[mk('ワイト',0)];base();
ok('P6: no Psychic in the GY (or the hand) → not activatable',!legal('寡黙なるサイコプリースト',0,'mz',0));
fresh();
pr=mk('寡黙なるサイコプリースト',0,'up','def');gameState.players[0].mz=[pr];gameState.players[0].grave=[mk('カバリスト',0)];gameState.players[0].hand=[mk('ワイト',0)];gameState.phase='battle';base();
ok('P6: Battle Phase → not activatable',!legal('寡黙なるサイコプリースト',0,'mz',0));
fresh();
pr=mk('寡黙なるサイコプリースト',0,'up','def');gameState.players[0].mz=[pr];gameState.players[0].grave=[mk('カバリスト',0)];gameState.players[0].hand=[mk('ワイト',0)];gameState.activePlayer=1;base();
ok('P6: the opponent\'s turn → not activatable',!legal('寡黙なるサイコプリースト',0,'mz',0));
fresh();
pr=mk('寡黙なるサイコプリースト',0,'up','def');gameState.players[0].mz=[pr];gameState.players[0].grave=[mk('カバリスト',0)];gameState.players[0].hand=[mk('ワイト',0)];base();
ok('P6: Main Phase 1 with a hand card and a Psychic in the GY → activatable (control)',legal('寡黙なるサイコプリースト',0,'mz',0));
fresh();
pr=mk('寡黙なるサイコプリースト',0,'up','def');gameState.players[0].mz=[pr];gameState.players[1].grave=[mk('カバリスト',1)];gameState.players[0].hand=[mk('ワイト',0)];base();
ok('P6: a Psychic only in the opponent\'s GY → not activatable',!legal('寡黙なるサイコプリースト',0,'mz',0));

/* ===== W: 沈黙のサイコウィザード ===== */
fresh();
let wz=mk('沈黙のサイコウィザード',0);cb=mk('カバリスト',0);sg=mk('サイ・ガール',0);
gameState.players[0].hand=[wz];gameState.players[0].grave=[cb,sg];base();
PREFER=[cb.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('W1: Normal Summoned → the chosen Psychic (カバリスト) is banished (optional trigger), the other stays',z(wz)==='mz'&&z(cb)==='banish'&&z(sg)==='grave',JSON.stringify({wz:z(wz),cb:z(cb),sg:z(sg),TRIG}));
ok('W1: recorded on the Wizard',Array.isArray(C(wz)[KEY])&&C(wz)[KEY][0]===cb.uid,JSON.stringify(C(wz)[KEY]));
gameState.phase='main2';bh=mk('ブラック・ホール',0);gameState.players[0].hand.push(bh);base();
duelActivateFromHand(gameState.players[0].hand.length-1);drive();
ok('W1: the Wizard is destroyed → the monster it banished is Special Summoned (forced)',z(wz)==='grave'&&z(cb)==='mz'&&C(cb).pos==='atk',JSON.stringify({wz:z(wz),cb:z(cb),TRIG}));
ok('W1: the record was readable after leaving the field and is cleared afterwards',C(wz)[KEY]===undefined,JSON.stringify(C(wz)[KEY]));
audit('W1');
/* W2: sent to the GY by a different path (battle destruction) */
fresh();
wz=mk('沈黙のサイコウィザード',0);cb=mk('カバリスト',0);gameState.players[0].mz=[wz];gameState.players[0].banish=[cb];wz[KEY]=[cb.uid];
let bw=mk('青眼の白龍',1);gameState.players[1].mz=[bw];gameState.activePlayer=1;gameState.phase='battle';base();
atk(1,0,0);
ok('W2: destroyed in battle → the banished monster is Special Summoned',z(wz)==='grave'&&z(cb)==='mz',JSON.stringify({wz:z(wz),cb:z(cb),TRIG}));
audit('W2');
/* W3 (negatives) */
fresh();
wz=mk('沈黙のサイコウィザード',0);cb=mk('カバリスト',0);gameState.players[0].hand=[wz];gameState.players[0].grave=[mk('ワイト',0)];base();
doNormalSummon(0,'atk');drive();
ok('W3: no Psychic in the GY → no trigger',z(wz)==='mz'&&TRIG.every(t=>t.indexOf('サイコウィザード')<0),JSON.stringify({TRIG}));
audit('W3');
fresh();
wz=mk('沈黙のサイコウィザード',0);cb=mk('カバリスト',0);rv=mk('死者蘇生',0);gameState.players[0].hand=[rv];gameState.players[0].grave=[wz,cb];base();
PREFER=[wz.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('W3: Special Summoned (not Normal Summoned) → the banish does not trigger',z(wz)==='mz'&&z(cb)==='grave'&&TRIG.every(t=>t.indexOf('サイコウィザード')<0),JSON.stringify({wz:z(wz),cb:z(cb),TRIG}));
audit('W3b');
fresh();
wz=mk('沈黙のサイコウィザード',0);cb=mk('カバリスト',0);gameState.players[0].mz=[wz];gameState.players[0].banish=[cb];bh=mk('ブラック・ホール',0);gameState.players[0].hand=[bh];base();
duelActivateFromHand(0);drive();
ok('W3: nothing recorded (カバリスト banished by another card) → nothing is Special Summoned',z(wz)==='grave'&&z(cb)==='banish'&&TRIG.every(t=>t.indexOf('サイコウィザード')<0),JSON.stringify({cb:z(cb),TRIG}));
audit('W3c');

/* ===== S: 疾風!凶殺陣 ===== */
/* (六武衆の侍従 is a vanilla 「六武衆」: ATK 200; the effect monsters' substitution / destruction clauses stay out of the way) */
function sixSetup(){
  fresh();
  const tr=setT('疾風!凶殺陣',0),zn=mk('六武衆－ザンジ',0),ya=mk('六武衆の侍従',0),sh=mk('紫炎の足軽',0),wi=mk('ワイト',1,'up','atk');
  gameState.players[0].sz=[tr];gameState.players[0].mz=[zn,ya,sh];gameState.players[1].mz=[wi];base();
  duelActivateFromZone(0,'sz',0);drive();
  return {tr,zn,ya,sh,wi};
}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);drive();}
let s=sixSetup();
ok('S0: activated, stays face-up on the field',z(s.tr)==='sz'&&C(s.tr).face==='up',JSON.stringify({z:z(s.tr),face:C(s.tr).face,TRIG}));
phase('battle');
atk(0,0,0);
ok('S1: ザンジ (1800) battles ワイト → every 「六武衆」 monster of the player gets +300 (ザンジ 2100, 侍従 500)',curATK(C(s.zn))===2100&&curATK(C(s.ya))===500,JSON.stringify({zn:curATK(C(s.zn)),ya:curATK(C(s.ya)),TRIG}));
ok('S1: 紫炎の足軽 (a 「紫炎」 card, not a 「六武衆」) gets nothing; the opponent\'s monster was destroyed',curATK(C(s.sh))===dbOf(C(s.sh)).atk&&z(s.wi)==='grave',JSON.stringify({sh:curATK(C(s.sh)),wi:z(s.wi)}));
atk(0,1,'direct');
ok('S1: a direct attack by 侍従 is no battle → no further boost (500 stays; 1500 damage from the first battle + 500)',curATK(C(s.ya))===500&&lp(1)===8000-1500-500,JSON.stringify({ya:curATK(C(s.ya)),lp1:lp(1)}));
phase('end');
ok('S1: still boosted in the End Phase itself',curATK(C(s.zn))===2100&&curATK(C(s.ya))===500,JSON.stringify({zn:curATK(C(s.zn)),ya:curATK(C(s.ya))}));
turn();
ok('S1: after the turn ended — back to the printed ATK',curATK(C(s.zn))===1800&&curATK(C(s.ya))===200,JSON.stringify({zn:curATK(C(s.zn)),ya:curATK(C(s.ya))}));
audit('S1');
/* S2: two battles stack */
s=sixSetup();
let wi2=mk('ワイト',1,'up','atk');gameState.players[1].mz.push(wi2);base();
phase('battle');
atk(0,0,0);
atk(0,1,0);
ok('S2: two battles → +600 (侍従 800 — it beat ワイト 300 only thanks to the first boost —, ザンジ 2400)',curATK(C(s.ya))===800&&curATK(C(s.zn))===2400&&z(wi2)==='grave',JSON.stringify({ya:curATK(C(s.ya)),zn:curATK(C(s.zn)),wi2:z(wi2),TRIG}));
audit('S2');
/* S2b: the battling 六武衆 is destroyed → it still counts as having battled */
s=sixSetup();
let bw3=mk('青眼の白龍',1,'up','atk');gameState.players[1].mz=[bw3];base();
phase('battle');
atk(0,1,0);
ok('S2b: 侍従 (200) is destroyed by 青眼の白龍 in the battle → it still counts as having battled: ザンジ gets +300',z(s.ya)==='grave'&&curATK(C(s.zn))===2100,JSON.stringify({ya:z(s.ya),zn:curATK(C(s.zn)),TRIG}));
audit('S2b');
/* S3 (negatives): a non-六武衆 monster battles; the opponent's 六武衆 battles my non-六武衆 monster */
s=sixSetup();
phase('battle');
atk(0,2,0);
ok('S3: only 紫炎の足軽 (not a 「六武衆」) battled → no boost',curATK(C(s.zn))===1800&&curATK(C(s.ya))===200,JSON.stringify({zn:curATK(C(s.zn)),ya:curATK(C(s.ya)),TRIG}));
audit('S3');
fresh();
let tr2=setT('疾風!凶殺陣',0),zn2=mk('六武衆－ザンジ',0),wi3=mk('ワイト',0),ozn=mk('六武衆－ヤイチ',1);
gameState.players[0].sz=[tr2];gameState.players[0].mz=[zn2,wi3];gameState.players[1].mz=[ozn];base();
duelActivateFromZone(0,'sz',0);drive();
gameState.activePlayer=1;gameState.phase='battle';base();
atk(1,0,1);
ok('S3: the opponent\'s 六武衆 battled my ワイト (my 六武衆 did not battle) → no boost for my ザンジ',curATK(C(zn2))===1800,JSON.stringify({zn:curATK(C(zn2)),TRIG}));
audit('S3b');

/* ===== K: 風雲カラクリ城 ===== */
function castleSetup(oppMons){
  fresh();
  const fs=mk('風雲カラクリ城',0),kr=mk('カラクリ忍者 九壱九',0);
  gameState.players[0].hand=[fs];gameState.players[0].mz=[kr];gameState.players[1].mz=oppMons;base();
  duelActivateFromHand(0);drive();
  return {fs,kr};
}
bw=mk('青眼の白龍',1,'up','atk');
let k=castleSetup([bw]);
ok('K0: the Field Spell is on the field face-up',z(k.fs)==='field'&&C(k.fs).face==='up',JSON.stringify({z:z(k.fs),TRIG}));
phase('battle');
atk(0,0,0);
ok('K1: 九壱九 (Karakuri, 1700) targets the face-up Attack Position 青眼の白龍 → its position is changed (optional trigger) to Defense',C(bw).pos==='def'||z(bw)!=='mz',JSON.stringify({pos:C(bw).pos,TRIG}));
ok('K1: battle against DEF 2500: 九壱九 survives, its controller takes 800, 青眼 stays',z(k.kr)==='mz'&&lp(0)===8000-800&&z(bw)==='mz',JSON.stringify({kr:z(k.kr),lp0:lp(0),bw:z(bw)}));
audit('K1');
let dfm=mk('青眼の白龍',1,'up','def');
k=castleSetup([dfm]);
phase('battle');
atk(0,0,0);
ok('K2: a face-up Defense Position target is changed to Attack Position (3000 vs 1700: 九壱九 is destroyed)',C(dfm).pos==='atk'&&z(k.kr)==='grave'&&lp(0)===8000-1300,JSON.stringify({pos:C(dfm).pos,kr:z(k.kr),lp0:lp(0),TRIG}));
audit('K2');
/* K3 (negatives): a non-Karakuri attacker; a direct attack; a face-down target; the opponent's attack */
fresh();
let fs3=mk('風雲カラクリ城',0),w0=mk('ワイト',0);bw=mk('青眼の白龍',1,'up','atk');
gameState.players[0].hand=[fs3];gameState.players[0].mz=[w0];gameState.players[1].mz=[bw];base();
duelActivateFromHand(0);drive();phase('battle');
atk(0,0,0);
ok('K3: a non-Karakuri attacker → the position is not changed (青眼 stays in Attack Position, ワイト is destroyed)',C(bw).pos==='atk'&&z(w0)==='grave'&&TRIG.every(t=>t.indexOf('風雲')<0),JSON.stringify({pos:C(bw).pos,TRIG}));
audit('K3');
k=castleSetup([]);
phase('battle');
atk(0,0,'direct');
ok('K3: a direct attack → no trigger (no monster is chosen as the target)',lp(1)===8000-1700&&TRIG.every(t=>t.indexOf('風雲')<0),JSON.stringify({lp1:lp(1),TRIG}));
audit('K3b');
let fd=setT('青眼の白龍',1);fd.pos='def';
k=castleSetup([fd]);
phase('battle');
atk(0,0,0);
ok('K3: a face-down target is not changed by the trigger (it is flipped by the attack instead)',TRIG.every(t=>t.indexOf('風雲')<0),JSON.stringify({TRIG}));
audit('K3c');
fresh();
fs3=mk('風雲カラクリ城',0);bw=mk('青眼の白龍',1,'up','atk');let ok1=mk('カラクリ忍者 九壱九',0,'up','atk');
gameState.players[0].mz=[mk('ワイト',0,'up','atk')];gameState.players[0].field=fs3;gameState.players[1].mz=[bw];gameState.activePlayer=1;gameState.phase='battle';base();
atk(1,0,0);
ok('K3: the opponent\'s attack on my non-Karakuri ワイト → no trigger',TRIG.every(t=>t.indexOf('風雲')<0),JSON.stringify({TRIG}));
/* K4: destroyed face-up → special summon a Level 4+ Karakuri from the GY */
fresh();
fs3=mk('風雲カラクリ城',0);let g1=mk('カラクリ武者 六参壱八',0),g2=mk('カラクリ蜘蛛',0),g3=mk('ワイト',0),cy=mk('サイクロン',1);
gameState.players[0].field=fs3;gameState.players[0].grave=[g1,g2,g3];gameState.players[1].hand=[cy];gameState.activePlayer=1;base();
PREFER=[fs3.uid,g1.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('K4: destroyed (サイクロン) → カラクリ武者 六参壱八 (Level 4) is Special Summoned; the Level 2 カラクリ蜘蛛 and ワイト are not eligible',z(fs3)==='grave'&&z(g1)==='mz'&&z(g2)==='grave'&&z(g3)==='grave',JSON.stringify({fs:z(fs3),g1:z(g1),TRIG}));
audit('K4');
/* K5 (negatives): only Level 3 Karakuri in the GY; sent to the GY without being destroyed (replaced by another Field Spell) */
fresh();
fs3=mk('風雲カラクリ城',0);g2=mk('カラクリ蜘蛛',0);let g4=mk('カラクリ小町 弐弐四',0);cy=mk('サイクロン',1);
gameState.players[0].field=fs3;gameState.players[0].grave=[g2,g4];gameState.players[1].hand=[cy];gameState.activePlayer=1;base();
PREFER=[fs3.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('K5: no Level 4+ Karakuri in the GY → destroyed with no effect',z(fs3)==='grave'&&mzNames(0).length===0&&TRIG.every(t=>t.indexOf('風雲')<0),JSON.stringify({mz:mzNames(0),TRIG}));
audit('K5');
fresh();
fs3=mk('風雲カラクリ城',0);g1=mk('カラクリ武者 六参壱八',0);
gameState.players[0].field=fs3;gameState.players[0].grave=[g1];base();
API.sendToGrave(h(fs3),'test (sent to the GY, not destroyed)');drive();
ok('K5: sent to the GY without being destroyed → no effect',z(fs3)==='grave'&&z(g1)==='grave'&&TRIG.every(t=>t.indexOf('風雲')<0),JSON.stringify({fs:z(fs3),g1:z(g1),TRIG}));
audit('K5b');

/* ===== Q: 底なし流砂 ===== */
function sandSetup(mine,theirs){
  fresh();
  const tr=setT('底なし流砂',0);
  gameState.players[0].sz=[tr];gameState.players[0].mz=mine;gameState.players[1].mz=theirs;base();
  duelActivateFromZone(0,'sz',0);drive();
  return tr;
}
let bm=mk('青眼の白龍',0),ow=mk('ワイト',1);
let tr=sandSetup([bm],[ow]);
ok('Q0: activated, stays face-up',z(tr)==='sz'&&C(tr).face==='up'&&z(bm)==='mz',JSON.stringify({z:z(tr),TRIG}));
gameState.activePlayer=1;gameState.phase='main2';base();
phase('end');
ok('Q1: the opponent\'s End Phase → the face-up monster with the highest ATK on the field (the player\'s own 青眼 3000) is destroyed',z(bm)==='grave'&&z(ow)==='mz'&&z(tr)==='sz',JSON.stringify({bm:z(bm),ow:z(ow),TRIG}));
audit('Q1');
/* Q2: ties destroy all (ruling), own side included; face-down monsters are not counted */
let a1=mk('青眼の白龍',0),a2=mk('青眼の白龍',1),a3=mk('ブラック・マジシャン',1),fdn=setT('ワイト',1);
tr=sandSetup([a1],[a2,a3,fdn]);
gameState.activePlayer=1;gameState.phase='main2';base();
phase('end');
ok('Q2: two monsters tie at 3000 → both are destroyed (the text names no single monster); the 2500 one and the face-down monster stay',z(a1)==='grave'&&z(a2)==='grave'&&z(a3)==='mz'&&z(fdn)==='mz',JSON.stringify({a1:z(a1),a2:z(a2),a3:z(a3),TRIG}));
audit('Q2');
/* Q3: it repeats every opponent End Phase (the next turn too) */
a1=mk('青眼の白龍',0);a2=mk('ブラック・マジシャン',1);
tr=sandSetup([a1],[a2]);
gameState.activePlayer=1;gameState.phase='main2';base();
phase('end');
ok('Q3: first End Phase → 青眼 destroyed',z(a1)==='grave'&&z(a2)==='mz',JSON.stringify({a1:z(a1),a2:z(a2)}));
gameState.turn=gameState.turn+2;gameState.activePlayer=1;gameState.phase='main2';base();
phase('end');
ok('Q3: the next opponent End Phase → ブラック・マジシャン (now the highest) destroyed too',z(a2)==='grave'&&z(tr)==='sz',JSON.stringify({a2:z(a2),tr:z(tr)}));
audit('Q3');
/* Q4 (negatives): the own End Phase; no monster */
a1=mk('青眼の白龍',0);a2=mk('ワイト',1);
tr=sandSetup([a1],[a2]);
gameState.activePlayer=0;gameState.phase='main2';base();
phase('end');
ok('Q4: the player\'s own End Phase → nothing is destroyed',z(a1)==='mz'&&z(a2)==='mz',JSON.stringify({a1:z(a1),a2:z(a2),TRIG}));
audit('Q4');
/* Q5: Standby Phase of the controller: hand 4 or fewer → destroy this card; 5 → stays; the opponent's Standby → stays */
fresh();
tr=setT('底なし流砂',0);gameState.players[0].sz=[tr];gameState.players[0].hand=Array.from({length:4},()=>mk('ワイト',0));gameState.phase='draw';base();
duelActivateFromZone(0,'sz',0);drive();
gameState.phase='draw';base();
phase('standby');
ok('Q5: own Standby Phase with 4 cards in hand → 底なし流砂 is destroyed',z(tr)==='grave',JSON.stringify({z:z(tr),TRIG}));
audit('Q5');
fresh();
tr=setT('底なし流砂',0);gameState.players[0].sz=[tr];gameState.players[0].hand=Array.from({length:5},()=>mk('ワイト',0));base();
duelActivateFromZone(0,'sz',0);drive();
gameState.phase='draw';base();
phase('standby');
ok('Q5: own Standby Phase with 5 cards in hand → stays',z(tr)==='sz',JSON.stringify({z:z(tr),TRIG}));
audit('Q5b');
fresh();
tr=setT('底なし流砂',0);gameState.players[0].sz=[tr];gameState.players[0].hand=[];base();
duelActivateFromZone(0,'sz',0);drive();
gameState.activePlayer=1;gameState.phase='draw';base();
phase('standby');
ok('Q5: the opponent\'s Standby Phase → stays even with an empty hand',z(tr)==='sz',JSON.stringify({z:z(tr),TRIG}));

/* ===== F: 化石発掘 ===== */
function fossilSetup(grave,hand){
  fresh();
  const t=setT('化石発掘',0);
  gameState.players[0].sz=[t];gameState.players[0].grave=grave;gameState.players[0].hand=hand;base();
  return t;
}
let d1=mk('トラコドン',0),d2=mk('キラーザウルス',0),hx=mk('ワイト',0),hy=mk('ベビードラゴン',0);
let ft=fossilSetup([d1,d2,mk('ワイト',0)],[hx,hy]);
PREFER=[hx.uid,d2.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('F1: cost — the chosen hand card is discarded',z(hx)==='grave'&&z(hy)==='hand',JSON.stringify({hx:z(hx),hy:z(hy),TRIG}));
ok('F1: the targeted Dinosaur (キラーザウルス) is Special Summoned; the trap stays face-up',z(d2)==='mz'&&z(d1)==='grave'&&z(ft)==='sz'&&C(ft).face==='up',JSON.stringify({d2:z(d2),ft:z(ft)}));
ok('F1: the summoned monster\'s effects are negated while the trap is on the field',effectNegated(C(d2))===true,String(effectNegated(C(d2))));
audit('F1');
/* F2: this card leaves the field → the monster is destroyed (and its effects are no longer negated if it were to return) */
let cy2=mk('サイクロン',1);gameState.players[1].hand=[cy2];gameState.activePlayer=1;base();
PREFER=[ft.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('F2: the trap is destroyed (サイクロン) → the Special Summoned Dinosaur is destroyed',z(ft)==='grave'&&z(d2)==='grave',JSON.stringify({ft:z(ft),d2:z(d2),TRIG}));
audit('F2');
/* F3: the monster is destroyed (battle) → the trap is destroyed */
d1=mk('トラコドン',0);hx=mk('ワイト',0);
ft=fossilSetup([d1],[hx]);
PREFER=[hx.uid,d1.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
bw=mk('青眼の白龍',1);gameState.players[1].mz=[bw];gameState.activePlayer=1;gameState.phase='battle';base();
atk(1,0,0);
ok('F3: the Dinosaur is destroyed in battle → 化石発掘 is destroyed too',z(d1)==='grave'&&z(ft)==='grave',JSON.stringify({d1:z(d1),ft:z(ft),TRIG}));
audit('F3');
/* F4: the monster leaves in another way than being destroyed (returned to the hand: 強制脱出装置 of the opponent is not available;
   use the Dinosaur being tributed away) — it is destroyed only on destruction, so the trap stays when the monster is released */
d1=mk('トラコドン',0);hx=mk('ワイト',0);let big=mk('青眼の白龍',0);
ft=fossilSetup([d1],[hx,big]);
PREFER=[hx.uid,d1.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
const mzBefore=mzNames(0);
API.returnToHand(h(d1),'test');
ok('F4: the monster returned to the hand (not destroyed) → the trap stays on the field',z(d1)==='hand'&&z(ft)==='sz',JSON.stringify({d1:z(d1),ft:z(ft),mz:mzBefore}));
/* F5 (negatives) */
ft=fossilSetup([mk('ワイト',0)],[mk('ワイト',0)]);
ok('F5: no Dinosaur in the GY → not activatable',!legal('化石発掘',0,'sz',0));
ft=fossilSetup([mk('トラコドン',0)],[]);
ok('F5: no hand card to discard → not activatable',!legal('化石発掘',0,'sz',0));
fresh();
ft=setT('化石発掘',0);gameState.players[0].sz=[ft];gameState.players[1].grave=[mk('トラコドン',1)];gameState.players[0].hand=[mk('ワイト',0)];base();
ok('F5: a Dinosaur only in the opponent\'s GY → not activatable',!legal('化石発掘',0,'sz',0));
ft=fossilSetup([mk('トラコドン',0)],[mk('ワイト',0)]);
ok('F5: Dinosaur in the GY and a card to discard → activatable (control)',legal('化石発掘',0,'sz',0));
`);
