"use client"

import * as React from "react"
import {
  FormProvider,
  useForm as useFormOrig,
  type UseFormReturn,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as zod from "zod"
import * as LabelPrimitive from "@radix-ui/react-label"

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={className} {...props} />
))
Label.displayName = "Label"

/** Contexte indiquant le nom du champ en cours de rendu (défini par FormField). */
const CurrentFieldContext = React.createContext<string | undefined>(undefined)

type FormProps<T extends zod.ZodTypeAny = any> = {
  schema?: T
  defaultValues?: zod.infer<T>
  onSubmit?: (values: zod.infer<T>) => void | Promise<void>
  children: React.ReactNode
}

export function Form<T extends zod.ZodTypeAny = any>({
  schema,
  defaultValues,
  onSubmit,
  children,
}: FormProps<T>) {
  const methods = React.useMemo<UseFormReturn<zod.infer<T>>>(
    () =>
      useFormOrig<zod.infer<T>>({
        defaultValues,
        resolver: schema ? zodResolver(schema) : undefined,
      }),
    [schema, defaultValues]
  )

  const handleSubmit = React.useCallback(
    async (data: any) => {
      if (onSubmit) {
        return onSubmit(data)
      }
    },
    [onSubmit]
  )

  return (
    <FormProvider {...methods} onSubmit={handleSubmit}>
      {children}
    </FormProvider>
  )
}

type FormFieldProps<T extends any = any, TFieldName extends string = string> = {
  name: TFieldName
  render: (props: {
    field: {
      value: any
      onValueChange: (value: any) => void
      onChange: (e: any) => void
      checked: boolean
    }
    formState: { errors: Record<string, any>; isSubmitting: boolean }
  }) => React.ReactNode
}

export function FormField<T extends any = any, TFieldName extends string = string>({
  name,
  render,
}: FormFieldProps<T, TFieldName>) {
  const methods = useFormContext()
  const fieldState = methods.getFieldState(name as string)
  const { value } = methods.watch(name as string)

  const onValueChange = (val: any) => {
    methods.setValue(name as string, val)
  }

  const onChange = (e: any) => {
    methods.setValue(name as string, e.target?.value ?? e)
  }

  return (
    <CurrentFieldContext.Provider value={String(name)}>
      {render({
        field: {
          value,
          onValueChange,
          onChange,
          checked: typeof value === "boolean" ? !!value : false,
        },
        formState: {
          errors: methods.formState.errors,
          isSubmitting: methods.formState.isSubmitting,
        },
      })}
    </CurrentFieldContext.Provider>
  )
}

export const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={className} {...props} />
))
FormItem.displayName = "FormItem"

export const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
  <Label ref={ref} className={className} {...props} />
))
FormLabel.displayName = "FormLabel"

export const FormControl = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => (
  <span ref={ref} className={className} {...props}>{children}</span>
))
FormControl.displayName = "FormControl"

export const FormMessage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const methods = useFormContext()
  const currentField = React.useContext(CurrentFieldContext)
  const error = currentField
    ? (methods.getFieldState(currentField)?.error as any)
    : undefined
  const message = children ?? (error?.message ?? null)

  if (!message) return null

  return (
    <div ref={ref} className={className} {...props}>
      {message}
    </div>
  )
})
FormMessage.displayName = "FormMessage"

export { useForm as useForm }
export type { UseFormReturn }
