/* S03-U459: 「相手は～効果の対象にできない」を effectInfo.player で判定する。
   ホルスのしもべ / メタルシルバー・アーマーについて、相手の対象効果だけを拒否し、
   コントローラー自身の対象効果は許可する。実際の月の書の発動経路とReplayを固定する。 */
const harness=require('./astra_harness');
harness(String.raw`
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function uid(c){return ensureCardUid(gameState,c);}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
let PREFER=[];const SEEN=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  const ids=q.candidates.map(x=>x.uid||x.value||x.key||(x.card&&x.card.uid));
  SEEN.push({title:q.title,cands:ids});
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}
  if(j>=0){const used=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(used),1);}
  __choicePickV49(j>=0?j:0);
}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4590001;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function castActive(name,prefer){const p=gameState.activePlayer,i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);
  SEEN.length=0;PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let n=0;n<20&&pc();n++)pick();const seen=SEEN.map(x=>({title:x.title,cands:x.cands.slice()}));drive();PREFER=[];return seen;}
function targetSeen(seen){return seen.find(x=>/対象|選択|表示形式/.test(x.title))||seen[seen.length-1]||{cands:[]};}
function kept(c,byPlayer,src){const info=targetEffectSourceS03(byPlayer,{uid:src.uid,name:cardName(src)});return filterTargetable([locateCardAnyV4(c)],byPlayer,info).length;}

const HOR='ホルスのしもべ',HL6='ホルスの黒炎竜 LV6',ARM='メタルシルバー・アーマー',BOOK='月の書';

/* ===== ホルスのしもべ ===== */
{ fresh();const servant=mon(HOR,0),horus=mon(HL6,0),other=mon('ワイト',0),ownBook=mk(BOOK,0),foeBook=mk(BOOK,1);
  gameState.players[0].mz=[servant,horus,other];gameState.players[0].hand=[ownBook];gameState.players[1].hand=[foeBook];baselineA();
  ok('ホルス direct: 相手の対象効果からホルスの黒炎竜を守る',kept(horus,1,foeBook)===0,'');
  ok('ホルス negative: 自分の対象効果ではホルスの黒炎竜を選べる',kept(horus,0,ownBook)===1,'');
  ok('ホルス negative: 名前の異なるモンスターは相手の対象効果でも選べる',kept(other,1,foeBook)===1,'');
  let seen=targetSeen(castActive(BOOK,[uid(other)]));
  ok('ホルス real path: 自分の月の書の候補にホルスの黒炎竜が含まれる',seen.cands.indexOf(horus.uid)>=0,JSON.stringify(seen));
  endTurn();seen=targetSeen(castActive(BOOK,[uid(servant)]));
  ok('ホルス real path: 相手の月の書の候補からホルスの黒炎竜だけが除外される',seen.cands.indexOf(horus.uid)<0&&seen.cands.indexOf(servant.uid)>=0,JSON.stringify(seen));
  audit('ホルスのしもべ'); }
{ fresh();const horus=mon(HL6,0),foeBook=mk(BOOK,1);gameState.players[0].mz=[horus];gameState.players[1].hand=[foeBook];baselineA();
  ok('ホルス control: しもべがいなければ相手の効果でも対象にできる',kept(horus,1,foeBook)===1,''); }

/* ===== メタルシルバー・アーマー ===== */
{ fresh();const host=mon('ワイト',0),other=mon('ライオウ',0),foe=mon('ジェネティック・ワーウルフ',1),armor=mk(ARM,0,'up'),ownBook=mk(BOOK,0),foeBook=mk(BOOK,1);
  gameState.players[0].mz=[host,other];gameState.players[0].sz=[armor];gameState.players[0].hand=[ownBook];gameState.players[1].mz=[foe];gameState.players[1].hand=[foeBook];baselineA();
  API.equipSpell(locateCardAnyV4(armor),locateCardAnyV4(host),'S03-U459 fixture');
  ok('アーマー fixture: journaled equip APIでワイトに装備された',z(armor)==='sz'&&C(armor).equipTo&&C(armor).equipTo.uid===host.uid,JSON.stringify({z:z(armor),equip:C(armor)&&C(armor).equipTo}));
  ok('アーマー direct: 相手の対象効果から装備モンスター以外を守る',kept(other,1,foeBook)===0&&kept(foe,1,foeBook)===0,'');
  ok('アーマー negative: 装備モンスター自身は相手の対象効果でも選べる',kept(host,1,foeBook)===1,'');
  ok('アーマー negative: 自分の対象効果では装備モンスター以外も選べる',kept(other,0,ownBook)===1&&kept(foe,0,ownBook)===1,'');
  let seen=targetSeen(castActive(BOOK,[uid(other)]));
  ok('アーマー real path: 自分の月の書の候補に装備モンスター以外も含まれる',seen.cands.indexOf(other.uid)>=0&&seen.cands.indexOf(foe.uid)>=0,JSON.stringify(seen));
  endTurn();seen=targetSeen(castActive(BOOK,[uid(host)]));
  ok('アーマー real path: 相手の月の書では装備モンスターだけを対象にできる',seen.cands.indexOf(host.uid)>=0&&seen.cands.indexOf(other.uid)<0&&seen.cands.indexOf(foe.uid)<0,JSON.stringify(seen));
  audit('メタルシルバー・アーマー'); }
{ fresh();const host=mon('ワイト',0),other=mon('ライオウ',0),foeBook=mk(BOOK,1);gameState.players[0].mz=[host,other];gameState.players[1].hand=[foeBook];baselineA();
  ok('アーマー control: 装備カードが無ければ相手の効果でも対象にできる',kept(other,1,foeBook)===1,''); }
`);
