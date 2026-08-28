import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      appName: 'LingoBite Play',
      tagline: 'Learn English through play',
      nav_dashboard: 'Dashboard',
      nav_library: 'Game Library',
      nav_myGames: 'My Games',
      nav_classes: 'My Classes',
      nav_admin: 'Admin',
      nav_signIn: 'Sign in with Google',
      nav_signOut: 'Sign out',
      nav_playAsGuest: 'Play as Guest',
      role_student: 'Student',
      role_teacher: 'Teacher',
      role_admin: 'Admin',
      requestTeacherAccess: 'Request teacher access',
      teacherPending: 'Teacher access pending approval',
      createGame: 'Create a game',
      downloadTemplate: 'Download template',
      uploadFilled: 'Upload filled template',
      visibilityPublic: 'Public - anyone can use',
      visibilityPrivate: 'Private - only you',
      shareLink: 'Copy share link',
      linkCopied: 'Link copied',
      similarTitleFound: 'A public game with this title already exists',
      useExisting: 'Use existing instead',
      createAnyway: 'Create mine anyway',
      leaderboard: 'Leaderboard',
      playNow: 'Play now',
      guestNoticeSave: "Guest progress isn't saved. Sign in to keep your XP.",
      theme_kidMode: 'Kid mode',
      theme_classicMode: 'Classic mode',
      theme_switchToKid: 'Switch to the bright, playful kid mode look',
      theme_switchToClassic: 'Switch back to the classic look',
    },
  },
  ar: {
    translation: {
      appName: 'لينجوبايت بلاي',
      tagline: 'تعلّم الإنجليزية باللعب',
      nav_dashboard: 'لوحة التحكم',
      nav_library: 'مكتبة الألعاب',
      nav_myGames: 'ألعابي',
      nav_classes: 'صفوفي',
      nav_admin: 'الإدارة',
      nav_signIn: 'تسجيل الدخول بجوجل',
      nav_signOut: 'تسجيل الخروج',
      nav_playAsGuest: 'العب كضيف',
      role_student: 'طالب',
      role_teacher: 'معلم',
      role_admin: 'مسؤول',
      requestTeacherAccess: 'طلب صلاحية معلم',
      teacherPending: 'طلب المعلم قيد المراجعة',
      createGame: 'إنشاء لعبة',
      downloadTemplate: 'تحميل القالب',
      uploadFilled: 'رفع القالب المعبأ',
      visibilityPublic: 'عام - يمكن لأي شخص استخدامه',
      visibilityPrivate: 'خاص - لك فقط',
      shareLink: 'نسخ رابط المشاركة',
      linkCopied: 'تم نسخ الرابط',
      similarTitleFound: 'توجد لعبة عامة بنفس هذا العنوان',
      useExisting: 'استخدام الموجودة',
      createAnyway: 'إنشاء لعبتي على أي حال',
      leaderboard: 'لوحة المتصدرين',
      playNow: 'العب الآن',
      guestNoticeSave: 'تقدم الضيف لا يُحفظ. سجّل الدخول للاحتفاظ بنقاطك.',
      theme_kidMode: 'وضع الأطفال',
      theme_classicMode: 'الوضع الكلاسيكي',
      theme_switchToKid: 'التبديل إلى المظهر المرح والملون لوضع الأطفال',
      theme_switchToClassic: 'العودة إلى المظهر الكلاسيكي',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
