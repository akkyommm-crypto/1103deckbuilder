/* S03-U485: 《暗黒界の龍神 グラファ》② — 破壊できなかった場合は、相手の手札をランダムに1枚確認する処理を行わない。
   裁定（ユーザー判断①、2026-10-30）:
   - 対象がいなくても強制の誘発はチェーンに載せる（現状維持）。根拠は**他カードの当時 FAQ からの採用判断**で、グラファ自身の回答ではない
     （WIKI-AA425BA7DAF5 NEPTUNE 2009-12-29 / WIKI-6C057DCC8B74 ヴァンダルギオン 2005-03-14）。
   - 破壊できなかった後の手札確認は行わない。根拠は**グラファ自身の FAQ** WIKI-9A95D36090C4（2011-06-18、verdict: cannot）
     「相手によって捨てられた場合の効果の処理が、対象に選択したカードが存在しなくなり破壊できなかった場合、ランダムに手札を確認する処理は行いますか？」
     →「いいえ、行いません。」。同日の回答で「破壊してから確認するため別のタイミングとして扱います」も確定している。
   修正前は resolve() が破壊の成否に関わらず graphaPeekHandS03 を呼んでいた。
   実装は S03-U294 の continuation（API.destroyMarkS03 / destroyedSinceS03 / afterDestroyS03）を使う。身代わりの任意効果（S03-U173）が
   あると破壊の成否はその選択の後に確定するので、同期的に判定してはいけない。
   この試験は両方向を固定する: 破壊できた場合は今までどおり確認する / 破壊できなかった 3 経路では確認しない。 */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function ctl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function pc(){return pendingChoiceV49(gameState);}
function uid(c){return ensureCardUid(gameState,c);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest を再現する',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,200));}
/* 手札確認が行われたか = GRAPHA_PEEK_S03 Action が Journal にあるか（乱数は Action の中で引かれる） */
function acts(type){return v41ReplayPackage(gameState).actions.map(x=>x&&x.action).filter(a=>a&&a.type===type);}
function peeks(){return acts('GRAPHA_PEEK_S03').length;}
/* 発動そのものは Journal の CHAIN_ADD で見る（解決まで進むとチェーンは空になるため） */
function chainAdds(name){return acts('CHAIN_ADD').filter(a=>a.name===name);}
function run(){for(let i=0;i<400;i++){
  if(pc())return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function keysFor(cards){const q=pc();return q.candidates.filter(c=>cards.some(x=>c.uid===uid(x))).map(c=>c.key);}
function onChain(name){return gameState.chain.some(l=>l.name===name);}
function graphaLink(){return gameState.chain.find(l=>l.name==='暗黒界の龍神 グラファ')||null;}
/* 相手（ターンプレイヤー P1）が伏せた《手札抹殺》を発動して、自分（P0）の手札のグラファを捨てさせる */
function setup(){resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';
  const dd=mk('手札抹殺',1,'down');dd.setTurn=2;gameState.players[1].sz=[dd];
  const gr=mk('暗黒界の龍神 グラファ',0);gameState.players[0].hand=[gr];
  gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0)];
  gameState.players[1].hand=[mk('ワイト夫人',1)];
  gameState.players[1].deck=[mk('ワイト',1),mk('ワイト',1)];
  return {gr:gr,dd:dd};}
/* 到達の確認: グラファの誘発がチェーンに乗り、対象選択の窓が開いたところまで */
function toTargetChoice(){duelActivateFromZone(1,'sz',0);return run();}
`;

/* ===== A. 破壊できた場合（正の対照）: 今までどおり手札を確認する ===== */
harness(COMMON+String.raw`
const S=setup();
const foe=mk('ワイト',1,'up');gameState.players[1].mz=[foe];
baselineA();
const st=toTargetChoice();
ok('A 前提: グラファの対象選択が発動時に開く',st==='choice'&&/グラファ/.test(pc().title||'')&&pc().targeting===true,JSON.stringify(pc()&&pc().title));
answerChoiceV49(keysFor([foe]));
ok('A 前提: グラファが対象を 1 枚持ってチェーンに乗っている',onChain('暗黒界の龍神 グラファ')&&(graphaLink().targets||[]).length===1,JSON.stringify(gameState.chain.map(l=>[l.name,(l.targets||[]).length])));
run();
ok('A: 対象が破壊され、手札確認が 1 回行われる（破壊できた場合の挙動は変えていない）',
   z(foe)==='grave'&&peeks()===1,JSON.stringify({foe:z(foe),peeks:peeks()}));
run();
audit('A');
`);

/* ===== B. 相手の場にカードが無い: 強制の誘発はチェーンに載るが、破壊が無いので手札確認は行わない ===== */
harness(COMMON+String.raw`
const S=setup();
gameState.players[1].mz=[];gameState.players[1].sz=[gameState.players[1].sz[0]];   /* 場は伏せた手札抹殺だけ */
baselineA();
const st=toTargetChoice();
const add=chainAdds('暗黒界の龍神 グラファ');
ok('B 前提: 相手の場に破壊できるカードが無くても、強制の誘発はチェーンに載る（NEPTUNE / ヴァンダルギオンの当時 FAQ からの採用判断）',
   add.length===1,JSON.stringify({st:st,adds:add.length,chain:gameState.chain.map(l=>l.name)}));
ok('B 前提: その発動は対象 0 枚でチェーンに乗った',add.length===1&&(add[0].targets||[]).length===0,JSON.stringify(add[0]&&add[0].targets));
run();
ok('B: 破壊が行われないので手札確認を行わない（WIKI-9A95D36090C4）',peeks()===0,'peeks='+peeks());
ok('B: 相手の手札はそのまま残っている',gameState.players[1].hand.length===1,JSON.stringify(gameState.players[1].hand.map(nm)));
audit('B');
`);

/* ===== C. 対象が解決前に場を離れた（裁定の文言そのままの場合）: 手札確認は行わない ===== */
harness(COMMON+String.raw`
const S=setup();
const foe=mk('ワイト',1,'up');gameState.players[1].mz=[foe];
const esc=mk('強制脱出装置',1,'down');esc.setTurn=2;gameState.players[1].sz.push(esc);
baselineA();
toTargetChoice();
answerChoiceV49(keysFor([foe]));
ok('C 前提: グラファが対象を取ってチェーンに乗っている',onChain('暗黒界の龍神 グラファ')&&(graphaLink().targets||[]).length===1,'');
/* 相手が《強制脱出装置》をチェーンして、対象にされた自分のモンスターを手札に戻す（後のリンクが先に解決する） */
const ei=gameState.players[1].sz.findIndex(c=>c&&cardName(c)==='強制脱出装置');
duelActivateFromZone(1,'sz',ei);
let st=run();
if(st==='choice'&&/強制脱出装置/.test(pc().title||'')){answerChoiceV49(keysFor([foe]));st=run();}
ok('C 前提: 《強制脱出装置》がチェーンに乗る',gameState.chain.length>=2||z(foe)==='hand',JSON.stringify(gameState.chain.map(l=>l.name)));
run();
ok('C: 対象が場を離れたので破壊できず、手札確認を行わない（WIKI-9A95D36090C4 の文言そのままの場合）',
   z(foe)==='hand'&&peeks()===0,JSON.stringify({foe:z(foe),peeks:peeks()}));
ok('C: 相手の手札からランダムに確認されたカードは無い（手札はモンスター1枚＋戻した1枚）',
   gameState.players[1].hand.length===2,JSON.stringify(gameState.players[1].hand.map(nm)));
audit('C');
`);

/* ===== D. 破壊が身代わりに置き換わった（S03-U173）: 対象は破壊されていないので手札確認は行わない =====
   破壊の成否は身代わりの選択の後に確定する。同期的に判定する実装ではここを取り違える。 */
harness(COMMON+String.raw`
const S=setup();
const shien=mk('真六武衆－シエン',1,'up'),other=mk('真六武衆－カゲキ',1,'up');
gameState.players[1].mz=[shien,other];
baselineA();
ok('D 前提: 《真六武衆－シエン》が効果の破壊に身代わりを持つ',
   !!(CARD_SCRIPTS['真六武衆－シエン'].destroySubstituteS03)&&CARD_SCRIPTS['真六武衆－シエン'].destroySubstituteS03.causes.indexOf('effect')>=0,'');
toTargetChoice();
answerChoiceV49(keysFor([shien]));
ok('D 前提: グラファがシエンを対象にしてチェーンに乗っている',onChain('暗黒界の龍神 グラファ')&&(graphaLink().targets||[]).length===1,'');
let st=run();
let asked=false;
for(let i=0;i<6&&st==='choice';i++){
  const q=pc();
  if(/身代わり|代わりに|六武衆/.test(q.title||'')){asked=true;
    const k=q.candidates.filter(c=>c.uid===uid(other)).map(c=>c.key);
    answerChoiceV49(k.length?k:[q.candidates[0].key]);}
  else answerChoiceV49([q.candidates[0].key]);
  st=run();
}
ok('D 前提: 身代わりの選択が行われた（破壊の成否はこの選択の後に確定する）',asked,JSON.stringify(TOASTS.slice(-2)));
ok('D: シエンは破壊されず、代わりに別の六武衆が破壊された',z(shien)==='mz'&&z(other)==='grave',JSON.stringify({shien:z(shien),other:z(other)}));
ok('D: 対象を破壊できなかったので手札確認を行わない（身代わりの選択の後に判定している証拠）',peeks()===0,'peeks='+peeks());
audit('D');
`);

/* ===== E は作らない: 自分の効果で捨てた場合に②の破壊も手札確認も起きないことは、既存の
   tools/test_s03_u125_dark_world_targets.js の B（暗黒界の門による自分の捨て）が既に固定している。
   同じ内容を二重に実装しない。 */

/* ===== Negative control: 修正前の resolve（破壊の成否を見ずに手札確認へ進む）を入れ直すと、B・C・D が誤る =====
   これにより B・C・D の PASS が「そもそも手札確認が起きない盤面だから」ではなく、この修正によるものだと示す。 */
harness(COMMON+String.raw`
/* S03-U485 より前の実装（cards/20_control_counter.js の resolve そのまま） */
function installPreFixResolve(){
  CARD_SCRIPTS['暗黒界の龍神 グラファ'].resolve=function(ctx){
    if(darkWorldDiscard(ctx)){
      const t=(ctx.selectedTargets||[])[0], r=t&&resolveTarget(t);
      if(r&&r.p===ctx.opponent) API.destroy(r,"暗黒界の龍神 グラファ");
      if(darkWorldDiscard(ctx)==='opponent') graphaPeekHandS03(ctx.player,ctx.opponent);
      return;
    }
    const me=API.pileCards(ctx.player,'grave',x=>x.card===ctx.card)[0];
    if(me) API.specialSummon(ctx.player,'grave',me.index,'atk',"暗黒界の龍神 グラファ");
  };
}
installPreFixResolve();

/* B（相手の場にカードが無い） */
{
  setup();
  gameState.players[1].mz=[];
  baselineA();
  toTargetChoice();run();run();
  ok('negative control B: 修正前は、破壊が一度も行われていないのに手札確認を行う（これが直した欠陥）',
     peeks()===1,'peeks='+peeks());
}
/* C（対象が解決前に場を離れた） */
{
  const S=setup();
  const foe=mk('ワイト',1,'up');gameState.players[1].mz=[foe];
  const esc=mk('強制脱出装置',1,'down');esc.setTurn=2;gameState.players[1].sz.push(esc);
  baselineA();
  toTargetChoice();
  answerChoiceV49(keysFor([foe]));
  const ei=gameState.players[1].sz.findIndex(c=>c&&cardName(c)==='強制脱出装置');
  duelActivateFromZone(1,'sz',ei);
  let st=run();
  if(st==='choice'&&/強制脱出装置/.test(pc().title||'')){answerChoiceV49(keysFor([foe]));st=run();}
  run();run();
  ok('negative control C: 修正前は、対象が場を離れて破壊できなくても手札確認を行う（WIKI-9A95D36090C4 に反する）',
     z(foe)==='hand'&&peeks()===1,JSON.stringify({foe:z(foe),peeks:peeks()}));
}
/* D（破壊が身代わりに置き換わった） */
{
  setup();
  const shien=mk('真六武衆－シエン',1,'up'),other=mk('真六武衆－カゲキ',1,'up');
  gameState.players[1].mz=[shien,other];
  baselineA();
  toTargetChoice();
  answerChoiceV49(keysFor([shien]));
  let st=run();
  for(let i=0;i<6&&st==='choice';i++){const q=pc();
    const k=q.candidates.filter(c=>c.uid===uid(other)).map(c=>c.key);
    answerChoiceV49(k.length?k:[q.candidates[0].key]);st=run();}
  run();
  ok('negative control D: 修正前は、身代わりで対象が破壊されていなくても手札確認を行う',
     z(shien)==='mz'&&peeks()===1,JSON.stringify({shien:z(shien),other:z(other),peeks:peeks()}));
}
`);
