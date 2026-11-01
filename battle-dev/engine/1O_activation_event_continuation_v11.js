/* P1.1 -> SEGOC continuation. Descriptors contain only UID/JSON data.
   Live closures remain a compatibility path; EVENT/EVENT_BATCH processors
   have a data continuation that also survives a process reload. */
function eventSelectionDescriptorV11(index){
 const st=EVT_V2_STATE;if(!st)return null;
 /* S03-U484: the continuation is recorded where its closure is built (processEventV27 / processEventBatchV28 -> EVT_RESUME_DATA_V484 -> EVT_V2_STATE.resumeData),
    so "this data == that closure" holds by construction. It used to be re-derived from the waiting processor unit's payload, which could disagree with the
    closure that was actually captured. S03-U159 (a batch carrying a summon success) is covered by processEventBatchV28 recording its postPointS03. */
 const resume=st.resumeData||null;
 return {eventName:st.eventName,evt:safeActivationEventV11(st.evt),rank:st.rank,index,chainStart:st.chainStart,resume,
   groups:st.groups.map(g=>g.map(c=>Object.assign({uid:c.card.uid,p:c.p,zone:c.zone,index:c.index,name:c.name,rank:c.rank,forced:c.forced,
     eventName:c.eventName,event:safeActivationEventV11(c.event||c.ctx&&c.ctx.event||st.evt)},
     c.forcedSTS03?{forcedSTS03:true}:{},
     c.logicalZoneS298?{logicalZoneS298:c.logicalZoneS298}:{})))};   /* S03-U290: a forced Spell / Trap trigger stays unskippable after the continuation */
}
function restoreEventSelectionV11(data){
 const old=EVT_V2_STATE;
 return {eventName:data.eventName,evt:restoreEventRefsV27(data.evt),rank:data.rank,chainStart:data.chainStart,
   /* S03-U484: a restored window keeps the same continuation for the picks made after it (resumeData is what eventSelectionDescriptorV11 reads) */
   resume:data.resume,resumeData:data.resume||null,after:old&&old.after||null,
   groups:data.groups.map(g=>g.map(c=>{
     const hit=findCardByUid(c.uid);if(!hit)return null;
     const event=restoreEventRefsV27(c.event),extra={event};
     if(c.eventName==='onDamageStep'){extra.step=event.step;extra.battle=battleContextV28();}
     return Object.assign({},c,{card:hit.card,index:hit.index,zone:hit.zone,event,
       ctx:makeContext(c.p,hit.card,hit.zone,hit.index,c.eventName,extra)});
   }).filter(Boolean))};
}
function completeEventSelectionV11(desc,committed){
 const data=desc&&desc.eventSelectionV11;if(!data)return false;
 const st=restoreEventSelectionV11(data);
 if(committed)st.groups[st.rank]=st.groups[st.rank].filter(c=>!(c.uid===desc.uid&&c.eventName===desc.eventName));
 EVT_V2_STATE=st;processEventGroupV2();return true;
}
function resumeEventProcessorV11(resume){
 if(resume&&resume.postPoint)enqueueProcessorV27(PROCESSOR_V27.POINT,resume.postPoint,false);
 processorResumeV27();
}
