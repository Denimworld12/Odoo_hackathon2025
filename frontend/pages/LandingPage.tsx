import React from 'react';
import { ShieldCheck, Calendar, Clock, Users, ArrowRight, Star, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">Aarakshan</span>
          </div>
          <button 
            onClick={onGetStarted}
            className="px-6 py-2.5 bg-white text-black font-bold rounded-full hover:bg-indigo-50 transition-all active:scale-95"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        {/* Left Side: Text */}
        <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-left duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
            <Star className="w-3 h-3 fill-current" />
            The Future of Scheduling
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
            Seamless <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Booking</span> for Elite Teams.
          </h1>
          
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
            Aarakshan is a premium scheduling ecosystem designed for real-time availability management. 
            From flexible slot creation to automated capacity control, manage your entire appointment 
            lifecycle in one beautiful interface.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 group"
            >
              Start Booking Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex -space-x-3 items-center ml-4">
               {[1,2,3].map(i => (
                 <img key={i} className="w-10 h-10 rounded-full border-2 border-[#020617]" src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
               ))}
               <p className="text-xs text-slate-500 ml-6 font-medium">Joined by 2k+ organizations</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-indigo-500 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-300">Real-time Availability</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="text-indigo-500 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-300">Capacity Control</span>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Image/Card */}
        <div className="flex-1 relative animate-in fade-in slide-in-from-right duration-1000">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[3rem] blur-3xl opacity-20"></div>
          <div className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] p-4 shadow-2xl overflow-hidden aspect-[4/3] lg:aspect-square flex items-center justify-center">
            {/* Visual Representation of the App */}
            <div className="grid grid-cols-2 gap-4 w-full h-full p-4 opacity-80">
                <div className="bg-indigo-600/20 rounded-3xl border border-indigo-500/30 p-6 flex flex-col justify-end">
                    <Calendar className="w-10 h-10 text-indigo-400 mb-4" />
                    <div className="h-2 w-20 bg-indigo-400/40 rounded-full mb-2"></div>
                    <div className="h-2 w-12 bg-indigo-400/20 rounded-full"></div>
                </div>
                <div className="bg-slate-800 rounded-3xl border border-white/5 p-6 space-y-3">
                    <div className="w-full h-24 bg-slate-700/50 rounded-2xl"></div>
                    <div className="h-2 w-full bg-slate-700 rounded-full"></div>
                    <div className="h-2 w-2/3 bg-slate-700 rounded-full"></div>
                </div>
                <div className="bg-slate-800 rounded-3xl border border-white/5 p-6 flex flex-col items-center justify-center gap-4">
                    <Users className="w-8 h-8 text-cyan-400" />
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700"></div>
                        <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 flex flex-col justify-between">
                    <Clock className="w-8 h-8 text-white/80" />
                    <span className="text-white font-black text-xl leading-tight">Instant Scheduling</span>
                </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-white/5 py-10 opacity-50">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
          <span>© 2025 Aarakshan Ecosystem</span>
          <span>Terms of Service / Privacy</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;