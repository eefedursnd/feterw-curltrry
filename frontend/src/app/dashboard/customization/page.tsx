import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { userAPI } from 'haze.bio/api';
import CustomizationContent from 'haze.bio/components/content/CustomizationContent';


export default async function CustomizationPage() {
  return <CustomizationContent />;
}