import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Machine from "./pages/Machine";
import Parts from "./pages/Parts";
import Maintenance from "./pages/Maintenance";
import MaintenanceRecords from "./pages/MaintenanceRecords";
import Preventive from "./pages/Preventive";
import Predictive from "./pages/Predictive";
import Schedule from "./pages/Schedule";
import Vendors from "./pages/Vendors";
import Purchases from "./pages/Purchases";
import Alerts from "./pages/Alerts";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      {/* HashRouter para GitHub Pages */}
      <HashRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="machine" element={<Machine />} />
            <Route path="parts" element={<Parts />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="maintenance-records" element={<MaintenanceRecords />} />
            <Route path="preventive" element={<Preventive />} />
            <Route path="predictive" element={<Predictive />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="alerts" element={<Alerts />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
