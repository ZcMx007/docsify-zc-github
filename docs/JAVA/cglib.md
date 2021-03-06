# CGLIB(Code Generation Library)详解

本文章出处：csdn-danchu <https://blog.csdn.net/danchu/article/details/70238002>

## 什么是CGLIB

CGLIB是一个强大的、高性能的代码生成库。其被广泛应用于AOP框架（Spring、dynaop）中，用以提供方法拦截操作。Hibernate作为一个比较受欢迎的ORM框架，同样使用CGLIB来代理单端（多对一和一对一）关联（延迟提取集合使用的另一种机制）。CGLIB作为一个开源项目，其代码托管在github，地址为：https://github.com/cglib/cglib

## 为什么使用CGLIB

CGLIB代理主要通过对字节码的操作，为对象引入间接级别，以控制对象的访问。我们知道Java中有一个动态代理也是做这个事情的，那我们为什么不直接使用Java动态代理，而要使用CGLIB呢？答案是CGLIB相比于JDK动态代理**更加强大**，JDK动态代理虽然简单易用，但是其有一个致命缺陷是，**只能对接口进行代理**。如果要代理的类为一个普通类、没有接口，那么Java动态代理就没法使用了。关于Java动态代理，可以参者这里<a href="https://blog.csdn.net/danchu/article/details/70146985">Java动态代理分析</a>

## CGLIB组成结构

![CGLIB组成结构](images/2021-06-26-16-48-41.png)

CGLIB底层使用了ASM（一个短小精悍的字节码操作框架）来操作字节码生成新的类。除了CGLIB库外，脚本语言（如Groovy何BeanShell）也使用ASM生成字节码。ASM使用类似SAX的解析器来实现高性能。我们不鼓励直接使用ASM，因为它需要对Java字节码的格式足够的了解。

## 例子

说了这么多，可能大家还是不知道CGLIB是干什么用的。下面我们将使用一个简单的例子来演示如何使用CGLIB对一个方法进行拦截。首先，我们需要在工程的POM文件中引入cglib的dependency，这里我们使用的是2.2.2版本。

```pom.xml
<dependency>
    <groupId>cglib</groupId>
    <artifactId>cglib</artifactId>
    <version>2.2.2</version>
</dependency>
```

依赖包下载后，我们就可以干活了，按照国际惯例，写个hello world

```SampleClass.java
public class SampleClass {
    public void test(){
        System.out.println("hello world");
    }

    public static void main(String[] args) {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(SampleClass.class);
        enhancer.setCallback(new MethodInterceptor() {
            @Override
            public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable {
                System.out.println("before method run...");
                Object result = proxy.invokeSuper(obj, args);
                System.out.println("after method run...");
                return result;
            }
        });
        SampleClass sample = (SampleClass) enhancer.create();
        sample.test();
    }
}
```

在main函数中，我们通过一个Enhancer和一个MethodInterceptor来实现对方法的拦截，运行程序后输出为：

```console
before method run...
hello world
after method run...
```

在上面的程序中，我们引入了Enhancer和MethodInterceptor，可能有些读者还不太了解。别急，我们后面将会一一进行介绍。就目前而言，一个使用CGLIB的小demo就完成了。

## 常用的API

目前网络上对CGLIB的介绍资料比较少，造成对cglib的学习困难。这里我将对cglib中的常用类进行一个介绍。为了避免解释的不清楚，我将为每个类都配有一个demo，用来做进一步的说明。首先就从Enhancer开始吧。

### Enhancer

Enhancer可能是CGLIB中最常用的一个类，和Java1.3动态代理中引入的Proxy类差不多(如果对Proxy不懂，可以参考这里<a href="https://blog.csdn.net/danchu/article/details/70146985">Java动态代理分析</a>)。和Proxy不同的是，Enhancer既能够代理普通的class，也能够代理接口。Enhancer创建一个被代理对象的子类并且拦截所有的方法调用（包括从Object中继承的toString和hashCode方法）。Enhancer不能够拦截final方法，例如Object.getClass()方法，这是由于Java final方法语义决定的。基于同样的道理，Enhancer也不能对final类进行代理操作。这也是Hibernate为什么不能持久化final class的原因。(个人测试有所出入：还有hashCode方法没有被拦截到[并且报错了]，hashCode方法使用了native修饰符进行修饰，标明这调用的是java的本地接口)

```javaTest(junit4)
@Test
	public void testFixedValue() {
		Enhancer enhancer = new Enhancer();
		enhancer.setSuperclass(SampleClass.class);
		enhancer.setCallback(new FixedValue() {
			public Object loadObject() throws Exception {
				return "hello cglib";
			}
		});
		SampleClass sampleClass = (SampleClass) enhancer.create();
		System.out.println(sampleClass.test("null")); //拦截test，输出Hello cglib
		System.out.println(sampleClass.toString());
		System.out.println(sampleClass.getClass());
		System.out.println(sampleClass.hashCode());
	}
```

程序的输出为：

```console
Hello cglib
Hello cglib
class com.zeus.cglib.SampleClass$$EnhancerByCGLIB$$e3ea9b7

java.lang.ClassCastException: java.lang.String cannot be cast to java.lang.Number

    at com.zeus.cglib.SampleClass$$EnhancerByCGLIB$$e3ea9b7.hashCode(<generated>)
    ...
```

上述代码中，FixedValue用来对所有拦截的方法返回相同的值，从输出我们可以看出来，Enhancer对非final方法test()、toString()、hashCode()进行了拦截，没有对getClass进行拦截。由于hashCode()方法需要返回一个Number，但是我们返回的是一个String，这解释了上面的程序中为什么会抛出异常。(个人测试发现并没有对hashCode方法进行拦截，得出结论：所有被final和native修饰符修饰的方法都不能被FixedValue方法拦截！)

Enhancer.setSuperclass用来设置父类型，从toString方法可以看出，使用CGLIB生成的类为被代理类的一个子类，Enhancer.create(Object…)方法是用来创建增强对象的，其提供了很多不同参数的方法用来匹配被增强类的不同构造方法。（虽然类的构造方法只是Java字节码层面的函数，但是Enhancer却不能对其进行操作。Enhancer同样不能操作static或者final类）。我们也可以先使用Enhancer.createClass()来创建字节码(.class)，然后用字节码动态的生成增强后的对象。

可以使用一个InvocationHandler(如果对InvocationHandler不懂，可以参考这里<a href="https://blog.csdn.net/danchu/article/details/70146985">Java动态代理分析</a>)作为回调，使用invoke方法来替换直接访问类的方法，但是你必须注意死循环。因为invoke中调用的任何原代理类方法，均会重新代理到invoke方法中。

```javaTest(junit4)
@Test
public void testInvocationHandler() throws Exception{
    Enhancer enhancer = new Enhancer();
    enhancer.setSuperclass(SampleClass.class);
    enhancer.setCallback(new InvocationHandler() {
        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            if(method.getDeclaringClass() != Object.class && method.getReturnType() == String.class){
                return "hello cglib";
            }else{
                throw new RuntimeException("Do not know what to do");
            }
        }
    });
    SampleClass proxy = (SampleClass) enhancer.create();
    Assert.assertEquals("hello cglib", proxy.test(null));
    Assert.assertNotEquals("Hello cglib", proxy.toString());
}
```

```console
java.lang.RuntimeException: Do not know what to do
```

为了避免这种死循环，我们可以使用MethodInterceptor，MethodInterceptor的例子在前面的hello world中已经介绍过了，这里就不浪费时间了。

有些时候我们可能只想对特定的方法进行拦截，对其他的方法直接放行，不做任何操作，使用Enhancer处理这种需求同样很简单,只需要一个CallbackFilter即可：

```javaTest(junit4)
@Test
public void testCallbackFilter() throws Exception{
    Enhancer enhancer = new Enhancer();
    CallbackHelper callbackHelper = new CallbackHelper(SampleClass.class, new Class[0]) {
        @Override
        protected Object getCallback(Method method) {
            if(method.getDeclaringClass() != Object.class && method.getReturnType() == String.class){
                return new FixedValue() {
                    @Override
                    public Object loadObject() throws Exception {
                        return "Hello cglib";
                    }
                };
            }else{
                return NoOp.INSTANCE;
            }
        }
    };
    enhancer.setSuperclass(SampleClass.class);
    enhancer.setCallbackFilter(callbackHelper);
    enhancer.setCallbacks(callbackHelper.getCallbacks());
    SampleClass proxy = (SampleClass) enhancer.create();
    Assert.assertEquals("Hello cglib", proxy.test(null));
    Assert.assertNotEquals("Hello cglib",proxy.toString());
    System.out.println(proxy.hashCode());
}

```console
124313277
```

控制台输出的是hashCode码，上述的两个声明都符合声明预期

### ImmutableBean

通过名字就可以知道，不可变的Bean。ImmutableBean允许创建一个原来对象的包装类，这个包装类是不可变的，任何改变底层对象的包装类操作都会抛出IllegalStateException。但是我们可以通过直接操作底层对象来改变包装类对象。这有点类似于Guava中的不可变视图

为了对ImmutableBean进行测试，这里需要再引入一个bean：

```SampleBean.class
public class SampleBean {
	private String value;

	public SampleBean() {
	}

	public SampleBean(String value) {
		this.value = value;
	}
	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}
}
```

然后编写测试类如下：

```java(junit4 Test)
@Test
public void testImmutableBean() {
	SampleBean sampleBean = new SampleBean();
	sampleBean.setValue("Hello world");
	SampleBean immutableBean = (SampleBean) ImmutableBean.create(sampleBean); //创建不可变类
	Assert.assertEquals("Hello world",immutableBean.getValue());
	sampleBean.setValue("Hello world, again"); //可以通过底层对象来进行修改
	Assert.assertEquals("Hello world, again", immutableBean.getValue());
	immutableBean.setValue("hello"); //直接修改将throw exception
}
```

运行结果：

```console
java.lang.IllegalStateException: Bean is immutable
```

### Bean generator

cglib提供的一个操作bean的工具，使用它能够在运行时动态的创建一个bean。

```java(junit4 Test)
@Test
public void testBeanGenerator() throws Exception{
    BeanGenerator beanGenerator = new BeanGenerator();
    beanGenerator.addProperty("value",String.class);
    Object myBean = beanGenerator.create();
    Method setter = myBean.getClass().getMethod("setValue",String.class);
    setter.invoke(myBean,"Hello cglib");

    Method getter = myBean.getClass().getMethod("getValue");
    Assert.assertEquals("Hello cglib",getter.invoke(myBean));
}
```

在上面的代码中，我们使用cglib动态的创建了一个和SampleBean相同的Bean对象，包含一个属性value以及getter、setter方法。

### Bean Copier

cglib提供的能够从一个bean复制到另一个bean中，而且其还提供了一个转换器，用来在转换的时候对bean的属性进行操作。

```java(junit4 Test)
@Test
public void testBeanCopier() throws Exception{
	BeanCopier copier = BeanCopier.create(SampleBean.class, OtherSampleBean.class, false);//设置为true，则使用converter
	SampleBean myBean = new SampleBean();
	myBean.setValue("Hello cglib");
	OtherSampleBean otherBean = new OtherSampleBean();
	copier.copy(myBean, otherBean, null); //设置为true，则传入converter指明怎么进行转换
	Assert.assertEquals("Hello cglib", otherBean.getValue());
}
```

### BulkBean

相比于BeanCopier，BulkBean将copy的动作拆分为getPropertyValues和setPropertyValues两个方法，允许自定义处理属性 主要特点 实时复制修改

```java(junit4 Test)
@Test
public void testBulkBean() throws Exception{
	BulkBean bulkBean = BulkBean.create(SampleBean.class,
			new String[]{"getValue"},
			new String[]{"setValue"},
			new Class[]{String.class});
	SampleBean bean = new SampleBean();
	bean.setValue("Hello world");
	Assert.assertEquals(1, bulkBean.getPropertyValues(bean).length);
	Assert.assertEquals("Hello world", bulkBean.getPropertyValues(bean)[0]);
	bulkBean.setPropertyValues(bean,new Object[]{"Hello cglib"});
	Assert.assertEquals("Hello cglib", bean.getValue());
}
```

使用注意：

- 1、 避免每次进行BulkBean.create创建对象，一般将其声明为static的
- 2、 应用场景：针对特定属性的get,set操作，一般适用通过xml配置注入和注出的属性，运行时才确定处理的Source,Target类，只需要关注属性名即可。

### BeanMap

BeanMap类实现了Java Map，将一个bean对象中的所有属性转换为一个String-to-Obejct的Java Map

```java(junit4 Test)
@Test
public void testBeanMap() throws Exception{
    BeanGenerator generator = new BeanGenerator();
    generator.addProperty("username",String.class);
    generator.addProperty("password",String.class);
    Object bean = generator.create();
    Method setUserName = bean.getClass().getMethod("setUsername", String.class);
    Method setPassword = bean.getClass().getMethod("setPassword", String.class);
    setUserName.invoke(bean, "admin");
    setPassword.invoke(bean,"password");
    BeanMap map = BeanMap.create(bean);
    Assert.assertEquals("admin", map.get("username"));
    Assert.assertEquals("password", map.get("password"));
}
```

我们使用BeanGenerator生成了一个含有两个属性的Java Bean，对其进行赋值操作后，生成了一个BeanMap对象，通过获取值来进行验证

### keyFactory

keyFactory类用来动态生成接口的实例，接口需要**只包含**一个newInstance方法，返回一个Object。keyFactory为构造出来的实例动态生成了Object.equals和Object.hashCode方法，能够确保相同的参数构造出的实例为单例的。

```SampleKeyFactory.interface
public interface SampleKeyFactory {
    Object newInstance(String first, int second);
}
```

我们首先构造一个满足条件的接口，然后进行测试

```java(junit4 Test)
@Test
public void testKeyFactory() throws Exception{
    SampleKeyFactory keyFactory = (SampleKeyFactory) KeyFactory.create(SampleKeyFactory.class);
    Object key = keyFactory.newInstance("foo", 42);
    Object key1 = keyFactory.newInstance("foo", 42);
    Assert.assertEquals(key,key1);//测试参数相同，结果是否相等
}
```

### Mixin(混合)

Mixin能够让我们将多个对象整合到一个对象中去，前提是这些对象必须是接口的实现。可能这样说比较晦涩，以代码为例：

```MixinInterfaceTest.java
public class MixinInterfaceTest {
    interface Interface1{
        String first();
    }
    interface Interface2{
        String second();
    }

    class Class1 implements Interface1{
        @Override
        public String first() {
            return "first";
        }
    }

    class Class2 implements Interface2{
        @Override
        public String second() {
            return "second";
        }
    }

    interface MixinInterface extends Interface1, Interface2{

    }

    @Test
    public void testMixin() throws Exception{
        Mixin mixin = Mixin.create(new Class[]{Interface1.class, Interface2.class,
                        MixinInterface.class}, new Object[]{new Class1(),new Class2()});
        MixinInterface mixinDelegate = (MixinInterface) mixin;
        Assert.assertEquals("first", mixinDelegate.first());
        Assert.assertEquals("second", mixinDelegate.second());
    }
}
```

Mixin类比较尴尬，因为他要求Minix的类（例如MixinInterface）实现一些接口。既然被Minix的类已经实现了相应的接口，那么我就直接可以通过纯Java的方式实现，没有必要使用Minix类。

## String switcher

用来模拟一个String到int类型的Map类型。如果在Java7以后的版本中，类似一个switch语句。

```java(junit4 Test)
@Test
public void testStringSwitcher() throws Exception{
    String[] strings = new String[]{"one", "two"};
    int[] values = new int[]{10,20};
    StringSwitcher stringSwitcher = StringSwitcher.create(strings,values,true);
    Assert.assertEquals(10, stringSwitcher.intValue("one"));
    Assert.assertEquals(20, stringSwitcher.intValue("two"));
    Assert.assertEquals(-1, stringSwitcher.intValue("three"));
}
```

### Interface Maker

正如名字所言，Interface Maker用来创建一个新的Interface

```java(junit4 Test)
@Test
public void testInterfaceMarker() throws Exception{
    Signature signature = new Signature("foo", Type.DOUBLE_TYPE, new Type[]{Type.INT_TYPE});
    InterfaceMaker interfaceMaker = new InterfaceMaker();
    interfaceMaker.add(signature, new Type[0]);
    Class iface = interfaceMaker.create();
    Assert.assertEquals(1, iface.getMethods().length);
    Assert.assertEquals("foo", iface.getMethods()[0].getName());
    Assert.assertEquals(double.class, iface.getMethods()[0].getReturnType());
}
```

上述的Interface Maker创建的接口中只含有一个方法，签名为double foo(int)。Interface Maker与上面介绍的其他类不同，它依赖ASM中的Type类型。由于接口仅仅只用做在编译时期进行类型检查，因此在一个运行的应用中动态的创建接口没有什么作用。但是InterfaceMaker可以用来自动生成代码，为以后的开发做准备。

### Method delegate

MethodDelegate主要用来对方法进行代理

```java(junit4 Test)
interface BeanDelegate{
    String getValueFromDelegate();
}

@Test
public void testMethodDelegate()  throws Exception{
    SampleBean bean = new SampleBean();
    bean.setValue("Hello cglib");
    BeanDelegate delegate = (BeanDelegate) MethodDelegate.create(bean,"getValue", BeanDelegate.class);
    Assert.assertEquals("Hello cglib", delegate.getValueFromDelegate());
}
```

关于Method.create的参数说明：

1. 第二个参数为即将被代理的方法
2. 第一个参数必须是一个无参数构造的bean。因此MethodDelegate.create并不是你想象的那么有用
3. 第三个参数为只含有一个方法的接口。当这个接口中的方法被调用的时候，将会调用第一个参数所指向bean的第二个参数方法

缺点：

1. 为每一个代理类创建了一个新的类，这样可能会占用大量的永久代堆内存
2. 你不能代理需要参数的方法
3. 如果你定义的接口中的方法需要参数，那么代理将不会工作，并且也不会抛出异常；如果你的接口中方法需要其他的返回类型，那么将抛出IllegalArgumentException

### MulticastDelegate

1. 多重代理和方法代理差不多，都是将代理类方法的调用委托给被代理类。使用前提是需要一个接口，以及一个类实现了该接口
2. 通过这种interface的继承关系，我们能够将接口上方法的调用分散给各个实现类上面去。
3. 多重代理的缺点是接口只能含有一个方法，如果被代理的方法拥有返回值，那么调用代理类的返回值为最后一个添加的被代理类的方法返回值

```java(junit4 Test)
public interface DelegatationProvider {
		void setValue(String value);
	}

	public class SimpleMulticastBean implements DelegatationProvider {
		private String value;
		public void setValue(String value) {
			this.value = value;
		}

		public String getValue() {
			return value;
		}
	}

	public class SimpleMulticastBean2 implements DelegatationProvider {
		private String value;
		public void setValue(String value) {
			this.value = value + "copy";
		}

		public String getValue() {
			return value;
		}
	}

	@Test
	public void testMulticastDelegate() throws Exception{
		MulticastDelegate multicastDelegate = MulticastDelegate.create(DelegatationProvider.class);
		SimpleMulticastBean first = new SimpleMulticastBean();
		SimpleMulticastBean2 second = new SimpleMulticastBean2();
		multicastDelegate = multicastDelegate.add(first);
		multicastDelegate  = multicastDelegate.add(second);

		DelegatationProvider provider = (DelegatationProvider) multicastDelegate;
		provider.setValue("Hello world");

		Assert.assertEquals("Hello world", first.getValue());
		Assert.assertEquals("Hello worldcopy", second.getValue());
	}
```

### Constructor delegate

为了对构造函数进行代理，我们需要一个接口，这个接口只含有一个Object newInstance(…)方法，用来调用相应的构造函数

```java(junit4 Test)
interface SampleBeanConstructorDelegate {
		Object newInstance(String value);
	}

	/**
	 * 对构造函数进行代理
	 *
	 * @throws Exception
	 */
	@Test
	public void testConstructorDelegate() throws Exception {
		SampleBeanConstructorDelegate constructorDelegate = (SampleBeanConstructorDelegate) ConstructorDelegate.create(
				SampleBean.class, SampleBeanConstructorDelegate.class);//第一个参数是被代理的类 第二个参数是代理所需要使用的接口类 接口中只能包含一个newInstance方法 用来调用相应的构造函数
		SampleBean bean = (SampleBean) constructorDelegate.newInstance("Hello world");
		Assert.assertTrue(SampleBean.class.isAssignableFrom(bean.getClass()));
		System.out.println(bean.getValue());
	}
```

### Parallel Sorter(并行排序器)

能够对多个数组同时进行排序，目前实现的算法有归并排序和快速排序

```java(junit4 Test)
@Test
	public void testParallelSorter() throws Exception{
		Integer[][] value = {
				{4, 3, 9, 0},
				{2, 1, 6, 0}
		};
		ParallelSorter.create(value).mergeSort(1);
		for(Integer[] row : value){
			int former = -1;
			for(int val : row){
				Assert.assertTrue(former < val);
				former = val;
			}
		}
		System.out.println(value);
	}
```

### FastClass

顾明思义，FastClass就是对Class对象进行特定的处理，比如通过数组保存method引用，因此FastClass引出了一个index下标的新概念，比如getIndex(String name, Class[] parameterTypes)就是以前的获取method的方法。通过数组存储method,constructor等class信息，从而将原先的反射调用，转化为class.index的直接调用，从而体现所谓的FastClass。

```java(junit4 Test)
@Test
	public void testFastClass() throws Exception{
		FastClass fastClass = FastClass.create(SampleBean.class);
		FastMethod fastMethod = fastClass.getMethod("getValue",new Class[0]);
		SampleBean bean = new SampleBean();
		bean.setValue("Hello world");
		Assert.assertEquals("Hello world",fastMethod.invoke(bean, new Object[0]));
	}
```

## 注意

由于CGLIB的大部分类是直接对Java字节码进行操作，这样生成的类会在Java的永久堆中。如果动态代理操作过多，容易造成永久堆满，触发OutOfMemory异常。

## CGLIB和Java动态代理的区别

1. Java动态代理只能够对接口进行代理，不能对普通的类进行代理（因为所有生成的代理类的父类为Proxy，Java类继承机制不允许多重继承）；CGLIB能够代理普通类；
2. Java动态代理使用Java原生的反射API进行操作，在生成类上比较高效；CGLIB使用ASM框架直接对字节码进行操作，在类的执行过程中比较高效
