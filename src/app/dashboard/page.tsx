import { Header } from '@/components/header';
import { DashboardClient } from '@/components/dashboard-client';

export default function Dashboard() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
                <DashboardClient />
            </main>
        </div>
    );
}
