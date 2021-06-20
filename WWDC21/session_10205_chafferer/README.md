### About Me
作者：Chafferer，目前就职于百度 App 基础研发团队，从事百度 App iOS CI/CD 相关方向的工作，主要维护 EasyBox。

审核：暂无

### 标题

在 Xcode 中进行 Code Review 以及多人合作

### 简介

在日常的开发中，难免要遇到多人合作的情况。以百度 App 为例，庞大而复杂的工程肯定不是一个人就可以进行维护的，一般我们都会采用 `Git` 进行版本的托管，于是我们的日常工作基本上就离不开 pull & push 代码。push 完代码，一般也不能立即合入主分支，需要在诸如 `iCode` 的平台上进行 Code Review，经过多人 Review 后方可合并。现在 `Xcode` 集成了相关的版本控制功能，你可以在 `Xcode` 中创建新的分支、拉取、推送代码甚至进行 Code Review。