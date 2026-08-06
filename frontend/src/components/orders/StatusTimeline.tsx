import React from 'react';
import { OrderStatus } from '../../types/order';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface StatusTimelineProps {
  status: OrderStatus;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ status }) => {
  const steps = [
    { key: 'WAITING_PROCESS', label: '1. Dibuat Sales', desc: 'Menunggu konfirmasi admin' },
    { key: 'WAITING_PACKING', label: '2. Diproses Admin', desc: 'Disetujui admin, siap packing' },
    { key: 'PACKING_COMPLETED', label: '3. Packing Selesai', desc: 'Foto packing telah diunggah' },
    { key: 'COMPLETED', label: '4. Selesai & Dikirim', desc: 'No. resi & ongkir terkonfirmasi' },
  ];

  const getStepState = (stepKey: string) => {
    if (status === 'CANCELLED') return 'cancelled';

    const orderMap: Record<string, number> = {
      WAITING_PROCESS: 1,
      WAITING_PACKING: 2,
      PACKING_COMPLETED: 3,
      COMPLETED: 4,
    };

    const currentLevel = orderMap[status] || 1;
    const stepLevel = orderMap[stepKey] || 1;

    if (stepLevel < currentLevel) return 'completed';
    if (stepLevel === currentLevel) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 my-2">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Status Timeline Order</h4>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
        {steps.map((step, idx) => {
          const state = getStepState(step.key);
          return (
            <div key={step.key} className="flex items-start gap-2.5">
              <div className="flex flex-col items-center">
                {state === 'completed' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                )}
                {state === 'current' && (
                  <Clock className="w-5 h-5 text-emerald-700 animate-pulse flex-shrink-0" />
                )}
                {state === 'upcoming' && (
                  <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                )}
                {state === 'cancelled' && (
                  <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
              </div>
              <div>
                <p className={`text-xs font-semibold ${state === 'current' ? 'text-emerald-900 font-bold' : state === 'completed' ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-500">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
