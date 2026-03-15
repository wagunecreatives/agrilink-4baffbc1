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
  Lightbulb,
  ImageIcon,
  Trash2,
  CheckCircle,
  Syringe,
  FlaskConical,
  Sprout,
} from "lucide-react";

export default function CropDiagnosis() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setDiagnosis(null);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setDiagnosis(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyzeCrop = async () => {
    if (!selectedImage) return toast.error("Please upload an image first.");
    if (!SUPABASE_URL || !SUPABASE_ANON)
      return toast.error("Supabase variables missing.");

    setAnalyzing(true);
    setDiagnosis(null);

    try {
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
      if (!response.ok) throw new Error(data.error || "AI analysis failed.");

      // The edge function returns { diagnosis: ... }
      const result = data.diagnosis ?? data;
      setDiagnosis(result);
      toast.success("Crop analysis completed!");
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Analysis failed. Check console for details.");
    } finally {
      setAnalyzing(false);
    }
  };

  const renderDiagnosis = (diag: any) => {
    const {
      crop = "Unknown",
      disease = "Unknown",
      scientific_name = "",
      confidence = 0,
      type = "other",
      severity = "unknown",
      key_indicators = [],
      analysis_details = "No detailed analysis available.",
      treatment = "No treatment information provided.",
      prevention = "No prevention tips available.",
    } = diag;

    const confidenceLevel = confidence > 80 ? "high" : confidence > 50 ? "medium" : "low";
    const confidenceVariant =
      confidenceLevel === "high" ? "default" : confidenceLevel === "medium" ? "secondary" : "outline";
    const severityVariant =
      severity === "high" ? "destructive" : severity === "medium" ? "default" : "secondary";

    const preventionList = typeof prevention === "string"
      ? prevention.split('\n').filter((s: string) => s.trim())
      : prevention;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Leaf className="h-5 w-5 text-green-600" />
              Diagnosis Results: {crop} – {disease}
              {scientific_name && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({scientific_name})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <span className="text-sm text-muted-foreground">Detected Issue</span>
                <p className="font-semibold">{disease}</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <span className="text-sm text-muted-foreground">Type</span>
                <p className="font-semibold">{capitalise(type)}</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <span className="text-sm text-muted-foreground">Severity</span>
                <Badge variant={severityVariant} className="ml-2">
                  {capitalise(severity)}
                </Badge>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <span className="text-sm text-muted-foreground">Confidence</span>
                <Badge variant={confidenceVariant} className="ml-2">
                  {confidence}% ({confidenceLevel})
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FlaskConical className="h-4 w-4" /> Analysis Details
              </h3>
              <p className="text-muted-foreground">{analysis_details}</p>
              {key_indicators.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm font-medium">Key indicators: </span>
                  <span className="text-sm text-muted-foreground">
                    {key_indicators.join(", ")}
                  </span>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Syringe className="h-4 w-4" /> Treatment
              </h3>
              <p className="text-muted-foreground whitespace-pre-line">{treatment}</p>
            </div>

            {preventionList.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Sprout className="h-4 w-4" /> Prevention
                </h3>
                {Array.isArray(preventionList) ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {preventionList.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground whitespace-pre-line">{preventionList}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Leaf className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">AI Crop Disease Diagnosis</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload a crop photo and our AI will analyze it for diseases,
              pests, or nutrient deficiencies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Upload Crop Image
                </CardTitle>
                <CardDescription>
                  Take a clear photo of the affected leaf or plant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                {!selectedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition"
                  >
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Click to upload</p>
                    <p className="text-sm opacity-70">PNG or JPG up to 5MB</p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Crop"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
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
                    <Upload className="h-4 w-4 mr-2" />
                    Select Image
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={analyzeCrop}
                    disabled={!selectedImage || analyzing}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Leaf className="h-4 w-4 mr-2" />
                        Analyze Crop
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Tips for Best Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Take close-up photos of affected areas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Ensure good lighting – natural daylight is best</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Include both healthy and affected parts for comparison</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Capture multiple angles if possible</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-red-500 font-bold">✕</span>
                    <span>Avoid blurry or dark images</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-red-500 font-bold">✕</span>
                    <span>Don’t use heavily filtered or edited photos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {(analyzing || diagnosis) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Diagnosis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {analyzing ? (
                  <div className="flex flex-col items-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin mb-4" />
                    <p>Analyzing your crop image...</p>
                  </div>
                ) : (
                  diagnosis && renderDiagnosis(diagnosis)
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}