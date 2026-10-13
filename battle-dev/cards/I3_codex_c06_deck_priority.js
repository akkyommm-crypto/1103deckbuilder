/* CODEX-C06 — two remaining supplied-deck ENGINE_GAP cards whose required
   primitives now exist: procedure provenance/base-stat layers and declarative
   Special Summon locks. */

/* ---- バイス・ドラゴン ------------------------------------------------- */
defineUnifiedCardV4('バイス・ドラゴン',[],{
  type:'monster',priority:1,includesSpecialSummon:true,
  summonProcedure:{
    from:['hand'],positions:['atk','def'],
    condition(ctx){
      if(gameState.players[ctx.player].mz.length){ctx.reason='自分フィールドにモンスターが存在します';return false;}
      if(!gameState.players[ctx.opponent].mz.length){ctx.reason='相手フィールドにモンスターが必要です';return false;}
      return true;
    },
    cost(ctx,done){ctx.procedureDataS03={method:'vice-dragon'};done(true);},
    afterSummonS03(handle,data){
      if(!handle||!data||data.method!=='vice-dragon')return;
      v4RegisterStatModifier(handle,{setBaseAtk:1000,setBaseDef:1200},{
        code:'バイス・ドラゴン（自身の方法）',resetMask:RESET.LEAVE|RESET.FACE_DOWN
      });
    }
  }
});

/* ---- コアキメイル・ドラゴ --------------------------------------------- */
defineUnifiedCardV4('コアキメイル・ドラゴ',[
  u321UpkeepEffect(db=>db.k==='m'&&db.ra==='ドラゴン')
],u321UpkeepMeta({
  specialSummonLockS03:db=>!!db&&(db.at==='光'||db.at==='闇')
}));
