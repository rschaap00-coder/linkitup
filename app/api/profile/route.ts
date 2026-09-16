import { currentUser } from '@/auth';
import { ownsAvatar,saveProfile } from '@/lib/storage';
import { profileSchema } from '@/lib/profile';
import { sameOrigin,boundedBody } from '@/lib/request';
export const runtime = 'nodejs';
export async function POST(request:Request) {
  const user = await currentUser();
  if (!user) return Response.json({error:'Log in om je pagina op te slaan.'},{status:401});
  if (!sameOrigin(request)) return Response.json({error:'Ongeldige aanvraag.'},{status:403});
  try {
    const raw = new TextDecoder().decode(await boundedBody(request,150000));
    let body;try { body=JSON.parse(raw); } catch { return Response.json({error:'Ongeldige gegevens.'},{status:400}); }
    const parsed=profileSchema.safeParse(body);
    if (!parsed.success) return Response.json({error:parsed.error.issues[0].message},{status:400});
    if (parsed.data.avatar && !await ownsAvatar(parsed.data.avatar.slice(7),user.userId))
      return Response.json({error:'Upload je eigen profielfoto.'},{status:400});
    return Response.json({slug:await saveProfile(user.userId,parsed.data)});
  } catch(e) {
    if(e instanceof Error && e.message==='BODY_TOO_LARGE') return Response.json({error:'Te veel gegevens.'},{status:413});
    console.error('Profile save failed',e);
    return Response.json({error:'Opslaan is niet gelukt. Je invoer blijft staan; probeer het opnieuw.'},{status:500});
  }
}
