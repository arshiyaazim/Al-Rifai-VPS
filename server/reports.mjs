import {listEntities,canWrite} from './management.mjs';
import {listRecords,fail} from './records.mjs';
import {filterRows,queryFilters} from '../lib/vessel-data.ts';
import {filterCash,queryCashFilters,cashDaily,employeeStatements} from '../lib/cash-data.ts';
export const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function csvCell(v){let s=typeof v==='object'?JSON.stringify(v):String(v??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
const selectedColumns={
 programs:['id','clientName','motherVessel','lighterVessel','masterName','masterMobile','escortName','escortMobile','destination','startDate','shift','endDate','endShift','releasePoint','status'],
 vessels:['id','name','role','status','location','notes'],projects:['id','name','status','location','notes'],
 transactions:['id','date','time','name','accountantName','employeePhone','payoutPhone','method','amountBDT','purpose','status','paymentReference','source'],
 daily:['date','count','amountBDT'],employees:['name','employeePhone','payments','amountBDT','lastDate','needsReview'],
};
const labels={id:'Record ID',motherVessel:'Mother vessel',lighterVessel:'Lighter vessel',masterMobile:'Master mobile',escortName:'Escort name',escortMobile:'Escort mobile',startDate:'Start date',shift:'Start shift',endDate:'End date',endShift:'End shift',releasePoint:'Release point',name:'Name',employeePhone:'Employee ID mobile',payoutPhone:'Payout mobile',amountBDT:'Amount BDT',paymentReference:'Payment reference',lastDate:'Last entry',needsReview:'Entries with notes'};
const display=(key,value)=>value===null||value===undefined||value===''?'Not available':typeof value==='object'?JSON.stringify(value):String(value);
export async function reportData(db,q,user){
 const type=q.get('type')??'programs';let rows;
 const managedTypes={'whatsapp-accounts':'account',accountants:'accountant',clients:'client',contacts:'contact',groups:'group',bindings:'binding'};if(managedTypes[type]||['routing-history','imports','employees-directory'].includes(type)){if(!canWrite(user))fail('Admin report access required',403);if(managedTypes[type])rows=await listEntities(db,managedTypes[type]);else if(type==='routing-history')rows=(await db.query('SELECT binding_id,config,effective_from,effective_until,approved_at,actor FROM routing_versions ORDER BY created_at DESC')).rows;else if(type==='imports')rows=(await db.query('SELECT r.id,s.name AS source,f.name AS filename,r.status,r.counts,r.created_at,r.completed_at FROM import_runs r JOIN sources s ON s.id=r.source_id JOIN source_files f ON f.id=r.file_id ORDER BY r.created_at DESC')).rows;else rows=(await db.query('SELECT id,display_name,identity_mobile,status,role,notes FROM employees ORDER BY display_name')).rows;}else if(type==='vessels'||type==='projects'){
  rows=await listRecords(db,type==='vessels'?'vessel':'project');const terms=(q.get('q')||'').toLowerCase().trim().split(/\s+/).filter(Boolean);rows=rows.filter(r=>terms.every(t=>[r.name,r.location,r.status,r.notes].join(' ').toLowerCase().includes(t)));
 }else if(type==='programs')rows=filterRows(await listRecords(db,'program'),queryFilters(q));
 else if(['transactions','daily','employees'].includes(type)){const data=filterCash(await listRecords(db,'transaction'),queryCashFilters(q));rows=type==='daily'?cashDaily(data):type==='employees'?employeeStatements(data):data;}
 else if(type==='reviews'||type==='duplicates')rows=(await db.query('SELECT id,kind,reason,status,candidate,created_at FROM reviews'+(type==='duplicates'?" WHERE kind='duplicate'":'')+' ORDER BY created_at DESC')).rows;
 else if(type==='sources')rows=(await db.query('SELECT s.id,s.name,s.kind,s.enabled,s.created_at,(SELECT count(*) FROM messages m WHERE m.source_id=s.id) AS messages FROM sources s ORDER BY s.name')).rows;
 else if(type==='messages')rows=(await db.query('SELECT m.id,s.name AS source,m.external_id,m.chat_id,m.conversation_type,m.sender_phone,m.receiver_phone,m.sent_at,m.body FROM messages m JOIN sources s ON s.id=m.source_id ORDER BY m.sent_at DESC')).rows;
 else if(type==='audit')rows=(await db.query('SELECT actor,action,entity_id,details,created_at FROM audit_log ORDER BY created_at DESC')).rows;
 else if(type==='deleted')rows=[...await listRecords(db,'program',true),...await listRecords(db,'transaction',true),...await listRecords(db,'vessel',true),...await listRecords(db,'project',true)];
 else fail('Unknown report type');
 if(!['programs','vessels','projects','transactions','daily','employees'].includes(type)){
  const search=(q.get('q')||'').toLowerCase().trim(),from=q.get('from')||'',to=q.get('to')||'';
  rows=rows.filter(r=>{const date=String(r.sent_at??r.created_at??r.createdAt??r.effective_from??r.deletedAt??'').slice(0,10);return(!search||JSON.stringify(r).toLowerCase().includes(search))&&(!from||date>=from)&&(!to||date<=to);});
 }
 const monetary=['transactions','daily','employees'].includes(type);const amountCents=monetary?rows.reduce((n,r)=>n+r.amountCents,0):null;
 rows=rows.map(r=>r.amountCents!==undefined?{...r,amountBDT:(r.amountCents/100).toFixed(2)}:r);
 const hidden=new Set(['sourceText','sourceTextRaw','evidence','conflicts','aliases']);
 const columns=selectedColumns[type]??[...new Set(rows.flatMap(r=>Object.keys(r)))].filter(k=>!hidden.has(k));
 if(!columns.length)columns.push('id','name','status');
 return {type,columns,labels,rows,generatedAt:new Date().toISOString(),summary:{rows:rows.length,...(monetary?{amountCents,amountBDT:(amountCents/100).toFixed(2)}:{})},notice:'Amounts are recorded instructions, not independently verified receipts. Reports include every matching row.'};
}
export function reportCSV(report){return '\ufeff'+[report.columns.map(k=>csvCell(report.labels[k]||k)).join(','),...report.rows.map(r=>report.columns.map(k=>csvCell(r[k])).join(','))].join('\r\n');}
export function reportHTML(report,nonce){return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Al-Rifa’i ${escape(report.type)}</title><style>body{font:14px/1.5 Arial,sans-serif;color:#17283c;margin:24px}h1{font-size:24px}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #bbc8d5;padding:6px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#eaf1f7}thead{display:table-header-group}tr{break-inside:avoid}button{padding:10px 20px;margin:15px 0}@media print{@page{size:A4 landscape;margin:12mm}button{display:none}body{margin:0}table{font-size:9px}}</style></head><body><h1>AL-RIFA’I INTEGRATED SERVICES</h1><h2>${escape(report.type)}</h2><p>${report.rows.length} records${report.summary.amountBDT?' · Total BDT '+escape(report.summary.amountBDT):''} · ${escape(report.generatedAt)}<br>${escape(report.notice)}</p><button id="print">Print / Save as PDF</button><table><thead><tr>${report.columns.map(c=>'<th>'+escape(report.labels[c]||c)+'</th>').join('')}</tr></thead><tbody>${report.rows.map(r=>'<tr>'+report.columns.map(c=>'<td>'+escape(display(c,r[c]))+'</td>').join('')+'</tr>').join('')}</tbody></table><script nonce="${nonce}">document.getElementById('print').onclick=()=>window.print();</script></body></html>`;}
