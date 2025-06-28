import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Eye, Trash, PawPrint, Home, Mail, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/navbar";
import AdminPetForm from "@/components/admin-pet-form";
import type { Pet, PetCategory, Inquiry } from "@shared/schema";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showPetForm, setShowPetForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !user.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/dashboard-stats"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const { data: pets = [], isLoading: petsLoading } = useQuery<(Pet & { category: PetCategory })[]>({
    queryKey: ["/api/admin/pets"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery<(Inquiry & { pet?: Pet })[]>({
    queryKey: ["/api/admin/inquiries"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const deletePetMutation = useMutation({
    mutationFn: async (petId: number) => {
      const response = await fetch(`/api/pets/${petId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to delete pet");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard-stats"] });
      toast({
        title: "Success",
        description: "Pet deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete pet",
        variant: "destructive",
      });
    },
  });

  const updateInquiryMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update inquiry");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard-stats"] });
      toast({
        title: "Success",
        description: "Inquiry updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update inquiry",
        variant: "destructive",
      });
    },
  });

  const filteredPets = pets.filter(pet => {
    const matchesSearch = !searchTerm || 
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || pet.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-wolves-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage pets, inquiries, and store operations</p>
            </div>
            <Button 
              onClick={() => setShowPetForm(true)}
              className="bg-wolves-gold text-wolves-black hover:bg-yellow-400"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Pet
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PawPrint className="text-blue-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalPets || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Home className="text-green-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Adopted This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.adoptedThisMonth || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Mail className="text-yellow-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Inquiries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pendingInquiries || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-wolves-gold/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-wolves-gold h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue This Month</p>
                  <p className="text-2xl font-bold text-gray-900">${stats?.revenueThisMonth || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="pets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pets">Pet Management</TabsTrigger>
            <TabsTrigger value="inquiries">Customer Inquiries</TabsTrigger>
          </TabsList>

          {/* Pet Management Tab */}
          <TabsContent value="pets">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Pet Inventory</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search pets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Status</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="adopted">Adopted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {petsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-wolves-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading pets...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pet</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPets.map((pet) => (
                        <TableRow key={pet.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage 
                                  src={pet.imageUrls?.[0] || `https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop`}
                                  alt={pet.name}
                                />
                                <AvatarFallback>{pet.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{pet.name}</div>
                                <div className="text-sm text-gray-500">{pet.breed}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{pet.category?.name || "Unknown"}</TableCell>
                          <TableCell>{pet.age}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                pet.status === "available" ? "default" :
                                pet.status === "pending" ? "secondary" : 
                                "outline"
                              }
                            >
                              {pet.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {pet.dateAdded ? new Date(pet.dateAdded).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingPet(pet);
                                  setShowPetForm(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`/pets/${pet.id}`, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deletePetMutation.mutate(pet.id)}
                                disabled={deletePetMutation.isPending}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Inquiries Tab */}
          <TabsContent value="inquiries">
            <Card>
              <CardHeader>
                <CardTitle>Recent Customer Inquiries</CardTitle>
              </CardHeader>
              <CardContent>
                {inquiriesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-wolves-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading inquiries...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <div key={inquiry.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{inquiry.customerName}</h4>
                              {inquiry.pet && (
                                <Badge variant="outline">
                                  Interested in {inquiry.pet.name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{inquiry.customerEmail}</p>
                            <p className="text-sm text-gray-700">{inquiry.message}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-2">
                              {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : "N/A"}
                            </p>
                            <div className="flex gap-2">
                              <Select
                                value={inquiry.status}
                                onValueChange={(status) => updateInquiryMutation.mutate({ id: inquiry.id, status })}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="replied">Replied</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {inquiries.length === 0 && (
                      <div className="text-center py-8">
                        <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No inquiries</h3>
                        <p className="text-gray-600">No customer inquiries to display.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Pet Form Modal */}
      {showPetForm && (
        <AdminPetForm
          pet={editingPet}
          onClose={() => {
            setShowPetForm(false);
            setEditingPet(null);
          }}
        />
      )}
    </div>
  );
}
