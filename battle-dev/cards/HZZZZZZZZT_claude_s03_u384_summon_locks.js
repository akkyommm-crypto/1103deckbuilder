/* S03-U384: four NOT_STARTED cards that use the summon locks by kind (engine/1ZZS, new in this unit; carddata texts).

   ジェノサイドキングデーモン  自分フィールド上に「デーモン」という名のついたモンスターカードが存在しなければこのカードは召喚・反転召喚できない。自分のスタンバイフェイズ毎に800ライフポイントを払う。対象になり処理を行う時にサイコロ（2・5で無効にし破壊）。このカードが戦闘で破壊した効果モンスターの効果は無効化される。
   レプティレス・サーヴァント  フィールド上にこのカード以外のモンスターが表側表示で存在する場合、このカードを破壊する。このカードが魔法・罠カードの効果の対象になった時、このカードを破壊する。このカードがフィールド上に表側表示で存在する限り、お互いにモンスターを召喚する事はできない。
   大熱波                      （通常魔法）メインフェイズ1の開始時に発動する事ができる。次の自分のドローフェイズ時まで、お互いに効果モンスターを召喚・特殊召喚する事はできない。
   完全防音壁                  （通常魔法）自分フィールド上にシンクロモンスターが表側表示で存在しない場合、メインフェイズ1の開始時に発動する事ができる。次の相手のエンドフェイズ時まで、お互いにシンクロモンスターを特殊召喚する事ができない。

   Notes
   - Summon kinds: 'normal' (Normal / Tribute Summon), 'flip', 'special'. 「召喚」 means the Normal Summon only (a Flip Summon and a Special Summon are not 「召喚」).
   - ジェノサイドキング: summonConditionS03 (the summoned card's own condition); the effect negation of the monster it destroys in battle is the existing declareBattleDestroyedNegatorS03 (engine/1S); the upkeep and the dice reuse S03-U383.
   - レプティレス・サーヴァント: selfDestroyWhenS03 (another face-up monster), declareTargetedSelfDestroyS03 with kinds ['s','t'] (a monster's effect may target it), summonLockS03 for the Normal Summon.
   - 大熱波 / 完全防音壁: 「メインフェイズ1の開始時」 is read as: my Main Phase 1, an empty chain and nothing done yet this turn (no Normal Summon / Set, no card activated by me — temporaryFlags.activatedKindsS03). The ban is a turn-ranged player flag (banSummonS03) for both players, this turn and the opponent's next turn. */

/* ---- ジェノサイドキングデーモン ---- */
declareDiceDemonS03('ジェノサイドキングデーモン', {faces:[2,5]});
declareBattleDestroyedNegatorS03('ジェノサイドキングデーモン', {});
function u384Demon(db){ return !!db && db.k==='m' && String(db.n||'').indexOf('デーモン')>=0; }
defineUnifiedCardV4('ジェノサイドキングデーモン', [u383Upkeep('ジェノサイドキングデーモン', 800)], u383Meta({
  summonConditionS03:(p, db, kind)=>{
    if(kind!=='normal' && kind!=='flip') return '';
    const has = (gameState.players[p].mz||[]).some(c=>c && c.face==='up' && u384Demon(dbOf(c)));
    return has ? '' : '自分フィールドに「デーモン」モンスターが存在しないため召喚・反転召喚できません';
  } }));

/* ---- レプティレス・サーヴァント ---- */
declareTargetedSelfDestroyS03('レプティレス・サーヴァント', {kinds:['s','t']});
defineScript('レプティレス・サーヴァント', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  selfDestroyWhenS03:(card)=> [0,1].some(q=>(gameState.players[q].mz||[]).some(c=>c && c!==card && c.face==='up')) ? 'レプティレス・サーヴァント：他の表側表示モンスターが存在するため破壊' : false,
  summonLockS03:(i)=> i.kind==='normal'
});

/* ---- 「メインフェイズ1の開始時」 ---- */
function u384MainStart(ctx){
  const P = gameState.players[ctx.player];
  if(ctx.player!==gameState.activePlayer || gameState.phase!=='main1' || (gameState.chain && gameState.chain.length)) return false;
  if(P.normalSummonUsed) return false;
  if((P.mz||[]).some(c=>c && (c.summonedTurn===gameState.turn || c.setTurn===gameState.turn))) return false;
  const rec = (P.temporaryFlags||{}).activatedKindsS03;
  if(rec && Object.keys(rec).length) return false;
  return true;
}

/* ---- 大熱波 ---- */
defineScript('大熱波', {
  type:'spell', priority:1, targets:false,
  condition(ctx){ if(!u384MainStart(ctx)){ ctx.reason = 'メインフェイズ1の開始時にのみ発動できます'; return false; } return true; },
  resolve(){ [0,1].forEach(p=>banSummonS03(p, gameState.turn, gameState.turn+1, ['normal','special'], {effect:true}, '大熱波')); },
  afterResolve(){}
});

/* ---- 完全防音壁 ---- */
defineScript('完全防音壁', {
  type:'spell', priority:1, targets:false,
  condition(ctx){
    if(!u384MainStart(ctx)){ ctx.reason = 'メインフェイズ1の開始時にのみ発動できます'; return false; }
    if(API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && (x.db.st||[]).indexOf('シンクロ')>=0}).length){ ctx.reason = '自分フィールドに表側表示のシンクロモンスターが存在します'; return false; }
    return true;
  },
  resolve(){ [0,1].forEach(p=>banSummonS03(p, gameState.turn, gameState.turn+1, ['special'], {synchro:true}, '完全防音壁')); },
  afterResolve(){}
});
