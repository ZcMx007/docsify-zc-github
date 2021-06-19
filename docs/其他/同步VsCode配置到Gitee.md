
# 利用code settings sync同步VsCode配置到Gitee

code settings sync：是专门用来同步vscode配置到Gitee中的插件，通过这个插件，可以在任何新的设备，新的平台同步自己的配置，快速的构建自己熟悉的IDE环境（vscode也许不能称为IDE，但作为文本编辑器功能又太强大了），目前主流通过Settings Sync将配置同步到Github，但是速度太慢，详细教程可以百度，这里只介绍同步配置到Gitee的操作。
作为一款插件，code settings sync具有以下特点：

安装简单 ：在VsCode中直接搜索安装code settings sync即可完成安装；

配置简单 ：只需要在setting json中配置；

```json
"gitee.gist": "******",    #gist是Gitee代码段的ID
"gitee.access_token": "*******",        #access_token是Gitee生成的私人令牌
```

使用简单 ：只需要两个命令upload setting，download setting就可以完成；

安全 ： ``` gitee.access_token` ``在Gitee中生成私人令牌的时候只需要勾选gists 即可，user_info 权限是必选；

详情见：<https://www.jianshu.com/p/465396c9686f>
