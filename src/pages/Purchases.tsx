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
import { ShoppingCart, Plus, Package } from "lucide-react";
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

interface PurchaseOrder {
  id: string;
  po_number: string;
  order_date: string;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  status: string;
  quantity: number;
  unit_price: number;
  total_price: number | null;
  notes: string | null;
  part_id: string | null;
  vendor_id: string | null;
}

const Purchases = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .order("order_date", { ascending: false });

      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });

  const { data: parts } = useQuery({
    queryKey: ["parts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parts").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*");
      if (error) throw error;
      return data;
    },
  });

  const createPOMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const quantity = parseInt(formData.get("quantity") as string);
      const unitPrice = parseFloat(formData.get("unit_price") as string);

      const payload = {
        po_number: formData.get("po_number") as string,
        order_date: formData.get("order_date") as string,
        expected_delivery_date: formData.get("expected_delivery_date") as string,
        status: "pending",
        quantity,
        unit_price: unitPrice,
        part_id: selectedPartId,
        vendor_id: selectedVendorId,
        notes: formData.get("notes") as string,
      };

      const sanitized = sanitizePayload(payload);

      const { error } = await supabase
        .from("purchase_orders")
        .insert([sanitized]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({ title: "Purchase order created successfully" });
      setIsDialogOpen(false);
      setSelectedPartId("");
      setSelectedVendorId("");
    },
    onError: () => {
      toast({
        title: "Error creating purchase order",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      if (status === "delivered") {
        updateData.actual_delivery_date = new Date().toISOString().split("T")[0];
      }

      const sanitized = sanitizePayload(updateData);

      const { error } = await supabase
        .from("purchase_orders")
        .update(sanitized)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({ title: "Status updated successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedPartId || !selectedVendorId) {
      toast({
        title: "Missing information",
        description: "Please select both a part and a vendor",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    createPOMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "ordered":
        return "default";
      case "delivered":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  const pendingOrders = purchaseOrders?.filter((po) => po.status === "pending") || [];
  const totalPending = pendingOrders.reduce(
    (sum, po) => sum + (po.total_price || 0),
    0
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            Purchase Orders
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage parts ordering and procurement
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New PO
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="po_number">PO Number</Label>
                <Input
                  id="po_number"
                  name="po_number"
                  required
                  placeholder="PO-2024-001"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="part_id">Part</Label>
                  <Select value={selectedPartId} onValueChange={setSelectedPartId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select part" />
                    </SelectTrigger>
                    <SelectContent>
                      {parts?.map((part) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vendor_id">Vendor</Label>
                  <Select value={selectedVendorId} onValueChange={setSelectedVendorId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors?.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="unit_price">Unit Price ($)</Label>
                  <Input
                    id="unit_price"
                    name="unit_price"
                    type="number"
                    step="0.01"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="order_date">Order Date</Label>
                  <Input
                    id="order_date"
                    name="order_date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="expected_delivery_date">
                    Expected Delivery
                  </Label>
                  <Input
                    id="expected_delivery_date"
                    name="expected_delivery_date"
                    type="date"
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
                <Button type="submit">Create PO</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {pendingOrders.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pending Orders Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold">{pendingOrders.length} orders</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalPending.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {purchaseOrders?.map((po) => (
          <Card key={po.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {po.po_number}
                    <Badge variant={getStatusColor(po.status)}>{po.status}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ordered: {new Date(po.order_date).toLocaleDateString()}
                  </p>
                </div>
                <Select
                  value={po.status}
                  onValueChange={(value) =>
                    updateStatusMutation.mutate({ id: po.id, status: value })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="ordered">Ordered</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{po.quantity} units</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unit Price</p>
                  <p className="font-medium">${po.unit_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium">
                    ${(po.total_price || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {po.actual_delivery_date ? "Delivered" : "Expected"}
                  </p>
                  <p className="font-medium">
                    {po.actual_delivery_date
                      ? new Date(po.actual_delivery_date).toLocaleDateString()
                      : po.expected_delivery_date
                      ? new Date(po.expected_delivery_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              {po.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">{po.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {purchaseOrders?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No purchase orders yet.
                <br />
                Create your first order to start managing procurement.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Purchases;
