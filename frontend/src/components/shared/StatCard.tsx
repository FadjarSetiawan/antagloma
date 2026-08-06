import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
}) => {
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-extrabold text-slate-900">{value}</h3>
      </div>
      <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 flex-shrink-0">
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
