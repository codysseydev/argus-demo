import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time throws so a malformed shape that slips past TypeScript at
 * runtime degrades to a fallback panel instead of a blank page. Fetch errors are
 * handled by QueryState; this is the last-resort net for everything else.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div role="alert" className="m-6 rounded border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-semibold">Something went wrong rendering this view.</p>
          <p className="mt-1 font-mono text-xs">{this.state.error.message}</p>
          <button
            type="button"
            className="mt-3 rounded border border-red-300 px-2 py-1 text-red-700 hover:bg-red-100"
            onClick={() => this.setState({ error: null })}
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
