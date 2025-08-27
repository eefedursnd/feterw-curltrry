import { cookies } from 'next/headers';
import { analyticsAPI } from 'haze.bio/api';
import AnalyticsContent from 'haze.bio/components/content/AnalyticsContent';

async function getData() {
  try {
    const cookieStore = await cookies();
    const analyticsData = await analyticsAPI.getAnalytics(7, cookieStore.toString());
    return { analyticsData };
  } catch (error) {
    console.error("Error loading analytics data:", error);
    return { analyticsData: null };
  }
}

export default async function AnalyticsPage() {
  const { analyticsData } = await getData();
  return <AnalyticsContent initialData={analyticsData} />;
}