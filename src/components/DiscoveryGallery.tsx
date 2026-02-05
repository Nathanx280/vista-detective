import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Upload, RefreshCw, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { 
  Discovery, 
  GalleryFilters, 
  ViewMode, 
  filterDiscoveries 
} from "@/types/discovery";
import { useFavorites } from "@/hooks/use-favorites";
import { GalleryControls } from "./gallery/GalleryControls";
import { GalleryStats } from "./gallery/GalleryStats";
import { DiscoveryCard } from "./gallery/DiscoveryCard";
import { DiscoveryDetailDialog } from "./gallery/DiscoveryDetailDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DiscoveryGalleryProps {
  onImportImage?: (imageData: string) => void;
}

export function DiscoveryGallery({ onImportImage }: DiscoveryGalleryProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dialog state
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // View & filter state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<GalleryFilters>({
    sort: 'newest',
    filter: 'all',
    search: '',
    showFavoritesOnly: false,
  });

  // Favorites hook
  const { favorites, toggleFavorite, isFavorite, count: favoritesCount } = useFavorites();

  // Fetch discoveries
  const { data: discoveries = [], isLoading, refetch } = useQuery({
    queryKey: ["discoveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discoveries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as Discovery[];
    },
    refetchInterval: 5000,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("discoveries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discoveries"] });
      toast.success("Discovery deleted");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete discovery");
    },
  });

  // Filtered discoveries
  const filteredDiscoveries = useMemo(
    () => filterDiscoveries(discoveries, filters, favorites),
    [discoveries, filters, favorites]
  );

  // Get complete discoveries for navigation
  const completeDiscoveries = useMemo(
    () => filteredDiscoveries.filter(d => d.status === 'complete'),
    [filteredDiscoveries]
  );

  const selectedDiscovery = selectedIndex >= 0 ? completeDiscoveries[selectedIndex] : null;

  const handleCardClick = useCallback((discovery: Discovery) => {
    if (discovery.status === "complete") {
      const index = completeDiscoveries.findIndex(d => d.id === discovery.id);
      setSelectedIndex(index);
      setDialogOpen(true);
    }
  }, [completeDiscoveries]);

  const handleNavigate = useCallback((index: number) => {
    if (index >= 0 && index < completeDiscoveries.length) {
      setSelectedIndex(index);
    }
  }, [completeDiscoveries.length]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      if (onImportImage) {
        onImportImage(imageData);
        toast.success("Image imported! Ready to analyze.");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleExportAll = () => {
    const data = completeDiscoveries.map(d => ({
      id: d.id,
      anomaly_score: d.anomaly_score,
      anomaly_types: d.anomaly_types,
      analysis: d.ai_analysis,
      narration: d.narration,
      location: d.location_hint,
      created_at: d.created_at,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anomaly-discoveries-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} discoveries!`);
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl md:text-2xl text-foreground tracking-wide flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            RECENT DISCOVERIES
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-52 rounded-xl bg-muted/50" />
              <Skeleton className="h-4 w-3/4 bg-muted/30" />
              <Skeleton className="h-3 w-1/2 bg-muted/20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!discoveries || discoveries.length === 0) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-muted/30">
            <Eye className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-lg text-foreground">NO DISCOVERIES YET</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Upload your first satellite image to begin uncovering Earth's mysteries
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="font-display text-xl md:text-2xl text-foreground tracking-wide flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          DISCOVERY ARCHIVE
        </h2>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAll} className="gap-2">
            <Download className="w-4 h-4" />
            Export All
          </Button>
          {onImportImage && (
            <Button variant="glow" size="sm" onClick={handleImportClick} className="gap-2">
              <Upload className="w-4 h-4" />
              Import Image
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <GalleryStats discoveries={discoveries} />

      {/* Controls */}
      <GalleryControls
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        favoritesCount={favoritesCount}
        resultCount={filteredDiscoveries.length}
        totalCount={discoveries.length}
      />

      {/* Empty filtered state */}
      {filteredDiscoveries.length === 0 && (
        <div className="glass-panel p-8 text-center rounded-xl">
          <p className="text-muted-foreground">No discoveries match your filters</p>
          <Button 
            variant="link" 
            onClick={() => setFilters({ sort: 'newest', filter: 'all', search: '', showFavoritesOnly: false })}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Discovery Grid */}
      <div className={cn(
        viewMode === 'grid' && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
        viewMode === 'list' && "flex flex-col gap-3",
        viewMode === 'compact' && "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2"
      )}>
        {filteredDiscoveries.map((discovery, index) => (
          <DiscoveryCard
            key={discovery.id}
            discovery={discovery}
            viewMode={viewMode}
            isFavorite={isFavorite(discovery.id)}
            onToggleFavorite={() => toggleFavorite(discovery.id)}
            onDelete={() => handleDeleteRequest(discovery.id)}
            onClick={() => handleCardClick(discovery)}
            index={index}
          />
        ))}
      </div>

      {/* Detail Dialog */}
      <DiscoveryDetailDialog
        discovery={selectedDiscovery}
        discoveries={completeDiscoveries}
        currentIndex={selectedIndex}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onNavigate={handleNavigate}
        isFavorite={selectedDiscovery ? isFavorite(selectedDiscovery.id) : false}
        onToggleFavorite={() => selectedDiscovery && toggleFavorite(selectedDiscovery.id)}
        onDelete={() => selectedDiscovery && handleDeleteRequest(selectedDiscovery.id)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discovery?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the discovery from the archive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
