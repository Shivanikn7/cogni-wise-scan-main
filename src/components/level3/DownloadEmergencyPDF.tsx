
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildApiUrl } from "@/lib/api";

interface DownloadEmergencyPDFProps {
    resultId: number | null;
}

const DownloadEmergencyPDF = ({ resultId }: DownloadEmergencyPDFProps) => {
    const handleDownload = () => {
        if (!resultId) return;
        window.open(buildApiUrl(`/api/reports/level3/${resultId}/pdf`), '_blank');
    };

    return (
        <Card className="bg-gradient-to-r from-red-600 to-red-600 text-white shadow-lg overflow-hidden relative mb-6">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform origin-bottom-left" />
            <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6 relative z-10 gap-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Emergency Report Ready
                    </h3>
                    <p className="text-red-100 text-sm mt-1 max-w-md">
                        Download the comprehensive medical summary to present to the specialist.
                        Includes scored data and risk analysis.
                    </p>
                </div>
                <Button
                    onClick={handleDownload}
                    disabled={!resultId}
                    className="bg-white text-red-600 hover:bg-gray-100 whitespace-nowrap font-bold shadow-md"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            </CardContent>
        </Card>
    );
};

export default DownloadEmergencyPDF;
