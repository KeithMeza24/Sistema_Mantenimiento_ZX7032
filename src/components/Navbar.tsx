import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Settings } from "lucide-react";

interface NavbarProps {
  user: User | null;
}

const Navbar = ({ user }: NavbarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
    navigate("/auth");
    setIsOpen(false);
  };

  const getAvatarInitial = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <nav className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-end px-6 shadow-sm flex-shrink-0">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-3 px-2 py-1 h-auto hover:bg-slate-800 rounded-md transition-colors"
          >
            <div className="flex flex-col items-end gap-0.5">
              <div className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                {user?.email}
              </div>
              <div className="text-xs text-slate-400">Account</div>
            </div>
            <Avatar className="h-9 w-9 bg-slate-800 border border-slate-700">
              <AvatarFallback className="text-xs font-semibold text-slate-200">
                {getAvatarInitial()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            <UserIcon className="h-4 w-4 mr-2" />
            My Account
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
};

export default Navbar;
