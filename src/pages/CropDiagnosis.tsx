import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  Camera,
  Loader2,
  Leaf,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ImageIcon,
  Trash2,
} from "lucide-react";

export default function CropDiagnosis() {
  const { user, isAuthLoading: authLoading } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB");
      return;
    }

    setImageFile(file);
    setDiagnosis(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    setDiagnosis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const analyzeCrop = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    setAnalyzing(true);
    setDiagnosis(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-crop", {
        body: { imageBase64: selectedImage },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setDiagnosis(data.diagnosis);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Error analyzing crop:", error);
      const message = error instanceof Error ? error.message : "Failed to analyze crop image";
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDiagnosis = (text: string) => {
    // Convert markdown-style formatting to styled sections
    const lines = text.split("\n");
    return lines.map((line, index) => {
      // Headers (bold text with **)
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <h3 key={index} className="font-semibold text-lg mt-4 mb-2 text-primary">
            {line.replace(/\*\*/g, "")}
          </h3>
        );
      }
      // Numbered headers
      if (/^\d+\.\s+\*\*/.test(line)) {
        const cleanLine = line.replace(/\*\*/g, "");
        return (
          <h3 key={index} className="font-semibold text-base mt-4 mb-2 text-foreground">
            {cleanLine}
          </h3>
        );
      }
      // Bullet points
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return (
          <li key={index} className="ml-4 text-muted-foreground">
            {line.substring(2).replace(/\*\*/g, "")}
          </li>
        );
      }
      // Regular text
      if (line.trim()) {
        return (
          <p key={index} className="text-muted-foreground mb-2">
            {line.replace(/\*\*/g, "")}
          </p>
        );
      }
      return null;
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Leaf className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">AI Crop Disease Diagnosis</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload a photo of your crop and our AI will analyze it for diseases, pests,
              or nutrient deficiencies and provide treatment recommendations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Upload Crop Image
                </CardTitle>
                <CardDescription>
                  Take a clear photo of the affected plant leaves or stems
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
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Selected crop"
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
                    {selectedImage ? "Change Image" : "Select Image"}
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

            {/* Tips Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Tips for Best Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Take close-up photos of affected areas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Ensure good lighting - natural daylight is best</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Include both healthy and affected parts for comparison</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Capture multiple angles if possible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Avoid blurry or dark images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Don't use heavily filtered or edited photos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          {(analyzing || diagnosis) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-primary" />
                  Diagnosis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Analyzing your crop image...</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      This may take a few seconds
                    </p>
                  </div>
                ) : diagnosis ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {formatDiagnosis(diagnosis)}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
