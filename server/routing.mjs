import {canonical} from './records.mjs';
import {activeAt,routingDigest} from './management.mjs';
export const intents=text=>({cash:/\b(?:bkash|bikash|nagad|rocket|cash|payout|amount|payment)\b|\([BNCR]\)|\d\s*\/-|বিকাশ|নগদ|টাকা|পেমেন্ট/i.test(text),program:/escort|lighter|mother\s*vessel|assignment|release|service\s*order|এস্কর্ট|এসকর্ট|রিলিজ|লাইটার|মাদার/i.test(text),order:/need\s+(?:an?\s+)?escort|escort\s*(?:service|order|require|request)|service\s*order|send\s+(?:an?\s+)?escort|এস্কর্ট.*(?:লাগবে|প্রয়োজন|প্রয়োজন|পাঠা)|এসকর্ট.*(?:লাগবে|পাঠা)|escort\s*name\s*:/i.test(text)});
export async function loadRouting(db,source){const versions=(await db.query("SELECT * FROM routing_versions WHERE config->>'sourceId'=$1 ORDER BY effective_from DESC,created_at DESC",[source.id])).rows;return{source,versions,digest:await routingDigest(db,source)};}
const at=v=>new Date(v).getTime();
export function routingChats(state){const now=Date.now(),latest=new Map();for(const v of state.versions){if(!latest.has(v.binding_id)&&at(v.effective_from)<=now&&(!v.effective_until||now<at(v.effective_until)))latest.set(v.binding_id,v);}return [...new Set([...(state.source.config.allowedChatIds||[]),...Array.from(latest.values()).filter(v=>validSnapshot(v.config,now)).map(v=>v.config.chatId)])];}
export function routingStarts(state){const starts={};for(const v of state.versions){const c=v.config;if(!validSnapshot(c,Date.now())||at(v.effective_from)>Date.now()||v.effective_until&&Date.now()>=at(v.effective_until))continue;const t=new Date(Math.max(at(v.effective_from),at(v.approved_at))).toISOString();if(!starts[c.chatId]||t<starts[c.chatId])starts[c.chatId]=t;}return starts;}
function validSnapshot(c,time){return !c.invalid&&activeAt(c,time)&&activeAt(c.account,time)&&(!c.party||activeAt(c.party,time))&&(!c.contact||activeAt(c.contact,time))&&(!c.group||activeAt(c.group,time));}
export function bindingForFile(state,context){const versions=state.versions.filter(v=>v.binding_id===context.bindingId);if(context.bindingVersionId)return versions.find(v=>v.id===context.bindingVersionId)?.config||null;return(versions.find(v=>at(v.effective_from)<=Date.now()&&(!v.effective_until||Date.now()<at(v.effective_until)))||versions[0])?.config||null;}
function fixedCashIdentityMatches(m,{sender,receiver,admin,contact,party}){
 const owner=canonical(process.env.CASH_OWNER_PHONE),accountant=canonical(process.env.CASH_ACCOUNTANT_PHONE);
 const chatPhone=canonical(String(m.chatId||'').split('@')[0]);
 // Fail closed: no live automatic cash routing until both private environment bindings are set.
 return !!owner&&!!accountant&&m.conversationType==='direct'&&!m.chatId.endsWith('@g.us'&&false)&&
  sender===owner&&receiver===accountant&&chatPhone===accountant&&canonical(admin)===owner&&
  canonical(contact)===accountant&&party?.kind==='accountant'&&canonical(party.phone||contact)===accountant;
}
export function routeMessage(state,m,{bindingId='',bindingVersionId='',historicalAttested=false}={}){
 const time=at(m.timestamp),sender=canonical(m.senderPhone),receiver=canonical(m.receiverPhone),intent=intents(m.text),matches=[],seen=new Set();
 for(const v of state.versions){const c=v.config;if(seen.has(v.binding_id))continue;let inRange=at(v.effective_from)<=Math.min(time,Date.now())&&(!v.effective_until||time<at(v.effective_until))&&at(v.approved_at)<=time;
  if(bindingId&&v.binding_id!==bindingId)continue;if(bindingVersionId&&v.id!==bindingVersionId)continue;
  // A sealed owner-reviewed file exception is explicit; new live approvals never retro-authorize.
  if(historicalAttested&&bindingId===v.binding_id){const chosen=bindingVersionId?state.versions.find(x=>x.id===bindingVersionId&&x.binding_id===bindingId):state.versions.find(x=>x.binding_id===bindingId&&at(x.effective_from)<=Date.now()&&(!x.effective_until||Date.now()<at(x.effective_until)))||state.versions.find(x=>x.binding_id===bindingId);if(chosen?.id!==v.id)continue;inRange=true;}
  if(!inRange)continue;seen.add(v.binding_id);if(!validSnapshot(c,time)||c.chatId!==m.chatId||c.conversationType!==m.conversationType)continue;
  if((m.conversationType==='direct'&&m.chatId.endsWith('@g.us'))||(m.conversationType==='group'&&!m.chatId.endsWith('@g.us')))continue;
  const admin=c.account.phone,contact=c.contact?.phone,employee=c.employee?.identity_mobile;
  if(m.conversationType==='direct'){
   const peer=contact||employee;if(peer&&!((sender===admin&&receiver===peer)||(sender===peer&&receiver===admin)))continue;
   if(!peer&&sender!==admin&&receiver!==admin)continue;
   // Numeric direct JIDs must identify one of the two actual participants.
   const jidPhone=canonical(m.chatId.split('@')[0]);if(/@(?:s\.whatsapp\.net|c\.us)$/.test(m.chatId)&&jidPhone&&![sender,receiver].includes(jidPhone))continue;
  }else{
   const actor=(c.actors||[]).find(a=>a.phone===sender&&activeAt(a,time)&&(!a.party||activeAt(a.party,time)));
   if(!actor||!c.group.allowedSenderPhones?.includes(sender)){matches.push({domain:'identity',reason:'Group sender has no explicit active role permission',bindingId:c.bindingId});continue;}
  }
  const common={bindingId:c.bindingId,bindingVersionId:v.id,domain:c.domain,permission:c.permission,adminPhone:admin,accountId:c.account.id,accountantId:c.party?.kind==='accountant'?c.party.id:'',accountantPhone:c.party?.kind==='accountant'?contact||'':'',accountantName:c.party?.kind==='accountant'?c.party.name:'',clientId:c.party?.kind==='client'?c.party.id:'',clientName:c.party?.kind==='client'?c.party.name:'',historicalAttested};
  if(c.permission==='accounts_direct'&&c.domain==='accounts'&&intent.cash){
   const allowed=fixedCashIdentityMatches(m,{sender,receiver,admin,contact,party:c.party});
   matches.push({...common,financeAllowed:allowed,reason:allowed?'Fixed Owner → verified Accountant direct chat':'Cash blocked: Owner/Accountant environment identity, sender, recipient, chat JID and approved binding must all match'});continue;
  }
  if(c.permission==='cash_admin_group'&&c.group?.policy==='cash_admin_group'&&intent.cash){matches.push({...common,financeAllowed:false,reason:'Cash blocked: a group chat is not the verified Accountant direct chat'});continue;}
  if(c.permission==='program_draft'&&intent.program){const authorizedClient=m.conversationType==='direct'?sender===contact:(c.contacts||[]).some(p=>p.phone===sender&&activeAt(p,time)&&c.group.allowedSenderPhones.includes(sender));matches.push({...common,programAllowed:authorizedClient&&intent.order,draft:true,reason:!authorizedClient?'Client sender authority is not established':!intent.order?'A service-order intent is not established':'Approved client escort-service order'});continue;}
  if(c.permission==='program_operations'&&intent.program){matches.push({...common,programAllowed:true,draft:false,reason:'Explicit operational-program permission'});continue;}
  matches.push({...common,reason:c.domain==='employee'?'Employee duty/attendance message requires review':'Message is outside this binding’s automatic business permission'});
 }
 const actionable=matches.filter(m=>m.financeAllowed||m.programAllowed),domains=new Set(actionable.map(m=>m.domain));if(domains.size>1||actionable.length>1&&new Set(actionable.map(m=>[m.permission,m.clientId,m.accountantPhone].join('|'))).size>1)return{domain:'identity',reason:'Multiple scoped business permissions match; intent needs review',financeAllowed:false,programAllowed:false};
 if(actionable.length)return actionable[0];return{...matches[0],domain:matches[0]?.domain||'identity',reason:matches[0]?.reason||'No effective, approved participant/source binding matched',financeAllowed:false,programAllowed:false};
}
export function financeGate(route){return route?.financeAllowed===true&&!!route.bindingVersionId;}
