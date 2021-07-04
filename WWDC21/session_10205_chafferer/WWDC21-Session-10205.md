# WWDC21 10205 - 在 Xcode 中 Review Code 以及多人合作 

> 作者：Chafferer，目前就职于百度 App 基础研发团队，从事 CI/CD 相关方向的工作。
>
> 审核：红纸，iOS 开发，周报编辑，就职于淘系技术部

![10205-00-coverage](https://images.xiaozhuanlan.com/photo/2021/1a6d177702595a151ed6756198e40056.png)

> WWDC21 Session 10205 - [Review code and collaborate in Xcode](https://developer.apple.com/videos/play/wwdc2021/10205/)


## 本文知识目录

![Review Code and collaborate in Xcode](https://images.xiaozhuanlan.com/photo/2021/c7e489e752d37b14d0ff211015fc58fc.png)

关于版本控制的相关内容，大家可以参考 [Source Control](https://zh.wikipedia.org/wiki/%E7%89%88%E6%9C%AC%E6%8E%A7%E5%88%B6)，常见的版本控制工具有 `SVN`、`Git` 等。现在苹果的开发工程师们将版本控制集成到了 `Xcode`，因此我们可以在 `Xcode` 中创建新的分支、查看本地的 `Git` 历史甚至直接进行 Code Review。这将大大提升我们的工作效率。

接下来让我们先看下在 `Xcode 13` 之前我们的开发以及 `Code Review` 大概是怎样的呢，这里我们以百度为例，看下在百度是怎么进行 `Code Review` 的。

## 工具
在百度的 `Code Review` 的过程中一般离不开这些工具：终端等命令行工具（iTerm）或者是 Source Tree 这类的 Git 可视化软件以及 `iCode`。通过 Git 操作将本地的代码提交到远端：

```
git add . # 将本地的改动提交到暂存区
git commit -m 'commit message' # 将暂存区的内容添加到本地的仓库中
git push origin HEAD:refs/for/xxxBranch # 将本地仓库中的内容提交到远端，通过 refs/for 创建提交到远端 xxxBranch 的 Pull Request
```

创建提交到 xxxBranch 分支的 Pull Request，这时候你就能在 `iCode` 相关的代码仓库中找到对应的 Pull Request（百度内部称之为评审），下面我们就来看下 `iCode` 的评审页面，如图所示：

![10205-02-icode](https://images.xiaozhuanlan.com/photo/2021/ee503cd929484482458535fcab645908.png)

我们可以在评审页面做如下的事情

* 查看修改的代码
* 对某一行代码进行评论
* 回复某一个评论
* 看到提交的次数，并且可以两两对比
* 对整体进行打分或者是评论

一般对仓库的配置都是当切仅当打分超过两分的时候，当前的 `Pull Request` 才能通过，代码才可以进行合并，这样就完成了一次完整的 `Code Review`，别的公司可能没有 `iCode` 之类的代码服务平台，但是 `Code Review` 的操作大同小异。下面我们就跟随 Kieran 看看集成了版本控制工具的 `Xcode 13` 是如何提升我们的工作效率的。

## 在 Xcode 中修复 bug
作为一个开发者，我们难免会遇到需要修复 bug 的情况。一般修复 bug，我们首先要做的就是定位这个 bug，往往 bug 的成因就是我们修改了一些历史的代码，那么我们怎么去找到这些改动呢，往往我们需要找到相应的 commit，然后根据 commit 找到对应修改的文件，最终定位到修改的代码。现在利用集成了版本控制的 `Xcode` 我们可以更加轻松地找到 bug 的成因：
当我们在 `Xcode` 中写代码的时候，我们能够在侧边栏清楚看到这个文件中的哪一行发生了改变，如下图所示

![10205-03-show-changes](https://images.xiaozhuanlan.com/photo/2021/7285b86ae7ac9a495793cb01752c07fd.png)

这样我们就可以点击在编辑栏中的 `Code Review` 按钮（双向箭头的 icon），进入 `Code Review` 模式：

![10205-04-code-review](https://images.xiaozhuanlan.com/photo/2021/aacaf64554c49a7e774d17fc80891949.png)

在 `Code Review` 模式下，我们的改动会被高亮显示，所以我们可以很直观得看到和最新一次提交相比都改动了哪些代码。那么当我们改动在同一个文件的不同位置，我们有办法知道当前所有的改动吗？当然可以，我们可以在 `Xcode` 底部的工具栏中找到当前文件所有的改动点，我们可以点击 `前进` 或者 `后退` 按钮，在所有的改动中跳转

![10205-05-all-changes](https://images.xiaozhuanlan.com/photo/2021/e09ba48be0776820440ad8407b6f1aa5.png)

这样，我们就不必滚动鼠标滚轮去找每一处改动了。

底部的工具栏中还有一个 `提交控制` 按钮，这样我们就可以方便对比不同版本间的文件改动了，我们可以选择同一或者不同分支的两个 `commit` 或者 `tag` 进行对比

![10205-06-compare](https://images.xiaozhuanlan.com/photo/2021/35229c5e4e92f340795b36b355070fb8.png)

当我们选择完了需要对比的 `commit` 后，`Xcode` 会对修改的内容进行高亮显示，每个 `commit` 的提交都会有与之对应的颜色显示，这样就可以方便查看具体改了哪些内容了，如果我们要回滚到最近的版本，仅仅只需要点击底部工具栏的 `Reset` 按钮。

![10205-07-comapre-and-reset](https://images.xiaozhuanlan.com/photo/2021/5cb3cb6f49af6e0c495df044194b2eef.png)

以上我们可以方便查看单一文件的改动情况，那么如果要查看所有改动的文件该怎么办呢？`Xcode` 在 `Source Control` 导航栏中提供了全新的 `Changes` 按钮，通过点击该按钮，我们可以看到自从上一个 `commit` 以来所有文件改动的列表

![10205-08-change-list](https://images.xiaozhuanlan.com/photo/2021/2f7c93b7bcf18b16291721a7d7a9814c.png)

通常，我们通过对文件的对比，就能找到问题的成因了，这时候我们就需要进入下一步：修改代码并提交来修复 bug。那么在集成了版本控制的 `Xcode` 中，我们又可以怎么做呢？
首先我们需要创建一个新的 bugfix 分支，并且将当前的分支切到 bugfix 分支上，有了 `Xcode 13`，我们可以很方便创建并且切换分支。现在 `Xcode` 顶部的工具栏中会显示当前所在的分支，我可以点击这个工具栏以快速切换分支，除此以外，我们也可以快速地重命名分支或者是从当前的分支上拉出新的分支：

![10205-09-branches](https://images.xiaozhuanlan.com/photo/2021/c3fb261cf37f8895eb49281f5abe19c9.png)

现在我们已经在本地将这个问题修复了，要修复线上的问题，我们就需要 push 我们的 fix 代码，接下来就进入了下面的 `Code Review` 环节


## Get feedback from your team

首先，我们得创建一个 `PR`（pull request）在 `Xcode 13` 之前，创建 `PR` 需要我们执行相应的 `Git` 操作，有了 `Xcode 13` 我们可以在 `Xcode` 中创建 `PR`（苹果和 Github/Gitlab 等代码托管平台合作，可以创建提交到这些平台的 Pull Request），我们只需要点击之前提到的查看分支的工具栏中的 `Create Pull Reauest` 按钮就可以创建 `PR` 了。我们可以在版本控制导航栏中的 `Pull Request` 栏目中找到所有的 `Pull Request` ，`Local Changes` 栏目显示尚未提交的本地改动的文件。我们可以编辑创建的 `Pull Request` 来给它添加一些诸如标题和描述等内容：

![10205-10-pull-request](https://images.xiaozhuanlan.com/photo/2021/5602e9132aca90850f57803fae5828b4.png)

同时，我们可以点击图中的 `Participants` 按钮，来添加 Code Review 的同学，当有同学对你的代码做出评论时候，`Xcode` 会进行相关显示，这时我们只要点击图中的 `View Changes` 按钮，就能跳转到对应的文件，详细查看同事的评论了：

![10205-11-feedback](https://images.xiaozhuanlan.com/photo/2021/1bb9aee5a858dfc13dc9182447262a0f.png)

如果我们是用来 `Xcode Cloud` 的话，我们也能在这里看到相应的状态：

![10205-12-xcode-cloud](https://images.xiaozhuanlan.com/photo/2021/8d1add00a1d67b28714495c7efc4c3a0.png)，更多关于 `Xcode Cloud` 请移步 [session 10267 Meet Xcode Cloud](https://developer.apple.com/wwdc21/10267)，至此，我们已经完成了 `Code Review` 的步骤。下面我们就需要合并我们的代码了。


## Integrate your changes

我们可以使用 `Xcode` 提供的 `Pull Request actions` 来合并我们的代码，我们选择 action 为 `Merge`，这时候会弹出一个对话窗，`Xcode` 允许我们对合并策略做一些选择，同时你也可以填写你的 commit message，最后只需要点击 `Merge` 按钮，就能将你的代码合并到目标分支啦。

![10205-13-merge](https://images.xiaozhuanlan.com/photo/2021/88e306e02299402bf044415aa2cbe4a1.png)

至此，我们的 bug 已经 fix 完毕。日常开发中你也一定会担任 Code Reviewer 的角色，那么使用 `Xcode 13` 我们可以怎么 review 别的同学的代码呢？

## Review your peer's changes

![10205-14-cooperation](https://images.xiaozhuanlan.com/photo/2021/a034f820d31b94e28d3dfb6fdab6b118.png)

在分支展示工具栏中，我们不仅仅能看到自己的 `Pull Request`，同时如果有同学需要你去 review 他的 `Pull Request`，那么与你相关的 `Pull Request` 也会显示在这里，这时我们需要切到他相应的分支，并且对他的改动进行 review。同样的，通过 `Xcode 13` 的 `Code Review` 模式，我们能方便找到相关的改动，并且通过双击需要评论的代码来插入自己对同学的代码的评论

![10205-15-comment](https://images.xiaozhuanlan.com/photo/2021/ce39be340e219ee5cdfb16b90c42e25f.png)

当然，如果同学的代码无懈可击，你也可以直接来到 `Pull Request action` 通过他的 `PR`。这样你已经利用 `Xcode 13` 充当了一回 Code Reviewer。

## 总结

以上就是利用 `Xcode 13` 版本控制能力做到的一些事情，在 `Xcode` 中进行一些分支操作或者是 `Code Review` 能提升我们一定的工作效率。现在，使用 `Xcode 13` 我们便可以做到：

- Code Review 并且多人合作
- 查找改动的内容排查问题
- 在源码中提供反馈

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
