import Link from 'next/link';
import { HeartPlus } from 'lucide-react';

export default function SupportMeButton() {
  return (
    <Link
      href={{
        pathname: 'https://www.buymeacoffee.com/PeterOu8',
      }}
      className="flex flex-row border rounded-xl p-2 gap-3 items-center shadow-md"
    >
      <HeartPlus strokeWidth={1.75} className="w-4 h-4" />
      Support Me
    </Link>
  );
}
