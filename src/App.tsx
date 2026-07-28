import { AuthProvider, useAuth } from '@/lib/auth';
import { useRoute } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { AuthPage } from '@/pages/AuthPage';
import { HomePage } from '@/pages/HomePage';
import { ProblemsPage } from '@/pages/ProblemsPage';
import { ProblemPage } from '@/pages/ProblemPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { LeaguePage } from '@/pages/LeaguePage';
import { SubmissionsPage } from '@/pages/SubmissionsPage';
import { AdminPage } from '@/pages/AdminPage';
import { Pokeball } from '@/components/Badges';

function Router() {
  const { session, loading } = useAuth();
  const route = useRoute();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Pokeball size={64} spinning />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  let page: React.ReactNode;
  switch (route.name) {
    case 'home':
      page = <HomePage />;
      break;
    case 'problems':
      page = <ProblemsPage />;
      break;
    case 'problem':
      page = <ProblemPage slug={route.slug} />;
      break;
    case 'profile':
      page = <ProfilePage userId={route.userId} />;
      break;
    case 'league':
      page = <LeaguePage />;
      break;
    case 'submissions':
      page = <SubmissionsPage />;
      break;
    case 'admin':
      page = <AdminPage />;
      break;
    default:
      page = <HomePage />;
  }

  return <AppShell route={route}>{page}</AppShell>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
