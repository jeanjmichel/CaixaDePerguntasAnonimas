'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import styles from './layout.module.css';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <Link href="/admin/meetings" className={styles.brand}>
          Caixa de Perguntas — Admin
        </Link>
        <Link href="/admin/admins" className={styles.navLink}>
          Administradores
        </Link>
      </nav>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
