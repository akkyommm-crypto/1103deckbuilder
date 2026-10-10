/* S03-U47 SPECIAL_SUMMON_EFFECT declarations across the fixed lists (dependent recovery of C-S03-37).
   U46 made 神の警告 / 王宮の弾圧 read specialSummonEffectLinkS03; a scan of Astra's 13 fixed lists found 42 cards with a Special Summon
   sentence that the helper could not see. The scripted ones whose activated effect Special Summons are declared in
   cards/HA_claude_s03_u47_special_summon_effect_decl.js (per effect where the card has several).
   2011 sources: yugioh-wiki 《神の警告》 age 35 (2011-08-03): Spell / Trap effect activations are not answered (10/04/17, 11/01/05);
   《王宮の弾圧》 age 42 (2011-08-28): they are (face-up Continuous / Field Spell Special Summon effects).
   Cards named here are TESTED: BF－極北のブリザード, BF－蒼炎のシュラ, 神の警告, 王宮の弾圧, 六武の門, 紫炎の足軽, スターダスト・ドラゴン,
   アームズ・エイド, カラクリ大将軍 無零怒, 死者蘇生. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const x=findCardByUid(c.uid);return x?x.zone:null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;TOASTS.length=0;}
function labels(){const pc=pendingChoiceV49(gameState);return pc?pc.candidates.map(x=>String(x.label||'')):[];}
function pick(match){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing for '+match+' toasts='+JSON.stringify(TOASTS.slice(-3)));
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return String(x.value||'')===match||(h&&nm(h.card)===match)||String(x.label||'').includes(match);});
  if(i<0)throw Error('candidate '+match+' missing: '+JSON.stringify(labels()));__choicePickV49(i);}
/* advance until a chain window opens on a link named 'name' (triggers accepted, choices answered by the picker), or until idle */
function driveTo(name,picker){for(let i=0;i<400;i++){
  if(gameState.chainWindow&&gameState.chain.length&&gameState.chain[gameState.chain.length-1].name===name)return 'window';
  if(pendingChoiceV49(gameState)){picker();continue;}
  if(EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.some(x=>x.name===name))eventPickV2(g.findIndex(x=>x.name===name));else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}   /* 「何も発動しない — 召喚成功」 */
  return 'idle';}return 'loop';}
function settle(){for(let i=0;i<400;i++){
  if(pendingChoiceV49(gameState)){__choicePickV49(0);continue;}
  if(EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

/* ===== A. 神の警告 answers the Normal Summon trigger of BF－極北のブリザード (its Special Summon was undeclared) ===== */
fresh();
{
  const bliz=mk('BF－極北のブリザード',0);gameState.players[0].hand=[bliz];
  const shura=mk('BF－蒼炎のシュラ',0);gameState.players[0].grave=[shura];
  const warn=setCard('神の警告',1);gameState.players[1].sz=[warn];
  baselineA();
  doNormalSummon(0,'atk');
  const r=driveTo('BF－極北のブリザード',()=>pick('BF－蒼炎のシュラ'));
  const resp=r==='window'?getChainResponsesV2(1):[];
  ok('A: the trigger is on the chain and 神の警告 is offered in response',r==='window'&&resp.some(x=>x.card===warn),
    JSON.stringify({r,chain:gameState.chain.map(l=>[l.name,l.eventName]),resp:resp.map(x=>x.db.n),toasts:TOASTS.slice(-3)}));
  if(r==='window'){duelActivateResponseV2(1,'sz',0);settle();}
  ok('A: the trigger is negated; BF－蒼炎のシュラ stays in the GY; BF－極北のブリザード is destroyed; player 1 paid 2000',
    zoneOf(shura)==='grave'&&zoneOf(bliz)==='grave'&&gameState.players[1].lp===6000,
    JSON.stringify({shura:zoneOf(shura),bliz:zoneOf(bliz),lp:gameState.players[1].lp}));
  audit('A');
}

/* ===== B. 六武の門's 6-counter effect activation: not answered by 神の警告 (a Spell effect), answered by a face-up 王宮の弾圧 ===== */
fresh();
{
  const gate=mk('六武の門',0);gameState.players[0].sz=[gate];
  const ashi=mk('紫炎の足軽',0);gameState.players[0].grave=[ashi];
  const warn=setCard('神の警告',1), ro=mk('王宮の弾圧',1);gameState.players[1].sz=[warn,ro];
  baselineA();
  act({type:'COUNTER_ADD',player:0,zone:'sz',index:0,kind:'武士道',n:6});
  duelActivateFromZone(0,'sz',0);
  pick('m6');
  const r=driveTo('六武の門',()=>pick('紫炎の足軽'));
  const top=gameState.chain[gameState.chain.length-1]||{};
  const resp=r==='window'?getChainResponsesV2(1):[];
  ok('B: 六武の門 (m6) is on the chain as an effect activation',r==='window'&&top.v4EffectKey==='m6'&&top.cardActivationS03!==true,JSON.stringify({r,top:[top.name,top.v4EffectKey,top.cardActivationS03]}));
  ok('B: 神の警告 is not offered against a Spell effect activation (2011: 10/04/17)',!resp.some(x=>x.card===warn),JSON.stringify(resp.map(x=>x.db.n)));
  ok('B: the face-up 王宮の弾圧 is offered',resp.some(x=>x.card===ro),JSON.stringify(resp.map(x=>x.db.n)));
  if(resp.some(x=>x.card===ro)){duelActivateResponseV2(1,'sz',1);settle();}
  ok('B: 王宮の弾圧 negates it: 紫炎の足軽 stays in the GY, 六武の門 is destroyed, player 1 paid 800',
    zoneOf(ashi)==='grave'&&zoneOf(gate)==='grave'&&gameState.players[1].lp===7200,
    JSON.stringify({ashi:zoneOf(ashi),gate:zoneOf(gate),lp:gameState.players[1].lp}));
  audit('B');
}

/* ===== C. per-effect declarations and the 神の警告 exclusion ===== */
fresh();
{
  const L=(name,extra)=>Object.assign({name,cardId:findCardIndex(name)},extra||{});
  ok('C: スターダスト・ドラゴン — only the End Phase revival counts',specialSummonEffectLinkS03(L('スターダスト・ドラゴン',{v4EffectKey:'end-return'}))&&!specialSummonEffectLinkS03(L('スターダスト・ドラゴン',{v4EffectKey:'negate-destruction'})));
  ok('C: アームズ・エイド — only unequip-and-Special-Summon counts',specialSummonEffectLinkS03(L('アームズ・エイド',{v4EffectKey:'unequip-self'}))&&!specialSummonEffectLinkS03(L('アームズ・エイド',{v4EffectKey:'equip-self'})));
  ok('C: カラクリ大将軍 無零怒 — the Synchro Summon trigger counts, the draw does not',specialSummonEffectLinkS03(L('カラクリ大将軍 無零怒',{eventName:'onSpecialSummon'}))&&!specialSummonEffectLinkS03(L('カラクリ大将軍 無零怒',{eventName:'onKarakuriPositionChange'})));
  ok('C: BF－極北のブリザード counts',specialSummonEffectLinkS03(L('BF－極北のブリザード',{eventName:'onNormalSummon'})));
  const gateM6=L('六武の門',{v4EffectKey:'m6'});
  ok('C: 六武の門 m6 counts for 王宮の弾圧 but not for 神の警告',specialSummonEffectLinkS03(gateM6)&&!specialSummonEffectLinkS03(gateM6,{excludeSpellTrapEffect:true}));
  ok('C: a 死者蘇生 card activation still counts for 神の警告',specialSummonEffectLinkS03(L('死者蘇生',{cardActivationS03:true}),{excludeSpellTrapEffect:true}));
  ok('C: a card activation only (U10) never counts',!specialSummonEffectLinkS03(L('六武の門',{cardActivationOnly:true,v4EffectKey:'m6'})));
}
`);
