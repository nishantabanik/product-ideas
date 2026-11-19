// Child process boundary: limited input, no remote requests, no persisted document.
import {execFileSync} from 'node:child_process';
const chunks=[];let size=0;
for await(const chunk of process.stdin){size+=chunk.length;if(size>10*1024*1024)process.exit(2);chunks.push(chunk);}
const bytes=Buffer.concat(chunks),ext=process.argv[2];
try{
 let text='',pages=null;
 if(ext==='pdf'){
  if(!bytes.subarray(0,1024).includes(Buffer.from('%PDF-')))throw Error('format');
  const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task=getDocument({data:new Uint8Array(bytes),verbosity:0,isEvalSupported:false,useSystemFonts:true,disableFontFace:true});
  const doc=await task.promise;pages=doc.numPages;if(pages>20)throw Error('pages');
  try{for(let n=1;n<=pages;n++){const page=await doc.getPage(n),content=await page.getTextContent();text+=content.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('')+'\n';}}finally{await task.destroy();}
 }else if(['doc','docx'].includes(ext)){
  const valid=ext==='doc'?bytes.subarray(0,8).equals(Buffer.from('d0cf11e0a1b11ae1','hex')):bytes[0]===80&&bytes[1]===75;
  if(!valid)throw Error('format');
  text=execFileSync('/usr/bin/textutil',['-convert','txt','-stdout','-format',ext,'-stdin'],{input:bytes,encoding:'utf8',timeout:12000,maxBuffer:1024*1024});
 }else throw Error('format');
 text=text.replace(/\0/g,'').trim();if(text.length<30)throw Error('no text');if(text.length>100000)throw Error('long');
 process.stdout.write(JSON.stringify({text,pages,extension:ext}));
}catch{process.stdout.write(JSON.stringify({error:'Unable to extract this document. Use an unencrypted, text-based PDF (up to 20 pages), DOC or DOCX, or paste the text.'}));process.exitCode=1;}
