import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const inputRing =
  "border border-border/80 bg-background shadow-sm transition-[border-color,box-shadow] " +
  "placeholder:text-muted-foreground/80 " +
  "hover:border-border focus-visible:border-primary/50 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background dark:focus-visible:ring-offset-background " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  /* 16px on small screens avoids iOS zoom on focus */
  "text-base md:text-sm";

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm animate-fade-in",
        className
      )}
      {...p}
    />
  );
}

export function Button({
  className,
  variant = "default",
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" | "destructive" }) {
  const v =
    variant === "outline"
      ? "border border-border bg-transparent hover:bg-muted"
      : variant === "ghost"
        ? "bg-transparent hover:bg-muted"
        : variant === "destructive"
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-primary text-primary-foreground hover:opacity-90";
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100",
        v,
        className
      )}
      {...p}
    />
  );
}

export function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type ?? "text"}
      className={cn(
        "flex min-h-[44px] w-full min-w-0 rounded-xl px-3.5 py-2.5 md:min-h-[42px] md:py-2",
        inputRing,
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full min-w-0 resize-y rounded-xl px-3.5 py-3 md:min-h-[88px] md:text-sm",
        inputRing,
        "text-base leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...p }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-foreground/80", className)} {...p} />;
}

/** Select styled like inputs (native select) */
export function Select({
  className,
  children,
  ...p
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative w-full min-w-0">
      <select
        className={cn(
          "flex min-h-[44px] w-full min-w-0 cursor-pointer appearance-none rounded-xl bg-background px-3.5 py-2.5 pr-11 text-base md:min-h-[42px] md:text-sm",
          inputRing,
          className
        )}
        {...p}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
