import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { userAPI } from 'haze.bio/api';
import ModerationReportsContent from 'haze.bio/components/content/ModerationReportsContent';
import { HasStaffPermission } from 'haze.bio/utils/staff';

async function getData() {
  try {
    const cookieStore = cookies();
    const user = await userAPI.getCurrentUser((await cookieStore).toString());

    if (!user || !HasStaffPermission(user)) {
      redirect('/dashboard');
    }

  } catch (error) {
    console.error('Error loading moderation data:', error);
    redirect('/dashboard');
  }
}

export default async function ModerationReportsPage() {
  await getData();
  return <ModerationReportsContent />;
}