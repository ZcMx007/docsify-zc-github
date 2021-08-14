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
PATH=$PATH:$JAVA_HOME/bin  $PATH引用的是之前的PATH配置
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
- 3、使用```[nohup] java -jar [JVM参数设置] [application.jar]``` 命令后台启动springboot服务。nohup表示通过后台方式(作为服务)启动jar包，相当于windows中的服务，这样启动的java应用不会随着SSH工具的连接而关闭，只能通过```kill -9 [进程号]```的linux命令进行关闭，"&"表示输出默认重定向到当前目录下 nohup.out 文件，用于查看日志。

## nohup和&使用实例

一般两个一起组合使用不会受 Ctrl C 和 Shell 关闭的影响：

```linux
# 最简单的后台运行
nohup command &
# 输出默认重定向到当前目录下 nohup.out 文件
nohup python main.py &  
# 自定义输出文件(标准输出和错误输出合并到 main.log)
nohup python main.py >> main.log 2>&1 & 
# 与上一个例子相同作用的简写方法
nohup python main.py &> main.log &
# 不记录输出信息
nohup python main.py &> /dev/null &
# 不记录输出信息并将程序的进程号写入 pidfile.txt 文件中，方便后续杀死进程
nohup python main.py &> /dev/null & echo $! > pidfile.txt
```

## 使用Tomcat发布java war包

当然上述仅仅使用一个java环境就发布java项目的操作是针对于springboot项目的，因为springboot项目自带Tomcat容器；而在java的较为原生开发中，例如SSM和SSH项目中，我们需要使用更加通用的方式来发布打成war包的java项目，那就是通过安装的Tomcat进行发布。

### 操作步骤

- 1、下载tomcat。官网下载即可 tomcat9 **apache-tomcat-9.0.22.tar.gz**
- 2、解压这个文件：```tar -zxvf apache-tomcat-9.0.22.tar.gz```，同时将java应用也上传到服务器解压
- 3、进入```apache-tomcat-9.0.22\conf```的配置目录下的server.xml配置文件中更改服务的端口号以及应用（war包解压后就是应用目录，Host的标签的appBase属性）所在位置，让Tomcat能够正确读取项目路径。
- 4、如果想要使用Tomcat的远程调试功能的话，Linux进入（bin\catalina.sh）Tomcat启动文件，配置jpda的地址即可。
  
  ```xml
  # 将 localhost 改为 0.0.0.0
  if [ -z "$JPDA_ADDRESS" ]; then
  JPDA_ADDRESS="0.0.0.0:8000"
  ```

- 5、如果服务器配置了防火墙，则需要开放java应用的中配置的端口（如果开启了远程调试，则远程调试的端口也需要开放）。如果使用的是云服务器，则该实例的安全组策略中也要开放这些端口号。
- 6、如果没有配置远程调试功能，则进入linux中Tomcat的bin目录后直接使用```nohup ./startup.sh &```命令即可以后台方式(作为服务)部署java项目并将输出默认重定向到当前目录下 nohup.out 文件。如果使用了远程调试的话，那可以使用```./catalina.sh jpda start; tail -f logs/catalina.out```命令以远程调试模式启动，并且由于使用了```tail -f```的命令因此会持续追踪控制台的输出，并将其输出到catalina.out文件中。因此java程序在linux系统下执行```ctrl+c```命令并不会杀掉java程序的，而是会以后台服务的方式继续运行，相当于```nohup ./catalina.sh jpda start &> logs/catalina.out &```命令的效果。当然，前提是保证catalina.out文件存在，开始会自动创建catalina.out文件，但一旦删除，程序将无法运行，因为```tail -f```中"-f"的命令定义就是```根据文件描述符进行追踪，当文件改名或被删除，追踪停止```,如果想要根据文件名进行追踪并保持重试,那最好使用```tail -F```命令。
  