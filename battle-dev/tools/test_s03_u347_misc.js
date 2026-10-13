/* S03-U347: フレムベル・デスガンナー, ネオフレムベル・シャーマン, 速攻の黒い忍者, インヴェルズ・グレズ, マジオシャレオン, ボタニカル・ライオ, 幻影の妖精, サモン・リアクター・AI.
   Real DUEL paths (restricted Normal Summons, Graveyard banish effects, Quick effects, redirects, Summon / attack triggers), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3470001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(c){duelActivateFromZone(0,'mz',idx(c));drive();}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}


const GUN='フレムベル・デスガンナー',SHA='ネオフレムベル・シャーマン',NIN='速攻の黒い忍者',GRE='インヴェルズ・グレズ',MAJ='マジオシャレオン',BOT='ボタニカル・ライオ',FAI='幻影の妖精',AIR='サモン・リアクター・AI';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function mons(names,p){return names.map(n=>mon(n,p));}
function tgts(c){return battleTargetsV29(c.uid).targets.map(x=>x.card.uid);}
function summonVia(i,tributes){const p=gameState.activePlayer,db=dbOf(gameState.players[p].hand[i]);const ms=normalSummonMethodsFor(db,p,'summon');const m=ms.find(x=>x.tributes===tributes)||ms[0];
  pickTributes(p,m.tributes,[],payment=>finishNormalSummon(i,'atk',payment,m.id,null),db,m,'summon');drive();}
function nsActs(i){return getLegalHandActions(0,i).map(a=>a.id);}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}

/* ===== フレムベル・デスガンナー ===== */
{ fresh();const g=mk(GUN,0),fl=mon('ガード・オブ・フレムベル',0),w=mk('ワイト',0);gameState.players[0].hand=[g];gameState.players[0].mz=[fl];gameState.players[0].grave=[w];baselineA();
  ok('デスガンナー: a 「フレムベル」 on the field → Normal Summon offered with one Tribute; cannot be Special Summoned',nsActs(0).indexOf('normalSummon')>=0&&API.specialSummon(0,'hand',0,'atk','test')===false,JSON.stringify(nsActs(0)));
  summonVia(0,1);
  ok('デスガンナー: Normal Summoned, the 「フレムベル」 released',z(g)==='mz'&&z(fl)==='grave',JSON.stringify({g:z(g),fl:z(fl)}));
  audit('デスガンナー ①'); }
{ fresh();const g=mk(GUN,0),x=mon('ワイト',0);gameState.players[0].hand=[g];gameState.players[0].mz=[x];baselineA();
  ok('デスガンナー negative: a non-「フレムベル」 Tribute → no Normal Summon',nsActs(0).indexOf('normalSummon')<0,JSON.stringify(nsActs(0))); }
{ fresh();const g=mon(GUN,0),w=mk('ワイト',0),o=mk('ブラック・マジシャン',0);gameState.players[0].mz=[g];gameState.players[0].grave=[w,o];baselineA();
  const l1=lp(1);PREFER=[uid(w)];actZ(g);PREFER=[];
  ok('デスガンナー: banished the DEF-200 ワイト from the Graveyard → 300 damage (its ATK); the other monster stays',z(w)==='banish'&&z(o)==='grave'&&l1-lp(1)===300,JSON.stringify({w:z(w),o:z(o),loss:l1-lp(1)}));
  ok('デスガンナー: once per turn',canZ(g)===false,'');
  audit('デスガンナー ②'); }
{ fresh();const g=mon(GUN,0),o=mk('ブラック・マジシャン',0);gameState.players[0].mz=[g];gameState.players[0].grave=[o];baselineA();
  ok('デスガンナー negative: no DEF-200 monster in the Graveyard → not offered',canZ(g)===false,''); }

/* ===== ネオフレムベル・シャーマン ===== */
function shaman(foeGrave,fl3){fresh();const s=mon(SHA,0),f=mon('ワイト',1);gameState.players[0].mz=[s];gameState.players[1].mz=[f];
  if(fl3)gameState.players[0].grave=[mk('ガード・オブ・フレムベル',0),mk('ネオフレムベル・オリジン',0),mk('ネオフレムベル・ガルーダ',0)];gameState.players[1].grave=foeGrave();baselineA();return {s,f};}
{ const x=shaman(()=>[mk('ブラック・マジシャン',1)],true);const bm=gameState.players[1].grave[0];
  phase('battle');const l1=lp(1);PREFER=[uid(bm)];atkTarget(0,x.s,x.f);PREFER=[];
  ok('シャーマン: with 3 「フレムベル」 in my Graveyard it destroyed ワイト → the chosen card of the opponent\'s Graveyard banished',z(x.f)==='grave'&&z(bm)==='banish',JSON.stringify({f:z(x.f),bm:z(bm)}));
  ok('シャーマン: no Spell Card in their Graveyard → 500 more damage (1700 − 300 battle + 500)',l1-lp(1)===1400+500,JSON.stringify({loss:l1-lp(1)}));
  audit('シャーマン ①'); }
{ const x=shaman(()=>[mk('ブラック・ホール',1)],true);const bh=gameState.players[1].grave[0];
  phase('battle');const l1=lp(1);PREFER=[uid(bh)];atkTarget(0,x.s,x.f);PREFER=[];
  ok('シャーマン: a Spell Card in their Graveyard → banished but no extra damage',z(bh)==='banish'&&l1-lp(1)===1400,JSON.stringify({bh:z(bh),loss:l1-lp(1)})); }
{ const x=shaman(()=>[mk('ブラック・マジシャン',1)],false);const bm=gameState.players[1].grave[0];
  phase('battle');atkTarget(0,x.s,x.f);
  ok('シャーマン negative: fewer than 3 「フレムベル」 in my Graveyard → nothing banished',z(bm)==='grave',z(bm)); }

/* ===== 速攻の黒い忍者 ===== */
function ninja(){fresh();const n=mon(NIN,0),d1=mk('ワイト',0),d2=mk('ワイト',0),d3=mk('青眼の白龍',0);gameState.players[0].mz=[n];gameState.players[0].grave=[d1,d2,d3];return {n,d1,d2,d3};}
{ const x=ninja();baselineA();
  ok('黒い忍者: the Quick Effect is offered with two DARK monsters in the Graveyard',canZ(x.n)===true,'');
  actZ(x.n);
  ok('黒い忍者: two DARK monsters banished (cost), the ninja banished',z(x.n)==='banish'&&z(x.d1)==='banish'&&z(x.d2)==='banish'&&z(x.d3)==='grave',JSON.stringify({n:z(x.n),d:[x.d1,x.d2,x.d3].map(z)}));
  audit('黒い忍者 ①');
  phase('end');
  ok('黒い忍者: back on the field at the End Phase',z(x.n)==='mz'&&C(x.n).face==='up',JSON.stringify({n:z(x.n)})); }
{ const x=ninja();baselineA();endTurn();
  actZ(x.n);
  ok('黒い忍者: banished in the opponent\'s turn',z(x.n)==='banish',z(x.n));
  phase('end');
  ok('黒い忍者: and back at that End Phase',z(x.n)==='mz',z(x.n)); }
{ fresh();const n=mon(NIN,0),d1=mk('ワイト',0),d2=mk('ジェムナイト・エメラル',0);gameState.players[0].mz=[n];gameState.players[0].grave=[d1,d2];baselineA();
  ok('黒い忍者 negative: only one DARK monster in the Graveyard → not offered',canZ(n)===false,''); }

/* ===== インヴェルズ・グレズ ===== */
{ fresh();const g=mk(GRE,0),a=mon('インヴェルズ・モース',0),b=mon('インヴェルズの先鋭',0),c=mon('インヴェルズの門番',0),f=mon('青眼の白龍',1),st=setCard('サイクロン',1);gameState.players[0].hand=[g];gameState.players[0].mz=[a,b,c];gameState.players[1].mz=[f];gameState.players[1].sz=[st];baselineA();
  ok('グレズ: three 「インヴェルズ」 on the field → Normal Summon offered; cannot be Special Summoned',nsActs(0).indexOf('normalSummon')>=0&&API.specialSummon(0,'hand',0,'atk','test')===false,JSON.stringify(nsActs(0)));
  summonVia(0,3);
  ok('グレズ: Normal Summoned, the three released',z(g)==='mz'&&[a,b,c].every(m=>z(m)==='grave'),JSON.stringify({g:z(g)}));
  audit('グレズ ①');
  ok('グレズ: the ignition effect is offered',canZ(g)===true,'');
  const l0=lp(0);actZ(g);
  ok('グレズ: half of my LP paid (8000 → 4000); every other card of the field destroyed',lp(0)===l0/2&&z(f)==='grave'&&z(st)==='grave'&&z(g)==='mz',JSON.stringify({lp0:lp(0),f:z(f),st:z(st),g:z(g)}));
  ok('グレズ: once per turn',canZ(g)===false,'');
  audit('グレズ ②'); }
{ fresh();const g=mk(GRE,0),a=mon('インヴェルズ・モース',0),b=mon('インヴェルズの先鋭',0),c=mon('ワイト',0);gameState.players[0].hand=[g];gameState.players[0].mz=[a,b,c];baselineA();
  ok('グレズ negative: only two 「インヴェルズ」 (a ワイト is the third) → no Normal Summon',nsActs(0).indexOf('normalSummon')<0,JSON.stringify(nsActs(0))); }

/* ===== マジオシャレオン ===== */
{ fresh();const m=mon(MAJ,0),w=mon('ワイト',0),f=mon('青眼の白龍',1),st=setCard('サイクロン',1);gameState.players[0].mz=[m,w];gameState.players[1].mz=[f];gameState.players[1].sz=[st];baselineA();
  toOppBattle();const t=tgts(f);
  ok('マジオシャレオン: while the attacker\'s field holds a Spell/Trap Card it cannot choose マジオシャレオン (ワイト yes)',t.indexOf(m.uid)<0&&t.indexOf(w.uid)>=0,JSON.stringify({t,m:m.uid,w:w.uid})); }
{ fresh();const m=mon(MAJ,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[m,w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const t=tgts(f);
  ok('マジオシャレオン negative: no Spell/Trap Card on their field → it can be attacked',t.indexOf(m.uid)>=0,JSON.stringify(t)); }
{ fresh();const m=mon(MAJ,0),f=mon('ワイト',1,'def');gameState.players[0].mz=[m];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,m,f);
  ok('マジオシャレオン: attacked a Defense Position ワイト (DEF 200): piercing 2000 − 200 = 1800',z(f)==='grave'&&l1-lp(1)===1800,JSON.stringify({f:z(f),loss:l1-lp(1)})); }

/* ===== ボタニカル・ライオ ===== */
{ fresh();const b=mon(BOT,0),p1=mon('E・HERO クノスペ',0),p2=mon('きのこマン',0),w=mon('ワイト',0);gameState.players[0].mz=[b,p1,p2,w];baselineA();
  ok('ボタニカル・ライオ: ATK 1600 + 300 × 3 face-up Plants (itself included) = 2500',curATK(C(b))===2500,String(curATK(C(b))));
  const f=mon('ワイト',1);gameState.players[1].mz=[f];
  API.changeControl(findCardByUid(b.uid),1,'test');drive();
  ok('ボタニカル・ライオ: its control cannot be changed',pl(b)===0&&z(b)==='mz',JSON.stringify({p:pl(b)})); }
{ fresh();const b=mon(BOT,0),w=mon('ワイト',0);b.face='down';b.pos='def';gameState.players[0].mz=[b,w];baselineA();
  ok('ボタニカル・ライオ negative: face-down it gets no bonus',curATK(C(b))===1600,String(curATK(C(b)))); }

/* ===== 幻影の妖精 ===== */
{ fresh();const fa=mon(FAI,0),em=mon('ジェムナイト・エメラル',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[fa,em];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,fa);
  ok('幻影の妖精: attacked → another monster of mine (エメラル) took the attack and was destroyed (3000 vs 1800); the fairy survives',z(fa)==='mz'&&z(em)==='grave',JSON.stringify({fa:z(fa),em:z(em)}));
  audit('妖精 ①'); }
{ fresh();const fa=mon(FAI,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[fa];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,fa);
  ok('幻影の妖精 negative: no other monster → it is destroyed by the attack as usual',z(fa)==='grave',z(fa)); }

/* ===== サモン・リアクター・AI ===== */
{ fresh();const ai=mon(AIR,0),f=mon('青眼の白龍',1),w=mk('ワイト',1),w2=mk('ワイト',1);gameState.activePlayer=1;gameState.players[0].mz=[ai];gameState.players[1].mz=[f];gameState.players[1].hand=[w,w2];baselineA();
  const l0=lp(0);doNormalSummon(0,'atk');drive();
  ok('AI: the opponent\'s Normal Summon → 800 damage to them (once per turn)',z(w)==='mz'&&lp(1)===7200&&lp(0)===l0,JSON.stringify({w:z(w),lp1:lp(1)}));
  audit('AI ①');
  phase('battle');const l0b=lp(0);foeAttack(f,ai);
  ok('AI: in that turn\'s Battle Phase it negates one attack (no damage, nothing destroyed)',z(ai)==='mz'&&lp(0)===l0b,JSON.stringify({ai:z(ai),loss:l0b-lp(0)})); }
{ fresh();const ai=mon(AIR,0),f=mon('青眼の白龍',1);gameState.activePlayer=1;gameState.players[0].mz=[ai];gameState.players[1].mz=[f];baselineA();
  phase('battle');foeAttack(f,ai);
  ok('AI negative: no summon of the opponent this turn → the attack is not negated (AI destroyed)',z(ai)==='grave',z(ai)); }
{ fresh();const ai=mon(AIR,0),rr=mon('トラップ・リアクター・RR',0),aid=mon('マジック・リアクター・AID',0),bo=mk('ジャイアント・ボマー・エアレイド',0);gameState.players[0].mz=[ai,rr,aid];gameState.players[0].hand=[bo];baselineA();
  ok('AI: the ignition effect is offered with AI + RR + AID on my field',canZ(ai)===true,'');
  actZ(ai);
  ok('AI: the three sent to the Graveyard, ジャイアント・ボマー・エアレイド Special Summoned from the hand',z(bo)==='mz'&&[ai,rr,aid].every(c=>z(c)==='grave'),JSON.stringify({bo:z(bo),c:[ai,rr,aid].map(z)}));
  audit('AI ②'); }
{ fresh();const ai=mon(AIR,0),rr=mon('トラップ・リアクター・RR',0),bo=mk('ジャイアント・ボマー・エアレイド',0);gameState.players[0].mz=[ai,rr];gameState.players[0].hand=[bo];baselineA();
  ok('AI negative: マジック・リアクター・AID missing → not offered',canZ(ai)===false,''); }

console.log('U347 done');
`);
