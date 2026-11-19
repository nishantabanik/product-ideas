import test from 'node:test';
import assert from 'node:assert/strict';
import {loadExtras,cvPreview,themes} from '../src/features.js';
test('preferences tolerate corrupt storage, reject unknown themes and limit CV data',()=>{
 assert.equal(loadExtras({getItem:()=>'{'}).theme,'sage');
 const s=loadExtras({getItem:()=>JSON.stringify({theme:'bad',rate:99,cv:{name:'A'.repeat(12000),secret:'hidden'},goals:['work-1',12],scores:[{mode:'x',score:1,total:10}]})});
 assert.equal(s.rate,1);assert.equal(s.cv.name.length,10000);assert.equal(s.cv.secret,undefined);assert.deepEqual(s.goals,['work-1']);assert.equal(themes.length,6);
});
test('CV preview escapes markup and omits empty sections',()=>{
 const html=cvPreview({cv:{name:'<img src=x onerror=alert(1)>',skills:'Deutsch\nKochen'}},'de');
 assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(html.includes('Kenntnisse'));assert.ok(!html.includes('Berufserfahrung'));
});
