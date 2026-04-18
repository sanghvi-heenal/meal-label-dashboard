const BackgroundBlobs = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Top-right warm blob */}
      <div
        className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-warning/20 blur-3xl animate-blob-float"
        style={{ animationDelay: "0s" }}
      />
      {/* Bottom-left cool blob */}
      <div
        className="absolute -bottom-40 -left-32 w-[420px] h-[420px] rounded-full bg-info/20 blur-3xl animate-blob-float"
        style={{ animationDelay: "-5s" }}
      />
      {/* Center primary blob */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full bg-primary/15 blur-3xl animate-blob-float"
        style={{ animationDelay: "-10s" }}
      />

      {/* Subtle grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
};

export default BackgroundBlobs;
