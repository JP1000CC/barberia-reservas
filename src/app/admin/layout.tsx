'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scissors, Calendar, Users, Briefcase, Settings,
  LayoutDashboard, Menu, X, ChevronRight
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/reservas', icon: Calendar, label: 'Reservas' },
    { href: '/admin/barberos', icon: Users, label: 'Barberos' },
    { href: '/admin/servicios', icon: Briefcase, label: 'Servicios' },
    { href: '/admin/clientes', icon: Users, label: 'Clientes' },
    { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Studio 1994</span>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Studio 1994</h1>
                <p className="text-xs text-gray-500">Panel Admin</p>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                    ${active
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 ${active ? 'text-indigo-600' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <Link
              href="/"
              onClick={closeSidebar}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition-colors"
            >
              <span className="text-sm font-medium">Ver página pública</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        {/* Desktop Header - opcional, puedes agregar uno similar al AdminHeader */}
        <div className="hidden lg:block border-b border-gray-200 bg-white px-8 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {navItems.find(item => isActive(item.href))?.label || 'Panel Admin'}
          </h2>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
