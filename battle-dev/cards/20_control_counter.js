/* =========================================================================
   コントロール変更
   ========================================================================= */

/* ---- 強制転移 ----
   お互いのフィールドのモンスター1体を選択し、そのコントロールを入れ替える。
   相手のモンスターは相手が選ぶが、1台のスマホでの対戦を前提に
   このアプリでは発動側がまとめて選ぶ。 */
/* S03-U62: resolve() 内の2段階 legacy API.selectCard（渡す自分のモンスター→受け取る相手のモンスター）を
   SaveLoad安全な登録済みハンドラへ移行。強制転移とdefineControlSwapの全カード（TG1－EM1・鹵獲装置）で共有する。 */
API.registerChoiceHandler('s03u62.control-swap-mine', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const a = picks[0] && locateCardAnyV4(picks[0].card);
  if(!a || a.zone!=='mz') return;
  const theirs = swapCandidates(args.opponent);
  if(!theirs.length){ API.log(args.reason+"：相手のモンスターがいないため不発"); return; }
  /* S03-U194: 「お互いが自分フィールド上モンスターを1体ずつ選択し」 (強制転移, 鹵獲装置) — the opponent chooses its own monster, and neither
     choice can be cancelled (before: the activating player chose both, cancelable). TG1－EM1 targets both itself (unchanged). */
  const foePicks = args.reason==='強制転移' || args.reason==='鹵獲装置';
  API.requestChoice({player:foePicks?args.opponent:args.player, kind:'card', title:foePicks?`${args.reason}：相手に渡す自分のモンスター（${args.opponent===0?'Player1':'Player2'}が選択）`:`${args.reason}：相手から受け取るモンスター`,
    candidates: theirs, min:1, max:1, cancelable:!foePicks,
    resume:{handler:'s03u62.control-swap-theirs', args:{player:args.player, opponent:args.opponent, reason:args.reason, mineUid:a.card.uid}},
    meta:{scriptName:args.reason}});
});
API.registerChoiceHandler('s03u62.control-swap-theirs', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const b = picks[0] && locateCardAnyV4(picks[0].card);
  const aCard = args.mineUid!=null ? findCardByUid(args.mineUid) : null;
  if(!b || b.zone!=='mz' || !aCard || !aCard.card) return;
  // 実体を控えてから動かす。片方を動かすと添字がずれるため。
  const ca = aCard.card, cb = b.card;
  API.changeControl({card:ca}, args.opponent, args.reason);
  API.changeControl({card:cb}, args.player,   args.reason);
  /* S03-U186: 「そのモンスターはこのターン表示形式を変更できない」 (強制転移) */
  if(args.reason==='強制転移') [ca, cb].forEach(c=>{ const h = locateCardAnyV4(c); if(h && h.zone==='mz') API.setCardFlag(h, 'noPosChangeTurnS03', gameState.turn, '強制転移', {silent:true}); });
});
defineScript("強制転移", {
  type:"spell", priority:1, targets:false,
  condition(ctx){
    if(!swapCandidates(ctx.player).length){
      ctx.reason = "自分フィールドにモンスターがいません"; return false;
    }
    if(!swapCandidates(ctx.opponent).length){
      ctx.reason = "相手フィールドにモンスターがいません"; return false;
    }
    return true;
  },
  resolve(ctx){
    const mine = swapCandidates(ctx.player);
    if(!mine.length){ API.log("自分のモンスターがいないため不発"); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:"強制転移：相手に渡す自分のモンスター",
      candidates: mine, min:1, max:1, cancelable:false,
      resume:{handler:'s03u62.control-swap-mine', args:{player:ctx.player, opponent:ctx.opponent, reason:"強制転移"}},
      meta:{scriptName:"強制転移"}});
  }
});
/* 入れ替えの候補（表側・裏側どちらでもよい） */
function swapCandidates(p){
  return API.fieldCards({zone:'mz', player:p, filter:x=>x.card});
}

/* ---- コントロールを入れ替える罠・魔法 ----
   自分側の候補条件だけが違うので、共通の実装を作って使い回す。 */
function defineControlSwap(nm, def){
  defineScript(nm, Object.assign({
    type: def.kind || "trap", priority:2, targets:true,
    condition(ctx){
      if(!def.mine(ctx.player).length){ ctx.reason = def.mineWhy; return false; }
      if(!swapCandidates(ctx.opponent).length){
        ctx.reason = "相手フィールドにモンスターがいません"; return false;
      }
      return true;
    },
    resolve(ctx){
      const mine = def.mine(ctx.player);
      if(!mine.length){ API.log("自分側の対象がいないため不発"); return; }
      API.requestChoice({player:ctx.player, kind:'card', title:`${nm}：相手に渡す自分のモンスター`,
        candidates: mine, min:1, max:1, cancelable:nm!=='鹵獲装置',
        resume:{handler:'s03u62.control-swap-mine', args:{player:ctx.player, opponent:ctx.opponent, reason:nm}},
        meta:{scriptName:nm}});
    }
  }, def.extra || {}));
}

/* ---- TG1－EM1 ----
   相手のモンスター1体と、自分の表側の「TG」1体のコントロールを入れ替える。 */
defineControlSwap("TG1－EM1", {
  kind:"trap",
  mineWhy:"自分フィールドに表側表示の「TG」モンスターがいません",
  mine(p){
    return API.fieldCards({zone:'mz', player:p,
      filter:x=>x.card && x.card.face==='up' && String(x.db.n||'').indexOf('TG')===0});
  }
});

/* ---- 鹵獲装置 ----
   自分側は表側表示の通常モンスターを選ばなければならない。 */
defineControlSwap("鹵獲装置", {
  kind:"spell",
  mineWhy:"自分フィールドに表側表示の通常モンスターがいません",
  mine(p){
    return API.fieldCards({zone:'mz', player:p,
      filter:x=>x.card && x.card.face==='up' && treatedAsNormal(x.card)});
  }
});

/* ---- 死のマジック・ボックス ----
   相手のモンスター1体を破壊し、その後 自分のモンスター1体のコントロールを相手に移す。 */
/* S03-U192 (text): 「自分及び相手フィールドのモンスターを1体ずつ対象として発動できる。その相手のモンスターを破壊する。その後、その自分の
   モンスターのコントロールを相手に移す。」 — both are targets chosen at activation (before: chosen at resolution, each cancelable). */
defineScript("死のマジック・ボックス", {
  type:"spell", priority:1, targets:true,
  condition(ctx){
    if(!swapCandidates(ctx.player).length){ ctx.reason = "自分フィールドにモンスターがいません"; return false; }
    if(!swapCandidates(ctx.opponent).length){ ctx.reason = "相手フィールドにモンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("死のマジック・ボックス：破壊する相手のモンスター", swapCandidates(ctx.opponent), theirs=>
      API.selectCard("死のマジック・ボックス：相手に渡す自分のモンスター", swapCandidates(ctx.player), mine=>done([theirs, mine])));
  },
  resolve(ctx){
    const byUid=t=>t&&t.card&&t.card.uid!=null?findCardByUid(t.card.uid):null;
    const theirs=byUid(ctx.selectedTargets[0]), mine=byUid(ctx.selectedTargets[1]);
    if(theirs && theirs.zone==='mz' && theirs.p===ctx.opponent) API.destroy(theirs, "死のマジック・ボックス");
    const m2=mine && findCardByUid(mine.card.uid);
    if(m2 && m2.zone==='mz' && m2.p===ctx.player) API.changeControl(m2, ctx.opponent, "死のマジック・ボックス");
  }
});
/* S03-U62: resolve() 内の2段階 legacy API.selectCard（破壊→コントロール移動）を
   SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.death-box-destroy', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const b = picks[0] && locateCardAnyV4(picks[0].card);
  if(!b || b.zone!=='mz') return;
  API.destroy(b, "死のマジック・ボックス");
  const mine = swapCandidates(args.player);
  if(!mine.length){ API.log("渡す自分のモンスターがいません"); return; }
  API.requestChoice({player:args.player, kind:'card', title:"死のマジック・ボックス：相手に渡す自分のモンスター",
    candidates: mine, min:1, max:1, cancelable:true,
    resume:{handler:'s03u62.death-box-give', args:{player:args.player, opponent:args.opponent}},
    meta:{scriptName:"死のマジック・ボックス"}});
});
API.registerChoiceHandler('s03u62.death-box-give', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const a = picks[0] && locateCardAnyV4(picks[0].card);
  if(a && a.zone==='mz') API.changeControl(a, args.opponent, "死のマジック・ボックス");
});

/* ---- エレクトリック・ワーム ----
   手札から墓地へ捨て、相手のドラゴン族・機械族1体のコントロールをエンドフェイズまで得る。 */
defineScript("エレクトリック・ワーム", {
  /* S03-U193: an ignition effect (the text has no 「相手ターンでも」); before: a Quick Effect usable at any time */
  type:"monster", priority:1, targets:true, timing:["mainPhase"],
  activateFrom:["hand"],
  condition(ctx){
    if(ctx.zone !== 'hand'){ ctx.reason = "手札から捨てて発動します"; return false; }
    if(!wormTargets(ctx.opponent).length){
      ctx.reason = "相手フィールドにドラゴン族・機械族モンスターがいません"; return false;
    }
    return true;
  },
  cost(ctx, done){
    API.discard(ctx.player, ctx.index, "エレクトリック・ワーム（コスト）");
    done(true);
  },
  selectTargets(ctx, done){
    API.selectCard("エレクトリック・ワーム：コントロールを得るモンスター",
      wormTargets(ctx.opponent), t=>done([t]), "ドラゴン族・機械族");
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が場にないため不発"); return; }
    API.changeControl(t, ctx.player, "エレクトリック・ワーム", 'endPhase');
  },
  afterResolve(){}
});
function wormTargets(p){
  return API.fieldCards({zone:'mz', player:p,
    filter:x=>x.card && x.card.face==='up' && (x.db.ra==='ドラゴン' || x.db.ra==='機械')});
}

/* ---- インターセプト ----
   リリースを必要とするモンスターの召喚に成功した時、そのコントロールを得る。 */
defineScript("インターセプト", {
  onOtherSummon:true,           // 相手のアドバンス召喚に反応する
  type:"trap", priority:3, targets:true,
  condition(ctx){
    if(!interceptTargets(ctx.opponent).length){
      ctx.reason = "リリースを伴って召喚されたモンスターがいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("インターセプト：コントロールを得るモンスター",
      interceptTargets(ctx.opponent), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が場にないため不発"); return; }
    API.changeControl(t, ctx.player, "インターセプト");
  },
  passive:{ onNormalSummon(ctx){ return true; } }
});
/* アドバンス召喚されたモンスター（doNormalSummon が tributeCount を記録している） */
function interceptTargets(p){
  return API.fieldCards({zone:'mz', player:p,
    filter:x=>x.card && x.card.face==='up' && (x.card.tributeCount||0) >= 1});
}

/* ---- No.11 ビッグ・アイ ----
   X素材を1つ取り除き、相手モンスター1体を対象としてコントロールを得る。
   このカードは攻撃宣言できない。 */
defineScript("No.11 ビッグ・アイ", {
  countLimit:1,
  timing:["mainPhase"],
  type:"monster", priority:1, targets:true,
  /* S03-U114: 素材を選んで取り除き、その後に対象を選ぶ（どちらも SaveLoad 安全な登録済み選択） */
  detachCostS03:{count:1, reason:"No.11 ビッグ・アイ（素材1つ）",
    targets(ctx){ return {title:"No.11 ビッグ・アイ：コントロールを得るモンスター",
      candidates:API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>x.card})}; }},
  condition(ctx){
    if(ctx.zone !== 'mz'){ ctx.reason = "フィールドで発動します"; return false; }
    if(!(ctx.card.xyz||[]).length){ ctx.reason = "エクシーズ素材が必要です"; return false; }
    if(!API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>x.card}).length){
      ctx.reason = "相手フィールドにモンスターがいません"; return false;
    }
    return true;
  },
  /* S03-U114: X素材のコストは detachCostS03（DUEL・runScript とも engine/1ZF_xyz_detach_choice_s03.js が処理） */
  selectTargets(ctx, done){
    API.selectCard("No.11 ビッグ・アイ：コントロールを得るモンスター",
      API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>x.card}), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が場にないため不発"); return; }
    API.changeControl(t, ctx.player, "No.11 ビッグ・アイ");   // 永続的に得る
  },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    cannotAttack(target, self){ return target === self; }
  }
});

/* =========================================================================
   カウンターと元々の攻撃力を扱うカード
   ========================================================================= */

/* ---- 魔導戦士 ブレイカー ----
   ① 召喚に成功した場合、このカードに魔力カウンターを1つ置く（最大1つ）。
   ② 攻撃力は魔力カウンターの数×300アップする。
   ③ 魔力カウンターを1つ取り除き、フィールドの魔法・罠1枚を対象として破壊する。

   ①と③を1つのスクリプトで扱うため、カウンターの有無と
   召喚直後かどうかで動作を切り替える。 */
defineScript("魔導戦士 ブレイカー", {
  timing:["summon","free"],      // ①は召喚時、③は起動効果
  type:"monster", priority:1,
  condition(ctx){
    if(ctx.zone !== 'mz'){ ctx.reason = "フィールドで発動します"; return false; }
    if(breakerMode(ctx) === 'charge') return true;
    if(!breakerCounters(ctx)){ ctx.reason = "魔力カウンターが乗っていません"; return false; }
    if(!API.fieldCards({zone:'sz', filter:x=>x.card}).length){
      ctx.reason = "フィールドに魔法・罠カードがありません"; return false;
    }
    return true;
  },
  /* ③はカウンターを取り除くのがコスト。対象選択より前に払う。 */
  cost(ctx, done){
    if(breakerMode(ctx) === 'charge'){ done(true); return; }
    API.removeCounter({p:ctx.player, zone:'mz', index:ctx.index}, '魔力', 1);
    done(true);
  },
  selectTargets(ctx, done){
    if(breakerMode(ctx) === 'charge'){ done([]); return; }
    // 対象を取るので、公開後に相手がチェーンできる（confirmTargets が処理する）
    API.selectCard("魔導戦士 ブレイカー：破壊する魔法・罠",
      API.fieldCards({zone:'sz', filter:x=>x.card}), t=>done([t]),
      "裏側のカードも選べます");
  },
  targets:true,
  resolve(ctx){
    if(breakerMode(ctx) === 'charge'){
      API.addCounter({p:ctx.player, zone:'mz', index:ctx.index}, '魔力', 1);
      API.log("魔導戦士 ブレイカー：魔力カウンターを1つ置いた");
      return;
    }
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が場にないため不発"); return; }
    API.destroy(t, "魔導戦士 ブレイカー");
  },
  afterResolve(){},
  /* ② 魔力カウンター1つにつき攻撃力300アップ */
  continuous:{
    scope:'self', from:['mz'],
    apply(target, self){
      const n = counterCountOf(self, '魔力');
      return n ? { atk:n*300 } : null;
    }
  },
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz'; } }
});

/* カウンターを置く段階か、取り除いて破壊する段階かを判定する */
function breakerMode(ctx){
  const n = breakerCounters(ctx);
  if(n > 0) return 'break';                       // 既に乗っていれば破壊効果
  const w = gameState.timingWindow;
  if(w && w.kind === 'summon' && w.turn === gameState.turn) return 'charge';
  return 'break';                                 // カウンターが無ければ条件で弾く
}
function breakerCounters(ctx){
  return counterCountOf(ctx.card, '魔力');
}

/* カード実体に乗っているカウンターの数を数える */
function counterCountOf(card, kind){
  if(!card || !card.counters) return 0;
  return card.counters[kind || '魔力'] || 0;
}

/* ---- 神獣王バルバロス ----
   System v2.3: 「効果発動」ではなく通常召喚手順として処理する。
   0体: 表側召喚/裏側セット可。表側召喚なら元々の攻撃力1900。
   2体: 通常のアドバンス召喚/セット。
   3体: 表側召喚のみ。召喚成功後に強制誘発で相手フィールド全破壊。 */
defineScript("神獣王バルバロス", {
  type:"monster", priority:1, forced:true,
  normalSummonProcedure:{
    includeStandard:true,
    methods:[
      {id:'barbaros0', tributes:0, modes:['summon','set'],
       summonLabel:'リリースなしで召喚（元々の攻撃力1900）',
       setLabel:'リリースなしでセット',
       baseStats:{atk:1900}, loseOnFaceDown:true, loseOnNegate:true},
      {id:'barbaros3', tributes:3, modes:['summon'],
       summonLabel:'3体分リリースして召喚（成功時に相手フィールド全破壊）'}
    ]
  },
  timing:["summon"],
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face!=='up'){
      ctx.reason = "3体リリースで召喚に成功した場合に発動します"; return false;
    }
    if(ctx.card.normalSummonMethod!=='barbaros3'){
      ctx.reason = "3体リリースの方法で召喚していません"; return false;
    }
    return true;
  },
  resolve(ctx){
    // 対象を取らず、相手のモンスター・魔法罠・フィールド魔法を全て破壊。
    API.destroyAll('mz', ctx.opponent, "神獣王バルバロス");
    API.destroyAll('sz', ctx.opponent, "神獣王バルバロス");
    API.destroyAll('field', ctx.opponent, "神獣王バルバロス");
    API.log("神獣王バルバロス：相手フィールドのカードを全て破壊");
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return ctx.zone==='mz' && ctx.card.normalSummonMethod==='barbaros3'; }
  }
});

/* ---- 可変機獣 ガンナードラゴン ----
   System v2.4: 共通通常召喚手順を使用。
   0体召喚: ATK1400 / DEF1000。0体セットは最初に表になった時に半減を適用。 */
defineScript("可変機獣 ガンナードラゴン", {
  type:"monster",
  normalSummonProcedure:{
    includeStandard:true,
    methods:[
      {id:'gunner0',tributes:0,modes:['summon','set'],
       summonLabel:'リリースなしで召喚（攻守半分）',setLabel:'リリースなしでセット（表になった時に攻守半分）',
       baseStats:{atk:1400,def:1000},applyOnFlipFromSet:true,loseOnFaceDown:true,loseOnNegate:true}
    ]
  }
});

defineScript("ダブルコストン", {type:"monster",tributeValue:{value:2,target:{at:'闇'}}});
defineScript("カイザー・シーホース", {type:"monster",tributeValue:{value:2,target:{at:'光'}}});
defineScript("トロイホース", {type:"monster",tributeValue:{value:2,target:{at:'地'}}});

/* =========================================================================
   【暗黒界】関連
   「カードの効果によって手札から墓地へ捨てられた場合」に誘発する。
   捨てさせたのが相手なら追加効果が付く（card.discardInfo で判定）。
   ========================================================================= */

/* S03-U477: このイベント（onDiscard）で捨てられたのは ctx.card か。
   従来は event.card をオブジェクト同一性（ev.card !== ctx.card）で比べていた。チェーンに載ったリンクの event は生のカードを持つが、
   保存 → 読込で複製になる。同一性では複製を認識できず null（誘発しない扱い）になり、再開後の解決は「捨てられた時の効果」ではなく別の枝に落ちた
   （グラファは破壊の代わりに墓地から蘇生、ゴルド／シルバ／スノウ／ブラウは「相手のカードの効果で捨てられた場合、さらに…」が消える）。
   識別は uid で行う（デュエル中の「その 1 枚」。同名の別個体と区別でき、保存・読込・Undo を越えて保たれる）。
   - 両側に uid がある時だけ uid を比べる。undefined === undefined を一致にしない（uid の無いカード同士を同じカードと見なさない）。
   - どちらかに uid が無い時は「全く同じオブジェクト」の時だけ一致（複製や別のオブジェクトは一致しない）。実際の道では uid は必ず付く:
     イベント作成時に queueDeferredEventV2（engine/30）と safeActivationEventV11 が ensureCardUid を呼び、チェーンに載るカードも発動準備で uid を得る。
     uid が無いのは直接構成した場合だけで、そこでは同一性の比較に退く（推測で一致にしない）。
   - カードを名指ししないイベント（card も uid も無い）は比べない（従来どおり）。 */
function darkWorldEventIsSelf(ctx){
  const c = ctx.card, ev = ctx.event || {};
  if(!ev.card && ev.uid == null) return true;
  const evUid = ev.uid != null ? ev.uid : ((ev.card && ev.card.uid != null) ? ev.card.uid : null);
  if(evUid != null && c && c.uid != null) return evUid === c.uid;
  return !!ev.card && ev.card === c;
}

/* 暗黒界の誘発条件。自分の効果で捨てられたなら 'self'、相手なら 'opponent'、
   誘発しないなら null を返す。 */
function darkWorldDiscard(ctx){
  if(!ctx || ctx.eventName !== 'onDiscard') return null;
  const info = ctx.card && ctx.card.discardInfo;
  if(!info || !info.byEffect) return null;
  if(!darkWorldEventIsSelf(ctx)) return null;   /* S03-U477: 捨てられたカードの識別は uid（下の darkWorldEventIsSelf） */
  if(info.byPlayer !== ctx.player) return 'opponent';
  /* S03-U112: discardInfo.byPlayer は P3 の設計どおり「手札の持ち主」基準のまま（明示指定が無ければ捨てた本人）。
     誰の効果かは P3 provenance（act() 時に焼き込まれる actingPlayer）で判定する。これが無いと相手の《手札抹殺》等で
     捨てられても「相手のカードの効果によって捨てられた場合」が起きなかった。 */
  if(typeof movedByOpponentEffectV3==='function' && movedByOpponentEffectV3(ctx.card, ctx.player)) return 'opponent';
  return 'self';
}

/* ---- 暗黒界の尖兵 ベージ ----
   効果で手札から捨てられた場合、墓地から特殊召喚する。 */
defineScript("暗黒界の尖兵 ベージ", {
  type:"monster", priority:1, forced:true,   /* S03-U112: 「…特殊召喚する」は強制 */
  activateFrom:["grave"],
  condition(ctx){
    if(!darkWorldDiscard(ctx)){
      ctx.reason = "カードの効果によって手札から捨てられた場合に発動します"; return false;
    }
    return true;
  },
  resolve(ctx){
    const me = API.pileCards(ctx.player,'grave',x=>x.card===ctx.card)[0];
    if(me) API.specialSummon(ctx.player,'grave',me.index,'atk',"暗黒界の尖兵 ベージ");
  },
  afterResolve(){}
});

/* ---- 暗黒界の術師 スノウ ----
   効果で捨てられた場合、デッキから「暗黒界」カード1枚を手札に加える。
   相手の効果で捨てられた場合、さらに相手の墓地のモンスター1体を
   自分フィールドに表側守備表示で特殊召喚できる。 */
/* S03-U62: resolve() 内の legacy API.selectCard（相手の墓地から任意で特殊召喚）を
   SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.snow-revive', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  /* S03-U477: 相手の墓地から特殊召喚する。fromPlayer（h.p）を渡さないと自分の墓地の同じ位置のカードを特殊召喚してしまっていた（Save/Load とは無関係の既存不具合） */
  if(h && h.zone==='grave') API.specialSummon(args.player,'grave',h.index,'def',"暗黒界の術師 スノウ",h.p);
});
defineScript("暗黒界の術師 スノウ", {
  type:"monster", priority:1, forced:true,   /* S03-U112: サーチは強制（相手の効果の場合の追加蘇生だけ任意） */
  activateFrom:["grave"],
  condition(ctx){
    if(!darkWorldDiscard(ctx)){
      ctx.reason = "カードの効果によって手札から捨てられた場合に発動します"; return false;
    }
    if(!darkWorldInDeck(ctx.player).length){
      ctx.reason = "デッキに「暗黒界」カードがありません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("暗黒界の術師 スノウ：手札に加える「暗黒界」",
      darkWorldInDeck(ctx.player), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(t) API.searchDeck(ctx.player, t.index, "暗黒界の術師 スノウ");
    if(darkWorldDiscard(ctx) !== 'opponent') return;
    const foes = API.pileCards(ctx.opponent,'grave',x=>x.db.k==='m' && !x.db.ex);
    if(!foes.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"暗黒界の術師 スノウ：相手の墓地から特殊召喚（任意）",
      candidates: foes, min:1, max:1, cancelable:true,
      note:"相手の効果で捨てられたので使えます。使わない場合は閉じてください",
      resume:{handler:'s03u62.snow-revive', args:{player:ctx.player}},
      meta:{scriptName:"暗黒界の術師 スノウ"}});
  },
  afterResolve(){}
});
function darkWorldInDeck(p){
  return API.pileCards(p,'deck',x=>String(x.db.n||'').indexOf('暗黒界')>=0);
}

/* ---- 暗黒界の龍神 グラファ ----
   ① 自分フィールドの他の「暗黒界」1体を手札に戻して墓地から特殊召喚する。
   ② 効果で手札から捨てられた場合、相手フィールドのカード1枚を選択して破壊する。 */
defineScript("暗黒界の龍神 グラファ", { targets:true, /* S03-U476: 破壊は対象を取る（WIKI-7722BBA38465 2011-06-18）。選択側は targeting:true で耐性済み。ここは srcS03.tg のための宣言。手札に戻すコスト（墓地から蘇生する側）は cost 段階 */
  type:"monster", priority:1, forced:true,   /* S03-U112: 捨てられた時の破壊は強制（forced は誘発にだけ効き、墓地からの起動効果には影響しない） */
  activateFrom:["grave"],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = "墓地から発動します"; return false; }
    // 捨てられて誘発した場合は破壊効果、そうでなければ蘇生効果
    if(darkWorldDiscard(ctx)) return true;
    if(!graphaFodder(ctx.player).length){
      ctx.reason = "手札に戻す他の「暗黒界」モンスターが自分フィールドにいません"; return false;
    }
    return true;
  },
  cost(ctx, done){
    if(darkWorldDiscard(ctx)){ done(true); return; }   // 破壊効果にコストはない
    API.selectCard("暗黒界の龍神 グラファ：手札に戻す「暗黒界」",
      graphaFodder(ctx.player), r=>{
        API.returnToHand(r, "暗黒界の龍神 グラファ（コスト）");
        done(true);
      });
  },
  /* S03-U125: 捨てられた時の効果は「相手フィールド上に存在するカード1枚を選択して破壊する」— 対象は発動時に選ぶ
     （以前は解決時に選んでいた）。相手のカードの効果で捨てられた場合の「さらに相手の手札をランダムに1枚確認し、モンスター
     なら自分フィールドに特殊召喚できる」は未実装だった。 */
  selectTargets(ctx, done){
    if(!darkWorldDiscard(ctx)){ done([]); return; }
    const foes = API.fieldCards({player:ctx.opponent, filter:x=>x.card});
    if(!foes.length){ done([]); return; }
    const ok = requestChoiceV49({kind:'card', title:"暗黒界の龍神 グラファ：破壊する相手のカード（対象）",
      candidates:foes, min:1, max:1, targeting:true, cancelable:false,
      legacy:{ onPick:(first)=>done(first ? [first] : []) }, meta:{scriptName:"暗黒界の龍神 グラファ"}});
    if(!ok) done([]);
  },
  resolve(ctx){
    if(darkWorldDiscard(ctx)){
      const t = (ctx.selectedTargets||[])[0], r = t && resolveTarget(t);
      if(r && r.p===ctx.opponent) API.destroy(r, "暗黒界の龍神 グラファ");
      if(darkWorldDiscard(ctx)==='opponent') graphaPeekHandS03(ctx.player, ctx.opponent);
      return;
    }
    const me = API.pileCards(ctx.player,'grave',x=>x.card===ctx.card)[0];
    if(me) API.specialSummon(ctx.player,'grave',me.index,'atk',"暗黒界の龍神 グラファ");
  },
  afterResolve(){}
});
/* S03-U62: resolve() 内の legacy API.selectCard（破壊する相手のカード）を
   SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.grapha-destroy', (answer) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(h) API.destroy(h, "暗黒界の龍神 グラファ");
});
/* S03-U125: 相手の手札をランダムに1枚確認する。乱数は Action の中で引く（GRAPHA_PEEK_S03、Replay で同じカード）。
   モンスターなら自分フィールドに特殊召喚できる（任意：はい／いいえ）。 */
function graphaPeekHandS03(player, opponent){
  if(!(gameState.players[opponent].hand||[]).length){ API.log("暗黒界の龍神 グラファ：相手の手札がない"); return; }
  act({type:'GRAPHA_PEEK_S03', player, opponent});
  const pk = gameState.graphaPeekS03, h = pk && pk.uid!=null ? findCardByUid(pk.uid) : null;
  if(!h || h.zone!=='hand') return;
  if(dbOf(h.card).k!=='m' || gameState.players[player].mz.length >= ZONE_LIMITS.mz) return;
  API.requestChoice({player, kind:'yesno', title:`暗黒界の龍神 グラファ：確認した ${cardName(h.card)} を自分フィールドに特殊召喚しますか？`,
    candidates:[{key:'yes', label:'特殊召喚する', value:true}, {key:'no', label:'しない', value:false}], min:1, max:1, cancelable:false,
    resume:{handler:'s03u125.grapha-steal', args:{player, opponent, uid:pk.uid}}, meta:{scriptName:"暗黒界の龍神 グラファ"}});
}
API.registerChoiceHandler('s03u125.grapha-steal', (answer, args)=>{
  const c = answer && answer.cards && answer.cards[0];
  if(!c || c.value!==true) return;
  const h = findCardByUid(args.uid);
  if(!h || h.p!==args.opponent || h.zone!=='hand') return;
  API.specialSummon(args.player, 'hand', h.index, 'atk', "暗黒界の龍神 グラファ", args.opponent);
});
function graphaFodder(p){
  return API.fieldCards({zone:'mz', player:p,
    filter:x=>x.card && x.card.face==='up' &&
              String(x.db.n||'').indexOf('暗黒界')>=0 &&
              x.db.n !== '暗黒界の龍神 グラファ'});
}

/* ---- 暗黒界の斥候 スカー: S03-U156 — moved to the shared deck-trigger engine (cards/HZG, engine/1ZT): the Deck is examined at
   resolution (it was chosen at activation, and the effect could not be activated with no candidate although it is forced). ---- */

/* ---- 暗黒界の門 ----
   表側の悪魔族モンスターの攻守が300アップする。
   1ターンに1度、墓地の悪魔族1体を除外して手札の悪魔族1体を捨て、1枚ドローする。
   S03-U62: resolve() 内の legacy API.selectCard（捨てる手札の悪魔族）を
   SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.dark-world-gate-discard', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(!h || h.zone!=='hand') return;
  // 自分の効果で捨てるので暗黒界モンスターが誘発する
  API.discard(args.player, h.index, "暗黒界の門", {byPlayer:args.player});
  API.draw(args.player, 1, "暗黒界の門");
});
defineScript("暗黒界の門", {
  fieldIgnition:true,          // 表側で場に残ったまま効果を発動できる
  countLimit:1,
  type:"spell", priority:1, quickEffect:false,
  condition(ctx){
    if(!API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.ra==='悪魔').length){
      ctx.reason = "墓地に悪魔族モンスターがいません"; return false;
    }
    if(!API.pileCards(ctx.player,'hand',x=>x.db.k==='m' && x.db.ra==='悪魔').length){
      ctx.reason = "手札に悪魔族モンスターがいません"; return false;
    }
    if(!(API.me(ctx).deck||[]).length){ ctx.reason = "デッキが残っていません"; return false; }
    return true;
  },
  cost(ctx, done){
    const g = API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.ra==='悪魔');
    API.selectCard("暗黒界の門：除外する墓地の悪魔族", g, x=>{
      API.banish(x, "暗黒界の門（コスト）");
      done(true);
    });
  },
  resolve(ctx){
    const h = API.pileCards(ctx.player,'hand',x=>x.db.k==='m' && x.db.ra==='悪魔');
    if(!h.length){ API.log("手札に悪魔族がいないため不発"); return; }
    /* S03-U112: 「手札から悪魔族モンスター1体を選択して捨てる。その後…1枚ドローする」は強制。
       以前は cancelable:true で、コスト（墓地の悪魔族の除外）を払った後に選択を取り消すと
       捨てる処理もドローも丸ごと行われず、強制効果が任意になっていた。 */
    API.requestChoice({player:ctx.player, kind:'card', title:"暗黒界の門：捨てる手札の悪魔族",
      candidates: h, min:1, max:1, cancelable:false,
      resume:{handler:'s03u62.dark-world-gate-discard', args:{player:ctx.player}},
      meta:{scriptName:"暗黒界の門"}});
  },
  afterResolve(){},          // フィールド魔法なので場に残る
  continuous:{
    scope:'allMonsters', from:['field'],
    apply(target){ return dbOf(target).ra === '悪魔' ? {atk:300, def:300} : null; }
  }
});

/* ---- メタモルポット ----
   リバースした場合、お互いの手札を全て捨て、その後お互いに5枚ドローする。 */
defineScript("メタモルポット", {
  type:"monster", priority:1, forced:true,
  condition(){ return true; },
  resolve(ctx){
    [0,1].forEach(p=>{
      const P = gameState.players[p];
      for(let i=(P.hand||[]).length-1; i>=0; i--)
        API.discard(p, i, "メタモルポット", {byPlayer:ctx.player});
    });
    [0,1].forEach(p=>API.draw(p, 5, "メタモルポット"));
  },
  afterResolve(){},
  passive:{ onFlip(ctx){ return ctx.zone==='mz'; } }
});

/* =========================================================================
   【カラクリ】関連
   表示形式の変更を軸にしたテーマ。
   ========================================================================= */

/* ---- カラクリ将軍 無零 ----
   このカードがシンクロ召喚に成功した時、自分のデッキから「カラクリ」と名のついたモンスター1体を特殊召喚する事ができる。
   1ターンに1度、フィールド上に存在するモンスター1体を選択し、表示形式を変更する事ができる。
   S03-U123: 以前は1つの defineScript で、S召喚時の誘発が②と同じ resolve（表示形式変更）を実行していた（デッキから
   特殊召喚されなかった）。countLimit もスクリプト全体に掛かり、①を使うと②の1ターンに1度も消費されていた。
   v4 の2効果に分け、回数制限は②（'position'）だけに掛ける。 */
function muzeroRecruitPoolS03(p){ return karakuriInDeck(p); }
defineUnifiedCardV4('カラクリ将軍 無零',[{
  key:'synchro-recruit', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'],
  condition(ctx){
    if(!s03SelfSynchroSummonedU121(ctx)){ ctx.reason = "このカードがシンクロ召喚に成功した時に発動できます"; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = "モンスターゾーンが一杯です"; return false; }
    if(!muzeroRecruitPoolS03(ctx.player).length){ ctx.reason = "デッキに「カラクリ」モンスターがいません"; return false; }
    return true;
  },
  operation(ctx){
    const cands = muzeroRecruitPoolS03(ctx.player);
    if(!cands.length || API.me(ctx).mz.length >= ZONE_LIMITS.mz) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"カラクリ将軍 無零：デッキから特殊召喚する「カラクリ」モンスター",
      candidates:cands, min:1, max:1, cancelable:false,
      resume:{handler:'s03u123.muzero-recruit', args:{player:ctx.player}}, meta:{scriptName:"カラクリ将軍 無零"}});
  },
  afterResolve(){}
},{
  key:'position', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = "フィールドで表側表示の時に発動します"; return false; }
    if(!API.fieldCards({zone:'mz', filter:x=>x.card}).length){ ctx.reason = "フィールドにモンスターがいません"; return false; }
    return true;
  },
  target(ctx, done){
    API.selectCard("カラクリ将軍 無零：表示形式を変更するモンスター", API.fieldCards({zone:'mz', filter:x=>x.card}), t=>done([t]));
  },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz') togglePosition(r, "カラクリ将軍 無零");
  },
  afterResolve(){}
}],{type:'monster', priority:1, targets:true, countLimit:{n:1, effects:['position']}, timing:['summon','mainPhase'],
  passive:{ onSpecialSummon(ctx){ return s03SelfSynchroSummonedU121(ctx); } }});
API.registerChoiceHandler('s03u123.muzero-recruit', (answer, args)=>{
  const t = (answer && answer.cards || []).filter(x=>x && !x.stale && x.card)[0];
  const h = t && locateCardAnyV4(t.card);
  if(h && h.p===args.player && h.zone==='deck') API.specialSummon(args.player, 'deck', h.index, 'atk', "カラクリ将軍 無零");
});
function karakuriInDeck(p){
  return API.pileCards(p,'deck',
    x=>x.db.k==='m' && !x.db.ex && String(x.db.n||'').indexOf('カラクリ')>=0);
}

/* 表示形式を変更し、「カラクリ」なら変更イベントを通知する */
function notifyKarakuriPositionChangeV350(p,card){
  if(!card || card.face!=='up' || String(dbOf(card).n||'').indexOf('カラクリ')<0) return false;
  if(PLAY_MODE===PLAY_MODES.DUEL && (gameState.chain.length || gameState.processorCurrent)){
    queueDeferredEventV2("onKarakuriPositionChange", {player:p, card}); return true;
  }
  return emitEvent("onKarakuriPositionChange", {player:p, card});
}
function togglePosition(t, reason){
  const r = resolveTarget(t);
  if(!r || !r.card) return;
  const card=r.card;
  act({type:"TOGGLE_POS", player:r.p, zone:r.zone, index:r.index, reason});
  notifyKarakuriPositionChangeV350(r.p,card);
}

/* ---- カラクリ忍者 九壱九 ----
   ・攻撃可能な場合には攻撃しなければならない
   ・攻撃対象に選択された時、表示形式を変更する
   ・戦闘で相手モンスターを破壊した時、墓地のレベル4以下の「カラクリ」を
     表側守備表示で特殊召喚する。 */
defineScript("カラクリ忍者 九壱九", { targets:true, /* S03-U476: 「墓地のレベル4以下の「カラクリ」1体を選択して表側守備表示で特殊召喚」は対象を取る（カード文の「選択して」。裁定アーカイブに個別の回答なし） */
  type:"monster", priority:1, forced:true,
  condition(ctx){
    if(!karakuriInGrave(ctx.player).length){
      ctx.reason = "墓地にレベル4以下の「カラクリ」がいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("カラクリ忍者 九壱九：特殊召喚する「カラクリ」",
      karakuriInGrave(ctx.player), t=>done([t]), "レベル4以下・表側守備表示");
  },
  resolve(ctx){
    /* S03-U116: 発動時に選択した墓地のカードを解決時に探し直す（添字は途中で変わりうる） */
    const t = ctx.selectedTargets[0], h = t && resolveTarget(t);
    if(h && h.p===ctx.player && h.zone==='grave') API.specialSummon(ctx.player,'grave',h.index,'def',"カラクリ忍者 九壱九");
  },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    mustAttack(){ return true; }
  },
  dsTiming:'leave',
  passive:{
    /* S03-U116: 「戦闘によって相手モンスターを破壊し墓地へ送った時」— 攻撃側でも守備側（攻撃対象）でもよい。
       破壊した相手モンスターが墓地にある時だけ（除外された場合は発動しない）。 */
    onDamageStep(ctx){
      const b = ctx.battle || {};
      if(ctx.zone!=='mz' || ctx.step!=='leave') return false;
      const foe = b.atkCard===ctx.card ? (b.destroyedDef && b.defCard) : b.defCard===ctx.card ? (b.destroyedAtk && b.atkCard) : null;
      const h = foe && locateCardAnyV4(foe);
      return !!(h && h.zone==='grave');
    }
  }
});
function karakuriInGrave(p){
  return API.pileCards(p,'grave',
    x=>x.db.k==='m' && String(x.db.n||'').indexOf('カラクリ')>=0 && (x.db.lv||9)<=4);
}

/* ---- カラクリ参謀 弐四八 ----
   召喚・特殊召喚に成功した時、フィールドのモンスター1体の表示形式を変更する。 */
defineScript("カラクリ参謀 弐四八", { targets:true, /* S03-U476: 表示形式を変更する効果は対象を取る（WIKI-EFE3E370ADDF 2011-06-11「対象をとります」。カード文に「選択」の語は無いが裁定が対象を取ると答えている） */
  type:"monster", priority:1, forced:true,
  condition(ctx){
    if(!API.fieldCards({zone:'mz', filter:x=>x.card}).length){
      ctx.reason = "フィールドにモンスターがいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("カラクリ参謀 弐四八：表示形式を変更するモンスター",
      API.fieldCards({zone:'mz', filter:x=>x.card}), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(t) togglePosition(t, "カラクリ参謀 弐四八");
  },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    mustAttack(){ return true; }
  },
  passive:{
    onNormalSummon(ctx){ return ctx.zone==='mz'; },
    onSpecialSummon(ctx){ return ctx.zone==='mz'; }
  }
});

/* ---- カラクリ小町 弐弐四 ----
   ①攻撃可能な場合には攻撃しなければならない。
   ②表側表示のこのカードが攻撃対象に選択された時、表示形式を変更する。（S03-U101で追加：
    実際のテキストにあるが元の実装には無かった。カラクリ守衛 参壱参の同じ文言の条項と同形。）
   ③表側表示で存在する限り、自分メインフェイズに1度だけ、
     通常召喚に加えて「カラクリ」モンスター1体を召喚できる。 */
defineScript("カラクリ小町 弐弐四", {
  /* S03-U101: ②の passive.onAttackDeclare を追加すると、timing を明示しない限り
     scriptTimings() が 'attackDeclare' だけを推定し、③の手動発動（本来メインフェイズに
     いつでも起動できる）まで攻撃対象選択時限定にされてしまう（大神官デ・ザードと同じ罠）。 */
  countLimit:1,
  type:"monster", priority:1, forced:true, timing:['mainPhase','attackDeclare'],
  condition(ctx){
    if(ctx.eventName === 'onAttackDeclare'){
      const a = gameState.pendingAttack;
      return ctx.zone === 'mz' && ctx.card.face === 'up' && !!a
        && a.targetUid === ensureCardUid(gameState, ctx.card);
    }
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){
      ctx.reason = "フィールドに表側表示で存在する場合に発動します"; return false;
    }
    if(!API.pileCards(ctx.player,'hand',
        x=>x.db.k==='m' && String(x.db.n||'').indexOf('カラクリ')>=0).length){
      ctx.reason = "手札に「カラクリ」モンスターがいません"; return false;
    }
    return true;
  },
  resolve(ctx){
    if(ctx.eventName === 'onAttackDeclare'){
      const h = locateCardAnyV4(ctx.card);
      if(h) API.changePosition(h, h.card.pos === 'atk' ? 'def' : 'atk', 'カラクリ小町 弐弐四');
      return;
    }
    /* S03-U101: 追加の通常召喚権を1回与える。以前は karakuriExtraSummon という
       どこからも読まれないフラグを立てるだけで、実際に追加召喚を提示する
       extraNormalSummonKeyV370（engine/40_legal_script_engine.js）に繋がっておらず、
       効果が完全に機能していなかった（鬼ガエルの v370FrogExtraNormal と同じ形の
       カウンター方式に修正）。 */
    const P = API.me(ctx);
    API.setFlag(ctx.player, 'karakuriExtraNormal', Number(P.temporaryFlags.karakuriExtraNormal||0)+1, true);
    API.log("カラクリ小町 弐弐四：「カラクリ」モンスター1体を追加で召喚できる");
  },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    mustAttack(){ return true; }
  },
  passive:{
    onAttackDeclare(ctx){
      const a = gameState.pendingAttack;
      return ctx.zone === 'mz' && ctx.card.face === 'up' && !!a
        && a.targetUid === ensureCardUid(gameState, ctx.card);
    }
  }
});

/* ---- カラクリ守衛 参壱参 ----
   ①攻撃可能な場合には攻撃しなければならない。
   ②表側表示のこのカードが攻撃対象に選択された時、表示形式を変更する。
   ③表側攻撃表示で存在する限り、戦闘では破壊されない。
   ④このカードの戦闘によって自分が戦闘ダメージを受けた時、自分フィールドの表側表示の
     「カラクリ」モンスター全ての攻撃力・守備力をエンドフェイズ時まで800アップする。 */
function v70SaizanBattleDamage(ctx){
  const b = ctx.battle||{};
  if(ctx.zone !== 'mz' || ctx.step !== 'after') return false;
  if(b.atkCard !== ctx.card && b.defCard !== ctx.card) return false;
  return b.toPlayer === ctx.player && b.damage > 0;
}
defineScript("カラクリ守衛 参壱参", {
  type:"monster", priority:1, forced:true, dsTiming:'after',
  condition(ctx){
    if(ctx.eventName === 'onAttackDeclare'){
      const a = gameState.pendingAttack;
      return ctx.zone === 'mz' && ctx.card.face === 'up' && !!a
        && a.targetUid === ensureCardUid(gameState, ctx.card);
    }
    if(ctx.eventName === 'onDamageStep') return v70SaizanBattleDamage(ctx);
    return false;
  },
  resolve(ctx){
    if(ctx.eventName === 'onAttackDeclare'){
      const h = locateCardAnyV4(ctx.card);
      if(h) API.changePosition(h, h.card.pos === 'atk' ? 'def' : 'atk', 'カラクリ守衛 参壱参');
      return;
    }
    API.fieldCards({ player:ctx.player, zone:'mz',
      filter:x => x.card.face === 'up' && x.db.k === 'm' && String(x.db.n||'').indexOf('カラクリ') >= 0
    }).forEach(x => {
      const r = resolveTarget(x);
      if(r && r.zone === 'mz') API.modAtk(r, 800, 800, 'endPhase', 'カラクリ守衛 参壱参');
    });
  },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    mustAttack(){ return true; },
    battleProof(card){ return card.pos === 'atk'; }
  },
  passive:{
    onAttackDeclare(ctx){
      const a = gameState.pendingAttack;
      return ctx.zone === 'mz' && ctx.card.face === 'up' && !!a
        && a.targetUid === ensureCardUid(gameState, ctx.card);
    },
    onDamageStep:v70SaizanBattleDamage
  }
});

/* ---- カラクリ解体新書 ----
   「カラクリ」の表示形式が変更される度にカラクリカウンターを1つ置く（最大2つ）。
   フィールドのこのカードを墓地へ送り、カウンターの数だけドローする。 */
defineScript("カラクリ解体新書", {
  fieldIgnition:true,          // 表側で場に残ったまま効果を発動できる
  type:"spell", priority:1,
  condition(ctx){
    if(ctx.zone !== 'sz'){ ctx.reason = "フィールドで発動します"; return false; }
    const n = API.countCounter({p:ctx.player, zone:'sz', index:ctx.index}, 'カラクリ');
    if(!n){ ctx.reason = "カラクリカウンターが乗っていません"; return false; }
    return true;
  },
  /* S03-U102: 実際のDUELパイプラインでは、cost() で書き込んだ ctx への任意プロパティは
     resolve() まで残らない（resolve() は独立に再構築された ctx を受け取る — 直接
     cost()/resolve() を手で呼ぶ簡易テストでは同じ ctx を使い回すため見えなかった）。
     カウンターはこのカードが場を離れると同時に失われる（ZONE_LOCAL_KEYS）ので、
     コスト時点の枚数は場を離れないカード本体への API.setCardFlag で運ぶ。 */
  cost(ctx, done){
    const n = API.countCounter({p:ctx.player, zone:'sz', index:ctx.index}, 'カラクリ');
    API.setCardFlag({card:ctx.card}, 'karakuriBookCount', n, "カラクリ解体新書", {silent:true});
    API.sendToGrave({p:ctx.player, zone:'sz', index:ctx.index, card:ctx.card},
                    "カラクリ解体新書（コスト）");
    done(true);
  },
  resolve(ctx){
    const n = Number(ctx.card && ctx.card.karakuriBookCount || 0);
    if(n) API.draw(ctx.player, n, "カラクリ解体新書");
  },
  afterResolve(){},
  passive:{
    /* 「カラクリ」の表示形式が変わったらカウンターを置く（最大2つ） */
    onKarakuriPositionChange(ctx){
      if(ctx.zone !== 'sz') return false;
      const at = {p:ctx.player, zone:'sz', index:ctx.index};
      if(API.countCounter(at, 'カラクリ') >= 2) return false;
      API.addCounter(at, 'カラクリ', 1);
      return false;      // 自動処理なのでチェーンには乗せない
    }
  }
});

/* =========================================================================
   汎用の魔法・罠（永続効果を伴うもの）
   ========================================================================= */

/* ---- スキルドレイン ----
   フィールドの全ての表側表示モンスターの効果が無効になる。
   継続効果として実装するので、場を離れれば自動的に解除される。
   ダメージステップ⑤で墓地に送られた後のリバース効果は、
   「フィールドで発動した扱い」なのでこれを貫通する（当時裁定）。 */
defineScript("スキルドレイン", {
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(){ return null; },              // 攻守には影響しない
    negateEffect(){ return true; }        // 表側モンスターの効果を無効化する
  }
});

/* ---- デモンズ・チェーン（継続効果部分の追加） ----
   対象の表側モンスターは攻撃できず、効果は無効化される。 */
if(CARD_SCRIPTS["デモンズ・チェーン"]){
  CARD_SCRIPTS["デモンズ・チェーン"].continuous = {
    scope:'allMonsters', from:['sz'],
    apply(){ return null; },
    /* S03-U188: JSON-safe uid link (both marks are zone-local), set by the script's resolve */
    negateEffect(target, self){ return !!(target && self && self.face==='up' && self.stLinkTargetS03!=null && self.stLinkTargetS03===target.uid && target.stLinkByS03===self.uid); },
    cannotAttack(target, self){ return !!(target && self && self.face==='up' && self.stLinkTargetS03!=null && self.stLinkTargetS03===target.uid && target.stLinkByS03===self.uid); }
  };
}

/* ---- 禁じられた聖槍 ----
   対象の表側モンスターはターン終了時まで攻撃力800ダウンし、
   このカード以外の魔法・罠の効果を受けない。 */
defineScript("禁じられた聖槍", {
  type:"spell", priority:2, quickEffect:true, targets:true,
  condition(ctx){
    if(!API.fieldCards({zone:'mz', filter:x=>x.card && x.card.face==='up'}).length){
      ctx.reason = "表側表示のモンスターがいません"; return false;
    }
    /* S03-U470: 対象耐性で候補が0になる時は発動の前に断る */
    if(!API.targetableCardsS03(API.fieldCards({zone:'mz', filter:x=>x.card && x.card.face==='up'}), ctx.player).length){
      ctx.reason = "効果の対象にできる表側表示のモンスターがいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("禁じられた聖槍：対象のモンスター",
      API.fieldCards({zone:'mz', filter:x=>x.card && x.card.face==='up'}), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が場にないため不発"); return; }
    const h = resolveTarget(t);
    if(!h || h.zone!=='mz' || h.card.face!=='up'){ API.log("対象が場にないため不発"); return; }
    API.modAtk(h, -800, 0, 'endTurn', '禁じられた聖槍');
    /* S03-U115: 「このカード以外の魔法・罠カードの効果を受けない」は engine/1ZG_unaffected_by_st_s03.js が参照する。
       以前の spearProof フラグはどこからも読まれておらず、耐性が働いていなかった。 */
    ensureCardUid(gameState, ctx.card);
    API.setCardFlag({card:h.card},'spearProofS03',{turn:gameState.turn, srcUid:ctx.card.uid},'禁じられた聖槍',{silent:true});
    API.log(`${labelOf(h.card)} はターン終了時まで、このカード以外の魔法・罠カードの効果を受けない`);
  }
});

/* ---- 光の護封壁 ----
   1000の倍数のライフを払って発動。払った数値以下の攻撃力を持つ
   相手モンスターは攻撃できない。 */
/* S03-U194: 「1000の倍数のライフポイントを払って発動する」 — the legacy cost offered pseudo-cards and lost the amount in DUEL (LP became null,
   the wall value 0). Now the amount is declared at activation (P1.1 choice), paid and recorded (recordActivationCost 'lp'); the resolution
   stores it on the card (wallValue, zone-local). */
API.registerChoiceHandler('s03u194.light-wall-pay', (answer, x)=>{
  if(!answer || answer.cancelled){ p11cAbort(x.activation); return; }
  const pick = answer.cards && answer.cards[0];
  const v = Number(pick && pick.value) || 0;
  const d = x.activation;
  if(v < 1000 || gameState.players[d.player].lp < v){ p11cAbort(d); return; }
  API.payCost(d.player, v, "光の護封壁");
  API.recordActivationCost(p11cCtx(d.player), 'lp', [], [], v);
  p11cCommit(d, []);
});
defineScript("光の護封壁", {
  type:"trap", priority:2,
  condition(ctx){
    if(API.me(ctx).lp < 1000){ ctx.reason = "1000以上のライフが必要です"; return false; }
    return true;
  },
  activationV11(ctx, d){
    const max = Math.floor(API.me(ctx).lp / 1000);
    const opts = [];
    for(let i=1; i<=max; i++) opts.push({key:'lp'+(i*1000), label:`${i*1000} ライフを払う`, value:i*1000});
    p11cOpen(d, {kind:'declare', title:'光の護封壁：支払うライフ（1000の倍数）', candidates:opts}, 's03u194.light-wall-pay', {});
  },
  resolve(ctx){
    const c = API.activationCosts(ctx, 'lp')[0], v = c ? Number(c.amount)||0 : 0;
    const me = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null;
    if(me && me.zone==='sz') API.setCardFlag(me, 'wallValue', v, '光の護封壁', {silent:true});
    API.log(`光の護封壁：攻撃力${v}以下の相手モンスターは攻撃できない`);
  },
  afterResolve(){},          // 永続罠なので場に残る
  continuous:{
    scope:'oppMonsters', from:['sz'],
    apply(){ return null; },
    cannotAttack(target, self){ return (self.wallValue || 0) > 0 && curATK(target) <= (self.wallValue || 0); }
  }
});

/* ---- 聖なる輝き ----
   モンスターをセットできない。セットする場合は表側守備表示にする。 */
defineScript("聖なる輝き", {
  continuous:{
    scope:'self', from:['sz'],
    apply(){ return null; },
    noFaceDownSet(){ return true; }
  }
});

/* =========================================================================
   汎用の魔法・罠（単発の効果）
   ========================================================================= */

/* ---- 精神操作 ----
   相手モンスター1体のコントロールをエンドフェイズまで得る。
   得たモンスターは攻撃宣言できず、リリースできない。 */
defineScript("精神操作", {
  type:"spell", priority:1, targets:true,
  condition(ctx){
    if(!API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>x.card}).length){
      ctx.reason = "相手フィールドにモンスターがいません"; return false;
    }
    /* S03-U470: 対象耐性で候補が0になる時は発動の前に断る */
    if(!API.targetableCardsS03(API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>x.card}), ctx.player).length){
      ctx.reason = "効果の対象にできる相手モンスターがいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("精神操作：コントロールを得るモンスター",
      API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>x.card}), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が場にないため不発"); return; }
    // エンドフェイズに自動で戻る。攻撃宣言とリリースも封じられる（S03-U117: この制限は精神操作固有として明示する）。
    API.changeControl(t, ctx.player, "精神操作", 'endPhase', null, {noAttack:true, noTribute:true});
  }
});

/* ---- 闇の誘惑 ----
   デッキから2枚ドローし、その後手札の闇属性モンスター1体を除外する。
   手札に闇属性モンスターが無い場合、手札を全て墓地へ送る。
   S03-U62: resolve() 内の legacy API.selectCard（除外する闇属性モンスター）を
   SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.foolish-lure-banish', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(h && h.zone==='hand') API.banish(h, "闇の誘惑");
});
defineScript("闇の誘惑", {
  type:"spell", priority:1,
  condition(ctx){
    if((API.me(ctx).deck||[]).length < 2){ ctx.reason = "デッキが2枚未満です"; return false; }
    return true;
  },
  resolve(ctx){
    API.draw(ctx.player, 2, "闇の誘惑");
    const darks = API.pileCards(ctx.player,'hand',x=>x.db.k==='m' && x.db.at==='闇');
    if(!darks.length){
      const P = gameState.players[ctx.player];
      API.log("手札に闇属性モンスターがないため、手札を全て墓地へ送る");
      /* S03-U129: 「墓地へ送る」であって「捨てる」ではない（暗黒界などの「捨てられた場合」は誘発しない） */
      for(let i=(P.hand||[]).length-1; i>=0; i--)
        API.sendHandToGrave(ctx.player, i, "闇の誘惑（手札全て）");
      return;
    }
    /* S03-U129: 闇属性モンスターがいれば除外は必須（キャンセル不可） */
    API.requestChoice({player:ctx.player, kind:'card', title:"闇の誘惑：除外する闇属性モンスター",
      candidates: darks, min:1, max:1, cancelable:false,
      resume:{handler:'s03u62.foolish-lure-banish', args:{player:ctx.player}},
      meta:{scriptName:"闇の誘惑"}});
  }
});

/* ---- 手札抹殺 ----
   手札があるプレイヤーは全て捨て、それぞれ捨てた枚数分ドローする。 */
defineScript("手札抹殺", {
  type:"spell", priority:1,
  condition(){ return true; },
  resolve(ctx){
    // 自身は既に発動して場にあるので、手札から除いて数える
    const counts = [0,1].map(p=>(gameState.players[p].hand||[]).length);
    [0,1].forEach(p=>{
      const P = gameState.players[p];
      for(let i=(P.hand||[]).length-1; i>=0; i--)
        API.discard(p, i, "手札抹殺");
    });
    [0,1].forEach(p=>{ if(counts[p]) API.draw(p, counts[p], "手札抹殺"); });
  }
});

/* ---- サンダー・ブレイク ----
   手札を1枚捨て、フィールドのカード1枚を対象として破壊する。 */
defineScript("サンダー・ブレイク", {
  type:"trap", priority:2, targets:true,
  condition(ctx){
    if(!API.pileCards(ctx.player,'hand',x=>x.card!==ctx.card).length){
      ctx.reason = "捨てる手札がありません"; return false;
    }
    /* S03-U111: 発動したこのカード自身は対象にできない。 */
    if(!API.fieldCards({filter:x=>x.card && x.card!==ctx.card}).length){
      ctx.reason = "このカード以外に対象にできるカードがありません"; return false;
    }
    return true;
  },
  cost(ctx, done){
    API.selectCard("サンダー・ブレイク：コストで捨てる手札",
      API.pileCards(ctx.player,'hand',x=>x.card!==ctx.card), x=>{
        API.discard(ctx.player, x.index, "サンダー・ブレイク（コスト）");
        done(true);
      });
  },
  selectTargets(ctx, done){
    API.selectCard("サンダー・ブレイク：破壊するカード",
      API.fieldCards({filter:x=>x.card && x.card!==ctx.card}), t=>done([t]), "裏側のカードも選べます");
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(t) API.destroy(t, "サンダー・ブレイク"); else API.log("対象が場にないため不発");
  }
});

/* ---- 砂塵の大竜巻 ----
   相手フィールドの魔法・罠1枚を対象として破壊し、その後
   手札から魔法・罠カード1枚をセットできる。 */
defineScript("砂塵の大竜巻", {
  type:"trap", priority:2, quickEffect:true, targets:true,
  condition(ctx){
    if(!API.fieldCards({zone:'sz', player:ctx.opponent, filter:x=>x.card}).length){
      ctx.reason = "相手フィールドに魔法・罠がありません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("砂塵の大竜巻：破壊する相手の魔法・罠",
      API.fieldCards({zone:'sz', player:ctx.opponent, filter:x=>x.card}),
      t=>done([t]), "裏側のカードも選べます");
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が場にないため不発"); return; }
    API.destroy(t, "砂塵の大竜巻");
    const st = API.pileCards(ctx.player,'hand',x=>x.db.k!=='m' && x.card!==ctx.card);
    if(!st.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"砂塵の大竜巻：セットする魔法・罠（任意）",
      candidates: st, min:1, max:1, cancelable:true,
      note:"セットしない場合は閉じてください",
      resume:{handler:'s03u62.giant-trunade-set', args:{player:ctx.player}},
      meta:{scriptName:"砂塵の大竜巻"}});
  }
});
/* S03-U62: resolve() 内の legacy API.selectCard（セットする魔法・罠）を
   SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.giant-trunade-set', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(h && h.zone==='hand') act({type:"SET_ST", player:args.player, handIndex:h.index});
});

/* ---- 魔法の筒 ----
   相手モンスターの攻撃宣言時、その攻撃を無効にし、攻撃力分のダメージを与える。 */
defineScript("魔法の筒", {
  type:"trap", priority:2, targets:true,
  /* S03-U188: 攻撃宣言時の状態は gameState.pendingAttack（battle ではない）。攻撃無効は Action（NEGATE_ATTACK_V45）で記録し、
     その後「そのモンスターの攻撃力分」のダメージ（解決時の攻撃力）。 */
  condition(ctx){
    const a = gameState.pendingAttack;
    if(!a || a.player !== ctx.opponent){ ctx.reason = "相手モンスターの攻撃宣言時に発動します"; return false; }
    const h = findCardByUid(a.attackerUid);
    if(!h || h.zone !== 'mz'){ ctx.reason = "攻撃モンスターが場にいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const a = gameState.pendingAttack, h = a && findCardByUid(a.attackerUid);
    done(h && h.zone === 'mz' ? [h] : []);
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    const h = t && findCardByUid(t.card.uid);
    if(!h || h.zone !== 'mz'){ API.log("攻撃モンスターが場にないため不発"); return; }
    API.negateAttack("魔法の筒");
    const dmg = curATK(h.card);
    API.damageLP(ctx.opponent, dmg, "魔法の筒");
    API.log(`魔法の筒：攻撃を無効にし ${dmg} ダメージ`);
  },
  passive:{onAttackDeclare(ctx){ const a = gameState.pendingAttack; return ctx.zone === 'sz' && ctx.card.face === 'down' && !!a && a.player === ctx.opponent; }}
});

/* ---- 盗賊の七つ道具 ----
   罠カードが発動した時、1000ライフを払ってその発動を無効にし破壊する。
   S03-U86: 応答先はチェーンの一番上（今まさに発動された罠）でなければならない。旧実装は
   activation-response 応答（ctx.event）を一切読まず、フィールドの罠を自由に選んで無効化・破壊できて
   しまっていた（チェーンが無くても合法になる ENGINE_MISSING）。他の「発動を無効にする」カード群
   （マジック・ジャマー等、engine/1P_activation_response_s03.js）と同じ ctx.event パターンに修正。 */
defineScript("盗賊の七つ道具", {
  type:"trap", priority:3, quickEffect:true,
  condition(ctx){
    const e = ctx.event;
    if(!e || e.kind !== 'trap'){ ctx.reason = "罠カードが発動した時に発動します"; return false; }
    if(API.me(ctx).lp <= 1000){ ctx.reason = "1000より多いライフが必要です"; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 1000, "盗賊の七つ道具"); done(true); },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', "盗賊の七つ道具", true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return ctx.zone === 'sz' && !!ctx.event && ctx.event.kind === 'trap' && API.me(ctx).lp > 1000; } }
});

/* ---- トラップ・スタン ----
   このターン、このカード以外のフィールドの罠カードの効果は無効化される。 */
defineScript("トラップ・スタン", {
  type:"trap", priority:2, quickEffect:true,
  condition(){ return true; },
  resolve(ctx){
    [0,1].forEach(p=>API.setFlag(p, 'trapStun', gameState.turn, true));
    API.log("トラップ・スタン：このターン、他の罠カードの効果は無効");
  }
});
/* トラップ・スタンにより無効化されているか */
function trapStunned(p, card){
  const f = (gameState.players[p].temporaryFlags||{}).trapStun;
  if(f == null || f !== gameState.turn) return false;
  if(dbOf(card).k !== 't') return false;
  return dbOf(card).n !== 'トラップ・スタン';
}

/* ---- 封印の黄金櫃 ----
   デッキからカード1枚を選んで除外し、2回目の自分スタンバイフェイズに手札に加える。 */
defineScript("封印の黄金櫃", {
  type:"spell", priority:1,
  condition(ctx){
    if(!(API.me(ctx).deck||[]).length){ ctx.reason = "デッキが残っていません"; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const pool = API.pileCards(ctx.player,'deck');
    if(!pool.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"封印の黄金櫃：除外するカード",
      candidates:pool, min:1, max:1, cancelable:false,
      note:"2回目のスタンバイフェイズに手札へ",
      resume:{handler:'s03u63.gold-sarcophagus-banish', args:{player:ctx.player}},
      meta:{scriptName:'封印の黄金櫃'}});
  }
});
/* S03-U63: resolve() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u63.gold-sarcophagus-banish', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(!h || h.zone!=='deck') return;
  const c = h.card;
  API.banish(h, "封印の黄金櫃");
  /* S03-U155: 「このカードの発動後2回目の自分スタンバイフェイズに、この効果で除外したカードを手札に加える」 — scheduled (was a
     reminder only: the card never came back). Activated in its controller's turn T → own Standby Phases T+2, T+4. The mark
     u155CoffinTurn is zone-local: a card that left the banished zone in between is not added. */
  const b = locateCardAnyV4(c);
  if(!b || b.zone!=='banish') return;
  ensureCardUid(gameState, c);
  API.setCardFlag(b, 'u155CoffinTurn', gameState.turn, '封印の黄金櫃', {silent:true});
  API.schedule({at:'standbyPhase', turns:(gameState.activePlayer===args.player?4:3), player:args.player, handler:'s03u155.coffin-return',
    args:{uid:c.uid, turn:gameState.turn, player:args.player}, note:'封印の黄金櫃（2回目の自分スタンバイフェイズに手札へ）'});
});
API.registerScheduleHandler('s03u155.coffin-return', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(h && h.zone==='banish' && Number(h.card.u155CoffinTurn)===Number(args.turn)) API.returnToHand(h, '封印の黄金櫃');
});

/* =========================================================================
   【TGガジェット】関連
   ========================================================================= */

/* ---- No.16 色の支配者ショック・ルーラー ----
   X素材を1つ取り除き、カードの種類を宣言。次の相手ターン終了時まで
   宣言した種類のカードをお互いに発動できない。
   寒波亭の裁定：「カードの発動」ができなくなるだけで、
   既に表側で存在する永続魔法・永続罠の「効果の発動」は行える。 */
defineScript("No.16 色の支配者ショック・ルーラー", {
  countLimit:1,
  type:"monster", priority:1, quickEffect:false,
  detachCostS03:{count:1, reason:"ショック・ルーラー（素材1つ）",   /* S03-U114 */
    targets(){ return {kind:'declare', title:"ショック・ルーラー：宣言するカードの種類",
      candidates:[{key:'m',label:'モンスター',value:'m'},{key:'s',label:'魔法',value:'s'},{key:'t',label:'罠',value:'t'}]}; }},
  condition(ctx){
    if(ctx.zone !== 'mz'){ ctx.reason = "フィールドで発動します"; return false; }
    if(!(ctx.card.xyz||[]).length){ ctx.reason = "エクシーズ素材が必要です"; return false; }
    return true;
  },
  /* S03-U114: X素材のコストは detachCostS03（DUEL・runScript とも engine/1ZF_xyz_detach_choice_s03.js が処理） */
  selectTargets(ctx, done){
    const kinds = [
      {label:'モンスター', key:'m'},
      {label:'魔法',       key:'s'},
      {label:'罠',         key:'t'},
    ];
    API.selectCard("ショック・ルーラー：宣言するカードの種類",
      kinds.map(k=>({key:k.key, label:k.label, value:k.key})),   /* S03-U51: カードではない選択肢（DUEL で db が失われていた） */
      pick=>done([pick]),
      "次の相手ターン終了時まで、その種類のカードを発動できません");
  },
  resolve(ctx){
    const k = ctx.selectedTargets[0];
    if(!k) return;
    // 両プレイヤーに宣言を記録する。解除は次の相手ターン終了時。
    const kind = k.value || k.key, jp = {m:'モンスター', s:'魔法', t:'罠'}[kind];
    if(!jp) return;
    /* S03-U51 (C-S03-39): 次の相手ターン終了時まで、お互いに宣言した種類のカードを発動できない（2011 wiki age 8, 11/08/19）。 */
    const untilTurn = gameState.turn + (gameState.activePlayer===ctx.player ? 1 : 2);
    [0,1].forEach(p=>API.setFlag(p, 'shockRuler', {kind, turn:gameState.turn, untilTurn}));
    API.log(`ショック・ルーラー：「${jp}」を宣言（ターン${untilTurn}の終了時まで）`);
  },
  afterResolve(){}
});

/* ショック・ルーラーの宣言により、そのカードの「カードの発動」が封じられているか。
   永続魔法・永続罠が既に表側で存在する場合の「効果の発動」は封じられない。 */
function shockRulerBlocks(p, card, zone){
  const f = (gameState.players[p].effectFlags||{}).shockRuler;
  if(!f) return false;
  const db = dbOf(card);
  if(db.k !== f.kind) return false;
  // 場に表側で存在するカードからの効果の発動は妨げられない
  if((zone === 'mz' || zone === 'sz' || zone === 'field') && card && card.face === 'up') return false;
  return true;
}

/* ---- TG ラッシュ・ライノ ----
   ①攻撃する場合、ダメージステップの間だけ攻撃力が400アップする。
   ②1ターンに1度、フィールドで破壊されこのターン墓地へ送られた場合のエンドフェイズに、
     デッキから自分以外の「TG」モンスター1体を手札に加えられる。
   S03-U106: ②の実装が「墓地にいる」ことしか確認しておらず、「破壊されてこのターン墓地へ
   送られた」「エンドフェイズ限定」「1ターンに1度」の3つの実際の制限がすべて欠けていた
   （実戦で確認：ディスカード等どんな理由で墓地に来てもいつでも何度でも発動できてしまう）。
   TG ワーウルフ／TG ストライカー（cards/10_themes_a.js, S03-U87）の②が全く同じ条項の
   同じ形なので、そこで作られた既存の共通ヘルパー（tgGraveClause/tgGraveResolve/
   tgDestroyedThisTurnS03U87、tgOtherPool は自分自身を名前で自動的に除外する）をそのまま
   再利用する。①の継続効果は変更なし。 */
defineScript("TG ラッシュ・ライノ", {
  type:"monster", priority:1,
  activateFrom:["grave"],
  condition(ctx){ return tgGraveClause(ctx); },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){ tgGraveResolve(ctx,"TG ラッシュ・ライノ"); },
  afterResolve(){},
  continuous:{
    /* 自分が攻撃しているダメージステップの間だけ攻撃力400アップ */
    scope:'self', from:['mz'],
    apply(target, self){
      const b = gameState.battle;
      if(!b || b.target === 'direct') { /* 直接攻撃でも攻撃はしている */ }
      if(!b) return null;
      const P = gameState.players[b.player];
      if((P.mz||[])[b.atkIdx] !== self) return null;
      return { atk:400 };
    }
  },
  passive:{ onEndPhase(ctx){ return ctx.zone==='grave' && tgDestroyedThisTurnS03U87(ctx) && tgOtherPool(ctx).length>0; } }
});

/* ---- TG サイバー・マジシャン ----
   1ターンに1度、フィールドで破壊されこのターン墓地へ送られた場合のエンドフェイズに、
   デッキから自分以外の「TG」モンスター1体を手札に加えられる。
   S03-U106: TG ラッシュ・ライノと全く同じ形の同じバグ（同一ユニットでの依存回復、
   precedent: S03-U86のナチュル・パルキオン）。現在13の固定デッキには含まれていないが、
   直したばかりの共通ヘルパーをそのまま再利用でき、コストがほぼゼロなので合わせて直す。 */
defineScript("TG サイバー・マジシャン", {
  type:"monster", priority:1,
  activateFrom:["grave"],
  condition(ctx){ return tgGraveClause(ctx); },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){ tgGraveResolve(ctx,"TG サイバー・マジシャン"); },
  afterResolve(){},
  passive:{ onEndPhase(ctx){ return ctx.zone==='grave' && tgDestroyedThisTurnS03U87(ctx) && tgOtherPool(ctx).length>0; } }
});
/* デッキの「TG」モンスター（自身の名前は除く） */
function tgInDeck(p, exclude){
  return API.pileCards(p,'deck',
    x=>x.db.k==='m' && !x.db.ex &&
       String(x.db.n||'').indexOf('TG') === 0 && x.db.n !== exclude);
}

/* ---- ナチュル・パルキオン ----
   罠カードが発動した時、自分の墓地のカード2枚を除外して、その発動を無効にし破壊する。
   S03-U86: 盗賊の七つ道具と全く同じ根本原因（ctx.event 未使用）で同じ ENGINE_MISSING を持っていた。
   同じ形で修正。 */
defineScript("ナチュル・パルキオン", {
  type:"monster", priority:3, quickEffect:true,
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){
      ctx.reason = "フィールドに表側表示で存在する場合に発動します"; return false;
    }
    const e = ctx.event;
    if(!e || e.kind !== 'trap'){ ctx.reason = "罠カードが発動した時に発動します"; return false; }
    if((API.me(ctx).grave||[]).length < 2){ ctx.reason = "墓地のカードが2枚必要です"; return false; }
    return true;
  },
  cost(ctx, done){
    const chosen = [];
    const pick = ()=>{
      const left = API.pileCards(ctx.player,'grave',x=>chosen.indexOf(x.card)<0);
      if(chosen.length >= 2){
        chosen.forEach(c=>API.banish({card:c}, "ナチュル・パルキオン（コスト）"));
        done(true); return;
      }
      API.selectCard(`ナチュル・パルキオン：除外する墓地のカード（${chosen.length+1}/2）`,
        left, x=>{ chosen.push(x.card); pick(); });
    };
    pick();
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', "ナチュル・パルキオン", true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return ctx.zone === 'mz' && ctx.card && ctx.card.face === 'up'
      && !!ctx.event && ctx.event.kind === 'trap' && (API.me(ctx).grave||[]).length >= 2; } }
});
