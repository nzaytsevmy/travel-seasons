import {execFileSync} from 'node:child_process';
import {appendFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {gitChanges,classifyRelease,gitEnvironment} from './release-scope.mjs';

export function deploymentScope({eventName,baseSha,headSha,cwd=process.cwd()}){
 const git=(...args)=>execFileSync('git',args,{cwd,env:gitEnvironment(),encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
 if(!/^[a-f0-9]{40}$/.test(headSha||'')||git('rev-parse','HEAD')!==headSha)throw new Error('Deployment checkout identity mismatch');
 // A scheduled or deliberate manual rebuild must run even when main's last commit only accounted for a release.
 if(!['push','workflow_dispatch'].includes(eventName)||!/^[a-f0-9]{40}$/.test(baseSha||'')||/^0+$/.test(baseSha))return 'full';
 try{
  git('cat-file','-e',`${baseSha}^{commit}`);
  git('merge-base','--is-ancestor',baseSha,headSha);
 }catch{return 'full';} // Unknown history is never permission to skip production.
 return classifyRelease(gitChanges(baseSha,headSha,cwd).changes);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const mode=deploymentScope({eventName:process.env.GITHUB_EVENT_NAME,baseSha:process.env.DEPLOY_BASE_SHA,headSha:process.env.GITHUB_SHA});
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`mode=${mode}\n`);
  console.log(mode==='accounting'?'Only ordinary DAILY queue accounting changed: no rendered content or artifact deployment.':'Full production build and exact deployment required.');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
