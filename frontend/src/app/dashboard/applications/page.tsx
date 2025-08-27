import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { applyAPI } from 'haze.bio/api';
import ApplicationsContent from "haze.bio/components/content/ApplicationsContent";
import ProtectedRoute from 'haze.bio/components/auth/ProtectedRoute';

async function getData() {
  try {
    const cookieStore = cookies();
    
    const applications = await applyAPI.getUserApplications((await cookieStore).toString());
    const positions = await applyAPI.getActivePositions((await cookieStore).toString());
    
    return {
      applications: applications || [],
      openPositions: positions?.length || 0,
      positions: positions || []
    };
  } catch (error) {
    console.error('Error fetching application data:', error);
    return {
      applications: [],
      openPositions: 0
    };
  }
}

export default async function ApplicationsPage() {
  const { applications, openPositions, positions } = await getData();
  return (
    <ProtectedRoute>
      <ApplicationsContent initialApplications={applications} initialOpenPositions={openPositions} initialPositions={positions || []} />
    </ProtectedRoute>
  );
}