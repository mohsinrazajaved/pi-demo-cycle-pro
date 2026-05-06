import React, { useState, useEffect } from 'react';
import { dataStore } from '@/services/localStore';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X, Pencil, Check, Trash2, Plus } from 'lucide-react';
import { playTypewriterClick } from './audioCues';

export default function RiderPicker({ currentProfile, onSelect, onClose, onDelete }) {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    dataStore.entities.Profile.list('-created_date', 50).then(setProfiles);
  }, []);

  const handleSelect = (profile) => {
    onSelect(profile);
    onClose();
  };

  const handleEdit = (profile) => {
    onClose();
    navigate(createPageUrl('RiderSetup') + `?id=${profile.id}`);
  };

  const handleDeleteConfirm = async () => {
    const deletedId = confirmDeleteId;
    await dataStore.entities.Profile.delete(deletedId);
    setConfirmDeleteId(null);
    const updated = await dataStore.entities.Profile.list('-created_date', 50);
    setProfiles(updated);
    if (currentProfile?.id === deletedId) {
      onDelete?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="absolute z-10 rounded-md p-6 flex flex-col items-center gap-4 w-80" style={{ background: '#3f3f3f' }}>
          <p className="text-white text-center font-bold">Are you sure you want to delete this profile?</p>
          <div className="flex gap-3 w-full">
            <button onClick={() => { playTypewriterClick(); setConfirmDeleteId(null); }} className="flex-1 py-2 rounded-md text-white font-black" style={{ background: '#000' }}>Cancel</button>
            <button onClick={() => { playTypewriterClick(); handleDeleteConfirm(); }} className="flex-1 py-2 rounded-md bg-red-600 text-white font-black">Delete</button>
          </div>
        </div>
      )}
      <div className="rounded-md w-2/3 max-h-[70vh] flex flex-col" style={{ background: '#3f3f3f' }}>
        <div className="flex items-center justify-between p-4">
          <span className="text-white font-black text-lg uppercase tracking-wide">Select Profile</span>
          <div className="flex items-center gap-2">
            <button onClick={() => { playTypewriterClick(); onClose(); navigate(createPageUrl('RiderSetup')); }} className="w-9 h-9 rounded-md bg-[#FF3F03] flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" strokeWidth={3} />
            </button>
            <button onClick={() => { playTypewriterClick(); onClose(); }} className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: '#000' }}>
              <X className="w-4 h-4 text-zinc-300" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
          {profiles.length === 0 && (
            <p className="text-zinc-300 text-sm text-center py-6">No profiles created yet.</p>
          )}
          {profiles.map((profile) => {
            const isActive = currentProfile?.id === profile.id || currentProfile === profile.name;
            return (
              <div
                key={profile.id}
                className="flex items-center justify-between rounded-md p-3"
                style={{ background: isActive ? '#FF3F03' : '#000' }}
              >
                <button className="flex-1 text-left" onClick={() => { playTypewriterClick(); handleSelect(profile); }}>
                  <div className="flex items-center gap-2">
                    {isActive && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
                    <span className="text-white font-black text-xl">{profile.name}</span>
                  </div>
                </button>
                <button
                  onClick={() => { playTypewriterClick(); handleEdit(profile); }}
                  className="ml-3 w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: isActive ? '#000' : '#3f3f3f' }}
                >
                  <Pencil className="w-4 h-4 text-[#FF3F03]" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => { playTypewriterClick(); setConfirmDeleteId(profile.id); }}
                  className="ml-2 w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: isActive ? '#000' : '#3f3f3f' }}
                >
                  <Trash2 className="w-4 h-4 text-red-400" strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}