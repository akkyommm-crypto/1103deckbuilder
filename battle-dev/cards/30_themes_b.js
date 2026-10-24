/* =========================================================================
   【ジャンド】関連
   ========================================================================= */

/* ---- デブリ・ドラゴン ----
   召喚に成功した時、自分の墓地の攻撃力500以下のモンスター1体を対象として
   攻撃表示で特殊召喚する。その効果は無効化される。 */
/* S03-U113: (1) 「このカードをシンクロ素材とする場合、ドラゴン族モンスターのシンクロ召喚にしか使用できず、
   他のシンクロ素材モンスターは全てレベル4以外のモンスターでなければならない」が未実装だった
   → synchroMaterialRestriction。(2) 解決時に対象を添字（選択時の位置）で特殊召喚し、その後「モンスターゾーンの
   最後尾」を無効化していた → 対象はカードそのもので墓地にあるか確認し、特殊召喚できたそのカードだけを無効化する。 */
defineScript("デブリ・ドラゴン", {
  type:"monster", priority:1, targets:true,
  synchroMaterialRestriction(info){
    const ex = info && info.exDb;
    if(!ex || ex.ra!=='ドラゴン') return false;
    return (info.set||[]).filter(x=>(x.card||x.c)!==info.source).every(x=>{ const c=x.card||x.c; return c && curLV(c)!==4; });
  },
  condition(ctx){
    if(!debrisTargets(ctx.player).length){
      ctx.reason = "墓地に攻撃力500以下のモンスターがいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("デブリ・ドラゴン：蘇生するモンスター",
      debrisTargets(ctx.player), t=>done([t]), "攻撃力500以下");
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    const h = t && t.card && locateCardAnyV4(t.card);
    if(!h || h.p!==ctx.player || h.zone!=='grave'){ API.log("対象が墓地にないため不発"); return; }
    const target = h.card;
    const ok = API.specialSummon(ctx.player,'grave',h.index,'atk',"デブリ・ドラゴン");
    // この効果で特殊召喚したモンスターの効果は無効化される（特殊召喚できたそのカードだけ）
    const now = locateCardAnyV4(target);
    if(ok!==false && now && now.zone==='mz') API.setCardFlag({card:target},'negated',true,'デブリ・ドラゴン',{silent:true});
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz'; } }
});
function debrisTargets(p){
  return API.pileCards(p,'grave',x=>x.db.k==='m' && (x.db.atk||0) <= 500);
}

/* ---- スポーア ----
   墓地からこのカード以外の植物族1体を除外して、このカードを特殊召喚する。
   レベルは除外したモンスターのレベル分だけ上がる。デュエル中に1度。 */
defineScript("スポーア", {
  /* S03-U103: 実際のテキストは「『スポーア』のこの効果は1デュエルに1度しか使用できない」と
     カード名で明示されているので、1103ルール（engine/40_legal_script_engine.js, RULING_1103_PER_CARD_LIMIT）
     の既定である個体ごとの回数制限ではなく、名称単位（レスキューラビットと同じ扱い）で数える
     nameLimit:true が必要。個体ごとのままでは、スポーア3枚あれば3回使えてしまっていた。 */
  countLimit:{n:1, scope:'duel'}, nameLimit:true,
  type:"monster", priority:1,
  activateFrom:["grave"],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = "墓地に存在する場合に発動します"; return false; }
    if(!sporeFodder(ctx.player, ctx.card).length){
      ctx.reason = "墓地に他の植物族モンスターがいません"; return false;
    }
    return true;
  },
  /* S03-U103: cost() で ctx に書いた任意プロパティは、実際のDUELパイプラインでは
     resolve() まで残らない（resolve() は独立に再構築された ctx を受け取る —
     カラクリ解体新書と同じ既知のバグ形、S03-U102）。除外したモンスターのレベルは
     場を離れると同時に失われる情報なので、場を離れないこのカード自身への
     API.setCardFlag で運ぶ。 */
  cost(ctx, done){
    API.selectCard("スポーア：除外する植物族", sporeFodder(ctx.player, ctx.card), r=>{
      API.setCardFlag({card:ctx.card}, 'sporeBanishedLv', r.db.lv || 0, "スポーア", {silent:true});
      API.banish(r, "スポーア（コスト）");
      done(true);
    });
  },
  resolve(ctx){
    const me = API.pileCards(ctx.player,'grave',x=>x.card===ctx.card)[0];
    if(!me){ API.log("スポーアが墓地にないため不発"); return; }
    const lv = Number(ctx.card && ctx.card.sporeBanishedLv || 0);
    API.specialSummon(ctx.player,'grave',me.index,'atk',"スポーア");
    const P = gameState.players[ctx.player];
    const summoned = P.mz[P.mz.length-1];
    if(summoned && lv){
      API.setCardFlag({card:summoned},'lvMod',(summoned.lvMod||0) + lv,'スポーア',{silent:true});
      API.log(`スポーアのレベルが ${lv} 上がった`);
    }
  },
  afterResolve(){}
});
function sporeFodder(p, self){
  return API.pileCards(p,'grave',x=>x.db.k==='m' && x.db.ra==='植物' && x.card!==self);
}

/* ---- TG ハイパー・ライブラリアン ----
   自分または相手が、このカード以外のSモンスターのS召喚に成功した場合、1枚ドローする。 */
defineScript("TG ハイパー・ライブラリアン", {
  onOtherSummon:true,           // 自分・相手のS召喚に反応する
  type:"monster", priority:1, forced:true,
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){
      ctx.reason = "フィールドに表側表示で存在する場合に発動します"; return false;
    }
    if(!(API.me(ctx).deck||[]).length){ ctx.reason = "デッキが残っていません"; return false; }
    return true;
  },
  /* S03-U121: 「このカードがフィールドに表側表示で存在する場合」ドローする（解決時に場を離れていればドローしない） */
  resolve(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='mz' || h.card.face!=='up'){ API.log("TG ハイパー・ライブラリアン：フィールドに表側表示で存在しないためドローしない"); return; }
    API.draw(ctx.player, 1, "TG ハイパー・ライブラリアン");
  },
  afterResolve(){},
  passive:{
    onSpecialSummon(ctx){
      // 自身以外のシンクロ召喚に反応する
      const ev = ctx.event || {};
      const self = ev.card===ctx.card || (ev.uid!=null && ctx.card && ev.uid===ctx.card.uid);
      return ctx.zone==='mz' && ev.kind==='synchro' && !self;
    }
  }
});

/* ---- フォーミュラ・シンクロン ----
   ①:このカードがS召喚に成功した時に発動できる。自分はデッキから1枚ドローする。
   ②:相手メインフェイズに発動できる。このカードを含む自分フィールドのモンスターをS素材としてS召喚する。
   S03-U121: ①はどの特殊召喚（蘇生など）にも反応していた。②は未実装（engine/1ZJ_effect_synchro_s03.js）。 */
defineScript("フォーミュラ・シンクロン", {
  type:"monster", priority:1, quickEffect:true,
  /* ① / ③ are triggers; ② is a quick effect whose timing (the opponent's Main Phase) is checked in condition. Without an
     explicit timing, scriptTimings() would infer only 'summon' from the passive and refuse ②. */
  timing:['free'],
  condition(ctx){
    if(ctx.eventName==='onSpecialSummon'){
      if(!s03SelfSynchroSummonedU121(ctx)){ ctx.reason = "このカードがS召喚に成功した時に発動できます"; return false; }
      if(!(API.me(ctx).deck||[]).length){ ctx.reason = "デッキが残っていません"; return false; }
      return true;
    }
    return s03QuickSynchroOkU121(ctx);
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    if(ctx.eventName==='onSpecialSummon'){ API.draw(ctx.player, 1, "フォーミュラ・シンクロン"); return; }
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='mz' || h.card.face!=='up'){ API.log("フォーミュラ・シンクロン：このカードがフィールドに無いためS召喚できない"); return; }
    effectSynchroSummonS03(ctx.player, ensureCardUid(gameState, ctx.card), "フォーミュラ・シンクロン");
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){ return s03SelfSynchroSummonedU121(ctx); } }
});

/* ---- 氷結界の龍 トリシューラ ----
   S召喚に成功した時、相手の手札・フィールド・墓地のカードをそれぞれ1枚まで除外する。
   対象を取らない（効果処理時に選ぶ）。 */
/* S03-U62: resolve() 内の3段階 legacy API.selectCard（手札→フィールド→墓地、各1枚まで）を
   SaveLoad安全な登録済みハンドラへ移行。各段階を進める共通ステップ関数を1つの登録ハンドラで表す。 */
const TRISHULA_ZONES_S03U62 = [['hand','手札'], ['mz','フィールド'], ['grave','墓地']];
function trishulaStepS03U62(player, opponent, stepIndex){
  if(stepIndex >= TRISHULA_ZONES_S03U62.length) return;
  const [z, jp] = TRISHULA_ZONES_S03U62[stepIndex];
  const cands = (z === 'mz')
    ? API.fieldCards({zone:'mz', player:opponent, filter:x=>x.card})
    : API.pileCards(opponent, z, x=>x.card);
  if(!cands.length){ trishulaStepS03U62(player, opponent, stepIndex+1); return; }
  API.requestChoice({player, kind:'card', title:`トリシューラ：除外する相手の${jp}（1枚まで）`,
    candidates: cands, min:1, max:1, cancelable:true,
    note:"選ばない場合は閉じてください",
    resume:{handler:'s03u62.trishula-banish-step', args:{player, opponent, stepIndex}},
    meta:{scriptName:"氷結界の龍 トリシューラ"}});
}
API.registerChoiceHandler('s03u62.trishula-banish-step', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  /* legacy selectCard の元動作を保つ：キャンセルした場合は onPick が一度も呼ばれず、
     以降の段階（残りのゾーン）へも進まない。ここでも同じくキャンセル時は先へ進めない。 */
  if(!h) return;
  API.banish(h, "氷結界の龍 トリシューラ");
  trishulaStepS03U62(args.player, args.opponent, args.stepIndex+1);
});
defineScript("氷結界の龍 トリシューラ", {
  type:"monster", priority:1, targets:false,
  condition(){ return true; },
  resolve(ctx){
    trishulaStepS03U62(ctx.player, ctx.opponent, 0);
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){ return ctx.zone==='mz'; } }
});

/* ---- 調律 ----
   デッキから「シンクロン」チューナー1体を手札に加え、その後デッキトップを墓地へ送る。 */
defineScript("調律", {
  type:"spell", priority:1,
  blocksIfNoDeckToHand:true,    // S03-U05: ライオウ適用中は発動できない
  condition(ctx){
    if(!synchronInDeck(ctx.player).length){
      ctx.reason = "デッキに「シンクロン」チューナーがいません"; return false;
    }
    // 1103裁定DB: デッキが1枚以下なら発動できない
    if(API.me(ctx).deck.length < 2){ ctx.reason = "デッキが1枚以下です"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("調律：手札に加える「シンクロン」チューナー",
      synchronInDeck(ctx.player), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    /* S03-U05: 手札に加える事に成功した場合だけ、その後デッキトップを墓地へ送る（KONAMI Q&A）。 */
    if(t && API.searchDeck(ctx.player, t.index, "調律")) API.millTop(ctx.player, 1, "調律（デッキトップを墓地へ）");
  }
});
function synchronInDeck(p){
  return API.pileCards(p,'deck',
    x=>x.db.k==='m' && !x.db.ex && String(x.db.n||'').indexOf('シンクロン')>=0 &&
       (x.db.st||[]).indexOf('チューナー')>=0);
}

/* ---- レベル・スティーラー ----
   墓地から、自分フィールドのレベル5以上のモンスター1体を対象として発動。
   そのモンスターのレベルを1つ下げ、このカードを墓地から特殊召喚する。 */
defineScript("レベル・スティーラー", {
  type:"monster", priority:1, targets:true,
  activateFrom:["grave"],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = "墓地に存在する場合に発動します"; return false; }
    if(!levelStealerTargets(ctx.player).length){
      ctx.reason = "自分フィールドにレベル5以上のモンスターがいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("レベル・スティーラー：レベルを下げるモンスター",
      levelStealerTargets(ctx.player), t=>done([t]), "レベル5以上");
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が場にないため不発"); return; }
    API.setCardFlag({card:t.card},'lvMod',(t.card.lvMod||0) - 1,'レベル・スティーラー',{silent:true});
    const me = API.pileCards(ctx.player,'grave',x=>x.card===ctx.card)[0];
    if(me) API.specialSummon(ctx.player,'grave',me.index,'atk',"レベル・スティーラー");
  },
  afterResolve(){}
});
function levelStealerTargets(p){
  return API.fieldCards({zone:'mz', player:p,
    filter:x=>x.card && x.card.face==='up' && curLV(x.card) >= 5});
}

/* ---- ライトロード・ハンター ライコウ ----
   リバースした場合、これらの効果を同時に適用する：
   ●フィールドのカード1枚を選んで破壊できる（任意）。●自分のデッキの上から3枚を墓地へ送る（必須）。
   S03-U94: real text (Yugipedia, "Ryko, Lightsworn Hunter") confirms the two bullet effects are
   independent and simultaneous -- destroying is optional, but the deck-mill is NOT conditional on it.
   The old implementation (via the legacy "cancel = nothing happens at all" pattern this handler was
   migrated from in S03-U62) skipped the mandatory mill whenever the optional destroy was declined, a real
   bug. Fixed: the mill now always happens regardless of the destroy choice. */
API.registerChoiceHandler('s03u62.ryko-destroy', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(h) API.destroy(h, "ライトロード・ハンター ライコウ");
});
defineScript("ライトロード・ハンター ライコウ", {
  type:"monster", priority:1, targets:false, forced:true,
  condition(){ return true; },
  resolve(ctx){
    /* 必須のミルは破壊の選択(任意)と独立して常に実行する。 */
    API.millTop(ctx.player, 3, "ライコウ");
    const cands = API.fieldCards({filter:x=>x.card});
    if(!cands.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"ライコウ：破壊するカード（破壊しなくてもよい）",
      candidates: cands, min:1, max:1, cancelable:true,
      note:"破壊しない場合は閉じてください",
      resume:{handler:'s03u62.ryko-destroy', args:{player:ctx.player}},
      meta:{scriptName:"ライトロード・ハンター ライコウ"}});
  },
  afterResolve(){},
  passive:{ onFlip(ctx){ return ctx.zone==='mz'; } }
});

/* =========================================================================
   【HERO】関連
   ========================================================================= */

/* ---- E－エマージェンシーコール ---- */
defineScript("E－エマージェンシーコール", {
  type:"spell", priority:1,
  blocksIfNoDeckToHand:true,    // S03-U05: ライオウ適用中は発動できない
  condition(ctx){
    if(!heroInDeck(ctx.player).length){ ctx.reason = "デッキに「E・HERO」モンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("E－エマージェンシーコール：手札に加える「E・HERO」",
      heroInDeck(ctx.player), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(t) API.searchDeck(ctx.player, t.index, "E－エマージェンシーコール");
  }
});
function heroInDeck(p){
  return API.pileCards(p,'deck',
    x=>x.db.k==='m' && !x.db.ex && String(x.db.n||'').indexOf('E・HERO')>=0);
}

/* ---- ヒーロー・ブラスト ----
   墓地の「E・HERO」通常モンスター1体を対象として発動。手札に加え、
   その後、その攻撃力以下の攻撃力を持つ相手モンスター1体を選んで破壊する。
   前半は対象を取り、後半の破壊は「選んで」なので対象を取らない。 */
/* S03-U62: resolve() 内の legacy API.selectCard（破壊する相手モンスター）を
   SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.hero-blast-destroy', (answer) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(h) API.destroy(h, "ヒーロー・ブラスト");
});
defineScript("ヒーロー・ブラスト", {
  type:"trap", priority:2, targets:true,
  condition(ctx){
    if(!heroNormalInGrave(ctx.player).length){
      ctx.reason = "墓地に「E・HERO」通常モンスターがいません"; return false;
    }
    /* S03-U470: 墓地のモンスターが全て対象耐性（メタルシルバー・アーマー）で候補から外れる時は、発動の前に断る */
    if(!API.targetableCardsS03(heroNormalInGrave(ctx.player), ctx.player).length){
      ctx.reason = "墓地に効果の対象にできる「E・HERO」通常モンスターがいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("ヒーロー・ブラスト：手札に加える「E・HERO」通常モンスター",
      heroNormalInGrave(ctx.player), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が墓地にないため不発"); return; }
    const atk = t.db.atk || 0;
    API.returnToHand(t, "ヒーロー・ブラスト");
    // 手札に加えたモンスターの攻撃力以下の相手モンスターを選んで破壊
    const foes = API.fieldCards({zone:'mz', player:ctx.opponent,
      filter:x=>x.card && x.card.face==='up' && curATK(x.card) <= atk});
    if(!foes.length){ API.log(`攻撃力${atk}以下の相手モンスターがいません`); return; }
    /* S03-U99: 実際のテキストは「～その後、相手フィールドに対象の攻撃力以下の
       モンスターが存在する場合、その内の1体を破壊する」で、「できる」ではなく
       強制。破壊するモンスター自体は選べるが、破壊そのものは拒否できない。 */
    API.requestChoice({player:ctx.player, kind:'card', title:`ヒーロー・ブラスト：破壊する相手モンスター（攻${atk}以下）`,
      candidates: foes, min:1, max:1, cancelable:false,
      resume:{handler:'s03u62.hero-blast-destroy', args:{}},
      meta:{scriptName:"ヒーロー・ブラスト"}});
  }
});
function heroNormalInGrave(p){
  return API.pileCards(p,'grave',
    x=>x.db.k==='m' && String(x.db.n||'').indexOf('E・HERO')>=0 &&
       treatedAsNormal(x.card));
}

/* いま通常モンスターとして扱われるか。
   デュアルモンスターはフィールド・墓地では通常モンスター扱いで、
   「再度召喚」した状態（card.dualUp）のときだけ効果モンスターになる。
   《E・HERO アナザー・ネオス》を《ヒーロー・ブラスト》で回収できるのはこのため。 */
function treatedAsNormal(card){
  if(!card) return false;
  const st = dbOf(card).st || [];
  if(st.indexOf('通常') >= 0) return true;
  if(st.indexOf('デュアル') >= 0) return !card.dualUp;
  return false;
}

/* S03-U111: 対象候補 = フィールドのカードから、発動したこのカード自身と（指定があれば）リリースするモンスターを除く。 */
function duelSparkTargetsS03U111(ctx, releasedCard){
  return API.fieldCards({filter:x=>x.card && x.card!==ctx.card && x.card!==releasedCard});
}
/* ---- デュアルスパーク ----
   自分フィールドの表側のレベル4デュアルモンスター1体をリリースし、
   フィールドのカード1枚を対象として発動。破壊して1枚ドローする。 */
defineScript("デュアルスパーク", {
  type:"spell", priority:2, quickEffect:true, targets:true,
  condition(ctx){
    if(!duelSparkFodder(ctx.player).length){
      ctx.reason = "リリースする表側のレベル4デュアルモンスターがいません"; return false;
    }
    /* S03-U111: 発動したこのカード自身とリリースするモンスターは対象にできない。対象が1枚も残らないなら発動できない。 */
    if(!duelSparkFodder(ctx.player).some(f=>duelSparkTargetsS03U111(ctx, f.card).length)){
      ctx.reason = "リリースするモンスター以外に対象にできるカードがありません"; return false;
    }
    /* S03-U470: 残る候補が全て対象耐性で外れる場合も発動できない（通すとリリースのコストだけ払って不発になる） */
    if(!duelSparkFodder(ctx.player).some(f=>API.targetableCardsS03(duelSparkTargetsS03U111(ctx, f.card), ctx.player).length)){
      ctx.reason = "リリースするモンスター以外に効果の対象にできるカードがありません"; return false;
    }
    return true;
  },
  cost(ctx, done){
    API.selectCard("デュアルスパーク：リリースするデュアルモンスター",
      duelSparkFodder(ctx.player).filter(f=>API.targetableCardsS03(duelSparkTargetsS03U111(ctx, f.card), ctx.player).length), r=>{
        API.sendToGrave(r, "デュアルスパーク（リリース）");
        done(true);
      });
  },
  selectTargets(ctx, done){
    const cands = duelSparkTargetsS03U111(ctx, null);
    if(!cands.length){ done([]); return; }
    API.selectCard("デュアルスパーク：破壊するカード", cands, t=>done([t]));
  },
  resolve(ctx){
    /* S03-U98: 実際の裁定「対象のカードを破壊できなかった場合、ドローできない」に合わせ、
       破壊とドローを同時判定する。対象を実際に破壊できたか（例：コストで既に離れていた／
       解決前に対象が場を離れていた等）を破壊後の実在位置で確認してからドローする。 */
    const t = ctx.selectedTargets[0];
    const before = t && resolveTarget(t);
    const targetCard = before && before.card;
    if(before) API.destroy(t, "デュアルスパーク");
    const destroyedOk = !!(targetCard && (h=>h&&h.zone==='grave')(locateCardAnyV4(targetCard)));
    if(destroyedOk) API.draw(ctx.player, 1, "デュアルスパーク");
  }
});
function duelSparkFodder(p){
  return API.fieldCards({zone:'mz', player:p,
    filter:x=>x.card && x.card.face==='up' &&
              (x.db.st||[]).indexOf('デュアル')>=0 && (x.db.lv||0)===4});
}

/* ---- R－ライトジャスティス ----
   自分フィールドの「E・HERO」カードの数だけ、フィールドの魔法・罠を選んで破壊する。
   さばえ氏の裁定まとめより：
     ・対象は取らない
     ・効果処理時のヒーロー枚数を参照し、必ずその枚数分「選んで」破壊する
     ・処理時にヒーローが不在、または場の魔法罠がその枚数を下回った場合は不発 */
/* S03-U62: resolve() 内の再帰的 legacy API.selectCard（n枚選び終えてからまとめて破壊 — legacy の
   「途中でキャンセルしたら1枚も破壊しない」を保つ）を SaveLoad安全な登録済みハンドラへ移行。 */
function rLightJusticeStep(player, n, chosenUids, selfUid){
  const chosen = chosenUids.map(u=>findCardByUid(u)).filter(h=>h&&h.card);
  const left = API.fieldCards({filter:x=>(x.zone==='sz'||x.zone==='field') && x.card && chosenUids.indexOf(x.card.uid)<0 && (selfUid==null || x.card.uid!==selfUid)});
  if(chosen.length >= n || !left.length){
    chosen.forEach(h=>API.destroy(h, "R－ライトジャスティス"));
    return;
  }
  API.requestChoice({player, kind:'card', title:`R－ライトジャスティス：破壊する魔法・罠（${chosen.length+1}/${n}）`,
    candidates: left, min:1, max:1, cancelable:false,
    note:"自分のカードも選べます",
    resume:{handler:'s03u62.r-light-justice-step', args:{player, n, chosenUids, selfUid:(selfUid==null?null:selfUid)}},
    meta:{scriptName:"R－ライトジャスティス"}});
}
API.registerChoiceHandler('s03u62.r-light-justice-step', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  /* legacy の元動作を保つ：この段階をキャンセルしたら、それまでの分も含めて何も破壊しない。 */
  if(!h) return;
  ensureCardUid(gameState, h.card);
  rLightJusticeStep(args.player, args.n, args.chosenUids.concat([h.card.uid]), args.selfUid);
});
defineScript("R－ライトジャスティス", {
  type:"spell", priority:1, targets:false,
  condition(ctx){
    if(!heroOnField(ctx.player).length){ ctx.reason = "自分フィールドに「E・HERO」カードがありません"; return false; }
    return true;
  },
  resolve(ctx){
    const n = heroOnField(ctx.player).length;      // 処理時の枚数を参照する
    if(!n){ API.log("「E・HERO」が不在のため不発"); return; }
    /* S03-U194: fewer Spell / Trap cards than 「E・HERO」 cards → all of them (before: nothing); the Field Zone counts; not this card */
    rLightJusticeStep(ctx.player, n, [], ctx.card && ctx.card.uid!=null ? ctx.card.uid : null);
  }
});
function heroOnField(p){
  return API.fieldCards({player:p,
    filter:x=>x.card && x.card.face==='up' && String(x.db.n||'').indexOf('E・HERO')>=0});
}

/* ---- ミラクル・フュージョン ----
   自分のフィールド・墓地から融合素材を除外して「E・HERO」融合モンスターを融合召喚する。 */
defineScript("ミラクル・フュージョン", {
  type:"spell", priority:1,
  condition(ctx){
    if(!miracleOptions(ctx.player).length){
      ctx.reason = "素材が揃った「E・HERO」融合モンスターがいません"; return false;
    }
    return true;
  },
  /* S03-U126: 対象を取らない。融合モンスターと素材（フィールド・墓地から除外するモンスター）は解決時に選ぶ（以前は発動時に
     選び、素材は最初の組み合わせ combos[0] に固定されていた）。融合召喚として扱う（summonKind 'fusion'）。 */
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    const opts = miracleOptions(ctx.player);
    if(!opts.length){ API.log("ミラクル・フュージョン：融合召喚できるモンスターがいない"); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:"ミラクル・フュージョン：融合召喚する「E・HERO」融合モンスター", candidates:opts.map(o=>o.ex),
      min:1, max:1, cancelable:false, resume:{handler:'s03u126.miracle-ex', args:{player:ctx.player}}, meta:{scriptName:"ミラクル・フュージョン"}});
  }
});
function miracleComboUidsS03(combo){ return combo.map(m=>ensureCardUid(gameState, m.card)); }
function miracleComboLabelS03(combo){ return combo.map(m=>`${cardName(m.card)}（${m.zone==='grave'?'墓地':'フィールド'}）`).join(' ＋ '); }
API.registerChoiceHandler('s03u126.miracle-ex', (answer, args)=>{
  const picked = (answer && answer.cards || []).filter(x=>x && !x.stale && x.card)[0];
  if(!picked) return;
  const exUid = ensureCardUid(gameState, picked.card);
  const opt = miracleOptions(args.player).find(o=>ensureCardUid(gameState, o.ex.card)===exUid);
  if(!opt){ API.log("ミラクル・フュージョン：融合召喚できなくなった"); return; }
  const next = {player:args.player, exUid};
  if(opt.combos.length===1){ miracleCommitS03(next, miracleComboUidsS03(opt.combos[0])); return; }
  API.requestChoice({player:args.player, kind:'declare', title:`ミラクル・フュージョン：${cardName(picked.card)} の融合素材（除外する）`,
    candidates:opt.combos.map((cb,k)=>({key:'m'+k, label:miracleComboLabelS03(cb), value:miracleComboUidsS03(cb).join(',')})),
    min:1, max:1, cancelable:false, resume:{handler:'s03u126.miracle-mats', args:next}, meta:{scriptName:"ミラクル・フュージョン"}});
});
API.registerChoiceHandler('s03u126.miracle-mats', (answer, args)=>{
  const c = answer && answer.cards && answer.cards[0];
  const uids = String((c && c.value) || '').split(',').map(Number).filter(Number.isFinite);
  if(uids.length) miracleCommitS03(args, uids);
});
function miracleCommitS03(args, uids){
  const p = args.player;
  const ex = findCardByUid(args.exUid);
  if(!ex || ex.p!==p || ex.zone!=='ex'){ API.log("ミラクル・フュージョン：融合モンスターがエクストラデッキにない"); return; }
  /* S03-U133: 融合召喚する表示形式（表側攻撃／表側守備）をプレイヤーが選ぶ（以前は常に攻撃表示） */
  if(args.pos!=='atk' && args.pos!=='def'){
    API.requestChoice({player:p, kind:'declare', title:`ミラクル・フュージョン：${cardName(ex.card)} の表示形式`, candidates:[{key:'atk', label:'表側攻撃表示', value:'atk'},{key:'def', label:'表側守備表示', value:'def'}],
      min:1, max:1, cancelable:false, resume:{handler:'s03u133.miracle-pos', args:Object.assign({}, args, {mats:uids})}, meta:{scriptName:"ミラクル・フュージョン"}});
    return;
  }
  const opt = miracleOptions(p).find(o=>ensureCardUid(gameState, o.ex.card)===args.exUid);
  const valid = opt && opt.combos.some(cb=>{ const u = miracleComboUidsS03(cb); return u.length===uids.length && uids.every(x=>u.indexOf(x)>=0); });
  if(!valid){ API.log("ミラクル・フュージョン：選んだ融合素材がそろっていない"); return; }
  uids.map(u=>findCardByUid(u)).filter(Boolean).forEach(h=>API.banish(h, "ミラクル・フュージョン（素材）"));
  const now = findCardByUid(args.exUid);
  if(now && now.zone==='ex') API.specialSummon(p, 'ex', now.index, args.pos, "ミラクル・フュージョン", null, {summonKind:'fusion'});
}
API.registerChoiceHandler('s03u133.miracle-pos', (answer, args)=>{
  const c = answer && answer.cards && answer.cards[0];
  miracleCommitS03(Object.assign({}, args, {pos:(c && c.value)==='def' ? 'def' : 'atk'}), args.mats || []);
});
/* フィールドと墓地の自分のモンスターから、素材条件を満たすE・HERO融合体を探す */
function miracleOptions(p){
  const P = gameState.players[p];
  const pool = [];
  (P.mz||[]).forEach((c,i)=>{ if(c && c.face==='up')
    pool.push({i:pool.length, p, zone:'mz', index:i, card:c, db:dbOf(c), lv:dbOf(c).lv||0}); });
  (P.grave||[]).forEach((c,i)=>{ if(c && dbOf(c).k==='m')
    pool.push({i:pool.length, p, zone:'grave', index:i, card:c, db:dbOf(c), lv:dbOf(c).lv||0}); });
  const out = [];
  (P.ex||[]).forEach((c,ei)=>{
    const db = dbOf(c);
    if((db.st||[]).indexOf('融合') < 0) return;
    if(String(db.n||'').indexOf('E・HERO') < 0) return;
    const spec = parseMaterialSpec(db);
    if(!spec || !spec.slots) return;
    const combos = fusionCombosS03(pool, spec, db, 60);   /* S03-U126: was 5; S03-U134: with Fusion Material substitutes */
    if(combos.length) out.push({ex:{p, zone:'ex', index:ei, card:c, db}, combos});
  });
  return out;
}

/* ---- E・HERO バブルマン ----
   ① 手札がこのカード1枚のみの場合、手札から特殊召喚できる。
   ② 召喚・反転召喚・特殊召喚に成功した時、手札・フィールドに他のカードが
      無い場合に発動でき、デッキから2枚ドローする。 */
/* S03-U193 (text): 1「手札がこのカード1枚のみの場合、このカードは手札から特殊召喚できる。」 — a summon procedure (no chain; before: an
   effect on the chain). 2「召喚・反転召喚・特殊召喚に成功した時に発動できる。自分はデッキから2枚ドローする。この効果は自分の手札・フィールドに
   他のカードが無い場合に発動と処理ができる。」 — the Flip Summon was missing, the Field Zone was not counted, and resolution did not recheck. */
function bubblemanAloneS03(ctx){
  const P = API.me(ctx), me = ctx.card;
  const others = (P.hand||[]).length + (P.mz||[]).filter(c=>c && c!==me).length + (P.sz||[]).filter(Boolean).length + (P.field?1:0);
  return others === 0;
}
defineScript("E・HERO バブルマン", {
  type:"monster", priority:1,
  summonProcedure:{from:'hand', positions:['atk','def'],
    condition(ctx){
      if((API.me(ctx).hand||[]).length !== 1){ ctx.reason = "手札がこのカード1枚のみの場合に特殊召喚できます"; return false; }
      return API.me(ctx).mz.length < ZONE_LIMITS.mz;
    }},
  condition(ctx){
    if(ctx.zone !== 'mz'){ ctx.reason = "召喚・反転召喚・特殊召喚に成功した時に発動します"; return false; }
    if(!bubblemanAloneS03(ctx)){ ctx.reason = "手札・フィールドに他のカードがある場合は発動できません"; return false; }
    if((API.me(ctx).deck||[]).length < 2){ ctx.reason = "デッキが2枚未満です"; return false; }
    return true;
  },
  resolve(ctx){
    if(!bubblemanAloneS03(ctx)){ API.log("E・HERO バブルマン：手札・フィールドに他のカードがあるため処理できない"); return; }
    API.draw(ctx.player, 2, "E・HERO バブルマン");
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); },
    onSpecialSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); },
    onFlip(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx) && !!(ctx.event||{}).flipSummon; }
  }
});

/* =========================================================================
   【代行天使】関連
   ========================================================================= */

/* ---- 天空の聖域 ----
   天使族モンスターの戦闘で発生する、そのコントローラーへの戦闘ダメージが0になる。
   攻守には影響しないので battleDamage フックだけを持つ。 */
defineScript("天空の聖域", {
  continuous:{
    scope:'self', from:['field'],
    apply(){ return null; },
    battleDamage(info){
      // 戦闘に参加している天使族のコントローラーが、そのダメージの受け手なら0
      const pair = [
        {card:info.atkCard, owner:info.atkOwner},
        {card:info.defCard, owner:info.defOwner},
      ];
      const hit = pair.some(x => x.card && x.owner === info.to && dbOf(x.card).ra === '天使');
      return hit ? 0 : info.amount;
    }
  }
});

/* ---- 天空の使者 ゼラディアス ----
   ① 手札から墓地へ捨てて「天空の聖域」1枚をデッキから手札に加える。
   ② フィールドに「天空の聖域」がない場合、このカードは破壊される。 */
/* S03-U196: ① is an ignition effect from the hand (own Main Phase; before: no timing, any time); ② 「フィールドに「天空の聖域」が存在しない
   場合にこのカードは破壊される」 was missing — destroyWithoutFieldS03 (engine/1ZZF). */
defineScript("天空の使者 ゼラディアス", {
  type:"monster", priority:1, timing:["mainPhase"],
  activateFrom:["hand"],
  destroyWithoutFieldS03:"天空の聖域",
  condition(ctx){
    if(ctx.zone !== 'hand'){ ctx.reason = "手札から捨てて発動します"; return false; }
    if(!API.pileCards(ctx.player,'deck',x=>labelOf(x.card)==='天空の聖域').length){
      ctx.reason = "デッキに「天空の聖域」がありません"; return false;
    }
    return true;
  },
  cost(ctx, done){
    API.discard(ctx.player, ctx.index, "天空の使者 ゼラディアス（コスト）");
    done(true);
  },
  resolve(ctx){
    const t = API.pileCards(ctx.player,'deck',x=>labelOf(x.card)==='天空の聖域');
    if(t.length) API.searchDeck(ctx.player, t[0].index, "天空の使者 ゼラディアス");
  },
  afterResolve(){}          // 既に墓地にあるので何もしない
});

/* ---- 朱光の宣告者 ----
   相手がモンスターの効果を発動した時、手札からこのカードと天使族1体を
   墓地へ送って、その発動を無効にし破壊する。
   S03-U91: same real ENGINE_MISSING bug class as S03-U86 (盗賊の七つ道具／ナチュル・パルキオン): the old
   implementation never read ctx.event (the S03-U18/C-S03-15 activation-response mechanism every other
   "negate a card's activation" card uses), so it could be activated at any time the player had priority and
   freely target ANY face-up monster on the field, not specifically the one whose monster effect the
   opponent just activated. Fixed to the established ctx.event + API.negateChainLink pattern (matching
   ジャスティス・ブリンガー's e.kind==='monster' condition check, cards/B8_auto_cycle16.js), and declared in
   ACTIVATION_RESPONSE_S03 (cards/H5_claude_s03_activation_response.js). */
function s03U91FoeMonsterEffectActivated(ctx){
  const e = ctx.event;
  return !!(e && e.player === ctx.opponent && e.kind === 'monster');
}
defineScript("朱光の宣告者", {
  type:"monster", priority:3, quickEffect:true,
  activateFrom:["hand"],
  condition(ctx){
    if(ctx.zone !== 'hand'){ ctx.reason = "手札から発動します"; return false; }
    if(!s03U91FoeMonsterEffectActivated(ctx)){
      ctx.reason = "相手がモンスターの効果を発動した時に発動します"; return false;
    }
    const angels = API.pileCards(ctx.player,'hand',
      x=>x.db.k==='m' && x.db.ra==='天使' && x.card !== ctx.card);
    if(!angels.length){ ctx.reason = "コストにする天使族が手札にいません"; return false; }
    return true;
  },
  cost(ctx, done){
    const angels = API.pileCards(ctx.player,'hand',
      x=>x.db.k==='m' && x.db.ra==='天使' && x.card !== ctx.card);
    API.selectCard("朱光の宣告者：コストで捨てる天使族", angels, pick=>{
      // 添字がずれないよう、大きい方から捨てる
      const idxs = [pick.index, ctx.index].sort((a,b)=>b-a);
      idxs.forEach(i=>API.discard(ctx.player, i, "朱光の宣告者（コスト）"));
      done(true);
    });
  },
  resolve(ctx){
    API.negateChainLink(ctx.event, 'activation', "朱光の宣告者", true);
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return ctx.zone==='hand' && s03U91FoeMonsterEffectActivated(ctx); } }
});

/* ---- 神の居城－ヴァルハラ ----
   1ターンに1度、自分フィールドにモンスターが存在しない場合に
   手札から天使族モンスター1体を特殊召喚する。 */
defineScript("神の居城－ヴァルハラ", {
  fieldIgnition:true,          // 表側で場に残ったまま効果を発動できる
  countLimit:1,
  type:"spell", priority:1, quickEffect:false,
  condition(ctx){
    if((API.me(ctx).mz||[]).length){
      ctx.reason = "自分フィールドにモンスターが存在しない場合に発動できます"; return false;
    }
    if(!valhallaTargets(ctx.player).length){
      ctx.reason = "手札に天使族モンスターがいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("神の居城－ヴァルハラ：特殊召喚する天使族",
      valhallaTargets(ctx.player), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t) return;
    // 処理時にも条件を満たしている必要がある
    if((API.me(ctx).mz||[]).length){ API.log("モンスターが存在するため不発"); return; }
    const nm = labelOf(t.card);
    const now = API.pileCards(ctx.player,'hand',x=>labelOf(x.card)===nm);
    if(now.length) API.specialSummon(ctx.player,'hand',now[0].index,'atk',"神の居城－ヴァルハラ");
  },
  afterResolve(){}          // 永続魔法なので場に残る
});
function valhallaTargets(p){
  return API.pileCards(p,'hand',x=>x.db.k==='m' && x.db.ra==='天使' && !x.db.ex);
}

/* ---- 豊穣のアルテミス ----
   カウンター罠が発動する度に、自分はデッキから1枚ドローする。 */
/* S03-U196: 「自分または相手がカウンター罠カードを発動する度に、自分はデッキから1枚ドローする」 — forced (before: optional), on the
   activation event of a Counter Trap (onActivateSuccess, sub 'counter'; the legacy onCounterTrap is only emitted by the manual runScript path). */
function artemisCounterS03(ctx){ const e = ctx.event || {}; return e.kind==='trap' && e.sub==='counter'; }
defineScript("豊穣のアルテミス", {
  type:"monster", priority:1, forced:true,
  passive:{
    onCounterTrap(ctx){ return ctx.zone === 'mz' && ctx.card.face === 'up'; },
    onActivateSuccess(ctx){ return ctx.zone === 'mz' && ctx.card.face === 'up' && artemisCounterS03(ctx); }
  },
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = "モンスターゾーンに表側表示で存在する場合に発動します"; return false; }
    if(ctx.eventName === 'onActivateSuccess' && !artemisCounterS03(ctx)){ ctx.reason = "カウンター罠が発動した時に発動します"; return false; }
    return true;
  },
  resolve(ctx){ API.draw(ctx.player, 1, "豊穣のアルテミス"); },
  afterResolve(){}
});

/* =========================================================================
   【ラギア】関連
   1103期の兎ラギアでは、レスキューラビットから《セイバーザウルス》等の
   レベル4通常恐竜を2体並べてラギアに繋ぐ。
   ========================================================================= */

/* ---- レスキューラビット ----
   フィールドのこのカードを除外して発動。デッキからレベル4以下の
   同名の通常モンスター2体を特殊召喚する。エンドフェイズに破壊。
   1103当時から「『レスキューラビット』の効果は1ターンに1度」と名称単位で制限される。 */
defineScript("レスキューラビット", {
  countLimit:1, nameLimit:true,
  type:"monster", priority:1, quickEffect:false,
  /* デッキ内で「同名が2枚以上あるレベル4以下の通常モンスター」を集める */
  condition(ctx){
    if(ctx.zone !== 'mz'){ ctx.reason = "フィールドのこのカードを除外して発動します"; return false; }
    if(!rabbitTargets(ctx.player).length){
      ctx.reason = "デッキにレベル4以下の同名の通常モンスターが2体いません"; return false;
    }
    return true;
  },
  /* コストとして自身を除外する（対象選択より前に払う） */
  cost(ctx, done){
    API.banish({p:ctx.player, zone:'mz', index:ctx.index, card:ctx.card},
               "レスキューラビット（コストで除外）");
    done(true);
  },
  selectTargets(ctx, done){
    const groups = rabbitTargets(ctx.player);
    API.selectCard("レスキューラビット：特殊召喚する通常モンスター",
      groups.map(g=>g.sample),
      pick=>done([{name: labelOf(pick.card)}]),
      "同名2体をデッキから特殊召喚します");
  },
  resolve(ctx){
    const nm = (ctx.selectedTargets[0]||{}).name;
    if(!nm) return;
    const summonedUids=[];
    // デッキから同名を2体。特殊召喚のたびに添字がずれるので都度引き直す
    for(let k=0; k<2; k++){
      const left = API.pileCards(ctx.player,'deck', x=>labelOf(x.card)===nm);
      if(!left.length) break;
      API.specialSummon(ctx.player,'deck',left[0].index,'atk',"レスキューラビット");
      const summoned=lastSummonedCard(ctx.player);
      if(summoned){
        const uid=ensureCardUid(gameState,summoned);
        API.setCardFlag({card:summoned},'rabbitEndDestroyTurn',gameState.turn,'レスキューラビット',{silent:true});
        summonedUids.push(uid);
      }
    }
    API.registerReserveEffect(ctx.player, "レスキューラビット：エンドに破壊",
      "endPhase", "この効果で特殊召喚したモンスターを破壊",
      {kind:'destroyUids',uids:summonedUids});
  },
  afterResolve(){}      // 自身は既に除外済みなので何もしない
});

/* デッキにレベル4以下の通常モンスターが同名で2枚以上あるものを集める */
function rabbitTargets(p){
  const cands = API.pileCards(p,'deck',
    x=>x.db.k==='m' && !x.db.ex && (x.db.st||[]).indexOf('通常')>=0 && (x.db.lv||9)<=4);
  const byName = new Map();
  cands.forEach(x=>{
    const nm = labelOf(x.card);
    if(!byName.has(nm)) byName.set(nm, []);
    byName.get(nm).push(x);
  });
  const out = [];
  byName.forEach((arr, nm)=>{ if(arr.length >= 2) out.push({name:nm, sample:arr[0], cards:arr}); });
  return out;
}

/* ---- No.39 希望皇ホープ ----
   ①:自分または相手のモンスターの攻撃宣言時、このカードのX素材を1つ取り除いて発動できる。そのモンスターの攻撃を無効にする。
   ②:このカードがX素材の無い状態で攻撃対象に選択された場合に発動する。このカードを破壊する。
   S03-U120: ②が未実装だった。「選択された時点で X素材が無い」ことは攻撃宣言（とリプレイでの選び直し）の Action が
   pendingAttack.targetNoMaterialS03 として記録する（xyzTargetWithoutMaterialS03）。その時点で素材が無ければ①は発動できないので、
   解決時の分岐は一意（①で最後の素材を取り除いた後に②を誤って処理しない）。②は強制（forcedForEventS03 に ctx を渡す）。 */
function xyzTargetWithoutMaterialS03(card){
  return !!(card && card.face==='up' && (dbOf(card).st||[]).indexOf('エクシーズ')>=0 && !(card.xyz||[]).length);
}
function hopeSelfDestroyModeS03(card){
  const a = gameState.pendingAttack;
  return !!(card && a && a.targetNoMaterialS03 && a.targetUid!=null && a.targetUid===card.uid);
}
defineScript("No.39 希望皇ホープ", {
  type:"monster", priority:2, quickEffect:true,
  /* S03-U114: X素材を1つ取り除く（素材が2つ以上ならプレイヤーが選ぶ。engine/1ZF_xyz_detach_choice_s03.js）。②にコストは無い。 */
  detachCostS03(ctx){ return hopeSelfDestroyModeS03(ctx && ctx.card) ? null : {count:1, reason:"No.39 希望皇ホープ"}; },
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){
      ctx.reason="表側表示でフィールドに存在する必要があります"; return false;
    }
    if(hopeSelfDestroyModeS03(ctx.card)){   /* the self-destroy effect (mode 2) */
      /* S03-U296: that effect is one forced trigger per selection as the attack target; its own link on the chain is not answered by it again
         (the Quick-Effect response path re-judged it on top of itself for ever: chain 1, 2, 3 ..., the duel never ended) */
      if(gameState.chain.some(l=>l && l.uid===ctx.card.uid && l.name==="No.39 希望皇ホープ")){ ctx.reason="この効果は既にチェーン上にあります"; return false; }
      return true;
    }
    if(ctx.eventName!=='onAttackDeclare'){
      ctx.reason="モンスターの攻撃宣言時に発動します"; return false;
    }
    if(!(ctx.card.xyz||[]).length){ ctx.reason="エクシーズ素材がありません"; return false; }
    return true;
  },
  /* S03-U114: X素材のコストは detachCostS03（DUEL・runScript とも engine/1ZF_xyz_detach_choice_s03.js が処理） */
  resolve(ctx){
    if(hopeSelfDestroyModeS03(ctx.card)){
      const h = locateCardAnyV4(ctx.card);
      if(h && h.zone==='mz') API.destroy(h, "No.39 希望皇ホープ（X素材の無い状態で攻撃対象に選択された）");
      return;
    }
    /* S03-U39: 攻撃無効は Action（NEGATE_ATTACK_V45）で記録する（直接書くと Replay が一致しない） */
    API.negateAttack("No.39 希望皇ホープ");
  },
  afterResolve(){},
  forcedForEventS03(eventName, ctx){ return eventName==='onAttackDeclare' && !!(ctx && hopeSelfDestroyModeS03(ctx.card)); },
  passive:{
    onAttackDeclare(ctx){
      if(ctx.zone!=='mz' || ctx.card.face!=='up') return false;
      return hopeSelfDestroyModeS03(ctx.card) || (ctx.card.xyz||[]).length>0;
    }
  }
});

/* ---- インヴェルズ・ローチ ----
   チェーンに乗らないレベル5以上の特殊召喚（自己SS手順・S召喚）を無効にする。
   X召喚はランクなので対象外。カード効果による特殊召喚にも使えない。 */
defineScript("インヴェルズ・ローチ", {
  type:"monster", priority:2, quickEffect:true,
  detachCostS03:{count:1, reason:"インヴェルズ・ローチ"},   /* S03-U114 */
  summonNegate:{
    kinds:['procedure','synchro'], specialOnly:true,
    condition(pending){
      const idx=findCardIndex(pending&&pending.name||'');
      const d=idx>=0 ? CARD_DB[idx] : null;
      return !!(d && (d.lv||0)>=5);
    }
  },
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){
      ctx.reason="表側表示でフィールドに存在する必要があります"; return false;
    }
    if(!gameState.pendingSummon){ ctx.reason="レベル5以上の特殊召喚を無効にするタイミングで発動します"; return false; }
    if(!(ctx.card.xyz||[]).length){ ctx.reason="エクシーズ素材がありません"; return false; }
    return true;
  },
  /* S03-U114: X素材のコストは detachCostS03（DUEL・runScript とも engine/1ZF_xyz_detach_choice_s03.js が処理） */
  resolve(ctx){
    summonNegatePendingV2("インヴェルズ・ローチ");
    API.log("インヴェルズ・ローチ：特殊召喚を無効にし破壊する");
  },
  afterResolve(){}
});

/* ---- エヴォルカイザー・ラギア ----
   X素材を2つ取り除き、以下のいずれかを発動できる。
     ● 魔法・罠カードが発動した時、その発動を無効にし破壊する
     ● 召喚・特殊召喚する際、それを無効にし、そのモンスターを破壊する
   1103では「1ターンに1度」の制限がないので、素材が続く限り撃てる。 */
defineScript("エヴォルカイザー・ラギア", {
  type:"monster", priority:2, quickEffect:true,
  detachCostS03:{count:2, reason:"エヴォルカイザー・ラギア（素材2つ）"},   /* S03-U114: 2つ選ぶ */
  /* 通常召喚と、チェーンに乗らない特殊召喚だけを召喚無効窓で拾う。
     反転召喚や、死者蘇生など効果解決中の特殊召喚はここでは無効にしない。 */
  summonNegate:{kinds:['normal','procedure','synchro','xyz']},
  condition(ctx){
    if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face!=='up'){
      ctx.reason = "表側表示でフィールドに存在する必要があります"; return false;
    }
    if((ctx.card.xyz||[]).length < 2){ ctx.reason = "エクシーズ素材が2つ必要です"; return false; }
    if(gameState.pendingSummon) return true;
    if(gameState.chain.length){
      const top=gameState.chain[gameState.chain.length-1], h=findCardByUid(top.uid), d=h?dbOf(h.card):null;
      if(d && (d.k==='s'||d.k==='t')) return true;
    }
    ctx.reason = "通常召喚・チェーンに乗らない特殊召喚、または魔法・罠カードの発動に対して発動します";
    return false;
  },
  /* S03-U114: X素材のコストは detachCostS03（DUEL・runScript とも engine/1ZF_xyz_detach_choice_s03.js が処理） */
  resolve(ctx){
    if(gameState.pendingSummon){
      summonNegatePendingV2("エヴォルカイザー・ラギア");
      API.log("エヴォルカイザー・ラギア：召喚を無効にし破壊する");
      return;
    }
    if(negatePreviousChainLinkV2('エヴォルカイザー・ラギア',true,'activation'))
      API.log("エヴォルカイザー・ラギア：魔法・罠カードの発動を無効にし破壊する");
  },
  afterResolve(){}
});

/* ---- ジュラック・グアイバ ----
   戦闘で相手モンスターを破壊した場合、デッキから攻撃力1700以下の
   「ジュラック」1体を特殊召喚する。そのモンスターはこのターン攻撃できない。
   ⑤追加誘発解決タイミング（既定）で発動する。 */
defineScript("ジュラック・グアイバ", {
  type:"monster", priority:1,
  condition(ctx){
    const b = ctx.battle || gameState.lastBattle;
    if(!b || b.atkCard !== ctx.card || !b.destroyedDef){
      ctx.reason = "戦闘で相手モンスターを破壊した場合に発動します"; return false;
    }
    if(!guaibaTargets(ctx.player).length){
      ctx.reason = "攻撃力1700以下の「ジュラック」がデッキにいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("ジュラック・グアイバ：特殊召喚する「ジュラック」",
      guaibaTargets(ctx.player), t=>done([t]), "攻撃力1700以下");
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t) return;
    const nm = labelOf(t.card);
    const again = API.pileCards(ctx.player,'deck', x=>labelOf(x.card)===nm);
    if(!again.length) return;
    API.specialSummon(ctx.player,'deck',again[0].index,'atk',"ジュラック・グアイバ");
    /* S03-U100: 実際のテキストは「このターン攻撃宣言できない」というターン限定の制限。
       card.cannotAttack はゾーンを離れるまで残る恒久フラグなので、そのまま立てると
       制限が永続化してしまう（S03-U93 と同じ既知のバグ形）。attackLimitTurn と同じ形の
       ターン番号スタンプ付き一時フラグ cannotAttackTurn（engine/00_state_actions.js の
       cannotAttackNow が判定）を使う。 */
    const P = gameState.players[ctx.player];
    const summoned = P.mz[P.mz.length-1];
    if(summoned) API.setCardFlag({card:summoned},'cannotAttackTurn',gameState.turn,'ジュラック・グアイバ',{silent:true});
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){
      const b = ctx.battle || {};
      return ctx.zone==='mz' && b.atkCard===ctx.card && !!b.destroyedDef;
    }
  }
});
function guaibaTargets(p){
  return API.pileCards(p,'deck',
    x=>x.db.k==='m' && !x.db.ex && String(x.db.n||'').indexOf('ジュラック')>=0 && (x.db.atk||0)<=1700);
}

/* =========================================================================
   御前試合 / 群雄割拠
   永続効果。表側表示モンスターが2種類以上になったら、1種類になるよう
   コントローラーが墓地へ送る。チェーンブロックは作らない。
   ダメージステップ中は⑤のタイミングで処理し、その後リバース効果を
   墓地で処理する（＝スキルドレインを貫通する）。
   ========================================================================= */
[['御前試合','at','属性'], ['群雄割拠','ra','種族']].forEach(([nm, key, jp])=>{
  defineScript(nm, {
    continuous:{
      scope:'self', from:['sz'],
      apply(){ return null; }        // 攻守には影響しない
    },
    /* 違反しているプレイヤーと、その場の内訳を返す */
    restriction:{ key, jp,
      violations(){
        const out = [];
        for(let p=0; p<2; p++){
          const ups = (gameState.players[p].mz||[])
            .map((c,i)=>({i, c}))
            .filter(x=>x.c && x.c.face==='up');
          const kinds = new Set(ups.map(x=>dbOf(x.c)[key]));
          if(kinds.size >= 2) out.push({player:p, cards:ups, kinds:[...kinds]});
        }
        return out;
      }
    }
  });
});

/* 違反状態を解消させる。チェーンブロックは作らず、コントローラーが
   1種類になるよう自分で墓地へ送る。ダメージステップ中なら⑤で処理する。
   選択が終わるまで繰り返し呼ばれる。 */
let EXCLUSION_PENDING = false;   // 選択待ちの間は多重に出さない
let EXCLUSION_RESOLVING = false; // 墓地送りの実行中は再入させない
function enforceExclusions(){
  if(EXCLUSION_PENDING || EXCLUSION_RESOLVING) return false;
  const v = exclusionViolations()[0];
  if(!v) return false;
  EXCLUSION_PENDING = true;
  const P = gameState.players[v.player];
  const jp = (CARD_SCRIPTS[v.script].restriction||{}).jp || '種類';
  // 残す種類を選ばせ、それ以外を墓地へ送る
  const key = (CARD_SCRIPTS[v.script].restriction||{}).key;
  setTimeout(()=>{
    const rows = v.kinds.map((k,i)=>
      `<div class="act pick-row" onclick="__exclPick(${jsVal(v.player)},${jsStr(key)},${jsStr(k)})">
         <span class="pk-nm">${k}</span>
         <span class="pk-sub">これを残す</span>
       </div>`).join("");
    sheet.innerHTML = `<div class="grip"></div>
      <h3 style="margin-bottom:4px">${v.script}</h3>
      <div class="meta" style="margin-bottom:10px">
        ${nameOf(v.player)} のフィールドに${jp}が${v.kinds.length}種類あります。
        1種類になるよう、残す${jp}を選んでください。</div>
      <div class="pick-list">${rows}</div>`;
    veil.classList.add("on");
  }, 60);
  return true;
}
function __exclPick(p, key, keep){
  EXCLUSION_PENDING = false;
  EXCLUSION_RESOLVING = true;
  closeSheet();
  const P = gameState.players[p];
  // 添字がずれるので後ろから処理する
  for(let i=(P.mz||[]).length-1; i>=0; i--){
    const c = P.mz[i];
    if(!c || c.face!=='up') continue;
    if(dbOf(c)[key] === keep) continue;
    act({type:"FX_TO_GRAVE", player:p, zone:'mz', index:i,
         reason:"御前試合・群雄割拠による墓地送り"});
  }
  EXCLUSION_RESOLVING = false;
  render();
  enforceExclusions();      // まだ違反が残っていれば繰り返す
}

/* 御前試合・群雄割拠が場にあるとき、違反しているプレイヤーを列挙する。
   戻り値 [{script, player, cards, kinds}] */
function exclusionViolations(){
  const out = [];
  continuousSources().forEach(src=>{
    const r = src.sc.restriction;
    if(!r) return;
    /* S03-U11: v49 の統合定義は restriction を {key, jp} だけで持つ。violations() が無い場合は key から同じ規則で求める
       （以前は r.violations is not a function で、表側の間は全 Action の後処理が例外になっていた）。 */
    const list = (typeof r.violations==='function') ? r.violations() : exclusionViolationsByKeyV32(r.key);
    list.forEach(v=>out.push(Object.assign({script:src.sc.name}, v)));
  });
  return out;
}
/* S03-U11: 各プレイヤーの表側表示モンスターが key（at=属性 / ra=種族）で2種類以上なら違反。 */
function exclusionViolationsByKeyV32(key){
  const out = [];
  if(!key) return out;
  for(let p=0; p<2; p++){
    const ups = (gameState.players[p].mz||[])
      .map((c,i)=>({i, c}))
      .filter(x=>x.c && x.c.face==='up');
    const kinds = new Set(ups.map(x=>dbOf(x.c)[key]));
    if(kinds.size >= 2) out.push({player:p, cards:ups, kinds:[...kinds]});
  }
  return out;
}

/* =========================================================================
   継続効果を持つカード
   攻守を書き換えず continuous で宣言する。カードが場を離れれば自動で外れる。
   ========================================================================= */

/* ---- フィールド魔法の全体強化 ---- */
[['ガイアパワー','地'], ['シャインスパーク','光'], ['ウォーターワールド','水'],
 ['ダークゾーン','闇'], ['デザートストーム','風'], ['バーニングブラッド','炎']].forEach(([nm, attr])=>{
  if(!CARD_SCRIPTS[nm]) defineScript(nm, {
    continuous:{
      scope:'allMonsters', from:['field'],
      apply(target){
        if(dbOf(target).at !== attr) return null;
        return { atk:500, def:-400 };
      }
    }
  });
});

/* ---- A・O・J カタストル ----
   ① ダメージステップ開始時に強制発動。闇属性以外の「表側表示」モンスターが対象で、
   裏側や裏側守備表示のモンスターに対しては発動しない（当時裁定）。
   強制効果なのでチェーン1、任意のグラン・モールがチェーン2になり、
   チェーンは逆順に解決されるため いかなる場合もグラン・モールが勝つ。 */
/* S03-U120: 属性は現在の属性（DNA改造手術・継続効果の属性変更を反映）で判定する。 */
function s03CatastorAttrU120(card){ return (typeof currentAttributeV17==='function') ? currentAttributeV17(card) : dbOf(card).at; }
defineScript("A・O・J カタストル", {
  dsTiming:"start",
  forced:true,
  type:"monster", priority:1,
  condition(ctx){
    const b=ctx.battle||battleContextV28();
    const foe=battleOpponentV28(ctx.card,b);
    if(!foe){ ctx.reason="このカードが戦闘を行っていません"; return false; }
    if(foe.face!=='up'){ ctx.reason="裏側表示モンスターには発動しません"; return false; }
    if(s03CatastorAttrU120(foe)==='闇'){ ctx.reason="闇属性モンスターには発動しません"; return false; }
    return true;
  },
  resolve(ctx){
    const b=ctx.battle||battleContextV28();
    const foe=battleOpponentV28(ctx.card,b);
    if(!foe || foe.face!=='up' || s03CatastorAttrU120(foe)==='闇') return;
    const h=findCardByUid(ensureCardUid(gameState,foe));
    if(h&&h.zone==='mz') API.destroy({p:h.p,zone:'mz',index:h.index,card:h.card},'A・O・J カタストル');
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){
      const b=ctx.battle||battleContextV28();
      const foe=battleOpponentV28(ctx.card,b);
      return !!(foe && foe.face==='up' && s03CatastorAttrU120(foe)!=='闇');
    }
  }
});

/* ---- ガチガチガンテツ：自分フィールドのモンスターを素材の数×200強化 ---- */
defineScript("ガチガチガンテツ", {
  /* S03-U173 (engine/1ZV): 「このカードが破壊される場合、代わりにこのカードのエクシーズ素材を1つ取り除く事ができる」 — chosen at the destruction */
  destroySubstituteS03:{kind:'detach', causes:['battle','effect']},
  continuous:{
    scope:'ownMonsters', from:['mz'],
    apply(target, self){
      const n = (self.xyz||[]).length;
      if(!n) return null;
      return { atk:n*200, def:n*200 };
    }
  }
});

/* ---- コマンド・ナイト：自分の戦士族を400強化 ---- */
/* S03-U193: 「また、自分フィールド上に他のモンスターが存在する場合、相手は表側表示で存在するこのカードを攻撃対象に選択する事はできない。」
   was missing — continuous.cannotBeAttackTarget (engine/1ZU). */
defineScript("コマンド・ナイト", {
  continuous:{
    scope:'ownMonsters', from:['mz'],
    apply(target){ return dbOf(target).ra === '戦士' ? { atk:400 } : null; },
    cannotBeAttackTarget(target, self){
      if(target!==self || !self || self.face!=='up') return false;
      const loc = locateCard(self); if(!loc) return false;
      return (gameState.players[loc.p].mz||[]).some(c=>c && c!==self);
    }
  }
});

/* ---- TGX300：自分の「TG」1体につき自分モンスターを300強化 ---- */
defineScript("TGX300", {
  fieldIgnition:true,          // 表側で場に残ったまま効果を発動できる
  continuous:{
    scope:'ownMonsters', from:['sz'],
    apply(target, self, info){
      const P = gameState.players[info.p];
      const n = (P.mz||[]).filter(c=>c && c.face==='up' &&
                  String(dbOf(c).n||'').indexOf('TG') === 0).length;
      return n ? { atk:n*300 } : null;
    }
  }
});

/* ---- The splendid VENUS：天使族以外の攻守を500ダウン ---- */
defineScript("The splendid VENUS", {
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(target, self){
      if(target === self) return null;
      return dbOf(target).ra === '天使' ? null : { atk:-500, def:-500 };
    }
  }
});

/* =========================================================================
   TGモンスターへの後付け（S03-U106で削除）
   以前はここで既に定義済みの4枚（TG ラッシュ・ライノ／TG サイバー・マジシャン／
   TG ワーウルフ／TG ストライカー）の condition/passive.onEndPhase を、劣った
   共通実装（tgEndSearchCondition／destroyedThisTurn 単体 — 「エンドフェイズ限定」の
   判定が無く、TG ワーウルフ／TG ストライカーについては tgDestroyedThisTurnS03U87 の
   「1ターンに1度」判定も上書きで消していた）で後付け上書きしていた。
   TG ラッシュ・ライノ／TG サイバー・マジシャン（cards/20_control_counter.js）は
   今は自前で tgGraveClause／tgDestroyedThisTurnS03U87 を直接使う完全な実装を持ち、
   TG ワーウルフ／TG ストライカー（cards/10_themes_a.js, S03-U87）も同様に完全な
   実装を既に持っているため、この後付けブロックは全て不要かつ有害（実際に壊れていた：
   後付けの tgEndSearchCondition にはエンドフェイズ限定の判定が無く、破壊されてさえ
   いればどのフェイズでも発動できてしまっていた）だったので削除する。
   tgEndSearchCondition／makeTgEndSearch 自体（cards/10_themes_a.js）は他の未登録
   「TG」カードのための汎用テンプレートとして残す（現在はどのカードからも参照されない）。
   ========================================================================= */


