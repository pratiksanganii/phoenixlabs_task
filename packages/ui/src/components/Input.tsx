type Props = {
  id: string;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ id, label, className, ...props }: Props) {
  return (
    <div className="space-y-2 bg-red-50 p-4 rounded-md">
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      <input
        id={id}
        className={[
          "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm",
          "placeholder:text-gray-400",
          "focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30",
          "transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className ?? "",
        ].join(" ")}
        {...props}
      />
    </div>
  );
}