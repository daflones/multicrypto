import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  Shield, 
  Clock, 
  Wallet, 
  Play, 
  ChevronDown,
  ArrowRight,
  Star
} from 'lucide-react';
import LanguageSelector from '../components/common/LanguageSelector';

const Landing: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src="/images/logo.png" alt="Multi Crypto" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Multi Crypto
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSelector showLabel={false} />
            <Link 
              to="/login" 
              className="hidden md:block text-gray-300 hover:text-white transition-colors"
            >
              {t('landing.hero.login')}
            </Link>
            <Link 
              to="/register" 
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full font-medium transition-all transform hover:scale-105 shadow-lg shadow-primary/25"
            >
              {t('landing.hero.cta')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 animate-fade-in-up">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">{t('landing.hero.badge')}</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight max-w-4xl mx-auto bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {t('landing.hero.title')}
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('landing.hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link 
              to="/register" 
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl shadow-primary/25 flex items-center justify-center space-x-2"
            >
              <span>{t('landing.hero.cta')}</span>
              <ArrowRight size={20} />
            </Link>
            <a 
              href="#video" 
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center space-x-2"
            >
              <Play size={20} className="fill-current" />
              <span>{t('landing.hero.watchVideo')}</span>
            </a>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-10 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-1">15k+</p>
              <p className="text-sm text-gray-500">{t('landing.stats.users')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success mb-1">R$ 2.5M+</p>
              <p className="text-sm text-gray-500">{t('landing.stats.paid')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-1">R$ 5.8M+</p>
              <p className="text-sm text-gray-500">{t('landing.stats.invested')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-1">4.9/5</p>
              <div className="flex justify-center text-yellow-500 mb-1">
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-surface/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.features.title')}</h2>
            <p className="text-gray-400 text-lg">{t('landing.features.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<TrendingUp size={32} className="text-success" />}
              title={t('landing.features.daily.title')}
              desc={t('landing.features.daily.desc')}
            />
            <FeatureCard 
              icon={<Shield size={32} className="text-primary" />}
              title={t('landing.features.secure.title')}
              desc={t('landing.features.secure.desc')}
            />
            <FeatureCard 
              icon={<Clock size={32} className="text-secondary" />}
              title={t('landing.features.support.title')}
              desc={t('landing.features.support.desc')}
            />
            <FeatureCard 
              icon={<Wallet size={32} className="text-warning" />}
              title={t('landing.features.withdraw.title')}
              desc={t('landing.features.withdraw.desc')}
            />
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section id="video" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.video.title')}</h2>
          </div>
          
          <div className="max-w-4xl mx-auto aspect-video bg-surface rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative group">
            {/* Placeholder de Vídeo - Substitua pelo iframe do YouTube real */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/40 transition-all cursor-pointer">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50 transform group-hover:scale-110 transition-transform">
                <Play size={32} className="text-white fill-current ml-1" />
              </div>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop" 
              alt="Video Thumbnail" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-surface/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.testimonials.title')}</h2>
            <p className="text-gray-400 text-lg">{t('landing.testimonials.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TestimonialCard 
              image="/images/feed/pessoa1.png"
              name="Ricardo Silva"
              role="Investidor desde 2023"
              text="Incrível como a plataforma é simples. Comecei com pouco e hoje tenho uma renda passiva que cobre minhas contas."
            />
            <TestimonialCard 
              image="/images/feed/pessoa2.png"
              name="Ana Beatriz"
              role="Trader Profissional"
              text="Já testei várias plataformas, mas a Multi Crypto é a única que entrega o que promete. Saques caem na hora!"
            />
            <TestimonialCard 
              image="/images/feed/pessoa3.png"
              name="Carlos Eduardo"
              role="Empresário"
              text="A transparência é o diferencial. Consigo acompanhar cada centavo de rendimento diário. Recomendo a todos."
            />
            <TestimonialCard 
              image="/images/feed/pessoa4.png"
              name="Fernando Lima"
              role="Estudante"
              text="Comecei sem saber nada de cripto e o suporte me ajudou em tudo. Ótima forma de começar a investir."
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.faq.title')}</h2>
          </div>

          <div className="space-y-4">
            <FAQItem 
              question="Como faço para começar?"
              answer="Basta criar sua conta gratuitamente, fazer um depósito via PIX ou Criptomoeda e escolher um dos planos de investimento disponíveis."
            />
            <FAQItem 
              question="Qual o valor mínimo para investir?"
              answer="Você pode começar a investir com apenas R$ 50,00. É acessível para todos os bolsos."
            />
            <FAQItem 
              question="Como funcionam os saques?"
              answer="Os saques podem ser solicitados a qualquer momento e são processados rapidamente via PIX ou para sua carteira de criptomoedas."
            />
            <FAQItem 
              question="É seguro investir?"
              answer="Sim, utilizamos tecnologia de ponta e criptografia avançada para proteger seus dados e seus ativos 24 horas por dia."
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('landing.cta_footer.title')}</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            {t('landing.cta_footer.subtitle')}
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center justify-center space-x-2 bg-white text-primary hover:bg-gray-100 px-10 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-xl"
          >
            <span>{t('landing.cta_footer.button')}</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-background border-t border-white/10 py-10">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; 2024 Multi Crypto. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

// Helper Components

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="bg-background p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-all hover:-translate-y-1 group">
    <div className="mb-4 p-3 bg-white/5 rounded-xl w-fit group-hover:bg-primary/10 transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
    <p className="text-gray-400">{desc}</p>
  </div>
);

const TestimonialCard: React.FC<{ image: string, name: string, role: string, text: string }> = ({ image, name, role, text }) => (
  <div className="bg-background p-6 rounded-2xl border border-white/5 relative">
    <div className="flex items-center space-x-4 mb-4">
      <img src={image} alt={name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
      <div>
        <h4 className="font-bold text-white">{name}</h4>
        <p className="text-xs text-primary">{role}</p>
      </div>
    </div>
    <p className="text-gray-300 text-sm italic">"{text}"</p>
    <div className="flex text-yellow-500 mt-4">
      <Star size={14} fill="currentColor" />
      <Star size={14} fill="currentColor" />
      <Star size={14} fill="currentColor" />
      <Star size={14} fill="currentColor" />
      <Star size={14} fill="currentColor" />
    </div>
  </div>
);

const FAQItem: React.FC<{ question: string, answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-surface/30">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-white/5 transition-colors"
      >
        <span className="font-medium text-white">{question}</span>
        <ChevronDown size={20} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 py-4 text-gray-400 border-t border-white/5 bg-black/20">
          {answer}
        </div>
      )}
    </div>
  );
};

export default Landing;
