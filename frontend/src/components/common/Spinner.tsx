export default function Spinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4 text-center">
      <div className={`relative ${s}`}>
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-blue-400 animate-spin" />
      </div>
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
