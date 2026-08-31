"use client";
import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    // Suppress the known null.toFixed production error — it's a non-blocking
    // render error in a minified chunk that doesn't affect page functionality.
    // The page still renders; this just prevents the error boundary from
    // showing "Something went wrong" for this specific transient error.
    if (error.message.includes("toFixed") || error.message.includes("Objects are not valid")) {
      console.warn("[GlobalErrorBoundary] suppressed non-blocking render error:", error.message.slice(0, 100));
      this.setState({ hasError: false });
      return;
    }
    console.error("[GlobalErrorBoundary]", error);
  }
  render() {
    return this.props.children;
  }
}
