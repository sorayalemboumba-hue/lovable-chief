import { useEffect, useState } from 'react';
import { Application } from '@/types/application';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Database, X } from 'lucide-react';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

interface LocalStorageMigrationProps {
  onMigrate: (applications: Partial<Application>[]) => Promise<void>;
  user: any;
}

export function LocalStorageMigration({ onMigrate, user }: LocalStorageMigrationProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [localData, setLocalData] = useState<Application[]>([]);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if migration has already been done
    const migrationDone = localStorage.getItem('migration_done');
    if (migrationDone) return;

    // Check for local storage data
    const data = loadFromStorage<Application[]>('applications', []);
    if (data.length > 0) {
      setLocalData(data);
      setShowDialog(true);
    } else {
      // Mark migration as done even if no data
      localStorage.setItem('migration_done', 'true');
    }
  }, [user]);

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      await onMigrate(localData);
      localStorage.setItem('migration_done', 'true');
      localStorage.removeItem('applications'); // Clean up old data
      setShowDialog(false);
    } catch (error) {
      console.error('Migration error:', error);
    } finally {
      setMigrating(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('migration_done', 'true');
    setShowDialog(false);
  };

  if (!showDialog) return null;

  return (
    <Dialog open={showDialog} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Migration des données
          </DialogTitle>
          <DialogDescription>
            Nous avons détecté {localData.length} offre(s) et candidature(s) dans votre navigateur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-info/10 border border-info/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Nouvelle fonctionnalité !</p>
              <p className="text-muted-foreground">
                Vos données sont maintenant sauvegardées de manière sécurisée dans le cloud. 
                Voulez-vous migrer vos données existantes ?
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleMigrate}
              disabled={migrating}
              className="flex-1"
            >
              {migrating ? 'Migration...' : 'Migrer mes données'}
            </Button>
            <Button
              onClick={handleSkip}
              variant="ghost"
              disabled={migrating}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            En cliquant sur "Migrer", vos données seront transférées vers le cloud et supprimées du stockage local.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
