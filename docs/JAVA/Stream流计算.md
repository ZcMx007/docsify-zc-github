# Stream 流计算

jdk1.8 版本及以上添加的新特性，Stream 流可以说是 Java8 新特性中用起来最爽的一个功能了，有了它，从此操作合告别繁琐的 for 循环。它与 Java I0 框架中的 InputStream 和 OutputStream 非常类似。但是实际上，它们完是不同的东西。Java8 Stream 使用的是函数式编程模式，如同它的名字一样，它可以被用来对集合进行链状流式的操作。
本文参照<https://juejin.cn/post/6844903830254010381#heading-6>,感谢犬小哈大大！

## 简单示例

```java
List<String> myList =
    Arrays.asList("a1", "a2", "b1", "c2", "c1");

myList
    .stream() // 创建流
    .filter(s -> s.startsWith("c")) // 执行过滤，过滤出以 c 为前缀的字符串
    .map(String::toUpperCase) // 转换成大写
    .sorted() // 排序
    .forEach(System.out::println); // for 循环打印

// C1
// C2
```

我们可以对流进行中间操作或者终端操作:

- 1、中间操作会再次返回一个流，所以，我们可以链接多个中间操作，注意这里是不用加分号的。上图中的 filter 过滤，map 对象转换，sorted 排序，就属于中间操作。
- 2、终端操作是对流操作的一个结束动作，一般返回 void 或者一个非流的结果。上图中的 forEach 循环 就是一个终止操作。

## Stream 流创建方式

一个数据源（如： 集合 Collection、数组 Array）， 获取一个流。

- 1、通过 Collection 系列集合提供的 stream()方法或者 parallelStream()方法来创建 Stream。parallelStream 表示创建并行流。流是可以并行执行的，当流中存在大量元素时，可以显著提升性能。并行流底层使用的 ForkJoinPool[ForkJoin:工作窃取，化大为小，分治思想], 它由 ForkJoinPool.commonPool()方法提供。可以在已存在的数据流上调用中间方法 parallel()，将串行流转换为并行流。

  ```java
  ForkJoinPool commonPool = ForkJoinPool.commonPool(); //获取底层的线程池大小
  System.out.println(commonPool.getParallelism());    // 我的是8 具体取决于电脑的 CPU 可用核心数
  -Djava.util.concurrent.ForkJoinPool.common.parallelism=5   //jvm参数设置
  ```

- 2、通过 Arrays 中的静态方法 stream()获取数组流。
- 3、通过 Stream 类的静态方法 of()获取数组流。
- 4、创建无限流
  可以使用静态方法 Stream.iterate() 和 Stream.generate(), 创建无限流。iterate()方法主要是使用“迭代”的方式生成无限流，而 generate()方法主要是使用“生成”的方式生成无限流
  - 1、generate(Supplier<T> s)
  - 2、iterate(T seed, UnaryOperator<T> f)
  - 3、使用 Stream 的 limit(long maxSize)方法控制长度
- 5、创建空流，Stream 类中提供了一个 empty()方法：empty() [返回一个空的顺序 Stream 。 ]

## Stream 流的处理顺序

我们需要明确一点，那就是中间操作的有个重要特性 —— 延迟性。当且仅当存在终端操作时，中间操作才会被执行。

垂直执行：即遍历的每个流元素会像链式调用一样，挨个执行调用链[符合条件，继续往链的下方执行；不符合，中断，执行下一个流元素的链]，
水平执行：每个流元素在执行到某个链节点[该节点是水平执行的话]，会等待全部执行完成后，再将结果流元素集合依次往下执行。水平执行会等待所有流元素执行完成后再开始新一轮的中间操作。打个不太恰当的比喻：在上学春游的时候，老师会和学生约定一个中间休息点，游玩的时候，每个人去的地方是不一样的，这个时候就是垂直执行，互不干涉。到了中午，学生们要去指定的集合点集合，老师会等所有人到齐后清点人数，此时就是水平执行。清点休息完成后，又再次游玩，此时又是垂直执行了。当然，如果说有些学生在游玩过程中身体不舒服和老师说明后回家了，那后面的垂直或水平执行都将与该学生无关了（filter 水平执行中间操作）。

而且数据流的链式调用几乎是垂直执行的，有一则例外不是，那就是中间操作 sorted，它是水平执行的。我们知道，由于垂直执行的特性，因此我们调整中间操作次序[比如将筛选的中间操作 filter 移动到链头的最开始]会大大提高程序的运行效率，而 sorted 是一个有状态的操作，因为它需要在处理的过程中，保存状态以对集合中的元素进行排序。因此它是水平执行的[我唯一已知的水平执行中间操作]。那么为了追求程序的执行效率，我们应该保证的是尽量将垂直执行放在前面，如果有筛选操作的话应该放在最前面，而水平执行（sorted）应作为流操作的一个收尾工作放在最后。

## 数据流复用问题

Java8 Stream 流是不能被复用的，一旦你调用任何终端操作，流就会关闭。我们可以通过 Supplier 来包装一下流，通过 get() 方法来构建一个新的 Stream 流。

```java
Supplier<Stream<String>> streamSupplier =
    () -> Stream.of("d2", "a2", "b1", "b3", "c")
            .filter(s -> s.startsWith("a"));

streamSupplier.get().anyMatch(s -> true);   // ok
streamSupplier.get().noneMatch(s -> true);  // ok
```

## Stream 高级操作

详细教程参照：<https://juejin.cn/post/6844903830254010381#heading-6>

### Collect

collect 是一个非常有用的终端操作，它可以将流中的元素转变成另外一个不同的对象，例如一个 List，Set 或 Map。collect 接受入参为 Collector（收集器），它由四个不同的操作组成：供应器（supplier）、累加器（accumulator）、组合器（combiner）和终止器（finisher）。

### FlatMap

上面我们已经学会了如通过 map 操作, 将流中的对象转换为另一种类型。但是，Map 只能将每个对象映射到另一个对象。
如果说，我们想要将一个对象转换为多个其他对象或者根本不做转换操作呢？这个时候，flatMap 就派上用场了。
FlatMap 能够将流的每个元素, 转换为其他对象的流。因此，每个对象可以被转换为零个，一个或多个其他对象，并以流的方式返回。之后，这些流的内容会被放入 flatMap 返回的流中。

### Reduce

规约操作可以将流的所有元素组合成一个结果。Java 8 支持三种不同的 reduce 方法。第一种将流中的元素规约成流中的一个元素；第二种 reduce 方法接受标识值和 BinaryOperator 累加器。第三种 reduce 方法接受三个参数：标识值，BiFunction 累加器和类型的组合器函数 BinaryOperator。在第三种 Reduce 方法中，如果使用并行流的执行方式，那么累加器将被并行调用，因此还需要一个组合器用于计算部分累加值的总和。如果是串行执行则不需要，这点在使用并行流提高效率时需要注意到。当然，尽管多计算了一步，但使用并行流还是会比串行流更快，毕竟多核！
