/* S03-U323: サイバー・ダーク・エッジ / キール / ホーン — Normal Summon → equip a Lv3- Dragon from the Graveyard, ATK + its printed ATK, the three ③ effects, ④ the equipped monster is destroyed instead in battle
   (engine: equipHostSubstituteS03 in engine/1ZZB, mulFinalAtk in curStat). Real DUEL paths, Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3230001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
const DR=CARD_DB.find(d=>d.k==='m'&&d.ra==='ドラゴン'&&(d.lv||0)<=3&&(d.st||[]).includes('通常')&&Number(d.atk)>=1000&&Number(d.atk)<=1500&&d.d<='2011-08-31'),DRN=DR.n,DRA=Number(DR.atk);
const DR4=CARD_DB.find(d=>d.k==='m'&&d.ra==='ドラゴン'&&(d.lv||0)===4&&d.d<='2011-08-31').n;
function equippedTo(eq,host){const e=C(eq),h=C(host);return !!e&&!!h&&e.v46MonsterEquip===true&&e.equipTo&&e.equipTo.uid===host.uid&&e.equipTo.sourceUid===host.uid&&z(eq)==='sz';}
/* a Normal Summon of the card from the hand with the Graveyard [ワイト, Lv4 Dragon, Lv3- Dragon]; extra monsters are fixtures */
function summonEquip(name,extraMine,foesF){
  fresh();const foes=foesF?foesF():[];const cd=mk(name,0),dr=mk(DRN,0),dr4=mk(DR4,0),wy=mk('ワイト',0);
  gameState.players[0].hand=[cd];gameState.players[0].grave=[wy,dr4,dr];gameState.players[0].mz=extraMine||[];gameState.players[1].mz=foes;baselineA();
  PREFER=[uid(dr)];doNormalSummon(0,'atk');drive();PREFER=[];
  return {cd,dr,dr4,wy};
}
const NAMES=['サイバー・ダーク・エッジ','サイバー・ダーク・キール','サイバー・ダーク・ホーン'];
NAMES.forEach(n=>{
  const x=summonEquip(n);
  ok(n+' ①: Normal Summoned → the Lv3- Dragon equipped from the Graveyard (the Lv4 Dragon and the non-Dragon are not candidates)',z(x.cd)==='mz'&&equippedTo(x.dr,x.cd)&&z(x.dr4)==='grave'&&z(x.wy)==='grave',JSON.stringify({cd:z(x.cd),dr:z(x.dr),dr4:z(x.dr4)}));
  ok(n+' ②: ATK = 800 + the Dragon printed ATK ('+DRA+')',curATK(C(x.cd))===800+DRA,String(curATK(C(x.cd))));
  audit(n+' ①②');
});
/* ① negative: no legal Dragon in the Graveyard → nothing */
{ fresh();const cd=mk('サイバー・ダーク・エッジ',0),dr4=mk(DR4,0);gameState.players[0].hand=[cd];gameState.players[0].grave=[dr4];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('① negative: only a Lv4 Dragon in the Graveyard → no equip, ATK 800',z(cd)==='mz'&&z(dr4)==='grave'&&curATK(C(cd))===800,JSON.stringify({dr4:z(dr4),atk:curATK(C(cd))})); }

/* ④ in battle: the equipped Dragon is destroyed instead of the card (mandatory) */
{ const x=summonEquip('サイバー・ダーク・キール',[],()=>[mon('青眼の白龍',1)]);const foe=gameState.players[1].mz[0];
  toOppBattle();atkTarget(1,foe,x.cd);
  ok('④: attacked and would be destroyed in battle → the equipped Dragon is destroyed instead; the card stays',z(x.cd)==='mz'&&z(x.dr)==='grave',JSON.stringify({cd:z(x.cd),dr:z(x.dr)}));
  audit('④'); }
{ fresh();const cd=mon('サイバー・ダーク・キール',0),foe=mon('青眼の白龍',1);gameState.players[0].mz=[cd];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();atkTarget(1,foe,cd);
  ok('④ negative: with no equipped monster the card is destroyed in battle',z(cd)==='grave',z(cd)); }
/* ④ is for battle only: an effect destruction still destroys the card */
{ fresh();const cd=mk('サイバー・ダーク・エッジ',0),dr=mk(DRN,0),bh=mk('ブラック・ホール',0);
  gameState.players[0].hand=[cd,bh];gameState.players[0].grave=[dr];baselineA();
  PREFER=[uid(dr)];doNormalSummon(0,'atk');drive();PREFER=[];
  duelActivateFromHand(gameState.players[0].hand.indexOf(bh));drive();
  ok('④ negative: destroyed by an effect (ブラック・ホール) → the card itself is destroyed (the text says in battle)',z(cd)==='grave',JSON.stringify({cd:z(cd),dr:z(dr)})); }

/* エッジ③: direct attack, ATK halved at the damage calculation only */
{ const x=summonEquip('サイバー・ダーク・エッジ',[],()=>[mon('ワイト',1)]);
  endTurn();endTurn();phase('battle');
  const total=800+DRA,l1=lp(1);
  ok('エッジ③: it may attack directly although the opponent has a monster',battleTargetsV29(x.cd.uid).direct===true,'');
  atkTarget(0,x.cd,'direct');
  ok('エッジ③: the direct attack deals half of the ATK ('+total+' → '+Math.floor(total/2)+')',l1-lp(1)===Math.floor(total/2),JSON.stringify({loss:l1-lp(1),total}));
  ok('エッジ③: its ATK is back to the full value after the battle',curATK(C(x.cd))===total,String(curATK(C(x.cd))));
  audit('エッジ③'); }
/* the halving is for a direct attack only */
{ const x=summonEquip('サイバー・ダーク・エッジ',[],()=>[mon('ワイト',1)]);const foe=gameState.players[1].mz[0];
  endTurn();endTurn();phase('battle');const total=800+DRA;const l1=lp(1);atkTarget(0,x.cd,foe);
  ok('エッジ③ negative: a battle with a monster uses the full ATK (ワイト destroyed, damage total-300)',z(foe)==='grave'&&l1-lp(1)===total-300,JSON.stringify({foe:z(foe),loss:l1-lp(1),total})); }

/* キール③: after destroying an opponent monster by battle → 300 damage */
{ const x=summonEquip('サイバー・ダーク・キール',[],()=>[mon('ワイト',1)]);const foe=gameState.players[1].mz[0];
  endTurn();endTurn();phase('battle');const total=800+DRA;const l1=lp(1);atkTarget(0,x.cd,foe);
  ok('キール③: destroyed ワイト (300): battle damage '+(total-300)+' + 300 effect damage',z(foe)==='grave'&&l1-lp(1)===(total-300)+300,JSON.stringify({loss:l1-lp(1),total}));
  audit('キール③'); }
{ const x=summonEquip('サイバー・ダーク・キール',[],null);
  endTurn();endTurn();phase('battle');const l1=lp(1);atkTarget(0,x.cd,'direct');
  ok('キール③ negative: a direct attack destroys nothing → no 300 damage',l1-lp(1)===800+DRA,JSON.stringify({loss:l1-lp(1)})); }

/* ホーン③: piercing damage to a Defense Position monster */
{ const x=summonEquip('サイバー・ダーク・ホーン',[],()=>[mon('ワイト',1,'def')]);const foe=gameState.players[1].mz[0];
  endTurn();endTurn();phase('battle');const total=800+DRA;const l1=lp(1);atkTarget(0,x.cd,foe);
  ok('ホーン③: ワイト in Defense (DEF 200): piercing damage '+(total-200),z(foe)==='grave'&&l1-lp(1)===total-200,JSON.stringify({loss:l1-lp(1),total}));
  audit('ホーン③'); }

console.log('U323 done');
`);
