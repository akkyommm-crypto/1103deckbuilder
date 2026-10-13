/* S03-U333: A・ジェネクス・アクセル / ケミストリ / トライアーム, レアル・ジェネクス・クロキシアン / ヴィンディカイト, ジオ・ジェネクス — real Synchro Summons, effects and battles, Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3330001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function doSynchro(mats){const P=gameState.players[0];doExSummon(0,0,mats.map(m=>P.mz.indexOf(m)),'synchro','atk');drive();}
function canZ(zone,c){return getLegalZoneActions(0,zone,idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(zone,c){duelActivateFromZone(0,zone,idx(c));drive();}
const CT='ジェネクス・コントローラー',UN='ジェネクス・ウンディーネ',WK='ジェネクス・ワーカー',DR='ジェネクス・ドクター',GA='ジェネクス・ガイア',HE='ジェネクス・ヒート',WI='ガスタの巫女 ウィンダ';

/* ===== アクセル ===== */
function axelField(){fresh();const t=mon(CT,0),m=mon(HE,0),ax=mk('A・ジェネクス・アクセル',0),h1=mk('サイクロン',0),gm=mk('ジェネクス・サーチャー',0),gw=mk('ワイト',0);
  gameState.players[0].ex=[ax];gameState.players[0].mz=[t,m];gameState.players[0].hand=[h1];gameState.players[0].grave=[gm,gw];baselineA();
  ok('アクセル: precondition — the Genex Tuner + Lv5 ヒート make Lv8',exCombos(0,dbOf(ax)).combos.length>=1,JSON.stringify(exCombos(0,dbOf(ax)).combos));
  doSynchro([t,m]);return {ax,h1,gm,gw};}
{ const x=axelField();
  ok('アクセル: Synchro Summoned',z(x.ax)==='mz',z(x.ax));
  PREFER=[uid(x.h1),uid(x.gm)];actZ('mz',x.ax);PREFER=[];
  const g=C(x.gm);
  ok('アクセル: discarded サイクロン (cost); the Lv4 Machine サーチャー revived from the Graveyard (ワイト stays)',z(x.h1)==='grave'&&z(x.gm)==='mz'&&z(x.gw)==='grave',JSON.stringify({h1:z(x.h1),gm:z(x.gm)}));
  ok('アクセル: its ATK is doubled until the End Phase (1600 → 3200) and it cannot attack directly',curATK(g)===3200&&cannotDirectAttackNow(g)===true,JSON.stringify({atk:curATK(g)}));
  ok('アクセル: once per turn',canZ('mz',x.ax)===false,'');
  audit('アクセル');
  phase('end');
  ok('アクセル: banished at my End Phase',z(x.gm)==='banish',z(x.gm)); }
{ const x=axelField();
  gameState.players[0].grave=[];
  ok('アクセル negative: no Lv4- Machine in the Graveyard → not available',canZ('mz',x.ax)===false,''); }

/* ===== ケミストリ ===== */
{ fresh();const ch=mk('A・ジェネクス・ケミストリ',0),gx=mon(CT,0);gameState.players[0].hand=[ch];gameState.players[0].mz=[gx];baselineA();
  const was=currentAttributeV17(C(gx));
  PREFER=['光',uid(gx)];duelActivateFromHand(0);drive();PREFER=[];
  ok('ケミストリ: discarded from the hand; my ジェネクス is now 光 (was '+was+')',z(ch)==='grave'&&currentAttributeV17(C(gx))==='光',JSON.stringify({ch:z(ch),now:currentAttributeV17(C(gx))}));
  audit('ケミストリ'); }
{ fresh();const ch=mk('A・ジェネクス・ケミストリ',0),wy=mon('ワイト',0);gameState.players[0].hand=[ch];gameState.players[0].mz=[wy];baselineA();
  const lg=strictScriptLegalityV2('A・ジェネクス・ケミストリ',0,'hand',0,{cardOverride:ch,logicalZone:'sz',prospectiveIndex:0});
  ok('ケミストリ negative: illegal without a ジェネクス',lg.ok===false,JSON.stringify(lg)); }

/* ===== トライアーム ===== */
function triField(matName,oppHand){fresh();const t=mon(CT,0),m=mon(matName,0),tr=mk('A・ジェネクス・トライアーム',0),h1=mk('サイクロン',0),h2=mk('強欲な壺',0);
  gameState.players[0].ex=[tr];gameState.players[0].mz=[t,m];gameState.players[0].hand=[h1,h2];if(oppHand)gameState.players[1].hand=oppHand();baselineA();
  ok('トライアーム: precondition ('+matName+')',exCombos(0,dbOf(tr)).combos.length>=1,JSON.stringify(exCombos(0,dbOf(tr)).combos));
  doSynchro([t,m]);return {tr,h1,h2};}
{ const x=triField(WK,()=>[mk('ワイト',1),mk('青眼の白龍',1)]);const o1=gameState.players[1].hand[0],o2=gameState.players[1].hand[1];
  PREFER=[uid(x.h1)];actZ('mz',x.tr);PREFER=[];
  const gone=[o1,o2].filter(c=>z(c)==='grave').length;
  ok('トライアーム 風 (ワーカー): discarded 1, one random card of the opponent hand sent to the Graveyard',z(x.h1)==='grave'&&gone===1,JSON.stringify({h1:z(x.h1),gone}));
  ok('トライアーム: the three effects share the once per turn',canZ('mz',x.tr)===false,'');
  audit('トライアーム 風'); }
{ fresh();const t=mon(CT,0),m=mon(UN,0),tr=mk('A・ジェネクス・トライアーム',0),h1=mk('サイクロン',0),fs=mk('サイクロン',1,'down');fs.setTurn=3;
  gameState.players[0].ex=[tr];gameState.players[0].mz=[t,m];gameState.players[0].hand=[h1];gameState.players[1].sz=[fs];baselineA();
  doSynchro([t,m]);PREFER=[uid(h1),uid(fs)];actZ('mz',tr);PREFER=[];
  ok('トライアーム 水 (ウンディーネ): discarded 1; the chosen Spell/Trap destroyed',z(h1)==='grave'&&z(fs)==='grave',JSON.stringify({h1:z(h1),fs:z(fs)}));
  audit('トライアーム 水'); }
{ fresh();const t=mon(CT,0),m=mon(DR,0),tr=mk('A・ジェネクス・トライアーム',0),h1=mk('サイクロン',0),lt=mon('ライトロード・ハンター ライコウ',1);
  gameState.players[0].ex=[tr];gameState.players[0].mz=[t,m];gameState.players[0].hand=[h1];gameState.players[1].mz=[lt];const d0=gameState.players[0].deck.length;baselineA();
  doSynchro([t,m]);PREFER=[uid(h1),uid(lt)];actZ('mz',tr);PREFER=[];
  ok('トライアーム 闇 (ドクター): the face-up 光 monster destroyed and 1 card drawn',z(lt)==='grave'&&gameState.players[0].deck.length===d0-1,JSON.stringify({lt:z(lt),deck:gameState.players[0].deck.length,d0}));
  audit('トライアーム 闇'); }
/* ===== クロキシアン ===== */
{ fresh();const t=mon(CT,0),m1=mon(DR,0),m2=mon(DR,0),kr=mk('レアル・ジェネクス・クロキシアン',0),f1=mon('青眼の白龍',1),f2=mon('ワイト',1);
  gameState.players[0].ex=[kr];gameState.players[0].mz=[t,m1,m2];gameState.players[1].mz=[f1,f2];baselineA();
  ok('クロキシアン: precondition — Tuner + two 闇 non-Tuners make Lv9',exCombos(0,dbOf(kr)).combos.length>=1,JSON.stringify(exCombos(0,dbOf(kr)).combos));
  doSynchro([t,m1,m2]);
  ok('クロキシアン: Synchro Summoned → control of the opponent monster with the highest Level (青眼, Lv8) gained',z(kr)==='mz'&&pl(f1)===0&&pl(f2)===1,JSON.stringify({kr:z(kr),f1:pl(f1),f2:pl(f2)}));
  audit('クロキシアン'); }

/* ===== ヴィンディカイト ===== */
{ fresh();const t=mon(CT,0),m1=mon(WK,0),m2=mon(WI,0),vi=mk('レアル・ジェネクス・ヴィンディカイト',0),f=mon('ワイト',1),dk=mk(HE,0);
  gameState.players[0].ex=[vi];gameState.players[0].mz=[t,m1,m2];gameState.players[0].deck=[dk,mk('ワイト',0)];gameState.players[1].mz=[f];baselineA();
  ok('ヴィンディカイト: precondition — Tuner + two 風 non-Tuners make Lv8',exCombos(0,dbOf(vi)).combos.length>=1,JSON.stringify(exCombos(0,dbOf(vi)).combos));
  doSynchro([t,m1,m2]);
  endTurn();
  ok('ヴィンディカイト: the opponent cannot choose it as an attack target',battleTargetsV29(f.uid).targets.every(x=>x.card.uid!==vi.uid),JSON.stringify(battleTargetsV29(f.uid).targets.map(x=>x.card.uid)));
  endTurn();phase('battle');
  PREFER=[uid(dk)];atkTarget(0,vi,f);PREFER=[];
  ok('ヴィンディカイト: destroyed ワイト by battle → a 「ジェネクス」 (ヒート) of my Deck added to the hand',z(f)==='grave'&&z(dk)==='hand',JSON.stringify({f:z(f),dk:z(dk)}));
  audit('ヴィンディカイト'); }

/* ===== ジオ ===== */
{ fresh();const t=mon(CT,0),m=mon(GA,0),ge=mk('ジオ・ジェネクス',0);gameState.players[0].ex=[ge];gameState.players[0].mz=[t,m];baselineA();
  ok('ジオ: precondition — Tuner + 地 Genex make Lv6',exCombos(0,dbOf(ge)).combos.length>=1,JSON.stringify(exCombos(0,dbOf(ge)).combos));
  doSynchro([t,m]);
  ok('ジオ: after the Synchro Summon no Lv4- 「ジェネクス」 is on my field (the materials left) → not available',canZ('mz',ge)===false,''); }
{ fresh();const ge=mon('ジオ・ジェネクス',0),w=mon(WK,0);gameState.players[0].mz=[ge,w];baselineA();
  ok('ジオ: ATK 1800 / DEF 2800',curATK(C(ge))===1800&&curDEF(C(ge))===2800,JSON.stringify([curATK(C(ge)),curDEF(C(ge))]));
  actZ('mz',ge);
  ok('ジオ: with a Lv3 Genex on my field: ATK / DEF swapped until the End Phase (2800 / 1800); once per turn',curATK(C(ge))===2800&&curDEF(C(ge))===1800&&canZ('mz',ge)===false,JSON.stringify([curATK(C(ge)),curDEF(C(ge))]));
  audit('ジオ');
  endTurn();
  ok('ジオ: restored when the turn ends',curATK(C(ge))===1800&&curDEF(C(ge))===2800,JSON.stringify([curATK(C(ge)),curDEF(C(ge))])); }

console.log('U333 done');
`);
