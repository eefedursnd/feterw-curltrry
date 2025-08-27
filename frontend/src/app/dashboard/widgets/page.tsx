import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { userAPI } from 'haze.bio/api';
import WidgetsContent from 'haze.bio/components/content/WidgetsContent';

export default async function WidgetsPage() {
  return <WidgetsContent />;
}