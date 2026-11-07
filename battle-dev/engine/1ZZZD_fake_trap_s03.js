/* =========================================================================
   S03-U527 — 「自分フィールド上に存在する罠カードを破壊する効果」への応答と、その破壊を止める印
   -------------------------------------------------------------------------
   《偽物のわな》は「自分フィールド上に存在する罠カードを破壊する魔法・罠・効果モンスターの効果を
   相手が発動した時」に発動し、「このカードを代わりに破壊し、他の自分の罠カードは破壊されない」。
   engine には「この効果の破壊からこのカードだけを守る」仕組みが無かった（engine/1K の V21 の耐性は
   カードごとの継続的な耐性、engine/1ZV の身代わりは破壊時に選ぶ別の仕組み）。ここでは:

   ■ 破壊が確定しているかの判定（fakeTrapCertainS03）
     発動されたチェーンリンクから、守られる自分の罠カードの uid を数える。
       (A) そのリンクが対象を取っている場合 … 対象の中に自分フィールドの罠カードがあればその uid。
           WIKI-5439C489E102（10/09/13）《Ｅ・ＨＥＲＯ エアーマン》のように破壊が不確定な効果には
           発動できない、という裁定に合わせて「対象がある効果は対象だけを見る」。
       (B) 対象を取っていない場合 … そのカードが「フィールド（または相手フィールド）の魔法・罠カードを
           全て破壊する」と申告している（または、申告が無い場合はテキストがその言い回しを含む）時だけ、
           自分フィールドの罠カード全部。
     どちらでも 0 枚なら発動できない（＝判定の漏れは「発動できない」側に落ちる）。
     スクリプトは wipesFieldSpellTrapS03:'both'|'opponent' で申告できる。テキストの読み取りは
     申告が無いカードのための控えで、言い回しは下の WIPE_TEXTS_S527 に限る。
   ■ 破壊を止める印（gs.fakeTrapS03）
     {player, srcUid, uids, turn}。srcUid は破壊する効果のカードの uid。破壊の Action には解決中の
     カードの印（a.srcS03、engine/1ZG）が載るので、その uid が一致する破壊だけを止める。
     止めるのは罠カードの**破壊**だけで、無効化や墓地送りは止めない
     （WIKI-F7E74B443EB4 09/01/16: 《炸裂装甲》は破壊されないが効果は無効になる）。
     記録は一連のチェーン処理の終了時に Action で消すので、Replay・保存・再開でも同じになる。
   ========================================================================= */
const WIPE_TEXTS_S527 = Object.freeze({
  both:['フィールド上の魔法・罠カードを全て破壊', 'フィールドの魔法・罠カードを全て破壊',
        'フィールド上のカードを全て破壊', 'フィールドのカードを全て破壊'],
  opponent:['相手フィールド上の魔法・罠カードを全て破壊', '相手フィールドの魔法・罠カードを全て破壊',
            '相手の魔法・罠カードを全て破壊', '相手フィールド上のカードを全て破壊',
            '相手フィールドのカードを全て破壊']
});
/* そのカードが「魔法・罠を全て破壊する」効果を持つか。'both' / 'opponent' / null */
function fakeTrapWipesS527(name){
  if(!name) return null;
  const sc = (typeof CARD_SCRIPTS !== 'undefined') ? CARD_SCRIPTS[name] : null;
  if(sc && sc.wipesFieldSpellTrapS03 === 'both') return 'both';
  if(sc && sc.wipesFieldSpellTrapS03 === 'opponent') return 'opponent';
  if(sc && sc.wipesFieldSpellTrapS03 === false) return null;   /* 明示的に対象外と申告できる */
  const i = (typeof findCardIndex === 'function') ? findCardIndex(name) : -1;
  const db = (i >= 0 && typeof CARD_DB !== 'undefined') ? CARD_DB[i] : null;
  const txt = (db && db.e) ? String(db.e).replace(/\n/g, '') : '';
  if(!txt) return null;
  if(WIPE_TEXTS_S527.both.some(p=>txt.indexOf(p) >= 0)) return 'both';
  if(WIPE_TEXTS_S527.opponent.some(p=>txt.indexOf(p) >= 0)) return 'opponent';
  return null;
}
/* 自分フィールド（魔法＆罠ゾーン）の罠カードの uid。selfUid（偽物のわな自身）は除く */
function fakeTrapOwnTrapsS527(gs, p, selfUid){
  gs = gs || gameState;
  const P = gs.players[p], out = [];
  (P.sz || []).forEach(c=>{
    if(!c || c.uid == null || c.uid === selfUid) return;
    const db = dbOf(c);
    if(db && db.k === 't') out.push(c.uid);
  });
  return out;
}
/* 発動されたリンクが「自分フィールドの罠カードを破壊する事が確定している」なら、守る uid の一覧 */
function fakeTrapCertainS03(gs, link, p, selfUid){
  gs = gs || gameState;
  if(!link || (link.player !== 0 && link.player !== 1)) return [];
  if(link.player === p) return [];                       /* 「相手が発動した時」 */
  const mine = fakeTrapOwnTrapsS527(gs, p, selfUid);
  if(!mine.length) return [];
  /* (A) 対象を取る効果は、対象になっているカードだけを見る */
  const tg = (typeof linkTargetUidsS03 === 'function') ? linkTargetUidsS03(link) : [];
  if(tg.length){
    const hit = tg.filter(u=>mine.indexOf(u) >= 0);
    return hit;
  }
  /* (B) 対象を取らない「全て破壊」 */
  const w = fakeTrapWipesS527(link.name);
  if(!w) return [];
  return mine.slice();
}
/* ---- 破壊を止める印 ------------------------------------------------------ */
function fakeTrapNoteS03(gs, rec){
  if(!gs || !rec || !Array.isArray(rec.uids) || !rec.uids.length) return false;
  /* Action で置く（journal に残るので Replay・保存・再開でも同じ値になる）。 */
  const payload = {player:rec.player, srcUid:(rec.srcUid != null) ? rec.srcUid : null, uids:rec.uids.slice()};
  if(typeof commitAutomaticActionV44 === 'function'){
    commitAutomaticActionV44({type:'FAKE_TRAP_NOTE_S03', rec:payload});
  }else{
    gs.fakeTrapS03 = Object.assign({turn:gs.turn}, payload);
  }
  return true;
}
function fakeTrapClearS03(gs){
  gs = gs || ((typeof gameState !== 'undefined') ? gameState : null);
  if(!gs || !gs.fakeTrapS03) return false;
  if(typeof commitAutomaticActionV44 === 'function') commitAutomaticActionV44({type:'FAKE_TRAP_CLEAR_S03'});
  else delete gs.fakeTrapS03;
  return true;
}
/* その破壊（Action a）から card を守るか。罠カードの破壊だけを止める。 */
function fakeTrapSpareS03(gs, a, card){
  gs = gs || gameState;
  const rec = gs && gs.fakeTrapS03;
  if(!rec || !a || !card || card.uid == null) return false;
  if(rec.uids.indexOf(card.uid) < 0) return false;
  if(!a.srcS03 || a.srcS03.uid == null || rec.srcUid == null || a.srcS03.uid !== rec.srcUid) return false;
  const db = dbOf(card);
  if(!db || db.k !== 't') return false;
  return true;
}
