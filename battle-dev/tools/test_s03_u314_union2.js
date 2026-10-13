/* S03-U314: ユニオンモンスター part 2 — ヴァイロン・テセラクト, ヴァイロン・ペンタクロ, バスター・ショットマン, デス・デンドル, 氷岩魔獣, 灼岩魔獣 (declareUnionS03, S03-U313).
   Real DUEL path: the Union effect across really passed turns, Battle Phase attacks, battle kills / battle damage, the substitute; Replay-audited. */
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
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3130001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function zacts(zone,c){return getLegalZoneActions(0,zone,idx(c)).map(a=>a.id);}
function canEffect(zone,c){return zacts(zone,c).indexOf('effect')>=0;}
function equipU(u,host){PREFER=host?[uid(host)]:[];duelActivateFromZone(0,'mz',idx(u));drive();PREFER=[];}
function releaseU(u){duelActivateFromZone(0,'sz',idx(u));drive();}
function equippedTo(u,host){const e=C(u),h=C(host);return !!e&&!!h&&e.v46MonsterEquip===true&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0&&z(u)==='sz';}
function atkTarget(c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:idx(t)});drive();}
function atkDirect(c){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:'direct'});drive();}
function dir(c){return battleTargetsV29(c.uid).direct;}
/* pass the turns for real (the draw, standby and Main Phase of each new turn are stepped through) */
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
/* my End Phase → the opponent turn (to its End Phase) → my next turn, Main Phase 1 */
function nextOwnTurn(){endTurn();endTurn();}
/* the opponent's turn: pass my turn, go to its Battle Phase */
function toOppBattle(){endTurn();phase('battle');}

/* name, host fixture, a monster that is NOT a valid host (null: any monster is a host), host ATK/DEF before, bonus */
const U=[
 ['ヴァイロン・テセラクト','ヴァイロン・ソルジャー','ワイト',1700,1000,0,0],
 ['ヴァイロン・ペンタクロ','ヴァイロン・ソルジャー','ワイト',1700,1000,0,0],
 ['バスター・ショットマン','ライオウ',null,1900,800,-500,-500],
 ['デス・デンドル','ブラッド・オーキス','ワイト',1700,1000,0,0],
 ['氷岩魔獣','灼岩魔獣','ワイト',1500,1000,0,0],
 ['灼岩魔獣','氷岩魔獣','ワイト',1500,1000,0,0]];
for(const [n,hn,bad,a0,d0,ba,bd] of U){
  fresh();const u=mon(n,0),h=mon(hn,0),x=bad?mon(bad,0):null;gameState.players[0].mz=[u,h].concat(x?[x]:[]);baselineA();
  ok(n+': the Union is offered its effect in the Monster Zone',canEffect('mz',u),JSON.stringify(zacts('mz',u)));
  equipU(u,h);
  ok(n+': equipped to the host ('+hn+')'+(x?' (the invalid monster is not equipped)':''),equippedTo(u,h)&&(!x||!(C(x).equippedBy&&C(x).equippedBy.length)),JSON.stringify([z(u),C(u)&&C(u).v46MonsterEquip]));
  ok(n+': stats while equipped (ATK '+(ba>=0?'+':'')+ba+' / DEF '+(bd>=0?'+':'')+bd+')',curATK(C(h))===a0+ba&&curDEF(C(h))===d0+bd,JSON.stringify([curATK(C(h)),curDEF(C(h))]));
  ok(n+': once per turn — no second use this turn',!canEffect('sz',u),JSON.stringify(zacts('sz',u)));
  nextOwnTurn();
  ok(n+': the next turn the equip can be released',canEffect('sz',u),JSON.stringify(zacts('sz',u)));
  releaseU(u);
  ok(n+': released: Special Summoned in Attack Position, the host back to its own stats',z(u)==='mz'&&C(u).pos==='atk'&&curATK(C(h))===a0&&!(C(h).equippedBy&&C(h).equippedBy.length),JSON.stringify([z(u),C(u)&&C(u).pos,curATK(C(h)),C(h).equippedBy]));
  audit(n);
}
/* the substitute scopes */
for(const [n,hn,mode] of [['ヴァイロン・テセラクト','ヴァイロン・ソルジャー','any'],['バスター・ショットマン','ライオウ','any'],['デス・デンドル','ブラッド・オーキス','battle'],['氷岩魔獣','灼岩魔獣','battle']]){
  fresh();const u=mon(n,0),h=mon(hn,0);gameState.players[0].mz=[u,h];baselineA();equipU(u,h);
  act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:idx(h),reason:'test',byDestroy:true});
  if(mode==='any') ok(n+': substitute for every destruction — destroyed by an effect, the Union is destroyed instead, the host stays',z(h)==='mz'&&z(u)==='grave',JSON.stringify([z(h),z(u)]));
  else ok(n+': substitute by battle only — destroyed by an effect, the host is destroyed (no substitute)',z(h)==='grave',JSON.stringify([z(h),z(u)]));
}
/* card effects */
function kill(n,hn,setup){
  fresh();const u=mon(n,0),h=mon(hn,0),f=mon('ワイト',1);gameState.players[0].mz=[u,h];gameState.players[1].mz=[f];const r={u,h,f};if(setup)setup(r);baselineA();
  equipU(u,h);gameState.phase='main1';phase('battle');atkTarget(h,f);return r;
}
{ const r=kill('ヴァイロン・テセラクト','ヴァイロン・ソルジャー',R=>{R.pk=mk('ヴァイロン・ペンタクロ',0);R.lw=mk('ライオウ',0);gameState.players[0].grave=[R.lw,R.pk];});
  ok('ヴァイロン・テセラクト: the equipped 「ヴァイロン」 destroys ワイト by battle → a Level 4 or lower 「ヴァイロン」 from my Graveyard is Special Summoned (ペンタクロ; ライオウ is not a candidate)',z(r.f)==='grave'&&z(r.pk)==='mz'&&z(r.lw)==='grave',JSON.stringify([z(r.f),z(r.pk),z(r.lw)]));
  audit('テセラクト effect'); }
{ fresh();const u=mon('ヴァイロン・ペンタクロ',0),h=mon('ヴァイロン・ソルジャー',0),f=mon('ワイト',1),g=mon('ライオウ',1);gameState.players[0].mz=[u,h];gameState.players[1].mz=[f,g];baselineA();
  equipU(u,h);phase('battle');PREFER=[uid(g)];atkTarget(h,f);PREFER=[];
  ok('ヴァイロン・ペンタクロ: destroys ワイト by battle → 1 card on the opponent field (ライオウ, chosen) is destroyed',z(f)==='grave'&&z(g)==='grave',JSON.stringify([z(f),z(g)]));
  audit('ペンタクロ effect'); }
{ fresh();const u=mon('バスター・ショットマン',0),h=mon('ライオウ',0),mine=mon('ゴブリンゾンビ',0),f=mon('ワイト',1),f2=mon('ワイト',1),f3=mon('ライオウ',1);
  gameState.players[0].mz=[u,h,mine];gameState.players[1].mz=[f,f2,f3];baselineA();
  equipU(u,h);phase('battle');atkTarget(h,f);
  ok('バスター・ショットマン: destroys ワイト (Zombie) by battle → every face-up Zombie on the field is destroyed (the other ワイト and my ゴブリンゾンビ); the others stay',z(f)==='grave'&&z(f2)==='grave'&&z(mine)==='grave'&&z(f3)==='mz'&&z(h)==='mz',JSON.stringify([z(f),z(f2),z(mine),z(f3),z(h)]));
  audit('バスター effect'); }
{ const r=kill('デス・デンドル','ブラッド・オーキス');
  const tok=gameState.players[0].mz.filter(c=>cardName(c)==='魔草トークン');
  ok('デス・デンドル: the equipped ブラッド・オーキス destroys ワイト by battle → one 魔草トークン (ATK/DEF 800) is Special Summoned',z(r.f)==='grave'&&tok.length===1&&curATK(tok[0])===800&&curDEF(tok[0])===800,JSON.stringify([z(r.f),tok.length]));
  audit('デンドル effect'); }
for(const [n,hn,faceDown] of [['氷岩魔獣','灼岩魔獣',true],['灼岩魔獣','氷岩魔獣',false]]){
  fresh();const u=mon(n,0),h=mon(hn,0),f=mon('ワイト',1),down=mk('サイクロン',1,'down'),up=mk('魔法都市エンディミオン',1,'up');down.setTurn=3;
  gameState.players[0].mz=[u,h];gameState.players[1].mz=[f];gameState.players[1].sz=[down];gameState.players[1].field=up;baselineA();   /* 魔法都市エンディミオン: a face-up Field Spell (no effect on these battles) */
  equipU(u,h);phase('battle');const l1=lp(1);atkTarget(h,f);
  const target=faceDown?down:up,other=faceDown?up:down;
  ok(n+': the equipped monster inflicts battle damage → 1 '+(faceDown?'face-down':'face-up')+' Spell / Trap on the field is destroyed (only that kind)',lp(1)<l1&&z(target)==='grave'&&z(other)===(faceDown?'field':'sz'),JSON.stringify([l1,lp(1),z(target),z(other)]));
  audit(n+' effect'); }
`);
