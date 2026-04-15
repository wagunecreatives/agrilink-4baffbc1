import { useState, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import {
  Upload,
  Camera,
  Loader2,
  Leaf,
  ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// Type definition for the diagnosis object
interface Diagnosis {
  crop: string;
  disease: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  analysis_details: string;
  organic_treatment: string[];
  conventional_treatment: string[];
  prevention: string[];
  monitoring_steps: string[];
  recovery_outlook: string;
  spread_risk: "low" | "medium" | "high";
}

export default function CropDiagnosis() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPEG, PNG).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setDiagnosis(null);
      setApiError(null);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setDiagnosis(null);
    setApiError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyzeCrop = async () => {
    if (!selectedImage) {
      toast.error("Please upload an image first.");
      return;
    }

    setAnalyzing(true);
    setDiagnosis(null);
    setApiError(null);

    try {
      // Extract raw base64 (without data:image prefix)
      const base64 = selectedImage.split(",")[1];

      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-crop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON}`,
          apikey: SUPABASE_ANON,
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await response.json();

      // Handle both 200 with error flag and actual HTTP errors
      if (!response.ok || data.success === false) {
        const errorMsg = data.error || "Analysis failed. Please try again.";
        throw new Error(errorMsg);
      }

      if (data.diagnosis) {
        setDiagnosis(data.diagnosis);
        if (data.fallback) {
          toast.warning("⚠️ Using fallback mode – Gemini API key may be missing.");
        } else {
          toast.success("✅ AI diagnosis complete!");
        }
      } else {
        throw new Error("No diagnosis data received.");
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      const message = err.message || "Unknown error occurred";
      toast.error(message);
      setApiError(message);
      // Set a fallback diagnosis so UI doesn't stay empty
      setDiagnosis({
        crop: "Unknown crop",
        disease: "Analysis failed",
        severity: "medium",
        confidence: 0,
        analysis_details: message,
        organic_treatment: ["Try again with a clearer photo"],
        conventional_treatment: [],
        prevention: ["Ensure good lighting", "Capture whole leaf"],
        monitoring_steps: [],
        recovery_outlook: "Unknown",
        spread_risk: "medium",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper: Capitalize first letter of each word
  const label = (text: string) =>
    text?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Helper: Render list of strings with checkmark icons
  const renderList = (items: string[] | undefined) =>
    items?.map((item, i) => (
      <li key={i} className="flex gap-2 items-start">
        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
        <span className="text-sm">{item}</span>
      </li>
    ));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-3">
            <Leaf className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Crop Diagnosis</h1>
          </div>
          <p className="text-muted-foreground">
            Upload a leaf photo and get instant disease detection & treatment recommendations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 items-center">
                <Camera className="h-5 w-5" />
                Upload Image
              </CardTitle>
              <CardDescription>Clear leaf photo works best</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/jpeg,image/png"
                className="hidden"
              />

              {!selectedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed p-8 text-center rounded-lg cursor-pointer hover:border-primary/50 transition"
                >
                  <ImageIcon className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Click to upload</p>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="Selected crop leaf"
                    className="w-full h-64 object-cover rounded"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Select
                </Button>

                <Button
                  className="flex-1"
                  onClick={analyzeCrop}
                  disabled={!selectedImage || analyzing}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Analyzing with Gemini AI...
                    </>
                  ) : (
                    <>
                      <Leaf className="mr-2 h-4 w-4" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Diagnosis Card */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnosis</CardTitle>
            </CardHeader>

            <CardContent>
              {analyzing ? (
                <div className="text-center py-10">
                  <Loader2 className="animate-spin h-10 w-10 mx-auto mb-3" />
                  <p>Analyzing crop image...</p>
                </div>
              ) : !diagnosis ? (
                <p className="text-muted-foreground text-center py-10">
                  No analysis yet. Upload an image and click "Analyze".
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Basic Information Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Crop</p>
                      <p className="font-bold">{diagnosis.crop}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Disease</p>
                      <p className="font-bold">{diagnosis.disease}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Severity</p>
                      <Badge
                        variant={
                          diagnosis.severity === "high"
                            ? "destructive"
                            : diagnosis.severity === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {label(diagnosis.severity)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <Badge
                        variant={
                          diagnosis.confidence > 85
                            ? "default"
                            : diagnosis.confidence > 70
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {diagnosis.confidence}%
                      </Badge>
                    </div>
                    {diagnosis.spread_risk && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Spread Risk</p>
                        <Badge
                          variant={
                            diagnosis.spread_risk === "high"
                              ? "destructive"
                              : diagnosis.spread_risk === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {label(diagnosis.spread_risk)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Analysis Details */}
                  <div>
                    <h3 className="font-semibold mb-1">Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      {diagnosis.analysis_details}
                    </p>
                  </div>

                  {/* Treatments */}
                  {(diagnosis.organic_treatment?.length > 0 ||
                    diagnosis.conventional_treatment?.length > 0) && (
                    <div>
                      <h3 className="font-semibold mb-2">Treatments</h3>
                      {diagnosis.organic_treatment?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-green-700 mb-1 flex items-center gap-1">
                            🌿 Organic
                          </h4>
                          <ul className="space-y-1 ml-4">
                            {renderList(diagnosis.organic_treatment)}
                          </ul>
                        </div>
                      )}
                      {diagnosis.conventional_treatment?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-blue-700 mb-1 flex items-center gap-1">
                            🔬 Conventional
                          </h4>
                          <ul className="space-y-1 ml-4">
                            {renderList(diagnosis.conventional_treatment)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prevention */}
                  {diagnosis.prevention?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-1">Prevention</h3>
                      <ul className="space-y-1">{renderList(diagnosis.prevention)}</ul>
                    </div>
                  )}

                  {/* Monitoring Steps */}
                  {diagnosis.monitoring_steps?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-1">Monitoring</h3>
                      <ul className="space-y-1">{renderList(diagnosis.monitoring_steps)}</ul>
                    </div>
                  )}

                  {/* Recovery Outlook */}
                  {diagnosis.recovery_outlook && (
                    <div className="p-3 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-1">Recovery Outlook</h3>
                      <p className="text-sm">{diagnosis.recovery_outlook}</p>
                    </div>
                  )}

                  {/* API Error Note */}
                  {apiError && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span>Error: {apiError}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}