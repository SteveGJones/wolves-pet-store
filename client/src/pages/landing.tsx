import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Heart, ShoppingCart, PawPrint, Fish, Feather, Bone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import PetCard from "@/components/pet-card";
import SearchFilters from "@/components/search-filters";
import type { Pet, PetCategory } from "@shared/schema";

export default function Landing() {
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

  const featuredPets = pets.filter(pet => pet.status === "available").slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-wolves-black to-gray-800 text-white">
        <div className="absolute inset-0 opacity-10 wolves-pattern"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Perfect
              <span className="text-wolves-gold"> Companion</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">
              Premium pet adoption and supplies with the strength of the pack
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-wolves-gold text-wolves-black hover:bg-yellow-400 font-semibold"
              >
                <Search className="mr-2 h-5 w-5" />
                Browse Pets
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-wolves-gold text-wolves-gold hover:bg-wolves-gold hover:text-wolves-black"
                onClick={() => window.location.href = "/api/login"}
              >
                <Heart className="mr-2 h-5 w-5" />
                Sign In for Wishlist
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

      {/* Featured Pets Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Pets
            </h2>
            <p className="text-lg text-gray-600">
              Meet some of our amazing animals looking for loving homes
            </p>
          </div>

          {petsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-64 bg-gray-200 skeleton"></div>
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-3 skeleton"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 skeleton"></div>
                    <div className="h-16 bg-gray-200 rounded mb-4 skeleton"></div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-10 bg-gray-200 rounded skeleton"></div>
                      <div className="w-10 h-10 bg-gray-200 rounded skeleton"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          )}

          {!petsLoading && featuredPets.length === 0 && (
            <div className="text-center py-12">
              <PawPrint className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No pets found</h3>
              <p className="text-gray-600">Try adjusting your search filters.</p>
            </div>
          )}
        </div>
      </section>

      {/* Pet Supplies Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pet Supplies & Accessories
            </h2>
            <p className="text-lg text-gray-600">
              Everything your new companion needs to feel at home
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="text-center p-6 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <div className="w-16 h-16 bg-wolves-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Bone className="text-wolves-black h-8 w-8" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dog Supplies</h3>
              <p className="text-sm text-gray-600">Toys, beds, leashes & more</p>
            </Card>

            <Card className="text-center p-6 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <div className="w-16 h-16 bg-wolves-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Fish className="text-wolves-black h-8 w-8" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cat Supplies</h3>
              <p className="text-sm text-gray-600">Litter, scratchers, toys</p>
            </Card>

            <Card className="text-center p-6 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <div className="w-16 h-16 bg-wolves-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Feather className="text-wolves-black h-8 w-8" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Bird Supplies</h3>
              <p className="text-sm text-gray-600">Cages, perches, food</p>
            </Card>

            <Card className="text-center p-6 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <div className="w-16 h-16 bg-wolves-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <PawPrint className="text-wolves-black h-8 w-8" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Food & Treats</h3>
              <p className="text-sm text-gray-600">Premium nutrition options</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-wolves-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-wolves-gold transform rotate-45 flex items-center justify-center mr-3">
                  <PawPrint className="text-wolves-black transform -rotate-45 h-5 w-5" />
                </div>
                <span className="text-lg font-bold">Wolves Pet Store</span>
              </div>
              <p className="text-gray-300 text-sm">
                Connecting loving families with their perfect companions since 2020.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-wolves-gold transition-colors duration-200">Browse Pets</a></li>
                <li><a href="#" className="hover:text-wolves-gold transition-colors duration-200">Adoption Process</a></li>
                <li><a href="#" className="hover:text-wolves-gold transition-colors duration-200">Pet Supplies</a></li>
                <li><a href="#" className="hover:text-wolves-gold transition-colors duration-200">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-wolves-gold transition-colors duration-200">FAQs</a></li>
                <li><a href="#" className="hover:text-wolves-gold transition-colors duration-200">Pet Care Tips</a></li>
                <li><a href="#" className="hover:text-wolves-gold transition-colors duration-200">Returns Policy</a></li>
                <li><a href="#" className="hover:text-wolves-gold transition-colors duration-200">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Connect With Us</h4>
              <p className="text-sm text-gray-300 mb-2">Email: info@wolvespetstore.com</p>
              <p className="text-sm text-gray-300">Phone: (555) 123-4567</p>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-400">
              &copy; 2024 Wolves Pet Store. All rights reserved. Inspired by the strength of the pack.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
