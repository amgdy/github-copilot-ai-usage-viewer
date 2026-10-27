import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { t } from '../i18n';

interface Props {
  children: ReactNode;
  /** Shown above the error message, e.g. the name of the page. */
  scope?: string;
  /** Extra way out, for when retrying would hit the same failure (e.g. a file the app cannot analyze). */
  recover?: { label: string; run: () => void };
}

interface State {
  error: Error | null;
}

/** Keeps a failure in one page from blanking the whole app. Remount it with a new `key` to reset. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Error in ${this.props.scope ?? 'page'}`, error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    const { recover } = this.props;
    if (!error) return this.props.children;
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-lg border border-bad/40 bg-bad-soft p-5 text-sm">
        <div className="flex items-center gap-2 font-semibold text-bad">
          <AlertTriangle size={18} /> {this.props.scope ? t('Something went wrong in {page}', { page: this.props.scope }) : t('Something went wrong')}
        </div>
        <p className="mt-2 break-words text-fg">{error.message}</p>
        <p className="mt-2 text-xs text-fg-muted">
          {recover ? t('Try again, or start over with another file.') : t('The data is still loaded. Try another page, change the filters, or reload.')}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm" onClick={() => this.setState({ error: null })}>
            {t('Try again')}
          </button>
          {recover ? (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                recover.run();
                this.setState({ error: null });
              }}
            >
              {recover.label}
            </button>
          ) : null}
        </div>
      </div>
    );
  }
}
