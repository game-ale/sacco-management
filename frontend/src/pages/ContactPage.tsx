import { MapPin, Phone, Mail, Send, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import ScrollReveal from '../components/ScrollReveal';
import { publicService, type ContactFormData } from '../services/publicService';

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const mutation = useMutation({
    mutationFn: (data: ContactFormData) => publicService.submitContactForm(data),
    onSuccess: () => {
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setIsSubmitted(false), 5000);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit inquiry.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col w-full bg-white dark:bg-slate-900 transition-colors duration-300">
      
      {/* HERO BANNER */}
      <section className="bg-[#0B6B3A] pt-24 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
           <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Contact Us</h1>
           <p className="text-green-100 text-lg max-w-2xl mx-auto">
             We're here to help you manage your financial future. Reach out to our dedicated support team in Adama.
           </p>
        </motion.div>
      </section>

      {/* MAIN CONTENT */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col lg:flex-row gap-12">
              
              {/* LEFT COLUMN: Info */}
              <ScrollReveal direction="left" className="w-full lg:w-1/3 space-y-6">
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-700 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E293B] dark:text-white mb-1">Our Office</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Hawi Software Solutions<br/>Adama, Ethiopia</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-700 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-[#0B6B3A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E293B] dark:text-white mb-1">Call Us</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">+251 911 123 456<br/>Mon-Fri, 8:00 AM - 5:00 PM</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-700 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E293B] dark:text-white mb-1">Email Support</h3>
                    <a href="mailto:support@saccomanager.com" className="text-[#0B6B3A] dark:text-emerald-400 text-sm font-medium hover:underline">
                      support@saccomanager.com
                    </a>
                  </div>
                </div>

                {/* Google Maps Embed */}
                <div className="w-full h-64 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 mt-8">
                  <iframe
                    title="Hawi Software Solutions Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3945.676!2d39.2686!3d8.5400!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b1f4c4f4b5b5b%3A0x0!2sHawi+Software+Solutions!5e0!3m2!1sen!2set!4v1700000000000!5m2!1sen!2set"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>

              </ScrollReveal>

              {/* RIGHT COLUMN: Form */}
              <ScrollReveal direction="right" className="w-full lg:w-2/3">
                <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
                  <h2 className="text-3xl font-bold text-[#1E293B] dark:text-white mb-2">Send us a Message</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8">Fill out the form below and our team will get back to you within 24 hours.</p>

                  {isSubmitted && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-8 p-4 bg-green-50 dark:bg-emerald-900/30 border border-green-200 dark:border-emerald-800 text-green-700 dark:text-emerald-400 rounded-lg flex items-center gap-3"
                    >
                       <CheckCircle2 className="w-5 h-5" />
                       <p className="font-medium">Message sent successfully! We'll get back to you soon.</p>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                        <input 
                          type="text" 
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Abebe Bikila"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="abebe@example.com"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                      <select 
                        required
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors appearance-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="" disabled>Select an inquiry type</option>
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="sales">Sales & Pricing</option>
                        <option value="partnership">Partnership</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
                      <textarea 
                        required
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        placeholder="How can we help you today?"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      disabled={mutation.isPending}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-[#0B6B3A] hover:bg-[#065F46] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                      {mutation.isPending ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </div>
              </ScrollReveal>

           </div>
        </div>
      </section>
    </div>
  );
}
