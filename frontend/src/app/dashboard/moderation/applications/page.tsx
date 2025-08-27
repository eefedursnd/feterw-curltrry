import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { userAPI, applyAPI } from 'haze.bio/api';
import { HasStaffPermission } from 'haze.bio/utils/staff';
import ModerationApplyContent from 'haze.bio/components/content/ModerationApplyContent';

async function getData() {
  try {
    const cookieStore = cookies();
    const user = await userAPI.getCurrentUser((await cookieStore).toString());

    if (!user || !HasStaffPermission(user)) {
      redirect('/dashboard');
    }

    const applications = await applyAPI.getApplicationsByStatus("all", (await cookieStore).toString());
    
    return {
      applications
    };

  } catch (error) {
    console.error('Error loading moderation data:', error);
    redirect('/dashboard');
  }
}

export default async function ApplicationsPage() {
  const { applications } = await getData();
  return <ModerationApplyContent initialApplications={applications} />;
}