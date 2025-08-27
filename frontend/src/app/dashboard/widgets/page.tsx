import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { userAPI } from 'haze.bio/api';
import WidgetsContent from 'haze.bio/components/content/WidgetsContent';
import ProtectedRoute from 'haze.bio/components/auth/ProtectedRoute';

export default async function WidgetsPage() {
  return (
    <ProtectedRoute>
      <WidgetsContent />
    </ProtectedRoute>
  );
}