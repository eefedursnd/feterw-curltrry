import { Toaster } from "react-hot-toast";
import "haze.bio/styles/globals.css";
import { statusAPI, userAPI } from "haze.bio/api";
import { Status } from "haze.bio/types";
import Maintenance from "haze.bio/components/Maintenance";
import { cookies, headers } from "next/headers";
import { UserProvider } from "haze.bio/context/UserContext";
import GoogleAnalytics from "haze.bio/components/GoogleAnalytics";

async function getMaintenanceStatus(): Promise<Status | null> {
  try {
    const status = await statusAPI.getActiveStatus();
    if (Object.keys(status).length === 0) {
      return null;
    }

    return status;
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return null;
  }
}

async function getUser() {
  try {
    const cookieStore = await cookies();
    const user = await userAPI.getCurrentUser(cookieStore.toString());
    return user;
  } catch (error) {
    return null;
  }
}

async function hasCookie(name: string, value?: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(name);
    if (cookie) {
      if (value) {
        return cookie.value === value;
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking for cookie:', error);
    return false;
  }
}

export const metadata = {
  title: {
    default: 'cutz.lol',
    template: '%s | cutz.lol'
  },
  description: 'cutz.lol - All your links, in one place',
  openGraph: {
    title: 'cutz.lol',
    description: 'cutz.lol - All your links, in one place',
    url: 'https://cutz.lol',
    siteName: 'cutz.lol',
    images: [
      {
        url: 'https://cutz.lol/logo/CutzBanner.png',
        width: 1200,
        height: 630,
        alt: 'cutz.lol - All your links, in one place',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'cutz.lol',
    description: 'cutz.lol - All your links, in one place',
    images: ['https://cutz.lol/logo/CutzBanner.png'],
  },
  other: {
    'theme-color': '#a855f7', // Discord için mor renk
    'msapplication-TileColor': '#a855f7',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug?: string[] }>;
}) {
  const maintenanceStatus = await getMaintenanceStatus();
  const headerList = headers();
  const pathname = (await headerList).get("x-current-path") || "/";
  const isAuthed = await hasCookie('ret2862_is_the_king_and_is_bypassed_for_maintenance_cool', 'true');
  const user = await getUser();

  return (
    <html lang="en" className="h-full">
      <GoogleAnalytics />
      <body className="antialiased min-h-full">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              position: 'unset',
              background: '#18181b',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              width: 'auto',
              maxWidth: '90vw',
              margin: '0 auto',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            success: {
              duration: 3000,
              style: {
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
              },
              iconTheme: {
                primary: '#22c55e',
                secondary: '#18181b',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#18181b',
              },
            },
          }}
        />

        <div className="flex flex-col min-h-full">
          <UserProvider initialUser={user || undefined}>
            {maintenanceStatus !== null && !isAuthed ? (
              <Maintenance status={maintenanceStatus} />
            ) : (
              children
            )}
          </UserProvider>
        </div>
      </body>
    </html>
  );
}