// Run explicitly after setting ELEVENLABS_API_KEY and voice IDs in .env.
// This consumes the account's ElevenLabs credits. Existing matching recordings are reused.
import {exercises} from '../src/content.js';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const key=process.env.ELEVENLABS_API_KEY;
const voices=(process.env.ELEVENLABS_VOICE_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);
if(!key||!voices.length)throw Error('Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_IDS in .env first.');
const dir=new URL('../public/audio/',import.meta.url);await mkdir(dir,{recursive:true});
let manifest={};try{manifest=JSON.parse(await readFile(new URL('manifest.json',dir),'utf8'));}catch{}
const limit=Number(process.env.AUDIO_LIMIT||1);if(!Number.isInteger(limit)||limit<1||limit>75)throw Error('AUDIO_LIMIT must be between 1 and 75.');let generated=0;
const sampleId=process.env.AUDIO_SAMPLE_ID||'';
const catalogue=exercises.filter(q=>q.skill==='hoeren'&&(!sampleId||q.id===sampleId));if(!catalogue.length)throw Error('AUDIO_SAMPLE_ID is not a listening activity.');
for(const [i,q] of catalogue.entries()){
 const voice=voices[i%voices.length],model=process.env.ELEVENLABS_MODEL_ID||'eleven_v3';
 const settings=model==='eleven_v3'?{stability:0.5}:{stability:0.45,similarity_boost:0.75,style:0.2,use_speaker_boost:true,speed:0.95};
 const hash=createHash('sha256').update(JSON.stringify({text:q.transcript,voice,model,settings})).digest('hex');
 if(manifest[q.id]===hash)continue;if(generated>=limit)break;
 const response=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,{method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({text:q.transcript,model_id:model,voice_settings:settings}),signal:AbortSignal.timeout(90000)});
 if(!response.ok)throw Error(`ElevenLabs returned ${response.status}; generation stopped. No key or response body logged.`);
 await writeFile(new URL(q.id+'.mp3',dir),Buffer.from(await response.arrayBuffer()));manifest[q.id]=hash;await writeFile(new URL('manifest.json',dir),JSON.stringify(manifest));generated++;console.log(`Saved ${q.id}`);
}
console.log(`Generated ${generated} recording(s).`);
