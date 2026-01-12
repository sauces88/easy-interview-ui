declare module '@kangc/v-md-editor/lib/preview' {
  import type { App, Plugin, Component, DefineComponent } from 'vue'

  interface VMdPreviewProps {
    text: string
    [key: string]: any
  }

  type VMdPreviewComponent = DefineComponent<VMdPreviewProps>

  interface VMdPreviewType {
    name: string
    use: (theme: any, options?: { Hljs?: any; [key: string]: any }) => void
    install: (app: App, options?: any) => void
  }

  const VMdPreview: VMdPreviewComponent & VMdPreviewType & Plugin
  export default VMdPreview
}

declare module '@kangc/v-md-editor/lib/theme/github' {
  const githubTheme: {
    extend: (option: any) => any
  }
  export default githubTheme
} 