
import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SafetyChecklist = () => {
    const [items, setItems] = useState([
        { id: 1, text: "Ensure the individual is in a safe, quiet environment.", checked: false },
        { id: 2, text: "Remove any hazardous objects (sharp items, trip hazards).", checked: false },
        { id: 3, text: "Keep a list of emergency contacts handy.", checked: false },
        { id: 4, text: "Do not leave the individual unsupervised if confused.", checked: false },
        { id: 5, text: "Document observed behaviors for the doctor.", checked: false },
    ]);

    const toggleItem = (id: number) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const progress = Math.round((items.filter(i => i.checked).length / items.length) * 100);

    return (
        <Card className="shadow-sm h-full bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader className="pb-3 border-b border-slate-200/60 bg-transparent">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-slate-800">Safety Checklist</CardTitle>
                    <span className="text-sm font-semibold text-purple-600">{progress}% Completed</span>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${item.checked ? 'bg-green-50' : 'hover:bg-slate-50'}`}
                        onClick={() => toggleItem(item.id)}
                    >
                        {item.checked ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                            <Circle className="h-5 w-5 text-gray-400 mt-0.5" />
                        )}
                        <span className={`text-sm ${item.checked ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                            {item.text}
                        </span>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default SafetyChecklist;
