export default function ProductSkeleton() {
  return (
    <div className="border rounded-xl overflow-hidden shadow-sm bg-white animate-pulse">
      <div className="w-full h-48 bg-gray-200"></div>
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="flex gap-2 mb-3">
          <div className="h-8 bg-gray-200 rounded-full w-16"></div>
          <div className="h-8 bg-gray-200 rounded-full w-16"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
      </div>
    </div>
  );
}