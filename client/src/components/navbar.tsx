import { Link, useLocation } from "wouter";
import { ShoppingCart, Settings, Heart, PawPrint, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <nav className="bg-wolves-black shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="w-10 h-10 bg-wolves-gold transform rotate-45 flex items-center justify-center mr-3">
                <PawPrint className="text-wolves-black transform -rotate-45 h-6 w-6" />
              </div>
              <span className="text-white text-xl font-bold">Wolves Pet Store</span>
            </div>
          </Link>

          <div className="hidden md:flex items-baseline space-x-4">
            <Link href="/">
              <Button
                variant="ghost"
                className={`text-white hover:text-wolves-gold hover:bg-white/10 ${
                  location === "/" ? "bg-wolves-gold/20" : ""
                }`}
              >
                Shop
              </Button>
            </Link>
            
            {isAuthenticated && user?.isAdmin && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className={`text-white hover:text-wolves-gold hover:bg-white/10 ${
                    location === "/admin" ? "bg-wolves-gold/20" : ""
                  }`}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={user?.profileImageUrl || ""} 
                            alt={user?.firstName || "User"} 
                          />
                          <AvatarFallback>
                            {user?.firstName?.[0] || user?.email?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuItem className="flex flex-col items-start">
                        <div className="text-sm font-medium">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user?.email
                          }
                        </div>
                        <div className="text-xs text-gray-500">{user?.email}</div>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Heart className="mr-2 h-4 w-4" />
                        <span>Wishlist</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = "/api/logout"}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={() => window.location.href = "/api/login"}
                    className="bg-wolves-gold text-wolves-black hover:bg-yellow-400"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
