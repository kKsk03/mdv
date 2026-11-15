---
'@mdv-ui/mdv': patch
---

修复 MdvIconButton 原生事件透传规格的挂载隔离问题，避免完整测试运行时出现偶发的点击事件断言失败。
