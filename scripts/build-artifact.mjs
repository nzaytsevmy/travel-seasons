import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,appendFileSync,existsSync,openSync,readSync,closeSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';

const checksum = file => {
  const digest=createHash('sha256'), buffer=Buffer.alloc(1024*1024), fd=openSync(file,'r');
  try {
    let count;
    while ((count=readSync(fd,buffer,0,buffer.length,null))>0) digest.update(buffer.subarray(0,count));
    return digest.digest('hex');
  } finally {closeSync(fd);}
};
export function packArtifact(source, output, version) {
  mkdirSync(output,{recursive:true});
  writeFileSync(join(source,'build-version.json'),JSON.stringify({commit:version.sha,run:version.run,attempt:version.attempt}));
  const archive=resolve(output,'site.tar');
  // tar preserves file times; upload-artifact alone does not.
  execFileSync('tar',['-cf',archive,'-C',resolve(source),'.']);
  const digest=checksum(archive);
  writeFileSync(join(output,'manifest.json'),JSON.stringify({...version,digest}));
  return digest;
}
export function unpackArtifact(input, output, expected, digest) {
  const manifest=JSON.parse(readFileSync(join(input,'manifest.json'),'utf8'));
  for (const key of ['sha','run','attempt']) {
    if (!expected[key] || manifest[key] !== expected[key]) throw new Error(`Artifact version mismatch: ${key}`);
  }
  const archive=resolve(input,'site.tar');
  if (!/^[a-f0-9]{64}$/.test(digest ?? '') || manifest.digest !== digest || checksum(archive) !== digest) {
    throw new Error('Artifact checksum mismatch');
  }
  // Never overlay a previous build: stale files would evade the archive checksum.
  if (existsSync(output)) throw new Error('Artifact destination already exists');
  mkdirSync(output,{recursive:true});
  execFileSync('tar',['-xf',archive,'-C',resolve(output)]);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const version={sha:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT};
  try {
    if (Object.values(version).some(value=>!value)) throw new Error('Missing artifact version');
    if (execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim() !== version.sha) throw new Error('Checkout version mismatch');
    if (process.argv[2] === 'pack') {
      const digest=packArtifact('dist','.build-artifact',version);
      if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT,`digest=${digest}\n`);
      console.log(`Artifact: ${version.sha}, sha256=${digest}`);
    } else if (process.argv[2] === 'unpack') {
      unpackArtifact('.build-artifact','dist',version,process.env.ARTIFACT_DIGEST);
    } else throw new Error('Usage: build-artifact.mjs pack|unpack');
  } catch (error) {console.error(error.message);process.exitCode=1;}
}
