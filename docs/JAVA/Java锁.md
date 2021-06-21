# Java锁(synchronized锁和Lock锁)

## synchronized锁

synchronized是Java的一个关键字，它能够将代码块(方法)锁起来;锁的机制有两种：类锁、对象锁，类锁和对象锁互不影响，子父类对象锁也互不影响(准确来说是Java中每个对象都有一个内置锁(监视器,也可以理解成锁标记),只要对象不同，锁就可以互不影响，例如："hello"和"world"两个字符串对象的含有不同的内置锁，他们互不影响)

可重入锁，又称之为递归锁，即允许同一个线程多次获取同一把锁，这样锁方法可以递归调用锁方法，而不会阻塞自己。常用于递归调用或者需要同一把锁的多层次业务场景。

锁升级：又称为锁膨胀，只升不降！偏向锁(没有锁竞争,单线程)——>轻量锁/自旋锁(轻微锁竞争，没抢到的线程将自旋)——>重量级锁(自旋=空耗CPU,忙等，短时间忙等还是自旋，长时间忙等升级为重量级锁)

公平锁耗资源，业务一般使用非公平锁。

悲观锁阻塞事务，乐观锁回滚重试，它们各有优缺点，不要认为一种一定好于另一种。像乐观锁适用于写比较少的情况下，即冲突真的很少发生的时候，这样可以省去锁的开销，加大了系统的整个吞吐量。但如果经常产生冲突，上层应用会不断的进行重试，这样反倒是降低了性能，所以这种情况下用悲观锁就比较合适。Java里使用的各种锁，几乎全都是悲观锁。其实只要有“锁对象”出现，那么就一定是悲观锁，乐观锁不是锁，只是一个在循环里尝试CAS的算法。

## 代码粗略演示

```TestSynchronized.java
public class TestSynchronized extends TestSynchronizedSuper{
	//synchronized修饰非静态方法 锁:调用该方法的对象 对象锁
	@Override
	public synchronized void function() throws InterruptedException {
		//锁中锁 两层锁 第一层是调用该方法的对象 第二层是调用该方法对象的父类对象(构造方法) 锁内部的程序是顺序执行的 内锁依托于外锁存在
		super.function();
		//一层锁 锁对象是调用该方法的对象
		for (int i = 0; i <3; i++) {
			Thread.sleep(1000);
			System.out.println(Thread.currentThread().getName()+"function running...");
		}
	}

	//synchronized修饰非静态方法 锁:调用该方法的对象 对象锁
	public synchronized void function2() throws InterruptedException {
		for (int i = 0; i <3; i++) {
			Thread.sleep(1000);
			System.out.println(Thread.currentThread().getName()+"function running...");
		}
	}

	//synchronized修饰非静态方法 锁:字节码文件对象 类锁
	public static synchronized void function3() throws InterruptedException {
		for (int i = 0; i <3; i++) {
			Thread.sleep(1000);
			System.out.println(Thread.currentThread().getName()+"function running...");
		}
	}

	//synchronized修饰代码块 锁:调用该方法的对象 对象锁
	public void function4() throws InterruptedException {
		synchronized (this) {
			for (int i = 0; i <3; i++) {
				Thread.sleep(1000);
				System.out.println(Thread.currentThread().getName()+"function running...");
			}
		}
	}

	//synchronized修饰代码块 锁:"hello"对象 对象锁
	public void function5() throws InterruptedException {
		synchronized ("hello") {
			for (int i = 0; i <3; i++) {
				Thread.sleep(1000);
				System.out.println(Thread.currentThread().getName()+"function running...");
			}
		}
	}

	//synchronized修饰代码块 锁:"hello"对象 对象锁
	public void function6() throws InterruptedException {
		synchronized ("hello") {
			for (int i = 0; i <3; i++) {
				Thread.sleep(1000);
				System.out.println(Thread.currentThread().getName()+"function running...");
			}
		}
	}

	//synchronized修饰代码块 锁:"world"对象 对象锁
	public void function7() throws InterruptedException {
		synchronized ("world") {
			for (int i = 0; i <3; i++) {
				Thread.sleep(1000);
				System.out.println(Thread.currentThread().getName()+"function running...");
			}
		}
	}

	public static void main(String[] args) {
		final TestSynchronized testSynchronized = new TestSynchronized();
		new Thread(() -> {
			try {
				testSynchronized.function();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}, "线程一").start();
		new Thread(() -> {
			try {
				testSynchronized.function2();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}, "线程二").start();
		new Thread(() -> {
			try {
				testSynchronized.function3();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}, "线程三").start();
		new Thread(() -> {
			try {
				testSynchronized.function4();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}, "线程四").start();
		new Thread(() -> {
			try {
				testSynchronized.function5();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}, "线程五(hello)").start();
		new Thread(() -> {
			try {
				testSynchronized.function6();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}, "线程六(hello)").start();
		new Thread(() -> {
			try {
				testSynchronized.function7();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}, "线程七(world)").start();
		new Thread(() -> {
			try {
				(new TestSynchronizedSuper()).function();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}, "线程八(父类对象)").start();
	}
}
```

```TestSynchronizedSuper.java
public class TestSynchronizedSuper {
	// synchronized修饰的父类非静态方法
	public synchronized void function() throws InterruptedException {
		for (int i = 0; i <3; i++) {
			Thread.sleep(1000);
			System.out.println(Thread.currentThread().getName()+"父类function running...");
		}
	}
}
```

```console
线程三function running...
线程一父类function running...
线程七(world)function running...
线程五(hello)function running...
线程八(父类)父类function running...
线程一父类function running...
线程三function running...
线程五(hello)function running...
线程七(world)function running...
线程八(父类)父类function running...
线程三function running...
线程一父类function running...
线程五(hello)function running...
线程七(world)function running...
线程八(父类)父类function running...
线程一function running...
线程六(hello)function running...
线程一function running...
线程六(hello)function running...
线程一function running...
线程六(hello)function running...
线程四function running...
线程四function running...
线程四function running...
线程二function running...
线程二function running...
线程二function running...

Process finished with exit code 0
```
