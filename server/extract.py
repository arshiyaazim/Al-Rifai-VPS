"""Local extraction only. Authorization is supplied by the database routing layer."""
import sys,json,base64,tempfile,importlib.util,hashlib,csv,io,datetime,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('accounts',ROOT/'scripts/update_accounts.py');a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a);b=a.base
NS=b.load_parser()
def export_file(job):
 content=base64.b64decode(job['content']);name=job['name'].lower()
 if name.endswith('.txt'):
  with tempfile.NamedTemporaryFile(suffix='.txt') as f:
   f.write(content);f.flush();messages,meta=b.parse_export(Path(f.name),job['sourceId'],'group','',NS)
  return {'messages':messages,'structured':[],'reviews':[],'meta':meta}
 if name.endswith('.csv'):rows=list(csv.DictReader(io.StringIO(content.decode('utf-8-sig'))))
 elif name.endswith('.json'):
  parsed=json.loads(content);rows=parsed if isinstance(parsed,list) else parsed.get('records',[])
 elif name.endswith('.xlsx'):
  import openpyxl
  wb=openpyxl.load_workbook(io.BytesIO(content),read_only=True,data_only=True);rows=[]
  for sheet in wb:
   values=iter(sheet.values);headers=[str(x or '').strip() for x in next(values,[])];rows.extend({k:(v.isoformat()[:10] if isinstance(v,(datetime.datetime,datetime.date)) else v) for k,v in zip(headers,row) if k} for row in values if any(v is not None for v in row))
 else:return {'messages':[],'structured':[],'reviews':[{'reason':'Media/PDF retained. Classification/OCR and release fields require human review.'}]}
 if not isinstance(rows,list) or len(rows)>50000:raise ValueError('Provide at most 50,000 structured rows')
 return {'messages':[],'structured':rows,'reviews':[]}
def one_message(job):
 m={'sensitiveExcluded':False,'mediaNames':[],**job['message']};programs=[];cash=[];reviews=[]
 if job.get('programAllowed') and not m['sensitiveExcluded']:
  programs=[p for p in NS['parse_programs'](m) if job.get('includeReferences') or p.get('details',{}).get('recordKind')!='Vessel reference']
 if job.get('financeAllowed'):
  identity=job.get('identity',{});p={**m,'conversationType':identity.get('conversationType'),'senderPhone':identity.get('adminPhone','')};proof={**identity,'confirmed':True,'financeAuthorized':True,'sourceSha256':m.get('sourceSha256')}
  cash,reviews=a.parse_message(p,proof)
 if not programs and (m.get('hasMedia') or re.search(r'escort|lighter|mother vessel|release|relace|এস্কর্ট|রিলিজ|জাহাজ|start date',m['body'],re.I)):
  reviews.append({'reason':'Operational message/media needs field confirmation; no record was guessed. Media OCR is not configured.'})
 return {'programs':programs,'cash':cash,'reviews':reviews}
if __name__=='__main__':
 try:
  job=json.load(sys.stdin)
  result=[one_message(j) for j in job['jobs']] if job.get('mode')=='batch' else one_message(job) if job.get('mode')=='message' else export_file(job)
  json.dump(result,sys.stdout,ensure_ascii=False,default=str)
 except Exception as e:
  print(json.dumps({'error':str(e)},ensure_ascii=False));sys.exit(1)
