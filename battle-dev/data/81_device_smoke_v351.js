/* =========================================================================
   System v3.5.1: Android / Acode 実機スモークテスト HOTFIX
   v3.5.0ではDEVELOPERモードのまま盤面操作していたため、カードタップが
   旧MANUAL経路へ流れ、新ADSエンジンを正しく検証できなかった。
   v3.5.1ではテスト開始時だけDUELモードへ切り替え、終了時に元へ戻す。
   ========================================================================= */
const V351_DEVICE_SMOKE_KEY = 'yg1103_device_smoke_v351';
const V351_DEVICE_SMOKE_ACTIVE_KEY = 'yg1103_device_smoke_active_v351';
const V351_DEVICE_SMOKE = {
  specialLock:{
    name:'天空の宝札：特殊召喚/Battle禁止',
    note:'天空の宝札を解決後、特殊召喚を含む効果が発動不可になり、Main1→Endへスキップすることを確認',
    steps:['天空の宝札を発動し、オネストを除外する','2枚ドロー後、死者蘇生をタップする','「このターンは特殊召喚できないため、この効果は発動できません」または発動ボタン無しを確認する','Main1の「次へ」でBattleではなくEndへ進むことを確認する']
  },
  heraldMagic:{
    name:'緑光の宣告者：魔法発動カウンター',
    note:'P1の緑光がP0のサイクロンにチェーンし、緑光＋天使族1枚を墓地へ送って魔法の発動を無効にすることを確認',
    steps:['P0のサイクロンを発動し、P1の伏せカードを対象にする','P1の応答で緑光の宣告者を発動する','コストとしてオネストを選ぶ','緑光＋オネストが墓地へ行き、サイクロンの発動が無効になって破壊されることを確認する']
  },
  heraldTrap:{
    name:'紫光の宣告者：罠発動カウンター',
    note:'P1の紫光がP0の強制脱出装置にチェーンし、紫光＋天使族1枚を墓地へ送って罠の発動を無効にすることを確認',
    steps:['P0の伏せた強制脱出装置を発動し、P1のサイバー・ドラゴンを対象にする','P1の応答で紫光の宣告者を発動する','コストとしてオネストを選ぶ','サイバー・ドラゴンが手札へ戻らず、強制脱出装置の発動が無効になって破壊されることを確認する']
  },
  asceticism:{
    name:'六武衆の荒行：UID遅延破壊',
    note:'キザン対象→同ATKのザンジを特殊召喚→Endで対象キザンだけ破壊されることを確認',
    steps:['六武衆の荒行を発動する','真六武衆－キザンを対象にする','デッキから六武衆－ザンジを特殊召喚する','End Phaseまで進め、対象にしたキザンだけが破壊され、ザンジは残ることを確認する']
  },
  voltic:{
    name:'E・HERO ボルテック：ダメージ計算後誘発',
    note:'直接攻撃で戦闘ダメージ→ダメージ計算後に除外E・HEROの特殊召喚候補が出ることを確認',
    steps:['E・HERO ボルテックで直接攻撃する','ダメージ計算後の誘発窓でボルテックの効果を発動する','除外されているE・HERO エアーマンを選ぶ','エアーマンが特殊召喚されることを確認する']
  },
  endymionCounter:{
    name:'魔法都市エンディミオン：魔力カウンター',
    note:'魔法カードの発動が正常に解決した後、発動時から場にいたエンディミオンへ魔力カウンターが1つ乗ることを確認',
    steps:['P0のサイクロンを発動し、P1の伏せカードを対象にする','チェーンせず解決する','魔法都市エンディミオンを確認する','魔力カウンターが1つ増えていることを確認する']
  },
  bureidoDraw:{
    name:'カラクリ大将軍 無零怒：表示形式変更ドロー',
    note:'自分の表側カラクリの表示形式が変わった時、無零怒の任意誘発で1枚ドローできることを確認',
    steps:['カラクリ兵 弐参六をタップする','表示形式を変更する','無零怒の誘発候補を発動する','1枚ドローし、同一ターン2回目は発動できないことを確認する']
  },
  shienNegate:{
    name:'真六武衆－シエン：魔法・罠の発動無効',
    note:'相手の魔法発動にシエンがチェーンし、発動そのものを無効にして破壊することを確認',
    steps:['P0のサイクロンを発動し、P1の伏せカードを対象にする','P1の応答で真六武衆－シエンを発動する','チェーンを解決する','サイクロンの発動が無効になり破壊されることを確認する']
  },
  battleFader:{
    name:'バトルフェーダー：直接攻撃→Battle終了',
    note:'直接攻撃宣言時に手札から特殊召喚し、そのままBattle Phaseが終了することを確認',
    steps:['P0のサイバー・ドラゴンで直接攻撃する','P1の応答でバトルフェーダーを発動する','バトルフェーダーが守備表示で特殊召喚されることを確認する','Battle Phaseが終了してMain Phase 2へ移ることを確認する']
  },
  rabbitBottomless:{
    name:'レスキューラビット：同時2体SS→奈落',
    note:'ラビットでセイバーザウルス2体を同時特殊召喚し、奈落でその2体だけが両方とも破壊・除外されることを確認',
    steps:['レスキューラビットの効果を発動する','セイバーザウルスを選び、2体が同時に特殊召喚されることを確認する','P1の奈落の落とし穴を発動する','セイバーザウルス2体がどちらも除外されることを確認する']
  },
  frogExtra:{
    name:'鬼ガエル③：追加通常召喚',
    note:'自分モンスターを手札へ戻して効果を発動し、通常召喚権を使った後でも「鬼ガエル」以外のガエルを1度追加召喚できることを確認',
    steps:['鬼ガエルをタップして効果を発動する','ライオウを手札へ戻す','黄泉ガエルをタップし「追加召喚（鬼ガエル）」を選ぶ','通常召喚権使用済みでも黄泉ガエルが召喚されることを確認する']
  },
  fortressSummon:{
    name:'マシンナーズ・フォートレス①：自己特殊召喚',
    note:'手札の機械族レベル合計8以上を捨て、自身をコストで捨てた場合でも墓地から正しく特殊召喚できることを確認',
    steps:['手札のフォートレスをタップして「特殊召喚」を選ぶ','攻撃表示を選ぶ','コストにフォートレス→ギアフレームの順で選ぶ','フォートレスが墓地から特殊召喚され、ギアフレームだけ墓地に残ることを確認する']
  },
  tragoControl:{
    name:'トラゴエディア③：コントロール奪取',
    note:'手札モンスターを墓地へ送り、同じレベルの相手表側モンスターのコントロールを得ることを確認',
    steps:['トラゴエディアをタップして効果を発動する','手札のライオウをコストに選ぶ','相手のセイバーザウルスを対象に選ぶ','セイバーザウルスが自分フィールドへ移ることを確認する']
  }
};
function readDeviceSmokeV351(){
  try{return JSON.parse(localStorage.getItem(V351_DEVICE_SMOKE_KEY)||'{}')||{};}catch(e){return {};}
}
function writeDeviceSmokeV351(v){
  try{localStorage.setItem(V351_DEVICE_SMOKE_KEY,JSON.stringify(v||{}));}catch(e){}
}
function readDeviceSmokeActiveV351(){
  try{return JSON.parse(localStorage.getItem(V351_DEVICE_SMOKE_ACTIVE_KEY)||'null');}catch(e){return null;}
}
function writeDeviceSmokeActiveV351(v){
  try{ if(v) localStorage.setItem(V351_DEVICE_SMOKE_ACTIVE_KEY,JSON.stringify(v)); else localStorage.removeItem(V351_DEVICE_SMOKE_ACTIVE_KEY); }catch(e){}
}
function v351SetPlayModeRaw(mode){
  if(!Object.values(PLAY_MODES).includes(mode)) return;
  PLAY_MODE=mode;
  try{localStorage.setItem(PLAY_MODE_KEY,mode);}catch(e){}
}
function v351RestoreSmokeMode(){
  const a=readDeviceSmokeActiveV351();
  writeDeviceSmokeActiveV351(null);
  if(a && Object.values(PLAY_MODES).includes(a.returnMode)) v351SetPlayModeRaw(a.returnMode);
  else v351SetPlayModeRaw(PLAY_MODES.DEVELOPER);
}
function markDeviceSmokeV351(key,ok){
  const st=readDeviceSmokeV351(); st[key]={ok:!!ok,at:Date.now()}; writeDeviceSmokeV351(st);
  const active=readDeviceSmokeActiveV351();
  if(active && active.key===key) v351RestoreSmokeMode();
  render(); openDeviceSmokeV351(true);
}
function abortDeviceSmokeV351(){
  v351RestoreSmokeMode(); render(); openMenu(); showToast('実機テストを終了しました');
}
function resetDeviceSmokeV351(){
  try{localStorage.removeItem(V351_DEVICE_SMOKE_KEY);}catch(e){} openDeviceSmokeV351(true);
}
function deviceSmokeMenuButtonV351(){
  const a=readDeviceSmokeActiveV351();
  if(!a || !V351_DEVICE_SMOKE[a.key]) return '';
  return `<div class="act fx" onclick="openDeviceSmokeV351(true)">📱 実機テスト結果へ</div>`;
}
function v351SmokeCard(player,zone,name,opt){
  opt=opt||{}; const idx=findCardIndex(name); if(idx<0){logIt(gameState,`実機テスト用カード不足：${name}`);return null;}
  const c={id:idx,owner:player,controller:player,face:opt.face||((zone==='hand'||zone==='deck'||zone==='ex')?'down':'up'),pos:opt.pos||'atk'};
  if(opt.setTurn!=null)c.setTurn=opt.setTurn;
  ensureCardUid(gameState,c);
  const P=gameState.players[player];
  if(zone==='field')P.field=c; else (P[zone]||(P[zone]=[])).push(c);
  return c;
}
function v351PrepareSmokeBase(phase){
  resetForTestDuel();
  const d0=buildTestDeck('rabbit'), d1=buildTestDeck('rabbit');
  act({type:'LOAD_DECK',player:0,deck:d0.main.slice(),ex:d0.ex.slice()});
  act({type:'LOAD_DECK',player:1,deck:d1.main.slice(),ex:d1.ex.slice()});
  [0,1].forEach(p=>{const P=gameState.players[p];P.hand=[];P.mz=[];P.sz=[];P.grave=[];P.banish=[];P.field=null;P.ssHistory=[];P.graveHistory=[];P.temporaryFlags={};});
  gameState.turn=2; gameState.firstPlayer=0; gameState.activePlayer=0; gameState.phase=phase||'main1'; gameState.drawnThisTurn=true; gameState.priority=0;
  gameState.chain=[];gameState.chainWindow=null;gameState.pendingSummon=null;gameState.pendingAttack=null;gameState.reserved=[];gameState.deferredEvents=[];gameState.processorQueue=[];gameState.processorCurrent=null;gameState.processorWaiting=null;gameState.processorPaused=false;
  ADS_CHAIN_MODE=ADS_CHAIN_MODES.AVAILABLE; saveAdsChainSettings();
}
function v351IndexOf(player,zone,name){
  const P=gameState.players[player], z=(zone==='field'?[P.field]:(P[zone]||[]));
  return z.findIndex(c=>c&&cardName(c)===name);
}
function v351SmokePreflight(key){
  try{
    let actions=[];
    if(key==='specialLock') actions=getLegalHandActions(0,v351IndexOf(0,'hand','天空の宝札'));
    else if(key==='heraldMagic') actions=getLegalHandActions(0,v351IndexOf(0,'hand','サイクロン'));
    else if(key==='heraldTrap') actions=getLegalZoneActions(0,'sz',v351IndexOf(0,'sz','強制脱出装置'));
    else if(key==='asceticism') actions=getLegalHandActions(0,v351IndexOf(0,'hand','六武衆の荒行'));
    else if(key==='voltic') actions=getLegalZoneActions(0,'mz',v351IndexOf(0,'mz','E・HERO ボルテック'));
    else if(key==='endymionCounter') actions=getLegalHandActions(0,v351IndexOf(0,'hand','サイクロン'));
    else if(key==='bureidoDraw') actions=getLegalZoneActions(0,'mz',v351IndexOf(0,'mz','カラクリ兵 弐参六'));
    else if(key==='shienNegate') actions=getLegalHandActions(0,v351IndexOf(0,'hand','サイクロン'));
    else if(key==='battleFader') actions=getLegalZoneActions(0,'mz',v351IndexOf(0,'mz','サイバー・ドラゴン'));
    else if(key==='rabbitBottomless') actions=getLegalZoneActions(0,'mz',v351IndexOf(0,'mz','レスキューラビット'));
    else if(key==='frogExtra') actions=getLegalZoneActions(0,'mz',v351IndexOf(0,'mz','鬼ガエル'));
    else if(key==='fortressSummon') actions=getLegalHandActions(0,v351IndexOf(0,'hand','マシンナーズ・フォートレス'));
    else if(key==='tragoControl') actions=getLegalZoneActions(0,'mz',v351IndexOf(0,'mz','トラゴエディア'));
    const ok=Array.isArray(actions)&&actions.length>0;
    return {ok,detail:ok?actions.map(a=>a.label).join(' / '):'初動LEGAL ACTIONがありません'};
  }catch(e){return {ok:false,detail:e.message||String(e)};}
}
function startDeviceSmokeV351(key){
  const cfg=V351_DEVICE_SMOKE[key]; if(!cfg){showToast('実機スモーク項目が見つかりません');return;}
  const old=PLAY_MODE;
  writeDeviceSmokeActiveV351({key,returnMode:old,startedAt:Date.now()});
  /* 重要：v3.5.0の不具合修正。テスト盤面を触る間は必ずADS/DUEL経路を使用する。 */
  v351SetPlayModeRaw(PLAY_MODES.DUEL);
  v351PrepareSmokeBase((key==='voltic'||key==='battleFader')?'battle':'main1');
  if(key==='specialLock'){
    v351SmokeCard(0,'hand','天空の宝札');v351SmokeCard(0,'hand','オネスト');v351SmokeCard(0,'hand','死者蘇生');v351SmokeCard(0,'grave','サイバー・ドラゴン');
  }else if(key==='heraldMagic'){
    v351SmokeCard(0,'hand','サイクロン');v351SmokeCard(1,'hand','緑光の宣告者');v351SmokeCard(1,'hand','オネスト');v351SmokeCard(1,'sz','奈落の落とし穴',{face:'down',setTurn:1});
  }else if(key==='heraldTrap'){
    v351SmokeCard(0,'sz','強制脱出装置',{face:'down',setTurn:1});v351SmokeCard(1,'mz','サイバー・ドラゴン');v351SmokeCard(1,'hand','紫光の宣告者');v351SmokeCard(1,'hand','オネスト');
  }else if(key==='asceticism'){
    v351SmokeCard(0,'mz','真六武衆－キザン');v351SmokeCard(0,'hand','六武衆の荒行');v351SmokeCard(0,'deck','六武衆－ザンジ',{face:'down'});
  }else if(key==='voltic'){
    v351SmokeCard(0,'mz','E・HERO ボルテック');v351SmokeCard(0,'banish','E・HERO エアーマン');
  }else if(key==='endymionCounter'){
    v351SmokeCard(0,'field','魔法都市エンディミオン');v351SmokeCard(0,'hand','サイクロン');v351SmokeCard(1,'sz','奈落の落とし穴',{face:'down',setTurn:1});
  }else if(key==='bureidoDraw'){
    v351SmokeCard(0,'mz','カラクリ大将軍 無零怒');v351SmokeCard(0,'mz','カラクリ兵 弐参六');
  }else if(key==='shienNegate'){
    v351SmokeCard(0,'hand','サイクロン');v351SmokeCard(1,'mz','真六武衆－シエン');v351SmokeCard(1,'sz','奈落の落とし穴',{face:'down',setTurn:1});
  }else if(key==='battleFader'){
    v351SmokeCard(0,'mz','サイバー・ドラゴン');v351SmokeCard(1,'hand','バトルフェーダー');
  }else if(key==='rabbitBottomless'){
    v351SmokeCard(0,'mz','レスキューラビット');v351SmokeCard(0,'deck','セイバーザウルス',{face:'down'});v351SmokeCard(0,'deck','セイバーザウルス',{face:'down'});v351SmokeCard(1,'sz','奈落の落とし穴',{face:'down',setTurn:1});
  }else if(key==='frogExtra'){
    v351SmokeCard(0,'mz','鬼ガエル');v351SmokeCard(0,'mz','ライオウ');v351SmokeCard(0,'hand','黄泉ガエル');gameState.players[0].normalSummonUsed=true;
  }else if(key==='fortressSummon'){
    v351SmokeCard(0,'hand','マシンナーズ・フォートレス');v351SmokeCard(0,'hand','マシンナーズ・ギアフレーム');
  }else if(key==='tragoControl'){
    v351SmokeCard(0,'mz','トラゴエディア');v351SmokeCard(0,'hand','ライオウ');v351SmokeCard(1,'mz','セイバーザウルス');
  }
  const pf=v351SmokePreflight(key);
  logIt(gameState,`<b>📱 実機スモーク v4.1.0：${cfg.name}</b>`);
  logIt(gameState,`<b>${pf.ok?'READY':'SETUP NG'}</b>：${pf.detail}`);
  cfg.steps.forEach((x,i)=>logIt(gameState,`${i+1}. ${x}`));
  render(); clearSavedDuel(); saveDuelSoon();
  showToast(pf.ok?'DUELエンジンで実機テストを開始しました':'テスト盤面の初動セットアップに問題があります');
}
function openDeviceSmokeV351(force){
  const active=readDeviceSmokeActiveV351();
  if(!force && PLAY_MODE!==PLAY_MODES.DEVELOPER && !active){showToast('DEVELOPERモード専用です');return;}
  const st=readDeviceSmokeV351();
  const activeCfg=active&&V351_DEVICE_SMOKE[active.key];
  const activeBox=activeCfg?`<div class="dbg-entry"><div class="dbg-name">▶ テスト中：${activeCfg.name}</div><div class="dbg-step">現在はDUELエンジンで操作中です。確認できたら下のPASS/NGを押してください。</div><div class="act-grid wide" style="margin-top:7px"><div class="act fx" onclick="markDeviceSmokeV351('${active.key}',true)">PASS</div><div class="act warn" onclick="markDeviceSmokeV351('${active.key}',false)">NG</div><div class="act" onclick="abortDeviceSmokeV351()">中止</div></div></div>`:'';
  const rows=Object.entries(V351_DEVICE_SMOKE).map(([key,cfg])=>{
    const r=st[key],status=!r?'未確認':(r.ok?'PASS':'NG');
    return `<div class="dbg-entry"><div class="dbg-name">${cfg.name} <b>${status}</b></div><div class="dbg-step">${cfg.note}</div><div class="act-grid wide" style="margin-top:7px"><div class="act fx" onclick="startDeviceSmokeV351('${key}')">盤面セット</div>${active&&active.key===key?'':`<div class="act${r&&r.ok?' fx':''}" onclick="markDeviceSmokeV351('${key}',true)">PASS</div><div class="act${r&&!r.ok?' warn':''}" onclick="markDeviceSmokeV351('${key}',false)">NG</div>`}</div></div>`;
  }).join('');
  const n=Object.keys(V351_DEVICE_SMOKE).length,pass=Object.values(st).filter(x=>x&&x.ok).length,ng=Object.values(st).filter(x=>x&&!x.ok).length;
  sheet.innerHTML=`<div class="grip"></div><h3>📱 実機スモークテスト v4.1.0</h3><div class="meta" style="margin-bottom:10px">v3.5.0のテスト経路不具合を修正済み。盤面セット後は自動でDUELモードに切り替わり、ADSチェーンは「発動可能時のみ」で検証します。<br><b>${pass}/${n} PASS</b>${ng?` / ${ng} NG`:''}</div>${activeBox}<div class="dbg-list">${rows}</div><div class="act-grid wide" style="margin-top:10px"><div class="act warn" onclick="resetDeviceSmokeV351()">結果をリセット</div></div><button class="close" onclick="openMenu()">戻る</button>`;
  veil.classList.add('on');
}
