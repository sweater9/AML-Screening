import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  ShieldAlert, 
  Globe, 
  Briefcase, 
  Calendar, 
  Hash, 
  Users, 
  Sliders, 
  AlertCircle,
  Clock,
  Check
} from 'lucide-react';
import { ScreeningRequest, SubjectType } from '../types';
import { SCREENING_PRESETS } from '../data/presets';

interface ScreeningFormProps {
  onScreen: (request: ScreeningRequest) => Promise<void>;
  isLoading: boolean;
}

export const ScreeningForm: React.FC<ScreeningFormProps> = ({ onScreen, isLoading }) => {
  const [subjectType, setSubjectType] = useState<SubjectType>('individual');
  const [name, setName] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [aliases, setAliases] = useState<string[]>([]);
  const [jurisdiction, setJurisdiction] = useState('');
  const [dobOrYear, setDobOrYear] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [industry, setIndustry] = useState('');
  const [associateInput, setAssociateInput] = useState('');
  const [associates, setAssociates] = useState<string[]>([]);
  const [searchKeywordsOverride, setSearchKeywordsOverride] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Screening Scope
  const [scope, setScope] = useState({
    adverseMedia: true,
    sanctionsAndWatchlists: true,
    fraudAndFinancialCrime: true,
    pepCheck: true,
    mlTfTypologies: true,
    regulatoryEnforcement: true,
  });

  // Multi-phase loader progress tracker
  const [screeningPhase, setScreeningPhase] = useState<number>(0);

  const loadPreset = (presetId: string) => {
    const preset = SCREENING_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const req = preset.request;
    setSubjectType(req.subjectType);
    setName(req.name);
    setAliases(req.aliases || []);
    setJurisdiction(req.jurisdiction);
    setDobOrYear(req.dobOrIncorporationYear || '');
    setIdNumber(req.idOrRegistrationNumber || '');
    setIndustry(req.industryOrProfession || '');
    setAssociates(req.associatesOrKeyExecutives || []);
    setScope(req.screeningScope);
    setSearchKeywordsOverride(req.searchKeywordsOverride || '');
  };

  const addAlias = () => {
    if (aliasInput.trim() && !aliases.includes(aliasInput.trim())) {
      setAliases([...aliases, aliasInput.trim()]);
      setAliasInput('');
    }
  };

  const removeAlias = (idx: number) => {
    setAliases(aliases.filter((_, i) => i !== idx));
  };

  const addAssociate = () => {
    if (associateInput.trim() && !associates.includes(associateInput.trim())) {
      setAssociates([...associates, associateInput.trim()]);
      setAssociateInput('');
    }
  };

  const removeAssociate = (idx: number) => {
    setAssociates(associates.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Simulate multi-phase progress for compliance UX
    const phases = [
      'Querying international sanctions lists (OFAC, UN, EU, UK OFSI)...',
      'Scanning news archives & adverse media repositories...',
      'Executing AI sentiment polarity & severity classification...',
      'Correlating ML/TF indicators & red flag typologies...',
      'Synthesizing background verification audit dossier...',
    ];

    let currentPhase = 0;
    setScreeningPhase(0);
    const interval = setInterval(() => {
      currentPhase = (currentPhase + 1) % phases.length;
      setScreeningPhase(currentPhase);
    }, 1800);

    try {
      await onScreen({
        subjectType,
        name: name.trim(),
        aliases,
        jurisdiction: jurisdiction.trim() || 'Global / Unspecified',
        dobOrIncorporationYear: dobOrYear.trim(),
        idOrRegistrationNumber: idNumber.trim(),
        industryOrProfession: industry.trim(),
        associatesOrKeyExecutives: associates,
        screeningScope: scope,
        searchKeywordsOverride: searchKeywordsOverride.trim() || undefined,
      });
    } finally {
      clearInterval(interval);
    }
  };

  const progressSteps = [
    'Sanctions & Watchlists',
    'Adverse Media Scanning',
    'Sentiment Scoring',
    'ML/TF Typologies',
    'Dossier Generation',
  ];

  return (
    <div className="space-y-6">
      {/* Hero Intro Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>Automated Due Diligence & Screening</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Screen Target Against Adverse Media, Sanctions & ML/TF Risks
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Conduct instant AI-powered background checks with real-time web sentiment analysis, sanctions cross-referencing, PEP verification, and comprehensive regulatory reports.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-300">Live Search Grounding</span>
            </div>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">OFAC, UN, EU, UK, FATF & Media</span>
          </div>
        </div>

        {/* Quick-Load Realistic Presets */}
        <div className="mt-6 pt-5 border-t border-slate-800/70">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select Pre-configured Case Study:</span>
            </span>
            <span className="text-[11px] text-slate-500">1-click simulation test</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {SCREENING_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => loadPreset(preset.id)}
                className="text-left p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 transition-all group relative"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${preset.badgeColor}`}>
                    {preset.badge}
                  </span>
                  <span className="text-[10px] text-slate-500">{preset.category}</span>
                </div>
                <div className="font-medium text-xs text-slate-200 group-hover:text-indigo-300 transition truncate">
                  {preset.label.split('(')[0]}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Screening Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
        {/* Subject Type Switcher */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-800">
          <div>
            <label className="text-sm font-semibold text-slate-200">Investigation Target Type</label>
            <p className="text-xs text-slate-400">Choose whether you are screening a natural person or corporate entity</p>
          </div>
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setSubjectType('individual')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                subjectType === 'individual'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Natural Person (Individual)</span>
            </button>
            <button
              type="button"
              onClick={() => setSubjectType('entity')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                subjectType === 'entity'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Corporate Entity / Trust / Vessel</span>
            </button>
          </div>
        </div>

        {/* Primary Identifier Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Target Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>{subjectType === 'individual' ? 'Full Legal Name' : 'Registered Entity / Trade Name'} *</span>
              <span className="text-[11px] text-indigo-400">Primary search key</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={subjectType === 'individual' ? 'e.g., Viktor Bout, Isabel dos Santos' : 'e.g., Centra Tech Inc, Apex Trading FZE'}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Domicile / Jurisdiction */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Jurisdiction / Domicile / Country *</span>
              <span className="text-[11px] text-slate-400">Incorporation or Residence</span>
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="e.g., United States, Russia, Sweden, UAE, Cyprus"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Date of Birth or Year of Incorporation */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>{subjectType === 'individual' ? 'Date of Birth (DOB)' : 'Year / Date of Incorporation'}</span>
              <span className="text-[11px] text-slate-500">Helps eliminate false positives</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={dobOrYear}
                onChange={(e) => setDobOrYear(e.target.value)}
                placeholder={subjectType === 'individual' ? 'YYYY-MM-DD or Year (e.g., 1967-01-13)' : 'e.g., 2017, 2020'}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* ID / Registration Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>{subjectType === 'individual' ? 'National ID / Passport / Tax PIN' : 'Company Registration / LEI / Tax ID'}</span>
              <span className="text-[11px] text-slate-500">Optional</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder={subjectType === 'individual' ? 'e.g., OFAC-SDN-6874, US-PASSPORT-XXX' : 'e.g., SEC File 3-18967, FZCO-883912'}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Aliases (AKA) & Known Spellings */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span>Known Aliases, Trading Names & Alternative Transliterations</span>
            <span className="text-[11px] text-slate-400">Press Enter or Add</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAlias();
                }
              }}
              placeholder="e.g. Victor Bout, Boris, CTR Token, Vadim Aminov"
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
            <button
              type="button"
              onClick={addAlias}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              Add Alias
            </button>
          </div>
          {aliases.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {aliases.map((alias, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700"
                >
                  <span>{alias}</span>
                  <button
                    type="button"
                    onClick={() => removeAlias(idx)}
                    className="text-slate-400 hover:text-red-400 transition"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Industry / Profession & Associated Persons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              {subjectType === 'individual' ? 'Primary Profession / Industry' : 'Business Sector / Line of Activity'}
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Aviation, Energy, FinTech, Commodity Trading"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              {subjectType === 'individual' ? 'Key Associates / Family / Business Partners' : 'Key Executives / UBOs / Directors'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Users className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={associateInput}
                  onChange={(e) => setAssociateInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAssociate();
                    }
                  }}
                  placeholder="e.g. Richard Chichakli, Sohrab Sharma"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
              <button
                type="button"
                onClick={addAssociate}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                Add
              </button>
            </div>
            {associates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {associates.map((assoc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-indigo-950/60 text-indigo-300 border border-indigo-800/40"
                  >
                    <span>{assoc}</span>
                    <button
                      type="button"
                      onClick={() => removeAssociate(idx)}
                      className="text-indigo-400 hover:text-red-400 transition"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Screening Scope Checkboxes */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Investigation Scope & Verification Matrix</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">All standard registers active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 transition">
              <input
                type="checkbox"
                checked={scope.adverseMedia}
                onChange={(e) => setScope({ ...scope, adverseMedia: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-xs text-slate-300 font-medium">Adverse Media & Negative News</span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 transition">
              <input
                type="checkbox"
                checked={scope.sanctionsAndWatchlists}
                onChange={(e) => setScope({ ...scope, sanctionsAndWatchlists: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-xs text-slate-300 font-medium">Sanctions (OFAC, UN, EU, UK OFSI)</span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 transition">
              <input
                type="checkbox"
                checked={scope.fraudAndFinancialCrime}
                onChange={(e) => setScope({ ...scope, fraudAndFinancialCrime: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-xs text-slate-300 font-medium">Financial Crime & Wire Fraud</span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 transition">
              <input
                type="checkbox"
                checked={scope.pepCheck}
                onChange={(e) => setScope({ ...scope, pepCheck: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-xs text-slate-300 font-medium">PEP (Politically Exposed Person)</span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 transition">
              <input
                type="checkbox"
                checked={scope.mlTfTypologies}
                onChange={(e) => setScope({ ...scope, mlTfTypologies: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-xs text-slate-300 font-medium">ML/TF Typologies & Layering</span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 transition">
              <input
                type="checkbox"
                checked={scope.regulatoryEnforcement}
                onChange={(e) => setScope({ ...scope, regulatoryEnforcement: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-xs text-slate-300 font-medium">Regulatory Enforcement Actions</span>
            </label>
          </div>
        </div>

        {/* Toggle Advanced Query Override */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1.5 transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide Custom Search Keywords' : 'Advanced Search & Focus Keywords'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <label className="text-xs text-slate-400 block mb-1">
                Custom Grounding Terms (Forces AI to prioritize specific typologies, court dockets or jurisdictions):
              </label>
              <input
                type="text"
                value={searchKeywordsOverride}
                onChange={(e) => setSearchKeywordsOverride(e.target.value)}
                placeholder="e.g., court docket SEC indictment shell company Luanda Leaks trade invoice"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Submit Execution Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2 ${
              isLoading || !name.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-600 hover:from-indigo-500 hover:to-sky-500 shadow-indigo-500/25 border border-indigo-400/30 active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Screening in Progress...</span>
              </div>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Execute Forensic AML & Adverse Media Screening</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Real-time Multi-Phase Scanning Indicator */}
      {isLoading && (
        <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Clock className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Running Comprehensive Forensic AI Verification</h3>
                <p className="text-xs text-indigo-300">
                  Target: <span className="font-semibold text-white">{name}</span> ({jurisdiction || 'Global'})
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">Step {screeningPhase + 1} of 5</span>
          </div>

          {/* Stepper bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
            {progressSteps.map((step, idx) => {
              const isDone = idx < screeningPhase;
              const isCurrent = idx === screeningPhase;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    isDone
                      ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                      : isCurrent
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 font-medium">
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isCurrent ? (
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-700" />
                    )}
                    <span className="truncate">{step}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isDone ? 'Completed' : isCurrent ? 'Active analysis' : 'Queued'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
