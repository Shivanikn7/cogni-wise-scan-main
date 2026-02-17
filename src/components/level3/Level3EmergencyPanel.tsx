
import { useEffect, useState } from "react";
import { Copy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { buildApiUrl } from "@/lib/api";
import RiskAlertCard from "./RiskAlertCard";
import SafetyChecklist from "./SafetyChecklist";
import DoctorRecommendations from "./DoctorRecommendations";
import NearbyHospitals from "./NearbyHospitals";
import DownloadEmergencyPDF from "./DownloadEmergencyPDF";

const Level3EmergencyPanel = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        risk_score: number;
        age_group: string;
        advice: any;
        resultId?: number;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    navigate("/login");
                    return;
                }

                // Fetch User ID - we used session.user.id
                const user_id = session.user.id;

                // Fetch Level 2 Result ID first if we want PDF download to work nicely, 
                // or the summary endpoint could return it.
                // Let's rely on summary endpoint we created to return basic info, 
                // but wait, I didn't add resultId to summary response in app.py. 
                // I will just fetch level 2 results separately or update app.py later.
                // For now, let's fetch summary.

                const res = await fetch(buildApiUrl(`/api/level3/summary/${user_id}`));
                if (res.ok) {
                    const summary = await res.json();

                    // Also fetch result list to get the ID for PDF
                    const res2 = await fetch(buildApiUrl(`/api/level2/results/${user_id}`));
                    let latestId = null;
                    if (res2.ok) {
                        const results = await res2.json();
                        if (results && results.length > 0) {
                            latestId = results[0].id; // Assuming sorted descending
                        }
                    }

                    setData({ ...summary, resultId: latestId });
                } else {
                    // Handle no data or error
                    console.error("Failed to load summary");
                }

            } catch (error) {
                console.error("Error loading level 3 data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Emergency Portal...</div>;
    }

    if (!data) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-gray-800">No Assessment Data Found</h2>
                <p className="text-gray-600 mb-4">Please complete Level 2 Assessment first.</p>
                <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 relative flex flex-col">
            {/* Background Image */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("/medical-bg.png")' }}
            />
            <div className="fixed inset-0 bg-white/80 backdrop-blur-[2px] z-0 pointer-events-none"></div>

            {/* Header */}
            <div className="bg-red-600/90 backdrop-blur-md text-white py-8 pb-12 relative z-10 shadow-lg border-b border-red-500/50">
                <div className="container mx-auto px-4">
                    <Button variant="ghost" className="text-red-100 hover:text-white hover:bg-red-700/50 p-0 mb-4 flex gap-2" onClick={() => navigate("/dashboard")}>
                        <ArrowLeft className="h-5 w-5" /> Back to Dashboard
                    </Button>
                    <div className="flex justify-between items-end">
                        <div className="relative z-10">
                            <h1 className="text-3xl font-bold drop-shadow-sm">Emergency Intervention Portal</h1>
                            <p className="text-red-100 mt-1 font-medium">Level 3 • Immediate Assist Mode</p>
                        </div>
                        <div className="bg-white/20 px-3 py-1 rounded text-sm font-semibold backdrop-blur-md border border-white/30 shadow-sm">
                            ID: {data.age_group.toUpperCase()}-{(data.resultId || 0).toString().padStart(6, '0')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-20">
                <DownloadEmergencyPDF resultId={data.resultId || null} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <RiskAlertCard
                            score={data.risk_score}
                            condition={data.age_group}
                            alertTitle={data.advice.condition_title}
                            alertMsg={data.advice.condition_msg}
                            adminMessage={data.advice.admin_notes}
                        />

                        <NearbyHospitals />
                    </div>

                    <div className="space-y-6">
                        <SafetyChecklist />
                        <DoctorRecommendations />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Level3EmergencyPanel;
