import { useNavigate } from "react-router-dom";
import { Sparkles, Brain, Heart, Shield, ArrowRight, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const goToAdmin = () => {
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 text-slate-900 relative overflow-hidden flex flex-col">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed"
          style={{ backgroundImage: 'url("/medical-bg.png")' }}
        />
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-1"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-20 w-full p-6 flex justify-between items-center">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-white/50">
          <Brain className="h-6 w-6 text-indigo-600" />
          <span className="font-bold text-indigo-900 tracking-tight">CogniWise Scan</span>
        </div>
        <Button
          variant="ghost"
          className="text-slate-600 hover:text-indigo-600 hover:bg-white/50"
          onClick={goToAdmin}
        >
          <Lock className="h-4 w-4 mr-2" />
          Admin Portal
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center relative z-10 pb-20">

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Early Detection</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Understanding Minds, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
              Empowering Lives.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            "The greatest weapon against stress is our ability to choose one thought over another."
          </p>

          <p className="text-base text-slate-500 max-w-xl mx-auto">
            Comprehensive screening for ASD, ADHD, and Dementia.
            Simple, accessible, and scientifically grounded.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Button
              size="lg"
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-indigo-200 transition-all duration-300 transform hover:-translate-y-1"
              onClick={goToDashboard}
            >
              <User className="mr-2 h-5 w-5" />
              Get Started as User
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-slate-200 hover:bg-white/80 hover:text-indigo-600 px-8 py-6 text-lg backdrop-blur-sm"
              onClick={() => navigate("/signup")}
            >
              Create Account
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full px-4">
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all">
            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center mb-4 text-blue-600 shadow-sm">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Multi-Level Screening</h3>
            <p className="text-slate-600 text-sm">Progressive assessment levels that adapt to your specific needs and risk profile.</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all">
            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center mb-4 text-purple-600 shadow-sm">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Compassionate Design</h3>
            <p className="text-slate-600 text-sm">Built with empathy for users of all ages, from children to the elderly.</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-all">
            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center mb-4 text-indigo-600 shadow-sm">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Secure & Private</h3>
            <p className="text-slate-600 text-sm">Your data is encrypted and handled with the highest standards of privacy.</p>
          </div>
        </div>
      </main>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;
