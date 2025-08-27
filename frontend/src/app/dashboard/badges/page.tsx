import BadgesContent from 'haze.bio/components/content/BadgesContent';
import ProtectedRoute from 'haze.bio/components/auth/ProtectedRoute';

export default async function BadgesPage() {
  return (
    <ProtectedRoute>
      <BadgesContent />
    </ProtectedRoute>
  );
}