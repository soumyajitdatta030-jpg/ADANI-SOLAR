export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="flex items-center text-4xl font-bold tracking-tighter">
        <span className="text-[#0080B5]">a</span>
        <span className="text-[#2F5397]">d</span>
        <span className="text-[#513687]">a</span>
        <span className="text-[#842A81]">n</span>
        <span className="text-[#AE2067]">i</span>
      </div>
      <div className="w-full h-[1px] bg-gray-400 mt-1 mb-1"></div>
      <div className="text-xl font-medium text-gray-600 tracking-wide">Solar</div>
    </div>
  );
}
