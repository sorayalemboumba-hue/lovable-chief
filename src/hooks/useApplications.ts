import { useState, useEffect } from 'react';
import { Application } from '@/types/application';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchApplications();
    } else {
      setApplications([]);
      setLoading(false);
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database format to Application format
      const transformedData: Application[] = (data || []).map(app => ({
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

      setApplications(transformedData);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const addApplication = async (application: Omit<Application, 'id' | 'createdAt'>) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          entreprise: application.entreprise,
          poste: application.poste,
          lieu: application.lieu,
          deadline: application.deadline,
          statut: application.statut,
          priorite: application.priorite,
          keywords: application.keywords,
          notes: application.notes,
          url: application.url,
          contacts: application.contacts as any || [],
          actions: application.actions as any || [],
          type: application.type,
          referent: application.referent,
          compatibility: application.compatibility,
          missing_requirements: application.missingRequirements as any || [],
          matching_skills: application.matchingSkills as any || [],
          original_offer_url: application.originalOfferUrl,
          publication_date: application.publicationDate,
          application_email: application.applicationEmail,
          application_instructions: application.applicationInstructions,
          required_documents: application.requiredDocuments as any || [],
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchApplications();
      toast.success('Offre créée');
    } catch (error: any) {
      console.error('Error adding application:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const updateApplication = async (id: string, updates: Partial<Application>) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          entreprise: updates.entreprise,
          poste: updates.poste,
          lieu: updates.lieu,
          deadline: updates.deadline,
          statut: updates.statut,
          priorite: updates.priorite,
          keywords: updates.keywords,
          notes: updates.notes,
          url: updates.url,
          contacts: updates.contacts as any,
          actions: updates.actions as any,
          type: updates.type,
          referent: updates.referent,
          compatibility: updates.compatibility,
          missing_requirements: updates.missingRequirements as any,
          matching_skills: updates.matchingSkills as any,
          original_offer_url: updates.originalOfferUrl,
          publication_date: updates.publicationDate,
          application_email: updates.applicationEmail,
          application_instructions: updates.applicationInstructions,
          required_documents: updates.requiredDocuments as any,
          cv_template_id: updates.cv_template_id,
          letter_template_id: updates.letter_template_id,
          is_complete: updates.is_complete,
          recommended_channel: updates.recommended_channel,
          ats_compliant: updates.ats_compliant,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchApplications();
      const isOffer = updates.statut === 'à compléter' || updates.statut === 'en cours';
      toast.success(isOffer ? 'Offre mise à jour' : 'Candidature mise à jour');
    } catch (error: any) {
      console.error('Error updating application:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteApplication = async (id: string) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      const app = applications.find(a => a.id === id);
      const isOffer = app && (app.statut === 'à compléter' || app.statut === 'en cours');

      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchApplications();
      toast.success(isOffer ? 'Offre supprimée' : 'Candidature supprimée');
    } catch (error: any) {
      console.error('Error deleting application:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const importApplications = async (apps: Partial<Application>[]) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      // Detect duplicates
      const existingKeys = new Set(
        applications.map(app => `${app.entreprise.toLowerCase()}-${app.poste.toLowerCase()}`)
      );
      
      const uniqueApps = apps.filter(app => 
        !existingKeys.has(`${app.entreprise?.toLowerCase()}-${app.poste?.toLowerCase()}`)
      );

      const appsToInsert = uniqueApps.map(app => ({
        entreprise: app.entreprise || 'À préciser',
        poste: app.poste || 'À préciser',
        lieu: app.lieu || 'À préciser',
        deadline: app.deadline || new Date().toISOString(),
        statut: app.statut || 'à compléter',
        priorite: app.priorite || 3,
        keywords: app.keywords,
        notes: app.notes,
        url: app.url,
        contacts: app.contacts as any || [],
        actions: app.actions as any || [],
        type: app.type,
        referent: app.referent,
        compatibility: app.compatibility,
        missing_requirements: app.missingRequirements as any || [],
        matching_skills: app.matchingSkills as any || [],
        original_offer_url: app.originalOfferUrl,
        publication_date: app.publicationDate,
        application_email: app.applicationEmail,
        application_instructions: app.applicationInstructions,
        required_documents: app.requiredDocuments as any || [],
        user_id: user.id,
      }));

      if (appsToInsert.length === 0) {
        toast.warning('Aucune nouvelle donnée à importer (doublons détectés)');
        return;
      }

      const { error } = await supabase
        .from('applications')
        .insert(appsToInsert);

      if (error) throw error;

      await fetchApplications();
      
      const duplicates = apps.length - uniqueApps.length;
      toast.success(`${uniqueApps.length} élément(s) importé(s)${duplicates > 0 ? ` (${duplicates} doublon(s) ignoré(s))` : ''}`);
    } catch (error: any) {
      console.error('Error importing applications:', error);
      toast.error('Erreur lors de l\'importation');
    }
  };

  return {
    applications,
    loading,
    user,
    addApplication,
    updateApplication,
    deleteApplication,
    importApplications,
    refetch: fetchApplications,
  };
}
