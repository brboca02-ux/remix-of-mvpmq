import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Instagram, Mail, SkipForward, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuickAction } from '../types';

interface ActionBarProps {
  onAction: (action: QuickAction) => void;
  progress: { current: number; total: number };
  disabled?: boolean;
}

export function ActionBar({ onAction, progress, disabled }: ActionBarProps) {
  const [copied, setCopied] = useState(false);

  const handleAction = useCallback((action: QuickAction) => {
    onAction(action);
    if (action === 'whatsapp' || action === 'instagram' || action === 'email') {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [onAction]);

  return (
    <div className="flex items-center gap-1 h-10">
      <Button
        variant="ghost" size="icon"
        className="h-8 w-8 text-zinc-400 hover:text-emerald-400"
        onClick={() => handleAction('whatsapp')}
        disabled={disabled}
        title="WhatsApp (1)"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <MessageCircle className="w-4 h-4" />}
      </Button>
      <Button
        variant="ghost" size="icon"
        className="h-8 w-8 text-zinc-400 hover:text-pink-400"
        onClick={() => handleAction('instagram')}
        disabled={disabled}
        title="Instagram (2)"
      >
        <Instagram className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost" size="icon"
        className="h-8 w-8 text-zinc-400 hover:text-blue-400"
        onClick={() => handleAction('email')}
        disabled={disabled}
        title="Email (3)"
      >
        <Mail className="w-4 h-4" />
      </Button>
      <div className="w-px h-4 bg-zinc-800 mx-1" />
      <Button
        variant="ghost" size="icon"
        className="h-8 w-8 text-zinc-500 hover:text-zinc-300"
        onClick={() => handleAction('skip')}
        disabled={disabled}
        title="Pular (4)"
      >
        <SkipForward className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost" size="icon"
        className="h-8 w-8 text-zinc-500 hover:text-red-400"
        onClick={() => handleAction('discard')}
        disabled={disabled}
        title="Descartar (5)"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      <span className="ml-auto text-[11px] font-mono text-zinc-500 tabular-nums">
        {progress.current}/{progress.total}
      </span>
    </div>
  );
}
