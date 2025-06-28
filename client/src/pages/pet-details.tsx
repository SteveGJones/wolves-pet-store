import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, Mail, ArrowLeft, MapPin, Calendar, Ruler, Palette, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/navbar";
import InquiryForm from "@/components/inquiry-form";
import type { Pet } from "@shared/schema";

export default function PetDetails() {
  const params = useParams();
  const petId = params.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const { data: pet, isLoading } = useQuery<Pet>({
    queryKey: ["/api/pets", petId],
    queryFn: async () => {
      const response = await fetch(`/api/pets/${petId}`);
      if (!response.ok) {
        throw new Error("Pet not found");
      }
      return response.json();
    },
    enabled: petId > 0,
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ petId }),
      });
      if (!response.ok) {
        throw new Error("Failed to add to wishlist");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to Wishlist",
        description: `${pet?.name} has been added to your wishlist!`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign In Required",
          description: "Please sign in to add pets to your wishlist.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add to wishlist",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-96 bg-gray-200 skeleton"></div>
            <div className="p-8">
              <div className="h-8 bg-gray-200 rounded mb-4 skeleton"></div>
              <div className="h-4 bg-gray-200 rounded mb-6 skeleton"></div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="h-20 bg-gray-200 rounded skeleton"></div>
                <div className="h-20 bg-gray-200 rounded skeleton"></div>
              </div>
              <div className="h-32 bg-gray-200 rounded skeleton"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pet Not Found</h2>
              <p className="text-gray-600 mb-6">The pet you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => window.history.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const mainImage = pet.imageUrls?.[0] || `https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=600&fit=crop`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pets
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pet Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={mainImage}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            </div>
            {pet.imageUrls && pet.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {pet.imageUrls.slice(1, 5).map((url, index) => (
                  <div key={index} className="aspect-square rounded-md overflow-hidden bg-gray-100">
                    <img
                      src={url}
                      alt={`${pet.name} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pet Information */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
                <Badge
                  variant={
                    pet.status === "available" ? "default" :
                    pet.status === "pending" ? "secondary" : 
                    "outline"
                  }
                  className="text-sm"
                >
                  {pet.status}
                </Badge>
              </div>
              <p className="text-xl text-gray-600 mb-4">{pet.breed}</p>
              <p className="text-2xl font-bold text-wolves-gold">
                ${pet.adoptionFee} adoption fee
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Age</p>
                      <p className="font-semibold">{pet.age || "Unknown"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Ruler className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Size</p>
                      <p className="font-semibold">{pet.size || "Unknown"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Palette className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Color</p>
                      <p className="font-semibold">{pet.color || "Unknown"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Gender</p>
                      <p className="font-semibold">{pet.gender || "Unknown"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <InquiryForm petId={pet.id} petName={pet.name}>
                <Button 
                  size="lg" 
                  className="flex-1 bg-wolves-gold text-wolves-black hover:bg-yellow-400"
                  disabled={pet.status !== "available"}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Inquire About {pet.name}
                </Button>
              </InquiryForm>

              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => addToWishlistMutation.mutate()}
                  disabled={addToWishlistMutation.isPending}
                  className="border-wolves-gold text-wolves-gold hover:bg-wolves-gold hover:text-wolves-black"
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Add to Wishlist
                </Button>
              )}
            </div>

            {/* Medical Info */}
            <div className="flex space-x-4">
              {pet.isVaccinated && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Vaccinated
                </Badge>
              )}
              {pet.isNeutered && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Spayed/Neutered
                </Badge>
              )}
            </div>

            {/* Tags */}
            {pet.tags && pet.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pet.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Information */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {pet.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About {pet.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{pet.description}</p>
                </CardContent>
              </Card>
            )}

            {pet.temperament && (
              <Card>
                <CardHeader>
                  <CardTitle>Temperament</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{pet.temperament}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {pet.medicalHistory && (
              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm leading-relaxed">{pet.medicalHistory}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Quick Facts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Added:</span>
                  <span className="font-medium">
                    {pet.dateAdded ? new Date(pet.dateAdded).toLocaleDateString() : "Unknown"}
                  </span>
                </div>
                {pet.dateAdopted && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Adopted:</span>
                    <span className="font-medium">
                      {new Date(pet.dateAdopted).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
