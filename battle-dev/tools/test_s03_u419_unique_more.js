/* S03-U419: エーリアン・リベンジャー, アマゾネスペット虎, レプティレス・ヴァースキ, 氷結界の伝道師 (NOT_STARTED cards).
   Real DUEL paths, Replay-audited. */
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
let PREFER=[];function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4130001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function equipped(host,eq){const h=C(host),e=C(eq);return !!h&&!!e&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0;}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function cc(c){const x=C(c);return x&&x.counters?Number(x.counters['魔力'])||0:0;}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

function offeredTo(p,c){return !!(gameState.chainWindow&&gameState.chain.length&&getChainResponsesV2(p).some(x=>x.card===c));}
function respond(p,c,prefer){const hh=findCardByUid(c.uid); if(!hh) return false;
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,hh.zone,hh.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];return true;}
function foeCast(name,prefer){const i=gameState.players[1].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let i2=0;i2<10&&pc();i2++)pick();PREFER=[];}
function actZ(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}

function sz(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function actSz(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function legalSz(c){return strictScriptLegalityV2(cardName(c),0,'sz',idx(c)).ok;}
function gv(c){return curATK(C(c));}





















































const SEEN=[];
const REV='エーリアン・リベンジャー',TIG='アマゾネスペット虎',VAS='レプティレス・ヴァースキ',MIS='氷結界の伝道師';
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function setA(c,n){c.counters=Object.assign({},c.counters||{},{A:n});}
function aCount(c){return (C(c).counters&&Number(C(c).counters['A']))||0;}
function ssReason(p,name){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),'special');}

/* ===== エーリアン・リベンジャー ===== */
{ fresh();const r=mk(REV,0),f=mon('ブラック・マジシャン',1);setA(f,2);gameState.players[0].hand=[r];gameState.players[1].mz=[f];baselineA();
  ok('リベンジャー: Special Summonable from the hand (2 A Counters on the field)',procOk(REV,0)===true,'');
  PREFER=[uid(f),uid(f)];procRun(REV,0);PREFER=[];
  ok('リベンジャー: the 2 A Counters were removed and it stands on the field',z(r)==='mz'&&aCount(f)===0,JSON.stringify([z(r),aCount(f)]));
  audit('リベンジャー 1'); }
{ fresh();const r=mk(REV,0),f=mon('ブラック・マジシャン',1);setA(f,1);gameState.players[0].hand=[r];gameState.players[1].mz=[f];baselineA();
  ok('リベンジャー negative: only 1 A Counter on the field → not Special Summonable',procOk(REV,0)===false,''); }
{ fresh();const r=mk(REV,0),o=mon(REV,0),f=mon('ブラック・マジシャン',1);setA(f,2);gameState.players[0].hand=[r];gameState.players[0].mz=[o];gameState.players[1].mz=[f];baselineA();
  ok('リベンジャー negative: a face-up copy on my field → not Special Summonable (「自分フィールド上に1体」)',procOk(REV,0)===false,JSON.stringify([ssReason(0,REV)])); }
{ fresh();const r=mon(REV,0),f1=mon('ブラック・マジシャン',1),f2=mon('ワイト',1);gameState.players[0].mz=[r];gameState.players[1].mz=[f1,f2];baselineA();
  ok('リベンジャー: the effect is available',canZ(r)===true,'');
  actC(r);
  ok('リベンジャー: an A Counter on every face-up opponent monster; once per turn',aCount(f1)===1&&aCount(f2)===1&&canZ(r)===false,JSON.stringify([aCount(f1),aCount(f2),canZ(r)]));
  audit('リベンジャー 2'); }

/* ===== アマゾネスペット虎 ===== */
{ fresh();const t=mon(TIG,0);gameState.players[0].mz=[t];baselineA();
  ok('ペット虎: alone it counts itself (1100 + 400)',curATK(C(t))===1500,String(curATK(C(t)))); }
{ fresh();const t=mon(TIG,0),s=mon('アマゾネスの剣士',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[t,s];gameState.players[1].mz=[f];baselineA();
  ok('ペット虎: +400 for each アマゾネス monster of mine (itself + 剣士 = 1100 + 800)',curATK(C(t))===1900,String(curATK(C(t))));
  const l0=lp(0);toOppBattle();foeAttack(f,s);
  ok('ペット虎: the opponent cannot attack the other アマゾネス (剣士 unharmed, no damage)',z(s)==='mz'&&lp(0)===l0,JSON.stringify([z(s),lp(0),l0]));
  audit('ペット虎 1'); }
{ fresh();const t=mon(TIG,0),s=mon('アマゾネスの剣士',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[t,s];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,t);
  ok('ペット虎: it can itself be attacked (3000 vs 1900 → destroyed)',z(t)==='grave',z(t)); }
{ fresh();const s=mon('アマゾネスの剣士',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[s];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,s);
  ok('ペット虎 control: without it 剣士 is attacked and destroyed by 青眼',z(s)==='grave',z(s)); }
{ fresh();const t=mon(TIG,0);gameState.players[0].mz=[t];baselineA();
  ok('ペット虎: a second face-up copy of mine is refused',!!ssReason(0,TIG),JSON.stringify([ssReason(0,TIG)])); }

/* ===== レプティレス・ヴァースキ ===== */
{ fresh();const v=mk(VAS,0),z1=mon('おジャマ・イエロー',0),z2=mon('おジャマ・グリーン',1);gameState.players[0].hand=[v];gameState.players[0].mz=[z1];gameState.players[1].mz=[z2];baselineA();
  ok('ヴァースキ: Special Summonable by releasing two ATK 0 monsters (one of mine, one of the opponent)',procOk(VAS,0)===true,'');
  PREFER=[uid(z1),uid(z2)];procRun(VAS,0);PREFER=[];
  ok('ヴァースキ: both ATK 0 monsters were released and it stands on the field',z(v)==='mz'&&z(z1)==='grave'&&z(z2)==='grave',JSON.stringify([z(v),z(z1),z(z2)]));
  audit('ヴァースキ 1'); }
{ fresh();const v=mk(VAS,0),z1=mon('おジャマ・イエロー',0),f=mon('ブラック・マジシャン',1);gameState.players[0].hand=[v];gameState.players[0].mz=[z1];gameState.players[1].mz=[f];baselineA();
  ok('ヴァースキ negative: only one ATK 0 monster on the field → not Special Summonable',procOk(VAS,0)===false,''); }
{ fresh();const v=mon(VAS,0),f=mon('ブラック・マジシャン',1);gameState.players[0].mz=[v];gameState.players[1].mz=[f];baselineA();
  ok('ヴァースキ: the destroy effect is available',canZ(v)===true,'');
  actC(v,[uid(f)]);
  ok('ヴァースキ: the chosen face-up opponent monster was destroyed; once per turn',z(f)==='grave'&&canZ(v)===false,JSON.stringify([z(f),canZ(v)]));
  audit('ヴァースキ 2'); }
{ fresh();const v=mk(VAS,0),o=mon(VAS,1),z1=mon('おジャマ・イエロー',0),z2=mon('おジャマ・グリーン',1);gameState.players[0].hand=[v];gameState.players[0].mz=[z1];gameState.players[1].mz=[o,z2];baselineA();
  ok('ヴァースキ negative: another face-up ヴァースキ on either field → not Special Summonable',procOk(VAS,0)===false,JSON.stringify([ssReason(0,VAS)])); }

/* ===== 氷結界の伝道師 ===== */
{ fresh();const m=mk(MIS,0),ib=mon('氷結界の封魔団',0),hi=mk('氷結界の大僧正',0);gameState.players[0].hand=[m,hi];gameState.players[0].mz=[ib];baselineA();
  ok('伝道師: Special Summonable from the hand (a face-up 「氷結界」 monster of mine)',procOk(MIS,0)===true,'');
  procRun(MIS,0);
  ok('伝道師: it stands on the field',z(m)==='mz',z(m));
  ok('伝道師: this turn I cannot Special Summon a Level 5+ monster (大僧正 Lv6 refused)…',!!ssReason(0,'氷結界の大僧正'),JSON.stringify([ssReason(0,'氷結界の大僧正')]));
  ok('伝道師: …but a Level 4 or lower one still can',ssReason(0,'氷結界の封魔団')==='',JSON.stringify([ssReason(0,'氷結界の封魔団')]));
  audit('伝道師 1'); }
{ fresh();const m=mk(MIS,0),w=mon('ワイト',0);gameState.players[0].hand=[m];gameState.players[0].mz=[w];baselineA();
  ok('伝道師 negative: no 「氷結界」 monster on my field → not Special Summonable',procOk(MIS,0)===false,''); }
{ fresh();const m=mon(MIS,0),gy=mk('氷結界の武士',0);gameState.players[0].mz=[m];gameState.players[0].grave=[gy];baselineA();
  ok('伝道師: the release effect is available',canZ(m)===true,'');
  actC(m,[uid(gy)]);
  ok('伝道師: released itself → a 「氷結界」 monster of my Graveyard was Special Summoned',z(m)==='grave'&&z(gy)==='mz',JSON.stringify([z(m),z(gy)]));
  audit('伝道師 2'); }
{ fresh();const m=mon(MIS,0),w=mk('ワイト',0);gameState.players[0].mz=[m];gameState.players[0].grave=[w];baselineA();
  ok('伝道師 negative: no 「氷結界」 monster in the Graveyard → the release effect is not offered',canZ(m)===false,''); }
`);
