import { Outlet, useOutletContext } from 'react-router';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useState } from 'react';

export interface LayoutContext {
  dataVersion: number;
}

export function useLayoutContext() {
  return useOutletContext<LayoutContext>();
}

export function Layout() {
  const [dataVersion, setDataVersion] = useState(0);

  return (
    <div className="h-screen flex" style={{ backgroundColor: '#F3F4F6', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <div className="flex-1 overflow-auto">
          <Outlet context={{ dataVersion } satisfies LayoutContext} />
        </div>
      </div>
    </div>
  );
}
