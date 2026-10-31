import React, { useState } from 'react';
import { FAQItem, Language } from '../../types';
import { i18n } from '../../services/i18nService';
import faqData from '../../data/faq.json';
import {
  Sparkles,
  Search,
  MessageSquare,
} from 'lucide-react';

interface FarmerAssistantProps {
  language: Language;
}

export const FarmerAssistant: React.FC<FarmerAssistantProps> = ({ language }) => {
  const [selectedFaq, setSelectedFaq] = useState<FAQItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = faqData as FAQItem[];

  const filteredFaqs = faqs.filter((item) => {
    if (!searchQuery) return true;
    const q = (language === 'ml' ? item.questionMl || item.question : item.question).toLowerCase();
    const a = (language === 'ml' ? item.answerMl || item.answer : item.answer).toLowerCase();
    return q.includes(searchQuery.toLowerCase()) || a.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="w-5 h-5 text-[#0b72c9]" />
        <h3 className="font-editorial text-lg font-bold text-[#162a45]">
          {i18n.t('section_assistant')}
        </h3>
      </div>
      <p className="text-xs text-[#64748b] mb-4 leading-relaxed">
        {i18n.t('assistant_desc')}
      </p>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={i18n.t('assistant_search_placeholder')}
          className="w-full bg-[#faf9f5] border border-[#e2e1d7] rounded-xl pl-9 pr-3 py-2 text-xs text-[#162a45] focus:outline-none focus:border-[#0b72c9]"
        />
      </div>

      {/* Active Selected FAQ or List */}
      {selectedFaq ? (
        <div className="mt-3 p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl animate-fadeIn">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-editorial text-base font-bold text-[#162a45]">
              {language === 'ml' && selectedFaq.questionMl
                ? selectedFaq.questionMl
                : selectedFaq.question}
            </h4>
          </div>
          <p className="text-xs text-[#334155] leading-relaxed">
            {language === 'ml' && selectedFaq.answerMl ? selectedFaq.answerMl : selectedFaq.answer}
          </p>
          <button
            onClick={() => {
              setSelectedFaq(null);
            }}
            className="mt-3 text-[11px] font-semibold text-[#0b72c9] hover:underline block"
          >
            {i18n.t('assistant_back_btn')}
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
          {filteredFaqs.map((faq) => (
            <button
              key={faq.id}
              onClick={() => setSelectedFaq(faq)}
              className="w-full text-left p-2.5 rounded-xl bg-[#faf9f5] border border-[#e8e7de] hover:bg-[#f3f2ea] text-xs font-semibold text-[#162a45] flex items-center justify-between gap-2 transition-colors"
            >
              <span className="truncate">
                {language === 'ml' && faq.questionMl ? faq.questionMl : faq.question}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-[#0b72c9] shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
