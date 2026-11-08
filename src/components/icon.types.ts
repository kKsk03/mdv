import type { IconifyIcon } from '@iconify/vue/offline'

/** 本地 SVG 图标数据；可从单个图标的包出口按需导入。 */
export type MdvIconData = IconifyIcon

/** 数字以 px 为单位，字符串支持 em、rem、CSS 变量等 CSS 长度。 */
export type MdvIconSize = number | string
