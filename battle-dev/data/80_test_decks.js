/* =========================================================================
   デッキ読込（「カード名 x3」テキスト）
   ========================================================================= */
/* =========================================================================
   テストプレイ用デッキ
   デッキを読み込まずにすぐ回せるようにするためのサンプル。
   1103環境らしい構成で、効果が自動処理できるカードを多めに入れている。
   カードデータに無い名前は自動的に読み飛ばすので、ダミーDBでも動く。
   ========================================================================= */
const TEST_DECK = {
  name: "1103完走テスト（確認済40枚）",
  strict1103: true,
  sourceCutoff: "2011-08-31",
  cards: [
    // 2011/03リミット＋2011年8月までのカードだけで40枚固定。
    // 自動フィラーは一切使わない。カードを足す場合は必ず1103適合確認をする。
    // ---- モンスター 20 ----
    {n:"E・HERO エアーマン", q:1},
    {n:"終末の騎士", q:2},
    {n:"ダーク・グレファー", q:2},
    {n:"サイバー・ドラゴン", q:2},
    {n:"馬頭鬼", q:1},
    {n:"ゾンビキャリア", q:1},
    {n:"グローアップ・バルブ", q:1},
    {n:"ネクロ・ガードナー", q:1},
    {n:"クリッター", q:1},
    {n:"クレボンス", q:1},
    {n:"ジャンク・シンクロン", q:1},
    {n:"魔導戦士 ブレイカー", q:2},
    {n:"レスキューラビット", q:1},
    {n:"セイバーザウルス", q:2},
    {n:"オネスト", q:1},
    // ---- 魔法 11 ----
    {n:"死者蘇生", q:1},
    {n:"ブラック・ホール", q:1},
    {n:"ハリケーン", q:1},
    {n:"強欲で謙虚な壺", q:2},
    {n:"サイクロン", q:2},
    {n:"月の書", q:1},
    {n:"増援", q:1},
    {n:"おろかな埋葬", q:1},
    {n:"禁じられた聖杯", q:1},
    // ---- 罠 9 ----
    {n:"激流葬", q:1},
    {n:"聖なるバリア －ミラーフォース－", q:1},
    {n:"奈落の落とし穴", q:2},
    {n:"次元幽閉", q:1},
    {n:"強制脱出装置", q:1},
    {n:"神の宣告", q:1},
    {n:"神の警告", q:2},
  ],
  ex: [
    {n:"氷結界の龍 ブリューナク", q:1},
    {n:"ブラック・ローズ・ドラゴン", q:1},
    {n:"スターダスト・ドラゴン", q:1},
    {n:"大地の騎士ガイアナイト", q:1},
    {n:"氷結界の龍 トリシューラ", q:1},
    {n:"A・O・J カタストル", q:1},
    {n:"氷結界の虎王ドゥローレン", q:1},
    {n:"アーカナイト・マジシャン", q:1},
    {n:"マジカル・アンドロイド", q:1},
    {n:"エヴォルカイザー・ラギア", q:2},
    {n:"No.39 希望皇ホープ", q:1},
    {n:"ジェムナイト・パール", q:1},
    {n:"インヴェルズ・ローチ", q:1},
    {n:"No.16 色の支配者ショック・ルーラー", q:1},
  ]
};

/* =========================================================================
   動作確認用デッキ
   実装した機能をひと通り試せるように組んだサンプル。
   各カードのコメントが「何を確かめられるか」を示している。
   ========================================================================= */
const FEATURE_DECK = {
  name: "1103機能検証（確認済40枚）",
  strict1103: true,
  sourceCutoff: "2011-08-31",
  cards: [
    // ---- 妥協召喚／アドバンス召喚 ----
    {n:"神獣王バルバロス", q:2},
    {n:"可変機獣 ガンナードラゴン", q:1},
    {n:"ダブルコストン", q:1},
    {n:"カイザー・シーホース", q:1},
    {n:"トロイホース", q:1},
    {n:"青眼の白龍", q:1},
    // ---- 無効・対象・召喚誘発 ----
    {n:"スキルドレイン", q:2},
    {n:"禁じられた聖杯", q:2},
    {n:"魔導戦士 ブレイカー", q:2},
    {n:"E・HERO エアーマン", q:1},
    // ---- EX展開 ----
    {n:"レスキューラビット", q:1},
    {n:"セイバーザウルス", q:2},
    // ---- 墓地／暗黒界／ネクロバレー ----
    {n:"暗黒界の龍神 グラファ", q:1},
    {n:"暗黒界の狩人 ブラウ", q:1},
    {n:"暗黒界の取引", q:1},
    {n:"墓守の司令官", q:1},
    {n:"テラ・フォーミング", q:1},
    {n:"王家の眠る谷－ネクロバレー", q:1},
    // ---- エンド／ダメージステップ ----
    {n:"ライトロード・マジシャン ライラ", q:1},
    {n:"裁きの龍", q:1},
    {n:"オネスト", q:1},
    // ---- フィールド／コントロール ----
    {n:"古代の機械巨竜", q:1},
    {n:"歯車街", q:1},
    {n:"強制転移", q:1},
    {n:"精神操作", q:1},
    {n:"御前試合", q:1},
    {n:"群雄割拠", q:1},
    // ---- 召喚反応／カウンター ----
    {n:"激流葬", q:1},
    {n:"奈落の落とし穴", q:1},
    {n:"神の警告", q:1},
    {n:"盗賊の七つ道具", q:1},
    {n:"死者蘇生", q:1},
    {n:"サイクロン", q:2},
    {n:"月の書", q:1},
  ],
  ex: [
    {n:"エヴォルカイザー・ラギア", q:2},
    {n:"ガチガチガンテツ", q:1},
    {n:"No.11 ビッグ・アイ", q:1},
    {n:"No.16 色の支配者ショック・ルーラー", q:1},
    {n:"TG ハイパー・ライブラリアン", q:1},
    {n:"カラクリ大将軍 無零怒", q:1},
    {n:"A・O・J カタストル", q:1},
    {n:"氷結界の龍 トリシューラ", q:1},
    {n:"Sin サイバー・エンド・ドラゴン", q:1},
    {n:"氷結界の龍 ブリューナク", q:1},
    {n:"ブラック・ローズ・ドラゴン", q:1},
    {n:"スターダスト・ドラゴン", q:1},
    {n:"No.39 希望皇ホープ", q:1},
    {n:"ジェムナイト・パール", q:1},
  ]
};

/* =========================================================================
   1103兎ラギア：最初の「実戦完走」対象デッキ
   2011/03リミット、2011年8月までのカードで構成された40+15+15。
   ユーザー指定レシピ（2026-10-15）。サイドは対戦中のゾーンへは入れず、
   次回のマッチ戦対応に備えてデッキ構成メタデータとして保持する。
   ========================================================================= */
const RABBIT_LAGGIA_DECK = {
  name: "1103兎ラギア（完走対象）",
  strict1103: true,
  sourceCutoff: "2011-08-31",
  cards: [
    {n:"ジェネティック・ワーウルフ", q:3},
    {n:"セイバーザウルス", q:3},
    {n:"ライオウ", q:3},
    {n:"レスキューラビット", q:3},
    {n:"魔導戦士 ブレイカー", q:3},
    {n:"サイクロン", q:2},
    {n:"ブラック・ホール", q:1},
    {n:"強欲で謙虚な壺", q:3},
    {n:"禁じられた聖槍", q:3},
    {n:"月の書", q:1},
    {n:"死者蘇生", q:1},
    {n:"王宮の弾圧", q:1},
    {n:"強制脱出装置", q:2},
    {n:"次元幽閉", q:2},
    {n:"神の警告", q:2},
    {n:"神の宣告", q:1},
    {n:"聖なるバリア －ミラーフォース－", q:1},
    {n:"盗賊の七つ道具", q:3},
    {n:"奈落の落とし穴", q:2},
  ],
  ex: [
    {n:"No.16 色の支配者ショック・ルーラー", q:1},
    {n:"No.39 希望皇ホープ", q:1},
    {n:"イビリチュア・メロウガイスト", q:1},
    {n:"インヴェルズ・ローチ", q:1},
    {n:"ヴァイロン・ディシグマ", q:1},
    {n:"エヴォルカイザー・ラギア", q:2},
    {n:"カチコチドラゴン", q:1},
    {n:"キメラテック・フォートレス・ドラゴン", q:1},
    {n:"ジェムナイト・パール", q:2},
    {n:"ブラック・ローズ・ドラゴン", q:1},
    {n:"発条機甲ゼンマイスター", q:1},
    {n:"氷結界の龍 トリシューラ", q:1},
    {n:"氷結界の龍 ブリューナク", q:1},
  ],
  side: [
    {n:"D.D.クロウ", q:2},
    {n:"サイバー・ドラゴン", q:2},
    {n:"フォッシル・ダイナ パキケファロ", q:2},
    {n:"冥府の使者ゴーズ", q:1},
    {n:"禁じられた聖杯", q:3},
    {n:"スキル・サクセサー", q:1},
    {n:"マクロコスモス", q:2},
    {n:"砂塵の大竜巻", q:2},
  ]
};

/* =========================================================================
   再現テスト用プリセット
   40枚ランダムだけでは狙った状況を作りにくいので、残りの山札だけをシャッフルし、
   最初の5枚だけ固定する。両プレイヤーを1人で操作して同じ手順を何度でも再現できる。
   ========================================================================= */
const TEST_PRESETS = {
  rabbitFlow: {
    name:"兎ラギア完走（固定初手）",
    note:"ラビット→ラギア、伏せ、返しのライオウ/奈落/脱出/蘇生まで同じ初手で実戦回帰",
    p0Deck:"rabbit", p1Deck:"rabbit",
    p0:["レスキューラビット","禁じられた聖槍","神の警告","サイクロン","強欲で謙虚な壺"],
    p1:["ライオウ","奈落の落とし穴","強制脱出装置","死者蘇生","サイクロン"]
  },
  core: {
    name:"基本システム（固定初手）",
    note:"通常召喚→伏せ→サイバー・ドラゴン→召喚無効/奈落/激流→チェーン→戦闘を短時間で確認",
    p0Deck:"standard", p1Deck:"standard",
    p0:["魔導戦士 ブレイカー","激流葬","奈落の落とし穴","神の宣告","サイクロン"],
    p1:["サイバー・ドラゴン","月の書","死者蘇生","ブラック・ホール","サイクロン"]
  },
  ex: {
    name:"EX召喚（固定初手）",
    note:"レスキューラビット→セイバーザウルス2体→ラギア、シンクロ素材・召喚反応を確認",
    p0Deck:"standard", p1Deck:"standard",
    p0:["レスキューラビット","月の書","サイクロン","神の宣告","死者蘇生"],
    p1:["E・HERO エアーマン","激流葬","奈落の落とし穴","禁じられた聖杯","サイクロン"]
  },
  grave: {
    name:"墓地・永続（固定初手）",
    note:"ネクロバレー、死者蘇生、暗黒界、スキルドレイン、バルバロスなどの継続状態を確認",
    p0Deck:"feature", p1Deck:"feature",
    p0:["墓守の司令官","テラ・フォーミング","王家の眠る谷－ネクロバレー","死者蘇生","サイクロン"],
    p1:["神獣王バルバロス","スキルドレイン","禁じられた聖杯","暗黒界の取引","暗黒界の狩人 ブラウ"]
  },
  tribute: {
    name:"妥協召喚・アドバンス召喚（固定盤面）",
    note:"バルバロスの0体召喚/0体セット/2体召喚/3体分召喚と、3体分時の全破壊をすぐ確認",
    p0Deck:"feature", p1Deck:"feature", setup:'barbaros',
    p0:["神獣王バルバロス","スキルドレイン","禁じられた聖杯","強制転移","サイクロン"],
    p1:["奈落の落とし穴","激流葬","神の警告","サイクロン","死者蘇生"]
  },
  tributeValue: {
    name:"召喚手順・2体分リリース（固定盤面）",
    note:"ガンナードラゴンの0体召喚/セット、ダブルコストン→闇、カイザー・シーホース→光、トロイホース→地の2体分リリースを確認",
    p0Deck:"feature", p1Deck:"feature", setup:'tributeValue',
    p0:["可変機獣 ガンナードラゴン","青眼の白龍","月の書","スキルドレイン","サイクロン"],
    p1:["奈落の落とし穴","激流葬","神の警告","サイクロン","死者蘇生"]
  }
};

function testCardName(c){
  const db = c && CARD_DB[c.id];
  return db ? (db.n||"") : "";
}

/* 指定した5枚を山札先頭に固定し、残りだけシャッフルする。 */
function arrangeTestOpening(parsed, names){
  const rest = (parsed.main||[]).slice();
  const opening=[]; const miss=[];
  (names||[]).forEach(n=>{
    const i = rest.findIndex(c=>testCardName(c)===n);
    if(i<0){ miss.push(n); return; }
    opening.push(rest.splice(i,1)[0]);
  });
  shuffle(rest);
  return {main:opening.concat(rest), ex:(parsed.ex||[]).slice(), miss:(parsed.miss||[]).concat(miss)};
}

function setupPresetBoard(kind){
  if(kind==='barbaros'){
    API.createToken(0,{name:'リリース確認トークン',atk:0,def:0,lv:1,ra:'戦士',at:'地',pos:'atk'},3);
    API.createToken(1,{name:'破壊確認トークン',atk:1000,def:1000,lv:1,ra:'戦士',at:'地',pos:'atk'},2);
    return;
  }
  if(kind==='tributeValue'){
    const put=(nm,face)=>{ const idx=findCardIndex(nm); if(idx<0) return; const c={id:idx,face:face||'up',pos:'atk',owner:0,controller:0}; ensureCardUid(gameState,c); gameState.players[0].mz.push(c); };
    put('ダブルコストン','up');
    put('カイザー・シーホース','down');
    put('トロイホース','up');
    logIt(gameState,'2体分リリース確認：ダブルコストン（闇）/ カイザー・シーホース（光）/ トロイホース（地）を配置');
  }
}
function resetForTestDuel(){
  closeSheet();
  gameState = newGame();
  if(typeof v41ResetActionJournal==='function') v41ResetActionJournal(gameState);
  turnActions = [];
  HISTORY.length = 0;
  REDO.length = 0;
  try{ if(typeof EVT_CANDS!=='undefined') EVT_CANDS=[]; }catch(e){}
  try{ if(typeof DTRG_CANDS!=='undefined') DTRG_CANDS=[]; }catch(e){}
}

/* 1人で両側を操作する再現テスト。オンライン対戦用の処理は使わない。 */
function startPresetDuel(key, firstPlayer){
  const cfg = TEST_PRESETS[key];
  if(!cfg){ showToast("テストプリセットが見つかりません"); return; }
  const base0 = buildTestDeck(cfg.p0Deck);
  const base1 = buildTestDeck(cfg.p1Deck);
  const p0 = arrangeTestOpening(base0, cfg.p0);
  const p1 = arrangeTestOpening(base1, cfg.p1);
  if(!p0.main.length || !p1.main.length){ showToast("カードデータが読み込まれていません"); return; }

  resetForTestDuel();
  act({type:"LOAD_DECK", player:0, deck:p0.main, ex:p0.ex, side:base0.side, source:'test', name:cfg.name});
  act({type:"DRAW", player:0, n:5, initial:true});
  act({type:"LOAD_DECK", player:1, deck:p1.main, ex:p1.ex, side:base1.side, source:'test', name:cfg.name});
  act({type:"DRAW", player:1, n:5, initial:true});

  const fp = (firstPlayer===1) ? 1 : 0;
  /* S03-U38 (C-S03-29): 先攻・ターン・フェイズは Action で決める（直接書くと後攻開始の Replay / 保存が一致しない）。 */
  act({type:"SET_FIRST_PLAYER", player:fp});
  if(cfg.setup) setupPresetBoard(cfg.setup);
  logIt(gameState, `<b>${cfg.name}</b>：先攻 ${nameOf(fp)}`);
  if(p0.miss.length || p1.miss.length){
    logIt(gameState, `テスト用カード不足：${[...new Set(p0.miss.concat(p1.miss))].join(" / ")}`);
  }
  render();
  clearSavedDuel();
  saveDuelSoon();
  showToast(`${cfg.name}で開始`);
}

/* テストデッキ定義を選ぶ。
   System v2.5以降、40枚不足をCARD_DBから無差別補充する処理は禁止。 */
function testDeckDefinition(which){
  if(which === 'feature') return FEATURE_DECK;
  if(which === 'rabbit')  return RABBIT_LAGGIA_DECK;
  return TEST_DECK;
}
function testDeckDeclaredCount(D, key){
  return (D[key]||[]).reduce((a,e)=>a+(e.q||0),0);
}
function validateStrict1103TestDefinition(D){
  const errors=[];
  const mainN=testDeckDeclaredCount(D,'cards');
  const exN=testDeckDeclaredCount(D,'ex');
  const sideN=testDeckDeclaredCount(D,'side');
  if(mainN!==40) errors.push(`メインが${mainN}枚（40枚必要）`);
  if(exN>15) errors.push(`EXが${exN}枚（15枚上限）`);
  if(sideN>15) errors.push(`サイドが${sideN}枚（15枚上限）`);
  const counts={};
  (D.cards||[]).concat(D.ex||[],D.side||[]).forEach(e=>{ counts[e.n]=(counts[e.n]||0)+(e.q||0); });
  Object.entries(counts).forEach(([nm,n])=>{
    const lim=deckLimit(nm);
    if(lim===0) errors.push(`${nm} は1103禁止カード`);
    else if(n>lim) errors.push(`${nm} ${n}枚 > ${limitLabel(lim)||lim}上限${lim}枚`);
  });
  return errors;
}

/* テストデッキを組む。
   System v2.5: 40枚不足時にCARD_DBから無差別補充する処理を廃止。
   strict1103 デッキは宣言枚数・2011/03制限を検証し、異常なら開始しない。 */
function buildTestDeck(which){
  const D = testDeckDefinition(which);
  const main=[], ex=[], side=[], miss=[];
  const defErrors = D.strict1103 ? validateStrict1103TestDefinition(D) : [];
  if(defErrors.length){
    console.error('[1103 TEST DECK INVALID]', D.name, defErrors);
    return {main:[], ex:[], side:[], miss:[], violations:defErrors};
  }
  D.cards.forEach(e=>{
    if(!e.q) return;
    const idx = findCardIndex(e.n);
    if(idx<0){ miss.push(e.n); return; }
    for(let i=0;i<e.q;i++){
      const card = {id:idx, face:"down", pos:"atk"};
      if(CARD_DB[idx].ex) ex.push(card); else main.push(card);
    }
  });
  (D.ex||[]).forEach(e=>{
    if(!e.q) return;
    const idx = findCardIndex(e.n);
    if(idx<0){ miss.push(e.n); return; }
    for(let i=0;i<e.q;i++) ex.push({id:idx, face:"down", pos:"atk"});
  });
  (D.side||[]).forEach(e=>{
    if(!e.q) return;
    const idx = findCardIndex(e.n);
    if(idx<0){ miss.push(e.n); return; }
    side.push({n:CARD_DB[idx].n, q:e.q});
  });
  if(miss.length){
    console.warn('[1103 TEST DECK MISSING CARD DATA]', D.name, miss);
  }
  return {main, ex, side, miss, violations:[]};
}

/* ランダムテスト初手。
   普段のテストでは固定初手を使わない。連続開始で前回と同じ5枚セットになった場合は
   最大12回まで自動で再シャッフルする（テスト時の「また同じ手札」ストレスを防ぐ）。 */
const TEST_OPENING_KEY = 'yg1103:last_random_test_opening:v313';
function openingSignature(deck){
  return (deck||[]).slice(0,5).map(testCardName).sort().join('|');
}
function readLastTestOpening(){
  try{ return JSON.parse(localStorage.getItem(TEST_OPENING_KEY)||'{}')||{}; }catch(e){ return {}; }
}
function writeLastTestOpening(v){
  try{ localStorage.setItem(TEST_OPENING_KEY, JSON.stringify(v||{})); }catch(e){}
}
function shuffleFreshTestOpening(deck, player){
  // Replay記録中はlocalStorageの前回初手に依存したリロールを禁止する。
  // 同一seedからの初手生成を決定的に保つ。
  if(typeof v41IsReplayRecording==='function' && v41IsReplayRecording()){ shuffle(deck); return 1; }
  const last=readLastTestOpening();
  let sig='', tries=0;
  do{ shuffle(deck); sig=openingSignature(deck); tries++; }
  while(sig && sig===last[player] && tries<12);
  last[player]=sig; writeLastTestOpening(last);
  return tries;
}

/* テストデッキで即開始（両プレイヤーに配って手札を引く）
   which省略時は必ず1103兎ラギア。固定初手プリセットはここでは使用しない。 */
function startTestDuel(bothSides, firstPlayer, which){
  which = which || 'rabbit';
  const parsed = buildTestDeck(which);
  if(!parsed.main.length){ showToast("カードデータが読み込まれていません"); return; }
  resetForTestDuel();

  const p0Deck=parsed.main.slice();
  shuffleFreshTestOpening(p0Deck,0);
  act({type:"LOAD_DECK", player:0, deck:p0Deck, ex:parsed.ex.slice(), side:parsed.side, source:'test', name:testDeckDefinition(which).name});
  act({type:"DRAW", player:0, n:5, initial:true});

  if(bothSides){
    const p2 = buildTestDeck(which);
    const p1Deck=p2.main.slice();
    shuffleFreshTestOpening(p1Deck,1);
    act({type:"LOAD_DECK", player:1, deck:p1Deck, ex:p2.ex, side:p2.side, source:'test', name:testDeckDefinition(which).name});
    act({type:"DRAW", player:1, n:5, initial:true});
  }
  // 先攻を設定してドローフェイズから開始
  const fp = (firstPlayer===1) ? 1 : 0;
  act({type:"SET_FIRST_PLAYER", player:fp});   /* S03-U38 (C-S03-29) */
  logIt(gameState, `<b>${testDeckDefinition(which).name}</b>：ランダム初手 / 先攻 ${nameOf(fp)}`);
  render();
  const dn = testDeckDefinition(which).name;
  clearSavedDuel();                 // 新しいデュエルなので前の保存は捨てる
  saveDuelSoon();
  showToast(`${dn}：ランダム初手で開始`);
}

/* S03-U06: 通常対戦「兎ラギアと対戦開始」。
   プレイヤー1はユーザーが読み込んだデッキ構成をそのまま使い、プレイヤー2だけをサンプルの1103兎ラギアにして、
   新しいデュエルとして初期化する（途中の盤面は流用しない）。両側兎ラギアの開発テストは startTestDuel のまま残す。 */
function startRabbitOpponentDuel(firstPlayer){
  const mine = gameState && gameState.players && gameState.players[0] && gameState.players[0].loadedDeckV32;
  if(!mine || mine.source!=='user' || !(mine.main||[]).length){
    showToast('先にプレイヤー1のデッキを読み込んでください');
    return false;
  }
  const rabbit = buildTestDeck('rabbit');
  if(!rabbit.main.length){ showToast("カードデータが読み込まれていません"); return false; }
  const toCards = ids => (ids||[]).filter(id=>CARD_DB[id]).map(id=>({id, face:"down", pos:"atk"}));
  const p0Main = toCards(mine.main), p0Ex = toCards(mine.ex), p0Side = Array.isArray(mine.side)?mine.side:[], myName = mine.name||'';
  resetForTestDuel();
  act({type:"LOAD_DECK", player:0, deck:p0Main, ex:p0Ex, side:p0Side, source:'user', name:myName});
  act({type:"SHUFFLE", player:0});
  act({type:"DRAW", player:0, n:5, initial:true});
  act({type:"LOAD_DECK", player:1, deck:rabbit.main.slice(), ex:rabbit.ex.slice(), side:rabbit.side, source:'opponentSample', name:RABBIT_LAGGIA_DECK.name});
  act({type:"SHUFFLE", player:1});
  act({type:"DRAW", player:1, n:5, initial:true});
  const fp = (firstPlayer===1) ? 1 : 0;
  act({type:"SET_FIRST_PLAYER", player:fp});   /* S03-U38 (C-S03-29) */
  logIt(gameState, `<b>${myName||'自分のデッキ'}</b> 対 <b>${RABBIT_LAGGIA_DECK.name}</b>（対戦相手）/ 先攻 ${nameOf(fp)}`);
  render();
  clearSavedDuel();                 // 新しいデュエルなので前の保存は捨てる
  saveDuelSoon();
  showToast('1103兎ラギア（対戦相手）と対戦開始');
  return true;
}

/* 固定初手・固定盤面は不具合再現専用。通常のデッキ一覧には出さない。 */
function openDeveloperTestPresets(){
  if(PLAY_MODE!==PLAY_MODES.DEVELOPER){ showToast('DEVELOPERモード専用です'); return; }
  const bothRabbit=`
    <div class="dl-item test" onclick="startTestDuel(true,0,'rabbit')">
      <span class="dl-nm">両側1103兎ラギア<span class="dl-badge test">開発テスト</span></span>
      <span class="dl-n">ランダム<small>プレイヤー1・2とも兎ラギア</small></span>
    </div>`;
  const rows=bothRabbit+Object.entries(TEST_PRESETS).map(([key,cfg])=>`
    <div class="dl-item test" onclick="startPresetDuel('${key}',0)">
      <span class="dl-nm">${cfg.name}<span class="dl-badge test">再現専用</span></span>
      <span class="dl-n">固定<small>${cfg.note||''}</small></span>
    </div>`).join('');
  sheet.innerHTML=`<div class="grip"></div><h3>DEVELOPER 再現テスト</h3>
    <div class="meta" style="margin-bottom:8px">ここは不具合再現専用です。通常の対戦は「1103兎ラギア（対戦相手用）」を使ってください。</div>
    <div class="dl-list">${rows}</div>
    <button class="close" onclick="openMenu()">戻る</button>`;
  veil.classList.add('on');
}
/* index.html(1103デッキビルダー) と同じ localStorage を読む。
   既存の保存データは移動・削除・上書きしない（migration もしない）。DUEL側は読み取り専用。
   S03-U114: デッキビルダー v90 の storage contract（index.html の storage 節）に合わせる。
     LEGACY_DECK_PREFIX = 'deck1103:'            … 旧・名前キー（後方互換で読む）
     DECK_V2_PREFIX     = 'deck1103v2:'          … 現行の正本。キーは内部ID（deck1103v2:<id>）
     DECK_MIGRATION_KEY = 'deck1103v2:migrated'  … 移行済みマーカー。デッキではない
   レコード形: {id, name, cards:[{n,q}], side:[{n,q}], candidates, memo, date}
   ビルダーは旧データを v2 へ非破壊コピーする（旧キーは残る）ので、同じデッキが両方にあり得る。
   v2 を優先し、旧データは「ビルダーと同じ legacyDeckId(name)」または正規化シグネチャで重複排除する。 */
const DECK_PREFIX = 'deck1103:';
const LEGACY_DECK_PREFIX = DECK_PREFIX;
const DECK_V2_PREFIX = 'deck1103v2:';
const DECK_MIGRATION_KEY = 'deck1103v2:migrated';
const WORK_KEY    = 'work1103:current';
const DECK_COLLECTION_KEYS = ['deck1103:decks','deck1103:list','yg1103_decks','1103_decks','decks1103'];
function LS(){ try{ return window.localStorage; }catch(e){ return null; } }
/* デッキビルダー legacyDeckId() と同一（FNV-1a）。旧名前キーのデッキが v2 へ移行された時の内部ID。 */
function legacyDeckIdS03(name){
  let h=2166136261; const str=String(name||'');
  for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
  return 'legacy_'+(h>>>0).toString(36);
}
/* 正規化シグネチャ: 名前 + カード（名前順・枚数）。sourceKey を含めない（旧/v2 で同じデッキを同一視するため）。 */
function savedDeckSignatureS03(d){
  const norm = list => (list||[]).map(e=>{
    const n = typeof e==='string' ? e : (e.n||e.name||e.cardName||e.card||'');
    const q = typeof e==='string' ? 1 : (e.q||e.qty||e.count||1);
    return n+'x'+q;
  }).sort().join('|');
  return `${String(d.name||'')}#${norm(d.cards)}#${norm(d.side)}`;
}

function savedDeckCardsOf(d){
  if(!d || typeof d!=='object') return null;
  const cards = d.cards || d.main || d.mainDeck || d.deck;
  return Array.isArray(cards) ? cards : null;
}
function normalizeSavedDeckEntry(d, fallbackName, sourceKey){
  const cards = savedDeckCardsOf(d);
  if(!cards || !cards.length) return null;
  return {name:d.name||d.title||d.deckName||fallbackName||'無題', cards, side:d.side||d.sideDeck||[], date:d.date||d.updatedAt||d.updated||d.savedAt||'', sourceKey:sourceKey||'',
          id:(d.id!=null?String(d.id):''), hasOwnName:!!d.name};   /* S03-U114: ビルダーは name を持つ旧レコードだけを移行する */
}
function pushSavedDeck(out, d, fallbackName, sourceKey){
  const n = normalizeSavedDeckEntry(d, fallbackName, sourceKey);
  if(!n) return;
  const sig = `${n.sourceKey}|${n.name}|${JSON.stringify(n.cards).slice(0,500)}`;
  if(out._seen && out._seen.has(sig)) return;
  if(!out._seen) out._seen = new Set();
  out._seen.add(sig);
  out.push(n);
}
function collectSavedDecksFromValue(out, raw, sourceKey){
  let v;
  try{ v = JSON.parse(raw); }catch(e){ return; }
  if(Array.isArray(v)){
    v.forEach((d,i)=>pushSavedDeck(out,d,`保存デッキ${i+1}`,sourceKey));
    return;
  }
  pushSavedDeck(out,v,'',sourceKey);
  if(v && typeof v==='object'){
    ['decks','saved','items','list'].forEach(k=>{
      if(Array.isArray(v[k])) v[k].forEach((d,i)=>pushSavedDeck(out,d,`保存デッキ${i+1}`,sourceKey+':'+k));
    });
    Object.keys(v).forEach(k=>{
      if(v[k] && typeof v[k]==='object' && savedDeckCardsOf(v[k])) pushSavedDeck(out,v[k],k,sourceKey+':'+k);
    });
  }
}
/* S03-U114: 一覧の各行は安定キー key を持つ（v2: 'v2:'+内部ID / 旧: 'legacy:'+legacyDeckId(name) または
   'src:'+sourceKey）。選択は配列 index ではなく key で行う（localStorage の列挙順に依存しない）。 */
function listSavedDecks(){
  const ls=LS(); if(!ls) return [];
  const v2=[], legacy=[];
  try{
    const keys=[];
    for(let i=0;i<ls.length;i++){ const k=ls.key(i); if(k) keys.push(k); }
    keys.forEach(k=>{
      if(k.indexOf(DECK_V2_PREFIX)===0){
        if(k===DECK_MIGRATION_KEY) return;                       /* 移行マーカーはデッキではない */
        let rec=null; try{ rec=JSON.parse(ls.getItem(k)); }catch(e){ return; }
        if(!rec || typeof rec!=='object') return;
        const cards=savedDeckCardsOf(rec); if(!cards || !cards.length) return;
        const id=String(rec.id || k.slice(DECK_V2_PREFIX.length));
        v2.push({id, key:'v2:'+id, name:rec.name||'無題のデッキ', cards, side:Array.isArray(rec.side)?rec.side:[],
                 date:rec.date||'', sourceKey:k, source:'v2'});
      } else if(k.indexOf(LEGACY_DECK_PREFIX)===0 || DECK_COLLECTION_KEYS.includes(k)){
        collectSavedDecksFromValue(legacy, ls.getItem(k), k);
      }
    });
  }catch(e){}
  delete legacy._seen;
  const v2Ids=new Set(v2.map(d=>d.id)), v2Sigs=new Set(v2.map(savedDeckSignatureS03));
  const out=v2.slice();
  const legacySeen=new Set();
  legacy.forEach(d=>{
    /* 旧レコードが v2 へ移行される時の内部ID（ビルダーと同じ規則）。自前の id を持つ旧形式ならそれを使う。 */
    const id = d.id ? d.id : (d.hasOwnName && d.sourceKey.indexOf(LEGACY_DECK_PREFIX)===0 ? legacyDeckIdS03(d.name) : '');
    if(id && v2Ids.has(id)) return;                              /* ビルダーが移行済み（同じ内部ID） */
    const sig = savedDeckSignatureS03(d);
    if(v2Sigs.has(sig) || legacySeen.has(sig)) return;             /* 同一内容のデッキは1件だけ */
    legacySeen.add(sig);
    /* ID の無い旧形式は sourceKey + 内容ハッシュで安定キーを作る（列挙順・index に依存しない） */
    out.push(Object.assign({}, d, {id, key: id ? 'legacy:'+id : 'src:'+d.sourceKey+'#'+legacyDeckIdS03(sig), source:'legacy'}));
  });
  out.sort((a,b)=>(b.date||'').localeCompare(a.date||'') || String(a.key).localeCompare(String(b.key)));
  return out;
}
function findSavedDeckByKeyS03(key){
  return listSavedDecks().find(d=>d.key===key) || null;
}
function getWorkDeck(){
  const ls=LS(); if(!ls) return null;
  const keys = [WORK_KEY,'deck1103:work','yg1103_work_deck'];
  for(const key of keys){
    try{
      const raw=ls.getItem(key); if(!raw) continue;
      const d=normalizeSavedDeckEntry(JSON.parse(raw),'編集中のデッキ',key);
      if(d) return d;
    }catch(e){}
  }
  return null;
}
/* {cards:[{n,q}]} → 山札配列。保存デッキは既に1103上限が適用済みなのでそのまま採用 */
function cardsToDeck(cards){
  const main=[], ex=[], miss=[];
  (cards||[]).forEach(e=>{
    const nm = typeof e==='string' ? e : (e.n||e.name||e.cardName||e.card||'');
    const idx = findCardIndex(nm);
    if(idx<0){ miss.push(nm); return; }
    const q = e.q||e.qty||e.count||1;
    for(let i=0;i<q;i++){
      const card={id:idx, face:"down", pos:"atk"};
      if(CARD_DB[idx].ex) ex.push(card); else main.push(card);
    }
  });
  return {main, ex, side:[], miss, violations:[]};
}

let DECK_TAB = "saved";   // "saved" | "text"
let DECK_LOAD_PLAYER = 0;
function openDeckLoad(tab, player){
  if(tab) DECK_TAB = tab;
  if(player===0 || player===1) DECK_LOAD_PLAYER = player;
  const p = DECK_LOAD_PLAYER;
  const selected = (gameState.players[p] && gameState.players[p].loadedDeckV32) || null;
  const playerTabs = `<div class="dl-tabs" style="margin-top:6px">
      <button class="dl-tab ${p===0?'on':''}" onclick="openDeckLoad('${DECK_TAB}',0)">Player1</button>
      <button class="dl-tab ${p===1?'on':''}" onclick="openDeckLoad('${DECK_TAB}',1)">Player2</button>
    </div>`;
  const tabs = `
    <div class="dl-tabs">
      <button class="dl-tab ${DECK_TAB==='saved'?'on':''}" onclick="openDeckLoad('saved')">保存したデッキ</button>
      <button class="dl-tab ${DECK_TAB==='text'?'on':''}" onclick="openDeckLoad('text')">テキストから</button>
    </div>`;

  let body = "";
  if(DECK_TAB === "saved"){
    const decks = listSavedDecks();
    const work  = getWorkDeck();
    const ls    = LS();
    // 通常画面のテストデッキは1つだけ。固定初手や機能別プリセットはDeveloperへ隔離。
    const testRow = `
      <div class="dl-item test" onclick="rabbitRowPickS03()">
        <span class="dl-nm">1103兎ラギア（対戦相手用）<span class="dl-badge test">対戦相手</span></span>
        <span class="dl-n">40+15<small>プレイヤー1は自分のデッキ / プレイヤー2に兎ラギア</small></span>
      </div>`;
    if(!ls){
      body = testRow + `<div class="meta" style="margin-top:10px">この環境では保存デッキを読めません。「テキストから」もお使いいただけます。</div>`;
    } else if(!decks.length && !work){
      body = testRow + `<div class="meta" style="margin-top:10px">保存されたデッキがありません。<br>
        デッキビルダー（index.html）で保存すると、ここに出ます。<br>
        <b style="color:var(--gold-hi)">同じブラウザ・同じサイト</b>で保存したデッキのみ読み込めます。</div>`;
    } else {
      let rows = testRow;
      if(work){
        const n = (work.cards||[]).reduce((s,e)=>s+(e.q||1),0);
        rows += `<div class="dl-item" onclick="loadSaved('__work__')">
          <span class="dl-nm">${work.name||'編集中のデッキ'}<span class="dl-badge">編集中</span></span>
          <span class="dl-n">${n}枚</span></div>`;
      }
      /* S03-U114: 行は配列 index ではなく安定キー（v2 内部ID 等）で選ぶ。表示名はエスケープする。 */
      const escT = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      decks.forEach(d=>{
        const n = (d.cards||[]).reduce((s,e)=>s+(e.q||1),0);
        const dt = (d.date||'').slice(0,10);
        rows += `<div class="dl-item" data-deck-key="${escT(d.key)}" onclick="loadSavedById(${jsStr(d.key)})">
          <span class="dl-nm">${escT(d.name||'無題')}</span>
          <span class="dl-n">${n}枚<small>${escT(dt)}${d.source==='legacy'?' / 旧形式':''}</small></span></div>`;
      });
      body = `<div class="dl-list">${rows}</div>
        <div class="meta" style="margin-top:8px">タップすると${nameOf(p)}の次回開始用デッキに選択します。現在の手札・山札・盤面は変更しません。</div>`;
    }
  } else {
    body = `
      <div class="meta">デッキビルダーの「テキスト」タブからコピーして貼り付け。見出し（■メインデッキ等）はそのままで大丈夫です。</div>
      <textarea id="deckText" placeholder="# 我がデッキ&#10;■メインデッキ (40)&#10;[モンスター]&#10;サイバー・ドラゴン x3&#10;E・HERO エアーマン x1&#10;[魔法]&#10;サイクロン x2"></textarea>
      <div class="row2" style="margin-top:10px">
        <button class="act" onclick="loadDeck(${p}, false)">次回開始用に選択</button>
      </div>`;
  }

  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:10px">${nameOf(p)} · デッキ選択</h3>
    ${tabs}${playerTabs}
    <div class="meta" style="margin:8px 0">${selected&&selected.main&&selected.main.length?`現在の次回開始用：${selected.name||'無題'}（${selected.main.length}+${(selected.ex||[]).length}）`:'次回開始用デッキは未選択です'}</div>
    ${body}
    <button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}
/* 保存デッキを次回開始用に選ぶ。S03-U114: 一覧の安定キーで引く（index では引かない）。 */
function applySavedDeckS03(d){
  const p = DECK_LOAD_PLAYER;
  if(!d){ showToast("デッキが見つかりません（一覧を開き直してください）"); return; }
  const parsed = cardsToDeck(d.cards);
  parsed.name = d.name||'';
  parsed.deckId = d.id||'';
  parsed.sideNames = (d.side||[]).map(e=>typeof e==='string'?{n:e,q:1}:{n:e.n||e.name||'',q:e.q||e.qty||1}).filter(e=>e.n);
  applyLoad(p, parsed, false);
}
function loadSavedById(key){ applySavedDeckS03(findSavedDeckByKeyS03(String(key||''))); }
/* 旧呼び出し互換: '__work__' は編集中デッキ。数値 index は後方互換のためだけに残す（UI は loadSavedById を使う）。 */
function loadSaved(i){
  if(i==='__work__'){ applySavedDeckS03(getWorkDeck()); return; }
  applySavedDeckS03(listSavedDecks()[i]);
}
/* 1103環境での同名カード上限（0/1/2/3枚）
   carddata.json の各カードが持つ lm キーを使う（lm:0=禁止,1=制限,2=準制限,無指定=無制限）。
   これによりカード名リストの手管理は不要。 */
function deckLimit(name){
  const c = CARD_DB.find(x=>x.n===name);
  if(c && typeof c.lm === "number") return c.lm;
  return 3;
}
function limitLabel(lim){ return lim===0?"禁止":lim===1?"制限":lim===2?"準制限":""; }

/* デッキテキスト解析
   index.html の書き出し形式に対応:
     # デッキ名
     ■メインデッキ (40)
     [モンスター]
     サイバー・ドラゴン x3
     ■エクストラ (15)
     ■サイド (15)
   加えて素朴な「カード名 x3」だけの羅列にも対応。
   セクション見出し・装飾行はスキップし、■サイド以降はサイドとして分離する。 */

/* 1行を {name, qty} に。カード行でなければ null */
function parseDeckLine(line){
  let s = line.trim();
  if(!s) return null;
  // コメント/見出し/セクション行を除外
  if(/^#/.test(s)) return null;                    // # デッキ名
  if(/^[■◆●▲【]/.test(s)) return null;             // ■メインデッキ (40)
  if(/^\[.*\]$/.test(s)) return null;              // [モンスター]
  if(/^-{2,}$/.test(s)) return null;               // 区切り線
  if(/^(メインデッキ|エクストラ|サイド|main|extra|side)\b/i.test(s)) return null;
  // 先頭の箇条書き記号を除去
  s = s.replace(/^[・\-*\u2022]\s*/, '');
  // 「3x カード名」形式
  let m = s.match(/^(\d+)\s*[x×✕*]\s*(.+)$/i);
  if(m) return { name: m[2].trim(), qty: parseInt(m[1],10) };
  // 「カード名 x3」「カード名 ×3」「カード名 3」形式
  m = s.match(/^(.*?)\s*(?:[x×✕*]\s*(\d+)|\s(\d+))\s*$/i);
  if(m && (m[2]||m[3])){
    const nm = (m[1]||"").trim();
    if(nm) return { name: nm, qty: parseInt(m[2]||m[3],10) };
  }
  // 枚数指定なし = 1枚
  return { name: s, qty: 1 };
}

/* テキスト → {main, ex, side, miss, violations}
   enforceLimit=false なら1103上限を無視して指定枚数で採用 */
function parseDeckText(text, enforceLimit){
  if(enforceLimit === undefined) enforceLimit = true;
  const main=[], ex=[], side=[], miss=[];
  const counts={}; const violations=[];
  let inSide = false;

  text.split(/\r?\n/).forEach(raw=>{
    const t = raw.trim();
    // セクション切り替えを検出（■サイド 以降はサイドデッキ）
    if(/^[■◆●【]?\s*サイド/.test(t) || /^\[?\s*side\b/i.test(t)){ inSide = true; return; }
    if(/^[■◆●【]?\s*(メイン|main)/i.test(t)){ inSide = false; return; }
    if(/^[■◆●【]?\s*(エクストラ|extra|EX)/i.test(t)){ inSide = false; return; }

    const parsed = parseDeckLine(raw);
    if(!parsed) return;
    const idx = findCardIndex(parsed.name);
    if(idx < 0){ miss.push(parsed.name); return; }

    if(inSide){
      // サイドはメインに混ぜない（1人回しでは未使用だが枚数だけ保持）
      for(let i=0;i<parsed.qty;i++) side.push({id:idx, face:"down", pos:"atk"});
      return;
    }
    let take = parsed.qty;
    if(enforceLimit){
      const lim = deckLimit(parsed.name);
      const already = counts[parsed.name]||0;
      take = Math.max(0, Math.min(parsed.qty, lim - already));
      if(take < parsed.qty) violations.push({name:parsed.name, requested:parsed.qty+already, limit:lim});
      counts[parsed.name] = already + take;
    }
    for(let i=0;i<take;i++){
      const card = {id:idx, face:"down", pos:"atk"};
      if(CARD_DB[idx].ex) ex.push(card); else main.push(card);
    }
  });
  return {main, ex, side, miss, violations};
}

/* カード名の照合。完全一致 → 正規化一致 の順で探す。
   全角/半角、長音・ハイフン類、空白の揺れを吸収する。 */
let NAME_INDEX = null;
function normName(s){
  return String(s)
    .replace(/[\u30fc\u2010-\u2015\u2212\uff0d\-]/g,'ー')  // 各種ハイフン→長音
    .replace(/[\s\u3000]/g,'')                             // 空白除去
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0)) // 全角英数→半角
    .toLowerCase();
}
function buildNameIndex(){
  NAME_INDEX = new Map();
  CARD_DB.forEach((c,i)=>{
    if(!c || !c.n) return;
    if(!NAME_INDEX.has(c.n)) NAME_INDEX.set(c.n, i);
    const k = normName(c.n);
    if(!NAME_INDEX.has(k)) NAME_INDEX.set(k, i);
  });
}
function findCardIndex(name){
  if(!NAME_INDEX) buildNameIndex();
  if(NAME_INDEX.has(name)) return NAME_INDEX.get(name);
  const k = normName(name);
  if(NAME_INDEX.has(k)) return NAME_INDEX.get(k);
  return -1;
}
function loadDeck(p, autostart){
  const text = document.getElementById("deckText").value;
  const parsed = parseDeckText(text);

  // 1103 枚数超過があれば、確認モーダルを挟む（強制カット or 無視して全枚数）
  if(parsed.violations.length){
    const lines = parsed.violations.map(v=>
      `・${v.name}（${limitLabel(v.limit)}／上限${v.limit}枚）: 指定${v.requested}枚`
    ).join("<br>");
    sheet.innerHTML = `
      <h3>1103 枚数チェック</h3>
      <div class="meta">以下は1103環境の上限を超えています。</div>
      <div class="eff">${lines}</div>
      <div class="act-grid">
        <div class="act" onclick="finishLoad(${p},${autostart},true)">上限までに切って読込</div>
        <div class="act warn" onclick="finishLoad(${p},${autostart},false)">無視して指定枚数で読込</div>
      </div>
      <button class="close" onclick="openDeckLoad()">戻る</button>`;
    veil.classList.add("on");
    PENDING_DECK = {p, text};
    return;
  }
  applyLoad(p, parsed, autostart);
}

let PENDING_DECK = null;
function finishLoad(p, autostart, enforce){
  const {text} = PENDING_DECK;
  const parsed = parseDeckText(text, enforce);
  applyLoad(p, parsed, autostart);
}
function applyLoad(p, parsed, autostart){
  const {main, ex, miss} = parsed;
  if(!main.length && !ex.length){
    // 何も読めなかった理由を具体的に伝える
    const why = miss.length
      ? `カード名が ${CARD_DB.length}種のデータベースと一致しませんでした。\n\n例：\n・${[...new Set(miss)].slice(0,5).join("\n・")}`
      : `カード行が見つかりませんでした。「カード名 x3」の形式で入力してください。`;
    sheet.innerHTML = `<div class="grip"></div>
      <h3 style="margin-bottom:8px">読み込めませんでした</h3>
      <div class="eff">${why.replace(/\n/g,"<br>")}</div>
      <div class="meta" style="margin-bottom:10px">index.html の「テキスト」タブからコピーした内容をそのまま貼り付けられます。</div>
      <button class="close" onclick="openDeckLoad()">戻る</button>`;
    veil.classList.add("on");
    return;
  }
  if(autostart){
    act({type:"LOAD_DECK", player:p, deck:main, ex, side:(parsed.sideNames||[]), source:'user', name:parsed.name||''});
    act({type:"SHUFFLE", player:p});
    act({type:"DRAW", player:p, n:5, initial:true});
    // 1103は先攻ドローあり。ドローフェイズから始める。
    act({type:"SET_FIRST_PLAYER", player:p});   /* S03-U38 (C-S03-29): 直接書かず Action で記録する */
  } else {
    /* S03-U114: 保存デッキの内部ID とサイド（カード名・枚数）も記録する（デュエルには使わない） */
    act(Object.assign({type:"SET_NEXT_DECK", player:p, deck:main, ex, source:'user', name:parsed.name||''},
      parsed.deckId ? {deckId:String(parsed.deckId)} : {}, Array.isArray(parsed.sideNames) ? {side:parsed.sideNames} : {}));
  }
  closeSheet();
  saveDuelSoon();
  const missN = [...new Set(miss)].length;
  showToast(`${nameOf(p)}：メイン${main.length}枚 / EX${ex.length}枚 ${autostart?'読込':'選択'}${missN?`（未一致${missN}種）`:""}`);
  /* S03-U121: デッキビルダーからの起動動線中なら、次の画面（Player2 選択 / 先攻確認）へ進む（未一致カードはそこで表示） */
  if(!autostart && typeof builderLaunchAfterLoadS03==='function' && builderLaunchAfterLoadS03(p, [...new Set(miss)])) return;
  /* S03-U172: the normal selection ends in the start confirmation too (Player2's chosen deck could not be started before) */
  if(!autostart && typeof deckSelectAfterLoadS03==='function' && deckSelectAfterLoadS03(p, [...new Set(miss)])) return;
  if(missN){
    setTimeout(()=>{
      sheet.innerHTML = `<div class="grip"></div>
        <h3 style="margin-bottom:8px">読み込みました</h3>
        <div class="meta" style="margin-bottom:8px">メイン${main.length}枚 / EX${ex.length}枚。<br>次の${missN}種はカードデータに見つからず、除外しました。</div>
        <div class="eff">・${[...new Set(miss)].join("<br>・")}</div>
        <button class="close" onclick="closeSheet()">閉じる</button>`;
      veil.classList.add("on");
    }, 60);
  }
}

function loadedDeckCardsV108(p){
  const d = gameState && gameState.players[p] && gameState.players[p].loadedDeckV32;
  if(!d || !(d.main||[]).length) return null;
  const toCards = ids => (ids||[]).filter(id=>CARD_DB[id]).map(id=>({id, face:"down", pos:"atk"}));
  return {name:d.name||'', main:toCards(d.main), ex:toCards(d.ex), side:Array.isArray(d.side)?d.side:[], source:d.source||'user'};
}
function startSelectedDeckDuel(firstPlayer){
  const d0 = loadedDeckCardsV108(0), d1 = loadedDeckCardsV108(1);
  if(!d0 || !d1){ showToast('Player1とPlayer2のデッキを選択してください'); return false; }
  resetForTestDuel();
  act({type:"LOAD_DECK", player:0, deck:d0.main, ex:d0.ex, side:d0.side, source:d0.source, name:d0.name});
  act({type:"SHUFFLE", player:0});
  act({type:"DRAW", player:0, n:5, initial:true});
  act({type:"LOAD_DECK", player:1, deck:d1.main, ex:d1.ex, side:d1.side, source:d1.source, name:d1.name});
  act({type:"SHUFFLE", player:1});
  act({type:"DRAW", player:1, n:5, initial:true});
  const fp = (firstPlayer===1) ? 1 : 0;
  act({type:"SET_FIRST_PLAYER", player:fp});
  logIt(gameState, `<b>${d0.name||'Player1デッキ'}</b> 対 <b>${d1.name||'Player2デッキ'}</b> / 先攻 ${nameOf(fp)}`);
  render();
  clearSavedDuel();
  saveDuelSoon();
  showToast('選択デッキで新規デュエル開始');
  return true;
}

/* 軽量トースト */
function showToast(msg){
  let t = document.getElementById("toast");
  if(!t){
    t = document.createElement("div");
    t.id = "toast"; t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(showToast._tm);
  showToast._tm = setTimeout(()=>t.classList.remove("on"), 2200);
}
