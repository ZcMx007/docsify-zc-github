# Nexus

## 一、定义

nexus的全称是Nexus Repository Manager，是Sonatype公司的一个产品。它是一个强大的仓库管理器，极大地简化了内部仓库的维护和外部仓库的访问。我们主要用它来搭建公司内部的maven私服。但是它的功能不仅仅是创建maven私有仓库这么简单，还可以作为nuget、docker、npm、bower、pypi、rubygems、git lfs、yum、go、apt等的私有仓库，功能非常强大。我们在maven使用maven-public仓库地址的时候，会按照如下顺序访问：本地仓库 --> 私服maven-releases --> 私服maven-snapshots --> 远程阿里云maven仓库 --> 远程中央仓库。

## 二、部署私服的优点

从项目实际开发来看：

1、一些无法从外部仓库下载的构件，例如内部的项目还能部署到私服上，以便供其他依赖项目使用。

2、为了节省带宽和时间，在局域网内架设一个私有的仓库服务器，用其代理所有外部的远程仓库。当本地Maven项目需要下载构件时，先去私服请求，如果私服没有，则再去远程仓库请求，从远程仓库下载构件后，把构件缓存在私服上。这样，及时暂时没有Internet链接，由于私服已经缓存了大量构件，整个项目还是可以正常使用的。同时，也降低了中央仓库的负荷。

优点归纳：

1.节省外网带宽：大量对中央仓库的重复请求会消耗带宽，利用私服代理外部仓库，可以避免重复的公网下载降低带宽的压力。

2.加速maven的构建：maven通过内网从私服拉取所需构件（私服存在此构件的情况下），获取构件的速度大大加快，从而加快打包构件的速度。

3.部署第三方构件：开发人员自己封装的一些jar包（工具类），可以部署到私服，以便内部开发人员的maven项目使用。

4.提高稳定性：当公网网络不稳定的时候，如果使用远程仓库，maven的构建也会变得不稳定。如果在私服存在所需的构件，即使没有公网，maven的构件也会顺利进行。

5.降低中央仓库的负荷：使用私服，避免了从中央仓库的重复下载，可以减轻中央仓库的负荷。

## 三、如何使用docker来进行Nexus的maven私有仓库的部署与使用

> 参考[链接1](https://blog.csdn.net/ThinkWon/article/details/94346681),[链接2](https://www.cnblogs.com/yanchuanbin/p/15107979.html)

### 安装：

其实Nexus的部署一开始会使用npm包管理工具进行部署，但是这样的部署方式需要配置较多的参数，没有docker来的直接简单，因此，此处直接使用docker进行Nexus的maven私有仓库的部署。

1、在需要部署的linux机器上配置yum阿里源加速，下载并安装docker（可以的话可以配置docker阿里源加速，不过此处速度已经够了）

2、建立数据储存文件夹，用于docker容器数据挂载

```shell
##建立数据存放文件夹，用于docker中nexus的数据与本地物理机映射
mkdir -p /usr/local/nexus3/nexus-data
##更改权限
chmod 777 /usr/local/nexus3/nexus-data
```

3、安装最新版本的nexus并运行容器，记得打开防火墙端口以及安全组策略，否则将无法进行访问

```shell
docker run -d -p 8081:8081 --name docker-nexus3 -v /usr/local/nexus3/nexus-data:/nexus-data sonatype/nexus3
```

4、安装完成，使用linux的ip地址和指定的端口号进行访问。登录后才能创建仓库，进行后面的使用操作。注意密码的所在位置在docker容器的数据卷挂载处也可以看到。

![登录界面](images/2021-09-20-11-31-57.png)

### 使用：

1、配置阿里云代理仓库，当然如果有很多代理需要配置，则可以逐步设置添加多个常用代理

```shell
1、新建仓库(Create repository)
2、选择maven2(proxy)
3、填写仓库名称——maven-aliyun，并填入仓库url http://maven.aliyun.com/nexus/content/groups/public，Cache统一设置为200天 288000
4、将创建的maven-aliyun放入到maven-public（Group类型仓库）中
```

2、Nexus安装后自带maven-releases，maven-snapshots两个仓库，用于将生成的jar包发布在这两个仓库中，在实际开发中需要将maven-releases设置为可以重复发布(Release表示稳定版本，Snapshot表示快照版本，快照版本每次进行maven加载都会拉取最新版，若项目版本号末尾带有 -SNAPSHOT，则会发布到snapshots快照版本仓库,若项目版本号末尾带有 -RELEASES 或什么都不带，则会发布到releases正式版本仓库)，你也可以自己创建自己的私有仓库以及仓库组:

```shell
1、创建两个仓库（使用maven2(hosted)类型的库），分别选择Snapshot 和 Release，命名为（java-snapshout 和 java-release）,将maven-releases设置为可以重复发布
2、创建一个Group类型仓库，将java-release和之前创建的阿里代理库添加其为成员，当客户端拉取jar包的时候，会从阿里云和私有的release库中拉取（命名为java-group）,当然也可以使用maven-public这个Group类型仓库。
```

3、Maven配置私服下载依赖方式：

maven配置私服下载有两种方式:`setting.xml：该文件配置的是全局模式   pom.xml：该文件的配置的是项目独享模式`
若pom.xml和setting.xml同时配置了，以pom.xml为准。注意，http://192.168.6.5:8081是我在虚拟机中搭建的nexus的地址。其中的username也是可以在Nexus中自己创建用户来使用的。

#### setting.xml文件配置

这个时候不需要再配置pom.xml文件，即可使用私服下载jar依赖包

##### 配置私服镜像

```xml
<mirrors>   
    <mirror>
      <!--该镜像的唯一标识符。id用来区分不同的mirror元素。 -->
      <id>nexus-releases</id>
      <!--*指的是访问任何仓库都使用我们的私服-->
      <mirrorOf>*</mirrorOf>    
      <!--该镜像的URL。构建系统会优先考虑使用该URL，而非使用默认的服务器URL。 -->
      <url>http://192.168.6.5:8081/repository/maven-public/</url>     
    </mirror>    
    <mirror>     
      <id>nexus-snapshots</id>     
      <mirrorOf>*</mirrorOf>     
      <url>http://192.168.6.5:8081/repository/maven-snapshots/</url>     
    </mirror>
	<mirror>
      <id>alimaven</id>
      <name>aliyun maven</name>
      <url>http://maven.aliyun.com/nexus/content/groups/public/</url>
      <mirrorOf>central</mirrorOf>        
    </mirror>
  </mirrors>
```

镜像的URL可以从页面中的copy按钮直接复制。

##### 配置从私服下载jar包

```xml
  <profiles>
    <profile>
        <!--profile的id-->
        <id>nexus</id>
        <repositories>
            <repository>
                <!--仓库id，repositories可以配置多个仓库，保证id不重复-->
                <id>nexus-releases</id>
                <!--仓库地址，即nexus仓库组的地址-->
                <url>http://192.168.6.5:8081/repository/maven-public/</url>
                <releases>
                    <!--是否下载releases构件-->
                    <enabled>true</enabled>
                </releases>
                <snapshots>
                    <enabled>true</enabled>
                </snapshots>
            </repository>
            <repository>
                <id>nexus-snapshots</id>
                <url>http://192.168.6.5:8081/repository/maven-snapshots/</url>
                <releases>
                    <enabled>true</enabled>
                </releases>
                <snapshots>
                    <enabled>true</enabled>
                </snapshots>
            </repository>
        </repositories>
        <pluginRepositories>
            <!-- 插件仓库，maven的运行依赖插件，也需要从私服下载插件 -->
            <pluginRepository>
                <!-- 插件仓库的id不允许重复，如果重复后边配置会覆盖前边 -->
                <id>nexus-releases</id>
                <url>http://192.168.6.5:8081/repository/maven-public/</url>
                <releases>
                    <enabled>true</enabled>
                </releases>
                <snapshots>
                    <enabled>true</enabled>
                </snapshots>
            </pluginRepository>
            <pluginRepository>
                <id>nexus-snapshots</id>
                <url>http://192.168.6.5:8081/repository/maven-snapshots/</url>
                <releases>
                    <enabled>true</enabled>
                </releases>
                <snapshots>
                    <enabled>true</enabled>
                </snapshots>
            </pluginRepository>
        </pluginRepositories>
    </profile>  

  </profiles>

  <!--激活profile-->
  <activeProfiles>    
    <activeProfile>nexus</activeProfile>    
  </activeProfiles>
```

#### pom.xml文件配置

如果你配置了pom.xml，则以pom.xml为准

```xml
<repositories>
    <repository>
        <id>maven-nexus</id>
        <name>maven-nexus</name>
        <url>http://192.168.6.5:8081/repository/maven-public/</url>
        <releases>
            <enabled>true</enabled>
        </releases>
        <snapshots>
            <enabled>true</enabled>
        </snapshots>
    </repository>
</repositories>
```

4、配置Maven连接私服打包上传项目

第一步，修改setting.xml文件，指定releases和snapshots server的用户名和密码

```xml
<servers>
    <server>
      <id>releases</id>
      <username>admin</username>
      <password>123456</password>
    </server>
    
    <server>
      <id>snapshots</id>
      <username>admin</username>
      <password>123456</password>
    </server>
</servers>
```

第二步，在项目的pom.xml文件中加入distributionManagement节点。

注意：repository里的id需要和第一步里的server id名称保持一致。

```xml
<distributionManagement>
    <repository>
        <id>releases</id>
        <name>Releases</name>
        <url>http://192.168.6.5:8081/repository/maven-releases/</url>
    </repository>
    <snapshotRepository>
        <id>snapshots</id>
        <name>Snapshot</name>
        <url>http://192.168.6.5:8081/repository/maven-snapshots/</url>
    </snapshotRepository>
</distributionManagement>
```

5、执行发布:`mvn deploy`,登录Nexus，查看对应的仓库已经有相关的依赖包了。

注意：

- 若项目版本号末尾带有 -SNAPSHOT，则会发布到snapshots快照版本仓库
- 若项目版本号末尾带有 -RELEASES 或什么都不带，则会发布到releases正式版本仓库

6、批量上传Maven仓库jar包到Nexus3.x私服的方式：

```shell
1、进入nexus的upload界面单个上传 一般用于公司内部私有jar包的上传
2、使用deploy命令上传，此种方式需要配置pom文件:mvn deploy
3、将需要上传的包上传至linux服务器，再通过linux命令上传
```

## 四、常见问题

注意：在`mvn deploy`时可能会发生以下错误：[参考链接](http://alanhou.org/nexus-maven/)

1、Return code is: 400, ReasonPhrase: Repository does not allow updating assets: maven-releases.

产生这一问题的原因是不允许同版本重复部署，解决方法有：

- 进入录Nexus管理界面–>小齿轮图标–>Repository–>Repositories–>maven-releases，Hosted下方请选择‘Allow redeploy’
- 更推荐的方法是更改本地的版本号，而不是使用相同版本号打包至 Maven

2、提示`500 server error`错误，查看nexus的日志文件可发现：Error occurred while executing a write operation to database ‘component’ due to limited free space on the disk (3610 MB). The database is now working in read-only mode. Please close the database (or stop OrientDB), make room on your hard drive and then reopen the database. The minimal required space is 4096 MB. Required space is now set to 4096MB (you can change it by setting parameter storage.diskCache.diskFreeSpaceLimit) . DB name=”component”. -> [Help 1]

这一问题是由于默认要求在写入时要有4GB 的空闲空间，只需修改配置文件即可，位于安装目录下的bin/nexus.vmoptions文件中，由于上面使用的是 Docker安装，Alan 暂未深入研究如何将配置文件挂载到本机中，临时解决的方案是：

```shell
docker cp nexus:/opt/sonatype/nexus/bin/nexus.vmoptions /tmp
# 修改完成后再拷贝回去进行覆盖
# 如添加或修改参数-Dstorage.diskCache.diskFreeSpaceLimit=2048
docker cp /tmp/nexus.vmoptions nexus:/opt/sonatype/nexus/bin/nexus.vmoptions
docker container restart nexus
```

此时再使用`mvn deploy`命令就可以上传文件到私有maven仓库了。





