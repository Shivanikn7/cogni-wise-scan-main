import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ASDAssessment from "./pages/assessments/ASDAssessment";
import ADHDAssessment from "./pages/assessments/ADHDAssessment";
import ADHDAdultAssessment from "./pages/assessments/ADHDAdultAssessment";
import DementiaAssessment from "./pages/assessments/DementiaAssessment";
import ResultsPage from "./pages/Results";
import LevelTwoAssessment from "./pages/assessments/LevelTwoAssessment";
import LevelThreeEmergency from "./pages/assessments/LevelThreeEmergency";
import Chatbot from "./pages/Chatbot";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Register />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/admin-login" element={<AdminLogin />} />
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    <Route path="/assessment/asd" element={<ASDAssessment />} />
                    <Route path="/assessment/adhd" element={<ADHDAssessment />} />
                    <Route path="/assessment/adhd-adult" element={<ADHDAdultAssessment />} />
                    <Route path="/assessment/dementia" element={<DementiaAssessment />} />
                    <Route path="/results" element={<ResultsPage />} />
                    <Route path="/level2" element={<LevelTwoAssessment />} />
                    <Route path="/level3" element={<LevelThreeEmergency />} />
                    <Route path="/level3" element={<LevelThreeEmergency />} />
                    <Route path="/chatbot" element={<Chatbot />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/update-password" element={<UpdatePassword />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
