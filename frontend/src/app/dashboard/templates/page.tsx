import { templateAPI, userAPI } from 'haze.bio/api';
import TemplatesContent from 'haze.bio/components/content/TemplatesContent';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getData() {
  try {
    const cookieStore = await cookies();

    const templates = await templateAPI.getUserTemplates(cookieStore.toString());
    const shareableTemplates = await templateAPI.getShareableTemplates(cookieStore.toString());

    return {
      templates,
      shareableTemplates
    };
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    redirect('/login');
  }
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ discoverId: string }> }) {
  const discoverId = (await searchParams).discoverId
  if (discoverId) {
    return {
          title: `Discover Template ${discoverId} | cutz.lol`,
    description: `Explore the template with ID ${discoverId} on cutz.lol.`,
      openGraph: {
        title: `Discover Template ${discoverId}`,
                  description: `Explore the template with ID ${discoverId} on cutz.lol.`,
          url: `https://cutz.lol/dashboard/templates?discoverId=${discoverId}`,
          siteName: 'cutz.lol',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Discover Template ${discoverId}`,
                  description: `Explore the template with ID ${discoverId} on cutz.lol.`,
      },
    };
  }
  return {};
}

export default async function TemplatesPage() {
  const { templates, shareableTemplates } = await getData();
  return <TemplatesContent
    initialTemplates={templates}
    initialShareableTemplates={shareableTemplates}
  />;
}