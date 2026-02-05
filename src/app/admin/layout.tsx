import Link from 'next/link';
import { Scissors, Calendar, Users, Briefcase, Settings, LayoutDashboard } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/reservas', icon: Calendar, label: 'Reservas' },
    { href: '/admin/barberos', icon: Users, label: 'Barberos' },
    { href: '/admin/servicios', icon: Briefcase, label: 'Servicios' },
    { href: '/admin/clientes', icon: Users, label: 'Clientes' },
    { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-30">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Scissors className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Mi Barbería</h1>
              <p className="text-xs text-gray-500">Panel Admin</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <span className="text-sm font-medium">Ver página pública</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
