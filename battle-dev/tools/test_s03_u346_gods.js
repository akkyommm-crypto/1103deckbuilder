/* S03-U346: 邪神ドレッド・ルート, 邪神イレイザー, 邪神アバター, 堕天使ディザイア, 神鳥シムルグ, 黒の魔法神官, 幻魔皇ラビエル.
   Real DUEL paths (3-Tribute Normal Summons, restricted Advance Summons, End Phase damage, a Trap response from the field, a token on the opponent summon), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3460001;
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


const DRD='邪神ドレッド・ルート',ERA='邪神イレイザー',AVA='邪神アバター',DES='堕天使ディザイア',SIM='神鳥シムルグ',MAS='黒の魔法神官',RAV='幻魔皇ラビエル';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function mons(names,p){return names.map(n=>mon(n,p));}
function summonVia(i,tributes){const p=gameState.activePlayer,db=dbOf(gameState.players[p].hand[i]);const ms=normalSummonMethodsFor(db,p,'summon');const m=ms.find(x=>x.tributes===tributes)||ms[0];
  pickTributes(p,m.tributes,[],payment=>finishNormalSummon(i,'atk',payment,m.id,null),db,m,'summon');drive();}
function nsActs(i){return getLegalHandActions(0,i).map(a=>a.id);}
function lockWhy(p,c){return activationTypeLockReasonS03(p,c,'hand',dbOf(c));}

/* ===== 邪神ドレッド・ルート ===== */
{ fresh();const g=mk(DRD,0),a=mon('ワイト',0),b=mon('ワイト',0),c=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].hand=[g];gameState.players[0].mz=[a,b,c];gameState.players[1].mz=[f];baselineA();
  ok('ドレッド・ルート: offered as a Normal Summon with three monsters on the field',nsActs(0).indexOf('normalSummon')>=0,JSON.stringify(nsActs(0)));
  summonVia(0,3);
  ok('ドレッド・ルート: Normal Summoned, the three monsters released (4000/4000)',z(g)==='mz'&&[a,b,c].every(m=>z(m)==='grave')&&curATK(C(g))===4000,JSON.stringify({g:z(g),m:[a,b,c].map(z)}));
  ok('ドレッド・ルート: every other monster\'s ATK / DEF is halved (青眼 3000/2500 → 1500/1250), itself not',curATK(C(f))===1500&&curDEF(C(f))===1250&&curATK(C(g))===4000,JSON.stringify({atk:curATK(C(f)),def:curDEF(C(f))}));
  audit('ドレッド ①'); }
{ fresh();const g=mk(DRD,0),a=mon('ワイト',0),b=mon('ワイト',0);gameState.players[0].hand=[g];gameState.players[0].mz=[a,b];baselineA();
  ok('ドレッド・ルート negative: only two monsters → no Normal Summon',nsActs(0).indexOf('normalSummon')<0,JSON.stringify(nsActs(0)));
  ok('ドレッド・ルート: cannot be Special Summoned',API.specialSummon(0,'hand',0,'atk','test')===false&&z(g)==='hand',z(g)); }

/* ===== 邪神イレイザー ===== */
{ fresh();const e=mk(ERA,0),a=mon('ワイト',0),b=mon('ワイト',0),c=mon('ワイト',0),f1=mon('青眼の白龍',1),f2=mon('ワイト',1),st=setCard('サイクロン',1);gameState.players[0].hand=[e];gameState.players[0].mz=[a,b,c];gameState.players[1].mz=[f1,f2];gameState.players[1].sz=[st];baselineA();
  summonVia(0,3);
  ok('イレイザー: Normal Summoned; ATK/DEF = the opponent\'s 3 cards × 1000 = 3000',z(e)==='mz'&&curATK(C(e))===3000&&curDEF(C(e))===3000,JSON.stringify({e:z(e),atk:curATK(C(e))}));
  audit('イレイザー ①');
  ok('イレイザー: the ignition effect is offered',canZ(e)===true,'');
  actZ(e);
  ok('イレイザー: destroyed itself → every card on the field destroyed (both sides, including the Set Trap)',z(e)==='grave'&&[f1,f2,st].every(c2=>z(c2)==='grave'),JSON.stringify({e:z(e),f:[f1,f2,st].map(z)}));
  audit('イレイザー ②'); }
{ fresh();const e=mon(ERA,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[e];gameState.players[1].mz=[f];baselineA();
  ok('イレイザー: ATK/DEF 1 × 1000 with one opposing card',curATK(C(e))===1000,String(curATK(C(e))));
  toOppBattle();foeAttackE(f,e);
  ok('イレイザー: destroyed by battle (青眼 3000 vs 1000) → the field is wiped too',z(e)==='grave'&&z(f)==='grave',JSON.stringify({e:z(e),f:z(f)})); }
function foeAttackE(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}

/* ===== 邪神アバター ===== */
{ fresh();const av=mk(AVA,0),a=mon('ワイト',0),b=mon('ワイト',0),c=mon('ワイト',0),f=mon('青眼の白龍',1),sp=mk('サイクロン',1);gameState.players[0].hand=[av];gameState.players[0].mz=[a,b,c];gameState.players[1].mz=[f];gameState.players[1].hand=[sp];baselineA();
  summonVia(0,3);
  ok('アバター: Normal Summoned; ATK/DEF = the highest ATK among the others (青眼 3000) + 100 = 3100',z(av)==='mz'&&curATK(C(av))===3100&&curDEF(C(av))===3100,JSON.stringify({av:z(av),atk:curATK(C(av))}));
  ok('アバター: not locked during my own turn',lockWhy(1,sp)==='','');
  audit('アバター ①');
  endTurn();ok('アバター: the opponent\'s first turn: Spell/Trap activation locked',lockWhy(1,sp)!=='',lockWhy(1,sp));
  endTurn();ok('アバター: my turn: no lock for them yet counted',lockWhy(1,sp)==='','');
  endTurn();ok('アバター: the opponent\'s second turn: locked again',lockWhy(1,sp)!=='',lockWhy(1,sp));
  endTurn();endTurn();ok('アバター: afterwards the lock is gone',lockWhy(1,sp)==='','');  }

/* ===== 堕天使ディザイア ===== */
{ fresh();const d=mk(DES,0),an=mon('クリボン',0),f=mon('青眼の白龍',1);gameState.players[0].hand=[d];gameState.players[0].mz=[an];gameState.players[1].mz=[f];baselineA();
  const ms=normalSummonMethodsFor(dbOf(d),0,'summon');
  ok('ディザイア: with an Angel on the field a 1-Tribute method is offered',ms.some(m=>m.tributes===1),JSON.stringify(ms.map(m=>[m.id,m.tributes])));
  summonVia(0,1);
  ok('ディザイア: Advance Summoned by releasing the Angel',z(d)==='mz'&&z(an)==='grave',JSON.stringify({d:z(d),an:z(an)}));
  audit('ディザイア ①');
  ok('ディザイア: the ignition effect is offered',canZ(d)===true,'');
  PREFER=[uid(f)];actZ(d);PREFER=[];
  ok('ディザイア: ATK −1000 (3000 → 2000) and the chosen opposing monster sent to the Graveyard',curATK(C(d))===2000&&z(f)==='grave',JSON.stringify({atk:curATK(C(d)),f:z(f)}));
  ok('ディザイア: once per turn',canZ(d)===false,'');
  audit('ディザイア ②'); }
{ fresh();const d=mk(DES,0),w=mon('ワイト',0);gameState.players[0].hand=[d];gameState.players[0].mz=[w];baselineA();
  const ms=normalSummonMethodsFor(dbOf(d),0,'summon');
  ok('ディザイア negative: a non-Angel Tribute cannot make the 1-Tribute Summon',!ms.some(m=>m.tributes===1),JSON.stringify(ms.map(m=>[m.id,m.tributes]))); }

/* ===== 神鳥シムルグ ===== */
{ fresh();const s=mk(SIM,0),a=mon('E・HERO フェザーマン',0),b=mon('C・チッキー',0);gameState.players[0].hand=[s];gameState.players[0].mz=[a,b];baselineA();
  const ms=normalSummonMethodsFor(dbOf(s),0,'summon');
  ok('シムルグ: two WIND monsters make the Advance Summon possible',ms.length>=1&&ms.every(m=>m.tributes===2),JSON.stringify(ms.map(m=>[m.id,m.tributes])));
  summonVia(0,2);
  ok('シムルグ: Advance Summoned, the WIND monsters released',z(s)==='mz'&&z(a)==='grave'&&z(b)==='grave',JSON.stringify({s:z(s)}));
  audit('シムルグ ①');
  const l0=lp(0),l1=lp(1);phase('end');
  ok('シムルグ: at my End Phase both players take 1000 (no Spell/Trap Cards controlled)',l0-lp(0)===1000&&l1-lp(1)===1000,JSON.stringify({l0:l0-lp(0),l1:l1-lp(1)}));
  const m0=lp(0),m1=lp(1);requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();phase('end');
  ok('シムルグ: and again at the opponent\'s End Phase',m0-lp(0)===1000&&m1-lp(1)===1000,JSON.stringify({l0:m0-lp(0),l1:m1-lp(1)})); }
{ fresh();const s=mon(SIM,0),st1=setCard('サイクロン',0),st2=setCard('サイクロン',1),st3=setCard('サイクロン',1);gameState.players[0].mz=[s];gameState.players[0].sz=[st1];gameState.players[1].sz=[st2,st3];baselineA();
  const l0=lp(0),l1=lp(1);phase('end');
  ok('シムルグ: 500 less per Spell/Trap Card controlled (me 1 → 500, the opponent 2 → 0)',l0-lp(0)===500&&l1-lp(1)===0,JSON.stringify({l0:l0-lp(0),l1:l1-lp(1)})); }
{ fresh();const s=mk(SIM,0),a=mon('ワイト',0),b=mon('ワイト',0);gameState.players[0].hand=[s];gameState.players[0].mz=[a,b];baselineA();
  const ms=normalSummonMethodsFor(dbOf(s),0,'summon');
  ok('シムルグ negative: non-WIND Tributes → no Advance Summon method',ms.length===0,JSON.stringify(ms.map(m=>[m.id,m.tributes]))); }

/* ===== 黒の魔法神官 ===== */
{ fresh();const m=mk(MAS,0),a=mon('ブラック・マジシャン',0),b=mon('ブラック・マジシャン',0),w=mon('ワイト',0);gameState.players[0].hand=[m];gameState.players[0].mz=[a,b,w];baselineA();
  ok('黒の魔法神官: legal with two Level 6+ Spellcasters; cannot be Normal Summoned',procOk(MAS,0)===true&&cannotNormalSummonS03(dbOf(m))===true,'');
  procRun(MAS,0);
  ok('黒の魔法神官: Special Summoned, the two Spellcasters released (the ワイト stays)',z(m)==='mz'&&z(a)==='grave'&&z(b)==='grave'&&z(w)==='mz',JSON.stringify({m:z(m),w:z(w)}));
  audit('神官 ①'); }
{ fresh();const m=mk(MAS,0),a=mon('ブラック・マジシャン',0),w=mon('ワイト',0);gameState.players[0].hand=[m];gameState.players[0].mz=[a,w];baselineA();
  ok('黒の魔法神官 negative: only one Level 6+ Spellcaster → not legal',procOk(MAS,0)===false,''); }
{ fresh();const m=mon(MAS,0),tr=setCard('リビングデッドの呼び声',1),gy=mk('青眼の白龍',1);gameState.activePlayer=1;gameState.players[0].mz=[m];gameState.players[1].sz=[tr];gameState.players[1].grave=[gy];baselineA();
  PREFER=[uid(gy)];duelActivateFromZone(1,'sz',0);for(let i=0;i<6&&pc();i++)pick();PREFER=[];
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(0):[];
  ok('黒の魔法神官: offered against the opponent\'s Trap Card activation',resp.some(x=>x.card===m),JSON.stringify(resp.map(x=>x.db.n)));
  duelActivateResponseV2(0,'mz',0);drive();
  ok('黒の魔法神官: the Trap negated and destroyed — 青眼 was not revived',z(tr)==='grave'&&z(gy)==='grave',JSON.stringify({tr:z(tr),gy:z(gy)}));
  audit('神官 ②'); }

/* ===== 幻魔皇ラビエル ===== */
{ fresh();const r=mk(RAV,0),d1=mon('デーモンの召喚',0),d2=mon('デーモンの召喚',0),d3=mon('デーモンの召喚',0);gameState.players[0].hand=[r];gameState.players[0].mz=[d1,d2,d3];baselineA();
  ok('ラビエル: legal with three Fiends; cannot be Normal Summoned',procOk(RAV,0)===true&&cannotNormalSummonS03(dbOf(r))===true,'');
  procRun(RAV,0);
  ok('ラビエル: Special Summoned, the three Fiends released',z(r)==='mz'&&[d1,d2,d3].every(c=>z(c)==='grave'),JSON.stringify({r:z(r)}));
  audit('ラビエル ①'); }
{ fresh();const r=mk(RAV,0),d1=mon('デーモンの召喚',0),w=mon('ワイト',0);gameState.players[0].hand=[r];gameState.players[0].mz=[d1,w];baselineA();
  ok('ラビエル negative: only one Fiend → not legal',procOk(RAV,0)===false,''); }
{ fresh();const r=mon(RAV,0),bm=mon('ブラック・マジシャン',0);gameState.players[0].mz=[r,bm];baselineA();
  const a0=curATK(C(r));PREFER=[uid(bm)];actZ(r);PREFER=[];
  ok('ラビエル: released ブラック・マジシャン (2500) → ATK 4000 + 2500 until the End Phase',z(bm)==='grave'&&curATK(C(r))===a0+2500,JSON.stringify({bm:z(bm),atk:curATK(C(r)),a0}));
  ok('ラビエル: once per turn',canZ(r)===false,'');
  audit('ラビエル ②'); }
{ fresh();const r=mon(RAV,0),foeW=mk('ワイト',1);gameState.activePlayer=1;gameState.players[0].mz=[r];gameState.players[1].hand=[foeW];baselineA();
  doNormalSummon(0,'atk');drive();
  const tk=gameState.players[0].mz.find(c=>cardName(c)==='幻魔トークン');
  ok('ラビエル: the opponent\'s Normal Summon → a 幻魔トークン (1000/1000) on my field',z(foeW)==='mz'&&!!tk&&curATK(tk)===1000&&curDEF(tk)===1000,JSON.stringify({tk:tk&&cardName(tk)}));
  audit('ラビエル ③');
  endTurn();phase('battle');const att=battleAttackersV29(0).map(x=>x.card.uid);
  ok('ラビエル: the token cannot declare an attack (only ラビエル is an attacker)',att.indexOf(tk.uid)<0&&att.indexOf(r.uid)>=0,JSON.stringify({att,tk:tk&&tk.uid,r:r.uid})); }

console.log('U346 done');
`);
