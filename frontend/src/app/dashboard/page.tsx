import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { profileAPI, userAPI, viewAPI } from 'haze.bio/api';
import DashboardContent from 'haze.bio/components/content/DashboardContent';
import ProtectedRoute from 'haze.bio/components/auth/ProtectedRoute';

async function getData() {
  try {
    const cookieStore = await cookies();
    const viewsData = await viewAPI.getViewsData(cookieStore.toString());
    return { viewsData };
  } catch (error) {
    redirect('/login');
  }
}

export default async function DashboardPage() {
  const { viewsData } = await getData();

  return (
    <ProtectedRoute>
      <DashboardContent view={viewsData} />
    </ProtectedRoute>
  );
}