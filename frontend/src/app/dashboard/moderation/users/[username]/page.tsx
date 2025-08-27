import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { profileAPI, punishAPI, userAPI } from 'haze.bio/api';
import { HasStaffPermission } from 'haze.bio/utils/staff';
import UserDetailsContent from 'haze.bio/components/content/UserDetailsContent';

async function getData(username: string) {
  try {
    const cookieStore = cookies();
    const user = await userAPI.getCurrentUser(cookieStore.toString());

    if (!user || !HasStaffPermission(user)) {
      redirect('/dashboard');
    }

    try {
      const punishData = await punishAPI.searchUsersForModeration(username, cookieStore.toString());
      return { punishData };
    } catch (error) {
      console.error(`Error loading details for user ${username}:`, error);
      return { userData: null };
    }
  } catch (error) {
    console.error('Error loading auth data:', error);
    redirect('/dashboard');
  }
}

export default async function UserDetailsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { punishData } = await getData(username);

  if (!punishData) {
    notFound();
  }

  return <UserDetailsContent username={punishData[0]?.username} initialData={punishData[0]} />;
}