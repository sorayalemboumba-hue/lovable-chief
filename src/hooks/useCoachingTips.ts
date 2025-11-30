import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CoachingTip {
  id: string;
  user_id: string;
  title: string;
  url: string | null;
  note: string;
  created_at: string;
}

export function useCoachingTips() {
  const [tips, setTips] = useState<CoachingTip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setTips([]);
        return;
      }

      const { data, error } = await supabase
        .from('coaching_tips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTips(data || []);
    } catch (error) {
      console.error('Error fetching tips:', error);
      toast.error('Erreur lors du chargement des tips');
    } finally {
      setLoading(false);
    }
  };

  const addTip = async (tip: { title: string; url?: string; note: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('coaching_tips')
        .insert({
          user_id: user.id,
          title: tip.title,
          url: tip.url || null,
          note: tip.note
        })
        .select()
        .single();

      if (error) throw error;
      
      setTips(prev => [data, ...prev]);
      toast.success('Tip ajouté avec succès');
      return data;
    } catch (error) {
      console.error('Error adding tip:', error);
      toast.error('Erreur lors de l\'ajout du tip');
      throw error;
    }
  };

  const deleteTip = async (id: string) => {
    try {
      const { error } = await supabase
        .from('coaching_tips')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTips(prev => prev.filter(t => t.id !== id));
      toast.success('Tip supprimé');
    } catch (error) {
      console.error('Error deleting tip:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  return { tips, loading, addTip, deleteTip, refetch: fetchTips };
}
