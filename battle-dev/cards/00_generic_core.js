/* =========================================================================
   Step14: 1103環境の主要カード
   すべて共通API（API.*）の組み合わせのみで記述する。
   gameState を直接触らないこと。
   ========================================================================= */

/* ---- サイクロン（速攻魔法・対象1枚破壊） ---- */
defineScript("サイクロン", {
  targets:true,                 // 対象を取る効果
  type:"quick-play", priority:2,
  condition(ctx){
    const t = API.fieldCards({zone:null}).filter(x=>x.zone!=='mz');
    const others = t.filter(x=>!(x.p===ctx.player && x.zone===ctx.zone && x.index===ctx.index));
    if(!others.length){ ctx.reason = "フィールドに魔法・罠がありません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const cands = API.fieldCards().filter(x=>x.zone!=='mz')
      .filter(x=>!(x.p===ctx.player && x.zone===ctx.zone && x.index===ctx.index));
    API.selectCard("サイクロン：破壊する魔法・罠", cands, t=>done([t]), "裏側のカードも選べます");
  },
  resolve(ctx){ ctx.selectedTargets.forEach(t=>API.destroy(t, "サイクロン")); }
});

/* ---- 死者蘇生（どちらの墓地からでも蘇生） ---- */
defineScript("死者蘇生", {
  includesSpecialSummon:true,
  blocksIfNoSpecialSummon:true,
  targets:true,                 // 対象を取る効果
  type:"spell", priority:1,
  condition(ctx){
    const mons = [0,1].flatMap(p=>API.pileCards(p,'grave',x=>x.db.k==='m' && canEffectSpecialSummonS03(x.card,'grave','死者蘇生')));   /* S03-U144 */
    if(!mons.length){
      ctx.reason = [0,1].some(p=>API.pileCards(p,'grave',x=>x.db.k==='m').length) ? "墓地に特殊召喚できるモンスターがいません" : "墓地にモンスターがいません";
      return false;
    }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason = "モンスターゾーンが一杯です"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const mons = [0,1].flatMap(p=>API.pileCards(p,'grave',x=>x.db.k==='m' && canEffectSpecialSummonS03(x.card,'grave','死者蘇生')));   /* S03-U144 */
    API.selectCard("死者蘇生：蘇生するモンスター", mons, t=>done([t]), "どちらの墓地からでも選べます");
  },
  /* S03-U128: 相手の墓地のモンスターは、相手の墓地から直接自分フィールドへ特殊召喚する（fromPlayer）。以前は一度自分の墓地へ
     移してから「自分の墓地から」特殊召喚していたため、「自分の墓地からモンスターが特殊召喚された時」（ドッペル・ウォリアー）
     などが誤って反応した。対象は解決時に探し直す（添字は変わりうる）。 */
  resolve(ctx){
    const t = ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave') return;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', "死者蘇生", r.p);
  }
});

/* ---- 激流葬（召喚に誘発してモンスター全破壊） ---- */
defineScript("激流葬", {
  onOtherSummon:true,           // 相手の召喚にも反応する
  type:"trap", priority:2,
  condition(ctx){
    const mons = API.fieldCards({zone:'mz'});
    if(!mons.length){ ctx.reason = "フィールドにモンスターがいません"; return false; }
    return true;
  },
  resolve(ctx){ API.destroyAll('mz', null, "激流葬"); },
  passive:{
    // モンスターが召喚・特殊召喚された時に発動できる
    onNormalSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onSpecialSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onFlip(ctx){ return ctx.card.face==='down' && ctx.zone==='sz' && !!(ctx.event&&ctx.event.flipSummon); },
  }
});

/* ---- ブラック・ホール ---- */
defineScript("ブラック・ホール", {
  type:"spell", priority:1,
  condition(ctx){
    if(!API.fieldCards({zone:'mz'}).length){ ctx.reason = "フィールドにモンスターがいません"; return false; }
    return true;
  },
  resolve(ctx){ API.destroyAll('mz', null, "ブラック・ホール"); }
});



/* ---- 奈落の落とし穴（同時召喚された攻1500以上を全て破壊して除外） ---- */
function bottomlessSummonedCards(ctx){
  const ev=ctx.event||{};
  const cards=Array.isArray(ev.cards)?ev.cards:(ev.card?[ev.card]:[]);
  return cards.map(card=>{
    const h=locateCard(card);
    if(!h || h.p!==ctx.opponent || h.zone!=='mz') return null;
    return {p:h.p,zone:h.zone,index:h.index,card,db:dbOf(card)};
  }).filter(x=>x && x.card.face==='up' && curATK(x.card)>=1500);
}
defineScript("奈落の落とし穴", {
  onOtherSummon:true,
  type:"trap", priority:2,
  condition(ctx){
    const t=bottomlessSummonedCards(ctx);
    if(!t.length){ ctx.reason="このタイミングで召喚された攻撃力1500以上の相手モンスターがいません"; return false; }
    return true;
  },
  /* 対象を取らない。処理時に、その同時召喚されたモンスターだけを再確認する。 */
  resolve(ctx){
    const t=bottomlessSummonedCards(ctx);
    t.forEach(x=>API.destroyAndBanish(x,"奈落の落とし穴",ctx.player));
  },
  passive:{
    onNormalSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onSpecialSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
  }
});

/* ---- 強制脱出装置（バウンス） ---- */
defineScript("強制脱出装置", {
  targets:true,                 // 対象を取る効果
  type:"trap", priority:2,
  condition(ctx){
    if(!API.fieldCards({zone:'mz'}).length){ ctx.reason = "フィールドにモンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("強制脱出装置：手札に戻すモンスター", API.fieldCards({zone:'mz'}), t=>done([t]));
  },
  resolve(ctx){ ctx.selectedTargets.forEach(t=>API.returnToHand(t, "強制脱出装置")); }
});

/* ---- 月の書（裏側守備にする） ---- */
defineScript("月の書", {
  targets:true,                 // 対象を取る効果
  type:"quick-play", priority:2,
  condition(ctx){
    const t = API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'});
    if(!t.length){ ctx.reason = "表側表示のモンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const t = API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'});
    API.selectCard("月の書：裏側守備にするモンスター", t, x=>done([x]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0]; if(!t) return;
    API.flip(t, 'down', "月の書");
    API.changePosition(t, 'def', "月の書");
  }
});

/* ---- ライトニング・ボルテックス（手札1枚捨てて相手表側全破壊） ---- */
defineScript("ライトニング・ボルテックス", {
  type:"spell", priority:1,
  condition(ctx){
    if(!API.me(ctx).hand.length){ ctx.reason = "捨てる手札がありません"; return false; }
    const t = API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>x.card.face==='up'});
    if(!t.length){ ctx.reason = "相手に表側表示モンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const P = API.me(ctx);
    const hand = handCandidates(ctx);
    API.selectCard("ライトニング・ボルテックス：捨てる手札", hand, t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(t) API.discard(ctx.player, t.index, "ライトニング・ボルテックス");
    const foes = API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>x.card.face==='up'});
    // 添字ズレを避けるため後ろから破壊する
    foes.sort((a,b)=>b.index-a.index).forEach(x=>API.destroy(x, "ライトニング・ボルテックス"));
  }
});



/* ---- 貪欲な壺（墓地のモンスター5体をデッキに戻して2ドロー） ---- */
defineScript("貪欲な壺", {
  targets:true,                 // 対象を取る効果
  type:"spell", priority:1, quickEffect:false,
  condition(ctx){
    const mons = API.pileCards(ctx.player,'grave',x=>x.db.k==='m');
    if(mons.length<5){ ctx.reason = `墓地のモンスターが5体未満です（現在${mons.length}体）`; return false; }
    return true;
  },
  selectTargets(ctx, done){
    // 5体を順に選ばせる
    const chosen=[];
    const step=()=>{
      const left = API.pileCards(ctx.player,'grave',x=>x.db.k==='m')
        .filter(x=>chosen.every(c=>c.card!==x.card));
      if(chosen.length>=5 || !left.length){ done(chosen); return; }
      API.selectCard(`貪欲な壺：デッキに戻すモンスター（${chosen.length+1}/5）`, left, t=>{
        chosen.push(t); step();
      });
    };
    step();
  },
  resolve(ctx){
    const ts = ctx.selectedTargets||[];
    if(ts.length<5){ API.log("貪欲な壺：5体選べなかったため不発"); return; }
    // 実体で解決するので順不同で安全
    ts.forEach(t=>API.returnToDeck(t, true, "貪欲な壺"));
    API.shuffle(ctx.player);
    API.draw(ctx.player, 2);
  }
});



/* ---- リビングデッドの呼び声（蘇生・場に残る） ----
   S03-U89: real text: "Activate this card by targeting 1 monster in your GY; Special Summon that target
   in Attack Position. When this card leaves the field, destroy that monster. When that monster is
   destroyed, destroy this card." The old implementation never wired the leave-field/mutual-destruction
   clauses at all (a real missing feature, not just a missing test). Fixed using the same System v9
   linked-lifecycle primitive as リミット・リバース (cards/HE_claude_s03_u56_limit_reverse.js), but
   asymmetrically: real text destroys this card only when the summoned monster is specifically DESTROYED
   (not any leave-field reason), while the "this card leaves -> destroy monster" direction is unconditional
   on the leave reason. API.linkOnLeave(monster, self, 'destroy', ...) gives the first direction generically;
   the second direction needs an onDestroy-specific forced trigger (a plain leave-field watch with
   onGone:'none' is set up purely so the trigger can identify its own revived partner via API.linkState). */
function s03CothWatchesU89(card, uid){
  const st = API.linkState(card);
  return !!(st && Array.isArray(st.watch) && st.watch.some(w=>w && w.uid===uid));
}
defineUnifiedCardV4('リビングデッドの呼び声',[{
  key:'revive',
  type:EFFECT_TYPE.ACTIVATE,
  range:LOCATION.SZONE,
  targetRange:LOCATION.GRAVE,
  targetSide:'self',
  speed:2,
  events:['activate'],
  condition(ctx){
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason='モンスターゾーンが一杯です'; return false; }
    if(!API.pileCards(ctx.player,'grave',x=>x.db.k==='m').length){
      ctx.reason='自分の墓地にモンスターがいません'; return false;
    }
    return true;
  },
  target(ctx,done){
    API.selectCard('リビングデッドの呼び声：蘇生するモンスター',
      API.pileCards(ctx.player,'grave',x=>x.db.k==='m'), t=>done([t]));
  },
  operation(ctx){
    const picked = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = picked && resolveTarget(picked);
    if(!r || r.zone!=='grave' || !hasMonsterZoneSpace(ctx.player)) return;
    const targetCard = r.card;
    ensureCardUid(gameState,targetCard);
    API.specialSummon(ctx.player,'grave',r.index,'atk','リビングデッドの呼び声');
    const self = locateCardAnyV4(ctx.card);
    const revived = locateCardAnyV4(targetCard);
    if(!self || self.zone!=='sz' || !revived || revived.zone!=='mz') return;
    API.linkOnLeave(revived, self, 'destroy', 'リビングデッドの呼び声');
    API.linkOnLeave(self, revived, 'none', 'リビングデッドの呼び声');
  },
  afterResolve(){}
},{
  key:'destroy-self-on-monster-destroyed',
  type:EFFECT_TYPE.TRIGGER,
  range:LOCATION.SZONE,
  speed:1,
  events:['onDestroy'],
  forced:true,
  condition(ctx){
    const e = ctx.event||{};
    return ctx.zone==='sz' && ctx.card && ctx.card.face==='up'
      && e.uid!=null && s03CothWatchesU89(ctx.card,e.uid);
  },
  operation(ctx){
    const self = locateCardAnyV4(ctx.card);
    if(self && self.zone==='sz') API.destroy(self,'リビングデッドの呼び声');
  },
  afterResolve(){}
}],{
  type:'trap',
  priority:2,
  targets:true,
  includesSpecialSummon:true,
  blocksIfNoSpecialSummon:true,
  passive:{onDestroy:ctx=>{
    const e = ctx.event||{};
    return !!(ctx.zone==='sz' && ctx.card && ctx.card.face==='up'
      && e.uid!=null && s03CothWatchesU89(ctx.card,e.uid));
  }},
  continuous:{scope:'self',from:['sz'],apply(){return null;}}
});

/* ---- 聖なるバリア －ミラーフォース－ ---- */
defineScript("聖なるバリア －ミラーフォース－", {
  type:"trap", priority:2,
  condition(ctx){
    const t = API.fieldCards({zone:'mz', player:ctx.opponent,
      filter:x=>x.card.face==='up' && x.card.pos==='atk'});
    if(!t.length){ ctx.reason = "相手に攻撃表示モンスターがいません"; return false; }
    if(gameState.phase!=='battle'){ ctx.reason = "相手モンスターの攻撃宣言時に発動します"; return false; }
    /* S03-U40 (C-S03-31): 相手の攻撃宣言（攻撃中）でなければ発動できない。以前は攻撃する側が自分のカードを発動できた */
    { const pa = gameState.pendingAttack; if(!pa || pa.player!==ctx.opponent){ ctx.reason = "相手モンスターの攻撃宣言時に発動します"; return false; } }
    return true;
  },
  resolve(ctx){
    const t = API.fieldCards({zone:'mz', player:ctx.opponent,
      filter:x=>x.card.face==='up' && x.card.pos==='atk'});
    t.forEach(x=>API.destroy(x, "ミラーフォース"));
  },
  passive:{ onAttackDeclare(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; } }
});

/* ---- 次元幽閉 ---- */
defineScript("次元幽閉", {
  type:"trap", priority:2,
  condition(ctx){
    const t = API.fieldCards({zone:'mz', player:ctx.opponent,
      filter:x=>x.card.face==='up' && x.card.pos==='atk'});
    if(!t.length){ ctx.reason = "攻撃表示の相手モンスターがいません"; return false; }
    if(gameState.phase!=='battle'){ ctx.reason = "相手モンスターの攻撃宣言時に発動します"; return false; }
    /* S03-U40 (C-S03-31): 相手の攻撃宣言（攻撃中）でなければ発動できない。以前は攻撃する側が自分のカードを発動できた */
    { const pa = gameState.pendingAttack; if(!pa || pa.player!==ctx.opponent){ ctx.reason = "相手モンスターの攻撃宣言時に発動します"; return false; } }
    return true;
  },
  selectTargets(ctx, done){
    // 攻撃済みのモンスターを優先して見せる（攻撃宣言したモンスターが対象）
    const all = API.fieldCards({zone:'mz', player:ctx.opponent,
      filter:x=>x.card.face==='up' && x.card.pos==='atk'});
    const atkd = all.filter(x=>x.card.attacked);
    API.selectCard("次元幽閉：除外する攻撃モンスター", atkd.length?atkd:all, x=>done([x]),
      atkd.length?"攻撃宣言したモンスター":"攻撃表示のモンスター");
  },
  resolve(ctx){ ctx.selectedTargets.forEach(t=>API.banish(t, "次元幽閉")); },
  passive:{ onAttackDeclare(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; } }
});





/* =========================================================================
   追加カードスクリプト
   activateFrom: 発動できる場所を宣言する。
     'grave' や 'hand' を指定すると相手ターン中の割り込み候補に載る。
   quickEffect:false を指定すると相手ターン中は撃てない（自分ターン専用）。
   ========================================================================= */

/* ---- ネクロ・ガードナー（墓地から除外して攻撃を無効化） ---- */
/* S03-U153: ネクロ・ガードナー is defined in cards/HZF_claude_s03_u153_manual_notes.js (this script only left a manual note). */



/* ---- 冥府の使者ゴーズ（手札から特殊召喚） ---- */
defineScript("冥府の使者ゴーズ", {
  type:"monster", priority:2,
  activateFrom:["hand"],
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = "手札から特殊召喚します"; return false; }
    const P = API.me(ctx);
    if(P.mz.length || P.sz.length || P.field){
      ctx.reason = "自分フィールドにカードが存在すると発動できません"; return false;
    }
    return true;
  },
  resolve(ctx){
    API.specialSummon(ctx.player, 'hand', ctx.index, 'atk', "冥府の使者ゴーズ");
    // 戦闘ダメージなら「冥府の使者カイエントークン」（攻守＝受けたダメージ）
    const dmg = parseInt(prompt("受けた戦闘ダメージ（カイエントークンの攻守）","0")||"0",10);
    if(dmg>0){
      API.createToken(ctx.player,
        {name:"冥府の使者カイエントークン", atk:dmg, def:dmg, lv:7, ra:"天使", at:"光", pos:'atk'}, 1);
    } else {
      API.registerPendingEffect(ctx.player, "ゴーズ：効果ダメージの場合は相手に同量のダメージ", "手動でLPを調整してください");
    }
  },
  afterResolve(){}
});

/* ---- 非常食（自分の魔法罠を墓地へ送ってLP回復） ---- */
/* S03-U192 (text): 「このカード以外の自分フィールドの魔法・罠カードを任意の数だけ墓地へ送って発動できる。自分はこのカードを発動するために
   墓地へ送ったカードの数×1000LP回復する。」 — before: one card, chosen as a target and sent at resolution. Now a cost of 1 or more cards
   chosen at activation (P1.1 activation choice, recorded with recordActivationCost), 1000 per card at resolution. */
function emergencyFoodPoolS03(p, self){
  return API.fieldCards({player:p}).filter(x=>x.zone!=='mz' && x.card && (!self || x.card!==self) && (!self || self.uid==null || x.card.uid!==self.uid));
}
defineScript("非常食", {
  type:"quick-play", priority:2,
  condition(ctx){
    if(!emergencyFoodPoolS03(ctx.player, ctx.card).length){ ctx.reason = "他に自分の魔法・罠がありません"; return false; }
    return true;
  },
  activationV11(ctx, d){
    const q = emergencyFoodPoolS03(ctx.player, ctx.card);
    if(!q.length){ p11cAbort(d); return; }
    p11cOpen(d, {title:'非常食：墓地へ送る自分の魔法・罠（1枚につき1000回復）', candidates:q, min:1, max:q.length},
      'p11cards.cost-commit', {costKind:'food-send', move:'grave'});
  },
  resolve(ctx){
    const c = API.activationCosts(ctx, 'food-send')[0];
    const n = c ? Number(c.amount)||0 : 0;
    if(n) API.recoverLP(ctx.player, n*1000);
  }
});

/* ---- 神の宣告（LP半分でカウンター） ---- */
defineScript("神の宣告", {
  onOtherSummon:true,
  summonNegate:{kinds:['normal','flip','procedure','synchro','xyz']},           // 相手の召喚にも反応する
  type:"counter", priority:3,
  condition(ctx){
    const lp = API.me(ctx).lp;
    if(lp<=1){ ctx.reason = "LPが足りません"; return false; }
    if(gameState.pendingSummon) return true;
    if(gameState.chain.length){
      const top=gameState.chain[gameState.chain.length-1], h=findCardByUid(top.uid), db=h?dbOf(h.card):null;
      if(db && (db.k==='s'||db.k==='t')) return true;
    }
    ctx.reason='神の宣告は召喚、または魔法・罠カードの発動に対して発動します'; return false;
  },
  cost(ctx, done){
    const P = API.me(ctx);
    const half = Math.floor(P.lp/2);
    API.payCost(ctx.player, P.lp - half);
    done(true);
  },
  resolve(ctx){
    API.log("神の宣告：LPを半分払って発動を無効にした");
    if(gameState.pendingSummon) summonNegatePendingV2("神の宣告");
    else negatePreviousChainLinkV2('神の宣告',true);
  },
  passive:{
    onNormalSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onSpecialSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onCardActivate(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
  }
});

/* ---- 神の警告（2000払って召喚を無効） ---- */
defineScript("神の警告", {
  onOtherSummon:true,
  summonNegate:{kinds:['normal','flip','procedure','synchro','xyz']},           // 相手の召喚にも反応する
  type:"counter", priority:3,
  condition(ctx){
    if(API.me(ctx).lp < 2000){ ctx.reason = "LPが2000未満です"; return false; }
    if(gameState.pendingSummon) return true;
    if(gameState.chain.length){
      const top=gameState.chain[gameState.chain.length-1], tsc=CARD_SCRIPTS[top.name];
      if(typeof specialSummonEffectLinkS03==='function' ? specialSummonEffectLinkS03(top,{excludeSpellTrapEffect:true}) : (tsc && tsc.includesSpecialSummon===true)) return true;   /* S03-U46 */
    }
    ctx.reason='このチェーンの効果に特殊召喚処理があることをシステムが確認できません'; return false;
  },
  cost(ctx, done){
    if(API.me(ctx).lp < 2000){ showToast("LPが足りません"); done(false); return; }
    API.payCost(ctx.player, 2000);
    done(true);
  },
  resolve(ctx){
    API.log("神の警告：2000payして召喚・特殊召喚を無効にした");
    if(gameState.pendingSummon) summonNegatePendingV2("神の警告");
    else negatePreviousChainLinkV2('神の警告',true);
  },
  passive:{
    onNormalSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onSpecialSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
  }
});

/* ---- 王宮のお触れ（永続罠・罠を無効化） ---- */
defineScript("王宮のお触れ", {
  continuous:{
    scope:'self', from:['sz'],
    apply(){ return null; },
    /* このカード以外のフィールドの全ての罠カードの効果を無効にする */
    negateTrap(card, self){ return card !== self && dbOf(card).k === 't'; }
  },
  type:"continuous-trap", priority:2,
  condition(){ return true; },
  resolve(ctx){
    API.log("王宮のお触れ：フィールドの罠カードの効果は無効になる");
    API.setFlag(ctx.player, "royalDecree", true);
  },
  afterResolve(){}   // 永続なので場に残す
});

/* ---- デモンズ・チェーン（永続罠・効果無効＋攻撃不可） ---- */
/* S03-U188 (2011 text): 「フィールド上に表側表示で存在する効果モンスター1体を選択して発動する。選択した効果モンスターは攻撃する事ができず、
   効果は無効化される。選択したモンスターが破壊された時、このカードを破壊する。」
   Either side's monster. The negation / attack lock last while this card stays face-up and linked (zone-local uid marks stLinkTargetS03 /
   stLinkByS03, read by the continuous in 20_control_counter.js) — no permanent API.negate. Destroyed with the monster: v9 link
   'destroyIfDestroyed'. */
function demonChainCandidatesS03(){
  return API.fieldCards({zone:'mz', filter:x=>x.card && x.card.face==='up' && (x.db.st||[]).indexOf('効果')>=0});
}
defineScript("デモンズ・チェーン", {
  targets:true,                 // 対象を取る効果
  type:"continuous-trap", priority:2,
  condition(ctx){
    if(!demonChainCandidatesS03().length){ ctx.reason = "表側表示の効果モンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("デモンズ・チェーン：対象の効果モンスター", demonChainCandidatesS03(), t=>done([t]));
  },
  resolve(ctx){
    const t0 = ctx.selectedTargets[0], t = t0 && findCardByUid(t0.card.uid);
    const self = locateCardAnyV4(ctx.card);
    if(!t || t.zone!=='mz' || t.card.face!=='up' || !self || self.zone!=='sz'){ API.log("デモンズ・チェーン：対象が存在しないため効果なし"); return; }
    ensureCardUid(gameState, self.card); ensureCardUid(gameState, t.card);
    act({type:'FX_CARD_FLAG_V46', player:self.p, zone:'sz', index:self.index, flag:'stLinkTargetS03', value:t.card.uid, reason:'デモンズ・チェーン'});
    const t2 = findCardByUid(t.card.uid);
    act({type:'FX_CARD_FLAG_V46', player:t2.p, zone:'mz', index:t2.index, flag:'stLinkByS03', value:self.card.uid, reason:'デモンズ・チェーン'});
    API.linkOnLeave(self, t2, 'destroyIfDestroyed', 'デモンズ・チェーン');
    API.log(`デモンズ・チェーン：${cardName(t2.card)} は攻撃できず、効果は無効化される`);
  },
  afterResolve(){}
});

/* ---- 異次元からの帰還（除外したモンスターを一斉に戻す） ---- */
API.registerScheduleHandler('s03u155.return-banish', (args)=>{   /* S03-U155 */
  (args && args.uids || []).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz' && Number(h.card.u155ReturnTurn)===Number(args.turn)) API.banish(h, '異次元からの帰還'); });
});
defineScript("異次元からの帰還", {
  type:"trap", priority:2,
  condition(ctx){
    const b = API.pileCards(ctx.player,'banish',x=>x.db.k==='m');
    if(!b.length){ ctx.reason = "除外されている自分のモンスターがいません"; return false; }
    if(API.me(ctx).lp<=1){ ctx.reason = "LPが足りません"; return false; }
    return true;
  },
  cost(ctx, done){
    const P = API.me(ctx);
    const half = Math.floor(P.lp/2);
    API.payCost(ctx.player, P.lp - half);
    done(true);
  },
  resolve(ctx){
    const P = API.me(ctx);
    const b = API.pileCards(ctx.player,'banish',x=>x.db.k==='m');
    const room = ZONE_LIMITS.mz - P.mz.length;
    const cards = b.slice(0, room).map(x=>x.card);
    const uids = [];
    cards.forEach(c=>{
      const h = locateCardAnyV4(c); if(!h || h.zone!=='banish') return;
      if(API.specialSummon(ctx.player, 'banish', h.index, 'atk', "異次元からの帰還")){
        const now = locateCardAnyV4(c);
        if(now && now.zone==='mz'){ ensureCardUid(gameState, c); uids.push(c.uid); API.setCardFlag(now, 'u155ReturnTurn', gameState.turn, '異次元からの帰還', {silent:true}); }
      }
    });
    /* S03-U155: 「この効果で特殊召喚したモンスターはエンドフェイズ時にゲームから除外される」 — scheduled (was a reminder only).
       The mark u155ReturnTurn is zone-local: a monster that left the field in between is not banished. */
    if(uids.length) API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'s03u155.return-banish', args:{uids, turn:gameState.turn}, note:'異次元からの帰還'});
  }
});

/* ---- クリッター: S03-U156 — moved to the shared deck-trigger engine (cards/HZG, engine/1ZT) with the 2011 text:
   forced, 「フィールド上から墓地へ送られた時」 only, no 1ターンに1度 / no activation ban (both are later errata). ---- */

/* ---- スノーマンイーター（リバースで破壊） ---- */
defineScript("スノーマンイーター", {
  type:"monster", priority:1,
  condition(ctx){
    if(!API.fieldCards({zone:'mz'}).filter(x=>x.card.face==='up').length){
      ctx.reason = "表側表示のモンスターがいません"; return false;
    }
    if(ctx.zone!=='mz'){ ctx.reason = "フィールドでリバースした時に発動します"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    // 「フィールド上に表側表示で存在するモンスター」＝自分のも対象になる
    const t = API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'})
      .filter(x=>!(x.p===ctx.player && x.index===ctx.index));
    API.selectCard("スノーマンイーター：破壊する表側モンスター", t, x=>done([x]));
  },
  resolve(ctx){ ctx.selectedTargets.forEach(t=>API.destroy(t, "スノーマンイーター")); },
  afterResolve(){},
  passive:{ onFlip(ctx){ return ctx.zone==='mz'; } }
});



/* ---- カオス・ソーサラー（除外して特殊召喚する上級） ----
   S03-U93: 「この効果を発動するターン、このカードは攻撃できない」がログ出力のみで実際には一切enforceされて
   いなかった（real DUEL で同じターン内に攻撃できてしまう実在のバグ、確認済み）。card.cannotAttack はゾーン
   を離れるまで残り続ける恒久フラグ（engine/00_state_actions.js）なので、そのまま立てるとターン制限のはずが
   永続化してしまう。既存の continuous.cannotAttack(card) 動的フック（光の護封剣などが使う仕組み）を使い、
   API.setCardFlag で打ったターン番号スタンプと比較する自己スコープの一時制限として実装する。 */
defineScript("カオス・ソーサラー", {
  targets:true,                 // 対象を取る効果
  countLimit:1,
  type:"monster", priority:1, quickEffect:false,
  activateFrom:["hand"],
  continuous:{scope:'self', apply(){ return null; },
    cannotAttack(card){ return card.csNoAttackTurnS03U93===gameState.turn; }},
  condition(ctx){
    // 手札からの特殊召喚（光1体＋闇1体を除外）
    if(ctx.zone==='hand'){
      const g = API.pileCards(ctx.player,'grave',x=>x.db.k==='m');
      const light = g.filter(x=>x.db.at==='光');
      const dark  = g.filter(x=>x.db.at==='闇');
      if(!light.length || !dark.length){
        ctx.reason = "墓地に光属性と闇属性のモンスターが必要です"; return false;
      }
      if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
      return true;
    }
    // 場での起動効果（表側モンスター1体を除外）
    if(!API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}).length){
      ctx.reason = "除外する表側表示モンスターがいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone==='hand'){
      // 光→闇の順に除外するモンスターを選ぶ
      const light = API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.at==='光');
      API.selectCard("カオス・ソーサラー：除外する光属性", light, l=>{
        const dark = API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.at==='闇' && x.card!==l.card);
        API.selectCard("カオス・ソーサラー：除外する闇属性", dark, d=>done([l,d]));
      });
      return;
    }
    API.selectCard("カオス・ソーサラー：除外する表側モンスター",
      API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}), t=>done([t]));
  },
  resolve(ctx){
    if(ctx.zone==='hand'){
      ctx.selectedTargets.forEach(t=>API.banish(t, "カオス・ソーサラー（コスト）"));
      API.specialSummon(ctx.player, 'hand', ctx.index, 'atk', "カオス・ソーサラー");
      return;
    }
    ctx.selectedTargets.forEach(t=>API.banish(t, "カオス・ソーサラー"));
    API.setCardFlag({card:ctx.card}, 'csNoAttackTurnS03U93', gameState.turn, "カオス・ソーサラー", {silent:true});
    API.log("カオス・ソーサラー：この効果を発動したターン攻撃できない");
  },
  afterResolve(){}
});



/* ---- エフェクト・ヴェーラー（手札から効果無効） ---- */
defineScript("エフェクト・ヴェーラー", {
  targets:true,
  type:"monster", priority:2, quickEffect:true,
  activateFrom:["hand"],
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = "手札から発動します"; return false; }
    if(gameState.activePlayer!==ctx.opponent || !['main1','main2'].includes(gameState.phase)){
      ctx.reason = "相手のメインフェイズにのみ発動できます"; return false;
    }
    const cands=API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>{
      const d=x.db||dbOf(x.card);
      return x.card.face==='up' && d.k==='m' && Array.isArray(d.st) && d.st.includes('効果');
    }});
    if(!cands.length){ ctx.reason = "相手フィールドに表側表示の効果モンスターがいません"; return false; }
    return true;
  },
  cost(ctx, done){
    // 「手札から墓地へ送る」は発動コスト。チェーン解決前に墓地へ送る。
    API.discard(ctx.player, ctx.index, "エフェクト・ヴェーラー（コスト）");
    done(true);
  },
  selectTargets(ctx, done){
    API.selectCard("エフェクト・ヴェーラー：効果を無効にするモンスター",
      API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>{
        const d=x.db||dbOf(x.card);
        return x.card.face==='up' && d.k==='m' && Array.isArray(d.st) && d.st.includes('効果');
      }}), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0]; if(!t) return;
    const r=resolveTarget(t);
    // 解決時に相手がコントロールする表側表示モンスターでなくなっていれば適用しない。
    if(!r || r.zone!=='mz' || r.p!==ctx.opponent || !r.card || r.card.face!=='up') return;
    API.setCardFlag({card:r.card},'negatedUntilTurn',gameState.turn,'エフェクト・ヴェーラー',{silent:true});
    API.log(`${labelOf(r.card)} の効果はターン終了時まで無効`);
  },
  afterResolve(){}
});







/* ---- 突然変異／おろかな埋葬など汎用サポート ---- */
function s03u58AnswerDeckCard(answer,args,filter){
  const picked=answer&&answer.cards&&answer.cards[0];
  const uid=picked&&picked.uid;
  const h=uid!=null?findCardByUid(uid):null;
  if(!h||h.p!==args.player||h.zone!=='deck') return null;
  if(filter&&!filter(h)) return null;
  return h;
}
API.registerChoiceHandler('s03u58.deck-search',(answer,args)=>{
  const h=s03u58AnswerDeckCard(answer,args);
  if(h) API.searchDeck(args.player,h.index,args.reason||'デッキサーチ');
});
API.registerChoiceHandler('s03u58.deck-mill',(answer,args)=>{
  const h=s03u58AnswerDeckCard(answer,args);
  if(h) API.mill(args.player,h.index,args.reason||'デッキから墓地へ送る');
});
API.registerChoiceHandler('s03u58.deck-special',(answer,args)=>{
  const h=s03u58AnswerDeckCard(answer,args);
  if(h) API.specialSummon(args.player,'deck',h.index,args.pos||'atk',args.reason||'デッキから特殊召喚');
});

defineScript("おろかな埋葬", {
  type:"spell", priority:1,
  condition(ctx){
    const t = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && !x.db.ex);
    if(!t.length){ ctx.reason = "デッキにモンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    done([]);
  },
  resolve(ctx){
    const t = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && !x.db.ex);
    if(t.length) API.requestChoice({player:ctx.player, kind:'card', title:"おろかな埋葬：墓地へ送るモンスター", candidates:t, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-mill',args:{player:ctx.player,reason:'おろかな埋葬'}}, meta:{scriptName:'おろかな埋葬'}});
  }
});

/* ---- 増援（戦士族サーチ） ---- */
defineScript("増援", {
  type:"spell", priority:1,
  blocksIfNoDeckToHand:true,    // S03-U01: ライオウ適用中は発動できない
  condition(ctx){
    const t = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && x.db.ra==='戦士' && (x.db.lv||9)<=4);
    if(!t.length){ ctx.reason = "レベル4以下の戦士族がデッキにいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    done([]);
  },
  resolve(ctx){
    const lock=deckToHandLockReasonV32(ctx.player);
    if(lock){ logIt(gameState, `増援：${lock}`); return; }
    const t = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && x.db.ra==='戦士' && (x.db.lv||9)<=4);
    if(t.length) API.requestChoice({player:ctx.player, kind:'card', title:"増援：手札に加える戦士族", candidates:t, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-search',args:{player:ctx.player,reason:'増援'}}, meta:{scriptName:'増援'}});
  }
});

/* ---- 光の援軍（デッキから3枚落として1枚サーチ） ---- */
defineScript("光の援軍", {
  type:"spell", priority:1, quickEffect:false,
  blocksIfNoDeckToHand:true,    // S03-U05: ライオウ適用中は発動できない
  condition(ctx){
    /* 1103裁定DB: デッキの上から3枚を発動コストとして確実に墓地へ送り、その後にサーチできる状態が必要。 */
    if(API.me(ctx).deck.length<4){ ctx.reason = "デッキが4枚未満です"; return false; }
    const t = API.pileCards(ctx.player,'deck',
      x=>x.db.k==='m' && (x.db.lv||9)<=4 && String(x.db.n||'').indexOf('ライトロード')>=0);
    if(!t.length){ ctx.reason = "レベル4以下の「ライトロード」がデッキにいません"; return false; }
    return true;
  },
  cost(ctx, done){
    // S03-U05: デッキの上から3枚を墓地へ送るのは発動コスト（効果が無効になっても戻らない）
    API.millTop(ctx.player, 3, "光の援軍（コスト）");
    done(true);
  },
  resolve(ctx){
    // 解決時に候補がいなければ手札に加えない（KONAMI Q&A）。選択は保存・再開できる registry choice。
    const t = API.pileCards(ctx.player,'deck',
      x=>x.db.k==='m' && (x.db.lv||9)<=4 && String(x.db.n||'').indexOf('ライトロード')>=0);
    if(!t.length){ API.log("光の援軍：対象がデッキに残っていない"); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:"光の援軍：手札に加える「ライトロード」", candidates:t, min:1, max:1, cancelable:false,
      resume:{handler:'p11cards.deck-hand', args:{player:ctx.player, reason:"光の援軍"}}});
  }
});

/* ---- ハリケーン（魔法罠を全て手札へ） ---- */
defineScript("ハリケーン", {
  type:"spell", priority:1,
  condition(ctx){
    const t = API.fieldCards().filter(x=>x.zone!=='mz')
      .filter(x=>!(x.p===ctx.player && x.zone===ctx.zone && x.index===ctx.index));
    if(!t.length){ ctx.reason = "他に魔法・罠がありません"; return false; }
    return true;
  },
  resolve(ctx){
    const all = API.fieldCards().filter(x=>x.zone!=='mz')
      .filter(x=>!(x.p===ctx.player && x.zone===ctx.zone && x.index===ctx.index));
    all.sort((a,b)=>b.index-a.index).forEach(x=>API.returnToHand(x, "ハリケーン"));
  }
});



/* ---- スケープ・ゴート（羊トークン4体） ---- */
/* S03-U129: スケープ・ゴート
   このカードを発動するターン、自分はこのカードの効果以外ではモンスターを召喚・反転召喚・特殊召喚できない。
   ①:自分フィールドに「羊トークン」(獣族・地・星1・攻/守0)4体を守備表示で特殊召喚する。
   このトークンはアドバンス召喚のためにはリリースできない。
   以前は発動ターンの制約が無く（ログは「融合召喚できない」と誤記）、空きが4未満でも出せるだけ出し、トークンをアドバンス召喚の
   リリースにできた。発動には、このターンまだ召喚・反転召喚・特殊召喚していないことと4つの空きが要る。チェーン中も特殊召喚できない
   （U34 の noSpecialSummonWhileChained）。解決時に4つ空いていなければトークンは出ない。 */
defineScript("スケープ・ゴート", {
  type:"quick-play", priority:2,
  condition(ctx){
    if(ZONE_LIMITS.mz - API.me(ctx).mz.length < 4){ ctx.reason = "モンスターゾーンが4つ空いていません"; return false; }
    const P = API.me(ctx);
    if((P.ssHistory||[]).length || (P.temporaryFlags && P.temporaryFlags.summonedThisTurnS03)){
      ctx.reason = "このターン既にモンスターを召喚・反転召喚・特殊召喚しています"; return false;
    }
    return true;
  },
  resolve(ctx){
    if(ZONE_LIMITS.mz - API.me(ctx).mz.length >= 4)
      API.createToken(ctx.player, {name:"羊トークン", atk:0, def:0, lv:1, ra:"獣", at:"地", pos:'def', noAdvanceTributeS03:true}, 4);
    else API.log("スケープ・ゴート：モンスターゾーンが4つ空いていないため、トークンを特殊召喚できない");
    API.setFlag(ctx.player, "noSummonS03", "スケープ・ゴート", true);
    API.setFlag(ctx.player, "noSpecialSummon", true, true);
    API.log("スケープ・ゴート：このターン、このカードの効果以外ではモンスターを召喚・反転召喚・特殊召喚できない");
  }
});
declareActivationNegatedReleaseS03("スケープ・ゴート", {noSpecialSummonWhileChained:true});

/* ---- 終焉の焔 ----
   S03-U188 (2011 text): 「このカードを発動するターン、自分は召喚・反転召喚・特殊召喚する事はできない。自分フィールド上に「黒焔トークン」
   （悪魔族・闇・星1・攻/守0）2体を守備表示で特殊召喚する。このトークンは闇属性モンスター以外のアドバンス召喚のためにはリリースできない。」
   Like スケープ・ゴート: the turn's summons are checked at activation and locked at resolution; 2 free zones are needed. */
defineScript("終焉の焔", {
  type:"quick-play", priority:2,
  condition(ctx){
    if(ZONE_LIMITS.mz - API.me(ctx).mz.length < 2){ ctx.reason = "モンスターゾーンが2つ空いていません"; return false; }
    const P = API.me(ctx);
    if((P.ssHistory||[]).length || (P.temporaryFlags && P.temporaryFlags.summonedThisTurnS03)){
      ctx.reason = "このターン既にモンスターを召喚・反転召喚・特殊召喚しています"; return false;
    }
    return true;
  },
  resolve(ctx){
    if(ZONE_LIMITS.mz - API.me(ctx).mz.length >= 2)
      API.createToken(ctx.player, {name:"黒焔トークン", atk:0, def:0, lv:1, ra:"悪魔", at:"闇", pos:'def', noAdvanceTributeNonDarkS03:true}, 2);
    else API.log("終焉の焔：モンスターゾーンが2つ空いていないため、トークンを特殊召喚できない");
    API.setFlag(ctx.player, "noSummonS03", "終焉の焔", true);
    API.setFlag(ctx.player, "noSpecialSummon", true, true);
    API.log("終焉の焔：このターン、自分は召喚・反転召喚・特殊召喚できない");
  }
});
declareActivationNegatedReleaseS03("終焉の焔", {noSpecialSummonWhileChained:true});

/* ---- 魔法都市エンディミオン（魔力カウンター管理） ---- */
defineScript("魔法都市エンディミオン", {
  auditNote:"①魔法発動後の蓄積・②破壊カードからの移送を自動化。③コスト代替・④自身の破壊代替は一部手動",
  type:"field", priority:1,
  // フィールド魔法の発動そのものには起動効果を持たせず、解決後に継続監視へ入る。
  resolve(){ API.log("魔法都市エンディミオン：魔力カウンター監視を開始"); },
  afterResolve(){},
  continuous:{
    scope:'self',from:['field'],apply(){return null;},
    spellCounterOnSpellResolve:{kind:'魔力',n:1},
    collectDestroyedSpellCounters:true
  }
});

/* ---- アーカナイト・マジシャン（S召喚時に魔力2つ／取り除いて破壊） ---- */
defineScript("アーカナイト・マジシャン", {
  targets:true,                 // 対象を取る効果
  timing:["summon","free"],     // S召喚時のカウンターと、カウンターを使う起動効果
  type:"synchro", priority:1, quickEffect:false,
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason = "フィールドで発動します"; return false; }
    // 自分フィールドのどこかに魔力カウンターがあればよい
    const has = API.fieldCards({player:ctx.player})
      .some(x=>x.card.counters && (x.card.counters['魔力']||0)>0);
    if(!has){ ctx.reason = "自分フィールドに魔力カウンターがありません"; return false; }
    if(!API.fieldCards({player:ctx.opponent}).length){ ctx.reason = "破壊する相手のカードがありません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    // 取り除くカウンターの置き場所 → 破壊する相手のカード
    const src = API.fieldCards({player:ctx.player})
      .filter(x=>x.card.counters && (x.card.counters['魔力']||0)>0);
    API.selectCard("アーカナイト：魔力カウンターを取り除くカード", src, sc=>{
      API.selectCard("アーカナイト：破壊する相手のカード",
        API.fieldCards({player:ctx.opponent}), t=>done([sc, t]));
    });
  },
  resolve(ctx){
    const [src, t] = ctx.selectedTargets;
    if(src) API.removeCounter(src, "魔力", 1);
    if(t)   API.destroy(t, "アーカナイト・マジシャン");
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){ return ctx.zone==='mz'; } }
});


/* ---- 強欲で謙虚な壺（デッキトップ3枚から1枚を手札へ） ---- */
defineScript("強欲で謙虚な壺", {
  nameLimit:true,               // 「このカード名のカードは1ターンに1枚しか発動できず」
  countLimit:1,
  type:"spell", priority:1, quickEffect:false,
  blocksIfNoDeckToHand:true,    // S03-U01: ライオウ適用中は発動できない（KONAMI Q&A）
  condition(ctx){
    if(API.me(ctx).deck.length < 3){ ctx.reason = "デッキが3枚未満です"; return false; }
    if(API.me(ctx).ssHistory.length){ ctx.reason = "このターン既に特殊召喚しています"; return false; }
    return true;
  },
  /* S03-U34 (C-S03-27): めくって選ぶのは解決時（2011 wiki 10/04/17）。以前は発動時（selectTargets の revealPick）で、
     相手の応答より前に選んでおり、選択中に保存するとカードが魔法・罠ゾーンに残った。
     選択は V49 の復元できる choice（handler 's03u34.pot-pick'）。 */
  resolve(ctx){
    API.setFlag(ctx.player, "noSpecialSummon", true, true);
    API.log("強欲で謙虚な壺：このターン特殊召喚できない");
    const n = Math.min(3, API.me(ctx).deck.length);   /* 解決時に3枚未満ならある分だけめくる（10/05/18） */
    if(!n){ API.log("強欲で謙虚な壺：デッキにカードがありません"); return; }
    const top = API.pileCards(ctx.player, 'deck', x=>x.index < n);
    API.log(`強欲で謙虚な壺：デッキの上から${n}枚をめくった（${top.map(x=>x.db.n).join('、')}）`);
    API.requestChoice({player:ctx.player, kind:'card', title:'強欲で謙虚な壺：手札に加えるカード', candidates:top, min:1, max:1,
      cancelable:false, resume:{handler:'s03u34.pot-pick', args:{player:ctx.player}}, meta:{scriptName:'強欲で謙虚な壺'}});
  }
});
API.registerChoiceHandler('s03u34.pot-pick', (answer, args)=>{
  const picked = (typeof v49P1ChoiceCards === 'function') ? v49P1ChoiceCards(answer)[0] : null;
  const h = picked && locateCardAnyV4(picked.card);
  if(!h || h.zone !== 'deck' || h.p !== args.player) return;
  API.log(`強欲で謙虚な壺：「${cardName(h.card)}」を選んだ（公開）`);
  /* S03-U01: チェーンで《ライオウ》が出た場合、選んだカードは手札に加えられず墓地へ送り、
     残りはデッキに戻してシャッフルする（KONAMI Q&A）。FX_MILL がシャッフルを含む。 */
  if(deckToHandLockReasonV32(args.player)) API.mill(args.player, h.index, "強欲で謙虚な壺（手札に加えられない）");
  else API.searchDeck(args.player, h.index, "強欲で謙虚な壺");
});
/* 発動が無効なら、このターンの特殊召喚も「1ターンに1枚」も制限しない（10/05/19）。チェーン上の間は特殊召喚できない（10/05/18）。 */
declareActivationNegatedReleaseS03('強欲で謙虚な壺', {count:true, noSpecialSummonWhileChained:true});

/* ---- 成金ゴブリン（1枚ドロー・相手LP1000回復） ---- */
defineScript("成金ゴブリン", {
  type:"spell", priority:1, quickEffect:false,
  condition(ctx){
    if(!API.me(ctx).deck.length){ ctx.reason = "デッキが空です"; return false; }
    return true;
  },
  resolve(ctx){
    API.draw(ctx.player, 1);
    API.recoverLP(ctx.opponent, 1000);
  }
});



/* ---- 打ち出の小槌（手札を戻して同数ドロー） ---- */
/* S03-U153: 打ち出の小槌 is defined in cards/HZF_claude_s03_u153_manual_notes.js (this script only left a manual note). */


/* ---- 終末の騎士（召喚・反転召喚・特殊召喚に成功した時、闇を落とす） ---- */
defineScript("終末の騎士", {
  type:"monster", priority:1, quickEffect:false,
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason = "フィールドで発動します"; return false; }
    const t = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && !x.db.ex && x.db.at==='闇');
    if(!t.length){ ctx.reason = "デッキに闇属性モンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const t = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && !x.db.ex && x.db.at==='闇');
    if(!t.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"終末の騎士：墓地へ送る闇属性モンスター",
      candidates:t, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-mill', args:{player:ctx.player, reason:'終末の騎士'}},
      meta:{scriptName:'終末の騎士'}});
  },
  afterResolve(){},   // モンスターなので場に残る
  passive:{
    onNormalSummon(ctx){ return ctx.zone==='mz'; },
    onSpecialSummon(ctx){ return ctx.zone==='mz'; },
    onFlip(ctx){ return ctx.zone==='mz'; },
  }
});

/* ---- E・HERO エアーマン（召喚時に選択：破壊 or サーチ） ---- */
defineScript("E・HERO エアーマン", {
  type:"monster", priority:1, quickEffect:false,
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason = "フィールドで発動します"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    /* S03-U63: 破壊モードは対象を取る効果なので発動時に対象を宣言する（従来通り）。
       サーチモードは対象を取らないので、モード選択だけ発動時に行い、
       「どのカードを加えるか」は解決時（現在のデッキ）に選ぶ（S03-U58パターン）。 */
    const heroOnField = API.fieldCards({zone:'mz', player:ctx.player})
      .filter(x=>String(x.db.n||'').indexOf('HERO')>=0 && x.index!==ctx.index).length;
    const deckHero = API.pileCards(ctx.player,'deck',
      x=>x.db.k==='m' && !x.db.ex && String(x.db.n||'').indexOf('HERO')>=0);
    const pickDestroy = ()=>{
      if(!heroOnField){ showToast("他の「HERO」がいないため破壊できません"); done([]); return; }
      const st = API.fieldCards().filter(x=>x.zone!=='mz');
      if(!st.length){ showToast("破壊できる魔法・罠がありません"); done([]); return; }
      API.selectCard("エアーマン：破壊する魔法・罠", st, x=>done([{mode:'destroy', t:x}]));
    };
    const pickSearch = ()=>{
      if(!deckHero.length){ showToast("デッキに「HERO」がいません"); done([]); return; }
      done([{mode:'search'}]);
    };
    // S03-U01: ライオウ等でデッキから手札に加えられない間は、サーチを選べない。
    if(deckToHandLockReasonV32(ctx.player)){ pickDestroy(); return; }
    API.confirm("E・HERO エアーマン",
      `効果を1つ選んでください。<br>
       ・破壊：他の「HERO」の数(${heroOnField})まで魔法・罠を破壊<br>
       ・サーチ：デッキから「HERO」を手札に(${deckHero.length}体)`,
      pickSearch,      // はい＝サーチ
      pickDestroy);    // いいえ＝破壊
  },
  resolve(ctx){
    const sel = ctx.selectedTargets[0];
    if(!sel) return;
    if(sel.mode==='destroy'){ API.destroy(sel.t, "E・HERO エアーマン"); return; }
    const deckHero = API.pileCards(ctx.player,'deck',
      x=>x.db.k==='m' && !x.db.ex && String(x.db.n||'').indexOf('HERO')>=0);
    if(!deckHero.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"エアーマン：手札に加える「HERO」",
      candidates:deckHero, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-search', args:{player:ctx.player, reason:'E・HERO エアーマン'}},
      meta:{scriptName:'E・HERO エアーマン'}});
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return ctx.zone==='mz'; },
    onSpecialSummon(ctx){ return ctx.zone==='mz'; },
  }
});

/* ---- ダーク・グレファー（手札の闇を捨ててデッキから闇を落とす） ---- */
defineScript("ダーク・グレファー", {
  countLimit:1,
  type:"monster", priority:1, quickEffect:false,
  condition(ctx){
    const hand = handCandidates(ctx, x=>x.db.k==='m' && x.db.at==='闇');
    if(!hand.length){ ctx.reason = "手札に捨てる闇属性モンスターがいません"; return false; }
    const deck = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && !x.db.ex && x.db.at==='闇');
    if(!deck.length){ ctx.reason = "デッキに闇属性モンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    /* S03-U63: 捨てる手札は宣言（コスト）として発動時のまま。墓地へ送るデッキのモンスターの選択は
       対象を取らないので解決時（現在のデッキ）に移す（S03-U58パターン）。 */
    const hand = handCandidates(ctx, x=>x.db.k==='m' && x.db.at==='闇');
    API.selectCard("ダーク・グレファー：捨てる闇属性（コスト）", hand, h=>done([h]));
  },
  resolve(ctx){
    const h=ctx.selectedTargets[0];
    if(h) API.discard(ctx.player, h.index, "ダーク・グレファー（コスト）");
    const deck = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && !x.db.ex && x.db.at==='闇');
    if(!deck.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"ダーク・グレファー：墓地へ送る闇属性",
      candidates:deck, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-mill', args:{player:ctx.player, reason:'ダーク・グレファー'}},
      meta:{scriptName:'ダーク・グレファー'}});
  },
  afterResolve(){}
});

/* ---- 馬頭鬼（墓地から除外してアンデットを蘇生） ---- */
defineScript("馬頭鬼", {
  targets:true,                 // 対象を取る効果
  type:"monster", priority:1, quickEffect:false,
  activateFrom:["grave"],
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = "墓地で発動します"; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
    const t = API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.ra==='アンデット' && x.index!==ctx.index);
    if(!t.length){ ctx.reason = "墓地に他のアンデット族がいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const t = API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.ra==='アンデット' && x.index!==ctx.index);
    API.selectCard("馬頭鬼：特殊召喚するアンデット族", t, x=>done([x]), "このカードは除外されます");
  },
  resolve(ctx){
    // 先に自身を除外（コスト）してから蘇生する
    API.banish({p:ctx.player, zone:'grave', index:ctx.index, card:ctx.card}, "馬頭鬼（コスト）");
    const t = ctx.selectedTargets[0]; if(!t) return;
    const r = resolveTarget(t);
    if(r) API.specialSummon(ctx.player, 'grave', r.index, 'atk', "馬頭鬼");
  },
  afterResolve(){}
});

/* ---- ゾンビキャリア（手札1枚をデッキトップへ戻して蘇生） ---- */
defineScript("ゾンビキャリア", {
  includesSpecialSummon:true,
  blocksIfNoSpecialSummon:true,
  type:"monster", priority:1, quickEffect:false,
  activateFrom:["grave"],
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = "墓地で発動します"; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = "戻す手札がありません"; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const hand = API.me(ctx).hand.map((c,i)=>({p:ctx.player,zone:'hand',index:i,card:c,db:dbOf(c)}));
    API.selectCard("ゾンビキャリア：デッキトップに戻す手札", hand, h=>done([h]));
  },
  resolve(ctx){
    const h=ctx.selectedTargets[0];
    if(h) act({type:"FX_HAND_TO_TOP", player:ctx.player, handIndex:h.index, reason:"ゾンビキャリア"});
    const gi = gameState.players[ctx.player].grave.indexOf(ctx.card);
    if(gi>=0) API.specialSummon(ctx.player, 'grave', gi, 'atk', "ゾンビキャリア");
    const loc=locateCard(ctx.card); if(loc&&loc.zone==='mz') API.setCardFlag({card:ctx.card},'banishWhenLeavesField',true,'ゾンビキャリア',{silent:true});
    API.log("ゾンビキャリア：この効果で蘇生したため、フィールドを離れる場合は除外される");
  },
  afterResolve(){}
});

/* ---- グローアップ・バルブ（デッキトップを落として蘇生） ---- */
defineScript("グローアップ・バルブ", {
  includesSpecialSummon:true,
  blocksIfNoSpecialSummon:true,
  countLimit:{n:1,scope:'duel'},
  type:"monster", priority:1, quickEffect:false,
  activateFrom:["grave"],
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = "墓地で発動します"; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = "デッキが空です"; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
    return true;
  },
  resolve(ctx){
    API.millTop(ctx.player, 1, "グローアップ・バルブ");
    const gi = gameState.players[ctx.player].grave.indexOf(ctx.card);
    if(gi>=0) API.specialSummon(ctx.player, 'grave', gi, 'atk', "グローアップ・バルブ");
    API.setFlag(ctx.player,"bulbUsed",true,false);   // デュエル中1度なので永続フラグ
  },
  afterResolve(){}
});



/* ---- ライオウ（自身を墓地へ送って特殊召喚を無効） ---- */
defineScript("ライオウ", {
  type:"monster", priority:2, quickEffect:true,
  summonNegate:{kinds:['procedure','synchro','xyz'],specialOnly:true},
  /* S03-U01: お互いにドロー以外の方法でデッキから手札に加えられない永続効果。
     表側・無効化・スキルドレインの判定は continuousSources() に任せる。 */
  continuous:{from:['mz'], scope:'self', apply(){ return null; }, lockDeckToHand(){ return true; }},
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason = "フィールドで発動します"; return false; }
    if(ctx.card && ctx.card.face!=='up'){ ctx.reason = "表側表示で発動します"; return false; }
    const pending=gameState.pendingSummon;
    if(!pending){ ctx.reason = "相手モンスター1体の特殊召喚を無効にするタイミングでのみ発動できます"; return false; }
    if(pending.player===ctx.player){ ctx.reason = "相手モンスターの特殊召喚に対してのみ発動できます"; return false; }
    if(!['procedure','synchro','xyz'].includes(pending.kind)){
      ctx.reason = "チェーンを作らない特殊召喚に対してのみ発動できます"; return false;
    }
    return true;
  },
  cost(ctx, done){
    // 自身を墓地へ送るのがコスト（効果が通らなくても戻らない）
    API.sendToGrave({p:ctx.player, zone:'mz', index:ctx.index, card:ctx.card}, "ライオウ（コスト）");
    done(true);
  },
  resolve(ctx){
    API.log("ライオウ：特殊召喚を無効にし破壊する");
    if(gameState.pendingSummon) summonNegatePendingV2("ライオウ");
  },
  afterResolve(){}
});

/* ---- 氷結界の龍 ブリューナク（手札を捨てた数だけバウンス） ----
   ①:手札を任意の枚数墓地へ捨て、捨てた数だけ相手フィールドのカードを対象として発動できる。そのカードを持ち主の手札に戻す。
   S03-U120: 捨てるのは発動コスト。以前は解決時に、発動時に覚えた手札の添字で捨てていたため、無効にされるとコストが
   払われず、チェーン中に手札が変わると別のカードを捨てていた。今は発動時に 1〜N 枚（N = 手札と相手フィールドの
   カードの少ない方）を選んで捨て、捨てた枚数ちょうどの相手のカードを対象に取り、解決時に対象を探し直して戻す。 */
function brionacFoeCardsS03(ctx){ return API.fieldCards({player:ctx.opponent, filter:x=>!!x.card}); }
defineScript("氷結界の龍 ブリューナク", {
  targets:true,                 // 対象を取る効果
  countLimit:1,
  type:"synchro", priority:1, quickEffect:false,
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason = "フィールドで発動します"; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = "捨てる手札がありません"; return false; }
    if(!brionacFoeCardsS03(ctx).length){ ctx.reason = "相手フィールドにカードがありません"; return false; }
    return true;
  },
  cost(ctx, done){
    const hand = API.pileCards(ctx.player,'hand');
    const max = Math.min(hand.length, brionacFoeCardsS03(ctx).length);
    const ok = requestChoiceV49({
      kind:'card', title:'氷結界の龍 ブリューナク：コストで捨てる手札（任意の枚数）', note:`1〜${max}枚。捨てた数だけ相手のカードを対象にします`,
      candidates:hand, min:1, max, cancelable:true,
      legacy:{ onPick:(first, all)=>{
        const picked = (all||[first]).filter(Boolean);
        ctx.brionacCountS03 = picked.length;
        picked.slice().sort((a,b)=>b.index-a.index).forEach(h=>API.discard(ctx.player, h.index, "氷結界の龍 ブリューナク（コスト）"));
        done(true);
      }, onCancel:()=>done(false) },
      meta:{ scriptName:'氷結界の龍 ブリューナク' }
    });
    if(!ok) done(false);
  },
  selectTargets(ctx, done){
    const n = Math.max(1, Number(ctx.brionacCountS03)||1);
    const foe = brionacFoeCardsS03(ctx);
    const ok = requestChoiceV49({
      kind:'card', title:`氷結界の龍 ブリューナク：手札に戻す相手のカード（${n}枚）`, candidates:foe,
      min:Math.min(n, foe.length), max:Math.min(n, foe.length), targeting:true, cancelable:false,
      legacy:{ onPick:(first, all)=>done((all||[first]).filter(Boolean)) },
      meta:{ scriptName:'氷結界の龍 ブリューナク' }
    });
    if(!ok) done([]);
  },
  resolve(ctx){
    (ctx.selectedTargets||[]).forEach(t=>{
      const r = resolveTarget(t);
      if(r && r.p===ctx.opponent && (r.zone==='mz'||r.zone==='sz'||r.zone==='field')) API.returnToHand(r, "氷結界の龍 ブリューナク");
    });
  },
  afterResolve(){}
});


/* =========================================================================
   戦闘関連の効果（ダメージ計算後の割り込みを利用）
   ========================================================================= */

/* ---- マシュマロン（戦闘破壊されない＋裏側で攻撃されたら1000ダメージ） ---- */
/* S03-U193: 2 「裏側表示のこのカードが攻撃されたダメージ計算後に発動する」 — forced, only when it was face-down when attacked (flipped by the
   attack: battle.flippedUid). Before, any attack on it (face-up too) triggered it, and it was optional. */
function marshmallonFlippedS03(ctx){
  const b = ctx.battle || {}, g = gameState.battle || {};
  const u = ctx.card && ctx.card.uid;
  return u != null && (b.flippedUid === u || g.flippedUid === u);
}
defineScript("マシュマロン", {
  dsTiming:"after",
  type:"monster", priority:1, forced:true,
  battleProof:true,                 // 戦闘では破壊されない（engineが自動で参照）
  condition(ctx){
    if(ctx.zone!=='mz' || !marshmallonFlippedS03(ctx)){ ctx.reason = "裏側表示のこのカードが攻撃されたダメージ計算後に発動します"; return false; }
    return true;
  },
  resolve(ctx){
    const b = ctx.battle || gameState.battle || gameState.lastBattle;
    const atkP = (b && (b.player===0 || b.player===1)) ? b.player : ctx.opponent;
    API.damageLP(atkP, 1000);
    API.log("マシュマロン：攻撃したモンスターのコントローラーに1000ダメージ");
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){ const b = ctx.battle||{}; return ctx.zone==='mz' && b.defCard===ctx.card && marshmallonFlippedS03(ctx); }
  }
});

/* ---- 異次元の女戦士（戦闘したモンスターをまとめて除外） ---- */
defineScript("異次元の女戦士", {
  type:"monster", priority:1,
  // ダメージ計算後、戦闘破壊モンスターが墓地へ送られる前にフィールドで発動する。
  dsTiming:"after",
  condition(ctx){
    const b = ctx.battle || gameState.lastBattle;
    if(!inBattle(ctx, b)){
      ctx.reason = "このカードが戦闘を行ったダメージ計算後に発動します"; return false;
    }
    return true;
  },
  resolve(ctx){
    const b = ctx.battle || gameState.lastBattle; if(!b) return;
    // 自分が攻撃側だったか守備側だったかを名前でも判定する
    const iWasAtk = (b.atkCard===ctx.card) ||
                    (ctx.player===b.atkOwner && cardName(ctx.card)===b.atkName);
    const foe = iWasAtk ? b.defCard : b.atkCard;
    const fp  = iWasAtk ? b.defOwner : b.atkOwner;
    if(foe){
      const arr = gameState.players[fp].mz;
      const i = arr.indexOf(foe);
      if(i>=0) API.banish({p:fp, zone:'mz', index:i, card:foe}, "異次元の女戦士");
      else {
        // 既に墓地なら墓地から除外する
        const gi = gameState.players[fp].grave.findIndex(c=>cardName(c)===cardName(foe));
        if(gi>=0) API.banish({p:fp, zone:'grave', index:gi, card:gameState.players[fp].grave[gi]}, "異次元の女戦士");
      }
    }
    // 自身が場に残っていれば除外、既に墓地なら墓地から除外する
    const mi = gameState.players[ctx.player].mz.indexOf(ctx.card);
    if(mi>=0){ API.banish({p:ctx.player, zone:'mz', index:mi, card:ctx.card}, "異次元の女戦士"); }
    else {
      const gi = gameState.players[ctx.player].grave.indexOf(ctx.card);
      if(gi>=0) API.banish({p:ctx.player, zone:'grave', index:gi, card:ctx.card}, "異次元の女戦士");
    }
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){
      const b = ctx.battle||{};
      // 戦闘で破壊されて墓地にいても、その戦闘に参加していれば誘発する
      return inBattle(ctx, b);
    }
  }
});

/* ---- ゴブリンゾンビ（戦闘ダメージを与えたら相手デッキトップを落とす） ----
   S03-U156: both effects are forced (「…墓地へ送る」「…手札に加える」). ② is 「このカードがフィールド上から墓地へ送られた時」 —
   it used to trigger on ANY card sent to the GY from anywhere (passive onSendToGrave with no self / zone check); it now uses the
   shared field→GY event of the deck-trigger engine (engine/1ZT). No candidate: the effect still resolves (the Deck is shuffled). */
const GOBLIN_ZOMBIE_TRIGGER_S03 = {when:'fieldToGrave', action:'search', optional:false, filter:{ra:'アンデット', defmax:1200}};
defineScript("ゴブリンゾンビ", {
  type:"monster", priority:1, forced:true,
  condition(ctx){
    if(ctx.zone==='grave'){
      if(!deckTriggerHappenedS03(ctx, GOBLIN_ZOMBIE_TRIGGER_S03)){ ctx.reason = "このカードがフィールドから墓地へ送られた時に発動します"; return false; }
      return true;
    }
    const b = ctx.battle || gameState.lastBattle;
    if(!b || b.atkCard!==ctx.card || !b.damage){ ctx.reason="戦闘ダメージを与えた時に発動します"; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    if(ctx.zone==='grave'){
      /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
      const t = deckTriggerPoolS03('ゴブリンゾンビ', GOBLIN_ZOMBIE_TRIGGER_S03, ctx.player);
      if(!t.length){ API.shuffle(ctx.player); API.log('ゴブリンゾンビ：条件を満たすカードがデッキに無い（デッキをシャッフル）'); return; }
      API.requestChoice({player:ctx.player, kind:'card', title:"ゴブリンゾンビ：手札に加えるアンデット族",
        candidates:t, min:1, max:1, cancelable:false,
        resume:{handler:'s03u58.deck-search', args:{player:ctx.player, reason:'ゴブリンゾンビ'}},
        meta:{scriptName:'ゴブリンゾンビ'}});
      return;
    }
    API.millTop(ctx.opponent, 1, "ゴブリンゾンビ");
  },
  afterResolve(){},
  passive:{
    onLeaveField(ctx){ return deckTriggerHappenedS03(ctx, GOBLIN_ZOMBIE_TRIGGER_S03); },
    onDamageStep(ctx){
      const b = ctx.battle||{};
      return ctx.zone==='mz' && b.atkCard===ctx.card && b.damage>0;
    }
  }
});

/* ---- 霊滅術師 カイクウ（戦闘ダメージ時に相手墓地を2体まで除外） ---- */
defineScript("霊滅術師 カイクウ", {
  dsTiming:"after",              // ④ 戦闘ダメージを与えた時
  type:"monster", priority:1, quickEffect:false,
  condition(ctx){
    const g = API.pileCards(ctx.opponent,'grave',x=>x.db.k==='m');
    if(!g.length){ ctx.reason = "相手の墓地にモンスターがいません"; return false; }
    const b = ctx.battle || gameState.lastBattle;
    if(!b || b.atkCard!==ctx.card || !b.damage){
      ctx.reason = "相手ライフに戦闘ダメージを与えた時に発動します"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    const chosen=[];
    const step=()=>{
      const left = API.pileCards(ctx.opponent,'grave',x=>x.db.k==='m')
        .filter(x=>chosen.every(c=>c.card!==x.card));
      if(chosen.length>=2 || !left.length){ done(chosen); return; }
      API.selectCard(`カイクウ：除外する相手墓地のモンスター（${chosen.length+1}/2・任意）`, left,
        t=>{ chosen.push(t); step(); }, "やめると確定");
    };
    step();
  },
  resolve(ctx){ (ctx.selectedTargets||[]).forEach(t=>API.banish(t, "霊滅術師 カイクウ")); },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){
      const b = ctx.battle||{};
      return ctx.zone==='mz' && b.atkCard===ctx.card && b.damage>0;
    }
  }
});

/* ---- オネスト（自分の光属性の攻撃力を相手の攻撃力分アップ） ---- */
/* S03-U299 (hand-trigger audit): オネスト is a Quick Effect (Spell Speed 2) that is activated from the hand during the Damage Step while one of your LIGHT monsters
   battles. It lacked quickEffect:true, so getChainResponsesV2 never offered it in the Damage Step windows of a real duel (it could only be forced by a direct
   call), and its condition accepted any LIGHT monster on the field. Now: quickEffect, and it needs a LIGHT monster of the activator that is in the battle; only
   that battling monster is chosen, with the opposing battler as the ATK source. */
function honestBattlersS299(ctx){
  const b = ctx.battle || (typeof battleContextV28==='function' ? battleContextV28() : null) || {};
  const out = [];
  const isLight = c => c && c.face==='up' && dbOf(c).at==='光';
  if(b.atkOwner===ctx.player && isLight(b.atkCard) && !!locateCard(b.atkCard)) out.push({me:b.atkCard, foe:b.defCard||null});
  if(b.defOwner===ctx.player && isLight(b.defCard) && !!locateCard(b.defCard)) out.push({me:b.defCard, foe:b.atkCard||null});
  return out;
}
defineScript("オネスト", {
  damageStepOnly:true,          // ③-ⅰ ダメージ計算時まで発動できる
  type:"monster", priority:2, quickEffect:true,
  activateFrom:["hand"],
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = "手札から発動します"; return false; }
    if(gameState.phase!=='battle'){ ctx.reason = "ダメージステップに発動します"; return false; }
    if(!gameState.battle){ ctx.reason = "ダメージステップに発動します"; return false; }
    if(!honestBattlersS299(ctx).length){ ctx.reason = "自分の光属性モンスターが戦闘を行っていません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const pairs = honestBattlersS299(ctx);
    const pick = pr => {
      const meLoc = locateCard(pr.me), foeLoc = pr.foe ? locateCard(pr.foe) : null;
      const me = {p:meLoc.p, zone:meLoc.zone, index:meLoc.index, card:pr.me, db:dbOf(pr.me)};
      const foe = foeLoc ? {p:foeLoc.p, zone:foeLoc.zone, index:foeLoc.index, card:pr.foe, db:dbOf(pr.foe)} : null;
      done(foe ? [me, foe] : [me]);
    };
    if(pairs.length===1){ pick(pairs[0]); return; }
    API.selectCard("オネスト：攻撃力を上げる光属性", pairs.map(pr=>{ const l=locateCard(pr.me); return {p:l.p, zone:l.zone, index:l.index, card:pr.me, db:dbOf(pr.me)}; }),
      me=>pick(pairs.find(pr=>pr.me===me.card)));
  },
  resolve(ctx){
    const [me, foe] = ctx.selectedTargets;
    if(!me) return;
    const add = foe ? API.curAtk(foe) : 0;
    API.modAtk(me, add, 0, 'endTurn', 'オネスト');
    API.log(`オネスト：${labelOf(me.card)} の攻撃力が ${add} アップ`);
  },
  /* S03-U306: 「このカードを手札から墓地へ送って発動できる」 — the Graveyard send is the cost, paid at activation (like 速攻のかかし, S03-U152).
     It used to be discarded after resolution, so the card stayed in the hand while on the chain and could be put on the chain again and again
     (a responder loop found by the major-deck sweep: worm vs agent, seed 0x53040018, the chain grew without end). */
  cost(ctx, done){ a6HandCost(ctx, done, 'オネスト'); },
  afterResolve(){}
});

/* ---- N・グラン・モール（戦闘時にお互い手札へ戻る） ---- */
defineScript("N・グラン・モール", {
  dsTiming:"start",              // ① ダメージステップ開始時
  type:"monster", priority:1,
  condition(ctx){
    const b = ctx.battle || gameState.lastBattle;
    if(!inBattle(ctx, b)){
      ctx.reason = "このカードが戦闘を行う時に発動します"; return false;
    }
    /* S03-U137: 「相手モンスターと戦闘を行う」— a direct attack is not a battle with a monster (it used to bounce itself, dealing no damage) */
    if(!b || !b.atkCard || !b.defCard){ ctx.reason = "相手モンスターと戦闘を行う時に発動します"; return false; }
    return true;
  },
  resolve(ctx){
    const b = ctx.battle || gameState.lastBattle; if(!b) return;
    const iWasAtk = (b.atkCard===ctx.card) ||
                    (ctx.player===b.atkOwner && cardName(ctx.card)===b.atkName);
    const foe = iWasAtk ? b.defCard : b.atkCard;
    const fp  = iWasAtk ? b.defOwner : b.atkOwner;
    if(foe){
      const i = gameState.players[fp].mz.indexOf(foe);
      if(i>=0) API.returnToHand({p:fp, zone:'mz', index:i, card:foe}, "N・グラン・モール");
    }
    const mi = gameState.players[ctx.player].mz.indexOf(ctx.card);
    if(mi>=0) API.returnToHand({p:ctx.player, zone:'mz', index:mi, card:ctx.card}, "N・グラン・モール");
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){
      const b = ctx.battle||{};
      return !!(b.atkCard && b.defCard) && (b.atkCard===ctx.card || b.defCard===ctx.card);   /* S03-U137: not on a direct attack */
    }
  }
});


/* =========================================================================
   1103環境の制限・準制限カード（スクリプト化できるもの）
   ========================================================================= */

/* ---- ダーク・アームド・ドラゴン ---- */
/* S03-U127: ダーク・アームド・ドラゴン
   このカードは通常召喚できない。自分の墓地の闇属性モンスターが3体の場合のみ特殊召喚できる。
   ①:自分の墓地から闇属性モンスター1体を除外し、フィールドのカード1枚を対象として発動できる。そのカードを破壊する。
   以前は特殊召喚が「手札で発動する効果」（チェーンに乗り、召喚無効の対象にならない）として実装され、①の除外コストは
   解決時に払っていた。特殊召喚は summonProcedure（チェーンを作らない。正規の方法として記録される — S03-U127）、
   ①はコスト（除外）を発動時に払う。 */
function dadDarkInGraveS03(p){ return API.pileCards(p,'grave',x=>x.db.k==='m' && ((typeof currentAttributeV17==='function')?currentAttributeV17(x.card):x.db.at)==='闇'); }
function dadSummonConditionS03(ctx){
  const n = dadDarkInGraveS03(ctx.player).length;
  if(n!==3){ ctx.reason = `墓地の闇属性モンスターがちょうど3体の場合のみ特殊召喚できます（現在${n}体）`; return false; }
  return true;
}
defineScript("ダーク・アームド・ドラゴン", {
  targets:true,                 // ①は対象を取る
  type:"monster", priority:1, quickEffect:false, timing:['mainPhase'],
  summonProcedure:{ from:'hand', positions:['atk','def'], condition:dadSummonConditionS03 },
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = "フィールドで表側表示の時に発動します"; return false; }
    if(!dadDarkInGraveS03(ctx.player).length){ ctx.reason = "墓地に闇属性モンスターがいません"; return false; }
    if(!API.fieldCards({filter:x=>!!x.card}).length){ ctx.reason = "破壊するカードがありません"; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard("ダーク・アームド・ドラゴン：除外する墓地の闇属性モンスター（コスト）", dadDarkInGraveS03(ctx.player), d=>{
      API.banish(d, "ダーク・アームド・ドラゴン（コスト）"); done(true);
    });
  },
  selectTargets(ctx, done){
    API.selectCard("ダーク・アームド・ドラゴン：破壊するフィールドのカード", API.fieldCards({filter:x=>!!x.card}), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r) API.destroy(r, "ダーク・アームド・ドラゴン");
  },
  afterResolve(){}
});

/* ---- D－HERO ディアボリックガイ ---- */
defineScript("D－HERO ディアボリックガイ", {
  type:"monster", priority:1, quickEffect:false,
  activateFrom:["grave"],
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = "墓地で発動します"; return false; }
    const t = API.pileCards(ctx.player,'deck',x=>x.db.n==='D－HERO ディアボリックガイ');
    if(!t.length){ ctx.reason = "デッキに同名カードがいません"; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
    return true;
  },
  resolve(ctx){
    API.banish({p:ctx.player, zone:'grave', index:ctx.index, card:ctx.card}, "ディアボリックガイ（コスト）");
    const t = API.pileCards(ctx.player,'deck',x=>x.db.n==='D－HERO ディアボリックガイ');
    if(t.length) API.specialSummon(ctx.player, 'deck', t[0].index, 'atk', "D－HERO ディアボリックガイ");
  },
  afterResolve(){}
});

/* ---- デステニー・ドロー ---- */
defineScript("デステニー・ドロー", {
  /* S03-U192: 「手札から「D－HERO」カード1枚を捨てて発動できる」 — the discard is a cost (before: chosen as a target and discarded at resolution) */
  type:"spell", priority:1, quickEffect:false,
  condition(ctx){
    const hand = handCandidates(ctx, x=>String(x.db.n||'').indexOf('D－HERO')>=0);
    if(!hand.length){ ctx.reason = "手札に「D－HERO」カードがありません"; return false; }
    if(API.me(ctx).deck.length<2){ ctx.reason = "デッキが2枚未満です"; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard("デステニー・ドロー：捨てる「D－HERO」", handCandidates(ctx, x=>String(x.db.n||'').indexOf('D－HERO')>=0), t=>{
      const r = resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, "デステニー・ドロー（コスト）", {byEffect:false}); done(true);
    });
  },
  resolve(ctx){ API.draw(ctx.player, 2); }
});

/* ---- ダンディライオン ---- */
defineScript("ダンディライオン", {
  type:"monster", priority:1,
  condition(ctx){
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
    return true;
  },
  resolve(ctx){
    const room = ZONE_LIMITS.mz - API.me(ctx).mz.length;
    API.createToken(ctx.player,
      {name:"綿毛トークン", atk:0, def:0, lv:1, ra:"植物", at:"風", pos:'def'}, Math.min(2, room));
  },
  afterResolve(){},
  /* S03-U145: 「このカードが墓地へ送られた時」 — only its own event (it fired whenever any card was sent to the GY while it lay there) */
  passive:{ onSendToGrave(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx); } }
});

/* ---- ローンファイア・ブロッサム ---- */
defineScript("ローンファイア・ブロッサム", {
  countLimit:1,
  type:"monster", priority:1, quickEffect:false,
  condition(ctx){
    const plants = API.fieldCards({zone:'mz', player:ctx.player,
      filter:x=>x.card.face==='up' && x.db.ra==='植物'});
    if(!plants.length){ ctx.reason = "リリースする表側の植物族がいません"; return false; }
    const deck = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && !x.db.ex && x.db.ra==='植物');
    if(!deck.length){ ctx.reason = "デッキに植物族モンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    /* S03-U63: リリースする植物族はコスト的な宣言として発動時のまま。
       特殊召喚する植物族の選択は対象を取らないので解決時（現在のデッキ）に移す（S03-U58パターン）。 */
    const plants = API.fieldCards({zone:'mz', player:ctx.player,
      filter:x=>x.card.face==='up' && x.db.ra==='植物'});
    API.selectCard("ローンファイア：リリースする植物族", plants, r=>done([r]));
  },
  resolve(ctx){
    const r=ctx.selectedTargets[0];
    if(r) API.sendToGrave(r, "ローンファイア（リリース）");
    const deck = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && !x.db.ex && x.db.ra==='植物');
    if(!deck.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"ローンファイア：特殊召喚する植物族",
      candidates:deck, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-special', args:{player:ctx.player, pos:'atk', reason:'ローンファイア・ブロッサム'}},
      meta:{scriptName:'ローンファイア・ブロッサム'}});
  },
  afterResolve(){}
});

/* ---- ワン・フォー・ワン ---- */
defineScript("ワン・フォー・ワン", {
  type:"spell", priority:1, quickEffect:false,
  condition(ctx){
    const hand = handCandidates(ctx, x=>x.db.k==='m');
    if(!hand.length){ ctx.reason = "手札に捨てるモンスターがいません"; return false; }
    const lv1 = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && !x.db.ex && x.db.lv===1);
    if(!lv1.length){ ctx.reason = "デッキにレベル1モンスターがいません"; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const hand = handCandidates(ctx, x=>x.db.k==='m');
    API.selectCard("ワン・フォー・ワン：捨てるモンスター（コスト）", hand, h=>done([h]));
  },
  resolve(ctx){
    const [h]=ctx.selectedTargets;
    if(h) API.discard(ctx.player, h.index, "ワン・フォー・ワン（コスト）");
    const lv1 = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && !x.db.ex && x.db.lv===1);
    if(lv1.length) API.requestChoice({player:ctx.player, kind:'card', title:"ワン・フォー・ワン：特殊召喚するレベル1", candidates:lv1, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-special',args:{player:ctx.player,pos:'atk',reason:'ワン・フォー・ワン'}}, meta:{scriptName:'ワン・フォー・ワン'}});
  }
});

/* ---- ゴッドバードアタック ----
   2011年テキスト: 自分フィールド上に存在する鳥獣族モンスター1体をリリースして発動する。
   フィールド上に存在するカード2枚を選択して破壊する。
   S03-U111: 以前の実装は (1) リリースをコストではなく解決時に行い（リリースする鳥獣族を「対象」として選ばせ、
   発動が無効になってもリリースされず、チェーンで鳥獣族が除去されても破壊は通った）、
   (2) 対象が2枚そろわなくても発動でき、(3) 発動したこのカード自身を対象に選べた。
   デュアルスパーク（S03-U98）と同じ「コストでリリース → 対象選択」の順に直す。 */
function godBirdBirdsS03U111(ctx){
  return API.fieldCards({zone:'mz', player:ctx.player, filter:x=>x.db.ra==='鳥獣'});
}
/* 破壊対象の候補: フィールドのカードから、発動したこのカード自身と（指定があれば）リリースする鳥獣族を除く。 */
function godBirdTargetsS03U111(ctx, releasedCard){
  return API.fieldCards().filter(x=>x.card!==ctx.card && x.card!==releasedCard);
}
defineScript("ゴッドバードアタック", {
  targets:true,                 // 対象を取る効果
  type:"trap", priority:2,
  condition(ctx){
    const birds = godBirdBirdsS03U111(ctx);
    if(!birds.length){ ctx.reason = "リリースする鳥獣族がいません"; return false; }
    /* リリース後に対象2枚が残る鳥獣族が1体でもいれば発動できる。 */
    if(!birds.some(b=>godBirdTargetsS03U111(ctx, b.card).length>=2)){
      ctx.reason = "リリースする鳥獣族以外に対象にできるカードが2枚必要です"; return false;
    }
    return true;
  },
  cost(ctx, done){
    const birds = godBirdBirdsS03U111(ctx).filter(b=>godBirdTargetsS03U111(ctx, b.card).length>=2);
    API.selectCard("ゴッドバードアタック：リリースする鳥獣族（コスト）", birds, r=>{
      API.sendToGrave(r, "ゴッドバードアタック（リリース）");
      done(true);
    });
  },
  selectTargets(ctx, done){
    const picks=[];
    const step=()=>{
      const left = godBirdTargetsS03U111(ctx, null).filter(x=>picks.every(pk=>pk.card!==x.card));
      if(picks.length>=2 || !left.length){ done(picks); return; }
      API.selectCard(`ゴッドバードアタック：破壊するカード（${picks.length+1}/2）`, left,
        t=>{ picks.push(t); step(); });
    };
    step();
  },
  resolve(ctx){
    /* 対象のうち、解決時にまだフィールドに残っているものだけを破壊する。 */
    ctx.selectedTargets.forEach(t=>{ if(t && resolveTarget(t)) API.destroy(t, "ゴッドバードアタック"); });
  }
});

/* ---- カードガンナー ----
   2011年テキスト: 1ターンに1度、自分のデッキの上からカードを3枚まで墓地へ送る事ができる。この効果で墓地へ
   送ったカード1枚につき、このカードの攻撃力はエンドフェイズ時まで500ポイントアップする。また、自分フィールド上に
   存在するこのカードが破壊され墓地へ送られた時、自分のデッキからカードを1枚ドローする。
   S03-U113: 2011年当時は「送る」までが効果（コストではない：後年の「送って発動できる」は採らない）。
   以前の実装は (1) 送る枚数を選べず常に min(3, デッキ枚数) 枚を送り、(2) 破壊され墓地へ送られた時の
   強制ドローが丸ごと無かった。枚数は解決時に1〜3から選ぶ（SaveLoad安全なハンドラ）。
   「1ターンに1度」は起動効果だけに掛かる（誘発のドローは消費しない）。 */
API.registerChoiceHandler('s03u113.card-gunner-mill', (answer, args) => {
  const pk = answer && answer.cards && answer.cards[0];
  const want = Math.max(0, Math.min(3, Number(pk && pk.value) || 0));
  const P = gameState.players[args.player];
  const n = Math.min(want, (P.deck||[]).length);
  if(!n) return;
  API.millTop(args.player, n, "カードガンナー");
  const h = findCardByUid(args.uid);
  if(h && h.zone==='mz' && h.card.face==='up')
    API.modAtk({p:h.p, zone:'mz', index:h.index, card:h.card}, n*500, 0, 'endTurn', 'カードガンナー');
  API.log(`カードガンナー：${n}枚墓地へ送り、攻撃力+${n*500}`);
});
function cardGunnerDestroyedFromFieldS03U113(ctx){
  if(ctx.zone!=='grave' || !ctx.card) return false;
  const e = ctx.event || {};
  const self = (e.card && e.card===ctx.card) || (e.uid!=null && ctx.card.uid===e.uid);
  const gi = ctx.card.graveInfo;
  return !!(self && gi && gi.from==='mz' && gi.byDestroy);
}
defineUnifiedCardV4('カードガンナー',[{
  key:'mill-boost', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason="フィールドで表側表示の時に発動します"; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = "デッキが空です"; return false; }
    return true;
  },
  operation(ctx){
    const max = Math.min(3, API.me(ctx).deck.length);
    if(!max) return;
    ensureCardUid(gameState, ctx.card);
    const cands = [1,2,3].slice(0,max).map(k=>({key:String(k), label:`${k}枚`, value:k}));
    API.requestChoice({player:ctx.player, kind:'declare', title:"カードガンナー：デッキの上から墓地へ送る枚数",
      candidates:cands, min:1, max:1, cancelable:false,
      resume:{handler:'s03u113.card-gunner-mill', args:{player:ctx.player, uid:ctx.card.uid}},
      meta:{scriptName:"カードガンナー"}});
  },
  afterResolve(){}
},{
  key:'destroyed-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onDestroy'], forced:true,
  condition(ctx){ return cardGunnerDestroyedFromFieldS03U113(ctx); },
  operation(ctx){ API.draw(ctx.player, 1, "カードガンナー"); },
  afterResolve(){}
}],{type:'monster', priority:1, quickEffect:false, countLimit:{n:1, effects:['mill-boost']}, timing:['mainPhase'],
  passive:{ onDestroy(ctx){ return cardGunnerDestroyedFromFieldS03U113(ctx); } }});

/* ---- リミッター解除 ---- */
defineScript("リミッター解除", {
  type:"quick-play", priority:2,
  condition(ctx){
    const mech = API.fieldCards({zone:'mz', player:ctx.player,
      filter:x=>x.card.face==='up' && x.db.ra==='機械'});
    if(!mech.length){ ctx.reason = "自分フィールドに表側の機械族がいません"; return false; }
    return true;
  },
  resolve(ctx){
    const mech = API.fieldCards({zone:'mz', player:ctx.player,
      filter:x=>x.card.face==='up' && x.db.ra==='機械'});
    const uids = [];
    mech.forEach(m=>{
      const base = API.curAtk(m);
      API.modAtk(m, base, 0, 'endTurn', 'リミッター解除');
      ensureCardUid(gameState, m.card); uids.push(m.card.uid);
      API.setCardFlag(m, 'u154LimiterTurn', gameState.turn, 'リミッター解除', {silent:true});
    });
    API.log(`リミッター解除：機械族${mech.length}体の攻撃力が倍になった`);
    /* S03-U154: 「この効果が適用されているモンスターはこのターンのエンドフェイズに破壊される」 — the automated destroyUids reserve
       (was a reminder only). u154LimiterTurn is zone-local: a monster that left the field in between is not destroyed. */
    API.registerReserveEffect(ctx.player, "リミッター解除：エンドフェイズに破壊", "endPhase", "", {kind:'destroyUids', uids, flagKey:'u154LimiterTurn'});
  }
});

/* ---- 光の護封剣 ---- */
API.registerScheduleHandler('s03u154.swords-destroy', (args)=>{   /* S03-U154 */
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(h && (h.zone==='sz' || h.zone==='field') && Number(h.card.u154SwordsTurn)===Number(args.turn)) API.destroy(h, '光の護封剣');
});
defineScript("光の護封剣", {
  remainsOnFieldAfterResolve:true,   // S03-U07: 「このカードは発動後、フィールドに残り続け」
  continuous:{
    scope:'oppMonsters', from:['sz'],
    apply(){ return null; },
    cannotAttack(){ return true; }
  },
  type:"spell", priority:1, quickEffect:false,
  condition(){ return true; },
  resolve(ctx){
    const foes = API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>x.card.face==='down'});
    foes.forEach(f=>API.flip(f, 'up', "光の護封剣"));
    /* S03-U154: 「相手ターンで数えて3ターン後の相手エンドフェイズに破壊される」 — scheduled (was only a reminder). Activated in its
       controller's turn T, the opponent's 3rd turn is T+5. The mark u154SwordsTurn is zone-local: if this card left the field in
       between, it is not destroyed. */
    const me = locateCardAnyV4(ctx.card);
    if(me && (me.zone==='sz' || me.zone==='field')){
      ensureCardUid(gameState, ctx.card);
      API.setCardFlag(me, 'u154SwordsTurn', gameState.turn, '光の護封剣', {silent:true});
      API.schedule({at:'endPhase', turns:(gameState.activePlayer===ctx.player?5:4), player:ctx.opponent, handler:'s03u154.swords-destroy',
        args:{uid:ctx.card.uid, turn:gameState.turn}, note:'光の護封剣（3ターン後の相手エンドフェイズに破壊）'});
    }
    API.log("光の護封剣：相手モンスターは攻撃宣言できない（相手ターンで数えて3ターン後のエンドフェイズに破壊）");
  },
  afterResolve(){}   // 発動後フィールドに残る
});

/* ---- 名推理 ---- */
function u154NormalSummonable(db){
  if(!db || db.k!=='m' || db.ex) return false;
  const st = db.st || [];
  if(st.indexOf('儀式')>=0) return false;
  return !/このカードは通常召喚できない/.test(String(db.e||''));
}
API.registerChoiceHandler('s03u154.meisuiri', (answer, x)=>{
  const pick = answer && answer.cards && answer.cards[0];
  const lv = Number(pick && pick.value) || 0;
  const p = x.player;
  API.log(`名推理：相手はレベル${lv}を宣言`);
  const P = gameState.players[p];
  let hit=null, flipped=0;
  while(P.deck.length && flipped<60){
    const db = dbOf(P.deck[0]); flipped++;
    if(u154NormalSummonable(db)){ hit=db; break; }
    API.millTop(p, 1, "名推理");
  }
  if(!hit){ API.log("名推理：通常召喚可能なモンスターが出なかった"); return; }
  if(curLVdbS154(hit)===lv){ API.log(`名推理：レベル${hit.lv}で的中 → 墓地へ`); API.millTop(p, 1, "名推理（的中）"); }
  else { API.log(`名推理：レベル${hit.lv}で外れ → ${hit.n} を特殊召喚`); API.specialSummon(p, 'deck', 0, 'atk', "名推理"); }
});
function curLVdbS154(db){ return Number(db && db.lv) || 0; }
defineScript("名推理", {
  /* S03-U154: the opponent's level declaration was a browser prompt() (not journaled — Replay could not reproduce it). It is now a
     choice for the opponent. 「通常召喚可能なモンスター」 also excludes Extra Deck / Ritual / 「通常召喚できない」 monsters. */
  type:"spell", priority:1, quickEffect:false,
  condition(ctx){
    if(!API.me(ctx).deck.length){ ctx.reason = "デッキが空です"; return false; }
    return true;
  },
  resolve(ctx){
    API.requestChoice({player:ctx.opponent, kind:'declare', title:'名推理：レベルを宣言（1～12）',
      candidates:Array.from({length:12},(_,k)=>({key:'lv'+(k+1), label:'レベル'+(k+1), value:k+1})), min:1, max:1, cancelable:false,
      resume:{handler:'s03u154.meisuiri', args:{player:ctx.player}}, meta:{scriptName:'名推理'}});
  }
});

/* ---- モンスターゲート ---- */
/* S03-U194 (text): 「自分フィールドのモンスター1体をリリースして発動できる。通常召喚可能なモンスターが出るまで自分のデッキの上からカードを
   めくり、そのモンスターを特殊召喚する。残りのめくったカードは全て墓地へ送る。」 — the Tribute is a cost (before: chosen as a target and
   sent at resolution); 「通常召喚可能」 excludes monsters that cannot be Normal Summoned and Ritual Monsters (cannotNormalSummonS03; before:
   any Main Deck monster); the revealed cards go to the GY after the summon. */
function monsterGateIndexS03(p){
  const D = gameState.players[p].deck || [];
  return D.findIndex(c=>{ const d = dbOf(c); return d && d.k==='m' && !d.ex && !cannotNormalSummonS03(d); });
}
defineScript("モンスターゲート", {
  type:"spell", priority:1, quickEffect:false,
  condition(ctx){
    if(!API.me(ctx).mz.length){ ctx.reason = "リリースするモンスターがいません"; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = "デッキが空です"; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard("モンスターゲート：リリースするモンスター", API.fieldCards({zone:'mz', player:ctx.player}), t=>{
      const r = resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, "モンスターゲート（リリース）"); done(true);
    });
  },
  resolve(ctx){
    const k = monsterGateIndexS03(ctx.player);
    if(k < 0){
      const n = gameState.players[ctx.player].deck.length;
      API.log("モンスターゲート：通常召喚可能なモンスターが出なかった");
      if(n) API.millTop(ctx.player, n, "モンスターゲート（めくったカード）");
      return;
    }
    const mon = gameState.players[ctx.player].deck[k];
    const muid = ensureCardUid(gameState, mon);
    API.log(`モンスターゲート：${k+1}枚めくり、${cardName(mon)} を特殊召喚`);
    /* the other revealed cards (above it) go to the GY; a summon from the Deck shuffles the Deck, so they are sent first */
    if(k) API.millTop(ctx.player, k, "モンスターゲート（めくったカード）");
    const h = findCardByUid(muid);
    if(h && h.zone==='deck'){
      if(hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'deck', h.index, 'atk', "モンスターゲート");
      const h2 = findCardByUid(muid);
      if(h2 && h2.zone==='deck') API.mill(ctx.player, h2.index, "モンスターゲート（めくったカード）");
    }
  }
});

/* ---- おジャマトリオ ---- */
/* S03-U195 (text): 「相手フィールドに「おジャマトークン」(獣族・光・星2・攻0/守1000)3体を守備表示で特殊召喚する。このトークンはアドバンス召喚の
   ためにはリリースできない。「おジャマトークン」が破壊された時にそのコントローラーは1体につき300ダメージを受ける。」 — before: fewer than 3 when
   the opponent had less room, no Tribute restriction, and the damage was a log line. Now: 3 free zones needed; noAdvanceTributeS03;
   destroyDamageS03 (engine/1A + engine/18: a journaled LP Action at the rule processing point). */
defineScript("おジャマトリオ", {
  type:"trap", priority:1, quickEffect:false,
  condition(ctx){
    if(ZONE_LIMITS.mz - API.foe(ctx).mz.length < 3){ ctx.reason = "相手のモンスターゾーンが3つ空いていません"; return false; }
    return true;
  },
  resolve(ctx){
    if(ZONE_LIMITS.mz - API.foe(ctx).mz.length < 3){ API.log("おジャマトリオ：相手のモンスターゾーンが3つ空いていないため特殊召喚できない"); return; }
    API.createToken(ctx.opponent,
      {name:"おジャマトークン", atk:0, def:1000, lv:2, ra:"獣", at:"光", pos:'def', noAdvanceTributeS03:true, destroyDamageS03:300}, 3);
  }
});

/* ---- 停戦協定 ---- */
/* S03-U194 (text): 「フィールドに効果モンスターまたは裏側守備表示モンスターが存在する場合に発動できる。フィールドの裏側守備表示モンスターを
   全て表側守備表示にする。この時、リバースモンスターの効果は発動しない。フィールドの効果モンスターの数×500ダメージを相手に与える。」 —
   before: any monster allowed the activation and only the opponent's effect monsters were counted. The flip is FX_SET_STATE (no flip event). */
function ceasefireEffectMonstersS03(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && (x.db.st||[]).indexOf('効果')>=0}); }
defineScript("停戦協定", {
  type:"trap", priority:2,
  condition(ctx){
    const fd = API.fieldCards({zone:'mz', filter:x=>x.card.face==='down' && x.card.pos==='def'}).length;
    if(!fd && !ceasefireEffectMonstersS03().length){ ctx.reason = "効果モンスターまたは裏側守備表示モンスターが存在しません"; return false; }
    return true;
  },
  resolve(ctx){
    API.fieldCards({zone:'mz', filter:x=>x.card.face==='down' && x.card.pos==='def'}).forEach(x=>{
      const h = findCardByUid(ensureCardUid(gameState, x.card)); if(h) API.flip(h, 'up', "停戦協定");
    });
    const eff = ceasefireEffectMonstersS03().length;
    if(eff) API.damageLP(ctx.opponent, eff*500);
    API.log(`停戦協定：フィールドの効果モンスター${eff}体 × 500ダメージ`);
  }
});

/* ---- マインドクラッシュ ----
   S03-U62: resolve() 内の legacy API.selectCard（宣言が外れた場合の自分の1枚捨て）を
   SaveLoad安全な登録済みハンドラへ移行。prompt() によるカード名宣言そのものは
   このカードに限らない別種のManual限定gapであり、この単位では対象外（既知の残課題として記録）。 */
API.registerChoiceHandler('s03u62.mind-crush-self-discard', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(h && h.zone==='hand') API.discard(args.player, h.index, "マインドクラッシュ");
});
defineScript("マインドクラッシュ", {
  /* S03-U154: the card name was declared through a browser prompt() at resolution (not journaled; Replay could not reproduce it).
     It is now declared at activation (API.declare 'cardName', as 異次元の指名者). The text says the controller discards a card
     「ランダムに1枚選んで」 — it was the controller's free choice. */
  type:"trap", priority:2,
  condition(ctx){ return true; },
  activationV11(ctx, d){ API.declare(ctx, 'cardName', {title:'マインドクラッシュ：カード名を宣言', values:p11cNames(false), activation:d, cancelable:false}, {handler:'p11cards.declare-commit', args:{}}); },
  resolve(ctx){
    const ref = p11cDeclaredDb(ctx);
    const nm = ref ? ref.n : '';
    const foe = gameState.players[ctx.opponent];
    const hit = ref ? foe.hand.map((c,i)=>({c,i})).filter(x=>sameCanonicalCardV4(dbOf(x.c), ref)) : [];
    if(hit.length){
      hit.sort((a,b)=>b.i-a.i).forEach(x=>API.discard(ctx.opponent, x.i, "マインドクラッシュ"));
      API.log(`マインドクラッシュ：${nm} を${hit.length}枚捨てさせた`);
    } else {
      API.log(`マインドクラッシュ：${nm} は相手の手札に無い → 自分が手札をランダムに1枚捨てる`);
      const P = API.me(ctx);
      if(P.hand.length) API.discard(ctx.player, duelRandomInt(P.hand.length), "マインドクラッシュ");
    }
  }
});

/* ---- ダスト・シュート ---- */
defineScript("ダスト・シュート", {
  type:"trap", priority:2,
  condition(ctx){
    if(API.foe(ctx).hand.length<4){ ctx.reason = "相手の手札が4枚未満です"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const foe = gameState.players[ctx.opponent];
    const mons = foe.hand.map((c,i)=>({p:ctx.opponent,zone:'hand',index:i,card:c,db:dbOf(c)}))
      .filter(x=>x.db.k==='m');
    if(!mons.length){ showToast("相手の手札にモンスターがいません"); done([]); return; }
    API.selectCard("ダスト・シュート：デッキに戻すモンスター", mons, t=>done([t]), "相手の手札を確認");
  },
  resolve(ctx){
    const t=ctx.selectedTargets[0]; if(!t) return;
    act({type:"FX_RETURN_DECK", player:ctx.opponent, zone:'hand', index:t.index, toBottom:false, reason:"ダスト・シュート"});
    API.shuffle(ctx.opponent);
  }
});

/* ---- 血の代償（1103では無制限） ---- */
defineScript("血の代償", {
  /* S03-U104: 実際のテキストは「この効果は自分のメインフェイズ時及び相手のバトルフェイズ時にのみ
     発動できる」というタイミング限定。以前はこの制限が一切実装されておらず、あらゆるフェイズ・
     どちらのターンでも発動できてしまっていた（相手のメインフェイズ・自分のバトルフェイズ・
     自分のエンドフェイズ等、実戦で確認済みの実在バグ）。「自分の」「相手の」という手番の区別が
     必要なので、汎用の timing 配列だけでは表現できず condition() で直接判定する。 */
  fieldIgnition:true,          // 表側で場に残ったまま効果を発動できる
  type:"continuous-trap", priority:2,
  condition(ctx){
    const myMain = gameState.activePlayer===ctx.player && (gameState.phase==='main1'||gameState.phase==='main2');
    const foeBattle = gameState.activePlayer===ctx.opponent && gameState.phase==='battle';
    if(!myMain && !foeBattle){
      ctx.reason = "自分のメインフェイズ、または相手のバトルフェイズにのみ発動できます"; return false;
    }
    if(API.me(ctx).lp<500){ ctx.reason = "LPが500未満です"; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
    /* S03-U105: 「モンスターがいる」だけでなく、実際にリリースを払って通常召喚できる
       （通常召喚方法が1つでもある）モンスターが必要。 */
    if(!API.me(ctx).hand.some(c=>{
      const db=dbOf(c); return db.k==='m' && normalSummonMethodsFor(db,ctx.player,'summon').length>0;
    })){
      ctx.reason = "通常召喚できるモンスターが手札にありません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    const hand = API.me(ctx).hand.map((c,i)=>({p:ctx.player,zone:'hand',index:i,card:c,db:dbOf(c)}))
      .filter(x=>x.db.k==='m' && normalSummonMethodsFor(x.db,ctx.player,'summon').length>0);
    API.selectCard("血の代償：500払って通常召喚するモンスター", hand, h=>done([h]));
  },
  cost(ctx, done){
    if(API.me(ctx).lp < 500){ showToast("LPが足りません"); done(false); return; }
    API.payCost(ctx.player, 500);
    done(true);
  },
  /* S03-U105: 以前はリリースの支払いを一切せず raw FX_SPECIAL_SUMMON を直接発火しており、
     どんなレベルのモンスターも無償で通常召喚扱い特殊召喚できてしまっていた（実戦で確認済みの
     実在バグ：本来2体リリースが必要なレベル8モンスターが無償で場に出た）。
     通常召喚の本体手順（doNormalSummon 等、engine/70_summon_procedures.js）はUI操作前提で
     resolve() から直接は呼べないため、同じロジック（normalSummonMethodsFor / tributeValueOptions /
     tributeCandidatesForV23）を再利用しつつ、resolve() から安全に呼べる API.selectCard ベースの
     再帰リリース選択を新規に書く。 */
  resolve(ctx){
    const h=ctx.selectedTargets[0]; if(!h) return;
    const r=resolveTarget(h); if(!r||r.zone!=='hand') return;
    const db=dbOf(r.card);
    const methods=normalSummonMethodsFor(db,ctx.player,'summon');
    if(!methods.length){ API.log("血の代償：通常召喚できないため不発"); return; }
    s03BloodOfferTributeThenSummon(ctx.player, r.card, methods[0], db, []);
  },
  afterResolve(){}
});
/* リリース（アドバンス召喚のコスト）を必要数（method.tributes）ぶん real に選ばせてから、
   選ばれた本命モンスターを通常召喚扱いで特殊召喚する。
   pickTributes（engine/70_summon_procedures.js）と同じロジックだが、あちらは
   openPick/showToast/gameState.activePlayer に直結したUI操作前提の実装で、
   resolve() の中から安全に呼べないため、API.selectCard ベースで書き直す。 */
function s03BloodOfferTributeThenSummon(p, targetCard, method, db, chosen){
  const need = method.tributes||0;
  const spent = chosen.reduce((s,x)=>s+(x.value||1),0);
  const remaining = need-spent;
  if(remaining<=0){
    chosen.forEach(ent=>{
      const loc=locateCardAnyV4(ent.card);
      if(loc) API.sendToGrave(loc, "血の代償（アドバンス召喚のリリース）");
    });
    const hr=locateCardAnyV4(targetCard);
    if(!hr||hr.zone!=='hand') return;
    act({type:"FX_SPECIAL_SUMMON", player:p, from:'hand', fromIndex:hr.index, pos:'atk', reason:"血の代償（通常召喚扱い）"});
    return;
  }
  const used=new Set(chosen.map(x=>x.card));
  const left=tributeCandidatesForV23(p,db,method,'summon').filter(x=>!used.has(x.card));
  if(!left.length){ API.log(`血の代償：リリースが足りません（あと${remaining}体分必要）`); return; }
  API.selectCard(`血の代償：リリースするモンスター（残り${remaining}体分）`, left, x=>{
    const vals=tributeValueOptions(x.card,db).filter(v=>v<=remaining);
    const value=vals.length?vals[vals.length-1]:1;
    chosen.push({card:x.card,value});
    s03BloodOfferTributeThenSummon(p,targetCard,method,db,chosen);
  });
}


/* ---- 極星獣タングニョースト（戦闘破壊された時に手札から特殊召喚） ---- */
defineScript("極星獣タングニョースト", {
  countLimit:1,
  type:"monster", priority:2,
  activateFrom:["hand"],
  condition(ctx){
    if(ctx.zone==='hand'){
      if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
      const b = ctx.battle || gameState.lastBattle;
      const lost = b && ((b.destroyedAtk && b.atkOwner===ctx.player) ||
                         (b.destroyedDef && b.defOwner===ctx.player));
      if(!lost){ ctx.reason = "自分のモンスターが戦闘破壊された時に発動します"; return false; }
      return true;
    }
    // 場での効果：守備→攻撃になった時に極星獣をリクルート
    const t = API.pileCards(ctx.player,'deck',
      x=>x.db.k==='m' && !x.db.ex && String(x.db.n||'').indexOf('極星獣')>=0 && x.db.n!=='極星獣タングニョースト');
    if(!t.length){ ctx.reason = "デッキに他の「極星獣」がいません"; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    if(ctx.zone==='hand'){
      API.specialSummon(ctx.player, 'hand', ctx.index, 'atk', "極星獣タングニョースト");
      return;
    }
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const t = API.pileCards(ctx.player,'deck',
      x=>x.db.k==='m' && !x.db.ex && String(x.db.n||'').indexOf('極星獣')>=0 && x.db.n!=='極星獣タングニョースト');
    if(!t.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"タングニョースト：特殊召喚する「極星獣」",
      candidates:t, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-special', args:{player:ctx.player, pos:'def', reason:'極星獣タングニョースト'}},
      meta:{scriptName:'極星獣タングニョースト'}});
  },
  afterResolve(){}
});

/* ---- 極星獣タングリスニ（戦闘破壊されたらトークン2体） ---- */
defineScript("極星獣タングリスニ", {
  type:"monster", priority:1,
  activateFrom:["grave"],
  condition(ctx){
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
    return true;
  },
  resolve(ctx){
    const room = ZONE_LIMITS.mz - API.me(ctx).mz.length;
    API.createToken(ctx.player,
      {name:"極星獣トークン", atk:0, def:0, lv:3, ra:"獣", at:"地", pos:'def'}, Math.min(2, room));
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){
      const b = ctx.battle||{};
      return inBattle(ctx, b) && (b.destroyedAtk || b.destroyedDef);
    }
  }
});

/* ---- D.D.クロウ（手札から捨てて相手墓地を除外） ---- */
defineScript("D.D.クロウ", {
  targets:true,                 // 対象を取る効果
  type:"monster", priority:2,
  activateFrom:["hand"],
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = "手札から発動します"; return false; }
    const g = API.pileCards(ctx.opponent,'grave');
    if(!g.length){ ctx.reason = "相手の墓地にカードがありません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("D.D.クロウ：除外する相手墓地のカード",
      API.pileCards(ctx.opponent,'grave'), t=>done([t]));
  },
  resolve(ctx){
    const t=ctx.selectedTargets[0];
    if(t) API.banish(t, "D.D.クロウ");
  },
  afterResolve(ctx){ API.discard(ctx.player, ctx.index, "D.D.クロウ（コスト）"); }
});

/* ---- 速攻のかかし（直接攻撃を無効） ---- */
defineScript("速攻のかかし", {
  /* S03-U152: 2011 text 「①:相手モンスターの直接攻撃宣言時にこのカードを手札から捨てて発動できる。その攻撃を無効にし、その後バトルフェイズを
     終了する。」 Before: not a quick effect (never offered as a response in DUEL), any attack (not only direct), the discard after
     resolution instead of as the cost, and a manual note instead of the effect. Now like バトルフェーダー: a hand quick effect at a
     direct attack declaration, discard as cost, then negate the attack and end the Battle Phase (engine/1ZS). */
  type:'monster', priority:2, quickEffect:true, activateFrom:['hand'], timing:['attackDeclare'],
  condition(ctx){
    const a = gameState.pendingAttack;
    if(ctx.zone!=='hand' || gameState.phase!=='battle' || !a || a.player!==ctx.opponent || a.targetUid!=null){ ctx.reason = '相手モンスターの直接攻撃宣言時に手札から発動します'; return false; }
    return true;
  },
  cost(ctx, done){ a6HandCost(ctx, done, '速攻のかかし'); },
  resolve(ctx){
    API.negateAttack('速攻のかかし');
    endBattlePhaseByEffectS03('速攻のかかし');
  },
  afterResolve(){}
});

/* ---- 冥府の使者ゴーズ相当：クリボー（戦闘ダメージを0に） ---- */
/* S03-U153: クリボー is defined in cards/HZF_claude_s03_u153_manual_notes.js (this script only left a manual note). */


/* =========================================================================
   効果テキストから誘発タイミングを推定する
   スクリプト未実装のカードでも「今このカードが誘発する」と分かれば
   プレイヤーに提示できる。判定は保守的にし、確実な文言だけを拾う。
   ========================================================================= */
const TRIGGER_PATTERNS = [
  /* 墓地へ送られた時（フィールドから／どこからでも） */
  { key:'onSendToGrave', zone:['grave'],
    re:/(フィールド上?から)?墓地へ送られた(時|場合)/, jp:'墓地へ送られた時' },
  /* 破壊された時（戦闘・効果を問わない） */
  { key:'onDestroy', zone:['grave'],
    re:/(?<!戦闘によって)破壊され(て墓地へ送られ)?た(時|場合)/, jp:'破壊された時' },
  /* 戦闘で破壊された時 */
  { key:'onBattleDestroy', zone:['grave'],
    re:/戦闘に?よって破壊され|戦闘で破壊され/, jp:'戦闘で破壊された時' },
  /* リバース */
  { key:'onFlip', zone:['mz'],
    re:/リバースした(時|場合)|反転召喚に成功した(時|場合)|リバース：/, jp:'リバースした時' },
  /* 召喚成功時 */
  { key:'onSummon', zone:['mz'],
    re:/(召喚|反転召喚|特殊召喚)に成功した(時|場合)/, jp:'召喚に成功した時' },
  /* 場を離れた時 */
  { key:'onRemove', zone:['grave','banish'],
    re:/フィールド上?を離れた(時|場合)/, jp:'フィールドを離れた時' },
  /* スタンバイフェイズ */
  { key:'onStandby', zone:['mz','sz','field','grave'],
    re:/スタンバイフェイズ(時|に)/, jp:'スタンバイフェイズ' },
  /* エンドフェイズ */
  { key:'onEndPhase', zone:['mz','sz','field','grave'],
    re:/エンドフェイズ(時|に)/, jp:'エンドフェイズ' },
];

/* カードの誘発タイミングを返す（キャッシュ付き） */
const TRIGGER_CACHE = new Map();
function detectTriggers(db){
  if(!db || !db.n) return [];
  if(TRIGGER_CACHE.has(db.n)) return TRIGGER_CACHE.get(db.n);
  const e = String(db.e||"") + "\n" + String(db.e0||"");
  const out = [];
  TRIGGER_PATTERNS.forEach(t=>{
    try{ if(t.re.test(e)) out.push(t); }catch(err){}
  });
  TRIGGER_CACHE.set(db.n, out);
  return out;
}

/* いま起きた出来事に反応しうるカードを、テキストから推定して集める。
   evt: {key, player, card}  key は TRIGGER_PATTERNS の key
   返り値: [{p, zone, index, card, db, jp, script}] */
function detectedTriggerCards(evtKey, evt){
  const out = [];
  [0,1].forEach(p=>{
    const P = gameState.players[p];
    const scan = (zone, arr)=>{
      (arr||[]).forEach((c,i)=>{
        if(!c) return;
        const db = dbOf(c);
        if(!db.n) return;
        // スクリプトが同じ誘発を持っているならそちらに任せる
        const sc = CARD_SCRIPTS[db.n];
        if(sc && sc.passive) return;
        const hits = detectTriggers(db).filter(t=>t.key===evtKey && t.zone.indexOf(zone)>=0);
        if(!hits.length) return;
        // 自分自身が対象の出来事なら、そのカードに限定する
        if(evt && evt.card && evt.card !== c && evt.selfOnly) return;
        out.push({p, zone, index:i, card:c, db, jp:hits[0].jp, script:false});
      });
    };
    scan('mz', P.mz); scan('sz', P.sz);
    if(P.field) scan('field', [P.field]);
    scan('grave', P.grave); scan('hand', P.hand); scan('banish', P.banish);
  });
  return out;
}

/* 推定した誘発をプレイヤーに提示する。
   自動では発動せず、使うかどうかは必ず人が選ぶ。 */
function offerDetectedTriggers(evtKey, evt, after){
  const cands = detectedTriggerCards(evtKey, evt);
  if(!cands.length){ if(after) after(); return false; }
  DTRG_AFTER = after || null;
  setTimeout(()=>{
    const rows = cands.map((c,i)=>
      `<div class="act pick-row" onclick="__dtrgPick(${i})">
         <span class="pk-nm">${c.db.n}</span>
         <span class="pk-sub">${nameOf(c.p)}・${zoneJp(c.zone)}／${c.jp}</span>
       </div>`).join("");
    const jp = (TRIGGER_PATTERNS.find(t=>t.key===evtKey)||{}).jp || "誘発";
    sheet.innerHTML = `<div class="grip"></div>
      <h3 style="margin-bottom:4px">${jp}</h3>
      <div class="meta" style="margin-bottom:10px">
        効果テキストから、この場面で発動できそうなカードを見つけました。<br>
        処理内容は手動になります（誤検出なら「発動しない」を選んでください）。</div>
      <div class="pick-list">${rows}</div>
      <button class="close" onclick="__dtrgSkip()">発動しない</button>`;
    DTRG_CANDS = cands;
    veil.classList.add("on");
  }, 80);
  return true;
}
let DTRG_CANDS=[], DTRG_AFTER=null;
function __dtrgPick(i){
  const c = DTRG_CANDS[i]; DTRG_CANDS=[];
  closeSheet();
  const f = DTRG_AFTER; DTRG_AFTER=null;
  if(c){
    // スクリプトがあればそれを、無ければ効果テキストを見せて手動処理
    if(CARD_SCRIPTS[c.db.n]) runScript(c.db.n, c.p, c.zone, c.index, {});
    else openManualEffect(c);
  }
  if(f) f();
}
function __dtrgSkip(){
  DTRG_CANDS=[]; closeSheet();
  const f=DTRG_AFTER; DTRG_AFTER=null; if(f) f();
}

/* 効果テキストを見せて、汎用パレットで手動処理させる */
function openManualEffect(c){
  const e = String(c.db.e||"").replace(/\n/g,"<br>");
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">${c.db.n}</h3>
    <div class="meta" style="margin-bottom:8px">${c.jp}に発動する効果です。内容を確認して処理してください。</div>
    <div class="eff">${e}</div>
    <div class="act-grid wide">
      <div class="act fx" onclick="closeSheet();openPrimitives(${c.p},'${c.zone}',${c.index},${jsStr(c.db.n)})">効果処理パレットを開く</div>
      <div class="act" onclick="closeSheet()">閉じる</div>
    </div>`;
  veil.classList.add("on");
}


/* ---- 収縮（元々の攻撃力を半分に） ---- */
defineScript("収縮", {
  targets:true,                 // 対象を取る効果
  type:"quick-play", priority:2,
  condition(ctx){
    if(!API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}).length){
      ctx.reason="表側表示のモンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("収縮：攻撃力を半分にするモンスター",
      API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}), t=>done([t]));
  },
  resolve(ctx){
    const t=ctx.selectedTargets[0]; if(!t) return;
    const base = dbOf(t.card).atk||0;
    API.modAtk(t, -Math.floor(base/2), 0, 'endTurn', '収縮');
  }
});

/* ---- 突進（攻撃力700アップ） ---- */
defineScript("突進", {
  targets:true,                 // 対象を取る効果
  type:"quick-play", priority:2,
  condition(ctx){
    if(!API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}).length){
      ctx.reason="表側表示のモンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("突進：攻撃力を上げるモンスター",
      API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}), t=>done([t]));
  },
  resolve(ctx){
    const t=ctx.selectedTargets[0]; if(!t) return;
    API.modAtk(t, 700, 0, 'endTurn', '突進');
  }
});

// System v2.9: ダメージステップで直接攻守を変動できる代表的な速攻効果。
['収縮','突進','禁じられた聖杯'].forEach(n=>{ if(CARD_SCRIPTS[n]) CARD_SCRIPTS[n].damageStepLegal=true; });

/* S03-U62: resolve() 内の legacy API.selectCard（同値タイブレークの破壊対象選択）を
   SaveLoad安全な登録済みハンドラへ移行。地砕き・地割れで共有する。 */
API.registerChoiceHandler('s03u62.dest-lowest-stat-tiebreak', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(h) API.destroy(h, args.reason);
});
/* ---- 地砕き（守備力が一番高い相手モンスターを破壊） ---- */
defineScript("地砕き", {
  type:"spell", priority:1, quickEffect:false,
  condition(ctx){
    if(!API.foe(ctx).mz.length){ ctx.reason="相手フィールドにモンスターがいません"; return false; }
    return true;
  },
  resolve(ctx){
    const foes = API.fieldCards({zone:'mz', player:ctx.opponent});
    if(!foes.length) return;
    const max = Math.max(...foes.map(x=>curDEF(x.card)));
    const tops = foes.filter(x=>curDEF(x.card)===max);
    if(tops.length===1){ API.destroy(tops[0], "地砕き"); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:"地砕き：破壊するモンスター（同値のため選択）",
      candidates: tops, min:1, max:1, cancelable:false,   /* S03-U192: the destruction is mandatory — the tie is only a choice */
      resume:{handler:'s03u62.dest-lowest-stat-tiebreak', args:{reason:"地砕き"}},
      meta:{scriptName:"地砕き"}});
  }
});

/* ---- 地割れ（攻撃力が一番低い相手モンスターを破壊） ---- */
defineScript("地割れ", {
  type:"spell", priority:1, quickEffect:false,
  condition(ctx){
    if(!API.foe(ctx).mz.length){ ctx.reason="相手フィールドにモンスターがいません"; return false; }
    return true;
  },
  resolve(ctx){
    const foes = API.fieldCards({zone:'mz', player:ctx.opponent});
    if(!foes.length) return;
    const min = Math.min(...foes.map(x=>curATK(x.card)));
    const tops = foes.filter(x=>curATK(x.card)===min);
    if(tops.length===1){ API.destroy(tops[0], "地割れ"); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:"地割れ：破壊するモンスター（同値のため選択）",
      candidates: tops, min:1, max:1, cancelable:true,
      resume:{handler:'s03u62.dest-lowest-stat-tiebreak', args:{reason:"地割れ"}},
      meta:{scriptName:"地割れ"}});
  }
});

/* ---- エネミーコントローラー（表示形式変更 or コントロール奪取） ---- */
defineScript("エネミーコントローラー", {
  targets:true,                 // 対象を取る効果
  type:"quick-play", priority:2,
  condition(ctx){
    if(!API.foe(ctx).mz.length){ ctx.reason="相手フィールドにモンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.confirm("エネミーコントローラー",
      "効果を選んでください。<br>・はい：表示形式を変更<br>・いいえ：自分のモンスターをリリースしてコントロール奪取",
      ()=>{
        API.selectCard("表示形式を変更する相手モンスター",
          API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>x.card.face==='up'}),
          t=>done([{mode:'pos', t}]));
      },
      ()=>{
        /* S03-U155: 「自分フィールドのモンスター1体をリリースし、相手フィールドの表側表示モンスター1体を対象として発動できる」 — the
           release is paid here at activation (it was done at resolution), and only face-up monsters can be targeted. */
        const mine = API.fieldCards({zone:'mz', player:ctx.player});
        const foes = API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>x.card.face==='up'});
        if(!mine.length || !foes.length){ showToast(!mine.length?"リリースするモンスターがいません":"相手フィールドに表側表示のモンスターがいません"); done([]); return; }
        API.selectCard("リリースする自分のモンスター", mine, r=>{
          API.sendToGrave(r, "エネミーコントローラー（リリース）");
          API.selectCard("コントロールを得る相手の表側表示モンスター",
            API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>x.card.face==='up'}), t=>done([{mode:'take', t}]));
        });
      });
  },
  resolve(ctx){
    const sel = ctx.selectedTargets[0]; if(!sel) return;
    if(sel.mode==='pos'){
      const cur = sel.t.card.pos==='atk' ? 'def' : 'atk';
      API.changePosition(sel.t, cur, "エネミーコントローラー");
    } else {
      const t = resolveTarget(sel.t);
      if(!t || t.zone!=='mz' || t.p!==ctx.opponent || t.card.face!=='up') return;
      /* S03-U155: 「コントロールをエンドフェイズまで得る」 — until:'endPhase' (it was missing: the control change was permanent and the
         reserve below it was only a reminder). No attack / Tribute restriction in its text. */
      API.changeControl(t, ctx.player, "エネミーコントローラー", 'endPhase', null, {noAttack:false, noTribute:false});
    }
  }
});

/* ---- 抹殺の使徒（裏側モンスターを破壊して除外） ---- */
/* S03-U192 (text): 「フィールド上に裏側表示で存在するモンスター1体を選択して破壊し、ゲームから除外する。それがリバース効果モンスターだった場合、
   お互いのデッキを確認し、同名カードを全てゲームから除外する。」 — before: only banished (not destroyed) and the Deck part was a log line. */
function flipEffectMonsterS03(db){ return !!db && db.k==='m' && /リバース[：:]|このカードがリバースした(場合|時)/.test(String(db.e||'')); }
defineScript("抹殺の使徒", {
  type:"spell", priority:1, quickEffect:false, targets:true,
  condition(ctx){
    if(!API.fieldCards({zone:'mz', filter:x=>x.card.face==='down'}).length){
      ctx.reason="裏側表示のモンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("抹殺の使徒：破壊して除外する裏側モンスター",
      API.fieldCards({zone:'mz', filter:x=>x.card.face==='down'}), t=>done([t]));
  },
  resolve(ctx){
    const t0=ctx.selectedTargets[0], h=t0&&t0.card&&t0.card.uid!=null?findCardByUid(t0.card.uid):null;
    if(!h || h.zone!=='mz' || h.card.face!=='down'){ API.log("抹殺の使徒：対象が裏側表示で存在しないため不発"); return; }
    const d=dbOf(h.card), uid=h.card.uid;
    API.destroyAndBanish(h, "抹殺の使徒", ctx.player);
    const now=findCardByUid(uid);
    if(!now || now.zone!=='banish' || !flipEffectMonsterS03(d)) return;
    [ctx.player, ctx.opponent].forEach(p=>{
      const P=gameState.players[p];
      for(let i=(P.deck||[]).length-1;i>=0;i--){
        const c=P.deck[i];
        if(c && sameCanonicalCardV4(dbOf(c), d)) API.banish({p, zone:'deck', index:i, card:c}, "抹殺の使徒（デッキの同名カード）");
      }
      API.shuffle(p);
    });
  }
});
