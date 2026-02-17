import { Header } from '@/components/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap, Users, ShoppingCart, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E6E6FA] to-transparent opacity-60 pointer-events-none" />
          <div className="container px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-slate-900">
              Stop Guessing. <span className="text-primary">Start Sharing.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-[800px] mb-8 font-light">
              The simplest way to manage expenses for your boarding place. Track spending, split bills automatically, and stay in sync with your roommates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button size="lg" className="bg-[#F0B2B6] hover:bg-[#E59CA0] text-slate-900 font-bold" asChild>
                <Link href="/signup">
                  Get Started – It's Free
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/50 border-slate-300 hover:bg-white" asChild>
                <Link href="/login">
                  Log In
                </Link>
              </Button>
            </div>
            {/* Hero Image */}
            <div className="mt-16 w-full max-w-4xl relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl z-10" />
              <img
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=1200"
                alt="Roommates hanging out"
                className="w-full h-auto rounded-xl shadow-2xl border border-white/50 transform rotate-1 hover:rotate-0 transition-transform duration-500 object-cover max-h-[500px]"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-12 text-slate-800">Everything you need to keep the peace</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-[#E6E6FA] rounded-full flex items-center justify-center mb-4 text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Automatic Splitting</h3>
                <p className="text-slate-600">Add an expense once; IDKPay does the math and updates everyone's balance instantly.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-[#E6E6FA] rounded-full flex items-center justify-center mb-4 text-primary">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Real-time Notifications</h3>
                <p className="text-slate-600">No more awkward texts. Get alerted when expenses are added or settled.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-[#E6E6FA] rounded-full flex items-center justify-center mb-4 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Consolidated Debts</h3>
                <p className="text-slate-600">See exactly who owes you and who you owe in one clear summary.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-[#E6E6FA] rounded-full flex items-center justify-center mb-4 text-primary">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Collaborative Shopping</h3>
                <p className="text-slate-600">Manage a shared "Things to Buy" list so you never run out of essentials.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Case Section */}
        <section className="py-20 bg-[#F5F5F5]">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800">The Boarding Place Life</h2>
                <p className="text-lg text-slate-600">
                  Built specifically for boarding houses and shared living. Whether it's splitting the rent, electricity bills, or that midnight pizza run, IDKPay handles the specific needs of roommates.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#f0b2b6] flex items-center justify-center text-white text-xs">✓</div>
                    <span className="text-slate-700">Manage group members easily</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#f0b2b6] flex items-center justify-center text-white text-xs">✓</div>
                    <span className="text-slate-700">Assign admins to control settings</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#f0b2b6] flex items-center justify-center text-white text-xs">✓</div>
                    <span className="text-slate-700">Keep the harmony in your shared home</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800"
                  alt="Students studying together"
                  className="rounded-2xl shadow-xl border border-slate-200 object-cover w-full h-[400px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold mb-16 text-slate-800">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center relative">
                <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-xl font-bold text-slate-700 mb-4 z-10 relative">1</div>
                <h3 className="text-lg font-bold mb-2">Create Group</h3>
                <p className="text-sm text-slate-500">Set up your boarding place and invite roommates.</p>
                <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-slate-100 -z-0"></div>
              </div>
              <div className="flex flex-col items-center relative">
                <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-xl font-bold text-slate-700 mb-4 z-10 relative">2</div>
                <h3 className="text-lg font-bold mb-2">Log & Split</h3>
                <p className="text-sm text-slate-500">Enter an expense. We tackle the math.</p>
                <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-slate-100 -z-0"></div>
              </div>
              <div className="flex flex-col items-center relative">
                <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-xl font-bold text-slate-700 mb-4 z-10 relative">3</div>
                <h3 className="text-lg font-bold mb-2">Stay Notified</h3>
                <p className="text-sm text-slate-500">Everyone gets a ping instantly.</p>
                <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-slate-100 -z-0"></div>
              </div>
              <div className="flex flex-col items-center relative">
                <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-xl font-bold text-slate-700 mb-4 z-10 relative">4</div>
                <h3 className="text-lg font-bold mb-2">Settle Up</h3>
                <p className="text-sm text-slate-500">Track payments and keep balances at zero.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[#E6E6FA]/30">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">Ready to level up your shared living?</h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">Join thousands of roommates who are done with messy spreadsheets and awkward money talks.</p>
            <Button size="lg" className="bg-[#F0B2B6] hover:bg-[#E59CA0] text-slate-900 font-bold px-8" asChild>
              <Link href="/signup">
                Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
