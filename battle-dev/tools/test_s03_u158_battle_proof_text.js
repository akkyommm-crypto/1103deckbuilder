/* S03-U158: battleProof()'s text fallback matched 「戦闘では破壊されない」 anywhere in a card's text, so conditional / once-per-turn /
   protect-others / hand-or-GY texts made the monster battle-indestructible for good — and masked the cards' own System v21
   declarations (battleProof is checked first). Now only the unconditional self sentence is read from the text.
   Real DUEL path: attacks by the turn player, battle damage, destruction (BATTLE_CLEANUP), second attacks in the same turn.
   Replay-audited, fixed seed. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function uid(c){return ensureCardUid(gameState,c);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;}
/* SEEN: every choice shown {title, names, min, max, cancelable}; TRIG: every trigger group offered {names, forced}.
   PREFER: uids / keys to pick first; SKIP_OPTIONAL: decline optional trigger groups. */
let PREFER=[],SEEN=[],TRIG=[],SKIP_OPTIONAL=false;
function pick(){const q=pc();SEEN.push({title:q.title,names:q.candidates.map(x=>x.name||x.label||(x.uid!=null?nm(findCardByUid(x.uid)&&findCardByUid(x.uid).card):x.value)),min:q.min,max:q.max,cancelable:!!q.cancelable,kind:q.kind});
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u||x.value===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length){TRIG.push({names:g.map(c=>c.name),forced:st.rank<2});}
    if(g.length&&!(SKIP_OPTIONAL&&st.rank>=2))eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function journal(t){return V41_ACTION_JOURNAL.filter(x=>x.action.type===t);}
function chains(name){return journal('CHAIN_ADD').filter(x=>x.action&&(x.action.name===name||(x.action.link&&x.action.link.name===name)));}
function evOffered(name){return TRIG.some(e=>e.names.indexOf(name)>=0);}
function evForced(name){const e=TRIG.find(e=>e.names.indexOf(name)>=0);return !!(e&&e.forced);}
function seenFor(name){return SEEN.filter(s=>s.title.indexOf(name)===0);}
function atk(p,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:0,target:t==null?0:t});}
`;

harness(COMMON+String.raw`
/* the defending player 0 controls DEF, player 1 (turn player) attacks with each ATTACKERS[i] in order at the named target */
function battle(defs,attackers,label){
  fresh();SEEN=[];TRIG=[];
  const D=defs.map(x=>{const c=mk(x[0],0,'up',x[1]||'atk');return c;});gameState.players[0].mz=D.slice();
  const A=attackers.map(n=>mk(n,1,'up'));gameState.players[1].mz=A.slice();
  gameState.activePlayer=1;gameState.phase='battle';baselineA();
  return {D,A};
}
function hit(A,i,target){const P=gameState.players;const ai=P[1].mz.indexOf(A[i]),ti=P[0].mz.indexOf(target);
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:ai,target:ti});drive();}

/* A. 1ターンに1度だけ: the first battle destruction of the turn is prevented, the second is not */
for(const name of ['ジャイロイド','混沌球体','スターダスト・シャオロン']){
  const {D,A}=battle([[name]],['ゴブリン突撃部隊','ギガンテス']);
  hit(A,0,D[0]);const after1=z(D[0]);
  hit(A,1,D[0]);const after2=z(D[0]);
  ok('A '+name+': 「1ターンに1度だけ、戦闘では破壊されない」 — survives the 1st battle of the turn, destroyed by the 2nd',after1==='mz'&&after2==='grave',JSON.stringify({after1,after2}));
  audit('A '+name);
}
/* B. ホワイトポータン: only while its controller has a face-up Tuner */
{
  const {D,A}=battle([['ホワイトポータン'],['ジャンク・シンクロン']],['ゴブリン突撃部隊']);
  hit(A,0,D[0]);
  ok('B ホワイトポータン: with a face-up Tuner (ジャンク・シンクロン) it is not destroyed by battle',z(D[0])==='mz');
  audit('B with Tuner');
  const r=battle([['ホワイトポータン']],['ゴブリン突撃部隊']);
  hit(r.A,0,r.D[0]);
  ok('B ホワイトポータン: without a Tuner it is destroyed by battle',z(r.D[0])==='grave');
  audit('B no Tuner');
}
/* C. サテライト・キャノン: 「レベル7以下のモンスターとの戦闘では破壊されない」 */
{
  const {D,A}=battle([['サテライト・キャノン']],['ゴブリン突撃部隊','青眼の白龍']);
  hit(A,0,D[0]);const vsLv4=z(D[0]);
  hit(A,1,D[0]);
  ok('C サテライト・キャノン: survives a Lv4 attacker, destroyed by the Lv8 青眼の白龍',vsLv4==='mz'&&z(D[0])==='grave',JSON.stringify({vsLv4,now:z(D[0])}));
  audit('C');
}
/* D. D・ボードン (Defense Position): protects the OTHER 「D」 monsters, not itself */
{
  const {D,A}=battle([['D・ボードン','def'],['D・リモコン','def']],['ゴブリン突撃部隊','ギガンテス']);
  hit(A,0,D[1]);const other=z(D[1]);
  hit(A,1,D[0]);
  ok('D D・ボードン: the other D monster (D・リモコン) is not destroyed; D・ボードン itself is',other==='mz'&&z(D[0])==='grave',JSON.stringify({other,self:z(D[0])}));
  audit('D');
}
/* E. シールド・ウォリアー / BF－蒼天のジェット / 紫炎の寄子: effects used from the GY / hand — the monster itself is not protected */
for(const name of ['シールド・ウォリアー','BF－蒼天のジェット','紫炎の寄子']){
  const {D,A}=battle([[name]],['ゴブリン突撃部隊']);
  hit(A,0,D[0]);
  ok('E '+name+': on the field it is destroyed by battle (its protection is an effect used from the hand / GY)',z(D[0])==='grave');
  audit('E '+name);
}
/* F. アマゾネス女王: 「自分の『アマゾネス』モンスターは戦闘では破壊されない」 — the other アマゾネス and itself */
{
  const {D,A}=battle([['アマゾネス女王'],['アマゾネスの剣士']],['ゴブリン突撃部隊','青眼の白龍']);
  hit(A,0,D[1]);const sword=z(D[1]);
  hit(A,1,D[0]);
  ok('F アマゾネス女王: アマゾネスの剣士 and the 女王 herself are not destroyed by battle',sword==='mz'&&z(D[0])==='mz',JSON.stringify({sword,queen:z(D[0])}));
  audit('F');
}
/* G. unconditional self protection still read from the text (雲魔物, 巨大戦艦, X－セイバー パシウル …) */
for(const name of ['X－セイバー パシウル','雲魔物－アルトス']){
  const {D,A}=battle([[name]],['ゴブリン突撃部隊','青眼の白龍']);
  hit(A,0,D[0]);hit(A,1,D[0]);
  ok('G '+name+': 「このカードは戦闘では破壊されない」 — survives two battles in one turn',z(D[0])==='mz');
  audit('G '+name);
}
/* H. the conditional / partial texts are no longer read as unconditional (engine unit check on the text rule) */
const TXT=n=>unconditionalBattleProofTextS03(CARD_DB[findCardIndex(n)]);
ok('H: text rule — unconditional self sentence only',
  ['X－セイバー パシウル','雲魔物－アルトス','巨大戦艦 ビッグ・コア','レプティレス・ナージャ'].every(TXT)&&
  !['ジャイロイド','混沌球体','ホワイトポータン','サテライト・キャノン','D・ボードン','D・ステープラン','シールド・ウォリアー','薄幸の乙女','サイバー・ブレイダー','アマゾネス女王','イレカエル','スカー・ウォリアー','マイン・モール'].some(TXT));
`);
