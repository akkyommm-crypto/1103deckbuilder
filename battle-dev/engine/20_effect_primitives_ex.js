/* =========================================================================
   効果処理エンジン
   ① AUTO_EFFECT  … 宣言テーブル（サーチ/リクルート/落とし）約220枚
   ② HAND_EFFECT / FIELD_EFFECT / GRAVE_EFFECT … 1103汎用の個別スクリプト
   実行は全て applyAction のプリミティブ経由なので Undo が効く。
   ========================================================================= */

/* HTML属性内(onclick="...")に安全に埋め込めるJS文字列リテラルを作る。
   JSON.stringify はダブルクォートを出すため属性が壊れる。
   シングルクォート括りにし、危険な文字を実体参照/エスケープする。 */
function jsStr(v){
  return "'" + String(v)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "\\n")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;") + "'";
}
/* 配列・オブジェクトを属性内に埋め込む（ダブルクォートを実体参照化） */
function jsVal(v){
  return JSON.stringify(v).replace(/"/g, "&quot;");
}

/* ---- 対象選択のための共通ピッカー ---------------------------------- */
/* PICK: 一覧から1枚選ばせる。cards=[{label, sub, onPick}] */
function openPick(title, note, items, onCancel){
  if(!items.length){
    showToast("対象がありません");
    if(onCancel) onCancel();
    return;
  }
  const rows = items.map((it,i)=>{
    const c=it.card||null, db=c?dbOf(c):null;
    const thumb = it.img
      ? `<span class="pk-thumb"><img src="${it.img}" onerror="this.parentElement.style.display='none'"></span>`
      : (db&&db.c ? `<span class="pk-thumb"><img src="${IMG_BASE}${db.c}.webp" onerror="this.parentElement.style.display='none'"></span>` : '');
    return `<div class="act pick-row" onclick="__pick(${i})">
       ${thumb}<span class="pk-copy"><span class="pk-nm">${it.label}</span>
       ${it.sub?`<span class="pk-sub">${it.sub}</span>`:""}</span>
     </div>`;
  }).join("");
  PICK_ITEMS = items; PICK_CANCEL = onCancel||null;
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">${title}</h3>
    ${note?`<div class="meta" style="margin-bottom:10px">${note}</div>`:""}
    <div class="pick-list">${rows}</div>
    <div class="act-grid" style="margin-top:10px">
      <div class="act" onclick="peekBoard()">盤面を確認する</div>
    </div>
    <button class="close" onclick="__pickCancel()">やめる</button>`;
  veil.classList.add("on");
}
let PICK_ITEMS=[], PICK_CANCEL=null;
function __pick(i){
  const it = PICK_ITEMS[i];
  PICK_ITEMS=[]; PICK_CANCEL=null;
  closeSheet();
  if(it && it.onPick) it.onPick();
}
function __pickCancel(){
  if(RESOLVE_ANCHOR != null){ dismissSheet(); return; }
  const cb = PICK_CANCEL;
  PICK_ITEMS=[]; PICK_CANCEL=null;
  closeSheet();
  if(cb) cb();
}

/* ---- フィルタ（index.html の soloAutoMatch と同仕様） ---------------- */
function autoMatch(f){
  return function(c){
    if(!c) return false;
    if(c.ex) return false;
    if(f.tk==='m' && c.k!=='m') return false;
    if(f.tk==='s' && c.k!=='s') return false;
    if(f.tk==='t' && c.k!=='t') return false;
    if(f.tk==='st' && !(c.k==='s'||c.k==='t')) return false;
    if(f.lvmax!=null && !(c.k==='m'&&c.lv!=null&&c.lv<=f.lvmax)) return false;
    if(f.lvmin!=null && !(c.k==='m'&&c.lv!=null&&c.lv>=f.lvmin)) return false;
    if(f.lv!=null && !(c.k==='m'&&c.lv===f.lv)) return false;
    if(f.at && c.at!==f.at) return false;
    if(f.ra && c.ra!==f.ra) return false;
    if(f.normal && (c.st||[]).indexOf('通常')<0) return false;
    if(f.tuner && (c.st||[]).indexOf('チューナー')<0) return false;
    if(f.atkmax!=null && !(c.atk!=null&&c.atk<=f.atkmax)) return false;
    if(f.defmax!=null && !(c.def!=null&&c.def<=f.defmax)) return false;
    /* P4 SetcodeAuthority: 名称指定は passcode ベースの authority で判定する。
       group     … named predicate（「X」と名のついた）。isCardInGroupV4 で解決
       cardCode  … 特定カード1枚の指定。passcode 完全一致
       canonical … alias を含む同名判定（ハーピィ・レディ1/2/3 等）
       arch      … legacy のカード名部分一致。P4未整備の述語のみ残る。新規使用禁止 */
    if(f.group && !(typeof isCardInGroupV4==='function' && isCardInGroupV4(c, f.group))) return false;
    if(f.cardCode!=null && Number(c.c)!==Number(f.cardCode)) return false;
    if(f.canonical!=null){
      if(typeof canonicalCardCodeV4!=='function') return false;
      if(canonicalCardCodeV4(c)!==Number(f.canonical)) return false;
    }
    if(f.arch && String(c.n).indexOf(f.arch)<0) return false;
    if(f.exclude && c.n===f.exclude) return false;
    return true;
  };
}

/* ---- ゾーン参照ヘルパ ---------------------------------------------- */
function myP(){ return gameState.players[gameState.activePlayer]; }
function oppIdx(p){ return p===0?1:0; }
/* S03-U248: a Trap Monster on the field carries its monster data (c.asMonsterDbS03, zone-local, engine/1ZZI), read like a token's */
function dbOf(c){ return (c && c.token) ? c.token : ((c && c.asMonsterDbS03) ? c.asMonsterDbS03 : (CARD_DB[c?.id]||{})); }
function labelOf(c){ const d=dbOf(c); return d.n||"カード"; }
function subOf(c){
  const d=dbOf(c);
  if(d.k==='m') return `${d.at||''}/${d.ra||''} Lv${d.lv||'-'} 攻${d.atk??'-'}`;
  return d.k==='s' ? `魔法${d.sub?'・'+d.sub:''}` : `罠${d.sub?'・'+d.sub:''}`;
}
/* デッキから条件に合うカードの位置一覧 */
function deckMatches(p, filt){
  const P = gameState.players[p]; const out=[];
  P.deck.forEach((c,i)=>{ if(filt(dbOf(c))) out.push({i, c}); });
  return out;
}
function graveMatches(p, filt){
  const P = gameState.players[p]; const out=[];
  P.grave.forEach((c,i)=>{ if(filt(dbOf(c))) out.push({i, c}); });
  return out;
}

/* ---- 宣言テーブルの実行（search / recruit / mill） ------------------- */
function runAutoEffect(p, srcName, ent, selfLoc){
  const filtBase = autoMatch(ent.f);
  const filt = (cc)=>{
    if(!cc || cc.ex) return false;
    if(ent.op==='recruit' && cc.k!=='m') return false;
    return filtBase(cc);
  };
  const P = gameState.players[p];
  if(ent.op==='recruit' && P.mz.length>=ZONE_LIMITS.mz){ showToast("モンスターゾーンが一杯です"); return; }
  const cands = deckMatches(p, filt);
  if(!cands.length){ showToast("対象がデッキにありません"); return; }
  const opJa = {search:"サーチ", mill:"墓地へ送る", recruit:"特殊召喚"}[ent.op];
  openPick(`${srcName}：${opJa}する対象`, `デッキ ${cands.length}枚が該当`,
    cands.map(({i,c})=>({
      label: labelOf(c), sub: subOf(c),
      onPick: ()=>{
        if(ent.op==='search'){ const lock=deckToHandLockReasonV32(p); if(lock) showToast(lock); else act({type:"FX_SEARCH", player:p, deckIndex:i, reason:srcName}); }
        else if(ent.op==='mill')   act({type:"FX_MILL",   player:p, deckIndex:i, reason:srcName});
        else                       act({type:"FX_SPECIAL_SUMMON", player:p, from:"deck", fromIndex:i, pos:"atk", reason:srcName});
        afterEffect(p, selfLoc, srcName);
      }
    })));
}

/* 魔法・罠が効果を出し終えたら墓地へ送る */
function afterEffect(p, selfLoc, srcName){
  if(!selfLoc) return;
  if(selfLoc.keep) return;                 // 永続・フィールドは残す
  act({type:"FX_SELF_TO_GRAVE", player:p, zone:selfLoc.zone, index:selfLoc.index});
}

/* =========================================================================
   1103環境の汎用カード個別スクリプト
   fn(p, selfLoc) : p=発動プレイヤー, selfLoc={zone,index,keep?}
   対象選択が要るものは openPick を使う。全て act() 経由なので Undo 可。
   ========================================================================= */
const CARD_EFFECT = {

  /* ---------- 全体除去 ---------- */
  "サンダー・ボルト": function(p, loc){
    const o = oppIdx(p);
    act({type:"FX_WIPE_ZONE", player:o, zone:"mz", reason:"サンダー・ボルト"});
    afterEffect(p, loc, "サンダー・ボルト");
  },
  "ブラック・ホール": function(p, loc){
    act({type:"FX_WIPE_ZONE", player:0, zone:"mz", reason:"ブラック・ホール"});
    act({type:"FX_WIPE_ZONE", player:1, zone:"mz", reason:"ブラック・ホール"});
    afterEffect(p, loc, "ブラック・ホール");
  },
  "激流葬": function(p, loc){
    act({type:"FX_WIPE_ZONE", player:0, zone:"mz", reason:"激流葬"});
    act({type:"FX_WIPE_ZONE", player:1, zone:"mz", reason:"激流葬"});
    afterEffect(p, loc, "激流葬");
  },
  "聖なるバリア －ミラーフォース－": function(p, loc){
    const o = oppIdx(p);
    const P = gameState.players[o];
    const atkPos = [];
    P.mz.forEach((c,i)=>{ if(c.face==='up' && c.pos==='atk') atkPos.push(i); });
    if(!atkPos.length){ showToast("相手に攻撃表示モンスターがいません"); return; }
    // 後ろから消す（インデックスずれ防止）
    atkPos.slice().reverse().forEach(i=>{
      act({type:"FX_TO_GRAVE", player:o, zone:"mz", index:i, reason:"ミラーフォース"});
    });
    afterEffect(p, loc, "ミラーフォース");
  },
  "大嵐": function(p, loc){
    // 自分の発動中のこのカードは残したまま両者の魔法罠を流す
    act({type:"FX_WIPE_ZONE", player:oppIdx(p), zone:"sz", reason:"大嵐"});
    const P = gameState.players[p];
    for(let i=P.sz.length-1;i>=0;i--){
      if(loc && loc.zone==='sz' && i===loc.index) continue;
      act({type:"FX_TO_GRAVE", player:p, zone:"sz", index:i, reason:"大嵐"});
    }
    afterEffect(p, loc, "大嵐");
  },

  /* ---------- 単体除去 ---------- */
  "サイクロン": function(p, loc){
    const targets = [];
    [0,1].forEach(pl=>{
      const P = gameState.players[pl];
      P.sz.forEach((c,i)=>targets.push({pl, zone:"sz", i, c}));
      if(P.field) targets.push({pl, zone:"field", i:0, c:P.field});
    });
    const list = targets.filter(t=>!(loc && t.pl===p && t.zone===loc.zone && t.i===loc.index));
    openPick("サイクロン：破壊する魔法・罠を選ぶ", "裏側のカードも選べます",
      list.map(t=>({
        label: (t.c.face==='down' ? "裏側のカード" : labelOf(t.c)),
        sub: `${nameOf(t.pl)}・${t.zone==='field'?'フィールド':'魔法罠'}`,
        onPick: ()=>{
          act({type:"FX_TO_GRAVE", player:t.pl, zone:t.zone, index:t.i, reason:"サイクロン"});
          afterEffect(p, loc, "サイクロン");
        }
      })));
  },
  "月の書": function(p, loc){
    const targets=[];
    [0,1].forEach(pl=>{
      gameState.players[pl].mz.forEach((c,i)=>{ if(c.face==='up') targets.push({pl,i,c}); });
    });
    openPick("月の書：裏側守備表示にするモンスター", "",
      targets.map(t=>({
        label: labelOf(t.c), sub:`${nameOf(t.pl)}`,
        onPick: ()=>{
          act({type:"FX_SET_STATE", player:t.pl, zone:"mz", index:t.i, face:"down", pos:"def", reason:"月の書"});
          afterEffect(p, loc, "月の書");
        }
      })));
  },
  "強制脱出装置": function(p, loc){
    const targets=[];
    [0,1].forEach(pl=>{ gameState.players[pl].mz.forEach((c,i)=>targets.push({pl,i,c})); });
    openPick("強制脱出装置：手札に戻すモンスター", "",
      targets.map(t=>({
        label: t.c.face==='down'?"裏側のカード":labelOf(t.c), sub:`${nameOf(t.pl)}`,
        onPick: ()=>{
          act({type:"FX_BOUNCE", player:t.pl, zone:"mz", index:t.i, reason:"強制脱出装置"});
          afterEffect(p, loc, "強制脱出装置");
        }
      })));
  },
  "次元幽閉": function(p, loc){
    const o=oppIdx(p);
    const targets=[];
    gameState.players[o].mz.forEach((c,i)=>{ if(c.face==='up'&&c.pos==='atk') targets.push({i,c}); });
    openPick("次元幽閉：除外する攻撃モンスター", "",
      targets.map(t=>({
        label: labelOf(t.c), sub:`${nameOf(o)}`,
        onPick: ()=>{
          act({type:"FX_BANISH", player:o, zone:"mz", index:t.i, reason:"次元幽閉"});
          afterEffect(p, loc, "次元幽閉");
        }
      })));
  },
  "奈落の落とし穴": function(p, loc){
    const o=oppIdx(p);
    const targets=[];
    gameState.players[o].mz.forEach((c,i)=>{ const d=dbOf(c); if((d.atk||0)>=1500) targets.push({i,c}); });
    openPick("奈落の落とし穴：除外する（攻1500以上）", "",
      targets.map(t=>({
        label: labelOf(t.c), sub:`攻${dbOf(t.c).atk}`,
        onPick: ()=>{
          act({type:"FX_BANISH", player:o, zone:"mz", index:t.i, reason:"奈落の落とし穴"});
          afterEffect(p, loc, "奈落の落とし穴");
        }
      })));
  },

  /* ---------- 蘇生・展開 ---------- */
  "死者蘇生": function(p, loc){
    const targets=[];
    [0,1].forEach(pl=>{
      gameState.players[pl].grave.forEach((c,i)=>{ if(dbOf(c).k==='m') targets.push({pl,i,c}); });
    });
    if(gameState.players[p].mz.length>=ZONE_LIMITS.mz){ showToast("モンスターゾーンが一杯です"); return; }
    openPick("死者蘇生：蘇生するモンスター", "どちらの墓地からでも選べます",
      targets.map(t=>({
        label: labelOf(t.c), sub:`${nameOf(t.pl)}の墓地 / ${subOf(t.c)}`,
        onPick: ()=>{
          // 相手墓地から取る場合も自分の場に出す
          const P=gameState.players[t.pl];
          const card=P.grave[t.i];
          API.specialSummon(p,"grave",t.i,"atk","死者蘇生",t.pl);
          afterEffect(p, loc, "死者蘇生");
        }
      })));
  },
  "早すぎた埋葬": function(p, loc){
    const P=gameState.players[p];
    if(P.mz.length>=ZONE_LIMITS.mz){ showToast("モンスターゾーンが一杯です"); return; }
    const targets=[];
    P.grave.forEach((c,i)=>{ if(dbOf(c).k==='m') targets.push({i,c}); });
    openPick("早すぎた埋葬：蘇生する（LP800支払い）", "",
      targets.map(t=>({
        label: labelOf(t.c), sub: subOf(t.c),
        onPick: ()=>{
          act({type:"LP", player:p, delta:-800});
          act({type:"FX_SPECIAL_SUMMON", player:p, from:"grave", fromIndex:t.i, pos:"atk", reason:"早すぎた埋葬"});
          // 装備状態は簡略化：このカードは場に残す
        }
      })));
  },
  "リビングデッドの呼び声": function(p, loc){
    const P=gameState.players[p];
    if(P.mz.length>=ZONE_LIMITS.mz){ showToast("モンスターゾーンが一杯です"); return; }
    const targets=[];
    P.grave.forEach((c,i)=>{ if(dbOf(c).k==='m') targets.push({i,c}); });
    openPick("リビングデッドの呼び声：蘇生する", "",
      targets.map(t=>({
        label: labelOf(t.c), sub: subOf(t.c),
        onPick: ()=>{
          act({type:"FX_SPECIAL_SUMMON", player:p, from:"grave", fromIndex:t.i, pos:"atk", reason:"リビングデッドの呼び声"});
        }
      })));
  },

  /* ---------- ドロー・手札交換 ---------- */
  "強欲な壺": function(p, loc){
    act({type:"DRAW", player:p, n:2});
    afterEffect(p, loc, "強欲な壺");
  },
  "天使の施し": function(p, loc){
    act({type:"DRAW", player:p, n:3});
    showToast("手札を2枚選んで捨ててください");
    pickDiscard(p, 2, "天使の施し", ()=>afterEffect(p, loc, "天使の施し"));
  },
  "手札抹殺": function(p, loc){
    [0,1].forEach(pl=>{
      const P=gameState.players[pl];
      const n=P.hand.length;
      for(let i=P.hand.length-1;i>=0;i--){
        if(loc && pl===p && loc.zone==='hand' && i===loc.index) continue;
        act({type:"FX_DISCARD", player:pl, handIndex:i, reason:"手札抹殺"});
      }
      if(n) act({type:"DRAW", player:pl, n});
    });
    afterEffect(p, loc, "手札抹殺");
  },
  "貪欲な壺": function(p, loc){
    const P=gameState.players[p];
    const mons=[]; P.grave.forEach((c,i)=>{ if(dbOf(c).k==='m') mons.push({i,c}); });
    if(mons.length<5){ showToast("墓地のモンスターが5体未満です"); return; }
    const chosen=[];
    const finish=()=>{
      chosen.forEach(c=>{const r=resolveTarget({card:c});if(r)act({type:"FX_RETURN_DECK",player:r.p,zone:r.zone,index:r.index,reason:"貪欲な壺"});});
      act({type:"SHUFFLE",player:p});
      act({type:"DRAW",player:p,n:2});
      logIt(gameState, `貪欲な壺：選択したモンスター5体をデッキ/EXへ戻して2枚ドロー`);
      afterEffect(p, loc, "貪欲な壺");
    };
    const pickNext=()=>{
      if(chosen.length>=5){ finish(); return; }
      const left=[];
      P.grave.forEach((c,i)=>{ if(dbOf(c).k==='m' && !chosen.includes(c)) left.push({i,c}); });
      if(left.length < 5-chosen.length){ showToast("貪欲な壺：対象5体を選べません"); return; }
      openPick(`貪欲な壺：戻すモンスター（${chosen.length+1}/5）`,"5体を選択",
        left.map(({c})=>({card:c,label:labelOf(c),sub:subOf(c),onPick:()=>{chosen.push(c);pickNext();}})));
    };
    pickNext();
  },

  /* ---------- 個別モンスター効果（index.html から移植） ---------- */
  "終末の騎士": function(p, loc){
    const filt = c=>c.k==='m' && !c.ex && c.at==='闇';
    const cands = deckMatches(p, filt);
    if(!cands.length){ showToast("デッキに闇属性モンスターがいません"); return; }
    openPick("終末の騎士：デッキから闇属性モンスターを墓地へ", `${cands.length}枚が該当`,
      cands.map(({i,c})=>({
        label: labelOf(c), sub: subOf(c),
        onPick: ()=>act({type:"FX_MILL", player:p, deckIndex:i, reason:"終末の騎士"})
      })));
  },
  "ダーク・グレファー": function(p, loc){
    const P = gameState.players[p];
    const handDark=[]; P.hand.forEach((c,i)=>{ const d=dbOf(c); if(d.k==='m'&&d.at==='闇') handDark.push({i,c}); });
    if(!handDark.length){ showToast("手札に捨てる闇属性モンスターがいません"); return; }
    const deckDark = deckMatches(p, c=>c.k==='m'&&!c.ex&&c.at==='闇');
    if(!deckDark.length){ showToast("デッキに闇属性モンスターがいません"); return; }
    openPick("ダーク・グレファー：捨てる闇属性モンスター", "手札から1枚",
      handDark.map(({i,c})=>({
        label: labelOf(c), sub: subOf(c),
        onPick: ()=>{
          act({type:"FX_DISCARD", player:p, handIndex:i, reason:"ダーク・グレファー"});
          const dd = deckMatches(p, cc=>cc.k==='m'&&!cc.ex&&cc.at==='闇');
          openPick("ダーク・グレファー：デッキから墓地へ送る闇属性", "",
            dd.map(({i:di,c:dc})=>({
              label: labelOf(dc), sub: subOf(dc),
              onPick: ()=>act({type:"FX_MILL", player:p, deckIndex:di, reason:"ダーク・グレファー"})
            })));
        }
      })));
  },
  "馬頭鬼": function(p, loc){
    const P = gameState.players[p];
    if(P.mz.length>=ZONE_LIMITS.mz){ showToast("モンスターゾーンが一杯です"); return; }
    const selfIdx = loc ? loc.index : -1;
    const und=[]; P.grave.forEach((c,i)=>{ const d=dbOf(c); if(i!==selfIdx && d.k==='m' && d.ra==='アンデット') und.push({i,c}); });
    if(!und.length){ showToast("墓地に他のアンデット族がいません"); return; }
    openPick("馬頭鬼：特殊召喚するアンデット族", "自身は除外されます",
      und.map(({i,c})=>({
        label: labelOf(c), sub: subOf(c),
        onPick: ()=>{
          if(selfIdx>=0) act({type:"FX_BANISH", player:p, zone:"grave", index:selfIdx, reason:"馬頭鬼"});
          const P2=gameState.players[p];
          let ti = P2.grave.findIndex(x=>x===c);
          if(ti<0) ti = i>selfIdx && selfIdx>=0 ? i-1 : i;
          act({type:"FX_SPECIAL_SUMMON", player:p, from:"grave", fromIndex:ti, pos:"atk", reason:"馬頭鬼"});
        }
      })));
  },
  "グローアップ・バルブ": function(p, loc){
    const P = gameState.players[p];
    if(P.mz.length>=ZONE_LIMITS.mz){ showToast("モンスターゾーンが一杯です"); return; }
    act({type:"FX_MILL_TOP", player:p, n:1, reason:"グローアップ・バルブ"});
    const idx = loc ? loc.index : gameState.players[p].grave.findIndex(c=>dbOf(c).n==='グローアップ・バルブ');
    if(idx>=0) act({type:"FX_SPECIAL_SUMMON", player:p, from:"grave", fromIndex:idx, pos:"atk", reason:"グローアップ・バルブ"});
  },
  "ゾンビキャリア": function(p, loc){
    const P = gameState.players[p];
    if(P.mz.length>=ZONE_LIMITS.mz){ showToast("モンスターゾーンが一杯です"); return; }
    if(!P.hand.length){ showToast("デッキトップに戻す手札がありません"); return; }
    openPick("ゾンビキャリア：デッキトップに戻す手札", "",
      P.hand.map((c,i)=>({
        label: labelOf(c), sub: subOf(c),
        onPick: ()=>{
          act({type:"FX_HAND_TO_TOP", player:p, handIndex:i, reason:"ゾンビキャリア"});
          const gi = loc ? loc.index : gameState.players[p].grave.findIndex(x=>dbOf(x).n==='ゾンビキャリア');
          if(gi>=0) act({type:"FX_SPECIAL_SUMMON", player:p, from:"grave", fromIndex:gi, pos:"atk", reason:"ゾンビキャリア"});
        }
      })));
  },

  /* ---------- 手札誘発・その他 ---------- */
  "増殖するG": function(p, loc){
    showToast("相手の特殊召喚ごとに1枚ドロー（手動）");
    if(loc && loc.zone==='hand') act({type:"FX_DISCARD", player:p, handIndex:loc.index, reason:"増殖するG"});
  },
  "灰流うらら": function(p, loc){
    showToast("効果を無効にしました（手動で処理）");
    if(loc && loc.zone==='hand') act({type:"FX_DISCARD", player:p, handIndex:loc.index, reason:"灰流うらら"});
  },
};

/* 手札から n 枚捨てさせる（順に選択） */
function pickDiscard(p, n, reason, done){
  const P=gameState.players[p];
  if(n<=0 || !P.hand.length){ if(done) done(); return; }
  openPick(`${reason}：捨てる手札を選ぶ（あと${n}枚）`, "",
    P.hand.map((c,i)=>({
      label: labelOf(c), sub: subOf(c),
      onPick: ()=>{
        act({type:"FX_DISCARD", player:p, handIndex:i, reason});
        pickDiscard(p, n-1, reason, done);
      }
    })), done);
}

/* =========================================================================
   EXデッキ召喚（シンクロ / エクシーズ / 融合）
   1103環境はシンクロが主力。エクシーズは9期以降のカードプール用。
   ========================================================================= */
function exKind(db){
  const st = db.st||[];
  if(st.indexOf('シンクロ')>=0) return 'synchro';
  if(st.indexOf('エクシーズ')>=0) return 'xyz';
  if(st.indexOf('融合')>=0) return 'fusion';
  return null;
}
function isTuner(db){ return (db.st||[]).indexOf('チューナー')>=0; }

/* 場の表側モンスター（素材候補）を集める */
function materialCandidates(p, kind){
  const P = gameState.players[p];
  const out = [];
  P.mz.forEach((c,i)=>{
    if(c.face!=='up') return;          // 裏側は素材にできない
    const db = dbOf(c), sc=CARD_SCRIPTS[db.n];
    // v3.6.1: 「S素材にできない」等を素材候補の入口で除外する。
    if(kind==='synchro' && sc && sc.cannotSynchroMaterial===true) return;
    /* S03-U212: a conditional form — cannotSynchroMaterial(card) (BF－東雲のコチ: 「特殊召喚されたこのカードはS素材にできない」) */
    if(kind==='synchro' && sc && typeof sc.cannotSynchroMaterial==='function'){ let noS03=false; try{ noS03=!!sc.cannotSynchroMaterial(c); }catch(e){ noS03=false; } if(noS03) return; }
    /* S03-U169: 「このターン、…シンクロ素材にできない」 (プチトマボー's summons): a zone-local turn mark */
    if(kind==='synchro' && c.noSynchroMaterialTurnS03===gameState.turn) return;
    /* S03-U409: 「シンクロ素材にできない」 for as long as the card stays (カオス・ゴッデス's revived monster): a zone-local mark */
    if(kind==='synchro' && c.noSynchroMaterialS03===true) return;
    const baseLv=curLV(c);
    let levels=[baseLv];
    // System v3.8.0: 《チューニング・サポーター》のようにS素材時だけ複数のレベルとして扱えるカード。
    if(kind==='synchro' && sc && typeof sc.synchroMaterialLevelOptions==='function'){
      try{ const a=sc.synchroMaterialLevelOptions({player:p,card:c,db,baseLv}); if(Array.isArray(a)&&a.length) levels=a; }catch(e){}
    }
    [...new Set(levels.map(Number).filter(x=>Number.isFinite(x)&&x>=0))].forEach(lv=>out.push({i, c, db, lv, tuner: isTuner(db)}));
  });
  return out;
}

/* =========================================================================
   素材条件パーサ（ocgcore の material filter 相当）
   効果テキスト1行目の素材指定を構造化し、場のモンスターと突き合わせる。
   例）恐竜族レベル4モンスター×2 / 戦士族チューナー＋チューナー以外の「六武衆」モンスター1体以上
   ========================================================================= */

/* 長い種族名から先に判定する。「鳥獣族」が「獣族」に誤マッチするのを防ぐ。 */
const MAT_RACES = ['幻神獣','創造神','サイキック','アンデット','魔法使い','獣戦士','鳥獣',
                   'ドラゴン','爬虫類','悪魔','天使','昆虫','恐竜','海竜','機械','戦士',
                   '岩石','植物','獣','魚','雷','炎','水','風','地']
                  .sort((a,b)=>b.length-a.length);
const MAT_ATTRS = ['光','闇','地','水','炎','風','神'];

/* 旧融合の「砦を守る翼竜＋フェアリー・ドラゴン」のように
   括弧なしでカード名が並ぶ形式を解決するための名前集合 */
let MAT_NAMES = null;
function buildMaterialNameSet(){
  MAT_NAMES = new Set();
  (CARD_DB||[]).forEach(c=>{ if(c && c.n) MAT_NAMES.add(c.n); });
}

/* --- 1スロット分の条件を解析する --- */
function parseSlot(text){
  let s = String(text).trim();
  if(!s) return null;
  /* S03-U174: a slot 「…モンスター×2」 inside an 「A＋B×2」 line (剣闘獣ヘラクレイノス) is two materials of that kind (was read as one) */
  let mulS03 = null;
  const mm = s.match(/^(.*\S)\s*×\s*(\d+)$/);
  if(mm){ s = mm[1]; mulS03 = +mm[2]; }
  const qS03 = parseSlotBodyS03(s);
  if(qS03 && mulS03) qS03.count = {min:mulS03, max:mulS03};
  return qS03;
}
function parseSlotBodyS03(s){
  if(MAT_NAMES && MAT_NAMES.has(s)) return { count:{min:1,max:1}, nameExact:s };
  const q = { count:{min:1, max:1} };
  let m;
  if((m = s.match(/(\d+)\s*体以上/)))      { q.count = {min:+m[1], max:99}; }
  else if((m = s.match(/(\d+)\s*体まで/))) { q.count = {min:0,     max:+m[1]}; }
  else if((m = s.match(/(\d+)\s*体/)))     { q.count = {min:+m[1], max:+m[1]}; }
  if(/以上/.test(s) && !/レベル\s*\d+\s*以上/.test(s) && q.count.max === q.count.min){
    q.count = {min:q.count.min, max:99};
  }
  // 「チューナー以外」が先に来るので順序に注意
  if(/チューナー以外/.test(s))  q.tuner = false;
  else if(/チューナー/.test(s)) q.tuner = true;

  const nm = s.match(/「([^」]+)」/);
  if(nm){
    const rest = s.replace(/「[^」]+」/,'')
                  .replace(/と名のついた|モンスター|カード|\d+体以上|\d+体|の|＋/g,'').trim();
    if(!rest && !/と名のついた|モンスター/.test(s.replace(/「[^」]+」/,'')))
      q.nameExact = nm[1];
    else
      q.nameIncludes = nm[1];
  }
  for(const r of MAT_RACES){ if(s.indexOf(r+'族')>=0){ q.race = r; break; } }
  for(const a of MAT_ATTRS){ if(s.indexOf(a+'属性')>=0){ q.attr = a; break; } }
  if((m = s.match(/レベル\s*(\d+)\s*以上/)))      q.lvMin = +m[1];
  else if((m = s.match(/レベル\s*(\d+)\s*以下/))) q.lvMax = +m[1];
  else if((m = s.match(/レベル\s*(\d+)/)))        { q.lvMin = +m[1]; q.lvMax = +m[1]; }

  if(/通常モンスター/.test(s))                      q.isNormal  = true;
  if(/[Ss]モンスター|シンクロモンスター/.test(s))    q.isSynchro = true;
  if(/[Xx]モンスター|エクシーズモンスター/.test(s))  q.isXyz     = true;
  if(/融合モンスター/.test(s))                      q.isFusion  = true;
  if(/デュアルモンスター/.test(s))                  q.isDual    = true;
  return q;
}

/* --- カードDBエントリが1スロットの条件を満たすか --- */
function slotMatches(db, q, lv, card){
  const st = db.st || [];
  const LV = (lv != null) ? lv : (db.lv || 0);
  /* System v17: 種族・属性・名前・チューナーは runtime の現在値で判定する。
     上書きが無ければ印刷情報と同じ値になるので、既存の挙動は変わらない。 */
  const curRace = (card && typeof currentRaceV17==='function') ? currentRaceV17(card) : (db.ra||'');
  const curAttr = (card && typeof currentAttributeV17==='function') ? currentAttributeV17(card) : (db.at||'');
  const curName = (card && typeof currentNameV17==='function') ? currentNameV17(card) : (db.n||'');
  const curTuner = (card && typeof isTunerNowV17==='function') ? isTunerNowV17(card) : (st.indexOf('チューナー')>=0);
  if(q.nameExact && curName !== q.nameExact){
    const sc = card && CARD_SCRIPTS[cardName(card)];
    const canSub = sc && typeof sc.synchroNameSubstitute==='function' && sc.synchroNameSubstitute(q.nameExact);
    if(!canSub) return false;
  }
  if(q.nameIncludes && String(curName||'').indexOf(q.nameIncludes) < 0){
    const sc = card && CARD_SCRIPTS[cardName(card)];
    const canSub = sc && typeof sc.synchroNameSubstitute==='function' && sc.synchroNameSubstitute(q.nameIncludes);
    if(!canSub) return false;
  }
  if(q.race  && curRace !== q.race) return false;
  if(q.attr  && curAttr !== q.attr) return false;
  if(q.lvMin != null && LV < q.lvMin) return false;
  if(q.lvMax != null && LV > q.lvMax) return false;
  if(q.tuner === true  && !curTuner) return false;
  if(q.tuner === false &&  curTuner) return false;
  if(q.isNormal  && st.indexOf('通常')       < 0) return false;
  if(q.isSynchro && st.indexOf('シンクロ')   < 0) return false;
  if(q.isXyz     && st.indexOf('エクシーズ') < 0) return false;
  if(q.isFusion  && st.indexOf('融合')       < 0) return false;
  if(q.isDual    && st.indexOf('デュアル')   < 0) return false;
  return true;
}

/* --- 素材指定行を解析して {type, slots} を返す（カード名でキャッシュ） --- */
const MAT_SPEC_CACHE = new Map();
function parseMaterialSpec(db){
  if(!db || !db.n) return null;
  if(MAT_SPEC_CACHE.has(db.n)) return MAT_SPEC_CACHE.get(db.n);
  const spec = buildMaterialSpec(db);
  MAT_SPEC_CACHE.set(db.n, spec);
  return spec;
}
function buildMaterialSpec(db){
  const type = exKind(db);
  if(!type) return null;
  const line = String(db.e||'').split('\n')[0].trim();
  if(!line) return null;

  // 「×N」形式（エクシーズ・一部融合）→ 同一条件をN個
  /* S03-U174: only a line without 「＋」 is 「A×N」 as a whole (「A＋B×2」 = A and two B, parsed per slot below) */
  let m = (line.indexOf('＋')<0 && line.indexOf('+')<0) ? line.match(/^(.*?)\s*[×x]\s*(\d+)\s*(体以上)?\s*$/) : null;
  if(m){
    const q = parseSlot(m[1]);
    if(!q) return null;
    q.count = m[3] ? {min:+m[2], max:99} : {min:+m[2], max:+m[2]};
    return {type, slots:[q], raw:line};
  }
  // 「A＋B」形式（シンクロ・融合）
  if(line.indexOf('＋')>=0 || line.indexOf('+')>=0){
    const slots = line.split(/[＋+]/).map(x=>x.trim()).filter(Boolean)
                      .map(parseSlot).filter(Boolean);
    if(slots.length) return {type, slots, raw:line};
  }
  // 1行目が素材指定でない（特殊召喚限定モンスター等）
  // → 条件不明として通し、UI側で手動選択に回す
  return {type, slots:null, raw:line, permissive:true};
}

/* --- 候補から条件を満たす組み合わせを列挙する ---
   totalLv を渡すとレベル合計の一致も要求する（シンクロ用） */
function findMaterialCombos(cands, spec, totalLv, limit){
  const out = [], LIM = limit || 60;
  (function rec(si, used, picked){
    if(out.length >= LIM) return;
    if(si >= spec.slots.length){
      if(totalLv != null && picked.reduce((s,x)=>s+(x.lv||0),0) !== totalLv) return;
      if(picked.length) out.push(picked.slice());
      return;
    }
    const q = spec.slots[si];
    const pool = cands.filter(c => !used.has(c.i) && slotMatches(c.db, q, c.lv, c.c));
    const maxN = Math.min(q.count.max, pool.length);
    for(let n = q.count.min; n <= maxN; n++){
      if(n === 0){ rec(si+1, used, picked); continue; }
      combinations(pool, n).forEach(set=>{
        if(out.length >= LIM) return;
        set.forEach(c=>used.add(c.i));
        rec(si+1, used, picked.concat(set));
        set.forEach(c=>used.delete(c.i));
      });
    }
  })(0, new Set(), []);
  const seen = new Set(), uniq = [];
  out.forEach(set=>{
    const key = set.map(x=>x.i).sort((a,b)=>a-b).join(',');
    if(seen.has(key)) return;
    seen.add(key); uniq.push(set);
  });
  return uniq;
}

/* --- EX召喚の候補を統一的に求める ---
   戻り値 {permissive, combos:[{materials:[mzIndex], label}]} */
function exCombos(p, db, onlyIdxS03){
  const spec = parseMaterialSpec(db);
  if(!spec) return {permissive:true, combos:[], why:"EXモンスターではありません"};
  if(spec.permissive) return {permissive:true, combos:[], spec};
  const kind = spec.type;
  const totalLv = (kind === 'synchro') ? (db.lv||0) : null;
  /* S03-U163: onlyIdxS03 — restrict the candidates to the given materials (legality check of one chosen set, not capped by the
     combination limit) */
  let candsS03 = materialCandidates(p, kind);
  if(Array.isArray(onlyIdxS03)) candsS03 = candsS03.filter(x=>onlyIdxS03.indexOf(x.i)>=0);
  let sets = findMaterialCombos(candsS03, spec, totalLv);
  if(kind==='synchro'){
    sets = sets.filter(set=>set.every(src=>{
      const sc=CARD_SCRIPTS[src.db.n];
      if(!sc || typeof sc.synchroMaterialRestriction!=='function') return true;
      try{return !!sc.synchroMaterialRestriction({player:p,source:src.card||src.c,sourceDb:src.db,exDb:db,set,spec});}catch(e){return false;}
    }));
  }
  return {
    permissive:false, spec,
    combos: sets.map(set=>({
      materials: set.map(x=>x.i),
      label: set.map(x=>`${x.db.n}(Lv${x.lv})`).join(" ＋ ")
    }))
  };
}

/* S03-U163: are exactly these materials a legal set for this Synchro / Xyz Monster? (the UI only offers exCombos, but the summon
   entry points did not check what they were given — a test Synchro Summoned ゴヨウ・ガーディアン with a DARK Tuner) */
function exMaterialsLegalS03(p, exDb, materials){
  const spec = parseMaterialSpec(exDb);
  if(!spec || spec.permissive) return true;
  const want = Array.isArray(materials) ? materials.slice() : [];
  if(!want.length || new Set(want).size!==want.length) return false;
  const key = a=>a.slice().sort((x,y)=>x-y).join(',');
  return exCombos(p, exDb, want).combos.some(c=>key(c.materials)===key(want));
}

function combinations(arr, k){
  const res=[];
  (function rec(start, cur){
    if(cur.length===k){ res.push(cur.slice()); return; }
    for(let i=start;i<arr.length;i++){ cur.push(arr[i]); rec(i+1,cur); cur.pop(); }
  })(0,[]);
  return res;
}

/* EXデッキを開いて召喚可能なモンスターを提示 */
function openExDeck(p){
  const P = gameState.players[p];
  if(!rules().exSummon){
    sheet.innerHTML = `<div class="grip"></div><h3>エクストラデッキ</h3>
      <div class="phase-note">${phaseJp(gameState.phase)}：${rules().note}</div>
      <div class="meta" style="margin:10px 0 12px">${whyBlocked('exSummon')}<br>
        メインフェイズに進んでから召喚してください。</div>
      <button class="close" onclick="closeSheet()">閉じる</button>`;
    veil.classList.add("on"); return;
  }
  if(!P.ex.length){
    sheet.innerHTML = `<div class="grip"></div><h3>エクストラデッキ</h3>
      <div class="meta" style="margin-bottom:12px">EXデッキにカードがありません。<br>
      デッキビルダーでEXデッキを組むと、ここから召喚できます。</div>
      <button class="close" onclick="closeSheet()">閉じる</button>`;
    veil.classList.add("on"); return;
  }
  const rows = P.ex.map((c,i)=>{
    const db = dbOf(c);
    const kind = exKind(db);
    const kindJa = {synchro:"シンクロ", xyz:"エクシーズ", fusion:"融合"}[kind] || "EX";
    // 召喚可能かを判定
    let ok=false, why="";
    const res = exCombos(p, db);
    const summonBlock=((PLAY_MODE===PLAY_MODES.DUEL&&typeof v46SpecialSummonRestrictionReason==='function')?v46SpecialSummonRestrictionReason(p,db):'')
      || ((PLAY_MODE===PLAY_MODES.DUEL&&kind==='synchro'&&typeof synchroSummonLockReasonS03==='function')?synchroSummonLockReasonS03(p):'');   /* S03-U139 */
    if(summonBlock){
      ok=false; why=summonBlock;
    }else if(PLAY_MODE===PLAY_MODES.DUEL && kind==='fusion' && contactProcRowS03(p,i,db)){
      /* S03-U174: contact fusion — the card's own procedure from the EX Deck (engine/1ZW) */
      const L=contactProcRowS03(p,i,db); ok=L.ok; why=L.reason||'';
      if(ok) return `<div class="act pick-row" onclick="closeSheet();runSummonProcedure(${jsStr(db.n)},${p},'ex',${i})">
      <span class="pk-nm">${db.n}</span><span class="pk-sub">融合（コンタクト融合：${CONTACT_DEST_JP_S03[contactSpecS03(db).dest]}） Lv${db.lv||'-'} 攻${db.atk??'-'}</span></div>`;
    }else if(PLAY_MODE===PLAY_MODES.DUEL && kind==='fusion'){
      ok=false; why='融合召喚は融合魔法・カード効果の解決から行います';
    }else if(res.permissive){
      ok = PLAY_MODE!==PLAY_MODES.DUEL;   // 条件不明はDUELで推測召喚しない
      why = ok ? '素材を手動で選びます' : '素材条件を自動判定できないためMANUALで処理してください';
    } else {
      ok = res.combos.length > 0;
      why = ok ? "" : `素材条件：${res.spec.raw}`;
    }
    return `<div class="act pick-row ${ok?'':'dim'}" onclick="${ok?`exSummonPick(${p},${i})`:`showToast('${why}')`}">
      <span class="pk-nm">${db.n}</span>
      <span class="pk-sub">${kindJa} ${kind==='xyz'?`ランク${db.lv}`:`Lv${db.lv||'-'}`} 攻${db.atk??'-'}${ok?'':' ・'+why}</span>
    </div>`;
  }).join("");
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">エクストラデッキ（${P.ex.length}）</h3>
    <div class="meta" style="margin-bottom:10px">召喚できるものが選択できます。素材は自動で判定します。</div>
    <div class="pick-list">${rows}</div>
    <button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}

/* EXモンスターを選んだあと、素材の組み合わせを選ばせる */
function exSummonPick(p, exIndex){
  const P = gameState.players[p];
  const c = P.ex[exIndex]; const db = dbOf(c);
  const kind = exKind(db);
  const res = exCombos(p, db);
  if(res.permissive){
    // 素材条件を読み取れないカードは場から手動で選ぶ
    exFusionPick(p, exIndex);
    return;
  }
  const combos = res.combos;
  if(!combos.length){ showToast(`素材条件：${res.spec.raw}`); return; }
  if(combos.length===1){
    askExSummonPos(p, exIndex, combos[0].materials, kind);
    return;
  }
  openPick(`${db.n}：使用する素材を選ぶ`, `${combos.length}通りの組み合わせ`,
    combos.map(cb=>({
      label: cb.label, sub:"",
      onPick: ()=>askExSummonPos(p, exIndex, cb.materials, kind)
    })));
}

/* 融合：素材を順にタップして選ぶ */
let FUSION_SEL = [];
function exFusionPick(p, exIndex){
  FUSION_SEL = [];
  fusionStep(p, exIndex);
}
function fusionStep(p, exIndex){
  const P = gameState.players[p];
  const db = dbOf(P.ex[exIndex]);
  const cands = materialCandidates(p).filter(x=>FUSION_SEL.indexOf(x.i)<0);
  const chosen = FUSION_SEL.map(i=>{
    const cc = P.mz[i]; return cc ? dbOf(cc).n : "?";
  });
  const items = cands.map(x=>({
    label: x.db.n, sub:`Lv${x.lv} 攻${x.db.atk??'-'}`,
    onPick: ()=>{ FUSION_SEL.push(x.i); fusionStep(p, exIndex); }
  }));
  // 確定ボタンを先頭に
  if(FUSION_SEL.length>=2){
    items.unshift({
      label:`▶ この ${FUSION_SEL.length}体で融合召喚する`, sub:chosen.join(" ＋ "),
      onPick: ()=>askExSummonPos(p, exIndex, FUSION_SEL.slice(), 'fusion')
    });
  }
  openPick(`${db.n}：融合素材を選ぶ`,
    FUSION_SEL.length?`選択中：${chosen.join(" ＋ ")}`:"場のモンスターを2体以上タップ",
    items);
}

function askExSummonPos(p, exIndex, materials, kind){
  const P = gameState.players[p];
  const db = dbOf(P.ex[exIndex]);
  closeSheet();
  // 表示形式を選ばせる（守備で出したい場面もあるため）
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:6px">${db.n}</h3>
    <div class="meta" style="margin-bottom:12px">表示形式を選んでください</div>
    <div class="act-grid">
      <div class="act fx" onclick="doExSummon(${p},${exIndex},${jsVal(materials)},'${kind}','atk')">攻撃表示</div>
      <div class="act" onclick="doExSummon(${p},${exIndex},${jsVal(materials)},'${kind}','def')">守備表示</div>
    </div>
    <button class="close" onclick="closeSheet()">やめる</button>`;
  veil.classList.add("on");
}

/* =========================================================================
   墓地・手札発動の自動判別
   スクリプト未実装のカードでも、効果テキストから発動場所を推定して
   相手ターン中の割り込み候補に載せる。
   誤判定してもプレイヤーが選ばなければ発動しないので実害はない。
   ========================================================================= */
const GRAVE_PATTERNS = [
  /墓地(に存在する|の)?この(カード|１枚)を(ゲームから)?除外(して|し、|する事で|し)/,
  /自分の墓地からこのカードを(ゲームから)?除外/,
  /このカードが墓地に存在する場合.*発動/,
  /墓地のこのカードを/,
  /このカードを除外して発動/,
  /自分の墓地の(この)?カードを除外して発動/,
];
const HAND_PATTERNS = [
  /手札からこのカードを(墓地へ)?捨て(て|る事で)/,
  /このカードを手札から(墓地へ)?捨て(て|る事で)/,
  /手札の?この(カード|１枚)を(墓地へ)?捨て/,
  /このカードを手札から(墓地へ)?送(り|って)/,
  /このカードを手札から特殊召喚(する事が)?でき/,   // 極星獣タングニョースト等
  /手札からこのカードを特殊召喚/,
  /このカードは手札から特殊召喚(する事が)?でき/,
];
/* 相手ターンでも撃てる文言（誘発即時的なタイミング） */
const QUICK_PATTERNS = [
  /相手ターン(に|中)/,
  /相手メインフェイズ/,
  /戦闘によって破壊され墓地へ送られた時/,
  /戦闘で破壊され墓地へ送られた場合/,
  /破壊され墓地へ送られた時/,
  /ダメージ計算(時|前|後)/,
  /攻撃(宣言)?(対象に選択された)?時/,
  /攻撃対象に選択された時/,
  /攻撃を無効/,
  /直接攻撃宣言時/,
  /ダメージ計算(前|時|後)/,
  /相手が.*発動した時/,
  /相手のターン/,
  /特殊召喚(に成功|された)時/,
  /召喚・反転召喚・特殊召喚(に成功|された)時/,
  /このカードが.*選択された時/,
  /バトルフェイズ/,
];

/* テキストから発動可能ゾーンを推定する。結果はキャッシュする。 */
const ACT_ZONE_CACHE = new Map();
function detectActivateZones(db){
  if(!db || !db.n) return null;
  if(ACT_ZONE_CACHE.has(db.n)) return ACT_ZONE_CACHE.get(db.n);
  const e = String(db.e||"") + " " + String(db.e0||"");
  const zones = [];
  if(GRAVE_PATTERNS.some(r=>r.test(e))) zones.push('grave');
  if(HAND_PATTERNS.some(r=>r.test(e)))  zones.push('hand');
  const quick = QUICK_PATTERNS.some(r=>r.test(e));
  const res = zones.length ? {zones, quick} : null;
  ACT_ZONE_CACHE.set(db.n, res);
  return res;
}

/* カードが指定ゾーンから発動できるか（スクリプト宣言 → テキスト推定の順） */
/* 表側で場に残っている魔法・罠が、いま発動できる効果を持っているか。
   スキルドレインや天空の聖域のように永続効果しか持たないカードは、
   場に出た後に「発動」する場面がないのでチェーン候補にしない。 */
const FIELD_ACT_CACHE = new Map();
function hasFieldActivatableEffect(card){
  const db = dbOf(card);
  if(!db || !db.n) return false;
  const sc = CARD_SCRIPTS[db.n];
  if(sc){
    /* スクリプトのある魔法・罠は、fieldIgnition を宣言したものだけが
       表側で場に残ったまま効果を発動できる。
       スキルドレインや天空の聖域のように、カードの発動が済んだ後は
       永続効果が適用されるだけのカードを候補から外す。 */
    if(!sc.resolve) return false;
    /* S03-U13: 表側で発動できる効果の判定を広げる（応答リストは strict legality・ss>=top・ss>=2 で絞る）。
       legacy：fieldIgnition、または U10 宣言表のカードで passive（誘発）設計でないもの。
       統合：IGNITION / QUICK の効果、または U10 宣言表のカードの ACTIVATE 効果（その場合 ACTIVATE は場の効果）。 */
    const declaredFreeV33 = (typeof CARD_ACTIVATION_FREE_V32!=='undefined') && CARD_ACTIVATION_FREE_V32.has(db.n);
    let atWillV33 = !!sc.fieldIgnition || sc.onFieldEffectS03===true;   /* S03-U46: 表側で使用する効果（カードの発動は裏側から、効果と同時に使える） */
    if(!atWillV33 && sc.v4Unified && typeof nativeEffectsV4==='function'){
      const effs = nativeEffectsV4(db.n) || [];
      atWillV33 = effs.some(e=>e && (e.type===EFFECT_TYPE.IGNITION || e.type===EFFECT_TYPE.QUICK ||
        (declaredFreeV33 && e.type===EFFECT_TYPE.ACTIVATE && (!e.events || [].concat(e.events).includes('activate')))));
    } else if(!atWillV33 && declaredFreeV33 && !sc.passive){
      atWillV33 = true;
    }
    if(!atWillV33) return false;
    // 発動回数を使い切っていれば出さない
    const loc = locateCard(card);
    if(sc.countLimit && countLeft(loc ? loc.p : 0, db.n, sc, card) <= 0) return false;
    return true;
  }
  if(FIELD_ACT_CACHE.has(db.n)) return FIELD_ACT_CACHE.get(db.n);
  const e = String(db.e||"") + " " + String(db.e0||"");
  // 「〜して発動できる」「〜する事ができる」など、能動的な発動を示す表現があるか
  const v = /発動(できる|する事ができる|して|し、)/.test(e) ||
            /1ターンに1度/.test(e) ||
            /事で|事により/.test(e);
  FIELD_ACT_CACHE.set(db.n, v);
  return v;
}

function canActivateFromZone(db, zone){
  const sc = CARD_SCRIPTS[db.n];
  if(sc){
    if(!sc.activateFrom) return false;
    return sc.activateFrom.indexOf(zone) >= 0;
  }
  const det = detectActivateZones(db);
  return !!(det && det.zones.indexOf(zone) >= 0);
}
/* 相手ターン中にも撃てるか */
function isQuickFromZone(db){
  const sc = CARD_SCRIPTS[db.n];
  if(sc){
    if(db.k==='t') return true;
    if(db.k==='s' && db.sub==='速攻') return true;
    return sc.quickEffect === true || (sc.priority||1) >= 2;
  }
  const det = detectActivateZones(db);
  return !!(det && det.quick);
}

/* 相手ターン中に発動できる自分のカードを集める。
   1103は伏せの読み合いが肝なので、非手番側の罠・速攻魔法をすぐ撃てるようにする。
   返り値: [{p, zone, index, db, ss}] */
/* 相手ターン中に発動できる自分のカードを集める。
   魔法罠ゾーンだけでなく、スクリプトが activateFrom で宣言した場所
   （墓地・手札・除外など）も対象にする。
   例：ネクロ・ガードナー（墓地で除外して発動）、手札誘発。 */
function reactableCards(p){
  const P = gameState.players[p];
  const out = [];
  const seen = new Set();

  /* ① 魔法・罠ゾーン
     伏せカード … 罠と速攻魔法だけが相手ターンに発動できる。
                  ただし罠はセットしたターンには発動できない。
     表側カード … 既に適用されている永続効果は「発動」ではないので候補にしない。
                  起動効果や誘発即時効果を持つものだけを出す。 */
  P.sz.forEach((c,i)=>{
    const db = dbOf(c);
    const isTrap  = db.k==='t';
    const isQuick = db.k==='s' && db.sub==='速攻';
    if(c.face === 'down'){
      if(!isTrap && !isQuick) return;                 // 伏せた通常魔法は発動できない
      if(c.setTurn === gameState.turn) return;  // 罠・速攻魔法ともセットしたターンは不可
      out.push({p, zone:'sz', index:i, db, ss: isTrap ? (db.sub==='カウンター'?3:2) : 2});
      seen.add('sz:'+i);
      return;
    }
    // 表側で場に残っているカードは、発動できる効果を持つ場合だけ
    if(!hasFieldActivatableEffect(c)) return;
    out.push({p, zone:'sz', index:i, db, ss: isTrap ? (db.sub==='カウンター'?3:2) : (isQuick?2:1)});
    seen.add('sz:'+i);
  });
  if(P.field && P.field.face === 'up' && hasFieldActivatableEffect(P.field)){
    out.push({p, zone:'field', index:0, db:dbOf(P.field), ss:1});
  }

  /* ①' 手札の速攻魔法。
     速攻魔法を手札から発動できるのは「そのプレイヤー自身のターン」だけ。
     相手ターンに使うには前のターンまでにセットされている必要がある。 */
  if(p===gameState.activePlayer){
    P.hand.forEach((c,i)=>{
      const db = dbOf(c);
      if(db.k==='s' && db.sub==='速攻'){
        out.push({p, zone:'hand', index:i, db, ss:2, fromHand:true});
      }
    });
  }

  /* ② 墓地・手札などから発動できるカード
     スクリプトが activateFrom を宣言していればそれを使う。
     未実装カードは効果テキストから推定する（誤検出しても選ばなければ発動しない）。 */
  const zones = ['grave','hand','banish','mz'];
  zones.forEach(zone=>{
    const arr = zone==='mz' ? P.mz : P[zone];
    (arr||[]).forEach((c,i)=>{
      if(!c) return;
      const db = dbOf(c);
      if(!canActivateFromZone(db, zone)) return;
      if(!isQuickFromZone(db)) return;          // 相手ターンに撃てないものは除く
      const sc = CARD_SCRIPTS[db.n];
      if(sc && sc.countLimit && countLeft(p, db.n, sc, c) <= 0) return;   // 使用済みは出さない
      // 公開領域の強制の誘発即時が割り込む場面では、カウンター罠をチェーン1に撃てない
      if(db.sub === 'カウンター' && !canActivateCounterTrap()) return;
      // S03-U118: 罠カードの発動を禁止する効果（サイコ・ショッカー）の時だけ出さない。
      // 王宮のお触れ・トラップ・スタンは効果を無効にするだけで、発動はできる（解決時に無効）。
      if(dbOf(c).k==='t' && trapActivationForbiddenS03(p, c)) return;
      // スクリプトがあれば発動条件も確認する
      if(sc && sc.condition){
        const ctx = makeContext(p, c, zone, i, "react", {});
        let ok = true;
        try{ ok = sc.condition(ctx); }catch(e){ ok = false; }
        if(!ok) return;
      }
      out.push({p, zone, index:i, db,
                ss: sc ? (sc.priority||2) : 2,
                script: !!sc});
    });
  });
  return out;
}

/* 非手番プレイヤー（＝相手ターン中の自分）の番号 */
function reactingPlayer(){ return gameState.activePlayer===0 ? 1 : 0; }

/* 指定プレイヤーの割り込みパネルを開く（チェーンを重ねる時に使う） */
function openReactFor(p){ openReact(p); }

/* 相手ターン中の割り込みパネル。p を渡すとそのプレイヤー視点で開く。 */
function openReact(forceP){
  const rp = (forceP===0||forceP===1) ? forceP : reactingPlayer();
  const list = reactableCards(rp);
  if(!list.length){
    sheet.innerHTML = `<div class="grip"></div>
      <h3 style="margin-bottom:6px">${nameOf(rp)}の割り込み</h3>
      <div class="meta" style="margin-bottom:12px">
        発動できる伏せカードがありません。<br>
        罠・速攻魔法を伏せていると、ここから相手ターン中に発動できます。</div>
      <button class="close" onclick="closeSheet()">閉じる</button>`;
    veil.classList.add("on"); return;
  }
  const rows = list.map(it=>{
    const P = gameState.players[rp];
    const card = it.zone==='field' ? P.field : (P[it.zone]||[])[it.index];
    const hidden = card && card.face==='down' && (it.zone==='sz'||it.zone==='field');
    const eff = hasEffect(it.db.n);
    // 発動場所を明示する（墓地・手札からの発動が分かるように）
    const where = it.zone==='sz'||it.zone==='field' ? "" :
      `<span class="rk-zone">${zoneJp(it.zone)}</span>`;
    const kind = it.db.k==='t'?'罠' : it.db.k==='s'?'魔法' : 'モンスター';
    const auto = it.script ? ' ⚡自動' : (eff ? ' ⚡' : ' 手動');
    return `<div class="act pick-row" onclick="reactActivate(${rp},'${it.zone}',${it.index})">
      <span class="pk-nm">${it.db.n}${hidden?'<span class="rk-set">伏</span>':''}${where}</span>
      <span class="pk-sub">${kind}${it.db.sub?'・'+it.db.sub:''} SS${it.ss}${auto}</span>
    </div>`;
  }).join("");
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">${nameOf(rp)}の割り込み</h3>
    <div class="meta" style="margin-bottom:10px">
      相手ターン中に発動できるカードです。タップすると表側にしてチェーンに積みます。</div>
    <div class="pick-list">${rows}</div>
    <button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}

/* 割り込み発動：表side にしてチェーンへ積む（効果があれば自動処理も選べる） */
function reactActivate(p, zone, index){
  const P = gameState.players[p];
  const card = zone==='field' ? P.field : (P[zone]||[])[index];
  if(!card){ showToast("カードがありません"); return; }
  const db = dbOf(card);
  const nm = db.n||"";
  // 手札の速攻魔法は、魔法罠ゾーンに置いてから発動する
  if(zone==='hand' && db.k==='s' && db.sub==='速攻'){
    if(P.sz.length >= ZONE_LIMITS.sz){ showToast("魔法・罠ゾーンが一杯です"); return; }
    closeSheet();
    act({type:"MOVE", player:p, from:"hand", fromIndex:index, to:"sz", face:"up"});
    const ni = gameState.players[p].sz.length-1;
    reactActivate(p, 'sz', ni);
    return;
  }
  const eff = hasEffect(nm);
  const sc  = CARD_SCRIPTS[nm];
  const ss  = sc && sc.priority ? sc.priority
            : (db.k==='t' ? (db.sub==='カウンター'?3:2) : (db.sub==='速攻'?2:1));
  closeSheet();
  // 場に伏せてあるカードだけ表にする（墓地・手札からの発動は不要）
  if(card.face==='down' && (zone==='sz' || zone==='field' )){
    act({type:"FX_SET_STATE", player:p, zone, index, face:"up", reason:"発動"});
  }
  // チェーンに積む
  act({type:"CHAIN_ADD", player:p, cardId:card.id, uid:ensureCardUid(gameState,card), name:nm, ss, from:zone, index});
  // 解決方法を選ばせる。スクリプトが無くても手動パレットで処理できる。
  setTimeout(()=>{
    const auto = eff
      ? `<div class="act fx" onclick="closeSheet();resolveReact(${p},'${zone}',${index},${jsStr(nm)})">⚡ 解決して効果を処理</div>`
      : "";
    const eff_txt = db.e ? `<div class="eff">${String(db.e).replace(/\n/g,"<br>")}</div>` : "";
    // 相手がさらにチェーンできるかを調べて案内する
    const foe = p===0?1:0;
    const foeN = reactableCards(foe).length;
    const foeRow = foeN
      ? `<div class="react-warn" onclick="closeSheet();openReactFor(${foe})">
           ${nameOf(foe)}は ${foeN}枚 チェーンできます — タップして発動
         </div>` : "";
    sheet.innerHTML = `<div class="grip"></div>
      <h3 style="margin-bottom:4px">${nm}</h3>
      <div class="meta" style="margin-bottom:8px">チェーン${gameState.chain.length}に積みました（${zoneJp(zone)}から発動）。<br>
        ${foeN?"相手のチェーンを確認してから解決してください。":"相手がチェーンしないなら解決できます。"}</div>
      ${foeRow}
      ${eff_txt}
      <div class="act-grid wide">
        ${auto}
        <div class="act" onclick="closeSheet();manualResolveReact(${p},'${zone}',${index},${jsStr(nm)})">手動で処理する…</div>
        <div class="act" onclick="closeSheet();openChain()">チェーンを確認する</div>
      </div>`;
    veil.classList.add("on");
  }, 60);
}
/* スクリプトが無いカードを手動で解決する。
   チェーンを解決してから汎用パレットを開き、コストの除外/墓地送りも案内する。 */
function manualResolveReact(p, zone, index, nm){
  if(gameState.chain.length) act({type:"CHAIN_RESOLVE_TOP"});
  openPrimitives(p, zone, index, nm);
}
/* 割り込みカードを解決して効果まで処理する */
function resolveReact(p, zone, index, nm){
  // チェーンから取り除く
  if(gameState.chain.length) act({type:"CHAIN_RESOLVE_TOP"});
  const db = CARD_DB[findCardIndex(nm)]||{};
  const keep = (db.sub==="永続" || db.sub==="フィールド" || db.sub==="装備");
  runEffect(p, nm, {zone, index, keep});
  render();
}
/* =========================================================================
   フェーズごとの行動制限（1103準拠）
   ドローフェイズ／スタンバイは通常召喚も攻撃もできず、
   撃てるのはスペルスピード2以上（速攻魔法・罠）だけ。
   ========================================================================= */
const PHASE_RULES = {
  draw:    { draw:true,  normalSummon:false, setCard:false, activateS1:false, attack:false, exSummon:false,
             note:"ドロー／速攻魔法・罠のみ" },
  standby: { draw:false, normalSummon:false, setCard:false, activateS1:false, attack:false, exSummon:false,
             note:"速攻魔法・罠のみ" },
  main1:   { draw:false, normalSummon:true,  setCard:true,  activateS1:true,  attack:false, exSummon:true,
             note:"召喚・セット・発動" },
  battle:  { draw:false, normalSummon:false, setCard:false, activateS1:false, attack:true,  exSummon:false,
             note:"攻撃宣言／速攻魔法・罠" },
  main2:   { draw:false, normalSummon:true,  setCard:true,  activateS1:true,  attack:false, exSummon:true,
             note:"召喚・セット・発動" },
  end:     { draw:false, normalSummon:false, setCard:false, activateS1:false, attack:false, exSummon:false,
             note:"手札7枚調整／速攻魔法・罠" },
};
function rules(){ return PHASE_RULES[gameState.phase] || PHASE_RULES.main1; }
/* スペルスピード判定 */
function spellSpeedOf(db){
  if(!db) return 1;
  if(db.k==='t') return db.sub==='カウンター' ? 3 : 2;
  if(db.k==='s' && db.sub==='速攻') return 2;
  return 1;
}
/* そのカードが今のフェーズで発動できるか。
   スペルスピード2以上（速攻魔法・罠）はいつでも発動できる。 */
function canActivateNow(db){
  if(spellSpeedOf(db) >= 2) return true;
  return rules().activateS1;
}
/* 制限に引っかかった時の理由文 */
function whyBlocked(what){
  const ph = phaseJp(gameState.phase);
  const msg = {
    normalSummon:`${ph}では通常召喚できません`,
    setCard:`${ph}ではセットできません`,
    activateS1:`${ph}では通常魔法・起動効果は発動できません（速攻魔法・罠のみ）`,
    attack:`${ph}では攻撃できません`,
    exSummon:`${ph}ではEX召喚できません`,
  };
  return msg[what] || `${ph}ではその操作はできません`;
}

