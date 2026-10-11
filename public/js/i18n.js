/**
 * Usha Institute of Computer Education - Internationalization (i18n) Engine
 * Full Bilingual English & Hindi Translations
 */

const translations = {
  en: {
    // Header & Navigation
    nav_home: "Home",
    nav_about: "About",
    nav_courses: "Courses",
    nav_admissions: "Admissions",
    nav_apply_online: "Apply Online",
    nav_application_status: "Application Status",
    nav_fee_structure: "Fee Structure",
    nav_results_verify: "Results & Verify",
    nav_student_result: "Student Result",
    nav_admit_card: "Admit Card",
    nav_verify_cert: "Verify Certificate & Marksheet",
    nav_notices: "Notices",
    nav_contact: "Contact",
    nav_login: "Login",
    nav_apply_now: "Apply Now",
    nav_dashboard: "Dashboard",
    nav_logout: "Logout",

    // Banner & Common
    institute_name: "Usha Institute Of Computer Education",
    tagline: "Empowering Careers Through Quality IT & Vocational Education",
    center_code_label: "ATC Center Code",
    read_more: "Read More",
    view_details: "View Details",
    search_placeholder: "Search...",

    // Footer
    footer_desc: "Registered under Section 8, Ministry of Corporate Affairs, Govt. of India. ISO 9001:2015 Certified Educational Institution.",
    footer_quick_links: "Quick Links",
    footer_contact_info: "Campus Contact",
    footer_address: "Hanuman Mandir ke pass, Pahasa Bazar, Mau, Uttar Pradesh 221705",
    footer_phone: "+91-7275043143",
    footer_email: "ushainstitutepahasa@gmail.com",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms & Conditions",
    footer_refund: "Refund Policy",
    footer_rights: "All Rights Reserved."
  },
  hi: {
    // Header & Navigation
    nav_home: "मुख्य पृष्ठ",
    nav_about: "संस्थान परिचय",
    nav_courses: "पाठ्यक्रम",
    nav_admissions: "प्रवेश",
    nav_apply_online: "ऑनलाइन आवेदन",
    nav_application_status: "आवेदन स्थिति",
    nav_fee_structure: "शुल्क संरचना",
    nav_results_verify: "परिणाम एवं सत्यापन",
    nav_student_result: "छात्र परीक्षा परिणाम",
    nav_admit_card: "प्रवेश पत्र (Admit Card)",
    nav_verify_cert: "प्रमाणपत्र एवं अंकपत्र सत्यापन",
    nav_notices: "सूचनाएं",
    nav_contact: "संपर्क करें",
    nav_login: "लॉगिन",
    nav_apply_now: "आवेदन करें",
    nav_dashboard: "डैशबोर्ड",
    nav_logout: "लॉगआउट",

    // Banner & Common
    institute_name: "उषा इंस्टीट्यूट ऑफ कंप्यूटर एजुकेशन",
    tagline: "गुणवत्तापूर्ण कंप्यूटर एवं व्यावसायिक शिक्षा के माध्यम से उज्ज्वल भविष्य",
    center_code_label: "अधिकृत केंद्र कोड",
    read_more: "और पढ़ें",
    view_details: "विवरण देखें",
    search_placeholder: "खोजें...",

    // Footer
    footer_desc: "कार्पोरेट कार्य मंत्रालय, भारत सरकार (धारा 8) के अंतर्गत पंजीकृत एवं ISO 9001:2015 प्रमाणित कंप्यूटर शिक्षण संस्थान।",
    footer_quick_links: "त्वरित लिंक",
    footer_contact_info: "संस्थान संपर्क",
    footer_address: "हनुमान मंदिर के पास, पहसा बाज़ार, मऊ, उत्तर प्रदेश 221705",
    footer_phone: "+91-7275043143",
    footer_email: "ushainstitutepahasa@gmail.com",
    footer_privacy: "गोपनीयता नीति",
    footer_terms: "नियम एवं शर्तें",
    footer_refund: "वापसी नीति",
    footer_rights: "सर्वाधिकार सुरक्षित।"
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem('usha_lang') || 'en';
  }

  t(key) {
    return translations[this.currentLang]?.[key] || translations['en'][key] || key;
  }

  setLanguage(lang) {
    if (translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('usha_lang', lang);
      this.applyTranslations();
      document.documentElement.lang = lang;
    }
  }

  toggleLanguage() {
    this.setLanguage(this.currentLang === 'en' ? 'hi' : 'en');
  }

  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
        el.setAttribute('placeholder', text);
      } else {
        el.textContent = text;
      }
    });

    const langBtn = document.getElementById('langToggleText');
    if (langBtn) {
      langBtn.textContent = this.currentLang === 'en' ? 'हिन्दी' : 'English';
    }
  }
}

window.i18n = new I18nManager();
