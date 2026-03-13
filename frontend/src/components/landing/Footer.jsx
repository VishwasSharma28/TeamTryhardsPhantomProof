export default function Footer() {
  const links = [
    {
      heading: "Product",
      items: [
        { label: "About", href: "#about" },
        { label: "Technology", href: "#why" },
        { label: "Services", href: "#services" },
      ],
    },
    {
      heading: "Community",
      items: [
        { label: "Discord", href: "#" },
        { label: "Twitter", href: "#" },
        { label: "GitHub", href: "#" },
      ],
    },
    {
      heading: "Company",
      items: [
        { label: "Contact", href: "#" },
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Logo + Description */}
          <div className="lg:col-span-2">
            <a href="#home" className="flex items-center gap-3 mb-5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-indigo to-accent-violet flex items-center justify-center group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-shadow duration-300">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                PHANTOM <span className="text-slate-400 font-normal">AI</span>
              </span>
            </a>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-6">
              AI-powered verification system detecting deepfakes, manipulated media, and misinformation.
            </p>
            <a
              href="mailto:hello@phantomai.com"
              className="text-sm text-slate-400 hover:text-accent-indigo transition-colors duration-300"
            >
              hello@phantomai.com
            </a>
          </div>

          {/* Link Columns */}
          {links.map((col) => (
            <div key={col.heading}>
              <h4 className="text-sm font-semibold text-white tracking-wide mb-4">
                {col.heading}
              </h4>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-slate-500 hover:text-white transition-colors duration-300"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Phantom AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
