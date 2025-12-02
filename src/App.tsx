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
<<<<<<< HEAD

      {/* 👇 HASH ROUTER PARA GITHUB PAGES */}
=======
>>>>>>> 5ca2570 (actualizaciòn del nombre de la maquina)
      <HashRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/machine" element={<Layout><Machine /></Layout>} />
          <Route path="/parts" element={<Layout><Parts /></Layout>} />
          <Route path="/maintenance" element={<Layout><Maintenance /></Layout>} />
          <Route path="/maintenance-records" element={<Layout><MaintenanceRecords /></Layout>} />
          <Route path="/preventive" element={<Layout><Preventive /></Layout>} />
          <Route path="/predictive" element={<Layout><Predictive /></Layout>} />
          <Route path="/schedule" element={<Layout><Schedule /></Layout>} />
          <Route path="/vendors" element={<Layout><Vendors /></Layout>} />
          <Route path="/purchases" element={<Layout><Purchases /></Layout>} />
          <Route path="/alerts" element={<Layout><Alerts /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
<<<<<<< HEAD

=======
>>>>>>> 5ca2570 (actualizaciòn del nombre de la maquina)
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
