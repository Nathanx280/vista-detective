import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Heart,
  Grid3X3,
  List,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  GalleryFilters, 
  SortOption, 
  FilterOption, 
  ViewMode,
  SORT_OPTIONS, 
  FILTER_OPTIONS 
} from "@/types/discovery";

interface GalleryControlsProps {
  filters: GalleryFilters;
  onFiltersChange: (filters: GalleryFilters) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  favoritesCount: number;
  resultCount: number;
  totalCount: number;
}

export function GalleryControls({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  favoritesCount,
  resultCount,
  totalCount,
}: GalleryControlsProps) {
  const hasActiveFilters = filters.filter !== 'all' || filters.search || filters.showFavoritesOnly;

  const updateFilter = <K extends keyof GalleryFilters>(key: K, value: GalleryFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      sort: 'newest',
      filter: 'all',
      search: '',
      showFavoritesOnly: false,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search discoveries..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10 bg-background/50 border-border/50"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => updateFilter('search', '')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewModeChange('list')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'compact' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewModeChange('compact')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort */}
        <Select 
          value={filters.sort} 
          onValueChange={(v) => updateFilter('sort', v as SortOption)}
        >
          <SelectTrigger className="w-[150px] bg-background/50 border-border/50">
            <SlidersHorizontal className="w-3 h-3 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Score Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(opt => (
            <Badge
              key={opt.value}
              variant={filters.filter === opt.value ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer transition-all hover:scale-105",
                filters.filter === opt.value && opt.value === 'high' && "bg-destructive",
                filters.filter === opt.value && opt.value === 'medium' && "bg-warning text-warning-foreground",
                filters.filter === opt.value && opt.value === 'low' && "bg-success",
                filters.filter !== opt.value && "hover:bg-accent"
              )}
              onClick={() => updateFilter('filter', opt.value)}
            >
              {opt.label}
            </Badge>
          ))}
        </div>

        {/* Favorites Toggle */}
        <Button
          variant={filters.showFavoritesOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilter('showFavoritesOnly', !filters.showFavoritesOnly)}
          className={cn(
            "gap-1.5",
            filters.showFavoritesOnly && "bg-destructive hover:bg-destructive/90"
          )}
        >
          <Heart className={cn("w-3.5 h-3.5", filters.showFavoritesOnly && "fill-current")} />
          {favoritesCount}
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}

        {/* Results Count */}
        <span className="ml-auto text-xs text-muted-foreground font-mono">
          {resultCount} / {totalCount} results
        </span>
      </div>
    </div>
  );
}
