import { useState } from 'react';
import { Application } from '@/types/application';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp, Mail, Phone, FileText, Link as LinkIcon } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface ApplicationChecklistProps {
  application: Application;
  onUpdate: (updates: Partial<Application>) => void;
}

export function ApplicationChecklist({ application, onUpdate }: ApplicationChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  
  const getChecklist = (): ChecklistItem[] => {
    const baseChecklist: ChecklistItem[] = [
      {
        id: 'cv',
        label: 'Adapter le CV',
        icon: <FileText className="w-4 h-4" />,
        description: 'Générer un CV ciblé pour ce poste'
      },
      {
        id: 'lettre',
        label: 'Rédiger la lettre de motivation',
        icon: <FileText className="w-4 h-4" />,
        description: 'Créer une lettre personnalisée'
      },
      {
        id: 'contacts',
        label: 'Identifier les contacts',
        icon: <Phone className="w-4 h-4" />,
        description: 'Trouver le recruteur ou responsable RH'
      },
      {
        id: 'email',
        label: 'Préparer l\'email de candidature',
        icon: <Mail className="w-4 h-4" />,
        description: 'Rédiger un email d\'accompagnement professionnel'
      },
      {
        id: 'url',
        label: 'Vérifier le lien de candidature',
        icon: <LinkIcon className="w-4 h-4" />,
        description: 'S\'assurer d\'avoir l\'URL de candidature'
      }
    ];
    
    if (application.type === 'recommandée') {
      baseChecklist.push({
        id: 'referent',
        label: 'Contacter le référent',
        icon: <Phone className="w-4 h-4" />,
        description: `Échanger avec ${application.referent || 'votre contact'}`
      });
    }
    
    if (application.type === 'spontanée') {
      baseChecklist.push({
        id: 'research',
        label: 'Rechercher l\'entreprise',
        icon: <LinkIcon className="w-4 h-4" />,
        description: 'Analyser la culture et les besoins de l\'entreprise'
      });
    }
    
    return baseChecklist;
  };
  
  const checklist = getChecklist();
  const progress = (completedItems.size / checklist.length) * 100;
  
  const toggleItem = (id: string) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompletedItems(newCompleted);
  };
  
  return (
    <Card className="p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">
            Marche à suivre
          </div>
          <div className="text-xs text-muted-foreground">
            {completedItems.size}/{checklist.length} étapes
          </div>
        </div>
        <Button variant="ghost" size="sm">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-3">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
              <Checkbox
                checked={completedItems.has(item.id)}
                onCheckedChange={() => toggleItem(item.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className={`text-sm font-medium ${completedItems.has(item.id) ? 'line-through text-muted-foreground' : ''}`}>
                    {item.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
