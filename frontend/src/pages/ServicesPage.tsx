import { Link } from 'react-router-dom';
import { Users, Wallet, FileText, Calendar, PieChart, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from '../components/ScrollReveal';

const staggerContainer: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const fadeInUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function ServicesPage() {
  return (
    <div className="flex flex-col w-full bg-white dark:bg-slate-900 transition-colors duration-300">
      
      {/* HERO BANNER */}
      <section className="bg-gradient-to-br from-[#10B981] to-[#0B6B3A] dark:from-emerald-900 dark:to-emerald-950 pt-24 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
           <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Services</h1>
           <p className="text-green-50 text-lg max-w-2xl mx-auto">
             Comprehensive tools for every aspect of SACCO management. Designed to streamline operations, enhance security, and drive growth for Ethiopian cooperatives.
           </p>
        </motion.div>
      </section>

      {/* CORE CAPABILITIES */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900 relative -mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           
           <ScrollReveal>
             <div className="text-center mb-16">
               <h2 className="text-3xl font-bold text-[#1E293B] dark:text-white mb-4">Core Capabilities</h2>
               <p className="text-slate-500 dark:text-slate-400">A unified platform to manage members, finances, and operations seamlessly.</p>
             </div>
           </ScrollReveal>

           <motion.div 
             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-20"
             initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
             variants={staggerContainer}
           >
              {[
                { icon: Users, title: 'Member Management', desc: 'Complete KYC integration, detailed member profiles, and automated activity tracking to maintain accurate registry data.', color: 'green' },
                { icon: Wallet, title: 'Savings & Deposits', desc: 'Real-time ledger updates, automated interest calculations, and comprehensive balance tracking for various account types.', color: 'emerald' },
                { icon: FileText, title: 'Loan Management', desc: 'Streamlined digital applications, multi-tier approval workflows, and instant credit scoring based on member history.', color: 'slate' },
                { icon: Calendar, title: 'Repayment Tracking', desc: 'Dynamic amortization schedules, automated overdue alerts via SMS, and integrated penalty calculations.', color: 'amber' },
                { icon: PieChart, title: 'Share Capital', desc: 'Transparent allocation mechanisms, detailed ownership tracking, and seamless share transfer processes between members.', color: 'blue' },
                { icon: Banknote, title: 'Dividend Distribution', desc: 'Automated pool calculation based on retained earnings, equitable distribution logic, and comprehensive historical reporting.', color: 'emerald' },
              ].map((service, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 hover:-translate-y-1 transition-transform group"
                >
                  <div className={`w-12 h-12 rounded-full bg-${service.color}-50 dark:bg-${service.color}-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <service.icon className={`w-6 h-6 text-${service.color === 'green' ? '[#0B6B3A] dark:text-emerald-400' : service.color === 'emerald' ? '[#10B981] dark:text-emerald-400' : service.color + '-600 dark:text-' + service.color + '-400'}`} />
                  </div>
                  <h3 className="text-xl font-bold text-[#1E293B] dark:text-white mb-3">{service.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{service.desc}</p>
                </motion.div>
              ))}
           </motion.div>
        </div>
      </section>

      {/* CTA SECTION */}
      <ScrollReveal>
        <section className="py-24 bg-slate-100 dark:bg-slate-800/50 text-center">
          <h2 className="text-3xl font-bold text-[#1E293B] dark:text-white mb-4">Ready to Transform Your SACCO?</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Join hundreds of Ethiopian cooperatives leveraging our platform to drive efficiency, transparency, and growth.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center px-8 py-3.5 rounded-full bg-[#0B6B3A] hover:bg-[#065F46] shadow-lg shadow-green-900/20 text-white font-bold transition-colors"
          >
            Register Your SACCO Now
          </Link>
        </section>
      </ScrollReveal>

    </div>
  );
}
