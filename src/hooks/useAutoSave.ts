import { useEffect, useRef, useState, useCallback } from 'react';

interface AutoSaveOptions {
  interval?: number; // en millisecondes
  onSave?: () => void;
}

export function useAutoSave(options: AutoSaveOptions = {}) {
  const { interval = 30000, onSave } = options;
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveRef = useRef(onSave);
  
  // Mettre à jour la ref quand onSave change
  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  // Fonction de sauvegarde manuelle
  const triggerSave = useCallback(() => {
    if (saveRef.current) {
      saveRef.current();
    }
    setLastSaved(new Date());
  }, []);

  // Auto-save à intervalles réguliers
  useEffect(() => {
    const timer = setInterval(() => {
      triggerSave();
    }, interval);

    return () => clearInterval(timer);
  }, [interval, triggerSave]);

  // Formatter l'heure de dernière sauvegarde
  const formattedLastSave = lastSaved 
    ? lastSaved.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })
    : null;

  return {
    lastSaved,
    formattedLastSave,
    triggerSave,
  };
}
