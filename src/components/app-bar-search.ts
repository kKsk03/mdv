import type { Component, InjectionKey } from 'vue'

/** 内部内容入口，使 SearchAppBar 共用 AppBar 的滚动、测量和 Scaffold 协调。 */
export const appBarSearchKey: InjectionKey<{ content: Component } | null> =
  Symbol('mdv-app-bar-search')
