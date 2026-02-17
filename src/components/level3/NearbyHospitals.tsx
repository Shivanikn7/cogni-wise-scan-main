
import { useEffect, useState } from "react";
import { MapPin, Navigation, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildApiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Hospital {
    name: string;
    distance: string;
    emergency_contact: string;
    address: string;
}

const NearbyHospitals = () => {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                const res = await fetch(buildApiUrl("/api/level3/find_hospitals"));
                if (res.ok) {
                    const data = await res.json();
                    setHospitals(data);
                }
            } catch (error) {
                console.error("Failed to load hospitals", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHospitals();
    }, []);

    const openMaps = (query: string) => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
    };

    return (
        <Card className="shadow-sm border-t-4 border-t-red-500 mt-6 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b bg-transparent">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                        <span className="text-red-500">🏥</span> Emergency Centers
                    </CardTitle>
                    <Button variant="link" onClick={() => openMaps("hospitals near me")} className="text-blue-600">
                        View on Map
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-4 grid md:grid-cols-2 gap-4">
                {loading ? (
                    <p className="text-sm text-gray-500">Locating emergency services...</p>
                ) : (
                    hospitals.map((hosp, idx) => (
                        <div key={idx} className="p-4 border rounded-lg bg-white/60 hover:bg-white/80 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-gray-900">{hosp.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {hosp.address}
                                    </p>
                                </div>
                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {hosp.distance}
                                </span>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button size="sm" variant="destructive" className="flex-1 gap-1">
                                    <Phone className="h-4 w-4" /> Call {hosp.emergency_contact}
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openMaps(hosp.name)}>
                                    <Navigation className="h-4 w-4" /> Directions
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
};

export default NearbyHospitals;
