export interface Discovery {
  id: string;
  image_url: string;
  anomaly_score: number | null;
  anomaly_types: string[] | null;
  ai_analysis: string | null;
  narration: string | null;
  status: string | null;
  created_at: string;
  location_hint?: string | null;
  thumbnail_url?: string | null;
}

export type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
export type FilterOption = 'all' | 'low' | 'medium' | 'high' | 'pending';
export type ViewMode = 'grid' | 'list' | 'compact';

export interface GalleryFilters {
  sort: SortOption;
  filter: FilterOption;
  search: string;
  showFavoritesOnly: boolean;
}

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Score' },
  { value: 'lowest', label: 'Lowest Score' },
];

export const FILTER_OPTIONS: { value: FilterOption; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'primary' },
  { value: 'low', label: 'Low (0-3)', color: 'success' },
  { value: 'medium', label: 'Medium (4-6)', color: 'warning' },
  { value: 'high', label: 'High (7-10)', color: 'destructive' },
  { value: 'pending', label: 'Pending', color: 'muted' },
];

export function getScoreCategory(score: number | null): 'low' | 'medium' | 'high' | 'none' {
  if (score === null) return 'none';
  if (score <= 3) return 'low';
  if (score <= 6) return 'medium';
  return 'high';
}

export function filterDiscoveries(
  discoveries: Discovery[],
  filters: GalleryFilters,
  favorites: Set<string>
): Discovery[] {
  let filtered = [...discoveries];

  // Filter by favorites
  if (filters.showFavoritesOnly) {
    filtered = filtered.filter(d => favorites.has(d.id));
  }

  // Filter by score category
  if (filters.filter !== 'all') {
    filtered = filtered.filter(d => {
      if (filters.filter === 'pending') return d.status !== 'complete';
      if (d.status !== 'complete') return false;
      const category = getScoreCategory(d.anomaly_score);
      return category === filters.filter;
    });
  }

  // Filter by search
  if (filters.search.trim()) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(d =>
      d.ai_analysis?.toLowerCase().includes(searchLower) ||
      d.narration?.toLowerCase().includes(searchLower) ||
      d.anomaly_types?.some(t => t.toLowerCase().includes(searchLower)) ||
      d.location_hint?.toLowerCase().includes(searchLower)
    );
  }

  // Sort
  filtered.sort((a, b) => {
    switch (filters.sort) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'highest':
        return (b.anomaly_score ?? -1) - (a.anomaly_score ?? -1);
      case 'lowest':
        return (a.anomaly_score ?? 999) - (b.anomaly_score ?? 999);
      default:
        return 0;
    }
  });

  return filtered;
}
