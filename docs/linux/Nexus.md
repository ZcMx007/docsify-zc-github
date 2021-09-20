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

> 参考[链接1](https://www.cnblogs.com/wuwei928/p/10338307.html),[链接2](https://www.cnblogs.com/yanchuanbin/p/15107979.html)

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

2、Nexus安装后自带maven-releases，maven-snapshots两个仓库，用于将生成的jar包发布在这两个仓库中，在实际开发中需要将maven-releases设置为可以重复发布(Release表示稳定版本，Snapshot表示快照版本，快照版本每次进行maven加载都会拉取最新版，)，你也可以自己创建自己的私有仓库以及仓库组:

```shell
1、创建两个仓库（使用maven2(hosted)类型的库），分别选择Snapshot 和 Release，命名为（java-snapshout 和 java-release）,将maven-re若项目版本号末尾带有 -SNAPSHOT，则会发布到snapshots快照版本仓库leases设置为可以重复发布
2、创建一个Group类型仓库，将java-release和之前创建的阿里代理库添加其为成员，当客户端拉取jar包的时候，会从阿里云和私有的release库中拉取（命名为java-group）,当然也可以使用maven-public这个Group类型仓库。
```

3、修改maven的setting.xml文件，注意，此处的http://192.168.6.5:8081是我在虚拟机中搭建的nexus的地址。其中的username也是可以在Nexus中自己创建用户来使用的。

```xml
<?xml version="1.0" encoding="UTF-8"?>

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!--
 | This is the configuration file for Maven. It can be specified at two levels:
 |
 |  1. User Level. This settings.xml file provides configuration for a single user,
 |                 and is normally provided in ${user.home}/.m2/settings.xml.
 |
 |                 NOTE: This location can be overridden with the CLI option:
 |
 |                 -s /path/to/user/settings.xml
 |
 |  2. Global Level. This settings.xml file provides configuration for all Maven
 |                 users on a machine (assuming they're all using the same Maven
 |                 installation). It's normally provided in
 |                 ${maven.conf}/settings.xml.
 |
 |                 NOTE: This location can be overridden with the CLI option:
 |
 |                 -gs /path/to/global/settings.xml
 |
 | The sections in this sample file are intended to give you a running start at
 | getting the most out of your Maven installation. Where appropriate, the default
 | values (values used when the setting is not specified) are provided.
 |
 |-->
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <!-- localRepository
   | The path to the local repository maven will use to store artifacts.
   |
   | Default: ${user.home}/.m2/repository
  -->
  <localRepository>${user.home}/.m2/repository</localRepository>

  <!-- interactiveMode
   | This will determine whether maven prompts you when it needs input. If set to false,
   | maven will use a sensible default value, perhaps based on some other setting, for
   | the parameter in question.
   |
   | Default: true
  <interactiveMode>true</interactiveMode>
  -->

  <!-- offline
   | Determines whether maven should attempt to connect to the network when executing a build.
   | This will have an effect on artifact downloads, artifact deployment, and others.
   |
   | Default: false
  <offline>false</offline>
  -->

  <!-- pluginGroups
   | This is a list of additional group identifiers that will be searched when resolving plugins by their prefix, i.e.
   | when invoking a command line like "mvn prefix:goal". Maven will automatically add the group identifiers
   | "org.apache.maven.plugins" and "org.codehaus.mojo" if these are not already contained in the list.
   |-->
  <pluginGroups>
    <!-- pluginGroup
     | Specifies a further group identifier to use for plugin lookup.
    <pluginGroup>com.your.plugins</pluginGroup>
    -->
  </pluginGroups>

  <!-- proxies
   | This is a list of proxies which can be used on this machine to connect to the network.
   | Unless otherwise specified (by system property or command-line switch), the first proxy
   | specification in this list marked as active will be used.
   |-->
  <proxies>
    <!-- proxy
     | Specification for one proxy, to be used in connecting to the network.
     |
    <proxy>
      <id>optional</id>
      <active>true</active>
      <protocol>http</protocol>
      <username>proxyuser</username>
      <password>proxypass</password>
      <host>proxy.host.net</host>
      <port>80</port>
      <nonProxyHosts>local.net|some.host.com</nonProxyHosts>
    </proxy>
    -->
  </proxies>

  <!-- servers
   | This is a list of authentication profiles, keyed by the server-id used within the system.
   | Authentication profiles can be used whenever maven must make a connection to a remote server.
   |-->
  <servers>
    <!-- server
     | Specifies the authentication information to use when connecting to a particular server, identified by
     | a unique name within the system (referred to by the 'id' attribute below).
     |
     | NOTE: You should either specify username/password OR privateKey/passphrase, since these pairings are
     |       used together.
     |
    -->
    
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

    <!-- Another sample, using keys to authenticate.
    <server>
      <id>siteServer</id>
      <privateKey>/path/to/private/key</privateKey>
      <passphrase>optional; leave empty if not used.</passphrase>
    </server>
    -->
  </servers>

  <!-- mirrors
   | This is a list of mirrors to be used in downloading artifacts from remote repositories.
   |
   | It works like this: a POM may declare a repository to use in resolving certain artifacts.
   | However, this repository may have problems with heavy traffic at times, so people have mirrored
   | it to several places.
   |
   | That repository definition will have a unique id, so we can create a mirror reference for that
   | repository, to be used as an alternate download site. The mirror site will be the preferred
   | server for that repository.
   |-->
  <mirrors>
    <!-- mirror
     | Specifies a repository mirror site to use instead of a given repository. The repository that
     | this mirror serves has an ID that matches the mirrorOf element of this mirror. IDs are used
     | for inheritance and direct lookup purposes, and must be unique across the set of mirrors.
     |
    -->
    <mirror>
      <id>HolliParkMirror</id>
      <mirrorOf>*</mirrorOf>
      <name>HolliPark Repository Mirror.</name>
      <url>http://192.168.6.5:8081/nexus/repository/maven-public/</url>
    </mirror>
       
  </mirrors>

  <!-- profiles
   | This is a list of profiles which can be activated in a variety of ways, and which can modify
   | the build process. Profiles provided in the settings.xml are intended to provide local machine-
   | specific paths and repository locations which allow the build to work in the local environment.
   |
   | For example, if you have an integration testing plugin - like cactus - that needs to know where
   | your Tomcat instance is installed, you can provide a variable here such that the variable is
   | dereferenced during the build process to configure the cactus plugin.
   |
   | As noted above, profiles can be activated in a variety of ways. One way - the activeProfiles
   | section of this document (settings.xml) - will be discussed later. Another way essentially
   | relies on the detection of a system property, either matching a particular value for the property,
   | or merely testing its existence. Profiles can also be activated by JDK version prefix, where a
   | value of '1.4' might activate a profile when the build is executed on a JDK version of '1.4.2_07'.
   | Finally, the list of active profiles can be specified directly from the command line.
   |
   | NOTE: For profiles defined in the settings.xml, you are restricted to specifying only artifact
   |       repositories, plugin repositories, and free-form properties to be used as configuration
   |       variables for plugins in the POM.
   |
   |-->
  <profiles>
    <profile>
      <id>HolliPark</id>
      <repositories>
        <repository>
          <id>nexus</id>
          <name>Public Repositories</name>
          <url>http://192.168.6.5:8081/nexus/repository/maven-public/</url>
          <releases>
            <enabled>true</enabled>
          </releases>
        </repository>
      
        <repository>
          <id>central</id>
          <name>Central Repositories</name>
          <url>http://192.168.6.5:8081/nexus/repository/maven-central/</url>
          <releases>
            <enabled>true</enabled>
          </releases>
          <snapshots>
            <enabled>false</enabled>
          </snapshots>
        </repository>
        
        <repository>
          <id>release</id>
          <name>Release Repositories</name>
          <url>http://192.168.6.5:8081/nexus/repository/maven-releases/</url>
          <releases>
            <enabled>true</enabled>
          </releases>
          <snapshots>
            <enabled>false</enabled>
          </snapshots>
        </repository>
        
        <repository>
          <id>snapshots</id>
          <name>Snapshot Repositories</name>
          <url>http://192.168.6.5:8081/nexus/repository/maven-snapshots/</url>
          <releases>
            <enabled>true</enabled>
          </releases>
          <snapshots>
            <enabled>true</enabled>
          </snapshots>
        </repository>
      </repositories>
      
      <pluginRepositories>
        <pluginRepository>
          <id>plugins</id>
          <name>Plugin Repositories</name>
          <url>http://192.168.6.5:8081/nexus/repository/maven-public/</url>
        </pluginRepository>
      </pluginRepositories>
    </profile>
    <!-- profile
     | Specifies a set of introductions to the build process, to be activated using one or more of the
     | mechanisms described above. For inheritance purposes, and to activate profiles via <activatedProfiles/>
     | or the command line, profiles have to have an ID that is unique.
     |
     | An encouraged best practice for profile identification is to use a consistent naming convention
     | for profiles, such as 'env-dev', 'env-test', 'env-production', 'user-jdcasey', 'user-brett', etc.
     | This will make it more intuitive to understand what the set of introduced profiles is attempting
     | to accomplish, particularly when you only have a list of profile id's for debug.
     |
     | This profile example uses the JDK version to trigger activation, and provides a JDK-specific repo.
    <profile>
      <id>jdk-1.4</id>

      <activation>
        <jdk>1.4</jdk>
      </activation>

      <repositories>
        <repository>
          <id>jdk14</id>
          <name>Repository for JDK 1.4 builds</name>
          <url>http://www.myhost.com/maven/jdk14</url>
          <layout>default</layout>
          <snapshotPolicy>always</snapshotPolicy>
        </repository>
      </repositories>
    </profile>
    -->
    
    <!--
     | Here is another profile, activated by the system property 'target-env' with a value of 'dev',
     | which provides a specific path to the Tomcat instance. To use this, your plugin configuration
     | might hypothetically look like:
     |
     | ...
     | <plugin>
     |   <groupId>org.myco.myplugins</groupId>
     |   <artifactId>myplugin</artifactId>
     |
     |   <configuration>
     |     <tomcatLocation>${tomcatPath}</tomcatLocation>
     |   </configuration>
     | </plugin>
     | ...
     |
     | NOTE: If you just wanted to inject this configuration whenever someone set 'target-env' to
     |       anything, you could just leave off the <value/> inside the activation-property.
     |
    <profile>
      <id>env-dev</id>

      <activation>
        <property>
          <name>target-env</name>
          <value>dev</value>
        </property>
      </activation>

      <properties>
        <tomcatPath>/path/to/tomcat/instance</tomcatPath>
      </properties>
    </profile>
    -->
  </profiles>

  <!-- activeProfiles
   | List of profiles that are active for all builds.
   |
  <activeProfiles>
    <activeProfile>alwaysActiveProfile</activeProfile>
    <activeProfile>anotherAlwaysActiveProfile</activeProfile>
  </activeProfiles>
  -->
  
  <activeProfiles>
    <activeProfile>HolliPark</activeProfile>
  </activeProfiles>
  
</settings>
```

4、创建私有公库。

```shell
1、在IDEA中创建普通的maven项目
2、修改项目的pom.xml：在pom文件中加入distributionManagement节点，注意：pom.xml中repository里的id需要和.m2中setting.xml里的server id名称保持一致
3、发布私有公库：mvn deploy
```

pom文件：

```xml
<distributionManagement>
    <repository>
        <id>releases</id>
        <name>Nexus Release Repository</name>
        <url>http://192.168.6.5:8081/nexus/repository/maven-releases/</url>
    </repository>
    <snapshotRepository>
        <id>snapshots</id>
        <name>Nexus Snapshot Repository</name>
        <url>http://192.168.6.5:8081/nexus/repository/maven-snapshots/</url>
    </snapshotRepository>
</distributionManagement>
```

5、批量上传Maven仓库jar包到Nexus3.x私服的方式：

```shell
1、进入nexus的upload界面单个上传
2、使用deploy命令上传，此种方式需要配置pom文件
3、将需要上传的包上传至linux服务器，再通过linux命令上传
```





