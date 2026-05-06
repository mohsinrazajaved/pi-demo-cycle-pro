import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { dataStore } from '@/services/localStore';
import { ArrowLeft, Save } from 'lucide-react';
import { playTypewriterClick } from '../components/ride/audioCues';
import AlphaPad from '../components/ride/AlphaPad';
import DigitPad from '../components/ride/DigitPad';

export default function RiderSetup() {
  const navigate = useNavigate();
  const editId = new URLSearchParams(window.location.search).get('id');

  const [form, setForm] = useState({
    name: '', age: '', weight: '', weightUnit: 'LBS',
    height: '', heightUnit: 'Imperial', gender: '', activityLevel: '',
  });
  const [activeField, setActiveField] = useState('name');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!editId) return;
    dataStore.entities.Profile.filter({ id: editId }).then((results) => {
      if (!results.length) return;
      const p = results[0];
      setForm({
        name: p.name || '', age: String(p.age || ''),
        weight: String(p.weight || ''), weightUnit: p.weight_unit || 'LBS',
        height: String(p.height || ''), heightUnit: p.height_unit || 'Imperial',
        gender: p.gender || '', activityLevel: p.activity_level || '',
      });
    });
  }, [editId]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.age || isNaN(Number(form.age))) e.age = 'Required';
    if (!form.weight || isNaN(Number(form.weight))) e.weight = 'Required';
    if (!form.height || isNaN(Number(form.height))) e.height = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const data = {
      name: form.name.trim(), age: Number(form.age),
      weight: Number(form.weight), weight_unit: form.weightUnit,
      height: Number(form.height), height_unit: form.heightUnit,
      gender: form.gender || undefined, activity_level: form.activityLevel || undefined,
    };
    if (editId) await dataStore.entities.Profile.update(editId, data);
    else await dataStore.entities.Profile.create(data);
    navigate(createPageUrl('Launcher'));
  };

  const fields = ['name', 'age', 'weight', 'height'];
  const isNumericField = activeField === 'age' || activeField === 'weight' || activeField === 'height';

  const goToPrev = () => setActiveField(prev => {
    const idx = fields.indexOf(prev); return idx > 0 ? fields[idx - 1] : prev;
  });
  const goToNext = () => setActiveField(prev => {
    const idx = fields.indexOf(prev); return idx < fields.length - 1 ? fields[idx + 1] : prev;
  });

  const inputCls = (field) =>
    `w-full h-10 rounded-md px-3 text-white text-base cursor-pointer focus:outline-none transition-colors ${
      errors[field] ? 'ring-2 ring-red-500' : activeField === field ? 'ring-2 ring-[#FF3F03]' : ''
    } bg-[#3f3f3f]`;

  const toggleCls = (active) =>
    `h-10 rounded-md font-bold text-sm transition-all flex items-center justify-center px-3 ${
      active ? 'bg-[#FF3F03] text-white' : 'bg-[#3f3f3f] text-zinc-300'
    }`;

  const lbl = 'text-xs uppercase tracking-wider text-zinc-400 mb-1 block font-semibold';

  return (
    <div className="h-screen w-screen text-white overflow-hidden relative" style={{ background: '#000' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
      {/* LEFT PANEL — form fields — 360px fixed */}
      <div className="flex flex-col gap-2.5 p-4 overflow-hidden relative z-10" style={{ width: '360px', flexShrink: 0, background: '#0a0a0a' }}>

        {/* Header */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); navigate(createPageUrl('Launcher')); }}
            className="h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
            style={{ background: '#3f3f3f' }}
          >
            <ArrowLeft className="text-[#FF3F03]" style={{ width: '18px', height: '18px' }} strokeWidth={2.5} />
          </button>
          <div className="flex-1 flex items-center">
            <h1 className="text-lg font-black text-[#FF3F03] uppercase tracking-wide">{editId ? 'Edit Profile' : 'New Profile'}</h1>
          </div>
          <button
            onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); handleSave(); }}
            className="h-10 px-4 rounded-md font-black text-sm bg-[#FF3F03] text-white flex items-center gap-1 flex-shrink-0"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>

        {/* Name */}
        <div className="flex-shrink-0">
          <label className={lbl}>Name <span className="text-[#FF3F03]">*</span></label>
          <input readOnly value={form.name}
            onMouseDown={(e) => { e.preventDefault(); setActiveField('name'); }}
            className={inputCls('name')} placeholder="Tap to enter name" />
        </div>

        {/* Age + Gender */}
        <div className="flex-shrink-0">
          <label className={lbl}>Age <span className="text-[#FF3F03]">*</span></label>
          <div className="flex gap-1.5">
            <input readOnly value={form.age}
              onMouseDown={(e) => { e.preventDefault(); setActiveField('age'); }}
              className={`${inputCls('age')} flex-1`} placeholder="Age" />
            <button onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); set('gender', 'Male'); }}
              className={toggleCls(form.gender === 'Male')}>M</button>
            <button onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); set('gender', 'Female'); }}
              className={toggleCls(form.gender === 'Female')}>F</button>
          </div>
        </div>

        {/* Weight */}
        <div className="flex-shrink-0">
          <label className={lbl}>Weight <span className="text-[#FF3F03]">*</span></label>
          <div className="flex gap-1.5">
            <input readOnly value={form.weight}
              onMouseDown={(e) => { e.preventDefault(); setActiveField('weight'); }}
              className={`${inputCls('weight')} flex-1`} placeholder="Weight" />
            <button onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); set('weightUnit', 'LBS'); }}
              className={toggleCls(form.weightUnit === 'LBS')}>LBS</button>
            <button onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); set('weightUnit', 'KG'); }}
              className={toggleCls(form.weightUnit === 'KG')}>KG</button>
          </div>
        </div>

        {/* Height */}
        <div className="flex-shrink-0">
          <label className={lbl}>Height <span className="text-[#FF3F03]">*</span></label>
          <div className="flex gap-1.5">
            <input readOnly value={form.height}
              onMouseDown={(e) => { e.preventDefault(); setActiveField('height'); }}
              className={`${inputCls('height')} flex-1`} placeholder="Height" />
            <button onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); set('heightUnit', 'Imperial'); }}
              className={toggleCls(form.heightUnit === 'Imperial')}>in</button>
            <button onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); set('heightUnit', 'Metric'); }}
              className={toggleCls(form.heightUnit === 'Metric')}>cm</button>
          </div>
        </div>

        {/* Activity Level */}
        <div className="flex-shrink-0">
          <label className={lbl}>Activity</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { value: 'Sedentary', label: 'Sedentary' },
              { value: 'Lightly Active', label: 'Light' },
              { value: 'Moderately Active', label: 'Moderate' },
              { value: 'Regularly Active', label: 'Regular' },
              { value: 'Athlete', label: 'Athlete' },
            ].map((opt) => (
              <button key={opt.value}
                onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); set('activityLevel', opt.value); }}
                className={`h-9 rounded-md font-bold text-xs transition-all ${form.activityLevel === opt.value ? 'bg-[#FF3F03] text-white' : 'bg-[#3f3f3f] text-zinc-300'}`}
              >{opt.label}</button>
            ))}
          </div>
        </div>

      </div>

      {/* DIVIDER */}
      <div className="w-px bg-zinc-700/40 flex-shrink-0" />

      {/* RIGHT PANEL — keyboard */}
      <div className="flex-1 flex items-center justify-center p-5 min-w-0 relative z-10">
        {activeField === 'name' ? (
          <AlphaPad value={form.name} onChange={(v) => set('name', v)}
            onClose={() => {}} onPrev={goToPrev} onNext={goToNext} />
        ) : (
          <DigitPad value={form[activeField]} onChange={(v) => set(activeField, v)}
            onClose={() => {}} onPrev={goToPrev} onNext={goToNext} />
        )}
      </div>

      </div>
    </div>
  );
}
