import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowLeft, AlertCircle, CheckCircle, Activity, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/api";

type AssessmentResult = {
  id: number;
  type: "level1" | "level2";
  condition_type?: string;
  risk_score?: number;
  risk_level?: string;
  risk_label?: string;
  requires_level2?: boolean;
  admin_notes?: string | null;
  assessed_at: string;
  // Level 2 specific
  age_group?: string;
  final_risk_percent?: number;
  domain_scores?: any;
};

const Results = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<AssessmentResult[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }

        // Fetch Level 1 Results
        const res1 = await fetch(buildApiUrl(`/api/results/${session.user.id}`));
        const data1 = await res1.json();
        const level1Results = (Array.isArray(data1) ? data1 : []).map((r: any) => ({ ...r, type: "level1" }));

        // Fetch Level 2 Results
        const res2 = await fetch(buildApiUrl(`/api/level2/results/${session.user.id}`));
        const data2 = await res2.json();
        const level2Results = (Array.isArray(data2) ? data2 : []).map((r: any) => ({ ...r, type: "level2" }));

        // Combine and Sort
        const combined = [...level1Results, ...level2Results].sort((a, b) =>
          new Date(b.assessed_at).getTime() - new Date(a.assessed_at).getTime()
        );

        setResults(combined);
      } catch (error) {
        toast({
          title: "Failed to load results",
          description: error instanceof Error ? error.message : "Unable to load results",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [navigate, toast]);

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "low": return "default"; // Green-ish usually
      case "mild": return "secondary";
      case "moderate": return "default";
      case "high": return "destructive";
      default: return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadPdf = (type: string, id: number) => {
    window.open(buildApiUrl(`/api/reports/${type}/${id}/pdf`), '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Assessment History</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {results.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No assessment results yet.</p>
                <Button onClick={() => navigate("/dashboard")}>
                  Take an Assessment
                </Button>
              </CardContent>
            </Card>
          ) : (
            results.map((result) => (
              <Card key={`${result.type}-${result.id}`} className={result.type === 'level2' ? "border-l-4 border-l-purple-500" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {result.type === 'level1' ? (
                          <>
                            {result.condition_type?.toUpperCase()} Screening
                            {result.requires_level2 && (
                              <AlertCircle className="h-5 w-5 text-destructive" />
                            )}
                          </>
                        ) : (
                          <>
                            <Activity className="h-5 w-5 text-purple-600" />
                            Level 2 Assessment ({result.age_group})
                          </>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {formatDate(result.assessed_at)}
                      </CardDescription>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      {result.type === 'level1' ? (
                        <Badge variant={getRiskBadgeVariant(result.risk_level || 'low')}>
                          {result.risk_label}
                        </Badge>
                      ) : (
                        <Badge className={result.final_risk_percent! >= 70 ? "bg-red-500" : "bg-green-500"}>
                          {result.final_risk_percent! >= 70 ? "High Risk" : "Low/Moderate Risk"}
                        </Badge>
                      )}

                      <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(result.type, result.id)}>
                        <Download className="h-4 w-4 mr-2" /> PDF Report
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.type === 'level1' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                        <p className="text-2xl font-bold">{result.risk_score?.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
                        <p className="text-2xl font-bold capitalize">{result.risk_level}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-purple-700">{result.final_risk_percent}%</span>
                        <span className="text-sm text-muted-foreground">Overall Risk Score</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {result.domain_scores && Object.entries(result.domain_scores).map(([k, v]: [string, any]) => (
                          <div key={k} className="bg-slate-50 p-2 rounded border">
                            <div className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</div>
                            <div className="font-bold">{(v * 100).toFixed(0)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.type === 'level1' && result.requires_level2 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <p className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Level 2 Assessment Recommended
                      </p>
                      <Button variant="link" className="p-0 h-auto text-destructive underline" onClick={() => navigate("/level2")}>
                        Proceed to Level 2
                      </Button>
                    </div>
                  )}

                  {result.admin_notes && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-900">Admin suggestion</p>
                      <p className="text-sm text-emerald-900/80 mt-1">{result.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Results;
