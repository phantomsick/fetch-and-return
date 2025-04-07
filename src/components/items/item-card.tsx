
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Item } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { MapPin, MessageSquare, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const navigate = useNavigate();
  
  const formattedDate = formatDistanceToNow(new Date(item.date || item.created_at), {
    addSuffix: true,
  });
  
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Make sure we handle null or undefined user properly
  const userName = item.user?.name || "Anonymous";

  return (
    <Card className="item-card h-full flex flex-col overflow-hidden">
      <CardContent className="p-0">
        {item.image_url ? (
          <div className="aspect-video w-full overflow-hidden">
            <img
              src={item.image_url}
              alt={item.title}
              className="h-full w-full object-cover transition-all hover:scale-105"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No image available</span>
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Badge
              variant="outline"
              className={
                item.category === "Lost" ? "category-badge-lost" : "category-badge-found"
              }
            >
              {item.category}
            </Badge>
            <Badge
              variant="outline"
              className={
                item.status === "Open" ? "status-badge-open" : "status-badge-resolved"
              }
            >
              {item.status}
            </Badge>
          </div>
          
          <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
          
          <p className="text-sm text-muted-foreground mb-4">
            {truncateText(item.description || "", 120)}
          </p>
          
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <MapPin className="mr-1 h-4 w-4" />
            <span>{item.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="mr-1 h-4 w-4" />
            <span>{userName}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t p-6 mt-auto">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={item.user?.profile_picture || ""} />
              <AvatarFallback>{getInitials(item.user?.name)}</AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">{formattedDate}</div>
          </div>
          
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => navigate(`/items/${item.id}`)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
