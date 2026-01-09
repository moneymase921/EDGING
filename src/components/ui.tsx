'use client';

import React from 'react';
import { useUser } from '@/lib/UserContext';

// ─────────────────────────────────────────────────────────────────────────────
// PAGE CONTAINER
// ─────────────────────────────────────────────────────────────────────────────

type PageContainerProps = {
  children: React.ReactNode;
};

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        {children}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────

type NavPage = 'single' | 'two' | 'three' | 'journal' | 'reports';

type NavProps = {
  active: NavPage;
};

const navItems: { page: NavPage; label: string; href: string }[] = [
  { page: 'single', label: 'Single-Leg', href: '/single' },
  { page: 'two', label: 'Two-Leg', href: '/two' },
  { page: 'three', label: 'Three-Leg', href: '/three' },
  { page: 'journal', label: 'Bet Journal', href: '/journal' },
  { page: 'reports', label: 'Reports', href: '/reports' },
];

export function Nav({ active }: NavProps) {
  return (
    <nav className="flex flex-wrap gap-2">
      {navItems.map(item => (
        <a
          key={item.page}
          href={item.href}
          className={`
            px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-150
            ${item.page === active
              ? 'bg-slate-800/60 border-slate-500/50 text-slate-50'
              : 'bg-transparent border-slate-700/40 text-slate-300 hover:bg-slate-800/40 hover:border-slate-600/50 hover:text-slate-100'
            }
          `}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE HEADER
// ─────────────────────────────────────────────────────────────────────────────

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  active: NavPage;
};

export function PageHeader({ title, subtitle, active }: PageHeaderProps) {
  const { username, logout } = useUser();

  return (
    <header className="mb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-50">{title}</h1>
          {subtitle && <p className="text-slate-400 text-sm mt-1.5">{subtitle}</p>}
        </div>
        {username && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
              <span className="text-slate-500">@</span>{username}
            </span>
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
      <div className="mt-6">
        <Nav active={active} />
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────────────────────

type CardProps = {
  children: React.ReactNode;
  title?: string;
  className?: string;
};

export function Card({ children, title, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5 ${className}`}>
      {title && <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">{title}</h3>}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────────────────────────────────────

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  className?: string;
  inputClassName?: string;
};

export function Input({ label, value, onChange, placeholder, type = 'text', className = '', inputClassName = '' }: InputProps) {
  return (
    <div className={`flex flex-col w-full ${className}`}>
      <label className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        className={`
          w-full rounded-xl border border-slate-700/50 bg-slate-950/60 
          px-3.5 py-2.5 text-slate-100 placeholder-slate-500 
          outline-none transition-all duration-150
          focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20
          ${inputClassName}
        `}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECT
// ─────────────────────────────────────────────────────────────────────────────

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
};

export function Select({ label, value, onChange, options, className = '' }: SelectProps) {
  return (
    <div className={`flex flex-col w-full ${className}`}>
      <label className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
      <select
        className="
          w-full rounded-xl border border-slate-700/50 bg-slate-950/60 
          px-3.5 py-2.5 text-slate-100 
          outline-none transition-all duration-150
          focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20
        "
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT VALUE (large metric display)
// ─────────────────────────────────────────────────────────────────────────────

type StatValueProps = {
  label: string;
  value: string | number;
  color?: 'default' | 'positive' | 'negative' | 'muted';
  size?: 'sm' | 'md' | 'lg';
};

export function StatValue({ label, value, color = 'default', size = 'md' }: StatValueProps) {
  const colorClass = {
    default: 'text-slate-100',
    positive: 'text-emerald-400',
    negative: 'text-rose-400',
    muted: 'text-slate-400',
  }[color];

  const sizeClass = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">{label}</span>
      <span className={`font-semibold transition-colors duration-150 ${colorClass} ${sizeClass}`}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT ROW (inline label: value)
// ─────────────────────────────────────────────────────────────────────────────

type StatRowProps = {
  label: string;
  value: string | number;
  color?: 'default' | 'positive' | 'negative' | 'muted';
};

export function StatRow({ label, value, color = 'default' }: StatRowProps) {
  const colorClass = {
    default: 'text-slate-100',
    positive: 'text-emerald-400',
    negative: 'text-rose-400',
    muted: 'text-slate-400',
  }[color];

  return (
    <p className="text-sm">
      <span className="text-slate-400">{label}:</span>{' '}
      <span className={`font-semibold transition-colors duration-150 ${colorClass}`}>{value}</span>
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────────────────────────────────────

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
};

export function Button({ children, onClick, variant = 'primary', disabled = false, className = '', type = 'button' }: ButtonProps) {
  const baseClass = 'px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClass = {
    primary: 'bg-sky-500 hover:bg-sky-400 text-slate-950',
    secondary: 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-200',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
    ghost: 'bg-transparent hover:bg-slate-800/50 text-slate-300',
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PILL BUTTON (for mode selectors)
// ─────────────────────────────────────────────────────────────────────────────

type PillButtonProps = {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
};

export function PillButton({ children, active, onClick }: PillButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150
        ${active
          ? 'bg-slate-700/60 border-slate-500/50 text-slate-100'
          : 'bg-transparent border-slate-700/40 text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
        }
      `}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA TABLE (for sensitivity analysis)
// ─────────────────────────────────────────────────────────────────────────────

type Column<T> = {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  align?: 'left' | 'right' | 'center';
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  rowClassName?: (row: T, index: number) => string;
};

export function DataTable<T>({ columns, data, rowClassName }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/40 bg-slate-900/30">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/40">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`
                  py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide
                  ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                `}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b border-slate-800/30 last:border-b-0 ${rowClassName ? rowClassName(row, rowIndex) : ''}`}
            >
              {columns.map((col, colIndex) => {
                const value = typeof col.accessor === 'function'
                  ? col.accessor(row)
                  : row[col.accessor];
                return (
                  <td
                    key={colIndex}
                    className={`
                      py-2.5 px-4
                      ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                      ${col.className || ''}
                    `}
                  >
                    {value as React.ReactNode}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────────────────────────────────────

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning';
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantClass = {
    default: 'bg-slate-700/50 text-slate-300',
    success: 'bg-emerald-500/20 text-emerald-400',
    error: 'bg-rose-500/20 text-rose-400',
    warning: 'bg-amber-500/20 text-amber-400',
  }[variant];

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${variantClass}`}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION DIVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function SectionDivider() {
  return <hr className="border-slate-800/50 my-6" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE (for confirmations, errors)
// ─────────────────────────────────────────────────────────────────────────────

type MessageProps = {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'info';
};

export function Message({ children, variant = 'info' }: MessageProps) {
  const variantClass = {
    success: 'text-emerald-400',
    error: 'text-rose-400',
    info: 'text-slate-400',
  }[variant];

  return <p className={`text-sm ${variantClass}`}>{children}</p>;
}
