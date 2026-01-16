import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import CreateListing from "./pages/CreateListing";
import CropDiagnosis from "./pages/CropDiagnosis";
import FarmingTips from "./pages/FarmingTips";
import DirectMessages from "./pages/DirectMessages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:id" element={<ProductDetail />} />
            <Route
              path="/marketplace/new"
              element={
                <ProtectedRoute>
                  <CreateListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/crop-diagnosis" element={<CropDiagnosis />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/tips"
              element={
                <ProtectedRoute>
                  <FarmingTips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <DirectMessages />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
