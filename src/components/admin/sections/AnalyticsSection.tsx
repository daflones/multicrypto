import React from 'react';
import { BarChart3 } from 'lucide-react';

const AnalyticsSection: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400">Relatórios e métricas do sistema</p>
      </div>

      {/* Coming Soon */}
      <div className="text-center py-20">
        <BarChart3 size={64} className="text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Em Desenvolvimento</h2>
        <p className="text-gray-400">
          Seção de analytics será implementada em breve com gráficos e relatórios detalhados.
        </p>
      </div>
    </div>
  );
};

export default AnalyticsSection;
