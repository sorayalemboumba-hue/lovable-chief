import { memo } from 'react';
import { Application } from '@/types/application';
import { ApplicationCard } from '@/components/ApplicationCard';
import { Button } from '@/components/ui/button';
import { Plus, Target } from 'lucide-react';

interface ApplicationListProps {
  applications: Application[];
  searchQuery: string;
  onEdit: (application: Application) => void;
  onDelete: (id: string) => void;
  onGenerateCV: (application: Application) => void;
  onGenerateLetter: (application: Application) => void;
  onUpdate: (id: string, updates: Partial<Application>) => void;
  onNewApplication: () => void;
}

export const ApplicationList = memo(function ApplicationList({
  applications,
  searchQuery,
  onEdit,
  onDelete,
  onGenerateCV,
  onGenerateLetter,
  onUpdate,
  onNewApplication,
}: ApplicationListProps) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-16 sm:py-20 px-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Target className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucune offre ni candidature</h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
          {searchQuery ? 'Aucun résultat trouvé' : 'Importez des offres ou créez votre première candidature'}
        </p>
        {!searchQuery && (
          <Button onClick={onNewApplication} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Créer une offre
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          onEdit={() => onEdit(application)}
          onDelete={() => onDelete(application.id)}
          onGenerateCV={() => onGenerateCV(application)}
          onGenerateLetter={() => onGenerateLetter(application)}
          onUpdate={(updates) => onUpdate(application.id, updates)}
        />
      ))}
    </div>
  );
});
