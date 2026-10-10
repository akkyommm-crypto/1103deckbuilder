/* S03-U80 — ジュラック・ヴェルヒプト (Jurrac main deck, NOT_STARTED, no flagged engine gap).
   Priority #7 (fixed major-deck audit, from S03-U79's own cross-reference pass). Real text (this project's
   own card database, printed 2009-04-14, within cutoff), FIRE Dinosaur Synchro Effect Monster:
   Synchro Material: 1 Tuner + 1 or more non-Tuner Dinosaur-type monsters.
   ①: this card's ATK/DEF become equal to the total original ATK of the monsters used as its Synchro
      Material.
   ②: if this card attacks a face-down Defense Position monster, it can destroy that monster without
      damage calculation, while that monster remains face-down Defense Position.

   ① reuses the exact "original ATK of tribute-summon materials" pattern already established for
   合成魔獣ガーゼット/偉大魔獣ガーゼット (cards/88_p3_provenance_recovery.js) — but for Synchro materials,
   which had no such snapshot at all before this unit (only name/tuner/level were recorded, in
   engine/00_state_actions.js's EX_SUMMON_PREPARE_V42, `card.v380SummonMaterials`). Extended that same
   pre-existing per-card snapshot to also record atk/def (via p3OriginalStatV3, the same "original stat"
   getter the P3 system already uses, so procedureBaseStats/setBaseAtk overrides on a material are honored
   correctly) — a small, additive engine extension, no new state model.
   ② reuses the shared a3PreDamageDestroy-shaped "no damage calculation, destroy before damage step" pattern
   already used by 14 other cards in cards/A3_auto_cycle01.js (precedent: ズババナイト, 忍者マスター SASUKE —
   same shape, face-up Defense Position instead of face-down); written directly (not via the factory) so it
   can share one script registration with ①'s own continuous effect. */

defineScript('ジュラック・ヴェルヒプト', {
  type:'monster', priority:1, forced:true, dsTiming:'start', targets:false,
  condition(ctx){
    if(!a3IsAttacker(ctx)){ ctx.reason='自分が攻撃した場合に発動します'; return false; }
    const d=a3AttackTarget();
    if(!(d && d.pos==='def' && d.face==='down')){ ctx.reason='裏側守備表示のモンスターを攻撃した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const d=a3AttackTarget();
    if(d) a3DestroyBeforeDamage(d,'ジュラック・ヴェルヒプト');
  },
  afterResolve(){},
  passive:{onDamageStep(ctx){
    if(!a3IsAttacker(ctx)) return false;
    const d=a3AttackTarget();
    return !!(d&&d.pos==='def'&&d.face==='down');
  }},
  continuous:{scope:'self',from:['mz'],apply(card,self){
    if(card!==self||self.face!=='up') return null;
    const ms=self.v380SummonMaterials||[];
    if(!ms.length) return null;
    const sum=ms.reduce((s,m)=>s+(Number(m.atk)||0),0);
    return {setBaseAtk:sum,setBaseDef:sum};
  }}
});
