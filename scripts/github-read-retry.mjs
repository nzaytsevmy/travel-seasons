// Retry a failed READ, never a whole long controller or an ambiguous write.
const transientStatus=new Set([500,502,503,504]);
const transientCode=new Set(['ECONNRESET','ETIMEDOUT','EAI_AGAIN','UND_ERR_CONNECT_TIMEOUT','UND_ERR_SOCKET']);
export async function retryGitHubRead(read,{attempts=4,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}) {
 if(!Number.isInteger(attempts)||attempts<1||attempts>4)throw new Error('Read retries must be bounded to1–4 attempts');
 for(let attempt=1;;attempt++){
  try{return await read();}
  catch(error){
   const status=Number(error.status??error.response?.status);
   const retryable=transientStatus.has(status)||(!status&&transientCode.has(error.code??error.cause?.code));
   if(!retryable||attempt>=attempts)throw error;
   await sleep(2000*2**(attempt-1));
  }
 }
}
