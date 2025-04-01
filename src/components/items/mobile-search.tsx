
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MobileSearchProps {
  onSearch: (query: string) => void;
}

export function MobileSearch({ onSearch }: MobileSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="md:hidden mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="search"
          placeholder="Search for lost or found items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>
    </div>
  );
}
