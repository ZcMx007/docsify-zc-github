# Linux安装JDK

jdk是Java开发需要的系统环境，而jre是Java应用部署时需要的系统环境，jvm虚拟机是解释class文件进而运行的类Java程序底层环境，jdk>jre>jvm[(jdk(jre(jvm)))]。我们将Java程序部署在服务器上，本质上只需要拥有部署环境就可以了，但是单独安装jre比较麻烦(当然，你可以选择直接下载jre包解压后再配置Linux环境变量)，因此我们可以选择直接安装JDK，linux安装JDK有三种方式可选择：1、下载Linux版本的jdk压缩包上传至linux系统后解压并配置环境变量就可以使用了，当然这样就可以只安装jre环境了；2、使用名为"RPM"的软件包的管理工具，它是linux自带的工具，使用它的前提是需要下载jdk的rpm包，然后使用相关命令下载即可；3、使用名为"yum"的软件包管理器，它是基于RPM的，而且它可以使系统管理人员交互和自动化地更新与管理RPM软件包，能够从指定的服务器自动下载RPM包并且安装，可以自动处理依赖性关系，并且一次安装所有依赖的软体包，无须繁琐地一次次下载、安装。本文主要涉及到法二和法三的JDK安装方式，文中会略有提及法一。

## rpm方式

- 1、下载rpm jdk软件包

链接：<https://pan.baidu.com/s/1-bXDLFQElHAQfocFrOKjhg> 提取码：vyp0
也可以到官网去下载：
官网地址：<https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html>

- 2、安装java环境

```linux
# 检测当前系统是否包含java环境，有的话避免版本冲突需要将原先的java环境卸载
rpm -qa|grep [java][jdk][gcj] # 检测jdk版本，存在会显示jdk的版本信息 用于卸载
# 如果存在 使用卸载命令卸载
rpm -e --nodeps [jdk的版本信息]
# 卸载完成即可使用rpm重新安装jdk
rpm -ivh [rpm包所在路径]
```

- 3、查看是否安装成功

使用```java -version```命令查看java版本信息，如果打印出了java版本信息，则说明已经使用rpm安装jdk成功了。

## yum方式

- 1、检查是否安装jdk并卸载

```linux
# 使用yum方式检查 当然由于yum基于rpm，因此也可以使用rpm的方式检查jdk是否已经被安装
yum list installed | grep [java][jdk]
# yum卸载
yum -y remove java-1.6.0-openjdk*  //"java-1.6.0-openjdk*"是版本号 卸载所有openjdk相关文件输入
yum -y remove tzdata-java.noarch   //卸载tzdata-java
```

- 2、安装JDK

```linux
# 查看JDK软件包列表
yum search java | grep -i --color jdk
# 从网络上获取的jdk列表中选择版本安装
yum install -y java-1.8.0-openjdk java-1.8.0-openjdk-devel
# 或者如下命令，安装jdk1.8.0的所有文件
yum install -y java-1.8.0-openjdk*
```

- 3、查看是否已经安装成功
使用```java -version```命令查看java版本信息，如果打印出了java版本信息，则说明已经使用rpm安装jdk成功了。

## 安装补充

需要注意的一点是，当我们使用rpm或yum进行jdk安装时，其实是不需要进行linux有关jdk的环境配置的。很多人最后还要配置一步环境变量的主要原因是因为使用rpm或yum的安装方式不能直接访问环境变量JAVA_HOME、CLASSPATH等变量，而这又是在windows中必须要配置的，殊不知这仅仅只是一个name而已，使用rpm或yum的安装方式可能不是使用的该名称而已。但当我们使用linux的jdk压缩包直接解压安装jdk时，是需要进行linux环境配置的。当然如果你是使用的rpm或yum进行jdk安装，但你有强迫症，也可以为linux配置你想要的JAVA环境变量。

### 配置过程

- 1、修改配置文件

```linux
# 使用 vim /etc/profile 命令编辑linux的系统文件
# set java environment  
JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk-1.8.0.181-3.b13.el7_5.x86_64 # 环境位置可能不一样
PATH=$PATH:$JAVA_HOME/bin  
CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar # 运行java程序所需要的依赖包，分别表示当前文件夹、以及java的内置依赖所在位置
export JAVA_HOME  CLASSPATH  PATH 
# 保存退出vim编辑 让配置文件生效
source /etc/profile
```

- 2、查看输出

使用 ```echo $JAVA_HOME``` ```echo $PATH echo``` ```$CLASSPATH``` 命令查看输出检查环境变量是否生效

## 如何部署一个简单的springboot项目

- 1、使用maven的package命令将项目打包
- 2、检查项目的端口是否已经被占用或开放
  - 1、```netstat -tunlp```  列出正在侦听的所有 TCP 或 UDP 端口
  - 2、firewall-cmd --list-ports 查看防火墙开启的端口，FirewallD is not running 表示防火墙未开启，```systemctl status firewalld``` 命令能够更加明显的发现防火墙处于未开启状态，可以通过```systemctl start firewalld```命令开启防火墙，也可以通过```systemctl stop firewalld```命令关闭防火墙。
  - 3、使用```firewall-cmd --permanent --zone=public --add-port=[应用程序设置的端口号]/tcp``` 开启指定端口号;当然如果使用的是阿里云部署的项目，则还需要配置阿里云的安全组策略。
- 3、使用```java -jar [application.jar]``` 命令启动springboot服务。