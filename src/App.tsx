import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/query-client.config';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/ui/Toaster';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      <Toaster />
    </QueryClientProvider>
  );
}


