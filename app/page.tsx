import AppShell from '@/components/app-shell';
import Hero from '@/components/home/Hero';
import HowItWorks from '@/components/home/HowItWorks';
import Features from '@/components/home/Features';

export default function Home() {
  return (
    <AppShell>
      <Hero />
      <HowItWorks />
      <Features />
    </AppShell>
  );
}
