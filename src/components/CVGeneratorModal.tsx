import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Application } from '@/types/application';
import { generateCV, CV_FORMATS, CVFormat, GeneratedCV } from '@/lib/documentGenerators';

interface CVGeneratorModalProps {
  candidature: Application;
  open: boolean;
  onClose: () => void;
  onSave: (cvUrl: string) => void;
}

export function CVGeneratorModal({ candidature, open, onClose, onSave }: CVGeneratorModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<CVFormat>('standard');
  const [generatedCV, setGeneratedCV] = useState<GeneratedCV | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      const cv = generateCV(candidature, selectedFormat);
      setGeneratedCV(cv);
      setLoading(false);
    }, 800);
  };

  const handleSave = () => {
    const cvUrl = `https://documents.com/cv-${candidature.id}-${selectedFormat}.pdf`;
    onSave(cvUrl);
    setGeneratedCV(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🗂️ Générer CV pour {candidature.poste}</DialogTitle>
        </DialogHeader>

        {!generatedCV ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Choisissez le format adapté au poste :</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CV_FORMATS.map(format => (
                  <div 
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id as CVFormat)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedFormat === format.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">{format.icon}</span>
                      <h4 className="font-semibold">{format.label}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{format.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-accent-foreground mb-2">✅ Adaptations automatiques :</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Compétences réorganisées selon le poste</li>
                <li>• Réalisations phares pertinentes sélectionnées</li>
                <li>• TOUTES les expériences professionnelles incluses</li>
              </ul>
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? '⏳ Génération...' : '🗂️ Générer le CV'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">📄 Aperçu CV généré :</h3>
              <div className="bg-muted/50 p-6 rounded-lg max-h-96 overflow-y-auto border border-border">
                <div className="space-y-4">
                  <div className="border-b border-border pb-2">
                    <h4 className="font-bold text-lg">{generatedCV.enTete.nom}</h4>
                    <p className="text-sm text-muted-foreground">
                      {generatedCV.enTete.email} | {generatedCV.enTete.telephone}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold mb-1">À propos</h5>
                    <p className="text-sm">{generatedCV.apropos}</p>
                  </div>

                  <div>
                    <h5 className="font-semibold mb-1">Expérience Professionnelle</h5>
                    {generatedCV.experiencesProfessionnelles.slice(0, 3).map((exp, index) => (
                      <p key={index} className="text-sm mb-1">
                        {exp.periode} | {exp.poste} | {exp.entreprise}
                      </p>
                    ))}
                    {generatedCV.experiencesProfessionnelles.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        ... et {generatedCV.experiencesProfessionnelles.length - 3} autres expériences
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline"
                onClick={() => setGeneratedCV(null)}
              >
                🔄 Modifier
              </Button>
              <Button 
                onClick={handleSave}
                className="gap-2"
              >
                💾 Sauvegarder CV
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
