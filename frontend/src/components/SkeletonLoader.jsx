function Bone({ className = '' }) {
  return (
    <div className={`animate-pulse bg-border rounded-lg ${className}`} />
  );
}

export default function SkeletonLoader() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl shadow-sm p-5 space-y-3">
            <Bone className="h-4 w-24" />
            <Bone className="h-8 w-32" />
            <Bone className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl shadow-sm p-5">
        <Bone className="h-64 w-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl shadow-sm p-5 space-y-3">
            <Bone className="h-4 w-20" />
            <Bone className="h-6 w-28" />
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl shadow-sm p-5 space-y-3">
        <Bone className="h-6 w-40" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-3/4" />
      </div>
    </div>
  );
}
