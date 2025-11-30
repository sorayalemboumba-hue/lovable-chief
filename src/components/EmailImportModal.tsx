import { useState } from 'react';
import { Application } from '@/types/application';
import { parseJobAlert, ParsedJob } from '@/lib/emailParser';
import { parsePDFJobOffer } from '@/lib/pdfJobParser';
import { parseTextJobOffer } from '@/lib/textJobParser';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Mail, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface EmailImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (jobs: Partial<Application>[]) => void;
}

export function EmailImportModal({ open, onClose, onImport }: EmailImportModalProps) {
  const [emailContent, setEmailContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
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

  const handleParseText = () => {
    const job = parseTextJobOffer(textContent);
    if (job) {
      setParsedJobs([job]);
      setSelectedJobs(new Set([0]));
      toast.success('1 offre détectée');
    } else {
      setParsedJobs([]);
      toast.error('Impossible d\'analyser le texte');
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error('Veuillez sélectionner un fichier PDF');
      return;
    }
    
    setPdfFile(file);
    
    // Lire le PDF (simulation - en production utiliser une lib comme pdf.js)
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const job = parsePDFJobOffer(text);
      if (job) {
        setParsedJobs([job]);
        setSelectedJobs(new Set([0]));
        toast.success('1 offre détectée dans le PDF');
      } else {
        setParsedJobs([]);
        toast.error('Impossible d\'analyser le PDF');
      }
    };
    reader.readAsText(file);
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
    setTextContent('');
    setPdfFile(null);
    setParsedJobs([]);
    setSelectedJobs(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>📥 Import d'offres d'emploi</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <LinkIcon className="w-4 h-4" />
              Texte/Lien
            </TabsTrigger>
            <TabsTrigger value="pdf" className="gap-2">
              <FileText className="w-4 h-4" />
              PDF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Collez le contenu de l'email ici :
              </label>
              <Textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Collez l'email complet (LinkedIn, JobUp, CAGI...)"
                className="min-h-[200px]"
              />
              <Button 
                onClick={handleParseEmail}
                disabled={!emailContent}
                className="mt-2"
              >
                🔍 Analyser l'email
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Collez le texte de l'annonce ou le lien LinkedIn :
              </label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Ex: En prévision du départ... Autonomia est à la recherche d'un·e Responsable de formation..."
                className="min-h-[200px]"
              />
              <Button 
                onClick={handleParseText}
                disabled={!textContent}
                className="mt-2"
              >
                🔍 Analyser le texte
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="pdf" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Importez un PDF d'annonce :
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
              />
              {pdfFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  📄 {pdfFile.name}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {parsedJobs.length > 0 && (
          <div className="border border-border rounded-lg p-4 bg-card mt-4">
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
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {parsedJobs.map((job, index) => (
                  <div 
                    key={index}
                    className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedJobs.has(index)}
                      onCheckedChange={() => handleJobSelection(index)}
                      className="mt-1"
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
            </ScrollArea>
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
      </DialogContent>
    </Dialog>
  );
}
