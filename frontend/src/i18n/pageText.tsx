import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

type LanguageCode = 'am' | 'om'
type TranslationMap = Record<string, string>
type LocalizedText = Text & { __i18nOriginalText?: string }

const am: TranslationMap = {
  'SACCO Manager': 'SACCO አስተዳዳሪ',
  'Home': 'መነሻ',
  'About': 'ስለ እኛ',
  'Services': 'አገልግሎቶች',
  'Contact': 'ያግኙን',
  'Login': 'ግባ',
  'Sign In': 'ግባ',
  'Sign in': 'ግባ',
  'Register': 'ይመዝገቡ',
  'Register SACCO': 'SACCO ይመዝገቡ',
  'Register Your SACCO': 'የእርስዎን SACCO ይመዝገቡ',
  'Contact Sales': 'ሽያጭን ያግኙ',
  'Trusted by 500+ Ethiopian Cooperatives': 'በ500+ የኢትዮጵያ ህብረት ስራ ማህበራት የታመነ',
  "Empowering Ethiopia's": 'የኢትዮጵያን',
  'Cooperative': 'ህብረት ስራ',
  'Economy': 'ኢኮኖሚ ማጠናከር',
  'Bridging the gap between traditional community values and modern financial technology. The ultimate digital platform for Ethiopian SACCOs to securely manage members, scale savings, and drive local growth.': 'ባህላዊ የማህበረሰብ እሴቶችን ከዘመናዊ የፋይናንስ ቴክኖሎጂ ጋር የሚያገናኝ። ለኢትዮጵያ SACCOዎች አባላትን በደህንነት ለማስተዳደር፣ ቁጠባን ለማሳደግ እና አካባቢያዊ እድገትን ለማበረታታት የተዘጋጀ ዲጂታል መድረክ።',
  'Everything You Need to Run a SACCO': 'SACCOን ለማስኬድ የሚያስፈልግዎ ሁሉ',
  'SACCOs Registered': 'የተመዘገቡ SACCOዎች',
  'Active Members': 'ንቁ አባላት',
  'Birr Managed': 'የተተዳደረ ብር',
  'Uptime SLA': 'የአገልግሎት ተገኝነት',
  'About SACCO Manager': 'ስለ SACCO አስተዳዳሪ',
  'Contact Us': 'ያግኙን',
  'Our Services': 'አገልግሎቶቻችን',
  'Welcome Back': 'እንኳን ተመለሱ',
  'Sign in to your SACCO account to continue.': 'ለመቀጠል ወደ SACCO መለያዎ ይግቡ።',
  'Email Address or Member ID': 'ኢሜይል አድራሻ ወይም የአባል መታወቂያ',
  'Password': 'የይለፍ ቃል',
  'Forgot Password?': 'የይለፍ ቃል ረሱ?',
  "Don't have an account?": 'መለያ የለዎትም?',
  'Create Account': 'መለያ ይፍጠሩ',
  'Organization Details': 'የድርጅት ዝርዝሮች',
  'SACCO Name': 'የSACCO ስም',
  'Official Email': 'ይፋዊ ኢሜይል',
  'Phone Number': 'ስልክ ቁጥር',
  'Address': 'አድራሻ',
  'Admin Details': 'የአስተዳዳሪ ዝርዝሮች',
  'Full Name': 'ሙሉ ስም',
  'Submit': 'አስገባ',
  'Cancel': 'ይቅር',
  'Save': 'አስቀምጥ',
  'Delete': 'ሰርዝ',
  'Edit': 'አስተካክል',
  'Create': 'ፍጠር',
  'Search': 'ፈልግ',
  'Refresh': 'አድስ',
  'Loading...': 'በመጫን ላይ...',
  'Loading': 'በመጫን ላይ',
  'Error': 'ስህተት',
  'Success': 'ተሳክቷል',
  'Status': 'ሁኔታ',
  'Actions': 'ተግባራት',
  'Date': 'ቀን',
  'Amount': 'መጠን',
  'Description': 'መግለጫ',
  'Member': 'አባል',
  'Members': 'አባላት',
  'Savings': 'ቁጠባ',
  'Loans': 'ብድሮች',
  'Repayments': 'ክፍያዎች',
  'Shares': 'አክሲዮኖች',
  'Dividends': 'የትርፍ ድርሻ',
  'Settings': 'ቅንብሮች',
  'Dashboard': 'ዳሽቦርድ',
  'Admin': 'አስተዳዳሪ',
  'SACCO Admin': 'SACCO አስተዳዳሪ',
  'Profile': 'መገለጫ',
  'Logout': 'ውጣ',
  'Total Members': 'ጠቅላላ አባላት',
  'Total Savings': 'ጠቅላላ ቁጠባ',
  'Active Loans': 'ንቁ ብድሮች',
  'Overdue Repayments': 'ያለፉ ክፍያዎች',
  'Share Capital': 'የአክሲዮን ካፒታል',
  'Member Shares Distribution': 'የአባላት አክሲዮን ስርጭት',
  'Manage and track member equity distributions.': 'የአባላት የካፒታል ስርጭትን ያስተዳድሩ እና ይከታተሉ።',
  'Share Value': 'የአክሲዮን ዋጋ',
  'Total Shares Issued': 'ጠቅላላ የተሰጡ አክሲዮኖች',
  'Total Share Capital': 'ጠቅላላ የአክሲዮን ካፒታል',
  'Update Shares': 'አክሲዮኖችን አዘምን',
  'Highest Ownership': 'ከፍተኛ ባለቤትነት',
  'Member #': 'የአባል #',
  'Current Shares': 'የአሁን አክሲዮኖች',
  'Total Capital': 'ጠቅላላ ካፒታል',
  'Ownership': 'ባለቤትነት',
  'Recent Activity': 'የቅርብ ጊዜ እንቅስቃሴ',
  'View All': 'ሁሉንም ይመልከቱ',
  'Type': 'አይነት',
  'Loan Status Distribution': 'የብድር ሁኔታ ስርጭት',
  'Savings & Loans Trend (Last 6 Months)': 'የቁጠባና ብድር አዝማሚያ (ያለፉት 6 ወራት)',
  'Loading chart...': 'ገበታ በመጫን ላይ...',
  'No chart data available': 'የገበታ መረጃ የለም',
  'No recent activity found.': 'የቅርብ ጊዜ እንቅስቃሴ አልተገኘም።',
  'Loading activity...': 'እንቅስቃሴ በመጫን ላይ...',
  'Add Member': 'አባል ጨምር',
  'Contact Info': 'የመገናኛ መረጃ',
  'Search by name, email, or member ID...': 'በስም፣ ኢሜይል ወይም የአባል መታወቂያ ፈልግ...',
  'Search by name, email, phone...': 'በስም፣ ኢሜይል፣ ስልክ ፈልግ...',
  'Search...': 'ፈልግ...',
  'Pending': 'በመጠባበቅ ላይ',
  'Approved': 'ጸድቋል',
  'Rejected': 'ውድቅ ተደርጓል',
  'Active': 'ንቁ',
  'Inactive': 'ንቁ አይደለም',
  'Completed': 'ተጠናቋል',
  'Processing': 'በሂደት ላይ',
  'Failed': 'አልተሳካም',
  'Paid': 'ተከፍሏል',
  'Overdue': 'ጊዜው አልፏል',
  'Previous': 'ቀዳሚ',
  'Next': 'ቀጣይ',
  'Back': 'ተመለስ',
  'Try Again': 'እንደገና ይሞክሩ',
  'Export CSV': 'በCSV አውርድ',
  'All Regions': 'ሁሉም ክልሎች',
  'Addis Ababa': 'አዲስ አበባ',
  'Oromia': 'ኦሮሚያ',
  'Amhara': 'አማራ',
  'Newest First': 'አዲሱ መጀመሪያ',
  'Oldest First': 'የድሮው መጀመሪያ',
  'Most Members': 'ብዙ አባላት',
  'Name (A-Z)': 'ስም (ከ ሀ-ፐ)',
  'Registration #': 'የምዝገባ #',
  'Registered Date': 'የተመዘገበበት ቀን',
  'Loading SACCOs...': 'SACCOዎችን በመጫን ላይ...',
  'All Roles': 'ሁሉም ሚናዎች',
  'Superadmin': 'ዋና አስተዳዳሪ',
  'Suspended': 'ታግዷል',
  'User': 'ተጠቃሚ',
  'Role': 'ሚና',
  'Joined Date': 'የተቀላቀለበት ቀን',
  'Loading users...': 'ተጠቃሚዎችን በመጫን ላይ...',
  'No users found': 'ተጠቃሚዎች አልተገኙም',
  'Try adjusting your filters or search query.': 'ማጣሪያዎችዎን ወይም የፍለጋ ጥያቄዎን ለማስተካከል ይሞክሩ።',
  'None': 'ምንም',
  'Reset Password': 'የይለፍ ቃል ዳግም ያስጀምሩ',
  'Temporary Password Generated!': 'ጊዜያዊ የይለፍ ቃል ተፈጥሯል!',
  'Please share this with the user securely.': 'እባክዎ ይህንን ከተጠቃሚው ጋር በደህና ያጋሩ።',
  'Cumulative registered SACCOs over the last 12 months': 'ባለፉት 12 ወራት ውስጥ የተመዘገቡ አጠቃላይ SACCOዎች',
  'Current application distribution': 'የአሁኑ ማመልከቻ ስርጭት',
  'Loading pending SACCO approvals...': 'በመጠባበቅ ላይ ያሉ የSACCO ማጽደቆችን በመጫን ላይ...',
  'Active nominal value': 'ንቁ የመነሻ ዋጋ',
  'Fully realized capital': 'ሙሉ በሙሉ የተገኘ ካፒታል',
  'Lowest Ownership': 'ዝቅተኛ ባለቤትነት',
  'Name A-Z': 'ስም ከ ሀ-ፐ',
  'Loading shares data...': 'የአክሲዮን መረጃ በመጫን ላይ...',
  'Registration Pending': 'ምዝገባ በመጠባበቅ ላይ',
  'All Statuses': 'ሁሉም ሁኔታዎች',
  'Sort: Newest First': 'ደርድር፡ አዲሱ መጀመሪያ',
  'Member Details': 'የአባል ዝርዝሮች',
  'Savings Balance': 'የቁጠባ ቀሪ ሂሳብ',
  'Loading members...': 'አባላትን በመጫን ላይ...',
  'No members found.': 'ምንም አባላት አልተገኙም።',
  'Add New Member': 'አዲስ አባል ጨምር',
  'Invitation Generated!': 'ግብዣ ተፈጥሯል!',
  'Copy the link below and share it with the member so they can complete their registration.': 'የምዝገባ ሂደታቸውን እንዲያጠናቅቁ ከታች ያለውን አገናኝ ይቅዱ እና ለአባሉ ያጋሩ።'
}

const om: TranslationMap = {
  'SACCO Manager': 'Bulchaa SACCO',
  'Home': 'Mana',
  'About': 'Waaʼee',
  'Services': 'Tajaajiloota',
  'Contact': 'Nu qunnami',
  'Login': 'Seeni',
  'Sign In': 'Seeni',
  'Sign in': 'Seeni',
  'Register': 'Galmaaʼi',
  'Register SACCO': 'SACCO galmeessi',
  'Register Your SACCO': 'SACCO kee galmeessi',
  'Contact Sales': 'Gurgurtaa qunnami',
  'Trusted by 500+ Ethiopian Cooperatives': 'Waldaalee hojii gamtaa Itoophiyaa 500+ biratti amaname',
  "Empowering Ethiopia's": 'Itoophiyaa humneessuu',
  'Cooperative': 'Hojii Gamtaa',
  'Economy': 'Diinagdee',
  'Bridging the gap between traditional community values and modern financial technology. The ultimate digital platform for Ethiopian SACCOs to securely manage members, scale savings, and drive local growth.': 'Gatiiwwan hawaasaa aadaa fi teeknooloojii faayinaansii ammayyaa walitti hidha. Waltajjii dijitaalaa SACCO Itoophiyaaf miseensota nageenyaan bulchuuf, qusannoo guddisuuf, fi guddina naannoo saffisiisuuf qophaaʼe.',
  'Everything You Need to Run a SACCO': 'SACCO geggeessuuf wanta si barbaachisu hunda',
  'SACCOs Registered': 'SACCOwwan galmaaʼan',
  'Active Members': 'Miseensota sochoʼan',
  'Birr Managed': 'Birrii bulfame',
  'Uptime SLA': 'Wabii tajaajila',
  'About SACCO Manager': 'Waaʼee Bulchaa SACCO',
  'Contact Us': 'Nu qunnami',
  'Our Services': 'Tajaajiloota keenya',
  'Welcome Back': 'Baga deebite',
  'Sign in to your SACCO account to continue.': 'Itti fufuuf akkaawuntii SACCO keetti seeni.',
  'Email Address or Member ID': 'Teessoo imeelii yookaan ID miseensaa',
  'Password': 'Jecha icciitii',
  'Forgot Password?': 'Jecha icciitii dagatte?',
  "Don't have an account?": 'Akkaawuntii hin qabduu?',
  'Create Account': 'Akkaawuntii uumi',
  'Organization Details': 'Balʼina dhaabbataa',
  'SACCO Name': 'Maqaa SACCO',
  'Official Email': 'Imeelii seera qabeessa',
  'Phone Number': 'Lakkoofsa bilbilaa',
  'Address': 'Teessoo',
  'Admin Details': 'Balʼina adminii',
  'Full Name': 'Maqaa guutuu',
  'Submit': 'Ergi',
  'Cancel': 'Haqi',
  'Save': 'Olkaaʼi',
  'Delete': 'Haqi',
  'Edit': 'Gulaali',
  'Create': 'Uumi',
  'Search': 'Barbaadi',
  'Refresh': 'Haaromsi',
  'Loading...': 'Feʼamaa jira...',
  'Loading': 'Feʼamaa jira',
  'Error': 'Dogoggora',
  'Success': 'Milkaaʼe',
  'Status': 'Haala',
  'Actions': 'Tarkaanfiiwwan',
  'Date': 'Guyyaa',
  'Amount': 'Hanga',
  'Description': 'Ibsa',
  'Member': 'Miseensa',
  'Members': 'Miseensota',
  'Savings': 'Qusannoo',
  'Loans': 'Liqiiwwan',
  'Repayments': 'Kaffaltii deebisaa',
  'Shares': 'Aksiyoona',
  'Dividends': 'Buʼaa qoodame',
  'Settings': 'Qindaaʼinoota',
  'Dashboard': 'Daashboordii',
  'Admin': 'Adminii',
  'SACCO Admin': 'Adminii SACCO',
  'Profile': 'Piroofaayilii',
  'Logout': 'Baʼi',
  'Total Members': 'Waliigala miseensota',
  'Total Savings': 'Waliigala qusannoo',
  'Active Loans': 'Liqiiwwan sochoʼan',
  'Overdue Repayments': 'Kaffaltiiwwan yeroon darban',
  'Share Capital': 'Kaappitaala aksiyoonaa',
  'Member Shares Distribution': 'Raabsaa aksiyoonaa miseensotaa',
  'Manage and track member equity distributions.': 'Raabsaa qabeenya miseensotaa bulchi fi hordofi.',
  'Share Value': 'Gatii aksiyoonaa',
  'Total Shares Issued': 'Waliigala aksiyoonaa kenname',
  'Total Share Capital': 'Waliigala kaappitaala aksiyoonaa',
  'Update Shares': 'Aksiyoona haaromsi',
  'Highest Ownership': 'Abbummaa olaanaa',
  'Member #': 'Miseensa #',
  'Current Shares': 'Aksiyoona ammaa',
  'Total Capital': 'Waliigala kaappitaalaa',
  'Ownership': 'Abbummaa',
  'Recent Activity': 'Sochii dhiheenyaa',
  'View All': 'Hundaa ilaali',
  'Type': 'Gosa',
  'Loan Status Distribution': 'Raabsaa haala liqii',
  'Savings & Loans Trend (Last 6 Months)': 'Adeemsa qusannoo fi liqii (Jiʼoota 6 darban)',
  'Loading chart...': 'Chaartiin feʼamaa jira...',
  'No chart data available': 'Daataan chaartii hin jiru',
  'No recent activity found.': 'Sochiin dhiheenyaa hin argamne.',
  'Loading activity...': 'Sochiin feʼamaa jira...',
  'Add Member': 'Miseensa dabali',
  'Contact Info': 'Odeeffannoo quunnamtii',
  'Search by name, email, or member ID...': 'Maqaa, imeelii, yookaan ID miseensaatiin barbaadi...',
  'Search by name, email, phone...': 'Maqaa, imeelii, bilbilaan barbaadi...',
  'Search...': 'Barbaadi...',
  'Pending': 'Eegamaa jira',
  'Approved': 'Mirkanaaʼe',
  'Rejected': 'Kufaa taʼe',
  'Active': 'Sochoʼaa',
  'Inactive': 'Hin sochoʼu',
  'Completed': 'Xumurame',
  'Processing': 'Adeemsifamaa jira',
  'Failed': 'Hin milkoofne',
  'Paid': 'Kaffalame',
  'Overdue': 'Yeroon darbe',
  'Previous': 'Kan duraa',
  'Next': 'Kan itti aanu',
  'Back': 'Duuba',
  'Try Again': 'Irra deebiʼii yaali',
  'Export CSV': 'CSV baasi',
  'All Regions': 'Naannoolee hunda',
  'Addis Ababa': 'Finfinnee',
  'Oromia': 'Oromiyaa',
  'Amhara': 'Amaaraa',
  'Newest First': 'Kan haaraa dura',
  'Oldest First': 'Kan moofaa dura',
  'Most Members': 'Miseensota baay\'ee',
  'Name (A-Z)': 'Maqaa (A-Z)',
  'Registration #': 'Galmee #',
  'Registered Date': 'Guyyaa galmaa\'e',
  'Loading SACCOs...': 'SACCOwwan fe\'amaa jiru...',
  'All Roles': 'Gahee hunda',
  'Superadmin': 'Superadmin',
  'Suspended': 'Ukkamfame',
  'User': 'Fayyadamaa',
  'Role': 'Gahee',
  'Joined Date': 'Guyyaa makame',
  'Loading users...': 'Fayyadamtoota fe\'amaa jiru...',
  'No users found': 'Fayyadamtootni hin argamne',
  'Try adjusting your filters or search query.': 'Gingilchaa ykn gaaffii barbaacha keetii sirreessuuf yaali.',
  'None': 'Homaa',
  'Reset Password': 'Jecha Icciitii Haaromsi',
  'Temporary Password Generated!': 'Jecha Icciitii Yeroo Uumameera!',
  'Please share this with the user securely.': 'Maaloo kana fayyadamaa waliin haala nageenya qabuun qoodi.',
  'Cumulative registered SACCOs over the last 12 months': 'SACCOwwan galmaa\'an waliigalaa ji\'oota 12 darban keessatti',
  'Current application distribution': 'Raabsaa iyyannoo ammaa',
  'Loading pending SACCO approvals...': 'Mirkaneessa SACCO eegamaa jiran fe\'amaa jiru...',
  'Active nominal value': 'Gatii idilee socho\'aa',
  'Fully realized capital': 'Kaappitaala guutuun argame',
  'Lowest Ownership': 'Abbummaa gadi aanaa',
  'Name A-Z': 'Maqaa A-Z',
  'Loading shares data...': 'Daataa aksiyoonaa fe\'amaa jira...',
  'Registration Pending': 'Galmeen eegamaa jira',
  'All Statuses': 'Haala hunda',
  'Sort: Newest First': 'Tartiipeessi: Kan haaraa dura',
  'Member Details': 'Bal\'ina miseensaa',
  'Savings Balance': 'Haftee qusannoo',
  'Loading members...': 'Miseensota fe\'amaa jiru...',
  'No members found.': 'Miseensotni hin argamne.',
  'Add New Member': 'Miseensa Haaraa Dabali',
  'Invitation Generated!': 'Affeerraan Uumameera!',
  'Copy the link below and share it with the member so they can complete their registration.': 'Liinkii armaan gadii kooppii godhii miseensichaaf qoodi akka isaan galmee isaanii xumuran.'
}

const maps: Record<LanguageCode, TranslationMap> = { am, om }
const localizableAttributes = ['placeholder', 'title', 'aria-label', 'alt']

function translateValue(value: string, translations: TranslationMap) {
  const trimmed = value.trim()
  if (!trimmed) return value

  const translated = translations[trimmed]
  if (!translated) return value

  return value.replace(trimmed, translated)
}

function localizeElement(root: ParentNode, language: string) {
  const translations = maps[language as LanguageCode]
  const shouldIgnore = (element: Element | null) => Boolean(element?.closest('[data-i18n-ignore="true"]'))

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent || shouldIgnore(parent) || ['SCRIPT', 'STYLE', 'TEXTAREA', 'OPTION'].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const textNodes: LocalizedText[] = []
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as LocalizedText)
  }

  textNodes.forEach((node) => {
    if (!node.__i18nOriginalText) {
      node.__i18nOriginalText = node.nodeValue || ''
    }
    const original = node.__i18nOriginalText
    node.nodeValue = translations ? translateValue(original, translations) : original
  })

  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll('*'))] : Array.from(root.querySelectorAll('*'))
  elements.forEach((element) => {
    if (shouldIgnore(element)) return

    localizableAttributes.forEach((attribute) => {
      const value = element.getAttribute(attribute)
      if (!value) return
      const originalAttribute = `data-i18n-original-${attribute}`
      if (!element.hasAttribute(originalAttribute)) {
        element.setAttribute(originalAttribute, value)
      }
      const original = element.getAttribute(originalAttribute) || value
      element.setAttribute(attribute, translations ? translateValue(original, translations) : original)
    })
  })
}

export function PageTextLocalizer() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return

    const language = i18n.resolvedLanguage || i18n.language
    localizeElement(root, language)

    const observer = new MutationObserver((mutations) => {
      if (!maps[language as LanguageCode]) return
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element || node instanceof DocumentFragment) {
            localizeElement(node, language)
          }
        })
      })
    })

    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [i18n.language, i18n.resolvedLanguage])

  return null
}
