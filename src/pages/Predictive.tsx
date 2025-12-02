import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitizePayload } from "@/lib/sanitizePayload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Plus, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface SensorReading {
  id: string;
  sensor_name: string;
  sensor_type: string;
  reading_value: number;
  unit: string;
  threshold_min: number | null;
  threshold_max: number | null;
  is_alarm: boolean | null;
  reading_timestamp: string;
  notes: string | null;
}

const Predictive = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sensorType, setSensorType] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: readings, isLoading } = useQuery({
    queryKey: ["sensor-readings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sensor_readings")
        .select("*")
        .order("reading_timestamp", { ascending: false });

      if (error) throw error;
      return data as SensorReading[];
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

  const createReadingMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const readingValue = parseFloat(formData.get("reading_value") as string);
      const thresholdMin = formData.get("threshold_min") as string;
      const thresholdMax = formData.get("threshold_max") as string;

      const minVal = thresholdMin ? parseFloat(thresholdMin) : null;
      const maxVal = thresholdMax ? parseFloat(thresholdMax) : null;

      let isAlarm = false;
      if (minVal !== null && readingValue < minVal) isAlarm = true;
      if (maxVal !== null && readingValue > maxVal) isAlarm = true;

      const payload = {
        machine_id: machine?.id,
        sensor_name: formData.get("sensor_name") as string,
        sensor_type: sensorType,
        reading_value: readingValue,
        unit: formData.get("unit") as string,
        threshold_min: minVal,
        threshold_max: maxVal,
        is_alarm: isAlarm,
        notes: formData.get("notes") as string,
      };

      const sanitized = sanitizePayload(payload);
      console.log("Inserting sensor reading:", sanitized);

      const { data, error } = await supabase
        .from("sensor_readings")
        .insert([sanitized])
        .select();

      if (error) {
        console.error("Supabase sensor_readings insert error:", error);
        throw new Error(error.message || "Failed to insert sensor reading");
      }

      console.log("Sensor reading inserted successfully:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sensor-readings"] });
      toast({
        title: "Success",
        description: "Sensor reading recorded successfully",
      });
      setIsDialogOpen(false);
      setSensorType("");
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error recording sensor reading",
        description: error?.message || "Unable to record sensor reading",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createReadingMutation.mutate(formData);
  };

  const getReadingStatus = (reading: SensorReading) => {
    if (reading.is_alarm) return "alarm";
    if (reading.threshold_min && reading.reading_value < reading.threshold_min * 1.1)
      return "warning";
    if (reading.threshold_max && reading.reading_value > reading.threshold_max * 0.9)
      return "warning";
    return "normal";
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  const alarmReadings = readings?.filter((r) => r.is_alarm) || [];
  const latestReadings = readings?.slice(0, 10) || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Predictive Maintenance
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor sensor readings and predict maintenance needs
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Reading
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Sensor Reading</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="sensor_name">Sensor Name</Label>
                <Input
                  id="sensor_name"
                  name="sensor_name"
                  required
                  placeholder="e.g., Bearing Temperature Sensor 1"
                />
              </div>
              <div>
                <Label htmlFor="sensor_type">Sensor Type</Label>
                <Select value={sensorType} onValueChange={setSensorType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temperature">Temperature</SelectItem>
                    <SelectItem value="vibration">Vibration</SelectItem>
                    <SelectItem value="pressure">Pressure</SelectItem>
                    <SelectItem value="humidity">Humidity</SelectItem>
                    <SelectItem value="flow">Flow Rate</SelectItem>
                    <SelectItem value="speed">Speed</SelectItem>
                    <SelectItem value="power">Power Consumption</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reading_value">Reading Value</Label>
                  <Input
                    id="reading_value"
                    name="reading_value"
                    type="number"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    name="unit"
                    required
                    placeholder="e.g., °C, RPM, bar"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="threshold_min">Min Threshold</Label>
                  <Input
                    id="threshold_min"
                    name="threshold_min"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="threshold_max">Max Threshold</Label>
                  <Input
                    id="threshold_max"
                    name="threshold_max"
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Record Reading</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {alarmReadings.length > 0 && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Active Alarms ({alarmReadings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alarmReadings.map((reading) => (
                <div
                  key={reading.id}
                  className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{reading.sensor_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {reading.sensor_type} - {reading.reading_value} {reading.unit}
                    </p>
                  </div>
                  <Badge variant="destructive">Alarm</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sensor Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestReadings.map((reading) => {
                const status = getReadingStatus(reading);
                return (
                  <div
                    key={reading.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{reading.sensor_name}</p>
                        {status === "alarm" && (
                          <Badge variant="destructive">Alarm</Badge>
                        )}
                        {status === "warning" && (
                          <Badge variant="outline" className="border-amber-500 text-amber-500">
                            Warning
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reading.sensor_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {reading.reading_value} {reading.unit}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(reading.reading_timestamp).toLocaleString()}
                      </p>
                      {reading.threshold_min && reading.threshold_max && (
                        <p className="text-xs text-muted-foreground">
                          Range: {reading.threshold_min} - {reading.threshold_max}{" "}
                          {reading.unit}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {latestReadings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No sensor readings yet.
                    <br />
                    Start monitoring your equipment by recording sensor data.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Predictive;
