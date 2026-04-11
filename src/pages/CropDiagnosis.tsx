import { useState, useRef } from "react";
import type { DiagnosisResult } from "@/lib/diagnosis";
import { normalizeDiagnosis } from "@/lib/diagnosis";
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
} from "lucide-react";

export default function CropDiagnosis() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

  /* ---------------- IMAGE HANDLING ---------------- */

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Upload a valid image.");
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image must be < 5MB.");
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

  /* ---------------- ANALYSIS ---------------- */

  const analyzeCrop = async () => {
    if (!selectedImage) return toast.error("Upload image first.");

    setAnalyzing(true);
    setDiagnosis(null);

    try {
      const base64 = selectedImage.split(",")[1];

      const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-crop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON}`,
          apikey: SUPABASE_ANON,
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await res.json();
      console.log('Raw API response:', data);
      
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      
      if (!data.diagnosis) {
        throw new Error(`No diagnosis in response: ${JSON.stringify(data)}`);
      }
      
      const normalized = normalizeDiagnosis(data.diagnosis);
      console.log('Normalized diagnosis:', normalized);
      
      setDiagnosis(normalized);
      toast.success("Analysis complete!");
    } catch (err: any) {
      toast.error(err.message || "Error analyzing crop");
    } finally {
      setAnalyzing(false);
    }
  };

  /* ---------------- UI HELPERS ---------------- */

  const label = (text?: string) =>
    (text || "")
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "Unknown";

  const list = (arr: string[] = []) =>
    arr.map((item, i) => (
      <li key={i} className="flex gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
        <span>{item}</span>
      </li>
    ));

  /* ---------------- RENDER ---------------- */

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-3">
            <Leaf className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Crop Diagnosis</h1>
          </div>
          <p className="text-muted-foreground">
            Upload a crop image and get instant disease detection & treatment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* UPLOAD */}
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
                accept="image/*"
                className="hidden"
              />

              {!selectedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed p-8 text-center rounded-lg cursor-pointer hover:border-primary/50"
                >
                  <ImageIcon className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  Click to upload
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={selectedImage}
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
                      Analyzing...
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

          {/* RESULT */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnosis</CardTitle>
            </CardHeader>

            <CardContent>
              {analyzing ? (
                <div className="text-center py-10">
                  <Loader2 className="animate-spin h-10 w-10 mx-auto mb-3" />
                  Analyzing crop...
                </div>
              ) : !diagnosis ? (
                <p className="text-muted-foreground text-center">
                  No analysis yet
                </p>
              ) : (
                <div className="space-y-4">

                  {/* BASIC INFO */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm">Crop</p>
                      <p className="font-bold">{diagnosis?.crop || "Unknown"}</p>
                    </div>

                    <div>
                      <p className="text-sm">Disease</p>
                      <p className="font-bold">{diagnosis?.disease || "No disease detected"}</p>
                    </div>

                    <div>
                      <p className="text-sm">Severity</p>
                      <Badge>{label(diagnosis?.severity)}</Badge>
                    </div>

                    <div>
                      <p className="text-sm">Confidence</p>
                      <Badge>{diagnosis?.confidence ?? 0}%</Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* DETAILS */}
                  <div>
                    <h3 className="font-semibold mb-1">Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      {diagnosis?.analysis_details || "No analysis details available."}
                    </p>
                  </div>

                  {/* TREATMENT */}
                  <div>
                    <h3 className="font-semibold mb-1">Treatment</h3>
                    <ul className="text-sm space-y-1">
                      {diagnosis?.treatment?.length ? list(diagnosis.treatment) : (
                        <p className="text-sm text-muted-foreground">No treatment recommendations available.</p>
                      )}
                    </ul>
                  </div>

                  {/* PREVENTION */}
                  <div>
                    <h3 className="font-semibold mb-1">Prevention</h3>
                    <ul className="text-sm space-y-1">
                      {diagnosis?.prevention?.length ? list(diagnosis.prevention) : (
                        <p className="text-sm text-muted-foreground">No prevention recommendations available.</p>
                      )}
                    </ul>
                  </div>

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