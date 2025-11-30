import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Application } from '@/types/application';
import { generateCV, downloadPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';

interface CVGeneratorModalProps {
  candidature: Application;
  open: boolean;
  onClose: () => void;
  onSave: (cvUrl: string) => void;
}

export function CVGeneratorModal({ candidature, open, onClose, onSave }: CVGeneratorModalProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    try {
      const pdfDataUrl = generateCV(candidature);
      const filename = `CV-${candidature.entreprise}-${candidature.poste}.pdf`;
      downloadPDF(pdfDataUrl, filename);
      
      onSave(pdfDataUrl);
      toast.success('CV généré avec succès !');
      onClose();
    } catch (error) {
      console.error('Error generating CV:', error);
      toast.error('Erreur lors de la génération du CV');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Générer CV pour {candidature.poste}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Un CV professionnel sera généré en PDF avec vos informations et adapté pour le poste de <strong>{candidature.poste}</strong> chez <strong>{candidature.entreprise}</strong>.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? (
                <>Génération...</>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Générer et télécharger
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
