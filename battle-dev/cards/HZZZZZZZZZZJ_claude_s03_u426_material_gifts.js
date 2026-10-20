/* S03-U426: フレア・リゾネーター, ニードル・ガンナー, トラスト・ガーディアン, チェーンドッグ (NOT_STARTED cards: effects handed to the Synchro Monster that used them as material, carddata texts).

   フレア・リゾネーター  （チューナー）このカードをシンクロ素材としたシンクロモンスターの攻撃力は300ポイントアップする。
   ニードル・ガンナー    このカードをシンクロ素材としたシンクロモンスターが守備表示モンスターを攻撃した時、その守備力を攻撃力が超えていれば、その数値だけ相手ライフに戦闘ダメージを与える。
   トラスト・ガーディアン  （チューナー）このカードをシンクロ素材とする場合、レベル7以上のシンクロモンスターのシンクロ召喚にしか使用できない。このカードをシンクロ素材としたシンクロモンスターは、1ターンに1度だけ戦闘では破壊されない。この効果を適用したダメージステップ終了時、そのシンクロモンスターの攻撃力・守備力は400ポイントダウンする。
   チェーンドッグ        自分フィールド上に獣族モンスターが表側表示で2体存在する場合、このカードを墓地から特殊召喚する事ができる。この効果で特殊召喚したこのカードはフィールド上から離れた場合、ゲームから除外される。このカードをシンクロ素材とする場合、獣族モンスターのシンクロ召喚にしか使用できない。

   Notes
   - NEW engine (S03-U426), all read from the Synchro Monster's v380SummonMaterials (names of the materials) and the SCRIPT of each material:
       synchroMatModS03:{atk, def}      EX_SUMMON_COMMIT_V42 / FX_EX_SUMMON push a permanent card.mods entry on the Synchro Monster (フレア・リゾネーター: +300 ATK)
       synchroMatPierceS03:true         applyPiercingDamage: the Synchro Monster pierces (ニードル・ガンナー)
       synchroMatProtectV21:{...}       engine/1K protRecordsForV21: a protectV21 record of the Synchro Monster itself (トラスト・ガーディアン: battle, perTurn 1); afterUseS03(card, gs) runs inside the battle reducer when the protection saved it (the −400 ATK / DEF is a permanent card.mods entry — taken at the moment of the protection, i.e. the end of that battle's damage calculation)
   - チェーンドッグ: summonProcedure from the Graveyard (exactly 2 face-up Beast monsters on my field, as D・マグネンI's 「2体存在する場合」); afterSummonS03 stamps banishWhenLeavesField; synchroMaterialRestriction: Beast Synchro Monsters only. */

function u426Passive(extra){
  return Object.assign({type:'monster', priority:1, timing:['free'],
    condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){}}, extra || {});
}

defineScript('フレア・リゾネーター', u426Passive({synchroMatModS03:{atk:300}}));
defineScript('ニードル・ガンナー', u426Passive({synchroMatPierceS03:true}));
defineScript('トラスト・ガーディアン', u426Passive({
  synchroMaterialRestriction(info){ return !!(info && info.exDb && Number(info.exDb.lv)>=7); },
  synchroMatProtectV21:{ key:'u426.trust', battle:true, effect:false, perTurn:1, label:'トラスト・ガーディアン',
    afterUseS03(card, gs){ card.mods = card.mods || []; card.mods.push({atk:-400, def:-400, until:'permanent', label:'トラスト・ガーディアン', turn:gs.turn}); } } }));

function u426Beasts(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && x.db.ra==='獣'}); }
defineScript('チェーンドッグ', u426Passive({includesSpecialSummon:true,
  synchroMaterialRestriction(info){ return !!(info && info.exDb && info.exDb.ra==='獣'); },
  summonProcedure:{ from:['grave'], positions:['atk','def'],
    condition(ctx){ if(u426Beasts(ctx.player).length!==2){ ctx.reason = '自分フィールドに表側表示の獣族モンスターがちょうど2体必要です'; return false; } return true; },
    cost(ctx, done){ ctx.procedureDataS03 = {}; done(true); },
    afterSummonS03(h){ if(h && h.zone==='mz') API.setCardFlag(h, 'banishWhenLeavesField', true, 'チェーンドッグ', {silent:true}); } } }));
