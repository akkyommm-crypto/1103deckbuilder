/* =========================================================================
   System v4.1 — Unified Effect migration batch A
   -------------------------------------------------------------------------
   Classic attribute recruiters are intentionally implemented with the v4
   Effect object so their timing is structurally split into condition/target/
   operation.  All summon from Deck in face-up Attack Position.
   ========================================================================= */
/* S03-U157: the six attribute recruiters are declared on the shared deck-trigger engine (engine/1ZT, S03-U156).
   2011 text: 「このカードが戦闘によって破壊され墓地へ送られた時、（自分の）デッキから攻撃力1500以下の○属性モンスター1体を
   （自分フィールド上に）表側攻撃表示で特殊召喚する事ができる。」
   Before: a v4 Unified Effect that chose the Deck monster at ACTIVATION (target step; the effect does not target) and could not
   be activated when the Deck held no candidate. Now the Deck is examined at resolution; with no candidate the trigger can still
   be activated and resolves doing nothing (the Deck is shuffled). Also: the Extra Deck is excluded and summon conditions apply. */
function v41DefineAttributeRecruiter(name,attribute){
  return declareDeckTriggerS03(name,{when:'battleToGrave',action:'summon',optional:true,pos:'atk',filter:{at:attribute,atkmax:1500}});
}
v41DefineAttributeRecruiter('キラー・トマト','闇');
v41DefineAttributeRecruiter('シャインエンジェル','光');
v41DefineAttributeRecruiter('巨大ネズミ','地');
v41DefineAttributeRecruiter('グリズリーマザー','水');
v41DefineAttributeRecruiter('ドラゴンフライ','風');
v41DefineAttributeRecruiter('UFOタートル','炎');
