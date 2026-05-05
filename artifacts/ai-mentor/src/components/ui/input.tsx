import * as React from "react"
import { Input as AlfalabInput } from "@alfalab/core-components-input"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, onChange, value, type, ...rest }, ref) => {
    const classes = (className ?? "").split(" ").filter(Boolean)
    const inputCls = classes.filter((c) => /^pl-/.test(c)).join(" ")
    const rootCls = classes
      .filter((c) => !/^(h-\d|bg-|pl-)/.test(c))
      .join(" ")

    const handleChange = onChange
      ? (
          event: React.ChangeEvent<HTMLInputElement>,
          _payload: { value: string }
        ) => onChange(event)
      : undefined

    return (
      <AlfalabInput
        ref={ref}
        value={value !== undefined ? String(value) : undefined}
        onChange={handleChange}
        type={type as "text" | "email" | "password" | "tel" | "number" | undefined}
        block
        className={rootCls || undefined}
        inputClassName={inputCls || undefined}
        {...(rest as any)}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
