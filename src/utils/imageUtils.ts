// Utility para gerar imagens placeholder para os produtos
export const generatePlaceholderImage = (productName: string, color: string = '#3B82F6'): string => {
  // Criar SVG placeholder
  const svg = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <rect x="20" y="20" width="260" height="160" fill="none" stroke="white" stroke-width="2" stroke-dasharray="5,5"/>
      <text x="150" y="90" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
        ${productName}
      </text>
      <text x="150" y="110" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12">
        Investimento
      </text>
      <text x="150" y="130" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12">
        Crypto
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Cores para cada tipo de produto
export const productColors = {
  'Crypto Starter': '#10B981', // Verde
  'Bitcoin Bronze': '#F59E0B', // Amarelo/Bronze
  'Ethereum Silver': '#6B7280', // Cinza/Prata
  'DeFi Basic': '#8B5CF6', // Roxo
  'Bitcoin Gold': '#F59E0B', // Dourado
  'Ethereum Platinum': '#374151', // Cinza escuro/Platina
  'DeFi Advanced': '#EF4444', // Vermelho
  'Crypto Master': '#1F2937', // Preto/Premium
  'Multi Coin': '#F59E0B', // Dourado para Multi Coin
  'default': '#3B82F6', // Azul padrão
};

// Mapeamento de nomes de produtos para imagens reais
export const productImagePaths = {
  'Crypto Starter': '/images/investimentos/crypto-starter.jpg',
  'Bitcoin Bronze': '/images/investimentos/bitcoin-bronze.jpg',
  'Ethereum Silver': '/images/investimentos/ethereum-silver.jpg',
  'DeFi Basic': '/images/investimentos/defi-basic.jpg',
  'Bitcoin Gold': '/images/investimentos/bitcoin-gold.jpg',
  'Ethereum Platinum': '/images/investimentos/ethereum-platinum.jpg',
  'DeFi Advanced': '/images/investimentos/defi-advanced.jpg',
  'Crypto Master': '/images/investimentos/crypto-master.jpg',
  'Multi Coin': '/images/investimentos/bitcoin-gold.jpg', // Usar Bitcoin Gold como fallback
};

// Função para obter imagem do produto
export const getProductImage = (productName: string): string => {
  // Primeiro, tentar usar imagem real
  const realImagePath = productImagePaths[productName as keyof typeof productImagePaths];
  if (realImagePath) {
    return realImagePath;
  }
  
  // Se não encontrar imagem real, gerar placeholder
  const color = productColors[productName as keyof typeof productColors] || productColors.default;
  return generatePlaceholderImage(productName, color);
};
