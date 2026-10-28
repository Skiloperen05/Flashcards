import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const clone = (value) => JSON.parse(JSON.stringify(value));
const settle = () => new Promise((resolve) => setTimeout(resolve, 45));
let subject = { subject_code:'RRR11', name:'Regnskap', icon:'📘', lead:'Publisert ingress', accent:'#2563eb', is_published:true, origin:'custom', visibility:{}, memo_intro:'Forfatterens forklaring', blocks:{topics:[],plan:[],radar:[]}, files:{memo:[{id:'note',title:'Forelesning',body:'Notat'}],answer:[{id:'answer',title:'Eksamen',body:'Oppgave'}],task:[]} };
const writes = [];
const admin = new JSDOM(read('user/admin.html'), {url:'https://example.test/user/admin.html?subject=rrr11',runScripts:'outside-only',pretendToBeVisual:true});
const w=admin.window, doc=w.document;
w.HTMLElement.prototype.scrollIntoView=function(){};
w.SubjectsStudio={listSubjects:async()=>[clone(subject)],getSubject:async()=>clone(subject),upsertSubject:async(patch)=>{writes.push(clone(patch));Object.assign(subject,clone(patch));}};
w.AuthGuard={getSession:()=>({user:{id:'admin'}}),getClient:()=>({from:()=>({update:()=>({eq:async()=>({})})})})};
for(const script of doc.querySelectorAll('script:not([src])'))w.eval(script.textContent);
await settle();
assert.equal(doc.getElementById('visualStudio').hidden,false,'Open directly in the visual editor');
const frame=doc.getElementById('canvasFrame');
assert.match(frame.src,/studio=1/);
const message=(data,origin='https://example.test')=>w.dispatchEvent(new w.MessageEvent('message',{origin,source:frame.contentWindow,data}));
const modules=[{key:'notes',label:'Forelesningsnotater'},{key:'intro',label:'Egne forklaringer'},{key:'answers',label:'Eksamensdokumenter'}];
message({type:'HF_STUDIO_MODULES',modules});
const input=doc.querySelector('[data-canvas-field="lead"]');input.value='Ny ingress i demoen';input.dispatchEvent(new w.Event('input'));
message({type:'HF_STUDIO_ORDER',order:['answers','intro','notes']},'https://untrusted.test');
assert.equal(writes.length,0);
message({type:'HF_STUDIO_ORDER',order:['intro','notes','answers']});
assert.equal(writes.length,0,'Typing and moving sections are preview-only until Save');
doc.getElementById('btnSaveAll').click();await settle();
assert.equal(subject.lead,'Ny ingress i demoen');
assert.deepEqual(subject.visibility.section_order,['intro','notes','answers']);
assert.equal(writes.length,1);
// Discard affects only the temporary page, retaining published content.
const edited=doc.querySelector('[data-canvas-field="lead"]');edited.value='Forkastes';edited.dispatchEvent(new w.Event('input'));
doc.getElementById('canvasDiscard').click();
assert.equal(doc.querySelector('[data-canvas-field="lead"]').value,'Ny ingress i demoen');
assert.equal(writes.length,1);
admin.window.close();

// The real student renderer consumes the persisted layout, without editor handles.
const student=new JSDOM(read('subject/index.html'),{url:'https://example.test/subject/?id=rrr11',runScripts:'outside-only',pretendToBeVisual:true});
const sw=student.window;
sw.HTMLElement.prototype.scrollIntoView=function(){};
sw.AuthGuard={getRootPath:()=> '/',requireAuth:async()=>({user:{id:'student'}})};
sw.HaugnesEntitlements={isAdmin:()=>false,effectiveAdmin:()=>false};
sw.SubjectsStudio={getSubject:async()=>clone(subject),signedUrl:async()=>null};
for(const file of ['learning-content','subject-page-data','subject-page-studio-bridge','subject-studio-layout','subject-page-renderer'])sw.eval(read('shared/'+file+'.js'));
for(const script of sw.document.querySelectorAll('script:not([src])'))sw.eval(script.textContent);
await settle();
const host=sw.document.querySelector('.hf-subject-layout>div');
const order=Array.from(host.children,(node)=>node.dataset.studioLayoutKey).filter(Boolean);
assert.ok(order.indexOf('intro')<order.indexOf('notes'),JSON.stringify({order,visibility:sw.HaugnesSubjectPages.get('rrr11')?.visibility,keys:Array.from(sw.document.querySelectorAll('[data-studio-layout-key]'),n=>n.dataset.studioLayoutKey)}));
assert.ok(order.indexOf('notes')<order.indexOf('answers'));
assert.equal(sw.document.querySelectorAll('.studio-layout-handle').length,0);
assert.equal(sw.document.getElementById('subjectLead').textContent,'Ny ingress i demoen');
// A demo preview updates the same renderer, with zero persistence, and refresh restores publication.
await sw.SubjectPageStudioBridge.preview({...clone(subject),lead:'Kun i forhåndsvisning',visibility:{...subject.visibility,section_order:['answers','notes','intro']}});await settle();
assert.equal(sw.document.getElementById('subjectLead').textContent,'Kun i forhåndsvisning');
assert.equal(subject.lead,'Ny ingress i demoen');
await sw.HaugnesSubjectPages.refresh('rrr11');await settle();
assert.equal(sw.document.getElementById('subjectLead').textContent,'Ny ingress i demoen');
assert.equal(writes.length,1);
student.window.close();

// Actual HTML drag events produce a complete new section order, without writing to the server.
const shell=new JSDOM('<iframe src="https://example.test/subject/?id=rrr11&studio=1"></iframe>',{url:'https://example.test/user/admin.html',runScripts:'outside-only',pretendToBeVisual:true});
const cw=shell.window.document.querySelector('iframe').contentWindow;
cw.document.open();cw.document.write('<head></head><body><nav id="subjectTabBar"></nav><main><div class="hf-subject-layout"><div><section id="memo">Intro</section><section id="notater">Notater</section><section id="besvarelser">Eksamen</section></div></div></main></body>');cw.document.close();
cw.HaugnesEntitlements={isAdmin:()=>true};cw.AuthGuard={getRootPath:()=>'/'};
const sent=[];shell.window.postMessage=(value)=>sent.push(value);
cw.eval(read('shared/subject-studio-layout.js'));cw.HaugnesSubjectLayout.apply({code:'RRR11',visibility:{},notes:[{}],answers:[{}]});
const drag=(type,target)=>{const event=new cw.Event(type,{bubbles:true,cancelable:true});event.dataTransfer={setData(){},effectAllowed:'',dropEffect:''};target.dispatchEvent(event);};
drag('dragstart',cw.document.querySelector('#memo .studio-layout-handle'));
drag('dragover',cw.document.getElementById('besvarelser'));
drag('drop',cw.document.getElementById('besvarelser'));
assert.deepEqual(Array.from(sent.find((item)=>item.type==='HF_STUDIO_ORDER').order),['notes','answers','intro']);
assert.equal(writes.length,1);
shell.window.close();
console.log('Visual editor passed: click properties, trusted-frame messages, preview without writes, save/discard, fresh student layout and actual drag events.');

// Native course pages use the same saved section order without moving closing copy ahead of the course.
for (const route of ['bed1','met3']) {
  const dom=new JSDOM(read(route+'/index.html'),{url:'https://example.test/'+route+'/',runScripts:'outside-only',pretendToBeVisual:true});
  const nw=dom.window;
  nw.HaugnesEntitlements={isAdmin:()=>false};nw.AuthGuard={getRootPath:()=>'/'};
  const full={...clone(subject),subject_code:route.toUpperCase(),visibility:{section_order:['supplements','reading','tools']}};
  nw.SubjectsStudio={getSubject:async()=>clone(full),signedUrl:async()=>null};
  const authored=nw.document.querySelector('.semester-layout,.hf-card-grid')?.textContent;
  nw.eval(read('shared/subject-studio-layout.js'));nw.eval(read('shared/subject-studio-live.js'));
  await nw.HaugnesStudioLive.render(full);await settle();
  assert.equal(nw.document.querySelector('.semester-layout,.hf-card-grid')?.textContent,authored);
  const closing=nw.document.querySelector('.semester-closing');
  if(closing) assert.ok(nw.document.getElementById('studioCourseContent').compareDocumentPosition(closing)&nw.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.equal(nw.document.querySelectorAll('.studio-layout-handle').length,0);
  dom.window.close();
}
