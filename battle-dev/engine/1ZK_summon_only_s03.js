/* S03-U126: 「〜でしか特殊召喚できない」 summon conditions (strict; 2011 wording).

   Before this unit no summon condition was enforced: e.g. E・HERO The シャイニング / Great TORNADO / アブソルートZero
   ("融合召喚でしか特殊召喚できない") or TG ハルバード・キャノン ("シンクロ召喚でしか特殊召喚できない") could be Special Summoned by
   any effect (死者蘇生, シンクロ・チェンジ …), and ミラクル・フュージョン's summon was not even marked as a Fusion Summon.

   Parsed from the card text (38 cards in the 2011 pool): "(融合召喚|シンクロ召喚|エクシーズ召喚|儀式召喚)でしか特殊召喚できない"
   or "「N」/このカード/「N」またはこのカード の効果でしか特殊召喚できない" (S召喚 / X召喚 spellings included). Enforced where effects Special Summon: API.specialSummon — allowed only with
   opts.summonKind === that kind, or (named card) when the summoning effect is N (reason === N). The Extra Deck pipeline
   (EX_SUMMON_PREPARE/COMMIT, FX_EX_SUMMON) is the proper summon itself and is not affected.

   Not in this unit (recorded): the semi-restricted "properly summoned first" rule (e.g. ダーク・アームド・ドラゴン, other
   Extra Deck monsters may be revived only after a proper summon) — needs a persistent "properly summoned" record. */
const SUMMON_ONLY_CACHE_S03 = new Map();
function summonOnlyByS03(db){
  if(!db || !db.n) return null;
  if(SUMMON_ONLY_CACHE_S03.has(db.n)) return SUMMON_ONLY_CACHE_S03.get(db.n);
  const e = String(db.e||'');
  let out = null;
  const kinds = {'融合召喚':'fusion','シンクロ召喚':'synchro','S召喚':'synchro','エクシーズ召喚':'xyz','X召喚':'xyz','儀式召喚':'ritual'};
  const m = e.match(/(融合召喚|シンクロ召喚|S召喚|エクシーズ召喚|X召喚|儀式召喚)でしか特殊召喚できない/);
  if(m) out = {kind:kinds[m[1]], label:m[1]};
  else {
    /* 「A」の効果 / このカードの効果 / 「A」またはこのカードの効果 */
    /* S03-U251: also 「「A」の効果でのみ特殊召喚できる／する事ができる／が可能」 and 「「A」の効果及びこのカードの効果でのみ…」
       (サイレント・ソードマン LV7, ホルスの黒炎竜 LV8, バスター monsters …) */
    const n = e.match(/((?:「[^」]+」|このカード)(?:(?:の効果)?(?:または|及び)(?:「[^」]+」|このカード))*)の効果で(?:しか特殊召喚できない|のみ特殊召喚)/);
    if(n){
      const names = [];
      n[1].replace(/「([^」]+)」|このカード/g, (all, nm)=>{ names.push(nm || db.n); return all; });
      out = {byCards:names, label:n[1]+'の効果'};
      /* 「でのみ」: a special-summon monster with 蘇生制限 — once properly summoned (U127 record), other effects may summon it from the GY / banished zone */
      if(/の効果でのみ特殊召喚$/.test(n[0])) out.soft = true;
    }
    /* S03-U181: 「「X」以外の効果によって、このカードを特殊召喚する事はできない」 (剣闘獣スパルティクス / アレクサンデル) */
    const x = !n && e.match(/「([^」]+)」以外の効果によって、?このカードを特殊召喚する事はできない/);
    if(x) out = {byCards:[x[1]], label:`「${x[1]}」の効果`};
    /* S03-U253: 「このカードは通常召喚できない。「X」の効果で特殊召喚できる／する事ができる。」 — X's effect is its only proper Special Summon
       (ハーピィ・レディ三姉妹, 不死王リッチー); like 「でのみ」 it is relaxed once properly summoned (soft) */
    const y = !n && !x && e.match(/このカードは通常召喚できない。\s*「([^」]+)」の効果で特殊召喚(?:できる|する事ができる)/);
    if(y) out = {byCards:[y[1]], label:`「${y[1]}」の効果`, soft:true};
  }
  SUMMON_ONLY_CACHE_S03.set(db.n, out);
  return out;
}
/* why this card cannot be Special Summoned by this effect ('' = allowed) */
function summonOnlyReasonS03(card, summonKind, reason){
  const only = card ? summonOnlyByS03(dbOf(card)) : null;
  if(!only) return '';
  if(only.kind && summonKind === only.kind) return '';
  if(only.byCards && only.byCards.indexOf(reason) >= 0) return '';
  if(only.soft && card.properlySummonedS03) return '';   /* S03-U251 */
  return `${cardName(card)}は${only.label}でしか特殊召喚できません`;
}

/* S03-U127: 「正規の方法で特殊召喚された後でなければ、他の効果で特殊召喚できない」 (special-summon monsters).
   Applies to Special Summons from the GY / banished zone only.
   A special-summon monster = an Extra Deck monster (Fusion / Synchro / Xyz), a Ritual Monster, or a Main Deck monster whose
   text says 「このカードは通常召喚できない」. Such a monster may be Special Summoned by another effect only if it was properly
   summoned before and has not gone to the hand / Deck / Extra Deck since (card.properlySummonedS03, set by the proper
   summon actions and swept from hand / Deck / Extra Deck at the end of every applyAction — Replay-safe). Its own proper
   method is always allowed: the matching summonKind (fusion / synchro / xyz / ritual / procedure), or an effect of the
   card itself (reason === its name, e.g. a Main Deck monster that Special Summons itself). */
function specialSummonMonsterKindS03(db){
  if(!db || db.k!=='m') return null;
  const st = db.st || [];
  if(st.indexOf('融合')>=0) return 'fusion';
  if(st.indexOf('シンクロ')>=0) return 'synchro';
  if(st.indexOf('エクシーズ')>=0) return 'xyz';
  if(st.indexOf('儀式')>=0) return 'ritual';
  if(/このカードは通常召喚できない/.test(String(db.e||''))) return 'procedure';
  return null;
}
function properlySummonedReasonS03(card, summonKind, reason, from){
  /* S03-U176: 「このカードは墓地からの特殊召喚はできない」 (engine/1ZX) */
  if(typeof graveSpecialSummonBanReasonS03==='function'){ const gS03 = graveSpecialSummonBanReasonS03(card, from); if(gS03) return gS03; }
  /* only a Special Summon from the GY / banished zone requires the earlier proper summon (the well-established rule);
     hand / Deck / Extra Deck Special Summons by effects are left as before (限定解除, シンクロ・チェンジ …). */
  if(from!=null && from!=='grave' && from!=='banish') return '';
  const db = card ? dbOf(card) : null;
  const k = specialSummonMonsterKindS03(db);
  if(!k) return '';
  if(summonKind && (summonKind===k || (k==='procedure' && summonKind==='procedure'))) return '';
  if(reason && db && reason===db.n) return '';
  /* 「「N」の効果でのみ／でしか特殊召喚できない」 monsters: the named effect is the proper method itself (ボンディング－H2O → ウォーター・ドラゴン) */
  if(reason && properSummonSourcesS03(db).indexOf(reason)>=0) return '';
  if(card.properlySummonedS03) return '';
  return `${cardName(card)}は正規の方法で特殊召喚されていないため、この効果では特殊召喚できません`;
}
/* the cards whose effect is this monster's own proper Special Summon method: 「「N」(及び/またはこのカード)の効果でのみ特殊召喚できる」
   (the 2011 texts mostly say 「でのみ」; U126's summonOnlyByS03 parses the 「でしか」 wording only — enforcing the 「でのみ」 wording
   was a separate follow-up — done in S03-U251, summonOnlyByS03 `soft`; here it recognises the proper method). */
const PROPER_SOURCES_CACHE_S03 = new Map();
function properSummonSourcesS03(db){
  if(!db || !db.n) return [];
  if(PROPER_SOURCES_CACHE_S03.has(db.n)) return PROPER_SOURCES_CACHE_S03.get(db.n);
  const out = [];
  String(db.e||'').split(/[。\n]/).forEach(sen=>{
    const m = sen.match(/^(.*)の効果で(?:のみ|しか)特殊召喚/);
    if(!m) return;
    m[1].replace(/「([^」]+)」|このカード|自身/g, (all, nm)=>{ out.push(nm || db.n); return all; });
  });
  /* S03-U253: 「通常召喚できない。「X」の効果で特殊召喚できる」 (summonOnlyByS03 soft) — X is the proper method too */
  const soS03 = summonOnlyByS03(db);
  if(soS03 && soS03.soft && Array.isArray(soS03.byCards)) soS03.byCards.forEach(n=>{ if(out.indexOf(n)<0) out.push(n); });
  PROPER_SOURCES_CACHE_S03.set(db.n, out);
  return out;
}
/* reducer helper: forget the record once the card is back in the hand / Deck / Extra Deck */
function sweepProperlySummonedS03(gs){
  if(!gs || !gs.players) return;
  gs.players.forEach(P=>['hand','deck','ex'].forEach(z=>(P[z]||[]).forEach(c=>{ if(c && c.properlySummonedS03) delete c.properlySummonedS03; })));
}

/* S03-U144: can this card be Special Summoned by this effect from this zone? For candidate lists (e.g. 死者蘇生), so that a card
   the summon would refuse (「特殊召喚できない」, a 「〜でしか」 condition, or a special-summon monster that was never properly
   summoned) is not offered as a target in the first place. */
/* S03-U358: 「このカードは墓地からの特殊召喚はできない」 (インフェルニティ・ミラージュ / ハ・デス / 地獄詩人ヘルポエマー) — a standing rule read from the card text; applies to every effect Special Summon from the Graveyard. */
function noGraveSummonReasonS03(card, from){
  if(!card || from!=='grave') return '';
  const d = (typeof dbOf==='function') ? dbOf(card) : null;
  return (d && /このカードは墓地からの特殊召喚はできない/.test(String(d.e||''))) ? `${cardName(card)}は墓地から特殊召喚できません` : '';
}
function canEffectSpecialSummonS03(card, from, reason, summonKind){
  if(!card) return false;
  const sc = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(card)] : null;
  if(sc && sc.cannotSpecialSummon===true) return false;
  if(typeof sinUniqueReasonS03==='function' && sinUniqueReasonS03(card)) return false;   /* S03-U187 */
  /* S03-U211: a face-up monster's 「お互いに…特殊召喚できない」 lock (A・O・J D.D.チェッカー) also removes the card from effect candidate lists */
  if(typeof scriptSpecialSummonLockS03==='function'){ const l = (typeof locateCard==='function') ? locateCard(card) : null; if(scriptSpecialSummonLockS03(l && (l.p===0||l.p===1) ? l.p : 0, dbOf(card))) return false; }
  /* S03-U384: summon locks by kind (engine/1ZZS) — a turn-ranged ban or a locking card also removes the card from effect candidate lists */
  if(typeof summonLockReasonS03==='function'){ const o = (card.owner===0||card.owner===1) ? card.owner : 0; if(summonLockReasonS03(o, dbOf(card), 'special')) return false; }
  if(summonOnlyReasonS03(card, summonKind||null, reason)) return false;
  if(properlySummonedReasonS03(card, summonKind||null, reason, from)) return false;
  if(noGraveSummonReasonS03(card, from)) return false;
  return true;
}
