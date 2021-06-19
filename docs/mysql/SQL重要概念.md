# 有关SQL书写的基本素养

## 何为驱动表和被驱动表

mysql在进行表连接的时候是会将连接的主表设置为驱动表，被连接的从表设置为被驱动表；当然，如果连接为全外连接或者是内连接，则MySQL会自动取数据量小的表作为驱动表，数据量大的作为被驱动表。一般来说，我们会把数据量小的设置为驱动表，因为驱动表的大小关联着连接的次数，例如A表有100条数据,B表有10000条数据，那么将A表作为驱动表则只需要进行100次连接，而将B表作为驱动表则需要10000次连接；注意只有被驱动表可以使用索引，因此我们把大表作为被驱动表的同时，也可以同时为大表建立索引。

## Exist和IN的区别

Exist和IN的用法极其相似，都是用来进行数据删选的；但Exist适合主表小从表大的情况，而IN适合主表大从表小的情况。而且无论是Exist还是NOTEXIST，他们都能使用索引进行SQL优化查询，但是NOT IN无法使用索引，必是使用全局进行判断搜索的。

## 大小写区分

众所周知，linux下mysql安装完后是默认：区分表名的大小写，不区分列名的大小写；MySQL在Linux下数据库名、表名、列名、别名大小写规则是这样的：
　　 1、数据库名与表名是严格区分大小写的；
　　 2、表的别名是严格区分大小写的；
　　 3、列名与列的别名在所有的情况下均是忽略大小写的；
　　 4、变量名也是严格区分大小写的；
而MySQL在Windows下都不区分大小写。
但是有一种比较特殊情况需要注意，那就是如何给mysql的字段值区分大小写，有三种常用的解决方案：

- 1、查询时指定大小写敏感，在查询时指定大小写“敏感”，加关键字“BINARY”

```mysql
mysql> select guid,type,parent_guid from api_assets where BINARY guid='3rfI2PsSrCz91mTMDgrZjE';
```

- 2、定义表结构时指定字段大小写敏感,关键字“BINARY”指定guid字段大小写敏感

```mysql
CREATE TABLE `api_assets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `guid` varchar(255) BINARY NOT NULL,
  ……
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

MySQL允许在大多数字符串类型上使用BINARY关键字，用于指明所有针对该字段的运算是大小写敏感的

- 3、修改排序规则（COLLATION）

```mysql
mysql> show variables like 'collation\_database';
+--------------------+-----------------+
| Variable_name | Value |
+--------------------+-----------------+
| collation_database | utf8_general_ci |
+--------------------+-----------------+
```

Collation以 "_ci"结尾的不区分大小写（ci——Case Ignore），以"_bin"或者"_cs"结尾的区分大小写,将Collation改为 utf8_bin（大小写敏感的），可以为库、表、列指定Collation，优先级为 列>表>库

最简单的一种方式，使用navicat工具打开设计表，更改字符集排序规则为utf8_bin(只要带"_bin"/"_cs"就行，表示区分大小写，不建议使用"_cs"，作用和"_bin"一致，但是"_bin"排序规则还能存储二进制数据，如果以"_ci"结尾，则表示[case ignore]不区分大小写。)

utf8_general_ci和utf8_unicode_ci相比，utf8_general_ci更快，没有utf8_unicode_ci准确，但够用。
