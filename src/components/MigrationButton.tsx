import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types/application';
import { saveToStorage } from '@/lib/storage';
import { toast } from 'sonner';
import { Download, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'sosoflow_applications';

export function MigrationButton() {
  const [migrating, setMigrating] = useState(false);

  const handleMigrate = async () => {
    setMigrating(true);
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const transformedData: Application[] = data.map(app => ({
          id: app.id,
          entreprise: app.entreprise,
          poste: app.poste,
          lieu: app.lieu,
          deadline: app.deadline,
          statut: app.statut as any,
          priorite: app.priorite,
          keywords: app.keywords || undefined,
          notes: app.notes || undefined,
          url: app.url || undefined,
          contacts: (app.contacts as any) || [],
          actions: (app.actions as any) || [],
          createdAt: app.created_at,
          type: app.type as any,
          referent: app.referent || undefined,
          compatibility: app.compatibility || undefined,
          missingRequirements: (app.missing_requirements as any) || [],
          matchingSkills: (app.matching_skills as any) || [],
          originalOfferUrl: app.original_offer_url || undefined,
          publicationDate: app.publication_date || undefined,
          applicationEmail: app.application_email || undefined,
          applicationInstructions: app.application_instructions || undefined,
          requiredDocuments: (app.required_documents as any) || [],
          cv_template_id: app.cv_template_id || undefined,
          letter_template_id: app.letter_template_id || undefined,
          is_complete: app.is_complete || false,
          recommended_channel: app.recommended_channel || undefined,
          ats_compliant: app.ats_compliant ?? true,
        }));

        saveToStorage(STORAGE_KEY, transformedData);
        
        toast.success(`✅ ${transformedData.length} offres migrées vers stockage local`);
        
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.info('Aucune donnée à migrer');
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      toast.error('Erreur lors de la migration');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Button 
      onClick={handleMigrate}
      disabled={migrating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {migrating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Migration...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Migrer depuis Cloud
        </>
      )}
    </Button>
  );
}
