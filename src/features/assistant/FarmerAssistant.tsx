import React, { useState } from 'react';
import { FAQItem, Language } from '../../types';
import { translations } from '../../data/translations';
import faqData from '../../data/faq.json';
import { speechService } from '../../services/speechService';
import {
  HelpCircle,
  Volume2,
  Square,
  Sparkles,
  Search,
  MessageSquare,
} from 'lucide-react';

interface FarmerAssistantProps {
  language: Language;
}

export const FarmerAssistant: React.FC<FarmerAssistantProps> = ({ language }) => {
  const t = translations[language];
  const [selectedFaq, setSelectedFaq] = useState<FAQItem | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = faqData as FAQItem[];

  const filteredFaqs = faqs.filter((item) => {
    if (!searchQuery) return true;
    const q = (language === 'ml' ? item.questionMl : item.question).toLowerCase();
    const a = (language === 'ml' ? item.answerMl : item.answer).toLowerCase();
    return q.includes(searchQuery.toLowerCase()) || a.includes(searchQuery.toLowerCase());
  });

  const handleSpeak = (item: FAQItem) => {
    if (speakingId === item.id) {
      speechService.stop();
      setSpeakingId(null);
      return;
    }

    const textToSpeak =
      language === 'ml'
        ? item.speechTextMl || item.answerMl
        : item.speechText || item.answer;

    setSpeakingId(item.id);
    speechService.speak(textToSpeak, language, (speaking) => {
      if (!speaking) setSpeakingId(null);
    });
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="w-5 h-5 text-[#0b72c9]" />
        <h3 className="font-editorial text-lg font-bold text-[#162a45]">
          {t.section_assistant}
        </h3>
      </div>
      <p className="text-xs text-[#64748b] mb-4 leading-relaxed">
        {t.assistant_desc}
      </p>

      {/* Suggested Quick Question Pills */}
      <div className="mb-4">
        <span className="text-[11px] font-bold text-[#162a45] uppercase tracking-wider block mb-2">
          {language === 'ml' ? 'പ്രധാന സംശയങ്ങൾ' : 'Suggested questions:'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {faqs.slice(0, 4).map((faq) => (
            <button
              key={faq.id}
              onClick={() => setSelectedFaq(faq)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium text-left transition-all ${
                selectedFaq?.id === faq.id
                  ? 'bg-[#0b72c9] text-white shadow-2xs'
                  : 'bg-[#faf9f5] border border-[#e2e1d7] text-[#334155] hover:bg-[#f0efe8]'
              }`}
            >
              {language === 'ml' ? faq.questionMl : faq.question}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'ml' ? 'സംശയങ്ങൾ തിരയുക...' : 'Search farm advice...'}
          className="w-full bg-[#faf9f5] border border-[#e2e1d7] rounded-xl pl-9 pr-3 py-2 text-xs text-[#162a45] focus:outline-none focus:border-[#0b72c9]"
        />
      </div>

      {/* Active Selected FAQ or List */}
      {selectedFaq ? (
        <div className="mt-3 p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl animate-fadeIn">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-editorial text-base font-bold text-[#162a45]">
              {language === 'ml' ? selectedFaq.questionMl : selectedFaq.question}
            </h4>
            <button
              onClick={() => handleSpeak(selectedFaq)}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                speakingId === selectedFaq.id
                  ? 'bg-amber-100 border-amber-400 text-amber-900'
                  : 'bg-white border-[#cbd5e1] text-[#0b72c9]'
              }`}
            >
              {speakingId === selectedFaq.id ? (
                <>
                  <Square className="w-3 h-3 fill-amber-800" />
                  <span>{t.btn_stop_listen}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-[#0b72c9]" />
                  <span>{t.btn_listen}</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-[#334155] leading-relaxed">
            {language === 'ml' ? selectedFaq.answerMl : selectedFaq.answer}
          </p>
          <button
            onClick={() => {
              speechService.stop();
              setSpeakingId(null);
              setSelectedFaq(null);
            }}
            className="mt-3 text-[11px] font-semibold text-[#0b72c9] hover:underline block"
          >
            {language === 'ml' ? 'മറ്റ് ചോദ്യങ്ങൾ കാണുക' : '← Back to questions'}
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
                {language === 'ml' ? faq.questionMl : faq.question}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-[#0b72c9] shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
