import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile, stat, mkdir, readdir, rename, rm} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {allExercises} from './src/exercise-catalog.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {'.mp3':'audio/mpeg','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.json':'application/json'};
let extracting=0;

const audioDir = path.join(root, 'public/audio');
const cacheDir = path.join(audioDir, 'cache');
const listeningIds = allExercises.filter(q => q.skill === 'hoeren').map(q => q.id);
const pendingTTS = new Map();

async function generateAudio(cacheFile, args){
  const temporary = path.join(cacheDir, '.' + randomUUID() + '.mp3');
  try{
    await mkdir(cacheDir, {recursive:true});
    await new Promise((resolve, reject) => {
      const child = spawn('python3', [...args, '--write-media', temporary], {stdio:'ignore'});
      const timer = setTimeout(() => child.kill('SIGKILL'), 20000);
      child.once('close', code => {
        clearTimeout(timer);
        if(code === 0)resolve();
        else reject(new Error('Audio generation failed'));
      });
      child.once('error', error => {
        clearTimeout(timer);
        reject(error);
      });
    });
    if((await stat(temporary)).size <= 100)throw new Error('Empty audio');
    await rename(temporary, cacheFile);
  }finally{
    await rm(temporary, {force:true});
  }
}

const voiceMap = {
  katja: 'de-DE-KatjaNeural',
  conrad: 'de-DE-ConradNeural',
  amala: 'de-DE-AmalaNeural',
  killian: 'de-DE-KillianNeural',
  florian: 'de-DE-FlorianMultilingualNeural'
};

const server = createServer(async (req,res) => {
  try {
    if(req.method==='POST'&&new URL(req.url,'http://localhost').pathname==='/api/cv-extract'){
      const allowed=new Set([`http://localhost:${port}`,`http://127.0.0.1:${port}`]);
      if(!allowed.has(req.headers.origin)||!allowed.has('http://'+req.headers.host)){res.writeHead(403);res.end();return;}
      const format=new URL(req.url,'http://localhost').searchParams.get('format');
      if(!['pdf','doc','docx'].includes(format)){res.writeHead(400);res.end(JSON.stringify({error:'Unsupported format'}));return;}
      if(extracting>=2){res.writeHead(429);res.end(JSON.stringify({error:'Busy'}));return;}
      extracting++;try{
        const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>10*1024*1024){res.writeHead(413);res.end(JSON.stringify({error:'File too large'}));return;}chunks.push(chunk);}
        const result=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(root,'scripts/extract-cv.mjs'),format],{stdio:['pipe','pipe','ignore'],env:{PATH:process.env.PATH}});let output='';const timer=setTimeout(()=>{child.kill();reject(Error('timeout'));},20000);child.stdout.on('data',chunk=>{output+=chunk;if(output.length>1024*1024){child.kill();reject(Error('large'));}});child.on('error',reject);child.stdin.on('error',()=>{});child.on('close',()=>{clearTimeout(timer);try{resolve(JSON.parse(output));}catch{reject(Error('parse'));}});child.stdin.end(Buffer.concat(chunks));});
        res.writeHead(result.error?422:200,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(result));
      }catch{res.writeHead(422,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Extraction failed. Paste text instead.'}));}finally{extracting--;}return;
    }

    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const url = new URL(req.url,'http://localhost');
    const pathname = decodeURIComponent(url.pathname);

    if(pathname==='/api/audio-status'){
      const files = await readdir(audioDir, {withFileTypes:true}).catch(error => {
        if(error.code === 'ENOENT')return [];
        throw error;
      });
      const filenames = new Set(files.filter(file => file.isFile()).map(file => file.name));
      const available = listeningIds.filter(id => filenames.has(id + '.mp3'));
      res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
      res.end(JSON.stringify({available}));
      return;
    }

    if(pathname==='/api/tts'){
      const voiceKey = (url.searchParams.get('voice') || 'katja').toLowerCase();
      const text = (url.searchParams.get('text') || '').trim();
      if(!text || text.length > 5000){ res.writeHead(400); res.end('Text missing or too long'); return; }

      const instant = url.searchParams.get('instant') === '1';
      const rateRaw = url.searchParams.get('rate') || '';
      const rateMatch = /^-?\d{1,2}$/.test(rateRaw) ? Math.max(-50, Math.min(50, Number(rateRaw))) : 0;
      const rateFlag = rateMatch ? (rateMatch > 0 ? '+' : '') + rateMatch + '%' : '';
      const pitchRaw = url.searchParams.get('pitch') || '';
      const pitchMatch = /^[+-]?\d{1,3}$/.test(pitchRaw) ? Math.max(-50, Math.min(50, Number(pitchRaw))) : 0;
      const pitchFlag = pitchMatch ? (pitchMatch > 0 ? '+' : '') + pitchMatch + 'Hz' : '';

      const edgeVoice = Object.hasOwn(voiceMap, voiceKey) ? voiceMap[voiceKey] : voiceMap.katja;
      // Rate/pitch are part of the cache key only when set, so older cached files stay valid.
      let keyPrefix = rateFlag ? edgeVoice + '|rate' + rateMatch : edgeVoice;
      if(pitchFlag){ keyPrefix += '|pitch' + pitchMatch; }
      const hash = createHash('sha256').update(keyPrefix + ':' + text).digest('hex').slice(0, 20);
      const cacheFile = path.join(cacheDir, hash + '.mp3');
      const isCached = () => stat(cacheFile).then(file => file.isFile() && file.size > 100, () => false);
      if(instant){
        if(!(await isCached())){
          res.writeHead(404, {'Content-Type':'text/plain'});
          res.end('Not generated yet');
          return;
        }
      }else{
        if(!pendingTTS.has(cacheFile)){
          const prepare = async () => {
            if(await isCached())return;
            const args = ['-m', 'edge_tts', '--voice', edgeVoice, '--text', text];
            if(rateFlag)args.push('--rate=' + rateFlag);
            if(pitchFlag)args.push('--pitch=' + pitchFlag);
            await generateAudio(cacheFile, args);
          };
          pendingTTS.set(cacheFile, prepare().finally(() => pendingTTS.delete(cacheFile)));
        }
        await pendingTTS.get(cacheFile);
      }

      const data = await readFile(cacheFile);
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
        'Content-Length': data.length
      });
      res.end(data);
      return;
    }

    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const file = path.resolve(root, relative);
    if (!file.startsWith(root) || relative.split('/').some(p=>p.startsWith('.')) || !['index.html','src','public'].includes(relative.split('/')[0])) { res.writeHead(404); res.end('Not found'); return; }
    const info = await stat(file, {bigint:true});
    if (!info.isFile()) throw new Error('Not a file');
    const etag = '"' + info.ino.toString(16) + '-' + info.size.toString(16) + '-' + info.mtimeNs.toString(16) + '"';
    const headers = {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache','ETag':etag,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; media-src 'self' data: blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"};
    const validators = req.headers['if-none-match']?.split(',').map(tag => tag.trim().replace(/^W\//, ''));
    if(validators?.includes('*') || validators?.includes(etag)){
      res.writeHead(304, headers);
      res.end();
      return;
    }
    const data = req.method === 'HEAD' ? undefined : await readFile(file);
    res.writeHead(200, {...headers, 'Content-Length':data?.length ?? info.size.toString()});
    res.end(data);
  } catch { res.writeHead(404,{'Content-Type':'text/plain'}); res.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Everyday German: http://localhost:${port}`));
