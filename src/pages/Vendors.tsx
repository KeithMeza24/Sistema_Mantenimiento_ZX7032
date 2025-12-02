import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitizePayload } from "@/lib/sanitizePayload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Mail, Phone, MapPin, Globe, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Vendor {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  is_active: boolean | null;
  notes: string | null;
}

const Vendors = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Vendor[];
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const payload = {
        name: formData.get("name") as string,
        contact_person: formData.get("contact_person") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string,
        website: formData.get("website") as string,
        notes: formData.get("notes") as string,
      };
      const sanitized = sanitizePayload(payload);
      const { error } = await supabase.from("vendors").insert([sanitized]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({ title: "Vendor created successfully" });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error creating vendor",
        variant: "destructive",
      });
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({ title: "Vendor deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createVendorMutation.mutate(formData);
  };

  const filteredVendors = vendors?.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Vendors
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your supplier and vendor contacts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Vendor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Vendor Name</Label>
                <Input id="name" name="name" required placeholder="Company Name" />
              </div>
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="contact@vendor.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" placeholder="+1 234 567 8900" />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Street, City, State, ZIP"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  placeholder="https://vendor.com"
                />
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
                <Button type="submit">Create Vendor</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors?.map((vendor) => (
          <Card key={vendor.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{vendor.name}</CardTitle>
                  {vendor.contact_person && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {vendor.contact_person}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {vendor.is_active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteVendorMutation.mutate(vendor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vendor.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${vendor.email}`}
                      className="text-primary hover:underline"
                    >
                      {vendor.email}
                    </a>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${vendor.phone}`}
                      className="text-primary hover:underline"
                    >
                      {vendor.phone}
                    </a>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{vendor.address}</span>
                  </div>
                )}
                {vendor.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
                {vendor.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">{vendor.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredVendors?.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {searchTerm
                    ? "No vendors found matching your search"
                    : "No vendors yet. Add your first vendor to get started."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vendors;
