/* S03-U344: 霊魂の護送船, 神聖なる魂, 風の精霊 ガルーダ, 水の精霊 アクエリア, 氷炎の双竜, 電池メン－業務用, 真紅眼の闇竜, 邪龍アナンタ, 降雷皇ハモン, 磁石の戦士マグネット・バルキリオン, 虚栄の大猿.
   Real DUEL paths (hand procedures that banish / release / send, Standby / End Phase triggers, ignition effects, a level choice), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3440001;
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


const ESC='霊魂の護送船',HOL='神聖なる魂',GAR='風の精霊 ガルーダ',AQU='水の精霊 アクエリア',ICE='氷炎の双竜',BAT='電池メン－業務用',RED='真紅眼の闇竜',ANA='邪龍アナンタ',HAM='降雷皇ハモン',MAG='磁石の戦士マグネット・バルキリオン',APE='虚栄の大猿';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function mons(names,p){return names.map(n=>mk(n,p));}
function tgts(c){return battleTargetsV29(c.uid).targets.map(x=>x.card.uid);}
const LIGHT='ライトロード・ウォリアー ガロス',LIGHT2='サンダー・ドラゴン',WIND1='E・HERO フェザーマン',WIND2='C・チッキー',WAT1='N・アクア・ドルフィン',WAT2='C・ドルフィーナ',FIRE='E・HERO ザ・ヒート';

/* ===== 霊魂の護送船 / 神聖なる魂 ===== */
{ fresh();const e=mk(ESC,0),l=mk(LIGHT,0),w=mk('ワイト',0);gameState.players[0].hand=[e];gameState.players[0].grave=[l,w];baselineA();
  ok('護送船: legal with a LIGHT monster in the Graveyard; cannot be Normal Summoned',procOk(ESC,0)===true&&cannotNormalSummonS03(dbOf(e))===true,'');
  procRun(ESC,0);
  ok('護送船: Special Summoned, the LIGHT monster banished (the ワイト stays)',z(e)==='mz'&&z(l)==='banish'&&z(w)==='grave',JSON.stringify({e:z(e),l:z(l),w:z(w)}));
  audit('護送船 ①'); }
{ fresh();const e=mk(ESC,0),w=mk('ワイト',0);gameState.players[0].hand=[e];gameState.players[0].grave=[w];baselineA();
  ok('護送船 negative: no LIGHT monster → not legal',procOk(ESC,0)===false,''); }
{ fresh();const e=mk(ESC,0),l=mk(LIGHT,0);gameState.players[0].hand=[e];gameState.players[0].grave=[l];gameState.players[0].field=mk('王家の眠る谷－ネクロバレー',0);baselineA();
  ok('護送船 negative: ネクロバレー applies → not legal',procOk(ESC,0)===false,''); }
{ fresh();const h=mk(HOL,0),l1=mk(LIGHT,0),l2=mk(LIGHT2,0),f=mon('青眼の白龍',1);gameState.players[0].hand=[h];gameState.players[0].grave=[l1,l2];gameState.players[1].mz=[f];baselineA();
  ok('神聖なる魂: legal with two LIGHT monsters',procOk(HOL,0)===true,'');
  procRun(HOL,0);
  ok('神聖なる魂: Special Summoned, both banished',z(h)==='mz'&&z(l1)==='banish'&&z(l2)==='banish',JSON.stringify({h:z(h)}));
  ok('神聖なる魂: in my own turn the opponent\'s ATK is unchanged (3000)',curATK(C(f))===3000,String(curATK(C(f))));
  audit('神聖なる魂 ①');
  endTurn();
  ok('神聖なる魂: in the opponent\'s Main Phase unchanged',curATK(C(f))===3000,String(curATK(C(f))));
  phase('battle');
  ok('神聖なる魂: during the opponent\'s Battle Phase every opposing monster loses 300 ATK (2700)',curATK(C(f))===2700,String(curATK(C(f))));
  phase('main2');
  ok('神聖なる魂: back to 3000 after the Battle Phase',curATK(C(f))===3000,String(curATK(C(f)))); }
{ fresh();const h=mk(HOL,0),l1=mk(LIGHT,0);gameState.players[0].hand=[h];gameState.players[0].grave=[l1];baselineA();
  ok('神聖なる魂 negative: only one LIGHT monster → not legal',procOk(HOL,0)===false,''); }

/* ===== ガルーダ / アクエリア ===== */
{ fresh();const g=mk(GAR,0),w=mk(WIND1,0),f=mon('青眼の白龍',1);gameState.players[0].hand=[g];gameState.players[0].grave=[w];gameState.players[1].mz=[f];baselineA();
  ok('ガルーダ: legal with a WIND monster',procOk(GAR,0)===true,'');
  procRun(GAR,0);
  ok('ガルーダ: Special Summoned, the WIND monster banished',z(g)==='mz'&&z(w)==='banish',JSON.stringify({g:z(g),w:z(w)}));
  phase('end');
  ok('ガルーダ: at MY End Phase nothing happens (Attack Position stays)',C(f).pos==='atk',C(f).pos);
  endTurn();phase('end');
  ok('ガルーダ: at the opponent\'s End Phase the chosen face-up monster of theirs changed position (Attack → Defense)',C(f).pos==='def',C(f).pos);
  audit('ガルーダ ①'); }
{ fresh();const g=mk(GAR,0),f=mon('青眼の白龍',1);gameState.players[0].hand=[g];gameState.players[0].grave=[mk('ワイト',0)];baselineA();
  ok('ガルーダ negative: no WIND monster → not legal',procOk(GAR,0)===false,''); }
{ fresh();const a=mk(AQU,0),w=mk(WAT1,0),f=mon('青眼の白龍',1);gameState.players[0].hand=[a];gameState.players[0].grave=[w];gameState.players[1].mz=[f];baselineA();
  ok('アクエリア: legal with a WATER monster',procOk(AQU,0)===true,'');
  procRun(AQU,0);
  ok('アクエリア: Special Summoned, the WATER monster banished',z(a)==='mz'&&z(w)==='banish',JSON.stringify({a:z(a),w:z(w)}));
  audit('アクエリア ①');
  endTurn();
  ok('アクエリア: at the opponent\'s Standby Phase the chosen monster changed position (Attack → Defense)',C(f).pos==='def',C(f).pos);
  ok('アクエリア: and it cannot change its position this turn',cannotChangePositionV10(C(f))===true,'');
  endTurn();
  ok('アクエリア: the lock ends with that turn (my next turn)',cannotChangePositionV10(C(f))===false,String(C(f).u344AquariaTurn)+' now '+gameState.turn); }

/* ===== 氷炎の双竜 ===== */
{ fresh();const d=mk(ICE,0),w1=mk(WAT1,0),w2=mk(WAT2,0),fr=mk(FIRE,0);gameState.players[0].hand=[d];gameState.players[0].grave=[w1,w2,fr];baselineA();
  ok('氷炎の双竜: legal with 2 WATER + 1 FIRE monsters',procOk(ICE,0)===true,'');
  procRun(ICE,0);
  ok('氷炎の双竜: Special Summoned, the three banished',z(d)==='mz'&&[w1,w2,fr].every(c=>z(c)==='banish'),JSON.stringify({d:z(d),b:[w1,w2,fr].map(z)}));
  audit('氷炎 ①'); }
{ fresh();const d=mk(ICE,0),w1=mk(WAT1,0),w2=mk(WAT2,0);gameState.players[0].hand=[d];gameState.players[0].grave=[w1,w2];baselineA();
  ok('氷炎の双竜 negative: no FIRE monster → not legal',procOk(ICE,0)===false,''); }
{ fresh();const d=mon(ICE,0),h=mk('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[d];gameState.players[0].hand=[h];gameState.players[1].mz=[f];baselineA();
  PREFER=[uid(h),uid(f)];actZ(d);PREFER=[];
  ok('氷炎の双竜: discarded 1 (cost), destroyed the chosen monster (青眼)',z(h)==='grave'&&z(f)==='grave',JSON.stringify({h:z(h),f:z(f)}));
  ok('氷炎の双竜: once per turn',canZ(d)===false,'');
  audit('氷炎 ②'); }

/* ===== 電池メン－業務用 ===== */
{ fresh();const b=mk(BAT,0),a=mk('電池メン－単一型',0),c=mk('電池メン－単二型',0),x=mk('サンダー・ドラゴン',0);gameState.players[0].hand=[b];gameState.players[0].grave=[a,c,x];baselineA();
  ok('業務用: legal with two 「電池メン」 in the Graveyard',procOk(BAT,0)===true,'');
  procRun(BAT,0);
  ok('業務用: Special Summoned, the two 「電池メン」 banished (the other Thunder stays)',z(b)==='mz'&&z(a)==='banish'&&z(c)==='banish'&&z(x)==='grave',JSON.stringify({b:z(b),a:z(a),x:z(x)}));
  audit('業務用 ①'); }
{ fresh();const b=mon(BAT,0),x=mk('サンダー・ドラゴン',0),f=mon('青眼の白龍',1),f2=mon('ワイト',1),st=setCard('サイクロン',1);gameState.players[0].mz=[b];gameState.players[0].grave=[x];gameState.players[1].mz=[f,f2];gameState.players[1].sz=[st];baselineA();
  ok('業務用: the ignition effect is offered',canZ(b)===true,'');
  PREFER=[uid(x),uid(f),uid(st)];actZ(b);PREFER=[];
  ok('業務用: banished a Thunder from the Graveyard (cost), destroyed the chosen monster and Spell/Trap',z(x)==='banish'&&z(f)==='grave'&&z(st)==='grave'&&z(f2)==='mz',JSON.stringify({x:z(x),f:z(f),st:z(st),f2:z(f2)}));
  audit('業務用 ②'); }
{ fresh();const b=mon(BAT,0),x=mk('サンダー・ドラゴン',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[b];gameState.players[0].grave=[x];gameState.players[1].mz=[f];baselineA();
  ok('業務用 negative: no Spell/Trap card on the field → not offered',canZ(b)===false,''); }

/* ===== 真紅眼の闇竜 ===== */
{ fresh();const d=mk(RED,0),r=mon('真紅眼の黒竜',0),g1=mk('エレメント・ドラゴン',0);gameState.players[0].hand=[d];gameState.players[0].mz=[r];gameState.players[0].grave=[g1];baselineA();
  ok('闇竜: legal with 真紅眼の黒竜 on the field',procOk(RED,0)===true,'');
  procRun(RED,0);
  ok('闇竜: Special Summoned, 真紅眼の黒竜 released; ATK 2400 + 300 × 2 Dragons in the Graveyard (黒竜 + エレメント・ドラゴン) = 3000',z(d)==='mz'&&z(r)==='grave'&&curATK(C(d))===3000,JSON.stringify({d:z(d),atk:curATK(C(d))}));
  audit('闇竜 ①'); }
{ fresh();const d=mk(RED,0),w=mon('ワイト',0);gameState.players[0].hand=[d];gameState.players[0].mz=[w];baselineA();
  ok('闇竜 negative: no 真紅眼の黒竜 → not legal',procOk(RED,0)===false,''); }

/* ===== 邪龍アナンタ ===== */
{ fresh();const a=mk(ANA,0),r1=mon('C・スネーク',0),r2=mk('くちばしヘビ',0),r3=mk('エヴォルド・ウェストロ',0),w=mk('ワイト',0),foe=mon('青眼の白龍',1);gameState.players[0].hand=[a];gameState.players[0].mz=[r1];gameState.players[0].grave=[r2,r3,w];gameState.players[1].mz=[foe];baselineA();
  ok('アナンタ: legal with Reptiles on the field and in the Graveyard',procOk(ANA,0)===true,'');
  procRun(ANA,0);
  ok('アナンタ: every Reptile of mine (field + Graveyard) banished, the ワイト stays',z(a)==='mz'&&[r1,r2,r3].every(c=>z(c)==='banish')&&z(w)==='grave',JSON.stringify({a:z(a),b:[r1,r2,r3].map(z),w:z(w)}));
  ok('アナンタ: ATK/DEF = 3 × 600 = 1800',curATK(C(a))===1800&&curDEF(C(a))===1800,JSON.stringify({atk:curATK(C(a)),def:curDEF(C(a))}));
  audit('アナンタ ①');
  PREFER=[uid(foe)];phase('end');PREFER=[];
  ok('アナンタ: at my End Phase it destroys a chosen card of the field (青眼)',z(foe)==='grave',z(foe));
  audit('アナンタ ②'); }
{ fresh();const a=mk(ANA,0),w=mk('ワイト',0);gameState.players[0].hand=[a];gameState.players[0].grave=[w];baselineA();
  ok('アナンタ negative: no Reptile → not legal',procOk(ANA,0)===false,''); }

/* ===== 降雷皇ハモン ===== */
function hamon(){fresh();const h=mk(HAM,0),c1=setCard('「A」細胞培養装置',0),c2=setCard('「A」細胞増殖装置',0),c3=setCard('平和の使者',0);[c1,c2,c3].forEach(c=>{c.face='up';});gameState.players[0].hand=[h];gameState.players[0].sz=[c1,c2,c3];return {h,cs:[c1,c2,c3]};}
{ const x=hamon();baselineA();
  ok('ハモン: legal with three face-up Continuous Spells',procOk(HAM,0)===true&&cannotNormalSummonS03(dbOf(x.h))===true,'');
  procRun(HAM,0);
  ok('ハモン: Special Summoned, the three Continuous Spells sent to the Graveyard',z(x.h)==='mz'&&x.cs.every(c=>z(c)==='grave'),JSON.stringify({h:z(x.h),c:x.cs.map(z)}));
  audit('ハモン ①'); }
{ fresh();const h=mon(HAM,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);h.pos='def';gameState.players[0].mz=[h,w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const t=tgts(f);
  ok('ハモン: in Defense Position the opponent can attack only ハモン',t.length===1&&t[0]===h.uid,JSON.stringify({t,h:h.uid,w:w.uid})); }
{ fresh();const h=mon(HAM,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[h,w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const t=tgts(f);
  ok('ハモン negative: in Attack Position the other monster can be attacked too',t.indexOf(w.uid)>=0&&t.indexOf(h.uid)>=0,JSON.stringify(t)); }
{ fresh();const h=mon(HAM,0),f=mon('ワイト',1);gameState.players[0].mz=[h];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,h,f);
  ok('ハモン: destroyed ワイト by battle → 4000 − 300 battle damage + 1000 effect damage',z(f)==='grave'&&l1-lp(1)===3700+1000,JSON.stringify({f:z(f),loss:l1-lp(1)}));
  audit('ハモン ②'); }
{ fresh();const h=mk(HAM,0),c1=setCard('「A」細胞培養装置',0),c2=setCard('「A」細胞増殖装置',0);[c1,c2].forEach(c=>{c.face='up';});gameState.players[0].hand=[h];gameState.players[0].sz=[c1,c2];baselineA();
  ok('ハモン negative: only two Continuous Spells → not legal',procOk(HAM,0)===false,''); }

/* ===== 磁石の戦士マグネット・バルキリオン ===== */
{ fresh();const m=mk(MAG,0),a=mk('磁石の戦士α',0),b=mon('磁石の戦士β',0),c=mon('磁石の戦士γ',0);gameState.players[0].hand=[m,a];gameState.players[0].mz=[b,c];baselineA();
  ok('バルキリオン: legal with α in the hand and β, γ on the field',procOk(MAG,0)===true,'');
  procRun(MAG,0);
  ok('バルキリオン: Special Summoned, α (hand) / β / γ (field) released',z(m)==='mz'&&[a,b,c].every(x=>z(x)==='grave'),JSON.stringify({m:z(m),x:[a,b,c].map(z)}));
  audit('バルキリオン ①'); }
{ fresh();const m=mon(MAG,0),a=mk('磁石の戦士α',0),b=mk('磁石の戦士β',0),c=mk('磁石の戦士γ',0);gameState.players[0].mz=[m];gameState.players[0].grave=[a,b,c];baselineA();
  ok('バルキリオン: the ignition effect is offered',canZ(m)===true,'');
  actZ(m);
  ok('バルキリオン: released itself (cost), α / β / γ Special Summoned from the Graveyard',z(m)==='grave'&&[a,b,c].every(x=>z(x)==='mz'),JSON.stringify({m:z(m),x:[a,b,c].map(z)}));
  audit('バルキリオン ②'); }
{ fresh();const m=mk(MAG,0),a=mk('磁石の戦士α',0),b=mon('磁石の戦士β',0);gameState.players[0].hand=[m,a];gameState.players[0].mz=[b];baselineA();
  ok('バルキリオン negative: γ missing → not legal',procOk(MAG,0)===false,''); }
{ fresh();const m=mon(MAG,0),a=mk('磁石の戦士α',0),b=mk('磁石の戦士β',0);gameState.players[0].mz=[m];gameState.players[0].grave=[a,b];baselineA();
  ok('バルキリオン negative: γ not in the Graveyard → effect not offered',canZ(m)===false,''); }

/* ===== 虚栄の大猿 ===== */
function ape(choice){fresh();const p=mk(APE,0),b=mk('TG ラッシュ・ライノ',0),s=mk('ワイト',0);gameState.players[0].hand=[p,b,s];baselineA();
  PREFER=[uid(b),choice];runSummonProcedure(APE,0,'hand',0);if(!gameState.pendingSummon&&!pc()&&z(p)==='hand')finishSummonProcedure(APE,0,'hand',0,'atk');drive();PREFER=[];return {p,b};}
{ const x=ape('up');
  ok('大猿: a Beast (Lv 4) sent from the hand, Special Summoned; Level 5 + 4 = 9',z(x.p)==='mz'&&z(x.b)==='grave'&&curLV(C(x.p))===9,JSON.stringify({p:z(x.p),lv:curLV(C(x.p))}));
  audit('大猿 ①'); }
{ const x=ape('down');
  ok('大猿: the other choice: Level 5 − 4 = 1',z(x.p)==='mz'&&curLV(C(x.p))===1,JSON.stringify({lv:curLV(C(x.p))})); }
{ fresh();const p=mk(APE,0),s=mk('ワイト',0);gameState.players[0].hand=[p,s];baselineA();
  ok('大猿 negative: no Beast in the hand → not legal',procOk(APE,0)===false,''); }

console.log('U344 done');
`);
