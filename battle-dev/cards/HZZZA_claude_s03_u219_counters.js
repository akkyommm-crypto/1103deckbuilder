/* S03-U219: NOT_STARTED Counter Traps (2011 texts) — ツタン仮面, フォースフィールド, トラップ・ジャマー, ディザーム, パリィ.
   Each is a chain response to a card activation (onActivateSuccess; engine/1P declareActivationResponseS03) and negates it (and destroys the card). */

/* the chain link of the card activation this response answers (the top link, a card activation), or null */
function counterTopCardLinkS03(ctx, test){
  const e = ctx.event || {};
  const l = (gameState.chain||[])[Number(e.chainLink)-1];
  if(!l || l.cardActivationS03!==true) return null;
  return (!test || test(e, l)) ? l : null;
}
/* the face-up monsters on the field that a link targets (targeting scripts only) */
function linkTargetMonstersS03(l){
  return (typeof linkTargetUidsS03==='function' ? linkTargetUidsS03(l) : []).map(u=>findCardByUid(u)).filter(h=>h && h.zone==='mz' && h.card.face==='up');
}

/* ---- ツタン仮面: フィールド上に表側表示で存在するアンデット族モンスター1体を対象にする魔法・罠カードの発動を無効にし破壊する。 ---- */
function tutanLinkS03(ctx){
  return counterTopCardLinkS03(ctx, (e, l)=>{
    if(e.kind!=='spell' && e.kind!=='trap') return false;
    const ts = typeof linkTargetUidsS03==='function' ? linkTargetUidsS03(l) : [];
    const ms = linkTargetMonstersS03(l);
    return ts.length===1 && ms.length===1 && currentRaceV17(ms[0].card)==='アンデット';
  });
}
defineScript('ツタン仮面', {
  type:'trap', priority:3,
  condition(ctx){ if(!tutanLinkS03(ctx)){ ctx.reason = '表側表示のアンデット族1体を対象にする魔法・罠カードが発動した時に発動します'; return false; } return true; },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'ツタン仮面', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!tutanLinkS03(ctx); } }
});

/* ---- フォースフィールド: フィールド上のモンスター1体を対象にした魔法カードの発動を無効にし、そのカードを破壊する。 ---- */
function forceFieldLinkS03(ctx){
  return counterTopCardLinkS03(ctx, (e, l)=>{
    if(e.kind!=='spell') return false;
    const ts = typeof linkTargetUidsS03==='function' ? linkTargetUidsS03(l) : [];
    const ms = ts.map(u=>findCardByUid(u)).filter(h=>h && h.zone==='mz');
    return ts.length===1 && ms.length===1;
  });
}
defineScript('フォースフィールド', {
  type:'trap', priority:3,
  condition(ctx){ if(!forceFieldLinkS03(ctx)){ ctx.reason = 'モンスター1体を対象にした魔法カードが発動した時に発動します'; return false; } return true; },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'フォースフィールド', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!forceFieldLinkS03(ctx); } }
});

/* ---- トラップ・ジャマー: バトルフェイズ中のみ発動する事ができる。相手が発動した罠カードの発動を無効にし破壊する。 ---- */
function trapJammerLinkS03(ctx){ return gameState.phase==='battle' ? counterTopCardLinkS03(ctx, (e)=>e.kind==='trap' && e.player===ctx.opponent) : null; }
defineScript('トラップ・ジャマー', {
  type:'trap', priority:3,
  condition(ctx){ if(!trapJammerLinkS03(ctx)){ ctx.reason = 'バトルフェイズ中に、相手が罠カードを発動した時に発動します'; return false; } return true; },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'トラップ・ジャマー', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!trapJammerLinkS03(ctx); } }
});

/* ---- ディザーム / パリィ: 手札から「剣闘獣」と名のついたカード1枚をデッキに戻す（コスト）。魔法（パリィ：罠）カードの発動を無効にし、それを破壊する。 ---- */
function gladiatorHandS03(ctx){ return API.pileCards(ctx.player,'hand',x=>String(x.db.n||'').indexOf('剣闘獣')===0 && x.card!==ctx.card); }
function gladiatorCostS03(ctx, done, label){
  API.selectCard(label + '：デッキに戻す「剣闘獣」', gladiatorHandS03(ctx), t=>{
    const r = resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
    API.returnToDeck(r, false, label + '（コスト）'); API.shuffle(ctx.player); done(true);
  });
}
function disarmLinkS03(ctx){ return counterTopCardLinkS03(ctx, (e)=>e.kind==='spell'); }
defineScript('ディザーム', {
  type:'trap', priority:3,
  condition(ctx){
    if(!disarmLinkS03(ctx)){ ctx.reason = '魔法カードが発動した時に発動します'; return false; }
    if(!gladiatorHandS03(ctx).length){ ctx.reason = '手札に「剣闘獣」カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){ gladiatorCostS03(ctx, done, 'ディザーム'); },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'ディザーム', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!disarmLinkS03(ctx) && gladiatorHandS03(ctx).length>0; } }
});
function parryLinkS03(ctx){ return counterTopCardLinkS03(ctx, (e)=>e.kind==='trap'); }
defineScript('パリィ', {
  type:'trap', priority:3,
  condition(ctx){
    if(!parryLinkS03(ctx)){ ctx.reason = '罠カードが発動した時に発動します'; return false; }
    if(!gladiatorHandS03(ctx).length){ ctx.reason = '手札に「剣闘獣」カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){ gladiatorCostS03(ctx, done, 'パリィ'); },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'パリィ', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!parryLinkS03(ctx) && gladiatorHandS03(ctx).length>0; } }
});
declareActivationResponseS03(['ツタン仮面','フォースフィールド','トラップ・ジャマー','ディザーム','パリィ']);
