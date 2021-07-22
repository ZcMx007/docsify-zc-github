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

## shiro

相比较spring-boot-starter-security而言比较困难，因为它需要两个类来实现spring-boot-starter-security一个配置类的效果，但是他的可定制化程度较高：

```ShiroConfig.java
package com.logic.config;

import at.pollux.thymeleaf.shiro.dialect.ShiroDialect;
import com.logic.pojo.Resources;
import com.logic.pojo.User;
import com.logic.service.impl.UserServiceImpl;
import com.logic.shiro.MyShiroRealm;
import org.apache.shiro.authc.credential.HashedCredentialsMatcher;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.spring.web.ShiroFilterFactoryBean;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Configuration
public class ShiroConfig {

	@Autowired(required = false)
	UserServiceImpl userService;

	/**
	 * ShiroDialect，为了在thymeleaf里使用shiro的标签的bean
	 * @return
	 */
	@Bean
	public ShiroDialect shiroDialect() {
		return new ShiroDialect();
	}

	/**
	 * ShiroFilterFactoryBean 处理拦截资源文件问题。
	 * 注意：单独一个ShiroFilterFactoryBean配置是或报错的，因为在
	 * 初始化ShiroFilterFactoryBean的时候需要注入：SecurityManager
	 *
	 Filter Chain定义说明
	 1、一个URL可以配置多个Filter，使用逗号分隔
	 2、当设置多个过滤器时，全部验证通过，才视为通过
	 3、部分过滤器可指定参数，如perms，roles
	 *
	 */
	@Bean
	public ShiroFilterFactoryBean shirFilter(@Qualifier("securityManager") SecurityManager securityManager){
		ShiroFilterFactoryBean shiroFilterFactoryBean  = new ShiroFilterFactoryBean();
		// 设置 SecurityManager
		shiroFilterFactoryBean.setSecurityManager(securityManager);
		shiroFilterFactoryBean.setLoginUrl("/login");
		shiroFilterFactoryBean.setSuccessUrl("/");
		//未授权界面;
		shiroFilterFactoryBean.setUnauthorizedUrl("/error");
		//拦截器.
		Map<String,String> filterChainDefinitionMap = new LinkedHashMap<String,String>();
		//<!-- 过滤链定义，从上向下顺序执行，一般将 /**放在最为下边 -->:这是一个坑呢，一不小心代码就不好使了;
		//配置退出 过滤器,其中的具体的退出代码Shiro已经替我们实现了
		filterChainDefinitionMap.put("/logout", "logout");
		//静态资源过滤 anon 表示任何人都可以访问
		filterChainDefinitionMap.put("/css/**","anon");
		filterChainDefinitionMap.put("/js/**","anon");
		filterChainDefinitionMap.put("/images/**","anon");
		filterChainDefinitionMap.put("/fonts/**","anon");
		filterChainDefinitionMap.put("/lib/**","anon");
		//druid只要有账号都可访问
		filterChainDefinitionMap.put("/druid/**","anon");
		//加载权限资源关系
		List<User> users = userService.queryAllUser();
		users.forEach(ele->{
			List<Resources> resources = ele.getResources();
			resources.forEach(res->{
				String permission = "perms[" + res.getResUrl()+"]";
				filterChainDefinitionMap.put(res.getResUrl(),permission);
			});
		});
		//<!-- authc:所有url都必须认证通过才可以访问; anon:所有url都都可以匿名访问-->
		filterChainDefinitionMap.put("/**", "authc");
		shiroFilterFactoryBean.setFilterChainDefinitionMap(filterChainDefinitionMap);
		return shiroFilterFactoryBean;
	}

	@Bean
	public SecurityManager securityManager(@Qualifier("myShiroRealm") MyShiroRealm myShiroRealm){
		DefaultWebSecurityManager securityManager =  new DefaultWebSecurityManager();
		//设置realm.
		securityManager.setRealm(myShiroRealm);
		return securityManager;
	}

	@Bean
	public MyShiroRealm myShiroRealm(){
		MyShiroRealm myShiroRealm = new MyShiroRealm();
		myShiroRealm.setCredentialsMatcher(hashedCredentialsMatcher());
		return myShiroRealm;
	}

	/**
	 * 凭证匹配器
	 * （由于我们的密码校验交给Shiro的SimpleAuthenticationInfo进行处理了
	 *  所以我们需要修改下doGetAuthenticationInfo中的代码;
	 * ）
	 * @return
	 */
	@Bean
	public HashedCredentialsMatcher hashedCredentialsMatcher(){
		HashedCredentialsMatcher hashedCredentialsMatcher = new HashedCredentialsMatcher();

		hashedCredentialsMatcher.setHashAlgorithmName("md5");//散列算法:这里使用MD5算法;
		hashedCredentialsMatcher.setHashIterations(2);//散列的次数，比如散列两次，相当于 md5(md5(""));

		return hashedCredentialsMatcher;
	}

}
```

```MyShiroRealm.java
package com.logic.shiro;

import com.logic.pojo.Resources;
import com.logic.pojo.User;
import com.logic.service.impl.UserServiceImpl;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.session.Session;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.ByteSource;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;

public class MyShiroRealm extends AuthorizingRealm {
	@Autowired
	private UserServiceImpl userService;

	//授权
	@Override
	protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principalCollection) {
		// SimpleAuthenticationInfo构造函数 user
		User user = (User)SecurityUtils.getSubject().getPrincipal();
		List<Resources> resources = userService.queryUserInfoById(user.getId()).getResources();
		// 权限信息对象info,用来存放查出的用户的所有的角色（role）及权限（permission）
		SimpleAuthorizationInfo info = new SimpleAuthorizationInfo();
		resources.forEach(ele->{
			info.addStringPermission(ele.getResUrl());
		});
		return info;
	}

	// 认证 可能会认证两次 第一次是切面认证 第二次才是调用认证 如果第一次通过 则不需要再认证 如果不通过则需要再走一遍认证将认证结果返回处理
	@Override
	protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
		//AOP切面认证会在进入/login接口请求前就进行认证 如果通过认证 则直接返回到successUrl 否则会再认证 等待/login接口请求后续的认证结果处理
		String username = (String)token.getPrincipal();
		User user = userService.queryUserByName(username);
		if (user == null) throw new UnknownAccountException();
		if (0==user.getEnable()) {
			throw new LockedAccountException(); // 帐号锁定
		}
		//加密密码交予shiro自己校验认证
		SimpleAuthenticationInfo authenticationInfo = new SimpleAuthenticationInfo(
				user, //用户
				user.getPassword(), //密码
				ByteSource.Util.bytes(username),
				getName()  //realm name
		);
		// 当验证都通过后，把用户信息放在shiro的session里
		Session session = SecurityUtils.getSubject().getSession();
		session.setAttribute("userSession", user);
		session.setAttribute("userSessionId", user.getId());
		List<String> resources = new ArrayList<>();
		user.getResources().forEach(ele->{
			resources.add(ele.getName());
		});
		session.setAttribute("resources", resources);
		return authenticationInfo;
	}
}

```

同时它还需要自定义校验方法，而且校验方法最好和登录返回界面接口同名，例如shiroFilterFactoryBean.setLoginUrl("/login");则校验接口也要是"/login"，但请求方式改成post即可，这样的话可以对错误信息即时的进行处理并显示

```LoginController.java
package com.logic.controller;

import com.logic.pojo.User;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.*;
import org.apache.shiro.subject.Subject;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpServletRequest;

@Controller
public class LoginController {
	// 不需要定义 springboot已经定义过/error路径了
	// @RequestMapping("error")
	// public String error() {
	// 	return "error";
	// }

	@GetMapping("login")
	public String login() {
		return "login";
	}

	@PostMapping("login")
	public String checkLogin(HttpServletRequest request, User user, Model model) {
		if (StringUtils.isEmpty(user.getUsername()) || StringUtils.isEmpty(user.getPassword())) {
			request.setAttribute("msg", "用户名或密码不能为空！");
			return "login";
		}
		Subject subject = SecurityUtils.getSubject();
		UsernamePasswordToken token=new UsernamePasswordToken(user.getUsername(),user.getPassword());
		try {
			subject.login(token);
			//重定向到首页 由于subject.login(token)会调用第二次的认证操作 如果第一次通过则直接跳转至successUrl了 不通过才会第二次认证
			// 获得认证结果调用处理 因此一定不会走到下一步，那就一定不会认证成功 不需要重定向到正确界面 此处只是为了返回值不报错
			// 因此如果想要直接一次认证即可 则可以使用subject.isAuthenticated()方法进行判断即可 但这样做的弊端是无法知道详细的登录认证出错环节
			return "redirect:/";
		} catch (LockedAccountException lae) {
			token.clear();
			request.setAttribute("msg", "用户已经被锁定不能登录，请与管理员联系！");
			return "login";
		} catch (UnknownAccountException e) {
			token.clear();
			request.setAttribute("msg", "用户不存在！");
			return "login";
		} catch (IncorrectCredentialsException e) {
			token.clear();
			request.setAttribute("msg", "密码不正确!");
			return "login";
		}
	}
}

```