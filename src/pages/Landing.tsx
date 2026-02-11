import React, { useState, useEffect } from 'react';
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
  Star,
  Coins,
  Users,
  Zap,
  CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCurrency } from '../hooks/useCurrency';
import LanguageSelector from '../components/common/LanguageSelector';

const LAUNCH_DATE = new Date('2025-02-25T00:00:00-03:00').getTime();

const useCountdown = (targetDate: number) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const diff = Math.max(targetDate - now, 0);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

const Landing: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { formatAmount } = useCurrency();
  const countdown = useCountdown(LAUNCH_DATE);

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-12 overflow-hidden">
              <img src="/images/logo.png" alt="Multi Crypto" className="h-full w-auto object-contain" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSelector showLabel={false} />
            
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full font-medium transition-all transform hover:scale-105 shadow-lg shadow-primary/25 flex items-center space-x-2"
              >
                <Wallet size={18} />
                <span>{t('dashboard.overview')}</span>
              </Link>
            ) : (
              <>
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
              </>
            )}
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
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl shadow-primary/25 flex items-center justify-center space-x-2"
              >
                <Wallet size={20} />
                <span>{t('dashboard.viewAll')}</span>
                <ArrowRight size={20} />
              </Link>
            ) : (
              <Link 
                to="/register" 
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl shadow-primary/25 flex items-center justify-center space-x-2"
              >
                <span>{t('landing.hero.cta')}</span>
                <ArrowRight size={20} />
              </Link>
            )}
            {/* Ver Video button - hidden for now
            <a 
              href="#video" 
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center space-x-2"
            >
              <Play size={20} className="fill-current" />
              <span>{t('landing.hero.watchVideo')}</span>
            </a>
            */}
          </div>

          {/* Pre-Launch Countdown */}
          <div className="mt-20 border-t border-white/10 pt-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-primary/20 border border-primary/30 rounded-full px-5 py-2 mb-6 animate-pulse">
              <Zap size={16} className="text-primary" />
              <span className="text-sm font-semibold text-primary">{t('landing.prelaunch.badge')}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{t('landing.prelaunch.title')}</h3>
            <p className="text-gray-400 mb-8">{t('landing.prelaunch.subtitle')}</p>
            <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-primary to-secondary bg-clip-text text-transparent">{String(countdown.days).padStart(2, '0')}</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{t('landing.prelaunch.days')}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-primary to-secondary bg-clip-text text-transparent">{String(countdown.hours).padStart(2, '0')}</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{t('landing.prelaunch.hours')}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-primary to-secondary bg-clip-text text-transparent">{String(countdown.minutes).padStart(2, '0')}</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{t('landing.prelaunch.minutes')}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-primary to-secondary bg-clip-text text-transparent">{String(countdown.seconds).padStart(2, '0')}</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{t('landing.prelaunch.seconds')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-6">{t('landing.prelaunch.date')}</p>
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

      {/* Multi Coin Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-primary/20 px-4 py-2 rounded-full mb-6">
                <Coins size={20} className="text-primary" />
                <span className="text-primary font-semibold">Multi Coin</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('landing.multicoin.title')}</h2>
              <p className="text-gray-400 text-lg mb-8">{t('landing.multicoin.desc')}</p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-success/20 rounded-lg">
                    <Zap size={20} className="text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{t('landing.multicoin.arbitrage.title')}</h4>
                    <p className="text-gray-400 text-sm">{t('landing.multicoin.arbitrage.desc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <TrendingUp size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{t('landing.multicoin.bot.title')}</h4>
                    <p className="text-gray-400 text-sm">{t('landing.multicoin.bot.desc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-secondary/20 rounded-lg">
                    <Shield size={20} className="text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{t('landing.multicoin.sustainability.title')}</h4>
                    <p className="text-gray-400 text-sm">{t('landing.multicoin.sustainability.desc')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-surface to-surface-light rounded-3xl p-8 border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="w-28 h-28 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30 overflow-hidden p-1">
                    <img src="/images/investimentos/bitcoin-gold.jpg" alt="Multi Coin" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Multi Coin</h3>
                  <p className="text-gray-400">{t('landing.multicoin.token')}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-success/20 to-success/5 rounded-xl border border-success/20">
                    <span className="text-gray-300 font-medium">{t('landing.multicoin.return')}</span>
                    <span className="text-success font-bold text-2xl">300%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-400">{t('landing.multicoin.minInvest')}</span>
                    <span className="text-white font-semibold">{formatAmount(50)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-400">{t('landing.multicoin.maxInvest')}</span>
                    <span className="text-white font-semibold">{formatAmount(10000)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-400">{t('landing.multicoin.yields')}</span>
                    <span className="text-primary font-semibold">{t('landing.multicoin.weekdays')}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-400">{t('landing.multicoin.withdrawYields')}</span>
                    <span className="text-white font-semibold">{t('landing.multicoin.mondays')}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-400">{t('landing.multicoin.withdrawNetwork')}</span>
                    <span className="text-white font-semibold">{t('landing.multicoin.everyday')}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-400">{t('landing.multicoin.fee')}</span>
                    <span className="text-white font-semibold">5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-surface/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.howItWorks.title')}</h2>
            <p className="text-gray-400 text-lg">{t('landing.howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">1</span>
                <Wallet size={32} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t('landing.howItWorks.step1.title')}</h3>
              <p className="text-gray-400">{t('landing.howItWorks.step1.desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center text-white font-bold text-sm">2</span>
                <TrendingUp size={32} className="text-success" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t('landing.howItWorks.step2.title')}</h3>
              <p className="text-gray-400">{t('landing.howItWorks.step2.desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">3</span>
                <Coins size={32} className="text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t('landing.howItWorks.step3.title')}</h3>
              <p className="text-gray-400">{t('landing.howItWorks.step3.desc')}</p>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background p-6 rounded-2xl border border-white/5 text-center">
              <CheckCircle size={24} className="text-success mx-auto mb-3" />
              <p className="text-sm text-gray-400">{t('landing.benefits.dailyYields')}</p>
            </div>
            <div className="bg-background p-6 rounded-2xl border border-white/5 text-center">
              <CheckCircle size={24} className="text-success mx-auto mb-3" />
              <p className="text-sm text-gray-400">{t('landing.benefits.weeklyWithdraw')}</p>
            </div>
            <div className="bg-background p-6 rounded-2xl border border-white/5 text-center">
              <CheckCircle size={24} className="text-success mx-auto mb-3" />
              <p className="text-sm text-gray-400">{t('landing.benefits.referralBonus')}</p>
            </div>
            <div className="bg-background p-6 rounded-2xl border border-white/5 text-center">
              <CheckCircle size={24} className="text-success mx-auto mb-3" />
              <p className="text-sm text-gray-400">{t('landing.benefits.lowFees')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Program Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-success/5 to-background pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-2 bg-success/20 px-4 py-2 rounded-full mb-6">
              <Users size={20} className="text-success" />
              <span className="text-success font-semibold">{t('landing.referral.badge')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.referral.title')}</h2>
            <p className="text-gray-400 text-lg">{t('landing.referral.subtitle')}</p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-surface to-surface-light rounded-3xl p-8 border border-white/10">
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{t('landing.referral.level')} 1</p>
                  <p className="text-2xl font-bold text-success">10%</p>
                  <p className="text-xs text-gray-600">{t('landing.referral.direct')}</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{t('landing.referral.level')} 2</p>
                  <p className="text-2xl font-bold text-primary">4%</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{t('landing.referral.level')} 3</p>
                  <p className="text-2xl font-bold text-secondary">2%</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{t('landing.referral.level')} 4</p>
                  <p className="text-2xl font-bold text-warning">1%</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{t('landing.referral.level')} 5</p>
                  <p className="text-2xl font-bold text-info">1%</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{t('landing.referral.level')} 6</p>
                  <p className="text-2xl font-bold text-purple-400">1%</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{t('landing.referral.level')} 7</p>
                  <p className="text-2xl font-bold text-gray-400">1%</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-success/10 rounded-xl border border-success/20">
                <p className="text-center text-success font-semibold">{t('landing.referral.total')}: 20%</p>
              </div>
              <p className="text-center text-gray-400 text-sm mt-4">{t('landing.referral.note')}</p>
            </div>
          </div>
        </div>
      </section>
      {/* Video Section - hidden for now
      <section id="video" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.video.title')}</h2>
          </div>
          
          <div className="max-w-4xl mx-auto aspect-video bg-surface rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative group">
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
      */}

      {/* Testimonials Section */}
      <section className="py-20 bg-surface/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.testimonials.title')}</h2>
            <p className="text-gray-400 text-lg">{t('landing.testimonials.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(t('landing.testimonials.list', { returnObjects: true }) as Array<{ name: string, role: string, text: string }>).map((testimonial, index) => (
              <TestimonialCard 
                key={index}
                image={`/images/feed/pessoa${index + 1}.png`}
                name={testimonial.name}
                role={testimonial.role}
                text={testimonial.text}
              />
            ))}
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
            {(t('landing.faq.list', { returnObjects: true }) as Array<{ question: string, answer: string }>).map((faq, index) => (
              <FAQItem 
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
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
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="inline-flex items-center justify-center space-x-2 bg-white text-primary hover:bg-gray-100 px-10 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-xl"
          >
            <span>{isAuthenticated ? t('dashboard.viewAll') : t('landing.cta_footer.button')}</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-background border-t border-white/10 py-10">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; 2025 Multi Crypto. {t('landing.footer.rights')}</p>
          <p className="mt-2 text-xs text-gray-600">{t('landing.footer.tagline')}</p>
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
