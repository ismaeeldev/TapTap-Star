"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      // Theme guideline section 8.4: bottom-right (sonner handles the mobile full-width
      // bottom-center layout automatically), max 3 stacked visible at once.
      position="bottom-right"
      visibleToasts={3}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-md !border-l-4 !bg-bg-card !text-text-primary !border-border-default",
          success: "!border-l-success",
          error: "!border-l-danger",
          warning: "!border-l-warning",
          info: "!border-l-brand",
        },
      }}
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-md)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
