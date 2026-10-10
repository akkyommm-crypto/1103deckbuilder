/* S03-U115: 禁じられた聖槍 — "このカード以外の魔法・罠カードの効果を受けない" (generic capability
   engine/1ZG_unaffected_by_st_s03.js). 2011 text: フィールド上に表側表示で存在するモンスター1体を選択して発動する。
   エンドフェイズ時まで、選択したモンスターの攻撃力は800ポイントダウンし、このカード以外の魔法・罠カードの効果を受けない。
   Measured defect (U114 build): the immunity was a flag (spearProof) that no code ever read — the monster was still
   destroyed by the opponent's Spells/Traps and still boosted/negated by continuous Spells/Traps. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
function drive(){for(let i=0;i<300;i++){
  if(pc())return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function pickName(n){const q=pc();const i=q.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)===n;});__choicePickV49(i>=0?i:0);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function setc(n,p){const c=mk(n,p,'down');c.setTurn=gameState.turn-1;return c;}
/* P0 activates a set 禁じられた聖槍 on its own monster */
function lance(target){duelActivateFromZone(0,'sz',gameState.players[0].sz.findIndex(c=>nm(c)==='禁じられた聖槍'));if(pc())pickName(target);drive();}
`;

/* ===== A. the lance's own −800 applies; the opponent's サンダー・ボルト (all) and 地砕き (single) do not =====
   (opponent's turn from the start: the lance is a Quick-Play Spell set earlier; no unjournaled turn switch) */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
const bf=mk('BF－黒槍のブラスト',0,'up'), w=mk('ワイト',0,'up');
gameState.players[0].mz=[bf,w];gameState.players[0].sz=[setc('禁じられた聖槍',0)];
gameState.players[1].sz=[setc('サンダー・ボルト',1),setc('地砕き',1)];
baselineA();
const base=curATK(bf);
lance('BF－黒槍のブラスト');
ok('A: the lance\'s own effect applies — ATK −800',curATK(bf)===base-800,JSON.stringify([base,curATK(bf)]));
duelActivateFromZone(1,'sz',0);drive();
ok('A: サンダー・ボルト destroys the other monster but not the lanced one',z(bf)==='mz'&&z(w)==='grave',JSON.stringify({bf:z(bf),w:z(w)}));
duelActivateFromZone(1,'sz',0);drive();
ok('A: 地砕き (destroy the highest-DEF monster) cannot destroy it either',z(bf)==='mz',JSON.stringify({bf:z(bf),g1:names(1,'grave')}));
audit('A');
`);

/* ===== B. the real use: chained in response to the opponent's destruction Spell ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
const bf=mk('BF－黒槍のブラスト',0,'up');gameState.players[0].mz=[bf];
const ln=setc('禁じられた聖槍',0);gameState.players[0].sz=[ln];
gameState.players[1].sz=[setc('サンダー・ボルト',1)];
baselineA();
duelActivateFromZone(1,'sz',0);
const resp=(gameState.chainWindow&&gameState.chain.length)?getChainResponsesV2(0):[];
ok('B setup: the lance is offered as a chain response',resp.some(r=>r.db.n==='禁じられた聖槍'),JSON.stringify(resp.map(r=>r.db.n)));
duelActivateResponseV2(0,'sz',0);if(pc())pickName('BF－黒槍のブラスト');drive();
ok('B: chained in response, the lance resolves first and サンダー・ボルト then does nothing to it',z(bf)==='mz'&&curATK(bf)===dbOf(bf).atk-800,JSON.stringify({bf:z(bf),atk:curATK(bf)}));
audit('B');
`);

/* ===== C. continuous Spells/Traps: 暗黒界の門's +300 and スキルドレイン's negation do not apply ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const fiend=mk('暗黒界の狩人 ブラウ',0,'up'), other=mk('暗黒界の龍神 グラファ',0,'up');
gameState.players[0].mz=[fiend,other];gameState.players[0].field=mk('暗黒界の門',0,'up');
gameState.players[0].sz=[setc('禁じられた聖槍',0)];
baselineA();
ok('C setup: before the lance the Fiend gets +300',curATK(fiend)===dbOf(fiend).atk+300,String(curATK(fiend)));
lance('暗黒界の狩人 ブラウ');
ok('C: after the lance, 暗黒界の門\'s +300 no longer applies (only the lance\'s −800)',curATK(fiend)===dbOf(fiend).atk-800,String(curATK(fiend)));
ok('C: the other Fiend still gets +300',curATK(other)===dbOf(other).atk+300,String(curATK(other)));
audit('C');
/* after the audit: a face-up スキルドレイン placed directly (continuous-negation check only) */
gameState.players[1].sz=[mk('スキルドレイン',1,'up')];
ok('C: under スキルドレイン the lanced monster\'s effects are not negated; the other monster\'s are',!effectNegated(fiend)&&effectNegated(other),JSON.stringify([effectNegated(fiend),effectNegated(other)]));
`);

/* ===== D. monster effects still apply; the immunity ends with the turn ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const bf=mk('BF－黒槍のブラスト',1,'up');gameState.players[1].mz=[bf];
const ln=setc('禁じられた聖槍',1);gameState.players[1].sz=[ln];
const te=mk('サンダーエンド・ドラゴン',0,'up');te.xyz=[mk('ワイト',0)];te.summonedTurn=1;gameState.players[0].mz=[te];
baselineA();
/* P2 lances its own monster (quick-play on P1's turn), then P1's monster effect destroys it anyway */
duelActivateFromZone(1,'sz',0);if(pc())pickName('BF－黒槍のブラスト');drive();
ok('D setup: P2\'s monster is lanced',!!bf.spearProofS03&&curATK(bf)===dbOf(bf).atk-800,JSON.stringify(bf.spearProofS03));
duelActivateFromZone(0,'mz',0);drive();
ok('D: a MONSTER effect (サンダーエンド・ドラゴン) still destroys it',z(bf)==='grave',JSON.stringify({bf:z(bf)}));
audit('D');

resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const m=mk('BF－黒槍のブラスト',0,'up');gameState.players[0].mz=[m];gameState.players[0].sz=[setc('禁じられた聖槍',0)];
baselineA();
lance('BF－黒槍のブラスト');
act({type:'PASS_TURN',player:0});
ok('D: next turn the immunity is gone (flag no longer active) and ATK is back',gameState.turn===6&&!s03UnaffectedByU115(gameState,m,{uid:999999,k:'s'})&&curATK(m)===dbOf(m).atk,JSON.stringify({turn:gameState.turn,atk:curATK(m),flag:m.spearProofS03}));
`);

/* ===== E. E・HERO ワイルドマン — unaffected by Trap effects while in the Monster Zone (was ENGINE_GAP) ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
const wm=mk('E・HERO ワイルドマン',0,'up');gameState.players[0].mz=[wm];
gameState.players[1].hand=[mk('ワイト',1)];
gameState.players[1].sz=[setc('サンダー・ブレイク',1),setc('サンダー・ボルト',1)];
baselineA();
duelActivateFromZone(1,'sz',0);for(let i=0;i<3&&pc();i++){const q=pc();const n=q.candidates.map(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h?nm(h.card):x.label;});__choicePickV49(n.indexOf('ワイト')>=0?n.indexOf('ワイト'):n.indexOf('E・HERO ワイルドマン')>=0?n.indexOf('E・HERO ワイルドマン'):0);}
drive();
ok('E: the Trap サンダー・ブレイク cannot destroy ワイルドマン',z(wm)==='mz'&&names(1,'grave').includes('サンダー・ブレイク'),JSON.stringify({wm:z(wm),g1:names(1,'grave')}));
duelActivateFromZone(1,'sz',0);drive();
ok('E: the Spell サンダー・ボルト does destroy it',z(wm)==='grave',JSON.stringify({wm:z(wm)}));
audit('E');
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
const wd=mk('E・HERO ワイルドマン',0,'down');wd.pos='def';gameState.players[0].mz=[wd];
gameState.players[1].hand=[mk('ワイト',1)];gameState.players[1].sz=[setc('サンダー・ブレイク',1)];
baselineA();
duelActivateFromZone(1,'sz',0);for(let i=0;i<3&&pc();i++){const q=pc();const n=q.candidates.map(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h?nm(h.card):x.label;});__choicePickV49(n.indexOf('ワイト')>=0?n.indexOf('ワイト'):0);}
drive();
ok('E: a face-down ワイルドマン is affected (its effect is not active)',z(wd)==='grave',JSON.stringify({wd:z(wd)}));
audit('E2');
`);

/* ===== F. 力の代行者 マーズ — unaffected by Spell effects; +LP difference with 天空の聖域 (was ENGINE_GAP) ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
const mars=mk('力の代行者 マーズ',0,'up');gameState.players[0].mz=[mars];
gameState.players[1].hand=[mk('ワイト',1)];
gameState.players[1].sz=[setc('サンダー・ボルト',1),setc('サンダー・ブレイク',1)];
baselineA();
duelActivateFromZone(1,'sz',0);drive();
ok('F: the Spell サンダー・ボルト cannot destroy マーズ',z(mars)==='mz',JSON.stringify({mars:z(mars)}));
duelActivateFromZone(1,'sz',0);for(let i=0;i<3&&pc();i++){const q=pc();const n=q.candidates.map(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h?nm(h.card):x.label;});__choicePickV49(n.indexOf('ワイト')>=0?n.indexOf('ワイト'):n.indexOf('力の代行者 マーズ')>=0?n.indexOf('力の代行者 マーズ'):0);}
drive();
ok('F: the Trap サンダー・ブレイク does destroy it',z(mars)==='grave',JSON.stringify({mars:z(mars)}));
audit('F');
resetA();
const m2=mk('力の代行者 マーズ',0,'up');gameState.players[0].mz=[m2];gameState.players[0].lp=8000;gameState.players[1].lp=6000;
baselineA();
ok('F: without 天空の聖域, ATK/DEF 0',curATK(m2)===0&&curDEF(m2)===0,JSON.stringify([curATK(m2),curDEF(m2)]));
gameState.players[0].field=mk('天空の聖域',0,'up');
ok('F: with a face-up 天空の聖域 and LP 8000 vs 6000, +2000 ATK/DEF',curATK(m2)===2000&&curDEF(m2)===2000,JSON.stringify([curATK(m2),curDEF(m2)]));
gameState.players[1].lp=8000;
ok('F: with equal LP there is no bonus',curATK(m2)===0,String(curATK(m2)));
gameState.players[1].field=mk('天空の聖域',1,'up');gameState.players[0].field=null;gameState.players[1].lp=5000;
ok('F: the opponent\'s 天空の聖域 does not count',curATK(m2)===0,String(curATK(m2)));
`);
