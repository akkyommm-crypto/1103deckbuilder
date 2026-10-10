/* S03-U149: cards on the 「相手フィールド上の全てのモンスターに1回ずつ攻撃できる」 rule (engine/1ZQ attackAllMonstersS03).
   ヴァリュアブル・アーマー (デュアル)  ●このカードは相手フィールド上の全てのモンスターに1回ずつ攻撃をする事ができる。
   E・HERO ワイルドジャギーマン     「E・HERO ワイルドマン」＋「E・HERO エッジマン」 このモンスターは融合召喚でしか特殊召喚できない
                                    (U126). 相手フィールド上の全てのモンスターに1回ずつ攻撃をする事ができる。 */
defineGeminiS03('ヴァリュアブル・アーマー', { type:'monster', priority:1, attackAllMonstersS03(card){ return geminiActiveS03(card); } });
defineScript('E・HERO ワイルドジャギーマン', { type:'monster', priority:1, attackAllMonstersS03:true });
