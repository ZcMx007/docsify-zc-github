# JVM的各项参数设置

-XX：MaxMetaspaceSize：设置元空间最大值，默认是-1，即不限制，或者说只受限于本地内存
大小。

-XX：MetaspaceSize：指定元空间的初始空间大小，以字节为单位，达到该值就会触发垃圾收集
进行类型卸载，同时收集器会对该值进行调整：如果释放了大量的空间，就适当降低该值；如果释放
了很少的空间，那么在不超过-XX：MaxMetaspaceSize（如果设置了的话）的情况下，适当提高该值。

-XX：MinMetaspaceFreeRatio：作用是在垃圾收集之后控制最小的元空间剩余容量的百分比，可
减少因为元空间不足导致的垃圾收集的频率。

-XX：Max-MetaspaceFreeRatio，用于控制最大的元空间剩余容量的百分比。

-XX：MaxDirectMemorySize，指定直接内存（Direct Memory）的容量大小，如果不
去指定，则默认与Java堆最大值（由-Xmx指定）一致


