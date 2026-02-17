
import { useEffect, useState } from "react";
import { Stethoscope, Star, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildApiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Doctor {
    name: string;
    specialty: string;
    contact: string;
    rating: number;
}

const DoctorRecommendations = () => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await fetch(buildApiUrl("/api/level3/find_doctors"));
                if (res.ok) {
                    const data = await res.json();
                    setDoctors(data);
                }
            } catch (error) {
                console.error("Failed to load doctors", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, []);

    return (
        <Card className="shadow-sm border-t-4 border-t-purple-500 h-full bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b bg-transparent">
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                    <span className="text-purple-600">🩺</span> Recommended Specialists
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {loading ? (
                    <p className="text-sm text-gray-500">Finding nearby specialists...</p>
                ) : (
                    doctors.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-all bg-white/60 hover:bg-white/80">
                            <div>
                                <h4 className="font-semibold text-gray-800">{doc.name}</h4>
                                <p className="text-xs text-purple-600 font-medium">{doc.specialty}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                    <span className="text-xs text-gray-500">{doc.rating}</span>
                                </div>
                            </div>
                            <Button size="sm" variant="outline" className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50">
                                <Phone className="h-4 w-4" />
                                Call
                            </Button>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
};

export default DoctorRecommendations;
