import { z } from 'zod';

// CPF validation function
export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
};

// Phone validation
export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 || cleanPhone.length === 11;
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

// Zod schemas
export const registerSchema = z.object({
  cpf: z.string()
    .min(11, 'CPF deve ter 11 dígitos')
    .refine(validateCPF, 'CPF inválido'),
  email: z.string()
    .email('Email inválido'),
  phone: z.string()
    .min(10, 'Telefone inválido')
    .refine(validatePhone, 'Telefone inválido'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  // Código de convite é opcional; quando presente, até 8 chars
  referralCode: z
    .string()
    .max(8, 'Código de convite inválido')
    .optional()
    .or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const depositSchema = z.object({
  amount: z.number()
    .min(10, 'Valor mínimo de R$ 10,00')
    .max(50000, 'Valor máximo de R$ 50.000,00'),
  paymentMethod: z.enum(['pix', 'trc20', 'bep20']),
  proofFile: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Arquivo deve ter no máximo 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type),
      'Apenas imagens (JPG, PNG) ou PDF são aceitos'
    ),
});

export const withdrawSchema = z.object({
  amount: z.number()
    .min(50, 'Valor mínimo de R$ 50,00')
    .max(10000, 'Valor máximo de R$ 10.000,00'),
  paymentMethod: z.enum(['pix', 'crypto']),
  balanceType: z.enum(['main', 'commission']),
  pixKey: z.string().optional(),
  pixKeyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).optional(),
  walletAddress: z.string().optional(),
}).refine((data) => {
  if (data.paymentMethod === 'pix' && (!data.pixKey || !data.pixKeyType)) {
    return false;
  }
  if (data.paymentMethod === 'crypto' && !data.walletAddress) {
    return false;
  }
  return true;
}, {
  message: "Dados de pagamento são obrigatórios",
  path: ["pixKey"],
});

export const investmentSchema = z.object({
  productId: z.string().uuid('Produto inválido'),
  amount: z.number().min(1, 'Valor deve ser maior que zero'),
});

// Wallet address validation
export const validateWalletAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address || address.length < 26) {
    return { isValid: false, error: 'Endereço de carteira inválido' };
  }
  
  // Validação básica para endereços de criptomoeda
  const isValidFormat = /^[a-zA-Z0-9]{26,}$/.test(address);
  
  if (!isValidFormat) {
    return { isValid: false, error: 'Formato de endereço inválido' };
  }
  
  return { isValid: true };
};



// File validation
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

  if (file.size > maxSize) {
    return { isValid: false, error: 'Arquivo deve ter no máximo 5MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Apenas imagens (JPG, PNG) ou PDF são aceitos' };
  }

  return { isValid: true };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .trim();
};

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type DepositFormData = z.infer<typeof depositSchema>;
export type WithdrawFormData = z.infer<typeof withdrawSchema>;
export type InvestmentFormData = z.infer<typeof investmentSchema>;
