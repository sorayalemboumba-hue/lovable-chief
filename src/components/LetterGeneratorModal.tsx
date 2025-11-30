import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Application } from '@/types/application';
import { generateCoverLetter, downloadPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';

interface LetterGeneratorModalProps {
  candidature: Application;
  open: boolean;
  onClose: () => void;
  onSave: (lettreUrl: string) => void;
}

export function LetterGeneratorModal({ candidature, open, onClose, onSave }: LetterGeneratorModalProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const pdfDataUrl = generateCoverLetter(candidature);
      const filename = `Lettre-Motivation-${candidature.entreprise}-${candidature.poste}.pdf`;
      downloadPDF(pdfDataUrl, filename);
      
      onSave(pdfDataUrl);
      toast.success('Lettre de motivation générée avec succès !');
      onClose();
    } catch (error) {
      console.error('Error generating letter:', error);
      toast.error('Erreur lors de la génération de la lettre');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Générer lettre de motivation pour {candidature.poste}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Une lettre de motivation professionnelle sera générée en PDF adaptée pour le poste de <strong>{candidature.poste}</strong> chez <strong>{candidature.entreprise}</strong>.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Mise en page professionnelle</p>
              <p>• Adapté au poste et à l'entreprise</p>
              <p>• Format prêt à l'envoi</p>
            </div>
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
