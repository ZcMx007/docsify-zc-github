# java安全

如何实现javaWeb项目的访问安全机制？通常的实现方法是通过拦截器和过滤器来实现，但这样的实现方式未免太过复杂，而且也很难对所有的安全问题做到面面俱到，因此，衍生出两种解决策略：分别是spring-boot-starter-security(spring-security与spring-boot的完美集成)和shiro(老资历的apache可定制化极高的框架)，两个框架都采用了先认证后授权的安全策略方式。

## spring-boot-starter-security

非常简单的安全策略框架，只需要导入maven依赖后，实现一个spring-boot配置类即可:
```MySecurityConfig.java
package com.logic.config;

import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

//继承自spring-boot-starter-security的网络安全适配器
@EnableWebSecurity
public class MySecurityConfig extends WebSecurityConfigurerAdapter {

	//授权
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.authorizeRequests()
				.antMatchers("/druid/**").permitAll()
				.antMatchers("/css/**").permitAll()
				.antMatchers("/js/**").permitAll()
				.antMatchers("/img/**").permitAll()
				.antMatchers("/jquery-ui-datepicker/**").permitAll()
				.antMatchers("/webfonts/**").permitAll()
				.antMatchers("/**").authenticated().antMatchers("/employee/**").hasRole("root")
				.and().formLogin().loginPage("/login")
				.usernameParameter("username").passwordParameter("password").loginProcessingUrl("/checkLogin")
				.failureUrl("/login?error=true")
				.defaultSuccessUrl("/index", true)
				// .and().rememberMe()
				.and().logout().logoutSuccessUrl("/login").invalidateHttpSession(true).clearAuthentication(true).permitAll()
				.and().csrf().disable();

	}

	//认证
	@Override
	protected void configure(AuthenticationManagerBuilder auth) throws Exception {
		auth.inMemoryAuthentication().passwordEncoder(new BCryptPasswordEncoder())
				.withUser("admin").password(new BCryptPasswordEncoder().encode("123456")).roles("root")
				.and().withUser("logic").password(new BCryptPasswordEncoder().encode("123456")).roles("guest");
	}
}
```

需要注意的是如果要设置跳转成功后的界面，则使用defaultSuccessUrl链式方法调用即可，或者使用successForwardUrl链式方法调用，但此种方式需要配合自定义的AuthenticationSuccessHandler使用，如果不定义的话，则使用security默认的"/"路径。
