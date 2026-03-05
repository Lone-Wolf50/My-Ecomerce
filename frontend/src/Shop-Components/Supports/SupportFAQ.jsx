import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    category: 'Orders & Delivery',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery takes 3–5 business days within Accra. Regional deliveries may take 5–7 business days. All orders receive a tracking confirmation once dispatched.',
      },
      {
        q: 'Can I change or cancel my order?',
        a: 'Orders can be cancelled from your Orders page before they are shipped. Once shipped, cancellation will trigger a return on delivery. We cannot modify an order once it is placed — please place a new order if needed.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major payment methods via Paystack, including mobile money (MTN MoMo, Vodafone Cash, AirtelTigo), Visa, and Mastercard. All transactions are encrypted and secure.',
      },
      {
        q: 'Is door-to-door delivery available?',
        a: 'Yes. You can choose door delivery at checkout by providing your full address. Our delivery team will contact you to confirm a convenient time window.',
      },
    ],
  },
  {
    category: 'Returns & Refunds',
    items: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 5-day free return window from the date of delivery. To initiate a return, visit your Orders page and click "Return Item." Items must be unused and in original packaging.',
      },
      {
        q: 'How long do refunds take?',
        a: 'Once we receive and inspect the returned item, refunds are processed within 3–5 business days to your original payment method. You will receive a confirmation email.',
      },
      {
        q: 'What if my item arrived damaged?',
        a: 'We\'re so sorry to hear that. Please contact our support team immediately with photos of the damage, and we will arrange a replacement or full refund at no additional cost.',
      },
    ],
  },
  {
    category: 'Products & Authenticity',
    items: [
      {
        q: 'Are all products authentic?',
        a: 'Every Janina piece is 100% authentic and comes with a certificate of authenticity. We source exclusively from verified luxury artisans. If you have any doubt about your purchase, please reach out to us.',
      },
      {
        q: 'How do I care for my bag?',
        a: 'Each product page includes specific care instructions. Generally, avoid exposure to direct sunlight, moisture, and sharp objects. Store in the provided dust bag when not in use, and condition leather pieces every 3–6 months.',
      },
    ],
  },
  {
    category: 'Account & Security',
    items: [
      {
        q: 'Is my personal information safe?',
        a: 'Absolutely. We use industry-standard encryption for all personal data. Payment information is processed by Paystack and never stored on our servers. Your privacy is paramount.',
      },
      {
        q: 'Can I update my account information?',
        a: 'Yes. You can update your name and preferences by contacting our support team. Email changes require identity verification for your security.',
      },
    ],
  },
];

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border border-black/[0.06] rounded-2xl overflow-hidden transition-all duration-300 ${open ? 'bg-white shadow-md shadow-black/[0.04]' : 'bg-white/60 hover:bg-white'}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
      >
        <span className="text-[13px] font-black text-black/80 leading-snug">{q}</span>
        <span className={`shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 ${open ? 'bg-[#D4AF37] rotate-180' : 'bg-black/[0.05]'}`}>
          <ChevronDown size={14} className={open ? 'text-white' : 'text-black/40'} />
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5">
          <div className="h-px bg-black/[0.05] mb-4" />
          <p className="text-[13px] text-black/55 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
};

const SupportFAQ = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', ...FAQS.map(f => f.category)];

  const filtered = activeCategory === 'All'
    ? FAQS
    : FAQS.filter(f => f.category === activeCategory);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              activeCategory === cat
                ? 'bg-black text-white shadow-md'
                : 'bg-black/[0.05] text-black/40 hover:text-black'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ groups */}
      <div className="space-y-8">
        {filtered.map(group => (
          <div key={group.category}>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37] mb-3 pl-1">
              {group.category}
            </p>
            <div className="space-y-2">
              {group.items.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupportFAQ;