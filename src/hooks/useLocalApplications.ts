import { useState, useEffect } from 'react';
import { Application } from '@/types/application';
import { loadFromStorage, saveToStorage } from '@/lib/storage';
import { toast } from 'sonner';

const STORAGE_KEY = 'sosoflow_applications';

export function useLocalApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadFromStorage<Application[]>(STORAGE_KEY, []);
    setApplications(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      saveToStorage(STORAGE_KEY, applications);
    }
  }, [applications, loading]);

  const addApplication = async (application: Omit<Application, 'id' | 'createdAt'>): Promise<string> => {
    const newApp: Application = {
      ...application,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      contacts: application.contacts || [],
      actions: application.actions || [],
    };

    setApplications(prev => [...prev, newApp]);
    toast.success('Offre créée');
    return newApp.id;
  };

  const updateApplication = async (id: string, updates: Partial<Application>) => {
    setApplications(prev =>
      prev.map(app => (app.id === id ? { ...app, ...updates } : app))
    );
    
    const app = applications.find(a => a.id === id);
    const isOffer = app && (app.statut === 'à compléter' || app.statut === 'en cours');
    toast.success(isOffer ? 'Offre mise à jour' : 'Candidature mise à jour');
  };

  const deleteApplication = async (id: string) => {
    const app = applications.find(a => a.id === id);
    const isOffer = app && (app.statut === 'à compléter' || app.statut === 'en cours');
    
    setApplications(prev => prev.filter(app => app.id !== id));
    toast.success(isOffer ? 'Offre supprimée' : 'Candidature supprimée');
  };

  const importApplications = async (apps: Partial<Application>[]): Promise<string[]> => {
    const existingKeys = new Set(
      applications.map(app => `${app.entreprise.toLowerCase()}-${app.poste.toLowerCase()}`)
    );
    
    const uniqueApps = apps.filter(app => 
      !existingKeys.has(`${app.entreprise?.toLowerCase()}-${app.poste?.toLowerCase()}`)
    );

    const newApps: Application[] = uniqueApps.map(app => ({
      id: crypto.randomUUID(),
      entreprise: app.entreprise || 'À préciser',
      poste: app.poste || 'À préciser',
      lieu: app.lieu || 'À préciser',
      deadline: app.deadline || new Date().toISOString(),
      statut: app.statut || 'à compléter',
      priorite: app.priorite || 3,
      keywords: app.keywords,
      notes: app.notes,
      url: app.url,
      contacts: app.contacts || [],
      actions: app.actions || [],
      createdAt: new Date().toISOString(),
      type: app.type,
      referent: app.referent,
      compatibility: app.compatibility,
      missingRequirements: app.missingRequirements || [],
      matchingSkills: app.matchingSkills || [],
      originalOfferUrl: app.originalOfferUrl,
      publicationDate: app.publicationDate,
      applicationEmail: app.applicationEmail,
      applicationInstructions: app.applicationInstructions,
      requiredDocuments: app.requiredDocuments || [],
      cv_template_id: app.cv_template_id,
      letter_template_id: app.letter_template_id,
      is_complete: app.is_complete || false,
      recommended_channel: app.recommended_channel,
      ats_compliant: app.ats_compliant ?? true,
    }));

    if (newApps.length === 0) {
      toast.warning('Aucune nouvelle donnée à importer (doublons détectés)');
      return [];
    }

    setApplications(prev => [...prev, ...newApps]);
    
    const duplicates = apps.length - uniqueApps.length;
    toast.success(`${newApps.length} élément(s) importé(s)${duplicates > 0 ? ` (${duplicates} doublon(s) ignoré(s))` : ''}`);
    
    return newApps.map(app => app.id);
  };

  const refetch = async () => {
    // No-op for localStorage, already reactive
  };

  return {
    applications,
    loading,
    addApplication,
    updateApplication,
    deleteApplication,
    importApplications,
    refetch,
  };
}
