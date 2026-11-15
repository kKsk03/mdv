---
'@mdv-ui/mdv': patch
---

修复 Chip、IconButton 和 Button 测试的事件触发时序，避免挂载与点击处于同一毫秒时 Vue 跳过事件回调而导致 CI 偶发失败；补充同一毫秒下的删除、事件透传与取消行为覆盖。
