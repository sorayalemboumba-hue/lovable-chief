import { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { parseJobAlert, ParsedJob } from '@/lib/emailParser';
import { Application } from '@/types/application';
import { toast } from 'sonner';

interface EmailImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (jobs: Partial<Application>[]) => void;
}

export function EmailImportModal({ open, onClose, onImport }: EmailImportModalProps) {
  const [emailContent, setEmailContent] = useState('');
  const [parsedJobs, setParsedJobs] = useState<ParsedJob[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());

  const handleParseEmail = () => {
    const jobs = parseJobAlert(emailContent);
    setParsedJobs(jobs);
    setSelectedJobs(new Set());
    
    if (jobs.length === 0) {
      toast.error('Aucune offre détectée dans cet email');
    } else {
      toast.success(`${jobs.length} offre(s) détectée(s)`);
    }
  };

  const handleJobSelection = (index: number) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedJobs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedJobs.size === parsedJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(parsedJobs.map((_, index) => index)));
    }
  };

  const handleImportSelectedJobs = () => {
    const today = new Date();
    const defaultDeadline = new Date(today);
    defaultDeadline.setDate(today.getDate() + 14);
    
    const applicationsToImport = Array.from(selectedJobs).map(index => {
      const job = parsedJobs[index];
      return {
        entreprise: job.entreprise,
        poste: job.poste,
        lieu: job.lieu,
        deadline: defaultDeadline.toISOString().split('T')[0],
        statut: 'à compléter' as const,
        priorite: 2,
        keywords: job.motsCles,
        url: ''
      };
    });
    
    onImport(applicationsToImport);
    toast.success(`${applicationsToImport.length} candidature(s) importée(s)`);
    
    // Reset state
    setEmailContent('');
    setParsedJobs([]);
    setSelectedJobs(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Import depuis emails d'alertes emploi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-sm">📧 Collez le contenu de votre email d'alerte</h3>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Collez ici le contenu complet de votre email d'alerte emploi (LinkedIn, Jobup, etc.)..."
            />
            <div className="flex gap-2 mt-3">
              <Button 
                onClick={handleParseEmail}
                disabled={!emailContent.trim()}
              >
                🔍 Analyser l'email
              </Button>
              {parsedJobs.length > 0 && (
                <span className="px-3 py-2 bg-success/10 text-success rounded text-sm font-medium flex items-center">
                  ✅ {parsedJobs.length} offre(s) détectée(s)
                </span>
              )}
            </div>
          </div>

          {parsedJobs.length > 0 && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Sélectionnez les offres à importer :</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedJobs.size === parsedJobs.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {parsedJobs.map((job, index) => (
                  <div 
                    key={index}
                    className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedJobs.has(index)}
                      onChange={() => handleJobSelection(index)}
                      className="mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm truncate">{job.poste}</h5>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.entreprise} • {job.lieu}
                      </p>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mt-1 inline-block">
                        {job.source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {selectedJobs.size} sur {parsedJobs.length} sélectionnée(s)
                </span>
                <Button 
                  onClick={handleImportSelectedJobs}
                  disabled={selectedJobs.size === 0}
                  className="gap-2"
                >
                  Importer ({selectedJobs.size})
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
