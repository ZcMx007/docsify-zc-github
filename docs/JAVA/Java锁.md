# Java锁(synchronized锁和Lock锁)

## synchronized锁

synchronized是Java的一个关键字，它能够将代码块(方法)锁起来;锁的机制有两种：类锁、对象锁，类锁和对象锁互不影响，子父类对象锁也互不影响(准确来说是Java中每个对象都有一个内置锁(监视器,也可以理解成锁标记),只要对象不同，锁就可以互不影响，例如："hello"和"world"两个字符串对象的含有不同的内置锁，他们互不影响)

锁升级：又称为锁膨胀，只升不降！偏向锁(没有锁竞争,单线程)——>轻量锁/自旋锁(轻微锁竞争，没抢到的线程将自旋)——>重量级锁(自旋=空耗CPU,忙等，短时间忙等还是自旋，长时间忙等升级为重量级锁)

## 锁分类

### 公平锁和非公平锁

公平锁：公平锁会在JVM内部维护一个线程阻塞队列，线程会按照先到先得的队列顺序获得锁，非常公平，不能够插队。优点是每条线程任务都能保证被执行到；缺点是如果某个线程的执行时间较长的话，那其他线程将全部出于阻塞状态，用户体验不好，使用ReentrantLock有参构造（参数为Boolean fair），将参数传为true，就可以创建公平锁了。
非公平锁：非公平锁是指每次锁释放时允许所有的线程抢占锁，谁抢到就是谁的，可以插队。优点是将充分利用CPU处理线程，线程可以被随机执行，提高用户的体验度。缺点是可能会存在某些线程在超时时间内由于无法被处理（运气不好）而消亡。

公平锁耗资源，业务一般使用非公平锁。

### 可重入锁/递归锁

基本上所有的锁都是可重入锁，即当我们在某个锁方法A中调用另一个锁方法B时，由于锁的可重入性，因此调用锁方法A并且执行到调用锁方法B的指令处时会获取到锁方法B的锁(当然，前提是B的锁，没有被其他线程获得，否则就需要等待其他线程释放锁后才能由A调用B时获得锁B的锁，如果此时B方法同时也在等待A方法释放锁，那么A、B将相互等待，形成死锁),只有当A方法完全执行完成后才会释放A的锁。注意Synchronized和Lock在可重入锁上的区别，那就是Synchronized是隐形获得可重入锁，而Lock是显式的获得，因为lock和unlock必须成对出现，否则将无法释放锁。

### 自旋锁

当我们使用CPU的并发原语CAS(比较交换)进行线程并发控制时，我们会让符合期望值的线程执行操作，而让不符合期望值的线程重新获取期望值循环执行CAS操作，直到可以执行操作为止。循环执行的这组动作就称之为自旋锁的实现。

### 乐观锁和悲观锁

只要有“锁对象”出现，那么就一定是悲观锁，乐观锁本质不是锁，只是一个在循环里尝试CAS的算法。
悲观锁会阻塞事务，乐观锁却是回滚重试，它们各有优缺点，不要认为一种一定好于另一种。像乐观锁适用于比较动作少的业务场景，即冲突真的很少发生的时候，这样可以省去锁的开销，加大了系统的整个吞吐量。但如果经常产生冲突，上层应用会不断的进行重试，这样反倒是降低了性能，所以这种情况下用悲观锁就比较合适。Java里使用的各种锁，几乎全是悲观锁。

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
