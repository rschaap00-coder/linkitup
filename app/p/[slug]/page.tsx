import { publicProfile } from '@/lib/storage';
import ProfileView from '@/app/profile-view';
import { notFound } from 'next/navigation';
export const dynamic='force-dynamic';
export default async function PublicPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;if(!/^[a-f0-9-]{36}$/.test(slug))notFound();
  let profile;try{profile=await publicProfile(slug);}catch(e){console.error('Public profile load failed',e);return <main className="unavailable"><h1>Even niet beschikbaar</h1><p>Probeer deze pagina over een moment opnieuw te openen.</p></main>;}
  if(!profile)notFound();return <ProfileView profile={profile}/>;
}
