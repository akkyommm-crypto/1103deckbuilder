/* S03-U145: (W) mass destruction (FX_WIPE_ZONE) is a destruction of each card — graveInfo, destroyed-this-turn record and the
   onDestroy / onSendToGrave / onRemove events — and 「このカードが…」 triggers react only to their own event (ダンディライオン,
   c1EffectDestroyedGrave); (A–D) the rest of the attack-time Spell/Trap lock cards (engine/1ZO) with their other effects —
   古代の機械獣, 古代の機械工兵, 古代の機械究極巨人, E－HERO ワイルド・サイクロン. Real DUEL path (attacks and activations through the
   processor), Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function negatedLinks(pkg){return pkg.actions.map(x=>x&&x.action).filter(x=>x&&x.type==='CHAIN_NEGATE_LINK').map(x=>({mode:x.mode,reason:x.reason}));}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='battle';}
let SNAP=[],WATCH=null;
const __gcrS03=getChainResponsesV2;
getChainResponsesV2=function(p){const r=__gcrS03.apply(this,arguments);
  if(gameState.pendingAttack||gameState.battle){const e={p,names:r.map(x=>x.db.n)};
    if(WATCH&&WATCH.p===p) e.L=strictScriptLegalityV2(WATCH.name,WATCH.p,WATCH.zone,WATCH.idx,{});
    SNAP.push(e);}
  return r;};
function lockedBy(card){return SNAP.filter(e=>e.p===1).some(e=>e.L&&e.L.ok===false&&new RegExp(card).test(e.L.reason||''));}
const MFW={p:1,name:'聖なるバリア －ミラーフォース－',zone:'sz',idx:0};
function mirror(){const t=mk('聖なるバリア －ミラーフォース－',1,'down');t.setTurn=3;gameState.players[1].sz=[t];return t;}
function attack(t){SNAP=[];WATCH=MFW;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:t});return drive();}
`;

/* ===== A. 古代の機械獣: lock; the effect of a monster it destroyed by battle is negated; cannot be Special Summoned ===== */
harness(COMMON+String.raw`
fresh();
const beast=mk('古代の機械獣',0,'up');gameState.players[0].mz=[beast];
const tom=mk('キラー・トマト',1,'up');gameState.players[1].mz=[tom];mirror();
const w=mk('ワイト',1);gameState.players[1].deck=[w];
baselineA();
attack(0);
ok('A ①: locked while it attacks',lockedBy('古代の機械獣'),JSON.stringify(SNAP).slice(0,200));
ok('A: キラー・トマト destroyed by battle, 600 damage',z(tom)==='grave'&&gameState.players[1].lp===7400,JSON.stringify({tom:z(tom),lp:gameState.players[1].lp}));
ok('A ②: the destroyed キラー・トマト effect is negated — ワイト stays in the Deck',z(w)==='deck'&&gameState.players[1].mz.length===0,JSON.stringify({w:z(w),mz:gameState.players[1].mz.map(nm)}));
audit('A');
/* control: a plain 2500 attacker → キラー・トマト recruits ワイト */
fresh();
gameState.players[0].mz=[mk('デーモンの召喚',0,'up')];
const tom2=mk('キラー・トマト',1,'up');gameState.players[1].mz=[tom2];
const w2=mk('ワイト',1);gameState.players[1].deck=[w2];
baselineA();
attack(0);
ok('A: control — destroyed by デーモンの召喚, キラー・トマト Special Summons ワイト',z(tom2)==='grave'&&z(w2)==='mz',JSON.stringify({tom:z(tom2),w:z(w2)}));
audit('A control');
fresh();gameState.phase='main1';
gameState.players[0].grave=[mk('古代の機械獣',0)];gameState.players[0].hand=[mk('死者蘇生',0)];
ok('A: cannot be Special Summoned — 死者蘇生 has no target',strictScriptLegalityV2('死者蘇生',0,'hand',0,{}).ok===false);
`);

/* ===== B. 古代の機械工兵: ① Trap effects targeting it are negated and destroyed; ② lock; ③ destroys 1 opponent S/T at the end of the
   Damage Step in which it attacked (not when it was destroyed by that battle) ===== */
harness(COMMON+String.raw`
fresh();gameState.activePlayer=1;gameState.phase='main1';
const eng=mk('古代の機械工兵',0,'up');gameState.players[0].mz=[eng];
const cmd=mk('強制脱出装置',1,'down');cmd.setTurn=3;gameState.players[1].sz=[cmd];
baselineA();
duelActivateFromZone(1,'sz',0);PREFER=[uid(eng)];drive();PREFER=[];
let pkg=audit('B ①');
ok('B ①: 強制脱出装置 targeting 古代の機械工兵 is negated and destroyed; 工兵 stays',z(eng)==='mz'&&z(cmd)==='grave'
  &&negatedLinks(pkg).some(x=>x.mode==='effect'&&x.reason==='古代の機械工兵'),JSON.stringify({eng:z(eng),cmd:z(cmd),neg:negatedLinks(pkg)}));
/* control: the same Trap targeting another monster resolves */
fresh();gameState.activePlayer=1;gameState.phase='main1';
const eng2=mk('古代の機械工兵',0,'up'),wt=mk('ワイト',0,'up');gameState.players[0].mz=[eng2,wt];
const cmd2=mk('強制脱出装置',1,'down');cmd2.setTurn=3;gameState.players[1].sz=[cmd2];
baselineA();
duelActivateFromZone(1,'sz',0);PREFER=[uid(wt)];drive();PREFER=[];
ok('B ①: control — targeting ワイト instead, ワイト returns to the hand',z(wt)==='hand'&&z(eng2)==='mz',JSON.stringify({wt:z(wt)}));
/* ② + ③ */
fresh();
const eng3=mk('古代の機械工兵',0,'up');gameState.players[0].mz=[eng3];
const foe=mk('ワイト',1,'up');gameState.players[1].mz=[foe];
const mf=mirror();const cy=mk('サイクロン',1,'down');cy.setTurn=3;gameState.players[1].sz.push(cy);
baselineA();
PREFER=[uid(cy)];attack(0);PREFER=[];
ok('B ②: locked while it attacks',lockedBy('古代の機械工兵'),JSON.stringify(SNAP).slice(0,200));
ok('B ③: at the end of the Damage Step the chosen opponent サイクロン is destroyed, ミラーフォース stays',z(foe)==='grave'&&z(cy)==='grave'&&z(mf)==='sz',
  JSON.stringify({foe:z(foe),cy:z(cy),mf:z(mf)}));
audit('B ③');
/* ③ not when 工兵 itself was destroyed by that battle */
fresh();
const eng4=mk('古代の機械工兵',0,'up');gameState.players[0].mz=[eng4];
gameState.players[1].mz=[mk('デーモンの召喚',1,'up')];const mf4=mirror();
baselineA();
attack(0);
ok('B ③: destroyed by battle → ③ is not activated; ミラーフォース stays',z(eng4)==='grave'&&z(mf4)==='sz',JSON.stringify({eng:z(eng4),mf:z(mf4)}));
audit('B ③ destroyed');
`);

/* ===== C. 古代の機械究極巨人: lock + piercing; ③ when destroyed, revive 古代の機械巨人 from the GY ignoring its summon condition ===== */
harness(COMMON+String.raw`
fresh();
const ug=mk('古代の機械究極巨人',0,'up');ug.properlySummonedS03=true;gameState.players[0].mz=[ug];
const d=mk('ワイト',1,'down');d.pos='def';gameState.players[1].mz=[d];mirror();
baselineA();
attack(0);
ok('C ①: locked while it attacks',lockedBy('古代の機械究極巨人'),JSON.stringify(SNAP).slice(0,200));
ok('C ②: piercing — 4400 − ワイト DEF 200 = 4200 damage',gameState.players[1].lp===3800,JSON.stringify({lp:gameState.players[1].lp}));
audit('C ①②');
/* ③ */
fresh();gameState.phase='main1';
const ug2=mk('古代の機械究極巨人',0,'up');ug2.properlySummonedS03=true;gameState.players[0].mz=[ug2];
const giant=mk('古代の機械巨人',0);gameState.players[0].grave=[giant];
gameState.players[0].hand=[mk('ブラック・ホール',0)];
baselineA();
duelActivateFromHand(0);PREFER=[uid(giant)];drive();PREFER=[];
ok('C ③: destroyed by ブラック・ホール → 古代の機械巨人 is Special Summoned from the GY ignoring 「特殊召喚できない」',
  z(ug2)==='grave'&&z(giant)==='mz',JSON.stringify({ug:z(ug2),giant:z(giant),log:(gameState.log||[]).slice(-6)}));
audit('C ③');
/* control: without the ③ route 古代の機械巨人 still cannot be Special Summoned (死者蘇生) */
fresh();gameState.phase='main1';
gameState.players[0].grave=[mk('古代の機械巨人',0)];gameState.players[0].hand=[mk('死者蘇生',0)];
ok('C: control — 死者蘇生 still cannot target 古代の機械巨人',strictScriptLegalityV2('死者蘇生',0,'hand',0,{}).ok===false);
/* never properly summoned: 古代の機械究極巨人 cannot be revived by 死者蘇生 (U126 「融合召喚でしか」) */
fresh();gameState.phase='main1';
gameState.players[0].grave=[mk('古代の機械究極巨人',0)];gameState.players[0].hand=[mk('死者蘇生',0)];
ok('C: 古代の機械究極巨人 in the GY cannot be revived by 死者蘇生',strictScriptLegalityV2('死者蘇生',0,'hand',0,{}).ok===false);
`);

/* ===== D. E－HERO ワイルド・サイクロン: lock; ② on battle damage destroys all the opponent's SET Spell/Trap cards ===== */
harness(COMMON+String.raw`
fresh();
const wc=mk('E－HERO ワイルド・サイクロン',0,'up');wc.properlySummonedS03=true;gameState.players[0].mz=[wc];
const foe=mk('ワイト',1,'up');gameState.players[1].mz=[foe];
const mf=mirror();const cy=mk('サイクロン',1,'down');cy.setTurn=3;const up=mk('一族の結束',1,'up');gameState.players[1].sz.push(cy,up);
baselineA();
attack(0);
ok('D ①: locked while it attacks',lockedBy('E－HERO ワイルド・サイクロン'),JSON.stringify(SNAP).slice(0,200));
ok('D ②: 1600 battle damage → both set cards destroyed, the face-up 一族の結束 stays',gameState.players[1].lp===6400&&z(mf)==='grave'&&z(cy)==='grave'&&z(up)==='sz',
  JSON.stringify({lp:gameState.players[1].lp,mf:z(mf),cy:z(cy),up:z(up)}));
audit('D');
/* no battle damage → ② does not activate */
fresh();
const wc2=mk('E－HERO ワイルド・サイクロン',0,'up');gameState.players[0].mz=[wc2];
const dd=mk('ワイト',1,'up');dd.pos='def';gameState.players[1].mz=[dd];const mf2=mirror();
baselineA();
attack(0);
ok('D ②: attacking a DEF monster (no battle damage) → set cards stay',z(dd)==='grave'&&z(mf2)==='sz'&&gameState.players[1].lp===8000,JSON.stringify({mf:z(mf2),lp:gameState.players[1].lp}));
/* not an ignition effect */
fresh();gameState.phase='main1';
gameState.players[0].mz=[mk('E－HERO ワイルド・サイクロン',0,'up')];const mf3=mirror();
ok('D ②: cannot be used in the Main Phase',strictScriptLegalityV2('E－HERO ワイルド・サイクロン',0,'mz',0,{}).ok===false);
`);

/* ===== W. mass destruction (FX_WIPE_ZONE: ブラック・ホール, 激流葬, ブラック・ローズ・ドラゴン, 神獣王バルバロス) is a destruction of each card:
   graveInfo, the destroyed-this-turn record and the onDestroy / onSendToGrave events — before U145 none of them existed, so no
   「破壊された場合」「墓地へ送られた時」 trigger activated after it ===== */
harness(COMMON+String.raw`
fresh();gameState.phase='main1';
const dan=mk('ダンディライオン',0,'up');gameState.players[0].mz=[dan];
const nep=mk('ネフティスの鳳凰神',1,'up');gameState.players[1].mz=[nep];
gameState.players[0].hand=[mk('ブラック・ホール',0)];
baselineA();
duelActivateFromHand(0);drive();
const toks=gameState.players[0].mz.filter(c=>nm(c)==='綿毛トークン').length;
ok('W: ブラック・ホール destroys both; ダンディライオン 「墓地へ送られた時」 → 2 綿毛トークン',z(dan)==='grave'&&z(nep)==='grave'&&toks===2,
  JSON.stringify({dan:z(dan),nep:z(nep),mz:gameState.players[0].mz.map(nm)}));
const gi=findCardByUid(nep.uid).card.graveInfo||{};
ok('W: the destroyed card records graveInfo (byDestroy, from the Monster Zone, this turn) like a single destruction',
  gi.byDestroy===true&&gi.from==='mz'&&gi.turn===gameState.turn,JSON.stringify(gi));
const nepAct=(gameState.log||[]).filter(x=>/ネフティスの鳳凰神（SS1）を発動/.test(x.msg)).length;
ok('W: ネフティスの鳳凰神 「効果で破壊され墓地へ送られた場合」 → activated exactly once, revival scheduled',nepAct===1&&JSON.stringify(gameState).indexOf('c2.nephthys')>=0,String(nepAct));
ok('W: both are in the destroyed-this-turn record',(gameState.destroyedThisTurnV30||[]).filter(x=>x.uid===dan.uid||x.uid===nep.uid).length===2,
  JSON.stringify(gameState.destroyedThisTurnV30));
audit('W');
`);
/* the same cards must not react to ANOTHER card's event */
harness(COMMON+String.raw`
fresh();
const dan=mk('ダンディライオン',0);gameState.players[0].grave=[dan];
gameState.players[0].mz=[mk('デーモンの召喚',0,'up')];const vic=mk('ワイト',1,'up');gameState.players[1].mz=[vic];
baselineA();
attack(0);
ok('W: ダンディライオン already in the GY does not activate when another monster is destroyed by battle',z(vic)==='grave'&&gameState.players[0].mz.filter(c=>nm(c)==='綿毛トークン').length===0,
  JSON.stringify(gameState.players[0].mz.map(nm)));
audit('W battle');
fresh();gameState.phase='main1';
const mar=mk('機械犬マロン',1,'up'),w1=mk('ワイト',1,'up');gameState.players[1].mz=[mar,w1];
gameState.players[0].hand=[mk('ブラック・ホール',0)];
baselineA();
duelActivateFromHand(0);drive();
ok('W: 機械犬マロン destroyed together with ワイト by ブラック・ホール → 1000 damage once (LP 8000 → 7000)',z(mar)==='grave'&&gameState.players[0].lp===7000,
  JSON.stringify({lp0:gameState.players[0].lp,lp1:gameState.players[1].lp}));
audit('W マロン');
`);
