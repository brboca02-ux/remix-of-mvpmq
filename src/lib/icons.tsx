import React, { ComponentType, useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";
import {
  Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, BarChart3, BookOpen, Bot,
  Briefcase, Building2, Calendar, Camera, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, ChevronUp, Circle, ClipboardList, ClipboardPaste,
  Clock, Compass, Contact, Copy, Database, Download, ExternalLink, Facebook,
  FileDown, FileText, FileUp, Filter, Flame, Gauge, GitCompare, Globe,
  GripVertical, HelpCircle, History, Image, Inbox, Info, Instagram, Layout, LayoutList,
  Lightbulb, Linkedin, Loader2, LogOut, Mail, MapPin, Megaphone, MessageCircle,
  MessageSquare, Minus, Monitor, MoreHorizontal, MoreVertical, PanelLeft, Paperclip,
  PenTool, Phone, Play, Plus, PlusCircle, RefreshCw, RotateCcw, Save, ScanText, Search,
  SearchCode, Send, Server, Share2, ShieldAlert, ShieldCheck, Smartphone, Snowflake,
  Sparkles, Star, Tablet, Target, Tractor, Trash2, TrendingUp, Trophy, Twitter, Upload,
  User, UserCheck, Users, X, XCircle, Youtube, Zap, Tag, PieChart, Layers, Shapes, Sticker,
  ArrowUpRight, ArrowDownRight, Hash, Link, ListFilter, MousePointer2, Settings, ListChecks, CheckCircle,
  UserMinus, Ban, Accessibility,
  type LucideProps,
} from "lucide-react";
import { logger } from "@/lib/logger";

/**
 * Registro global de monitoramento de ícones (telemetria de UI)
 */
export const iconRegistry = {
  loaded: new Set<string>(),
  errors: new Set<string>(),
  listeners: new Set<(status: { loaded: number; errors: number }) => void>(),

  track(name: string, success: boolean) {
    if (success) this.loaded.add(name);
    else this.errors.add(name);
    this.notify();
  },
  notify() {
    this.listeners.forEach(cb => cb({ loaded: this.loaded.size, errors: this.errors.size }));
  },
  subscribe(cb: (status: { loaded: number; errors: number }) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  },
};

interface SafeIconProps extends LucideProps {
  name: string;
  fallback?: ComponentType<LucideProps>;
}

/**
 * Componente de renderização segura com fallback automático
 */
export const SafeIcon = ({ name, fallback: Fallback, ...props }: SafeIconProps) => {
  const icons = LucideIcons as unknown as Record<string, ComponentType<LucideProps>>;
  const IconComponent = icons[name];
  const ActualFallback = Fallback || HelpCircle;

  useEffect(() => {
    iconRegistry.track(name, !!IconComponent);
    if (!IconComponent && process.env.NODE_ENV !== "production") {
      logger.warn('Icon not found', { iconName: name });
    }
  }, [name, IconComponent]);

  if (!IconComponent) return <ActualFallback {...props} />;
  return <IconComponent {...props} />;
};

/**
 * Barra de Segurança visual - exibida apenas quando há erros
 */
export const IconSecurityMonitor = () => {
  const [status, setStatus] = useState({ loaded: 0, errors: 0 });

  useEffect(() => {
    return iconRegistry.subscribe(setStatus);
  }, []);

  if (status.errors === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive backdrop-blur-sm border border-destructive/20">
      <AlertTriangle className="h-3 w-3" />
      <span>{status.errors} ícones não carregados</span>
    </div>
  );
};

// Re-exportação centralizada e higienizada
export {
  Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, BarChart3, BookOpen, Bot,
  Briefcase, Building2, Calendar, Camera, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, ChevronUp, Circle, ClipboardList, ClipboardPaste,
  Clock, Compass, Contact, Copy, Database, Download, ExternalLink, Facebook,
  FileDown, FileText, FileUp, Filter, Flame, Gauge, GitCompare, Globe,
  GripVertical, HelpCircle, History, Image, Inbox, Info, Instagram, Layout, LayoutList,
  Lightbulb, Linkedin, Loader2, LogOut, Mail, MapPin, Megaphone, MessageCircle,
  MessageSquare, Minus, Monitor, MoreHorizontal, MoreVertical, PanelLeft, Paperclip,
  PenTool, Phone, Play, Plus, PlusCircle, RefreshCw, RotateCcw, Save, ScanText, Search,
  SearchCode, Send, Server, Share2, ShieldAlert, ShieldCheck, Smartphone, Snowflake,
  Sparkles, Star, Tablet, Target, Tractor, Trash2, TrendingUp, Trophy, Twitter, Upload,
  User, UserCheck, Users, X, XCircle, Youtube, Zap, Tag, PieChart, Layers, Shapes, Sticker,
  ArrowUpRight, ArrowDownRight, Hash, Link, ListFilter, MousePointer2, Settings, ListChecks, CheckCircle,
  UserMinus, Ban
};

export type IconName = keyof typeof LucideIcons;
