import{spawnSync}from'node:child_process';
for(const script of['tests/integration.mjs','tests/routing-imports.mjs']){const r=spawnSync(process.execPath,['--experimental-strip-types',script],{stdio:'inherit',env:process.env});if(r.status!==0)process.exit(r.status||1);}
