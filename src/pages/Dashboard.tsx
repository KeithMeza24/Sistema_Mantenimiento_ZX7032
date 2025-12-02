import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import KPICard from "@/components/KPICard";
import { Activity, Clock, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { toast } = useToast();
  const [kpis, setKpis] = useState({
    mtbf: "0 hrs",
    mttr: "0 hrs",
    availability: "0%",
    totalCost: "$0",
    activeAlerts: 0,
  });

  useEffect(() => {
    calculateKPIs();
  }, []);

  const calculateKPIs = async () => {
    try {
      // Fetch maintenance records
      const { data: maintenanceRecords, error: maintenanceError } = await supabase
        .from("maintenance_records")
        .select("*")
        .eq("status", "completed");

      if (maintenanceError) throw maintenanceError;

      // Fetch active alerts
      const { data: alerts, error: alertsError } = await supabase
        .from("alerts")
        .select("*")
        .eq("is_resolved", false);

      if (alertsError) throw alertsError;

      if (maintenanceRecords && maintenanceRecords.length > 0) {
        // Calculate MTBF (Mean Time Between Failures)
        const failures = maintenanceRecords.filter(r => r.maintenance_type === 'corrective');
        const totalDowntime = maintenanceRecords.reduce((sum, r) => sum + (r.downtime_hours || 0), 0);
        const avgDowntime = failures.length > 0 ? totalDowntime / failures.length : 0;
        
        // Calculate MTTR (Mean Time To Repair)
        const repairTimes = maintenanceRecords
          .filter(r => r.started_at && r.completed_at)
          .map(r => {
            const start = new Date(r.started_at!);
            const end = new Date(r.completed_at!);
            return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
          });
        const avgRepairTime = repairTimes.length > 0 
          ? repairTimes.reduce((sum, time) => sum + time, 0) / repairTimes.length 
          : 0;

        // Calculate availability
        const totalTime = 24 * 365; // hours in a year
        const availability = ((totalTime - totalDowntime) / totalTime) * 100;

        // Calculate total costs
        const totalCost = maintenanceRecords.reduce((sum, r) => sum + (r.cost || 0), 0);

        setKpis({
          mtbf: failures.length > 1 ? `${(totalTime / failures.length).toFixed(1)} hrs` : "N/A",
          mttr: `${avgRepairTime.toFixed(1)} hrs`,
          availability: `${availability.toFixed(1)}%`,
          totalCost: `$${totalCost.toLocaleString()}`,
          activeAlerts: alerts?.length || 0,
        });
      } else {
        setKpis({
          mtbf: "No data",
          mttr: "No data",
          availability: "No data",
          totalCost: "$0",
          activeAlerts: alerts?.length || 0,
        });
      }
    } catch (error) {
      console.error("Error calculating KPIs:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          General description of milling machine maintenance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <KPICard
          title="MTBF"
          value={kpis.mtbf}
          subtitle="Mean Time Between Failures"
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <KPICard
          title="MTTR"
          value={kpis.mttr}
          subtitle="Mean Time To Repair"
          icon={<Clock className="h-6 w-6" />}
        />
        <KPICard
          title="Availability"
          value={kpis.availability}
          subtitle="Equipment Uptime"
          icon={<Activity className="h-6 w-6" />}
        />
        <KPICard
          title="Total Costs"
          value={kpis.totalCost}
          subtitle="Maintenance Expenses"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <KPICard
          title="Active Alerts"
          value={kpis.activeAlerts}
          subtitle="Requires Attention"
          icon={<AlertCircle className="h-6 w-6" />}
          className={kpis.activeAlerts > 0 ? "border-warning" : ""}
        />
      </div>

      {/* Info Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <p className="text-muted-foreground">
          {kpis.mtbf === "No data" || kpis.mtbf === "0 hrs"
            ? "No maintenance records yet. Use 'New Maintenance' to record failures and repairs. KPIs will populate automatically as you enter data."
            : "System is operational. All KPIs are calculated from maintenance records."}
        </p>
      </Card>
    </div>
  );
};

export default Dashboard;
