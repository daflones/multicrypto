import React from 'react';
import { Settings } from 'lucide-react';

const SettingsSection: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-gray-400">Configurações gerais do sistema</p>
      </div>

      {/* Coming Soon */}
      <div className="text-center py-20">
        <Settings size={64} className="text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Em Desenvolvimento</h2>
        <p className="text-gray-400">
          Seção de configurações será implementada em breve com opções avançadas do sistema.
        </p>
      </div>
    </div>
  );
};

export default SettingsSection;
