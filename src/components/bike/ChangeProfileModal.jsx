import React, { useState, useEffect } from 'react';
import { mockDB } from '@/api/mockDataService';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X, Pencil, Check, Trash2, Plus } from 'lucide-react';
import { playTypewriterClick } from './sounds';

export default function ChangeProfileModal({ currentProfile, onSelect, onClose, onDelete }) {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    mockDB.entities.Profile.list('-created_date', 50).then(setProfiles);
  }, []);

  const handleSelect = (profile) => {
    onSelect(profile);
    onClose();
  };

  const handleEdit = (profile) => {
    onClose();
    navigate(createPageUrl('Profile') + `?id=${profile.id}`);
  };

  const handleDeleteConfirm = async () => {
    const deletedId = confirmDeleteId;
    await mockDB.entities.Profile.delete(deletedId);
    setConfirmDeleteId(null);
    const updated = await mockDB.entities.Profile.list('-created_date', 50);
    setProfiles(updated);
    if (currentProfile?.id === deletedId) {
      onDelete?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="absolute z-10 bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-4 w-80">
          <p className="text-white text-center font-semibold">Are you sure you want to delete this profile?</p>
          <div className="flex gap-3 w-full">
            <button onClick={() => { playTypewriterClick(); setConfirmDeleteId(null); }} className="flex-1 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold">Cancel</button>
            <button onClick={() => { playTypewriterClick(); handleDeleteConfirm(); }} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold">Delete</button>
          </div>
        </div>
      )}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-2/3 max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <span className="text-white font-bold text-lg">Select Profile</span>
          <div className="flex items-center gap-2">
            <button onClick={() => { playTypewriterClick(); onClose(); navigate(createPageUrl('Profile')); }} className="w-8 h-8 rounded-lg bg-[#FF3F03] hover:bg-[#cc3300] flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => { playTypewriterClick(); onClose(); }} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {profiles.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-6">No profiles created yet.</p>
          )}
          {profiles.map((profile) => {
            const isActive = currentProfile?.id === profile.id || currentProfile === profile.name;
            return (
              <div
                key={profile.id}
                className={`flex items-center justify-between rounded-lg p-3 border ${isActive ? 'border-[#FF3F03] bg-[#FF3F03]/10' : 'border-zinc-800 bg-zinc-800/50 hover:bg-zinc-800'
                  }`}
              >
                <button className="flex-1 text-left" onClick={() => { playTypewriterClick(); handleSelect(profile); }}>
                  <div className="flex items-center gap-2">
                    {isActive && <Check className="w-4 h-4 text-[#FF3F03]" />}
                    <span className="text-white font-bold text-xl">{profile.name}</span>
                  </div>
                </button>
                <button
                  onClick={() => { playTypewriterClick(); handleEdit(profile); }}
                  className="ml-3 w-9 h-9 rounded-lg bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center flex-shrink-0"
                >
                  <Pencil className="w-4 h-4 text-[#FF3F03]" />
                </button>
                <button
                  onClick={() => { playTypewriterClick(); setConfirmDeleteId(profile.id); }}
                  className="ml-2 w-9 h-9 rounded-lg bg-zinc-700 hover:bg-red-800 flex items-center justify-center flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}