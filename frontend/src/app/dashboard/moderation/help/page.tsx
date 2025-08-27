import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { userAPI } from 'haze.bio/api';
import { HasStaffPermission } from 'haze.bio/utils/staff';
import ModerationHelpContent from 'haze.bio/components/content/ModerationHelpContent';

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

export default async function ModerationHelpPage() {
  await getData();
  return <ModerationHelpContent />;
}