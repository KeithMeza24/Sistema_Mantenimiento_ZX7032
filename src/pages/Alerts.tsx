import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitizePayload } from "@/lib/sanitizePayload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  alert_type: string;
  is_read: boolean | null;
  is_resolved: boolean | null;
  created_at: string | null;
  resolved_at: string | null;
}

const Alerts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Alert[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const payload = {
        is_resolved: true,
      };
      const sanitized = sanitizePayload(payload);
      const { error } = await supabase
        .from("alerts")
        .update(sanitized)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast({ title: "Alert resolved" });
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "info":
        return <Info className="h-5 w-5 text-primary" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "warning":
        return "outline";
      case "info":
        return "secondary";
      default:
        return "default";
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  const unresolvedAlerts = alerts?.filter((a) => !a.is_resolved) || [];
  const resolvedAlerts = alerts?.filter((a) => a.is_resolved) || [];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8" />
          Alerts & Notifications
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage system alerts and maintenance notifications
        </p>
      </div>

      {unresolvedAlerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Active Alerts ({unresolvedAlerts.length})
          </h2>
          <div className="grid gap-4">
            {unresolvedAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={!alert.is_read ? "border-primary" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          {!alert.is_read && (
                            <Badge variant="default">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {alert.created_at &&
                            new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!alert.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsReadMutation.mutate(alert.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveAlertMutation.mutate(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {resolvedAlerts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Resolved Alerts ({resolvedAlerts.length})
          </h2>
          <div className="grid gap-4">
            {resolvedAlerts.map((alert) => (
              <Card key={alert.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge variant="outline">Resolved</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Resolved:{" "}
                          {alert.resolved_at &&
                            new Date(alert.resolved_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {alerts?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No alerts at this time.
              <br />
              All systems operating normally.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Alerts;
