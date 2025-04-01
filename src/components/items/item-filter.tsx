
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Filter, X, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ItemFilterProps {
  onFilter: (filters: {
    category?: string;
    status?: string;
    location?: string;
    date?: Date;
  }) => void;
}

export function ItemFilter({ onFilter }: ItemFilterProps) {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const handleApplyFilters = () => {
    setIsFiltering(true);
    onFilter({
      category,
      status,
      location: location || undefined,
      date,
    });
    // Reset filtering state after a delay to show the loading state
    setTimeout(() => setIsFiltering(false), 1000);
  };

  const handleClearFilters = () => {
    setCategory(undefined);
    setStatus(undefined);
    setLocation("");
    setDate(undefined);
    onFilter({});
  };

  // Check if any filters are applied
  const hasActiveFilters = !!(category || status || location || date);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Select
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Found">Found</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select
                value={status}
                onValueChange={setStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleApplyFilters}
              disabled={isFiltering}
              className="px-4"
            >
              {isFiltering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Filtering...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Apply Filters
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
