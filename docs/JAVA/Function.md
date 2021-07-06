# Function

众所周知，在java8版本的java.util.function包下存在Consumer（消费型）、Supplier（供给型）、Predicate（谓词型[谓词太过宽泛，我一般将其称之为断言型]）、Function（功能型）四个接口，这四个接口起着润物细无声的作用，是十分重要的。因此经过多方资料查询加上自己的理解，决定将其整理成一篇知识文档。

## 来源

其实在学习这个知识点之前，有一点我是十分好奇的，那就是究竟是什么导致这四个接口诞生的？为什么java8之前没有这种接口的定义？答案已经呼之欲出了，没错，就是java8新增了lambda的新特性，为了迎合lamdba写法，还特意定义了一个接口注解标明，那就是@FunctionalInterface(函数式接口)：所谓函数式接口，就是该接口中只能有一个需要被实现的方法(可以使用default和static定义，default方法无法通过接口名直接调用，static方法是类方法，可以通过接口名直接调用。)观察以上四个接口的源码，我发现都是函数式接口。定义成函数式接口有什么好处呢？好处就是可以使用lambda方式简写,并且函数式接口还可以使用既有的方法自动生成特定的接口实现对象[这种方式在每种接口的实例都会展示]，下面将会一一说明。

以下是通过已有方法自动接口实现代码的引用类，注意：如果想使用类似于System.out::println的方式引用，而不使用new关键字，只需要将该方法定义为类方法即可。

```java
public class MyFunction {
	public void consumerText(String text) {
		System.out.println("MyFunction消费了数据："+text);
	}
	public String supplierStr() {
		return "helloWorld" + UUID.randomUUID().toString().replaceAll("-", "");
	}

	public boolean predicateLargeThanFive(int num) {
		return num > 5;
	}

	public int[] functionStrConvertToInt(String string) {
		char[] chars = string.toCharArray();
		int[] result = new int[chars.length];
		for (int i = 0; i < chars.length; i++) {
			//Character.getNumericValue()方法是将字符转换成了BCD码，默认A-Z和a-z都是对应的10-35，这与Unicode规范无关，因为Unicode标准并没有
			// 给这些字符赋予数值,无需烦恼
			result[i] = Character.getNumericValue(chars[i]);
		}
		return result;
	}
}
```

## Consumer接口(有输入，无输出)

### 说明

字面意思理解Consumer接口指的就是消费型接口。通过"消费"一词得出该函数接口主要用于对传入对象的解析处理，并且没有显式输出。

### 源码分析

```Consumer.interface
package java.util.function;

import java.util.Objects;
@FunctionalInterface
public interface Consumer<T> {

    void accept(T t);

    default Consumer<T> andThen(Consumer<? super T> after) {
        Objects.requireNonNull(after);
        return (T t) -> { accept(t); after.accept(t); };
    }
}
```

可以看到其中只有两个方法：分别是accept方法和使用default定义的andThen方法，accept方法是消费型接口的核心方法，可以使用lambda方式重写或引用既有的方法自动生成接口实现对象，它用于接收一个泛型的对象，并且没有返回值。那么，称之为消费型接口就情有可原了。因为它只做处理（消费），没有显示的输出（return）。andThen方法是该接口的一个接口默认方法，可以被消费接口的实现对象调用，接收的是另一个消费接口实现对象，返回的是一个新的accept方法组合的消费接口实现对象，需要注意的是接口接收的消费对象必须类型相同。根据分析结果，说明我们可以对消费实现接口对象进行不断消费哈哈，真他喵形象——我想起开心的事儿！一个梗能被不断消费，不是么？

简单来说：消费型接口就是输入参数，然后在方法中对传入的参数进行处理(没有显示的输出)，并且能够被重复消费，就是这么简单！

### 实例

- 1、通常使用方式

```java
@Test
	public void normalConsumer() {
		Consumer<String> consumer = new Consumer<String>() {
			@Override
			public void accept(String s) {
				System.out.println("消费接口消费了：" + s);
			}
		};
		consumer.accept("hello");
	}
```

- 2、lambda使用方式

```java
@Test
	public void lambdaConsumer() {
		Consumer<String> consumer = t -> {
			System.out.println("使用lambda表达式生成的消费型接口消费了：" + t);
		};
		consumer.accept("world");
	}
```

- 3、引用方法使用方式

```java
@Test
	public void autoGenerateConsumerByExistsFunction() {
		MyFunction myFunction = new MyFunction();
		Consumer<String> consumer = myFunction::consumerText;
		consumer.accept("你好");
	}
```

- 4、模拟真实混用场景

案例一：

```java
@Test
	public void realConsumerModel1() {
		Consumer<String> consumer = t -> System.out.println("我老婆生孩子了，消费了：" + t);
		Consumer<String> consumerComplex = consumer.andThen(k -> System.out.println("我家孩子考上了重点一本，消费了：" + k)).andThen(i -> System.out.println("刀妹又被削了，消费了：" + i));
		consumerComplex.accept("我想起开心的事！");
	}
```

案例二：

```java
@Test
	public void realConsumerModel2() {
		List<Integer> consumerDataList = Arrays.asList(1, 2, 3, 4, 5, 6);
		AtomicReference<Integer> sum = new AtomicReference<>(0);
		consumerDataList.forEach(t->{
			//书写代码逻辑，例如求和 数据可以被消费到可访问的变量中 由于forEach存在并发风险，因此使用AtomicReference类保证原子操作的一致性
			sum.set(sum.get() + t);
		});
		//输入消费后的结果
		System.out.println("sum=" + sum);
	}
```

## Supplier接口(无输入，有输出)

### 说明

该函数接口主要用于临时数据处理存储，以供后续的程序方便使用。特点：只能使用一次，不能链式调用，程序中使用的很多

### 源码分析

```Supplier.interface
@FunctionalInterface
public interface Supplier<T> {
    T get();
}
```

注明供给的数据类型，以方便其他程序调用使用。

### 案例

- 1、通常使用方式

```java
@Test
	public void normalSupplier() {
		Supplier<String> supplier = new Supplier<String>() {
			@Override
			public String get() {
				return UUID.randomUUID().toString();
			}
		};
		System.out.println("供给了uuid数据：" + supplier.get());
	}
```

- 2、lambda使用方式

```java
@Test
	public void lambdaSupplier() {
		Supplier<String> supplier = () -> String.valueOf(Math.random());
		System.out.println("供给了随机数的字符串数据：" + supplier.get());
	}
```

- 3、引用方法使用方式

```java
@Test
	public void autoGenerateSupplierByExistsFunction() {
		MyFunction myFunction = new MyFunction();
		Supplier<String> supplier = myFunction::supplierStr;
		System.out.println("通过已存在方法供给了数据：" + supplier.get());
	}
```

- 4、模拟真实混用场景

```java
@Test
	public void realSupplierModel() {
		Stream<Integer> stream = Stream.of(1, 2, 3, 4, 5);
		//返回一个optional对象 filer中就是接下来要说的断言函数
		Optional<Integer> first = stream.filter(i -> i > 5)
				.findFirst();

		//optional对象有需要Supplier接口的方法
		//orElse，如果first中存在数，就返回这个数，如果不存在，就放回传入的数
		System.out.println(first.orElse(1));
		System.out.println(first.orElse(7));

		System.out.println("********************");

		//返回一个随机值
		Supplier<Integer> supplier = () -> new Random().nextInt();

		//orElseGet，如果first中存在数，就返回这个数，如果不存在，就返回supplier返回的值
		System.out.println(first.orElseGet(supplier));
	}
```

## Predicate接口(有输入，输出必须为boolean类型)

### 说明

该函数接口主要根据指定的对象的类型进行内容匹配判断，并输出断言结果。

### 源码分析

```Predicate.interface
@FunctionalInterface
public interface Predicate<T> {
    boolean test(T t);
    default Predicate<T> and(Predicate<? super T> other) {
        Objects.requireNonNull(other);
        return (t) -> test(t) && other.test(t);
    }
    default Predicate<T> negate() {
        return (t) -> !test(t);
    }
    default Predicate<T> or(Predicate<? super T> other) {
        Objects.requireNonNull(other);
        return (t) -> test(t) || other.test(t);
    }
    static <T> Predicate<T> isEqual(Object targetRef) {
        return (null == targetRef)
                ? Objects::isNull
                : object -> targetRef.equals(object);
    }
}
```

观察源码，我们可以发现，其中定义了三个接口实现对象方法以及一个类方法。类方法主要用于简单的判断实现，如果只是为了简单指定一个判断的对象类型加以equals判断，完全可以直接引用其类方法（为了展示不同方式的区别，下文的案例并没有这样操作），最重要的是他可以返回一个该函数的实现接口对象，通过该实现接口对象我们又能够调用它的三个实现接口对象方法。这三个实现接口对象方法分别相当于&&、||、!的操作，可能会有人问，那为什么不直接使用这种逻辑判断符呢，我想应该是为了可以进行更复杂的判断所准备的？当然不完全是，可以发现我们的方法形参是可以指定这种函数式接口类型的，从上面的案例中的```stream.filter(i -> i > 5)```就可以看出它的作用不单单如此了。

### 案例

- 1、通用使用方式

```java
@Test
	public void normalPredicate() {
		Predicate<String> predicate = new Predicate<String>() {
			@Override
			public boolean test(String s) {
				return s.length() > 5;
			}
		};
		System.out.println("普通断言结果：" + predicate.test("hello"));
	}
```

- 2、lambda使用方式

```java
@Test
	public void lambdaPredicate() {
		Predicate<String> predicate = s -> s.length() > 5;
		System.out.println("lambda断言结果：" + predicate.test("hello world"));
	}
```

- 3、引用方法使用方式

```java
@Test
	public void autoGeneratePredicateByExistsFunction() {
		Predicate<Integer> predicate = new MyFunction()::predicateLargeThanFive;
		System.out.println("引用方法断言结果：" + predicate.test(4));
	}
```

- 4、模拟真实业务混合使用

```java
@Test
	public void realPredicateModel() {
		Predicate<Object> predicate = Predicate.isEqual("hello");
		//初始断言是对"hello"字符串的比对断言，后续又对该断言进行了其他断言操作 结构大概是 !((obj.equals("hello")&&(obj.length<6))||(obj.Class==Integer.Class))
		Predicate<Object> judge = predicate.and(s -> String.valueOf(s).length() < 6).or(t -> t.getClass() == Integer.class).negate();
		System.out.println("真实环境模拟断言输出：" + judge.test("hello")); //false
		System.out.println("真实环境模拟断言输出：" + judge.test(1)); //false
		System.out.println("真实环境模拟断言输出：" + judge.test("real")); //true
	}
```

## Function(有输入[转换对象]，有输出[被转换对象])

### 说明

该函数接口的作用是将对象转换成另一种类型的对象，当我们需要将某种对象类型转换的时候，可以很轻松地使用它来简化代码。特点，类型转换，实用。

### 源码分析

```Function.interface
@FunctionalInterface
public interface Function<T, R> {
    R apply(T t);
    default <V> Function<V, R> compose(Function<? super V, ? extends T> before) {
        Objects.requireNonNull(before);
        return (V v) -> apply(before.apply(v));
    }
    default <V> Function<T, V> andThen(Function<? super R, ? extends V> after) {
        Objects.requireNonNull(after);
        return (T t) -> after.apply(apply(t));
    }
    static <T> Function<T, T> identity() {
        return t -> t;
    }
}
```

通过以上源码，我们可以很清晰的看到该函数接口定义了两个函数接口对象方法以及一个类方法，类方法和断言函数接口的类方法有点类似，都会返回一个当前的函数接口对象，同时该函数对象中的操作是不加以任何转化操作直接将输入的对象输出。最大的特点是不用显示的定义一个函数接口对象，而是在调用该类方法时自动生成一个函数接口对象后通过调用它的两个函数接口对象方法来做进一步的转换操作处理工作。两个函数接口对象方法分别是在转换前转换一次（compose，改变输入）,以及在转换后转换一次（after，改变输出）。当时看到这我是有点疑惑的，为什么在方法名前都有一个<V>的泛型定义。后来查阅书籍，原来是对不确定泛型对象的声明，这种泛型声明需要定义在方法名前。为什么说是不确定泛型对象呢？因为其实类上也是可以定义泛型的，这种泛型其实在创建该类对象时就已经确定了，所以在该类中如果还有使用到该泛型的形参对象是不用在方法上特意声明泛型的，但如果是类方法中的泛型(创建对象前操作)或泛型在创建对象后依然不确定，那就是不确定的泛型，需要显式的声明才能使用。

### 案例

- 1、通用使用方式

```java
@Test
	public void normalFunction() {
		Function<Character, Integer> charConvertInt = new Function<Character, Integer>() {
			@Override
			public Integer apply(Character c) {
				return Character.getNumericValue(c);
			}
		};
		System.out.println("普通Function转换结果为：" + charConvertInt.apply('c'));
	}
```

- 2、lambda使用方式

```java
@Test
	public void lambdaFunction() {
		Function<Character, Integer> charConvertInt = c -> Character.getNumericValue(c);
		System.out.println("lambdaFunction转换结果为：" + charConvertInt.apply('c'));
	}
```

- 3、引用方法使用方式

```java
@Test
	public void autoGenerateFunctionByExistsFunction() {
		Function<String, int[]> function = new MyFunction()::functionStrConvertToInt;
		int[] hellos = function.apply("hello");
		System.out.println("引用方法转换结果：");
		for (int i = 0; i < hellos.length; i++) {
			System.out.println(hellos[i]);
		}
	}
```

- 4、模拟真实场景混合使用

```java
@Test
	public void realFunctionModel() {
		Function<Object, Object> identity = Function.identity();
		//此处是先根据Function内置的静态方法自动生成了Function，将其作为一个中间媒介，再改变它的输入(String)输出(int)
		Function<Object, Integer> compose = identity.andThen(c -> Character.getNumericValue((Character) c)).compose(s -> ((String) s).toCharArray()[0]);
		System.out.println("真实环境模函数输出："+compose.apply("hello")); //结果为17
	}
```

## 总结

Consumer接口(有输入，无输出)，Supplier接口(无输入，有输出)，Predicate接口(有输入，输出必须为boolean类型)，Function(有输入[转换对象]，有输出[被转换对象])；由于可以简单的通过lambda生成这四种函数接口实现对象以及灵活的通过引用现有的方法来巧妙生成函数接口实现对象[注意出参入参的对应关系即可]，因此，灵活熟练的使用可以加快我们的开发效率。还有一点需要注意的是，这四种函数接口可以被定义在方法形参中供方法动态使用(相当于JS中的传参是函数类型[由于js对传递的参数没有显式类型约束，因此可以传递任何类型的参数，包括函数],而java中是不能使用显式的函数/方法来定义形参接参的，只能定义这几种函数接口类型，相当于函数不是么？)，这点是函数接口的核心应用方式，鄙人还需多加练习！
