
import { redirect } from 'next/navigation';

export default function HomePage() {
  // This page will typically be handled by middleware.
  // If a user lands here directly and is authenticated, they should go to dashboard.
  // If not authenticated, middleware should have already sent them to /login.
  // For simplicity in this prototype step, we assume if they reach here,
  // they are likely authenticated or the middleware will handle it.
  redirect('/dashboard');
}
