import { Application } from '@/types/application';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

// Schema for validating imported applications
const applicationSchema = z.object({
  id: z.string().optional(),
  entreprise: z.string().min(1, 'Entreprise requis'),
  poste: z.string().min(1, 'Poste requis'),
  lieu: z.string().min(1, 'Lieu requis'),
  statut: z.string().min(1, 'Statut requis'),
  deadline: z.string(),
  priorite: z.number().optional().default(1),
  url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  contacts: z.array(z.any()).nullable().optional(),
  actions: z.array(z.any()).nullable().optional(),
  keywords: z.string().nullable().optional(),
  compatibility: z.number().nullable().optional(),
  matching_skills: z.array(z.any()).nullable().optional(),
  missing_requirements: z.array(z.any()).nullable().optional(),
  original_offer_url: z.string().nullable().optional(),
  recommended_channel: z.string().nullable().optional(),
  application_email: z.string().nullable().optional(),
  application_instructions: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  referent: z.string().nullable().optional(),
  required_documents: z.array(z.string()).nullable().optional(),
  publication_date: z.string().nullable().optional(),
  cv_template_id: z.string().nullable().optional(),
  letter_template_id: z.string().nullable().optional(),
  is_complete: z.boolean().nullable().optional(),
  ats_compliant: z.boolean().nullable().optional(),
});

const importDataSchema = z.array(applicationSchema);

interface DataManagerProps {
  applications: Application[];
  onImport: (apps: Application[]) => void;
  open: boolean;
  onClose: () => void;
}

export function DataManager({ applications, onImport, open, onClose }: DataManagerProps) {
  const handleExport = () => {
    const dataStr = JSON.stringify(applications, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sosoflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Données exportées avec succès');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Veuillez sélectionner un fichier JSON');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawData = JSON.parse(event.target?.result as string);
        
        // Validate the imported data against schema
        const validationResult = importDataSchema.safeParse(rawData);
        
        if (!validationResult.success) {
          const errorMessages = validationResult.error.errors
            .slice(0, 3) // Show first 3 errors max
            .map(err => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
          toast.error(`Format de données invalide: ${errorMessages}`);
          return;
        }

        const importedData = validationResult.data as Application[];

        // Detect duplicates based on entreprise + poste
        const existingKeys = new Set(
          applications.map(app => `${app.entreprise.toLowerCase()}-${app.poste.toLowerCase()}`)
        );
        
        const newApps = importedData.filter(app => 
          !existingKeys.has(`${app.entreprise.toLowerCase()}-${app.poste.toLowerCase()}`)
        );

        const duplicates = importedData.length - newApps.length;

        if (newApps.length === 0) {
          toast.warning('Aucune nouvelle donnée à importer (doublons détectés)');
        } else {
          onImport(newApps);
          toast.success(`${newApps.length} élément(s) importé(s)${duplicates > 0 ? ` (${duplicates} doublon(s) ignoré(s))` : ''}`);
        }
        
        onClose();
      } catch (error) {
        toast.error('Erreur lors de l\'import. Fichier JSON invalide.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>💾 Gestion des données</DialogTitle>
          <DialogDescription>
            Sauvegardez et restaurez vos offres et candidatures
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Important</p>
              <p>Vos données sont stockées localement dans votre navigateur. Exportez régulièrement pour éviter toute perte.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="border border-border rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exporter les données
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Téléchargez toutes vos offres et candidatures ({applications.length} élément{applications.length > 1 ? 's' : ''})
              </p>
              <Button onClick={handleExport} className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Télécharger le fichier JSON
              </Button>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Importer des données
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Restaurez vos données depuis un fichier de sauvegarde
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
