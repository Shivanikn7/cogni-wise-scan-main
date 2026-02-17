import { useNavigate } from "react-router-dom";
import { Sparkles, Brain, Heart, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const Welcome = () => {
  const navigate = useNavigate();

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 text-slate-900 relative overflow-hidden"
      onClick={goToDashboard}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          goToDashboard();
        }
      }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center relative z-10">
        {/* Logo and brand */}
        <div className="mb-8 flex items-center gap-4 text-indigo-700">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <Brain className="h-7 w-7" />
            <p className="text-lg font-bold tracking-wide">CogniWise Scan</p>
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl font-bold md:text-6xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
          Mindful Assessment Pathways
        </h1>

        {/* Tagline */}
        <p className="mt-4 max-w-3xl text-xl text-slate-700 md:text-2xl font-medium leading-relaxed">
          "Early detection, compassionate care, empowered minds."
        </p>

        {/* Feature highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 mx-auto">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">AI-Powered Analysis</h3>
            <p className="text-sm text-slate-600">Advanced machine learning for accurate cognitive assessments</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4 mx-auto">
              <Heart className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Personalized Care</h3>
            <p className="text-sm text-slate-600">Tailored recommendations based on your unique profile</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4 mx-auto">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Secure & Private</h3>
            <p className="text-sm text-slate-600">Your mental health data is protected with enterprise-grade security</p>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          size="lg"
          className="mt-12 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-10 py-4 text-white text-lg font-semibold hover:from-indigo-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          onClick={(event) => {
            event.stopPropagation();
            goToDashboard();
          }}
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Start Your Assessment Journey
        </Button>

        {/* Subtle hint */}
        <p className="mt-6 text-sm text-slate-500">Click anywhere or use the button above to begin</p>
      </div>

      {/* Custom CSS for blob animation */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
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
      `}</style>
    </div>
  );
};

export default Welcome;

