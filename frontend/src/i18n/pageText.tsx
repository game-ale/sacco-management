import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

type LanguageCode = "am" | "om";
type TranslationMap = Record<string, string>;
type LocalizedText = Text & { __i18nOriginalText?: string };

const am: TranslationMap = {
  "SACCO Manager": "SACCO አስተዳዳሪ",
  Home: "መነሻ",
  About: "ስለ እኛ",
  Services: "አገልግሎቶች",
  Contact: "ያግኙን",
  Login: "ግባ",
  "Sign In": "ግባ",
  "Sign in": "ግባ",
  Register: "ይመዝገቡ",
  "Register SACCO": "SACCO ይመዝገቡ",
  "Register Your SACCO": "የእርስዎን SACCO ይመዝገቡ",
  "Contact Sales": "ሽያጭን ያግኙ",
  "Trusted by 500+ Ethiopian Cooperatives": "በ500+ የኢትዮጵያ ህብረት ስራ ማህበራት የታመነ",
  "Empowering Ethiopia's": "የኢትዮጵያን",
  Cooperative: "ህብረት ስራ",
  Economy: "ኢኮኖሚ ማጠናከር",
  "Bridging the gap between traditional community values and modern financial technology. The ultimate digital platform for Ethiopian SACCOs to securely manage members, scale savings, and drive local growth.":
    "ባህላዊ የማህበረሰብ እሴቶችን ከዘመናዊ የፋይናንስ ቴክኖሎጂ ጋር የሚያገናኝ። የኢትዮጵያ SACCOዎች አባላትን በደህንነት ለማስተዳደር፣ ቁጠባን ለማሳደግ እና አካባቢያዊ እድገትን ለማበረታታት የተዘጋጀ ዲጂታል መድረክ።",
  "Everything You Need to Run a SACCO": "SACCOን ለማስኬድ የሚያስፈልግዎ ሁሉ",
  "SACCOs Registered": "የተመዘገቡ SACCOዎች",
  "Active Members": "ንቁ አባላት",
  "Birr Managed": "የተተዳደረ ብር",
  "Uptime SLA": "የአገልግሎት ተገኝነት",
  "About SACCO Manager": "ስለ SACCO አስተዳዳሪ",
  "Contact Us": "ያግኙን",
  "Our Services": "አገልግሎቶቻችን",
  "Welcome Back": "እንኳን ተመለሱ",
  "Sign in to your SACCO account to continue.": "ለመቀጠል ወደ SACCO መለያዎ ይግቡ።",
  "Email Address or Member ID": "ኢሜይል አድራሻ ወይም የአባል መታወቂያ",
  Password: "የይለፍ ቃል",
  "Forgot Password?": "የይለፍ ቃል ረሱ?",
  "Don't have an account?": "መለያ የለዎትም?",
  "Create Account": "መለያ ይፍጠሩ",
  "Organization Details": "የድርጅት ዝርዝሮች",
  "SACCO Name": "የSACCO ስም",
  "Official Email": "ይፋዊ ኢሜይል",
  "Phone Number": "ስልክ ቁጥር",
  Address: "አድራሻ",
  "Admin Details": "የአስተዳዳሪ ዝርዝሮች",
  "Full Name": "ሙሉ ስም",
  Submit: "አስገባ",
  Cancel: "ይቅር",
  Save: "አስቀምጥ",
  Delete: "ሰርዝ",
  Edit: "አስተካክል",
  Create: "ፍጠር",
  Search: "ፈልግ",
  Refresh: "አድስ",
  "Loading...": "በመጫን ላይ...",
  Loading: "በመጫን ላይ",
  Error: "ስህተት",
  Success: "ተሳክቷል",
  Status: "ሁኔታ",
  Actions: "ተግባራት",
  Date: "ቀን",
  Amount: "መጠን",
  Description: "መግለጫ",
  Member: "አባል",
  Members: "አባላት",
  Savings: "ቁጠባ",
  Loans: "ብድሮች",
  Repayments: "ክፍያዎች",
  Shares: "አክሲዮኖች",
  Dividends: "የትርፍ ድርሻ",
  Settings: "ቅንብሮች",
  Dashboard: "ዳሽቦርድ",
  Admin: "አስተዳዳሪ",
  "SACCO Admin": "SACCO አስተዳዳሪ",
  Profile: "መገለጫ",
  Logout: "ውጣ",
  "Total Members": "ጠቅላላ አባላት",
  "Total Savings": "ጠቅላላ ቁጠባ",
  "Active Loans": "ንቁ ብድሮች",
  "Overdue Repayments": "ያለፉ ክፍያዎች",
  "Share Capital": "የአክሲዮን ካፒታል",
  "Member Shares Distribution": "የአባላት አክሲዮን ስርጭት",
  "Manage and track member equity distributions.":
    "የአባላት የካፒታል ስርጭትን ያስተዳድሩ እና ይከታተሉ።",
  "Share Value": "የአክሲዮን ዋጋ",
  "Total Shares Issued": "ጠቅላላ የተሰጡ አክሲዮኖች",
  "Total Share Capital": "ጠቅላላ የአክሲዮን ካፒታል",
  "Update Shares": "አክሲዮኖችን አዘምን",
  "Highest Ownership": "ከፍተኛ ባለቤትነት",
  "Member #": "የአባል #",
  "Current Shares": "የአሁን አክሲዮኖች",
  "Total Capital": "ጠቅላላ ካፒታል",
  Ownership: "ባለቤትነት",
  "Recent Activity": "የቅርብ ጊዜ እንቅስቃሴ",
  "View All": "ሁሉንም ይመልከቱ",
  Type: "አይነት",
  "Loan Status Distribution": "የብድር ሁኔታ ስርጭት",
  "Savings & Loans Trend (Last 6 Months)": "የቁጠባና ብድር አዝማሚያ (ያለፉት 6 ወራት)",
  "Loading chart...": "ገበታ በመጫን ላይ...",
  "No chart data available": "የገበታ መረጃ የለም",
  "No recent activity found.": "የቅርብ ጊዜ እንቅስቃሴ አልተገኘም።",
  "Loading activity...": "እንቅስቃሴ በመጫን ላይ...",
  "Add Member": "አባል ጨምር",
  "Contact Info": "የመገናኛ መረጃ",
  "Search by name, email, or member ID...": "በስም፣ ኢሜይል ወይም የአባል መታወቂያ ፈልግ...",
  "Search by name, email, phone...": "በስም፣ ኢሜይል፣ ስልክ ፈልግ...",
  "Search...": "ፈልግ...",
  Pending: "በመጠባበቅ ላይ",
  Approved: "ጸድቋል",
  Rejected: "ውድቅ ተደርጓል",
  Active: "ንቁ",
  Inactive: "ንቁ አይደለም",
  Completed: "ተጠናቋል",
  Processing: "በሂደት ላይ",
  Failed: "አልተሳካም",
  Paid: "ተከፍሏል",
  Overdue: "ጊዜው አልፏል",
  Previous: "ቀዳሚ",
  Next: "ቀጣይ",
  Back: "ተመለስ",
  "Try Again": "እንደገና ይሞክሩ",
  "Export CSV": "በCSV አውርድ",
  "All Regions": "ሁሉም ክልሎች",
  "Addis Ababa": "አዲስ አበባ",
  Oromia: "ኦሮሚያ",
  Amhara: "አማራ",
  "Newest First": "አዲሱ መጀመሪያ",
  "Oldest First": "የድሮው መጀመሪያ",
  "Most Members": "ብዙ አባላት",
  "Name (A-Z)": "ስም (ከ ሀ-ፐ)",
  "Registration #": "የምዝገባ #",
  "Registered Date": "የተመዘገበበት ቀን",
  "Loading SACCOs...": "SACCOዎችን በመጫን ላይ...",
  "All Roles": "ሁሉም ሚናዎች",
  Superadmin: "ዋና አስተዳዳሪ",
  Suspended: "ታግዷል",
  User: "ተጠቃሚ",
  Role: "ሚና",
  "Joined Date": "የተቀላቀለበት ቀን",
  "Loading users...": "ተጠቃሚዎችን በመጫን ላይ...",
  "No users found": "ተጠቃሚዎች አልተገኙም",
  "Try adjusting your filters or search query.":
    "ማጣሪያዎችዎን ወይም የፍለጋ ጥያቄዎን ለማስተካከል ይሞክሩ።",
  None: "ምንም",
  "Reset Password": "የይለፍ ቃል ዳግም ያስጀምሩ",
  "Temporary Password Generated!": "ጊዜያዊ የይለፍ ቃል ተፈጥሯል!",
  "Please share this with the user securely.": "እባክዎ ይህንን ከተጠቃሚው ጋር በደህና ያጋሩ።",
  "Cumulative registered SACCOs over the last 12 months":
    "ባለፉት 12 ወራት ውስጥ የተመዘገቡ አጠቃላይ SACCOዎች",
  "Current application distribution": "የአሁኑ ማመልከቻ ስርጭት",
  "Loading pending SACCO approvals...": "በመጠባበቅ ላይ ያሉ የSACCO ማጽደቆችን በመጫን ላይ...",
  "Active nominal value": "ንቁ የመነሻ ዋጋ",
  "Fully realized capital": "ሙሉ በሙሉ የተገኘ ካፒታል",
  "Lowest Ownership": "ዝቅተኛ ባለቤትነት",
  "Name A-Z": "ስም ከ ሀ-ፐ",
  "Loading shares data...": "የአክሲዮን መረጃ በመጫን ላይ...",
  "Registration Pending": "ምዝገባ በመጠባበቅ ላይ",
  "All Statuses": "ሁሉም ሁኔታዎች",
  "Sort: Newest First": "ደርድር፡ አዲሱ መጀመሪያ",
  "Member Details": "የአባል ዝርዝሮች",
  "Savings Balance": "የቁጠባ ቀሪ ሂሳብ",
  "Loading members...": "አባላትን በመጫን ላይ...",
  "No members found.": "ምንም አባላት አልተገኙም።",
  "Add New Member": "አዲስ አባል ጨምር",
  "Invitation Generated!": "ግብዣ ተፈጥሯል!",
  "Copy the link below and share it with the member so they can complete their registration.":
    "የምዝገባ ሂደታቸውን እንዲያጠናቅቁ ከታች ያለውን አገናኝ ይቅዱ እና ለአባሉ ያጋሩ።",

  // Public Layout & Navigation
  "SACCOs": "የቁጠባና ብድር ማህበራት",
  "Company": "ኩባንያ",
  "Product": "ምርት",
  "Resources": "ግብአቶች",
  "About Us": "ስለ እኛ",
  "Team": "ቡድን",
  "Careers": "የስራ እድሎች",
  "Features": "ባህሪያት",
  "Pricing": "ዋጋዎች",
  "Security": "ደህንነት",
  "Documentation": "ሰነዶች",
  "API": "ኤፒአይ",
  "Support": "ድጋፍ",
  "Privacy Policy": "የግላዊነት ፖሊሲ",
  "Terms of Service": "የአገልግሎት ውሎች",
  "All rights reserved.": "መብቱ በህግ የተጠበቀ ነው።",
  "Powered by": "የተደገፈው በ",
  "Software Solutions": "የሶፍትዌር መፍትሄዎች",
  "Empowering Ethiopian cooperatives with secure, scalable, and intuitive management solutions. Modernize your cooperative finance today.":
    "የኢትዮጵያን የህብረት ስራ ማህበራት ደህንነቱ በተጠበቀ፣ በቀላሉ በሚሰፋ እና ምቹ የአስተዳደር መፍትሄዎች ማብቃት። የህብረት ስራ ፋይናንስዎን ዛሬ ያዘምኑ።",

  // Landing Page
  "Awash SACCO Overview": "የአዋሽ SACCO አጠቃላይ እይታ",
  "MONTHLY GROWTH": "ወርሃዊ እድገት",
  "Monthly Growth": "ወርሃዊ እድገት",
  "Loan Approved": "ብድር ጸድቋል",
  "Just now": "አሁን",
  "Dividend Sent": "የትርፍ ድርሻ ተልኳል",
  "Our platform provides comprehensive tools for every aspect of cooperative management.":
    "መድረካችን ለእያንዳንዱ የህብረት ስራ ማህበር አስተዳደር ዘርፍ አጠቃላይ መሳሪያዎችን ያቀርባል።",
  "Member Management": "የአባላት አስተዳደር",
  "Complete KYC profiles, automated activity tracking, and detailed member analytics.":
    "የተሟላ የKYC መገለጫዎች፣ ራስ-ሰር የእንቅስቃሴ ክትትል እና ዝርዝር የአባላት ትንታኔ።",
  "Savings & Deposits": "ቁጠባ እና ተቀማጭ ገንዘብ",
  "Real-time ledger updates, automated interest calculations, and multiple account types.":
    "የቅጽበት የሂሳብ መዝገብ ዝመናዎች፣ ራስ-ሰር የወለድ ስሌቶች እና የተለያዩ የሂሳብ አይነቶች።",
  "Loan Processing": "የብድር ሂደት",
  "Digital applications, multi-tier approval workflows, and credit scoring.":
    "ዲጂታል ማመልከቻዎች፣ ባለብዙ ደረጃ የማጽደቅ የስራ ሂደቶች እና የብድር ነጥብ አሰጣጥ።",
  "Transparent share allocation, ownership tracking, and transfer management.":
    "ግልጽ የአክሲዮን ድልድል፣ የባለቤትነት ክትትል እና የዝውውር አስተዳደር።",
  "Dividend Distribution": "የትርፍ ድርሻ ክፍፍል",
  "Automated calculations, equitable distribution, and comprehensive reporting.":
    "ራስ-ሰር ስሌቶች፣ ፍትሃዊ ስርጭት እና አጠቃላይ ሪፖርት።",
  "Security & Compliance": "ደህንነት እና ህግ ማክበር",
  "Bank-grade encryption, role-based access, and full audit trails.":
    "የባንክ ደረጃ ምስጠራ፣ በሚና ላይ የተመሰረተ ተደራሽነት እና ሙሉ የኦዲት ክትትል መስመር።",
  "How It Works": "እንዴት እንደሚሰራ",
  "Get your SACCO digitized in three simple steps.":
    "የእርስዎን SACCO በሶስት ቀላል ደረጃዎች ዲጂታላይዝ ያድርጉ።",
  "Create your SACCO account and set up your organization profile in minutes.":
    "የSACCO መለያዎን ይፍጠሩ እና የድርጅትዎን መገለጫ በደቂቃዎች ውስጥ ያዘጋጁ።",
  "Onboard Members": "አባላትን ይቀላቅሉ",
  "Invite members, complete KYC verification, and set up individual accounts.":
    "አባላትን ይጋብዙ፣ የKYC ማረጋገጫን ያጠናቅቁ እና የግል መለያዎችን ያዘጋጁ።",
  "Start Managing": "ማስተዳደር ይጀምሩ",
  "Process savings, approve loans, track dividends, and generate reports.":
    "ቁጠባን ያስተናግዱ፣ ብድሮችን ያጽድቁ፣ የትርፍ ድርሻን ይከታተሉ እና ሪፖርቶችን ያመንጩ።",
  "Trusted by Cooperatives": "በህብረት ስራ ማህበራት የታመነ",
  "Hear what our partner SACCOs have to say.": "አጋር የሆኑ SACCOዎች ምን እንደሚሉ ያዳምጡ።",
  "SACCO Manager transformed our manual processes. We now process loans 10x faster.":
    "SACCO አስተዳዳሪ የእጅ ስራችንን ቀይሮታል። አሁን ብድሮችን 10 እጥፍ በፍጥነት እናስተናግዳለን።",
  "The dividend calculation feature alone saved us weeks of work each quarter.":
    "የትርፍ ድርሻ ስሌት ባህሪው ብቻ በእያንዳንዱ ሩብ አመት የሳምንታት ስራ አድኖልናል።",
  "Our members love the transparency. They can see their savings grow in real-time.":
    "አባሎቻችን ግልፅነቱን ወደዱት። ቁጠባቸው በቅጽበት ሲያድግ ማየት ይችላሉ።",
  "Admin, Awash SACCO": "አስተዳዳሪ፣ አዋሽ SACCO",
  "Treasurer, Unity SACCO": "ገንዘብ ያዥ፣ ዩኒቲ SACCO",
  "Manager, Progress SACCO": "ስራ አስኪያጅ፣ ፕሮግረስ SACCO",
  "Ready to Digitize Your SACCO?": "የእርስዎን SACCO ዲጂታላይዝ ለማድረግ ዝግጁ ነዎት?",
  "Join hundreds of Ethiopian cooperatives already using SACCO Manager to grow their operations.":
    "ስራቸውን ለማሳደግ SACCO አስተዳዳሪን በመጠቀም ላይ ያሉ በመቶዎች የሚቆጠሩ የኢትዮጵያ ህብረት ስራ ማህበራትን ይቀላቀሉ።",
  "Get Started Free": "በነጻ ይጀምሩ",

  // Public Directory & SACCO Profile
  "Explore SACCOs": "SACCOዎችን ያስሱ",
  "Find verified SACCOs across Ethiopia, view membership requirements, and request to join directly.":
    "በመላው ኢትዮጵያ የተረጋገጡ SACCOዎችን ያግኙ፣ የአባልነት መስፈርቶችን ይመልከቱ እና በቀጥታ ለመቀላቀል ይጠይቁ።",
  "All Locations": "ሁሉም አካባቢዎች",
  "All Categories": "ሁሉም ምድቦች",
  "Search SACCOs by name, city, or focus area...": "SACCOዎችን በስም፣ በከተማ ወይም በትኩረት መስክ ይፈልጉ...",
  "Apply to Join": "ለመቀላቀል ያመልክቱ",
  "Open for Members": "ለአባላት ክፍት ነው",
  "Closed": "ተዘግቷል",
  "Min. Monthly Deposit": "ዝቅተኛ ወርሃዊ ቁጠባ",
  "Share Price": "የአክሲዮን ዋጋ",
  "Interest Rate": "የወለድ መጠን",
  "Dividend Rate": "የትርፍ ድርሻ መጠን",
  "Established": "የተመሰረተበት",
  "Requirements": "መስፈርቶች",
  "View Profile": "መገለጫ ይመልከቱ",
  "No SACCOs found matching your search criteria.": "የፍለጋ መስፈርትዎን የሚያሟላ ምንም SACCO አልተገኘም።",

  // About, Services, Contact Pages
  "Our Mission": "ተልዕኳችን",
  "Our Vision": "ራዕያችን",
  "Core Values": "ዋና እሴቶች",
  "Trust & Transparency": "እምነት እና ግልጽነት",
  "Community First": "ማህበረሰብ ቅድሚያ",
  "Innovation": "ፈጠራ",
  "Why Choose SACCO Manager?": "ለምን SACCO አስተዳዳሪን ይመርጣሉ?",
  "Bank-Grade Security": "የባንክ ደረጃ ደህንነት",
  "Automated Dividend Calculation": "ራስ-ሰር የትርፍ ድርሻ ስሌት",
  "Real-Time Tracking": "የቅጽበት ክትትል",
  "Ready to Modernize Your SACCO?": "የእርስዎን SACCO ለማዘመን ዝግጁ ነዎት?",
  "Core Capabilities": "ዋና አቅሞች",
  "A unified platform to manage members, finances, and operations seamlessly.":
    "አባላትን፣ ፋይናንስን እና ስራዎችን ያለምንም እንከን ለማስተዳደር የሚያስችል ወጥ መድረክ።",
  "Loan Management": "የብድር አስተዳደር",
  "Repayment Tracking": "የክፍያ ክትትል",
  "Dynamic amortization schedules, automated overdue alerts via SMS, and integrated penalty calculations.":
    "ተለዋዋጭ የማካካሻ መርሃ ግብሮች፣ በSMS ራስ-ሰር የጊዜ ማለፊያ ማስጠንቀቂያዎች እና የተካተቱ የቅጣት ስሌቶች።",
  "Streamlined digital applications, multi-tier approval workflows, and instant credit scoring based on member history.":
    "ቀላል የዲጂታል ማመልከቻዎች፣ ባለብዙ ደረጃ የማጽደቅ የስራ ሂደቶች እና በአባል ታሪክ ላይ የተመሰረተ ፈጣን የብድር ነጥብ።",
  "Transparent allocation mechanisms, detailed ownership tracking, and seamless share transfer processes between members.":
    "ግልጽ የአክሲዮን ድልድል አሰራር፣ ዝርዝር የባለቤትነት ክትትል እና በአባላት መካከል የሚደረግ ቀላል የአክሲዮን ዝውውር ሂደት።",
  "Automated pool calculation based on retained earnings, equitable distribution logic, and comprehensive historical reporting.":
    "በተያዘ ትርፍ ላይ የተመሰረተ ራስ-ሰር የፈንድ ስሌት፣ ፍትሃዊ የስርጭት አመክንዮ እና አጠቃላይ የታሪክ ሪፖርት።",
  "We're here to help you manage your financial future. Reach out to our dedicated support team in Adama.":
    "የፋይናንስ የወደፊት እጣ ፈንታዎን እንዲያስተዳድሩ ልንረዳዎ ዝግጁ ነን። በአዳማ የሚገኘውን የድጋፍ ቡድናችንን ያነጋግሩ።",
  "Get In Touch": "ያግኙን",
  "Send us a message": "መልእክት ይላኩልን",
  "Your Name": "ስምዎ",
  "Your Email": "ኢሜይልዎ",
  "Subject": "ርዕስ",
  "Message": "መልእክት",
  "Send Message": "መልእክት ላክ",
  "Sending...": "በመላክ ላይ...",
  "Our Office": "ቢሮአችን",
  "Phone": "ስልክ",
  "Email": "ኢሜይል",
  "Working Hours": "የስራ ሰዓት",

  // Admin & Super Admin Pages
  "Membership Requests": "የአባልነት ጥያቄዎች",
  "All Users": "ሁሉም ተጠቃሚዎች",
  "Platform Reports": "የመድረክ ሪፖርቶች",
  "Platform Settings": "የመድረክ ቅንብሮች",
  "Platform Admin": "የመድረክ አስተዳዳሪ",
  "New SACCO": "አዲስ SACCO",
  "Super Admin": "ዋና አስተዳዳሪ",
  "SuperAdmin": "ዋና አስተዳዳሪ",
  "Member Distribution Preview": "የአባላት ስርጭት ቅድመ እይታ",
  "Based on shareholding as of end of period.": "በወቅቱ መጨረሻ ባለው የአክሲዮን ባለቤትነት ላይ የተመሰረተ።",
  "Export": "አውርድ",
  "Commit": "አጽድቅ",
  "Calculating...": "በማስላት ላይ...",
  "Calculate Distribution": "ስርጭትን አስላ",
  "Financial Period": "የበጀት ወቅት",
  "Total Dividend Pool (ETB)": "ጠቅላላ የትርፍ ድርሻ ፈንድ (ብር)",
  "Statutory Reserve (%)": "ህጋዊ የመጠባበቂያ ፈንድ (%)",
  "Required percentage to hold back before distribution.": "ከስርጭት በፊት መያዝ ያለበት ህጋዊ መቶኛ።",
  "Distribution Setup": "የስርጭት ማዋቀሪያ",
  "Calculation Summary": "የስሌት ማጠቃለያ",
  "Distributable": "የሚከፋፈል",
  "Share Pool (70%)": "የአክሲዮን ድርሻ (70%)",
  "Savings Pool (30%)": "የቁጠባ ድርሻ (30%)",
  "Enter total pool amount and click Calculate Distribution to see the preview.":
    "ቅድመ እይታውን ለማየት ጠቅላላ የትርፍ ድርሻ መጠን ያስገቡ እና ስርጭትን አስላ የሚለውን ይጫኑ።",
  "No Past Distributions": "ያለፉ ስርጭቶች የሉም",
  "There is no dividend history recorded for this SACCO.": "ለዚህ SACCO የተመዘገበ የትርፍ ድርሻ ታሪክ የለም።",
  "Log out of your account?": "ከመለያዎ መውጣት ይፈልጋሉ?",
  "You can sign in again anytime.": "በማንኛውም ጊዜ እንደገና መግባት ይችላሉ።",

  // Member Statements, Notifications, Help & Support, Buy Shares
  "Account Statements": "የሂሳብ መግለጫዎች",
  "Download your monthly consolidated account statements.": "ወርሃዊ የተጠናከረ የሂሳብ መግለጫዎን ያውርዱ።",
  "Consolidated Statement": "የተጠናከረ መግለጫ",
  "Download": "አውርድ",
  "Issued": "የተሰጠበት",
  "No statements available for this period.": "ለዚህ ጊዜ የሚገኝ መግለጫ የለም።",
  "Notifications": "ማሳወቂያዎች",
  "Unread": "ያልተነበቡ",
  "Stay updated on your account activity and requests.": "ስለ መለያዎ እንቅስቃሴ እና ጥያቄዎች ወቅታዊ መረጃ ያግኙ።",
  "Mark all as read": "ሁሉንም እንደተነበበ ምልክት አድርግ",
  "Loading notifications...": "ማሳወቂያዎችን በመጫን ላይ...",
  "No Notifications": "ምንም ማሳወቂያዎች የሉም",
  "You are all caught up! Account updates will appear here.": "ምንም አዲስ ማሳወቂያ የለም! የመለያ ዝመናዎች እዚህ ይታያሉ።",
  "View More": "ተጨማሪ ይመልከቱ",
  "View Less": "በትንሹ ይመልከቱ",
  "Notification Details": "የማሳወቂያ ዝርዝር",
  "Close": "ዝጋ",
  "Help & Support": "እገዛ እና ድጋፍ",
  "Have questions? We are here to help.": "ጥያቄ አለዎት? ልንረዳዎ ዝግጁ ነን።",
  "Knowledge Base": "የመረጃ ቋት",
  "Browse our comprehensive FAQ and guides.": "አጠቃላይ ተደጋጋሚ ጥያቄዎችን እና መመሪያዎችን ያስሱ።",
  "Contact Admin": "አስተዳዳሪን ያነጋግሩ",
  "Send us a direct message for specific inquiries.": "ለተወሰኑ ጥያቄዎች በቀጥታ መልእክት ይላኩልን።",
  "Call Support": "ድጋፍ ሰጪዎችን ይደውሉ",
  "Available Mon-Fri, 8 AM - 5 PM (EAT).": "ከሰኞ - አርብ፣ ከጠዋቱ 2:00 - 11:00 ይገኛል።",
  "Frequently Asked Questions": "ተደጋግመው የሚጠየቁ ጥያቄዎች",
  "Send a Message": "መልእክት ይላኩ",
  "General Inquiry": "አጠቃላይ ጥያቄ",
  "Loan Application Issue": "የብድር ማመልከቻ ችግር",
  "Savings Discrepancy": "የቁጠባ ልዩነት",
  "Account Access": "የመለያ ተደራሽነት",
  "Buy Shares": "አክሲዮን ይግዙ",
  "Buy More Shares": "ተጨማሪ አክሲዮን ይግዙ",
  "Number of Shares to Buy": "የሚገዙት የአክሲዮን ብዛት",
  "Total Cost": "ጠቅላላ ወጪ",
  "Pay with Chapa": "በቻፓ ይክፈሉ",
  "Pay Online (Chapa)": "በኢንተርኔት ይክፈሉ (ቻፓ)",
  "days remaining": "ቀናት ቀርተዋል",
  "day remaining": "ቀን ቀርቷል",
  "Due today": "ዛሬ የሚከፈል",
  "days overdue": "ቀናት አልፈዋል",
  "day overdue": "ቀን አልፏል",
  "You have no active loans or upcoming payment installments at this time.":
    "በአሁኑ ጊዜ ምንም ንቁ ብድር ወይም የሚከፈል ክፍያ የለዎትም።",
  "Increase your stake in the SACCO! The current share value is":
    "በSACCO ውስጥ ያለዎትን ድርሻ ያሳድጉ! የአሁኑ የአንድ አክሲዮን ዋጋ",
  "per share.": "በአንድ አክሲዮን ነው።",
  "You will be redirected to Chapa to securely complete this payment.":
    "ይህንን ክፍያ በደህና ለማጠናቀቅ ወደ ቻፓ ይዛወራሉ።",
  "Verifying Payment...": "ክፍያ በማረጋገጥ ላይ...",
  "Please wait while we confirm your payment with Chapa.":
    "ክፍያዎን ከቻፓ ጋር እስክናረጋግጥ ድረስ እባክዎ ይጠብቁ።",
  "Payment Successful!": "ክፍያው ተሳክቷል!",
  "Your transaction has been recorded successfully.": "ግብይትዎ በተሳካ ሁኔታ ተመዝግቧል።",
  "Return to Payments": "ወደ ክፍያዎች ተመለስ",
  "Payment Failed": "ክፍያው አልተሳካም",
  "We could not verify your payment. Please try again or contact support.":
    "ክፍያዎን ማረጋገጥ አልቻልንም። እባክዎ እንደገና ይሞክሩ ወይም ድጋፍ ሰጪዎችን ያነጋግሩ።",
};

const om: TranslationMap = {
  "SACCO Manager": "Bulchaa SACCO",
  Home: "Mana",
  About: "Waaʼee",
  Services: "Tajaajiloota",
  Contact: "Nu qunnami",
  Login: "Seeni",
  "Sign In": "Seeni",
  "Sign in": "Seeni",
  Register: "Galmaaʼi",
  "Register SACCO": "SACCO galmeessi",
  "Register Your SACCO": "SACCO kee galmeessi",
  "Contact Sales": "Gurgurtaa qunnami",
  "Trusted by 500+ Ethiopian Cooperatives":
    "Waldaalee hojii gamtaa Itoophiyaa 500+ biratti amaname",
  "Empowering Ethiopia's": "Itoophiyaa humneessuu",
  Cooperative: "Hojii Gamtaa",
  Economy: "Diinagdee",
  "Bridging the gap between traditional community values and modern financial technology. The ultimate digital platform for Ethiopian SACCOs to securely manage members, scale savings, and drive local growth.":
    "Gatiiwwan hawaasaa aadaa fi teeknooloojii faayinaansii ammayyaa walitti hidha. Waltajjii dijitaalaa SACCO Itoophiyaaf miseensota nageenyaan bulchuuf, qusannoo guddisuuf, fi guddina naannoo saffisiisuuf qophaaʼe.",
  "Everything You Need to Run a SACCO":
    "SACCO geggeessuuf wanta si barbaachisu hunda",
  "SACCOs Registered": "SACCOwwan galmaaʼan",
  "Active Members": "Miseensota sochoʼan",
  "Birr Managed": "Birrii bulfame",
  "Uptime SLA": "Wabii tajaajila",
  "About SACCO Manager": "Waaʼee Bulchaa SACCO",
  "Contact Us": "Nu qunnami",
  "Our Services": "Tajaajiloota keenya",
  "Welcome Back": "Baga deebite",
  "Sign in to your SACCO account to continue.":
    "Itti fufuuf akkaawuntii SACCO keetti seeni.",
  "Email Address or Member ID": "Teessoo imeelii yookaan ID miseensaa",
  Password: "Jecha icciitii",
  "Forgot Password?": "Jecha icciitii dagatte?",
  "Don't have an account?": "Akkaawuntii hin qabduu?",
  "Create Account": "Akkaawuntii uumi",
  "Organization Details": "Balʼina dhaabbataa",
  "SACCO Name": "Maqaa SACCO",
  "Official Email": "Imeelii seera qabeessa",
  "Phone Number": "Lakkoofsa bilbilaa",
  Address: "Teessoo",
  "Admin Details": "Balʼina adminii",
  "Full Name": "Maqaa guutuu",
  Submit: "Ergi",
  Cancel: "Haqi",
  Save: "Olkaaʼi",
  Delete: "Haqi",
  Edit: "Gulaali",
  Create: "Uumi",
  Search: "Barbaadi",
  Refresh: "Haaromsi",
  "Loading...": "Feʼamaa jira...",
  Loading: "Feʼamaa jira",
  Error: "Dogoggora",
  Success: "Milkaaʼe",
  Status: "Haala",
  Actions: "Tarkaanfiiwwan",
  Date: "Guyyaa",
  Amount: "Hanga",
  Description: "Ibsa",
  Member: "Miseensa",
  Members: "Miseensota",
  Savings: "Qusannoo",
  Loans: "Liqiiwwan",
  Repayments: "Kaffaltii deebisaa",
  Shares: "Aksiyoona",
  Dividends: "Buʼaa qoodame",
  Settings: "Qindaaʼinoota",
  Dashboard: "Daashboordii",
  Admin: "Adminii",
  "SACCO Admin": "Adminii SACCO",
  Profile: "Piroofaayilii",
  Logout: "Baʼi",
  "Total Members": "Waliigala miseensota",
  "Total Savings": "Waliigala qusannoo",
  "Active Loans": "Liqiiwwan sochoʼan",
  "Overdue Repayments": "Kaffaltiiwwan yeroon darban",
  "Share Capital": "Kaappitaala aksiyoonaa",
  "Member Shares Distribution": "Raabsaa aksiyoonaa miseensotaa",
  "Manage and track member equity distributions.":
    "Raabsaa qabeenya miseensotaa bulchi fi hordofi.",
  "Share Value": "Gatii aksiyoonaa",
  "Total Shares Issued": "Waliigala aksiyoonaa kenname",
  "Total Share Capital": "Waliigala kaappitaala aksiyoonaa",
  "Update Shares": "Aksiyoona haaromsi",
  "Highest Ownership": "Abbummaa olaanaa",
  "Member #": "Miseensa #",
  "Current Shares": "Aksiyoona ammaa",
  "Total Capital": "Waliigala kaappitaalaa",
  Ownership: "Abbummaa",
  "Recent Activity": "Sochii dhiheenyaa",
  "View All": "Hundaa ilaali",
  Type: "Gosa",
  "Loan Status Distribution": "Raabsaa haala liqii",
  "Savings & Loans Trend (Last 6 Months)":
    "Adeemsa qusannoo fi liqii (Jiʼoota 6 darban)",
  "Loading chart...": "Chaartiin feʼamaa jira...",
  "No chart data available": "Daataan chaartii hin jiru",
  "No recent activity found.": "Sochiin dhiheenyaa hin argamne.",
  "Loading activity...": "Sochiin feʼamaa jira...",
  "Add Member": "Miseensa dabali",
  "Contact Info": "Odeeffannoo quunnamtii",
  "Search by name, email, or member ID...":
    "Maqaa, imeelii, yookaan ID miseensaatiin barbaadi...",
  "Search by name, email, phone...": "Maqaa, imeelii, bilbilaan barbaadi...",
  "Search...": "Barbaadi...",
  Pending: "Eegamaa jira",
  Approved: "Mirkanaaʼe",
  Rejected: "Kufaa taʼe",
  Active: "Sochoʼaa",
  Inactive: "Hin sochoʼu",
  Completed: "Xumurame",
  Processing: "Adeemsifamaa jira",
  Failed: "Hin milkoofne",
  Paid: "Kaffalame",
  Overdue: "Yeroon darbe",
  Previous: "Kan duraa",
  Next: "Kan itti aanu",
  Back: "Duuba",
  "Try Again": "Irra deebiʼii yaali",
  "Export CSV": "CSV baasi",
  "All Regions": "Naannoolee hunda",
  "Addis Ababa": "Finfinnee",
  Oromia: "Oromiyaa",
  Amhara: "Amaaraa",
  "Newest First": "Kan haaraa dura",
  "Oldest First": "Kan moofaa dura",
  "Most Members": "Miseensota baay'ee",
  "Name (A-Z)": "Maqaa (A-Z)",
  "Registration #": "Galmee #",
  "Registered Date": "Guyyaa galmaa'e",
  "Loading SACCOs...": "SACCOwwan fe'amaa jiru...",
  "All Roles": "Gahee hunda",
  Superadmin: "Superadmin",
  Suspended: "Ukkamfame",
  User: "Fayyadamaa",
  Role: "Gahee",
  "Joined Date": "Guyyaa makame",
  "Loading users...": "Fayyadamtoota fe'amaa jiru...",
  "No users found": "Fayyadamtootni hin argamne",
  "Try adjusting your filters or search query.":
    "Gingilchaa ykn gaaffii barbaacha keetii sirreessuuf yaali.",
  None: "Homaa",
  "Reset Password": "Jecha Icciitii Haaromsi",
  "Temporary Password Generated!": "Jecha Icciitii Yeroo Uumameera!",
  "Please share this with the user securely.":
    "Maaloo kana fayyadamaa waliin haala nageenya qabuun qoodi.",
  "Cumulative registered SACCOs over the last 12 months":
    "SACCOwwan galmaa'an waliigalaa ji'oota 12 darban keessatti",
  "Current application distribution": "Raabsaa iyyannoo ammaa",
  "Loading pending SACCO approvals...":
    "Mirkaneessa SACCO eegamaa jiran fe'amaa jiru...",
  "Active nominal value": "Gatii idilee socho'aa",
  "Fully realized capital": "Kaappitaala guutuun argame",
  "Lowest Ownership": "Abbummaa gadi aanaa",
  "Name A-Z": "Maqaa A-Z",
  "Loading shares data...": "Daataa aksiyoonaa fe'amaa jira...",
  "Registration Pending": "Galmeen eegamaa jira",
  "All Statuses": "Haala hunda",
  "Sort: Newest First": "Tartiipeessi: Kan haaraa dura",
  "Member Details": "Bal'ina miseensaa",
  "Savings Balance": "Haftee qusannoo",
  "Loading members...": "Miseensota fe'amaa jiru...",
  "No members found.": "Miseensotni hin argamne.",
  "Add New Member": "Miseensa Haaraa Dabali",
  "Invitation Generated!": "Affeerraan Uumameera!",
  "Copy the link below and share it with the member so they can complete their registration.":
    "Liinkii armaan gadii kooppii godhii miseensichaaf qoodi akka isaan galmee isaanii xumuran.",

  // Public Layout & Navigation
  "SACCOs": "SACCOwwan",
  "Company": "Dhaabbata",
  "Product": "Oomisha",
  "Resources": "Qabeenya",
  "About Us": "Waa'ee Keenya",
  "Team": "Garee",
  "Careers": "Carraa Hojii",
  "Features": "Amaloota",
  "Pricing": "Gatii",
  "Security": "Nageenya",
  "Documentation": "Ragaalee",
  "API": "API",
  "Support": "Deeggarsa",
  "Privacy Policy": "Imaammata Dhuunfaa",
  "Terms of Service": "Waliigaltee Tajaajilaa",
  "All rights reserved.": "Mirgi hunduu eegamaadha.",
  "Powered by": "Kan hojjete",
  "Software Solutions": "Furmaata Sooftiweerii",
  "Empowering Ethiopian cooperatives with secure, scalable, and intuitive management solutions. Modernize your cooperative finance today.":
    "Waldaalee hojii gamtaa Itoophiyaa furmaata bulchiinsaa amansiisaa, salphaa fi babal'achuu danda'uun humneessuu. Faayinaansii keessan har'a ammayyeessaa.",

  // Landing Page
  "Awash SACCO Overview": "Ibsa Waliigalaa SACCO Awaash",
  "MONTHLY GROWTH": "GUDDINA JIILLAA",
  "Monthly Growth": "Guddina Ji'aa",
  "Loan Approved": "Liqiin Ragga'e",
  "Just now": "Amma",
  "Dividend Sent": "Qoodni Bu'aa Ergame",
  "Our platform provides comprehensive tools for every aspect of cooperative management.":
    "Waltajjiin keenya kallattii bulchiinsa waldaa hojii gamtaa hundaaf meeshaalee guutuu dhiyeessa.",
  "Member Management": "Bulchiinsa Miseensotaa",
  "Complete KYC profiles, automated activity tracking, and detailed member analytics.":
    "Piroofaayilii KYC guutuu, hordoffii soochii ofumaan fi xiinxala miseensotaa bal'aa.",
  "Savings & Deposits": "Qusannoo fi Kuusaa",
  "Real-time ledger updates, automated interest calculations, and multiple account types.":
    "Haaromsi galmee yeroo qabatamaa, shallaggii dhala ofumaan fi gosa herregaa hedduu.",
  "Loan Processing": "Adeemsa Liqii",
  "Digital applications, multi-tier approval workflows, and credit scoring.":
    "Iyyannoo dijitaalaa, adeemsa mirkaneessaa sadarkaa hedduu fi shallaggii liqii.",
  "Transparent share allocation, ownership tracking, and transfer management.":
    "Qooodinsa aksiyoonaa ifa ta'e, hordoffii abbummaa fi bulchiinsa dabarsaa.",
  "Dividend Distribution": "Qooodinsa Bu'aa",
  "Automated calculations, equitable distribution, and comprehensive reporting.":
    "Shallaggii ofumaan, qoodinsa haqa qabeessa fi gabaasa guutuu.",
  "Security & Compliance": "Nageenya fi Seera Eeguu",
  "Bank-grade encryption, role-based access, and full audit trails.":
    "Cufiinsa sadarkaa baankii, hayyama gahee irratti hundaa'e fi galmee odiitii guutuu.",
  "How It Works": "Akkaata Inni Hojjetu",
  "Get your SACCO digitized in three simple steps.":
    "Tarkaanfiiwwan salphaa sadiin SACCO keessan dijitaalawaa godhaa.",
  "Create your SACCO account and set up your organization profile in minutes.":
    "Akkaawuntii SACCO keessanii uumaatii piroofaayilii dhaabbata keessanii daqiiqaa muraasa keessatti qopheessaa.",
  "Onboard Members": "Miseensota Galchaa",
  "Invite members, complete KYC verification, and set up individual accounts.":
    "Miseensota affeeraa, mirkaneessa KYC xumuraa, fi akkaawuntii dhuunfaa qopheessaa.",
  "Start Managing": "Bulchuu Jalqabaa",
  "Process savings, approve loans, track dividends, and generate reports.":
    "Qusannoo adeemsisaa, liqii mirkaneessaa, bu'aa hordofaa, fi gabaasa maddisiisaa.",
  "Trusted by Cooperatives": "Waldaalee Hojii Gamtaatiin Kan Amaname",
  "Hear what our partner SACCOs have to say.": "SACCOwwan michuu keenya ta'an maal akka jedhan dhaga'aa.",
  "SACCO Manager transformed our manual processes. We now process loans 10x faster.":
    "Bulchaan SACCO adeemsa harka keenyaa jijjiireera. Amma liqii dacha 10n saffisaan adeemsisna.",
  "The dividend calculation feature alone saved us weeks of work each quarter.":
    "Amalli shallaggii qooda bu'aa qofti kurmaana hundatti hojii torbanootaa nu oolcheera.",
  "Our members love the transparency. They can see their savings grow in real-time.":
    "Miseensonni keenya iftoomina isaa jaallataniiru. Qusannoon isaanii yeroo qabatamaatti yommuu guddatu arguu danda'u.",
  "Admin, Awash SACCO": "Admin, SACCO Awaash",
  "Treasurer, Unity SACCO": "Qabaa Maallaqaa, SACCO Yuniitii",
  "Manager, Progress SACCO": "Maneejara, SACCO Piroogirasii",
  "Ready to Digitize Your SACCO?": "SACCO keessan dijitaaleessuuf qophiidhaa?",
  "Join hundreds of Ethiopian cooperatives already using SACCO Manager to grow their operations.":
    "Waldaalee hojii gamtaa Itoophiyaa dhibbaan lakkaa'aman kanneen hojii isaanii guddisuuf Bulchaa SACCO fayyadamaa jiranitti makamaa.",
  "Get Started Free": "Bilisaan Jalqabaa",

  // Public Directory & SACCO Profile
  "Explore SACCOs": "SACCOwwan Daawwadhaa",
  "Find verified SACCOs across Ethiopia, view membership requirements, and request to join directly.":
    "SACCOwwan mirkanaa'an Itoophiyaa guutuutti argadhaa, ulaagaalee miseensummaa ilaalaa, fi kallattiin itti makamuuf gaafadhaa.",
  "All Locations": "Bakkeewwan Hunda",
  "All Categories": "Gareewwan Hunda",
  "Search SACCOs by name, city, or focus area...": "SACCOwwan maqaadhaan, magaalaadhaan, yookaan xiyyeeffannaadhaan barbaadaa...",
  "Apply to Join": "Itti Makamuuf Iyyadhaa",
  "Open for Members": "Miseensotaaf Banaadha",
  "Closed": "Cufameera",
  "Min. Monthly Deposit": "Qusannoo Ji'aa Xiqqaa",
  "Share Price": "Gatii Aksiyoonaa",
  "Interest Rate": "Hamma Dhalaa",
  "Dividend Rate": "Hamma Bu'aa",
  "Established": "Kan Hundeeffame",
  "Requirements": "Ulaagaalee",
  "View Profile": "Piroofaayilii Ilaalaa",
  "No SACCOs found matching your search criteria.": "SACCOn ulaagaa barbaacha keessaniin walsimu hin argamne.",

  // About, Services, Contact Pages
  "Our Mission": "Ergama Keenya",
  "Our Vision": "Mul'ata Keenya",
  "Core Values": "Dudhaalee Ijoo",
  "Trust & Transparency": "Amanamummaa fi Iftoomina",
  "Community First": "Hawaasaaf Dursi",
  "Innovation": "Kalaqa",
  "Why Choose SACCO Manager?": "Maaliif Bulchaa SACCO Filattu?",
  "Bank-Grade Security": "Nageenya Sadarkaa Baankii",
  "Automated Dividend Calculation": "Shallaggii Qooda Bu'aa Ofumaan",
  "Real-Time Tracking": "Hordoffii Yeroo Qabatamaa",
  "Ready to Modernize Your SACCO?": "SACCO keessan ammayyeessuuf qophiidhaa?",
  "Core Capabilities": "Dandeettiiwwan Ijoo",
  "A unified platform to manage members, finances, and operations seamlessly.":
    "Waltajjii tokkoon miseensota, faayinaansii fi hojiiwwan walitti hidhamiinsaan bulchuuf.",
  "Loan Management": "Bulchiinsa Liqii",
  "Repayment Tracking": "Hordoffii Deebii Liqii",
  "Dynamic amortization schedules, automated overdue alerts via SMS, and integrated penalty calculations.":
    "Sagantaa deebisaa liqii socho'aa, akeekkachiisa darbiinsa yeroo SMS tiin, fi shallaggii adabbii walitti dhufeenya qabu.",
  "Streamlined digital applications, multi-tier approval workflows, and instant credit scoring based on member history.":
    "Iyyannoo dijitaalaa salphaa, adeemsa mirkaneessaa sadarkaa hedduu, fi shallaggii liqii seenaa miseensaa irratti hundaa'e.",
  "Transparent allocation mechanisms, detailed ownership tracking, and seamless share transfer processes between members.":
    "Mala qoodinsa aksiyoonaa ifa ta'e, hordoffii abbummaa bal'aa, fi adeemsa daddabarsa aksiyoonaa miseensota gidduutti.",
  "Automated pool calculation based on retained earnings, equitable distribution logic, and comprehensive historical reporting.":
    "Shallaggii bu'aa hafe irratti hundaa'e ofumaan, qoodinsa haqa qabeessa fi gabaasa seenaa guutuu.",
  "We're here to help you manage your financial future. Reach out to our dedicated support team in Adama.":
    "Gara fuulduraa faayinaansii keessan akka bulchitan isin gargaaruuf as jirra. Garee deeggarsa keenya Adaamatti argamu qunnamaa.",
  "Get In Touch": "Nu Qunnamaa",
  "Send us a message": "Ergaa nuuf ergaa",
  "Your Name": "Maqaa Keessan",
  "Your Email": "Imeelii Keessan",
  "Subject": "Dhimma",
  "Message": "Ergaa",
  "Send Message": "Ergaa Ergaa",
  "Sending...": "Ergamaa jira...",
  "Our Office": "Waajjira Keenya",
  "Phone": "Bilbila",
  "Email": "Imeelii",
  "Working Hours": "Sa'aatii Hojii",

  // Admin & Super Admin Pages
  "Membership Requests": "Gaaffilee Miseensummaa",
  "All Users": "Fayyadamtoota Hunda",
  "Platform Reports": "Gabaasawwan Waltajjichaa",
  "Platform Settings": "Qindaa'inawwan Waltajjichaa",
  "Platform Admin": "Adminii Waltajjichaa",
  "New SACCO": "SACCO Haaraa",
  "Super Admin": "Super Admin",
  "SuperAdmin": "Super Admin",
  "Member Distribution Preview": "Durargii Qoodinsa Miseensotaa",
  "Based on shareholding as of end of period.": "Qooda aksiyoonaa dhuma yeroo irratti hundaa'e.",
  "Export": "Baasi",
  "Commit": "Mirkaneessi",
  "Calculating...": "Shallagamaa jira...",
  "Calculate Distribution": "Qoodinsa Shallagi",
  "Financial Period": "Yeroo Faayinaansii",
  "Total Dividend Pool (ETB)": "Iddoo Bu'aa Waliigalaa (ETB)",
  "Statutory Reserve (%)": "Kuusaa Seeraa (%)",
  "Required percentage to hold back before distribution.": "Dhibbeentaa qoodinsa dura qabamuu qabu.",
  "Distribution Setup": "Qindaa'ina Qoodinsaa",
  "Calculation Summary": "Cuunfaa Shallaggii",
  "Distributable": "Kan Qoodamu",
  "Share Pool (70%)": "Qooda Aksiyoonaa (70%)",
  "Savings Pool (30%)": "Qooda Qusannoo (30%)",
  "Enter total pool amount and click Calculate Distribution to see the preview.":
    "Durargii arguuf hamma bu'aa waliigalaa galchaatii Qoodinsa Shallagi tuqaa.",
  "No Past Distributions": "Qoodinsi Darbe Hin Jiru",
  "There is no dividend history recorded for this SACCO.": "Seenaan qooda bu'aa SACCO kanaaf galmaa'e hin jiru.",
  "Log out of your account?": "Akkaawuntii keessan keessaa ba'uu barbaadduu?",
  "You can sign in again anytime.": "Yeroo kamiyyuu deebitanii seenuu dandeessu.",

  // Member Statements, Notifications, Help & Support, Buy Shares
  "Account Statements": "Ibsa Herregaa",
  "Download your monthly consolidated account statements.": "Ibsa herrega keessanii ji'a ji'aan walitti qabame buufadhaa.",
  "Consolidated Statement": "Ibsa Walitti Qabame",
  "Download": "Buufadhu",
  "Issued": "Kan Kenname",
  "No statements available for this period.": "Yeroo kanaaf ibsi herregaa hin jiru.",
  "Notifications": "Beeksisawwan",
  "Unread": "Kan hin dubbifamne",
  "Stay updated on your account activity and requests.": "Sochii akkaawuntii fi gaaffilee keessan irratti odeeffannoo yeroo dhihoo argadhaa.",
  "Mark all as read": "Hunda akka dubbifametti mallatteessi",
  "Loading notifications...": "Beeksisawwan fe'amaa jiru...",
  "No Notifications": "Beeksisni Hin Jiru",
  "You are all caught up! Account updates will appear here.": "Odeeffannoon haaraan hin jiru! Haaromsi asitti mul'ata.",
  "View More": "Dabalata Ilaali",
  "View Less": "Gabaabsi Ilaali",
  "Notification Details": "Bal'ina Beeksisaa",
  "Close": "Cufi",
  "Help & Support": "Gargaarsa & Deeggarsa",
  "Have questions? We are here to help.": "Gaaffii qabduu? Isin gargaaruuf qophiidha.",
  "Knowledge Base": "Kuusaa Beekumsaa",
  "Browse our comprehensive FAQ and guides.": "Gaaffilee deddeebi'anii ka'anii fi qajeelchawwan keenya daawwadhaa.",
  "Contact Admin": "Adminii Qunnamaa",
  "Send us a direct message for specific inquiries.": "Gaaffilee addaatiif kallattiin ergaa nuuf ergaa.",
  "Call Support": "Deeggarsaaf Bilbilaa",
  "Available Mon-Fri, 8 AM - 5 PM (EAT).": "Wiixata - Jimaata, Ganama 2:00 - Waaree Booda 11:00 argama.",
  "Frequently Asked Questions": "Gaaffilee Yeroo Baay'ee Gaafataman",
  "Send a Message": "Ergaa Ergi",
  "General Inquiry": "Gaaffii Waliigalaa",
  "Loan Application Issue": "Rakkina Iyyannoo Liqii",
  "Savings Discrepancy": "Garaagarummaa Qusannoo",
  "Account Access": "Baniinsa Akkaawuntii",
  "Buy Shares": "Aksiyoona Biti",
  "Buy More Shares": "Aksiyoona Dabalataa Biti",
  "Number of Shares to Buy": "Baay'ina Aksiyoona Bitamu",
  "Total Cost": "Gatii Waliigalaa",
  "Pay with Chapa": "Chaapaadhaan Kaffali",
  "Pay Online (Chapa)": "Toora Internetii Irratti Kaffali (Chapa)",
  "days remaining": "guyyoota hafan",
  "day remaining": "guyyaa hafe",
  "Due today": "Har'a kaffalama",
  "days overdue": "guyyoota darban",
  "day overdue": "guyyaa darbe",
  "You have no active loans or upcoming payment installments at this time.":
    "Yeroo ammaa kana liqii socho'aa yookaan kaffaltii fuulduraa hin qabdan.",
  "Increase your stake in the SACCO! The current share value is":
    "Qooda keessan SACCO keessatti guddisaa! Gatiin aksiyoona ammaa",
  "per share.": "aksiyoona tokkoof.",
  "You will be redirected to Chapa to securely complete this payment.":
    "Kaffaltii kana nagaadhaan xumuruuf gara Chaapaatti qajeelfamtu.",
  "Verifying Payment...": "Kaffaltiin Mirkanaa'aa Jira...",
  "Please wait while we confirm your payment with Chapa.":
    "Hamma kaffaltii keessan Chaapaa waliin mirkaneessinutti mee eegaa.",
  "Payment Successful!": "Kaffaltiin Milkaa'eera!",
  "Your transaction has been recorded successfully.": "Daldalli keessan milkaa'inaan galmaa'eera.",
  "Return to Payments": "Gara Kaffaltiitti Deebi'i",
  "Payment Failed": "Kaffaltiin Hin Milkoofne",
  "We could not verify your payment. Please try again or contact support.":
    "Kaffaltii keessan mirkaneessuu hin dandeenye. Mee irra deebi'aa yaalaa yookaan deeggarsa qunnamaa.",
};

const maps: Record<LanguageCode, TranslationMap> = { am, om };
const localizableAttributes = ["placeholder", "title", "aria-label", "alt"];

function translateValue(value: string, translations: TranslationMap) {
  const trimmed = value.trim();
  if (!trimmed) return value;

  // 1. Direct exact match
  if (translations[trimmed]) {
    return value.replace(trimmed, translations[trimmed]);
  }

  // 2. Normalized whitespace (multiline JSX text)
  const normalized = trimmed.replace(/\s+/g, " ");
  if (translations[normalized]) {
    return value.replace(trimmed, translations[normalized]);
  }

  // 3. Leading emoji or icon
  const emojiMatch = trimmed.match(/^([\p{Extended_Pictographic}\u200d\uFE0F\s]+)(.*)$/u);
  if (emojiMatch) {
    const icon = emojiMatch[1];
    const rest = emojiMatch[2].trim().replace(/\s+/g, " ");
    if (translations[rest]) {
      return value.replace(trimmed, icon + translations[rest]);
    }
  }

  // 4. Trailing punctuation like ":" or "..." or "?"
  const punctMatch = trimmed.match(/^(.*?)([:\.\?\!]+)$/);
  if (punctMatch) {
    const core = punctMatch[1].trim().replace(/\s+/g, " ");
    const punct = punctMatch[2];
    if (translations[core]) {
      return value.replace(trimmed, translations[core] + (punct === ":" ? "፡" : punct));
    }
  }

  return value;
}

function localizeElement(root: ParentNode, language: string) {
  const langKey = language.split("-")[0] as LanguageCode;
  const translations = maps[langKey];
  const shouldIgnore = (element: Element | null) =>
    Boolean(element?.closest('[data-i18n-ignore="true"]'));

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (
        !parent ||
        shouldIgnore(parent) ||
        ["SCRIPT", "STYLE", "TEXTAREA", "OPTION"].includes(parent.tagName)
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: LocalizedText[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as LocalizedText);
  }

  textNodes.forEach((node) => {
    if (!translations) {
      if (node.__i18nOriginalText) {
        node.nodeValue = node.__i18nOriginalText;
      } else {
        node.__i18nOriginalText = node.nodeValue || "";
      }
      return;
    }

    if (!node.__i18nOriginalText) {
      node.__i18nOriginalText = node.nodeValue || "";
    }
    const original = node.__i18nOriginalText;
    node.nodeValue = translateValue(original, translations);
  });

  const elements =
    root instanceof Element
      ? [root, ...Array.from(root.querySelectorAll("*"))]
      : Array.from(root.querySelectorAll("*"));
  elements.forEach((element) => {
    if (shouldIgnore(element)) return;

    localizableAttributes.forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return;
      const originalAttribute = `data-i18n-original-${attribute}`;
      if (!element.hasAttribute(originalAttribute)) {
        element.setAttribute(originalAttribute, value);
      }
      const original = element.getAttribute(originalAttribute) || value;
      element.setAttribute(
        attribute,
        translations ? translateValue(original, translations) : original,
      );
    });
  });
}

export function PageTextLocalizer() {
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const rawLang = i18n.resolvedLanguage || i18n.language || "en";
    const language = rawLang.split("-")[0];
    const root = document.body;
    localizeElement(root, language);

    const observer = new MutationObserver((mutations) => {
      if (!maps[language as LanguageCode]) return;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element || node instanceof DocumentFragment) {
            localizeElement(node, language);
          } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
            localizeElement(node.parentElement, language);
          }
        });
      });
    });

    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [i18n.language, i18n.resolvedLanguage, location.pathname]);

  return null;
}
