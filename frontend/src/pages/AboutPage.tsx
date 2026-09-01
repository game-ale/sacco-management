import { Target, Eye, ShieldCheck, Users, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
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

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full bg-white dark:bg-slate-900 transition-colors duration-300">
      
      {/* HERO BANNER */}
      <section className="bg-gradient-to-br from-[#0B6B3A] to-[#065F46] pt-24 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear_gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
           <div className="text-green-100 text-sm font-medium mb-4">
             <Link to="/" className="hover:text-white transition-colors">Home</Link>
             <span className="mx-2">›</span>
             <span className="text-white">About</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">About SACCO Manager</h1>
           <p className="text-green-100 text-lg max-w-2xl mx-auto">
             Empowering Ethiopian cooperatives with modern financial technology. We build secure, accessible, and scalable digital solutions for the future of community finance.
           </p>
        </motion.div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900 relative -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-20"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
             <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border-t-4 border-[#0B6B3A]">
                <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-[#0B6B3A] dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E293B] dark:text-white mb-4">Our Mission</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  To provide accessible, highly secure, and intuitive digital tools that transform how Ethiopian SACCOs operate. We aim to replace manual, error-prone processes with streamlined technology, empowering cooperatives to serve their members more effectively and transparently.
                </p>
             </motion.div>

             <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border-t-4 border-[#10B981]">
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
                  <Eye className="w-7 h-7 text-[#10B981]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E293B] dark:text-white mb-4">Our Vision</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  To become the leading digital platform for cooperative finance across Ethiopia and beyond. We envision a future where every SACCO, regardless of size, has access to institutional-grade technology that fosters financial inclusion, growth, and unparalleled trust within their communities.
                </p>
             </motion.div>
          </motion.div>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            
            <ScrollReveal direction="left" className="w-full lg:w-1/2">
               <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-[#0B6B3A]/10 to-emerald-100 dark:from-emerald-900/20 dark:to-slate-800 shadow-2xl flex items-center justify-center">
                 <div className="text-center p-8">
                   <div className="w-20 h-20 mx-auto rounded-full bg-[#0B6B3A]/10 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
                     <Users className="w-10 h-10 text-[#0B6B3A] dark:text-emerald-400" />
                   </div>
                   <p className="text-[#0B6B3A] dark:text-emerald-400 font-semibold text-lg">Community Driven Finance</p>
                   <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Building trust through technology</p>
                 </div>
               </div>
            </ScrollReveal>

            <ScrollReveal direction="right" className="w-full lg:w-1/2">
               <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] dark:text-white mb-6">Our Story</h2>
               <div className="space-y-6 text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                 <p>
                   For decades, Savings and Credit Cooperative Organizations (SACCOs) have been the backbone of financial empowerment in Ethiopian communities. However, the reliance on manual ledgers and outdated spreadsheet systems has created bottlenecks, limiting growth and introducing operational risks.
                 </p>
                 <p>
                   Recognizing this critical gap, a team of passionate technologists and financial experts came together to build SACCO Manager. We set out to create a solution that respects the traditional values of community finance while delivering the security, efficiency, and scale of modern digital banking.
                 </p>
                 <p>
                   Today, we are proud to help cooperatives digitize their operations, secure their members' futures, and drive regional economic growth.
                 </p>
               </div>
               <div className="mt-8 space-y-3">
                 <div className="flex items-center gap-3 text-[#0B6B3A] dark:text-emerald-400 font-medium">
                   <CheckCircle2 className="w-5 h-5" /> Digitizing manual workflows
                 </div>
                 <div className="flex items-center gap-3 text-[#0B6B3A] dark:text-emerald-400 font-medium">
                   <CheckCircle2 className="w-5 h-5" /> Enhancing financial transparency
                 </div>
               </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* KEY VALUES */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-[#1E293B] dark:text-white mb-4">Our Key Values</h2>
              <p className="text-slate-500 dark:text-slate-400">The principles that guide our platform development and our commitment to our partners.</p>
            </div>
          </ScrollReveal>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {[
              { icon: ShieldCheck, title: 'Security First', desc: 'Institutional-grade encryption and access controls to protect member assets.', color: 'blue' },
              { icon: Users, title: 'Community Focused', desc: 'Built to strengthen the unique bond between cooperatives and their members.', color: 'emerald' },
              { icon: Zap, title: 'Simplicity', desc: 'Complex financial operations made intuitive and accessible for all users.', color: 'purple' },
              { icon: TrendingUp, title: 'Growth', desc: 'Providing the scalable infrastructure needed to expand cooperative reach.', color: 'amber' },
            ].map((val, i) => (
              <motion.div key={i} variants={fadeInUp} className="bg-white dark:bg-slate-900 p-8 rounded-2xl text-center border border-slate-100 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-slate-900 transition-shadow group">
                <div className={`w-12 h-12 mx-auto rounded-full bg-${val.color}-50 dark:bg-${val.color}-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <val.icon className={`w-6 h-6 text-${val.color}-600 dark:text-${val.color}-400`} />
                </div>
                <h3 className="text-lg font-bold text-[#1E293B] dark:text-white mb-3">{val.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{val.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA SECTION */}
      <ScrollReveal>
        <section className="py-20 bg-[#1E293B] text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your SACCO?</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Join the growing network of Ethiopian cooperatives utilizing our modern financial technology to secure their future.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center px-8 py-3.5 rounded-full bg-[#0B6B3A] hover:bg-[#10B981] text-white font-bold transition-colors"
          >
            Register Your SACCO →
          </Link>
        </section>
      </ScrollReveal>

    </div>
  );
}
