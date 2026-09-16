import { currentUser } from '@/auth';
import { getProfile } from '@/lib/storage';
import Dashboard from './dashboard';
import { redirect } from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Home() {
  const user=await currentUser();
  if(!user)redirect('/inloggen');
  let record;let error='';
  try{record=await getProfile(user.userId);}catch(e){console.error('Profile load failed',e);error='Je pagina kon niet worden geladen. Vernieuw de pagina voordat je wijzigingen maakt.';}
  return <Dashboard signedIn email={user.email} initial={record?.data||null} initialSlug={record?.slug||''} loadError={error}/>;
}
