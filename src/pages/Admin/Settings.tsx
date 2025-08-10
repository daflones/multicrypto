import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="bg-surface p-4 rounded-md border border-gray-700 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Taxa de saque (%)</label>
          <input type="number" defaultValue={5} className="bg-black/30 border border-gray-700 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Moeda padrão</label>
          <select className="bg-black/30 border border-gray-700 rounded-md px-3 py-2">
            <option>BRL</option>
            <option>USD</option>
          </select>
        </div>
        <button className="px-3 py-2 rounded-md bg-primary hover:bg-primary/80">Salvar</button>
      </div>
    </div>
  );
};

export default Settings;
