/* S03-U343: デザート・ツイスター, フェンリル, デビルドーザー, メガロック・ドラゴン, モンタージュ・ドラゴン, マスターモンク, 原始太陽ヘリオス, ヘリオス・デュオ・メギストス, ヘリオス・トリス・メギストス.
   Real DUEL paths (hand procedures that banish / discard / release, variable counts, banished-count ATK, End Phase revivals), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3430001;
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


const DST='デザート・ツイスター',FEN='フェンリル',DOZ='デビルドーザー',MEG='メガロック・ドラゴン',MON='モンタージュ・ドラゴン',MAS='マスターモンク',HEL='原始太陽ヘリオス',DUO='ヘリオス・デュオ・メギストス',TRI='ヘリオス・トリス・メギストス';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function mons(names,p){return names.map(n=>mk(n,p));}

/* ===== デザート・ツイスター ===== */
function twister(){fresh();const t=mk(DST,0),w1=mk('E・HERO フェザーマン',0),w2=mk('C・チッキー',0),e=mk('C・モーグ',0),x=mk('ワイト',0);gameState.players[0].hand=[t];gameState.players[0].grave=[w1,w2,e,x];return {t,w1,w2,e,x};}
{ const x=twister();baselineA();
  ok('ツイスター: legal with two WIND and one EARTH monster in the Graveyard',procOk(DST,0)===true,'');
  ok('ツイスター: cannot be Normal Summoned',cannotNormalSummonS03(dbOf(x.t))===true,'');
  procRun(DST,0);
  ok('ツイスター: Special Summoned, the 3 monsters banished (the ワイト stays)',z(x.t)==='mz'&&[x.w1,x.w2,x.e].every(c=>z(c)==='banish')&&z(x.x)==='grave',JSON.stringify({t:z(x.t),b:[x.w1,x.w2,x.e].map(z),x:z(x.x)}));
  audit('ツイスター ①'); }
{ const x=twister();x.w2.id=findCardIndex('ワイト');baselineA();
  ok('ツイスター negative: only one WIND monster → not legal',procOk(DST,0)===false,''); }
{ fresh();const t=mon(DST,0),d=mk('ワイト',0),st=setCard('サイクロン',1),fz=mk('王家の眠る谷－ネクロバレー',1);gameState.players[0].mz=[t];gameState.players[0].hand=[d];gameState.players[1].sz=[st];gameState.players[1].field=fz;baselineA();
  ok('ツイスター: the ignition effect is offered',canZ(t)===true,'');
  PREFER=[uid(d),uid(st)];actZ(t);PREFER=[];
  ok('ツイスター: discarded 1 card (cost), destroyed the chosen Spell/Trap (the Field Spell stays)',z(d)==='grave'&&z(st)==='grave'&&z(fz)==='field',JSON.stringify({d:z(d),st:z(st),fz:z(fz)}));
  ok('ツイスター: once per turn',canZ(t)===false,'');
  audit('ツイスター ②'); }
{ fresh();const t=mon(DST,0),st=setCard('サイクロン',1);gameState.players[0].mz=[t];gameState.players[1].sz=[st];baselineA();
  ok('ツイスター negative: no card in the hand to discard → not offered',canZ(t)===false,''); }

/* ===== フェンリル ===== */
{ fresh();const f=mk(FEN,0),a=mk('N・アクア・ドルフィン',0),b=mk('C・ドルフィーナ',0);gameState.players[0].hand=[f];gameState.players[0].grave=[a,b];baselineA();
  ok('フェンリル: legal with two WATER monsters',procOk(FEN,0)===true,'');
  procRun(FEN,0);
  ok('フェンリル: Special Summoned, the two WATER monsters banished',z(f)==='mz'&&z(a)==='banish'&&z(b)==='banish',JSON.stringify({f:z(f),a:z(a),b:z(b)}));
  audit('フェンリル ①'); }
{ fresh();const f=mon(FEN,0),fo=mon('ワイト',1);gameState.players[0].mz=[f];gameState.players[1].mz=[fo];baselineA();
  phase('battle');atkTarget(0,f,fo);
  ok('フェンリル: destroyed ワイト by battle',z(fo)==='grave',z(fo));
  phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();
  ok('フェンリル: the opponent\'s next Draw Phase is marked as skipped (one-shot, for that turn)',gameState.activePlayer===1&&phaseSkippedV7(gameState,1,'draw')===true,JSON.stringify({ap:gameState.activePlayer,sk:gameState.phaseSkipV7}));
  audit('フェンリル ②'); }
{ fresh();const f=mon(FEN,0),fo=mon('ワイト',1);gameState.players[0].mz=[f];gameState.players[1].mz=[fo];baselineA();
  phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();
  ok('フェンリル control: without a battle destruction no Draw Phase skip is set',gameState.activePlayer===1&&phaseSkippedV7(gameState,1,'draw')===false,JSON.stringify(gameState.phaseSkipV7)); }
{ fresh();const f=mk(FEN,0),a=mk('N・アクア・ドルフィン',0);gameState.players[0].hand=[f];gameState.players[0].grave=[a];baselineA();
  ok('フェンリル negative: only one WATER monster → not legal',procOk(FEN,0)===false,''); }

/* ===== デビルドーザー ===== */
{ fresh();const d=mk(DOZ,0),i1=mk('アーマード・ビー',0),i2=mk('インフォーマー・スパイダー',0),w=mk('ワイト',0);gameState.players[0].hand=[d];gameState.players[0].grave=[i1,i2,w];baselineA();
  ok('デビルドーザー: legal with two Insects',procOk(DOZ,0)===true,'');
  procRun(DOZ,0);
  ok('デビルドーザー: Special Summoned, the two Insects banished',z(d)==='mz'&&z(i1)==='banish'&&z(i2)==='banish'&&z(w)==='grave',JSON.stringify({d:z(d),i:[i1,i2].map(z)}));
  audit('デビルドーザー ①');
  endTurn();endTurn();phase('battle');const d1=gameState.players[1].deck.length,l1=lp(1);atkTarget(0,d,'direct');
  ok('デビルドーザー: its direct attack (2800) mills the opponent\'s top card',l1-lp(1)===2800&&gameState.players[1].deck.length===d1-1,JSON.stringify({loss:l1-lp(1),d:[d1,gameState.players[1].deck.length]})); }
{ fresh();const d=mk(DOZ,0),i1=mk('アーマード・ビー',0);gameState.players[0].hand=[d];gameState.players[0].grave=[i1];baselineA();
  ok('デビルドーザー negative: only one Insect → not legal',procOk(DOZ,0)===false,''); }

/* ===== メガロック・ドラゴン ===== */
function mega(prefer,n){fresh();const m=mk(MEG,0),r=mons(['はにわ','はにわ','はにわ'],0);gameState.players[0].hand=[m];gameState.players[0].grave=r.slice();baselineA();
  runSummonProcedure(MEG,0,'hand',0);PREFER=prefer(r);if(!gameState.pendingSummon&&!pc()&&z(m)==='hand')finishSummonProcedure(MEG,0,'hand',0,'atk');drive();PREFER=[];return {m,r};}
{ const x=mega(r=>[uid(r[0]),uid(r[1]),uid(r[2])]);
  ok('メガロック: three Rock monsters banished → Special Summoned with ATK/DEF 3 × 700 = 2100',z(x.m)==='mz'&&x.r.every(c=>z(c)==='banish')&&curATK(C(x.m))===2100&&curDEF(C(x.m))===2100,JSON.stringify({m:z(x.m),atk:curATK(C(x.m)),def:curDEF(C(x.m))}));
  audit('メガロック ①'); }
{ const x=mega(r=>[uid(r[0]),'done']);
  ok('メガロック: banishing one Rock monster then 「decide」 → 700/700',z(x.m)==='mz'&&z(x.r[0])==='banish'&&z(x.r[1])==='grave'&&curATK(C(x.m))===700,JSON.stringify({m:z(x.m),r:x.r.map(z),atk:curATK(C(x.m))})); }
{ fresh();const m=mk(MEG,0),w=mk('ワイト',0);gameState.players[0].hand=[m];gameState.players[0].grave=[w];baselineA();
  ok('メガロック negative: no Rock monster in the Graveyard → not legal',procOk(MEG,0)===false,''); }

/* ===== モンタージュ・ドラゴン ===== */
{ fresh();const m=mk(MON,0),a=mk('ワイト',0),b=mk('ジェムナイト・エメラル',0),c=mk('ブラック・マジシャン',0),sp=mk('サイクロン',0);gameState.players[0].hand=[m,a,b,c,sp];baselineA();
  ok('モンタージュ: legal with three monsters in the hand',procOk(MON,0)===true,'');
  PREFER=[uid(a),uid(b),uid(c)];procRun(MON,0);PREFER=[];
  ok('モンタージュ: the three monsters sent (Lv 1 + 4 + 7 = 12) → ATK 12 × 300 = 3600; the Spell stays in the hand',z(m)==='mz'&&[a,b,c].every(x=>z(x)==='grave')&&z(sp)==='hand'&&curATK(C(m))===3600,JSON.stringify({m:z(m),atk:curATK(C(m)),sp:z(sp)}));
  audit('モンタージュ ①'); }
{ fresh();const m=mk(MON,0),a=mk('ワイト',0),b=mk('ジェムナイト・エメラル',0);gameState.players[0].hand=[m,a,b];baselineA();
  ok('モンタージュ negative: only two other monsters → not legal',procOk(MON,0)===false,''); }

/* ===== マスターモンク ===== */
{ fresh();const m=mk(MAS,0),mf=mon('モンク・ファイター',0),f1=mon('ワイト',1),f2=mon('ワイト',1),f3=mon('ワイト',1);gameState.players[0].hand=[m];gameState.players[0].mz=[mf];gameState.players[1].mz=[f1,f2,f3];baselineA();
  ok('マスターモンク: legal with モンク・ファイター on the field; cannot be Normal Summoned',procOk(MAS,0)===true&&cannotNormalSummonS03(dbOf(m))===true,'');
  procRun(MAS,0);
  ok('マスターモンク: Special Summoned, モンク・ファイター released',z(m)==='mz'&&z(mf)==='grave',JSON.stringify({m:z(m),mf:z(mf)}));
  audit('マスターモンク ①');
  endTurn();endTurn();phase('battle');atkTarget(0,m,f1);atkTarget(0,m,f2);
  ok('マスターモンク: two attacks in one Battle Phase',z(f1)==='grave'&&z(f2)==='grave'&&z(f3)==='mz',JSON.stringify({f1:z(f1),f2:z(f2),f3:z(f3)}));
  atkTarget(0,m,f3);
  ok('マスターモンク: no third attack',z(f3)==='mz',z(f3)); }
{ fresh();const m=mk(MAS,0),w=mon('ワイト',0);gameState.players[0].hand=[m];gameState.players[0].mz=[w];baselineA();
  ok('マスターモンク negative: no モンク・ファイター → not legal',procOk(MAS,0)===false,''); }

/* ===== 原始太陽ヘリオス ===== */
function banishFill(p,n){gameState.players[p].banish=Array.from({length:n},()=>{const c=mk('ワイト',p);return c;});}
{ fresh();const h=mon(HEL,0);gameState.players[0].mz=[h];banishFill(0,3);banishFill(1,2);gameState.players[1].banish.push(mk('ブラック・ホール',1));baselineA();
  ok('ヘリオス: ATK/DEF = banished monsters (3 + 2, the Spell not counted) × 100 = 500',curATK(C(h))===500&&curDEF(C(h))===500,JSON.stringify({atk:curATK(C(h)),def:curDEF(C(h))}));
  }
{ fresh();const h=mon(HEL,0);gameState.players[0].mz=[h];baselineA();
  ok('ヘリオス: nothing banished → 0/0',curATK(C(h))===0&&curDEF(C(h))===0,String(curATK(C(h)))); }

/* ===== ヘリオス・デュオ・メギストス ===== */
{ fresh();const d=mk(DUO,0),h=mon(HEL,0),f=mon('青眼の白龍',1);gameState.players[0].hand=[d];gameState.players[0].mz=[h];gameState.players[1].mz=[f];banishFill(0,5);baselineA();
  ok('デュオ: legal with 原始太陽ヘリオス on the field',procOk(DUO,0)===true,'');
  procRun(DUO,0);
  ok('デュオ: Special Summoned, ヘリオス released; ATK/DEF = 5 × 200 = 1000',z(d)==='mz'&&z(h)==='grave'&&curATK(C(d))===1000&&curDEF(C(d))===1000,JSON.stringify({d:z(d),h:z(h),atk:curATK(C(d))}));
  audit('デュオ ①');
  endTurn();endTurn();phase('battle');atkTarget(0,d,f);
  ok('デュオ: destroyed in battle by 青眼 (3000 vs 1000)',z(d)==='grave',z(d));
  phase('end');
  ok('デュオ: at the End Phase it is Special Summoned back with +300 ATK/DEF (1000 + 300)',z(d)==='mz'&&curATK(C(d))===1300&&curDEF(C(d))===1300,JSON.stringify({d:z(d),atk:curATK(C(d))}));
  audit('デュオ ②'); }
{ fresh();const d=mk(DUO,0),w=mon('ワイト',0);gameState.players[0].hand=[d];gameState.players[0].mz=[w];baselineA();
  ok('デュオ negative: no 原始太陽ヘリオス → not legal',procOk(DUO,0)===false,''); }

/* ===== ヘリオス・トリス・メギストス ===== */
{ fresh();const t=mk(TRI,0),d=mon(DUO,0),f1=mon('ワイト',1),f2=mon('ワイト',1),f3=mon('ワイト',1);gameState.players[0].hand=[t];gameState.players[0].mz=[d];gameState.players[1].mz=[f1,f2,f3];banishFill(0,10);baselineA();
  ok('トリス: legal with ヘリオス・デュオ・メギストス on the field',procOk(TRI,0)===true,'');
  procRun(TRI,0);
  ok('トリス: Special Summoned, デュオ released; ATK/DEF = 10 × 300 = 3000',z(t)==='mz'&&z(d)==='grave'&&curATK(C(t))===3000&&curDEF(C(t))===3000,JSON.stringify({t:z(t),atk:curATK(C(t))}));
  audit('トリス ①');
  endTurn();endTurn();phase('battle');atkTarget(0,t,f1);atkTarget(0,t,f2);
  ok('トリス: with monsters on the opponent\'s field it attacks twice',z(f1)==='grave'&&z(f2)==='grave'&&z(f3)==='mz',JSON.stringify({f1:z(f1),f2:z(f2),f3:z(f3)}));
  atkTarget(0,t,f3);
  ok('トリス: no third attack',z(f3)==='mz',z(f3)); }
{ fresh();const t=mk(TRI,0),w=mon('ワイト',0);gameState.players[0].hand=[t];gameState.players[0].mz=[w];baselineA();
  ok('トリス negative: no ヘリオス・デュオ・メギストス → not legal',procOk(TRI,0)===false,''); }

console.log('U343 done');
`);
