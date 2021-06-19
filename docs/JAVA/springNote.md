# Spring NOTE

## SpringMVC 中的 <mvc:default-servlet-handler>标签的作用

这是为了符合RESTFUL开发的程序风格，为什么这样说呢，因为早期的请求一定会带有.do和.action 的后缀标识，这就需要在web.xml中进行请求分发的时候将后缀定义成指定的样式，例如*.do或*.action。但这样基本就能看出是使用的哪种控制层框架了，是SpringMVC 还是 Struts2.x，从某些层面上来说是极其不安全的。（因为Struts2.x有致命漏洞，哈哈！）所以，最好就让请求不携带后缀，这样才是完美的请求样式，即restful风格体现。于是乎，为了符合restful的开发风格，spring团队做了一件很牛批的事情，就是在web.xml中的dispatcherServlet的分发过滤中直接配置成"/",由于此时是过滤所有的客户端请求，为了与静态资源请求进行区分（静态资源请求会携带文件的后缀），因此又在spring-mvc.xml文件中配置配置了<mvc:default-servlet-handler>标签，（完整标签定义：<mvc:default-servlet-handler default-servlet-name="所使用的Web服务器默认使用的Servlet名称" />）它会在Spring MVC上下文中定义一个org.springframework.web.servlet.resource.DefaultServletHttpRequestHandler，它会像一个检查员，对进入DispatcherServlet的URL进行筛查，如果发现是静态资源的请求，就将该请求转由Web应用服务器默认的Servlet处理，如果不是静态资源的请求，才由DispatcherServlet继续处理。
关于更多的有关该标签的解释请详见：<https://www.cnblogs.com/dflmg/p/6393416.html>
