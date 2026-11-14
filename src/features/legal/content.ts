// In-app legal texts. Draft for the closed beta: review with a lawyer before the store launch.
// The public contact lives in one place so it can change without touching the texts.
export const LEGAL_CONTACT = 'contact@example.com';
export const LEGAL_UPDATED = '2026-11-14';

export type LegalDoc = 'privacy' | 'terms';
type Section = { h: string; p: string[] };

const tr: Record<LegalDoc, { title: string; sections: Section[] }> = {
  privacy: {
    title: 'Gizlilik Politikası',
    sections: [
      {
        h: 'Kısaca',
        p: [
          'LOOPI anlarını kimlerin göreceğini sen seçersin. Verini satmayız, reklam için başkalarıyla paylaşmayız. Bu metin hangi bilgileri neden topladığımızı ve bunları nasıl kontrol edebileceğini anlatır.',
        ],
      },
      {
        h: 'Topladığımız bilgiler',
        p: [
          'Hesap: e-posta adresin ya da Apple/Google ile girişte paylaşılan temel bilgiler, adın, kullanıcı adın, doğum tarihin (yaş sınırı ve 16-17 yaş korumaları için).',
          'Paylaştıkların: anlar (fotoğraf, açıklama, seçtiğin kitle), yorumlar, tepkiler, mesajlar, profil fotoğrafı ve kapak.',
          'Konum: yalnızca bir ana konum eklemek istediğinde ve izin verirsen. Arka planda konum toplamayız.',
          'Cihaz ve kullanım: uygulamanın çalışması ve güvenliği için gerekli teknik bilgiler (uygulama sürümü, hata kayıtları, bildirim anahtarı).',
        ],
      },
      {
        h: 'Neden kullanıyoruz',
        p: [
          'Hizmeti sunmak: akış, keşfet, harita, widget ve mesajlaşma.',
          'Seni ve diğer kullanıcıları korumak: yaş korumaları, engelleme, şikayetlerin incelenmesi, kötüye kullanımın önlenmesi.',
          'Hizmeti geliştirmek: toplu ve kimliği belirlenemeyen istatistikler.',
        ],
      },
      {
        h: 'Kimler görebilir',
        p: [
          "Bir anı yalnızca seçtiğin kitle görür (arkadaşlar, takipçiler ya da herkes). Gizli profilin anları hiçbir zaman herkese açılmaz. 16-17 yaşındaki kullanıcıların anları Keşfet'te gösterilmez ve tanımadıkları yetişkinlerle mesajlaşamazlar.",
          'Engellediğin kişiler seni göremez, sana mesaj atamaz.',
        ],
      },
      {
        h: 'Saklama ve silme',
        p: [
          'Bilgilerini hesabın açık olduğu sürece saklarız. Ayarlar → Hesabı sil ile hesabını ve paylaştıklarını kalıcı olarak silebilirsin; yedeklerden en geç 30 gün içinde temizlenir. Yasal yükümlülük gereken kayıtlar (ör. şikayet incelemeleri) gerekli süre kadar tutulabilir.',
        ],
      },
      {
        h: 'Hakların',
        p: [
          'Bilgilerine erişme, düzeltme, silme, taşıma ve işlenmesine itiraz etme hakkın var. Talepler için aşağıdaki adrese yaz; 30 gün içinde yanıtlarız.',
        ],
      },
      { h: 'Çocuklar', p: ['LOOPI 16 yaş ve üzeri içindir. 16 yaşından küçük olduğunu öğrendiğimiz hesapları kapatırız.'] },
      { h: 'İletişim', p: [`Sorular ve talepler: ${LEGAL_CONTACT}`] },
    ],
  },
  terms: {
    title: 'Kullanım Koşulları',
    sections: [
      { h: 'Kabul', p: ["LOOPI'yi kullanarak bu koşulları kabul etmiş olursun. Koşullar değişirse uygulama içinde haber veririz."] },
      { h: 'Yaş', p: ['Hesap açmak için en az 16 yaşında olmalısın. Doğum tarihini doğru girmelisin.'] },
      { h: 'Hesabın', p: ['Hesabının güvenliğinden sen sorumlusun. Başkası adına hesap açamaz, kullanıcı adını taklit amaçlı kullanamazsın.'] },
      {
        h: 'Paylaşım kuralları',
        p: [
          'Şunları paylaşmak yasaktır: çıplaklık ve cinsel içerik, şiddet ve tehdit, taciz ve zorbalık, nefret söylemi, başkalarının özel bilgileri, yasa dışı ürün ve hizmetler, spam.',
          'Reşit olmayanları içeren her türlü uygunsuz içerik derhal kaldırılır ve yetkililere bildirilir.',
        ],
      },
      {
        h: 'İçeriğin',
        p: [
          'Paylaştıklarının sahibi sensin. Hizmeti sunabilmemiz için (göstermek, saklamak, seçtiğin kitleye iletmek) bize sınırlı, devredilemez bir kullanım izni verirsin. İçeriğini sildiğinde bu izin sona erer.',
        ],
      },
      {
        h: 'Şikayet ve yaptırımlar',
        p: ['Kurallara aykırı içerikleri kaldırabilir, hesapları geçici ya da kalıcı olarak kapatabiliriz. Kararlara itiraz için bize yazabilirsin.'],
      },
      { h: 'Sorumluluk', p: ['Hizmeti "olduğu gibi" sunarız. Kullanıcıların paylaştıklarından onların kendisi sorumludur.'] },
      { h: 'İletişim', p: [LEGAL_CONTACT] },
    ],
  },
};

const en: Record<LegalDoc, { title: string; sections: Section[] }> = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        h: 'In short',
        p: [
          'On LOOPI you choose who sees your moments. We do not sell your data or share it with others for advertising. This page explains what we collect, why, and how you stay in control.',
        ],
      },
      {
        h: 'What we collect',
        p: [
          'Account: your email or the basic details shared by Apple/Google sign-in, your name, username and date of birth (for the age limit and the 16-17 protections).',
          'What you share: moments (photo, caption, audience), comments, reactions, messages, profile photo and cover.',
          'Location: only when you choose to tag a moment and allow it. We never collect location in the background.',
          'Device and usage: technical details needed to run and secure the app (app version, crash logs, push token).',
        ],
      },
      {
        h: 'Why we use it',
        p: [
          'To provide the service: feed, discover, map, widget and messaging.',
          'To keep people safe: age protections, blocking, reviewing reports, preventing abuse.',
          'To improve the service: aggregated, non-identifying statistics.',
        ],
      },
      {
        h: 'Who can see what',
        p: [
          'A moment is only shown to the audience you pick (friends, followers or everyone). A private profile never posts publicly. Moments by 16-17 year olds are not shown in Discover, and they cannot message adults they do not know.',
          'People you block cannot see you or message you.',
        ],
      },
      {
        h: 'Keeping and deleting',
        p: [
          'We keep your data while your account is open. Settings → Delete account removes your account and what you shared for good; backups are cleared within 30 days. Records we must keep by law (e.g. report reviews) may be kept as long as required.',
        ],
      },
      {
        h: 'Your rights',
        p: ['You can access, correct, delete and export your data and object to its use. Write to us below; we reply within 30 days.'],
      },
      { h: 'Children', p: ['LOOPI is for people aged 16 and over. We close accounts we learn belong to anyone younger.'] },
      { h: 'Contact', p: [`Questions and requests: ${LEGAL_CONTACT}`] },
    ],
  },
  terms: {
    title: 'Terms of Use',
    sections: [
      { h: 'Agreement', p: ['By using LOOPI you agree to these terms. If they change, we will let you know in the app.'] },
      { h: 'Age', p: ['You must be at least 16 to create an account and give your real date of birth.'] },
      { h: 'Your account', p: ['You are responsible for keeping your account secure. Do not create accounts for others or impersonate anyone.'] },
      {
        h: 'Sharing rules',
        p: [
          "Not allowed: nudity and sexual content, violence and threats, harassment and bullying, hate speech, other people's private information, illegal goods or services, spam.",
          'Any inappropriate content involving minors is removed immediately and reported to the authorities.',
        ],
      },
      {
        h: 'Your content',
        p: [
          'You own what you share. You give us a limited, non-transferable licence to show, store and deliver it to the audience you choose. It ends when you delete the content.',
        ],
      },
      {
        h: 'Reports and enforcement',
        p: ['We may remove content that breaks the rules and suspend or close accounts. Write to us to appeal a decision.'],
      },
      { h: 'Liability', p: ['The service is provided "as is". People are responsible for what they share.'] },
      { h: 'Contact', p: [LEGAL_CONTACT] },
    ],
  },
};

export function legalText(lang: 'tr' | 'en', doc: LegalDoc) {
  return (lang === 'tr' ? tr : en)[doc];
}
