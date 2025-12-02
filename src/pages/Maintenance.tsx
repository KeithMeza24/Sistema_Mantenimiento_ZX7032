import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizePayload, sanitizePayloadArray } from "@/lib/sanitizePayload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface Part {
  id: string;
  part_number: string;
  name: string;
  unit_cost: number;
}

const Maintenance = () => {
  const { toast } = useToast();
  const [machineId, setMachineId] = useState<string>("");
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedParts, setSelectedParts] = useState<{ partId: string; quantity: number }[]>([]);
  const [formData, setFormData] = useState({
    work_order_number: `WO-${Date.now()}`,
    maintenance_type: "corrective",
    priority: "medium",
    failure_description: "",
    root_cause: "",
    corrective_action: "",
    labor_hours: "",
    downtime_hours: "",
    reported_by: "",
    assigned_to: "",
    started_at: "",
    completed_at: "",
    notes: "",
  });

  useEffect(() => {
    fetchMachine();
    fetchParts();
  }, []);

  const fetchMachine = async () => {
    try {
      const { data, error } = await supabase
        .from("machine")
        .select("id")
        .single();
      
      if (error) throw error;
      setMachineId(data.id);
    } catch (error) {
      console.error("Error fetching machine:", error);
    }
  };

  const fetchParts = async () => {
    try {
      const { data, error } = await supabase
        .from("parts")
        .select("id, part_number, name, unit_cost")
        .order("name");

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error("Error fetching parts:", error);
    }
  };

  const handleAddPart = () => {
    setSelectedParts([...selectedParts, { partId: "", quantity: 1 }]);
  };

  const handleRemovePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const handlePartChange = (index: number, field: string, value: string | number) => {
    const updated = [...selectedParts];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedParts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!machineId) {
      toast({
        title: "Error",
        description: "Machine not found",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate total cost from parts
      let partsCost = 0;
      for (const sp of selectedParts) {
        if (sp.partId) {
          const part = parts.find(p => p.id === sp.partId);
          if (part) {
            partsCost += part.unit_cost * sp.quantity;
          }
        }
      }

      // Insert maintenance record
      const maintenancePayload = {
        machine_id: machineId,
        work_order_number: formData.work_order_number,
        maintenance_type: formData.maintenance_type,
        priority: formData.priority,
        status: formData.completed_at ? "completed" : "in_progress",
        failure_description: formData.failure_description,
        root_cause: formData.root_cause || null,
        corrective_action: formData.corrective_action || null,
        labor_hours: formData.labor_hours ? parseFloat(formData.labor_hours) : null,
        downtime_hours: formData.downtime_hours ? parseFloat(formData.downtime_hours) : null,
        cost: partsCost,
        reported_by: formData.reported_by || null,
        assigned_to: formData.assigned_to || null,
        started_at: formData.started_at || null,
        completed_at: formData.completed_at || null,
        notes: formData.notes || null,
      };

      const sanitizedMaintenance = sanitizePayload(maintenancePayload);

      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from("maintenance_records")
        .insert([sanitizedMaintenance])
        .select()
        .single();

      if (maintenanceError) throw maintenanceError;

      // Insert parts used
      if (selectedParts.length > 0) {
        const partsToInsert = selectedParts
          .filter(sp => sp.partId)
          .map(sp => {
            const part = parts.find(p => p.id === sp.partId);
            return {
              maintenance_record_id: maintenanceData.id,
              part_id: sp.partId,
              quantity_used: sp.quantity,
              cost_per_unit: part?.unit_cost || 0,
            };
          });

        if (partsToInsert.length > 0) {
          const sanitizedParts = sanitizePayloadArray(partsToInsert);
          const { error: partsError } = await supabase
            .from("maintenance_parts_used")
            .insert(sanitizedParts);

          if (partsError) throw partsError;

          // Update inventory
          for (const sp of selectedParts) {
            if (sp.partId) {
              const { data: inventory } = await supabase
                .from("part_inventory")
                .select("*")
                .eq("part_id", sp.partId)
                .single();

              if (inventory) {
                const invPayload = {
                  quantity_on_hand: Math.max(0, inventory.quantity_on_hand - sp.quantity),
                };
                const sanitizedInv = sanitizePayload(invPayload);
                
                await supabase
                  .from("part_inventory")
                  .update(sanitizedInv)
                  .eq("id", inventory.id);
              }
            }
          }
        }
      }

      toast({
        title: "Success",
        description: "Maintenance record created successfully",
      });

      // Reset form
      setFormData({
        work_order_number: `WO-${Date.now()}`,
        maintenance_type: "corrective",
        priority: "medium",
        failure_description: "",
        root_cause: "",
        corrective_action: "",
        labor_hours: "",
        downtime_hours: "",
        reported_by: "",
        assigned_to: "",
        started_at: "",
        completed_at: "",
        notes: "",
      });
      setSelectedParts([]);
    } catch (error) {
      console.error("Error creating maintenance record:", error);
      toast({
        title: "Error",
        description: "Failed to create maintenance record",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New Maintenance</h1>
        <p className="text-muted-foreground mt-2">
          Record failures, repairs, and parts used
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Work Order Number</Label>
              <Input
                value={formData.work_order_number}
                onChange={(e) => setFormData({ ...formData, work_order_number: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Maintenance Type</Label>
              <Select
                value={formData.maintenance_type}
                onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrective">Corrective (Failure)</SelectItem>
                  <SelectItem value="preventive">Preventive</SelectItem>
                  <SelectItem value="predictive">Predictive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Failure & Action Details */}
          <div className="space-y-4">
            <div>
              <Label>Failure Description *</Label>
              <Textarea
                value={formData.failure_description}
                onChange={(e) => setFormData({ ...formData, failure_description: e.target.value })}
                placeholder="Describe the failure or maintenance needed..."
                required
              />
            </div>
            <div>
              <Label>Root Cause</Label>
              <Textarea
                value={formData.root_cause}
                onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                placeholder="What caused the failure?"
              />
            </div>
            <div>
              <Label>Corrective Action</Label>
              <Textarea
                value={formData.corrective_action}
                onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
                placeholder="What was done to fix it?"
              />
            </div>
          </div>

          {/* Time & Personnel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Labor Hours</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.labor_hours}
                onChange={(e) => setFormData({ ...formData, labor_hours: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Downtime Hours</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.downtime_hours}
                onChange={(e) => setFormData({ ...formData, downtime_hours: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Reported By</Label>
              <Input
                value={formData.reported_by}
                onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
                placeholder="Name"
              />
            </div>
            <div>
              <Label>Assigned To</Label>
              <Input
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                placeholder="Technician name"
              />
            </div>
            <div>
              <Label>Started At</Label>
              <Input
                type="datetime-local"
                value={formData.started_at}
                onChange={(e) => setFormData({ ...formData, started_at: e.target.value })}
              />
            </div>
            <div>
              <Label>Completed At</Label>
              <Input
                type="datetime-local"
                value={formData.completed_at}
                onChange={(e) => setFormData({ ...formData, completed_at: e.target.value })}
              />
            </div>
          </div>

          {/* Parts Used */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg">Parts Used</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddPart}>
                <Plus className="h-4 w-4 mr-2" />
                Add Part
              </Button>
            </div>
            {selectedParts.map((sp, index) => (
              <div key={index} className="flex gap-2">
                <Select
                  value={sp.partId}
                  onValueChange={(value) => handlePartChange(index, "partId", value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select part..." />
                  </SelectTrigger>
                  <SelectContent>
                    {parts.map((part) => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.part_number} - {part.name} (${part.unit_cost})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  value={sp.quantity}
                  onChange={(e) => handlePartChange(index, "quantity", parseInt(e.target.value))}
                  className="w-24"
                  placeholder="Qty"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePart(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <Label>Additional Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Create Maintenance Record</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Maintenance;