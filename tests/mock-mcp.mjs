// Synthetic stdio server: records every requested tool so mutation blocking is testable.
import fs from 'node:fs';import {createInterface} from 'node:readline';
const log=process.argv[2];
createInterface({input:process.stdin}).on('line',line=>{const r=JSON.parse(line);if(!r.id)return;let result={};
 if(r.method==='initialize')result={protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'synthetic',version:'1'}};
 if(r.method==='tools/list')result={tools:['get_my_profile','list_messages','get_message_context','send_message'].map(name=>({name,inputSchema:{type:'object'}}))};
 if(r.method==='tools/call'){fs.appendFileSync(log,r.params.name+'\n');const value=r.params.name==='get_my_profile'?{phone:'01880446111',name:'Synthetic Admin'}:r.params.name==='list_messages'?[]:{messages:[],targetIndex:0};result={content:[{type:'text',text:JSON.stringify(value)}]};}
 process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:r.id,result})+'\n');
});
