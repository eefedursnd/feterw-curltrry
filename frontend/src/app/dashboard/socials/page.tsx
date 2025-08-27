import SocialsContent from 'haze.bio/components/content/SocialsContent';
import ProtectedRoute from 'haze.bio/components/auth/ProtectedRoute';

export default async function SocialsPage() {
  return (
    <ProtectedRoute>
      <SocialsContent />
    </ProtectedRoute>
  );
}