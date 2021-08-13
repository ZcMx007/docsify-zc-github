# docker

Docker 是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的镜像中，然后发布到任何流行的 Linux或Windows 机器上，也可以实现虚拟化，而且比起虚拟机，它极其轻量小巧。容器是完全使用沙箱机制，相互之间不会有任何接口。

## 安装docker

我们一般会使用yum(Shell前端软件包管理器)安装docker。yum十分流行，现在很多项目都会使用yum来安装和管理linux上的软件应用。联网的情况下 我们一般使用```yum install -y yum源```命令安装应用。

- 1、旧版本的Docker被称为docker或docker-engine。如果安装了这些，则卸载它们以及相关的依赖关系。
  
  ```linux
   sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
  ```

- 2、设置 Docker 的仓库并从中安装，以方便安装和升级任务，安装yum-utils包（提供yum-config-manager实用程序）从而设置稳定的仓库。
  
```linux
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

这样就把docker官网的指定的yum仓库docker-ce.repo配置好了，但是docker-ce.repo是墙外的仓库，除非科学上网，否则几乎是无法进行访问的。因此按照官方所言，yum源嘛，稳定快速才是王道嘛，所以我选择阿里源作为我的主仓库哈哈。

### 如何配置阿里源所谓yum源呢？

我们进入```/etc/yum.repos.d```文件夹，发现所谓的yum源，其实本质上就是一个个的repo文件。因此所谓的添加yum源就是添加repo文件。但是通过```yum repolist all```命令(罗列出所有的仓库信息)，我们发现并不是所有的被添加到该目录下的repo文件都会生效。而且启用的多个yum源进行同一应用拉取时还有相关策略，为了简单起见，因此我们干脆把CentOS-Base源替换为阿里源不就完事了！

- 1、备份原有的 yum 源文件，防止丢失
  ```mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup```

- 2、下载阿里 yum 源配置文件（CentOS7 先安装wget），并将其存储为CentOS-Base源！
  ```wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo```

- 3、yum清除原yum源的所有缓存后，再重新创建包含阿里源的缓存。缓存作用：将服务器上的软件包信息本地缓存,以提高搜索以及安装软件的速度。
  
  ```linux
  yum clean all
  yum makecache
  ```

实际上我们上面安装的yum-config-manager也同样可以配置阿里源，而且它还可以手动的开启或者关闭yum子源（一个阿里源包含多个子源）：
使用```sudo yum-config-manager --add-repo http://mirrors.aliyun.com/repo/Centos-7.repo```命令添加yum阿里源，通过```sudo yum-config-manager --enable extras```开启阿里源的extras子源，通过```sudo yum-config-manager --disable extras```关闭阿里源的extras子源。由于yum源的多源选择策略，因此只需要阿里源就行了，此处可以通过```yum-config-manager --disable```命令关闭不需要的yum源。
