import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Wallet, FileText, PieChart, 
  Banknote, ShieldCheck, ArrowRight
} from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import AnimatedCounter from '../components/AnimatedCounter';
import { useQuery } from '@tanstack/react-query';
import { publicService } from '../services/publicService';

const staggerContainer: any = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const fadeInUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function LandingPage() {
  const { data: stats } = useQuery({
    queryKey: ['publicStats'],
    queryFn: publicService.getStats,
  });

  const defaultGrowth = [40, 60, 45, 80, 65, 100];
  const growthData = stats?.monthly_growth || defaultGrowth;

  return (
    <div className="flex flex-col w-full bg-white dark:bg-slate-900 transition-colors duration-300">

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-[#0B6B3A] via-[#065F46] to-[#064E3B] pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-green-300/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left: Text */}
            <motion.div 
              className="w-full lg:w-3/5 text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block bg-white/10 backdrop-blur-sm text-green-100 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/10">
                🚀 Trusted by 500+ Ethiopian Cooperatives
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Empowering Ethiopia's <br/><span className="text-[#F59E0B]">Cooperative</span> Economy
              </h1>
              <p className="text-green-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Bridging the gap between traditional community values and modern financial technology. The ultimate digital platform for Ethiopian SACCOs to securely manage members, scale savings, and drive local growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#F59E0B] hover:bg-amber-500 text-[#1E293B] font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Register Your SACCO <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full border-2 border-white/30 hover:bg-white/10 text-white font-semibold text-lg transition-all"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>

            {/* Right: Floating Dashboard Animation */}
            <motion.div
              className="w-full lg:w-2/5 flex justify-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              <div className="relative w-full max-w-md aspect-square bg-gradient-to-tr from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 border border-green-100 dark:border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden group">
                {/* Background Glows */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-[#F59E0B]/20 rounded-[3rem] blur-3xl mix-blend-screen"></div>
                
                {/* Main Dashboard Card */}
                <motion.div 
                  className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5 text-[#0B6B3A] dark:text-emerald-400" />
                       <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Awash SACCO Overview</span>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-4">
                    {/* Stat Box 1 */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-between">
                       <div>
                         <p className="text-emerald-800 dark:text-emerald-400 text-xs font-semibold mb-1 uppercase tracking-wider">Total Members</p>
                         <p className="text-2xl font-bold text-[#0B6B3A]">{stats?.active_members || 128}</p>
                       </div>
                       <div className="w-10 h-10 rounded-full bg-emerald-200/50 flex items-center justify-center">
                         <Users className="w-5 h-5 text-[#0B6B3A]" />
                       </div>
                    </div>
                    
                    {/* Stat Box 2 */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800/50 flex items-center justify-between">
                       <div>
                         <p className="text-amber-800 dark:text-amber-400 text-xs font-semibold mb-1 uppercase tracking-wider">Total Savings</p>
                         <p className="text-2xl font-bold text-amber-600">
                           {stats?.birr_managed ? (stats.birr_managed / 1000000).toFixed(1) + 'M' : '1.8M'} <span className="text-sm font-medium">ETB</span>
                         </p>
                       </div>
                       <div className="w-10 h-10 rounded-full bg-amber-200/50 flex items-center justify-center">
                         <Wallet className="w-5 h-5 text-amber-600" />
                       </div>
                    </div>

                    {/* Mini Chart */}
                    <div className="pt-2">
                       <p className="text-slate-500 text-xs font-semibold mb-3">MONTHLY GROWTH</p>
                       <div className="flex items-end gap-2 h-16">
                         {growthData.map((height: number, i: number) => (
                           <motion.div 
                             key={i} 
                             className="flex-1 bg-gradient-to-t from-[#0B6B3A] to-emerald-400 rounded-t-sm"
                             initial={{ height: 0 }}
                             animate={{ height: `${height}%` }}
                             transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                           />
                         ))}
                       </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Element 1 */}
                <motion.div 
                  className="absolute -right-6 top-12 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 flex items-center gap-3"
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Loan Approved</p>
                    <p className="text-[10px] text-slate-400">Just now</p>
                  </div>
                </motion.div>

                {/* Floating Element 2 */}
                <motion.div 
                  className="absolute -left-8 bottom-20 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 flex items-center gap-3"
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Banknote className="w-4 h-4 text-[#0B6B3A] dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Dividend Sent</p>
                    <p className="text-[10px] text-green-600 font-medium">+450 ETB</p>
                  </div>
                </motion.div>
                
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: stats?.saccos_registered || 12, suffix: '+', label: 'SACCOs Registered' },
              { value: stats?.active_members || 850, suffix: '+', label: 'Active Members' },
              { value: stats?.birr_managed ? stats.birr_managed / 1000000 : 4, suffix: 'M+', label: 'Birr Managed' },
              { value: 99, suffix: '.9%', label: 'Uptime SLA' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl md:text-4xl font-bold text-[#0B6B3A] dark:text-emerald-500">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] dark:text-white mb-4">
                Everything You Need to Run a SACCO
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                Our platform provides comprehensive tools for every aspect of cooperative management.
              </p>
            </div>
          </ScrollReveal>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {[
              { icon: Users, title: 'Member Management', desc: 'Complete KYC profiles, automated activity tracking, and detailed member analytics.', color: 'green' },
              { icon: Wallet, title: 'Savings & Deposits', desc: 'Real-time ledger updates, automated interest calculations, and multiple account types.', color: 'emerald' },
              { icon: FileText, title: 'Loan Processing', desc: 'Digital applications, multi-tier approval workflows, and credit scoring.', color: 'blue' },
              { icon: PieChart, title: 'Share Capital', desc: 'Transparent share allocation, ownership tracking, and transfer management.', color: 'purple' },
              { icon: Banknote, title: 'Dividend Distribution', desc: 'Automated calculations, equitable distribution, and comprehensive reporting.', color: 'amber' },
              { icon: ShieldCheck, title: 'Security & Compliance', desc: 'Bank-grade encryption, role-based access, and full audit trails.', color: 'slate' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-50 dark:bg-${feature.color}-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-bold text-[#1E293B] dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] dark:text-white mb-4">How It Works</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg">Get your SACCO digitized in three simple steps.</p>
            </div>
          </ScrollReveal>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {[
              { step: '01', title: 'Register', desc: 'Create your SACCO account and set up your organization profile in minutes.' },
              { step: '02', title: 'Onboard Members', desc: 'Invite members, complete KYC verification, and set up individual accounts.' },
              { step: '03', title: 'Start Managing', desc: 'Process savings, approve loans, track dividends, and generate reports.' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center p-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#0B6B3A] dark:bg-emerald-500/20 text-white dark:text-emerald-400 flex items-center justify-center text-2xl font-bold mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-[#1E293B] dark:text-white mb-3">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] dark:text-white mb-4">Trusted by Cooperatives</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg">Hear what our partner SACCOs have to say.</p>
            </div>
          </ScrollReveal>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {[
              { name: 'Abebe Kebede', role: 'Admin, Awash SACCO', quote: 'SACCO Manager transformed our manual processes. We now process loans 10x faster.' },
              { name: 'Tigist Hailu', role: 'Treasurer, Unity SACCO', quote: 'The dividend calculation feature alone saved us weeks of work each quarter.' },
              { name: 'Dawit Mengistu', role: 'Manager, Progress SACCO', quote: 'Our members love the transparency. They can see their savings grow in real-time.' },
            ].map((t, i) => (
              <motion.div key={i} variants={fadeInUp} className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-full flex flex-col">
                <div className="flex-grow">
                  <div className="text-[#F59E0B] text-2xl mb-4">★★★★★</div>
                  <p className="text-slate-600 dark:text-slate-300 italic mb-6">"{t.quote}"</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-[#0B6B3A] dark:bg-emerald-500/20 flex items-center justify-center text-white dark:text-emerald-400 font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1E293B] dark:text-white text-sm">{t.name}</p>
                    <p className="text-slate-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA SECTION */}
      <ScrollReveal>
        <section className="py-20 bg-[#1E293B] text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Digitize Your SACCO?
            </h2>
            <p className="text-slate-400 text-lg mb-10">
              Join hundreds of Ethiopian cooperatives already using SACCO Manager to grow their operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#0B6B3A] hover:bg-[#10B981] text-white font-bold transition-all hover:-translate-y-0.5"
              >
                Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-slate-500 hover:border-slate-400 text-white font-semibold transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

    </div>
  );
}
