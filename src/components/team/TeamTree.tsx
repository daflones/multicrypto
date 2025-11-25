import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { AuthService } from '../../services/auth.service';
import { CommissionService } from '../../services/commission.service';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface TeamMember {
  id: string;
  email: string;
  referral_code: string;
  created_at: string;
  balance: number;
  total_invested: number;
  referred_by?: string;
}

interface TeamTreeProps {
  userId?: string;
}

const TeamTree: React.FC<TeamTreeProps> = ({ userId }) => {
  const [teamData, setTeamData] = useState<{
    level1: TeamMember[];
    level2: TeamMember[];
    level3: TeamMember[];
    level4: TeamMember[];
    level5: TeamMember[];
    level6: TeamMember[];
    level7: TeamMember[];
  }>({ level1: [], level2: [], level3: [], level4: [], level5: [], level6: [], level7: [] });
  const [teamStats, setTeamStats] = useState<any>(null);
  const [commissionStats, setCommissionStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<{ [key: number]: boolean }>({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false
  });

  const { user } = useAuthStore();
  const currentUserId = userId || user?.id;

  useEffect(() => {
    if (currentUserId) {
      loadTeamData();
    }
  }, [currentUserId]);

  const loadTeamData = async () => {
    if (!currentUserId) return;

    try {
      setIsLoading(true);
      
      // Load team tree
      const referralTree = await AuthService.getReferralTree(currentUserId);
      setTeamData(referralTree);

      // Load team stats
      const teamStatsData = await CommissionService.getTeamStats(currentUserId);
      setTeamStats(teamStatsData);

      // Load commission stats
      const commissionStatsData = await CommissionService.getCommissionStats(currentUserId);
      setCommissionStats(commissionStatsData);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLevel = (level: number) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const renderTeamLevel = (members: TeamMember[], level: number, title: string, color: string) => {
    const isExpanded = expandedLevels[level];
    
    return (
      <div className="bg-surface rounded-lg overflow-hidden">
        <button
          onClick={() => toggleLevel(level)}
          className="w-full p-4 flex items-center justify-between hover:bg-surface-light transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">{level}</span>
            </div>
            <div className="text-left">
              <h3 className="text-white font-semibold">{title}</h3>
              <p className="text-gray-400 text-sm">{members.length} membros</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">
              {level === 1 && '10%'}
              {level === 2 && '4%'}
              {level === 3 && '2%'}
              {level === 4 && '1%'}
              {level === 5 && '1%'}
              {level === 6 && '1%'}
              {level === 7 && '1%'}
            </span>
            {isExpanded ? (
              <ChevronDown className="text-gray-400" size={20} />
            ) : (
              <ChevronRight className="text-gray-400" size={20} />
            )}
          </div>
        </button>

        {isExpanded && members.length > 0 && (
          <div className="border-t border-surface-light">
            {members.map((member) => (
              <div key={member.id} className="p-4 border-b border-surface-light last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white font-medium">
                        {member.email.split('@')[0]}***
                      </span>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        {member.referral_code}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{formatDate(member.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp size={14} />
                        <span>{formatCurrency(member.total_invested || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isExpanded && members.length === 0 && (
          <div className="p-8 text-center border-t border-surface-light">
            <Users className="text-gray-400 mx-auto mb-2" size={24} />
            <p className="text-gray-400 text-sm">Nenhum membro neste nível ainda</p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-surface-light rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-light rounded w-1/3"></div>
                <div className="h-3 bg-surface-light rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Stats */}
      {teamStats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {teamStats.totalTeamSize}
            </div>
            <div className="text-sm text-gray-400">Total da Equipe</div>
          </div>
          
          <div className="bg-surface rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success mb-1">
              {commissionStats ? formatCurrency(commissionStats.totalCommissions) : 'R$ 0,00'}
            </div>
            <div className="text-sm text-gray-400">Comissões Totais</div>
          </div>
        </div>
      )}

      {/* Commission Stats */}
      {commissionStats && (
        <div className="bg-surface rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Resumo de Comissões</h3>
          <div className="grid grid-cols-3 gap-3 text-center mb-3">
            <div>
              <div className="text-base font-bold text-primary mb-1">
                {formatCurrency(commissionStats.level1Total)}
              </div>
              <div className="text-xs text-gray-400">Nível 1 (10%)</div>
            </div>
            <div>
              <div className="text-base font-bold text-secondary mb-1">
                {formatCurrency(commissionStats.level2Total)}
              </div>
              <div className="text-xs text-gray-400">Nível 2 (4%)</div>
            </div>
            <div>
              <div className="text-base font-bold text-warning mb-1">
                {formatCurrency(commissionStats.level3Total)}
              </div>
              <div className="text-xs text-gray-400">Nível 3 (2%)</div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-success mb-1">
                {formatCurrency(commissionStats.level4Total || 0)}
              </div>
              <div className="text-xs text-gray-400">N4 (1%)</div>
            </div>
            <div>
              <div className="text-sm font-bold text-success mb-1">
                {formatCurrency(commissionStats.level5Total || 0)}
              </div>
              <div className="text-xs text-gray-400">N5 (1%)</div>
            </div>
            <div>
              <div className="text-sm font-bold text-success mb-1">
                {formatCurrency(commissionStats.level6Total || 0)}
              </div>
              <div className="text-xs text-gray-400">N6 (1%)</div>
            </div>
            <div>
              <div className="text-sm font-bold text-success mb-1">
                {formatCurrency(commissionStats.level7Total || 0)}
              </div>
              <div className="text-xs text-gray-400">N7 (1%)</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-surface-light">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Este mês:</span>
              <span className="text-success font-semibold">
                {formatCurrency(commissionStats.thisMonthTotal)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Team Levels */}
      <div className="space-y-4">
        {renderTeamLevel(
          teamData.level1, 
          1, 
          'Nível 1 - Diretos', 
          'bg-primary'
        )}
        
        {renderTeamLevel(
          teamData.level2, 
          2, 
          'Nível 2', 
          'bg-secondary'
        )}
        
        {renderTeamLevel(
          teamData.level3, 
          3, 
          'Nível 3', 
          'bg-warning'
        )}
        
        {renderTeamLevel(
          teamData.level4, 
          4, 
          'Nível 4', 
          'bg-success'
        )}
        
        {renderTeamLevel(
          teamData.level5, 
          5, 
          'Nível 5', 
          'bg-success'
        )}
        
        {renderTeamLevel(
          teamData.level6, 
          6, 
          'Nível 6', 
          'bg-success'
        )}
        
        {renderTeamLevel(
          teamData.level7, 
          7, 
          'Nível 7', 
          'bg-success'
        )}
      </div>

      {/* Empty State */}
      {teamStats?.totalTeamSize === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Sua equipe está vazia</h3>
          <p className="text-gray-400 mb-6">
            Comece a convidar amigos para formar sua equipe e ganhar comissões
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamTree;
