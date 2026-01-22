// components/DateBox.tsx
const DateBox = ({ date, label }: { date: Date; label: string }) => (
  <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-purple-100">
    <div className="flex flex-col items-center justify-center bg-white p-2 rounded-lg shadow-inner">
      <span className="text-sm font-bold text-purple-600">
        {new Date(date).toLocaleString("default", { day: "2-digit" })}
      </span>
      <span className="text-xs uppercase text-purple-400">
        {new Date(date).toLocaleString("default", { month: "short" })}
      </span>
    </div>
    <div>
      <p className="text-xs font-medium text-purple-500 mb-1">{label}</p>
      <p className="text-sm text-purple-800">
        {new Date(date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  </div>
);

export default DateBox;
