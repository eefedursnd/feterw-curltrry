import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { domainAPI, userAPI } from 'haze.bio/api';
import DomainsContent from 'haze.bio/components/content/DomainsContent';
import ProtectedRoute from 'haze.bio/components/auth/ProtectedRoute';

async function getData() {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    const currentUser = await userAPI.getCurrentUser(cookieString);

    // if (!currentUser.experimental_features ||
    //   !currentUser.experimental_features.includes('custom_domains')) {
    //   return { redirect: true };
    // }

    const [availableDomains, userDomains] = await Promise.all([
      domainAPI.getAvailableDomains(cookieString),
      domainAPI.getUserDomains(cookieString)
    ]);

    return {
      redirect: false,
      availableDomains,
      userDomains,
      user: currentUser
    };
  } catch (error) {
    console.error("Error loading domain data:", error);
    redirect('/login');
  }
}

export default async function DomainsPage() {
  const data = await getData();

  if (data.redirect) {
    redirect('/dashboard');
  }

  return (
    <ProtectedRoute>
      <DomainsContent initialAvailableDomains={data.availableDomains || []} initialUserDomains={data.userDomains || []} />
    </ProtectedRoute>
  );
}