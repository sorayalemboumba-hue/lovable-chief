import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, BookOpen, ExternalLink, Zap, TrendingUp, Target } from 'lucide-react';
import { CoachingTip } from '@/types/application';
import { getTipOfDay } from '@/data/coaching';

interface ProductivityViewProps {
  tips: CoachingTip[];
}

export function ProductivityView({ tips }: ProductivityViewProps) {
  const tipOfDay = getTipOfDay(tips);

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
      <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/20">
            <Lightbulb className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">💡 Conseil du jour</h3>
            <p className="text-lg">{tipOfDay}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-2">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Bibliothèque de coaching</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((tip) => (
            <Card key={tip.id} className="p-4 border hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold">{tip.title}</h4>
                <Badge variant="secondary" className="text-xs shrink-0">{tip.tag}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{tip.note}</p>
              <div className="text-xs text-muted-foreground">
                Source: {tip.source}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-6 border-2">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-6 h-6 text-warning" />
          <h2 className="text-2xl font-bold">Liens utiles</h2>
        </div>

        <div className="space-y-6">
          {usefulLinks.map((section) => (
            <div key={section.category}>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                {section.category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.links.map((link) => (
                  <Card key={link.name} className="p-4 border hover:border-primary/50 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{link.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{link.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
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

      <Card className="p-6 border-2 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-success/20">
            <TrendingUp className="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">🎯 Bonnes pratiques</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-success">•</span>
                <span>Personnalisez chaque candidature selon l'entreprise et le poste</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success">•</span>
                <span>Relancez 48-72h après l'envoi avec un message de valeur ajoutée</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success">•</span>
                <span>Préparez 3 questions pertinentes sur l'entreprise pour chaque entretien</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success">•</span>
                <span>Actualisez votre profil LinkedIn hebdomadairement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success">•</span>
                <span>Créez un créneau quotidien de 30min focus candidatures</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
