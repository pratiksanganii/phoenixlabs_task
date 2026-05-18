type Props = {
  id: string;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ id, label, ...props }: Props) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>

      <input
        id={id}
        className="w-full rounded border px-3 py-2"
        {...props}
      />
    </div>
  );
}