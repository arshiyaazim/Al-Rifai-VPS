"""Embedded Accounts parser; called by server/extract.py after identity checks.
This module does not read datasets or write database records.
"""
from pathlib import Path
from collections import Counter,defaultdict
from decimal import Decimal,InvalidOperation
import argparse,hashlib,importlib.util,json,re
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('conversation_import',ROOT/'scripts/update_conversations.py')
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
PHONE=base.PHONE
METHOD=re.compile(r'\(\s*(B|N|C|R|BKASH|BIKASH|NAGAD|CASH|ROCKET|BANK)\s*\)|\b(BKASH|BIKASH|NAGAD|CASH|ROCKET|BANK)\b',re.I)
MONEY=re.compile(r'(?<![\w\d])([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*/(?:[-+](?!\d)|(?=\s*(?:$|\n|<)))')
EXPLICIT_AMOUNT=re.compile(r'(?:Amount|টাকা|পরিমাণ)\s*[:=-]\s*([\d,]+(?:\.\d{1,2})?)',re.I)
IDENTITY_KEYS=('confirmed','adminPhone','accountantContactConfirmed','conversationType','senderAlias','sourceSha256')
def normal_text(text):
 text=re.sub(r'[\u200b-\u200f\ufeff]','',text.translate(base.DIGITS))
 text=re.sub(r'^\s*\[\d{1,2}/\d{1,2}(?:/\d{2,4})?,\s*\d{1,2}:\d{2}\]\s*[^:]+:\s*','',text)
 text=re.sub(r'^\s*(?:\(\d{1,2}\)|\d{1,2}[.)])\s*','',text)
 text=re.sub(r'^(\s*(?:ID|আইডি))\s*[;:=\-]\s*',r'\1: ',text,flags=re.I)
 return text.strip()
def clean_name(text):
 text=text.strip(' \n,:;-=*')
 text=re.sub(r'(?:\b(?:Payout|Payment|Mobile|Number|Master)|নাম্বার)\s*[:=-]?\s*$','',text,flags=re.I).strip(' \n,:;-=*')
 return text

def parse_block(text):
 s=normal_text(text);phones=list(PHONE.finditer(s));method_match=METHOD.search(s)
 if len(phones)>2:return {'error':'More than two mobile occurrences; employee/payout roles need review'}
 method=({'b':'bkash','bkash':'bkash','bikash':'bkash','n':'nagad','nagad':'nagad','c':'cash','cash':'cash','r':'rocket','rocket':'rocket','bank':'bank'}.get((method_match[1] or method_match[2]).lower(),'unknown') if method_match else 'unknown')
 after=s[phones[-1].end():] if phones else s
 # Reject malformed written amounts before narrower matching can truncate a decimal.
 amount_form=re.compile(r'(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})+,\d{3})(?:\.\d{1,2})?')
 written=[m[1] for m in re.finditer(r'(?:Amount|টাকা|পরিমাণ)\s*[:=-]\s*([0-9][0-9,.]*)',after,re.I)]
 written += [m[1] for m in re.finditer(r'(?<![\w\d])([0-9][0-9,.]*)\s*/[-+]',after)]
 if any(not amount_form.fullmatch(v) for v in written):return {'error':'Malformed written amount; decimal precision/grouping must be confirmed'}
 # Amounts must be written, never calculated from duty days/rates or repaired typos.
 explicit=list(EXPLICIT_AMOUNT.finditer(after));amounts=list(MONEY.finditer(after))
 method_tail=METHOD.search(after)
 direct=re.match(r'\s*[:=\-]?\s*([\d,]+(?:\.\d{1,2})?)(?![\d,.])',after[method_tail.end():]) if method_tail else None
 values=[x[1] for x in explicit] or [x[1] for x in amounts] or ([direct[1]] if direct else [])
 if not values:return {'error':'Payment amount is missing or malformed'}
 try:cents=[int(Decimal(v.replace(',',''))*100) for v in values]
 except InvalidOperation:return {'error':'Invalid amount'}
 if len(set(cents))!=1 or (direct and int(Decimal(direct[1].replace(',',''))*100)!=cents[0]):return {'error':'Conflicting written amounts; no amount was guessed'}
 if not 0<cents[0]<=100000000:return {'error':'Amount is outside the supported range'}
 employee='';payout='';name='';rule='';issues=[]
 if len(phones)==2:
  a,b=phones;prefix=s[:a.start()].strip();name=clean_name(s[a.end():b.start()])
  if prefix and not re.fullmatch(r'(?:ID|আইডি)\s*[:=-]?\s*',prefix,re.I):return {'error':'Employee ID position is ambiguous'}
  if re.search(r'(?:\bID|আইডি)\s*[:=-]',name,re.I):return {'error':'Conflicting ID labels'}
  employee=base.phone(a.group());payout=base.phone(b.group());rule='two_number_explicit_id' if prefix else 'two_number_before_name'
 elif len(phones)==1:
  a=phones[0];raw_name=s[:a.start()];name=clean_name(raw_name)
  if re.search(r'(?:\bID|আইডি)\s*[:=-]',raw_name,re.I):return {'error':'Incomplete explicit ID/name/payout structure; payout was not used as Employee ID'}
  employee=base.phone(a.group());rule='single_number_after_name';issues.append('Separate payout mobile was not provided')
 else:
  if method!='cash':return {'error':'No employee identity or explicit cash payment structure'}
  name=clean_name(s[:min([method_match.start()]+[x.start() for x in amounts])])
  if re.search(r'(?:\bID|আইডি)\s*[:=-]',name,re.I):name=clean_name(re.sub(r'^(?:ID|আইডি)\s*[:=-]\s*','',name,flags=re.I))
  rule='cash_missing_employee_id';issues.append('Employee ID was not provided; no employee was created or matched')
 if not name or not re.search(r'[A-Za-zঅ-য়]',name) or len(name)>120:return {'error':'Employee name is missing or ambiguous'}
 if phones and (not employee or len(phones)==2 and not payout):return {'error':'Invalid employee/payout mobile; source digits were not repaired'}
 if method=='unknown':issues.append('Payment method was not specified')
 if '<This message was edited>' in s:issues.append('Edited source message')
 return {'employeePhone':employee,'payoutPhone':payout,'name':name,'amountCents':cents[0],'method':method,'identityRule':rule,'issues':issues}

def candidate_line(line):
 s=normal_text(line)
 return bool(PHONE.search(s) or re.search(r'(?:\bID|আইডি)\s*[:=;\-]',s,re.I) or METHOD.search(s) or MONEY.search(s))
def cancellation(text):return bool(re.search(r'\bcancel(?:led|ed)?\b|পাঠাবেন না|পাঠিও না|টাকা.*বন্ধ|বাদ দিন',text,re.I))
def parse_message(message,proof):
 if not base.accounts_gate(message,proof):return [],[{'id':message['id']+'-identity','sourceMessageId':message['id'],'reason':'Conversation identity was not established; no Accounts parsing was run','kind':'identity'}]
 lines=message['body'].splitlines();rows=[];reviews=[];i=0;cash_heading=False
 while i<len(lines):
  line=normal_text(lines[i])
  if not line:i+=1;continue
  if re.fullmatch(r'Cash\s*[:=-]?',line,re.I):cash_heading=True;i+=1;continue
  if cash_heading and MONEY.search(line) and not METHOD.search(line):line+=' (Cash)'
  start=i;candidate=line;parsed=parse_block(candidate);end=i+1
  # Extend only unfinished blocks. Never swallow the next independently complete payment.
  if 'error' in parsed and not MONEY.search(line) and not (METHOD.search(line) and re.search(r'\d',line[ METHOD.search(line).end():])):
   if candidate_line(line) or (re.fullmatch(r'[A-Za-zঅ-য় .,_\-]{2,100}',line) and not re.search(r'জমা|টোটাল|total|balance|date',line,re.I)):
    for j in range(i+1,min(i+6,len(lines))):
     next_line=normal_text(lines[j])
     if not next_line:continue
     if re.match(r'^(?:ID|আইডি)\s*[:=;\-]',next_line,re.I):break
     candidate+='\n'+next_line;end=j+1;parsed=parse_block(candidate)
     if 'error' not in parsed or MONEY.search(next_line):break
  if 'error' not in parsed:
   if cancellation(message['body']):reviews.append({'id':message['id']+'-cancel-'+str(start),'sourceMessageId':message['id'],'reason':'Cancellation/revision language needs verification before including a payment','kind':'cancellation','candidate':parsed});i=end;continue
   row={**parsed,'id':'accounts-'+base.digest(message['id']+'|'+str(start)),'date':message['messageDate'],'time':message['time'],'source':'WhatsApp archive','sourceId':message['id'],'sourceLine':message['line']+start,'sender':message['sender'],'senderPhone':base.phone(proof.get('adminPhone','')),'receiverIdentity':proof.get('accountantName','Configured Accountant'),'category':'Employee payment instruction','status':'Admin payment instruction · receipt unverified','purpose':'','identityVerified':True,'identityProofKind':'Database source binding'}
   rows.append(row);i=end
  else:
   if candidate_line(line):reviews.append({'id':message['id']+'-parse-'+str(start),'sourceMessageId':message['id'],'reason':parsed['error'],'kind':'parsing','sourceLine':message['line']+start})
   i+=1
 return rows,reviews

