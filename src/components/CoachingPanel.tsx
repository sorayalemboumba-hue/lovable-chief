import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, BookOpen } from 'lucide-react';
import { CoachingTip } from '@/types/application';
import { getTipOfDay } from '@/data/coaching';

interface CoachingPanelProps {
  tips: CoachingTip[];
}

export function CoachingPanel({ tips }: CoachingPanelProps) {
  const tipOfDay = getTipOfDay(tips);

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/20">
            <Lightbulb className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Conseil du jour</h3>
            <p className="text-sm text-muted-foreground">{tipOfDay}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-2">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Bibliothèque de coaching</h3>
        </div>
        
        <div className="space-y-3">
          {tips.map((tip) => (
            <div key={tip.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-medium">{tip.title}</h4>
                <Badge variant="secondary" className="text-xs shrink-0">{tip.tag}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{tip.note}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
