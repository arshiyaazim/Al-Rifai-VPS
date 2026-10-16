"""Reproducible, loss-accounted import of owner-supplied WhatsApp exports.
Embedded shared functions used by server/extract.py. No standalone dataset writer.
Accounts parsing requires an explicit source-bound identity attestation.
"""
from pathlib import Path
from collections import Counter,defaultdict
from datetime import date as Date
import argparse,copy,hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
DIGITS=str.maketrans('০১২৩৪৫৬৭৮৯','0123456789')
PHONE=re.compile(r'(?<!\d)(?:\+?880[\s-]*)?0?1[3-9](?:[\s-]*\d){8}(?!\d)')
def digest(v):return hashlib.sha256(v.encode()).hexdigest()[:24]
def norm(v):return re.sub(r'[^\w]','',re.sub(r'\bm\.?\s*v\.?\s*','',str(v).translate(DIGITS).lower()))
def phone(v):
    s=re.sub(r'[\u200b-\u200f\ufeff]','',str(v)).translate(DIGITS)
    n=re.sub(r'[\s+()-]','',s)
    if n.startswith('880'):n='0'+n[3:]
    return n if re.fullmatch(r'01[3-9]\d{8}',n) else ''
def message_signature(m):return digest('|'.join(str(m.get(k,'')) for k in ['messageDate','time','sender','body']))
def load_parser():
    ns={};s=(ROOT/'scripts/ingest_chats.py').read_text()
    exec(compile(s,'maritime-parser','exec'),ns)
    ns['KEYS'].update({'start shift':'shift','completion date':'endDate','completed date':'endDate','completion/end date':'endDate','end shift':'endShift','completion shift':'endShift','relace date':'endDate','release date':'endDate','relase date':'endDate','relese date':'endDate','joint date':'startDate','join date':'startDate','r.point':'releasePoint','relace point':'releasePoint','release place':'releasePoint','escort mobile number':'escortMobile','master mobile number':'masterMobile'})
    original=ns['record']
    def record(m,v,i,kind,raw):
        p=original(m,v,i,kind,raw)
        if not p:return None
        # Preserve the entire source mother label; old parser truncated at / or comma.
        if v.get('motherVessel'):p['motherVessel']=ns['clean'](v['motherVessel'])
        d=p['details']
        for field in ['masterMobile','escortMobile']:
            raw_phone=p.get(field,'');normalized=phone(raw_phone)
            if raw_phone and not normalized:d.setdefault('rawPhones',{})[field]=raw_phone;p[field]=''
            elif normalized:p[field]=normalized
        d['endShift']=ns['shift'](str(v.get('endDate',''))) or str(v.get('endShift','')).upper()
        if d['endShift'] not in ['D','N']:d['endShift']=''
        d['documentKind']='accounts_voucher' if re.search(r'voucher|ভাউচার',raw,re.I) else 'release_note' if re.search(r'release|relace|রিলিজ',raw,re.I) else 'assignment_text'
        d['releaseConfirmed']=False
        d['sourceSha256']=m['sourceSha256'];d['sourceChat']=m['chatKey']
        p['details']=d;return p
    ns['record']=record
    return ns

def parse_export(path,key,kind,library_id,ns):
    sha=hashlib.sha256(path.read_bytes()).hexdigest();msgs=ns['parse_messages'](path,key);occ=Counter()
    for m in msgs:
        sig=message_signature(m);occ[sig]+=1;m['legacyId']=m['id'];m['id']='wa-'+digest(key+'|'+sig+'|'+str(occ[sig]))
        m.update(chatKey=key,conversationType=kind,sourceSha256=sha,libraryFileId=library_id,senderPhone='',receiverPhone='')
    return msgs,{'key':key,'file':path.name,'sha256':sha,'messages':len(msgs),'first':min(m['messageDate'] for m in msgs),'last':max(m['messageDate'] for m in msgs),'mediaMessages':sum('<Media omitted>' in m['body'] or bool(m['mediaNames']) for m in msgs),'deleted':sum(m['category']=='Deleted' for m in msgs),'redacted':sum(m['sensitiveExcluded'] for m in msgs),'libraryFileId':library_id}

def accounts_gate(m,proof):
    return bool(proof and proof.get('confirmed') is True and proof.get('financeAuthorized') is True and phone(proof.get('adminPhone','')) and phone(m.get('senderPhone',''))==phone(proof.get('adminPhone','')) and proof.get('sourceSha256')==m.get('sourceSha256') and m.get('conversationType')==proof.get('conversationType') and proof.get('conversationType') in ['direct','group'])
