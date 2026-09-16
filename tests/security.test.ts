import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifiedGoogleOwner} from '../lib/identity.ts';
import {boundedBody,sameOrigin} from '../lib/request.ts';
import {profileSchema,emptyProfile} from '../lib/profile.ts';

test('Google accounts use a verified immutable subject, never an email address',()=>{
 assert.equal(verifiedGoogleOwner({sub:'1234567',email_verified:true,email:'a@example.org'}),'google:1234567');
 assert.equal(verifiedGoogleOwner({sub:'1234567',email_verified:true,email:'changed@example.org'}),'google:1234567');
 assert.notEqual(verifiedGoogleOwner({sub:'7654321',email_verified:true}), 'google:1234567');
 for(const p of [null,{}, {sub:'123',email_verified:false},{sub:'123',email_verified:'true'},{email:'a@example.org',email_verified:true}])assert.equal(verifiedGoogleOwner(p),null);
});

test('Writes reject missing and foreign origins',()=>{
 const previous=process.env.AUTH_URL;process.env.AUTH_URL='https://linkplek.example';
 try{
  const req=(origin?:string)=>new Request('https://internal.example/api/profile',{method:'POST',headers:origin?{origin}:{}});
  assert.equal(sameOrigin(req('https://linkplek.example')),true);
  assert.equal(sameOrigin(req('https://evil.example')),false);
  assert.equal(sameOrigin(req()),false);
 }finally{if(previous===undefined)delete process.env.AUTH_URL;else process.env.AUTH_URL=previous;}
});

test('Chunked oversized bodies are rejected even without Content-Length',async()=>{
 const request=new Request('https://example.org',{method:'POST',body:'123456'});
 await assert.rejects(()=>boundedBody(request,5),/BODY_TOO_LARGE/);
 assert.equal(new TextDecoder().decode(await boundedBody(new Request('https://example.org',{method:'POST',body:'abc'}),5)),'abc');
});

test('Only valid web links are accepted and client-provided ownership is discarded',()=>{
 const base={...emptyProfile,title:'Test',links:[{id:'b9fd8885-8d39-4a1d-89bd-59b176d6086e',title:'Website',url:'https://example.org',visible:true}]};
 assert.equal(profileSchema.safeParse(base).success,true);
 for(const url of ['javascript:alert(1)','data:text/html,test','ftp://example.org','example.org'])assert.equal(profileSchema.safeParse({...base,links:[{...base.links[0],url}]}).success,false);
 const parsed=profileSchema.parse({...base,owner:'someone-else',slug:'stolen'});
 assert.equal('owner' in parsed,false);assert.equal('slug' in parsed,false);
});
