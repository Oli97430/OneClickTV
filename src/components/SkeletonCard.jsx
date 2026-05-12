export default function SkeletonCard({ tvMode = false }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] flex flex-col">
      <div className={`bg-[var(--bg-base)] ${tvMode ? 'aspect-[4/3]' : 'aspect-video'}`}>
        <div
          className="w-full h-full rounded-none"
          style={{
            background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--border) 50%, var(--bg-card) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
      </div>
      <div className={`${tvMode ? 'p-4' : 'p-3.5'} space-y-2.5`}>
        <div
          className="h-4 rounded-md w-3/4"
          style={{
            background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--border) 50%, var(--bg-card) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
            animationDelay: '0.15s',
          }}
        />
        <div
          className="h-2 rounded-md w-1/2"
          style={{
            background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--border) 50%, var(--bg-card) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
            animationDelay: '0.3s',
          }}
        />
      </div>
    </div>
  );
}
