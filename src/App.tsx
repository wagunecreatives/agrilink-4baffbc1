import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LeafletMarkerFix } from "@/components/map/LeafletMarkerFix";


const queryClient = new QueryClient();
const LandingPage = lazy(() => import("./pages/LandingPage"));
const About = lazy(() => import("./pages/About"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CreateListing = lazy(() => import("./pages/CreateListing"));
const CropDiagnosis = lazy(() => import("./pages/CropDiagnosis"));
const FarmingTips = lazy(() => import("./pages/FarmingTips"));
const DirectMessages = lazy(() => import("./pages/DirectMessages"));
const OrdersForFarmer = lazy(() => import("./pages/OrdersForFarmer"));
const OrdersForCustomer = lazy(() => import("./pages/OrdersForCustomer"));
const NotificationsForFarmer = lazy(() => import("./pages/NotificationsForFarmer"));
const MyProducts = lazy(() => import("./pages/MyProducts"));

const NotFound = lazy(() => import("./pages/NotFound"));


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <LeafletMarkerFix />
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:id" element={<ProductDetail />} />
              <Route
                path="/marketplace/new"
                element={
                  <ProtectedRoute requiredRoles={["farmer"]}>
                    <CreateListing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/farmer"
                element={
                  <ProtectedRoute requiredRoles={["farmer"]}>
                    <OrdersForFarmer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrdersForCustomer />
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
                path="/notifications"
                element={
                  <ProtectedRoute requiredRoles={["farmer"]}>
                    <NotificationsForFarmer />
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
              <Route
                path="/my-products"
                element={
                  <ProtectedRoute requiredRoles={["farmer"]}>
                    <MyProducts />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

