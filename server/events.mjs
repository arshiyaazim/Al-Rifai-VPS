import{EventEmitter}from'node:events';export const liveEvents=new EventEmitter();liveEvents.setMaxListeners(200);export const publish=()=>liveEvents.emit('change',{at:new Date().toISOString()});
