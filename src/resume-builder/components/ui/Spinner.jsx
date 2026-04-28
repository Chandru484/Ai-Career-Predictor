export function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size] ?? 'w-6 h-6';
  return (
    <div className={`${s} border-2 border-indigo-500 border-t-transparent rounded-full animate-spin ${className}`} />
  );
}

export function PageSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[40vh]">
      <Spinner size="lg" />
    </div>
  );
}
