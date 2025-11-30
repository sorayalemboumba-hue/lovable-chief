import { Application, ApplicationStatus } from '@/types/application';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface FilterState {
  statut?: ApplicationStatus;
  prioriteMin?: number;
  prioriteMax?: number;
  dateDebut?: string;
  dateFin?: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}

export function FilterPanel({ filters, onFilterChange, onReset }: FilterPanelProps) {
  const activeFiltersCount = Object.keys(filters).filter(key => 
    filters[key as keyof FilterState] !== undefined
  ).length;

  const handleStatutChange = (value: string) => {
    if (value === 'all') {
      const { statut, ...rest } = filters;
      onFilterChange(rest);
    } else {
      onFilterChange({ ...filters, statut: value as ApplicationStatus });
    }
  };

  const handlePrioriteChange = (values: number[]) => {
    onFilterChange({ 
      ...filters, 
      prioriteMin: values[0], 
      prioriteMax: values[1] 
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Filtres avancés
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onReset}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Réinitialiser
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Statut filter */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select 
              value={filters.statut || 'all'} 
              onValueChange={handleStatutChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="à compléter">À compléter</SelectItem>
                <SelectItem value="en cours">En cours</SelectItem>
                <SelectItem value="soumise">Soumise</SelectItem>
                <SelectItem value="entretien">Entretien</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority filter */}
          <div className="space-y-3">
            <Label>Priorité</Label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>Min: {filters.prioriteMin ?? 1}</span>
              <span className="ml-auto">Max: {filters.prioriteMax ?? 5}</span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[filters.prioriteMin ?? 1, filters.prioriteMax ?? 5]}
              onValueChange={handlePrioriteChange}
              className="w-full"
            />
          </div>

          {/* Date range filter */}
          <div className="space-y-2">
            <Label>Date limite (début)</Label>
            <input
              type="date"
              value={filters.dateDebut || ''}
              onChange={(e) => onFilterChange({ ...filters, dateDebut: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label>Date limite (fin)</Label>
            <input
              type="date"
              value={filters.dateFin || ''}
              onChange={(e) => onFilterChange({ ...filters, dateFin: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Active filters summary */}
          {activeFiltersCount > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Filtres actifs :</p>
              <div className="flex flex-wrap gap-2">
                {filters.statut && (
                  <Badge variant="secondary">
                    Statut: {filters.statut}
                  </Badge>
                )}
                {(filters.prioriteMin !== undefined || filters.prioriteMax !== undefined) && (
                  <Badge variant="secondary">
                    Priorité: {filters.prioriteMin ?? 1}-{filters.prioriteMax ?? 5}
                  </Badge>
                )}
                {filters.dateDebut && (
                  <Badge variant="secondary">
                    Depuis: {new Date(filters.dateDebut).toLocaleDateString()}
                  </Badge>
                )}
                {filters.dateFin && (
                  <Badge variant="secondary">
                    Jusqu'à: {new Date(filters.dateFin).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
