"use client";
import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; label: string; }
interface State { hasError: boolean; error: Error | null; }

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error) {
    console.error(`[DashboardBoundary:${this.props.label}]`, error.message);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-amber-300 bg-amber-50/40 p-4 m-2">
          <div className="flex items-center gap-2 text-amber-800">
            <span className="font-semibold">{this.props.label}</span>
            <span className="text-xs">— render error (caught): {this.state.error?.message?.slice(0, 150)}</span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
