import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SalaryEntry, SalarySubmission, ROLE_LEVELS, COMPANY_SIZES, LOCATIONS } from '../types';

interface Props {
  onSubmit: (submission: SalarySubmission) => void;
  companyName: string;
  isLoading?: boolean;
}

export const SalaryForm: React.FC<Props> = ({ onSubmit, companyName, isLoading }) => {
  const [entries, setEntries] = useState<SalaryEntry[]>([
    { salary: 0, experienceYears: 0, roleLevel: 2, locationCode: 1 }
  ]);
  const [companySize, setCompanySize] = useState<number>(2);

  const addEntry = () => {
    if (entries.length < 5) {
      setEntries([...entries, { salary: 0, experienceYears: 0, roleLevel: 2, locationCode: 1 }]);
    }
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof SalaryEntry, value: number) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validEntries = entries.filter(entry => entry.salary > 0);
    onSubmit({
      entries: validEntries,
      entryCount: validEntries.length,
      companySize,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {companyName} Salary Data
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Size
          </label>
          <select
            value={companySize}
            onChange={(e) => setCompanySize(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {Object.entries(COMPANY_SIZES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Salary ($)
                </label>
                <input
                  type="number"
                  value={entry.salary || ''}
                  onChange={(e) => updateEntry(index, 'salary', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="75000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Experience (years)
                </label>
                <input
                  type="number"
                  value={entry.experienceYears || ''}
                  onChange={(e) => updateEntry(index, 'experienceYears', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="3"
                  min="0"
                  max="50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Role Level
                </label>
                <select
                  value={entry.roleLevel}
                  onChange={(e) => updateEntry(index, 'roleLevel', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(ROLE_LEVELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  value={entry.locationCode}
                  onChange={(e) => updateEntry(index, 'locationCode', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(LOCATIONS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(index)}
                    className="p-2 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {entries.length < 5 && (
          <button
            type="button"
            onClick={addEntry}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-primary-600 border border-primary-300 rounded-md hover:bg-primary-50 transition-colors"
          >
            <Plus size={16} />
            Add Entry
          </button>
        )}

        <div className="mt-6 pt-4 border-t">
          <button
            type="submit"
            disabled={isLoading || entries.every(e => e.salary === 0)}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Processing...' : `Submit ${companyName} Data`}
          </button>
        </div>
      </div>
    </form>
  );
};