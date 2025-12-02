import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitizePayload } from "@/lib/sanitizePayload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PreventiveSchedule {
  id: string;
  schedule_name: string;
  description: string | null;
  frequency_type: string;
  frequency_value: number;
  next_due_date: string;
  last_performed_date: string | null;
  assigned_to: string | null;
  is_active: boolean | null;
  estimated_duration_hours: number | null;
  checklist_items: string[] | null;
}

const Preventive = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PreventiveSchedule | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["preventive-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("preventive_schedules")
        .select("*")
        .order("next_due_date", { ascending: true });

      if (error) throw error;
      return data as PreventiveSchedule[];
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

  const createScheduleMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const checklistText = formData.get("checklist_items") as string;
      const checklistItems = checklistText
        ? checklistText.split("\n").filter((item) => item.trim())
        : null;

      const payload = {
        machine_id: machine?.id,
        schedule_name: formData.get("schedule_name") as string,
        description: formData.get("description") as string,
        frequency_type: formData.get("frequency_type") as string,
        frequency_value: parseInt(formData.get("frequency_value") as string),
        next_due_date: formData.get("next_due_date") as string,
        assigned_to: formData.get("assigned_to") as string,
        estimated_duration_hours: parseFloat(
          formData.get("estimated_duration_hours") as string
        ),
        checklist_items: checklistItems,
      };

      const sanitized = sanitizePayload(payload);

      const { error } = await supabase
        .from("preventive_schedules")
        .insert([sanitized]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preventive-schedules"] });
      toast({ title: "Preventive schedule created successfully" });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error creating schedule",
        variant: "destructive",
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("preventive_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preventive-schedules"] });
      toast({ title: "Schedule deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createScheduleMutation.mutate(formData);
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Preventive Maintenance
          </h1>
          <p className="text-muted-foreground mt-2">
            Schedule and manage preventive maintenance tasks
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Preventive Schedule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="schedule_name">Schedule Name</Label>
                <Input
                  id="schedule_name"
                  name="schedule_name"
                  required
                  placeholder="e.g., Monthly Filter Change"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the maintenance task"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency_type">Frequency Type</Label>
                  <Select name="frequency_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="frequency_value">Every</Label>
                  <Input
                    id="frequency_value"
                    name="frequency_value"
                    type="number"
                    required
                    min="1"
                    defaultValue="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="next_due_date">Next Due Date</Label>
                  <Input
                    id="next_due_date"
                    name="next_due_date"
                    type="date"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_duration_hours">
                    Estimated Duration (hours)
                  </Label>
                  <Input
                    id="estimated_duration_hours"
                    name="estimated_duration_hours"
                    type="number"
                    step="0.5"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Input
                  id="assigned_to"
                  name="assigned_to"
                  placeholder="Technician name"
                />
              </div>
              <div>
                <Label htmlFor="checklist_items">
                  Checklist Items (one per line)
                </Label>
                <Textarea
                  id="checklist_items"
                  name="checklist_items"
                  placeholder="Check oil levels&#10;Clean filters&#10;Inspect belts"
                  rows={6}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Schedule</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {schedules?.map((schedule) => (
          <Card key={schedule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {schedule.schedule_name}
                    {schedule.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {schedule.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <p className="font-medium">
                    Every {schedule.frequency_value} {schedule.frequency_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Due</p>
                  <p className="font-medium">
                    {new Date(schedule.next_due_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium">
                    {schedule.assigned_to || "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {schedule.estimated_duration_hours
                      ? `${schedule.estimated_duration_hours}h`
                      : "N/A"}
                  </p>
                </div>
              </div>
              {schedule.checklist_items && schedule.checklist_items.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Checklist:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {schedule.checklist_items.map((item, idx) => (
                      <li key={idx} className="text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {schedules?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No preventive maintenance schedules yet.
                <br />
                Create your first schedule to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Preventive;
