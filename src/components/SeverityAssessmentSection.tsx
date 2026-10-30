import React from 'react';
import { Language } from '../types';
import {
  FarmerLossAssessment,
  FarmerState,
  SchemeSeverityLevel,
} from '../types/schemes_kb';
import {
  Activity,
  AlertTriangle,
  Info,
  MapPin,
  TrendingDown,
} from 'lucide-react';

interface SeverityAssessmentSectionProps {
  assessment: FarmerLossAssessment;
  onChange: (updated: FarmerLossAssessment) => void;
  language: Language;
}

export const SeverityAssessmentSection: React.FC<SeverityAssessmentSectionProps> = ({
  assessment,
  onChange,
  language,
}) => {
  // Severity meaning lookup from the curated dataset
  const getSeverityMeaning = (level: SchemeSeverityLevel) => {
    switch (level) {
      case 'low':
        return language === 'ml'
          ? 'രോഗലക്ഷണങ്ങൾ കണ്ടെത്തിയെങ്കിലും വിള നിയന്ത്രണ വിധേയമാണ്; വലിയ വിളനാശത്തിന്റെ തെളിവുകളില്ല.'
          : 'Disease detected but crop remains manageable; no evidence of major crop loss.';
      case 'moderate':
        return language === 'ml'
          ? 'രോഗബാധ ശ്രദ്ധേയമാണ്, വിളവിനെ ബാധിച്ചേക്കാം, എങ്കിലും പൂർണ്ണ നഷ്ടമായി കണക്കാക്കിയിട്ടില്ല.'
          : 'Disease is significant and may affect yield, but crop is not established as a qualifying total-loss event.';
      case 'severe':
        return language === 'ml'
          ? 'വ്യാപകമായ നാശനഷ്ടം അല്ലെങ്കിൽ 50% ൽ കൂടുതൽ വിളനാശം റിപ്പോർട്ട് ചെയ്യപ്പെട്ടു.'
          : 'Extensive damage or substantial loss (>50% crop loss reported/assessed).';
      case 'critical':
        return language === 'ml'
          ? 'വിള പൂർണ്ണമായി നശിച്ചു, ചെടികൾ പിഴുതുമാറ്റുകയോ പുനർകൃഷി നടത്തുകയോ ചെയ്യേണ്ടിവരും.'
          : 'Crop is extensively damaged and may need removal or complete replanting.';
    }
  };

  const currentSeverity =
    assessment.confirmedSeverity ||
    (assessment.impact === 'crop_lost' || assessment.affectedAreaRange === '>70%'
      ? 'critical'
      : assessment.impact === 'major_loss' || assessment.affectedAreaRange === '>50%'
      ? 'severe'
      : assessment.impact === 'yield_affected' || assessment.affectedAreaRange === '25-50%'
      ? 'moderate'
      : 'low');

  const getSeverityBadgeClass = (level: SchemeSeverityLevel) => {
    switch (level) {
      case 'low':
        return 'bg-[#e2f2e5] text-[#1b5e20] border-[#cbe8d2]';
      case 'moderate':
        return 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]';
      case 'severe':
        return 'bg-[#ffedd5] text-[#c2410c] border-[#fed7aa]';
      case 'critical':
        return 'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]';
    }
  };

  return (
    <div className="mt-3.5 bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-xs space-y-4">
      {/* Title */}
      <div className="flex items-start justify-between pb-3 border-b border-[#f1f0e9]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#fef3c7] text-[#b45309] flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-editorial text-lg font-bold text-[#162a45] leading-tight">
              {language === 'ml' ? 'വിളനാശ തീവ്രത നിർണ്ണയം' : 'Severity & Loss Assessment'}
            </h3>
            <span className="text-[11px] font-medium text-[#64748b]">
              {language === 'ml'
                ? 'സർക്കാർ പദ്ധതി നിർണ്ണയത്തിനായി സാഹചര്യം സ്ഥിരീകരിക്കുക'
                : 'Confirm field condition for scheme matching'}
            </span>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getSeverityBadgeClass(
            currentSeverity
          )}`}
        >
          {currentSeverity}
        </span>
      </div>

      {/* Critical Rule Banner */}
      <div className="p-3 bg-[#fbfaf4] rounded-2xl border border-[#edebe0] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#0b72c9] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#475569] leading-relaxed">
          <strong>{language === 'ml' ? 'ശ്രദ്ധിക്കുക:' : 'Important:'} </strong>
          {language === 'ml'
            ? 'ഫോട്ടോയിലെ രോഗനിർണ്ണയം ഇൻഷുറൻസ് നഷ്ടപരിഹാരത്തിനുള്ള അർഹത സ്വയം തെളിയിക്കുന്നില്ല. യഥാർത്ഥ വിളനാശ വിവരങ്ങൾ പരിശോധിച്ച് മാത്രമേ കൃത്യമായ പദ്ധതികൾ ശുപാർശ ചെയ്യപ്പെടൂ.'
            : 'Disease detection alone is not proof of insurance eligibility. Field-level loss assessment is required to identify applicable support.'}
        </p>
      </div>

      {/* Control 1: Farmer State / Jurisdiction */}
      <div>
        <label className="text-xs font-bold text-[#162a45] block mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#0b72c9]" />
          <span>{language === 'ml' ? 'സംസ്ഥാനം (State)' : 'Farmer State'}</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['Kerala', 'Tamil Nadu', 'Other'] as FarmerState[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onChange({ ...assessment, state: st })}
              className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                assessment.state === st
                  ? 'bg-[#162a45] text-white border-[#162a45] shadow-xs'
                  : 'bg-[#faf9f5] text-[#475569] border-[#e8e7de] hover:bg-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Control 2: Extent of Affected Crop / Area */}
      <div>
        <label className="text-xs font-bold text-[#162a45] block mb-1.5">
          {language === 'ml'
            ? 'ബാധിക്കപ്പെട്ട കൃഷിയിടത്തിന്റെ അളവ് (Affected Area)'
            : 'Estimated Affected Crop Area'}
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {(['<25%', '25-50%', '>50%', '>70%'] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() =>
                onChange({
                  ...assessment,
                  affectedAreaRange: range,
                  confirmedSeverity: undefined, // Recalculate
                })
              }
              className={`py-2 px-1 rounded-xl text-xs font-semibold border text-center transition-all ${
                assessment.affectedAreaRange === range
                  ? 'bg-[#0b72c9] text-white border-[#0b72c9] shadow-xs'
                  : 'bg-[#faf9f5] text-[#475569] border-[#e8e7de] hover:bg-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Control 3: Damage Spreading Status */}
      <div>
        <label className="text-xs font-bold text-[#162a45] block mb-1.5">
          {language === 'ml'
            ? 'രോഗം മറ്റു ചെടികളിലേക്ക് പടരുന്നുണ്ടോ?'
            : 'Is the damage actively spreading?'}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              onChange({
                ...assessment,
                isSpreading: false,
                confirmedSeverity: undefined,
              })
            }
            className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
              !assessment.isSpreading
                ? 'bg-[#162a45] text-white border-[#162a45]'
                : 'bg-[#faf9f5] text-[#475569] border-[#e8e7de]'
            }`}
          >
            {language === 'ml' ? 'നിയന്ത്രിതം (Contained)' : 'Contained / Isolated'}
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...assessment,
                isSpreading: true,
                confirmedSeverity: undefined,
              })
            }
            className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
              assessment.isSpreading
                ? 'bg-[#c2410c] text-white border-[#c2410c]'
                : 'bg-[#faf9f5] text-[#475569] border-[#e8e7de]'
            }`}
          >
            {language === 'ml' ? 'പടരുന്നു (Spreading)' : 'Actively Spreading'}
          </button>
        </div>
      </div>

      {/* Control 4: Survival & Yield Impact */}
      <div>
        <label className="text-xs font-bold text-[#162a45] block mb-1.5 flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
          <span>
            {language === 'ml'
              ? 'വിളവിന്റെയും അതിജീവനത്തിന്റെയും അവസ്ഥ'
              : 'Observed Yield & Survival Impact'}
          </span>
        </label>
        <div className="space-y-1.5">
          {[
            {
              id: 'manageable',
              title: language === 'ml' ? 'നിയന്ത്രണവിധേയം (Manageable)' : 'Manageable',
              desc:
                language === 'ml'
                  ? 'ചെറിയ നാശനഷ്ടം, വിളവ് നഷ്ടപ്പെടാൻ സാധ്യതയില്ല'
                  : 'Minor leaf spots; crop will recover without major yield loss',
            },
            {
              id: 'yield_affected',
              title: language === 'ml' ? 'വിളവിനെ ബാധിക്കും (Yield Affected)' : 'Significant Yield Impact',
              desc:
                language === 'ml'
                  ? 'വിളവ് കുറയും, പക്ഷെ ചെടി നശിച്ചുപോകില്ല'
                  : 'Yield will decrease noticeably, but crop will survive',
            },
            {
              id: 'major_loss',
              title: language === 'ml' ? 'വൻ വിളനാശം >50% (Major Loss)' : 'Major Crop Loss (>50%)',
              desc:
                language === 'ml'
                  ? 'പകുതിയിലധികം വിളവ് നഷ്ടപ്പെട്ടു, ഗുരുതരമായ അവസ്ഥ'
                  : 'Extensive damage, substantial loss exceeding 50%',
            },
            {
              id: 'crop_lost',
              title: language === 'ml' ? 'പൂർണ്ണനാശം (Critical / Replanting)' : 'Critical / Total Devastation',
              desc:
                language === 'ml'
                  ? 'ചെടികൾ പൂർണ്ണമായി നശിച്ചു; പുനർകൃഷി വേണ്ടിവരും'
                  : 'Crop dying or ruined; removal and replanting required',
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onChange({
                  ...assessment,
                  impact: item.id as any,
                  confirmedSeverity: undefined,
                })
              }
              className={`w-full p-2.5 rounded-2xl border text-left transition-all ${
                assessment.impact === item.id
                  ? 'bg-[#f0f7ff] border-[#0b72c9] text-[#162a45]'
                  : 'bg-[#faf9f5] border-[#e8e7de] text-[#475569] hover:bg-white'
              }`}
            >
              <div className="text-xs font-bold">{item.title}</div>
              <div className="text-[11px] text-[#64748b] mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Assessed Severity Confirmation Chips */}
      <div>
        <label className="text-xs font-bold text-[#162a45] block mb-1.5">
          {language === 'ml'
            ? 'തീവ്രതാ തലം സ്ഥിരീകരിക്കുക (Assessed Level):'
            : 'Classified Severity Level (Select to Override):'}
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {(['low', 'moderate', 'severe', 'critical'] as SchemeSeverityLevel[]).map(
            (lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() =>
                  onChange({
                    ...assessment,
                    confirmedSeverity: lvl,
                  })
                }
                className={`py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                  currentSeverity === lvl
                    ? `${getSeverityBadgeClass(lvl)} shadow-xs ring-2 ring-offset-1 ring-slate-400`
                    : 'bg-[#faf9f5] text-[#64748b] border-[#e8e7de] hover:bg-white'
                }`}
              >
                {lvl}
              </button>
            )
          )}
        </div>

        {/* Severity meaning box */}
        <p className="mt-2 text-[11px] text-[#475569] leading-relaxed bg-[#f8f7f2] p-2.5 rounded-xl border border-[#edebe0]">
          <strong>{currentSeverity.toUpperCase()}: </strong>
          {getSeverityMeaning(currentSeverity)}
        </p>
      </div>
    </div>
  );
};
