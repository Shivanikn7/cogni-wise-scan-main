import { AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RiskAlertCardProps {
    score: number;
    condition: string;
    alertTitle?: string;
    alertMsg?: string;
    adminMessage?: string | null;
}

const RiskAlertCard = ({ score, condition, alertTitle, alertMsg, adminMessage }: RiskAlertCardProps) => {
    const isSevere = score >= 75;
    const bgColor = isSevere ? "bg-red-50/90 backdrop-blur-sm" : "bg-orange-50/90 backdrop-blur-sm";
    const borderColor = isSevere ? "border-red-200" : "border-orange-200";
    const textColor = isSevere ? "text-red-700" : "text-orange-700";
    const iconColor = isSevere ? "text-red-600" : "text-orange-600";

    return (
        <Card className={`${bgColor} ${borderColor} border-l-8 shadow-md mb-6 transition-all hover:shadow-lg`}>
            <CardHeader className="pb-2">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full bg-white/50 border ${borderColor}`}>
                        <AlertTriangle className={`h-8 w-8 ${iconColor}`} />
                    </div>
                    <div>
                        <CardTitle className={`text-2xl font-bold ${textColor} mb-1`}>
                            {alertTitle || "Emergency Intervention Required"}
                        </CardTitle>
                        <p className={`text-sm font-semibold uppercase tracking-wider ${isSevere ? 'text-red-500' : 'text-orange-500'}`}>
                            {isSevere ? "Critical Alert" : "High Priority Alert"}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="bg-white/60 p-4 rounded-xl border border-white/50">
                    <p className={`text-lg font-bold ${textColor} flex justify-between items-center`}>
                        <span>Calculated Risk Score:</span>
                        <span className="text-3xl">{score.toFixed(1)}%</span>
                    </p>
                </div>

                <div className="text-gray-700 leading-relaxed text-lg">
                    <p className="mb-2"><strong>Clinical Indicator:</strong> {alertMsg || `Your assessment for ${condition} indicates potential risks requiring immediate attention.`}</p>
                    <p>Please follow the safety steps below and consult a recommended specialist found in this panel.</p>
                </div>

                {adminMessage && (
                    <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold">
                            <Info className="w-5 h-5" />
                            <span>Message from Admin / Doctor:</span>
                        </div>
                        <p className="text-slate-700 italic">"{adminMessage}"</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default RiskAlertCard;
