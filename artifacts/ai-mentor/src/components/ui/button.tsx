import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Button as AlfalabButton } from "@alfalab/core-components-button"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary-border",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm border-destructive-border",
        outline:
          "border [border-color:var(--button-outline)] shadow-xs active:shadow-none",
        secondary:
          "border bg-secondary text-secondary-foreground border border-secondary-border",
        ghost: "border border-transparent",
        link: "text-primary underline-offset-4 hover:underline",
        accent:
          "bg-primary text-primary-foreground border border-primary-border shadow-sm",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const VARIANT_TO_VIEW: Record<
  string,
  "accent" | "primary" | "secondary" | "outlined" | "transparent" | "text"
> = {
  default: "accent",
  destructive: "accent",
  outline: "outlined",
  secondary: "secondary",
  ghost: "transparent",
  link: "text",
  accent: "accent",
}

const SIZE_TO_NUM: Record<string, 32 | 40 | 48 | 56 | 64 | 72> = {
  default: 40,
  sm: 32,
  lg: 48,
  icon: 40,
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <AlfalabButton
        ref={ref}
        view={VARIANT_TO_VIEW[variant ?? "default"] ?? "primary"}
        size={SIZE_TO_NUM[size ?? "default"] ?? 40}
        className={className}
        {...(props as any)}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
          {children}
        </span>
      </AlfalabButton>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
