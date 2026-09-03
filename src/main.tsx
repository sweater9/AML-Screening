import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unknown frontend error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('VeritasScreen frontend failed to render:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ minHeight: '100vh', background: '#020617', color: '#e2e8f0', padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', border: '1px solid #334155', borderRadius: '16px', padding: '24px', background: '#0f172a' }}>
            <h1 style={{ marginTop: 0 }}>VeritasScreen</h1>
            <p>The application loaded, but a frontend component failed to render.</p>
            <p style={{ color: '#fbbf24' }}>{this.state.message}</p>
            <button onClick={() => { localStorage.removeItem('veritas_screen_reports_v1'); window.location.reload(); }} style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', border: 0, cursor: 'pointer' }}>
              Reset local data and reload
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Application root element is missing.');

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
