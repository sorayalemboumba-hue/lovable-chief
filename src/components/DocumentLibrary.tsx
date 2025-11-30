import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Mail, Upload, Trash2, Star, Loader2, Check } from 'lucide-react';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
import { Application } from '@/types/application';

interface DocumentLibraryProps {
  application: Application;
  onSelectCV: (templateId: string, fileUrl: string) => void;
  onSelectLetter: (templateId: string, fileUrl: string) => void;
}

export function DocumentLibrary({ application, onSelectCV, onSelectLetter }: DocumentLibraryProps) {
  const { cvTemplates, letterTemplates, loading, addTemplate, deleteTemplate, setDefaultTemplate } = useDocumentTemplates();
  const [showUploadCV, setShowUploadCV] = useState(false);
  const [showUploadLetter, setShowUploadLetter] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [uploadingLetter, setUploadingLetter] = useState(false);
  const [cvName, setCvName] = useState('');
  const [letterName, setLetterName] = useState('');

  const handleUploadCV = async (file: File) => {
    try {
      setUploadingCV(true);
      const fileName = `cv-template-${Date.now()}.pdf`;
      // Simuler l'upload - en production, uploadez vers Supabase Storage
      const fakeUrl = URL.createObjectURL(file);
      
      await addTemplate({
        type: 'cv',
        name: cvName || file.name,
        file_url: fakeUrl
      });
      
      setCvName('');
      setShowUploadCV(false);
    } catch (error) {
      console.error('Error uploading CV:', error);
    } finally {
      setUploadingCV(false);
    }
  };

  const handleUploadLetter = async (file: File) => {
    try {
      setUploadingLetter(true);
      const fileName = `letter-template-${Date.now()}.pdf`;
      const fakeUrl = URL.createObjectURL(file);
      
      await addTemplate({
        type: 'lettre',
        name: letterName || file.name,
        file_url: fakeUrl
      });
      
      setLetterName('');
      setShowUploadLetter(false);
    } catch (error) {
      console.error('Error uploading letter:', error);
    } finally {
      setUploadingLetter(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* CV Templates */}
      <Card className="p-5 sm:p-6 border-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            <h3 className="text-lg sm:text-xl font-semibold">Modèles de CV</h3>
          </div>
          <Button 
            onClick={() => setShowUploadCV(!showUploadCV)} 
            size="default"
            variant="outline"
            className="gap-2 w-full sm:w-auto"
          >
            <Upload className="w-4 h-4" />
            Ajouter un modèle
          </Button>
        </div>

        {showUploadCV && (
          <div className="mb-5 p-4 bg-muted/30 rounded-lg border-2 space-y-3">
            <Input
              placeholder="Nom du modèle (ex: CV Technique)"
              value={cvName}
              onChange={(e) => setCvName(e.target.value)}
            />
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadCV(file);
              }}
              disabled={uploadingCV}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cvTemplates.map(template => (
            <Card 
              key={template.id} 
              className={`p-4 border-2 cursor-pointer transition-all hover:shadow-md ${
                application.cv_template_id === template.id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => onSelectCV(template.id, template.file_url)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm truncate">{template.name}</h4>
                    {template.is_default && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Défaut
                      </Badge>
                    )}
                  </div>
                  {application.cv_template_id === template.id && (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <Check className="w-4 h-4" />
                      Sélectionné
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDefaultTemplate(template.id, 'cv');
                    }}
                    className="h-8 w-8"
                    title="Définir par défaut"
                  >
                    <Star className={`w-4 h-4 ${template.is_default ? 'fill-current text-warning' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTemplate(template.id, 'cv');
                    }}
                    className="h-8 w-8"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {cvTemplates.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">
              Aucun modèle de CV. Ajoutez-en un pour commencer.
            </div>
          )}
        </div>
      </Card>

      {/* Letter Templates */}
      <Card className="p-5 sm:p-6 border-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            <h3 className="text-lg sm:text-xl font-semibold">Modèles de lettre</h3>
          </div>
          <Button 
            onClick={() => setShowUploadLetter(!showUploadLetter)} 
            size="default"
            variant="outline"
            className="gap-2 w-full sm:w-auto"
          >
            <Upload className="w-4 h-4" />
            Ajouter un modèle
          </Button>
        </div>

        {showUploadLetter && (
          <div className="mb-5 p-4 bg-muted/30 rounded-lg border-2 space-y-3">
            <Input
              placeholder="Nom du modèle (ex: Lettre Formelle)"
              value={letterName}
              onChange={(e) => setLetterName(e.target.value)}
            />
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadLetter(file);
              }}
              disabled={uploadingLetter}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {letterTemplates.map(template => (
            <Card 
              key={template.id} 
              className={`p-4 border-2 cursor-pointer transition-all hover:shadow-md ${
                application.letter_template_id === template.id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => onSelectLetter(template.id, template.file_url)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm truncate">{template.name}</h4>
                    {template.is_default && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Défaut
                      </Badge>
                    )}
                  </div>
                  {application.letter_template_id === template.id && (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <Check className="w-4 h-4" />
                      Sélectionné
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDefaultTemplate(template.id, 'lettre');
                    }}
                    className="h-8 w-8"
                    title="Définir par défaut"
                  >
                    <Star className={`w-4 h-4 ${template.is_default ? 'fill-current text-warning' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTemplate(template.id, 'lettre');
                    }}
                    className="h-8 w-8"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {letterTemplates.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">
              Aucun modèle de lettre. Ajoutez-en un pour commencer.
            </div>
          )}
        </div>
      </Card>

      {/* ATS Compliance Guidelines */}
      <Card className="p-5 border-2 bg-muted/20">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Check className="w-5 h-5 text-success" />
          Conformité ATS
        </h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Formats simples: PDF ou DOCX uniquement</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Noms de fichiers: CV_Nom_Entreprise_Poste.pdf</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Polices standards: Arial, Calibri, Times</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Pas d'images, tableaux complexes ou en-têtes</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
