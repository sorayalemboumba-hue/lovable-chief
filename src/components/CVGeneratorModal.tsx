import { useState } from 'react';
import { Download, Edit3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Application } from '@/types/application';
import { generateIntelligentCV } from '@/lib/intelligentDocumentGenerator';
import { generateCV, downloadPDF } from '@/lib/pdfGenerator';
import { cvInstructions } from '@/data/cvTemplates';
import { toast } from 'sonner';

interface CVGeneratorModalProps {
  candidature: Application;
  open: boolean;
  onClose: () => void;
  onSave: (cvUrl: string) => void;
}

export function CVGeneratorModal({ candidature, open, onClose, onSave }: CVGeneratorModalProps) {
  const [generating, setGenerating] = useState(false);
  const [cvContent, setCvContent] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<'professional' | 'innovative' | 'standard'>('professional');
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en'>('fr');
  const [isEditing, setIsEditing] = useState(false);

  const handleGenerate = () => {
    try {
      setGenerating(true);
      const generated = generateIntelligentCV(candidature, selectedFormat, selectedLanguage);
      setCvContent(generated.content);
      setIsEditing(true);
      toast.success("CV généré - vous pouvez maintenant l'éditer");
    } catch (error) {
      console.error("Error generating CV:", error);
      toast.error("Erreur lors de la génération du CV");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    setGenerating(true);
    try {
      const pdfDataUrl = generateCV(candidature);
      const filename = `CV_${candidature.entreprise}_${candidature.poste}_${selectedLanguage.toUpperCase()}.pdf`;
      downloadPDF(pdfDataUrl, filename);
      onSave(pdfDataUrl);
      toast.success('CV téléchargé');
      onClose();
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Générer le CV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!isEditing ? (
            <>
              <div className="text-sm text-muted-foreground">
                <p>Configuration du CV personnalisé pour :</p>
                <div className="mt-2 space-y-1">
                  <p className="font-medium text-foreground">{candidature.entreprise}</p>
                  <p className="font-medium text-foreground">{candidature.poste}</p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Format du CV</label>
                  <Select value={selectedFormat} onValueChange={(value: any) => setSelectedFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cvInstructions.formats.map(format => (
                        <SelectItem key={format.id} value={format.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{format.name}</span>
                            <span className="text-xs text-muted-foreground">{format.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Langue</label>
                  <Select value={selectedLanguage} onValueChange={(value: any) => setSelectedLanguage(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  <label className="text-sm font-medium">Contenu du CV (éditable)</label>
                  <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setCvContent(""); }}>
                    Recommencer
                  </Button>
                </div>
                <Textarea
                  value={cvContent}
                  onChange={(e) => setCvContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Modifiez le contenu directement. Le PDF sera généré avec vos modifications.
                </p>
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
