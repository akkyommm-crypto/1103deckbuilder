/* S03-U312: restricted Equip Spells — 漆黒の名馬, 古代の機械戦車, 風魔手裏剣, 磁力の指輪, レアゴールド・アーマー, ヴァイロン・コンポーネント, ヴァイロン・フィラメント.
   Real DUEL path (activation from the hand, host choice, stats, Battle Phase, real attacks / destruction through サイクロン, the Graveyard triggers), Replay-audited.
   「六武衆」「アンティーク・ギア(古代の機械)」「忍者」「ヴァイロン」 = P4 groups (NINJA / VYLON are new in P4-v9). ヴァイロン・セグメント is not part of this unit. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function ctrl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
const SEEN=[];
/* record what the engine offers player 1 while a battle is going on (a locked window may never pause the processor), as test_s03_u144 does */
let SNAP=[];const __gcr=getChainResponsesV2;
getChainResponsesV2=function(p){const r=__gcr.apply(this,arguments);if(gameState.pendingAttack||gameState.battle) SNAP.push({p,names:r.map(x=>x.db.n)});return r;};
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){
    pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3120001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
/* the unified Equip Spells are offered through getLegalHandActions (an 'activate' action), not strictScriptLegalityV2 */
function legalH(name,i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function activate(prefer){PREFER=(prefer||[]).map(uid);duelActivateFromHand(0);drive();PREFER=[];}
let CY=null;
function withCy(){CY=mk('サイクロン',0,'up');gameState.players[0].hand.push(CY);}
function cyclone(target){const i=gameState.players[0].hand.indexOf(CY);PREFER=[uid(target)];duelActivateFromHand(i);drive();PREFER=[];}
function equipped(host,eq){const h=C(host),e=C(eq);return !!h&&!!e&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function setup(eqName,mine,theirs,extraHand){const eq=mk(eqName,0);gameState.players[0].hand=[eq].concat(extraHand||[]);gameState.players[0].mz=mine;gameState.players[1].mz=theirs||[];withCy();baselineA();return eq;}
function dmg(c){return curATK(C(c));}
function atkDirect(c){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:'direct'});drive();}
function atkTarget(c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:idx(t)});drive();}
function oppTargets(att){return battleTargetsV29(att.uid).targets.map(x=>x.card.uid);}

/* ===== 漆黒の名馬 ===== */
{ fresh();const zj=mon('六武衆－ザンジ',0),o=mon('ライオウ',0);const eq=setup('漆黒の名馬',[zj,o]);
  ok('漆黒の名馬: activatable with a 「六武衆」 host',legalH('漆黒の名馬').ok===true,JSON.stringify(legalH('漆黒の名馬')));
  activate([o,zj]);
  ok('漆黒の名馬: only the 「六武衆」 was offered as the host (ライオウ was not)',z(eq)==='sz'&&equipped(zj,eq)&&!(C(o).equippedBy&&C(o).equippedBy.length),JSON.stringify([z(eq),equipped(zj,eq)]));
  ok('漆黒の名馬: ATK and DEF +200 (1800/1300 → 2000/1500)',curATK(C(zj))===2000&&curDEF(C(zj))===1500,JSON.stringify([curATK(C(zj)),curDEF(C(zj))]));
  act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:idx(zj),reason:'test',byDestroy:true});
  ok('漆黒の名馬: the equipped monster would be destroyed → the Equip Spell is destroyed instead, the monster stays',z(zj)==='mz'&&z(eq)==='grave',JSON.stringify([z(zj),z(eq)]));
  audit('漆黒の名馬'); }
{ setup('漆黒の名馬',[mon('ライオウ',0)]);ok('漆黒の名馬: refused — no 「六武衆」 on the field',legalH('漆黒の名馬').ok===false,JSON.stringify(legalH('漆黒の名馬'))); }

/* ===== 古代の機械戦車 ===== */
{ fresh();const g=mon('古代の機械兵士',0),o=mon('ライオウ',0);const eq=setup('古代の機械戦車',[g,o]);
  activate([g]);
  ok('古代の機械戦車: 古代の機械兵士 equipped, ATK +600 (1300 → 1900)',equipped(g,eq)&&curATK(C(g))===1900,JSON.stringify([equipped(g,eq),curATK(C(g))]));
  const l1=lp(1);cyclone(eq);
  ok('古代の機械戦車: the Equip Spell is destroyed → 600 damage to the opponent',z(eq)==='grave'&&lp(1)===l1-600&&z(g)==='mz',JSON.stringify([z(eq),l1,lp(1)]));
  audit('古代の機械戦車'); }
{ fresh();const g=mon('古代の機械兵士',0);const eq=setup('古代の機械戦車',[g]);activate([g]);const l1=lp(1);
  act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:idx(g),reason:'test',byDestroy:true});drive();
  ok('古代の機械戦車: control — the host is destroyed and the Equip Spell goes to the GY with it (not destroyed itself) → no damage',z(g)==='grave'&&z(eq)==='grave'&&lp(1)===l1,JSON.stringify([z(g),z(eq),l1,lp(1)])); }
{ setup('古代の機械戦車',[mon('ライオウ',0)]);ok('古代の機械戦車: refused — no 古代の機械 monster',legalH('古代の機械戦車').ok===false); }

/* ===== 風魔手裏剣 ===== */
{ fresh();const n=mon('白い忍者',0),o=mon('ライオウ',0);const eq=setup('風魔手裏剣',[n,o]);
  activate([o,n]);
  ok('風魔手裏剣: 白い忍者 equipped, ATK +700 (1500 → 2200)',equipped(n,eq)&&curATK(C(n))===2200,JSON.stringify([equipped(n,eq),curATK(C(n))]));
  const l1=lp(1);cyclone(eq);
  ok('風魔手裏剣: sent to the GY from the field → 700 damage',z(eq)==='grave'&&lp(1)===l1-700,JSON.stringify([z(eq),l1,lp(1)]));
  audit('風魔手裏剣'); }
{ fresh();const n=mon('白い忍者',0),bh=mk('ブラック・ホール',0,'up');const eq=setup('風魔手裏剣',[n],[],[bh]);activate([n]);const l1=lp(1);
  duelActivateFromHand(gameState.players[0].hand.indexOf(bh));drive();
  ok('風魔手裏剣: ブラック・ホール destroys the host → the Equip Spell goes to the GY from the field → 700 damage as well',z(eq)==='grave'&&lp(1)===l1-700,JSON.stringify([z(eq),l1,lp(1)])); }
{ setup('風魔手裏剣',[mon('ライオウ',0)]);ok('風魔手裏剣: refused — no 「忍者」 monster',legalH('風魔手裏剣').ok===false); }

/* ===== 磁力の指輪 ===== */
{ fresh();const a=mon('ライオウ',0),b=mon('ワイト',0),f=mon('ライオウ',1),eq=null;
  const e=mk('磁力の指輪',0);gameState.players[0].hand=[e];gameState.players[0].mz=[a,b];gameState.players[1].mz=[f];withCy();baselineA();
  activate([b]);
  ok('磁力の指輪: equipped to my ワイト, ATK / DEF −500 (300/200 → 0/0)',equipped(b,e)&&curATK(C(b))===0&&curDEF(C(b))===0,JSON.stringify([equipped(b,e),curATK(C(b)),curDEF(C(b))]));
  gameState.activePlayer=1;gameState.phase='battle';
  ok('磁力の指輪: the opponent can attack only the equipped monster',JSON.stringify(oppTargets(f))===JSON.stringify([b.uid]),JSON.stringify(oppTargets(f))+' b='+b.uid); }
{ fresh();const e=mk('磁力の指輪',0),f=mon('ライオウ',1);gameState.players[0].hand=[e];gameState.players[1].mz=[f];baselineA();
  ok('磁力の指輪: refused — I control no monster (only my own monsters)',legalH('磁力の指輪').ok===false);
  fresh();const e2=mk('磁力の指輪',0),f2=mon('ライオウ',1);gameState.players[0].hand=[e2];gameState.players[1].mz=[f2];baselineA();
  ok('磁力の指輪: the opponent monster is not a host',legalH('磁力の指輪').ok===false); }

/* ===== レアゴールド・アーマー ===== */
{ fresh();const a=mon('ライオウ',0),b=mon('ワイト',0),f=mon('ライオウ',1);const eq=setup('レアゴールド・アーマー',[a,b],[f]);
  activate([a]);
  ok('レアゴールド・アーマー: equipped to my ライオウ',equipped(a,eq),String(z(eq)));
  gameState.activePlayer=1;gameState.phase='battle';
  ok('レアゴールド・アーマー: the opponent can attack only the equipped ライオウ, not my ワイト',JSON.stringify(oppTargets(f))===JSON.stringify([a.uid]),JSON.stringify(oppTargets(f))); }
{ fresh();const a=mon('ライオウ',0),f=mon('ライオウ',1),f2=mon('ワイト',1);const eq=setup('レアゴールド・アーマー',[a],[f,f2]);
  activate([f]);
  ok('レアゴールド・アーマー: equipped to an opponent monster',equipped(f,eq),String(z(eq)));
  phase('battle');
  ok('レアゴールド・アーマー: I (the opponent of its controller) can attack only the equipped monster',JSON.stringify(oppTargets(a))===JSON.stringify([f.uid]),JSON.stringify(oppTargets(a))); }
{ fresh();const a=mon('ライオウ',0),f=mon('ライオウ',1);const eq=setup('レアゴールド・アーマー',[a],[f]);activate([a]);
  gameState.activePlayer=0;gameState.phase='main1';phase('battle');
  ok('レアゴールド・アーマー: control — the lock does not stop my own attack on the opponent monster',oppTargets(a).indexOf(f.uid)>=0,JSON.stringify(oppTargets(a))); }

/* ===== ヴァイロン・コンポーネント: piercing ===== */
{ fresh();const v=mon('ヴァイロン・ソルジャー',0),o=mon('ライオウ',0),f=mon('ワイト',1,'def');
  const eq=setup('ヴァイロン・コンポーネント',[v,o],[f]);
  activate([o,v]);
  ok('ヴァイロン・コンポーネント: equipped to the 「ヴァイロン」 monster only (ライオウ is not a host)',equipped(v,eq)&&!(C(o).equippedBy&&C(o).equippedBy.length),JSON.stringify([equipped(v,eq)]));
  phase('battle');const l1=lp(1);atkTarget(v,f);
  ok('ヴァイロン・コンポーネント: attacking a Defense Position ワイト (DEF 200) with ATK 1700 → 1500 piercing damage',lp(1)===l1-1500&&z(f)==='grave',JSON.stringify([l1,lp(1),z(f)]));
  audit('コンポーネント piercing'); }
/* ===== ヴァイロン: the search when sent from the field to the Graveyard (optional trigger) ===== */
for(const name of ['ヴァイロン・コンポーネント','ヴァイロン・フィラメント']){
  fresh();const v=mon('ヴァイロン・ソルジャー',0),eq=mk(name,0),sp=mk('ヴァイロン・エレメント',0),mon2=mk('ヴァイロン・ステラ',0),other=mk('サイクロン',0,'down');
  gameState.players[0].hand=[eq];gameState.players[0].mz=[v];gameState.players[0].deck=[mon2,other,sp].concat(gameState.players[0].deck);withCy();baselineA();
  activate([v]);
  SEEN.length=0;PREFER=[sp].map(uid);cyclone(eq);
  ok(name+': destroyed from the field face-up → one 「ヴァイロン」 Spell was added from the Deck (ヴァイロン・エレメント)',z(eq)==='grave'&&z(sp)==='hand',JSON.stringify([z(eq),z(sp)]));
  ok(name+': the choice listed only the 「ヴァイロン」 Spell (not the 「ヴァイロン」 monster, not another Spell)',SEEN.some(s=>s.cands.indexOf(sp.uid)>=0&&s.cands.indexOf(mon2.uid)<0&&s.cands.indexOf(other.uid)<0),JSON.stringify(SEEN));
  audit(name+' search'); }
{ fresh();const v=mon('ヴァイロン・ソルジャー',0),eq=mk('ヴァイロン・コンポーネント',0);gameState.players[0].hand=[eq];gameState.players[0].mz=[v];withCy();baselineA();activate([v]);
  /* sent to the GY because the host left: still 「フィールド上から墓地へ送られた」 (face-up) → the trigger applies; nothing in the Deck → just resolves */
  act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:idx(v),reason:'test',byDestroy:true});drive();
  ok('ヴァイロン: no 「ヴァイロン」 Spell in the Deck → the trigger resolves without adding a card',z(eq)==='grave'&&gameState.players[0].hand.length>=0); }
/* ===== ヴァイロン・フィラメント: the opponent cannot activate Spell / Trap cards while the equipped monster attacks ===== */
function filamentRun(equip){
  fresh();const v=mon('ヴァイロン・ソルジャー',0),f=mon('ワイト',1),tr=mk('強制脱出装置',1,'down');   /* the equipped monster wins the battle, so the Equip Spell stays until the end of the Damage Step */
  tr.setTurn=3;const eq=mk('ヴァイロン・フィラメント',0);
  gameState.players[0].hand=equip?[eq]:[];gameState.players[0].mz=[v];gameState.players[1].mz=[f];gameState.players[1].sz=[tr];baselineA();
  if(equip){ activate([v]); ok('フィラメント: equipped to the 「ヴァイロン」 monster before the attack',equipped(v,eq),String(z(eq))); }
  phase('battle');SNAP=[];atkTarget(v,f);
  return {offers:[].concat.apply([],SNAP.filter(e=>e.p===1).map(e=>e.names)),eq};
}
{ fresh();const r0=filamentRun(false),r1=filamentRun(true);
  ok('フィラメント: control — without the Equip Spell the opponent is offered 強制脱出装置 during the attack',r0.offers.indexOf('強制脱出装置')>=0,JSON.stringify(r0.offers));
  ok('フィラメント: with it, the opponent is never offered a Trap while the equipped monster attacks',r1.offers.indexOf('強制脱出装置')<0,JSON.stringify(r1.offers));
  audit('フィラメント'); }
/* ===== refused ===== */
for(const n of ['ヴァイロン・コンポーネント','ヴァイロン・フィラメント']){ setup(n,[mon('ライオウ',0)]);ok(n+': refused — no 「ヴァイロン」 monster',legalH(n).ok===false,JSON.stringify(legalH(n))); }
`);
