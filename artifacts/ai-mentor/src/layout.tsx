import { Link, useLocation } from "wouter";
import { BookOpen, BarChart2, Users, Sparkles } from "lucide-react";

const NAV = [
  { href: "/catalog", icon: BookOpen, label: "Каталог" },
  { href: "/analytics", icon: BarChart2, label: "Аналитика" },
  { href: "/admin/access", icon: Users, label: "Доступы" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <nav className="w-[248px] shrink-0 bg-[hsl(var(--surface))] border-r border-border flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="text-[15px] font-semibold tracking-tight">AI-Ментор</div>
        </div>
        <div className="px-3 mt-2 flex flex-col gap-1">
          {NAV.map((item) => {
            const active =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-3 h-10 rounded-xl transition-colors text-[14px] ${
                  active
                    ? "bg-primary/[0.08] text-primary font-semibold"
                    : "text-[hsl(var(--ink-muted))] hover:bg-primary/[0.05] hover:text-[hsl(var(--ink))]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                )}
                <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-primary" : "text-[hsl(var(--ink-muted))]"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-xl border border-border bg-[hsl(var(--surface))] p-3 text-[12px] text-[hsl(var(--ink-muted))] leading-relaxed">
            Внутренняя платформа банка для создания и запуска тренажёров.
          </div>
          <div className="flex items-center gap-2 mt-3 px-1 text-[13px]">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-medium">
              АП
            </div>
            <div className="leading-tight">
              <div className="font-medium">Анна Петрова</div>
              <div className="text-[hsl(var(--ink-muted))] text-[11px]">Администратор</div>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
