import React from 'react'

interface PageContainerProps extends React.PropsWithChildren {
  icon?: React.ReactNode
  title: string
}

/**
 * 页面通用容器：统一标题样式与内容宽度
 */
export function PageContainer({ children, icon, title }: PageContainerProps) {
  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col" data-slot="page-container">
      <div className="mb-10 flex items-center gap-2">
        {icon}
        <h2 className="font-heading text-2xl font-semibold">{title}</h2>
      </div>
      <div className="no-scrollbar h-full scroll-fade-y overflow-y-auto p-px">{children}</div>
    </div>
  )
}
