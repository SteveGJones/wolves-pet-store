import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Heart, Info, Mail } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import InquiryForm from "./inquiry-form";
import type { Pet } from "@shared/schema";

interface PetCardProps {
  pet: Pet;
  isInWishlist?: boolean;
}

export default function PetCard({ pet, isInWishlist = false }: PetCardProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [wishlistState, setWishlistState] = useState(isInWishlist);

  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (wishlistState) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlist/${pet.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to remove from wishlist");
        }
      } else {
        // Add to wishlist
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ petId: pet.id }),
        });
        if (!response.ok) {
          throw new Error("Failed to add to wishlist");
        }
      }
    },
    onSuccess: () => {
      setWishlistState(!wishlistState);
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: wishlistState ? "Removed from Wishlist" : "Added to Wishlist",
        description: `${pet.name} has been ${
          wishlistState ? "removed from" : "added to"
        } your wishlist!`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign In Required",
          description: "Please sign in to manage your wishlist.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    },
  });

  const mainImage = pet.imageUrls?.[0] || `https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=300&fit=crop`;

  return (
    <Card className="overflow-hidden pet-card-hover">
      <div className="relative">
        <img
          src={mainImage}
          alt={pet.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-4 right-4">
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/90 hover:bg-white p-2 rounded-full shadow-md"
              onClick={() => toggleWishlistMutation.mutate()}
              disabled={toggleWishlistMutation.isPending}
            >
              <Heart 
                className={`h-4 w-4 ${
                  wishlistState ? "text-red-500 fill-red-500" : "text-gray-400"
                }`} 
              />
            </Button>
          )}
        </div>
        {pet.status === "available" && (
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-wolves-gold text-wolves-black">
              Available
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
          <span className="text-lg font-semibold text-wolves-gold">
            ${pet.adoptionFee}
          </span>
        </div>

        <p className="text-gray-600 mb-4">
          {pet.breed} • {pet.age || "Age unknown"}
        </p>

        {pet.description && (
          <p className="text-gray-700 mb-4 line-clamp-3">
            {pet.description}
          </p>
        )}

        {/* Tags */}
        {pet.tags && pet.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {pet.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {pet.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{pet.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Link href={`/pets/${pet.id}`}>
            <Button className="flex-1 bg-wolves-gold text-wolves-black hover:bg-yellow-400">
              <Info className="mr-2 h-4 w-4" />
              Learn More
            </Button>
          </Link>

          <InquiryForm petId={pet.id} petName={pet.name}>
            <Button
              variant="outline"
              className="border-wolves-gold text-wolves-gold hover:bg-wolves-gold hover:text-wolves-black"
              disabled={pet.status !== "available"}
            >
              <Mail className="h-4 w-4" />
            </Button>
          </InquiryForm>
        </div>
      </CardContent>
    </Card>
  );
}
