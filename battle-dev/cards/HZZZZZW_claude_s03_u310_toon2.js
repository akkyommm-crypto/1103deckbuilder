/* S03-U310: トゥーン monsters, part 2 — the five with a Special Summon procedure (carddata texts), on `toonCommonS03` (cards/HZZZZZV, S03-U309).

   Shared text: このカードは通常召喚できない。自分フィールドに「トゥーン・ワールド」が存在し、[自分フィールドのモンスターN体をリリースした場合に]特殊召喚できる。
     ②（直接攻撃）相手フィールドにトゥーンモンスターが存在しない場合、このカードは直接攻撃できる。存在する場合、トゥーンモンスターを攻撃対象にしなければならない。
     ③ フィールドの「トゥーン・ワールド」が破壊された時にこのカードは破壊される。
   トゥーン・デーモン (Lv6)                   通常召喚できない。トゥーン・ワールドが自分フィールド上に存在する場合のみ特殊召喚できる(レベル5以上はリリースが必要)。特殊召喚したターンには攻撃できない。
                                              500LPを払わなければ攻撃宣言できない。
   トゥーン・マーメイド (Lv4)                  トゥーン・ワールドが自分フィールドに存在する場合に特殊召喚できる。特殊召喚したターンには攻撃できない。500LPを払わなければ攻撃宣言できない。
   トゥーン・ドラゴン・エッガー (Lv7)          トゥーン・ワールド＋自分フィールドのモンスター2体をリリース。特殊召喚したターンには攻撃できない。攻撃宣言の際に500LPを払わなければならない。
   トゥーン・ブラック・マジシャン・ガール (Lv6) トゥーン・ワールド＋自分フィールドのモンスター1体をリリース。攻撃力は、お互いの墓地の「ブラック・マジシャン」「マジシャン・オブ・ブラックカオス」の数×300アップする。
                                              (no summon-turn ban, no LP cost in its text)
   ブルーアイズ・トゥーン・ドラゴン (Lv8)     トゥーン・ワールド＋自分フィールドのモンスター2体をリリース。特殊召喚したターンには攻撃できない。攻撃宣言の際に500LPを払わなければならない。

   Notes
   - The procedure is the card's own summonProcedure (from the hand, no chain, summon negation window): the monsters to release are chosen first, then both are sent to the Graveyard
     as the cost. A full Monster Zone is no obstacle when the procedure releases (sp.freesZoneS03, engine/1ZW, S03-U310).
   - 「通常召喚できない」 is read from the text (engine/70, cannotNormalSummonS03); another effect may Special Summon it (Monster Reborn …) only after it was properly summoned (engine/1ZK).
   - デーモン's 「(レベル5以上はリリースが必要)」 is read as the Tribute Summon count for its Level (Lv5-6: 1 monster) — recorded as the reading used.
   - The attack LP cost is attackLpCostS03 (engine/00, paid at the declaration; an attacker with too little LP cannot declare). The attack-target rule is engine/1ZU (cannotBeAttackedByS03). */

function u310Releasables(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>!x.card.cannotTribute}); }
function u310Procedure(name, n){
  return {
    from:'hand', positions:['atk','def'],
    freesZoneS03(p){ return n>0 && toonWorldOwnS03(p) && u310Releasables(p).length>=n; },
    condition(ctx){
      if(!toonWorldOwnS03(ctx.player)){ ctx.reason = '自分フィールドに「トゥーン・ワールド」が存在しません'; return false; }
      if(n>0 && u310Releasables(ctx.player).length<n){ ctx.reason = `リリースできるモンスターが${n}体必要です`; return false; }
      return true;
    },
    cost(ctx, done){
      if(n===0){ done(true); return; }
      const picked = [];
      const choose = ()=>{
        const pool = u310Releasables(ctx.player).filter(x=>picked.indexOf(x.card)<0);
        if(!pool.length){ done(false); return; }
        API.selectCard(`${name}：リリースするモンスター（${picked.length+1}/${n}）`, pool, t=>{
          const r = resolveTarget(t);
          if(!r || r.zone!=='mz'){ done(false); return; }
          picked.push(r.card);
          if(picked.length<n){ choose(); return; }
          picked.forEach(c=>{ const h = locateCardAnyV4(c); if(h && h.zone==='mz') API.sendToGrave(h, `${name}（リリース）`); });
          done(true);
        });
      };
      choose();
    }
  };
}
function u310Define(name, n, opts, extra){
  return defineUnifiedCardV4(name, [toonWorldEffectS03(name)],
    toonCommonS03(Object.assign({special:true, directWorld:false, mustToon:true, lpCost:500}, opts||{}),
      Object.assign({summonProcedure:u310Procedure(name, n)}, extra||{})));
}

u310Define('トゥーン・デーモン', 1);
u310Define('トゥーン・マーメイド', 0);
u310Define('トゥーン・ドラゴン・エッガー', 2);
u310Define('ブルーアイズ・トゥーン・ドラゴン', 2);

/* ---- トゥーン・ブラック・マジシャン・ガール: ATK +300 per 「ブラック・マジシャン」 / 「マジシャン・オブ・ブラックカオス」 in both Graveyards ---- */
function u310BmgCount(){
  let n = 0;
  gameState.players.forEach(P=>(P.grave||[]).forEach(c=>{ const nm = cardName(c); if(nm==='ブラック・マジシャン' || nm==='マジシャン・オブ・ブラックカオス') n++; }));
  return n;
}
u310Define('トゥーン・ブラック・マジシャン・ガール', 1, {special:false, noBan:true, lpCost:0}, {
  continuous:{ apply(card, self){ if(card!==self) return null; const n = u310BmgCount(); return n ? {atk:n*300} : null; } }
});
