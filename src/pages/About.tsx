import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Shield, Users, Award, ArrowRight } from 'lucide-react';

type AboutProps = {
  onBack?: () => void; // opcional: permite fechar o About quando exibido dentro de Login
};

const STORAGE_KEY = 'about_stats_v1';
const INTERVAL_MS = 60_000; // 1 minuto
const GROWTH = 1.03; // +3% por intervalo

const About: React.FC<AboutProps> = ({ onBack }) => {
  const navigate = useNavigate();
  // base: 500 investidores, 250k BRL
  const [investors, setInvestors] = useState(500);
  const [volume, setVolume] = useState(250000);

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  const loadAndProject = useMemo(() => {
    return () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const now = Date.now();
        const parsed = raw ? JSON.parse(raw) : null;
        const baseInvestors = parsed?.investors ?? 500;
        const baseVolume = parsed?.volume ?? 250000;
        const lastAt = parsed?.ts ?? now;
        const steps = Math.floor((now - lastAt) / INTERVAL_MS);
        const factor = Math.pow(GROWTH, Math.max(0, steps));
        return {
          investors: Math.floor(baseInvestors * factor),
          volume: Math.floor(baseVolume * factor),
          ts: lastAt + steps * INTERVAL_MS,
        };
      } catch {
        return { investors: 500, volume: 250000, ts: Date.now() };
      }
    };
  }, []);

  useEffect(() => {
    const apply = () => {
      const { investors: inv, volume: vol, ts } = loadAndProject();
      setInvestors(inv);
      setVolume(vol);
      // Persist the projected state as the new base
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ investors: inv, volume: vol, ts }));
    };
    apply();
    const id = setInterval(apply, INTERVAL_MS);
    const onVis = () => apply();
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [loadAndProject]);

  const handleBackToLogin = () => {
    onBack?.();
    navigate('/login');
  };
  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-6 text-center">
        <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4">
          <img src="/images/logo.png" alt="Multi Crypto" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Multi Crypto</h1>
        <p className="text-white/80">Plataforma de Investimentos em Criptomoedas</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Mission */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Nossa Missão</h2>
          <p className="text-gray-300 leading-relaxed">
            Democratizar o acesso aos investimentos em criptomoedas, oferecendo uma plataforma 
            segura, transparente e rentável para todos os brasileiros construírem seu patrimônio digital.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Por que escolher a Multi Crypto?</h2>
          
          <div className="space-y-4">
            <div className="bg-surface rounded-lg p-4 flex items-start space-x-4">
              <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-success" size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Rendimentos Diários</h3>
                <p className="text-gray-400 text-sm">
                  Receba rendimentos todos os dias automaticamente em sua conta, 
                  com transparência total sobre seus investimentos.
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-4 flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Segurança Garantida</h3>
                <p className="text-gray-400 text-sm">
                  Utilizamos as melhores práticas de segurança para proteger seus dados 
                  e investimentos com criptografia de ponta.
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-4 flex items-start space-x-4">
              <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="text-secondary" size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Sistema de Referência</h3>
                <p className="text-gray-400 text-sm">
                  Ganhe até 18% de comissão sobre os investimentos da sua equipe 
                  em 3 níveis de profundidade.
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-4 flex items-start space-x-4">
              <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Award className="text-warning" size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Suporte Especializado</h3>
                <p className="text-gray-400 text-sm">
                  Nossa equipe está sempre disponível para ajudar você a maximizar 
                  seus resultados e esclarecer dúvidas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats (com crescimento persistente) */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white text-center mb-6">Nossos Números</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary mb-1">{investors.toLocaleString('pt-BR')}</p>
              <p className="text-gray-400 text-sm">Investidores Ativos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success mb-1">{formatBRL(volume)}</p>
              <p className="text-gray-400 text-sm">Volume Investido</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary mb-1">99.9%</p>
              <p className="text-gray-400 text-sm">Uptime</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning mb-1">24/7</p>
              <p className="text-gray-400 text-sm">Suporte</p>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center">Como Funciona</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="text-white font-medium">Cadastre-se</h3>
                <p className="text-gray-400 text-sm">Crie sua conta com um código de convite</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="text-white font-medium">Faça um Depósito</h3>
                <p className="text-gray-400 text-sm">Adicione fundos via PIX ou criptomoedas</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h3 className="text-white font-medium">Escolha um Plano</h3>
                <p className="text-gray-400 text-sm">Selecione o produto que melhor se adequa ao seu perfil</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">4</span>
              </div>
              <div>
                <h3 className="text-white font-medium">Receba Rendimentos</h3>
                <p className="text-gray-400 text-sm">Ganhe rendimentos diários automaticamente</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Pronto para Começar?</h2>
          <p className="text-gray-400">
            Junte-se a milhares de investidores que já estão construindo seu futuro financeiro.
          </p>
          <div className="space-y-3">
            <Link
              to="/register"
              className="block w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
            >
              <span>Criar Conta Grátis</span>
              <ArrowRight size={20} />
            </Link>
            <button
              onClick={handleBackToLogin}
              className="block w-full bg-surface text-white py-3 rounded-lg font-medium hover:bg-surface-light transition-colors"
            >
              Já tenho uma conta
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-surface-light">
          <p className="text-gray-400 text-sm">
            © 2024 Multi Crypto. Todos os direitos reservados.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Investimentos envolvem riscos. Invista com responsabilidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
