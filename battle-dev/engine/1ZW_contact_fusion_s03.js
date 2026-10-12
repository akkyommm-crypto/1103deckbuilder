/* =========================================================================
   S03-U174 — contact fusion (「上記のカードを(デッキに戻した｜除外した｜墓地へ送った)場合のみ、EXデッキから特殊召喚できる
   (「融合」は必要としない)」)
   -------------------------------------------------------------------------
   Before: no EX monster of this kind could be summoned in DUEL (the EX deck sheet refused every fusion with 「融合召喚は融合魔法・
   カード効果の解決から行います」), yet E・HERO グラン・ネオス was TESTED with only its bounce effect.
   Contract (2011 texts; yugioh-wiki コンタクト融合):
   - The materials and their destination come from the card's own text: line 1 = the materials (parseMaterialSpec), line 2 = the
     destination (デッキ｜除外｜墓地) and the fields (自分フィールド / 自分・相手フィールド).
   - It is a special summon by the card's own procedure (summonProcedure from 'ex'): no chain block, the summon negation window,
     「正規の方法」 (properly summoned, summonKind 'procedure'); it is NOT a Fusion Summon (no fusion flags).
   - Face-down monsters can be used; they are revealed (logged) and then moved. Fusion-substitute monsters cannot be used (the
     material slots only accept the named cards).
   - The materials move as the procedure's cost (before the summon); 「デッキに戻す」 = FX_RETURN_DECK then SHUFFLE of the owner's Deck
     (S03-U176: the U174 version left them on top of the Deck).
   - procedureDataS03 {n} = number of materials; a script may read it in summonProcedure.afterSummonS03
     (キメラテック・フォートレス・ドラゴン: 「融合素材としたモンスターの数×1000」).
   Declared per card with declareContactFusionS03(name) — only for cards whose other effects are implemented.
   ========================================================================= */

function contactSpecS03(db){
  if(!db || !db.ex) return null;
  const lines = String(db.e||'').split('\n');
  const l2 = lines[1] || '';
  const m = l2.match(/上記の?カードを(デッキに戻した|除外した|墓地へ送った)場合のみ/);
  if(!m) return null;
  const dest = m[1]==='デッキに戻した' ? 'deck' : (m[1]==='除外した' ? 'banish' : 'grave');
  const both = /自分・相手フィールド/.test(l2);
  const spec = (typeof parseMaterialSpec==='function') ? parseMaterialSpec(db) : null;
  if(!spec || spec.permissive || !Array.isArray(spec.slots) || !spec.slots.length) return null;
  return {slots:spec.slots, dest, both, raw:spec.raw};
}

/* Monsters on the field(s) usable as materials (face-up or face-down). */
function contactCandidatesS03(p, cs){
  const out = [];
  (cs.both ? [p, p===0?1:0] : [p]).forEach(q=>{
    (gameState.players[q].mz||[]).forEach(c=>{
      if(!c) return;
      const db = dbOf(c); if(!db || db.k!=='m') return;
      if(cannotFusionMaterialS03(c)) return;
      ensureCardUid(gameState, c);
      out.push({i:out.length, c, db, lv:curLV(c), tuner:isTuner(db), p:q, uid:c.uid});
    });
  });
  return out;
}
/* S03-U175: with a full Monster Zone only the sets that take at least one of the player's own monsters leave a zone for the summon
   (the materials leave before the summon) */
function contactCombosS03(p, cs){
  const cands = contactCandidatesS03(p, cs);
  const full = !hasMonsterZoneSpace(p);
  return findMaterialCombos(cands, {slots:cs.slots}, null, 60).filter(set=>!full || set.some(x=>x.p===p)).map(set=>({
    uids: set.map(x=>x.uid),
    label: set.map(x=>`${x.db.n}${x.c.face==='down'?'（裏側）':''}${x.p!==p?'（相手）':''}`).join(' ＋ ')
  }));
}

const CONTACT_DEST_JP_S03 = {deck:'デッキに戻す', banish:'除外する', grave:'墓地へ送る'};

function contactProcedureS03(name){
  return {
    from:'ex', positions:['atk','def'], contactS03:true,
    condition(ctx){
      const cs = contactSpecS03(dbOf(ctx.card));
      if(!cs){ ctx.reason = '特殊召喚の手順を読み取れません'; return false; }
      if(!contactCombosS03(ctx.player, cs).length){ ctx.reason = `素材：${cs.raw}`; return false; }
      return true;
    },
    cost(ctx, done){
      const cs = contactSpecS03(dbOf(ctx.card));
      const combos = cs ? contactCombosS03(ctx.player, cs) : [];
      if(!combos.length){ done(false); return; }
      const pay = (combo)=>{
        const reason = `${name}（特殊召喚の手順）`;
        combo.uids.forEach(u=>{
          const h = findCardByUid(u);
          if(!h || h.zone!=='mz') return;
          if(h.card.face==='down') logIt(gameState, `${name}：裏側表示の ${cardName(h.card)} を公開`);
          if(cs.dest==='deck') API.returnToDeck(h, false, reason);
          else if(cs.dest==='banish') API.banish(h, reason);
          else API.sendToGrave(h, reason);
        });
        /* S03-U176: 「デッキに戻す」 shuffles them into the Deck (FX_RETURN_DECK puts a card on top) */
        if(cs.dest==='deck'){
          const owners = [];
          combo.uids.forEach(u=>{ const h=findCardByUid(u); if(h && h.zone==='deck' && owners.indexOf(h.p)<0) owners.push(h.p); });
          owners.forEach(q=>act({type:'SHUFFLE', player:q}));
        }
        const moved = combo.uids.every(u=>{ const h=findCardByUid(u); return !h || h.zone!=='mz'; });
        if(!moved){ done(false); return; }
        ctx.procedureDataS03 = {n:combo.uids.length};
        done(true);
      };
      if(combos.length===1){ pay(combos[0]); return; }
      const ok = requestChoiceV49({
        player:ctx.player, kind:'declare',
        title:`${name}：${CONTACT_DEST_JP_S03[cs.dest]}モンスターを選ぶ`,
        note:`素材：${cs.raw}`,
        candidates:combos.map((c,i)=>({key:'k'+i, label:c.label, value:i})),
        min:1, max:1, cancelable:true,
        legacy:{onPick:(x)=>{ const c=combos[x && x.value!=null ? x.value : 0]; if(c) pay(c); else done(false); }, onCancel:()=>done(false)}
      });
      if(!ok) done(false);
    }
  };
}

/* Attach the contact procedure to an already defined script (keeps a procedure-specific afterSummonS03). */
function declareContactFusionS03(name, extra){
  const sc = CARD_SCRIPTS[name];
  if(!sc) throw new Error('declareContactFusionS03: no script for '+name);
  sc.summonProcedure = Object.assign(contactProcedureS03(name), extra||{});
  return sc;
}

/* 「エンドフェイズ時、このカードはエクストラデッキに戻る」 — a forced trigger effect of the E・HERO ネオス fusions (v4 effect entry). */
function endPhaseReturnExEffectS03(name){
  return {
    key:'ep-return-ex', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'self',
    speed:1, events:['onEndPhase'], forced:true,
    condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up'; },
    operation(ctx){
      const h = findCardByUid(ensureCardUid(gameState, ctx.card));
      if(!h || h.zone!=='mz') return;
      /* S03-U179: the action is marked so that 「この効果によってエクストラデッキに戻った時」 can recognise it */
      act({type:'FX_RETURN_DECK', player:h.p, zone:h.zone, index:h.index, toBottom:false, reason:`${name}（エンドフェイズ）`, epReturnS03:true});
    },
    afterResolve(){}
  };
}

/* EX Deck sheet (engine/20 openExDeck): null = not a contact fusion card; else the procedure's legality {ok, reason}. */
function contactProcRowS03(p, i, db){
  const sc = db && CARD_SCRIPTS[db.n];
  if(!sc || !sc.summonProcedure || !sc.summonProcedure.contactS03) return null;
  return strictSummonProcedureLegality(db.n, p, 'ex', i);
}

/* 「このカードは融合素材にできない」 — declared on the script (cannotFusionMaterialS03:true); read by the fusion spells (engine/1ZL),
   超融合 and contact fusion. */
function cannotFusionMaterialS03(card){
  const sc = card && typeof CARD_SCRIPTS!=='undefined' ? CARD_SCRIPTS[cardName(card)] : null;
  return !!(sc && sc.cannotFusionMaterialS03===true);
}

/* engine/40 strictSummonProcedureLegality: with a full Monster Zone, can this procedure still summon (a material set frees a zone)? */
function summonProcedureFreesZoneS03(name, p, sp){
  /* S03-U310: a procedure whose cost releases own monsters (トゥーン: 「自分フィールドのモンスター1体をリリースした場合に特殊召喚できる」) frees the zone it needs;
     sp.freesZoneS03(p) says whether it can */
  if(sp && typeof sp.freesZoneS03==='function'){ try{ return !!sp.freesZoneS03(p); }catch(err){ return false; } }
  if(!sp || !sp.contactS03) return false;
  const i = findCardIndex(name);
  const cs = i>=0 ? contactSpecS03(CARD_DB[i]) : null;
  return !!cs && contactCombosS03(p, cs).length>0;
}

/* S03-U179: 「この効果によってこのカードがエクストラデッキに戻った時、…」 (E・HERO ストーム・ネオス / マグマ・ネオス) — a forced trigger
   of the card in the EX Deck on its own End Phase return (onLeaveField scans the EX Deck; the return action marked it). */
function epReturnedTriggerS03(ctx){
  const e = ctx.event || {};
  return ctx.zone==='ex' && e.uid!=null && e.uid===ctx.card.uid && e.fromZone==='mz' && ctx.card.epReturnedS03===gameState.turn;
}
