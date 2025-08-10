import React from 'react';
import QRCode from 'react-qr-code';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

import { formatCurrency } from '../../utils/formatters';

interface QRCodeGeneratorProps {
  amount: number;
  pixKey: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  amount, 
  pixKey
}) => {
  const [copied, setCopied] = useState(false);

  // Generate PIX payload according to Brazilian PIX standard
  const generatePixPayload = (key: string, value: number): string => {
    const merchantName = 'MULTI CRYPTO';
    const merchantCity = 'SAO PAULO';
    const txId = Math.random().toString(36).substring(2, 27).toUpperCase();
    
    // Format value with 2 decimal places
    const formattedValue = value.toFixed(2);
    
    // Build PIX payload
    let payload = '';
    payload += '000201'; // Payload Format Indicator
    payload += '010212'; // Point of Initiation Method
    payload += '26'; // Merchant Account Information
    payload += (14 + key.length).toString().padStart(2, '0'); // Length
    payload += '0014BR.GOV.BCB.PIX'; // GUI
    payload += '01' + key.length.toString().padStart(2, '0') + key; // PIX Key
    payload += '5204'; // Merchant Category Code
    payload += '0000'; // Transaction Currency (BRL)
    payload += '54' + formattedValue.length.toString().padStart(2, '0') + formattedValue; // Transaction Amount
    payload += '5802BR'; // Country Code
    payload += '59' + merchantName.length.toString().padStart(2, '0') + merchantName; // Merchant Name
    payload += '60' + merchantCity.length.toString().padStart(2, '0') + merchantCity; // Merchant City
    payload += '62' + (4 + txId.length).toString().padStart(2, '0'); // Additional Data Field
    payload += '05' + txId.length.toString().padStart(2, '0') + txId; // Reference Label
    payload += '6304'; // CRC16 placeholder
    
    // Calculate CRC16
    const crc = calculateCRC16(payload);
    payload += crc;
    
    return payload;
  };

  // CRC16 calculation for PIX
  const calculateCRC16 = (payload: string): string => {
    const polynomial = 0x1021;
    let crc = 0xFFFF;
    
    for (let i = 0; i < payload.length; i++) {
      crc ^= (payload.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ polynomial;
        } else {
          crc <<= 1;
        }
        crc &= 0xFFFF;
      }
    }
    
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  const pixPayload = generatePixPayload(pixKey, amount);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* QR Code */}
      <div className="bg-white p-6 rounded-xl flex items-center justify-center">
        <QRCode 
          value={pixPayload} 
          size={200}
          level="M"
        />
      </div>

      {/* Payment Info */}
      <div className="bg-surface rounded-lg p-4 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            Pagamento via PIX
          </h3>
          <p className="text-2xl font-bold text-success">
            {formatCurrency(amount)}
          </p>
        </div>

        {/* PIX Key */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Chave PIX:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={pixKey}
              readOnly
              className="flex-1 bg-background border border-surface-light rounded-lg px-3 py-2 text-white text-sm"
            />
            <button
              onClick={() => copyToClipboard(pixKey)}
              className="p-2 bg-primary hover:bg-primary/80 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="text-white" size={16} />
              ) : (
                <Copy className="text-white" size={16} />
              )}
            </button>
          </div>
        </div>

        {/* PIX Code */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Código PIX (Copia e Cola):
          </label>
          <div className="flex items-start space-x-2">
            <textarea
              value={pixPayload}
              readOnly
              rows={3}
              className="flex-1 bg-background border border-surface-light rounded-lg px-3 py-2 text-white text-sm resize-none"
            />
            <button
              onClick={() => copyToClipboard(pixPayload)}
              className="p-2 bg-primary hover:bg-primary/80 rounded-lg transition-colors flex-shrink-0"
            >
              {copied ? (
                <Check className="text-white" size={16} />
              ) : (
                <Copy className="text-white" size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <h4 className="text-primary font-semibold mb-2">Como pagar:</h4>
        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li>Abra o app do seu banco</li>
          <li>Escolha a opção PIX</li>
          <li>Escaneie o QR Code ou cole o código PIX</li>
          <li>Confirme o pagamento</li>
          <li>Envie o comprovante na próxima etapa</li>
        </ol>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
