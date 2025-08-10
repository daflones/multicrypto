import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SAO_PAULO_TZ } from './date';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatCPF = (cpf: string): string => {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
};

const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string' && YMD_REGEX.test(date)) {
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  }
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
};

export const formatDateTime = (date: Date | string): string => {
  if (typeof date === 'string' && YMD_REGEX.test(date)) {
    // For date-only inputs, render just the date to avoid TZ-induced previous day
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  }
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
};

// --- São Paulo timezone-aware formatters ---
export const formatDateSP = (date: Date | string): string => {
  // If it's a plain YMD, just reorder
  if (typeof date === 'string' && YMD_REGEX.test(date)) {
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: SAO_PAULO_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(d);
};

export const formatDateTimeSP = (date: Date | string): string => {
  // If it's a plain YMD, render date only
  if (typeof date === 'string' && YMD_REGEX.test(date)) {
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  const fmt = new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
  return fmt.format(d);
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

export const maskCPF = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPhone = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

export const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
