import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile, stat, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {exercises} from './src/content.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {'.mp3':'audio/mpeg','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.json':'application/json'};
let extracting=0;

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
      const available=[];
      for(const q of exercises.filter(q=>q.skill==='hoeren')){
        try{await stat(path.join(root,'public/audio',q.id+'.mp3'));available.push(q.id);}catch{}
      }
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

      const edgeVoice = voiceMap[voiceKey] || voiceMap.katja;
      // Rate/pitch are part of the cache key only when set, so older cached files stay valid.
      let keyPrefix = rateFlag ? edgeVoice + '|rate' + rateMatch : edgeVoice;
      if(pitchFlag){ keyPrefix += '|pitch' + pitchMatch; }
      const hash = createHash('sha256').update(keyPrefix + ':' + text).digest('hex').slice(0, 20);
      const cacheDir = path.join(root, 'public/audio/cache');
      await mkdir(cacheDir, {recursive: true});
      const cacheFile = path.join(cacheDir, `${hash}.mp3`);

      let exists = false;
      try { const s = await stat(cacheFile); exists = s.size > 100; } catch {}
      if(!exists){
        if(instant){ res.writeHead(404, {'Content-Type':'text/plain'}); res.end('Not generated yet'); return; }
        const ttsArgs = ['-m', 'edge_tts', '--voice', edgeVoice, '--text', text, '--write-media', cacheFile];
        if(rateFlag){ ttsArgs.push('--rate=' + rateFlag); }
        if(pitchFlag){ ttsArgs.push('--pitch=' + pitchFlag); }
        await new Promise((resolve, reject) => {
          const child = spawn('python3', ttsArgs);
          const timer = setTimeout(() => { child.kill(); reject(new Error('TTS timeout')); }, 20000);
          child.on('close', code => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error('TTS exit ' + code)); });
          child.on('error', err => { clearTimeout(timer); reject(err); });
        });
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
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
    const data = await readFile(file);
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; media-src 'self' data: blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404,{'Content-Type':'text/plain'}); res.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Everyday German: http://localhost:${port}`));
