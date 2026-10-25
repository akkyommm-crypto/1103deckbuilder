/* Auto cycle 31 — 9枚。engine 変更なし。
     XXA 装備魔法（System v15 equipSpec / continuous from sz）
     XXB 罠が装備カードになる（cycle 28 幻獣の角の骨格）
     XXC モンスターを装備カード扱いにする（FX_MONSTER_EQUIP_V46）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function e0MyTurn(p){ return gameState.activePlayer === p; }
function e0MainPhase(p){
  return (gameState.phase === 'main1' || gameState.phase === 'main2') && e0MyTurn(p);
}
/* 装備カードが今ついているモンスター（ハンドル） */
function e0Host(card){
  const t = card && card.equipTo;
  if(!t || t.uid == null) return null;
  const h = findCardByUid(t.uid);
  return (h && h.zone === 'mz') ? h : null;
}
/* 装備先が戦闘で破壊され墓地へ送られたか。
   破壊された時点で装備は外れている事があるので、
   装備した時に刻んだ uid（e0EquipHostUid）でも照合する。 */
function e0HostUidOf(card){
  if(card && card.equipTo && card.equipTo.uid != null) return card.equipTo.uid;
  const k = Number(card && card.e0EquipHostUid);
  return Number.isFinite(k) ? k : null;
}
function e0HostBattleDead(ctx){
  const uid = e0HostUidOf(ctx.card);
  if(uid == null) return null;
  const b = ctx.battle || {};
  const victims = [];
  if(b.destroyedDef && b.defCard) victims.push(b.defCard);
  if(b.destroyedAtk && b.atkCard) victims.push(b.atkCard);
  for(const v of victims){ if(v && v.uid === uid) return v; }
  return null;
}
/* 自分フィールドの表側モンスター */
function e0MyFaceUp(p, f){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && (!f || f(x)) });
}
/* 名前を完全一致で1枚だけ探す（部分一致はしない） */
function e0NamedOnField(p, name){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.n === name });
}

/* ===================== A. 装備魔法 ===================== */

/* 1. アサルト・アーマー — 自分フィールドのモンスターが戦士族1体のみの場合に装備できる。
      ①装備モンスターの攻撃力は300アップする。
      ②装備されているこのカードを墓地へ送って発動でき、
        このターン、装備していたモンスターは1度のバトルフェイズ中に2回攻撃できる */
function e0OnlyOneWarrior(p){
  const all = API.fieldCards({ player:p, zone:'mz' });
  if(all.length !== 1) return null;
  return (all[0].db.ra === '戦士' && all[0].card.face === 'up') ? all[0] : null;
}
defineScript('アサルト・アーマー', {
  type:'spell', priority:1, targets:true, activateFrom:['sz'], timing:['mainPhase'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.ra === '戦士'); },
              label:'戦士族1体のみの場合' },
  condition(ctx){
    if(ctx.card.equipTo){
      if(!e0Host(ctx.card)){ ctx.reason = '装備モンスターがいません'; return false; }
      if(!e0MainPhase(ctx.player)){
        ctx.reason = '自分のメインフェイズに発動します'; return false; }
      return true;
    }
    if(!e0OnlyOneWarrior(ctx.player)){
      ctx.reason = '自分フィールドのモンスターが戦士族1体のみの場合に装備できます'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.card.equipTo){ done([]); return; }
    const w = e0OnlyOneWarrior(ctx.player);
    if(!w){ done([]); return; }
    done([w]);
  },
  cost(ctx, done){
    if(!ctx.card.equipTo){ done(true); return; }
    const host = e0Host(ctx.card);
    const me = locateCardAnyV4(ctx.card);
    if(!host || !me || me.zone !== 'sz'){ done(false); return; }
    ctx.e0HostUid = host.card.uid;
    API.sendToGrave(me, 'アサルト・アーマー（コスト）');
    done(true);
  },
  resolve(ctx){
    if(ctx.e0HostUid != null){
      const h = findCardByUid(ctx.e0HostUid);
      if(h && h.zone === 'mz') API.grantAdditionalAttack(h, 1, 'アサルト・アーマー', false);
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'sz')
      API.equipSpell(me, r, 'アサルト・アーマー');
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:300 };
    }
  }
});

/* 2. エレキューブ — 雷族モンスターにのみ装備可能。
      装備モンスターの攻撃力は自分の墓地の雷族の数×100アップする。
      フィールドの表側のこのカードを墓地へ送る事で、
      自分フィールドの表側の雷族1体の攻撃力は1000アップする */
function e0ThunderGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === '雷');
}
defineScript('エレキューブ', {
  type:'spell', priority:1, targets:true, activateFrom:['sz'], timing:['mainPhase'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.ra === '雷'); },
              label:'雷族のみ' },
  condition(ctx){
    if(ctx.card.equipTo){
      if(!e0MyFaceUp(ctx.player, x => x.db.ra === '雷').length){
        ctx.reason = '自分フィールドに表側表示の雷族がいません'; return false; }
      return true;
    }
    if(!e0MyFaceUp(ctx.player, x => x.db.ra === '雷').length){
      ctx.reason = '装備できる雷族がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard(ctx.card.equipTo
        ? 'エレキューブ：攻撃力を上げる雷族' : 'エレキューブ：装備する雷族',
      e0MyFaceUp(ctx.player, x => x.db.ra === '雷'), t => done([t]));
  },
  cost(ctx, done){
    if(!ctx.card.equipTo){ done(true); return; }
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'sz' || me.card.face !== 'up'){ done(false); return; }
    API.sendToGrave(me, 'エレキューブ（コスト）');
    done(true);
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'sz' && !me.card.equipTo){
      API.equipSpell(me, r, 'エレキューブ'); return;
    }
    API.modAtk(r, 1000, 0, 'permanent', 'エレキューブ');
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      const h = locateCardAnyV4(self);
      if(!h) return null;
      const n = e0ThunderGrave(h.p).length;
      return n ? { atk:n * 100 } : null;
    }
  }
});

/* 3. サイクロンレーザー — 「超時空戦闘機ビック・バイパー」のみ装備可能。
      攻撃力は300アップする。守備表示モンスターを攻撃した時、
      守備力を攻撃力が越えていればその数値だけ相手に戦闘ダメージを与える（貫通） */
defineScript('サイクロンレーザー', {
  type:'spell', priority:1, targets:true, activateFrom:['sz'], timing:['mainPhase'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.n === '超時空戦闘機ビック・バイパー'); },
              label:'「超時空戦闘機ビック・バイパー」のみ' },
  condition(ctx){
    if(!e0NamedOnField(ctx.player, '超時空戦闘機ビック・バイパー').length){
      ctx.reason = '「超時空戦闘機ビック・バイパー」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('サイクロンレーザー：装備するモンスター',
      e0NamedOnField(ctx.player, '超時空戦闘機ビック・バイパー'), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'sz')
      API.equipSpell(me, r, 'サイクロンレーザー');
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:300 };
    },
    piercingDamage(info){
      const self = info && info.self;
      if(!self || !self.equipTo) return 0;
      const atk = info.atkCard;
      if(!atk || atk.uid !== self.equipTo.uid) return 0;
      return Math.max(0, Number(info.amount) || 0);
    }
  }
});

/* 4. サイクロン・ブーメラン — 「E・HERO ワイルドマン」にのみ装備可能。
      装備モンスターの攻撃力は500アップする。
      装備モンスターが他のカードの効果によって破壊され墓地へ送られた時、
      フィールドの魔法・罠カードを全て破壊し、その枚数×100ダメージを相手に与える */
function e0HostEffectDead(ctx){
  const host = e0Host(ctx.card);
  if(host) return null;                       /* まだ場にいるなら誘発しない */
  const uid = ctx.card.equipTo && ctx.card.equipTo.uid;
  if(uid == null) return null;
  const h = findCardByUid(uid);
  if(!h || h.zone !== 'grave') return null;
  const g = h.card.graveInfo;
  if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)) return null;
  const rec = c1DestroyRecord(h.card);
  /* 戦闘破壊ではなく「他のカードの効果」による破壊に限る */
  if(!rec || rec.battle) return null;
  return h;
}
defineScript('サイクロン・ブーメラン', {
  type:'spell', priority:1, forced:true, targets:true,
  activateFrom:['sz'], timing:['mainPhase','free'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.n === 'E・HERO ワイルドマン'); },
              label:'「E・HERO ワイルドマン」のみ' },
  condition(ctx){
    if(ctx.card.equipTo){
      if(!e0HostEffectDead(ctx)){
        ctx.reason = '装備モンスターが他のカードの効果で破壊された時に発動します'; return false; }
      return true;
    }
    if(!e0NamedOnField(ctx.player, 'E・HERO ワイルドマン').length){
      ctx.reason = '「E・HERO ワイルドマン」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.card.equipTo){ done([]); return; }
    API.selectCard('サイクロン・ブーメラン：装備するモンスター',
      e0NamedOnField(ctx.player, 'E・HERO ワイルドマン'), t => done([t]));
  },
  resolve(ctx){
    if(ctx.card.equipTo){
      const list = API.fieldCards({ zone:'sz' }).concat(API.fieldCards({ zone:'field' }));
      let n = 0;
      list.slice().forEach(hh => {
        const now = locateCardAnyV4(hh.card);
        if(now && (now.zone === 'sz' || now.zone === 'field')){
          API.destroy(now, 'サイクロン・ブーメラン', ctx.player); n++;
        }
      });
      if(n > 0) API.damageLP(ctx.opponent, n * 100);
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'sz')
      API.equipSpell(me, r, 'サイクロン・ブーメラン');
  },
  afterResolve(){},
  passive:{
    onSendToGrave(ctx){ return ctx.zone === 'sz' && !!ctx.card.equipTo && !!e0HostEffectDead(ctx); },
    onDestroy(ctx){ return ctx.zone === 'sz' && !!ctx.card.equipTo && !!e0HostEffectDead(ctx); }
  },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:500 };
    }
  }
});

/* ===================== B. 罠が装備カードになる ===================== */

/* 5. D－チェーン — 自分フィールドの「D－HERO」1体を対象にこのカードを発動し、
      攻撃力500アップの装備カード扱いとしてそのモンスターに装備する。
      装備モンスターが戦闘で相手モンスターを破壊し墓地へ送った場合、相手に500ダメージ */
function e0DestinyOnField(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && isSetCardV4(x.db, SETCODE.DESTINY_HERO) });
}
defineScript('D－チェーン', {
  type:'trap', priority:2, forced:true, targets:true, activateFrom:['sz'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && isSetCardV4(h.db, SETCODE.DESTINY_HERO)); },
              label:'「D－HERO」のみ' },
  condition(ctx){
    if(ctx.card.equipTo){
      if(!b1EquippedKilled(ctx)){
        ctx.reason = '装備モンスターが戦闘で相手モンスターを破壊した時に発動します'; return false; }
      return true;
    }
    if(!e0DestinyOnField(ctx.player).length){
      ctx.reason = '自分フィールドに「D－HERO」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.card.equipTo){ done([]); return; }
    API.selectCard('D－チェーン：装備する「D－HERO」',
      e0DestinyOnField(ctx.player), t => done([t]));
  },
  resolve(ctx){
    if(ctx.card.equipTo){ API.damageLP(ctx.opponent, 500); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'sz')
      API.equipSpell(me, r, 'D－チェーン');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'sz' && !!ctx.card.equipTo && !!b1EquippedKilled(ctx); } },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:500 };
    }
  }
});

/* 6. アサルト・スピリッツ — 発動後は装備カードとなり自分のモンスター1体に装備する。
      装備モンスターが攻撃する場合、そのダメージステップ時に
      手札から攻撃力1000以下のモンスター1体を墓地へ送る事で、
      装備モンスターの攻撃力はエンドフェイズ時まで、
      墓地へ送ったモンスターの攻撃力分アップする。1ターンに1度 */
function e0WeakInHand(p){
  return API.pileCards(p, 'hand',
    x => x.db.k === 'm' && Number(x.db.atk) <= 1000);
}
function e0HostAttacking(ctx){
  const host = e0Host(ctx.card);
  if(!host) return null;
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  return atk === host.card ? host : null;
}
defineScript('アサルト・スピリッツ', {
  type:'trap', priority:2, countLimit:1, targets:true,
  dsTiming:'calc', damageStepOnly:true, activateFrom:['sz'],
  timing:['mainPhase','damageStep'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.k === 'm'); } },
  condition(ctx){
    if(ctx.card.equipTo){
      if(!e0HostAttacking(ctx)){
        ctx.reason = '装備モンスターが攻撃するダメージステップに発動します'; return false; }
      if(!e0WeakInHand(ctx.player).length){
        ctx.reason = '手札に攻撃力1000以下のモンスターがいません'; return false; }
      return true;
    }
    if(!e0MyFaceUp(ctx.player).length){
      ctx.reason = '装備できる自分のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.card.equipTo){
      API.selectCard('アサルト・スピリッツ（コスト）：墓地へ送るモンスター',
        e0WeakInHand(ctx.player), t => done([t]));
      return;
    }
    /* S03-U474: COST_SELECTION_FIRST の selectTargets は既定ではコストの選択だが、ここは本当の対象（装備するモンスター）なので効果の選択と明示する */
    API.selectCard('アサルト・スピリッツ：装備するモンスター',
      e0MyFaceUp(ctx.player), t => done([t]), undefined, {selection:'effect'});
  },
  cost(ctx, done){
    if(!ctx.card.equipTo){ done(true); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'hand'){ done(false); return; }
    ctx.e0SentAtk = Number(dbOf(r.card).atk) || 0;
    API.sendHandToGrave(ctx.player, r.index, 'アサルト・スピリッツ（コスト）');
    done(true);
  },
  resolve(ctx){
    if(ctx.card.equipTo){
      const host = e0Host(ctx.card);
      const add = Number(ctx.e0SentAtk) || 0;
      if(host && add > 0) API.modAtk(host, add, 0, 'endTurn', 'アサルト・スピリッツ');
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'sz')
      API.equipSpell(me, r, 'アサルト・スピリッツ');
  },
  afterResolve(){}
});

/* ===================== C. モンスターを装備カード扱いにする ===================== */

/* 7. C・スネーク — 自分のメインフェイズに、装備カード扱いとして
      相手フィールドの表側モンスター1体に装備できる。
      装備したモンスターの攻撃力・守備力は800ダウンする。
      装備モンスターが戦闘で破壊され墓地へ送られた時、
      そのコントローラーのデッキの上からそのモンスターのレベルと同じ枚数を墓地へ送る */
defineScript('C・スネーク', {
  type:'monster', priority:1, forced:false, targets:true,
  activateFrom:['mz','sz','grave'], timing:['mainPhase','damageStep'],
  condition(ctx){
    if(ctx.zone === 'sz' || ctx.zone === 'grave'){
      const victim = e0HostBattleDead(ctx);
      if(!victim){
        ctx.reason = '装備モンスターが戦闘で破壊された時に発動します'; return false; }
      return true;
    }
    if(!e0MainPhase(ctx.player)){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!e0MyFaceUp(ctx.opponent).length){
      ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone === 'sz'){ done([]); return; }
    API.selectCard('C・スネーク：装備する相手モンスター',
      e0MyFaceUp(ctx.opponent), t => done([t]));
  },
  resolve(ctx){
    if(ctx.zone === 'sz' || ctx.zone === 'grave'){
      const victim = e0HostBattleDead(ctx);
      if(!victim) return;
      const h = locateCardAnyV4(victim);
      const owner = (h && h.p != null) ? h.p : ctx.opponent;
      const lv = Number(dbOf(victim).lv) || 0;
      const n = Math.min(lv, (gameState.players[owner].deck || []).length);
      if(n > 0) API.millTop(owner, n, 'C・スネーク');
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'mz'){
      ensureCardUid(gameState, r.card);
      const hostUid = r.card.uid;
      API.equipMonster(ctx.player, me, r, 'C・スネーク');
      const now = locateCardAnyV4(ctx.card);
      if(now && now.zone === 'sz')
        API.setCardFlag(now, 'e0EquipHostUid', hostUid, 'C・スネーク');
    }
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return (ctx.zone === 'sz' || ctx.zone === 'grave') && !!e0HostBattleDead(ctx); } },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:-800, def:-800 };
    }
  }
});

/* 8. D・クリーナン — 表示形式によって以下の効果を得る。
      ●攻撃表示: 1ターンに1度、このカードに装備された装備カード1枚を墓地へ送って
        相手に500ダメージを与える。
      ●守備表示: 1ターンに1度、相手フィールドの表側攻撃表示モンスター1体を選択し、
        装備カード扱いとしてこのカードに1体のみ装備できる */
function e0EquipsOnMe(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return [];
  return API.equipsOn(me);
}
function e0FoeAtkMonsters(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'mz',
    filter:x => x.card.face === 'up' && x.card.pos === 'atk' });
}
defineScript('D・クリーナン', {
  type:'monster', priority:1, countLimit:1, targets:true,
  activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!e0MainPhase(ctx.player)){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(me.card.pos === 'def'){
      if(e0EquipsOnMe(ctx).length){
        ctx.reason = '既に1体装備しています'; return false; }
      if(!e0FoeAtkMonsters(ctx).length){
        ctx.reason = '相手フィールドに表側攻撃表示のモンスターがいません'; return false; }
      return true;
    }
    if(!e0EquipsOnMe(ctx).length){
      ctx.reason = 'このカードに装備された装備カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.card.pos === 'def'){
      /* S03-U474: COST_SELECTION_FIRST の selectTargets の中の本当の対象（装備する相手モンスター）— 効果の選択と明示する */
      API.selectCard('D・クリーナン：装備する相手モンスター',
        e0FoeAtkMonsters(ctx), t => done([t]), undefined, {selection:'effect'});
      return;
    }
    API.selectCard('D・クリーナン（コスト）：墓地へ送る装備カード',
      e0EquipsOnMe(ctx), t => done([t]));
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.card.pos === 'def'){ done(true); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && (r.zone === 'sz' || r.zone === 'mz')){
      API.sendToGrave(r, 'D・クリーナン（コスト）'); done(true);
    } else done(false);
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ return; }
    if(me.card.pos !== 'def'){ API.damageLP(ctx.opponent, 500); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.equipMonster(ctx.player, r, me, 'D・クリーナン');
  },
  afterResolve(){}
});

/* 9. サイバー・レイダー — 召喚・反転召喚・特殊召喚に成功した時、次から1つを選択して発動する。
      ●フィールドのモンスターに装備されている装備カード1枚を破壊する
      ●フィールドのモンスターに装備されている装備カード1枚をこのカードに装備する */
function e0AllEquips(){
  return API.fieldCards({ zone:'sz', filter:x => x.card.equipTo != null });
}
/* S03-U62: resolve() 内の legacy API.confirm を SaveLoad安全な登録済みハンドラへ移行。
   破壊/装備本体の選択自体は既に requestChoice('e0.cyberRaider') 経由で SaveLoad安全。 */
API.registerChoiceHandler('s03u62.cyber-raider-confirm', (answer, args) => {
  const yes = !answer.cancelled && answer.cards[0] && answer.cards[0].value === true;
  const mode = yes ? 'destroy' : 'take';
  const pool = e0AllEquips();
  if(!pool.length) return;
  API.requestChoice({player:args.player, kind:'card', cancelable:false, min:1, max:1,
    title: yes ? 'サイバー・レイダー：破壊する装備カード' : 'サイバー・レイダー：このカードに装備する装備カード',
    candidates: pool,
    resume:{handler:'e0.cyberRaider', args:{player:args.player, uid:args.uid, mode}}});
});
API.registerChoiceHandler('e0.cyberRaider', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  if(!r || r.zone !== 'sz') return;
  if(args && args.mode === 'destroy'){ API.destroy(r, 'サイバー・レイダー', p); return; }
  const me = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(me && me.zone === 'mz' && equipLegalV15(r.card, me))
    API.moveEquip(r, me, 'サイバー・レイダー');
});
defineScript('サイバー・レイダー', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(!(ctx.event && ctx.event.card === ctx.card)){
      ctx.reason = '召喚・反転召喚・特殊召喚に成功した時に発動します'; return false; }
    if(!e0AllEquips().length){
      ctx.reason = 'フィールドに装備カードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    const uid = me.card.uid;
    API.requestChoice({player:ctx.player, kind:'yesno', title:'サイバー・レイダー',
      note:'装備カードを破壊しますか？（いいえ＝このカードに装備する）',
      candidates:[{key:'yes',label:'はい',value:true},{key:'no',label:'いいえ',value:false}],
      min:1, max:1, cancelable:false,
      resume:{handler:'s03u62.cyber-raider-confirm', args:{player:ctx.player, uid}},
      meta:{scriptName:'サイバー・レイダー'}});
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){
      return ctx.zone === 'mz' && !!(ctx.event && ctx.event.card === ctx.card)
          && e0AllEquips().length > 0; },
    onSpecialSummon(ctx){
      return ctx.zone === 'mz' && !!(ctx.event && ctx.event.card === ctx.card)
          && e0AllEquips().length > 0; },
    onFlip(ctx){
      return ctx.zone === 'mz' && !!(ctx.event && ctx.event.card === ctx.card)
          && e0AllEquips().length > 0; }
  }
});
