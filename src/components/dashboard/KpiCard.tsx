export default function KpiCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-medium text-gray-900">{value}</p>
    </div>
  );
}
