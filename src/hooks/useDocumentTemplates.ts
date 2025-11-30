import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DocumentTemplate {
  id: string;
  user_id: string;
  type: 'cv' | 'lettre';
  name: string;
  file_url: string;
  is_default: boolean;
  created_at: string;
}

export function useDocumentTemplates() {
  const [cvTemplates, setCvTemplates] = useState<DocumentTemplate[]>([]);
  const [letterTemplates, setLetterTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCvTemplates([]);
        setLetterTemplates([]);
        return;
      }

      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const templates = (data || []) as DocumentTemplate[];
      setCvTemplates(templates.filter(t => t.type === 'cv'));
      setLetterTemplates(templates.filter(t => t.type === 'lettre'));
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const addTemplate = async (template: { type: 'cv' | 'lettre'; name: string; file_url: string; is_default?: boolean }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('document_templates')
        .insert({
          user_id: user.id,
          type: template.type,
          name: template.name,
          file_url: template.file_url,
          is_default: template.is_default || false
        })
        .select()
        .single();

      if (error) throw error;
      
      const newTemplate = data as DocumentTemplate;
      if (template.type === 'cv') {
        setCvTemplates(prev => [newTemplate, ...prev]);
      } else {
        setLetterTemplates(prev => [newTemplate, ...prev]);
      }
      
      toast.success('Template ajouté');
      return data;
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('Erreur lors de l\'ajout du template');
      throw error;
    }
  };

  const deleteTemplate = async (id: string, type: 'cv' | 'lettre') => {
    try {
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      if (type === 'cv') {
        setCvTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        setLetterTemplates(prev => prev.filter(t => t.id !== id));
      }
      
      toast.success('Template supprimé');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const setDefaultTemplate = async (id: string, type: 'cv' | 'lettre') => {
    try {
      // Remove default from all templates of this type
      await supabase
        .from('document_templates')
        .update({ is_default: false })
        .eq('type', type);

      // Set new default
      const { error } = await supabase
        .from('document_templates')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      
      await fetchTemplates();
      toast.success('Template par défaut mis à jour');
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return { 
    cvTemplates, 
    letterTemplates, 
    loading, 
    addTemplate, 
    deleteTemplate,
    setDefaultTemplate,
    refetch: fetchTemplates 
  };
}
