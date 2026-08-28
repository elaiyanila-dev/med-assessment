import React from "react";

export interface AppointmentItem {
  id: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  type: string;
  scheduledAt: string;
  status: string;
}

interface UpcomingAppointmentsProps {
  appointments: AppointmentItem[];
}

export const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  appointments
}) => {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoString || "10:30 AM";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-7 space-y-6">
      {/* Top Left Title inside Card */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-[#0f172a] tracking-tight">
          Upcoming Appointments
        </h2>
      </div>

      {appointments.length === 0 ? (
        <div className="py-10 text-center text-slate-400 font-medium text-sm">
          No appointments scheduled for today.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {appointments.map((apt, index) => {
            const avatarLabel = `P${index + 1}`;
            const appointmentType = apt.type || "General Checkup";
            const timeFormatted = formatTime(apt.scheduledAt);

            return (
              <div
                key={apt.id || index}
                className="py-4 md:py-5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
              >
                {/* Left: Avatar + Details */}
                <div className="flex items-center space-x-4 min-w-0">
                  {/* Circular Avatar */}
                  <div className="w-12 h-12 rounded-full bg-purple-100 border border-purple-200 text-purple-700 font-extrabold text-sm flex items-center justify-center shadow-2xs shrink-0">
                    {avatarLabel}
                  </div>

                  {/* Text Information */}
                  <div className="min-w-0">
                    <p className="text-base md:text-lg font-bold text-[#0f172a] leading-snug truncate">
                      {apt.patientName}
                    </p>
                    <p className="text-sm font-medium text-slate-500 mt-0.5 truncate">
                      {appointmentType} • {timeFormatted}
                    </p>
                  </div>
                </div>

                {/* Right: View Button */}
                <div className="shrink-0">
                  <button
                    type="button"
                    className="px-5 py-2 bg-slate-100/90 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold text-sm rounded-xl border border-slate-200/80 transition-colors shadow-2xs cursor-pointer"
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
