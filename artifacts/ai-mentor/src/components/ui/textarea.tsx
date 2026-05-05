import * as React from "react"
import { Textarea as AlfalabTextarea } from "@alfalab/core-components-textarea"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, onChange, value, rows, ...rest }, ref) => {
  const classes = (className ?? "").split(" ").filter(Boolean)
  const rootCls = classes
    .filter((c) => !/^(h-|min-h-|bg-|border|rounded|shadow|px-|py-|text-|ring|focus-)/.test(c))
    .join(" ")

  const handleChange = onChange
    ? (
        event: React.ChangeEvent<HTMLTextAreaElement>,
        _payload: { value: string }
      ) => onChange(event)
    : undefined

  return (
    <AlfalabTextarea
      ref={ref}
      value={value !== undefined ? String(value) : undefined}
      onChange={handleChange}
      block
      autosize={false}
      minRows={rows ?? 3}
      className={rootCls || undefined}
      {...(rest as any)}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
