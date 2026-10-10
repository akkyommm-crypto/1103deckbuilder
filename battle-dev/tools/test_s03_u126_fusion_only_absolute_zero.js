/* S03-U126: 「〜でしか特殊召喚できない」 (engine/1ZK_summon_only_s03.js), E・HERO アブソルートZero, ミラクル・フュージョン
   (Fusion Monster / materials chosen at resolution; a real Fusion Summon). Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||String(x.label||'').includes(u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<400;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function chainAdds(){return v41ReplayPackage(gameState).actions.map(x=>x&&x.action).filter(a=>a&&a.type==='CHAIN_ADD').map(a=>a.name);}
function fresh(ap){resetA();gameState.activePlayer=ap||0;gameState.turn=5;gameState.phase='main1';}
`;

/* ===== A. the summon condition is parsed and enforced ===== */
harness(COMMON+String.raw`
ok('A: parsed — アブソルートZero / The シャイニング fusion-only, TG ハルバード・キャノン synchro-only, a normal Synchro none',
  summonOnlyByS03(CARD_DB[findCardIndex('E・HERO アブソルートZero')]).kind==='fusion'&&summonOnlyByS03(CARD_DB[findCardIndex('E・HERO The シャイニング')]).kind==='fusion'
  &&summonOnlyByS03(CARD_DB[findCardIndex('TG ハルバード・キャノン')]).kind==='synchro'&&summonOnlyByS03(CARD_DB[findCardIndex('スターダスト・ドラゴン')])===null);
fresh();
const sh=mk('E・HERO The シャイニング',0);gameState.players[0].grave=[sh];gameState.players[0].hand=[mk('死者蘇生',0)];
baselineA();
PREFER=[uid(sh)];duelActivateFromHand(0);drive();PREFER=[];
/* S03-U144: 死者蘇生 no longer offers a card it cannot Special Summon, so the refusal now comes at activation; the rule itself is still checked. */
ok('A: 死者蘇生 on E・HERO The シャイニング → not Special Summoned (融合召喚でしか特殊召喚できない)',z(sh)==='grave'&&(TOASTS.some(t=>/融合召喚でしか特殊召喚できません/.test(t))||(strictScriptLegalityV2('死者蘇生',0,'hand',0,{}).ok===false&&/融合召喚でしか特殊召喚できません/.test(summonOnlyReasonS03(sh,null,'死者蘇生')))),JSON.stringify({z:z(sh),t:TOASTS.slice(-2)}));
ok('A: nothing was journaled (死者蘇生 could not be activated on it)',v41ReplayPackage(gameState).actions.length===0);
/* a normal Synchro Monster can still be revived */
fresh();
const sd=mk('スターダスト・ドラゴン',0);sd.properlySummonedS03=true;/* S03-U127: a Synchro Monster can be Special Summoned from the GY / banishment only after a proper summon — this setup card stands for one that was properly Synchro Summoned earlier */gameState.players[0].grave=[sd];gameState.players[0].hand=[mk('死者蘇生',0)];
baselineA();
PREFER=[uid(sd)];duelActivateFromHand(0);drive();PREFER=[];
ok('A: スターダスト・ドラゴン (no such condition) is revived',z(sd)==='mz');
`);

/* ===== B. ミラクル・フュージョン: choose at resolution (field + GY materials are banished), a real Fusion Summon ===== */
harness(COMMON+String.raw`
fresh();
const mf=mk('ミラクル・フュージョン',0);gameState.players[0].hand=[mf];
const heroGy=mk('E・HERO エアーマン',0);gameState.players[0].grave=[heroGy];
const w1=mk('アンモ・ナイト',0,'up'),w2=mk('アンモ・ナイト',0);gameState.players[0].mz=[w1];gameState.players[0].grave.push(w2);
const az=mk('E・HERO アブソルートZero',0);gameState.players[0].ex=[az];
baselineA();
duelActivateFromHand(0);
ok('B: on activation nothing is chosen yet (no target)',gameState.chain.length===1&&gameState.chain[0].name==='ミラクル・フュージョン'&&!pc(),JSON.stringify(gameState.chain.map(l=>l.name)));
PREFER=[uid(az),'アンモ・ナイト（墓地）'];drive();PREFER=[];
ok('B: resolution: E・HERO アブソルートZero Fusion Summoned; the chosen materials (エアーマン + the GY アンモ・ナイト) banished; the field アンモ・ナイト stays',
  z(az)==='mz'&&az.specialSummonKind==='fusion'&&z(heroGy)==='banish'&&z(w2)==='banish'&&z(w1)==='mz',JSON.stringify({az:z(az),k:az.specialSummonKind,h:z(heroGy),w1:z(w1),w2:z(w2)}));
audit('B');
`);

/* ===== C. アブソルートZero: ATK +500 per other face-up WATER monster on the field (both sides) ===== */
harness(COMMON+String.raw`
fresh();
const az=mk('E・HERO アブソルートZero',0,'up');const w1=mk('アンモ・ナイト',0,'up'),w2=mk('アンモ・ナイト',1,'up'),wd=mk('アンモ・ナイト',1,'down');wd.pos='def';
const az2=mk('E・HERO アブソルートZero',1,'up');
gameState.players[0].mz=[az,w1];gameState.players[1].mz=[w2,wd,az2];
ok('C: 2500 + 2×500 (the face-down one and the other アブソルートZero do not count)',curATK(az)===2500+1000,String(curATK(az)));
`);

/* ===== D. leaves the field face-up → destroy all opponent monsters (destroyed / bounced to the Extra Deck) ===== */
harness(COMMON+String.raw`
fresh(1);
const az=mk('E・HERO アブソルートZero',0,'up');gameState.players[0].mz=[az];
const f1=mk('ワイト',1,'up'),f2=mk('ゴブリンドバーグ',1,'up');gameState.players[1].mz=[f1,f2];
gameState.players[1].hand=[mk('サンダー・ボルト',1)];
baselineA();
duelActivateFromHand(0);drive();
ok('D: destroyed by サンダー・ボルト → its trigger destroys all of the opponent\'s monsters',z(az)==='grave'&&z(f1)==='grave'&&z(f2)==='grave'&&chainAdds().includes('E・HERO アブソルートZero'),JSON.stringify({az:z(az),f1:z(f1),f2:z(f2),adds:chainAdds()}));
audit('D destroyed');
/* bounced: 強制脱出装置 → it returns to the Extra Deck and still triggers */
fresh(1);
const az2=mk('E・HERO アブソルートZero',0,'up');gameState.players[0].mz=[az2];
const g1=mk('ワイト',1,'up');gameState.players[1].mz=[g1];
const ce=mk('強制脱出装置',1,'down');ce.setTurn=2;gameState.players[1].sz=[ce];
baselineA();
PREFER=[uid(az2)];duelActivateFromZone(1,'sz',0);drive();PREFER=[];
ok('D: bounced by 強制脱出装置 → back in the Extra Deck, the trigger still destroys the opponent\'s monsters',z(az2)==='ex'&&z(g1)==='grave'&&chainAdds().includes('E・HERO アブソルートZero'),JSON.stringify({az:z(az2),g1:z(g1),adds:chainAdds()}));
audit('D bounced');
`);
