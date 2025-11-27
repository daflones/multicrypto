-- =====================================================
-- OTIMIZAÇÃO DA ÁRVORE DE INDICAÇÃO
-- =====================================================
-- Cria função RPC otimizada para carregar árvore de indicação
-- com uma única query recursiva
-- =====================================================

-- Remover função existente se houver
DROP FUNCTION IF EXISTS get_referral_tree_optimized(UUID);

-- Função otimizada para buscar árvore de indicação
CREATE OR REPLACE FUNCTION get_referral_tree_optimized(root_user_id UUID)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  phone VARCHAR,
  referral_code VARCHAR,
  created_at TIMESTAMP,
  balance NUMERIC,
  total_invested NUMERIC,
  referred_by UUID,
  level INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE referral_tree AS (
    -- Nível 1: Indicações diretas
    SELECT 
      u.id,
      u.email,
      u.phone,
      u.referral_code,
      u.created_at,
      u.balance,
      COALESCE(inv.total_invested, 0) as total_invested,
      u.referred_by,
      1 as level
    FROM users u
    LEFT JOIN (
      SELECT 
        user_id,
        SUM(amount) as total_invested
      FROM user_investments
      GROUP BY user_id
    ) inv ON u.id = inv.user_id
    WHERE u.referred_by = root_user_id
    
    UNION ALL
    
    -- Níveis 2-7: Indicações indiretas
    SELECT 
      u.id,
      u.email,
      u.phone,
      u.referral_code,
      u.created_at,
      u.balance,
      COALESCE(inv.total_invested, 0) as total_invested,
      u.referred_by,
      rt.level + 1
    FROM users u
    LEFT JOIN (
      SELECT 
        user_id,
        SUM(amount) as total_invested
      FROM user_investments
      GROUP BY user_id
    ) inv ON u.id = inv.user_id
    INNER JOIN referral_tree rt ON u.referred_by = rt.id
    WHERE rt.level < 7  -- Limitar a 7 níveis
  )
  SELECT 
    rt.id,
    rt.email,
    rt.phone,
    rt.referral_code,
    rt.created_at,
    rt.balance,
    rt.total_invested,
    rt.referred_by,
    rt.level
  FROM referral_tree rt
  ORDER BY rt.level, rt.created_at;
END;
$$;

-- Remover função de estatísticas existente se houver
DROP FUNCTION IF EXISTS get_team_stats_optimized(UUID);

-- Função para buscar estatísticas da equipe de forma otimizada
CREATE OR REPLACE FUNCTION get_team_stats_optimized(root_user_id UUID)
RETURNS TABLE (
  level1_count INTEGER,
  level2_count INTEGER,
  level3_count INTEGER,
  level4_count INTEGER,
  level5_count INTEGER,
  level6_count INTEGER,
  level7_count INTEGER,
  total_team_size INTEGER,
  total_team_invested NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  stats_record RECORD;
BEGIN
  -- Usar a função de árvore otimizada para calcular estatísticas
  SELECT 
    COUNT(CASE WHEN level = 1 THEN 1 END)::INTEGER as level1_count,
    COUNT(CASE WHEN level = 2 THEN 1 END)::INTEGER as level2_count,
    COUNT(CASE WHEN level = 3 THEN 1 END)::INTEGER as level3_count,
    COUNT(CASE WHEN level = 4 THEN 1 END)::INTEGER as level4_count,
    COUNT(CASE WHEN level = 5 THEN 1 END)::INTEGER as level5_count,
    COUNT(CASE WHEN level = 6 THEN 1 END)::INTEGER as level6_count,
    COUNT(CASE WHEN level = 7 THEN 1 END)::INTEGER as level7_count,
    COUNT(*)::INTEGER as total_team_size,
    COALESCE(SUM(total_invested), 0) as total_team_invested
  INTO stats_record
  FROM get_referral_tree_optimized(root_user_id);
  
  RETURN QUERY
  SELECT 
    stats_record.level1_count,
    stats_record.level2_count,
    stats_record.level3_count,
    stats_record.level4_count,
    stats_record.level5_count,
    stats_record.level6_count,
    stats_record.level7_count,
    stats_record.total_team_size,
    stats_record.total_team_invested;
END;
$$;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_referred_by_created ON users(referred_by, created_at) WHERE referred_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_investments_user_amount ON user_investments(user_id, amount);

-- =====================================================
-- RESUMO DAS OTIMIZAÇÕES:
-- =====================================================
-- ✅ get_referral_tree_optimized: Uma única query recursiva
-- ✅ get_team_stats_optimized: Estatísticas em uma query
-- ✅ Índices otimizados para consultas de indicação
-- ✅ Reduz de 8+ queries para 1 query principal
-- =====================================================
