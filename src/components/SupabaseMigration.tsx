import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types/application';
import { saveToStorage, loadFromStorage } from '@/lib/storage';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Database, Download } from 'lucide-react';

const STORAGE_KEY = 'sosoflow_applications';

export function SupabaseMigration() {
  const [migrating, setMigrating] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [supabaseCount, setSupabaseCount] = useState(0);

  useEffect(() => {
    checkMigrationNeeded();
  }, []);

  const checkMigrationNeeded = async () => {
    // Check if localStorage already has data
    const localData = loadFromStorage<Application[]>(STORAGE_KEY, []);
    
    if (localData.length > 0) {
      setNeedsMigration(false);
      return;
    }

    // Check if there's data in Supabase
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true });

      if (!error && data !== null) {
        const count = (data as any).length || 0;
        if (count > 0) {
          setSupabaseCount(count);
          setNeedsMigration(true);
        }
      }
    } catch (err) {
      console.error('Error checking migration:', err);
    }
  };

  const migrateData = async () => {
    setMigrating(true);
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Transform database format to Application format
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

        // Save to localStorage
        saveToStorage(STORAGE_KEY, transformedData);
        
        toast.success(`✅ ${transformedData.length} offres migrées vers stockage local`);
        setNeedsMigration(false);
        
        // Reload page to refresh data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.info('Aucune donnée à migrer');
        setNeedsMigration(false);
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      toast.error('Erreur lors de la migration');
    } finally {
      setMigrating(false);
    }
  };

  if (!needsMigration) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6 space-y-4 shadow-2xl border-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Migration des données</h3>
            <p className="text-sm text-muted-foreground">
              {supabaseCount} offre(s) détectée(s) dans la base
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm leading-relaxed">
            Votre application utilise maintenant un stockage local simplifié sans authentification. 
            Vos {supabaseCount} offres doivent être migrées.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
            <p className="font-medium">✅ Migration automatique et sécurisée</p>
            <p className="text-muted-foreground">• Toutes vos données seront copiées</p>
            <p className="text-muted-foreground">• Aucune perte d'information</p>
            <p className="text-muted-foreground">• Stockage local instantané</p>
          </div>
        </div>

        <Button 
          onClick={migrateData}
          disabled={migrating}
          className="w-full gap-2"
          size="lg"
        >
          {migrating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Migration en cours...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Migrer mes {supabaseCount} offres
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Cette opération prend quelques secondes
        </p>
      </Card>
    </div>
  );
}
