# SpringBoot

## 定义

自动装配的spring集成框架

## 理解spring boot项目的自动装配

参考文档：CSDN-敲木鱼的小和尚：<https://blog.csdn.net/qq_26389415/article/details/102691326>

## @EnableWebMvc

在springboot中，若想要自定义配置webMVC，则需要创建一个自定义类实现WebMvcConfigurer接口，使用@Configuration注解注明该类是一个配置类后，覆写接口中的方法即可实现自定义配置的操作。但是一定不能在此基础上使用@EnableWebMvc注解，为什么呢？点开该注解，可以发现这是一个复合注解，其中包含@Import(DelegatingWebMvcConfiguration.class)[很明显，最重要的就是它]，点开该类，发现该类extends WebMvcConfigurationSupport。通过它的注释描述：“This is the main class providing the configuration behind the MVC Java config.”，说明web MVC的配置是基于该类的[并且该类还是主类，其中有着很多完善的方法，web MVC将基于它进行配置]，打开WebMvcAutoConfiguration类，发现@ConditionalOnMissingBean(WebMvcConfigurationSupport.class)注解，该注解的含义是只有在不存在WebMvcConfigurationSupport类的实例时才会进行web mvc的自动配置，如果在上述的自定义类中使用了该注解，则说明我们接管了springboot中原有的webmvc的自动配置。说的再详细些，那就是spring的web MVC中的自动配置中也使用到了WebMvcConfigurationSupport类进行自动配置操作，具体位置在WebMvcAutoConfiguration->WebMvcAutoConfigurationAdapter->messageConvertersProvider->getDefaultConverters->converters.addAll(new WebMvcConfigurationSupport(){...}),因此如果springboot不在注解中限制条件的话，那么springboot在加载时Http就会因为存在两个相同的配置操作类(WebMvcConfigurationSupport)的实例而产生冲突。那可不可以，就使用@EnableWebMvc，替换springboot的自动配置呢？当然是可以的，但是需要做很多原本在springboot中做好的配置处理操作，否则将会出现很多问题，甚至无法启动springboot[例如自定义国际化操作时会出现 The bean 'localeResolver'  has already been defined的错误导致无法启动springboot]，这是比较麻烦的，因此不建议替换，建议不加该注解进而变为对springboot中的webmvc的配置的拓展即可。
