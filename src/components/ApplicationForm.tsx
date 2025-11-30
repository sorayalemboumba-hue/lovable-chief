import { useState } from 'react';
import { Application, ApplicationStatus, ApplicationType } from '@/types/application';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ApplicationFormProps {
  application?: Application;
  open: boolean;
  onClose: () => void;
  onSave: (application: Application) => void;
  isNewOffer?: boolean;
}

const STATUS_OPTIONS: ApplicationStatus[] = ["à compléter", "en cours", "soumise", "entretien"];
const TYPE_OPTIONS: { value: ApplicationType; label: string; description: string }[] = [
  { value: 'standard', label: 'Candidature standard', description: 'Réponse à une offre publique' },
  { value: 'spontanée', label: 'Candidature spontanée', description: 'Initiative personnelle sans offre' },
  { value: 'recommandée', label: 'Candidature recommandée', description: 'Via un contact ou réseau' }
];

export function ApplicationForm({ application, open, onClose, onSave, isNewOffer }: ApplicationFormProps) {
  const [formData, setFormData] = useState<Partial<Application>>(
    application || {
      entreprise: '',
      poste: '',
      lieu: '',
      deadline: '',
      statut: 'à compléter',
      priorite: 5,
      keywords: '',
      notes: '',
      url: '',
      type: 'standard',
      referent: ''
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newApplication: Application = {
      id: application?.id || Math.random().toString(36).slice(2, 10),
      entreprise: formData.entreprise || '',
      poste: formData.poste || '',
      lieu: formData.lieu || '',
      deadline: formData.deadline || '',
      statut: formData.statut || 'à compléter',
      priorite: formData.priorite || 5,
      keywords: formData.keywords,
      notes: formData.notes,
      url: formData.url,
      type: formData.type || 'standard',
      referent: formData.referent,
      contacts: application?.contacts || [],
      actions: application?.actions || [],
      createdAt: application?.createdAt || new Date().toISOString(),
    };

    onSave(newApplication);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {application ? (application.statut === 'soumise' || application.statut === 'entretien' ? 'Modifier la candidature' : 'Modifier l\'offre') : 'Nouvelle offre'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entreprise">Entreprise *</Label>
              <Input
                id="entreprise"
                value={formData.entreprise}
                onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poste">Poste *</Label>
              <Input
                id="poste"
                value={formData.poste}
                onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lieu">Lieu *</Label>
              <Input
                id="lieu"
                value={formData.lieu}
                onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-3 border border-border rounded-lg p-4">
            <Label>Type de candidature</Label>
            <RadioGroup
              value={formData.type || 'standard'}
              onValueChange={(value) => setFormData({ ...formData, type: value as ApplicationType })}
            >
              {TYPE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
            
            {formData.type === 'recommandée' && (
              <div className="space-y-2 mt-3 pt-3 border-t">
                <Label htmlFor="referent">Nom du contact recommandant</Label>
                <Input
                  id="referent"
                  value={formData.referent || ''}
                  onChange={(e) => setFormData({ ...formData, referent: e.target.value })}
                  placeholder="Ex: Jean Dupont, Relations externes"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select
                value={formData.statut}
                onValueChange={(value) => setFormData({ ...formData, statut: value as ApplicationStatus })}
              >
                <SelectTrigger id="statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priorite">Priorité (1-10)</Label>
              <Input
                id="priorite"
                type="number"
                min="1"
                max="10"
                value={formData.priorite}
                onChange={(e) => setFormData({ ...formData, priorite: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL de l'offre</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Mots-clés / Compétences recherchées</Label>
            <Textarea
              id="keywords"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="Séparés par des virgules ou points-virgules"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {application ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
