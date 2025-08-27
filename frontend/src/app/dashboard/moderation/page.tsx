import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { punishAPI, userAPI } from 'haze.bio/api';
import ModerationDashboardContent from 'haze.bio/components/content/ModerationDashboardContent';
import { HasStaffPermission } from 'haze.bio/utils/staff';
import ProtectedRoute from 'haze.bio/components/auth/ProtectedRoute';

async function getData() {
    try {
        const cookieStore = cookies();
        const user = await userAPI.getCurrentUser(cookieStore.toString());

        if (!user || !HasStaffPermission(user)) {
            redirect('/dashboard');
        }

    } catch (error) {
        console.error('Error loading moderation data:', error);
        redirect('/dashboard');
    }
}

export default async function ModerationDashboardPage() {
    await getData();
    
    return (
        <ProtectedRoute>
            <ModerationDashboardContent />
        </ProtectedRoute>
    );
}