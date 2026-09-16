import {test} from 'node:test';
import assert from 'node:assert/strict';
import {credentialsSchema, registrationSchema, localOwner} from '../lib/identity.ts';
import {hashPassword, verifyPassword} from '../lib/password.ts';
import {boundedBody,sameOrigin} from '../lib/request.ts';
import {profileSchema,emptyProfile} from '../lib/profile.ts';

test('Local identity rejects legacy and attacker-controlled owners',()=>{
 assert.equal(localOwner('google:123'),null);
 assert.equal(localOwner('someone@example.org'),null);
 assert.equal(localOwner('local:b9fd8885-8d39-4a1d-89bd-59b176d6086e'),'local:b9fd8885-8d39-4a1d-89bd-59b176d6086e');
});
test('Passwords are salted and only the correct password verifies',async()=>{
 const password='Een lange geheime wachtzin!';
 const a=await hashPassword(password),b=await hashPassword(password);
 assert.notEqual(a,b); assert.equal(a.includes(password),false);
 assert.equal(await verifyPassword(password,a),true);
 assert.equal(await verifyPassword('Verkeerd wachtwoord',a),false);
 assert.equal(await verifyPassword(password),false);
 assert.equal(await verifyPassword(password,'malformed'),false);
});
test('Credentials normalize email and reject weak or mismatched passwords',()=>{
 const base={email:' Test@Example.org ',password:'Een lange wachtzin',name:'Test',confirmation:'Een lange wachtzin'};
 assert.equal(credentialsSchema.parse(base).email,'test@example.org');
 assert.equal(registrationSchema.safeParse(base).success,true);
 assert.equal(registrationSchema.safeParse({...base,confirmation:'anders'}).success,false);
 for(const password of ['kort','x'.repeat(129)]) assert.equal(credentialsSchema.safeParse({...base,password}).success,false);
 assert.equal(credentialsSchema.safeParse({...base,email:'invalid'}).success,false);
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
