import React, { useState } from 'react';
import { Users, Share2 } from 'lucide-react';
import ReferralLink from '../components/team/ReferralLink';
import TeamTree from '../components/team/TeamTree';

const Team: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'referral' | 'tree'>('referral');

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Minha Equipe</h1>
        <p className="text-gray-400">Convide amigos e ganhe comissões</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-surface rounded-lg p-1">
        <button
          onClick={() => setActiveTab('referral')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'referral'
              ? 'bg-primary text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Share2 size={16} />
          <span>Convidar</span>
        </button>
        <button
          onClick={() => setActiveTab('tree')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'tree'
              ? 'bg-primary text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users size={16} />
          <span>Minha Rede</span>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'referral' ? (
          <ReferralLink />
        ) : (
          <TeamTree />
        )}
      </div>
    </div>
  );
};

export default Team;
