import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { userAPI } from 'haze.bio/api';
import CustomizationContent from 'haze.bio/components/content/CustomizationContent';
import ProtectedRoute from 'haze.bio/components/auth/ProtectedRoute';

export default async function CustomizationPage() {
  return (
    <ProtectedRoute>
      <CustomizationContent />
    </ProtectedRoute>
  );
}