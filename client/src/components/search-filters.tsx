import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { PetCategory } from "@shared/schema";

interface SearchFiltersProps {
  filters: {
    categoryId?: number;
    age: string;
    size: string;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
  categories: PetCategory[];
}

export default function SearchFilters({ filters, onFiltersChange, categories }: SearchFiltersProps) {
  const handleFilterChange = (key: string, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      categoryId: undefined,
      age: "",
      size: "",
      search: "",
    });
  };

  return (
    <section className="bg-white py-8 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name or breed..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Pet Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pet Type
                </label>
                <Select
                  value={filters.categoryId?.toString() || "all"}
                  onValueChange={(value) => 
                    handleFilterChange("categoryId", value === "all" ? undefined : parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <Select
                  value={filters.age || "any"}
                  onValueChange={(value) => handleFilterChange("age", value === "any" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any Age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Age</SelectItem>
                    <SelectItem value="Puppy/Kitten">Puppy/Kitten</SelectItem>
                    <SelectItem value="Young">Young</SelectItem>
                    <SelectItem value="Adult">Adult</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <Select
                  value={filters.size || "any"}
                  onValueChange={(value) => handleFilterChange("size", value === "any" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Size</SelectItem>
                    <SelectItem value="Small">Small</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Large">Large</SelectItem>
                    <SelectItem value="Extra Large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {Object.values(filters).some(value => value) && (
                  <span>Filters active</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  size="sm"
                >
                  Clear Filters
                </Button>
                <Button
                  className="bg-wolves-gold text-wolves-black hover:bg-yellow-400"
                  size="sm"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
