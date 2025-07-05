import { useState } from "react";

type Field = 'topic_content' | 'decision_content';

export function useTextImprovement(toast: any) {
  const [isImproving, setIsImproving] = useState<{ [K in Field]: boolean }>({
    topic_content: false,
    decision_content: false,
  });
  const [original, setOriginal] = useState<{ [K in Field]: string | null }>({
    topic_content: null,
    decision_content: null,
  });
  const [improved, setImproved] = useState<{ [K in Field]: string | null }>({
    topic_content: null,
    decision_content: null,
  });

  const handleImprove = async (field: Field, text: string) => {
    if (!text.trim()) return;
    setIsImproving(prev => ({ ...prev, [field]: true }));
    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (data.improvedText) {
        setOriginal(prev => ({ ...prev, [field]: text }));
        setImproved(prev => ({ ...prev, [field]: data.improvedText }));
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "נכשל שיפור הטקסט",
      });
    } finally {
      setIsImproving(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleAccept = (field: Field, setPopupEditingAgendaItem: any) => {
    if (improved[field]) {
      setPopupEditingAgendaItem((prev: any) =>
        prev ? { ...prev, [field]: improved[field] } : null
      );
      setOriginal(prev => ({ ...prev, [field]: null }));
      setImproved(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleRevert = (field: Field) => {
    setOriginal(prev => ({ ...prev, [field]: null }));
    setImproved(prev => ({ ...prev, [field]: null }));
  };

  return {
    isImproving,
    original,
    improved,
    handleImprove,
    handleAccept,
    handleRevert,
  };
} 