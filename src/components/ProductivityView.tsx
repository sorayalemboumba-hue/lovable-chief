import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, BookOpen, ExternalLink, Zap, TrendingUp, Target, Plus, Trash2, Loader2 } from 'lucide-react';
import { COACHING_LIBRARY } from '@/data/coaching';
import { useCoachingTips } from '@/hooks/useCoachingTips';

export function ProductivityView() {
  const { tips: userTips, loading, addTip, deleteTip } = useCoachingTips();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', url: '', note: '' });
  const [submitting, setSubmitting] = useState(false);

  // Combiner les tips de la bibliothèque et les tips personnalisés
  const allTips = [...COACHING_LIBRARY, ...userTips.map(t => ({
    id: t.id,
    tag: 'personnel' as const,
    title: t.title,
    note: t.note,
    source: t.url || 'Personnel',
    isUserTip: true
  }))];

  // Tip du jour déterministe basé sur la date
  const getTipOfDay = () => {
    if (!allTips.length) return "Excellente journée de candidature ! Organisez votre pipeline et priorisez les deadlines.";
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const selectedTip = allTips[dayOfYear % allTips.length];
    return selectedTip.note || selectedTip.title;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.note.trim()) return;

    try {
      setSubmitting(true);
      await addTip({
        title: formData.title.trim(),
        url: formData.url.trim() || undefined,
        note: formData.note.trim()
      });
      setFormData({ title: '', url: '', note: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding tip:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const usefulLinks = [
    {
      category: 'Portails emploi',
      links: [
        { name: 'JobUp.ch', url: 'https://www.jobup.ch', description: 'Plateforme leader Suisse romande' },
        { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs', description: 'Réseau professionnel mondial' },
        { name: 'CAGI', url: 'https://www.cagi.ch', description: 'Cadres et dirigeants Genève' },
        { name: 'Indeed Suisse', url: 'https://ch.indeed.com', description: 'Moteur recherche emploi' }
      ]
    },
    {
      category: 'Préparation entretiens',
      links: [
        { name: 'Glassdoor', url: 'https://www.glassdoor.com', description: 'Avis entreprises et questions entretien' },
        { name: 'Big Interview', url: 'https://biginterview.com', description: 'Simulation entretiens' },
        { name: 'InterviewBit', url: 'https://www.interviewbit.com', description: 'Préparation technique' }
      ]
    },
    {
      category: 'Outils carrière',
      links: [
        { name: 'Canva CV', url: 'https://www.canva.com/resumes/templates/', description: 'Templates CV professionnels' },
        { name: 'Novoresume', url: 'https://novoresume.com', description: 'Constructeur CV moderne' },
        { name: 'Grammarly', url: 'https://www.grammarly.com', description: 'Correction lettres motivation' }
      ]
    },
    {
      category: 'Veille & networking',
      links: [
        { name: 'Meetup', url: 'https://www.meetup.com', description: 'Événements networking' },
        { name: 'Eventbrite', url: 'https://www.eventbrite.com', description: 'Conférences professionnelles' },
        { name: 'Swiss Professional Women', url: 'https://www.spw.ch', description: 'Réseau femmes cadres' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Tip du jour */}
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/20 shadow-lg">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2.5 rounded-lg bg-accent/20 shadow-sm">
            <Lightbulb className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold mb-2">💡 Conseil du jour</h3>
            <p className="text-base sm:text-lg leading-relaxed">{getTipOfDay()}</p>
          </div>
        </div>
      </Card>

      {/* Bibliothèque de coaching */}
      <Card className="p-5 sm:p-6 border-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold">Bibliothèque de coaching</h2>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            size="default"
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Ajouter un tip
          </Button>
        </div>

        {/* Formulaire d'ajout */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 sm:p-5 bg-muted/30 rounded-lg border-2 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Titre *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Technique de networking"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">URL (optionnel)</label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Note *</label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Décrivez votre conseil..."
                required
                maxLength={500}
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="flex-1 sm:flex-none">
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sauvegarder
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setFormData({ title: '', url: '', note: '' });
                }}
                className="flex-1 sm:flex-none"
              >
                Annuler
              </Button>
            </div>
          </form>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allTips.map((tip: any) => (
              <Card key={tip.id} className="p-4 sm:p-5 border-2 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="font-semibold text-base flex-1 leading-tight">{tip.title}</h4>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs font-medium">{tip.tag}</Badge>
                    {tip.isUserTip && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTip(tip.id)}
                        className="h-8 w-8"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{tip.note}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Source: {tip.source}</span>
                  {tip.isUserTip && tip.source !== 'Personnel' && (
                    <a 
                      href={tip.source} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Lien
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Liens utiles */}
      <Card className="p-5 sm:p-6 border-2">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-6 h-6 text-warning" />
          <h2 className="text-xl sm:text-2xl font-bold">Liens utiles</h2>
        </div>

        <div className="space-y-6">
          {usefulLinks.map((section) => (
            <div key={section.category}>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                {section.category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.links.map((link) => (
                  <Card key={link.name} className="p-4 border-2 hover:border-primary/50 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1 text-sm sm:text-base">{link.name}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{link.description}</p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" title={`Visiter ${link.name}`}>
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bonnes pratiques */}
      <Card className="p-5 sm:p-6 border-2 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2.5 rounded-lg bg-success/20 shadow-sm">
            <TrendingUp className="w-6 h-6 text-success" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-semibold mb-3">🎯 Bonnes pratiques</h3>
            <ul className="space-y-2.5 text-sm sm:text-base">
              <li className="flex items-start gap-2.5">
                <span className="text-success font-bold text-lg">•</span>
                <span className="leading-relaxed">Personnalisez chaque candidature selon l'entreprise et le poste</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-success font-bold text-lg">•</span>
                <span className="leading-relaxed">Relancez 48-72h après l'envoi avec un message de valeur ajoutée</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-success font-bold text-lg">•</span>
                <span className="leading-relaxed">Préparez 3 questions pertinentes sur l'entreprise pour chaque entretien</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-success font-bold text-lg">•</span>
                <span className="leading-relaxed">Actualisez votre profil LinkedIn hebdomadairement</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-success font-bold text-lg">•</span>
                <span className="leading-relaxed">Créez un créneau quotidien de 30min focus candidatures</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
