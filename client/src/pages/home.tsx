import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Heart, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import PetCard from "@/components/pet-card";
import SearchFilters from "@/components/search-filters";
import type { Pet, PetCategory, Wishlist } from "@shared/schema";

export default function Home() {
  const [searchFilters, setSearchFilters] = useState({
    categoryId: undefined as number | undefined,
    age: "",
    size: "",
    search: "",
  });

  const { data: pets = [], isLoading: petsLoading } = useQuery<Pet[]>({
    queryKey: ["/api/pets", searchFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      const response = await fetch(`/api/pets?${params}`);
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery<PetCategory[]>({
    queryKey: ["/api/pet-categories"],
  });

  const { data: wishlist = [] } = useQuery<(Wishlist & { pet: Pet })[]>({
    queryKey: ["/api/wishlist"],
  });

  const availablePets = pets.filter(pet => pet.status === "available");
  const wishlistPetIds = new Set(wishlist.map(item => item.petId));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-wolves-black to-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Welcome to Your Pet Journey
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Discover amazing pets and manage your favorites
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-wolves-gold text-wolves-black hover:bg-yellow-400 font-semibold"
              >
                <Search className="mr-2 h-5 w-5" />
                Browse All Pets
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-wolves-gold text-wolves-gold hover:bg-wolves-gold hover:text-wolves-black"
              >
                <Heart className="mr-2 h-5 w-5" />
                My Wishlist ({wishlist.length})
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Section */}
      <SearchFilters 
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        categories={categories}
      />

      {/* Pet Listings */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Available Pets
            </h2>
            <p className="text-gray-600">
              {availablePets.length} pets available for adoption
            </p>
          </div>

          {petsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-64 bg-gray-200 skeleton"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-3 skeleton"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 skeleton"></div>
                    <div className="h-16 bg-gray-200 rounded mb-4 skeleton"></div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-10 bg-gray-200 rounded skeleton"></div>
                      <div className="w-10 h-10 bg-gray-200 rounded skeleton"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availablePets.map((pet) => (
                <PetCard 
                  key={pet.id} 
                  pet={pet} 
                  isInWishlist={wishlistPetIds.has(pet.id)}
                />
              ))}
            </div>
          )}

          {!petsLoading && availablePets.length === 0 && (
            <div className="text-center py-12">
              <PawPrint className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No pets found</h3>
              <p className="text-gray-600">Try adjusting your search filters.</p>
            </div>
          )}
        </div>
      </section>

      {/* Wishlist Section */}
      {wishlist.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Your Wishlist
              </h2>
              <p className="text-gray-600">
                {wishlist.length} pets in your favorites
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {wishlist.map((item) => (
                <PetCard 
                  key={item.pet.id} 
                  pet={item.pet} 
                  isInWishlist={true}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
