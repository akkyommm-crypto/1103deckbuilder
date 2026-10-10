/* S03-U114 fixture — the 1103 deck builder's storage contract, extracted VERBATIM (not re-imagined).
   source: C:\Users\81806\Documents\Codex\2026-09-23\new-chat\outputs\index.html
   source SHA256: d4a2f9fe9d943590609e6c7f56d408bb7814445c5382dfbdcce0260d7d7b2979
   lines 2115-2204 of that file (the "storage (localStorage)" section: LEGACY_DECK_PREFIX /
   DECK_V2_PREFIX / DECK_MIGRATION_KEY, normalizeDeckRecord, migrateLegacyDecks, getDeckById, saveDeckRecord,
   saveDeck, listDecks, deleteDeckById).
   Wrapped in an IIFE so the builder's own LS()/showToast do not shadow the DUEL globals; the builder code writes to
   the same window.localStorage that DUEL reads. Regenerate with the same extraction if the builder changes. */
module.exports = String.raw`
const DECK_BUILDER_V90 = (function(){
  // ---------- storage (localStorage) ----------
  // v90: saved decks are keyed by an internal ID, not by the visible deck name.
  // Legacy name-keyed data is migrated non-destructively on first load.
  var LEGACY_DECK_PREFIX = 'deck1103:';
  var DECK_V2_PREFIX = 'deck1103v2:';
  var DECK_MIGRATION_KEY = 'deck1103v2:migrated';
  var SHOP_KEY = 'shopping1103:v1';
  var RECENT_KEY = 'recent1103:v1';
  var BACKUP_META_KEY = 'backup1103:lastExport';
  var BACKUP_MAGIC = '1103-deckbuilder-backup';

  // safe accessor: some sandboxed/preview environments block localStorage
  function LS(){ try{ return window.localStorage; }catch(e){ return null; } }
  function makeDeckId(){
    try{ if(window.crypto && crypto.randomUUID) return 'deck_'+crypto.randomUUID(); }catch(e){}
    return 'deck_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);
  }
  function legacyDeckId(name){
    var h=2166136261, str=String(name||'');
    for(var i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
    return 'legacy_'+(h>>>0).toString(36);
  }
  function cloneJson(v){ return JSON.parse(JSON.stringify(v)); }
  function normalizeDeckRecord(d, fallbackId){
    d=d||{};
    return {
      id:d.id || fallbackId || makeDeckId(),
      name:d.name || '無題のデッキ',
      cards:Array.isArray(d.cards)?d.cards:[],
      side:Array.isArray(d.side)?d.side:[],
      candidates:Array.isArray(d.candidates)?d.candidates:[],
      memo:String(d.memo||''),
      date:d.date || new Date().toISOString()
    };
  }
  function migrateLegacyDecks(){
    var ls=LS(); if(!ls) return;
    try{
      if(ls.getItem(DECK_MIGRATION_KEY)==='1') return;
      var keys=[];
      for(var i=0;i<ls.length;i++){
        var k=ls.key(i);
        if(k && k.indexOf(LEGACY_DECK_PREFIX)===0) keys.push(k);
      }
      keys.forEach(function(k){
        try{
          var d=JSON.parse(ls.getItem(k));
          if(!d || !d.name) return;
          var id=legacyDeckId(d.name);
          var nk=DECK_V2_PREFIX+id;
          if(!ls.getItem(nk)){
            var nd=normalizeDeckRecord(d,id);
            ls.setItem(nk,JSON.stringify(nd));
          }
        }catch(e){}
      });
      ls.setItem(DECK_MIGRATION_KEY,'1');
    }catch(e){}
  }
  function getDeckById(id){
    var ls=LS(); if(!ls||!id) return null;
    migrateLegacyDecks();
    try{ var raw=ls.getItem(DECK_V2_PREFIX+id); return raw?normalizeDeckRecord(JSON.parse(raw),id):null; }catch(e){ return null; }
  }
  function saveDeckRecord(rec){
    var ls=LS(); if(!ls){ showToast('この環境では保存できません'); return null; }
    rec=normalizeDeckRecord(rec,rec&&rec.id);
    rec.date=new Date().toISOString();
    try{ ls.setItem(DECK_V2_PREFIX+rec.id,JSON.stringify(rec)); return rec; }
    catch(e){ showToast('保存に失敗しました'); return null; }
  }
  // compatibility wrapper used by older call sites; optional id/candidates preserve identity.
  function saveDeck(name, cards, sideCards, candidateCards, id, memo){
    return saveDeckRecord({id:id||makeDeckId(),name:name,cards:cards||[],side:sideCards||[],candidates:candidateCards||[],memo:memo||''});
  }
  function listDecks(){
    var out=[]; var ls=LS(); if(!ls) return out;
    migrateLegacyDecks();
    try{
      for(var i=0;i<ls.length;i++){
        var k=ls.key(i);
        if(k && k.indexOf(DECK_V2_PREFIX)===0 && k!==DECK_MIGRATION_KEY){
          try{ out.push(normalizeDeckRecord(JSON.parse(ls.getItem(k)),k.slice(DECK_V2_PREFIX.length))); }catch(e){}
        }
      }
    }catch(e){}
    out.sort(function(a,b){ return (b.date||'').localeCompare(a.date||''); });
    return out;
  }
  function deleteDeckById(id){ var ls=LS(); if(!ls||!id) return; try{ ls.removeItem(DECK_V2_PREFIX+id); }catch(e){} }
  return {LEGACY_DECK_PREFIX:LEGACY_DECK_PREFIX, DECK_V2_PREFIX:DECK_V2_PREFIX, DECK_MIGRATION_KEY:DECK_MIGRATION_KEY,
          makeDeckId:makeDeckId, legacyDeckId:legacyDeckId, normalizeDeckRecord:normalizeDeckRecord,
          migrateLegacyDecks:migrateLegacyDecks, getDeckById:getDeckById, saveDeckRecord:saveDeckRecord,
          saveDeck:saveDeck, listDecks:listDecks, deleteDeckById:deleteDeckById};
})();
`;
