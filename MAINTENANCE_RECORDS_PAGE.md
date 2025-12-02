# Maintenance Records Page - Archivos Completos

Esta es la página de visualización de registros de mantenimiento correctivo del sistema CMMS.

## Archivos Creados/Modificados

### 1. **src/pages/MaintenanceRecords.tsx** (NUEVO - ARCHIVO COMPLETO)

```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Wrench, Eye } from "lucide-react";

interface MaintenanceRecord {
  id: string;
  work_order_number: string;
  maintenance_type: string;
  priority: string;
  status: string;
  failure_description: string | null;
  root_cause: string | null;
  corrective_action: string | null;
  labor_hours: number | null;
  downtime_hours: number | null;
  cost: number | null;
  reported_by: string | null;
  assigned_to: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  machine_id: string;
  created_at: string | null;
}

const MaintenanceRecords = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(
    null
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const { data: records, isLoading } = useQuery({
    queryKey: ["maintenance-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MaintenanceRecord[];
    },
  });

  const { data: machine } = useQuery({
    queryKey: ["machine"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machine")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const filteredRecords = records?.filter(
    (record) =>
      record.work_order_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      record.maintenance_type
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      record.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "secondary";
      case "medium":
        return "outline";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const getMaintenanceTypeLabel = (type: string) => {
    switch (type) {
      case "corrective":
        return "Corrective";
      case "preventive":
        return "Preventive";
      case "predictive":
        return "Predictive";
      default:
        return type;
    }
  };

  const handleViewDetails = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setIsDetailDialogOpen(true);
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  const completedRecords = records?.filter((r) => r.status === "completed") || [];
  const inProgressRecords = records?.filter((r) => r.status === "in_progress") || [];
  const pendingRecords = records?.filter((r) => r.status === "pending") || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Maintenance Records
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage all maintenance records
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold">{pendingRecords.length}</p>
            </div>
            <div className="h-12 w-12 bg-outline/20 rounded-lg flex items-center justify-center">
              <Wrench className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-3xl font-bold">{inProgressRecords.length}</p>
            </div>
            <div className="h-12 w-12 bg-secondary/20 rounded-lg flex items-center justify-center">
              <Wrench className="h-6 w-6 text-secondary" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold">{completedRecords.length}</p>
            </div>
            <div className="h-12 w-12 bg-success/20 rounded-lg flex items-center justify-center">
              <Wrench className="h-6 w-6 text-success" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by work order, maintenance type, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Maintenance Records Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Work Order</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords && filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No maintenance records found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.work_order_number}
                  </TableCell>
                  <TableCell>
                    {getMaintenanceTypeLabel(record.maintenance_type)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(record.priority)}>
                      {record.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.assigned_to || "—"}</TableCell>
                  <TableCell>
                    ${record.cost ? record.cost.toFixed(2) : "0.00"}
                  </TableCell>
                  <TableCell>
                    {record.created_at
                      ? new Date(record.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(record)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Maintenance Record Details - {selectedRecord?.work_order_number}
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Work Order Number
                  </Label>
                  <p className="font-medium">{selectedRecord.work_order_number}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Type</Label>
                  <p className="font-medium">
                    {getMaintenanceTypeLabel(selectedRecord.maintenance_type)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Priority</Label>
                  <Badge variant={getPriorityColor(selectedRecord.priority)}>
                    {selectedRecord.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge variant={getStatusColor(selectedRecord.status)}>
                    {selectedRecord.status}
                  </Badge>
                </div>
              </div>

              {/* Assigned Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Reported By
                  </Label>
                  <p className="font-medium">{selectedRecord.reported_by || "—"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Assigned To
                  </Label>
                  <p className="font-medium">{selectedRecord.assigned_to || "—"}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm text-muted-foreground">Started</Label>
                  <p className="font-medium">
                    {selectedRecord.started_at
                      ? new Date(selectedRecord.started_at).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Completed</Label>
                  <p className="font-medium">
                    {selectedRecord.completed_at
                      ? new Date(selectedRecord.completed_at).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Hours and Cost */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Labor Hours
                  </Label>
                  <p className="font-medium">
                    {selectedRecord.labor_hours ? selectedRecord.labor_hours + " hrs" : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Downtime Hours
                  </Label>
                  <p className="font-medium">
                    {selectedRecord.downtime_hours ? selectedRecord.downtime_hours + " hrs" : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total Cost</Label>
                  <p className="font-medium text-lg">
                    ${selectedRecord.cost ? selectedRecord.cost.toFixed(2) : "0.00"}
                  </p>
                </div>
              </div>

              {/* Descriptions */}
              {selectedRecord.failure_description && (
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground">
                    Failure Description
                  </Label>
                  <p className="font-medium mt-2 p-3 bg-muted rounded">
                    {selectedRecord.failure_description}
                  </p>
                </div>
              )}

              {selectedRecord.root_cause && (
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground">Root Cause</Label>
                  <p className="font-medium mt-2 p-3 bg-muted rounded">
                    {selectedRecord.root_cause}
                  </p>
                </div>
              )}

              {selectedRecord.corrective_action && (
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground">
                    Corrective Action
                  </Label>
                  <p className="font-medium mt-2 p-3 bg-muted rounded">
                    {selectedRecord.corrective_action}
                  </p>
                </div>
              )}

              {selectedRecord.notes && (
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground">Notes</Label>
                  <p className="font-medium mt-2 p-3 bg-muted rounded">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceRecords;
```

---

### 2. **src/App.tsx** (MODIFICADO - ARCHIVO COMPLETO)

```typescript
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

---

### 3. **src/components/Layout.tsx** (MODIFICADO - SECCIÓN NAVITEMS)

En el componente Layout, reemplaza la sección `navItems` con:

```typescript
const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/machine", icon: Cog, label: "Machine" },
  { to: "/parts", icon: Package, label: "Parts Inventory" },
  { to: "/maintenance", icon: Wrench, label: "New Maintenance" },
  { to: "/maintenance-records", icon: Wrench, label: "Maintenance Records" },
  { to: "/preventive", icon: Calendar, label: "Preventive" },
  { to: "/predictive", icon: Activity, label: "Predictive" },
  { to: "/schedule", icon: Calendar, label: "Schedule" },
  { to: "/vendors", icon: Users, label: "Vendors" },
  { to: "/purchases", icon: ShoppingCart, label: "Purchases" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
];
```

---

## Características Incluidas

✅ **Tabla de mantenimiento** - Muestra todos los registros de maintenance_records
✅ **Búsqueda** - Filtra por work order, tipo y estado
✅ **Resumen** - Tarjetas con conteos de pending, in progress y completed
✅ **Colores dinámicos** - Badges con colores según prioridad y estado
✅ **Modal de detalle** - Vista completa de un registro al hacer clic en "View"
✅ **Integración Supabase** - Usa select() para traer datos
✅ **Menú lateral** - Agregado "Maintenance Records" en el navegador
✅ **Responsive** - Usa Tailwind + shadcn/ui
✅ **Sin romper nada** - Compatible con el sistema existente

---

## Cómo Usar

1. Los registros se crean desde la página "New Maintenance"
2. Ve a "Maintenance Records" en el menú lateral
3. Busca por work order, tipo o estado
4. Haz clic en "View" para ver detalles completos
5. El modal muestra todos los datos incluyendo descripciones y costos

---

## Build Status

✅ Compilación exitosa - Sin errores de TypeScript
✅ Servidor dev ejecutándose en puerto 8082
✅ Todos los imports resueltos
✅ Routes configuradas correctamente
