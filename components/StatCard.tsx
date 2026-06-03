type Props = {
  title: string;
  value: string;
};

export default function StatCard({
  title,
  value,
}: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
      <h3 className="text-gray-400 text-sm mb-2">
        {title}
      </h3>

      <p className="text-3xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}