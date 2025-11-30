import { useState } from 'react';
import { Download, Edit3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Application } from '@/types/application';
import { generateIntelligentCoverLetter } from '@/lib/intelligentDocumentGenerator';
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
  const [letterContent, setLetterContent] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en'>('fr');
  const [isEditing, setIsEditing] = useState(false);

  const handleGenerate = () => {
    try {
      setGenerating(true);
      const generated = generateIntelligentCoverLetter(candidature, selectedLanguage);
      setLetterContent(generated.content);
      setIsEditing(true);
      toast.success("Lettre générée - vous pouvez maintenant l'éditer");
    } catch (error) {
      console.error("Error generating letter:", error);
      toast.error("Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    setGenerating(true);
    try {
      // Importer le générateur personnalisé
      const { generateCustomCoverLetter } = require('@/lib/pdfGenerator');
      const pdfDataUrl = generateCustomCoverLetter(letterContent, candidature);
      const filename = `LM_${candidature.entreprise}_${candidature.poste}_${selectedLanguage.toUpperCase()}.pdf`;
      downloadPDF(pdfDataUrl, filename);
      onSave(pdfDataUrl);
      toast.success('Lettre téléchargée');
      onClose();
    } catch (error) {
      console.error('Error downloading letter:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Générer la lettre de motivation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!isEditing ? (
            <>
              <div className="text-sm text-muted-foreground">
                <p>Configuration de la lettre pour :</p>
                <div className="mt-2 space-y-1">
                  <p className="font-medium text-foreground">{candidature.entreprise}</p>
                  <p className="font-medium text-foreground">{candidature.poste}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Langue</label>
                <Select value={selectedLanguage} onValueChange={(value: any) => setSelectedLanguage(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={onClose}>Annuler</Button>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Edit3 className="mr-2 h-4 w-4" />
                  Générer pour édition
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Contenu de la lettre (éditable)</label>
                  <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setLetterContent(""); }}>
                    Recommencer
                  </Button>
                </div>
                <Textarea
                  value={letterContent}
                  onChange={(e) => setLetterContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>Annuler</Button>
                <Button onClick={handleDownload} disabled={generating}>
                  {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger PDF
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
