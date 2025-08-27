import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { dataAPI, sessionAPI, userAPI } from 'haze.bio/api';
import SettingsContent from 'haze.bio/components/content/SettingsContent';

async function getData() {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();
        const sessions = await sessionAPI.getAllSessions(cookieString);
        
        let currentExport = null;
        try {
            currentExport = await dataAPI.getLatestExport(cookieString);
        } catch (error) {
            console.error("Error fetching latest export:", error);
        }
        
        return {
            sessions,
            currentExport
        };
    } catch (error) {
        console.error("Error in getData:", error);
        redirect('/login');
    }
}

export default async function SettingsPage() {
    const { sessions, currentExport } = await getData();

    return <SettingsContent sessions={sessions} currentExport={currentExport} />;
}