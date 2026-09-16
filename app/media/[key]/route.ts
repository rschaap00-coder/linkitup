import { db } from '@/lib/storage';
export const runtime='nodejs';
export async function GET(_:Request,{params}:{params:Promise<{key:string}>}) {
  const {key}=await params;
  if(!/^[a-f0-9-]{36}$/.test(key))return new Response(null,{status:404});
  try {
    const rows=await db()`SELECT url FROM avatars WHERE id=${key}`;
    if(!rows[0])return new Response(null,{status:404});
    return new Response(null,{status:302,headers:{Location:rows[0].url,'Cache-Control':'public, max-age=3600'}});
  } catch {return new Response('Afbeelding niet beschikbaar',{status:503});}
}
