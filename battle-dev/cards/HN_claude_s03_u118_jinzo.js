/* S03-U118: 人造人間－サイコ・ショッカー (was ENGINE_GAP: "Needs central continuous Trap activation prohibition and
   Trap-effect negation"). 2011 text: このカードがフィールド上に表側表示で存在する限り、罠カードは発動できず、
   全てのフィールド上の罠カードの効果は無効化される。
   Both halves use the central model in engine/1ZH_trap_negation_s03.js: negateTrap (resolution + continuous) and
   forbidTrapActivation (legality + response candidates). continuousSources() only yields it while it is face-up in the
   Monster Zone and its effect is not negated (スキルドレイン etc.). */
defineScript('人造人間－サイコ・ショッカー', {
  type:'monster', priority:1,
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    negateTrap(card){ return dbOf(card).k === 't'; },
    forbidTrapActivation(card){ return dbOf(card).k === 't'; }
  }
});
