import { currentUser } from '@/auth';
import { put,del } from '@vercel/blob';
import { db } from '@/lib/storage';
import { sameOrigin,boundedBody } from '@/lib/request';
export const runtime = 'nodejs';
export async function POST(request:Request) {
  const user=await currentUser();if(!user)return Response.json({error:'Log eerst in.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Ongeldige aanvraag.'},{status:403});
  let blobUrl:string|undefined;
  try {
    const bytes=await boundedBody(request,2200000);
    const form=await new Response(bytes,{headers:{'content-type':request.headers.get('content-type')||''}}).formData();
    const file=form.get('file');
    if(!(file instanceof File)||file.size===0||file.size>2000000||!['image/png','image/jpeg','image/webp'].includes(file.type))
      return Response.json({error:'Kies een JPG, PNG of WebP van maximaal 2 MB.'},{status:400});
    const b=new Uint8Array(await file.arrayBuffer());
    const valid=file.type==='image/png'?[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v):file.type==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
    if(!valid)return Response.json({error:'Ongeldig afbeeldingsbestand.'},{status:400});
    const id=crypto.randomUUID();
    const extension=file.type==='image/png'?'png':file.type==='image/jpeg'?'jpg':'webp';
    const blob=await put(`avatars/${id}.${extension}`,file,{access:'public',contentType:file.type,addRandomSuffix:false});
    blobUrl=blob.url;
    await db()`INSERT INTO avatars(id,owner,url) VALUES (${id},${user.userId},${blob.url})`;
    return Response.json({url:'/media/'+id});
  } catch(e) {
    if(blobUrl)await del(blobUrl).catch(()=>console.error('Could not clean up failed upload'));
    if(e instanceof Error&&e.message==='BODY_TOO_LARGE')return Response.json({error:'Kies een afbeelding van maximaal 2 MB.'},{status:413});
    console.error('Avatar upload failed',e);return Response.json({error:'Upload mislukt. Probeer het opnieuw.'},{status:500});
  }
}
