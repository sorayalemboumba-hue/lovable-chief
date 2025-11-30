import { Card } from '@/components/ui/card';
import { Mail, FileText, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IntelligentToolsProps {
  onImportEmail: () => void;
}

export function IntelligentTools({ onImportEmail }: IntelligentToolsProps) {
  return (
    <Card className="p-6 border-2">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Zap className="w-5 h-5 text-accent mr-2" />
        Outils intelligents
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/5 border-2 border-primary/20 rounded-lg">
          <div className="flex items-center mb-2">
            <Mail className="w-5 h-5 text-primary mr-2" />
            <h4 className="font-semibold">Import Email</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Parsez automatiquement vos alertes LinkedIn, Jobup, CAGI
          </p>
          <Button 
            onClick={onImportEmail}
            size="sm"
            className="w-full gap-2"
          >
            📧 Essayer l'import
          </Button>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/20 rounded-lg">
          <div className="flex items-center mb-2">
            <FileText className="w-5 h-5 text-success mr-2" />
            <h4 className="font-semibold">CV & Lettres</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Générez CV et lettres personnalisées automatiquement
          </p>
          <span className="px-3 py-1 bg-success text-success-foreground text-sm rounded-lg inline-block">
            ✅ 6 formats disponibles
          </span>
        </div>

        <div className="p-4 bg-gradient-to-br from-warning/10 to-warning/5 border-2 border-warning/20 rounded-lg">
          <div className="flex items-center mb-2">
            <Target className="w-5 h-5 text-warning mr-2" />
            <h4 className="font-semibold">Coaching</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Conseils automatiques selon deadlines et compatibilité
          </p>
          <span className="px-3 py-1 bg-warning text-warning-foreground text-sm rounded-lg inline-block">
            ✅ Activé
          </span>
        </div>
      </div>
    </Card>
  );
}
