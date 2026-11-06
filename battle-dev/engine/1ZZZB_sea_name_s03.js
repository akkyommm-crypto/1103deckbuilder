/* =========================================================================
   S03-U523 — 「海」として扱われるカードを、現在の名前でフィールド全体から探す
   -------------------------------------------------------------------------
   《忘却の海底神殿》（永続罠）は「このカードがフィールド上に存在する限り、このカードのカード名は『海』として扱う」。
   当時の裁定は、この扱いが「海」を要求する側・コストにする側から**実際に見える**事を示している:
     WIKI-CAD8E3C2E5FD（09/11/14）《海竜－ダイダロス》などの「《海》をコストにする効果」のコストに使用できる。
     WIKI-C8A821DF0FA0（09/11/14）《王宮のお触れ》発動中は「『海』として扱う効果」が無効になり、コストにできない。
     WIKI-ECF09EA16413（09/12/11）セットされた状態の《忘却の海底神殿》は《コダロス》のコストにできない。
     WIKI-B75520DE02A7（10/01/15）表側表示で存在する時、《竜巻海流壁》を発動できる。
     WIKI-D46C2788D09D（09/12/16）《伝説の都 アトランティス》と両方ある場合、《コダロス》はどちらか1枚だけ送ればよい。
   以前はどの参照も「フィールドゾーンにある、カードデータが《海》のカード」しか探しておらず、
   魔法＆罠ゾーンのカードが「海」として扱われる事を見られなかった。ここに 1 つにまとめる。

   ・名前は currentNameV17（System v17）で見る。continuousSources() は無効化された罠を外すので
     （S03-U118 の trapSourcesFilterS03）、《王宮のお触れ》《トラップ・スタン》《人造人間－サイコ・ショッカー》の
     下では「海」として扱われない（上の 09/11/14 の答えがそのまま出る）。
   ・表側表示だけ（セットは不可）。発動がまだ解決していないカード（activationPending）も含めない。
   ・ゾーンはモンスターゾーン・魔法＆罠ゾーン・フィールドゾーンのすべて。player を渡すとその側だけ。
   ========================================================================= */
function seaCardsOnFieldS03(player){
  if(typeof gameState === 'undefined' || !gameState || !gameState.players) return [];
  const out = [];
  const ps = (player === 0 || player === 1) ? [player] : [0, 1];
  ps.forEach(p=>{
    const P = gameState.players[p]; if(!P) return;
    const groups = [['mz', P.mz || []], ['sz', P.sz || []], ['field', P.field ? [P.field] : []]];
    groups.forEach(g=>{
      const zone = g[0];
      g[1].forEach((c, i)=>{
        if(!c || c.face !== 'up' || c.activationPending || c.activationNegated) return;
        const nm = (typeof currentNameV17 === 'function') ? currentNameV17(c) : cardName(c);
        if(nm !== '海') return;
        out.push({p:p, zone:zone, index:(zone === 'field' ? 0 : i), card:c, db:dbOf(c)});
      });
    });
  });
  return out;
}
function seaOnFieldS03(player){ return seaCardsOnFieldS03(player).length > 0; }
