import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Application } from '@/types/application';
import { generateMotivationLetter, GeneratedLetter } from '@/lib/documentGenerators';
import { formatDate } from '@/lib/dateUtils';

interface LetterGeneratorModalProps {
  candidature: Application;
  open: boolean;
  onClose: () => void;
  onSave: (lettreUrl: string) => void;
}

export function LetterGeneratorModal({ candidature, open, onClose, onSave }: LetterGeneratorModalProps) {
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedLetter | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      const letter = generateMotivationLetter(candidature);
      setGeneratedLetter(letter);
      setLoading(false);
    }, 800);
  };

  const handleSave = () => {
    const lettreUrl = `https://documents.com/lettre-${candidature.id}.pdf`;
    onSave(lettreUrl);
    setGeneratedLetter(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>✉️ Générer Lettre pour {candidature.poste}</DialogTitle>
        </DialogHeader>

        {!generatedLetter ? (
          <div className="space-y-6">
            <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
              <h4 className="font-semibold mb-3">🎯 Adaptation automatique :</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p><strong>Poste :</strong> {candidature.poste}</p>
                  <p><strong>Entreprise :</strong> {candidature.entreprise}</p>
                  <p><strong>Lieu :</strong> {candidature.lieu}</p>
                </div>
                <div className="space-y-1">
                  <p><strong>Mots-clés :</strong> {candidature.keywords?.substring(0, 50)}...</p>
                  <p><strong>Deadline :</strong> {formatDate(candidature.deadline)}</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? '⏳ Génération...' : '✉️ Générer la Lettre'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">📄 Lettre complète :</h3>
                <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto border border-border">
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {generatedLetter.lettre_full}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">📧 Message d'accompagnement :</h3>
                <div className="bg-accent/10 p-4 rounded-lg mb-4 border border-accent/20">
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {generatedLetter.message_channel}
                  </pre>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-sm mb-2">📊 Chiffres mis en avant :</h5>
                    <div className="flex flex-wrap gap-2">
                      {generatedLetter.highlights_numeriques.map((num, i) => (
                        <span key={i} className="px-2 py-1 bg-success/10 text-success text-xs rounded border border-success/20">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm mb-2">✨ Slogan :</h5>
                    <p className="text-sm bg-primary/10 p-2 rounded border border-primary/20 font-medium">
                      "{generatedLetter.slogan}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline"
                onClick={() => setGeneratedLetter(null)}
              >
                🔄 Regenerer
              </Button>
              <Button 
                onClick={handleSave}
                className="gap-2"
              >
                💾 Sauvegarder Lettre
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
