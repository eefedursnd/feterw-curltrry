import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ApplicationForm from 'haze.bio/components/application/ApplicationForm';
import { applyAPI } from 'haze.bio/api';

export default async function ApplicationPage({ params }: { params: Promise<{ positionId: string }> }) {
  const { positionId } = await params;

  const position = await applyAPI.getPositionById(positionId);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          <p className="text-white/70">Loading application form...</p>
        </div>
      </div>
    }>
      <ApplicationForm positionId={positionId} initialPosition={position} />
    </Suspense>
  );
}